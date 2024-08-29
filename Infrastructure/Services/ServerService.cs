using Application.Models.API;
using Application.Models.Settings;
using Common;
using Common.Utilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Text;

namespace Infrastructure.Services
{
    public class ServerService(OSRSWikiHttpClient osrsWikiHttpClient, IOptions<OsrsWikiValues> optionsOsrsWiki, ILogger<ServerService> logger)
    {
        public event Action? OnDataUpdated;
        public DateTime? LastUpdate;

        private readonly SemaphoreSlim _semaphore = new(1, 1);
        private MappingModel[]? _mappingResponse;
        private Dictionary<string, string>? _volumeResponse;
        private LatestModel? _latestResponse;
        private ConcurrentDictionary<int, ItemModel> _items = [];
        private ConcurrentDictionary<string, int> _itemsNameMap = [];

        /// <summary>
        /// Gets and combines data for latest items
        /// </summary>
        public async Task<ConcurrentDictionary<int, ItemModel>> GetLatestItemsAsync()
        {
            await _semaphore.WaitAsync();

            try
            {
                if (_mappingResponse is null or [])
                    await GetMappingAsync();

                if (_volumeResponse is null)
                    await GetVolumeAsync();

                await GetLatestAsync();
                CombineItemsData();
                OnDataUpdated?.Invoke();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to get latest items data");
            }
            finally
            {
                _semaphore.Release();
            }

            return _items;
        }

        /// <summary>
        /// Gets cached items
        /// </summary>
        public ConcurrentDictionary<int, ItemModel> GetCachedItems() =>
            _items;

        /// <summary>
        /// Gets item by Id from cached items
        /// </summary>
        public ItemModel? GetCachedItem(int id) =>
            _items.TryGetValue(id, out ItemModel? item) ? item : null;

        /// <summary>
        /// Gets item by Name from cached items
        /// </summary>
        public ItemModel? GetCachedItem(string name) =>
            _items.TryGetValue(_itemsNameMap.GetValueOrDefault(name), out ItemModel? item) ? item : null;

        /// <summary>
        /// Gets and caches items mapping data
        /// </summary>
        public async Task<bool> GetMappingAsync()
        {
            MappingModel[]? mappingResponse = await osrsWikiHttpClient.GetAsync<MappingModel[]>(
                StringUtility.BuildUri(optionsOsrsWiki.Value.OSRSPricesWikiBaseUri, optionsOsrsWiki.Value.Mapping));

            if (mappingResponse is null or [])
                return false;

            _mappingResponse = mappingResponse;
            return true;
        }

        /// <summary>
        /// Gets and caches items volume data
        /// </summary>
        public async Task<bool> GetVolumeAsync()
        {
            Dictionary<string, string>? volumeResponse = await osrsWikiHttpClient.GetAsync<Dictionary<string, string>>(
                StringUtility.BuildUri(optionsOsrsWiki.Value.OldschoolWikiBaseUri, optionsOsrsWiki.Value.Volume));

            if (volumeResponse is null)
                return false;

            _volumeResponse = volumeResponse;
            return true;
        }

        /// <summary>
        /// Gets timeseries of item prices and volume based on timestep and item Id
        /// </summary>
        public async Task<TimeSeriesModel?> GetTimeseriesAsync(string timestep, int id) =>
            await osrsWikiHttpClient.GetAsync<TimeSeriesModel>(StringUtility.BuildUri(
                optionsOsrsWiki.Value.OSRSPricesWikiBaseUri, optionsOsrsWiki.Value.Timeseries, timestep, id.ToString()));

