using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Proposals.DTOs;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Application.Features.Proposals;

public interface IProposalService
{
    Task<PagedResult<ProposalListItemDto>> GetAllAsync(int page, int pageSize, ProposalStatus? status, CancellationToken ct = default);
    Task<ProposalDto?> GetAsync(Guid id, CancellationToken ct = default);
    Task<ProposalDto> CreateAsync(CreateProposalRequest request, CancellationToken ct = default);
    Task<ProposalDto> UpdateAsync(Guid id, UpdateProposalRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<ProposalDto> SendAsync(Guid id, SendProposalRequest request, CancellationToken ct = default);
    Task SendTestAsync(Guid id, string testEmail, CancellationToken ct = default);
    Task<byte[]> RenderPdfAsync(Guid id, CancellationToken ct = default);
    Task<string> PreviewHtmlAsync(Guid id, CancellationToken ct = default);
    Task<PublicProposalDto?> GetPublicAsync(Guid id, CancellationToken ct = default);
    Task<byte[]?> GetPublicPdfAsync(Guid id, CancellationToken ct = default);
}
