# Integrations Guide

## Square (Payments)

Square is the primary payment processor for Sacred Vibes. It handles booking checkout, payment status sync, and customer data import.

### Setup

1. Create a Square Developer account at [developer.squareup.com](https://developer.squareup.com)
2. Create a new application
3. Copy credentials from the application dashboard

### Required Configuration

| Key | Where to Find |
|-----|---------------|
| `Square:AccessToken` | Developer Dashboard → Credentials → Access Token |
| `Square:ApplicationId` | Developer Dashboard → Credentials → Application ID |
| `Square:LocationId` | Developer Dashboard → Locations (use the primary location ID) |
| `Square:WebhookSignatureKey` | Configured after creating the webhook endpoint (see below) |
| `Square:Environment` | `sandbox` for testing, `production` for live |
| `Square:WebhookNotificationUrl` | Your full webhook URL, e.g. `https://api.sacredvibesyoga.com/api/bookings/webhooks/square` |

### Webhook Setup

1. In the Square Developer Dashboard, go to your application → Webhooks
2. Add endpoint URL: `https://api.sacredvibesyoga.com/api/bookings/webhooks/square`
3. Subscribe to these events:
   - `payment.created`
   - `payment.updated`
   - `order.updated`
   - `refund.created`
   - `refund.updated`
4. Copy the **Signature Key** shown after saving
5. Set `Square:WebhookSignatureKey` in your environment

### Payment Flow

```
Customer → Booking Form → POST /api/bookings
                                   ↓
                       POST /api/bookings/{id}/checkout
                                   ↓
                       Square creates payment link
                                   ↓
                       Customer redirected to Square-hosted checkout
                                   ↓
                       Square sends webhook: payment.updated
                                   ↓
                       BookingsController verifies HMAC-SHA256 signature
                                   ↓
                       Booking.Status → Paid, PaymentRecord created
                                   ↓
                       Customer redirected to return URL
```

### Customer Import

The admin panel provides a **Square Import** button on the Subscribers page. This paginates through all Square customers and upserts them as subscribers:

- Customers without an email address are skipped
- Existing subscribers (matched by email) have their name/phone filled in if empty
- New subscribers are created with `Source = Square` and `ConsentStatus = Unknown`

Endpoint: `POST /api/subscribers/import/square`

### Sandbox Testing

With `Square:Environment=sandbox`, the API base URL switches to `https://connect.squareupsandbox.com`. Use the [Square Sandbox](https://developer.squareup.com/docs/devtools/sandbox/overview) test card numbers to simulate payments without real charges.

---

## Stripe (Contact Import Only)

Stripe is used **read-only** for importing existing customer contacts. Sacred Vibes does not process payments through Stripe.

### Setup

1. Log in to the Stripe Dashboard
2. Go to Developers → API Keys
3. Copy the **Secret Key** (starts with `sk_live_` for production, `sk_test_` for testing)

### Configuration

| Key | Description |
|-----|-------------|
| `Stripe:ApiKey` | Secret key from the Stripe Dashboard |

### Import Process

The import fetches all Stripe customers in pages of 100, ordered by creation date ascending:

1. Fetches `GET /v1/customers?limit=100` (with `starting_after` cursor for pagination)
2. Skips customers without an email address
3. Creates an `ImportJob` record tracking progress
4. Upserts subscribers by email — updates name/phone if existing, inserts if new
5. Tags all imported subscribers with a `stripe-import` tag if it exists in the database
6. Returns a summary: total fetched, inserted, updated, skipped, errors

Endpoint: `POST /api/subscribers/import/stripe`

### Notes

- The import is safe to run multiple times — deduplication prevents duplicate records
- Stripe customer metadata is not imported (only email, first name, last name, phone)
- Customers marked as deleted in Stripe are not excluded from the import (Stripe's API returns them; you may want to filter manually)

---

## Eventbrite (Event Sync)

Eventbrite is used for event discovery, registration, and ticketing. Sacred Vibes can import Eventbrite events into the website, push local admin events to Eventbrite, and link synced website events back to their Eventbrite registration page.

### Setup

1. In Eventbrite, create or open your developer API key.
2. Copy the private token for server-side API access.
3. Find your Eventbrite organization ID. If your account does not belong to a separate organization, Eventbrite may use your user ID as the default organization ID.
4. Optional: create or find a default Eventbrite venue ID for in-person events.

### Required Configuration

Use .NET double-underscore names in Railway/Vercel-style environment variables:

| Key | Description |
|-----|-------------|
| `Eventbrite__PrivateToken` | Private token used by the backend. Do not expose this in the frontend. |
| `Eventbrite__OrganizationId` | Optional Eventbrite API organization ID used for listing and creating events. Leave blank to auto-discover from the private token. |
| `Eventbrite__OrganizerId` | Optional public organizer ID from a URL like `/o/name-17611651589`. When set, imports read events from that organizer feed. |
| `Eventbrite__ImportStatuses` | Optional status filter for imports. Defaults to `live`; use `all` only when intentionally importing drafts, completed, or canceled Eventbrite events. |
| `Eventbrite__DefaultVenueId` | Optional Eventbrite venue ID attached when pushing in-person events. |
| `Eventbrite__PublishOnCreate` | `true` to publish immediately after creation, `false` to leave pushed events as drafts. |

The public token, API key, and client secret are not needed for the current server-to-server sync. Keep them stored securely for future OAuth/app-partner work.

### Admin Workflow

The Admin Events page provides:

- **Import Eventbrite** — pulls Eventbrite events into the selected brand.
- **Push All** — pushes active local events to Eventbrite.
- **Sync** — imports Eventbrite events first, then pushes active local events back.
- **Test Eventbrite** — checks whether the private token can see Eventbrite organizations and shows sample events from the resolved organization.
- **Push** on an individual event — creates or updates that event in Eventbrite.

Imported events are matched by `ExternalEventbriteId` first. If no match exists, the importer falls back to matching by event name and start time for the selected brand. Synced events store the Eventbrite URL in `ExternalUrl`, and public event cards link registration buttons to Eventbrite when that URL exists.

If Eventbrite returns `404 NOT_FOUND` with "The path you requested does not exist", the organization ID is usually wrong. The API organization ID is not always the number shown on a public organizer page. Either leave `Eventbrite__OrganizationId` blank so the app calls `GET /users/me/organizations/`, or set it to the `id` returned from that endpoint.

### Create / Update Behavior

When `Eventbrite__PrivateToken` and `Eventbrite__OrganizationId` are configured, creating or editing an event in Admin Events automatically pushes the event to Eventbrite. The Eventbrite event ID is saved locally so future edits update the existing Eventbrite event instead of creating duplicates.

If `Eventbrite__PublishOnCreate=false`, newly pushed events stay in Eventbrite as drafts until you publish them in Eventbrite. This is the safer default while testing.

---

## CSV Import

The CSV importer supports importing subscriber lists from any source (Mailchimp exports, spreadsheet exports, CRMs, etc.).

### File Format

- Standard RFC 4180 CSV
- UTF-8 encoding
- First row must be a header row
- Maximum file size: 10 MB
- Maximum rows: 50,000

### Column Mapping

The importer auto-detects common column names (case-insensitive):

| Detected Column Names | Maps To |
|----------------------|---------|
| `email`, `email_address`, `e-mail` | Email (required) |
| `first_name`, `firstname`, `first name`, `given_name` | First Name |
| `last_name`, `lastname`, `last name`, `family_name`, `surname` | Last Name |
| `phone`, `phone_number`, `mobile`, `cell` | Phone |
| `subscribed`, `is_subscribed`, `active` | Subscription Status |

### Import Workflow

**Preview mode** (`preview=true`): Returns the first 100 rows with validation status. No data is written to the database. Use this to verify column mapping before committing.

**Full import**: Processes the entire file. Each row is validated, deduplicated, and inserted or updated.

Endpoint: `POST /api/subscribers/import/csv`

Form fields:
- `file` — the CSV file (multipart/form-data)
- `preview` — `true` to preview, `false` (or omit) for full import
- `defaultTags` — comma-separated tag slugs to assign to all imported records (optional)
- `brandId` — associate subscribers with a specific brand (optional)

### Example

```bash
# Preview first 100 rows
curl -X POST https://api.sacredvibesyoga.com/api/subscribers/import/csv \
  -H "Authorization: Bearer <admin-token>" \
  -F "file=@subscribers.csv" \
  -F "preview=true"

# Full import with tags
curl -X POST https://api.sacredvibesyoga.com/api/subscribers/import/csv \
  -H "Authorization: Bearer <admin-token>" \
  -F "file=@subscribers.csv" \
  -F "defaultTags=newsletter,yoga-students"
```

### Import Job Tracking

All imports (Square, Stripe, CSV) create an `ImportJob` record:

- `GET /api/subscribers/import/jobs` — list all import jobs
- `GET /api/subscribers/import/jobs/{id}` — detail with per-row results

Jobs are retained indefinitely. Each job stores: provider, status, total/inserted/updated/skipped/errors counts, and error messages.

---

## Email (Planned)

The system has placeholder hooks for email notifications but does not ship with an email provider integration. The recommended approach is to add one of these providers by implementing an `IEmailService` interface:

| Provider | Notes |
|----------|-------|
| **Postmark** | Recommended for transactional email |
| **SendGrid** | Good for bulk/marketing email |
| **Resend** | Modern API, generous free tier |
| **AWS SES** | Cost-effective at scale |

Emails triggered by the platform:
- Booking confirmation (to customer + studio)
- Payment receipt
- Password reset
- New lead notification (to admin)

To implement: create a service class implementing `IEmailService`, register it in `DependencyInjection.cs`, and inject it into `BookingsController`, `LeadsController`, and `AuthService` where `// TODO: send email` comments appear.

---

## Media Storage

Media storage uses a pluggable `IStorageService` abstraction. The default implementation is local filesystem storage.

### Local Storage (Default)

| Config Key | Description | Default |
|------------|-------------|---------|
| `Storage:BasePath` | Absolute path to store uploaded files | `/srv/sacred-vibes/uploads` |
| `Storage:BaseUrl` | Public URL prefix for stored files | `http://localhost:5000/uploads` |

Files are stored at `{BasePath}/{folder}/{filename}` and served by nginx directly (see nginx config in `deployment.md`) or via the API's static file middleware in development.

### Switching to S3-Compatible Storage

To use S3, R2, MinIO, or any S3-compatible service:

1. Add the `AWSSDK.S3` NuGet package (or `Minio` for MinIO)
2. Create `S3StorageService : IStorageService` in `SacredVibes.Infrastructure/Services/Storage/`
3. In `DependencyInjection.cs`, change:
   ```csharp
   // From:
   services.AddScoped<IStorageService, LocalStorageService>();
   // To:
   services.AddScoped<IStorageService, S3StorageService>();
   ```
4. Add S3 config keys: `Storage:BucketName`, `Storage:Region`, `Storage:AccessKey`, `Storage:SecretKey`

The rest of the application — upload endpoints, image processing, asset records — requires no changes.

### Image Processing

All uploaded images are automatically processed by `ImageProcessingService` (SixLabors.ImageSharp):

| Variant | Max Dimension | Format | Quality |
|---------|--------------|--------|---------|
| `thumbnail` | 300px wide | WebP | 82% |
| `medium` | 800px wide | WebP | 82% |
| `large` | 1600px wide | WebP | 82% |

- Original files are retained alongside variants
- Images are never upscaled (if the original is smaller than a variant size, that variant is omitted)
- Non-image file types (PDF, video) skip image processing and are stored as-is
- Variant URLs are stored in `Asset.VariantsJson` as `{"thumbnail": "...", "medium": "...", "large": "..."}`
