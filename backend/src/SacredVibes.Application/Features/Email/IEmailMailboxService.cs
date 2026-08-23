using SacredVibes.Application.Features.Email.DTOs;

namespace SacredVibes.Application.Features.Email;

public interface IEmailMailboxService
{
    Task<EmailMailboxSettingsDto> GetSettingsAsync(CancellationToken ct = default);
    Task<EmailMailboxSettingsDto> SaveSettingsAsync(SaveEmailMailboxSettingsRequest request, CancellationToken ct = default);
    Task<EmailTestResultDto> TestConnectionAsync(CancellationToken ct = default);
    Task<List<EmailFolderDto>> GetFoldersAsync(CancellationToken ct = default);
    Task<EmailFolderDto> CreateFolderAsync(CreateEmailFolderRequest request, CancellationToken ct = default);
    Task DeleteFolderAsync(string folderId, CancellationToken ct = default);
    Task<EmailMessageListDto> GetMessagesAsync(string? folderId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<EmailMessageDto?> GetMessageAsync(string id, string? folderId, CancellationToken ct = default);
    Task<EmailAttachmentContentDto?> GetAttachmentAsync(string id, string? folderId, int index, CancellationToken ct = default);
    Task SendAsync(SendEmailRequest request, CancellationToken ct = default);
    Task MarkReadAsync(string id, string? folderId, bool isRead, CancellationToken ct = default);
    Task MoveAsync(string id, string? folderId, string destinationFolderId, CancellationToken ct = default);
    Task DeleteAsync(string id, string? folderId, CancellationToken ct = default);
    Task<BulkActionResultDto> MarkReadManyAsync(List<EmailMessageRefDto> messages, bool isRead, CancellationToken ct = default);
    Task<BulkActionResultDto> MoveManyAsync(List<EmailMessageRefDto> messages, string destinationFolderId, CancellationToken ct = default);
    Task<BulkActionResultDto> DeleteManyAsync(List<EmailMessageRefDto> messages, CancellationToken ct = default);
    Task<List<EmailContactDto>> SearchContactsAsync(string? search, int limit = 20, CancellationToken ct = default);
    Task<List<EmailRecipientGroupDto>> GetRecipientGroupsAsync(CancellationToken ct = default);
    Task<List<EmailContactDto>> GetGroupRecipientsAsync(string groupId, CancellationToken ct = default);
    Task<EmailRecipientGroupDto> CreateRecipientGroupAsync(CreateEmailRecipientGroupRequest request, CancellationToken ct = default);
    Task<List<EmailSignatureDto>> GetSignaturesAsync(CancellationToken ct = default);
    Task<EmailSignatureDto> SaveSignatureAsync(SaveEmailSignatureRequest request, CancellationToken ct = default);
    Task DeleteSignatureAsync(string id, CancellationToken ct = default);

    Task<List<EmailLayoutDto>> GetLayoutsAsync(CancellationToken ct = default);
    Task<EmailLayoutDto> SaveLayoutAsync(SaveEmailLayoutRequest request, CancellationToken ct = default);
    Task DeleteLayoutAsync(string id, CancellationToken ct = default);

    // Checks the INBOX for messages newer than the last poll and returns how many are new.
    // Returns 0 (without notifying) on the very first call, to avoid flagging the entire
    // existing mailbox history as "new". Throws if the mailbox integration isn't configured.
    Task<int> PollForNewMessagesAsync(CancellationToken ct = default);
}
