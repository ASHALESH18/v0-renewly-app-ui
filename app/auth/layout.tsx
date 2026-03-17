import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // User is already authenticated - redirect them to the app
    redirect('/app')
  }

  // User is not authenticated - allow them to see auth pages
  return <>{children}</>
}
