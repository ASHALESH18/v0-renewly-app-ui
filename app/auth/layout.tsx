import { getUser } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // If user is authenticated, they will be redirected by middleware
  // This layout just needs to render the auth pages for unauthenticated users
  return <>{children}</>
}

