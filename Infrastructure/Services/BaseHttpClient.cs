using Newtonsoft.Json;

namespace Infrastructure.Services
{
    public class BaseHttpClient
    {
        private readonly HttpClient _httpClient;

        public BaseHttpClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "osrsprices.wiki");
        }

        public Task<TResponse> GetAsync<TResponse>(string requestUri) =>
            SendAsync<TResponse>(new HttpRequestMessage(HttpMethod.Get, requestUri));

        private async Task<TResponse> SendAsync<TResponse>(HttpRequestMessage request)
        {
            using HttpResponseMessage response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                // TODO
            }

            string content = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<TResponse>(content)
                ?? throw new JsonException("Deserialization of response content is null");
        }
    }
}
