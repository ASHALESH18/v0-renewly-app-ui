"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, Bell, CreditCard, Shield, Moon, Sun, Globe, 
  HelpCircle, FileText, LogOut, ChevronRight, Crown,
  Smartphone, Mail, Lock, Palette, Download, Copy, FileJson, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from '@/components/motion'
import { Switch } from '@/components/ui/switch'
import useStore from '@/lib/store'
import { exportSubscriptions } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import { PlanSelectionSheet } from '@/components/plan-selection-sheet'
import { ProfileSheet } from '@/components/profile-sheet'
import { generateAvatar } from '@/lib/avatar-utils'
import { getCountryName } from '@/lib/locale-utils'

interface SettingItem {
  icon: React.ElementType
  label: string
  description?: string
  type: 'link' | 'toggle' | 'badge'
  value?: boolean
  badge?: string
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export function SettingsScreen() {
  const router = useRouter()
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [showReminderSheet, setShowReminderSheet] = useState(false)
  const [showChangePasswordSheet, setShowChangePasswordSheet] = useState(false)
  
  // Get real user data from store
  const userProfile = useStore((state) => state.userProfile)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)
  
  // Generate avatar URL
  const avatarUrl = useMemo(() => {
    if (!userProfile) return null
    const seed = userProfile.avatarSeed || userProfile.email || 'default'
    return generateAvatar({ seed, size: 64 })
  }, [userProfile?.email, userProfile?.avatarSeed])
  
