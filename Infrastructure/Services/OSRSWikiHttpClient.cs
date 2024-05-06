using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class OSRSWikiHttpClient : BaseHttpClient
    {
        /// <summary>
        /// Initializes OSRSWikiHttpClient with user-agent header
        /// </summary>
        public OSRSWikiHttpClient(HttpClient httpClient, ILogger<OSRSWikiHttpClient> logger) : base(httpClient, logger) =>
            httpClient.DefaultRequestHeaders.Add("User-Agent", "osrsprices.wiki");
    }
}
