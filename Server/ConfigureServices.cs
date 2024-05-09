using Application;
using Application.Models;
using Infrastructure;
using Radzen;
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
            builder.Services.AddRadzenComponents();
            builder.Services.AddECharts();

            AddSettings(builder);
            ConfigureSerilog(builder.Configuration.GetSection(nameof(SerilogValues)).Get<SerilogValues>());
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
        private static void ConfigureSerilog(SerilogValues? serilogValues)
        {
            if (serilogValues is null)
                throw new Exception("SerilogValues not found in appsettings");

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.File(
                    RuntimeInformation.IsOSPlatform(OSPlatform.Linux) ? serilogValues.LinuxPath! : serilogValues.WindowsPath!,
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
