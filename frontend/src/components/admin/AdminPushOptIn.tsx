'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/context'
import { pushApi } from '@/lib/api'

const DISMISS_KEY = 'sv-push-opt-in-dismissed'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(Array.from(rawData).map(c => c.charCodeAt(0)))
}

export default function AdminPushOptIn() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (localStorage.getItem(DISMISS_KEY)) return
    if (Notification.permission !== 'default') return

    setVisible(true)
  }, [user])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const enable = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        dismiss()
        return
      }

      const keyRes = await pushApi.getVapidPublicKey()
      const vapidKey = keyRes.data.data
      if (!vapidKey) throw new Error('Push notifications are not configured yet')

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Browser did not return a valid push subscription')
      }

      await pushApi.subscribe({
        endpoint: json.endpoint,
        p256dhKey: json.keys.p256dh,
        authKey: json.keys.auth,
      })

      toast.success('Push notifications enabled')
      localStorage.setItem(DISMISS_KEY, '1')
      setVisible(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable notifications')
    } finally {
      setSubscribing(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-40 max-w-xs bg-white border border-sacred-200 rounded-2xl shadow-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-sacred-100 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-sacred-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">Enable notifications</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Get alerted the moment someone books a class or emails the studio.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={enable}
              disabled={subscribing}
              className="px-3 py-1.5 text-xs bg-sacred-800 text-white rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
            >
              {subscribing ? 'Enabling...' : 'Enable'}
            </button>
            <button onClick={dismiss} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors">
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 shrink-0" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
