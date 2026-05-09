'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CreditCard, Shield, Globe,
  HelpCircle, FileText, LogOut, ChevronRight, ChevronLeft, Crown,
  Smartphone, Mail, Lock, Download, FileJson, X,
  Check, AlertCircle, Eye, EyeOff, RefreshCw, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from '@/components/motion'
import { Switch } from '@/components/ui/switch'
import { SettingsSkeleton } from '@/components/skeletons'
import useStore from '@/lib/store'
import { exportSubscriptions } from '@/lib/export'
import { PlanSelectionSheet } from '@/components/plan-selection-sheet'
import { generateAvatar } from '@/lib/avatar-utils'
import { getStableProfileAvatar } from '@/lib/profile/avatar-source'
import { getSubscriptionRenewalDate, getPendingBillingBadgeText } from '@/lib/billing/billing-lifecycle-utils'
import { signOutAndRedirectHome } from '@/lib/auth/sign-out'
import { currencies } from '@/lib/locale-utils'
import { ThemeSelectorCards } from '@/components/theme-selector-cards'
import { languageNames, type SupportedLanguage } from '@/lib/i18n'

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

  // Sheet states
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [isExportingAccount, setIsExportingAccount] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [isCancellingPlan, setIsCancellingPlan] = useState(false)

  // Store
  const userProfile = useStore((state) => state.userProfile)
  const currentUserEmail = useStore((state) => state.currentUserEmail)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)

  const safeNotificationSettings = notificationSettings || {
    pushNotifications: false,
    emailNotifications: false,
    reminderDays: 7,
    currencyCode: 'INR',
    language: 'en',
  }

  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : []
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)
  const setUserProfile = useStore((state) => state.setUserProfile)

  // Family status for member/owner distinction
  const [familyStatus, setFamilyStatus] = useState<any>(null)
  const [familyStatusLoading, setFamilyStatusLoading] = useState(true)

  // Track client-side mounting to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch family status to check if user is owner or member
  useEffect(() => {
    const fetchFamilyStatus = async () => {
      try {
        const res = await fetch('/api/family/status')
        if (res.ok) {
          const data = await res.json()
          setFamilyStatus({
            ...data,
            members: Array.isArray(data?.members) ? data.members : [],
            invites: Array.isArray(data?.invites) ? data.invites : [],
          })
        }
      } catch (error) {
        console.error('[settings] Error fetching family status:', error)
      } finally {
        setFamilyStatusLoading(false)
      }
    }

    fetchFamilyStatus()
  }, [])

  // Determine if user is a Family member (not owner)
  const isFamilyMember = useMemo(() => {
    return userProfile?.plan === 'family' && familyStatus?.membership?.role === 'member'
  }, [userProfile?.plan, familyStatus?.membership?.role])

  // Safer derived billing state
  const isFamilyOwner = useMemo(() => {
    return familyStatus?.isFamilyOwner === true
  }, [familyStatus?.isFamilyOwner])

  const isActiveFamilyMember = useMemo(() => {
    return familyStatus?.membership?.role === 'member'
  }, [familyStatus?.membership?.role])

  const wasRemovedFromFamily = useMemo(() => {
    return Boolean(familyStatus?.removedMembership)
  }, [familyStatus?.removedMembership])

  const effectivePlan = useMemo(() => {
    if (wasRemovedFromFamily && userProfile?.plan === 'family') {
      return 'free'
    }
    return userProfile?.plan || 'free'
  }, [userProfile?.plan, wasRemovedFromFamily])

  // Open profile sheet if coming from dropdown
  useEffect(() => {
    if (section === 'profile') {
      setActiveSheet('profile')
    }
  }, [section])

  // Avatar URL - use persisted URL if available, otherwise generate
  const avatarUrl = useMemo(() => {
    return getStableProfileAvatar({
      profileAvatarUrl: userProfile?.avatarUrl || null,
      avatarSource: userProfile?.avatarSource || null,
      authAvatarUrl: userProfile?.picture || null,
      authPicture: userProfile?.picture || null,
      avatarSeed: userProfile?.avatarSeed || null,
      email: userProfile?.email || null,
      generateAvatar: (args) => generateAvatar(args.seed, args.size),
      size: 128,
    })
  }, [userProfile?.email, userProfile?.avatarSeed, userProfile?.avatarUrl, userProfile?.avatarSource, userProfile?.picture])

  // Plan display
  const planNames: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Renewly Pro',
    family: 'Renewly Family',
    enterprise: 'Enterprise',
  }
  const planName = userProfile?.plan ? planNames[userProfile.plan] : 'Free Plan'
  const isPremium = userProfile?.plan && userProfile.plan !== 'free'

  // Find active managed Renewly Pro/Family subscription for pending billing badge
  const currentRenewlyManagedSubscription = useMemo(() => {
    return safeSubscriptions.find((subscription: any) =>
      subscription?.isSystemManaged === true &&
      subscription?.systemSource === 'renewly_billing' &&
      (subscription?.managedPlan === 'pro' || subscription?.managedPlan === 'family') &&
      subscription?.status === 'active'
    )
  }, [safeSubscriptions])

  const pendingBillingBadgeText = currentRenewlyManagedSubscription
    ? getPendingBillingBadgeText(currentRenewlyManagedSubscription)
    : null

  const hasPendingCancellation = pendingBillingBadgeText?.toLowerCase().includes('cancels on') === true
  const hasPendingDowngrade = pendingBillingBadgeText?.toLowerCase().includes('downgrades to') === true
  const hasPendingBillingChange = Boolean(pendingBillingBadgeText)

  const currentCurrency =
    currencies.find((currency) => currency.code === safeNotificationSettings.currencyCode) || {
      code: safeNotificationSettings.currencyCode,
      name: safeNotificationSettings.currencyCode,
      symbol: safeNotificationSettings.currencyCode,
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
        exportSubscriptions(safeSubscriptions, format)

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
    // Browser push notifications - check browser support and request permission
    if (typeof window === 'undefined') {
      addToast({
        type: 'error',
        title: 'Browser not supported',
        message: 'Push notifications require a browser environment.',
      })
      return
    }

    if (!('Notification' in window)) {
      addToast({
        type: 'error',
        title: 'Notifications not supported',
        message: 'This browser does not support push notifications.',
      })
      return
    }

    if (!safeNotificationSettings.pushNotifications) {
      // User wants to turn ON push notifications - request permission
      try {
        const permission = Notification.permission

        if (permission === 'granted') {
          // Already have permission - save via API
          await callBrowserPushAPI(true, true)
          addToast({
            type: 'success',
            title: 'Browser push enabled',
            message: 'You will receive renewal reminders on this browser.',
          })
        } else if (permission === 'default') {
          // Request permission from user
          const result = await Notification.requestPermission()
          if (result === 'granted') {
            await callBrowserPushAPI(true, true)
            addToast({
              type: 'success',
              title: 'Browser push enabled',
              message: 'You will receive renewal reminders on this browser.',
            })
          } else {
            // User denied - save as disabled via API
            await callBrowserPushAPI(false, true)
            addToast({
              type: 'info',
              title: 'Permission required',
              message: 'You can enable push notifications anytime in Settings.',
            })
          }
        } else if (permission === 'denied') {
          // Permission previously denied
          addToast({
            type: 'error',
            title: 'Notifications blocked',
            message: 'Browser notifications are blocked. Enable them in your browser settings.',
          })
          await callBrowserPushAPI(false, true)
        }
      } catch (error) {
        console.error('[v0] Error toggling push notifications:', error)
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to enable push notifications.',
        })
      }
    } else {
      // User wants to turn OFF push notifications
      await callBrowserPushAPI(false, false)
      addToast({
        type: 'success',
        title: 'Browser push disabled',
        message: 'Browser push notifications disabled.',
      })
    }
  }

  const callBrowserPushAPI = async (pushEnabled: boolean, markSeen: boolean) => {
    try {
      const response = await fetch('/api/notifications/browser-push-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushNotifications: pushEnabled,
          markPromptSeen: markSeen,
        }),
      })

      if (!response.ok) {
        console.warn('[v0] Failed to update push preference:', response.status)
        return
      }

      const data = await response.json()
      if (data.success) {
        updateNotificationSettings({
          pushNotifications: data.pushNotifications,
          pushPromptSeenAt: data.pushPromptSeenAt,
        })
      }
    } catch (err) {
      console.error('[v0] Error calling browser push API:', err)
    }
  }

  const handleToggleEmailNotifications = async () => {
    await updateNotificationSettings({ emailNotifications: !safeNotificationSettings.emailNotifications })
  }

  const handleCancelPlan = async () => {
    // TODO: Real production cancellation should use Razorpay Subscriptions API with 
    // cancel_at_cycle_end=true, stored razorpay_subscription_id, subscription webhook lifecycle, 
    // and period-end entitlement enforcement.
    if (isCancellingPlan) return
    setIsCancellingPlan(true)

    try {
      // Use QA schedule-change endpoint for period-end cancellation
      const response = await fetch('/api/qa/billing/schedule-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cancel',
          targetPlan: 'free',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        addToast({
          type: 'error',
          title: 'Cancellation error',
          message: 'We could not schedule your cancellation right now. Please try again.',
        })
        setIsCancellingPlan(false)
        return
      }

      // Refresh subscriptions from server
      const subResponse = await fetch('/api/subscriptions', { cache: 'no-store' })
      if (subResponse.ok) {
        const subData = await subResponse.json()
        const rows = Array.isArray(subData?.subscriptions)
          ? subData.subscriptions
          : Array.isArray(subData)
            ? subData
            : []

        const { mapSubscriptionRowToUI } = await import('@/lib/supabase/mappers')
        const { filterDisplayableSubscriptionsForCurrentPlan } = await import(
          '@/lib/billing/billing-lifecycle-utils'
        )

        const subscriptions = rows
          .map(mapSubscriptionRowToUI)
          .filter((sub: any) => sub && sub.id)
        const { setSubscriptions } = useStore.getState()
        setSubscriptions(subscriptions)
      }

      // Get the renewal date for the toast message
      const renewalDate = getSubscriptionRenewalDate(userProfile)
      const dateStr = renewalDate
        ? new Date(renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'your renewal date'

      addToast({
        type: 'success',
        title: 'Cancellation scheduled',
        message: `You can continue using Renewly until ${dateStr}.`,
      })

      setShowCancelConfirmation(false)
      setActiveSheet(null)
    } catch (error) {
      console.error('[v0] Plan cancellation error:', error)
      addToast({
        type: 'error',
        title: 'Cancellation error',
        message: 'We could not schedule your cancellation right now. Please try again.',
      })
    } finally {
      setIsCancellingPlan(false)
    }
  }

  const handleChangePlan = () => {
    setActiveSheet(null)
    // Navigate to upgrade page with optional plan parameter
    router.push('/app/upgrade')
  }

  // Show premium skeleton while store hydrates
  if (!isMounted) {
    return <SettingsSkeleton />
  }

  return (
    <>
      <div className="min-h-screen bg-transparent pb-24">
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
              description={pendingBillingBadgeText || (userProfile?.plan === 'pro' ? 'Pro - Active' : planName)}
              onClick={() => setActiveSheet('billing')}
            />
            {/* Show Family Members loading state while fetching */}
            {userProfile?.plan === 'family' && familyStatusLoading && (
              <SettingsItem
                icon={Users}
                label="Family Members"
                description="Loading family access…"
                onClick={() => {}}
              />
            )}
            {/* Show Family Members when owner and not removed */}
            {isFamilyOwner && !wasRemovedFromFamily && (
              <SettingsItem
                icon={Users}
                label="Family Members"
                description="Manage members and invitations"
                onClick={() => window.location.href = '/app/family'}
              />
            )}
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection title="Notifications" delay={0.2}>
            <SettingsToggle
              icon={Bell}
              label="Browser Push Notifications"
              description="Receive renewal reminders on this browser/device"
              checked={safeNotificationSettings.pushNotifications}
              disabled={false}
              onToggle={handleTogglePushNotifications}
            />
            <div className="px-4 py-2 text-xs text-muted-foreground/70">
              For iPhone/iPad, add Renewly to your Home Screen to enable web push. Push delivery setup is being finalized.
            </div>
            <SettingsToggle
              icon={Mail}
              label="Email Notifications"
              description="Welcome emails, renewal updates, and account alerts"
              checked={safeNotificationSettings.emailNotifications}
              onToggle={handleToggleEmailNotifications}
            />
            <div className="px-4 py-2 text-xs text-muted-foreground/70">
              We'll use email for important account updates, upcoming renewal reminders, and useful subscription summaries — no spam.
            </div>
            <SettingsItem
              icon={Smartphone}
              label="Reminder Timing"
              description={`${safeNotificationSettings.reminderDays} days before renewal`}
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
              description="Coming soon"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Phone reminders coming soon',
                  message: 'Phone number settings are not available yet. Email reminders are working now.',
                })
              }}
              disabled={true}
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
            {/* Premium 3-card theme selector (Light / Dark / Glass) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border">
              <ThemeSelectorCards />
            </div>

            <SettingsItem
              icon={Globe}
              label="Currency"
              description={`${currentCurrency.symbol} ${currentCurrency.name}`}
              onClick={() => setActiveSheet('currency')}
            />

            <SettingsItem
              icon={Globe}
              label="Language"
              description={languageNames[(safeNotificationSettings.language || 'en') as SupportedLanguage]}
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

        {/* Plan Selection Sheet - wrapped in proper modal */}
        <SettingsSheet
          isOpen={showPlanSheet}
          onClose={() => setShowPlanSheet(false)}
          title="Choose Your Plan"
        >
          <PlanSelectionSheet
            onClose={() => setShowPlanSheet(false)}
            currentPlan={userProfile?.plan || 'free'}
          />
        </SettingsSheet>

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
                // Update store with new profile data including avatar
                setUserProfile({
                  ...userProfile,
                  name: data.name,
                  avatarUrl: data.avatarUrl,
                  timeZone: data.timezone,
                })
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
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors cursor-pointer"
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
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors cursor-pointer"
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
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          title={wasRemovedFromFamily && userProfile?.plan === 'free' ? 'Billing & Plan' : isFamilyMember ? 'Family Access' : 'Billing & Plan'}
        >
          <div className="space-y-6">
            {/* Removed from Family - Show Free Plan */}
            {wasRemovedFromFamily && userProfile?.plan === 'free' ? (
              <>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">Free Plan</p>
                  <p className="text-xs text-muted-foreground mt-2">Your Family access was removed</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Your personal Renewly account and tracked subscriptions are safe. You can start your own Pro or Family plan anytime.
                </p>

                <button
                  onClick={() => {
                    window.location.href = '/app/upgrade'
                    setActiveSheet(null)
                  }}
                  className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
                >
                  Start Your Own Plan
                </button>
              </>
            ) : isFamilyMember ? (
              /* Active Family Member */
              <>
                {/* Current Plan Display */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mt-1">Included in Family</p>
                  <p className="text-xs text-muted-foreground mt-2">You are not paying for this subscription</p>
                </div>

                {/* Family Member Description */}
                <p className="text-sm text-muted-foreground">
                  You are included in a Renewly Family plan. You are not the billing owner, so there is no paid subscription to cancel here.
                </p>

                {/* Period End Info */}
                {familyStatus?.familyGroup?.currentPeriodEnd && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs font-medium text-foreground mb-1">Your Family access expires</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(familyStatus.familyGroup.currentPeriodEnd).toLocaleDateString()}, unless the owner removes you or the plan ends.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => {
                      window.location.href = '/app/family'
                      setActiveSheet(null)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-500/20 border border-blue-500/30 transition-colors cursor-pointer"
                  >
                    Manage Family Access
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/app/upgrade'
                      setActiveSheet(null)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                  >
                    Start Your Own Plan
                  </button>
                  <p className="text-xs text-muted-foreground">
                    You can start your own Pro or Family plan anytime. This will be separate from the Family access you currently receive.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Only the Family owner can cancel the Family plan billing.
                </p>
              </>
            ) : (
              /* Owner or Non-Family - Original UI */
              <>
                {/* Current Plan Display */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-semibold text-gold mt-1">{planName}</p>
                  {pendingBillingBadgeText ? (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                      {pendingBillingBadgeText}
                    </p>
                  ) : isPremium ? (
                    <p className="text-xs text-muted-foreground mt-2">Your subscription is active</p>
                  ) : null}
                </div>

                {/* Free Plan - Show Upgrade CTA */}
                {!isPremium && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro or Family to unlock advanced features including analytics, leak detection, and more.
                    </p>
                    <button
                      onClick={handleChangePlan}
                      className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
                    >
                      View Upgrade Options
                    </button>
                  </>
                )}

                {/* Premium Plans - Show Manage Plan & Cancel Plan */}
                {isPremium && userProfile?.plan !== 'enterprise' && (
                  <>
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleChangePlan}
                        className="w-full px-4 py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                      >
                        Change Plan
                      </button>
                      {hasPendingBillingChange ? (
                        <button
                          disabled
                          className="w-full px-4 py-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30 opacity-80 cursor-not-allowed"
                        >
                          {hasPendingCancellation ? 'Cancellation Scheduled' : hasPendingDowngrade ? 'Downgrade Scheduled' : 'Billing Change Scheduled'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveSheet(null)
                            requestAnimationFrame(() => setShowCancelConfirmation(true))
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-600 font-medium hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                        >
                          Cancel Plan
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Enterprise Plan */}
                {userProfile?.plan === 'enterprise' && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      For changes to your enterprise subscription, please contact our sales team.
                    </p>
                    <button
                      onClick={() => {
                        window.location.href = 'mailto:contact@renewly.in'
                      }}
                      className="w-full py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                    >
                      Contact Sales
                    </button>
                  </>
                )}

                {/* Support Section */}
                <div className="p-4 rounded-xl bg-muted space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Questions about billing?</p>
                  <p className="text-sm text-foreground">Contact our support team for assistance with your account or subscription.</p>
                  <button
                    onClick={() => {
                      window.location.href = 'mailto:contact@renewly.in'
                    }}
                    className="text-sm text-gold hover:text-gold/80 font-medium transition-colors cursor-pointer"
                  >
                    contact@renewly.in
                  </button>
                </div>
              </>
            )}
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
                  "w-full flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer",
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
                    "w-full flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer",
                    safeNotificationSettings.language === lang.code
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
      </div>

      {/* Cancel Plan Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirmation && (() => {
          const renewalDate = getSubscriptionRenewalDate(userProfile)
          const dateStr = renewalDate
            ? new Date(renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'your renewal date'
          const isPro = userProfile?.plan === 'pro'
          const planName = isPro ? 'Renewly Pro' : 'Renewly Family'

          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelConfirmation(false)}
                className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[150] max-w-md mx-auto bg-card rounded-2xl border border-border p-6 shadow-xl"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Cancel {planName}?
                </h2>
                <div className="space-y-4 mb-6 text-sm text-muted-foreground">
                  <p>
                    Your {planName} access is paid until <span className="font-semibold text-foreground">{dateStr}</span>.
                  </p>
                  <div>
                    <p className="font-medium text-foreground mb-2">If you schedule cancellation now:</p>
                    <ul className="space-y-2 pl-4 list-disc">
                      <li>You can continue using {isPro ? 'Pro' : 'Family'} features until {dateStr}</li>
                      <li>Your plan will move to Free after that date</li>
                      <li>Your personal tracked subscriptions will not be deleted</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirmation(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={handleCancelPlan}
                    disabled={isCancellingPlan}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-600 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCancellingPlan ? 'Scheduling...' : 'Schedule Cancellation'}
                  </button>
                </div>
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>
    </>
  )
}

// Settings Section Component - Premium styled
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
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-gold/10 overflow-hidden divide-y divide-border/50">
        {children}
      </div>
    </motion.div>
  )
}

// Settings Item Component - Premium styled
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
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { x: 4, backgroundColor: 'rgba(199,163,106,0.05)' } : undefined}
      whileTap={!disabled ? { scale: 0.995 } : undefined}
      className={cn(
        "w-full flex items-center gap-4 p-4 transition-all text-left group",
        disabled
          ? "opacity-60 cursor-not-allowed bg-muted/10"
          : "hover:bg-gold/5 cursor-pointer"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
        disabled
          ? "bg-muted/30"
          : "bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/10 group-hover:border-gold/20"
      )}>
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium block group-hover:text-gold transition-colors">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {!disabled && <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors flex-shrink-0" />}
    </motion.button>
  )
}

// Settings Toggle Component
function SettingsToggle({
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
  disabled = false,
}: {
  icon: React.ElementType
  label: string
  description?: string
  checked: boolean
  onToggle: () => void | Promise<void>
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) void onToggle()
      }}
      className={cn(
        "w-full flex items-center gap-4 p-4 transition-colors text-left",
        disabled
          ? "opacity-60 cursor-not-allowed bg-muted/10"
          : "hover:bg-secondary/30 cursor-pointer"
      )}
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

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center"
      >
        <Switch
          checked={checked}
          onCheckedChange={() => {
            void onToggle()
          }}
          className="data-[state=checked]:bg-gold"
        />
      </div>
    </button>
  )
}

// Common timezones for the dropdown

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'America/Phoenix', label: 'Arizona (MST)', offset: 'UTC-7' },
  { value: 'America/Anchorage', label: 'Alaska Time', offset: 'UTC-9' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', offset: 'UTC-10' },
  { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Central European (CET)', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 'UTC+1' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: 'UTC+10' },
]

// DiceBear avatar styles - premium, varied options
const AVATAR_STYLES = [
  'thumbs',
  'shapes',
  'initials',
  'bottts',
  'identicon',
  'rings',
  'glass',
  'fun-emoji',
] as const

type AvatarStyle = typeof AVATAR_STYLES[number]

// Generate avatar URL with variety - each click produces a genuinely new avatar
function generateAvatarUrl(baseSeed: string, variation: number = 0): string {
  // Combine seed with variation number to create unique avatars
  const uniqueSeed = `${baseSeed}-v${variation}-${Date.now()}`
  const encodedSeed = encodeURIComponent(uniqueSeed)

  // Cycle through different styles based on variation
  const styleIndex = variation % AVATAR_STYLES.length
  const style = AVATAR_STYLES[styleIndex]

  // DiceBear v7 API with Renewly gold accent
  if (style === 'initials') {
    // Use UI Avatars for initials style - cleaner look
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(baseSeed)}&background=c7a36a&color=0a0d12&size=128&bold=true&format=svg`
  }

  // DiceBear styles with gold background
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}&backgroundColor=c7a36a&size=128`
}

// Profile Form Component with avatar regeneration and timezone
function ProfileForm({
  userProfile,
  avatarUrl: initialAvatarUrl,
  onSave,
}: {
  userProfile: any
  avatarUrl: string | null
  onSave: (data: any) => void
}) {
  const [name, setName] = useState(userProfile?.name || '')
  // Use saved timezone from profile, fall back to browser timezone only if no saved value
  const [timezone, setTimezone] = useState(() => {
    // Check if userProfile has a saved timezone
    if (userProfile?.timeZone) return userProfile.timeZone
    if (userProfile?.timezone) return userProfile.timezone
    // Only use browser timezone as initial fallback
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarVariation, setAvatarVariation] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addToast = useStore((state) => state.addToast)

  // Generate a new unique avatar on each click
  const handleRegenerateAvatar = () => {
    setIsRegenerating(true)
    setAvatarError(false)

    // Increment variation to get a genuinely new avatar
    const newVariation = avatarVariation + 1
    const seed = name || userProfile?.email || 'user'
    const newUrl = generateAvatarUrl(seed, newVariation)

    setAvatarVariation(newVariation)
    setAvatarUrl(newUrl)

    // Brief delay for visual feedback
    setTimeout(() => setIsRegenerating(false), 400)
  }

  // Handle avatar image load error - fallback to initials
  const handleAvatarError = () => {
    setAvatarError(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { updateUserProfile } = await import('@/lib/supabase/settings-actions')
      const result = await updateUserProfile({
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || undefined,
        timezone,
        avatarUrl: avatarUrl || undefined,
      })

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Profile updated',
          message: 'Your profile has been saved successfully.',
        })
        onSave({ name, timezone, avatarUrl })
      } else {
        setError(result.error || 'Failed to update profile.')
        addToast({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Failed to update profile.',
        })
      }
    } catch (error) {
      console.error('Profile save error:', error)
      setError('An unexpected error occurred.')
      addToast({
        type: 'error',
        title: 'Update failed',
        message: 'An unexpected error occurred.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar with regeneration */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt="Your avatar"
              onError={handleAvatarError}
              className={cn(
                "w-24 h-24 rounded-full border-2 border-gold/30 object-cover transition-all bg-gold/10",
                isRegenerating && "opacity-50 scale-95"
              )}
            />
          ) : (
            // Fallback initials avatar - always renders cleanly
            <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/30">
              <span className="text-3xl font-semibold text-gold">
                {name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          {isRegenerating && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-obsidian/50">
              <RefreshCw className="w-6 h-6 text-gold animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleRegenerateAvatar}
            disabled={isRegenerating}
            className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
            Generate new avatar
          </button>
          <p className="text-[10px] text-muted-foreground">
            Style {(avatarVariation % AVATAR_STYLES.length) + 1} of {AVATAR_STYLES.length}
          </p>
        </div>
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

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Timezone
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-xl bg-muted border border-border text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors cursor-pointer"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label} ({tz.offset})
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground rotate-90 pointer-events-none" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Used for displaying renewal dates and sending notifications at the right time.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !name.trim()}
        className={cn(
          "w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
          isLoading || !name.trim()
            ? "bg-gold/40 text-obsidian/70 cursor-not-allowed"
            : "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_4px_16px_rgba(199,163,106,0.25)]"
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

// Phone Number Form Component with OTP Verification
type PhoneStep = 'input' | 'verify'

function PhoneNumberForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<PhoneStep>('input')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [existingPhone, setExistingPhone] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [smsAvailable, setSmsAvailable] = useState(true)
  const addToast = useStore((state) => state.addToast)

  // Fetch existing phone and check SMS availability on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check SMS service status
        const statusRes = await fetch('/api/otp/status')
        if (statusRes.ok) {
          const status = await statusRes.json()
          setSmsAvailable(status.available !== false)
        }

        // Fetch existing phone
        const { getUserPhone } = await import('@/lib/supabase/settings-actions')
        const result = await getUserPhone()
        if (result.success) {
          setExistingPhone(result.phone)
          setPhoneNumber(result.phone || '')
          setIsVerified(result.verified)
        }
      } catch (err) {
        console.error('Failed to initialize phone form:', err)
      } finally {
        setIsFetching(false)
      }
    }
    init()
  }, [])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '')
    return cleaned
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    setError(null)
  }

  const handleSendOTP = async () => {
    setError(null)

    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await res.json()

      if (data.success) {
        setStep('verify')
        setCooldown(60)
        addToast({
          type: 'success',
          title: 'Code sent',
          message: `Verification code sent to ${phoneNumber}`,
        })
      } else {
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds)
        }
        setError(data.error || 'Failed to send verification code')
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError(null)

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      })

      const data = await res.json()

      if (data.success) {
        addToast({
          type: 'success',
          title: 'Phone verified',
          message: 'Your phone number has been verified successfully.',
        })
        onSuccess()
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWithoutVerification = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const { updateUserPhone } = await import('@/lib/supabase/settings-actions')
      const result = await updateUserPhone(phoneNumber || null)

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Phone number saved',
          message: 'Phone saved without verification.',
        })
        onSuccess()
      } else {
        setError(result.error || 'Failed to save phone number')
      }
    } catch (err) {
      setError('Failed to save phone number')
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
        addToast({ type: 'success', title: 'Phone number removed' })
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

  // OTP Verification Step
  if (step === 'verify') {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setStep('input')
            setOtpCode('')
            setError(null)
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to phone number
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-gold" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Enter verification code</h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{phoneNumber}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpCode[i] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  if (val.length <= 1) {
                    const newCode = otpCode.split('')
                    newCode[i] = val
                    setOtpCode(newCode.join(''))
                    // Auto-focus next input
                    if (val && i < 5) {
                      const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                      nextInput?.focus()
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Handle backspace to go to previous input
                  if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                    const prevInput = (e.target as HTMLElement).parentElement?.children[i - 1] as HTMLInputElement
                    prevInput?.focus()
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                  setOtpCode(paste)
                }}
                className={cn(
                  "w-12 h-14 text-center text-xl font-semibold rounded-xl border transition-all focus:outline-none focus:ring-2",
                  error
                    ? "border-destructive bg-destructive/5 focus:ring-destructive/50"
                    : "border-border bg-muted focus:ring-gold/50 focus:border-gold"
                )}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={handleVerifyOTP}
          disabled={isLoading || otpCode.length !== 6}
          className={cn(
            "w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
            isLoading || otpCode.length !== 6
              ? "bg-gold/40 text-obsidian/70 cursor-not-allowed"
              : "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_4px_16px_rgba(199,163,106,0.25)]"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Phone Number'
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{cooldown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isLoading}
              className="text-sm text-gold hover:text-gold/80 font-medium transition-colors"
            >
              Resend verification code
            </button>
          )}
        </div>
      </div>
    )
  }

  // Phone Input Step
  return (
    <div className="space-y-5">
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

      {/* SMS Availability Banner */}
      {!smsAvailable && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-500">SMS Verification Not Available</p>
              <p className="text-xs text-amber-500/80">
                SMS verification is not configured. Your phone number will be saved but cannot be verified at this time.
              </p>
            </div>
          </div>
        </div>
      )}

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
        {smsAvailable ? (
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={isLoading || !phoneNumber || phoneNumber.length < 10}
            className={cn(
              "w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              isLoading || !phoneNumber || phoneNumber.length < 10
                ? "bg-gold/40 text-obsidian/70 cursor-not-allowed"
                : "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_4px_16px_rgba(199,163,106,0.25)]"
            )}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveWithoutVerification}
            disabled={isLoading || !phoneNumber}
            className={cn(
              "w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              isLoading || !phoneNumber
                ? "bg-gold/40 text-obsidian/70 cursor-not-allowed"
                : "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_4px_16px_rgba(199,163,106,0.25)]"
            )}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Phone Number'
            )}
          </button>
        )}

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
    </div>
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
