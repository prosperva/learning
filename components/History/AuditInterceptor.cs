// ============================================================
// 1. SQL — run this first, before EF is involved at all
// ============================================================
//
// CREATE TABLE dbo.AuditLogs
// (
//     Id         INT            IDENTITY(1,1)  NOT NULL,
//     TableName  NVARCHAR(100)                 NOT NULL,
//     RecordId   NVARCHAR(50)                  NOT NULL,
//     Operation  NVARCHAR(20)                  NOT NULL,   -- 'Added' | 'Modified' | 'Deleted'
//     ChangedBy  NVARCHAR(256)                 NOT NULL,
//     ChangedAt  DATETIME2(7)                  NOT NULL,
//     Changes    NVARCHAR(MAX)                 NOT NULL,   -- JSON blob
//
//     CONSTRAINT PK_AuditLogs PRIMARY KEY (Id)
// );
//
// -- Covering index for the two query parameters used in every lookup
// CREATE INDEX IX_AuditLogs_TableName_RecordId
//     ON dbo.AuditLogs (TableName, RecordId)
//     INCLUDE (ChangedAt);


// ============================================================
// AuditableAttribute.cs
// ============================================================

[AttributeUsage(AttributeTargets.Class)]
public class AuditableAttribute : Attribute { }


// ============================================================
// AuditChange.cs
// ============================================================

/// <summary>
/// Matches the TypeScript AuditChange interface: { Old: string | null, New: string | null }
/// PascalCase is intentional — the Changes column is pre-serialized JSON stored as a string,
/// so it bypasses the global camelCase policy. The frontend reads Old/New directly.
/// </summary>
public record AuditChange(string? Old, string? New);


// ============================================================
// AuditLog.cs  — maps exactly to the SQL table above
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("AuditLogs", Schema = "dbo")]
public class AuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("Id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("TableName")]
    public string TableName { get; set; } = "";

    [Required]
    [MaxLength(50)]
    [Column("RecordId")]
    public string RecordId { get; set; } = "";

    [Required]
    [MaxLength(20)]
    [Column("Operation")]
    public string Operation { get; set; } = "";

    [Required]
    [MaxLength(256)]
    [Column("ChangedBy")]
    public string ChangedBy { get; set; } = "";

    [Column("ChangedAt")]
    public DateTime ChangedAt { get; set; }

    /// <summary>
    /// JSON blob: { "FieldName": { "Old": "prev", "New": "next" }, ... }
    /// Stored as NVARCHAR(MAX) — never null, always a valid JSON object.
    /// </summary>
    [Required]
    [Column("Changes", TypeName = "nvarchar(max)")]
    public string Changes { get; set; } = "";
}


// ============================================================
// AppDbContext.cs  (relevant excerpt)
// ============================================================
//
// public class AppDbContext : DbContext
// {
//     public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
//
//     protected override void OnModelCreating(ModelBuilder modelBuilder)
//     {
//         base.OnModelCreating(modelBuilder);
//
//         modelBuilder.Entity<AuditLog>(entity =>
//         {
//             // Table already exists — migrations must never create or alter it.
//             entity.ToTable("AuditLogs", "dbo", t => t.ExcludeFromMigrations());
//
//             entity.HasKey(e => e.Id);
//
//             entity.Property(e => e.TableName).HasMaxLength(100).IsRequired();
//             entity.Property(e => e.RecordId).HasMaxLength(50).IsRequired();
//             entity.Property(e => e.Operation).HasMaxLength(20).IsRequired();
//             entity.Property(e => e.ChangedBy).HasMaxLength(256).IsRequired();
//             entity.Property(e => e.ChangedAt).HasColumnType("datetime2(7)");
//             entity.Property(e => e.Changes).HasColumnType("nvarchar(max)").IsRequired();
//
//             // Mirror the index from the SQL script
//             entity.HasIndex(e => new { e.TableName, e.RecordId })
//                   .HasDatabaseName("IX_AuditLogs_TableName_RecordId");
//         });
//     }
// }


// ============================================================
// AuditInterceptor.cs
// ============================================================

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Reflection;
using System.Text.Json;

