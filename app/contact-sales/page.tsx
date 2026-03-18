'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Phone, Linkedin, ArrowLeft, Check, Calendar } from 'lucide-react'
import { Header } from '@/components/header'
import { springs } from '@/components/motion'

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    teamSize: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send to backend/email service
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ firstName: '', lastName: '', email: '', company: '', teamSize: '', message: '' })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Enterprise Sales"
        subtitle="Let's talk about your team's subscription management needs"
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

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="md:col-span-2"
          >
            {submitted ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald/10 border border-emerald/30 rounded-2xl p-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-emerald/20 p-3">
                    <Check className="w-6 h-6 text-emerald" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-ivory mb-2">Thank you!</h3>
                <p className="text-platinum">
                  We've received your message. Our sales team will contact you within 24 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                    placeholder="your@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                    placeholder="Your company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory mb-2">
                    Team Size
                  </label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all appearance-none"
                  >
                    <option value="">Select team size</option>
                    <option value="1-10">1-10 people</option>
                    <option value="11-50">11-50 people</option>
                    <option value="51-100">51-100 people</option>
                    <option value="100+">100+ people</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory mb-2">
                    Tell us about your needs
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
                    placeholder="What challenges are you looking to solve?"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury transition-all"
                >
                  Contact Our Sales Team
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Schedule Demo Card */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-ivory">Schedule a Demo</h3>
              </div>
              <p className="text-sm text-platinum mb-4">
                See Renewly Enterprise in action with a personalized walkthrough.
              </p>
              <Link href="/request-demo">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 rounded-xl border border-gold/50 text-gold font-medium hover:bg-gold/10 transition-colors text-sm"
                >
                  Request Demo
                </motion.button>
              </Link>
            </div>

            {/* Direct Contact */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <h3 className="font-semibold text-ivory mb-4">Direct Contact</h3>
              <div className="space-y-3">
                <a href="mailto:sales@renewly.io" className="flex items-center gap-3 text-platinum hover:text-gold transition-colors">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-sm">sales@renewly.io</span>
                </a>
                <a href="tel:+918000000000" className="flex items-center gap-3 text-platinum hover:text-gold transition-colors">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="text-sm">+91 800 000 0000</span>
                </a>
              </div>
            </div>

            {/* Enterprise Features */}
            <div className="rounded-2xl bg-slate/50 border border-glass-border p-6">
              <h3 className="font-semibold text-ivory mb-4">Enterprise Includes</h3>
              <ul className="space-y-2">
                {[
                  'Team collaboration',
                  'Advanced security',
                  'Priority support',
                  'Custom integration',
                  'Dedicated account manager',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-platinum">
                    <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
