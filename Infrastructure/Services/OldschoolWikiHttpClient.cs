namespace Infrastructure.Services
{
    public class OldschoolWikiHttpClient : BaseHttpClient
    {
        public OldschoolWikiHttpClient(HttpClient httpClient) : base(httpClient) =>
            httpClient.DefaultRequestHeaders.Clear();
    }
}
