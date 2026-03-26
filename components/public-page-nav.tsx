'use client'

import Link from 'next/link'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'

export function PublicPageNav() {
  const { user, loading } = useAuth()

  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {loading ? (
          <div className="w-28 h-10 rounded-xl bg-white/5 animate-pulse" />
        ) : user ? (
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:border-gold/45 hover:bg-gold/15 hover:text-foreground transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}