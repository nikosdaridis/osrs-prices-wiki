﻿using System.Globalization;

namespace Common.Utilities
{
    public static class NumericUtility
    {
        private static readonly CultureInfo _englishCulture = new("en-US");

        /// <summary>
        /// Formats seconds to readable format (months, days, hours, minutes, seconds)
        /// </summary>
        public static string FormatSeconds(long seconds)
        {
            (long formattedValue, TimeUnit suffix) = seconds switch
            {
                _ when seconds >= (int)TimeUnit.Months => (seconds / (int)TimeUnit.Months, TimeUnit.Months),
                _ when seconds >= (int)TimeUnit.Days => (seconds / (int)TimeUnit.Days, TimeUnit.Days),
                _ when seconds >= (int)TimeUnit.Hours => (seconds / (int)TimeUnit.Hours, TimeUnit.Hours),
                _ when seconds >= (int)TimeUnit.Minutes => (seconds / (int)TimeUnit.Minutes, TimeUnit.Minutes),
                _ => (seconds, TimeUnit.Seconds)
            };
            return $"{formattedValue} {suffix.ToString()[..^1].ToLower()}{(formattedValue == 1 ? "" : "s")}";
        }

        /// <summary>
        /// Formats seconds to relative datetime based on client datetime (Today time, Yesterday time, Last Date time, Date time)
        /// </summary>
        public static string FormatSecondsToRelativeDateTime(long seconds, DateTime clientDateTime, TimeZoneInfo clientTimeZone)
        {
            DateTime targetDateTime = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UnixEpoch.AddSeconds(seconds).ToUniversalTime(), clientTimeZone);

            int daysDifference = (int)(clientDateTime.Date - targetDateTime.Date).TotalDays;

            return daysDifference switch
            {
                <= 0 => $"Today {targetDateTime:HH:mm}",
                1 => $"Yesterday {targetDateTime:HH:mm}",
                _ when daysDifference > 1 && daysDifference < 7 => $"Last {targetDateTime.ToString("dddd", _englishCulture)} {targetDateTime:HH:mm}",
                _ => $"{targetDateTime:dd/MM/yy H:mm}"
            };
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
