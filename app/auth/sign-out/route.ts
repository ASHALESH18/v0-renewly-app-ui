import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  // Redirect to homepage after sign out
  const redirectUrl = new URL('/', request.url)
  return NextResponse.redirect(redirectUrl, { status: 302 })
}
