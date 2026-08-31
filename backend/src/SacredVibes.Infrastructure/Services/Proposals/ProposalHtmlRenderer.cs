using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Services.Proposals;

// Pure HTML assembly used for the admin "Preview" tab and the public "View Proposal Online"
// page's initial fetch — NOT used for the PDF (see ProposalPdfRenderer for that; PDFs can't
// embed playable video, so the two renderers deliberately diverge on the video node).
public static class ProposalHtmlRenderer
{
    private const string DefaultHeaderBackground = "#5f5248";
    private const string DefaultHeaderTextColor = "#f3f0eb";
    private const string DefaultFooterBackground = "#faf9f7";
    private const string DefaultFooterTextColor = "#a49280";

    private static readonly Regex VideoMarkerRegex = new(
        """<div[^>]*data-proposal-video="1"[^>]*data-src="(?<src>[^"]*)"(?:[^>]*data-poster="(?<poster>[^"]*)")?[^>]*></div>""",
        RegexOptions.Compiled);

    public record BannerInput(string? BackgroundColor, string? ImageUrl, string? Text, string? TextColor);

    public static string Render(Proposal p) => Render(
        new BannerInput(p.HeaderBackgroundColor, p.HeaderImageAsset?.PublicUrl, p.HeaderText, p.HeaderTextColor),
        p.BodyContentHtml,
        p.LineItems,
        new BannerInput(p.FooterBackgroundColor, p.FooterImageAsset?.PublicUrl, p.FooterText, p.FooterTextColor));

    public static string Render(BannerInput header, string bodyContentHtml, IEnumerable<ProposalLineItem> lineItems, BannerInput footer)
    {
        return $"""
            <div style="background-color:#f3f0eb;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(28,23,20,0.10);">
                <tr>{RenderBanner(header, DefaultHeaderBackground, DefaultHeaderTextColor, isHeader: true)}</tr>
                <tr>
                  <td style="padding:32px 36px;color:#1c1714;font-size:15px;line-height:1.7;">
                    {RenderBody(bodyContentHtml)}
                    {RenderPricingTable(lineItems)}
                  </td>
                </tr>
                <tr>{RenderBanner(footer, DefaultFooterBackground, DefaultFooterTextColor, isHeader: false)}</tr>
              </table>
            </div>
            """;
    }

    // Upgrades the stored `<div data-proposal-video>` marker into a real, playable <video> —
    // safe here (an HTML page/iframe), unlike the PDF where it becomes a thumbnail + link.
    private static string RenderBody(string bodyContentHtml) => VideoMarkerRegex.Replace(bodyContentHtml, match =>
    {
        var src = WebUtility.HtmlEncode(match.Groups["src"].Value);
        var poster = match.Groups["poster"].Success && !string.IsNullOrWhiteSpace(match.Groups["poster"].Value)
            ? $" poster=\"{WebUtility.HtmlEncode(match.Groups["poster"].Value)}\""
            : "";
        return $"""<video controls src="{src}"{poster} style="max-width:100%;display:block;margin:12px 0;"></video>""";
    });

    private static string RenderPricingTable(IEnumerable<ProposalLineItem> lineItems)
    {
        var items = lineItems.OrderBy(l => l.SortOrder).ToList();
        if (items.Count == 0) return "";

        var sb = new StringBuilder();
        sb.Append("""<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;font-size:14px;">""");
        sb.Append("""<tr style="border-bottom:2px solid #e8e2d9;"><th style="text-align:left;padding:8px 0;color:#a49280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Description</th><th style="text-align:right;padding:8px 0;color:#a49280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Price</th></tr>""");
        foreach (var item in items)
        {
            sb.Append($"""<tr style="border-bottom:1px solid #f3f0eb;"><td style="padding:10px 0;color:#1c1714;">{WebUtility.HtmlEncode(item.Description)}</td><td style="padding:10px 0;text-align:right;color:#1c1714;white-space:nowrap;">{item.Price:C}</td></tr>""");
        }
        var total = items.Sum(i => i.Price);
        sb.Append($"""<tr><td style="padding:14px 0 0;text-align:right;font-weight:600;color:#5f5248;" colspan="1">Total</td><td style="padding:14px 0 0;text-align:right;font-weight:700;font-size:16px;color:#1c1714;">{total:C}</td></tr>""");
        sb.Append("</table>");
        return sb.ToString();
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
