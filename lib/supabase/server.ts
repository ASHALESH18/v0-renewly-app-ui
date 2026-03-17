import { cookies } from 'next/headers'

// Lightweight server-side auth without external dependencies
export async function createClient() {
  const cookieStore = await cookies()
  
  return {
    auth: {
      getUser: async () => {
        try {
          const token = cookieStore.get('sb-auth-token')
          if (token?.value) {
            const data = JSON.parse(Buffer.from(token.value, 'base64').toString())
            if (data.exp && data.exp > Date.now()) {
              return { data: { user: { email: data.email } }, error: null }
            }
          }
        } catch (err) {
          // Invalid token
        }
        return { data: { user: null }, error: null }
      },
      getSession: async () => {
        return { data: { session: null }, error: null }
      },
    },
  }
}

export async function getUser() {
  const client = await createClient()
  const result = await client.auth.getUser()
  return result.data?.user || null
}

export async function getSession() {
  const client = await createClient()
  const result = await client.auth.getSession()
  return result.data?.session || null
}

