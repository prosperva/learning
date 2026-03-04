using Azure.Storage;
using Azure.Storage.Blobs;
using CommonFields.API.Data;
using CommonFields.API.Profiles;
using CommonFields.API.Repositories;
using CommonFields.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<AuditInterceptor>();

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options
        .UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
        .AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
});

// ── Azure Blob Storage (Azurite in dev) ───────────────────────────────────────
var blobAccountName   = builder.Configuration["AzureStorage:AccountName"] ?? "devstoreaccount1";
var blobAccountKey    = builder.Configuration["AzureStorage:AccountKey"]!;
var blobServiceUri    = builder.Configuration["AzureStorage:ServiceUri"] ?? "http://azurite:10000";
var blobContainerName = builder.Configuration["AzureStorage:ContainerName"] ?? "attachments";

builder.Services.AddSingleton(_ =>
    new BlobContainerClient(
        new Uri($"{blobServiceUri}/{blobAccountName}/{blobContainerName}"),
        new StorageSharedKeyCredential(blobAccountName, blobAccountKey)));

// ── Application services ──────────────────────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, HardcodedCurrentUserService>();

// Repositories
builder.Services.AddScoped<IProductRepository,     ProductRepository>();
builder.Services.AddScoped<IAttachmentRepository,  AttachmentRepository>();
builder.Services.AddScoped<IAuditRepository,       AuditRepository>();
builder.Services.AddScoped<ISavedSearchRepository, SavedSearchRepository>();

// Services
builder.Services.AddScoped<IProductService,     ProductService>();
builder.Services.AddScoped<IAttachmentService,  AttachmentService>();
builder.Services.AddScoped<IAuditService,       AuditService>();
builder.Services.AddScoped<ISavedSearchService, SavedSearchService>();

// ── AutoMapper ────────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ── Web ───────────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CommonFields API", Version = "v1" });
});

// CORS — allow Next.js dev server
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Create blob container on startup (retry a few times in case Azurite isn't ready yet)
{
    var blobContainer = app.Services.GetRequiredService<BlobContainerClient>();
    for (var attempt = 0; attempt < 5; attempt++)
    {
        try { await blobContainer.CreateIfNotExistsAsync(); break; }
        catch { await Task.Delay(TimeSpan.FromSeconds(2)); }
    }
}

// Create schema + seed on startup.
// EnsureCreated creates all tables from the model on first run (no migration files needed).
// To switch to proper migrations later: remove EnsureCreated and run
//   dotnet ef migrations add InitialCreate
//   dotnet ef database update
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // AuditLogs is excluded from EF migrations but EnsureCreated creates it from the model.
    // Add the index separately if it doesn't exist.
    db.Database.ExecuteSqlRaw("""
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_AuditLogs_Table_Record'
              AND object_id = OBJECT_ID('AuditLogs')
        )
        BEGIN
            CREATE INDEX IX_AuditLogs_Table_Record
                ON AuditLogs (TableName, RecordId, ChangedAt DESC);
        END
        """);
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CommonFields API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();

app.Run();
