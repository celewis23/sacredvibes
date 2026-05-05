using SacredVibes.Application.Features.Email.DTOs;

namespace SacredVibes.Application.Features.Email;

public interface IEmailMailboxService
{
    Task<EmailMailboxSettingsDto> GetSettingsAsync(CancellationToken ct = default);
    Task<EmailMailboxSettingsDto> SaveSettingsAsync(SaveEmailMailboxSettingsRequest request, CancellationToken ct = default);
    Task<EmailTestResultDto> TestConnectionAsync(CancellationToken ct = default);
    Task<List<EmailFolderDto>> GetFoldersAsync(CancellationToken ct = default);
    Task<EmailMessageListDto> GetMessagesAsync(string? folderId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<EmailMessageDto?> GetMessageAsync(string id, string? folderId, CancellationToken ct = default);
    Task SendAsync(SendEmailRequest request, CancellationToken ct = default);
    Task MarkReadAsync(string id, string? folderId, bool isRead, CancellationToken ct = default);
    Task MoveAsync(string id, string? folderId, string destinationFolderId, CancellationToken ct = default);
    Task DeleteAsync(string id, string? folderId, CancellationToken ct = default);
}
