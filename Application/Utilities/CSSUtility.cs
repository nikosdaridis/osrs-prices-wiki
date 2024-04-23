namespace Application.Utilities
{
    public static class CSSUtility
    {
        // Red to Green
        private static readonly string[] Colors = ["#fa0000", "#ff3838", "#ff7a7a", "#ffb8b8", "#ffffff", "#b8ffb8", "#7aff7a", "#38ff38", "#00ff00"];

        // Dictionary to map types and value thresholds
        private static readonly Dictionary<string, List<long>> TypeThresholds = new()
        {
            {"Margin", new List<long>{ -1_000_000, -100_000, -10_000, -1, 1_000, 10_000, 100_000, 1_000_000 }},
        };

        /// <summary>
        /// Gets color based on type and value
        /// </summary>
        public static string GetColor(string type, long value)
        {
            if (!TypeThresholds.TryGetValue(type, out var thresholds))
                return "#ffffff";

            for (int i = 0; i < thresholds.Count; i++)
            {
                if (value <= thresholds[i])
                    return Colors[i];
            }

            return Colors[^1];
        }
    }
}
