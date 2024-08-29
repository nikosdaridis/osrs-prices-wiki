using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace Common.Utilities
{
    public static partial class StringUtility
    {
        // Matches route parameters in curly braces
        [GeneratedRegex(@"\{[^{}]+\}", RegexOptions.Compiled)]
        private static partial Regex RouteParameterRegex();

        // Matches whitespace characters
        [GeneratedRegex(@"\s+", RegexOptions.Compiled)]
        private static partial Regex WhitespaceCharacterRegex();

        private static readonly OSPlatform[] _supportedOSPlatform = [OSPlatform.Linux, OSPlatform.Windows];

        /// <summary>
        /// Builds URI from base URI and route path
        /// </summary>
        public static string BuildUri(string? baseUri, string? routePath) =>
            $"{baseUri?.TrimEnd('/')}/{routePath?.TrimStart('/')}";

        /// <summary>
        /// Builds URI from base URI and route path, replacing route parameters with specified values
        /// </summary>
        public static string BuildUri(string? baseUri, string? routePath, params string?[] routeParameters)
        {
            string uri = BuildUri(baseUri, routePath);

            if (routeParameters.Length == 0)
                return uri;

            int paramIndex = 0;

            return RouteParameterRegex().Replace(uri, match =>
                paramIndex < routeParameters.Length ? routeParameters[paramIndex++] ?? match.Value : match.Value);
        }

        /// <summary>
        /// Builds URI from base URI and route path, replacing route parameters with specified values and replacing whitespace characters with specified character
        /// </summary>
        public static string BuildUri(string? baseUri, string? routePath, char whitespaceReplacement, params string?[] routeParameters) =>
             WhitespaceCharacterRegex().Replace(BuildUri(baseUri, routePath, routeParameters), whitespaceReplacement.ToString());

        /// <summary>
        /// Gets current OS platform name in sentence case
        /// </summary>
        public static string GetOSPlatform() =>
            _supportedOSPlatform.FirstOrDefault(RuntimeInformation.IsOSPlatform).ToString() is string osPlatform && !string.IsNullOrWhiteSpace(osPlatform)
            ? char.ToUpper(osPlatform[0]) + osPlatform[1..].ToLower()
            : string.Empty;
    }
}
