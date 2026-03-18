# Sacred Vibes Yoga — Multi-Brand Wellness Platform

A production-ready, multi-brand wellness platform for Sacred Vibes Yoga and its sub-brands Sacred Hands and Sacred Sound. Built with Next.js 15, ASP.NET Core 9, PostgreSQL, and Square payments.

---

## Architecture Overview

```
sacred-vibes/
├── frontend/          Next.js 15 App Router (TypeScript)
├── backend/           ASP.NET Core 9 Clean Architecture
│   └── src/
│       ├── SacredVibes.Domain         Entities, enums, interfaces
│       ├── SacredVibes.Application    DTOs, service interfaces, business logic contracts
│       ├── SacredVibes.Infrastructure EF Core, Square, Stripe, CSV, storage, image processing
│       └── SacredVibes.Api            Controllers, middleware, OpenAPI
└── docs/              Architecture and deployment guides
```

**Domain strategy:**

| Host                            | Brand                |
|---------------------------------|----------------------|
| `sacredvibesyoga.com`           | Sacred Vibes Yoga    |
| `hands.sacredvibesyoga.com`     | Sacred Hands         |
| `sound.sacredvibesyoga.com`     | Sacred Sound         |
| `admin.sacredvibesyoga.com`     | Admin Dashboard      |

---

## Quick Start (Docker)

### Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- A `.env` file at the project root (see `.env.example`)

```bash
# 1. Clone and enter the project
git clone <repo> sacred-vibes && cd sacred-vibes

# 2. Configure environment
cp .env.example .env
# Edit .env with at minimum: POSTGRES_PASSWORD and JWT_SECRET

# 3. Start all services
docker compose up -d

# 4. Open the app
# Frontend:  http://localhost:3000
# API:       http://localhost:5000
# Swagger:   http://localhost:5000/swagger
# Admin:     http://localhost:3000/admin
```

Default admin credentials (seeded):
- **Email:** `admin@sacredvibesyoga.com`
- **Password:** `Admin@Sacred2025!`

**Change this password immediately after first login.**

---

## Local Development (without Docker)

### Requirements

- .NET 9 SDK
- Node.js 22+
- PostgreSQL 15+

### Backend

```bash
cd backend

# Restore packages
dotnet restore

# Set connection string (or use appsettings.Development.json)
export ConnectionStrings__DefaultConnection="Host=localhost;Database=sacredvibes;Username=postgres;Password=yourpassword"
export Jwt__Secret="your-32-char-min-secret-here"

# Run migrations (creates DB and seeds data automatically on first run)
dotnet run --project src/SacredVibes.Api

# API available at: http://localhost:5000
# Swagger UI at:   http://localhost:5000/swagger
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000

# Run dev server
npm run dev

# App available at: http://localhost:3000
```

### Multi-domain local testing

Add to `/etc/hosts`:

```
127.0.0.1  sacredvibesyoga.local
127.0.0.1  hands.sacredvibesyoga.local
127.0.0.1  sound.sacredvibesyoga.local
127.0.0.1  admin.sacredvibesyoga.local
```

Then start Next.js with: `npm run dev -- --hostname 0.0.0.0`

---

## Database Migrations

EF Core migrations are managed from the `SacredVibes.Infrastructure` project.

```bash
cd backend

# Create a new migration
dotnet ef migrations add <MigrationName> \
  --project src/SacredVibes.Infrastructure \
  --startup-project src/SacredVibes.Api

# Apply migrations manually (also runs automatically on startup)
dotnet ef database update \
  --project src/SacredVibes.Infrastructure \
  --startup-project src/SacredVibes.Api
```

---

## Key Features

### Multi-Brand
- Domain/subdomain-aware brand resolution via Next.js middleware
- Per-brand themes, navigation, content, blog, gallery, and bookings
- Shared design system with brand-specific color variations

### Blog Engine
- Separate blog streams per brand
- Draft / Published / Scheduled states
- Rich text content (TipTap editor in admin)
- SEO fields, Open Graph metadata, canonical URLs
- Categories and tags per brand

### Media Library
- Drag-and-drop upload in admin
- Automatic WebP optimization + thumbnail/medium/large variants via ImageSharp
- Masonry gallery with lightbox on public site
- Auto-assign to gallery when marked as gallery item

### Booking & Payments
- Square as primary payment processor
- Full Square checkout flow with webhook processing
- Booking status lifecycle (Pending → Confirmed → Paid → Completed)
- Services (recurring) and Events (dated) per brand

### Email Subscriber Management
- Import from Square, Stripe (contacts only), or CSV
- Deduplication by email
- Subscriber tags with color coding
- CSV export
- Import job history and results

### Admin Dashboard
- Auth-protected at `/admin`
- JWT + refresh token authentication
- Dashboard stats overview
- Full CRUD for blog posts, services, events, bookings
- Media library with upload and asset detail panel
- Subscriber management with import/export

---

## Environment Variables

### Backend (`appsettings.json` or environment)

| Variable | Required | Description |
|----------|----------|-------------|
| `ConnectionStrings:DefaultConnection` | YES | PostgreSQL connection string |
| `Jwt:Secret` | YES | Min 32 char random string |
| `Jwt:Issuer` | No | Default: `SacredVibesApi` |
| `Jwt:Audience` | No | Default: `SacredVibesAdmin` |
| `Storage:BasePath` | No | Local file storage path |
| `Storage:BaseUrl` | No | Public URL prefix for uploads |
| `Square:Environment` | No | `sandbox` or `production` |
| `Square:ApplicationId` | YES (for payments) | Square App ID |
| `Square:AccessToken` | YES (for payments) | Square access token |
| `Square:LocationId` | YES (for payments) | Square location ID |
| `Square:WebhookSignatureKey` | YES (for webhooks) | Square webhook HMAC key |
| `Stripe:SecretKey` | YES (for Stripe import) | Stripe secret key |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | YES | Backend API base URL |

---

## Manual Setup Required

After initial deployment, these steps require manual action:

1. **Change default admin password** — Login at `/admin` and change from the seeded default
2. **Configure Square** — Set up in Integrations admin panel or directly in environment variables
3. **Configure Stripe** — Set `Stripe:SecretKey` in environment for contact imports
4. **Set up subdomain DNS** — Point `hands.*`, `sound.*`, `admin.*` to your server
5. **Configure HTTPS** — Use nginx/Caddy reverse proxy with Let's Encrypt certificates
6. **Set up Square webhooks** — Register webhook URL in Square Developer Dashboard: `https://api.yourdomain.com/api/bookings/webhooks/square`
7. **Configure email** — Set SMTP credentials in Integration Settings for contact form notifications
8. **Upload brand assets** — Add logo images via Media Library and link in Brand settings

See `docs/deployment.md` for detailed deployment instructions.