        /// <summary>
        /// Generates sitemap.txt file with all pages
        /// </summary>
        public async Task GenerateSitemapAsync()
        {
            while (_items.Count == 0)
                await Task.Delay(1000);

            StringBuilder sitemapContent = new();
            sitemapContent.AppendLine("https://osrsprices.wiki");
            sitemapContent.AppendLine("https://osrsprices.wiki/contact");

            foreach (ItemModel item in _items.Values)
                sitemapContent.AppendLine(StringUtility.BuildUri("https://osrsprices.wiki/", StringUtility.BuildUri(item.Id.ToString(), item.Name, '-')));

            string basePath = StringUtility.GetOSPlatform() switch
            {
                nameof(OSPlatform.Linux) => "/var/www/osrspriceswiki/wwwroot",
                nameof(OSPlatform.Windows) => Path.GetFullPath("wwwroot"),
                _ => throw new PlatformNotSupportedException()
            };

            await File.WriteAllTextAsync(Path.Combine(basePath, "sitemap.txt"), sitemapContent.ToString());
        }

        /// <summary>
        /// Gets and caches items latest data and updates last update datetime
        /// </summary>
        private async Task<bool> GetLatestAsync()
        {
            LatestModel? latestResponse = await osrsWikiHttpClient.GetAsync<LatestModel>(
                StringUtility.BuildUri(optionsOsrsWiki.Value.OSRSPricesWikiBaseUri, optionsOsrsWiki.Value.Latest));

            if (latestResponse is null)
                return false;

            _latestResponse = latestResponse;
            LastUpdate = DateTime.Now;
            return true;
        }

        /// <summary>
        /// Combines all data into items dictionary
        /// </summary>
        private bool CombineItemsData()
        {
            if (_mappingResponse is null or [] || _latestResponse?.Data is null || _volumeResponse is null)
                return false;

            _items = [];
            _itemsNameMap = [];

            foreach (MappingModel mapping in _mappingResponse)
            {
                if (string.IsNullOrWhiteSpace(mapping.Name))
                    continue;

                _latestResponse.Data.TryGetValue(mapping.Id.ToString(), out LatestData? latest);

                if (latest?.High is null || latest?.Low is null)
                    continue;

                _volumeResponse.TryGetValue(mapping.Name ?? "", out string? volumeString);
                _ = int.TryParse(volumeString, out int volume);

                ItemModel item = new()
                {
                    Id = mapping.Id,
                    Icon = StringUtility.BuildUri(optionsOsrsWiki.Value.OldschoolWikiIconsBaseUri, $"{mapping.Icon}?7263b", '_'),
                    Name = mapping.Name,
                    Examine = mapping.Examine,
                    InstaBuy = latest?.High ?? int.MinValue,
                    InstaSell = latest?.Low ?? int.MinValue,
                    HighTime = latest?.HighTime ?? 0,
                    LowTime = latest?.LowTime ?? 0,
                    InstaBuyTime = (long)(DateTime.Now - DateTimeOffset.FromUnixTimeSeconds(latest?.HighTime ?? 0).LocalDateTime).TotalSeconds,
                    InstaSellTime = (long)(DateTime.Now - DateTimeOffset.FromUnixTimeSeconds(latest?.LowTime ?? 0).LocalDateTime).TotalSeconds,
                    Volume = volume,
                    Limit = mapping.Limit,
                    Value = mapping.Value,
                    HighAlch = mapping.HighAlch,
                    LowAlch = mapping.LowAlch,
                    Accessibility = mapping.Members ? Accessibility.Members : Accessibility.FreeToPlay,
                };

                item.Tax = item.InstaBuy >= 100 ? Math.Min((int)item.InstaBuy / 100, 5000000) : 0;
                item.Margin = item.InstaBuy - item.InstaSell - item.Tax;
                item.MarginXLimit = item.Margin * item.Limit;
                item.MarginXVolume = item.Margin * volume;
                item.RoiPercentage = Math.Round(item.InstaSell != 0 ? (float)item.Margin / item.InstaSell * 100 : 0, 2);

                _items[item.Id] = item;
                _itemsNameMap[item.Name!] = item.Id;
            }

            return true;
        }
    }
}