public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly TimeProvider _timeProvider;

    public AuditInterceptor(
        IHttpContextAccessor? httpContextAccessor = null,
        TimeProvider? timeProvider = null)
    {
        _httpContextAccessor = httpContextAccessor;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    // ✅ Sync path covered
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        var context = eventData.Context;
        if (context is null)
            return base.SavingChanges(eventData, result);

        var auditLogs = BuildAuditLogs(context);

        if (auditLogs.Count > 0)
            context.AddRange(auditLogs);

        return base.SavingChanges(eventData, result);
    }

    // ✅ Async path
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context is null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var auditLogs = BuildAuditLogs(context);

        if (auditLogs.Count > 0)
            await context.AddRangeAsync(auditLogs, cancellationToken);

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    // ✅ Extracted shared logic — testable and reusable
    private List<AuditLog> BuildAuditLogs(DbContext context)
    {
        var user = _httpContextAccessor?.HttpContext?.User?.Identity?.Name ?? "system";
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var auditLogs = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries()
                     .Where(e => e.State is EntityState.Added
                                          or EntityState.Modified
                                          or EntityState.Deleted))
        {
            var entityType = entry.Entity.GetType();

            // ✅ Opt-in: only audit entities decorated with [Auditable]
            if (entityType.GetCustomAttribute<AuditableAttribute>() is null)
                continue;

            // ✅ TableName comes from the [Table] attribute if present, otherwise the class name
            var tableAttr = entityType.GetCustomAttribute<TableAttribute>();
            var tableName = tableAttr?.Name ?? entityType.Name;

            var recordId = entry.Properties
                .FirstOrDefault(p => p.Metadata.IsPrimaryKey())
                ?.CurrentValue?.ToString() ?? "N/A";
            var operation = entry.State.ToString();

            var changes = new Dictionary<string, AuditChange>();

            foreach (var prop in entry.Properties)
            {
                if (prop.Metadata.IsPrimaryKey())
                    continue;

                switch (entry.State)
                {
                    case EntityState.Added:
                        // ✅ Always log Added regardless of null values
                        // Convert to string to match TypeScript: { Old: string | null, New: string | null }
                        changes[prop.Metadata.Name] = new AuditChange(
                            Old: null,
                            New: prop.CurrentValue?.ToString()
                        );
                        break;

                    case EntityState.Deleted:
                        // ⚠️ OriginalValue only available if entity was loaded into context first.
                        //    Bulk deletes via ExecuteDelete() bypass this interceptor entirely.
                        changes[prop.Metadata.Name] = new AuditChange(
                            Old: prop.OriginalValue?.ToString(),
                            New: null
                        );
                        break;

                    case EntityState.Modified:
                        var oldVal = prop.OriginalValue?.ToString();
                        var newVal = prop.CurrentValue?.ToString();

                        // ✅ Skip unchanged properties to keep logs lean
                        if (oldVal == newVal)
                            continue;

                        changes[prop.Metadata.Name] = new AuditChange(
                            Old: oldVal,
                            New: newVal
                        );
                        break;
                }
            }

            // ✅ Always log Added/Deleted even if changes dict is empty (e.g. all-null new record)
            //    For Modified, only log if something actually changed
            if (entry.State == EntityState.Modified && changes.Count == 0)
                continue;

            auditLogs.Add(new AuditLog
            {
                TableName = tableName,
                RecordId = recordId,
                Operation = operation,
                ChangedBy = user,
                ChangedAt = now,
                // ✅ System.Text.Json instead of Newtonsoft — no extra dependency
                Changes = JsonSerializer.Serialize(changes)
            });
        }

        return auditLogs;
    }
}


// ============================================================
// AuditLogDto.cs
// ============================================================

/// <summary>
/// Response DTO returned to the frontend.
/// Changes is deserialized from the stored JSON string so the
/// frontend receives a proper object, not a string-within-JSON.
/// </summary>
public class AuditLogDto
{
    public int Id { get; set; }
    public string TableName { get; set; } = "";
    public string RecordId { get; set; } = "";
    public string Operation { get; set; } = "";
    public string ChangedBy { get; set; } = "";
    public DateTime ChangedAt { get; set; }
    public Dictionary<string, AuditChange> Changes { get; set; } = new();
}

