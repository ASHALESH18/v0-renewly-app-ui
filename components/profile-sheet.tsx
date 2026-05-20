'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, User, Globe, DollarSign, RefreshCw } from 'lucide-react'
import useStore from '@/lib/store'
import { generateAvatar } from '@/lib/avatar-utils'
import { countries, currencies, getCountryName, getCurrencyName } from '@/lib/locale-utils'
import { cn } from '@/lib/utils'

interface ProfileSheetProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (profile: any) => Promise<void>
}

export function ProfileSheet({ isOpen, onClose, onSave }: ProfileSheetProps) {
  const userProfile = useStore((state) => state.userProfile)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    countryCode: userProfile?.countryCode || 'IN',
    currencyCode: userProfile?.notificationSettings?.currencyCode || 'INR',
  })

  const avatarUrl = useMemo(() => {
    if (!userProfile) return null
    const seed = userProfile.avatarSeed || userProfile.email || 'default'
    return generateAvatar({ seed, size: 256 })
  }, [userProfile?.email, userProfile?.avatarSeed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSave) return

    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        name: formData.name,
        countryCode: formData.countryCode,
        currencyCode: formData.currencyCode,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t border-border p-6"
      >
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Edit Profile</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview */}
            {avatarUrl && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Your avatar"
                  className="w-20 h-20 rounded-2xl border border-gold/20"
                />
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gold hover:bg-gold/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Avatar
                </button>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Country / Region
              </label>
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Preferred Currency
              </label>
              <select
                value={formData.currencyCode}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Error message */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                  isLoading
                    ? 'bg-gold/50 text-obsidian cursor-not-allowed'
                    : 'bg-gold text-obsidian hover:bg-gold/90'
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-obsidian/30 border-t-obsidian animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}
