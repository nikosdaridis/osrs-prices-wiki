using Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Application
{
    public static class ApplicationServicesRegistration
    {
        public static void AddApplicationServices(IServiceCollection services)
        {
            services.AddSingleton<PeriodicExecutorFactory>();
        }
    }
}
