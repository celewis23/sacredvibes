using System.Net;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Services.Newsletters;

// Pure, side-effect-free HTML assembly for a newsletter's header/body/footer — used
// identically for both the admin Preview tab and the actual send, so what the client
// sees while editing is exactly what goes out. Table-based, inline-styled markup only,
// matching the email-safe scaffold used by EmailTemplateService's transactional emails.
public static class NewsletterHtmlRenderer
{
    private const string DefaultHeaderBackground = "#5f5248";
    private const string DefaultHeaderTextColor = "#f3f0eb";
    private const string DefaultFooterBackground = "#faf9f7";
    private const string DefaultFooterTextColor = "#a49280";

    public record BannerInput(string? BackgroundColor, string? ImageUrl, string? Text, string? TextColor);

    // Assumes HeaderImageAsset/FooterImageAsset navigation properties were eager-loaded by the caller.
    public static string Render(Newsletter n) => Render(
        new BannerInput(n.HeaderBackgroundColor, n.HeaderImageAsset?.PublicUrl, n.HeaderText, n.HeaderTextColor),
        n.BodyContentHtml,
        new BannerInput(n.FooterBackgroundColor, n.FooterImageAsset?.PublicUrl, n.FooterText, n.FooterTextColor));

    public static string Render(BannerInput header, string bodyContentHtml, BannerInput footer)
    {
        return $"""
            <div style="background-color:#f3f0eb;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(28,23,20,0.10);">
                <tr>{RenderBanner(header, DefaultHeaderBackground, DefaultHeaderTextColor, isHeader: true)}</tr>
                <tr>
                  <td style="padding:32px 36px;color:#1c1714;font-size:15px;line-height:1.7;">
                    {bodyContentHtml}
                  </td>
                </tr>
                <tr>{RenderBanner(footer, DefaultFooterBackground, DefaultFooterTextColor, isHeader: false)}</tr>
              </table>
            </div>
            """;
    }

    private static string RenderBanner(BannerInput banner, string defaultBackground, string defaultTextColor, bool isHeader)
    {
        var background = string.IsNullOrWhiteSpace(banner.BackgroundColor) ? defaultBackground : banner.BackgroundColor;
        var textColor = string.IsNullOrWhiteSpace(banner.TextColor) ? defaultTextColor : banner.TextColor;
        var textPadding = isHeader ? "28px 32px" : "24px 32px";

        var image = string.IsNullOrWhiteSpace(banner.ImageUrl)
            ? ""
            : $"""<img src="{WebUtility.HtmlEncode(banner.ImageUrl)}" alt="" style="width:100%;display:block;border:0;" />""";

        var text = string.IsNullOrWhiteSpace(banner.Text)
            ? ""
            : $"""
                <div style="padding:{textPadding};text-align:center;">
                  <p style="margin:0;color:{textColor};font-size:{(isHeader ? "18px" : "13px")};white-space:pre-wrap;">{WebUtility.HtmlEncode(banner.Text)}</p>
                </div>
                """;

        return $"""<td style="background-color:{background};">{image}{text}</td>""";
    }
}
