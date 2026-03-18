'use client'

import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '@/lib/api'
import type { ServiceOffering } from '@/types'

function formatPrice(service: ServiceOffering): string {
  if (service.priceType === 'Free') return 'Free'
  if (service.priceType === 'Donation') return 'Donation'
  if (service.priceType === 'SlidingScale' && service.priceMin != null && service.priceMax != null) {
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: service.currency }).format(n)
    return `${fmt(service.priceMin)} – ${fmt(service.priceMax)}`
  }
  if (service.price != null) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: service.currency }).format(service.price)
  }
  return service.priceType
}

export default function AdminServicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => servicesApi.getServices().then(r => r.data.data ?? []),
  })

  const services = data ?? []

  const byBrand = services.reduce<Record<string, ServiceOffering[]>>((acc, s) => {
    if (!acc[s.brandId]) acc[s.brandId] = []
    acc[s.brandId].push(s)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">{services.length} services across {Object.keys(byBrand).length} brands</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">No services found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Service</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map(service => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{service.name}</div>
                    {service.shortDescription && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{service.shortDescription}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{service.category ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{formatPrice(service)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {service.durationMinutes ? `${service.durationMinutes} min` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {service.isVirtual ? 'Virtual' : (service.location ?? '—')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {service.isBookable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                          Bookable
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
