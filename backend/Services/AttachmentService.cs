using AutoMapper;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using CommonFields.API.DTOs;
using CommonFields.API.Models;
using CommonFields.API.Repositories;

namespace CommonFields.API.Services;

public class AttachmentService(
    IAttachmentRepository repo,
    IProductRepository productRepo,
    IMapper mapper,
    BlobContainerClient blobContainer,
    IHttpContextAccessor httpContextAccessor) : IAttachmentService
{
    private static string BlobName(int productId, Guid id, string fileName) =>
        $"products/{productId}/{id}_{fileName}";

    public async Task<AttachmentsResponse?> GetByProductIdAsync(int productId)
    {
        var product = await productRepo.GetByIdAsync(productId);
        if (product is null) return null;

        var attachments = await repo.GetByProductIdAsync(productId);
        var dtos = attachments.Select(a =>
        {
            var dto = mapper.Map<AttachmentDto>(a);
            dto.Url = BuildDownloadUrl(productId, a.Id);
            return dto;
        });

        return new AttachmentsResponse { Attachments = dtos };
    }

    public async Task<AttachmentDto?> UploadAsync(int productId, IFormFile file, HttpRequest _)
    {
        var product = await productRepo.GetByIdAsync(productId);
        if (product is null) return null;

        var id           = Guid.NewGuid();
        var safeFileName = Path.GetFileName(file.FileName);
        var blobName     = BlobName(productId, id, safeFileName);

        var blobClient = blobContainer.GetBlobClient(blobName);
        await using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });

        var attachment = new Attachment
        {
            Id         = id,
            ProductId  = productId,
            FileName   = safeFileName,
            FileSize   = file.Length,
            MimeType   = file.ContentType,
            UploadedAt = DateTime.UtcNow,
            StoredPath = blobName,
        };

        var created = await repo.CreateAsync(attachment);
        var dto = mapper.Map<AttachmentDto>(created);
        dto.Url = BuildDownloadUrl(productId, id);
        return dto;
    }

    public async Task<bool> DeleteAsync(int productId, Guid attachmentId)
    {
        var attachment = await repo.GetByIdAsync(attachmentId);
        if (attachment is null || attachment.ProductId != productId) return false;

        await blobContainer.GetBlobClient(attachment.StoredPath).DeleteIfExistsAsync();
        await repo.DeleteAsync(attachment);
        return true;
    }

    public async Task<(Stream Stream, string FileName, string MimeType)?> DownloadAsync(int productId, Guid attachmentId)
    {
        var attachment = await repo.GetByIdAsync(attachmentId);
        if (attachment is null || attachment.ProductId != productId) return null;

        var blobClient = blobContainer.GetBlobClient(attachment.StoredPath);
        if (!await blobClient.ExistsAsync()) return null;

        var download = await blobClient.DownloadStreamingAsync();
        return (download.Value.Content, attachment.FileName, attachment.MimeType);
    }

    private string BuildDownloadUrl(int productId, Guid id)
    {
        var req = httpContextAccessor.HttpContext?.Request;
        if (req is null) return string.Empty;
        return $"{req.Scheme}://{req.Host}/api/products/{productId}/attachments/{id}/download";
    }
}
