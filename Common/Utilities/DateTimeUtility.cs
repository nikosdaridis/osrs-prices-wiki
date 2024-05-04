using Common.Models;
using Microsoft.JSInterop;

namespace Common.Utilities
{
    public static class DateTimeUtility
    {
        /// <summary>
        /// Gets client's local time and time zone via JSInterop
        /// </summary>
        public static async Task<(DateTime?, TimeZoneInfo?)> GetClientLocalTime(IJSRuntime jsRuntime)
        {
            TimeInfo timeInfo = await jsRuntime.InvokeAsync<TimeInfo>("getClientTimeInfo");

            if (timeInfo is null || timeInfo.TimeZone is null || timeInfo.LocalTime is null)
                return (null, null);

            try
            {
                DateTime clientLocalTime = DateTime.Parse(timeInfo.LocalTime, null, System.Globalization.DateTimeStyles.RoundtripKind);
                TimeZoneInfo clientTimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeInfo.TimeZone);
                return (clientLocalTime, clientTimeZone);
            }
            catch
            {
                return (null, null);
            }
        }
    }
}
