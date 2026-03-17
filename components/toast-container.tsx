'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import useStore from '@/lib/store'

export function ToastContainer() {
  const toasts = useStore((state) => state.toasts)
  const removeToast = useStore((state) => state.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 100 }}
            className="pointer-events-auto mb-3"
          >
            <div className="glass-strong rounded-xl p-4 flex items-start gap-3 min-w-[300px] shadow-luxury">
              {toast.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-crimson flex-shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
                )}
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
