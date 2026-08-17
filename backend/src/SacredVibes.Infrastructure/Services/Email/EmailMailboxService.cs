using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Sockets;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text.Json.Serialization;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Net.Smtp;
using MailKit.Search;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Email;

public class EmailMailboxService : IEmailMailboxService
{
    private const string Provider = "Email";
    private static readonly TimeSpan ImapTimeout = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan SmtpSendTimeout = TimeSpan.FromSeconds(45);
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EmailMailboxService> _logger;

    public EmailMailboxService(AppDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<EmailMailboxService> logger)
    {
        _db = db;
        _config = config;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<EmailMailboxSettingsDto> GetSettingsAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var settings = ReadSettings(setting);
        return ToDto(setting, settings);
    }

    public async Task<EmailMailboxSettingsDto> SaveSettingsAsync(SaveEmailMailboxSettingsRequest request, CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var existing = ReadSettings(setting);
        var defaultHost = DefaultMailHost(request.EmailAddress);

        var next = new StoredEmailSettings
        {
            EmailAddress = Normalize(request.EmailAddress),
            FromName = request.FromName.Trim(),
            ImapHost = Normalize(request.ImapHost) is { Length: > 0 } imapHost ? imapHost : defaultHost,
            ImapPort = request.ImapPort <= 0 ? 993 : request.ImapPort,
            ImapUseSsl = request.ImapUseSsl,
            SmtpHost = Normalize(request.SmtpHost) is { Length: > 0 } smtpHost ? smtpHost : defaultHost,
            SmtpPort = request.SmtpPort <= 0 ? 465 : request.SmtpPort,
            SmtpUseSsl = request.SmtpUseSsl,
            Username = Normalize(request.Username),
            ProtectedPassword = string.IsNullOrWhiteSpace(request.Password)
                ? existing.ProtectedPassword
                : ProtectSecret(request.Password)
        };

        setting.IsEnabled = request.IsEnabled;
        setting.SettingsJson = JsonSerializer.Serialize(next);
        setting.LastSyncResult = "Settings saved";
        await _db.SaveChangesAsync(ct);

        return ToDto(setting, next);
    }

    public async Task<EmailTestResultDto> TestConnectionAsync(CancellationToken ct = default)
    {
        try
        {
            var settings = await GetRequiredSettingsAsync(ct);
            int inboxCount;
            try
            {
                using var imap = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
                var inbox = imap.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadOnly, ct);
                inboxCount = inbox.Count;
                await imap.DisconnectAsync(true, ct);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"IMAP failed for {settings.ImapHost}:{settings.ImapPort}: {ex.Message}", ex);
            }

