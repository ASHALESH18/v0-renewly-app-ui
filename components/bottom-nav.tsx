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
  PinOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from './motion'

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

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={springs.gentle}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      >
        {/* Glass background */}
        <div className="glass-strong mx-4 mb-4 rounded-2xl">
          <div className="flex items-center justify-around px-2 py-3">
            {primaryNavItems.map((item) => {
              const isActive = activeTab === item.id
              const Icon = item.icon

              if (item.isAction) {
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    // TODO: Handle add subscription action
                    className="relative -mt-6"
                  >
                    <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-luxury">
                      <Icon className="w-6 h-6 text-obsidian" />
                    </div>
                  </motion.button>
                )
              }

              return (
                <Link key={item.id} href={item.href!}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center gap-1 px-3 py-2"
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

            {/* More button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMore(!showMore)}
              className="relative flex flex-col items-center gap-1 px-3 py-2"
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

      {/* More menu sheet */}
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
                  className="p-1 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {moreNavItems.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon

                return (
                  <Link key={item.id} href={item.href!}>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                        isActive
                          ? 'bg-gold/12 text-gold shadow-[inset_0_0_0_1px_rgba(199,163,106,0.18)]'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium flex-1 text-left">{item.label}</span>
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

// Desktop sidebar navigation with collapsible mode
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

// Sidebar state persistence key
const SIDEBAR_COLLAPSED_KEY = 'renewly-sidebar-collapsed'
const SIDEBAR_PINNED_KEY = 'renewly-sidebar-pinned'

export function SidebarNav({ activeTab }: SidebarNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPinned, setIsPinned] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Load persisted state on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    const savedPinned = localStorage.getItem(SIDEBAR_PINNED_KEY)

    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true')
    }
    if (savedPinned !== null) {
      setIsPinned(savedPinned === 'true')
    }
  }, [])

  // Persist state changes
  const toggleCollapsed = () => {
    const newValue = !isCollapsed
    setIsCollapsed(newValue)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
  }

  const togglePinned = () => {
    const newValue = !isPinned
    setIsPinned(newValue)
    localStorage.setItem(SIDEBAR_PINNED_KEY, String(newValue))
    // If unpinning, also collapse
    if (!newValue) {
      setIsCollapsed(true)
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true')
    }
  }

  // Determine if sidebar should be expanded (hover expands when unpinned and collapsed)
  const shouldExpand = !isCollapsed || (isHovered && !isPinned)
  const sidebarWidth = shouldExpand ? 280 : 72

  // Set CSS variable for main content margin
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
      transition={springs.gentle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col border-r border-gold/10 bg-[linear-gradient(180deg,rgba(14,18,24,0.98)_0%,rgba(10,13,18,0.98)_100%)] backdrop-blur-xl shadow-[14px_0_48px_rgba(0,0,0,0.24)] z-40"
    >
      {/* Logo */}
      <div className="p-4 border-b border-gold/10">
        <Link href="/" className="block cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border border-gold/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(199,163,106,0.05))] px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-200 hover:border-gold/30 hover:shadow-[0_18px_44px_rgba(199,163,106,0.12)]",
              !shouldExpand && "justify-center px-2"
            )}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold via-gold/90 to-gold/70 flex items-center justify-center flex-shrink-0 shadow-[0_12px_28px_rgba(199,163,106,0.24)]">
              <span className="text-obsidian font-semibold text-xl">R</span>
            </div>

            <AnimatePresence>
              {shouldExpand && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-[1.05rem] font-semibold tracking-[0.02em] text-foreground whitespace-nowrap group-hover:text-gold transition-colors">
                    Renewly
                  </h1>
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                    Subscription Intelligence
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon

          return (
            <Link key={item.id} href={item.href}>
              <motion.button
                whileHover={{ x: shouldExpand ? 4 : 0, scale: shouldExpand ? 1 : 1.05 }}
                whileTap={{ scale: 0.98 }}
                title={!shouldExpand ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl transition-colors duration-200',
                  shouldExpand ? 'px-4 py-3' : 'px-0 py-3 justify-center',
                  isActive
                    ? 'bg-gold/10 text-gold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
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

      {/* Collapse/Pin controls */}
      <div className={cn(
        "p-2 border-t border-border",
        !shouldExpand && "flex flex-col items-center"
      )}>
        {/* Pin button - only show when expanded */}
        <AnimatePresence>
          {shouldExpand && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={togglePinned}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            >
              {isPinned ? (
                <Pin className="w-4 h-4" />
              ) : (
                <PinOff className="w-4 h-4" />
              )}
              <span className="text-sm">
                {isPinned ? 'Pinned' : 'Unpinned'}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Collapse/Expand toggle */}
        <motion.button
          onClick={toggleCollapsed}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            shouldExpand ? "w-full px-4 py-2" : "w-10 h-10 justify-center"
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

      {/* Add subscription button */}
      <div className={cn(
        "p-2 border-t border-border",
        !shouldExpand && "flex justify-center"
      )}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          // TODO: Handle add subscription modal/sheet action
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury transition-all",
            shouldExpand ? "w-full px-4 py-3" : "w-10 h-10"
          )}
          title={!shouldExpand ? 'Add Subscription' : undefined}
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
