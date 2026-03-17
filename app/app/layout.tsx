import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // User is not authenticated - redirect to sign-in
    redirect('/auth/sign-in?next=/app')
  }

  // User is authenticated - render the app
  return <>{children}</>
}