  // Get plan display name
  const planNames: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Member',
    family: 'Family Plan',
    enterprise: 'Enterprise',
  }
  const planName = userProfile?.plan ? planNames[userProfile.plan] : 'Free Plan'
  
  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Name, email, avatar', type: 'link' },
        { icon: Crown, label: 'Subscription', description: planName, type: 'link' },
        { icon: CreditCard, label: 'Payment Methods', description: 'Manage cards & billing', type: 'link' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { icon: Bell, label: 'Push Notifications', type: 'toggle', value: notificationSettings.pushNotifications },
        { icon: Mail, label: 'Email Notifications', type: 'toggle', value: notificationSettings.emailNotifications },
        { icon: Smartphone, label: 'Reminder Timing', description: `${notificationSettings.reminderDays} days before renewal`, type: 'link' },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: Lock, label: 'Change Password', type: 'link' },
        { icon: Shield, label: 'Face ID / Touch ID', type: 'toggle', value: notificationSettings.biometricEnabled },
        { icon: Download, label: 'Export Data', description: 'Download your data', type: 'link' },
      ]
    },
    {
      title: 'Appearance',
      items: [
        { icon: notificationSettings.theme === 'dark' ? Moon : Sun, label: 'Dark Mode', type: 'toggle', value: notificationSettings.theme === 'dark' },
        { icon: Palette, label: 'Theme', description: 'Obsidian Reserve', type: 'link' },
        { icon: Globe, label: 'Language', description: notificationSettings.language === 'en' ? 'English' : notificationSettings.language, type: 'link' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', type: 'link' },
        { icon: FileText, label: 'Terms & Privacy', type: 'link' },
      ]
    }
  ]

  const handleExportCSV = () => {
    exportSubscriptions(subscriptions, 'csv')
    addToast({
      type: 'success',
      title: 'Export complete',
      message: 'Your subscriptions have been exported as CSV.'
    })
    setShowExportOptions(false)
  }

  const handleExportJSON = () => {
    exportSubscriptions(subscriptions, 'json')
    addToast({
      type: 'success',
      title: 'Export complete',
      message: 'Your subscriptions have been exported as JSON.'
    })
    setShowExportOptions(false)
  }
  
  const handleToggle = (label: string) => {
    switch(label) {
      case 'Dark Mode': 
        updateNotificationSettings({ theme: notificationSettings.theme === 'dark' ? 'light' : 'dark' })
        break
      case 'Push Notifications': 
        updateNotificationSettings({ pushNotifications: !notificationSettings.pushNotifications })
        break
      case 'Email Notifications': 
        updateNotificationSettings({ emailNotifications: !notificationSettings.emailNotifications })
        break
      case 'Face ID / Touch ID': 
        updateNotificationSettings({ biometricEnabled: !notificationSettings.biometricEnabled })
        break
    }
  }
  
  const getToggleValue = (label: string) => {
    switch(label) {
      case 'Dark Mode': return notificationSettings.theme === 'dark'
      case 'Push Notifications': return notificationSettings.pushNotifications
      case 'Email Notifications': return notificationSettings.emailNotifications
      case 'Face ID / Touch ID': return notificationSettings.biometricEnabled
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
        >
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </motion.div>
      </div>
      
      {/* Profile Card */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
        onClick={() => setShowProfileSheet(true)}
        className="px-4 mb-6 w-full text-left hover:opacity-80 transition-opacity"
      >
        <div className="p-4 rounded-2xl glass">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userProfile?.name || 'Profile'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-2xl font-semibold text-gold">
                  {userProfile?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {userProfile?.name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {userProfile?.email || 'No email'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Crown className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium text-gold">{planName}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </motion.button>
      
      {/* Settings Sections */}
      <div className="px-4 space-y-6">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + sectionIndex * 0.05 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h3>
            <div className="rounded-2xl glass overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon
                const isLast = itemIndex === section.items.length - 1
                const isToggle = item.type === 'toggle'
                
                const content = (
                  <>
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <span className="text-foreground font-medium">{item.label}</span>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    
                    {item.type === 'link' && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    
                    {item.type === 'toggle' && (
                      <Switch 
                        checked={getToggleValue(item.label)}
                        onCheckedChange={() => handleToggle(item.label)}
                        className="data-[state=checked]:bg-gold"
                      />
                    )}
                    
                    {item.type === 'badge' && item.badge && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald/20 text-emerald text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </>
                )
                
                // Use div for toggle items to avoid nested buttons (Switch is a button)
                if (isToggle) {
                  return (
                    <motion.div
                      key={item.label}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                        !isLast && "border-b border-border"
                      )}
                      onClick={() => handleToggle(item.label)}
                    >
                      {content}
                    </motion.div>
                  )
                }
                
                // Default: render as button
                return (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                      !isLast && "border-b border-border"
                    )}
                    onClick={() => {
                      if (item.label === 'Export Data') {
                        setShowExportOptions(!showExportOptions)
                      } else if (item.label === 'Subscription') {
                        setShowPlanSheet(!showPlanSheet)
                      } else if (item.label === 'Profile') {
                        setShowProfileSheet(true)
                      } else if (item.label === 'Reminder Timing') {
                        setShowReminderSheet(true)
                      } else if (item.label === 'Change Password') {
                        setShowChangePasswordSheet(true)
                      } else if (item.label === 'Help Center') {
                        window.location.href = '/help'
                      } else if (item.label === 'Terms & Privacy') {
                        setShowExportOptions(false)
                      }
                    }}
                  >
                    {content}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ))}
        
        {/* Plan Selection Sheet */}
        {showPlanSheet && (
          <PlanSelectionSheet 
            onClose={() => setShowPlanSheet(false)}
            currentPlan={userProfile?.plan || 'free'}
          />
        )}

        {/* Profile Sheet */}
        <ProfileSheet
          isOpen={showProfileSheet}
          onClose={() => setShowProfileSheet(false)}
          onSave={async (profile) => {
            // TODO: Implement profile save to Supabase
            addToast({
              type: 'success',
              title: 'Profile updated',
              message: 'Your profile has been saved.'
            })
          }}
        />
        
        {/* Reminder Timing Sheet */}
        {showReminderSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReminderSheet(false)}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t border-border p-6"
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">Reminder Timing</h2>
                  <button
                    onClick={() => setShowReminderSheet(false)}
                    className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <label className="block">
                    <p className="text-sm font-medium text-foreground mb-3">Remind me before renewal</p>
                    <select
                      defaultValue={notificationSettings.reminderDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value)
                        updateNotificationSettings({ reminderDays: days })
                        addToast({
                          type: 'success',
                          title: 'Reminder updated',
                          message: `You'll be reminded ${days} days before renewal.`
                        })
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
                    >
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">1 week</option>
                      <option value="14">2 weeks</option>
                      <option value="30">1 month</option>
                    </select>
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Change Password Sheet */}
        {showChangePasswordSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChangePasswordSheet(false)}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t border-border p-6"
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">Change Password</h2>
                  <button
                    onClick={() => setShowChangePasswordSheet(false)}
                    className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  addToast({
                    type: 'success',
                    title: 'Password changed',
                    message: 'Your password has been successfully updated.'
                  })
                  setShowChangePasswordSheet(false)
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-gold text-background font-medium hover:bg-gold/90 transition-colors"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        })
        />
        {showExportOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass overflow-hidden"
          >
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left border-b border-border"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <Download className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-foreground font-medium">Export as CSV</span>
                <p className="text-sm text-muted-foreground">Spreadsheet format</p>
              </div>
            </button>
            
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <FileJson className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-foreground font-medium">Export as JSON</span>
                <p className="text-sm text-muted-foreground">For backup & import</p>
              </div>
            </button>
          </motion.div>
        )}
        
        {/* Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.4 }}
        >
          <motion.button
            onClick={async () => {
              try {
                const supabase = createClient()
                const { error } = await supabase.auth.signOut()
                
                if (!error) {
                  router.replace('/auth/sign-in')
                  // Delay refresh to ensure navigation is queued first
                  setTimeout(() => {
                    router.refresh()
                  }, 0)
                } else {
                  console.error('Sign out failed:', error)
                }
              } catch (err) {
                console.error('Sign out failed:', err)
              }
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl glass text-crimson hover:bg-crimson/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </motion.button>
        </motion.div>
        
        {/* Version */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Renewly v1.0.0 • Made with care
        </p>
      </div>
    </div>
  )
}
