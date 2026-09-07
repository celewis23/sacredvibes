using System.Text.RegularExpressions;

namespace SacredVibes.Infrastructure.Services;

// Asset URLs are stored relative ("/uploads/xyz.jpg") because the web app's own Next.js
// rewrite proxies that path to the backend — fine inside a browser, meaningless anywhere
// else. An emailed newsletter/proposal has no such proxy, and HttpClient.GetByteArrayAsync
// (used by the Proposal PDF renderer) throws outright on a relative URI. Anything that leaves
// the web app — an email body, a PDF — must resolve these to absolute URLs first.
public static class PublicUrlResolver
{
    private static readonly Regex RelativeAssetAttributeRegex = new(
        "(src|data-src|data-poster)=\"(/[^\"]*)\"",
        RegexOptions.Compiled);

    private static readonly Regex HrefAttributeRegex = new(
        "href=\"([^\"]*)\"",
        RegexOptions.Compiled);

    public static string ResolveApiBaseUrl() =>
        (Environment.GetEnvironmentVariable("API_URL") ?? "https://api.sacredvibesyoga.com").TrimEnd('/');

    public static string ResolveFrontendBaseUrl() =>
        (Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://sacredvibesyoga.com").TrimEnd('/');

    public static string ToAbsoluteUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return url ?? string.Empty;
        if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return url;

        return url.StartsWith('/') ? $"{ResolveApiBaseUrl()}{url}" : $"{ResolveApiBaseUrl()}/{url}";
    }

    // Heals HTML saved before this fix (or from any other source of a relative URL) by
    // rewriting every relative src/data-src/data-poster attribute to an absolute one.
    public static string RewriteRelativeAssetUrls(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return html;
        return RelativeAssetAttributeRegex.Replace(html, m => $"{m.Groups[1].Value}=\"{ToAbsoluteUrl(m.Groups[2].Value)}\"");
    }

    // A link typed as "sacredvibesyoga.com/booking" (no scheme) or "/booking" (site-relative)
    // both resolve fine in a browser, which has a page to resolve them against — but go
    // nowhere from an email client or a PDF viewer, which have no such base. In-page anchors
    // (#...) and links that already carry a scheme (http:, https:, mailto:, tel:, ...) are
    // left untouched.
    public static string ToAbsoluteLinkUrl(string? href)
    {
        if (string.IsNullOrWhiteSpace(href)) return href ?? string.Empty;
        var trimmed = href.Trim();

        if (trimmed.StartsWith('#')) return trimmed;
        if (trimmed.StartsWith("//", StringComparison.Ordinal)) return $"https:{trimmed}";
        if (trimmed.Contains(':')) return trimmed;

        return trimmed.StartsWith('/') ? $"{ResolveFrontendBaseUrl()}{trimmed}" : $"https://{trimmed}";
    }

    // Heals HTML saved before this fix by rewriting every bare/relative href to absolute.
    public static string RewriteBareLinks(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return html;
        return HrefAttributeRegex.Replace(html, m => $"href=\"{ToAbsoluteLinkUrl(m.Groups[1].Value)}\"");
    }
}
