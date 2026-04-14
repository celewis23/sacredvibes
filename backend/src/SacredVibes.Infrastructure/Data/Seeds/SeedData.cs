using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using System.Data;

namespace SacredVibes.Infrastructure.Data.Seeds;

public static class SeedData
{
    public static async Task SeedAsync(AppDbContext db, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        await EnsureDatabaseReadyAsync(db);

        await SeedRolesAsync(roleManager);
        await SeedAdminUserAsync(userManager);
        await SeedBrandsAsync(db);
        await SeedSubscriberTagsAsync(db);
        await SeedGalleriesAsync(db);
        await SeedServicesAsync(db);
        await SeedEventsAsync(db);
        await SeedBlogPostsAsync(db, userManager);
        await SeedPagesAsync(db);
        await SeedIntegrationSettingsAsync(db);

        await db.SaveChangesAsync();
    }

    private static async Task EnsureDatabaseReadyAsync(AppDbContext db)
    {
        var migrations = await db.Database.GetMigrationsAsync();

        if (migrations.Any())
        {
            await db.Database.MigrateAsync();
        }
        else
        {
            await db.Database.EnsureCreatedAsync();
        }

        await EnsureAuthSchemaCompatibilityAsync(db);
        await ValidateCriticalAuthSchemaAsync(db);
    }

    private static async Task EnsureAuthSchemaCompatibilityAsync(AppDbContext db)
    {
        if (!await TableExistsAsync(db, "AspNetUsers"))
        {
            return;
        }

        string[] aspNetUserColumnStatements =
        [
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "FirstName" text NOT NULL DEFAULT '';""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "LastName" text NOT NULL DEFAULT '';""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "Role" integer NOT NULL DEFAULT 1;""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "AvatarPath" text NULL;""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "Bio" text NULL;""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "Title" text NULL;""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT TRUE;""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "LastLoginAt" timestamp with time zone NULL;""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();""",
            """ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW();"""
        ];

        foreach (var statement in aspNetUserColumnStatements)
        {
            await db.Database.ExecuteSqlRawAsync(statement);
        }

        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                "Id" uuid NOT NULL,
                "UserId" text NOT NULL,
                "Token" character varying(500) NOT NULL,
                "ExpiresAt" timestamp with time zone NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "IsRevoked" boolean NOT NULL DEFAULT FALSE,
                "RevokedAt" timestamp with time zone NULL,
                "ReplacedByToken" text NULL,
                "RevokedByIp" text NULL,
                "CreatedByIp" text NULL,
                "DeviceInfo" text NULL,
                CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_refresh_tokens_AspNetUsers_UserId"
                    FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );
            """
        );

        await db.Database.ExecuteSqlRawAsync(
            """CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_Token" ON refresh_tokens ("Token");"""
        );
        await db.Database.ExecuteSqlRawAsync(
            """CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_UserId" ON refresh_tokens ("UserId");"""
        );
    }

