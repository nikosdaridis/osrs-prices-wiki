namespace Common.Utilities
{
    public static class NumericUtility
    {
        /// <summary>
        /// Formats seconds to readable format (months, days, hours, minutes, seconds)
        /// </summary>
        public static string FormatSeconds(long seconds)
        {
            (long formattedValue, TimeUnit suffix) = seconds switch
            {
                _ when seconds >= 2_628_000 => (seconds / 2_628_000, TimeUnit.Months),
                _ when seconds >= 86_400 => (seconds / 86_400, TimeUnit.Days),
                _ when seconds >= 3_600 => (seconds / 3_600, TimeUnit.Hours),
                _ when seconds >= 60 => (seconds / 60, TimeUnit.Minutes),
                _ => (seconds, TimeUnit.Seconds)
            };
            return $"{formattedValue} {suffix.ToString()[..^1].ToLower()}{(formattedValue == 1 ? "" : "s")}";
        }

        /// <summary>
        /// Formats number to readable format (billions, millions, thousands)
        /// </summary>
        public static string FormatNumber(long number, string? format = null)
        {
            long absoluteNumber = Math.Abs(number);

            (double formattedValue, string suffix) = absoluteNumber switch
            {
                _ when absoluteNumber >= 1_000_000_000 => (absoluteNumber / 1_000_000_000D, "B"),
                _ when absoluteNumber >= 1_000_000 => (absoluteNumber / 1_000_000D, "M"),
                _ when absoluteNumber >= 1_000 => (absoluteNumber / 1_000D, "K"),
                _ => (absoluteNumber, "")
            };

            format ??= suffix switch
            {
                "B" => "0.###",
                "M" => "0.##",
                "K" => "0.#",
                _ => "0"
            };

            return $"{(number < 0 ? "-" : "")}{formattedValue.ToString(format)}{suffix}";
        }
    }
}
