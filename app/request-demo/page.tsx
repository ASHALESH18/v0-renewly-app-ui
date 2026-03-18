'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, CheckCircle, Video } from 'lucide-react'
import { Header } from '@/components/header'
import { springs } from '@/components/motion'

export default function RequestDemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    preferredDate: '',
    preferredTime: '',
    focus: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Demo request submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', company: '', preferredDate: '', preferredTime: '', focus: '' })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Request a Demo"
        subtitle="Get a personal walkthrough of Renewly Enterprise"
      />

      <main className="max-w-2xl mx-auto px-4 py-12 lg:py-16">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="rounded-2xl bg-slate/50 border border-glass-border p-8"
        >
          {submitted ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-emerald/20 p-4">
                  <CheckCircle className="w-8 h-8 text-emerald" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-ivory mb-2">Demo Scheduled!</h3>
              <p className="text-platinum mb-6">
                We've received your request. A member of our team will reach out shortly to confirm the demo details.
              </p>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-left">
                <p className="text-sm text-platinum mb-2">
                  <span className="font-medium text-gold">Demo Details:</span>
                </p>
                <p className="text-sm text-platinum">
                  Our demos are typically 30 minutes and include a deep dive into your specific use case.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Demo Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-glass-border">
                <div className="flex gap-4">
                  <Video className="w-6 h-6 text-gold shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ivory mb-1">Live Video Demo</h3>
                    <p className="text-sm text-platinum">30-minute personalized walkthrough with our team</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock className="w-6 h-6 text-gold shrink-0" />
                  <div>
                    <h3 className="font-semibold text-ivory mb-1">Flexible Scheduling</h3>
                    <p className="text-sm text-platinum">Pick a time that works best for you</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                      placeholder="Your name"
                    />
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Preferred Time
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all appearance-none"
                    >
                      <option value="">Select time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory mb-2">
                    What's your main focus?
                  </label>
                  <select
                    name="focus"
                    value={formData.focus}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate/50 border border-glass-border text-ivory focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all appearance-none"
                  >
                    <option value="">Select focus area</option>
                    <option value="team-collaboration">Team collaboration</option>
                    <option value="cost-management">Cost management</option>
                    <option value="reporting">Reporting & analytics</option>
                    <option value="security">Security & compliance</option>
                    <option value="integration">Integration capabilities</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury transition-all"
                >
                  Schedule My Demo
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