    private static async Task<bool> TableExistsAsync(AppDbContext db, string tableName)
    {
        await using var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = @tableName
            );
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "@tableName";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync();
        return result is bool exists && exists;
    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext db, string tableName, string columnName)
    {
        await using var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = @tableName
                  AND column_name = @columnName
            );
            """;

        var tableParam = command.CreateParameter();
        tableParam.ParameterName = "@tableName";
        tableParam.Value = tableName;
        command.Parameters.Add(tableParam);

        var columnParam = command.CreateParameter();
        columnParam.ParameterName = "@columnName";
        columnParam.Value = columnName;
        command.Parameters.Add(columnParam);

        var result = await command.ExecuteScalarAsync();
        return result is bool exists && exists;
    }

    private static async Task ValidateCriticalAuthSchemaAsync(AppDbContext db)
    {
        string[] requiredTables = ["AspNetUsers", "AspNetRoles", "AspNetUserRoles", "refresh_tokens"];
        foreach (var table in requiredTables)
        {
            if (!await TableExistsAsync(db, table))
            {
                throw new InvalidOperationException($"Database startup validation failed: required table '{table}' is missing.");
            }
        }

        string[] requiredAspNetUserColumns =
        [
            "FirstName",
            "LastName",
            "Role",
            "IsActive",
            "LastLoginAt",
            "CreatedAt",
            "UpdatedAt"
        ];

        foreach (var column in requiredAspNetUserColumns)
        {
            if (!await ColumnExistsAsync(db, "AspNetUsers", column))
            {
                throw new InvalidOperationException($"Database startup validation failed: required column 'AspNetUsers.{column}' is missing.");
            }
        }
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roles = ["Admin", "Editor", "Manager"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
    {
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@sacredvibesyoga.com";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "Admin@Sacred2025!";

        var existing = await userManager.FindByEmailAsync(adminEmail);
        if (existing is not null) return;

        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "Shanna",
            LastName = "Latia",
            Role = UserRole.Admin,
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await userManager.CreateAsync(admin, adminPassword);
        if (result.Succeeded)
            await userManager.AddToRoleAsync(admin, "Admin");
    }

    private static async Task SeedBrandsAsync(AppDbContext db)
    {
        if (await db.Brands.AnyAsync()) return;

        var brands = new List<Brand>
        {
            new()
            {
                Id = WellKnownIds.ParentBrandId,
                Name = "Sacred Vibes Yoga",
                Slug = "sacred-vibes-yoga",
                Type = BrandType.Parent,
                Subdomain = "sacredvibesyoga.com",
                Description = "Sacred Vibes Yoga is a holistic wellness sanctuary dedicated to nurturing body, mind, and spirit through the ancient practices of yoga, sound healing, and therapeutic massage. We invite you to step into a space of transformation, connection, and deep healing.",
                Tagline = "Move. Breathe. Heal. Thrive.",
                ThemeSettingsJson = """{"primaryColor":"#7B6E5D","accentColor":"#C4A882","backgroundColor":"#FAF7F4","textColor":"#3D3530","fontHeading":"Cormorant Garamond","fontBody":"Lato"}""",
                SeoSettingsJson = """{"siteTitle":"Sacred Vibes Yoga","description":"Holistic wellness through yoga, sound healing, and massage therapy.","keywords":["yoga","wellness","sound healing","massage","meditation"]}""",
                IsActive = true,
                SortOrder = 0
            },
            new()
            {
                Id = WellKnownIds.SacredHandsBrandId,
                Name = "Sacred Hands",
                Slug = "sacred-hands",
                Type = BrandType.SubBrand,
                Subdomain = "hands.sacredvibesyoga.com",
                Description = "Sacred Hands offers transformative massage therapy designed to melt tension, restore balance, and return you to yourself. Our skilled therapists blend traditional techniques with intuitive healing touch.",
                Tagline = "Healing Through Touch",
                ThemeSettingsJson = """{"primaryColor":"#6B5E52","accentColor":"#B89B82","backgroundColor":"#FBF8F5","textColor":"#3A302B","fontHeading":"Cormorant Garamond","fontBody":"Lato"}""",
                SeoSettingsJson = """{"siteTitle":"Sacred Hands Massage Therapy","description":"Therapeutic massage for deep healing and relaxation.","keywords":["massage therapy","therapeutic massage","healing touch","deep tissue","relaxation"]}""",
                IsActive = true,
                SortOrder = 1
            },
            new()
            {
                Id = WellKnownIds.SacredSoundBrandId,
                Name = "Sacred Sound",
                Slug = "sacred-sound",
                Type = BrandType.SubBrand,
                Subdomain = "sound.sacredvibesyoga.com",
                Description = "Sacred Sound is a portal into vibrational healing through sound baths, singing bowls, gong immersions, and our signature Sound on the River experiences. Let the vibrations guide you inward.",
                Tagline = "Vibrate Higher",
                ThemeSettingsJson = """{"primaryColor":"#5C5A7E","accentColor":"#9B8FC4","backgroundColor":"#F8F7FC","textColor":"#2E2D45","fontHeading":"Cormorant Garamond","fontBody":"Lato"}""",
                SeoSettingsJson = """{"siteTitle":"Sacred Sound Healing","description":"Sound healing classes, workshops, and Sound on the River events.","keywords":["sound healing","sound bath","singing bowls","gong","sound on the river","meditation"]}""",
                IsActive = true,
                SortOrder = 2
            }
        };

        await db.Brands.AddRangeAsync(brands);
    }

    private static async Task SeedSubscriberTagsAsync(AppDbContext db)
    {
        if (await db.SubscriberTags.AnyAsync()) return;

        var tags = new List<SubscriberTag>
        {
            new() { Name = "Yoga", Slug = "yoga", Color = "#7B6E5D" },
            new() { Name = "Sacred Hands", Slug = "sacred-hands", Color = "#6B5E52" },
            new() { Name = "Sacred Sound", Slug = "sacred-sound", Color = "#5C5A7E" },
            new() { Name = "Workshop", Slug = "workshop", Color = "#B8860B" },
            new() { Name = "Event", Slug = "event", Color = "#8B7355" },
            new() { Name = "Massage", Slug = "massage", Color = "#A0785A" },
            new() { Name = "Sound on the River", Slug = "sound-on-the-river", Color = "#4A7FA5" },
            new() { Name = "Parent Brand", Slug = "parent-brand", Color = "#7B6E5D" },
            new() { Name = "Newsletter", Slug = "newsletter", Color = "#6B8E6B" },
            new() { Name = "VIP", Slug = "vip", Color = "#C4A882" },
        };

        await db.SubscriberTags.AddRangeAsync(tags);
    }

    private static async Task SeedGalleriesAsync(AppDbContext db)
    {
        if (await db.Galleries.AnyAsync()) return;

        var galleries = new List<Gallery>
        {
            new() { BrandId = WellKnownIds.ParentBrandId, Name = "Sacred Vibes Yoga Gallery", Slug = "yoga-gallery", Description = "Moments from our yoga classes, workshops, and community.", IsActive = true, IsDefault = true },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "Sacred Hands Gallery", Slug = "massage-gallery", Description = "Our serene treatment spaces and healing environment.", IsActive = true, IsDefault = true },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Sacred Sound Gallery", Slug = "sound-gallery", Description = "Sound healing sessions, bowls, and our magical river events.", IsActive = true, IsDefault = true },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Sound on the River", Slug = "sound-on-the-river-gallery", Description = "Photos from our outdoor Sound on the River sound bath experiences.", IsActive = true },
        };

        await db.Galleries.AddRangeAsync(galleries);
    }

    private static async Task SeedServicesAsync(AppDbContext db)
    {
        if (await db.ServiceOfferings.AnyAsync()) return;

        var services = new List<ServiceOffering>
        {
            // Sacred Vibes Yoga classes
            new() { BrandId = WellKnownIds.ParentBrandId, Name = "Drop-In Yoga Class", Slug = "drop-in-yoga", ShortDescription = "All-levels yoga class. Drop in anytime.", Description = "Join us for a grounding, all-levels yoga class. Whether you're brand new to yoga or a seasoned practitioner, you'll find space to breathe, move, and reconnect with yourself.", Category = "Yoga Class", PriceType = PriceType.Fixed, Price = 20, DurationMinutes = 60, IsBookable = true, IsActive = true, SortOrder = 0 },
            new() { BrandId = WellKnownIds.ParentBrandId, Name = "Monthly Unlimited Yoga", Slug = "monthly-unlimited", ShortDescription = "Unlimited classes for one month.", Description = "Commit to your practice with our monthly unlimited pass. Access all regularly scheduled yoga classes for one full month.", Category = "Membership", PriceType = PriceType.Fixed, Price = 120, IsBookable = true, IsActive = true, SortOrder = 1 },
            new() { BrandId = WellKnownIds.ParentBrandId, Name = "Private Yoga Session", Slug = "private-yoga", ShortDescription = "One-on-one personalized yoga instruction.", Description = "A private session tailored entirely to your goals, needs, and experience level. Perfect for beginners, those with injuries, or practitioners wanting to deepen specific aspects of their practice.", Category = "Private", PriceType = PriceType.Fixed, Price = 95, DurationMinutes = 75, IsBookable = true, IsActive = true, SortOrder = 2 },

            // Sacred Hands services
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "60-Minute Swedish Massage", Slug = "swedish-60", ShortDescription = "Classic relaxation massage.", Description = "A full-body relaxation massage using long, flowing strokes to ease muscle tension and promote deep relaxation. Perfect for stress relief and unwinding.", Category = "Massage", PriceType = PriceType.Fixed, Price = 90, DurationMinutes = 60, IsBookable = true, IsActive = true, SortOrder = 0 },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "90-Minute Deep Tissue Massage", Slug = "deep-tissue-90", ShortDescription = "Targeted deep muscle work.", Description = "Focused therapeutic massage targeting deep layers of muscle tissue. Ideal for chronic pain, tension, and recovery. Our therapists use firm pressure and precise technique to release deeply held holding patterns.", Category = "Massage", PriceType = PriceType.Fixed, Price = 130, DurationMinutes = 90, IsBookable = true, IsActive = true, SortOrder = 1 },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "Sacred Hot Stone Massage", Slug = "hot-stone-massage", ShortDescription = "Warming stones for deep relaxation.", Description = "Smooth, heated volcanic stones are placed on key points of the body and used as massage tools to melt away tension and warm deep muscle tissue. A truly sacred, ceremonial experience.", Category = "Specialty", PriceType = PriceType.Fixed, Price = 140, DurationMinutes = 90, IsBookable = true, IsActive = true, SortOrder = 2 },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "Prenatal Massage", Slug = "prenatal-massage", ShortDescription = "Gentle, nurturing massage for expectant mothers.", Description = "Specifically designed for the unique needs of pregnancy, our prenatal massage supports the changing body, reduces discomfort, and creates a moment of stillness and care for mother and baby.", Category = "Specialty", PriceType = PriceType.Fixed, Price = 100, DurationMinutes = 60, IsBookable = true, IsActive = true, SortOrder = 3 },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "Craniosacral Therapy", Slug = "craniosacral", ShortDescription = "Gentle touch for nervous system healing.", Description = "A light-touch approach to releasing tension in the central nervous system. Through gentle holds and subtle movements, this therapy supports the body's natural healing capacity at a deep level.", Category = "Specialty", PriceType = PriceType.Fixed, Price = 110, DurationMinutes = 75, IsBookable = true, IsActive = true, SortOrder = 4 },

            // Sacred Sound classes
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Community Sound Bath", Slug = "community-sound-bath", ShortDescription = "Group sound healing with bowls and gong.", Description = "Lie back, relax, and let the vibrations of crystal singing bowls, Tibetan bowls, and gong wash over and through you. A deeply restorative group experience.", Category = "Sound Healing", PriceType = PriceType.Fixed, Price = 30, DurationMinutes = 75, IsBookable = true, IsActive = true, SortOrder = 0 },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Private Sound Healing Session", Slug = "private-sound-healing", ShortDescription = "One-on-one personalized sound healing.", Description = "A deeply personal sound healing session tailored specifically to your intentions and needs. Your practitioner will work with you to select instruments and techniques for maximum benefit.", Category = "Sound Healing", PriceType = PriceType.Fixed, Price = 120, DurationMinutes = 75, IsBookable = true, IsActive = true, SortOrder = 1 },
        };

        await db.ServiceOfferings.AddRangeAsync(services);
    }

    private static async Task SeedEventsAsync(AppDbContext db)
    {
        if (await db.EventOfferings.AnyAsync()) return;

        var now = DateTime.UtcNow;
        var events = new List<EventOffering>
        {
            new() { BrandId = WellKnownIds.ParentBrandId, Name = "Full Moon Yoga & Sound Journey", Slug = "full-moon-yoga-sound", ShortDescription = "Celebrate the full moon with yoga and sound healing.", Description = "Join us for this sacred monthly ritual combining intuitive yoga flow with a deeply restorative sound healing journey. We honor the energy of the full moon with movement, breathwork, and vibrational healing. A truly transformative evening.", Category = "Special Event", StartAt = now.AddDays(14).Date.AddHours(19), EndAt = now.AddDays(14).Date.AddHours(21), Venue = "Sacred Vibes Yoga Studio", City = "Asheville", State = "NC", Price = 45, PriceType = PriceType.Fixed, Capacity = 25, IsBookable = true, IsActive = true, IsFeatured = true, InstructorName = "Sacred Vibes Team" },
            new() { BrandId = WellKnownIds.ParentBrandId, Name = "Yoga & Wellness Weekend Intensive", Slug = "yoga-wellness-intensive", ShortDescription = "A transformative 2-day yoga intensive.", Description = "Immerse yourself in two full days of yoga practice, pranayama, meditation, and wellness workshops. This intensive is designed for practitioners looking to deepen their practice and expand their understanding of yoga philosophy.", Category = "Workshop", StartAt = now.AddDays(30).Date.AddHours(9), EndAt = now.AddDays(31).Date.AddHours(17), Venue = "Sacred Vibes Yoga Studio", City = "Asheville", State = "NC", Price = 195, PriceType = PriceType.Fixed, Capacity = 20, IsBookable = true, IsActive = true, IsFeatured = true, InstructorName = "Sacred Vibes Lead Teacher" },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Name = "Self-Care Workshop: Massage & Movement", Slug = "self-care-workshop", ShortDescription = "Learn self-massage techniques for daily wellness.", Description = "This hands-on workshop teaches practical self-massage and movement techniques you can use every day to manage tension, improve circulation, and support your overall well-being.", Category = "Workshop", StartAt = now.AddDays(21).Date.AddHours(14), EndAt = now.AddDays(21).Date.AddHours(17), Venue = "Sacred Hands Studio", City = "Asheville", State = "NC", Price = 65, PriceType = PriceType.Fixed, Capacity = 15, IsBookable = true, IsActive = true },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Sound on the River — Summer Session", Slug = "sound-on-the-river-summer", ShortDescription = "Outdoor sound bath on the river.", Description = "Our most beloved offering: an outdoor sound healing ceremony held on the banks of the French Broad River. Surrounded by nature, the sounds of moving water, and the voices of crystal and Tibetan bowls, this experience is unlike anything else. Bring a blanket or yoga mat, water, and an open heart.", Category = "Sound on the River", StartAt = now.AddDays(45).Date.AddHours(18), EndAt = now.AddDays(45).Date.AddHours(20), Venue = "French Broad River Access", Address = "River Arts District", City = "Asheville", State = "NC", Price = 40, PriceType = PriceType.Fixed, Capacity = 40, IsBookable = true, IsActive = true, IsFeatured = true, IsSoundOnTheRiver = true, InstructorName = "Sacred Sound Practitioner" },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Introduction to Sound Healing", Slug = "intro-sound-healing", ShortDescription = "Beginner workshop on sound healing practices.", Description = "New to sound healing? This workshop is your doorway in. You'll learn the history, science, and practice of sound healing, experience a variety of instruments, and leave with tools for your own practice.", Category = "Workshop", StartAt = now.AddDays(10).Date.AddHours(13), EndAt = now.AddDays(10).Date.AddHours(16), Venue = "Sacred Sound Studio", City = "Asheville", State = "NC", Price = 75, PriceType = PriceType.Fixed, Capacity = 18, IsBookable = true, IsActive = true },
        };

        await db.EventOfferings.AddRangeAsync(events);
    }

    private static async Task SeedBlogPostsAsync(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        if (await db.BlogPosts.AnyAsync()) return;

        var admin = await userManager.FindByEmailAsync("admin@sacredvibesyoga.com");
        if (admin is null) return;

        // Seed categories
        var yogaCat = new BlogCategory { BrandId = WellKnownIds.ParentBrandId, Name = "Yoga Practice", Slug = "yoga-practice" };
        var mindfulnessCat = new BlogCategory { BrandId = WellKnownIds.ParentBrandId, Name = "Mindfulness", Slug = "mindfulness" };
        var massageCat = new BlogCategory { BrandId = WellKnownIds.SacredHandsBrandId, Name = "Massage & Bodywork", Slug = "massage-bodywork" };
        var soundCat = new BlogCategory { BrandId = WellKnownIds.SacredSoundBrandId, Name = "Sound Healing", Slug = "sound-healing" };

        await db.BlogCategories.AddRangeAsync(yogaCat, mindfulnessCat, massageCat, soundCat);

        var posts = new List<BlogPost>
        {
            new()
            {
                BrandId = WellKnownIds.ParentBrandId,
                AuthorId = admin.Id,
                Title = "5 Ways to Deepen Your Yoga Practice at Home",
                Slug = "deepen-yoga-practice-at-home",
                Excerpt = "Your yoga practice doesn't have to end when you leave the studio. Here are five powerful ways to cultivate depth, consistency, and meaning in your home practice.",
                Content = """
