namespace Application.Helpers
{
    public static class CSSHelper
    {
        // Red to Green colors
        private static readonly string[] Colors = ["#fa0000", "#ff3838", "#ff7a7a", "#ffb8b8", "#ffffff", "#b8ffb8", "#7aff7a", "#38ff38", "#00ff00"];

        // Defines colors order of thresholds
        private enum ThresholdOrder { Descending, Ascending }

        // Defines colors range
        private enum ColorRange { RedToGreen, WhiteToGreen }

        // Maps types to value thresholds, order and range
        private static readonly Dictionary<string, (double[] Thresholds, ThresholdOrder Order, ColorRange Range)> TypeConfigs = new()
        {
            { "Margin", (new double[] { -1_000_000, -100_000, -10_000, -1, 1_000, 10_000, 100_000, 1_000_000 }, ThresholdOrder.Ascending, ColorRange.RedToGreen) },
            { "RoiPercentage", (new double[] { -10, -5, -2.5, -0.001, 0, 0.1, 1, 3 }, ThresholdOrder.Ascending, ColorRange.RedToGreen) },
            { "MarginXVolume",(new double[] { -10_000_000, -1_000_000, -100_000, -1, 10_000, 100_000, 1_000_000, 10_000_000 }, ThresholdOrder.Ascending, ColorRange.RedToGreen) },
            { "Volume", (new double[] { 1_000, 10_000, 100_000, 1_000_000 }, ThresholdOrder.Ascending, ColorRange.WhiteToGreen) },
            { "InstaTime", (new double[] { 2_628_000, 860_400, 86_400, 43_200, 7_200, 3_600, 1800, 600 }, ThresholdOrder.Descending, ColorRange.RedToGreen) }
        };

        /// <summary>
        /// Gets color based on type and value
        /// </summary>
        public static string GetColor(string type, double value)
        {
            string key = type switch
            {
                "InstaBuyTime" or "InstaSellTime" => "InstaTime",
                _ => type
            };

            if (!TypeConfigs.TryGetValue(key, out (double[] Thresholds, ThresholdOrder Order, ColorRange Range) config))
                return "#ffffff";

            return Colors[FindThresholdIndex(value, config)];
        }

        /// <summary>
        /// Finds index of color based on value, order and range
        /// </summary>
        private static int FindThresholdIndex(double value, (double[] Thresholds, ThresholdOrder Order, ColorRange Range) config)
        {
            for (int i = 0; i < config.Thresholds.Length; i++)
            {
                if (config.Order == ThresholdOrder.Ascending && value <= config.Thresholds[i] ||
                    config.Order == ThresholdOrder.Descending && value >= config.Thresholds[i])
                    return config.Range == ColorRange.WhiteToGreen ? 4 + i : i;
            }

            return Colors.Length - 1;
        }
    }
}
