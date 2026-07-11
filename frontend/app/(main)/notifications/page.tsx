'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCheck, Bell, Filter, RefreshCw } from 'lucide-react'
import { getNotifications, markRead } from '@/lib/api/notifications'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/auth.store'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { timeAgo } from '@/lib/utils'

const TYPE_CFG: Record<string, { emoji: string; color: string; path: string }> = {
  LIKE:                  { emoji:'❤️', color:'#FF2D2D',  path:'/feed' },
  FOLLOW:                { emoji:'👤', color:'#10B981',  path:'/profile' },
  SOS_RESPONSE:          { emoji:'🆘', color:'#FF2D2D',  path:'/sos' },
  BOOKING_REQUEST:       { emoji:'📅', color:'#F5A623',  path:'/creator/bookings' },
  BOOKING_CONFIRMED:     { emoji:'✅', color:'#10B981',  path:'/bookings' },
  BOOKING_COMPLETED:     { emoji:'🎉', color:'#10B981',  path:'/bookings' },
  PAYMENT_RECEIVED:      { emoji:'💰', color:'#F5A623',  path:'/billing' },
  BADGE_UNLOCK:          { emoji:'🏆', color:'#F5A623',  path:'/passport' },
  POINTS_AWARDED:        { emoji:'⭐', color:'#F5A623',  path:'/passport' },
  TIP_VERIFIED:          { emoji:'✓',  color:'#10B981',  path:'/tips' },
  NEW_MESSAGE:           { emoji:'💬', color:'#3B82F6',  path:'/chat' },
  SUBSCRIPTION_EXPIRING: { emoji:'⏰', color:'#FF7700',  path:'/billing' },
  SHOWCASE_ORDER:        { emoji:'🛍️', color:'#8B5CF6',  path:'/creator/showcase' },
  SHOWCASE_DELIVERED:    { emoji:'📦', color:'#10B981',  path:'/creator/showcase' },
  LEVEL_UP:              { emoji:'🚀', color:'#F5A623',  path:'/passport' },
  REVIEW_RECEIVED:       { emoji:'⭐', color:'#F5A623',  path:'/creator/bookings' },
}

function NotifCard({
  notif,
 onRead,
}: {
  notif: any
  onRead: (id: number) => void
}) {
  const router = useRouter()
  const cfg    = TYPE_CFG[notif.notification_type] || {
    emoji: '🔔', color: '#8B8BA7', path: '/',
  }

  return (
    <motion.div
      onClick={() => {
        if (!notif.is_read) onRead(notif.id)
        router.push(cfg.path)
      }}
      className="flex items-start gap-4 px-5 py-4 cursor-pointer"
      style={{
        background: notif.is_read
          ? 'transparent'
          : `${cfg.color}07`,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Icon / Avatar */}
      <div className="relative flex-shrink-0">
        {notif.sender ? (
          <div className="w-11 h-11 rounded-2xl bg-[#1A1A24] flex items-center justify-center overflow-hidden">
            {notif.sender.avatar ? (
              <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white/70">
                {notif.sender.username?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        ) : (
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: `${cfg.color}15` }}
          >
            {cfg.emoji}
          </div>
        )}
        {notif.sender && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: cfg.color }}
          >
            {cfg.emoji}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug"
          style={{
            color: notif.is_read
              ? 'rgba(255,255,255,0.5)'
              : 'rgba(255,255,255,0.9)',
            fontWeight: notif.is_read ? 400 : 600,
          }}
        >
          {notif.title}
        </p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {notif.body}
        </p>
        <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {!notif.is_read && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
          style={{ background: cfg.color }}
        />
      )}
    </motion.div>
  )
}

export default function NotificationsPage() {
  const { requireAuth } = useRequireAuth()
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!requireAuth("Fungua notifications zako — jisajili kwa dakika chache!")) {
      router.push("/home");
      return;
    }
    if (user) {
      fetchNotifications()
    }
  }, [user, requireAuth, router])

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
    ? items.filter((n: any) => n.notification_type === filterType)
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
        .map((n: any) => typeof n.notification_type === 'string' && n.notification_type.trim() ? n.notification_type : '')
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
        className="sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between"
        style={{
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.1)',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center gap-3">
          <Bell size={20} style={{ color: '#F5A623' }} />
          <h1 className="text-xl font-black text-white">Arifa</h1>
          {unread > 0 && (
            <span className="bg-[#FF2D2D] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 transition-colors"
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
                    ? 'bg-[#F5A623] text-black'
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
                      ? 'bg-[#F5A623] text-black'
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
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-black text-white mb-2">
            {filterType ? `Hakuna arifa za ${filterType}` : 'Hakuna arifa bado'}
          </h2>
          <p className="text-sm text-white/50">
            {filterType ? 'Badili filter kuona arifa nyingine' : 'Arifa zitaonekana hapa ukifanya shughuli'}
          </p>
        </div>
      ) : (
        <div className="pb-4">
          {Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date}>
              <div className="px-5 py-2 sticky top-[73px] z-0 bg-[#050508]/95 backdrop-blur-sm">
                <p className="text-xs font-bold text-white/50 uppercase">
                  {date === new Date().toDateString() ? 'Leo' : date}
                </p>
              </div>
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
          ))}
        </div>
      )}
    </div>
  )
}