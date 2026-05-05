using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/email")]
public class EmailController : ControllerBase
{
    private readonly IEmailMailboxService _mailbox;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailMailboxService mailbox, ILogger<EmailController> logger)
    {
        _mailbox = mailbox;
        _logger = logger;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<EmailMailboxSettingsDto>>> GetSettings(CancellationToken ct)
    {
        var settings = await _mailbox.GetSettingsAsync(ct);
        return Ok(ApiResponse<EmailMailboxSettingsDto>.Ok(settings));
    }

    [HttpPut("settings")]
    public async Task<ActionResult<ApiResponse<EmailMailboxSettingsDto>>> SaveSettings(
        [FromBody] SaveEmailMailboxSettingsRequest request,
        CancellationToken ct)
    {
        var settings = await _mailbox.SaveSettingsAsync(request, ct);
        return Ok(ApiResponse<EmailMailboxSettingsDto>.Ok(settings));
    }

    [HttpPost("test")]
    public async Task<ActionResult<ApiResponse<EmailTestResultDto>>> Test(CancellationToken ct)
    {
        var result = await _mailbox.TestConnectionAsync(ct);
        return result.Success
            ? Ok(ApiResponse<EmailTestResultDto>.Ok(result))
            : BadRequest(ApiResponse<EmailTestResultDto>.Fail(result.Message));
    }

    [HttpGet("folders")]
    public async Task<ActionResult<ApiResponse<List<EmailFolderDto>>>> GetFolders(CancellationToken ct)
    {
        var folders = await _mailbox.GetFoldersAsync(ct);
        return Ok(ApiResponse<List<EmailFolderDto>>.Ok(folders));
    }

    [HttpGet("messages")]
    public async Task<ActionResult<ApiResponse<EmailMessageListDto>>> GetMessages(
        [FromQuery] string? folderId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var messages = await _mailbox.GetMessagesAsync(folderId, page, pageSize, search, ct);
        return Ok(ApiResponse<EmailMessageListDto>.Ok(messages));
    }

    [HttpGet("messages/{id}")]
    public async Task<ActionResult<ApiResponse<EmailMessageDto>>> GetMessage(
        string id,
        [FromQuery] string? folderId,
        CancellationToken ct)
    {
        var message = await _mailbox.GetMessageAsync(id, folderId, ct);
        return message is null ? NotFound() : Ok(ApiResponse<EmailMessageDto>.Ok(message));
    }

    [HttpPost("send")]
    public async Task<ActionResult> Send([FromBody] SendEmailRequest request, CancellationToken ct)
    {
        try
        {
            await _mailbox.SendAsync(request, ct);
            return Ok(new { message = "Email sent" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (FormatException)
        {
            return BadRequest(ApiResponse<object>.Fail("One or more attachments could not be read. Remove the attachment and try again."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected email send failure");
            return BadRequest(ApiResponse<object>.Fail($"Email send failed: {ex.Message}"));
        }
    }

    [HttpPatch("messages/{id}/read")]
    public async Task<ActionResult> MarkRead(
        string id,
        [FromQuery] string? folderId,
        [FromBody] EmailMarkRequest request,
        CancellationToken ct)
    {
        await _mailbox.MarkReadAsync(id, folderId, request.IsRead, ct);
        return Ok(new { message = request.IsRead ? "Marked as read" : "Marked as unread" });
    }

    [HttpPost("messages/{id}/move")]
    public async Task<ActionResult> Move(
        string id,
        [FromQuery] string? folderId,
        [FromBody] EmailMoveRequest request,
        CancellationToken ct)
    {
        await _mailbox.MoveAsync(id, folderId, request.DestinationFolderId, ct);
        return Ok(new { message = "Message moved" });
    }

    [HttpDelete("messages/{id}")]
    public async Task<ActionResult> Delete(string id, [FromQuery] string? folderId, CancellationToken ct)
    {
        await _mailbox.DeleteAsync(id, folderId, ct);
        return Ok(new { message = "Message deleted" });
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<ApiResponse<List<EmailContactDto>>>> SearchContacts(
        [FromQuery] string? search,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var contacts = await _mailbox.SearchContactsAsync(search, limit, ct);
        return Ok(ApiResponse<List<EmailContactDto>>.Ok(contacts));
    }

    [HttpGet("recipient-groups")]
    public async Task<ActionResult<ApiResponse<List<EmailRecipientGroupDto>>>> GetRecipientGroups(CancellationToken ct)
    {
        var groups = await _mailbox.GetRecipientGroupsAsync(ct);
        return Ok(ApiResponse<List<EmailRecipientGroupDto>>.Ok(groups));
    }

    [HttpPost("recipient-groups")]
    public async Task<ActionResult<ApiResponse<EmailRecipientGroupDto>>> CreateRecipientGroup(
        [FromBody] CreateEmailRecipientGroupRequest request,
        CancellationToken ct)
    {
        var group = await _mailbox.CreateRecipientGroupAsync(request, ct);
        return Ok(ApiResponse<EmailRecipientGroupDto>.Ok(group));
    }

    [HttpGet("recipient-groups/{groupId}/contacts")]
    public async Task<ActionResult<ApiResponse<List<EmailContactDto>>>> GetRecipientGroupContacts(
        string groupId,
        CancellationToken ct)
    {
        var contacts = await _mailbox.GetGroupRecipientsAsync(Uri.UnescapeDataString(groupId), ct);
        return Ok(ApiResponse<List<EmailContactDto>>.Ok(contacts));
    }
}
