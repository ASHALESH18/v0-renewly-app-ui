'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Mail, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Play,
  Sparkles,
  Calendar,
  Users,
  Globe,
  Shield,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

const springs = {
  gentle: { type: 'spring', stiffness: 100, damping: 20 }
}

// Latest updates - truthful product milestones
const latestUpdates = [
  {
    date: 'March 2026',
    title: 'Renewly 1.0 Public Launch',
    description: 'Official launch of the Renewly subscription management platform with premium Obsidian Reserve design, multi-currency support, and Leak Report feature.',
    tag: 'Launch'
  },
  {
    date: 'March 2026',
    title: 'Family & Enterprise Plans Available',
    description: 'Introduction of Family plan with household sharing for up to 4 members, and Enterprise tier with dedicated support and team management.',
    tag: 'Plans'
  },
  {
    date: 'March 2026',
    title: 'Multi-Currency Support',
    description: 'Support for INR, USD, EUR, GBP and additional currencies with automatic conversion and localized formatting.',
    tag: 'Feature'
  },
]

// Key facts - only truthful, verifiable information
const keyFacts = [
  { label: 'Product', value: 'Subscription Intelligence Platform' },
  { label: 'Founded', value: '2026' },
  { label: 'Plans', value: 'Free, Pro, Family, Enterprise' },
  { label: 'Currencies', value: 'INR, USD, EUR, GBP +' },
]

// Media resources
const mediaResources = [
  {
    icon: Sparkles,
    title: 'Logo & Brand Assets',
    description: 'Official logos, wordmarks, and brand guidelines',
    action: 'Request Assets',
    href: 'mailto:press@renewly.app?subject=Brand%20Assets%20Request'
  },
  {
    icon: FileText,
    title: 'Fact Sheet',
    description: 'Company overview and key product facts',
    action: 'Request PDF',
    href: 'mailto:press@renewly.app?subject=Fact%20Sheet%20Request'
  },
  {
    icon: ImageIcon,
    title: 'Product Screenshots',
    description: 'High-resolution product images and UI shots',
    action: 'Request Gallery',
    href: 'mailto:press@renewly.app?subject=Screenshot%20Request'
  },
  {
    icon: Play,
    title: 'Product Demo',
    description: 'Video walkthrough and product demonstrations',
    action: 'Request Demo',
    href: '/request-demo'
  },
]

// Media FAQ
const mediaFAQ = [
  {
    question: 'What is Renewly?',
    answer: 'Renewly is a premium subscription management platform that helps consumers track, understand, and optimize their recurring payments. With intelligent renewal tracking, leak detection, and spend analytics, Renewly helps users take control of their subscriptions.'
  },
  {
    question: 'Who is Renewly for?',
    answer: 'Renewly is designed for individuals and families who want to understand and manage their subscription spending. Our plans range from a free tier for basic tracking to Enterprise solutions for teams and organizations.'
  },
  {
    question: 'How does the Family plan work?',
    answer: 'The Family plan includes up to 4 members with shared renewal tracking, unified reminders, and household visibility. Additional members can be added for +₹99/member/month beyond the first 4.'
  },
  {
    question: 'How can I request a product demo?',
    answer: 'You can request a personalized demo by visiting our Request Demo page or contacting our press team directly at press@renewly.app.'
  },
  {
    question: 'How can media request assets?',
    answer: 'All media asset requests including logos, screenshots, and fact sheets can be submitted to press@renewly.app. Our team typically responds within 24-48 hours.'
  },
]

function FAQItem({ 
  question, 
  answer, 
  isOpen, 
  onToggle 
}: { 
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-glass-border rounded-xl overflow-hidden bg-slate/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate/40 transition-colors group"
      >
        <span className="font-medium text-ivory pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-platinum group-hover:text-gold transition-colors" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 text-platinum leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </div>
  )
}

