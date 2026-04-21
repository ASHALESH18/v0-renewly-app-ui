import { Inngest } from 'inngest'

// Safe Inngest client initialization - don't crash if env vars are missing
let inngestInstance: Inngest | null = null
let inngestInitialized = false

function initializeInngest(): Inngest | null {
  if (inngestInitialized) return inngestInstance
  inngestInitialized = true

  try {
    const eventKey = process.env.INNGEST_EVENT_KEY
    const signingKey = process.env.INNGEST_SIGNING_KEY

    if (!eventKey || !signingKey) {
      console.warn('[Inngest] INNGEST_EVENT_KEY or INNGEST_SIGNING_KEY not configured - background jobs disabled')
      return null
    }

    inngestInstance = new Inngest({
      id: 'renewly',
      name: 'Renewly Smart Capture',
      eventKey,
      signingKey,
    })
    console.log('[Inngest] Client initialized successfully')
    return inngestInstance
  } catch (error) {
    console.warn('[Inngest] Failed to initialize:', error)
    return null
  }
}

// Public API for checking Inngest availability
export function isInngestAvailable(): boolean {
  return initializeInngest() !== null
}

// Safe method to send events
export async function sendEvent(event: any) {
  const client = initializeInngest()
  if (!client) {
    console.debug('[Inngest] Event not sent (Inngest unavailable):', event)
    return { ok: false, reason: 'inngest_not_configured' }
  }
  try {
    return await client.send(event)
  } catch (error) {
    console.error('[Inngest] Failed to send event:', error)
    return { ok: false, error }
  }
}

// Export singleton instance - use this in route handlers
export const inngest = new Proxy(
  {
    send: sendEvent,
    createFunction: (config: any, ...args: any[]) => {
      const client = initializeInngest()
      if (!client) {
        console.warn('[Inngest] createFunction called but Inngest is not available')
        return () => Promise.resolve({ ok: false, reason: 'inngest_not_configured' })
      }
      return client.createFunction(config, ...args)
    },
  } as any,
  {
    get(target, prop) {
      const client = initializeInngest()
      if (!client) {
        // Return the proxy's methods if available
        if (prop in target) {
          return target[prop as keyof typeof target]
        }
        console.warn(`[Inngest] Attempted to access ${String(prop)} but Inngest is not available`)
        return undefined
      }
      // Otherwise delegate to real Inngest client
      if (prop in client) {
        return (client as any)[prop]
      }
      return undefined
    },
  }
)

// Event types for type safety
export type Events = {
  'smart-capture/email.received': {
    data: {
      userId: string
      accountId: string
      emailId: string
      from: string
      subject: string
      body: string
      receivedAt: string
      provider: 'gmail' | 'outlook'
    }
  }
  'smart-capture/notification.received': {
    data: {
      userId: string
      title: string
      body: string
      appName: string
      receivedAt: string
      source: 'notification_lab' | 'mobile_app'
    }
  }
  'smart-capture/candidate.process': {
    data: {
      userId: string
      eventId: string
      candidateId: string
    }
  }
  'smart-capture/candidate.confirmed': {
    data: {
      userId: string
      candidateId: string
      subscriptionId: string
    }
  }
  'smart-capture/sync.gmail': {
    data: {
      userId: string
      accountId: string
      fullSync?: boolean
    }
  }
  'smart-capture/sync.outlook': {
    data: {
      userId: string
      accountId: string
      fullSync?: boolean
    }
  }
}

