using Application.Models;
using Application.Utilities;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services
{
    public class ClientService(BaseHttpClient httpClient, IOptions<OsrsWikiValues> optionsOsrsWiki)
    {
        private MappingModel[]? _mappingResponse;
        private Dictionary<string, string>? _volumeResponse;
        private LatestModel? _latestResponse;
        private List<ItemModel> _items = [];

        public async Task<List<ItemModel>> GetItems()
        {
            if (_mappingResponse is null or [])
                await GetMappingAsync();

            if (_volumeResponse is null)
                await GetVolumeAsync();

            await GetLatestAsync();

            CombineItemsData();

            return _items;
        }

        private async Task<bool> GetMappingAsync()
        {
            MappingModel[]? mappingResponse = await httpClient.GetAsync<MappingModel[]>(
                StringUtility.BuildUri(optionsOsrsWiki.Value.OSRSPricesWikiBaseUri, optionsOsrsWiki.Value.Mapping));

            if (mappingResponse is null or [])
                return false;

            _mappingResponse = mappingResponse;
            return true;
        }

        private async Task<bool> GetLatestAsync()
        {
            LatestModel? latestResponse = await httpClient.GetAsync<LatestModel>(
                StringUtility.BuildUri(optionsOsrsWiki.Value.OSRSPricesWikiBaseUri, optionsOsrsWiki.Value.Latest));

            if (latestResponse is null)
                return false;

            _latestResponse = latestResponse;
            return true;
        }

        private async Task<bool> GetVolumeAsync()
        {
            Dictionary<string, string>? volumeResponse = await httpClient.GetAsync<Dictionary<string, string>>(
                StringUtility.BuildUri(optionsOsrsWiki.Value.OldschoolWikiBaseUri, optionsOsrsWiki.Value.Volume));

            if (volumeResponse is null)
                return false;

            _volumeResponse = volumeResponse;
            return true;
        }

        private bool CombineItemsData()
        {
            if (_mappingResponse is null or [] || _latestResponse?.Data is null || _volumeResponse is null)
                return false;

            _items = [];

            foreach (MappingModel mapping in _mappingResponse)
            {
                _latestResponse.Data.TryGetValue(mapping.Id.ToString(), out LatestData? latest);
                _volumeResponse.TryGetValue(mapping.Name ?? "", out string? volumeString);

                int volume = 0;
                if (!string.IsNullOrWhiteSpace(volumeString))
                    volume = int.Parse(volumeString);

                ItemModel item = new()
                {
                    Id = mapping.Id,
                    Icon = StringUtility.BuildIconUri(optionsOsrsWiki.Value.OldschoolWikiIconsBaseUri, mapping.Icon, "?7263b"),
                    Name = mapping.Name,
                    Examine = mapping.Examine,
                    InstaBuy = latest?.High ?? int.MinValue,
                    InstaSell = latest?.Low ?? int.MinValue,
                    InstaBuyTime = (long)(DateTime.Now - DateTimeOffset.FromUnixTimeSeconds(latest?.HighTime ?? 0).LocalDateTime).TotalSeconds,
                    InstaSellTime = (long)(DateTime.Now - DateTimeOffset.FromUnixTimeSeconds(latest?.LowTime ?? 0).LocalDateTime).TotalSeconds,
                    Volume = volume,
                    Limit = mapping.Limit,
                    Value = mapping.Value,
                    HighAlch = mapping.HighAlch,
                    LowAlch = mapping.LowAlch,
                    Members = mapping.Members,
                };

                item.Tax = item.InstaBuy >= 100 ? Math.Min(item.InstaBuy / 100, 5000000) : 0;
                item.Margin = item.InstaBuy - item.InstaSell - item.Tax;
                item.MarginXVolume = item.Margin * volume;
                item.RoiPercentage = item.InstaSell != 0 ? (float)item.Margin / item.InstaSell * 100 : 0;

                if (item.InstaBuy != int.MinValue && item.InstaSell != int.MinValue)
                    _items.Add(item);
            }

            return true;
        }
    }
}
