'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import useStore from '@/lib/store'

interface InviteDetails {
  invitedEmail: string
  ownerEmail?: string
  familyGroupId: string
  expiresAt: string
}

interface PendingInvite {
  id: string
  invitedEmail: string
  expiresAt: string
}

type AcceptMode = 'token' | 'direct' | null

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const addToast = useStore((state) => state.addToast)

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [mode, setMode] = useState<AcceptMode>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [wrongEmailMatch, setWrongEmailMatch] = useState<string | null>(null)

  // Resolve invite details or check for pending invite
  useEffect(() => {
    const loadInvite = async () => {
      try {
        if (token) {
          // Token-based flow: try to resolve token
          setMode('token')
          try {
            const res = await fetch(`/api/family/invites/resolve?token=${encodeURIComponent(token)}`)
            if (res.ok) {
              const data = await res.json()
              setInviteDetails(data)
            } else {
              // Token resolution failed - fallback to pending invite lookup if user is signed in
              const statusRes = await fetch('/api/family/status', { cache: 'no-store' })
              if (statusRes.ok) {
                const statusData = await statusRes.json()
                if (statusData.pendingInvite) {
                  // Found pending invite by email - use direct flow
                  setMode('direct')
                  setPendingInvite(statusData.pendingInvite)
                } else {
                  // No pending invite found either
                  const data = await res.json()
                  throw new Error(data.error || 'Invalid or expired invitation')
                }
              } else {
                // Failed to fetch status, show token error
                const data = await res.json()
                throw new Error(data.error || 'Invalid or expired invitation')
              }
            }
          } catch (tokenError) {
            throw tokenError
          }
        } else {
          // No token: check for pending invite from status endpoint
          const res = await fetch('/api/family/status', { cache: 'no-store' })
          if (!res.ok) {
            throw new Error('Failed to load family status')
          }
          const data = await res.json()
          
          if (data.pendingInvite) {
            // Found pending invite: use direct accept flow
            setMode('direct')
            setPendingInvite(data.pendingInvite)
          } else {
            // No token and no pending invite: show friendly error
            setError(
              'Invite not found or no longer active. Ask the Family owner to resend the invite. Already signed in with the invited email? Open Family Members to check for pending invites.'
            )
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load invitation'
        setError(message)
        console.error('[family-accept] Invite load error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInvite()
  }, [token])

  const handleAcceptInvite = async () => {
    if (mode === 'token' && !token) return
    if (mode === 'direct' && !pendingInvite) return

    setIsAccepting(true)
    try {
      if (mode === 'token') {
        // Token-based acceptance
        const res = await fetch('/api/family/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to accept invitation')
        }
      } else if (mode === 'direct') {
        // Direct acceptance
        const res = await fetch('/api/family/invites/accept-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteId: pendingInvite.id }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to accept invitation')
        }
      }

      setIsAccepted(true)
      addToast({
        type: 'success',
        title: 'Family invite accepted',
        message: 'You&apos;re now included in a Renewly Family plan.',
      })

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/app/dashboard')
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setError(message)
      
      // Check if this is a wrong-email error
      if (message.includes('This invite was sent to')) {
        const emailMatch = message.match(/This invite was sent to ([^.]+)\./)
        if (emailMatch) {
          setWrongEmailMatch(emailMatch[1])
        }
      }
      
      addToast({
        type: 'error',
        title: 'Error accepting invitation',
        message,
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDeclineInvite = async () => {
    if (mode === 'direct' && !pendingInvite) return

    setIsDeclining(true)
    try {
      const res = await fetch('/api/family/invites/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: pendingInvite.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to decline invitation')
      }

      addToast({
        type: 'success',
        title: 'Invite declined',
        message: 'You declined the Family invitation.',
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/app/dashboard')
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      addToast({
        type: 'error',
        title: 'Error declining invitation',
        message,
      })
    } finally {
      setIsDeclining(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header title="Accept Family Invitation" />

        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : isAccepted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
            >
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">You&apos;re in Renewly Family</h2>
              <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                Your Family access is active. We&apos;ll take you to your dashboard now.
              </p>
            </motion.div>
          ) : error ? (
            wrongEmailMatch ? (
              // Wrong account signed in UI
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-100">Wrong account signed in</h2>
                  <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                    This invite was sent to {wrongEmailMatch}. Please sign out and sign in with that email to accept.
                  </p>
                </div>
                <div className="flex gap-3 justify-start">
                  <button
                    onClick={async () => {
                      await fetch('/auth/logout', { method: 'POST' })
                      router.push('/auth/signin')
                    }}
                    className="px-4 py-3 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                  <button
                    onClick={() => router.push('/app/dashboard')}
                    className="px-4 py-3 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-500/30 transition-colors cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </motion.div>
            ) : (
              // Generic error UI
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Cannot Accept Invitation</h2>
                    <p className="mt-2 text-sm text-red-800 dark:text-red-200">{error}</p>
                    <p className="mt-4 text-xs text-red-700 dark:text-red-300">
                      Check your email for a fresh invitation link or contact the Family group owner.
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          ) : mode === 'token' && inviteDetails ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold text-blue-900 dark:text-blue-100">You&apos;ve Been Invited</h2>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  Accept this invite to get Renewly Family access through the family owner&apos;s plan. Your personal subscriptions stay private.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Invitation for</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{inviteDetails.invitedEmail}</p>
                </div>
                {inviteDetails.ownerEmail && (
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">From</p>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{inviteDetails.ownerEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Expires</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {new Date(inviteDetails.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={handleAcceptInvite}
                disabled={isAccepting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-obsidian font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Accept Invitation
                  </>
                )}
              </button>
            </motion.div>
          ) : mode === 'direct' && pendingInvite ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold text-blue-900 dark:text-blue-100">You&apos;ve Been Invited to Renewly Family</h2>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  We found a pending Family invite for your signed-in email. Accept it to join the Family plan.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Invitation for</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{pendingInvite.invitedEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Expires</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {new Date(pendingInvite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAcceptInvite}
                  disabled={isAccepting || isDeclining}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-obsidian font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Accept Invite
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeclineInvite}
                  disabled={isDeclining || isAccepting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-medium hover:bg-red-500/20 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isDeclining ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5" />
                      Decline
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </PageTransition>
  )
}
