'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  User, Bell, CreditCard, Shield, Moon, Sun, Globe,
  HelpCircle, FileText, LogOut, ChevronRight, Crown,
  Smartphone, Mail, Lock, Download, Copy, FileJson, X,
  Check, AlertCircle, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from '@/components/motion'
import { Switch } from '@/components/ui/switch'
import { SettingsSkeleton } from '@/components/skeletons'
import useStore from '@/lib/store'
import { exportSubscriptions } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import { PlanSelectionSheet } from '@/components/plan-selection-sheet'
import { generateAvatar } from '@/lib/avatar-utils'
import { signOutAndRedirectHome } from '@/lib/auth/sign-out'
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
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !portalReady) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, portalReady])

  if (!portalReady) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-full flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-2xl max-h-[92dvh] md:max-h-[80dvh] overflow-hidden rounded-t-3xl md:rounded-3xl border border-border bg-card shadow-[0_28px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <div className="h-1 w-12 rounded-full bg-gold/40 md:hidden" />
                </div>

                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl border border-border bg-muted hover:bg-secondary transition-all flex items-center justify-center cursor-pointer"
                  aria-label={`Close ${title}`}
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="max-h-[calc(92dvh-88px)] md:max-h-[calc(80dvh-88px)] overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-6">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export function SettingsScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = searchParams.get('section')
  const { theme, setTheme } = useTheme()

  // Sheet states
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [isExportingAccount, setIsExportingAccount] = useState(false)

  // Store
  const userProfile = useStore((state) => state.userProfile)
  const currentUserEmail = useStore((state) => state.currentUserEmail)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)
  const setUserProfile = useStore((state) => state.setUserProfile)

  // Track client-side mounting to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

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
  const currentCurrency =
    currencies.find((currency) => currency.code === notificationSettings.currencyCode) || {
      code: notificationSettings.currencyCode,
      name: notificationSettings.currencyCode,
      symbol: notificationSettings.currencyCode,
    }

  // Handlers
  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await signOutAndRedirectHome()
    } catch (error) {
      console.error('[v0] Sign out error:', error)
      addToast({
        type: 'error',
        title: 'Sign out failed',
        message: 'Please try again',
      })
      setIsSigningOut(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === currentUserEmail) {
      addToast({ type: 'error', title: 'Invalid email', message: 'Please enter a different email address' })
      return
    }

    setIsChangingEmail(true)
    try {
      const { changeUserEmail } = await import('@/lib/supabase/settings-actions')
      const result = await changeUserEmail(newEmail)

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Verification email sent',
          message: 'Check your new email address to verify the change'
        })
        setNewEmail('')
        setActiveSheet(null)
      } else {
        addToast({
          type: 'error',
          title: 'Failed to change email',
          message: result.error || 'Please try again'
        })
      }
    } catch (error) {
      console.error('[v0] Email change error:', error)
      addToast({ type: 'error', title: 'Error', message: 'Failed to change email address' })
    } finally {
      setIsChangingEmail(false)
    }
  }

  const downloadJsonFile = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (format: 'csv' | 'json' | 'account') => {
    try {
      if (format === 'account') {
        setIsExportingAccount(true)

        const { exportUserData } = await import('@/lib/supabase/settings-actions')
        const result = await exportUserData()

        if (!result.success) {
          addToast({
            type: 'error',
            title: 'Export failed',
            message: result.error || 'Could not export your account data',
          })
          return
        }

        downloadJsonFile('renewly-account-export.json', result.data)

        addToast({
          type: 'success',
          title: 'Account export complete',
          message: 'Your full account backup has been downloaded as JSON.',
        })
      } else {
        exportSubscriptions(subscriptions, format)

        addToast({
          type: 'success',
          title: 'Subscription export complete',
          message: `Your subscriptions have been exported as ${format.toUpperCase()}.`,
        })
      }

      setActiveSheet(null)
    } catch (error) {
      console.error('[v0] Export error:', error)
      addToast({
        type: 'error',
        title: 'Export failed',
        message: 'Please try again',
      })
    } finally {
      setIsExportingAccount(false)
    }
  }

  // Toggle handlers that properly await async store updates
  const handleTogglePushNotifications = async () => {
    await updateNotificationSettings({ pushNotifications: !notificationSettings.pushNotifications })
  }

  const handleToggleEmailNotifications = async () => {
    await updateNotificationSettings({ emailNotifications: !notificationSettings.emailNotifications })
  }



  const handleToggleDarkMode = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    // Also persist to store for sync across sessions
    await updateNotificationSettings({ theme: newTheme })
  }

  // Show premium skeleton while store hydrates
  if (!isMounted) {
    return <SettingsSkeleton />
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
            icon={CreditCard}
            label="Plan & Billing"
            description={userProfile?.plan === 'pro' ? 'Pro - Active' : planName}
            onClick={() => setActiveSheet('billing')}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" delay={0.2}>
          <SettingsToggle
            icon={Bell}
            label="Push Notifications"
            description="Renewal reminders"
            checked={notificationSettings.pushNotifications}
            onToggle={handleTogglePushNotifications}
          />
          <SettingsToggle
            icon={Mail}
            label="Email Notifications"
            description="Weekly summaries"
            checked={notificationSettings.emailNotifications}
            onToggle={handleToggleEmailNotifications}
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
            description="Add your phone number"
            onClick={() => setActiveSheet('phone')}
          />
          <BiometricSettingsItem />
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection title="Data & Storage" delay={0.3}>
          <SettingsItem
            icon={Download}
            label="Export Data"
            description="Subscriptions as CSV/JSON or full account backup"
            onClick={() => setActiveSheet('export')}
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" delay={0.3}>
          <SettingsToggle
            icon={theme === 'dark' ? Moon : Sun}
            label="Dark Mode"
            checked={theme === 'dark'}
            onToggle={handleToggleDarkMode}
          />

          <SettingsItem
            icon={Globe}
            label="Currency"
            description={`${currentCurrency.symbol} ${currentCurrency.name}`}
            onClick={() => setActiveSheet('currency')}
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
            label="Terms of Service"
            onClick={() => router.push('/terms')}
          />
          <SettingsItem
            icon={FileText}
            label="Privacy Policy"
            onClick={() => router.push('/privacy')}
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
              "w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
              isSigningOut
                ? "border-gold/20 bg-gold/6 text-gold/70 opacity-70 cursor-not-allowed"
                : "border-gold/30 bg-[linear-gradient(135deg,rgba(199,163,106,0.14),rgba(199,163,106,0.06),rgba(255,255,255,0.02))] text-gold hover:border-gold/55 hover:bg-gold/16 hover:text-ivory hover:shadow-[0_16px_40px_rgba(199,163,106,0.16)]"
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
      {
        showPlanSheet && (
          <PlanSelectionSheet
            onClose={() => setShowPlanSheet(false)}
            currentPlan={userProfile?.plan || 'free'}
          />
        )
      }

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
              onClick={async () => {
                await updateNotificationSettings({ reminderDays: days })
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
        onClose={() => {
          setActiveSheet(null)
          setNewEmail('')
        }}
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
          <input
            type="email"
            placeholder="Enter new email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-gold outline-none transition-colors text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={handleChangeEmail}
            disabled={isChangingEmail || !newEmail}
            className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingEmail ? 'Sending...' : 'Change Email Address'}
          </button>
        </div>
      </SettingsSheet>

      {/* Phone Number Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'phone'}
        onClose={() => setActiveSheet(null)}
        title="Phone Number"
      >
        <PhoneNumberForm
          onSuccess={() => {
            addToast({ type: 'success', title: 'Phone number updated' })
            setActiveSheet(null)
          }}
        />
      </SettingsSheet>

      {/* Export Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'export'}
        onClose={() => setActiveSheet(null)}
        title="Export Data"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Download your subscriptions as CSV or JSON, or export a full account backup including profile,
            settings, notifications, and subscriptions.
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
          <button
            onClick={() => handleExport('account')}
            disabled={isExportingAccount}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              {isExportingAccount ? (
                <RefreshCw className="w-5 h-5 text-foreground animate-spin" />
              ) : (
                <FileJson className="w-5 h-5 text-foreground" />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Full account backup</p>
              <p className="text-sm text-muted-foreground">
                Profile, settings, notifications, and subscriptions (JSON)
              </p>
            </div>
          </button>
        </div>
      </SettingsSheet>

      {/* Billing & Plan Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'billing'}
        onClose={() => setActiveSheet(null)}
        title="Billing & Plan"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-2xl font-semibold text-gold mt-1">{planName}</p>
            {userProfile?.plan === 'pro' && (
              <p className="text-xs text-muted-foreground mt-2">Your subscription is active</p>
            )}
          </div>
          {userProfile?.plan !== 'pro' && (
            <>
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro to unlock advanced features including analytics, leak detection, and more.
              </p>
              <button
                onClick={() => {
                  setShowPlanSheet(true)
                  setActiveSheet(null)
                }}
                className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
              >
                View Upgrade Options
              </button>
            </>
          )}
          <div className="p-4 rounded-xl bg-muted space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Questions about billing?</p>
            <p className="text-sm text-foreground">Contact our support team for assistance with your account or subscription.</p>
          </div>
        </div>
      </SettingsSheet>

      {/* Language Sheet */}
      {/* Currency Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'currency'}
        onClose={() => setActiveSheet(null)}
        title="Currency"
      >
        <div className="space-y-2">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={async () => {
                await updateNotificationSettings({ currencyCode: currency.code })
                addToast({
                  type: 'success',
                  title: 'Currency updated',
                  message: `${currency.name} is now your preferred currency.`,
                })
                setActiveSheet(null)
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                notificationSettings.currencyCode === currency.code
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "bg-muted hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{currency.symbol}</span>
                <div className="text-left">
                  <p className="font-medium">{currency.name}</p>
                  <p className="text-sm opacity-80">{currency.code}</p>
                </div>
              </div>

              {notificationSettings.currencyCode === currency.code && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </SettingsSheet>
      <SettingsSheet
        isOpen={activeSheet === 'language'}
        onClose={() => setActiveSheet(null)}
        title="Language"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select your preferred language. Settings labels, common UI text, and notification messages will be displayed in your chosen language.
          </p>
          <div className="space-y-2">
            {[
              { code: 'en', name: 'English', nativeName: 'English' },
              { code: 'es', name: 'Spanish', nativeName: 'Español' },
              { code: 'fr', name: 'French', nativeName: 'Français' },
              { code: 'de', name: 'German', nativeName: 'Deutsch' },
              { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={async () => {
                  await updateNotificationSettings({ language: lang.code })
                  addToast({ 
                    type: 'success', 
                    title: 'Language updated',
                    message: `App language changed to ${lang.nativeName}`
                  })
                  setActiveSheet(null)
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                  notificationSettings.language === lang.code
                    ? "bg-gold/10 text-gold border border-gold/30"
                    : "bg-muted hover:bg-secondary"
                )}
              >
                <div className="text-left">
                  <span className="block font-medium">{lang.nativeName}</span>
                  <span className="text-sm opacity-70">{lang.name}</span>
                </div>
                {notificationSettings.language === lang.code && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Note: Some content like legal pages may remain in English.
          </p>
        </div>
      </SettingsSheet>
    </div >
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
  disabled = false,
}: {
  icon: React.ElementType
  label: string
  description?: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 p-4 transition-colors text-left",
        disabled
          ? "opacity-60 cursor-not-allowed bg-muted/20"
          : "hover:bg-secondary/30 cursor-pointer"
      )}
    >
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", disabled ? "bg-muted/30" : "bg-secondary")}>
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium block">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {!disabled && <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
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
  onToggle: () => void | Promise<void>
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
    try {
      const { updateUserProfile } = await import('@/lib/supabase/settings-actions')
      const result = await updateUserProfile({
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      })

      if (result.success) {
        onSave({ name })
      } else {
        console.error('[v0] Profile update failed:', result.error)
      }
    } catch (error) {
      console.error('[v0] Profile save error:', error)
    } finally {
      setIsLoading(false)
    }
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

// Password validation rules
const passwordRules = {
  minLength: { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  hasUppercase: { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  hasLowercase: { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  hasNumber: { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  hasSpecial: { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'One special character' },
}

// Password Form Component with real re-authentication
function PasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const addToast = useStore((state) => state.addToast)

  // Calculate which rules pass
  const ruleResults = useMemo(() => {
    return Object.entries(passwordRules).map(([key, rule]) => ({
      key,
      label: rule.label,
      passes: rule.test(newPassword),
    }))
  }, [newPassword])

  const allRulesPass = ruleResults.every((r) => r.passes)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const isFormValid = 
    currentPassword.length > 0 && 
    allRulesPass && 
    passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorType(null)

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    if (!allRulesPass) {
      setError('Password does not meet all requirements')
      return
    }

    setIsLoading(true)
    try {
      const { changeUserPassword } = await import('@/lib/supabase/settings-actions')
      const result = await changeUserPassword(currentPassword, newPassword)

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Password updated',
          message: 'Your password has been changed successfully.',
        })
        onSuccess()
      } else {
        setError(result.error || 'Failed to update password')
        setErrorType(result.errorType || null)
      }
    } catch (err) {
      setError('Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              if (errorType === 'invalid_current_password') {
                setError(null)
                setErrorType(null)
              }
            }}
            placeholder="Enter your current password"
            className={cn(
              "w-full px-4 py-3 pr-12 rounded-xl bg-muted border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors",
              errorType === 'invalid_current_password'
                ? "border-destructive focus:ring-destructive/50"
                : "border-border focus:ring-gold/50"
            )}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errorType === 'invalid_current_password' && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Current password is incorrect
          </p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Create a new password"
            className="w-full px-4 py-3 pr-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Rules */}
        <div className="mt-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Password Requirements</p>
          <div className="space-y-1.5">
            {ruleResults.map((rule) => (
              <div
                key={rule.key}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  newPassword.length === 0
                    ? "text-muted-foreground"
                    : rule.passes
                    ? "text-emerald-500"
                    : "text-muted-foreground"
                )}
              >
                {newPassword.length > 0 && rule.passes ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-current flex-shrink-0" />
                )}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            className={cn(
              "w-full px-4 py-3 pr-12 rounded-xl bg-muted border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors",
              confirmPassword.length > 0 && !passwordsMatch
                ? "border-destructive focus:ring-destructive/50"
                : "border-border focus:ring-gold/50"
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {confirmPassword.length > 0 && (
          <p className={cn(
            "mt-2 text-sm flex items-center gap-1.5",
            passwordsMatch ? "text-emerald-500" : "text-destructive"
          )}>
            {passwordsMatch ? (
              <>
                <Check className="w-4 h-4" />
                Passwords match
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Passwords do not match
              </>
            )}
          </p>
        )}
      </div>

      {/* General Error */}
      {error && errorType !== 'invalid_current_password' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className={cn(
          "w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
          isLoading || !isFormValid
            ? "bg-gold/40 text-obsidian/70 cursor-not-allowed"
            : "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_4px_16px_rgba(199,163,106,0.25)] hover:shadow-[0_6px_20px_rgba(199,163,106,0.35)]"
        )}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          'Update Password'
        )}
      </button>
    </form>
  )
}

// Phone Number Form Component
function PhoneNumberForm({ onSuccess }: { onSuccess: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [existingPhone, setExistingPhone] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const addToast = useStore((state) => state.addToast)

  // Fetch existing phone on mount
  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const { getUserPhone } = await import('@/lib/supabase/settings-actions')
        const result = await getUserPhone()
        if (result.success) {
          setExistingPhone(result.phone)
          setPhoneNumber(result.phone || '')
          setIsVerified(result.verified)
        }
      } catch (err) {
        console.error('[v0] Failed to fetch phone:', err)
      } finally {
        setIsFetching(false)
      }
    }
    fetchPhone()
  }, [])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '')
    return cleaned
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic phone validation
    if (phoneNumber && phoneNumber.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setIsLoading(true)
    try {
      const { updateUserPhone } = await import('@/lib/supabase/settings-actions')
      const result = await updateUserPhone(phoneNumber || null)

      if (result.success) {
        addToast({
          type: 'success',
          title: phoneNumber ? 'Phone number saved' : 'Phone number removed',
          message: result.message,
        })
        onSuccess()
      } else {
        setError(result.error || 'Failed to update phone number')
      }
    } catch (err) {
      setError('Failed to update phone number. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      const { updateUserPhone } = await import('@/lib/supabase/settings-actions')
      const result = await updateUserPhone(null)

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Phone number removed',
        })
        onSuccess()
      } else {
        setError(result.error || 'Failed to remove phone number')
      }
    } catch (err) {
      setError('Failed to remove phone number')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Existing Phone Display */}
      {existingPhone && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current phone number</p>
              <p className="font-medium text-foreground">{existingPhone}</p>
            </div>
            <div className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium",
              isVerified 
                ? "bg-emerald-500/20 text-emerald-500" 
                : "bg-amber-500/20 text-amber-500"
            )}>
              {isVerified ? 'Verified' : 'Not verified'}
            </div>
          </div>
        </div>
      )}

      {/* Info Banner - SMS not configured */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-500">SMS Verification Not Available</p>
            <p className="text-xs text-amber-500/80">
              SMS verification is not yet configured. Your phone number will be saved but cannot be verified at this time.
            </p>
          </div>
        </div>
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {existingPhone ? 'Update Phone Number' : 'Add Phone Number'}
        </label>
        <div className="relative">
          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="+1 234 567 8900"
            className="w-full px-4 py-3 pl-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Include country code (e.g., +1 for US, +91 for India)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isLoading || (!phoneNumber && !existingPhone)}
          className={cn(
            "w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
            isLoading || (!phoneNumber && !existingPhone)
              ? "bg-gold/40 text-obsidian/70 cursor-not-allowed"
              : "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_4px_16px_rgba(199,163,106,0.25)] hover:shadow-[0_6px_20px_rgba(199,163,106,0.35)]"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            existingPhone ? 'Update Phone Number' : 'Save Phone Number'
          )}
        </button>

        {existingPhone && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove Phone Number
          </button>
        )}
      </div>
    </form>
  )
}

// Biometric Settings Item - shows honest "not supported" state
function BiometricSettingsItem() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer text-left"
      >
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-foreground font-medium block">Biometric Login</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Not available
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Biometric Login</h3>
                  <p className="text-sm text-muted-foreground mt-1">Face ID / Touch ID</p>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-500">Not Available on This Platform</p>
                    <p className="text-xs text-amber-500/80">
                      Biometric authentication (Face ID, Touch ID, fingerprint) is not supported in web browsers. This feature may be available in native mobile apps in a future update.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Your account is protected by your password. For enhanced security, we recommend using a strong, unique password and enabling email notifications for account activity.
              </p>

              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
