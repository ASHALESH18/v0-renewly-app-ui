'use client'

// Browser-side auth client - uses direct Supabase REST API calls
// No external dependencies required

let authClient: any = null

export function createClient() {
  if (!authClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    authClient = {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          try {
            if (!email || !password) {
              return { data: null, error: { message: 'Email and password required' } }
            }

            const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
              },
              body: JSON.stringify({ email, password }),
            })

            if (response.ok) {
              const { access_token, user } = await response.json()
              // Store token in cookie for server-side access
              const session = { email: user.email, token: access_token, exp: Date.now() + 3600000 }
              document.cookie = `sb-auth-token=${Buffer.from(JSON.stringify(session)).toString('base64')}; path=/; max-age=3600`
              return { data: { user }, error: null }
            }

            const error = await response.json()
            return { data: null, error: { message: error.error_description || 'Invalid credentials' } }
          } catch (err) {
            return { data: null, error: { message: 'Sign in failed' } }
          }
        },

        signUp: async ({ email, password, options }: any) => {
          try {
            if (!email || !password) {
              return { data: null, error: { message: 'Email and password required' } }
            }

            const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
              },
              body: JSON.stringify({ 
                email, 
                password,
                data: options?.data || {},
              }),
            })

            if (response.ok) {
              const { user, session } = await response.json()
              // Store token in cookie if session exists
              if (session?.access_token) {
                const sessionData = { email: user.email, token: session.access_token, exp: Date.now() + 3600000 }
                document.cookie = `sb-auth-token=${Buffer.from(JSON.stringify(sessionData)).toString('base64')}; path=/; max-age=3600`
              }
              return { data: { user }, error: null }
            }

            const error = await response.json()
            return { data: null, error: { message: error.error_description || 'Sign up failed' } }
          } catch (err) {
            return { data: null, error: { message: 'Sign up failed' } }
          }
        },

        signOut: async () => {
          document.cookie = 'sb-auth-token=; path=/; max-age=0'
          return { error: null }
        },

        resetPasswordForEmail: async (email: string, options: any) => {
          try {
            await fetch(`${supabaseUrl}/auth/v1/recover`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
              },
              body: JSON.stringify({ email }),
            })
            return { error: null }
          } catch {
            return { error: { message: 'Failed to send reset email' } }
          }
        },

        resend: async (options: any) => {
          return { error: null }
        },

        updateUser: async (updates: any) => {
          return { data: { user: {} }, error: null }
        },

        getUser: async () => {
          if (typeof document === 'undefined') {
            return { data: { user: null }, error: null }
          }
          try {
            const cookies = document.cookie.split('; ')
            const authCookie = cookies.find(row => row.startsWith('sb-auth-token='))
            if (authCookie) {
              const token = authCookie.split('=')[1]
              const data = JSON.parse(Buffer.from(token, 'base64').toString())
              if (data.exp && data.exp > Date.now()) {
                return { data: { user: { email: data.email } }, error: null }
              }
            }
          } catch (err) {
            // Invalid cookie
          }
          return { data: { user: null }, error: null }
        },
      },
    }
  }

  return authClient
}



