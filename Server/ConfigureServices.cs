using Application;
using Application.Models.Settings;
using Common.Utilities;
using Infrastructure;
using Radzen;
using Serilog;
using Serilog.Events;
using System.Globalization;

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
        private static void AddSettings(WebApplicationBuilder builder)
        {
            builder.Services.Configure<SMTPValues>(builder.Configuration.GetSection(nameof(SMTPValues)));
            builder.Services.Configure<OsrsWikiValues>(builder.Configuration.GetSection(nameof(OsrsWikiValues)));
        }

        /// <summary>
        /// Configures Serilog
        /// </summary>
        private static void ConfigureSerilog(SerilogValues? serilogValues)
        {
            ArgumentNullException.ThrowIfNull(serilogValues);

            Enum.TryParse(serilogValues.MinimumLevel, true, out LogEventLevel minimumLevel);

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Is(minimumLevel)
                .WriteTo.File(
                    path: serilogValues.Paths.TryGetValue(StringUtility.GetOSPlatform(), out string? path) ? path ?? throw new PlatformNotSupportedException() : throw new PlatformNotSupportedException(),
                    fileSizeLimitBytes: serilogValues.FileSizeLimitBytes,
                    rollingInterval: serilogValues.RollingInterval,
                    rollOnFileSizeLimit: serilogValues.RollOnFileSizeLimit,
                    shared: serilogValues.Shared,
                    flushToDiskInterval: TimeSpan.FromSeconds(serilogValues.FlushToDiskIntervalSeconds),
                    retainedFileCountLimit: serilogValues.RetainedFileCountLimit,
                    formatProvider: new CultureInfo(serilogValues.FormatProviderCulture)
                )
                .CreateLogger();
        }
    }
}
