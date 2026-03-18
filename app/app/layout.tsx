import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { AppShellClient } from './app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated (server-side)
  const user = await getUser()

  if (!user) {
    redirect('/auth/sign-in?next=/app/dashboard')
  }

  // User is authenticated - render the app with shell
  return <AppShellClient>{children}</AppShellClient>
}


