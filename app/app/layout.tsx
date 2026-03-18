import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated
  const user = await getUser()

  if (!user) {
    // User is not authenticated - redirect to sign-in
    // The middleware will catch this earlier, but this is a safety check
    redirect('/auth/sign-in?next=/app')
  }

  // User is authenticated - render the app
  return <>{children}</>
}

