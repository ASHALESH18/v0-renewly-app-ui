'use client'

import { motion } from 'framer-motion'
import { Twitter, Instagram, Send } from 'lucide-react'
import { springs } from '../motion'
import Link from 'next/link'

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Enterprise', href: '/contact-sales' },
    { label: 'Download', href: '/download' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  resources: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Support', href: '/contact' },
    { label: 'Request Demo', href: '/request-demo' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}

// Social links - only render if URLs are configured
const socialLinks = [
  { 
    icon: Instagram, 
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '', 
    label: 'Instagram' 
  },
  { 
    icon: Twitter, 
    href: process.env.NEXT_PUBLIC_X_URL || process.env.NEXT_PUBLIC_TWITTER_URL || '', 
    label: 'X' 
  },
  { 
    icon: Send, 
    href: process.env.NEXT_PUBLIC_TELEGRAM_URL || '', 
    label: 'Telegram' 
  },
].filter(social => social.href) // Only render if URL is configured

export function Footer() {
  return (
    <footer className="bg-graphite border-t border-glass-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <span className="text-obsidian font-semibold text-sm">R</span>
              </div>
              <span className="font-semibold text-ivory">Renewly</span>
            </Link>
            <p className="text-sm text-platinum mb-6 max-w-xs">
              Own every renewal. Track, understand, and reduce every recurring payment with elegance.
            </p>
            
            {/* Social icons - premium muted circular buttons with luxury hover motion */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit our ${social.label}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle }}
                    whileHover={{ 
                      y: -2,
                      boxShadow: '0 8px 24px rgba(199, 163, 106, 0.12)',
                      transition: springs.gentle
                    }}
                    whileTap={{ scale: 0.96 }}
                    className="w-10 h-10 rounded-full bg-slate/30 border border-glass-border flex items-center justify-center text-muted-gold hover:text-gold transition-colors duration-300 group relative"
                  >
                    {/* Subtle sheen effect on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/0 via-transparent to-white/0 group-hover:from-white/10 group-hover:via-white/5 group-hover:to-white/0 transition-all duration-300" />
                    
                    <social.icon className="w-4 h-4 relative z-10" />
                  </motion.a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-ivory mb-4">Product</p>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-platinum hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p className="font-medium text-ivory mb-4">Company</p>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-platinum hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <p className="font-medium text-ivory mb-4">Resources</p>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-platinum hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-platinum">
            © 2026 Renewly. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-platinum hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-platinum hover:text-gold transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
