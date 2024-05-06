using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Infrastructure.Services
{
    public class BaseHttpClient(HttpClient httpClient, ILogger<BaseHttpClient> logger) : IBaseHttpClient
    {
        /// <summary>
        /// GET request to specified URI and returns deserialized response
        /// </summary>
        public Task<TResponse?> GetAsync<TResponse>(string requestUri) =>
            SendAsync<TResponse?>(new HttpRequestMessage(HttpMethod.Get, requestUri));

        /// <summary>
        /// Sends HTTP request and handles response and deserialization
        /// </summary>
        protected async Task<TResponse?> SendAsync<TResponse>(HttpRequestMessage request)
        {
            using HttpResponseMessage response = await httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("{RequestMethod} Request to {RequestUri} failed with status code {StatusCode}",
                      request.Method, request.RequestUri, response.StatusCode);

                return default;
            }

            string content = await response.Content.ReadAsStringAsync();

            try
            {
                TResponse? deserializedResponse = JsonConvert.DeserializeObject<TResponse?>(content);

                if (deserializedResponse is null)
                    logger.LogWarning("Deserialization of response content returned null for {RequestMethod} request to {RequestUri}. Response content: {ResponseContent}",
                                      request.Method, request.RequestUri, content);

                return deserializedResponse ?? default;
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Error deserializing response content for {RequestMethod} request to {RequestUri}. Response content: {ResponseContent}",
                                request.Method, request.RequestUri, content);

                return default;
            }
        }
    }
}
