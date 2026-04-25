'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import useStore from '@/lib/store'
import { useAuth } from '@/lib/hooks/use-auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function ProfileAvatar() {
  const userProfile = useStore((state) => state.userProfile)
  const storeEmail = useStore((state) => state.currentUserEmail)
  
  // Also check live Supabase auth session for avatar fallback
  const { user: authUser, loading: authLoading } = useAuth()

  // Use store email if available, fall back to auth session
  const email = storeEmail || authUser?.email

  // Priority for avatar source:
  // 1. userProfile.avatarUrl (from store)
  // 2. Supabase auth user_metadata.avatar_url or picture
  // 3. Initials fallback
  const avatarUrl = useMemo(() => {
    if (userProfile?.avatarUrl) return userProfile.avatarUrl
    
    if (authUser?.user_metadata?.avatar_url) return authUser.user_metadata.avatar_url
    if (authUser?.user_metadata?.picture) return authUser.user_metadata.picture
    
    return null
  }, [userProfile?.avatarUrl, authUser?.user_metadata])

  const initials = useMemo(() => {
    const name = userProfile?.name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0]
    if (!name) return 'U'
    
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [userProfile?.name, authUser?.user_metadata, authUser?.email])

  // Show avatar if either store has profile OR auth session exists
  const shouldShow = (storeEmail && userProfile) || (authUser && !authLoading)

  if (!shouldShow) return null

  return (
    <Link href="/app/dashboard">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        <Avatar className="size-9 border border-gold/20 shadow-sm hover:border-gold/40 transition-colors">
          {avatarUrl && (
            <AvatarImage
              src={avatarUrl}
              alt={userProfile?.name || email}
              crossOrigin="anonymous"
            />
          )}
          <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-gold/20 to-gold/10 text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </motion.div>
    </Link>
  )
}
