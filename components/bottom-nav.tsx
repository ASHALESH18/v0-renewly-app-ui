'use client'

import { useState } from 'react'
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
  X
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
                          ? 'bg-gold/10 text-gold' 
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
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

// Desktop sidebar navigation
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

export function SidebarNav({ activeTab }: SidebarNavProps) {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={springs.gentle}
      className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col bg-card border-r border-border z-40"
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <span className="text-obsidian font-semibold text-lg">R</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Renewly</h1>
            <p className="text-xs text-muted-foreground">Subscription Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon

          return (
            <Link key={item.id} href={item.href}>
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200',
                  isActive 
                    ? 'bg-gold/10 text-gold' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeSidebar"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-gold"
                    transition={springs.snappy}
                  />
                )}
              </motion.button>
            </Link>
          )
        })}
      </nav>

      {/* Add subscription button */}
      <div className="p-4 border-t border-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          // TODO: Handle add subscription modal/sheet action
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury"
        >
          <Plus className="w-5 h-5" />
          <span>Add Subscription</span>
        </motion.button>
      </div>
    </motion.aside>
  )
}
