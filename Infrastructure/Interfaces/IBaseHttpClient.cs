namespace Infrastructure
{
    public interface IBaseHttpClient
    {
        Task<TResponse?> GetAsync<TResponse>(string requestUri);
    }
}
