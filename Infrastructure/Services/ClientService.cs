using Application.Models;
using Application.Utilities;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services
{
    public class ClientService(BaseHttpClient httpClient, IOptions<OsrsWikiValues> optionsOsrsWiki)
    {
        public async Task<MappingModel[]> GetMappingAsync()
        {
            MappingModel[] mappingResponse = await httpClient.GetAsync<MappingModel[]>(
                StringUtility.BuildApiUri(optionsOsrsWiki.Value.APIBaseUri, optionsOsrsWiki.Value.Mapping));

            return mappingResponse;
        }
    }
}
