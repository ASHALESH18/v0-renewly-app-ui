'use client'

/**
 * Route-level error boundary for /app/integrations.
 *
 * Catches any uncaught render error from the Integrations screen so the route
 * never white-screens with "Application error: a client-side exception has
 * occurred". Shows a clean recovery UI and, in development, the error message
 * to help diagnose issues quickly.
 */

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Header } from '@/components/header'

export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log once so the crash is visible in logs even if the UI recovers.
    console.error('[v0] /app/integrations crashed:', error)
  }, [error])

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <>
      <Header title="Integrations" />

      <div className="px-4 lg:px-6 pb-8">
        <div className="mx-auto max-w-xl mt-8 rounded-2xl bg-card border border-border p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-crimson/10 border border-crimson/30">
              <AlertTriangle className="w-6 h-6 text-crimson" aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground">
                Something went wrong loading integrations
              </h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                We hit an unexpected error while rendering this page. Your data is safe &mdash;
                try reloading, or come back in a moment.
              </p>

              {isDev && error?.message && (
                <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted/60 border border-border p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                  {error.message}
                  {error.digest ? `\n\nDigest: ${error.digest}` : ''}
                </pre>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gold text-obsidian hover:bg-gold/90 transition-all"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Try again
                </button>
                <a
                  href="/app/dashboard"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                >
                  Back to dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