            try
            {
                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(settings.SmtpHost, settings.SmtpPort, SocketOptions(settings.SmtpUseSsl), ct);
                await smtp.AuthenticateAsync(settings.Username, settings.Password, ct);
                await smtp.DisconnectAsync(true, ct);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"SMTP failed for {settings.SmtpHost}:{settings.SmtpPort}: {ex.Message}", ex);
            }

            await UpdateSyncResultAsync(true, $"Connected to inbox with {inboxCount} messages", ct);
            return new EmailTestResultDto { Success = true, Message = $"Mailbox connection succeeded. Inbox has {inboxCount} messages." };
        }
        catch (Exception ex)
        {
            await UpdateSyncResultAsync(false, ex.Message, ct);
            return new EmailTestResultDto { Success = false, Message = ex.Message };
        }
    }

    public async Task<List<EmailFolderDto>> GetFoldersAsync(CancellationToken ct = default)
    {
        var settings = await GetRequiredSettingsAsync(ct);
        using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);

        var folders = new List<EmailFolderDto>();
        await AddFolderAsync(client.Inbox, folders, "Inbox", ct);

        foreach (var ns in client.PersonalNamespaces)
        {
            var root = client.GetFolder(ns);
            var children = await root.GetSubfoldersAsync(false, ct);
            foreach (var folder in children.OrderBy(f => f.Name))
            {
                if (folder.FullName.Equals(client.Inbox.FullName, StringComparison.OrdinalIgnoreCase)) continue;
                await AddFolderAsync(folder, folders, null, ct);
            }
        }

        await client.DisconnectAsync(true, ct);
        return folders;
    }

    public async Task<EmailMessageListDto> GetMessagesAsync(string? folderId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var settings = await GetRequiredSettingsAsync(ct);
        using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
        var folder = await GetFolderAsync(client, folderId, ct);
        await folder.OpenAsync(FolderAccess.ReadOnly, ct);

        var ids = await folder.SearchAsync(SearchQuery.All, ct);
        var ordered = ids.OrderByDescending(i => i.Id).ToList();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            var summaries = await folder.FetchAsync(ordered, MessageSummaryItems.Envelope | MessageSummaryItems.UniqueId | MessageSummaryItems.Flags, ct);
            ordered = summaries
                .Where(s => Contains(s.Envelope?.Subject, needle) ||
                            Contains(s.Envelope?.From?.ToString(), needle) ||
                            Contains(s.Envelope?.To?.ToString(), needle))
                .OrderByDescending(s => s.UniqueId.Id)
                .Select(s => s.UniqueId)
                .ToList();
        }

        var total = ordered.Count;
        var pageIds = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var messages = new List<EmailMessageSummaryDto>();
        foreach (var id in pageIds)
        {
            var message = await folder.GetMessageAsync(id, ct);
            var flags = await GetFlagsAsync(folder, id, ct);
            messages.Add(ToSummaryDto(message, id, folder.FullName, flags));
        }

        await client.DisconnectAsync(true, ct);
        return new EmailMessageListDto
        {
            FolderId = folder.FullName,
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
            Items = messages
        };
    }

    public async Task<EmailMessageDto?> GetMessageAsync(string id, string? folderId, CancellationToken ct = default)
    {
        var uid = ParseUid(id);
        var settings = await GetRequiredSettingsAsync(ct);
        using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
        var folder = await GetFolderAsync(client, folderId, ct);
        await folder.OpenAsync(FolderAccess.ReadWrite, ct);

        var message = await folder.GetMessageAsync(uid, ct);
        await folder.AddFlagsAsync(uid, MessageFlags.Seen, true, ct);
        var flags = await GetFlagsAsync(folder, uid, ct);
        await client.DisconnectAsync(true, ct);

        return ToMessageDto(message, uid, folder.FullName, flags);
    }

    public async Task SendAsync(SendEmailRequest request, CancellationToken ct = default)
    {
        request.To ??= new List<string>();
        request.Cc ??= new List<string>();
        request.Bcc ??= new List<string>();
        request.Attachments ??= new List<SendEmailAttachmentRequest>();

        if (request.To.Count + request.Cc.Count + request.Bcc.Count == 0)
            throw new InvalidOperationException("At least one recipient is required.");

        var resendApiKey = GetResendApiKey();
        var settings = !string.IsNullOrWhiteSpace(resendApiKey)
            ? await GetRequiredSettingsAsync(ct, requireMailboxSettings: false)
            : await GetRequiredSettingsAsync(ct);

        var message = BuildMimeMessage(settings, request);

        if (!string.IsNullOrWhiteSpace(resendApiKey))
            await SendWithResendAsync(settings, request, resendApiKey, ct);
        else
            await SendWithSmtpAsync(settings, message, ct);

        await ArchiveSentCopyAsync(settings, message, ct);
    }

    private static MimeMessage BuildMimeMessage(ResolvedEmailSettings settings, SendEmailRequest request)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName, settings.EmailAddress));
        AddRecipients(message.To, request.To);
        AddRecipients(message.Cc, request.Cc);
        AddRecipients(message.Bcc, request.Bcc);
        message.Subject = request.Subject.Trim();
        var bodyBuilder = new BodyBuilder();
        if (request.IsHtml) bodyBuilder.HtmlBody = request.Body;
        else bodyBuilder.TextBody = request.Body;

        foreach (var attachment in request.Attachments)
        {
            if (string.IsNullOrWhiteSpace(attachment.FileName) || string.IsNullOrWhiteSpace(attachment.Base64Content))
                continue;

            var content = Convert.FromBase64String(attachment.Base64Content);
            ContentType contentType;
            try
            {
                contentType = ContentType.Parse(attachment.ContentType);
            }
            catch
            {
                contentType = new ContentType("application", "octet-stream");
            }
            bodyBuilder.Attachments.Add(attachment.FileName, content, contentType);
        }

        message.Body = bodyBuilder.ToMessageBody();
        return message;
    }

    private async Task SendWithSmtpAsync(ResolvedEmailSettings settings, MimeMessage message, CancellationToken ct)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(SmtpSendTimeout);

        try
        {
            using var smtp = new SmtpClient { Timeout = (int)SmtpSendTimeout.TotalMilliseconds };
            await smtp.ConnectAsync(settings.SmtpHost, settings.SmtpPort, SocketOptions(settings.SmtpUseSsl), timeoutCts.Token);
            await smtp.AuthenticateAsync(settings.Username, settings.Password, timeoutCts.Token);
            await smtp.SendAsync(message, timeoutCts.Token);
            await smtp.DisconnectAsync(true, timeoutCts.Token);
        }
        catch (OperationCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new InvalidOperationException("Sending mail timed out while connecting to the mailbox SMTP server. Try a smaller message or verify the SMTP host, port, SSL setting, and cPanel mailbox password.", ex);
        }
        catch (SmtpCommandException ex)
        {
            throw new InvalidOperationException($"SMTP rejected the message: {ex.Message}", ex);
        }
        catch (SmtpProtocolException ex)
        {
            throw new InvalidOperationException($"SMTP protocol error while sending: {ex.Message}", ex);
        }
        catch (System.Security.Authentication.AuthenticationException ex)
        {
            throw new InvalidOperationException($"SMTP authentication failed: {ex.Message}", ex);
        }
        catch (SocketException ex)
        {
            throw new InvalidOperationException($"SMTP connection failed for {settings.SmtpHost}:{settings.SmtpPort}: {ex.Message}", ex);
        }
        catch (IOException ex)
        {
            throw new InvalidOperationException($"SMTP network error while sending: {ex.Message}", ex);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            throw new InvalidOperationException($"SMTP send failed: {ex.Message}", ex);
        }
    }

    private async Task SendWithResendAsync(ResolvedEmailSettings settings, SendEmailRequest request, string apiKey, CancellationToken ct)
    {
        if (request.To.Count == 0 && request.Bcc.Count > 0 && request.Cc.Count == 0)
        {
            foreach (var recipient in request.Bcc)
            {
                await SendSingleResendEmailAsync(settings, request, apiKey, new List<string> { recipient }, new List<string>(), new List<string>(), ct);
            }

            return;
        }

        await SendSingleResendEmailAsync(settings, request, apiKey, request.To.Count > 0 ? request.To : new List<string> { settings.EmailAddress }, request.Cc, request.Bcc, ct);
    }

    private async Task SendSingleResendEmailAsync(
        ResolvedEmailSettings settings,
        SendEmailRequest request,
        string apiKey,
        List<string> to,
        List<string> cc,
        List<string> bcc,
        CancellationToken ct)
    {
        if (to.Count > 50)
            throw new InvalidOperationException("Resend allows up to 50 visible recipients per email. Use a recipient group or fewer To recipients.");

        var payload = new ResendEmailRequest
        {
            From = FormatResendFrom(settings),
            To = to,
            Cc = cc.Count > 0 ? cc : null,
            Bcc = bcc.Count > 0 ? bcc : null,
            Subject = request.Subject.Trim(),
            Html = request.IsHtml ? request.Body : null,
            Text = request.IsHtml ? null : request.Body,
            ReplyTo = GetResendReplyToEmail(settings),
            Attachments = request.Attachments
                .Where(a => !string.IsNullOrWhiteSpace(a.FileName) && !string.IsNullOrWhiteSpace(a.Base64Content))
                .Select(a => new ResendAttachment
                {
                    Filename = a.FileName,
                    Content = a.Base64Content
                })
                .ToList()
        };

        if (payload.Attachments.Count == 0)
            payload.Attachments = null;

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/emails");
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var client = _httpClientFactory.CreateClient("Resend");
        using var response = await client.SendAsync(httpRequest, ct);
        var responseBody = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Resend send failed ({(int)response.StatusCode}): {ExtractResendError(responseBody)}");
        }
    }

    private async Task ArchiveSentCopyAsync(ResolvedEmailSettings settings, MimeMessage message, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(settings.ImapHost) ||
            string.IsNullOrWhiteSpace(settings.Username) ||
            string.IsNullOrWhiteSpace(settings.Password))
        {
            return;
        }

        try
        {
            using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
            var sentFolder = await FindOrCreateSentFolderAsync(client, ct);
            await sentFolder.AppendAsync(message, MessageFlags.Seen, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to archive sent email copy to the mailbox Sent folder");
        }
    }

    private static async Task<IMailFolder> FindOrCreateSentFolderAsync(ImapClient client, CancellationToken ct)
    {
        try
        {
            var special = client.GetFolder(SpecialFolder.Sent);
            if (special is not null) return special;
        }
        catch (NotSupportedException)
        {
        }

        foreach (var ns in client.PersonalNamespaces)
        {
            var root = client.GetFolder(ns);
            var children = await root.GetSubfoldersAsync(false, ct);
            var match = children.FirstOrDefault(f => f.Name.Equals("Sent", StringComparison.OrdinalIgnoreCase))
                ?? children.FirstOrDefault(f => f.Name.IndexOf("Sent", StringComparison.OrdinalIgnoreCase) >= 0);
            if (match is not null) return match;
        }

        var personalRoot = client.GetFolder(client.PersonalNamespaces[0]);
        return await personalRoot.CreateAsync("Sent", true, ct);
    }

    public async Task MarkReadAsync(string id, string? folderId, bool isRead, CancellationToken ct = default)
    {
        var uid = ParseUid(id);
        var settings = await GetRequiredSettingsAsync(ct);
        using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
        var folder = await GetFolderAsync(client, folderId, ct);
        await folder.OpenAsync(FolderAccess.ReadWrite, ct);
        if (isRead) await folder.AddFlagsAsync(uid, MessageFlags.Seen, true, ct);
        else await folder.RemoveFlagsAsync(uid, MessageFlags.Seen, true, ct);
        await client.DisconnectAsync(true, ct);
    }

    public async Task MoveAsync(string id, string? folderId, string destinationFolderId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(destinationFolderId)) throw new InvalidOperationException("Destination folder is required.");
        var uid = ParseUid(id);
        var settings = await GetRequiredSettingsAsync(ct);
        using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
        var source = await GetFolderAsync(client, folderId, ct);
        var destination = await GetFolderAsync(client, destinationFolderId, ct);
        await source.OpenAsync(FolderAccess.ReadWrite, ct);
        await source.MoveToAsync(uid, destination, ct);
        await client.DisconnectAsync(true, ct);
    }

    public async Task DeleteAsync(string id, string? folderId, CancellationToken ct = default)
    {
        var uid = ParseUid(id);
        var settings = await GetRequiredSettingsAsync(ct);
        using var client = await CreateOpenImapClientAsync(settings, settings.ImapHost, settings.ImapPort, settings.ImapUseSsl, ct);
        var folder = await GetFolderAsync(client, folderId, ct);
        await folder.OpenAsync(FolderAccess.ReadWrite, ct);
        await folder.AddFlagsAsync(uid, MessageFlags.Deleted, true, ct);
        await folder.ExpungeAsync(ct);
        await client.DisconnectAsync(true, ct);
    }

    public async Task<List<EmailContactDto>> SearchContactsAsync(string? search, int limit = 20, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 50);
        var needle = Normalize(search);
        var contacts = new Dictionary<string, EmailContactDto>(StringComparer.OrdinalIgnoreCase);

        var subscriberQuery = _db.Subscribers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(needle))
        {
            subscriberQuery = subscriberQuery.Where(s =>
                s.Email.Contains(needle) ||
                (s.FirstName != null && s.FirstName.Contains(needle)) ||
                (s.LastName != null && s.LastName.Contains(needle)));
        }

        var subscribers = await subscriberQuery
            .OrderByDescending(s => s.IsSubscribed)
            .ThenBy(s => s.Email)
            .Take(limit)
            .Select(s => new
            {
                s.Email,
                s.FirstName,
                s.LastName,
                Source = $"Subscriber: {s.Source}"
            })
            .ToListAsync(ct);

        foreach (var s in subscribers)
            AddContact(contacts, s.Email, JoinName(s.FirstName, s.LastName), s.Source);

        if (contacts.Count < limit)
        {
            var leadQuery = _db.Leads.Where(l => l.Email != null && l.Email != "");
            if (!string.IsNullOrWhiteSpace(needle))
            {
                leadQuery = leadQuery.Where(l =>
                    l.Email!.Contains(needle) ||
                    (l.FirstName != null && l.FirstName.Contains(needle)) ||
                    (l.LastName != null && l.LastName.Contains(needle)));
            }

            var leads = await leadQuery
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit)
                .Select(l => new { Email = l.Email!, l.FirstName, l.LastName })
                .ToListAsync(ct);

            foreach (var l in leads)
                AddContact(contacts, l.Email, JoinName(l.FirstName, l.LastName), "Lead");
        }

        if (contacts.Count < limit)
        {
            var bookingQuery = _db.Bookings.Where(b => b.CustomerEmail != "");
            if (!string.IsNullOrWhiteSpace(needle))
            {
                bookingQuery = bookingQuery.Where(b =>
                    b.CustomerEmail.Contains(needle) ||
                    b.CustomerName.Contains(needle));
            }

            var bookings = await bookingQuery
                .OrderByDescending(b => b.CreatedAt)
                .Take(limit)
                .Select(b => new { Email = b.CustomerEmail, Name = b.CustomerName })
                .ToListAsync(ct);

            foreach (var b in bookings)
                AddContact(contacts, b.Email, b.Name, "Booking");
        }

        return contacts.Values
            .OrderBy(c => c.Name.Length == 0 ? c.Email : c.Name)
            .Take(limit)
            .ToList();
    }

    public async Task<List<EmailRecipientGroupDto>> GetRecipientGroupsAsync(CancellationToken ct = default)
    {
        var groups = new List<EmailRecipientGroupDto>
        {
            new()
            {
                Id = "subscribers:all",
                Name = "All subscribers",
                Type = "Subscriber List",
                Count = await _db.Subscribers.CountAsync(ct)
            },
            new()
            {
                Id = "subscribers:subscribed",
                Name = "Subscribed contacts",
                Type = "Subscriber List",
                Count = await _db.Subscribers.CountAsync(s => s.IsSubscribed, ct)
            }
        };

        var sourceGroups = await _db.Subscribers
            .GroupBy(s => s.Source)
            .Select(g => new EmailRecipientGroupDto
            {
                Id = "source:" + g.Key.ToString(),
                Name = g.Key + " contacts",
                Type = "Import Source",
                Count = g.Count()
            })
            .ToListAsync(ct);
        groups.AddRange(sourceGroups);

        var tagGroups = await _db.SubscriberTags
            .Select(t => new EmailRecipientGroupDto
            {
                Id = "tag:" + t.Id,
                Name = t.Name,
                Type = "Subscriber Tag",
                Count = t.SubscriberTagMaps.Count
            })
            .OrderBy(t => t.Name)
            .ToListAsync(ct);
        groups.AddRange(tagGroups);

        return groups.Where(g => g.Count > 0).ToList();
    }

    public async Task<List<EmailContactDto>> GetGroupRecipientsAsync(string groupId, CancellationToken ct = default)
    {
        var query = _db.Subscribers.AsQueryable();

        if (groupId.Equals("subscribers:subscribed", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.IsSubscribed);
        }
        else if (groupId.StartsWith("source:", StringComparison.OrdinalIgnoreCase))
        {
            var sourceText = groupId["source:".Length..];
            if (!Enum.TryParse<ImportSource>(sourceText, true, out var source))
                throw new InvalidOperationException("Unknown recipient source group.");
            query = query.Where(s => s.Source == source);
        }
        else if (groupId.StartsWith("tag:", StringComparison.OrdinalIgnoreCase))
        {
            if (!Guid.TryParse(groupId["tag:".Length..], out var tagId))
                throw new InvalidOperationException("Unknown recipient tag group.");
            query = query.Where(s => s.SubscriberTagMaps.Any(m => m.SubscriberTagId == tagId));
        }
        else if (!groupId.Equals("subscribers:all", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Unknown recipient group.");
        }

        return await query
            .OrderBy(s => s.Email)
            .Select(s => new EmailContactDto
            {
                Email = s.Email,
                Name = ((s.FirstName ?? "") + " " + (s.LastName ?? "")).Trim(),
                Source = "Subscriber: " + s.Source
            })
            .ToListAsync(ct);
    }

    public async Task<EmailRecipientGroupDto> CreateRecipientGroupAsync(CreateEmailRecipientGroupRequest request, CancellationToken ct = default)
    {
        var name = Normalize(request.Name);
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Group name is required.");

        var emails = UniqueEmails(request.Emails ?? Enumerable.Empty<string>());
        if (emails.Count == 0)
            throw new InvalidOperationException("At least one recipient is required to create a group.");

        var baseSlug = Slugify(name);
        var slug = baseSlug;
        var suffix = 2;
        while (await _db.SubscriberTags.AnyAsync(t => t.Slug == slug, ct))
        {
            slug = $"{baseSlug}-{suffix++}";
        }

        var tag = new SubscriberTag
        {
            Name = name,
            Slug = slug,
            Color = "#7B6E5D",
            Description = "Email recipient group"
        };
        await _db.SubscriberTags.AddAsync(tag, ct);

        var existingSubscribers = await _db.Subscribers
            .Where(s => emails.Contains(s.Email.ToLower()))
            .ToListAsync(ct);
        var subscribersByEmail = existingSubscribers.ToDictionary(s => s.Email.ToLowerInvariant(), StringComparer.OrdinalIgnoreCase);

        foreach (var email in emails)
        {
            if (!subscribersByEmail.TryGetValue(email, out var subscriber))
            {
                subscriber = new Subscriber
                {
                    Email = email,
                    Source = ImportSource.Manual,
                    IsSubscribed = true,
                    ConsentStatus = ConsentStatus.Unknown,
                    ConsentMethod = "Admin email group"
                };
                await _db.Subscribers.AddAsync(subscriber, ct);
                subscribersByEmail[email] = subscriber;
            }

            subscriber.SubscriberTagMaps.Add(new SubscriberTagMap
            {
                Subscriber = subscriber,
                SubscriberTag = tag,
                TaggedAt = DateTime.UtcNow,
                TaggedBy = "Admin email"
            });
        }

        await _db.SaveChangesAsync(ct);

        return new EmailRecipientGroupDto
        {
            Id = "tag:" + tag.Id,
            Name = tag.Name,
            Type = "Subscriber Tag",
            Count = emails.Count
        };
    }

    public async Task<List<EmailSignatureDto>> GetSignaturesAsync(CancellationToken ct = default)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        var settings = ReadSettings(setting);
        EnsureDefaultSignatures(settings);
        return settings.Signatures
            .OrderByDescending(s => s.IsDefault)
            .ThenBy(s => s.Name)
            .Select(ToSignatureDto)
            .ToList();
    }

    public async Task<EmailSignatureDto> SaveSignatureAsync(SaveEmailSignatureRequest request, CancellationToken ct = default)
    {
        var name = Normalize(request.Name);
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Signature name is required.");
        if (string.IsNullOrWhiteSpace(request.Html))
            throw new InvalidOperationException("Signature content is required.");

        var setting = await GetOrCreateSettingAsync(ct);
        var settings = ReadSettings(setting);
        EnsureDefaultSignatures(settings);

        var signature = !string.IsNullOrWhiteSpace(request.Id)
            ? settings.Signatures.FirstOrDefault(s => s.Id.Equals(request.Id, StringComparison.OrdinalIgnoreCase))
            : null;

        if (signature is null)
        {
            signature = new StoredEmailSignature { Id = Guid.NewGuid().ToString("N") };
            settings.Signatures.Add(signature);
        }

        signature.Name = name;
        signature.Html = request.Html.Trim();
        signature.IsDefault = request.IsDefault || settings.Signatures.Count == 1;

        if (signature.IsDefault)
        {
            foreach (var other in settings.Signatures.Where(s => s.Id != signature.Id))
                other.IsDefault = false;
        }

        setting.SettingsJson = JsonSerializer.Serialize(settings);
        await _db.SaveChangesAsync(ct);

        return ToSignatureDto(signature);
    }

    public async Task DeleteSignatureAsync(string id, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new InvalidOperationException("Signature id is required.");

        var setting = await GetOrCreateSettingAsync(ct);
        var settings = ReadSettings(setting);
        EnsureDefaultSignatures(settings);

        var removed = settings.Signatures.RemoveAll(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase)) > 0;
        if (!removed)
            throw new InvalidOperationException("Signature not found.");

        if (settings.Signatures.Count > 0 && !settings.Signatures.Any(s => s.IsDefault))
            settings.Signatures[0].IsDefault = true;

        setting.SettingsJson = JsonSerializer.Serialize(settings);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<IntegrationSetting> GetOrCreateSettingAsync(CancellationToken ct)
    {
        var setting = await _db.IntegrationSettings.FirstOrDefaultAsync(i => i.Provider == Provider, ct);
        if (setting is not null) return setting;

        setting = new IntegrationSetting { Provider = Provider, SettingsJson = "{}", IsEnabled = false };
        await _db.IntegrationSettings.AddAsync(setting, ct);
        await _db.SaveChangesAsync(ct);
        return setting;
    }

    private async Task<ResolvedEmailSettings> GetRequiredSettingsAsync(CancellationToken ct, bool requireMailboxSettings = true)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        if (!setting.IsEnabled) throw new InvalidOperationException("Email inbox integration is disabled.");

        var stored = ReadSettings(setting);
        var password = ResolvePassword(stored);
        var resolved = new ResolvedEmailSettings
        {
            EmailAddress = ResolveValue("EMAIL_FROM_ADDRESS", stored.EmailAddress),
            FromName = ResolveValue("EMAIL_FROM_NAME", stored.FromName),
            ImapHost = ResolveValue("EMAIL_IMAP_HOST", stored.ImapHost),
            ImapPort = ResolveInt("EMAIL_IMAP_PORT", stored.ImapPort),
            ImapUseSsl = ResolveBool("EMAIL_IMAP_SSL", stored.ImapUseSsl),
            SmtpHost = ResolveValue("EMAIL_SMTP_HOST", stored.SmtpHost),
            SmtpPort = ResolveInt("EMAIL_SMTP_PORT", stored.SmtpPort),
            SmtpUseSsl = ResolveBool("EMAIL_SMTP_SSL", stored.SmtpUseSsl),
            Username = ResolveValue("EMAIL_USERNAME", stored.Username),
            Password = password
        };

        if (!requireMailboxSettings)
        {
            if (string.IsNullOrWhiteSpace(GetResendFromEmail(resolved)))
                throw new InvalidOperationException("Resend sender email is not configured. Set RESEND_FROM_EMAIL or save an email address in admin email settings.");

            return resolved;
        }

        if (string.IsNullOrWhiteSpace(resolved.ImapHost) ||
            string.IsNullOrWhiteSpace(resolved.SmtpHost) ||
            string.IsNullOrWhiteSpace(resolved.Username) ||
            string.IsNullOrWhiteSpace(resolved.Password))
        {
            throw new InvalidOperationException("Email inbox integration is missing IMAP/SMTP settings or mailbox password.");
        }

        return resolved;
    }

    private StoredEmailSettings ReadSettings(IntegrationSetting setting)
    {
        try
        {
            return JsonSerializer.Deserialize<StoredEmailSettings>(setting.SettingsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new StoredEmailSettings();
        }
        catch
        {
            return new StoredEmailSettings();
        }
    }

    private EmailMailboxSettingsDto ToDto(IntegrationSetting setting, StoredEmailSettings settings) => new()
    {
        IsEnabled = setting.IsEnabled,
        EmailAddress = settings.EmailAddress,
        FromName = settings.FromName,
        ImapHost = settings.ImapHost,
        ImapPort = settings.ImapPort,
        ImapUseSsl = settings.ImapUseSsl,
        SmtpHost = settings.SmtpHost,
        SmtpPort = settings.SmtpPort,
        SmtpUseSsl = settings.SmtpUseSsl,
        Username = settings.Username,
        HasPassword = !string.IsNullOrWhiteSpace(ResolvePassword(settings)),
        LastSyncAt = setting.LastSyncAt,
        LastSyncResult = setting.LastSyncResult
    };

    private async Task<ImapClient> CreateOpenImapClientAsync(ResolvedEmailSettings settings, string host, int port, bool useSsl, CancellationToken ct)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(ImapTimeout);

        var client = new ImapClient { Timeout = (int)ImapTimeout.TotalMilliseconds };
        try
        {
            await client.ConnectAsync(host, port, SocketOptions(useSsl), timeoutCts.Token);
            await client.AuthenticateAsync(settings.Username, settings.Password, timeoutCts.Token);
            return client;
        }
        catch (OperationCanceledException ex) when (!ct.IsCancellationRequested)
        {
            client.Dispose();
            throw new InvalidOperationException($"IMAP connection timed out for {host}:{port}. Verify the mailbox host, port, SSL setting, DNS records, and cPanel mailbox password.", ex);
        }
        catch (SocketException ex)
        {
            client.Dispose();
            throw new InvalidOperationException($"IMAP connection failed for {host}:{port}: {ex.Message}", ex);
        }
        catch (MailKit.Security.AuthenticationException ex)
        {
            client.Dispose();
            throw new InvalidOperationException($"IMAP authentication failed: {ex.Message}", ex);
        }
        catch
        {
            client.Dispose();
            throw;
        }
    }

    private Task<IMailFolder> GetFolderAsync(ImapClient client, string? folderId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(folderId) || folderId.Equals("INBOX", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(client.Inbox);

        return Task.FromResult(client.GetFolder(folderId));
    }

    private async Task AddFolderAsync(IMailFolder folder, List<EmailFolderDto> folders, string? displayName, CancellationToken ct)
    {
        try
        {
            await folder.OpenAsync(FolderAccess.ReadOnly, ct);
            var unread = await folder.SearchAsync(SearchQuery.NotSeen, ct);
            folders.Add(new EmailFolderDto
            {
                Id = folder.FullName,
                Name = displayName ?? folder.Name,
                TotalCount = folder.Count,
                UnreadCount = unread.Count
            });
            await folder.CloseAsync(false, ct);
        }
        catch
        {
            folders.Add(new EmailFolderDto { Id = folder.FullName, Name = displayName ?? folder.Name });
        }
    }

    private static EmailMessageSummaryDto ToSummaryDto(MimeMessage message, UniqueId id, string folderId, MessageFlags flags)
    {
        var text = message.TextBody ?? StripHtml(message.HtmlBody ?? string.Empty);
        return new EmailMessageSummaryDto
        {
            Id = id.Id.ToString(),
            FolderId = folderId,
            Subject = message.Subject ?? "(no subject)",
            From = ToAddressDto(message.From.Mailboxes.FirstOrDefault()),
            To = message.To.Mailboxes.Select(ToAddressDto).OfType<EmailAddressDto>().ToList(),
            Date = message.Date,
            IsRead = flags.HasFlag(MessageFlags.Seen),
            HasAttachments = message.Attachments.Any(),
            Preview = MakePreview(text)
        };
    }

    private static async Task<MessageFlags> GetFlagsAsync(IMailFolder folder, UniqueId id, CancellationToken ct)
    {
        var summaries = await folder.FetchAsync(new[] { id }, MessageSummaryItems.Flags, ct);
        return summaries.FirstOrDefault()?.Flags ?? MessageFlags.None;
    }

    private static EmailMessageDto ToMessageDto(MimeMessage message, UniqueId id, string folderId, MessageFlags flags)
    {
        var summary = ToSummaryDto(message, id, folderId, flags);
        return new EmailMessageDto
        {
            Id = summary.Id,
            FolderId = summary.FolderId,
            Subject = summary.Subject,
            From = summary.From,
            To = summary.To,
            Date = summary.Date,
            IsRead = summary.IsRead,
            HasAttachments = summary.HasAttachments,
            Preview = summary.Preview,
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody,
            Cc = message.Cc.Mailboxes.Select(ToAddressDto).OfType<EmailAddressDto>().ToList(),
            Attachments = message.Attachments.Select(a => new EmailAttachmentDto
            {
                FileName = a.ContentDisposition?.FileName ?? a.ContentType.Name ?? "attachment",
                ContentType = a.ContentType.MimeType,
                Size = a.ContentDisposition?.Size
            }).ToList()
        };
    }

    private string ResolvePassword(StoredEmailSettings settings)
    {
        var env = ResolveValue("EMAIL_PASSWORD", string.Empty);
        if (!string.IsNullOrWhiteSpace(env)) return env;
        if (string.IsNullOrWhiteSpace(settings.ProtectedPassword)) return string.Empty;

        try { return UnprotectSecret(settings.ProtectedPassword); }
        catch { return string.Empty; }
    }

    private string ProtectSecret(string value)
    {
        var key = GetCredentialKey();
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plaintext = Encoding.UTF8.GetBytes(value);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(key, 16);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);

        var payload = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, nonce.Length + tag.Length, ciphertext.Length);
        return $"v1:{Convert.ToBase64String(payload)}";
    }

    private string UnprotectSecret(string protectedValue)
    {
        if (!protectedValue.StartsWith("v1:", StringComparison.Ordinal))
            return string.Empty;

        var payload = Convert.FromBase64String(protectedValue[3..]);
        if (payload.Length < 29) return string.Empty;

        var nonce = payload[..12];
        var tag = payload[12..28];
        var ciphertext = payload[28..];
        var plaintext = new byte[ciphertext.Length];

        using var aes = new AesGcm(GetCredentialKey(), 16);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return Encoding.UTF8.GetString(plaintext);
    }

    private byte[] GetCredentialKey()
    {
        var secret = Environment.GetEnvironmentVariable("EMAIL_CREDENTIAL_KEY")
            ?? _config["Email:CredentialKey"]
            ?? Environment.GetEnvironmentVariable("Jwt__Secret")
            ?? _config["Jwt:Secret"];

        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Email credential encryption key is not configured.");

        return SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    private string GetResendApiKey() =>
        Environment.GetEnvironmentVariable("RESEND_API_KEY")
        ?? _config["Resend:ApiKey"]
        ?? string.Empty;

    private static string FormatResendFrom(ResolvedEmailSettings settings)
    {
        var email = GetResendFromEmail(settings);
        var name = GetResendFromName(settings);
        return string.IsNullOrWhiteSpace(name) ? email : $"{name} <{email}>";
    }

    private static string GetResendFromEmail(ResolvedEmailSettings settings) =>
        ResolveValue("RESEND_FROM_EMAIL", settings.EmailAddress);

    private static string GetResendFromName(ResolvedEmailSettings settings) =>
        ResolveValue("RESEND_FROM_NAME", settings.FromName);

    private static string GetResendReplyToEmail(ResolvedEmailSettings settings) =>
        ResolveValue("RESEND_REPLY_TO_EMAIL", settings.EmailAddress) is { Length: > 0 } replyTo
            ? replyTo
            : GetResendFromEmail(settings);

    private static string ExtractResendError(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return "No response body returned by Resend.";

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            if (root.TryGetProperty("message", out var message))
                return message.GetString() ?? responseBody;
            if (root.TryGetProperty("error", out var error))
            {
                if (error.ValueKind == JsonValueKind.String)
                    return error.GetString() ?? responseBody;
                if (error.TryGetProperty("message", out var errorMessage))
                    return errorMessage.GetString() ?? responseBody;
            }
        }
        catch
        {
            return responseBody;
        }

        return responseBody;
    }

    private async Task UpdateSyncResultAsync(bool success, string message, CancellationToken ct)
    {
        var setting = await GetOrCreateSettingAsync(ct);
        setting.LastSyncAt = DateTime.UtcNow;
        setting.LastSyncResult = success ? message : $"Connection failed: {message}";
        await _db.SaveChangesAsync(ct);
    }

    private static void AddRecipients(InternetAddressList list, IEnumerable<string> addresses)
    {
        foreach (var address in addresses.Where(a => !string.IsNullOrWhiteSpace(a)))
        {
            list.AddRange(InternetAddressList.Parse(address));
        }
    }

    private static void AddContact(Dictionary<string, EmailContactDto> contacts, string? email, string name, string source)
    {
        var normalizedEmail = Normalize(email).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail) || contacts.ContainsKey(normalizedEmail)) return;
        contacts[normalizedEmail] = new EmailContactDto
        {
            Email = normalizedEmail,
            Name = name,
            Source = source
        };
    }

    private static List<string> UniqueEmails(IEnumerable<string> emails) =>
        emails
            .SelectMany(e => e.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(e => Normalize(e).ToLowerInvariant())
            .Where(e => e.Contains('@'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static string Slugify(string value)
    {
        var slug = System.Text.RegularExpressions.Regex
            .Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-")
            .Trim('-');

        return string.IsNullOrWhiteSpace(slug) ? "email-group" : slug;
    }

    private static string JoinName(string? firstName, string? lastName) =>
        $"{firstName} {lastName}".Trim();

    private static void EnsureDefaultSignatures(StoredEmailSettings settings)
    {
        if (settings.Signatures.Count > 0) return;

        settings.Signatures.Add(new StoredEmailSignature
        {
            Id = "default-shanna",
            Name = "Shanna Signature",
            IsDefault = true,
            Html = """
                <div>
                  <p>Warm regards,</p>
                  <p><img src="https://sacredvibes.vercel.app/images/ShannaEmailSignature.png" alt="Shanna - Sacred Vibes Yoga" style="max-width: 360px; width: 100%; height: auto;" /></p>
                  <p><a href="https://sacredvibes.vercel.app">sacredvibes.vercel.app</a></p>
                </div>
                """
        });
    }

    private static EmailSignatureDto ToSignatureDto(StoredEmailSignature signature) => new()
    {
        Id = signature.Id,
        Name = signature.Name,
        Html = signature.Html,
        IsDefault = signature.IsDefault
    };

    private static UniqueId ParseUid(string id) =>
        uint.TryParse(id, out var value) ? new UniqueId(value) : throw new InvalidOperationException("Invalid message id.");

    private static SecureSocketOptions SocketOptions(bool useSsl) =>
        useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;

    private static string ResolveValue(string envName, string fallback) =>
        Environment.GetEnvironmentVariable(envName)
        ?? Environment.GetEnvironmentVariable(envName.Replace("_", "__"))
        ?? fallback;

    private int ResolveInt(string envName, int fallback) =>
        int.TryParse(ResolveValue(envName, string.Empty), out var value) ? value : fallback;

    private bool ResolveBool(string envName, bool fallback) =>
        bool.TryParse(ResolveValue(envName, string.Empty), out var value) ? value : fallback;

    private static string Normalize(string? value) => value?.Trim() ?? string.Empty;

    private static string DefaultMailHost(string? emailAddress)
    {
        var email = Normalize(emailAddress);
        var atIndex = email.IndexOf('@');
        return atIndex >= 0 && atIndex < email.Length - 1 ? $"mail.{email[(atIndex + 1)..]}" : string.Empty;
    }

    private static bool Contains(string? value, string needle) =>
        value?.Contains(needle, StringComparison.OrdinalIgnoreCase) == true;

    private static EmailAddressDto? ToAddressDto(MailboxAddress? address) =>
        address is null ? null : new EmailAddressDto { Name = address.Name ?? string.Empty, Address = address.Address };

    private static string StripHtml(string html) =>
        System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", " ");

    private static string MakePreview(string value)
    {
        var normalized = string.Join(" ", value.Split(Array.Empty<char>(), StringSplitOptions.RemoveEmptyEntries));
        return normalized.Length <= 180 ? normalized : $"{normalized[..180]}...";
    }

    private class StoredEmailSettings
    {
        public string EmailAddress { get; set; } = "info@sacredvibesyoga.com";
        public string FromName { get; set; } = "Sacred Vibes Healing & Wellness";
        public string ImapHost { get; set; } = string.Empty;
        public int ImapPort { get; set; } = 993;
        public bool ImapUseSsl { get; set; } = true;
        public string SmtpHost { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 465;
        public bool SmtpUseSsl { get; set; } = true;
        public string Username { get; set; } = string.Empty;
        public string ProtectedPassword { get; set; } = string.Empty;
        public List<StoredEmailSignature> Signatures { get; set; } = new();
    }

    private class ResolvedEmailSettings : StoredEmailSettings
    {
        public string Password { get; set; } = string.Empty;
    }

    private class StoredEmailSignature
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Html { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }

    private sealed class ResendEmailRequest
    {
        [JsonPropertyName("from")]
        public string From { get; set; } = string.Empty;

        [JsonPropertyName("to")]
        public List<string> To { get; set; } = new();

        [JsonPropertyName("cc")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? Cc { get; set; }

        [JsonPropertyName("bcc")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? Bcc { get; set; }

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("html")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Html { get; set; }

        [JsonPropertyName("text")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Text { get; set; }

        [JsonPropertyName("reply_to")]
        public string ReplyTo { get; set; } = string.Empty;

        [JsonPropertyName("attachments")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<ResendAttachment>? Attachments { get; set; }
    }

    private sealed class ResendAttachment
    {
        [JsonPropertyName("filename")]
        public string Filename { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}
