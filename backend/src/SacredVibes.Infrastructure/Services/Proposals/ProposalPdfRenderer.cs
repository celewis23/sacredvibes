using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Services.Proposals;

// Renders a Proposal to a PDF byte array. Deliberately separate from ProposalHtmlRenderer:
// PDFs can't reliably embed playable video, so a `data-proposal-video` marker becomes a
// thumbnail + a real clickable hyperlink back to the public "View Online" page here, where
// the HTML renderer instead upgrades the same marker into a real <video> element.
//
// Pure function of already-resolved bytes — no DB/HTTP calls happen inside this class; the
// caller (ProposalService) fetches every image/poster referenced in the content ahead of time.
public static class ProposalPdfRenderer
{
    public record RenderInput(
        Proposal Proposal,
        byte[]? HeaderImageBytes,
        byte[]? FooterImageBytes,
        IReadOnlyDictionary<string, byte[]> BodyImageBytesBySrc,
        string PublicViewUrl);

    public static byte[] Render(RenderInput input)
    {
        var p = input.Proposal;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(0);
                page.DefaultTextStyle(x => x.FontSize(11).FontColor("#1c1714"));

                page.Header().Element(c => RenderBanner(c, p.HeaderBackgroundColor, input.HeaderImageBytes, p.HeaderText, p.HeaderTextColor, isHeader: true));

                page.Content().PaddingHorizontal(36).PaddingVertical(20).Column(col =>
                {
                    col.Spacing(10);
                    RenderBodyHtml(col, p.BodyContentHtml, input.BodyImageBytesBySrc, input.PublicViewUrl);

                    if (p.LineItems.Count > 0)
                    {
                        col.Item().PaddingTop(16);
                        RenderPricingTable(col, p.LineItems.OrderBy(l => l.SortOrder));
                    }
                });

                page.Footer().Element(c => RenderBanner(c, p.FooterBackgroundColor, input.FooterImageBytes, p.FooterText, p.FooterTextColor, isHeader: false));
            });
        });

        return document.GeneratePdf();
    }

    private static void RenderBanner(IContainer container, string? backgroundColor, byte[]? imageBytes, string? text, string? textColor, bool isHeader)
    {
        var background = string.IsNullOrWhiteSpace(backgroundColor) ? (isHeader ? "#5f5248" : "#faf9f7") : backgroundColor;
        var resolvedTextColor = string.IsNullOrWhiteSpace(textColor) ? (isHeader ? "#f3f0eb" : "#a49280") : textColor;

        container.Background(background).Column(inner =>
        {
            if (imageBytes is { Length: > 0 })
                inner.Item().Image(imageBytes).FitWidth();

            if (!string.IsNullOrWhiteSpace(text))
            {
                inner.Item().PaddingVertical(isHeader ? 20 : 14).PaddingHorizontal(24)
                    .AlignCenter().Text(text).FontSize(isHeader ? 16 : 10).FontColor(resolvedTextColor);
            }
        });
    }

    private static void RenderBodyHtml(ColumnDescriptor col, string bodyContentHtml, IReadOnlyDictionary<string, byte[]> imageBytesBySrc, string publicViewUrl)
    {
        if (string.IsNullOrWhiteSpace(bodyContentHtml)) return;

        var htmlDoc = new HtmlParser().ParseDocument(bodyContentHtml);
        if (htmlDoc.Body is null) return;

        foreach (var node in htmlDoc.Body.Children)
            RenderBlockNode(col, node, imageBytesBySrc, publicViewUrl);
    }

    private static void RenderBlockNode(ColumnDescriptor col, IElement node, IReadOnlyDictionary<string, byte[]> imageBytesBySrc, string publicViewUrl)
    {
        // The custom video marker is technically a <div> — must be checked before the tag switch.
        if (node.HasAttribute("data-proposal-video"))
        {
            RenderVideoPlaceholder(col, node, imageBytesBySrc, publicViewUrl);
            return;
        }

        switch (node.TagName.ToUpperInvariant())
        {
            case "P":
                if (!string.IsNullOrWhiteSpace(node.TextContent))
                    col.Item().Text(text => RenderInlineNodes(text, node));
                break;
            case "H1":
                col.Item().Text(node.TextContent).FontSize(22).Bold();
                break;
            case "H2":
                col.Item().Text(node.TextContent).FontSize(18).Bold();
                break;
            case "H3":
                col.Item().Text(node.TextContent).FontSize(15).Bold();
                break;
            case "UL":
                RenderList(col, node, ordered: false);
                break;
            case "OL":
                RenderList(col, node, ordered: true);
                break;
            case "IMG":
                RenderImage(col, node.GetAttribute("src"), imageBytesBySrc);
                break;
            default:
                // Unknown/unsupported block-level tag — fall back to plain text rather than
                // silently dropping whatever Shanna wrote.
                if (!string.IsNullOrWhiteSpace(node.TextContent))
                    col.Item().Text(node.TextContent);
                break;
        }
    }

    private static void RenderInlineNodes(TextDescriptor text, INode parent)
    {
        foreach (var child in parent.ChildNodes)
        {
            if (child.NodeType == NodeType.Text)
            {
                if (!string.IsNullOrEmpty(child.TextContent)) text.Span(child.TextContent);
                continue;
            }

            if (child is not IElement el) continue;

            switch (el.TagName.ToUpperInvariant())
            {
                case "STRONG":
                case "B":
                    text.Span(el.TextContent).Bold();
                    break;
                case "EM":
                case "I":
                    text.Span(el.TextContent).Italic();
                    break;
                case "A":
                    var href = el.GetAttribute("href") ?? "";
                    text.Span(el.TextContent).Hyperlink(href).FontColor("#5f5248").Underline();
                    break;
                default:
                    if (!string.IsNullOrEmpty(el.TextContent)) text.Span(el.TextContent);
                    break;
            }
        }
    }

    private static void RenderList(ColumnDescriptor col, IElement listElement, bool ordered)
    {
        col.Item().Column(list =>
        {
            var index = 1;
            foreach (var li in listElement.Children)
            {
                if (!li.TagName.Equals("LI", StringComparison.OrdinalIgnoreCase)) continue;

                list.Item().Row(row =>
                {
                    row.ConstantItem(16).Text(ordered ? $"{index}." : "•");
                    row.RelativeItem().Text(li.TextContent);
                });
                index++;
            }
        });
    }

    private static void RenderImage(ColumnDescriptor col, string? src, IReadOnlyDictionary<string, byte[]> imageBytesBySrc)
    {
        if (string.IsNullOrWhiteSpace(src)) return;
        if (imageBytesBySrc.TryGetValue(src, out var bytes) && bytes.Length > 0)
            col.Item().Image(bytes).FitWidth();
    }

    private static void RenderVideoPlaceholder(ColumnDescriptor col, IElement node, IReadOnlyDictionary<string, byte[]> imageBytesBySrc, string publicViewUrl)
    {
        var poster = node.GetAttribute("data-poster");

        col.Item().Column(v =>
        {
            if (!string.IsNullOrWhiteSpace(poster) && imageBytesBySrc.TryGetValue(poster, out var posterBytes) && posterBytes.Length > 0)
            {
                v.Item().Image(posterBytes).FitWidth();
            }
            else
            {
                v.Item().Height(120).Background("#e5e0d8").AlignCenter().AlignMiddle().Text("Video").FontColor("#736456");
            }

            v.Item().PaddingTop(6).AlignCenter().Text(text =>
            {
                text.Span("▶ Watch this video online").FontColor("#5f5248").Underline().Hyperlink(publicViewUrl);
            });
        });
    }

    private static void RenderPricingTable(ColumnDescriptor col, IEnumerable<ProposalLineItem> lineItems)
    {
        var items = lineItems.ToList();

        col.Item().Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(4);
                columns.RelativeColumn(1);
            });

            table.Header(header =>
            {
                header.Cell().Text("Description").Bold();
                header.Cell().AlignRight().Text("Price").Bold();
            });

            foreach (var item in items)
            {
                table.Cell().PaddingVertical(4).Text(item.Description);
                table.Cell().PaddingVertical(4).AlignRight().Text(item.Price.ToString("C"));
            }
        });

        var total = items.Sum(i => i.Price);
        col.Item().PaddingTop(8).AlignRight().Text($"Total: {total:C}").Bold().FontSize(13);
    }
}
