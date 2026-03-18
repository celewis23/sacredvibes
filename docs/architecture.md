# Architecture Guide

## Overview

Sacred Vibes is a monorepo containing two primary applications:

1. **Frontend** — Next.js 15 App Router serving all public-facing brand sites and the admin dashboard
2. **Backend** — ASP.NET Core 9 Web API using Clean Architecture principles

---

## Backend: Clean Architecture Layers

### Domain (`SacredVibes.Domain`)
The innermost layer. No dependencies on other layers or packages beyond Identity abstractions.

- **Entities:** `Brand`, `Page`, `BlogPost`, `Asset`, `Gallery`, `Subscriber`, `Lead`, `ServiceOffering`, `EventOffering`, `Booking`, `PaymentRecord`, `ImportJob`, `ApplicationUser`, `RefreshToken`, etc.
- **Enums:** `BrandType`, `ContentStatus`, `BookingStatus`, `PaymentStatus`, `AssetType`, `ImportSource`, `LeadType`, etc.
- **Interfaces:** `IRepository<T>`, `IUnitOfWork`, `IStorageService`

All entities extend `BaseEntity` which provides `Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt` for soft-delete support.

### Application (`SacredVibes.Application`)
Business logic contracts and DTOs. Depends only on Domain.

- **Feature modules:** `Auth`, `Brands`, `Blog`, `Assets`, `Galleries`, `Subscribers`, `Leads`, `Bookings`, `Payments`, `Imports`, `Settings`
- **Interfaces:** `IAuthService`, `ISquareService`, `IStripeImportService`, `ICsvImportService`, `IImageProcessingService`, `ICurrentUserService`
- **DTOs:** Request/Response models, paginated results, filter requests

### Infrastructure (`SacredVibes.Infrastructure`)
Concrete implementations of all interfaces. Depends on Application and Domain.

- **Data:** `AppDbContext`, EF Core entity configurations, `SeedData`
- **Services:**
  - `AuthService` — JWT + refresh token auth
  - `LocalStorageService` — file storage (swap for S3 by reimplementing `IStorageService`)
  - `ImageProcessingService` — WebP optimization with SixLabors.ImageSharp
  - `SquareService` — checkout, webhook handling, customer import
  - `StripeImportService` — customer contact import
  - `CsvImportService` — CSV parsing, preview, and import
- **DependencyInjection.cs** — Single extension method to register all services

### API (`SacredVibes.Api`)
ASP.NET Core application host. Depends on Infrastructure and Application.

- **Controllers:** `AuthController`, `BlogController`, `AssetsController`, `BookingsController`, `SubscribersController`, `LeadsController`, `DashboardController`
- **Middleware:** JWT bearer middleware, rate limiting, CORS
- **Program.cs:** Service registration and pipeline configuration

---

## Frontend: Next.js App Router

### Route Structure

```
src/app/
├── layout.tsx           Root layout with fonts, providers, Toaster
├── globals.css          Tailwind + custom utilities
├── providers.tsx        QueryClient + AuthProvider
├── page.tsx             Brand-aware root — renders correct HomePage
├── middleware.ts        Host → brand resolution, admin route protection
│
├── admin/               Admin dashboard (auth-protected)
│   ├── layout.tsx
│   ├── page.tsx         Dashboard stats
│   ├── login/           Login page
│   ├── blog/
│   ├── media/
│   ├── subscribers/
│   ├── bookings/
│   ├── leads/
│   ├── imports/
│   └── ...
│
└── [other public pages routed via middleware brand context]
```

### Brand Resolution

1. **Request arrives** at Next.js
2. **`middleware.ts`** reads the `host` header
3. Maps host → brand slug (`sacred-vibes-yoga`, `sacred-hands`, `sacred-sound`, or `admin`)
4. Sets `x-brand` response header
5. Server components read this header via `headers()` to determine which brand to render
6. `resolveBrandFromHost()` returns full `BrandContext` with nav links, color scheme, and brand metadata

