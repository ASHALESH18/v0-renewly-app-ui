'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CreditCard, Shield, Globe,
  HelpCircle, FileText, LogOut, ChevronRight, Crown,
  Smartphone, Download, X,
  Check, AlertCircle, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { SettingsSkeleton } from '@/components/skeletons'
import useStore from '@/lib/store'
import { exportSubscriptions } from '@/lib/export'
import { signOutAndRedirectHome } from '@/lib/auth/sign-out'
import { currencies } from '@/lib/locale-utils'
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
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isExportingAccount, setIsExportingAccount] = useState(false)
  const [billingStep, setBillingStep] = useState<'overview' | 'cancel-confirm' | 'cancel-success' | 'support-cancel'>('overview')
  const [qaStatus, setQaStatus] = useState<{ enabled: boolean; emailAllowed: boolean; currentPlan: string } | null>(null)
  const [isCancellingPlan, setIsCancellingPlan] = useState(false)

  // Store
  const userProfile = useStore((state) => state.userProfile)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)

  // Track client-side mounting to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if QA mode is enabled (production-safe check)
  const isQAMode = useMemo(() => {
    if (typeof window === 'undefined') return false
    return process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_QA_ENABLED !== 'false'
  }, [])

  // Open profile sheet if coming from dropdown
  useEffect(() => {
    if (section === 'profile') {
      setActiveSheet('profile')
    }
  }, [section])

  // Fetch QA status when Billing sheet opens
  useEffect(() => {
    if (activeSheet === 'billing' && !qaStatus) {
      const fetchQaStatus = async () => {
        setIsFetchingQaStatus(true)
        try {
          const response = await fetch('/api/qa/plan-override/status')
          if (response.ok) {
            const data = await response.json()
            setQaStatus(data)
          } else {
            setQaStatus({ enabled: false, emailAllowed: false, currentPlan: userProfile?.plan || 'free' })
          }
        } catch (error) {
          console.error('[v0] Failed to fetch QA status:', error)
          setQaStatus({ enabled: false, emailAllowed: false, currentPlan: userProfile?.plan || 'free' })
        } finally {
          setIsFetchingQaStatus(false)
        }
      }
      fetchQaStatus()
    }
    
    // Reset billing step when sheet closes
    if (activeSheet !== 'billing') {
      setBillingStep('overview')
    }
  }, [activeSheet, qaStatus, userProfile?.plan])

  // Handlers for Plan Management
  const handleChangePlan = () => {
    setActiveSheet(null)
    if (userProfile?.plan === 'pro') {
      router.push('/app/upgrade?plan=family')
    } else if (userProfile?.plan === 'family') {
      // Family downgrades not yet automated
      setActiveSheet('billing')
      setBillingStep('support-cancel')
    } else {
      router.push('/app/upgrade')
    }
  }

  const handleReviewCancellation = () => {
    setBillingStep('cancel-confirm')
  }

  const handleKeepPlan = () => {
    setBillingStep('overview')
  }

  const handleCancelPlan = async () => {
    // Guard: only allow if QA is enabled AND emailAllowed is true
    if (!qaStatus?.enabled || !qaStatus?.emailAllowed || isCancellingPlan) return
    
    setIsCancellingPlan(true)
    try {
      const response = await fetch('/api/qa/plan-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free' }),
      })

      const data = await response.json()

      if (!response.ok) {
        addToast({
          type: 'error',
          title: 'Cancellation failed',
          message: data.error || 'Failed to cancel plan',
        })
        return
      }

      addToast({
        type: 'success',
        title: 'Plan cancelled',
        message: 'Your subscription has been cancelled and your plan is now Free.',
      })

      setBillingStep('cancel-success')
      setTimeout(() => {
        setActiveSheet(null)
        setBillingStep('overview')
        // Refresh the page to get updated plan and subscriptions from server
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('[v0] Plan cancellation error:', error)
      addToast({
        type: 'error',
        title: 'Cancellation error',
        message: (error as Error).message || 'An unexpected error occurred',
      })
    } finally {
      setIsCancellingPlan(false)
    }
  }

  // Main Settings Page
  return (
    <>
      <div className="min-h-screen bg-transparent pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <button
            onClick={() => setActiveSheet('profile')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="text-gold font-semibold">{userProfile?.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-foreground font-medium block truncate">{userProfile?.name || 'Guest'}</span>
              <span className="text-xs text-muted-foreground truncate">{userProfile?.email}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Preferences Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
          
          {/* Notifications */}
          <button
            onClick={() => setActiveSheet('notifications')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Theme */}
          <button
            onClick={() => setActiveSheet('theme')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Theme</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Currency */}
          <button
            onClick={() => setActiveSheet('currency')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Currency</span>
              <p className="text-xs text-muted-foreground">{notificationSettings.currencyCode || 'INR'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Language */}
          <button
            onClick={() => setActiveSheet('language')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Language</span>
              <p className="text-xs text-muted-foreground">{languageNames[notificationSettings.language as SupportedLanguage] || 'English'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Phone Number - Disabled */}
          <button
            onClick={() => setActiveSheet('phone')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 opacity-60 cursor-not-allowed text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-muted-foreground font-medium">Phone Number</span>
              <p className="text-xs text-muted-foreground">Not available yet</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Billing Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Billing</h2>
          <button
            onClick={() => setActiveSheet('billing')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Plan & Billing</span>
              <p className="text-xs text-gold capitalize">{userProfile?.plan || 'free'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Support & Legal Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Support & Legal</h2>
          
          {/* Privacy Policy */}
          <button
            onClick={() => window.open('https://renewly.in/privacy', '_blank')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Terms of Service */}
          <button
            onClick={() => window.open('https://renewly.in/terms', '_blank')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Help & Support */}
          <button
            onClick={() => window.location.href = 'mailto:contact@renewly.in'}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Export Account Data */}
          <button
            onClick={async () => {
              setIsExportingAccount(true)
              try {
                await exportSubscriptions(subscriptions, 'json')
                addToast({
                  type: 'success',
                  title: 'Export successful',
                  message: 'Your subscription data has been downloaded as JSON.',
                })
              } catch (error) {
                addToast({
                  type: 'error',
                  title: 'Export failed',
                  message: 'Failed to export your data. Please try again.',
                })
              } finally {
                setIsExportingAccount(false)
              }
            }}
            disabled={isExportingAccount}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors cursor-pointer text-left disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-foreground font-medium">Export Account Data</span>
              <p className="text-xs text-muted-foreground">Download your subscriptions as JSON</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Sign Out */}
          <button
            onClick={async () => {
              setIsSigningOut(true)
              await signOutAndRedirectHome()
            }}
            disabled={isSigningOut}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-destructive/20 hover:bg-destructive/5 transition-colors cursor-pointer text-left disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <span className="text-destructive font-medium">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>

      {/* Billing & Plan Sheet */}
      <SettingsSheet
        isOpen={activeSheet === 'billing'}
        onClose={() => setActiveSheet(null)}
        title={billingStep === 'overview' ? 'Billing & Plan' : 'Cancel Subscription'}
      >
        {billingStep === 'overview' && (
          <div className="space-y-6">
            {/* Current Plan Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-semibold text-gold mt-1 capitalize">{userProfile?.plan || 'free'}</p>
              {userProfile?.plan && userProfile.plan !== 'free' && (
                <p className="text-xs text-muted-foreground mt-2">Your subscription is active</p>
              )}
            </div>

            {/* Free Plan - Show Upgrade CTA */}
            {!userProfile?.plan || userProfile.plan === 'free' ? (
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
            ) : (
              <>
                {/* Pro/Family Plans - Show Manage Options */}
                {userProfile.plan !== 'enterprise' && (
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleChangePlan}
                      className="w-full px-4 py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                    >
                      {userProfile.plan === 'pro' ? 'Upgrade to Family' : 'Change Plan'}
                    </button>
                    {qaStatus?.enabled && qaStatus?.emailAllowed ? (
                      <button
                        onClick={handleReviewCancellation}
                        className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-600 font-medium hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                      >
                        Review Cancellation
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Enterprise Support */}
                {userProfile.plan === 'enterprise' && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      For changes to your enterprise subscription, please contact our sales team.
                    </p>
                    <button
                      onClick={() => window.location.href = 'mailto:contact@renewly.in'}
                      className="w-full py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                    >
                      Contact Sales
                    </button>
                  </>
                )}
              </>
            )}

            {/* Support Section */}
            <div className="p-4 rounded-xl bg-muted space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Questions about billing?</p>
              <p className="text-sm text-foreground">Contact our support team for assistance with your account or subscription.</p>
              <button
                onClick={() => window.location.href = 'mailto:contact@renewly.in'}
                className="text-sm text-gold hover:text-gold/80 font-medium transition-colors"
              >
                contact@renewly.in
              </button>
            </div>
          </div>
        )}

        {billingStep === 'cancel-confirm' && qaStatus?.enabled && qaStatus?.emailAllowed && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Cancel Renewly {userProfile?.plan === 'pro' ? 'Pro' : 'Family'}?
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Cancelling will:</p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Remove premium access and features</li>
                  <li>Keep your personal tracked subscriptions safe</li>
                  <li>Downgrade your plan to Free</li>
                </ul>
                <p className="pt-2 text-xs italic">Your personal subscription records will always be preserved.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleKeepPlan}
                className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-secondary transition-colors cursor-pointer"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelPlan}
                disabled={isCancellingPlan}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 text-red-600 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCancellingPlan ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}

        {billingStep === 'cancel-success' && (
          <div className="space-y-6 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Plan Cancelled</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your subscription has been cancelled. Your plan is now Free.
              </p>
            </div>
          </div>
        )}

        {billingStep === 'support-cancel' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Downgrades are not yet automated. Please contact our support team to downgrade your subscription.
            </p>
            <button
              onClick={() => window.location.href = 'mailto:contact@renewly.in'}
              className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
            >
              Contact Support
            </button>
          </div>
        )}
      </SettingsSheet>

      {/* Phone Number Sheet - Unavailable */}
      <SettingsSheet
        isOpen={activeSheet === 'phone'}
        onClose={() => setActiveSheet(null)}
        title="Phone Number"
      >
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            Unavailable
          </span>
          <p className="text-sm text-muted-foreground">
            Phone number management is not available yet. We're keeping Renewly account access focused on secure Google/Apple sign-in. Phone number verification will be added later if needed.
          </p>
          <button
            type="button"
            onClick={() => setActiveSheet(null)}
            className="w-full rounded-xl bg-gold py-3 font-medium text-obsidian"
          >
            Got it
          </button>
        </div>
      </SettingsSheet>
    </>
  )
}
    <SettingsSheet
      isOpen={activeSheet === 'billing'}
      onClose={() => setActiveSheet(null)}
      title={billingStep === 'overview' ? 'Billing & Plan' : 'Cancel Subscription'}
    >
      {billingStep === 'overview' && (
        <div className="space-y-6">
          {/* Current Plan Display */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-2xl font-semibold text-gold mt-1 capitalize">{userProfile?.plan || 'free'}</p>
            {userProfile?.plan && userProfile.plan !== 'free' && (
              <p className="text-xs text-muted-foreground mt-2">Your subscription is active</p>
            )}
          </div>

          {/* Free Plan - Show Upgrade CTA */}
          {!userProfile?.plan || userProfile.plan === 'free' ? (
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
          ) : (
            <>
              {/* Pro/Family Plans - Show Manage Options */}
              {userProfile.plan !== 'enterprise' && (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleChangePlan}
                    className="w-full px-4 py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                  >
                    {userProfile.plan === 'pro' ? 'Upgrade to Family' : 'Change Plan'}
                  </button>
                  {qaStatus?.enabled && qaStatus?.emailAllowed ? (
                    <button
                      onClick={handleReviewCancellation}
                      className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-600 font-medium hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                    >
                      Review Cancellation
                    </button>
                  ) : null}
                </div>
              )}

              {/* Enterprise Support */}
              {userProfile.plan === 'enterprise' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    For changes to your enterprise subscription, please contact our sales team.
                  </p>
                  <button
                    onClick={() => window.location.href = 'mailto:contact@renewly.in'}
                    className="w-full py-3 rounded-xl bg-gold/10 text-gold font-medium hover:bg-gold/20 border border-gold/30 transition-colors cursor-pointer"
                  >
                    Contact Sales
                  </button>
                </>
              )}
            </>
          )}

          {/* Support Section */}
          <div className="p-4 rounded-xl bg-muted space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Questions about billing?</p>
            <p className="text-sm text-foreground">Contact our support team for assistance with your account or subscription.</p>
            <button
              onClick={() => window.location.href = 'mailto:contact@renewly.in'}
              className="text-sm text-gold hover:text-gold/80 font-medium transition-colors"
            >
              contact@renewly.in
            </button>
          </div>
        </div>
      )}

      {billingStep === 'cancel-confirm' && qaStatus?.enabled && qaStatus?.emailAllowed && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Cancel Renewly {userProfile?.plan === 'pro' ? 'Pro' : 'Family'}?
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Cancelling will:</p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>Remove premium access and features</li>
                <li>Keep your personal tracked subscriptions safe</li>
                <li>Downgrade your plan to Free</li>
              </ul>
              <p className="pt-2 text-xs italic">Your personal subscription records will always be preserved.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleKeepPlan}
              className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-secondary transition-colors cursor-pointer"
            >
              Keep Plan
            </button>
            <button
              onClick={handleCancelPlan}
              disabled={isCancellingPlan}
              className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 text-red-600 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCancellingPlan ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      )}

      {billingStep === 'cancel-success' && (
        <div className="space-y-6 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plan Cancelled</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Your subscription has been cancelled. Your plan is now Free.
            </p>
          </div>
        </div>
      )}

      {billingStep === 'support-cancel' && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Downgrades are not yet automated. Please contact our support team to downgrade your subscription.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:contact@renewly.in'}
            className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      )}
    </SettingsSheet>

      {/* Phone Number Sheet - Unavailable */}
      <SettingsSheet
        isOpen={activeSheet === 'phone'}
        onClose={() => setActiveSheet(null)}
        title="Phone Number"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-500">Unavailable</p>
                <p className="text-sm text-muted-foreground">
                  Phone number management is not available yet. We're keeping Renewly account access focused on secure Google/Apple sign-in. Phone number verification will be added later if needed.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveSheet(null)}
            className="w-full py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </SettingsSheet>
    </>
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
