using Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure
{
    public static class InfrastructureServicesRegistration
    {
        public static void AddInfrastructureServices(IServiceCollection services)
        {
            services.AddSingleton<OSRSWikiHttpClient>();
            services.AddSingleton<ServerService>();
            services.AddHostedService<ServerBackgroundService>();
        }
    }
}
