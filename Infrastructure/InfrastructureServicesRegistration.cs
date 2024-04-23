using Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure
{
    public static class InfrastructureServicesRegistration
    {
        public static void AddInfrastructureServices(IServiceCollection services)
        {
            services.AddScoped<BaseHttpClient>();
            services.AddScoped<ClientService>();
            services.AddScoped<PeriodicExecutor>();
        }
    }
}
