namespace Application.Services
{
    public class PeriodicExecutorFactory
    {
        /// <summary>
        /// Create new PeriodicExecutor with given interval
        /// </summary>
        public static PeriodicExecutor Create(int interval) =>
            new(interval);
    }
}
