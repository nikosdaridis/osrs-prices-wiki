namespace Infrastructure.Services
{
    public class OSRSWikiHttpClient : BaseHttpClient
    {
        public OSRSWikiHttpClient(HttpClient httpClient) : base(httpClient) =>
            httpClient.DefaultRequestHeaders.Add("User-Agent", "osrsprices.wiki");
    }
}
