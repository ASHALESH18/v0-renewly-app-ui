'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Home,
  PieChart,
  Plus,
  Bell,
  Settings,
  Calendar,
  FileText,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from './motion'
import { RenewlyLogo } from '@/components/renewly-logo'
import useStore from '@/lib/store'
import { useNotifications } from '@/lib/hooks/use-remote-data'

interface BottomNavProps {
  activeTab: string
}

const primaryNavItems = [
  { id: 'dashboard', icon: Home, label: 'Home', href: '/app/dashboard' },
  { id: 'calendar', icon: Calendar, label: 'Calendar', href: '/app/calendar' },
  { id: 'add', icon: Plus, label: 'Add', isAction: true },
  { id: 'analytics', icon: PieChart, label: 'Analytics', href: '/app/analytics' },
]

const moreNavItems = [
  { id: 'leak-report', icon: FileText, label: 'Leak Report', href: '/app/leak-report' },
  { id: 'notifications', icon: Bell, label: 'Notifications', href: '/app/notifications' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/app/settings' },
]

export function BottomNav({ activeTab }: BottomNavProps) {
  const [showMore, setShowMore] = useState(false)
  const openAddSubscriptionSheet = useStore((state) => state.openAddSubscriptionSheet)
  const { unreadCount } = useNotifications()
  const hasUnreadNotifications = unreadCount > 0

  useEffect(() => {
    setShowMore(false)
  }, [activeTab])

  return (
    <>
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      >
        <div className="relative mx-4 mb-4 rounded-2xl overflow-hidden">
          {/* Premium glass background - refined */}
          <div className="absolute inset-0 bg-card/96 dark:bg-graphite/97 backdrop-blur-2xl border border-border/60 dark:border-gold/10 rounded-2xl shadow-lg" />
          
          {/* Subtle top highlight */}
          <div 
            className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent"
          />
          
          <div className="relative flex items-center justify-around px-2 py-3">
            {primaryNavItems.map((item) => {
              const isActive = activeTab === item.id
              const Icon = item.icon

              if (item.isAction) {
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={openAddSubscriptionSheet}
                    className="relative -mt-8 cursor-pointer"
                    type="button"
                  >
                    {/* Subtle glow effect */}
                    <motion.div
                      className="absolute -inset-2 rounded-full bg-gold/20 blur-xl"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <div className="relative w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-luxury">
                      <Icon className="w-6 h-6 text-obsidian" />
                    </div>
                  </motion.button>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  onClick={() => setShowMore(false)}
                >
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center gap-1 px-3 py-2 cursor-pointer"
                    type="button"
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors duration-200',
                        isActive ? 'text-gold' : 'text-platinum'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-medium transition-colors duration-200',
                        isActive ? 'text-gold' : 'text-platinum'
                      )}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-gold"
                        transition={springs.snappy}
                      />
                    )}
                  </motion.button>
                </Link>
              )
            })}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMore(!showMore)}
              className="relative flex flex-col items-center gap-1 px-3 py-2 cursor-pointer"
              type="button"
            >
              <MoreHorizontal
                className={cn(
                  'w-5 h-5 transition-colors duration-200',
                  showMore ? 'text-gold' : 'text-platinum'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  showMore ? 'text-gold' : 'text-platinum'
                )}
              >
                More
              </span>

              {hasUnreadNotifications && !showMore && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-crimson" />
              )}

              {showMore && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-gold"
                  transition={springs.snappy}
                />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 z-40 bg-obsidian/40 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={springs.gentle}
              className="fixed bottom-24 left-4 right-4 z-40 glass-strong rounded-2xl p-3 space-y-1 lg:hidden"
            >
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm font-medium text-muted-foreground">More Options</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMore(false)}
                  className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {moreNavItems.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon
                const isNotificationsItem = item.id === 'notifications'

                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    onClick={() => setShowMore(false)}
                  >
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer',
                        isActive
                          ? 'bg-gold/14 text-foreground shadow-[inset_0_0_0_1px_rgba(192,142,75,0.26)]'
                          : 'text-muted-foreground hover:bg-[rgba(192,142,75,0.08)] hover:text-foreground'
                      )}
                      type="button"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium flex items-center gap-2 flex-1 text-left">
                        {item.label}
                        {isNotificationsItem && hasUnreadNotifications && (
                          <span className="w-2 h-2 rounded-full bg-crimson shrink-0" />
                        )}
                      </span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-gold"
                        />
                      )}
                    </motion.button>
                  </Link>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

interface SidebarNavProps {
  activeTab: string
}

