import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
const MODEL = process.env.ADMIN_ASSISTANT_MODEL ?? 'openai/gpt-5.4'

type QueryValue = string | number | boolean | null | undefined

function requireBearer(req: Request) {
  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return authorization
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE}/api${path}`)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url
}

async function adminFetch<T>(
  authorization: string,
  path: string,
  init?: RequestInit & { query?: Record<string, QueryValue> }
) {
  const headers = new Headers(init?.headers)
  headers.set('authorization', authorization)
  headers.set('accept', 'application/json')

  if (init?.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const res = await fetch(buildUrl(path, init?.query), {
    ...init,
    headers,
    cache: 'no-store',
  })

  if (res.status === 204) {
    return { success: true } as T
  }

  const contentType = res.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.errors?.join?.(', ') ?? payload?.message ?? `Request failed with status ${res.status}`
    throw new Error(message)
  }

  return payload as T
}

function jsonBody(value: unknown) {
  return JSON.stringify(value)
}

const contentStatusSchema = z.enum(['Draft', 'Published', 'Scheduled', 'Archived']).default('Draft')
const priceTypeSchema = z.enum(['Fixed', 'Variable', 'Free', 'Donation', 'SlidingScale']).default('Fixed')

export async function POST(req: Request) {
  let authorization: string
  try {
    authorization = requireBearer(req)
  } catch (response) {
    return response as Response
  }

  const { messages }: { messages: UIMessage[] } = await req.json()
  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: MODEL,
    messages: modelMessages,
    stopWhen: stepCountIs(8),
    system: [
      'You are the Sacred Vibes admin assistant.',
      'You help admins write, plan, search, create, and update admin records.',
      'Use the available tools whenever the user asks to inspect or change admin data.',
      'Prefer creating drafts for public content unless the user explicitly asks to publish.',
      'Do not delete records, send email, push to Square/Eventbrite, or publish content unless the user explicitly asks and confirms.',
      'When you create or update a record, include the admin edit URL in your response.',
      'For writing tasks, produce polished copy in the Sacred Vibes tone: warm, clear, grounded, and not overly mystical.',
      'If a required brandId is missing, call listBrands before asking the user.',
    ].join('\n'),
    tools: {
      listBrands: tool({
        description: 'List brands so the assistant can choose the correct brandId for content, services, events, pages, galleries, and media.',
        inputSchema: z.object({}),
        execute: async () => adminFetch(authorization, '/brands'),
      }),

      searchProjects: tool({
        description: 'Search or list projects.',
        inputSchema: z.object({
          search: z.string().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ search, page, pageSize }) =>
          adminFetch(authorization, '/projects', { query: { search, page, pageSize } }),
      }),

      getProject: tool({
        description: 'Get a project by id, including notes, images, and tracks.',
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => adminFetch(authorization, `/projects/${id}`),
      }),

      createProject: tool({
        description: 'Create a new project. Use this for concept/write-up workflows and return the edit URL.',
        inputSchema: z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          notes: z.string().optional().describe('Long-form project write-up, outline, plan, or creative notes.'),
          coverImageUrl: z.string().url().optional(),
        }),
        execute: async ({ title, description, notes, coverImageUrl }) => {
          const created = await adminFetch<{ data?: { id?: string } }>(authorization, '/projects', {
            method: 'POST',
            body: jsonBody({ title, description }),
          })
          const id = created.data?.id
          if (!id || (!notes && !coverImageUrl)) {
            return { ...created, editUrl: id ? `/admin/projects/${id}` : '/admin/projects' }
          }

          const updated = await adminFetch<Record<string, unknown>>(authorization, `/projects/${id}`, {
            method: 'PUT',
            body: jsonBody({ title, description, notes, coverImageUrl }),
          })
          return { ...updated, editUrl: `/admin/projects/${id}` }
        },
      }),

      updateProject: tool({
        description: 'Update project title, description, notes, or cover image.',
        inputSchema: z.object({
          id: z.string().uuid(),
          title: z.string().min(1),
          description: z.string().optional(),
          notes: z.string().optional(),
          coverImageUrl: z.string().url().optional(),
        }),
        execute: async ({ id, ...body }) => {
          const data = await adminFetch<Record<string, unknown>>(authorization, `/projects/${id}`, {
            method: 'PUT',
            body: jsonBody(body),
          })
          return { ...data, editUrl: `/admin/projects/${id}` }
        },
      }),

      searchBlogPosts: tool({
        description: 'Search admin blog posts.',
        inputSchema: z.object({
          search: z.string().optional(),
          status: z.enum(['Draft', 'Published', 'Scheduled', 'Archived']).optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ search, status, page, pageSize }) =>
          adminFetch(authorization, '/blog/admin/posts', { query: { search, status, page, pageSize } }),
      }),

      createBlogPost: tool({
        description: 'Create a blog post draft or published post.',
        inputSchema: z.object({
          brandId: z.string().uuid(),
          title: z.string().min(1),
          excerpt: z.string().optional(),
          content: z.string().min(1),
          status: contentStatusSchema,
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
          featuredImageAssetId: z.string().uuid().optional(),
        }),
        execute: async (body) => {
          const data = await adminFetch<{ data?: { id?: string } }>(authorization, '/blog/admin/posts', {
            method: 'POST',
            body: jsonBody(body),
          })
          return { ...data, editUrl: data.data?.id ? `/admin/blog/${data.data.id}` : '/admin/blog' }
        },
      }),

      listPages: tool({
        description: 'List pages, optionally for a brand.',
        inputSchema: z.object({ brandId: z.string().uuid().optional() }),
        execute: async ({ brandId }) => adminFetch(authorization, '/pages', { query: { brandId } }),
      }),

      createPage: tool({
        description: 'Create a site page. Default to Draft unless asked to publish.',
        inputSchema: z.object({
          brandId: z.string().uuid(),
          title: z.string().min(1),
          slug: z.string().optional(),
          heroTitle: z.string().optional(),
          heroSubtitle: z.string().optional(),
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
          status: contentStatusSchema,
          showInNav: z.boolean().default(false),
          navLabel: z.string().optional(),
          navSortOrder: z.number().int().default(0),
          template: z.string().default('default'),
          contentJson: z.string().optional(),
        }),
        execute: async (body) => {
          const data = await adminFetch<{ data?: { id?: string } }>(authorization, '/pages', {
            method: 'POST',
            body: jsonBody(body),
          })
          return { ...data, editUrl: data.data?.id ? `/admin/pages/${data.data.id}` : '/admin/pages' }
        },
      }),

      listStudioContent: tool({
        description: 'List Digital Studio content.',
        inputSchema: z.object({}),
        execute: async () => adminFetch(authorization, '/studio/admin/content'),
      }),

      createStudioContent: tool({
        description: 'Create Digital Studio content. Requires existing media asset ids for stream or thumbnail when applicable.',
        inputSchema: z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          category: z.string().default('SoundHealing'),
          requiredTier: z.enum(['Free', 'Seeker', 'Devotee']).default('Free'),
          duration: z.string().optional(),
          assetId: z.string().uuid().optional(),
          thumbnailAssetId: z.string().uuid().optional(),
          isPublished: z.boolean().default(false),
          sortOrder: z.number().int().default(0),
        }),
        execute: async (body) => {
          const data = await adminFetch<{ data?: { id?: string } }>(authorization, '/studio/admin/content', {
            method: 'POST',
            body: jsonBody(body),
          })
          return { ...data, editUrl: data.data?.id ? `/admin/studio/${data.data.id}` : '/admin/studio' }
        },
      }),

      searchMedia: tool({
        description: 'Search the media library.',
        inputSchema: z.object({
          search: z.string().optional(),
          assetType: z.enum(['Image', 'Document', 'Video', 'Audio', 'Other']).optional(),
          usage: z.enum(['General', 'Gallery', 'Blog', 'PageContent', 'StorageOnly', 'Profile']).optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(12),
        }),
        execute: async ({ search, assetType, usage, page, pageSize }) =>
          adminFetch(authorization, '/assets', { query: { search, assetType, usage, page, pageSize } }),
      }),

      listGalleries: tool({
        description: 'List galleries, optionally by brand.',
        inputSchema: z.object({ brandId: z.string().uuid().optional(), isActive: z.boolean().optional() }),
        execute: async ({ brandId, isActive }) => adminFetch(authorization, '/galleries', { query: { brandId, isActive } }),
      }),

      createGallery: tool({
        description: 'Create a gallery.',
        inputSchema: z.object({
          brandId: z.string().uuid(),
          name: z.string().min(1),
          slug: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().default(true),
          isDefault: z.boolean().default(false),
          sortOrder: z.number().int().default(0),
        }),
        execute: async (body) => adminFetch(authorization, '/galleries', { method: 'POST', body: jsonBody(body) }),
      }),

      addAssetToGallery: tool({
        description: 'Add an existing media asset to a gallery.',
        inputSchema: z.object({
          galleryId: z.string().uuid(),
          assetId: z.string().uuid(),
          sortOrder: z.number().int().default(0),
          isFeatured: z.boolean().default(false),
        }),
        execute: async ({ galleryId, assetId, sortOrder, isFeatured }) =>
          adminFetch(authorization, `/galleries/${galleryId}/items`, {
            method: 'POST',
            body: jsonBody({ assetId, sortOrder, isFeatured }),
          }),
      }),

      listServices: tool({
        description: 'List services.',
        inputSchema: z.object({ brandId: z.string().uuid().optional(), includeInactive: z.boolean().default(true) }),
        execute: async ({ brandId, includeInactive }) =>
          adminFetch(authorization, '/offerings/services', { query: { brandId, includeInactive } }),
      }),

      createService: tool({
        description: 'Create a service offering.',
        inputSchema: z.object({
          brandId: z.string().uuid(),
          name: z.string().min(1),
          slug: z.string().optional(),
          shortDescription: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          priceType: priceTypeSchema,
          price: z.number().optional(),
          priceMin: z.number().optional(),
          priceMax: z.number().optional(),
          currency: z.string().default('USD'),
          durationMinutes: z.number().int().optional(),
          location: z.string().optional(),
          isVirtual: z.boolean().default(false),
          isBookable: z.boolean().default(true),
          isActive: z.boolean().default(true),
          featuredImageAssetId: z.string().uuid().optional(),
          sortOrder: z.number().int().default(0),
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
        }),
        execute: async (body) => adminFetch(authorization, '/offerings/services', { method: 'POST', body: jsonBody(body) }),
      }),

      listEvents: tool({
        description: 'List events.',
        inputSchema: z.object({
          brandId: z.string().uuid().optional(),
          includeInactive: z.boolean().default(true),
          upcomingOnly: z.boolean().default(false),
        }),
        execute: async ({ brandId, includeInactive, upcomingOnly }) =>
          adminFetch(authorization, '/offerings/events', { query: { brandId, includeInactive, upcomingOnly } }),
      }),

      createEvent: tool({
        description: 'Create an event offering.',
        inputSchema: z.object({
          brandId: z.string().uuid(),
          name: z.string().min(1),
          slug: z.string().optional(),
          shortDescription: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          startAt: z.string().datetime(),
          endAt: z.string().datetime(),
          timeZone: z.string().default('America/New_York'),
          venue: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          isVirtual: z.boolean().default(false),
          virtualUrl: z.string().url().optional(),
          capacity: z.number().int().optional(),
          priceType: priceTypeSchema,
          price: z.number().optional(),
          currency: z.string().default('USD'),
          isBookable: z.boolean().default(true),
          isActive: z.boolean().default(true),
          isFeatured: z.boolean().default(false),
          isSoundOnTheRiver: z.boolean().default(false),
          instructorName: z.string().optional(),
          instructorBio: z.string().optional(),
          externalUrl: z.string().url().optional(),
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
        }),
        execute: async (body) => adminFetch(authorization, '/offerings/events', { method: 'POST', body: jsonBody(body) }),
      }),

      listBookings: tool({
        description: 'List bookings.',
        inputSchema: z.object({
          status: z.string().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ status, page, pageSize }) =>
          adminFetch(authorization, '/bookings', { query: { status, page, pageSize } }),
      }),

      updateBookingStatus: tool({
        description: 'Update a booking status and admin notes. Use only when the user explicitly asks.',
        inputSchema: z.object({
          id: z.string().uuid(),
          status: z.enum(['Pending', 'Confirmed', 'Paid', 'Cancelled', 'Completed', 'Refunded', 'NoShow']),
          adminNotes: z.string().optional(),
        }),
        execute: async ({ id, status, adminNotes }) =>
          adminFetch(authorization, `/bookings/${id}/status`, {
            method: 'PATCH',
            body: jsonBody({ status, adminNotes }),
          }),
      }),

      listSubscribers: tool({
        description: 'Search subscribers.',
        inputSchema: z.object({
          search: z.string().optional(),
          isSubscribed: z.boolean().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ search, isSubscribed, page, pageSize }) =>
          adminFetch(authorization, '/subscribers', { query: { search, isSubscribed, page, pageSize } }),
      }),

      listLeads: tool({
        description: 'Search leads.',
        inputSchema: z.object({
          status: z.string().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ status, page, pageSize }) =>
          adminFetch(authorization, '/leads', { query: { status, page, pageSize } }),
      }),

      updateLead: tool({
        description: 'Update lead status and admin notes.',
        inputSchema: z.object({
          id: z.string().uuid(),
          status: z.string().optional(),
          adminNotes: z.string().optional(),
        }),
        execute: async ({ id, status, adminNotes }) =>
          adminFetch(authorization, `/leads/${id}`, {
            method: 'PATCH',
            body: jsonBody({ status, adminNotes }),
          }),
      }),

      listImports: tool({
        description: 'List import jobs.',
        inputSchema: z.object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ page, pageSize }) => adminFetch(authorization, '/subscribers/import/jobs', { query: { page, pageSize } }),
      }),

      listEmailMessages: tool({
        description: 'Search or list email inbox messages.',
        inputSchema: z.object({
          folderId: z.string().optional(),
          search: z.string().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(25).default(10),
        }),
        execute: async ({ folderId, search, page, pageSize }) =>
          adminFetch(authorization, '/email/messages', { query: { folderId, search, page, pageSize } }),
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
