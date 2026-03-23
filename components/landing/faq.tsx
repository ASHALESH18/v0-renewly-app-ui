'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from '../motion'
import { useFAQItems } from '@/lib/hooks/use-remote-data'

export function FAQ() {
  const router = useRouter()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const { faqItems, isLoading } = useFAQItems()

  const handleContactSupport = () => {
    router.push('/contact')
  }

  return (
    <section ref={ref} className="py-24 lg:py-32 px-4 bg-obsidian relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={springs.gentle}
          className="text-center mb-12"
        >
          <p className="text-gold text-sm font-medium tracking-wide uppercase mb-4">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-ivory tracking-tight">
            Questions? Answers.
          </h2>
        </motion.div>

        {/* FAQ items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, ...springs.gentle }}
          className="space-y-3"
        >
          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, ...springs.gentle }}
          className="mt-12 text-center"
        >
          <p className="text-platinum mb-4">
            Still have questions?
          </p>
          <motion.button
            onClick={handleContactSupport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            aria-label="Go to contact support page"
            className="px-6 py-3 rounded-xl border border-gold/30 text-gold font-medium hover:bg-gold/10 transition-colors cursor-pointer"
          >
            Contact support
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}

function FAQItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...springs.gentle }}
      className="rounded-xl bg-graphite border border-glass-border overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-medium text-ivory pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springs.snappy}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-platinum" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.gentle}
          >
            <div className="px-5 pb-5">
              <p className="text-platinum text-sm leading-relaxed">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
