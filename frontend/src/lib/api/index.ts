import { apiClient } from './client'
import type {
  ApiResponse, PagedResult, BlogPostSummary, BlogPost, BlogCategory, BlogTag,
  Asset, ServiceOffering, EventOffering, Booking, BookingRequest,
  Subscriber, SubscriberTag, AuthResponse, Brand, Lead, DashboardStats,
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
  me: () =>
    apiClient.get<ApiResponse<AuthResponse['user']>>('/auth/me'),
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export const blogApi = {
  getPosts: (params: {
    brandSlug?: string; category?: string; tag?: string; page?: number; pageSize?: number
  }) => apiClient.get<ApiResponse<PagedResult<BlogPostSummary>>>('/blog/posts', { params }),

  getPost: (slug: string, brandSlug?: string) =>
    apiClient.get<ApiResponse<BlogPost>>(`/blog/posts/${slug}`, { params: { brandSlug } }),

  getCategories: (brandSlug?: string) =>
    apiClient.get<ApiResponse<BlogCategory[]>>('/blog/categories', { params: { brandSlug } }),

  getTags: (brandSlug?: string) =>
    apiClient.get<ApiResponse<BlogTag[]>>('/blog/tags', { params: { brandSlug } }),

  // Admin
  adminGetPosts: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<PagedResult<BlogPostSummary>>>('/blog/admin/posts', { params }),

  adminGetPost: (id: string) =>
    apiClient.get<ApiResponse<BlogPost>>(`/blog/admin/posts/${id}`),

  adminCreatePost: (data: unknown) =>
    apiClient.post<ApiResponse<BlogPost>>('/blog/admin/posts', data),

  adminUpdatePost: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<BlogPost>>(`/blog/admin/posts/${id}`, data),

  adminDeletePost: (id: string) =>
    apiClient.delete(`/blog/admin/posts/${id}`),
}

// ── Assets ────────────────────────────────────────────────────────────────────

export const assetsApi = {
  getAssets: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<PagedResult<Asset>>>('/assets', { params }),

  getAsset: (id: string) =>
    apiClient.get<ApiResponse<Asset>>(`/assets/${id}`),

  upload: (formData: FormData) =>
    apiClient.post<ApiResponse<Asset[]>>('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: unknown) =>
    apiClient.put<ApiResponse<Asset>>(`/assets/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/assets/${id}`),
}

// ── Services & Events ─────────────────────────────────────────────────────────

export const servicesApi = {
  getServices: (params?: { brandId?: string; category?: string }) =>
    apiClient.get<ApiResponse<ServiceOffering[]>>('/bookings/services', { params }),

  getEvents: (params?: { brandId?: string; soundOnTheRiver?: boolean; upcomingOnly?: boolean }) =>
    apiClient.get<ApiResponse<EventOffering[]>>('/bookings/events', { params }),
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export const bookingsApi = {
  createBooking: (data: BookingRequest) =>
    apiClient.post<ApiResponse<Booking>>('/bookings', data),

  createCheckout: (bookingId: string, returnUrl: string, cancelUrl: string) =>
    apiClient.post<ApiResponse<{ checkoutUrl: string }>>(`/bookings/${bookingId}/checkout`, {
      bookingId, returnUrl, cancelUrl,
    }),

  getBooking: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`),

  // Admin
  adminGetBookings: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<PagedResult<Booking>>>('/bookings', { params }),

  adminUpdateStatus: (id: string, status: string, adminNotes?: string) =>
    apiClient.patch(`/bookings/${id}/status`, { status, adminNotes }),
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export const leadsApi = {
  submitLead: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<{ id: string; message: string }>>('/leads', data),

  // Admin
  adminGetLeads: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<PagedResult<Lead>>>('/leads', { params }),

  adminUpdateLead: (id: string, data: { status?: string; adminNotes?: string }) =>
    apiClient.patch(`/leads/${id}`, data),
}

// ── Subscribers ───────────────────────────────────────────────────────────────

export const subscribersApi = {
  getSubscribers: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<PagedResult<Subscriber>>>('/subscribers', { params }),

  getTags: () =>
    apiClient.get<ApiResponse<SubscriberTag[]>>('/subscribers/tags'),

  importFromSquare: () =>
    apiClient.post('/subscribers/import/square'),

  importFromStripe: () =>
    apiClient.post('/subscribers/import/stripe'),

  previewCsv: (formData: FormData) =>
    apiClient.post('/subscribers/import/csv/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  importCsv: (formData: FormData) =>
    apiClient.post('/subscribers/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  exportCsv: (params?: Record<string, unknown>) =>
    apiClient.get('/subscribers/export/csv', { params, responseType: 'blob' }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats'),

  getBrands: () =>
    apiClient.get<ApiResponse<Brand[]>>('/dashboard/brands'),
}
