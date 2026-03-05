using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product>          Products          => Set<Product>();
    public DbSet<Attachment>       Attachments       => Set<Attachment>();
    public DbSet<AuditLog>         AuditLogs         => Set<AuditLog>();
    public DbSet<SavedSearch>      SavedSearches     => Set<SavedSearch>();
    public DbSet<AuditFieldConfig> AuditFieldConfigs => Set<AuditFieldConfig>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AuditLog>().ToTable("AuditLogs");

        builder.Entity<AuditFieldConfig>()
            .HasIndex(c => new { c.TableName, c.FieldName })
            .IsUnique();

        // Cascade delete attachments when product is deleted
        builder.Entity<Product>()
            .HasMany(p => p.Attachments)
            .WithOne(a => a.Product)
            .HasForeignKey(a => a.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Seed data ──────────────────────────────────────────────────────────

        var d1 = new DateTime(2023, 6, 15, 9, 0, 0, DateTimeKind.Utc);
        var d2 = new DateTime(2023, 8, 22, 11, 30, 0, DateTimeKind.Utc);
        var d3 = new DateTime(2023, 10, 5, 14, 0, 0, DateTimeKind.Utc);
        var d4 = new DateTime(2023, 11, 18, 8, 45, 0, DateTimeKind.Utc);
        var d5 = new DateTime(2024, 1, 3, 16, 20, 0, DateTimeKind.Utc);
        var d6 = new DateTime(2024, 2, 14, 10, 0, 0, DateTimeKind.Utc);
        var d7 = new DateTime(2024, 3, 27, 13, 15, 0, DateTimeKind.Utc);
        var d8 = new DateTime(2024, 5, 9, 9, 30, 0, DateTimeKind.Utc);

        builder.Entity<Product>().HasData(
            // ── Electronics ─────────────────────────────────────────────────────
            new Product { Id = 1,  Name = "Wireless Headphones",      Category = "electronics", Status = "active",       Price = 79.99m,    Stock = 120, Description = "Noise-cancelling Bluetooth headphones with 30h battery.",             CreatedBy = "seed", CreatedAt = d1 },
            new Product { Id = 2,  Name = "4K Smart TV 55\"",         Category = "electronics", Status = "active",       Price = 649.99m,   Stock = 40,  Description = "Ultra HD Smart TV with HDR and built-in streaming apps.",             CreatedBy = "seed", CreatedAt = d2 },
            new Product { Id = 3,  Name = "Mechanical Keyboard",      Category = "electronics", Status = "active",       Price = 119.99m,   Stock = 95,  Description = "Tenkeyless mechanical keyboard with Cherry MX switches.",            CreatedBy = "seed", CreatedAt = d3 },
            new Product { Id = 4,  Name = "USB-C Hub 7-in-1",         Category = "electronics", Status = "active",       Price = 39.99m,    Stock = 210, Description = "7-port USB-C hub with 4K HDMI, 100W PD, and SD card reader.",       CreatedBy = "seed", CreatedAt = d4 },
            new Product { Id = 5,  Name = "Wireless Earbuds Pro",     Category = "electronics", Status = "inactive",     Price = 149.99m,   Stock = 30,  Description = "True wireless earbuds with active noise cancellation, IPX5 rated.",  CreatedBy = "seed", CreatedAt = d5 },
            new Product { Id = 6,  Name = "Smart Watch Series 5",     Category = "electronics", Status = "active",       Price = 299.99m,   Stock = 55,  Description = "Health-tracking smartwatch with GPS, SpO2, and 7-day battery.",      CreatedBy = "seed", CreatedAt = d6 },
            new Product { Id = 7,  Name = "Portable SSD 1TB",         Category = "electronics", Status = "discontinued", Price = 89.99m,    Stock = 0,   Description = "USB 3.2 Gen 2 portable SSD, up to 1050MB/s read speed.",            CreatedBy = "seed", CreatedAt = d1 },

            // ── Clothing ────────────────────────────────────────────────────────
            new Product { Id = 8,  Name = "Leather Wallet",           Category = "clothing",    Status = "inactive",     Price = 49.99m,    Stock = 60,  Description = "Slim genuine leather bifold wallet with RFID blocking.",             CreatedBy = "seed", CreatedAt = d2 },
            new Product { Id = 9,  Name = "Merino Wool Sweater",      Category = "clothing",    Status = "active",       Price = 89.99m,    Stock = 110, Description = "100% merino wool crewneck sweater, machine washable.",               CreatedBy = "seed", CreatedAt = d3 },
            new Product { Id = 10, Name = "Waterproof Hiking Jacket", Category = "clothing",    Status = "active",       Price = 179.99m,   Stock = 45,  Description = "3-layer waterproof breathable shell jacket, 10K/10K rating.",       CreatedBy = "seed", CreatedAt = d4 },
            new Product { Id = 11, Name = "Slim Fit Chinos",          Category = "clothing",    Status = "active",       Price = 59.99m,    Stock = 200, Description = "Stretch slim-fit chino trousers in 8 colours.",                     CreatedBy = "seed", CreatedAt = d5 },
            new Product { Id = 12, Name = "Cashmere Scarf",           Category = "clothing",    Status = "discontinued", Price = 69.99m,    Stock = 0,   Description = "Pure cashmere woven scarf, 180cm x 30cm.",                          CreatedBy = "seed", CreatedAt = d6 },

            // ── Books ────────────────────────────────────────────────────────────
            new Product { Id = 13, Name = "The Great Gatsby",         Category = "books",       Status = "active",       Price = 12.99m,    Stock = 300, Description = "Classic American novel by F. Scott Fitzgerald.",                    CreatedBy = "seed", CreatedAt = d7 },
            new Product { Id = 14, Name = "Atomic Habits",            Category = "books",       Status = "active",       Price = 16.99m,    Stock = 420, Description = "Practical guide to building good habits and breaking bad ones.",     CreatedBy = "seed", CreatedAt = d8 },
            new Product { Id = 15, Name = "Clean Code",               Category = "books",       Status = "active",       Price = 39.99m,    Stock = 130, Description = "A handbook of agile software craftsmanship by Robert C. Martin.",   CreatedBy = "seed", CreatedAt = d1 },
            new Product { Id = 16, Name = "Sapiens",                  Category = "books",       Status = "active",       Price = 14.99m,    Stock = 260, Description = "A brief history of humankind by Yuval Noah Harari.",               CreatedBy = "seed", CreatedAt = d2 },
            new Product { Id = 17, Name = "The Pragmatic Programmer", Category = "books",       Status = "inactive",     Price = 49.99m,    Stock = 80,  Description = "Your journey to mastery — 20th Anniversary Edition.",               CreatedBy = "seed", CreatedAt = d3 },

            // ── Home & Garden ────────────────────────────────────────────────────
            new Product { Id = 18, Name = "Garden Hose 50ft",         Category = "home-garden", Status = "discontinued", Price = 39.99m,    Stock = 0,   Description = "Flexible expandable garden hose, kink-free design.",                CreatedBy = "seed", CreatedAt = d4 },
            new Product { Id = 19, Name = "Robot Vacuum Cleaner",     Category = "home-garden", Status = "active",       Price = 249.99m,   Stock = 38,  Description = "2700Pa suction robotic vacuum with LiDAR mapping and auto-empty.",  CreatedBy = "seed", CreatedAt = d5 },
            new Product { Id = 20, Name = "Ceramic Plant Pots Set",   Category = "home-garden", Status = "active",       Price = 34.99m,    Stock = 150, Description = "Set of 3 minimalist ceramic pots with drainage holes and trays.",   CreatedBy = "seed", CreatedAt = d6 },
            new Product { Id = 21, Name = "Air Purifier HEPA",        Category = "home-garden", Status = "active",       Price = 189.99m,   Stock = 62,  Description = "True HEPA + activated carbon air purifier, covers 400 sq ft.",     CreatedBy = "seed", CreatedAt = d7 },

            // ── Sports & Outdoors ────────────────────────────────────────────────
            new Product { Id = 22, Name = "Running Shoes",            Category = "sports",      Status = "active",       Price = 129.99m,   Stock = 85,  Description = "Lightweight running shoes with advanced cushioning.",                CreatedBy = "seed", CreatedAt = d8 },
            new Product { Id = 23, Name = "Yoga Mat",                 Category = "sports",      Status = "active",       Price = 34.99m,    Stock = 200, Description = "Non-slip eco-friendly yoga mat, 6mm thick.",                        CreatedBy = "seed", CreatedAt = d1 },
            new Product { Id = 24, Name = "Adjustable Dumbbell Set",  Category = "sports",      Status = "active",       Price = 299.99m,   Stock = 28,  Description = "5–52.5 lb adjustable dumbbells, dial-select mechanism.",            CreatedBy = "seed", CreatedAt = d2 },
            new Product { Id = 25, Name = "Foam Roller",              Category = "sports",      Status = "active",       Price = 24.99m,    Stock = 310, Description = "High-density EVA foam roller for muscle recovery, 36 inch.",        CreatedBy = "seed", CreatedAt = d3 },
            new Product { Id = 26, Name = "Resistance Bands Set",     Category = "sports",      Status = "inactive",     Price = 19.99m,    Stock = 90,  Description = "Set of 5 loop resistance bands, 10–50 lb progressive resistance.",  CreatedBy = "seed", CreatedAt = d4 },

            // ── Toys & Games ─────────────────────────────────────────────────────
            new Product { Id = 27, Name = "Board Game: Catan",        Category = "toys",        Status = "active",       Price = 44.99m,    Stock = 75,  Description = "Award-winning strategy board game for 3-4 players.",                CreatedBy = "seed", CreatedAt = d5 },
            new Product { Id = 28, Name = "LEGO Architecture Set",    Category = "toys",        Status = "active",       Price = 59.99m,    Stock = 42,  Description = "1,483-piece LEGO skyline set for teens and adults.",                CreatedBy = "seed", CreatedAt = d6 },
            new Product { Id = 29, Name = "Remote Control Car",       Category = "toys",        Status = "active",       Price = 49.99m,    Stock = 88,  Description = "1:16 scale RC off-road truck, 25 mph, 2.4GHz control.",            CreatedBy = "seed", CreatedAt = d7 },
            new Product { Id = 30, Name = "Puzzle 1000pc",            Category = "toys",        Status = "discontinued", Price = 22.99m,    Stock = 0,   Description = "1000-piece jigsaw puzzle, world map illustration.",                 CreatedBy = "seed", CreatedAt = d8 },

            // ── Food & Beverages ─────────────────────────────────────────────────
            new Product { Id = 31, Name = "Organic Green Tea",        Category = "food",        Status = "active",       Price = 18.99m,    Stock = 500, Description = "Premium Japanese matcha green tea, 100g.",                          CreatedBy = "seed", CreatedAt = d1 },
            new Product { Id = 32, Name = "Cold Brew Coffee Kit",     Category = "food",        Status = "active",       Price = 29.99m,    Stock = 145, Description = "Slow-drip cold brew maker with 1L glass carafe.",                   CreatedBy = "seed", CreatedAt = d2 },
            new Product { Id = 33, Name = "Dark Chocolate 85%",       Category = "food",        Status = "active",       Price = 8.99m,     Stock = 600, Description = "Single-origin 85% dark chocolate bars, pack of 6.",                CreatedBy = "seed", CreatedAt = d3 },
            new Product { Id = 34, Name = "Hot Sauce Trio",           Category = "food",        Status = "inactive",     Price = 24.99m,    Stock = 70,  Description = "Trio of small-batch hot sauces: mild, medium, and habanero.",      CreatedBy = "seed", CreatedAt = d4 },

            // ── Health & Beauty ──────────────────────────────────────────────────
            new Product { Id = 35, Name = "Vitamin C Serum",          Category = "health",      Status = "active",       Price = 28.99m,    Stock = 180, Description = "Brightening vitamin C serum with hyaluronic acid.",                 CreatedBy = "seed", CreatedAt = d5 },
            new Product { Id = 36, Name = "Electric Toothbrush",      Category = "health",      Status = "active",       Price = 69.99m,    Stock = 120, Description = "Sonic electric toothbrush with 5 modes and 2-min smart timer.",    CreatedBy = "seed", CreatedAt = d6 },
            new Product { Id = 37, Name = "Collagen Peptides Powder", Category = "health",      Status = "active",       Price = 34.99m,    Stock = 230, Description = "Hydrolysed collagen peptides, unflavoured, 500g.",                 CreatedBy = "seed", CreatedAt = d7 },
            new Product { Id = 38, Name = "Sleep Gummies",            Category = "health",      Status = "active",       Price = 22.99m,    Stock = 310, Description = "Melatonin + L-theanine sleep support gummies, 60 count.",          CreatedBy = "seed", CreatedAt = d8 },
            new Product { Id = 39, Name = "Sunscreen SPF 50",         Category = "health",      Status = "discontinued", Price = 19.99m,    Stock = 0,   Description = "Mineral sunscreen SPF 50+, reef-safe, water-resistant 80 min.",    CreatedBy = "seed", CreatedAt = d1 },
            new Product { Id = 40, Name = "Bamboo Toothbrush Pack",   Category = "health",      Status = "inactive",     Price = 12.99m,    Stock = 45,  Description = "Eco-friendly bamboo toothbrushes with charcoal bristles, 4-pack.", CreatedBy = "seed", CreatedAt = d2 }
        );
    }
}
