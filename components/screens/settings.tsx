'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Bell, CreditCard, Shield, Moon, Sun, Globe, 
  HelpCircle, FileText, LogOut, ChevronRight, Crown,
  Smartphone, Mail, Lock, Download, Copy, FileJson, X,
  Check, AlertCircle, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from '@/components/motion'
import { Switch } from '@/components/ui/switch'
import useStore from '@/lib/store'
import { exportSubscriptions } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import { PlanSelectionSheet } from '@/components/plan-selection-sheet'
import { generateAvatar } from '@/lib/avatar-utils'
import { countries, currencies } from '@/lib/locale-utils'

// Sheet component for settings modals
function SettingsSheet({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode 
}) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function SettingsScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = searchParams.get('section')
  
  // Sheet states
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Store
  const userProfile = useStore((state) => state.userProfile)
  const currentUserEmail = useStore((state) => state.currentUserEmail)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)
  const setUserProfile = useStore((state) => state.setUserProfile)
  const clearUserData = useStore((state) => state.clearUserData)
  const hasHydratedFromCloud = useStore((state) => state.hasHydratedFromCloud)

  // Track client-side mounting to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    if (hasHydratedFromCloud) {
      setIsMounted(true)
    }
  }, [hasHydratedFromCloud])

  // Open profile sheet if coming from dropdown
  useEffect(() => {
    if (section === 'profile') {
      setActiveSheet('profile')
    }
  }, [section])

  // Avatar URL
  const avatarUrl = useMemo(() => {
    if (!userProfile) return null
    const seed = userProfile.avatarSeed || userProfile.email || 'default'
    return generateAvatar({ seed, size: 128 })
  }, [userProfile?.email, userProfile?.avatarSeed])
  
  // Plan display
  const planNames: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Member',
    family: 'Family Plan',
    enterprise: 'Enterprise',
  }
  const planName = userProfile?.plan ? planNames[userProfile.plan] : 'Free Plan'
  const isPremium = userProfile?.plan && userProfile.plan !== 'free'

  // Handlers
  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      clearUserData?.()
      router.replace('/auth/sign-in')
      router.refresh()
    } catch (error) {
      console.error('[v0] Sign out error:', error)
      addToast({ type: 'error', title: 'Sign out failed', message: 'Please try again' })
      setIsSigningOut(false)
    }
  }

  const handleExport = (format: 'csv' | 'json') => {
    exportSubscriptions(subscriptions, format)
    addToast({
      type: 'success',
      title: 'Export complete',
      message: `Your subscriptions have been exported as ${format.toUpperCase()}.`
    })
    setActiveSheet(null)
  }

  // Show minimal loading while store hydrates
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-8 pb-6 lg:px-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-48 bg-muted/50 animate-pulse rounded mt-2" />
        </div>
        <div className="px-4 lg:px-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
        >
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </motion.div>
      </div>
      
      {/* Profile Card */}
      <motion.button
        id="profile"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
        onClick={() => setActiveSheet('profile')}
        className="mx-4 mb-6 w-[calc(100%-2rem)] lg:mx-6 lg:w-[calc(100%-3rem)] text-left cursor-pointer"
      >
        <div className="p-4 rounded-2xl glass hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userProfile?.name || 'Profile'}
                className="w-16 h-16 rounded-full object-cover border-2 border-gold/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/30">
                <span className="text-2xl font-semibold text-gold">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {userProfile?.name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {currentUserEmail || 'No email'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Crown className={cn("w-4 h-4", isPremium ? "text-gold" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium", isPremium ? "text-gold" : "text-muted-foreground")}>
                  {planName}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </motion.button>
      
      {/* Settings Sections */}
      <div className="px-4 lg:px-6 space-y-6">
        {/* Account Section */}
        <SettingsSection title="Account" delay={0.15}>
          <SettingsItem
            icon={Crown}
            label="Subscription"
            description={planName}
            onClick={() => setShowPlanSheet(true)}
          />
          <SettingsItem
            icon={CreditCard}
            label="Payment Methods"
            description="Manage billing"
            onClick={() => {
              addToast({ type: 'info', title: 'Coming soon', message: 'Payment settings will be available soon.' })
            }}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" delay={0.2}>
          <SettingsToggle
            icon={Bell}
            label="Push Notifications"
            description="Renewal reminders"
            checked={notificationSettings.pushNotifications}
            onToggle={() => updateNotificationSettings({ pushNotifications: !notificationSettings.pushNotifications })}
          />
          <SettingsToggle
            icon={Mail}
            label="Email Notifications"
            description="Weekly summaries"
            checked={notificationSettings.emailNotifications}
            onToggle={() => updateNotificationSettings({ emailNotifications: !notificationSettings.emailNotifications })}
          />
          <SettingsItem
            icon={Smartphone}
            label="Reminder Timing"
            description={`${notificationSettings.reminderDays} days before renewal`}
            onClick={() => setActiveSheet('reminder')}
          />
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection title="Security" delay={0.25}>
          <SettingsItem
            icon={Lock}
            label="Change Password"
            onClick={() => setActiveSheet('password')}
          />
          <SettingsItem
            icon={Mail}
            label="Email Address"
            description={currentUserEmail || 'Not set'}
            onClick={() => setActiveSheet('email')}
          />
          <SettingsItem
            icon={Smartphone}
            label="Phone Number"
            description="Not set - add for OTP verification"
            onClick={() => {
              addToast({ type: 'info', title: 'Coming soon', message: 'Phone verification will be available soon.' })
            }}
          />
          <SettingsToggle
            icon={Shield}
            label="Biometric Login"
            description="Face ID / Touch ID"
            checked={notificationSettings.biometricEnabled}
            onToggle={() => updateNotificationSettings({ biometricEnabled: !notificationSettings.biometricEnabled })}
          />
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection title="Data & Storage" delay={0.3}>
          <SettingsItem
            icon={Download}
            label="Export Data"
            description="Download your subscriptions"
            onClick={() => setActiveSheet('export')}
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" delay={0.35}>
          <SettingsToggle
            icon={notificationSettings.theme === 'dark' ? Moon : Sun}
            label="Dark Mode"
            checked={notificationSettings.theme === 'dark'}
            onToggle={() => updateNotificationSettings({ theme: notificationSettings.theme === 'dark' ? 'light' : 'dark' })}
          />
          <SettingsItem
            icon={Globe}
            label="Language"
            description={notificationSettings.language === 'en' ? 'English' : notificationSettings.language}
            onClick={() => setActiveSheet('language')}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support" delay={0.4}>
          <SettingsItem
            icon={HelpCircle}
            label="Help Center"
            onClick={() => router.push('/help')}
          />
          <SettingsItem
            icon={FileText}
            label="Terms & Privacy"
            onClick={() => router.push('/legal/terms')}
          />
        </SettingsSection>
        
        {/* Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.45 }}
        >
          <motion.button
            onClick={handleSignOut}
            disabled={isSigningOut}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center justify-center gap-3 p-4 rounded-2xl glass transition-colors cursor-pointer",
              isSigningOut 
                ? "opacity-50 cursor-not-allowed" 
                : "text-crimson hover:bg-crimson/10"
            )}
          >
            {isSigningOut ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-medium">Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </>
            )}
          </motion.button>
        </motion.div>
        
        {/* Version */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Renewly v1.0.0
        </p>
      </div>

      {/* Plan Selection Sheet */}
      {showPlanSheet && (
        <PlanSelectionSheet 
          onClose={() => setShowPlanSheet(false)}
          currentPlan={userProfile?.plan || 'free'}
        />
      )}

      {/* Profile Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'profile'}
        onClose={() => setActiveSheet(null)}
        title="Edit Profile"
      >
        <ProfileForm
          userProfile={userProfile}
          avatarUrl={avatarUrl}
          onSave={(data) => {
            if (userProfile) {
              setUserProfile({ ...userProfile, ...data })
            }
            addToast({ type: 'success', title: 'Profile updated' })
            setActiveSheet(null)
          }}
        />
      </SettingsSheet>

      {/* Reminder Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'reminder'}
        onClose={() => setActiveSheet(null)}
        title="Reminder Timing"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Choose when to receive renewal reminders.</p>
          {[1, 3, 7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => {
                updateNotificationSettings({ reminderDays: days })
                addToast({ type: 'success', title: 'Reminder updated', message: `You'll be reminded ${days} day${days > 1 ? 's' : ''} before renewal.` })
                setActiveSheet(null)
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                notificationSettings.reminderDays === days
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "bg-muted hover:bg-secondary"
              )}
            >
              <span>{days} day{days > 1 ? 's' : ''} before</span>
              {notificationSettings.reminderDays === days && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </SettingsSheet>

      {/* Password Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'password'}
        onClose={() => setActiveSheet(null)}
        title="Change Password"
      >
        <PasswordForm
          onSuccess={() => {
            addToast({ type: 'success', title: 'Password updated' })
            setActiveSheet(null)
          }}
        />
      </SettingsSheet>

      {/* Email Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'email'}
        onClose={() => setActiveSheet(null)}
        title="Email Address"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-muted">
            <p className="text-sm text-muted-foreground">Current email</p>
            <p className="font-medium text-foreground">{currentUserEmail || 'Not set'}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            To change your email address, you'll need to verify the new email. A verification link will be sent to your new address.
          </p>
          <button
            onClick={() => {
              addToast({ type: 'info', title: 'Coming soon', message: 'Email change will be available soon.' })
            }}
            className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
          >
            Change Email Address
          </button>
        </div>
      </SettingsSheet>

      {/* Export Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'export'}
        onClose={() => setActiveSheet(null)}
        title="Export Data"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Download all your subscription data. You have {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}.
          </p>
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Download className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Export as CSV</p>
              <p className="text-sm text-muted-foreground">Spreadsheet format</p>
            </div>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <FileJson className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Export as JSON</p>
              <p className="text-sm text-muted-foreground">For backup & import</p>
            </div>
          </button>
        </div>
      </SettingsSheet>

      {/* Language Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'language'}
        onClose={() => setActiveSheet(null)}
        title="Language"
      >
        <div className="space-y-2">
          {[
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Español' },
            { code: 'fr', name: 'Français' },
            { code: 'de', name: 'Deutsch' },
            { code: 'hi', name: 'हिन्दी' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                updateNotificationSettings({ language: lang.code })
                addToast({ type: 'success', title: 'Language updated' })
                setActiveSheet(null)
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                notificationSettings.language === lang.code
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "bg-muted hover:bg-secondary"
              )}
            >
              <span>{lang.name}</span>
              {notificationSettings.language === lang.code && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </SettingsSheet>
    </div>
  )
}

// Settings Section Component
function SettingsSection({ 
  title, 
  children, 
  delay = 0 
}: { 
  title: string
  children: React.ReactNode
  delay?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay }}
    >
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <div className="rounded-2xl glass overflow-hidden divide-y divide-border">
        {children}
      </div>
    </motion.div>
  )
}

// Settings Item Component
function SettingsItem({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ElementType
  label: string
  description?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium block">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  )
}

// Settings Toggle Component
function SettingsToggle({
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: {
  icon: React.ElementType
  label: string
  description?: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
    >
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium block">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch 
        checked={checked}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-gold"
      />
    </div>
  )
}

// Profile Form Component
function ProfileForm({
  userProfile,
  avatarUrl,
  onSave,
}: {
  userProfile: any
  avatarUrl: string | null
  onSave: (data: any) => void
}) {
  const [name, setName] = useState(userProfile?.name || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    onSave({ name })
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Your avatar"
            className="w-20 h-20 rounded-full border-2 border-gold/30"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/30">
            <span className="text-2xl font-semibold text-gold">
              {name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !name.trim()}
        className={cn(
          "w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
          isLoading || !name.trim()
            ? "bg-gold/50 text-obsidian cursor-not-allowed"
            : "bg-gold text-obsidian hover:bg-gold/90"
        )}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Profile'
        )}
      </button>
    </form>
  )
}

// Password Form Component
function PasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addToast = useStore((state) => state.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) {
        setError(error.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full px-4 py-3 pr-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
        <input
          type={showPasswords ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
        <input
          type={showPasswords ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
        className={cn(
          "w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
          isLoading || !currentPassword || !newPassword || !confirmPassword
            ? "bg-gold/50 text-obsidian cursor-not-allowed"
            : "bg-gold text-obsidian hover:bg-gold/90"
        )}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Password'
        )}
      </button>
    </form>
  )
}
