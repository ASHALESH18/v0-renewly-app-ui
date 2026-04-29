'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Mail, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'
import type { FamilyMemberRow, FamilyInviteRow } from '@/lib/supabase/database.types'

interface FamilyStatus {
  familyGroupId: string
  plan: string
  members: FamilyMemberRow[]
  invites: FamilyInviteRow[]
  maxMembers: number
  currentMemberCount: number
  availableSeats: number
}

interface InvitationState {
  email: string
  status: 'idle' | 'sending' | 'success' | 'error'
  errorMessage?: string
}

export function FamilyMembersScreen() {
  const userProfile = useStore((state) => state.userProfile)
  const addToast = useStore((state) => state.addToast)
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [invitationState, setInvitationState] = useState<InvitationState>({ email: '', status: 'idle' })

  // Fetch family status
  useEffect(() => {
    const fetchFamilyStatus = async () => {
      try {
        const res = await fetch('/api/family/status')
        if (!res.ok) {
          if (res.status === 403) {
            // User is not on Family plan
            addToast({
              type: 'info',
              title: 'Not on Family Plan',
              message: 'Family Members is only available for Renewly Family subscribers.',
            })
            setIsLoading(false)
            return
          }
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

      setInvitationState({ email: '', status: 'success' })
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header title="Family Members" icon={Users} subtitle="Manage members and invitations" />

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : !familyStatus ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Family Plan Required</p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    Family Members is only available for Renewly Family subscribers. Upgrade your plan to invite members and manage shared access.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
                      {familyStatus.currentMemberCount} of {familyStatus.maxMembers} members
                    </p>
                  </div>
                  {familyStatus.availableSeats > 0 && (
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
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Capacity Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seats Used</span>
                    <span className="font-medium text-foreground">{familyStatus.currentMemberCount + familyStatus.invites.filter(i => i.status === 'pending').length} / {familyStatus.maxMembers}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((familyStatus.currentMemberCount + familyStatus.invites.filter(i => i.status === 'pending').length) / familyStatus.maxMembers) * 100}%` }}
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
                {familyStatus.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {familyStatus.members.map((member) => (
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
              {familyStatus.invites.filter(i => i.status === 'pending').length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-foreground">Pending Invitations</h3>
                  <div className="space-y-2">
                    {familyStatus.invites
                      .filter(i => i.status === 'pending')
                      .map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <div>
                              <p className="font-medium text-foreground">{invite.invited_email}</p>
                              <p className="text-xs text-muted-foreground">
                                Expires {new Date(invite.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
