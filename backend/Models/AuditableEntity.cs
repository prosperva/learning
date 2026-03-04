using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommonFields.API.Models;

public abstract class AuditableEntity : IAuditableEntity
{
    [Required]
    [MaxLength(256)]
    [Column("CreatedBy")]
    public string CreatedBy { get; set; } = string.Empty;

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [MaxLength(256)]
    [Column("ModifiedBy")]
    public string? ModifiedBy { get; set; }

    [Column("ModifiedDate")]
    public DateTime? ModifiedAt { get; set; }
}
