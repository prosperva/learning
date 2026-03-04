namespace CommonFields.API.DTOs;

public class AttachmentDto
{
    public Guid Id { get; set; }
    public int ProductId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string Url { get; set; } = string.Empty;
}

public class AttachmentsResponse
{
    public IEnumerable<AttachmentDto> Attachments { get; set; } = Enumerable.Empty<AttachmentDto>();
}
