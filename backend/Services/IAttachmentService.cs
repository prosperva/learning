using CommonFields.API.DTOs;

namespace CommonFields.API.Services;

public interface IAttachmentService
{
    Task<AttachmentsResponse?> GetByProductIdAsync(int productId);
    Task<AttachmentDto?> UploadAsync(int productId, IFormFile file, HttpRequest request);
    Task<bool> DeleteAsync(int productId, Guid attachmentId);
    Task<(Stream Stream, string FileName, string MimeType)?> DownloadAsync(int productId, Guid attachmentId);
}