const sidebarItems = [
  { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/app/dashboard' },
  { id: 'calendar', icon: Calendar, label: 'Calendar', href: '/app/calendar' },
  { id: 'analytics', icon: PieChart, label: 'Analytics', href: '/app/analytics' },
  { id: 'leak-report', icon: FileText, label: 'Leak Report', href: '/app/leak-report' },
  { id: 'notifications', icon: Bell, label: 'Notifications', href: '/app/notifications' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/app/settings' },
]

const SIDEBAR_COLLAPSED_KEY = 'renewly-sidebar-collapsed'
const SIDEBAR_PINNED_KEY = 'renewly-sidebar-pinned'

export function SidebarNav({ activeTab }: SidebarNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPinned, setIsPinned] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const openAddSubscriptionSheet = useStore((state) => state.openAddSubscriptionSheet)
  const { unreadCount } = useNotifications()
  const hasUnreadNotifications = unreadCount > 0

  useEffect(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    const savedPinned = localStorage.getItem(SIDEBAR_PINNED_KEY)

    const pinned = savedPinned !== null ? savedPinned === 'true' : true
    const collapsed = savedCollapsed !== null ? savedCollapsed === 'true' : false

    setIsPinned(pinned)
    setIsCollapsed(pinned ? false : collapsed)
  }, [])

  const toggleCollapsed = () => {
    const nextCollapsed = !isCollapsed
    setIsCollapsed(nextCollapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextCollapsed))

    if (nextCollapsed) {
      setIsPinned(false)
      localStorage.setItem(SIDEBAR_PINNED_KEY, 'false')
    } else {
      setIsPinned(true)
      localStorage.setItem(SIDEBAR_PINNED_KEY, 'true')
    }
  }

  const togglePinned = () => {
    const nextPinned = !isPinned
    setIsPinned(nextPinned)
    localStorage.setItem(SIDEBAR_PINNED_KEY, String(nextPinned))

    const nextCollapsed = nextPinned ? false : true
    setIsCollapsed(nextCollapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextCollapsed))
  }

  const shouldExpand = isPinned || !isCollapsed || (isHovered && !isPinned)
  const sidebarWidth = shouldExpand ? 280 : 72

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`)
  }, [sidebarWidth])

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{
        x: 0,
        width: sidebarWidth,
      }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col border-r border-sidebar-border bg-[linear-gradient(180deg,rgba(252,249,243,0.98)_0%,rgba(248,244,236,0.98)_100%)] dark:bg-[linear-gradient(180deg,rgba(13,15,19,0.98)_0%,rgba(8,9,12,0.98)_100%)] backdrop-blur-xl shadow-[8px_0_24px_rgba(120,90,50,0.04)] dark:shadow-[8px_0_32px_rgba(0,0,0,0.20)] z-40"
    >
      <div className="p-3 border-b border-border/50">
        <Link href="/" className="block cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className={cn(
              'group flex items-center gap-1.5 rounded-xl border border-gold/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(248,244,236,0.4))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(212,176,112,0.04))] px-2.5 py-2.5 shadow-sm transition-all duration-200 hover:border-gold/20',
              !shouldExpand && 'justify-center px-2'
            )}
          >
            <RenewlyLogo
              size="md"
              showWordmark={false}
              linkToHome={false}
            />
            <AnimatePresence>
              {shouldExpand && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col min-w-0 overflow-hidden"
                >
                  <span className="text-base font-serif font-semibold text-foreground group-hover:text-gold transition-colors truncate tracking-wide">
                    Renewly
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate tracking-wider uppercase">
                    Subscription Intelligence
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          const isNotificationsItem = item.id === 'notifications'

          return (
            <Link key={item.id} href={item.href}>
              <motion.button
                whileHover={{ x: shouldExpand ? 4 : 0, scale: shouldExpand ? 1 : 1.05 }}
                whileTap={{ scale: 0.98 }}
                title={!shouldExpand ? item.label : undefined}
                className={cn(
                  'relative w-full flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer',
                  shouldExpand ? 'px-4 py-3' : 'px-0 py-3 justify-center',
                  isActive
                    ? 'bg-gold/14 text-foreground shadow-[inset_0_0_0_1px_rgba(192,142,75,0.26)]'
                    : 'text-muted-foreground hover:bg-[rgba(192,142,75,0.08)] hover:text-foreground'
                )}
                type="button"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />

                <AnimatePresence>
                  {shouldExpand && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isNotificationsItem && hasUnreadNotifications && shouldExpand && (
                  <span className="w-2 h-2 rounded-full bg-crimson flex-shrink-0" />
                )}

                {isNotificationsItem && hasUnreadNotifications && !shouldExpand && (
                  <span className="absolute top-3 right-4 w-2 h-2 rounded-full bg-crimson" />
                )}

                {isActive && shouldExpand && (
                  <motion.div
                    layoutId="activeSidebar"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0"
                    transition={springs.snappy}
                  />
                )}
              </motion.button>
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'p-2 border-t border-border',
          !shouldExpand && 'flex flex-col items-center'
        )}
      >
        <AnimatePresence>
          {shouldExpand && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={togglePinned}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all mb-2 cursor-pointer"
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              type="button"
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              <span className="text-sm">{isPinned ? 'Pinned' : 'Unpinned'}</span>
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggleCollapsed}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all cursor-pointer',
            shouldExpand ? 'w-full px-4 py-2' : 'w-10 h-10 justify-center'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          <AnimatePresence>
            {shouldExpand && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm whitespace-nowrap overflow-hidden"
              >
                {isCollapsed ? 'Expand' : 'Collapse'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div
        className={cn(
          'p-2 border-t border-border',
          !shouldExpand && 'flex justify-center'
        )}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddSubscriptionSheet}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury transition-all cursor-pointer',
            shouldExpand ? 'w-full px-4 py-3' : 'w-10 h-10'
          )}
          title={!shouldExpand ? 'Add Subscription' : undefined}
          type="button"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {shouldExpand && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Add Subscription
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}
