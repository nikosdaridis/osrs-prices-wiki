using Common;

namespace Application.Helpers
{
    public static class CSSHelper
    {
        // Red to Green colors
        private static readonly string[] Colors = ["#fa0000", "#ff3838", "#ff7a7a", "#ffb8b8", "#ffffff", "#b8ffb8", "#7aff7a", "#38ff38", "#00ff00"];

        // Maps types to value thresholds, order and color range
        private static readonly Dictionary<string, (double[], Order, ColorRange)> TypeConfigs = new()
        {
            { "Margin", (new double[] { -1_000_000, -100_000, -10_000, -1, 1_000, 10_000, 100_000, 1_000_000 }, Order.Ascending, ColorRange.RedToGreen) },
            { "RoiPercentage", (new double[] { -10, -5, -2.5, -0.001, 0, 0.1, 1, 3 }, Order.Ascending, ColorRange.RedToGreen) },
            { "MarginX",(new double[] { -10_000_000, -1_000_000, -100_000, -1, 10_000, 100_000, 1_000_000, 10_000_000 }, Order.Ascending, ColorRange.RedToGreen) },
            { "Volume", (new double[] { 1_000, 10_000, 100_000, 1_000_000 }, Order.Ascending, ColorRange.WhiteToGreen) },
            { "InstaTime", (new double[] { 2_628_000, 860_400, 86_400, 43_200, 7_200, 3_600, 1_800, 600 }, Order.Descending, ColorRange.RedToGreen) }
        };

        /// <summary>
        /// Gets color based on type and value
        /// </summary>
        public static string GetColor(string type, double value)
        {
            string key = type switch
            {
                "InstaBuyTime" or "InstaSellTime" => "InstaTime",
                "MarginXLimit" or "MarginXVolume" => "MarginX",
                _ => type
            };

            if (!TypeConfigs.TryGetValue(key, out (double[], Order, ColorRange) config))
                return "#ffffff";

            return Colors[FindThresholdIndex(value, config)];

            // Finds index of color based on value, order and range
            static int FindThresholdIndex(double value, (double[] Thresholds, Order Order, ColorRange Range) config)
            {
                for (int i = 0; i < config.Thresholds.Length; i++)
                {
                    if (config.Order == Order.Ascending && value <= config.Thresholds[i] ||
                        config.Order == Order.Descending && value >= config.Thresholds[i])
                        return config.Range == ColorRange.WhiteToGreen ? 4 + i : i;
                }

                return Colors.Length - 1;
            }
        }
    }
}
