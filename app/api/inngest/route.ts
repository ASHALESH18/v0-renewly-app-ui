import { NextRequest, NextResponse } from 'next/server'
import { isInngestAvailable } from '@/lib/inngest/client'

// Only serve Inngest routes if Inngest is configured
async function serveInngest(req: NextRequest) {
  // Attempt to import serve only if Inngest is available
  // This prevents build errors if Inngest initialization fails
  if (!isInngestAvailable()) {
    console.log('[Inngest] Inngest not configured - API is disabled')
    return NextResponse.json(
      { error: 'Inngest not configured', ok: false },
      { status: 503 }
    )
  }

  try {
    // Dynamically import only if available
    const { serve } = await import('inngest/next')
    const { inngest } = await import('@/lib/inngest/client')
    const inngestModule = await import('@/lib/inngest/functions')
    const functions = Object.values(inngestModule).filter(
      (v) => v && typeof v === 'function' && v.name
    )

    const handler = serve({
      client: inngest as any,
      functions: functions as any,
    })

    // Forward to the appropriate handler
    const method = req.method as keyof typeof handler
    if (method in handler && typeof handler[method] === 'function') {
      return (handler as any)[method](req)
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (error) {
    console.error('[Inngest] Failed to serve:', error)
    return NextResponse.json(
      { error: 'Failed to serve Inngest', ok: false },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return serveInngest(req)
}

export async function POST(req: NextRequest) {
  return serveInngest(req)
}

export async function PUT(req: NextRequest) {
  return serveInngest(req)
}

