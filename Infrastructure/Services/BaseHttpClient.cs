using Newtonsoft.Json;

namespace Infrastructure.Services
{
    public class BaseHttpClient(HttpClient httpClient) : IBaseHttpClient
    {
        public Task<TResponse?> GetAsync<TResponse>(string requestUri) =>
            SendAsync<TResponse?>(new HttpRequestMessage(HttpMethod.Get, requestUri));

        protected async Task<TResponse?> SendAsync<TResponse>(HttpRequestMessage request)
        {
            using HttpResponseMessage response = await httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return default;

            string content = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<TResponse?>(content) ?? default;
        }
    }
}