### Design System

All brand color palettes are defined in `tailwind.config.ts`:

- `yoga.*` — Warm earthy tones (browns, taupes)
- `hands.*` — Deep warm neutrals
- `sound.*` — Soft violet/indigo
- `sacred.*` — Shared neutrals

The system supports per-brand styling through Tailwind utility classes. Components accept an optional `colorScheme` prop to adapt their appearance.

---

## Database Schema

PostgreSQL with EF Core. Key relationships:

```
Brand (1) ──→ (N) Page
Brand (1) ──→ (N) BlogPost ──→ (N) BlogPostCategory ──→ BlogCategory
                            ──→ (N) BlogPostTag ──→ BlogTag
Brand (1) ──→ (N) Gallery ──→ (N) GalleryAsset ──→ Asset
Brand (1) ──→ (N) ServiceOffering ──→ (N) Booking
Brand (1) ──→ (N) EventOffering ──→ (N) Booking ──→ (N) PaymentRecord
Subscriber ──→ (N) SubscriberTagMap ──→ SubscriberTag
ImportJob ──→ (N) ImportJobItem
ApplicationUser ──→ (N) RefreshToken
```

**Soft deletes:** All `BaseEntity` tables support soft delete via `IsDeleted` column. EF Core global query filters automatically exclude soft-deleted records from all queries.

**JSONB columns:** PostgreSQL JSONB is used for flexible storage:
- `Brand.ThemeSettingsJson` — Brand theme configuration
- `Brand.SeoSettingsJson` — SEO defaults per brand
- `Asset.TagsJson` — Free-form asset tags
- `Asset.VariantsJson` — Generated image variant paths
- `Booking.MetadataJson` — Extensible booking metadata

---

## Security

- **Authentication:** JWT access tokens (60-minute expiry) + refresh tokens (30-day, stored in DB)
- **Token rotation:** Refresh tokens are rotated on each use
- **Account lockout:** 5 failed attempts triggers 15-minute lockout (ASP.NET Identity)
- **Soft deletes:** Data is never permanently deleted by default
- **Webhook validation:** Square webhooks validated via HMAC-SHA256 signature
- **File upload validation:** Content type and size validated before storage
- **Input validation:** Model validation + EF Core type safety
- **Rate limiting:** Applied to `/api/leads` (5/min) and `/api/auth` (10/5min)
- **CORS:** Explicit allowlist of production domains
- **Honeypot fields:** Lead/contact forms include a hidden honeypot for spam protection
- **Audit logging:** `AuditLog` entity tracks admin actions

---

## Image Processing Pipeline

1. File uploaded via `POST /api/assets/upload`
2. Content type and size validated
3. Original file stored via `IStorageService`
4. `IImageProcessingService.ProcessAsync()` called with the stream
5. SixLabors.ImageSharp resizes to thumbnail (300px), medium (800px), large (1600px)
6. All variants converted to WebP at 82% quality
7. Variants stored alongside original
8. `Asset.VariantsJson` stores path map: `{"thumbnail": "...", "medium": "...", "large": "..."}`
9. Frontend reads `variantsJson` and uses appropriate size for context

---

## Pluggable Storage

Storage is abstracted behind `IStorageService`:

```csharp
public interface IStorageService {
    Task<StorageResult> StoreAsync(Stream, string fileName, string contentType, string? folder);
    Task<Stream?> GetAsync(string storagePath);
    Task<bool> DeleteAsync(string storagePath);
    string GetPublicUrl(string storagePath);
}
```

Currently implemented: `LocalStorageService` (filesystem).

**To switch to S3:** Implement `IStorageService` with the AWS S3 SDK or MinIO, then change the DI registration in `DependencyInjection.cs`:

```csharp
// Change this line in DependencyInjection.cs:
services.AddScoped<IStorageService, S3StorageService>();
```

No other code changes required.
