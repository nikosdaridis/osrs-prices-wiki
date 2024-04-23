namespace Infrastructure.Services
{
    public class PeriodicExecutorFactory
    {
        public static PeriodicExecutor Create(int interval) => new(interval);
    }
}
