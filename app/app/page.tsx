import { redirect } from 'next/navigation'

// Redirect /app to /app/dashboard
export default function AppIndexPage() {
  redirect('/app/dashboard')
}
