'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { studioApi } from '@/lib/api'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Required'),
  requiredTier: z.string().min(1, 'Required'),
  duration: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  isPublished: z.boolean(),
  assetId: z.string().uuid().optional().or(z.literal('')),
  thumbnailAssetId: z.string().uuid().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const CATEGORIES = [
  { value: 'SoundHealing',        label: 'Sound Healing' },
  { value: 'YogaFlows',           label: 'Yoga Flows' },
  { value: 'Breathwork',          label: 'Breathwork' },
  { value: 'GuidedMeditation',    label: 'Guided Meditation' },
  { value: 'CeremoniesAndRituals',label: 'Ceremonies & Rituals' },
  { value: 'EnergyWork',          label: 'Energy Work' },
]

const TIERS = [
  { value: 'Free',    label: 'Free (Explorer)' },
  { value: 'Seeker',  label: 'Seeker ($33/mo)' },
  { value: 'Devotee', label: 'Devotee ($88/mo)' },
]

export default function AdminStudioEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const router = useRouter()
  const [loading, setLoading] = useState(!isNew)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: 'SoundHealing',
      requiredTier: 'Free',
      duration: '',
      sortOrder: 0,
      isPublished: false,
      assetId: '',
      thumbnailAssetId: '',
    },
  })

  useEffect(() => {
    if (isNew) return
    studioApi.adminListContent()
      .then(({ data }) => {
        const item = data.data?.find(i => i.id === id)
        if (item) {
          reset({
            title: item.title,
            description: item.description ?? '',
            category: item.category,
            requiredTier: item.requiredTier,
            duration: item.duration ?? '',
            sortOrder: item.sortOrder,
            isPublished: item.isPublished,
            assetId: '',
            thumbnailAssetId: '',
          })
        }
      })
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }, [id, isNew, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      assetId: values.assetId || undefined,
      thumbnailAssetId: values.thumbnailAssetId || undefined,
    }
    try {
      if (isNew) {
        await studioApi.adminCreateContent(payload)
        toast.success('Content created')
      } else {
        await studioApi.adminUpdateContent(id, payload)
        toast.success('Content updated')
      }
      router.push('/admin/studio')
    } catch {
      toast.error('Save failed')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yoga-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/studio" className="text-sm text-sacred-500 hover:text-sacred-700">
          ← Studio
        </Link>
        <span className="text-sacred-300">/</span>
        <h1 className="text-xl font-semibold text-sacred-900">
          {isNew ? 'Add Content' : 'Edit Content'}
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-sacred-100 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('title')}
            label="Title"
            placeholder="Morning Frequency Reset"
            error={errors.title?.message}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-sacred-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="A brief description of this session..."
              className="w-full rounded-lg border border-sacred-200 px-3 py-2 text-sm text-sacred-900 placeholder:text-sacred-400 focus:outline-none focus:ring-2 focus:ring-yoga-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sacred-700 mb-1">Category</label>
              <select {...register('category')}
                className="w-full rounded-lg border border-sacred-200 px-3 py-2 text-sm text-sacred-900 focus:outline-none focus:ring-2 focus:ring-yoga-500">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-sacred-700 mb-1">Required Tier</label>
              <select {...register('requiredTier')}
                className="w-full rounded-lg border border-sacred-200 px-3 py-2 text-sm text-sacred-900 focus:outline-none focus:ring-2 focus:ring-yoga-500">
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('duration')}
              label="Duration"
              placeholder="12 min"
              error={errors.duration?.message}
              fullWidth
            />
            <Input
              {...register('sortOrder')}
              label="Sort Order"
              type="number"
              placeholder="0"
              error={errors.sortOrder?.message}
              fullWidth
            />
          </div>

          <Input
            {...register('assetId')}
            label="Media Asset ID (UUID)"
            placeholder="Leave blank to set later"
            error={errors.assetId?.message}
            fullWidth
          />

          <Input
            {...register('thumbnailAssetId')}
            label="Thumbnail Asset ID (UUID)"
            placeholder="Leave blank to set later"
            error={errors.thumbnailAssetId?.message}
            fullWidth
          />

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublished" {...register('isPublished')}
              className="rounded border-sacred-300 text-yoga-600 focus:ring-yoga-500" />
            <label htmlFor="isPublished" className="text-sm font-medium text-sacred-700">
              Published (visible in library)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              {isNew ? 'Create' : 'Save Changes'}
            </Button>
            <Link href="/admin/studio">
              <Button type="button" size="md">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
