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

## Booking Approval Workflow

Customer booking requests no longer charge payment immediately. A request is created as `Pending`, admins review and act on it from Admin → Bookings:

- **Approve** — generates a Square checkout link and emails it to the customer. The booking's requested date/time is what reserves the slot on the admin calendar (Admin → Calendar) immediately. Booking moves to `Confirmed`.
- **Deny** — sends the customer a decline email with the optional reason. Booking moves to `Denied`.
- **Reschedule** — proposes a new date/time and emails the customer. Booking stays `Pending`.

Once the customer completes payment, the existing Square webhook flips the booking to `Paid` and sends a final "you're all set" email — no further admin action needed.

Service bookings (massage, private sessions, etc.) now collect a requested date/time on the public booking form; event bookings still use the event's fixed `StartAt`/`EndAt`. Both feed the same admin calendar view.

| Key | Description |
|-----|-------------|
| `Booking:CheckoutReturnUrl` / `CheckoutCancelUrl` | Where the customer lands after completing/cancelling the Square checkout sent on approval |

---

## Admin Calendar

Admin → Calendar shows every booking with a scheduled date/time (`RequestedStartAt`/`RequestedEndAt`, or the event's own dates) in a month view, color-coded by status. It's built directly from booking data — no external account or sync required. Clicking a booking opens its details, and Pending bookings can be approved, denied, or rescheduled right from the calendar.

Endpoint: `GET /api/bookings/calendar?start=&end=` — returns non-cancelled/non-denied bookings whose scheduled date falls within the given range.

---

## Push Notifications (Admin Alerts)

Admins get a browser push notification when a new booking request comes in or new mail arrives in the studio inbox. This is standard Web Push (VAPID) — no native app involved. On iPhone, Safari only delivers push notifications to an installed PWA, so the admin needs to **Add to Home Screen** once for reliable delivery on mobile.

### Setup

1. Generate a VAPID key pair: `npx web-push generate-vapid-keys`.
2. Set the keys below and deploy.
3. In the admin panel, accept the "Enable notifications" prompt (or trigger it again by clearing the `sv-push-opt-in-dismissed` localStorage key).

### Required Configuration

| Key | Description |
|-----|-------------|
| `Push:VapidPublicKey` / `PUSH_VAPID_PUBLIC_KEY` | VAPID public key |
| `Push:VapidPrivateKey` / `PUSH_VAPID_PRIVATE_KEY` | VAPID private key — keep secret |
| `Push:VapidSubject` / `PUSH_VAPID_SUBJECT` | Contact URI Google/Apple push services can reach you at if there's an issue, e.g. `mailto:info@sacredvibesyoga.com` |
| `Email:PollingIntervalSeconds` / `EMAIL_POLLING_INTERVAL_SECONDS` | How often the backend checks the inbox for new mail (default 120s) |

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
| `Eventbrite__OrganizerId` | Optional public organizer ID or full organizer URL like `https://www.eventbrite.com/o/shanna-latia-17611651589`. When set, imports read events from that organizer feed. |
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

The admin panel includes a cPanel-compatible mailbox client for `info@sacredvibesyoga.com`.

### cPanel Inbox Setup

In Admin → Email Inbox, open Settings and enter the mailbox details from cPanel:

| Field | Typical cPanel Value |
|-------|----------------------|
| Email Address | `info@sacredvibesyoga.com` |
| Username | `info@sacredvibesyoga.com` |
| IMAP Host | `sacredvibesyoga.com` |
| IMAP Port | `993` |
| IMAP SSL | enabled |
| SMTP Host | `sacredvibesyoga.com` |
| SMTP Port | `465` |
| SMTP SSL | enabled |

The admin inbox can list folders, read messages, mark messages read/unread, archive when an Archive folder exists, delete messages, compose new email, and reply as `info@sacredvibesyoga.com`.

### Sending With Resend

Production sending should use Resend over HTTPS to avoid outbound SMTP port blocking. When `RESEND_API_KEY` is configured, admin-composed email sends through Resend automatically while incoming mail still uses cPanel IMAP.

Every outgoing message — whether sent through Resend or direct cPanel SMTP — is also appended to the mailbox's IMAP **Sent** folder (created automatically if it doesn't exist) once the send succeeds. This keeps the admin inbox a single unified view of everything that went in and out of `info@sacredvibesyoga.com`, regardless of which transport handled delivery. Archiving is best-effort: if the IMAP mailbox isn't configured, or the archive append fails for any reason, the send still succeeds and a warning is logged — it never blocks or fails the send itself.

| Key | Description |
|-----|-------------|
| `RESEND_API_KEY` | Resend server API key used for outbound email |
| `RESEND_FROM_EMAIL` | Optional verified sender address, usually `info@sacredvibesyoga.com` |
| `RESEND_FROM_NAME` | Optional sender name, usually `Sacred Vibes Yoga` |

Verify `sacredvibesyoga.com` in Resend before sending from `info@sacredvibesyoga.com`.

### Required Backend Secret

Mailbox passwords saved through the admin UI are encrypted before they are stored in `integration_settings`. Set a stable encryption key in production so saved credentials survive deploys:

| Key | Description |
|-----|-------------|
| `EMAIL_CREDENTIAL_KEY` | Strong random secret used to encrypt saved mailbox credentials. If omitted, the app falls back to `Jwt:Secret`. |

You can also bypass saving the mailbox password in the database by setting it as an environment variable:

| Key | Description |
|-----|-------------|
| `EMAIL_PASSWORD` | Mailbox password for `info@sacredvibesyoga.com` |
| `EMAIL_USERNAME` | Optional override for the mailbox username |
| `EMAIL_IMAP_HOST` / `EMAIL_IMAP_PORT` / `EMAIL_IMAP_SSL` | Optional incoming-mail overrides |
| `EMAIL_SMTP_HOST` / `EMAIL_SMTP_PORT` / `EMAIL_SMTP_SSL` | Optional outgoing-mail overrides used only when `RESEND_API_KEY` is not configured |
| `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` | Optional sender identity overrides |

### Future Transactional Email

The inbox integration is for reading and sending admin-managed mailbox email. Automated transactional notifications can still be added later with a provider such as:

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
