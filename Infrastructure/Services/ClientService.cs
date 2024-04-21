using Application.Models;
using Application.Utilities;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services
{
    public class ClientService(BaseHttpClient httpClient, IOptions<OsrsWikiValues> optionsOsrsWiki)
    {
        private MappingModel[]? _mappingResponse;
        private LatestModel? _latestResponse;
        private List<ItemModel> _items = [];

        public async Task<List<ItemModel>> GetItems()
        {
            if (_mappingResponse is null or [])
                await GetMappingAsync();

            await GetLatestAsync();

            CombineItemsData();

            return _items;
        }

        private async Task<bool> GetMappingAsync()
        {
            MappingModel[]? mappingResponse = await httpClient.GetAsync<MappingModel[]>(
                StringUtility.BuildApiUri(optionsOsrsWiki.Value.APIBaseUri, optionsOsrsWiki.Value.Mapping));

            if (mappingResponse is null or [])
                return false;

            _mappingResponse = mappingResponse;
            return true;
        }

        private async Task<bool> GetLatestAsync()
        {
            LatestModel? latestResponse = await httpClient.GetAsync<LatestModel>(
                StringUtility.BuildApiUri(optionsOsrsWiki.Value.APIBaseUri, optionsOsrsWiki.Value.Latest));

            if (latestResponse is null)
                return false;

            _latestResponse = latestResponse;
            return true;
        }

        private bool CombineItemsData()
        {
            if (_mappingResponse is null or [] || _latestResponse?.Data is null)
                return false;

            _items = [];

            foreach (MappingModel mapping in _mappingResponse)
            {
                if (_latestResponse.Data.TryGetValue(mapping.Id.ToString(), out LatestData? latest))
                {
                    _items.Add(new()
                    {
                        Id = mapping.Id,
                        Icon = mapping.Icon,
                        Name = mapping.Name,
                        Examine = mapping.Examine,
                        High = (int)(latest.High is null ? 0 : latest.High),
                        Low = (int)(latest.Low is null ? 0 : latest.Low),
                        HighTime = (long)(latest.HighTime is null ? 0 : latest.HighTime),
                        LowTime = (long)(latest.LowTime is null ? 0 : latest.LowTime),
                        Limit = mapping.Limit,
                        Value = mapping.Value,
                        HighAlch = mapping.HighAlch,
                        LowAlch = mapping.LowAlch,
                        Members = mapping.Members,
                        Margin = (int)(latest?.High is null || latest?.Low is null ? 0 : latest.High - latest.Low),
                    });
                }
            }

            return true;
        }
    }
}