<h2>Creating Space for Practice</h2>
<p>One of the most powerful things you can do is designate a specific space in your home for practice. It doesn't need to be large — even a corner of a room becomes sacred when you return to it with intention again and again.</p>

<h2>Working with Breath First</h2>
<p>Before moving into physical postures, spend five minutes with breath awareness. This single shift — leading with breath rather than body — transforms the entire quality of your practice. Pranayama techniques like nadi shodhana (alternate nostril breathing) can calm the nervous system and prepare the mind for deeper work.</p>

<h2>Choose a Focus</h2>
<p>Rather than randomly moving through poses, choose one theme per practice: hip opening, twists, forward folds, balance, or a particular chakra. This focus creates coherence and accelerates learning.</p>

<h2>Close with Savasana. Always.</h2>
<p>The integration that happens during savasana is as important as the work that preceded it. Rushing through or skipping this final resting pose is the most common and costly shortcut practitioners take. Give yourself a minimum of five minutes.</p>

<h2>Journal After Practice</h2>
<p>Spending a few minutes writing after practice — noting what you noticed, what felt charged, what released — builds a rich record of your inner landscape over time. You may be surprised what you discover about yourself.</p>
""",
                Status = ContentStatus.Published,
                PublishedAt = DateTime.UtcNow.AddDays(-7),
                SeoTitle = "5 Ways to Deepen Your Yoga Practice at Home | Sacred Vibes Yoga",
                SeoDescription = "Practical, meaningful strategies to build depth and consistency in your home yoga practice.",
            },
            new()
            {
                BrandId = WellKnownIds.SacredHandsBrandId,
                AuthorId = admin.Id,
                Title = "The Healing Power of Therapeutic Touch",
                Slug = "healing-power-of-therapeutic-touch",
                Excerpt = "Touch is one of our most fundamental human needs. Discover how therapeutic massage goes far beyond relaxation to support genuine healing at every level.",
                Content = """
