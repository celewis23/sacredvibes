'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { Users, BookOpen, Calendar, Image, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: 'yoga' | 'hands' | 'sound' | 'neutral'
}

function StatCard({ label, value, sub, icon: Icon, color = 'yoga' }: StatCardProps) {
  const colors = {
    yoga:    { bg: 'bg-yoga-50',   icon: 'text-yoga-600',  text: 'text-yoga-900' },
    hands:   { bg: 'bg-hands-50',  icon: 'text-hands-600', text: 'text-hands-900' },
    sound:   { bg: 'bg-sound-50',  icon: 'text-sound-600', text: 'text-sound-900' },
    neutral: { bg: 'bg-sacred-50', icon: 'text-sacred-600',text: 'text-sacred-900' },
  }
  const c = colors[color]

  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-sacred-500 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-3xl font-heading font-semibold ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-sacred-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardApi.getStats()
      return res.data?.data
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-sacred-100 rounded-xl w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-sacred-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-display-sm text-sacred-900">Dashboard</h1>
        <p className="text-sm text-sacred-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Subscribers"
          value={data?.totalSubscribers?.toLocaleString() ?? '—'}
          sub={`+${data?.newSubscribersThisMonth ?? 0} this month`}
          icon={Users}
          color="yoga"
        />
        <StatCard
          label="Bookings"
          value={data?.totalBookings?.toLocaleString() ?? '—'}
          sub={`${data?.pendingBookings ?? 0} pending`}
          icon={Calendar}
          color="hands"
        />
        <StatCard
          label="Blog Posts"
          value={data?.publishedBlogPosts?.toLocaleString() ?? '—'}
          sub={`${data?.totalBlogPosts ?? 0} total`}
          icon={BookOpen}
          color="sound"
        />
        <StatCard
          label="Revenue (Month)"
          value={`$${(data?.revenueThisMonth ?? 0).toFixed(0)}`}
          sub={`$${(data?.revenueTotal ?? 0).toFixed(0)} total`}
          icon={TrendingUp}
          color="neutral"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-sacred-100 flex items-center justify-between">
            <h2 className="font-medium text-sacred-900 text-sm">Recent Bookings</h2>
            <a href="/admin/bookings" className="text-xs text-yoga-600 hover:text-yoga-800">View all</a>
          </div>
          <div className="divide-y divide-sacred-50">
            {(data?.recentBookings ?? []).length === 0 && (
              <p className="px-6 py-8 text-sm text-sacred-400 text-center">No bookings yet</p>
            )}
            {(data?.recentBookings ?? []).map((booking) => (
              <div key={booking.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sacred-900 truncate">{booking.customerName}</p>
                  <p className="text-xs text-sacred-500">{booking.brandName} · {format(new Date(booking.createdAt), 'MMM d')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-sacred-700">${booking.amount}</span>
                  <Badge variant={
                    booking.status === 'Paid' ? 'success' :
                    booking.status === 'Cancelled' ? 'danger' :
                    booking.status === 'Confirmed' ? 'yoga' : 'neutral'
                  }>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Leads */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-sacred-100 flex items-center justify-between">
            <h2 className="font-medium text-sacred-900 text-sm">Recent Leads</h2>
            <a href="/admin/leads" className="text-xs text-yoga-600 hover:text-yoga-800">View all</a>
          </div>
          <div className="divide-y divide-sacred-50">
            {(data?.recentLeads ?? []).length === 0 && (
              <p className="px-6 py-8 text-sm text-sacred-400 text-center">No leads yet</p>
            )}
            {(data?.recentLeads ?? []).map((lead) => (
              <div key={lead.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sacred-900 truncate">{lead.name || lead.email || '—'}</p>
                  <p className="text-xs text-sacred-500">{lead.brandName} · {lead.type}</p>
                </div>
                <span className="text-xs text-sacred-400 shrink-0">
                  {format(new Date(lead.createdAt), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Imports */}
      {(data?.recentImports ?? []).length > 0 && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-sacred-100 flex items-center justify-between">
            <h2 className="font-medium text-sacred-900 text-sm">Recent Imports</h2>
            <a href="/admin/imports" className="text-xs text-yoga-600 hover:text-yoga-800">View all</a>
          </div>
          <div className="divide-y divide-sacred-50">
            {(data?.recentImports ?? []).map((job) => (
              <div key={job.id} className="px-6 py-3.5 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sacred-900">{job.source} Import</p>
                  <p className="text-xs text-sacred-500">
                    {job.insertedCount} inserted · {job.totalRows} total rows
                  </p>
                </div>
                <Badge variant={job.status === 'Completed' ? 'success' : job.status === 'Failed' ? 'danger' : 'warning'}>
                  {job.status}
                </Badge>
                <span className="text-xs text-sacred-400 shrink-0">
                  {format(new Date(job.createdAt), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
