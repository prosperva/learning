using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommonFields.API.Models;

/// <summary>
/// Written by AuditInterceptor — table is created by the DDL below, not by EF migrations.
/// </summary>
[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(128)]
    public string TableName { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string RecordId { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Operation { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string ChangedBy { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; }

    /// <summary>JSON: { "FieldName": { "old": "...", "new": "..." } }</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string Changes { get; set; } = "{}";
}
