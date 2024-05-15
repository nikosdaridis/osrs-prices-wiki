using Application.Models.API;
using Common.Utilities;
using System.Text;

namespace Infrastructure.Helpers
{
    public static class SitemapHelper
    {
        /// <summary>
        /// Generates sitemap.txt in the wwwroot
        /// </summary>
        public static void Generate(List<ItemModel> items)
        {
            StringBuilder sitemapContent = new();
            sitemapContent.AppendLine("https://osrsprices.wiki");

            foreach (ItemModel item in items)
                sitemapContent.AppendLine($"https://osrsprices.wiki/{StringUtility.BuildUri(item.Id.ToString(), item.Name, '-')}");

            string path = Path.Combine(Path.GetFullPath("wwwroot"), "sitemap.txt");
            File.WriteAllText(path, sitemapContent.ToString());
        }
    }
}