export default function PressPage() {
  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true })
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Navigation */}
      <div className="px-4 py-4 border-b border-glass-border bg-obsidian/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-platinum hover:text-ivory transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <a 
            href="mailto:press@renewly.app"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-colors text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            Contact Press Team
          </a>
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="py-20 lg:py-28 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald/5 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={springs.gentle}
            className="text-center"
          >
            <p className="text-gold text-sm font-medium tracking-wide uppercase mb-4">
              Press & Media
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-ivory tracking-tight mb-6">
              Newsroom
            </h1>
            <p className="text-lg md:text-xl text-platinum max-w-2xl mx-auto leading-relaxed">
              Media resources, brand assets, official company information, and press contact for Renewly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Contact Card */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
            className="bg-gradient-to-br from-slate/50 via-graphite to-slate/50 border border-gold/20 rounded-2xl p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-ivory mb-2">Press Inquiries</h2>
                <p className="text-platinum">
                  For media questions, interview requests, and press inquiries
                </p>
              </div>
              <a 
                href="mailto:press@renewly.app"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors cursor-pointer"
              >
                <Mail className="w-5 h-5" />
                press@renewly.app
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Boilerplate */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
          >
            <h2 className="text-2xl font-semibold text-ivory mb-6">About Renewly</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-platinum leading-relaxed text-lg mb-4">
                Renewly is a premium subscription management platform designed to help consumers take control of their recurring payments. With intelligent tracking, spend analytics, and our signature Leak Report feature, Renewly helps users understand, optimize, and manage their subscriptions with elegance and clarity.
              </p>
              <p className="text-platinum leading-relaxed">
                Founded in 2026, Renewly is built on the principle that understanding your spending should be simple, secure, and beautiful. Our platform supports multiple currencies, offers tiered plans from individual use to enterprise teams, and maintains a privacy-first approach to financial data management.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Facts */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
          >
            <h2 className="text-2xl font-semibold text-ivory mb-8">Key Facts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keyFacts.map((fact, index) => (
                <motion.div
                  key={fact.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, ...springs.gentle }}
                  className="bg-slate/30 border border-glass-border rounded-xl p-5"
                >
                  <p className="text-platinum text-sm mb-1">{fact.label}</p>
                  <p className="text-ivory font-semibold">{fact.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
          >
            <h2 className="text-2xl font-semibold text-ivory mb-8">Core Capabilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'Renewal Tracking', desc: 'Smart calendar and reminders' },
                { icon: Sparkles, label: 'Leak Report', desc: 'Identify unused subscriptions' },
                { icon: Globe, label: 'Multi-Currency', desc: 'Global currency support' },
                { icon: Shield, label: 'Privacy-First', desc: 'Secure data management' },
              ].map((cap, index) => (
                <motion.div
                  key={cap.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, ...springs.gentle }}
                  className="bg-slate/30 border border-glass-border rounded-xl p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <cap.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-ivory font-medium mb-1">{cap.label}</p>
                    <p className="text-platinum text-sm">{cap.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Media Resources */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
          >
            <h2 className="text-2xl font-semibold text-ivory mb-8">Brand & Media Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {mediaResources.map((resource, index) => (
                <motion.a
                  key={resource.title}
                  href={resource.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, ...springs.gentle }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(199, 163, 106, 0.1)' }}
                  className="bg-slate/30 border border-glass-border rounded-xl p-6 flex items-start gap-4 group cursor-pointer transition-colors hover:border-gold/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                    <resource.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-ivory font-semibold mb-1 group-hover:text-gold transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-platinum text-sm mb-3">{resource.description}</p>
                    <span className="inline-flex items-center gap-1 text-gold text-sm font-medium">
                      {resource.action}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Updates */}
      <section id="latest-updates" className="px-4 pb-20 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
          >
            <h2 className="text-2xl font-semibold text-ivory mb-8">Latest Updates</h2>
            <div className="space-y-4">
              {latestUpdates.map((update, index) => (
                <motion.div
                  key={update.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, ...springs.gentle }}
                  className="bg-slate/30 border border-glass-border rounded-xl p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gold/15 text-gold text-xs font-semibold rounded-full">
                        {update.tag}
                      </span>
                      <span className="text-platinum text-sm">{update.date}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-ivory mb-2">{update.title}</h3>
                  <p className="text-platinum leading-relaxed">{update.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Media FAQ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
          >
            <h2 className="text-2xl font-semibold text-ivory mb-8">Media FAQ</h2>
            <div className="space-y-3">
              {mediaFAQ.map((item, index) => (
                <FAQItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openFAQIndex === index}
                  onToggle={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springs.gentle}
            className="bg-gradient-to-br from-gold/10 via-graphite to-gold/5 border border-gold/20 rounded-2xl p-10 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-4">
              Need assets or a briefing?
            </h2>
            <p className="text-platinum mb-8 max-w-xl mx-auto">
              Our press team is available for media inquiries, interview requests, and asset access.
            </p>
            <a 
              href="mailto:press@renewly.app"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5" />
              Contact the Press Team
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-platinum">
          <p>© 2026 Renewly. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gold transition-colors">Terms</Link>
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
