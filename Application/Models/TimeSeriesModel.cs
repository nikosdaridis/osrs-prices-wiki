using Newtonsoft.Json;

namespace Application.Models
{
    public class TimeSeriesModel
    {
        [JsonProperty("data")]
        public TimeSeriesData[]? Data { get; set; }
    }

    public class TimeSeriesData
    {
        [JsonProperty("timestamp")]
        public long Timestamp { get; set; }

        [JsonProperty("avgHighPrice")]
        public int? AvgHighPrice { get; set; }

        [JsonProperty("avgLowPrice")]
        public int? AvgLowPrice { get; set; }

        [JsonProperty("highPriceVolume")]
        public int HighPriceVolume { get; set; }

        [JsonProperty("lowPriceVolume")]
        public int LowPriceVolume { get; set; }
    }
}
