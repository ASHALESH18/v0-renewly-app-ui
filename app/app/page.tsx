'use client'

import { redirect } from 'next/navigation'

export default function AppRoot() {
  // Redirect to dashboard as the default section
  redirect('/app/dashboard')
}
