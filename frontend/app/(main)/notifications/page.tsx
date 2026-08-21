'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCheck, Bell, Filter, RefreshCw, Sparkles } from 'lucide-react'
import { getNotifications, markRead } from '@/lib/api/notifications'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/auth.store'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { timeAgo } from '@/lib/utils'
import { clsx } from 'clsx'

const TYPE_CFG: Record<string, { emoji: string; color: string; getPath: (data: any) => string }> = {
  DAILY_PICKS:           { emoji:'🔥', color:'var(--brand-primary)',  getPath: () => '/home' },
  FAVORITE_TEAM_MATCH:   { emoji:'⚽', color:'var(--success)',  getPath: (data) => `/match/${data.match_id}` },
  HIGH_CONFIDENCE:       { emoji:'�', color:'var(--danger)',  getPath: () => '/home' },
  RESULT:                { emoji:'📊', color:'var(--info)',  getPath: (data) => `/match/${data.match_id}` },
  SUPPORT_REPLY:         { emoji:'💬', color:'var(--success)',  getPath: (data) => `/settings/support/${data.ticket_id}` },
  MIC_WINNER:            { emoji:'🏆', color:'var(--warning)',  getPath: (data) => `/match/${data.match_id}/mic` },
  MORNING_PICKS:         { emoji:'☀️', color:'var(--brand-primary)',  getPath: () => '/home' },
  LIVE_MATCH_ALERT:      { emoji:'�', color:'var(--danger)',  getPath: (data) => `/match/${data.match_id}` },
  EVENING_RECAP:         { emoji:'�', color:'var(--brand-accent)',  getPath: () => '/home' },
  WEEKLY_SUMMARY:        { emoji:'�', color:'var(--success)',  getPath: () => '/track-record' },
}

function NotifCard({
  notif,
 onRead,
}: {
  notif: any
  onRead: (id: number) => void
}) {
  const router = useRouter()
  const cfg    = TYPE_CFG[notif.type] || {
    emoji: '🔔', color: '#8B8BA7', getPath: () => '/',
  }
  const path   = cfg.getPath(notif.data || {})

  return (
    <motion.div
      onClick={() => {
        if (!notif.is_read) onRead(notif.id)
        router.push(path)
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="mb-3"
    >
      <GlassCard hover={!notif.is_read} className="p-4 relative rounded-2xl">
        <div className="flex items-start gap-3">
          {/* Icon / Avatar */}
          <div className="relative flex-shrink-0">
            {notif.sender ? (
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                {notif.sender.avatar ? (
                  <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-white/70">
                    {notif.sender.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${cfg.color}15` }}
              >
                {cfg.emoji}
              </div>
            )}
            {notif.sender && (
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: cfg.color }}
              >
                {cfg.emoji}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={clsx(
                "text-sm leading-snug",
                notif.is_read ? "font-normal text-white/50" : "font-semibold text-white/90"
              )}
            >
              {notif.title}
            </p>
            <p className="text-xs mt-1 line-clamp-2 text-white/40">
              {notif.body}
            </p>
            <p className="text-[10px] mt-1.5 text-white/30">
              {timeAgo(notif.created_at)}
            </p>
          </div>

          {!notif.is_read && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
              style={{ background: cfg.color }}
            />
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function NotificationsPage() {
  const { requireAuth, hasHydrated } = useRequireAuth()
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) return;

    if (!requireAuth("Fungua notifications zako — jisajili kwa dakika chache!")) {
      router.push("/home");
      return;
    }
    if (user) {
      fetchNotifications()
    }
  }, [user, requireAuth, router, hasHydrated])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getNotifications()
      if (data) {
        setItems(data)
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchNotifications()
    setIsRefreshing(false)
  }

  const handleRead = async (id: number) => {
    try {
      await markRead(id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error('Failed to mark as read:', e)
    }
  }

  const handleReadAll = async () => {
    try {
      await Promise.all(items.filter(n => !n.is_read).map(n => markRead(n.id)))
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (e) {
      console.error('Failed to mark all as read:', e)
    }
  }

  // Filter notifications by type
  const filteredNotifications = filterType
    ? items.filter((n: any) => n.type === filterType)
    : items

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((acc: Record<string, any[]>, notif: any) => {
    const date = new Date(notif.created_at).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(notif)
    return acc
  }, {})

  // Get unique notification types for filter
  const notificationTypes: string[] = Array.from(
    new Set(
      items
        .map((n: any) => typeof n.type === 'string' && n.type.trim() ? n.type : '')
        .filter(Boolean)
    )
  )

  const unread = items.filter((n: any) => !n.is_read).length

  return (
    <div
      ref={scrollRef}
      className="min-h-dvh bg-[#050508] overflow-y-auto"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{
          paddingTop: 'calc(32px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} style={{ color: 'var(--brand-primary)' }} />
            {unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--danger)', color: 'white' }}>
                {unread > 9 ? '9+' : unread}
              </div>
            )}
          </div>
          <h1 className="text-xl font-semibold text-white">Arifa</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className="text-white/70" style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Filter size={14} className="text-white/70" />
          </button>
          {unread > 0 && (
            <button
              onClick={handleReadAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:bg-white/5 transition-colors"
            >
              <CheckCheck size={14} />
              Soma Zote
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="px-5 py-3 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterType(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  filterType === null
                    ? 'bg-[var(--brand-primary)] text-black'
                    : 'bg-[#1A1A24] text-white/70 hover:bg-white/5'
                }`}
              >
                Zote
              </button>
              {notificationTypes.map((type: string, index: number) => (
                <button
                  key={`${type}-${index}`}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === type
                      ? 'bg-[var(--brand-primary)] text-black'
                      : 'bg-[#1A1A24] text-white/70 hover:bg-white/5'
                  }`}
                >
                  {TYPE_CFG[type]?.emoji || '🔔'} {type}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="p-4 space-y-3">
          {[0,1,2,3,4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Sparkles size={24} className="text-white/30" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {filterType ? `Hakuna arifa za ${filterType}` : 'Hakuna arifa bado'}
          </h2>
          <p className="text-sm text-white/50">
            {filterType ? 'Badili filter kuona arifa nyingine' : 'Arifa zitaonekana hapa ukifanya shughuli'}
          </p>
        </div>
      ) : (
        <div className="px-4 pb-4">
          {Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date} className="mb-4">
              <div className="px-2 py-2 mb-2">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  {date === new Date().toDateString() ? 'Leo' : date}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {notifs.map((n: any) => (
                    <NotifCard
                      key={n.id}
                      notif={n}
                      onRead={handleRead}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}