<h2>More Than Relaxation</h2>
<p>When most people think of massage, they think of relaxation. And yes — quality massage therapy is deeply relaxing. But reducing therapeutic touch to mere relaxation misses the profound healing potential that skilled bodywork can offer.</p>

<h2>The Nervous System Connection</h2>
<p>Therapeutic touch directly influences the autonomic nervous system. Regular massage has been shown to reduce cortisol, the body's primary stress hormone, while increasing serotonin and dopamine. This isn't just a pleasant experience — it's measurable physiological change.</p>

<h2>Releasing Stored Tension</h2>
<p>The body holds memory. Stress, trauma, and habitual patterns of tension become encoded in the tissues themselves. Skilled massage therapists work not just with muscle but with the stories the body holds, supporting gradual release and reorganization.</p>

<h2>Creating Space for the Whole Self</h2>
<p>In a world that demands constant doing and performing, receiving therapeutic touch is an act of profound self-care. The massage table becomes a space where the only expectation is to be present and to receive. This in itself is healing.</p>
""",
                Status = ContentStatus.Published,
                PublishedAt = DateTime.UtcNow.AddDays(-14),
                SeoTitle = "The Healing Power of Therapeutic Touch | Sacred Hands",
                SeoDescription = "How therapeutic massage supports healing beyond relaxation — the science and soulfulness of skilled bodywork.",
            },
            new()
            {
                BrandId = WellKnownIds.SacredSoundBrandId,
                AuthorId = admin.Id,
                Title = "What Happens in a Sound Bath? A Beginner's Guide",
                Slug = "what-happens-in-a-sound-bath",
                Excerpt = "If you've been curious about sound healing but aren't sure what to expect, this guide is for you. Here's exactly what happens in a sound bath and why it works.",
                Content = """
