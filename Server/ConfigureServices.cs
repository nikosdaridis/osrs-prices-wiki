using Application;
using Application.Models;
using Infrastructure;
using Serilog;
using System.Globalization;
using System.Runtime.InteropServices;

namespace Server
{
    public static class ConfigureServices
    {
        /// <summary>
        /// Adds services
        /// </summary>
        public static void AddServices(WebApplicationBuilder builder)
        {
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();

            builder.Services.AddHttpClient();
            builder.Services.AddECharts();

            AddSettings(builder);
            ConfigureSerilog();
            builder.Services.AddLogging(loggingBuilder => loggingBuilder.AddSerilog(dispose: true));
            ApplicationServicesRegistration.AddApplicationServices(builder.Services);
            InfrastructureServicesRegistration.AddInfrastructureServices(builder.Services);
        }

        /// <summary>
        /// Adds settings
        /// </summary>
        private static void AddSettings(WebApplicationBuilder builder) =>
            builder.Services.Configure<OsrsWikiValues>(builder.Configuration.GetSection(nameof(OsrsWikiValues)));

        /// <summary>
        /// Configures Serilog
        /// </summary>
        private static void ConfigureSerilog()
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.File(
                    RuntimeInformation.IsOSPlatform(OSPlatform.Linux) ? "/var/log/serilog/.log" : @"C:\logs\osrspriceswiki\.log",
                    fileSizeLimitBytes: 200 * 1024 * 1024,
                    rollingInterval: RollingInterval.Day,
                    rollOnFileSizeLimit: true,
                    shared: true,
                    flushToDiskInterval: TimeSpan.FromSeconds(1),
                    retainedFileCountLimit: null,
                    formatProvider: new CultureInfo("en-US")
                )
                .CreateLogger();
        }
    }
}
