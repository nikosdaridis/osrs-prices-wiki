using Newtonsoft.Json;

namespace Application.Models.API
{
    public class LatestModel
    {
        [JsonProperty("data")]
        public Dictionary<string, LatestData>? Data { get; set; }
    }

    public class LatestData
    {
        [JsonProperty("high")]
        public int? High { get; set; }

        [JsonProperty("highTime")]
        public long? HighTime { get; set; }

        [JsonProperty("low")]
        public int? Low { get; set; }

        [JsonProperty("lowTime")]
        public long? LowTime { get; set; }
    }
}