<h2>Arriving and Setting Up</h2>
<p>When you arrive for a sound bath, you'll set up a comfortable resting space — typically a yoga mat, blanket, and pillow. Many people bring an eye pillow as well. The intention is simply to lie down, get comfortable, and let go.</p>

<h2>The Experience Itself</h2>
<p>As the session begins, your practitioner will sound a variety of instruments: crystal singing bowls, Tibetan bowls, gongs, chimes, and other resonant tools. The sounds build, layer, and shift throughout the session. You may feel vibration in your body, notice your mind quiet or drift, or experience emotional shifts.</p>

<h2>The Science of Sound Healing</h2>
<p>Sound healing works through the principle of entrainment — the tendency of our brainwaves to synchronize with external rhythms. The frequencies produced by instruments like singing bowls support the brain in shifting from beta (active, thinking) to alpha and theta states (deeply relaxed, meditative). This is the same state achieved during deep meditation.</p>

<h2>What You Might Experience</h2>
<p>Experiences vary widely and are all valid. Some people feel deeply sleepy or enter a dreamy state. Others experience vivid visualizations or emotional releases. Some feel tingling or warmth. Many simply feel profoundly peaceful. There is no wrong experience.</p>

<h2>Integration Afterward</h2>
<p>After a sound bath, give yourself time to gently return. Drink water, move slowly, and allow the experience to settle. Many people find that the effects continue to unfold over the following hours or even days.</p>
""",
                Status = ContentStatus.Published,
                PublishedAt = DateTime.UtcNow.AddDays(-5),
                SeoTitle = "What Happens in a Sound Bath? A Beginner's Guide | Sacred Sound",
                SeoDescription = "Everything a first-time sound bath participant needs to know — what to expect, how it works, and what you might experience.",
            }
        };

        await db.BlogPosts.AddRangeAsync(posts);
    }

    private static async Task SeedPagesAsync(AppDbContext db)
    {
        if (await db.Pages.AnyAsync()) return;

        var pages = new List<Page>
        {
            // Sacred Vibes Yoga (parent)
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Home", Slug = "home", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, Template = "home" },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "About Sacred Vibes Yoga", Slug = "about", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, SeoTitle = "About Us | Sacred Vibes Yoga", SeoDescription = "Learn about Sacred Vibes Yoga — our story, our teachers, and our mission." },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Yoga Classes", Slug = "classes", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, SeoTitle = "Yoga Classes | Sacred Vibes Yoga", SeoDescription = "Explore our yoga class offerings for all levels." },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Yoga Workshops", Slug = "workshops", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Events", Slug = "events", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Gallery", Slug = "gallery", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Contact", Slug = "contact", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Sacred Hands", Slug = "sacred-hands", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.ParentBrandId, Title = "Sacred Sound", Slug = "sacred-sound", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },

            // Sacred Hands
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Title = "Home", Slug = "home", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, Template = "home" },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Title = "About Sacred Hands", Slug = "about", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Title = "Massage Services", Slug = "services", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Title = "Book a Massage", Slug = "booking", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, Template = "booking" },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Title = "Gallery", Slug = "gallery", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredHandsBrandId, Title = "Contact", Slug = "contact", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },

            // Sacred Sound
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "Home", Slug = "home", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, Template = "home" },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "About Sacred Sound", Slug = "about", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "Sound Healing", Slug = "sound-healing", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "Workshops", Slug = "workshops", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "Sound on the River", Slug = "sound-on-the-river", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, Template = "sound-on-the-river" },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "Gallery", Slug = "gallery", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
            new() { BrandId = WellKnownIds.SacredSoundBrandId, Title = "Contact", Slug = "contact", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow },
        };

        await db.Pages.AddRangeAsync(pages);
    }

    private static async Task SeedIntegrationSettingsAsync(AppDbContext db)
    {
        if (await db.IntegrationSettings.AnyAsync()) return;

        var settings = new List<IntegrationSetting>
        {
            new() { Provider = "Square", SettingsJson = """{"environment":"sandbox","applicationId":"","accessToken":"","locationId":"","webhookSignatureKey":""}""", IsEnabled = false },
            new() { Provider = "Stripe", SettingsJson = """{"secretKey":"","publishableKey":""}""", IsEnabled = false },
            new() { Provider = "Email", SettingsJson = """{"smtpHost":"","smtpPort":587,"smtpUser":"","smtpPassword":"","fromEmail":"noreply@sacredvibesyoga.com","fromName":"Sacred Vibes Yoga"}""", IsEnabled = false },
        };

        await db.IntegrationSettings.AddRangeAsync(settings);
    }
}

public static class WellKnownIds
{
    public static readonly Guid ParentBrandId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid SacredHandsBrandId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SacredSoundBrandId = Guid.Parse("33333333-3333-3333-3333-333333333333");
}
