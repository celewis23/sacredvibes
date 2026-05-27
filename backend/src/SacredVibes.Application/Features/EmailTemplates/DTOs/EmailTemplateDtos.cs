namespace SacredVibes.Application.Features.EmailTemplates.DTOs;

public class EmailTemplateDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public List<string> Variables { get; set; } = new();
}

public class SaveEmailTemplateRequest
{
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
}

public class PreviewEmailTemplateRequest
{
    public string ToEmail { get; set; } = string.Empty;
}
