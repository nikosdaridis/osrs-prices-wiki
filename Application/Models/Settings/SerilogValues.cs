using Serilog;

namespace Application.Models.Settings
{
    public class SerilogValues
    {
        public Dictionary<string, string?> Paths { get; set; } = [];
        public string MinimumLevel { get; set; } = "Information";
        public long FileSizeLimitBytes { get; set; }
        public RollingInterval RollingInterval { get; set; }
        public bool RollOnFileSizeLimit { get; set; }
        public bool Shared { get; set; }
        public uint FlushToDiskIntervalSeconds { get; set; }
        public int? RetainedFileCountLimit { get; set; }
        public string FormatProviderCulture { get; set; } = "en-US";
    }
}
