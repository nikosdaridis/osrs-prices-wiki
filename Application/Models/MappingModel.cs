using Newtonsoft.Json;

namespace Application.Models
{
    public class MappingModel
    {
        [JsonProperty("examine")]
        public string? Examine { get; set; }

        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("members")]
        public bool Members { get; set; }

        [JsonProperty("lowalch")]
        public int LowAlch { get; set; }

        [JsonProperty("limit")]
        public int Limit { get; set; }

        [JsonProperty("value")]
        public int Value { get; set; }

        [JsonProperty("highalch")]
        public int HighAlch { get; set; }

        [JsonProperty("icon")]
        public string? Icon { get; set; }

        [JsonProperty("name")]
        public string? Name { get; set; }
    }
}