public class AuditLogPagedResult
{
    public List<AuditLogDto> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

/// <summary>
/// Intermediate source passed to AutoMapper so the full paged result
/// can be assembled in one Map call rather than built manually in the service.
/// </summary>
public record AuditLogPagedSource(
    List<AuditLog> Items,
    int Total,
    int Page,
    int PageSize);


// ============================================================
// IAuditLogRepository.cs + AuditLogRepository.cs
// ============================================================

public interface IAuditLogRepository
{
    Task<(List<AuditLog> Items, int Total)> GetPagedAsync(
        string tableName,
        string recordId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _context;

    public AuditLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(List<AuditLog> Items, int Total)> GetPagedAsync(
        string tableName,
        string recordId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs
            .Where(a => a.TableName == tableName && a.RecordId == recordId)
            .OrderByDescending(a => a.ChangedAt);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(page * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}


// ============================================================
// AuditLogProfile.cs  (AutoMapper)
// ============================================================

public class AuditLogProfile : Profile
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AuditLogProfile()
    {
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(
                dest => dest.Changes,
                opt => opt.MapFrom(src =>
                    JsonSerializer.Deserialize<Dictionary<string, AuditChange>>(
                        src.Changes, _jsonOptions)
                    ?? new Dictionary<string, AuditChange>()));

        CreateMap<AuditLogPagedSource, AuditLogPagedResult>()
            .ForMember(dest => dest.Data,
                opt => opt.MapFrom(src => src.Items))           // triggers AuditLog → AuditLogDto per item
            .ForMember(dest => dest.TotalPages,
                opt => opt.MapFrom(src =>
                    (int)Math.Ceiling(src.Total / (double)src.PageSize)));
    }
}


// ============================================================
// IAuditLogService.cs + AuditLogService.cs
// ============================================================

public interface IAuditLogService
{
    Task<AuditLogPagedResult> GetAuditHistoryAsync(
        string tableName,
        string recordId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repository;
    private readonly IMapper _mapper;

    public AuditLogService(IAuditLogRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<AuditLogPagedResult> GetAuditHistoryAsync(
        string tableName,
        string recordId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _repository.GetPagedAsync(
            tableName, recordId, page, pageSize, cancellationToken);

        return _mapper.Map<AuditLogPagedResult>(
            new AuditLogPagedSource(items, total, page, pageSize));
    }
}


// ============================================================
// AuditController.cs
// ============================================================

[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditController(IAuditLogService service)
    {
        _service = service;
    }

    /// <summary>
    /// GET /api/audit/{tableName}/{recordId}?page=0&amp;pageSize=10
    /// Returns paginated audit history for a specific record.
    /// </summary>
    [HttpGet("{tableName}/{recordId}")]
    public async Task<IActionResult> GetHistory(
        string tableName,
        string recordId,
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (pageSize is < 1 or > 100)
            return BadRequest("pageSize must be between 1 and 100.");

        var result = await _service.GetAuditHistoryAsync(
            tableName, recordId, page, pageSize, cancellationToken);

        return Ok(result);
    }
}


// ============================================================
// Example Entities
// ============================================================

[Auditable]
[Table("Customers", Schema = "dbo")]
public class Customer
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = "";

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = "";

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active";
}

// Not audited — no [Auditable] attribute
[Table("LogEntries", Schema = "dbo")]
public class LogEntry
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = "";

    public DateTime Timestamp { get; set; }
}


// ============================================================
// Program.cs / DI Registration
// ============================================================

// builder.Services.AddHttpContextAccessor();
// builder.Services.AddSingleton(TimeProvider.System);
// builder.Services.AddSingleton<AuditInterceptor>();
//
// builder.Services.AddDbContext<AppDbContext>((sp, options) =>
// {
//     options.UseSqlServer(connectionString)
//            .AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
// });
//
// builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
// builder.Services.AddScoped<IAuditLogService, AuditLogService>();
// builder.Services.AddAutoMapper(typeof(AuditLogProfile).Assembly);
