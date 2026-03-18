'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Phone, ArrowLeft, MapPin, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { springs } from '@/components/motion'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Get in Touch"
        subtitle="We're here to help. Reach out to our team anytime."
      />

      <main className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
        {/* Breadcrumb */}
        <Link href="/">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </motion.div>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="space-y-6"
          >
            {/* Email */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-ivory mb-1">Email</h3>
                  <a href="mailto:support@renewly.io" className="text-platinum hover:text-gold transition-colors">
                    support@renewly.io
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-ivory mb-1">Phone</h3>
                  <a href="tel:+918000000000" className="text-platinum hover:text-gold transition-colors">
                    +91 800 000 0000
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    Mon-Fri, 9 AM - 6 PM IST
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-ivory mb-1">Headquarters</h3>
                  <p className="text-platinum">
                    Bangalore, India
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Serving customers globally
                  </p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-ivory mb-1">Support Hours</h3>
                  <ul className="text-sm text-platinum space-y-1">
                    <li>Monday - Friday: 9 AM - 6 PM IST</li>
                    <li>Saturday: 10 AM - 4 PM IST</li>
                    <li>Sunday: Closed</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Links & FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Support Paths */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <h2 className="text-xl font-semibold text-ivory mb-4">How can we help?</h2>
              <div className="space-y-3">
                <Link href="/help">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl border border-glass-border text-left px-4 text-platinum font-medium hover:bg-glass hover:text-gold transition-colors flex items-center justify-between group"
                  >
                    <span>Help Center & FAQ</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
                  </motion.button>
                </Link>

                <Link href="/contact-sales">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl border border-glass-border text-left px-4 text-platinum font-medium hover:bg-glass hover:text-gold transition-colors flex items-center justify-between group"
                  >
                    <span>Sales Inquiry</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
                  </motion.button>
                </Link>

                <Link href="/request-demo">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl border border-glass-border text-left px-4 text-platinum font-medium hover:bg-glass hover:text-gold transition-colors flex items-center justify-between group"
                  >
                    <span>Request Demo</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
                  </motion.button>
                </Link>

                <Link href="/app">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl border border-glass-border text-left px-4 text-platinum font-medium hover:bg-glass hover:text-gold transition-colors flex items-center justify-between group"
                  >
                    <span>Contact Support</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Response Time */}
            <div className="rounded-2xl bg-gold/10 border border-gold/30 p-6">
              <h3 className="font-semibold text-ivory mb-2">Average Response Time</h3>
              <p className="text-sm text-platinum">
                Email: Within 24 hours
              </p>
              <p className="text-sm text-platinum">
                Phone: Immediate (during business hours)
              </p>
              <p className="text-sm text-platinum">
                Live Chat: Coming soon
              </p>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <h3 className="font-semibold text-ivory mb-3">Enterprise Support</h3>
              <p className="text-sm text-platinum mb-4">
                Need dedicated support? Our enterprise team provides priority assistance, SLA guarantees, and personalized service.
              </p>
              <Link href="/contact-sales">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 rounded-lg gold-gradient text-obsidian font-semibold transition-all"
                >
                  Contact Enterprise Sales
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
