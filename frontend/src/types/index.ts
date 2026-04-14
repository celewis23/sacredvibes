// ── Brand ─────────────────────────────────────────────────────────────────────

export type BrandSlug = 'sacred-vibes-yoga' | 'sacred-hands' | 'sacred-sound'

export interface Brand {
  id: string
  name: string
  slug: BrandSlug
  type: 'Parent' | 'SubBrand'
  subdomain: string
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
  featuredImageUrl?: string
  sortOrder: number
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
  isSoundOnTheRiver: boolean
  instructorName?: string
  featuredImageUrl?: string
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export type BookingStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Cancelled' | 'Completed' | 'Refunded' | 'NoShow'
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
  confirmedAt?: string
  createdAt: string
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
