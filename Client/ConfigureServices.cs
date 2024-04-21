using Application;
using Application.Models;
using Infrastructure;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

namespace Client
{
    public static class ConfigureServices
    {
        public static void AddServices(WebAssemblyHostBuilder builder)
        {
            builder.RootComponents.Add<App>("#app");
            builder.RootComponents.Add<HeadOutlet>("head::after");
            builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

            AddSettings(builder);
            ApplicationServicesRegistration.AddApplicationServices(builder.Services);
            InfrastructureServicesRegistration.AddInfrastructureServices(builder.Services);
        }

        private static void AddSettings(WebAssemblyHostBuilder builder)
        {
            builder.Services.Configure<OsrsWikiValues>(builder.Configuration.GetSection(nameof(OsrsWikiValues)));
        }
    }
}
