using Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Application
{
    public static class ApplicationServicesRegistration
    {
        /// <summary>
        /// Adds application services
        /// </summary>
        public static void AddApplicationServices(IServiceCollection services)
        {
            services.AddSingleton<PeriodicExecutorFactory>();
        }
    }
}
