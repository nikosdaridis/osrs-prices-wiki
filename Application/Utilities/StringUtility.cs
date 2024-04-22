using System.Text.RegularExpressions;

namespace Application.Utilities
{
    public static partial class StringUtility
    {
        [GeneratedRegex(@"\{[^{}]+\}", RegexOptions.Compiled)]
        private static partial Regex RouteParameterRegex();

        [GeneratedRegex(@"\s+", RegexOptions.Compiled)]
        private static partial Regex WhitespaceCharacterRegex();

        public static string BuildUri(string? baseUri, string? routePath, params string?[] routeParameters)
        {
            string uri = BuildUri(baseUri, routePath);

            if (routeParameters.Length == 0)
                return uri;

            int paramIndex = 0;

            return RouteParameterRegex().Replace(uri, match =>
                paramIndex < routeParameters.Length ? routeParameters[paramIndex++] ?? match.Value : match.Value);
        }

        public static string BuildIconUri(string? baseUri, string? iconPath, params string?[] routeParameters)
        {
            string uri = BuildUri(baseUri, iconPath, routeParameters);

            return WhitespaceCharacterRegex().Replace(uri, "_");
        }

        private static string BuildUri(string? baseUri, string? path) =>
            $"{baseUri?.TrimEnd('/')}/{path?.TrimStart('/')}";
    }
}
