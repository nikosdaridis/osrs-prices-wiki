namespace Infrastructure
{
    public interface IBaseHttpClient
    {
        /// <summary>
        /// Sends GET request to the specified Uri
        /// </summary>
        Task<TResponse?> GetAsync<TResponse>(string requestUri);
    }
}
