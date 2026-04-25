'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import useStore from '@/lib/store'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function ProfileAvatar() {
  const userProfile = useStore((state) => state.userProfile)
  const user = useStore((state) => state.currentUserEmail)

  const initials = useMemo(() => {
    if (!userProfile?.name) return 'U'
    
    return userProfile.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [userProfile?.name])

  if (!user || !userProfile) return null

  return (
    <Link href="/app/dashboard">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        <Avatar className="size-9 border border-gold/20 shadow-sm hover:border-gold/40 transition-colors">
          {userProfile.avatarUrl && (
            <AvatarImage
              src={userProfile.avatarUrl}
              alt={userProfile.name}
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
