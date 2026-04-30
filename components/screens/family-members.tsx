'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Mail, Loader2, AlertCircle, CheckCircle2, Clock, ExternalLink, X } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'

interface FamilyStatus {
  profilePlan: string
  isFamilyOwner: boolean
  familyGroup: any
  familyGroupId: string | null
  membership: any
  pendingInvite: any
  members: Array<any>
  invites: Array<any & { _qaInviteUrl?: string }>
  maxMembers: number
  currentMemberCount: number
  availableSeats: number
}

interface InvitationState {
  email: string
  status: 'idle' | 'sending' | 'success' | 'error'
  errorMessage?: string
  inviteUrl?: string
}

/**
 * Get stable invite ID from invite object
 * Handles multiple field name variations for compatibility
 */
function getInviteId(invite: any): string {
  return String(invite?.id || invite?.inviteId || invite?.invite_id || '').trim()
}

export function FamilyMembersScreen() {
  const userProfile = useStore((state) => state.userProfile)
  const addToast = useStore((state) => state.addToast)
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)
  const [isCancellingInvite, setIsCancellingInvite] = useState(false)
  const [inviteToCancel, setInviteToCancel] = useState<{
    id: string
    email: string
  } | null>(null)
  const [isAcceptingDirectInvite, setIsAcceptingDirectInvite] = useState(false)
  const [invitationState, setInvitationState] = useState<InvitationState>({ email: '', status: 'idle' })

  // Fetch family status
  useEffect(() => {
    const fetchFamilyStatus = async () => {
      try {
        const res = await fetch('/api/family/status')
        if (!res.ok) {
          throw new Error('Failed to fetch family status')
        }
        const data = await res.json()
        setFamilyStatus(data)
      } catch (error) {
        console.error('[v0] Error fetching family status:', error)
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load family members. Please try again.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFamilyStatus()
  }, [addToast])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invitationState.email.trim()) {
      setInvitationState((prev) => ({ ...prev, status: 'error', errorMessage: 'Email is required' }))
      return
    }

    setInvitationState((prev) => ({ ...prev, status: 'sending', errorMessage: undefined }))

    try {
      const res = await fetch('/api/family/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invitationState.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      // Handle QA mode with inviteUrl but no email
      if (data.inviteUrl && !data.emailSent) {
        setInvitationState({ 
          email: '', 
          status: 'success',
          inviteUrl: data.inviteUrl,
          errorMessage: data.warning || 'Email not sent - sharing link instead'
        })
      } else {
        setInvitationState({ email: '', status: 'success' })
      }

      addToast({
        type: 'success',
        title: 'Invite sent',
        message: `Invitation sent to ${invitationState.email}`,
      })

      // Refresh family status
      const statusRes = await fetch('/api/family/status')
      if (statusRes.ok) {
        setFamilyStatus(await statusRes.json())
      }

      // Reset form after success
      setTimeout(() => {
        setShowInviteForm(false)
        setInvitationState({ email: '', status: 'idle' })
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setInvitationState((prev) => ({ ...prev, status: 'error', errorMessage }))
      addToast({
        type: 'error',
        title: 'Error sending invite',
        message: errorMessage,
      })
    }
  }

  const handleCancelInvite = (inviteId: string, invitedEmail: string) => {
    setInviteToCancel({ id: inviteId, email: invitedEmail })
  }

  const handleConfirmCancelInvite = async () => {
    if (!inviteToCancel) return

    setIsCancellingInvite(true)

    try {
      const res = await fetch(`/api/family/invites/${encodeURIComponent(inviteToCancel.id)}/cancel`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel invite')
      }

      addToast({
        type: 'success',
        title: 'Invite cancelled',
        message: 'The old invite link will no longer work.',
      })

      setInviteToCancel(null)

      // Refresh family status
      const statusRes = await fetch('/api/family/status', { cache: 'no-store' })
      if (statusRes.ok) {
        setFamilyStatus(await statusRes.json())
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      addToast({
        type: 'error',
        title: 'Error cancelling invite',
        message: 'We could not cancel this invite. Please try again.',
      })
    } finally {
      setIsCancellingInvite(false)
    }
  }

  const handleResendInvite = async (inviteId: string, invitedEmail: string) => {
    setResendingInviteId(inviteId)

    try {
      const res = await fetch(`/api/family/invites/${encodeURIComponent(inviteId)}/resend`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invite')
      }

      if (data.emailSent) {
        addToast({
          type: 'success',
          title: 'Invite resent',
          message: `Invite resent to ${invitedEmail}.`,
        })
      } else if (data.inviteUrl) {
        addToast({
          type: 'info',
          title: 'QA invite link ready',
          message: 'Email is not configured in Preview. Copy the QA invite link below.',
        })
      }

      // Refresh family status
      const statusRes = await fetch('/api/family/status', { cache: 'no-store' })
      if (statusRes.ok) {
        setFamilyStatus(await statusRes.json())
      }

      // Store resend URL for UI display if needed
      if (data.inviteUrl && !data.emailSent) {
        // Find the invite and update local state with URL
        setFamilyStatus((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            invites: prev.invites.map((inv) =>
              inv.id === inviteId ? { ...inv, _qaInviteUrl: data.inviteUrl } : inv
            ),
          }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      addToast({
        type: 'error',
        title: 'Error resending invite',
        message: errorMessage,
      })
    } finally {
      setResendingInviteId(null)
    }
  }

  const handleAcceptDirectInvite = async () => {
    if (!familyStatus?.pendingInvite) return

    setIsAcceptingDirectInvite(true)

    try {
      const res = await fetch('/api/family/invites/accept-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: familyStatus.pendingInvite.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }

      addToast({
        type: 'success',
        title: 'Invite accepted',
        message: 'You&apos;ve been added to the Renewly Family plan.',
      })

      // Redirect to dashboard to show family status
      setTimeout(() => {
        window.location.href = '/app/dashboard'
      }, 500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      addToast({
        type: 'error',
        title: 'Error accepting invite',
        message: errorMessage,
      })
    } finally {
      setIsAcceptingDirectInvite(false)
    }
  }

  // Safe array access
  const members = Array.isArray(familyStatus?.members) ? familyStatus.members : []
  const invites = Array.isArray(familyStatus?.invites) ? familyStatus.invites : []
  const pendingInvites = invites.filter((invite) => invite.status === 'pending')
  const maxMembers = familyStatus?.maxMembers ?? 4
  const currentMemberCount = familyStatus?.currentMemberCount ?? members.length
  const availableSeats = familyStatus?.availableSeats ?? Math.max(0, maxMembers - currentMemberCount - pendingInvites.length)

  // Page state detection
  const isOwner = familyStatus?.isFamilyOwner === true
  const isMember = familyStatus?.membership != null && !isOwner
  const isPendingInvited = familyStatus?.pendingInvite != null && !isOwner && !isMember
  const isNonFamilyUser = !isOwner && !isMember && !isPendingInvited

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header title="Family Members" icon={Users} subtitle="Manage members and invitations" />

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : isNonFamilyUser ? (
            // E: Free/Pro user - show upgrade message
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Family Plan Required</p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    Family Members is only available for Renewly Family subscribers. Upgrade your plan to invite members and manage shared access.
                  </p>
                  <a
                    href="/app/upgrade?plan=family"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    View Family Plan
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : isPendingInvited ? (
            // C: Pending invited user
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6"
            >
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">You&apos;ve Been Invited to Renewly Family</h2>
                  
                  {familyStatus?.pendingInvite && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2 text-sm">
                        <p className="text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Email:</span> {familyStatus.pendingInvite.invitedEmail}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Expires:</span> {new Date(familyStatus.pendingInvite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Accept Invite Button */}
                      <button
                        onClick={handleAcceptDirectInvite}
                        disabled={isAcceptingDirectInvite}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAcceptingDirectInvite ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Accept Invite
                          </>
                        )}
                      </button>

                      {/* Email link fallback */}
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                        Or check your email for the invite link
                      </p>
                    </div>
                  )}

                  {!familyStatus?.pendingInvite && (
                    <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                      Check your email for an invitation link to accept this Family group invitation.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : isMember ? (
            // D: Family member - show read-only membership
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
            >
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">You&apos;re Part of a Renewly Family</h2>
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                    You are a member of an existing Family group. Contact the family owner to manage group settings.
                  </p>
                  {familyStatus?.membership && (
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="text-emerald-700 dark:text-emerald-300">
                        <span className="font-medium">Role:</span> Member
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-300">
                        <span className="font-medium">Seat Type:</span> {familyStatus.membership.seatType === 'included' ? 'Included' : 'Extra'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : isOwner ? (
            // B: Family owner - show full management UI
            <div className="space-y-8">
              {/* Family Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">Your Family Plan</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentMemberCount} of {maxMembers} members
                    </p>
                  </div>
                  {availableSeats > 0 && (
                    <button
                      onClick={() => setShowInviteForm(!showInviteForm)}
                      className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Invite Member
                    </button>
                  )}
                </div>

                {/* Invite Form */}
                <AnimatePresence>
                  {showInviteForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleSendInvite}
                      className="mb-6 space-y-3 pt-6 border-t border-border"
                    >
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={invitationState.email}
                          onChange={(e) => setInvitationState((prev) => ({ ...prev, email: e.target.value }))}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
                          disabled={invitationState.status === 'sending'}
                        />
                        <button
                          type="submit"
                          disabled={invitationState.status === 'sending'}
                          className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-obsidian font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {invitationState.status === 'sending' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : invitationState.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          {invitationState.status === 'sending' ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                      {invitationState.errorMessage && (
                        <p className="text-sm text-red-600 dark:text-red-400">{invitationState.errorMessage}</p>
                      )}
                      {invitationState.inviteUrl && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">QA Invite Link (copy and share):</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={invitationState.inviteUrl}
                              readOnly
                              className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(invitationState.inviteUrl)
                                addToast({
                                  type: 'success',
                                  title: 'Copied',
                                  message: 'Invite link copied to clipboard',
                                })
                              }}
                              className="flex items-center gap-2 rounded-lg bg-gold/20 px-3 py-2 text-obsidian font-medium hover:bg-gold/30 transition-colors cursor-pointer text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Capacity Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seats Used</span>
                    <span className="font-medium text-foreground">{currentMemberCount + pendingInvites.length} / {maxMembers}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentMemberCount + pendingInvites.length) / maxMembers) * 100}%` }}
                      className="h-full bg-gold"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Current Members */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-foreground">Active Members</h3>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
                            <Users className="h-4 w-4 text-gold" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">Member</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Pending Invitations */}
              {pendingInvites.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-foreground">Pending Invitations</h3>
                  <div className="space-y-3">
                    {pendingInvites.map((invite) => {
                      const inviteId = getInviteId(invite)
                      const hasValidId = Boolean(inviteId && inviteId !== 'undefined' && inviteId !== 'null')
                      
                      return (
                        <div key={inviteId || invite.invitedEmail}>
                          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <div>
                                <p className="font-medium text-foreground">{invite.invitedEmail}</p>
                                <p className="text-xs text-muted-foreground">
                                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResendInvite(inviteId, invite.invitedEmail)}
                                disabled={!hasValidId || resendingInviteId === inviteId}
                                className="text-sm px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                              >
                                {resendingInviteId === inviteId ? 'Resending...' : 'Resend'}
                              </button>
                              <button
                                onClick={() => handleCancelInvite(inviteId, invite.invitedEmail)}
                                disabled={!hasValidId}
                                className="text-sm px-3 py-1.5 rounded-lg bg-red-500/20 text-red-700 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          {!hasValidId && (
                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                              Invite ID missing. Refresh the page and try again.
                            </p>
                          )}
                          {/* QA Invite URL (if present) */}
                          {invite._qaInviteUrl && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2"
                            >
                              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                Email is not configured in Preview. Copy this QA invite link and send it manually.
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={invite._qaInviteUrl}
                                  readOnly
                                  className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(invite._qaInviteUrl)
                                    addToast({
                                      type: 'success',
                                      title: 'Copied',
                                      message: 'Invite link copied to clipboard',
                                    })
                                  }}
                                  className="flex items-center gap-2 rounded-lg bg-gold/20 px-3 py-2 text-obsidian font-medium hover:bg-gold/30 transition-colors cursor-pointer text-sm"
                                >
                                  Copy
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Cancel Invite Confirmation Modal */}
      <AnimatePresence mode="wait">
        {inviteToCancel !== null && (
          <>
            {/* Darker backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancellingInvite && setInviteToCancel(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />

            {/* Modal container */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 18, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none"
            >
              <motion.div
                className="relative rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl pointer-events-auto max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">Cancel pending invite?</h2>
                  {!isCancellingInvite && (
                    <button
                      onClick={() => setInviteToCancel(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Close dialog"
                    >
                      <X className="w-5 h-5 text-slate-300" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300">
                      This will cancel the invite for:
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {inviteToCancel?.email}
                    </p>
                  </div>

                  <p className="text-sm text-slate-300">
                    The old invite link will stop working immediately. You can send a new invite later.
                  </p>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setInviteToCancel(null)}
                      disabled={isCancellingInvite}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Keep Invite
                    </button>
                    <button
                      onClick={handleConfirmCancelInvite}
                      disabled={isCancellingInvite}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCancellingInvite ? 'Cancelling...' : 'Cancel Invite'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
