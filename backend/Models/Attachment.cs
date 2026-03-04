using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommonFields.API.Models;

[Table("Attachments")]
public class Attachment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int ProductId { get; set; }

    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [Required]
    [MaxLength(200)]
    public string MimeType { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(1000)]
    public string StoredPath { get; set; } = string.Empty;

    // Navigation
    [ForeignKey(nameof(ProductId))]
    public Product? Product { get; set; }
}
