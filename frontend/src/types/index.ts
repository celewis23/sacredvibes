// ── Brand ─────────────────────────────────────────────────────────────────────

export type BrandSlug = 'sacred-vibes-yoga' | 'sacred-hands' | 'sacred-sound'

export interface Brand {
  id: string
  name: string
  slug: BrandSlug
  type: 'Parent' | 'SubBrand'
  description?: string
  tagline?: string
  logoPath?: string
  themeSettingsJson: string
  seoSettingsJson: string
  isActive: boolean
  sortOrder: number
}

export interface BrandTheme {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontHeading: string
  fontBody: string
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export type ContentStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived'

export interface BlogPostSummary {
  id: string
  brandId: string
  brandSlug: string
  authorName: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: AssetSummary
  status: ContentStatus
  publishedAt?: string
  createdAt: string
  categoryNames: string[]
  tagNames: string[]
}

export interface BlogPost extends BlogPostSummary {
  authorId: string
  content: string
  seoTitle?: string
  seoDescription?: string
  canonicalUrl?: string
  viewCount: number
  readingTimeMinutes?: string
  updatedAt: string
  categories: BlogCategory[]
  tags: BlogTag[]
}

export interface BlogCategory {
  id: string
  brandId: string
  name: string
  slug: string
  description?: string
  parentCategoryId?: string
  postCount: number
}

export interface BlogTag {
  id: string
  brandId: string
  name: string
  slug: string
  postCount: number
}

// ── Assets ────────────────────────────────────────────────────────────────────

export type AssetType = 'Image' | 'Document' | 'Video' | 'Audio' | 'Other'
export type AssetVisibility = 'Public' | 'Private' | 'Unlisted'
export type AssetUsage = 'General' | 'Gallery' | 'Blog' | 'PageContent' | 'StorageOnly' | 'Profile'

export interface AssetSummary {
  id: string
  fileName: string
  publicUrl?: string
  altText?: string
  caption?: string
  width?: number
  height?: number
  variantsJson?: string
}

export interface Asset extends AssetSummary {
  brandId?: string
  originalFileName: string
  contentType: string
  fileSize: number
  storagePath: string
  description?: string
  assetType: AssetType
  visibility: AssetVisibility
  usage: AssetUsage
  isGalleryItem: boolean
  folderPath?: string
  tagsJson: string
  uploadedByUserId: string
  createdAt: string
}

export interface AssetVariants {
  thumbnail?: string
  medium?: string
  large?: string
}

// ── Galleries ─────────────────────────────────────────────────────────────────

export interface Gallery {
  id: string
  brandId: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  isDefault: boolean
}

export interface GalleryItem {
  galleryId: string
  assetId: string
  asset: Asset
  sortOrder: number
  isFeatured: boolean
}

// ── Services & Events ─────────────────────────────────────────────────────────

export type PriceType = 'Fixed' | 'Variable' | 'Free' | 'Donation' | 'SlidingScale'

export interface ServiceOffering {
  id: string
  brandId: string
  name: string
  slug: string
  shortDescription?: string
  description?: string
  category?: string
  priceType: PriceType
  price?: number
  priceMin?: number
  priceMax?: number
  currency: string
  durationMinutes?: number
  location?: string
  isVirtual: boolean
  isBookable: boolean
  isActive: boolean
  isAutoBook: boolean
  featuredImageAssetId?: string
  featuredImageUrl?: string
  sortOrder: number
  externalSquareItemId?: string
  externalSquareVariationId?: string
}

export interface SquareServiceCatalogSyncResult {
  totalFetched: number
  inserted: number
  updated: number
  skipped: number
  pushed: number
  errors: number
  errorMessages: string[]
}

export interface SquareServicePushResult {
  success: boolean
  squareItemId?: string
  squareVariationId?: string
  error?: string
}

export interface EventOffering {
  id: string
  brandId: string
  name: string
  slug: string
  shortDescription?: string
  description?: string
  category?: string
  startAt: string
  endAt: string
  timeZone?: string
  venue?: string
  address?: string
  city?: string
  state?: string
  isVirtual: boolean
  virtualUrl?: string
  capacity?: number
  registeredCount: number
  spotsRemaining?: number
  priceType: PriceType
  price?: number
  currency: string
  isBookable: boolean
  isActive: boolean
  isFeatured: boolean
  isSoldOut: boolean
  isAutoBook: boolean
  isSoundOnTheRiver: boolean
  instructorName?: string
  featuredImageUrl?: string
  externalUrl?: string
  externalEventbriteId?: string
}

export interface EventbriteEventSyncResult {
  totalFetched: number
  inserted: number
  updated: number
  skipped: number
  pushed: number
  errors: number
  errorMessages: string[]
}

export interface EventbriteEventPushResult {
  success: boolean
  eventbriteEventId?: string
  eventbriteUrl?: string
  error?: string
}

export interface EventbriteOrganizationSummary {
  id?: string
  name?: string
}

export interface EventbriteEventSummary {
  id?: string
  name?: string
  status?: string
  startAt?: string
  url?: string
}

export interface EventbriteDiagnosticsResult {
  tokenConfigured: boolean
  configuredOrganizationId?: string
  configuredOrganizerId?: string
  resolvedOrganizationId?: string
  organizationCount: number
  organizations: EventbriteOrganizationSummary[]
  sampleEventCount: number
  sampleEvents: EventbriteEventSummary[]
  eventsEndpoint?: string
  error?: string
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export type BookingStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Cancelled' | 'Completed' | 'Refunded' | 'NoShow' | 'Denied'
export type PaymentStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded' | 'PartiallyRefunded' | 'Cancelled'
export type BookingType = 'YogaClass' | 'YogaWorkshop' | 'YogaEvent' | 'MassageService' | 'SoundHealingClass' | 'SoundHealingWorkshop' | 'SoundHealingEvent' | 'SoundOnTheRiver' | 'General'

export interface BookingRequest {
  brandId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
  bookingType: BookingType
  serviceOfferingId?: string
  eventOfferingId?: string
  amount: number
  currency?: string
  notes?: string
  referralSource?: string
  requestedStartAt?: string
  requestedEndAt?: string
  requestedTimeZone?: string
  website?: string
}

export interface Booking {
  id: string
  brandId: string
  brandName: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  bookingType: BookingType
  serviceOfferingId?: string
  serviceOfferingName?: string
  eventOfferingId?: string
  eventOfferingName?: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  amount: number
  currency: string
  externalCheckoutUrl?: string
  adminNotes?: string
  requestedStartAt?: string
  requestedEndAt?: string
  requestedTimeZone?: string
  confirmedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
}

export interface ServiceOffering {
  id: string
  brandId: string
  name: string
  slug: string
  shortDescription?: string
  category?: string
  price?: number
  priceMin?: number
  priceMax?: number
  priceType: PriceType
  currency: string
  durationMinutes?: number
  isBookable: boolean
  isActive: boolean
  featuredImageUrl?: string
}

export interface EventOffering {
  id: string
  brandId: string
  name: string
  slug: string
  shortDescription?: string
  category?: string
  startAt: string
  endAt: string
  venue?: string
  price?: number
  priceType: PriceType
  currency: string
  isBookable: boolean
  isSoldOut: boolean
  capacity?: number
  registeredCount: number
}

export interface EmailTemplate {
  key: string
  name: string
  description: string
  subject: string
  htmlBody: string
  variables: string[]
}

// ── Subscribers ───────────────────────────────────────────────────────────────

export type ImportSource = 'Manual' | 'Square' | 'Stripe' | 'Csv' | 'Api'
export type ConsentStatus = 'Unknown' | 'Subscribed' | 'Unsubscribed' | 'Bounced' | 'Complained'

export interface Subscriber {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName: string
  phone?: string
  source: ImportSource
  isSubscribed: boolean
  consentStatus: ConsentStatus
  createdAt: string
  updatedAt: string
  tags: SubscriberTag[]
}

export interface SubscriberTag {
  id: string
  name: string
  slug: string
  color?: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  avatarPath?: string
  bio?: string
  title?: string
  studioTier?: string
  subscriptionStatus?: string
  subscriptionPeriodEnd?: string
}

// ── Studio ─────────────────────────────────────────────────────────────────────

export type StudioTier = 'Free' | 'Seeker' | 'Devotee'

export interface StudioContentItem {
  id: string
  title: string
  description?: string
  category: string
  requiredTier: StudioTier
  duration?: string
  thumbnailUrl?: string
  isPublished: boolean
  sortOrder: number
  locked: boolean
  streamUrl?: string
}

export interface StudioCategory {
  type: string
  label: string
  items: StudioContentItem[]
}

export interface StudioLibrary {
  userTier: StudioTier
  categories: StudioCategory[]
}

export interface MemberSubscription {
  tier: StudioTier
  status: string
  currentPeriodEnd?: string
  isActive: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

// ── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface RecentBooking {
  id: string
  customerName: string
  customerEmail: string
  amount: number
  status: string
  brandName: string
  createdAt: string
}

export interface RecentLead {
  id: string
  name?: string
  email?: string
  type: string
  brandName: string
  createdAt: string
}

export interface RecentImport {
  id: string
  source: string
  totalRows: number
  insertedCount: number
  status: string
  createdAt: string
}

export interface DashboardStats {
  totalSubscribers: number
  newSubscribersThisMonth: number
  totalLeads: number
  newLeadsThisWeek: number
  totalBookings: number
  pendingBookings: number
  totalAssets: number
  totalStorageBytes: number
  totalBlogPosts: number
  publishedBlogPosts: number
  revenueThisMonth: number
  revenueTotal: number
  recentBookings: RecentBooking[]
  recentLeads: RecentLead[]
  recentImports: RecentImport[]
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export interface SitePage {
  id: string
  brandId: string
  brandName: string
  brandSlug: string
  title: string
  slug: string
  heroTitle?: string
  heroSubtitle?: string
  seoTitle?: string
  seoDescription?: string
  status: ContentStatus
  publishedAt?: string
  showInNav: boolean
  navLabel?: string
  navSortOrder: number
  template?: string
  contentJson?: string
  createdAt: string
  updatedAt: string
}

// ── Admin Users ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

// ── Import Jobs ───────────────────────────────────────────────────────────────

export interface ImportJob {
  id: string
  source: string
  status: string
  fileName?: string
  totalRows: number
  insertedCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  errorSummary?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

// ── Email Inbox ───────────────────────────────────────────────────────────────

export interface EmailMailboxSettings {
  isEnabled: boolean
  emailAddress: string
  fromName: string
  imapHost: string
  imapPort: number
  imapUseSsl: boolean
  smtpHost: string
  smtpPort: number
  smtpUseSsl: boolean
  username: string
  hasPassword: boolean
  lastSyncAt?: string
  lastSyncResult?: string
}

export interface EmailFolder {
  id: string
  name: string
  unreadCount?: number
  totalCount?: number
}

export interface EmailAddress {
  name: string
  address: string
}

export interface EmailAttachment {
  fileName: string
  contentType: string
  size?: number
}

export interface EmailMessageSummary {
  id: string
  folderId: string
  subject: string
  from?: EmailAddress
  to: EmailAddress[]
  date?: string
  isRead: boolean
  hasAttachments: boolean
  preview: string
}

export interface EmailMessage extends EmailMessageSummary {
  htmlBody?: string
  textBody?: string
  cc: EmailAddress[]
  attachments: EmailAttachment[]
}

export interface EmailMessageList {
  folderId: string
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: EmailMessageSummary[]
}

export interface EmailContact {
  email: string
  name: string
  source: string
  subscriberId?: string
}

export interface EmailRecipientGroup {
  id: string
  name: string
  type: string
  count: number
}

export interface EmailSendAttachment {
  fileName: string
  contentType: string
  base64Content: string
}

export interface EmailSignature {
  id: string
  name: string
  html: string
  isDefault: boolean
}

// ── Admin Assistant Settings ─────────────────────────────────────────────────

export type AdminAssistantProvider = 'OpenAI' | 'Anthropic'

export interface AdminAssistantSettings {
  isEnabled: boolean
  provider: AdminAssistantProvider
  model: string
  imageModel: string
  hasApiKey: boolean
  lastSyncAt?: string
  lastSyncResult?: string
}

// ── Projects ──────────────────────────────────────────────────────────────────

export type ProjectImageSource = 'Pinterest' | 'Manual' | 'Embedded'
export type ProjectTrackType = 'Track' | 'Playlist'

export interface ProjectSummary {
  id: string
  title: string
  description?: string
  coverImageUrl?: string
  imageCount: number
  trackCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectImage {
  id: string
  url: string
  sourceUrl?: string
  title?: string
  description?: string
  source: ProjectImageSource
  sortOrder: number
}

export interface ProjectTrack {
  id: string
  spotifyId: string
  type: ProjectTrackType
  title: string
  artist?: string
  albumName?: string
  albumArtUrl?: string
  previewUrl?: string
  spotifyUri: string
  externalUrl?: string
  durationMs: number
  sortOrder: number
}

export interface Project extends ProjectSummary {
  notes?: string
  images: ProjectImage[]
  tracks: ProjectTrack[]
}

// ── Lead/Contact ──────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  brandId: string
  brandName: string
  type: string
  status: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  serviceInterest?: string
  newsletterOptIn: boolean
  adminNotes?: string
  createdAt: string
}
