using Application;
using Application.Models;
using Infrastructure;

namespace Server
{
    public static class ConfigureServices
    {
        public static void AddServices(WebApplicationBuilder builder)
        {
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();

            builder.Services.AddHttpClient("OSRSWikiClient", client =>
            {
                client.BaseAddress = new Uri("127.0.0.1");
            });

            builder.Services.AddECharts();

            AddSettings(builder);
            ApplicationServicesRegistration.AddApplicationServices(builder.Services);
            InfrastructureServicesRegistration.AddInfrastructureServices(builder.Services);
        }

        private static void AddSettings(WebApplicationBuilder builder) =>
            builder.Services.Configure<OsrsWikiValues>(builder.Configuration.GetSection(nameof(OsrsWikiValues)));
    }
}
