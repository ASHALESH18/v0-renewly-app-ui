"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Bell, CreditCard, Shield, Moon, Sun, Globe, 
  HelpCircle, FileText, LogOut, ChevronRight, Crown,
  Smartphone, Mail, Lock, Palette, Download, Copy, FileJson
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from '@/components/motion'
import { Switch } from '@/components/ui/switch'
import useStore from '@/lib/store'
import { exportSubscriptions } from '@/lib/export'
import { signOut } from '@/lib/supabase/actions'

interface SettingItem {
  icon: React.ElementType
  label: string
  description?: string
  type: 'link' | 'toggle' | 'badge'
  value?: boolean
  badge?: string
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [biometricAuth, setBiometricAuth] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)
  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Name, email, avatar', type: 'link' },
        { icon: Crown, label: 'Subscription', description: 'Premium Plan', type: 'badge', badge: 'Active' },
        { icon: CreditCard, label: 'Payment Methods', description: 'Manage cards & billing', type: 'link' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { icon: Bell, label: 'Push Notifications', type: 'toggle', value: pushNotifications },
        { icon: Mail, label: 'Email Notifications', type: 'toggle', value: emailNotifications },
        { icon: Smartphone, label: 'Reminder Timing', description: '3 days before renewal', type: 'link' },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: Lock, label: 'Change Password', type: 'link' },
        { icon: Shield, label: 'Face ID / Touch ID', type: 'toggle', value: biometricAuth },
        { icon: Download, label: 'Export Data', description: 'Download your data', type: 'link' },
      ]
    },
    {
      title: 'Appearance',
      items: [
        { icon: darkMode ? Moon : Sun, label: 'Dark Mode', type: 'toggle', value: darkMode },
        { icon: Palette, label: 'Theme', description: 'Obsidian Reserve', type: 'link' },
        { icon: Globe, label: 'Language', description: 'English (US)', type: 'link' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', type: 'link' },
        { icon: FileText, label: 'Terms & Privacy', type: 'link' },
      ]
    }
  ]
  
  const handleToggle = (label: string) => {
    switch(label) {
      case 'Dark Mode':
        setDarkMode(!darkMode)
        break
      case 'Push Notifications':
        setPushNotifications(!pushNotifications)
        break
      case 'Email Notifications':
        setEmailNotifications(!emailNotifications)
        break
      case 'Face ID / Touch ID':
        setBiometricAuth(!biometricAuth)
        break
    }
  }

  const handleExportCSV = () => {
    exportSubscriptions(subscriptions, 'csv')
    addToast({
      type: 'success',
      title: 'Export complete',
      message: 'Your subscriptions have been exported as CSV.'
    })
    setShowExportOptions(false)
  }

  const handleExportJSON = () => {
    exportSubscriptions(subscriptions, 'json')
    addToast({
      type: 'success',
      title: 'Export complete',
      message: 'Your subscriptions have been exported as JSON.'
    })
    setShowExportOptions(false)
  }
  
  const getToggleValue = (label: string) => {
    switch(label) {
      case 'Dark Mode': return darkMode
      case 'Push Notifications': return pushNotifications
      case 'Email Notifications': return emailNotifications
      case 'Face ID / Touch ID': return biometricAuth
      default: return false
    }
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
        >
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </motion.div>
      </div>
      
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
        className="px-4 mb-6"
      >
        <div className="p-4 rounded-2xl glass">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-2xl font-semibold text-gold">AJ</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Alex Johnson</h2>
              <p className="text-sm text-muted-foreground">alex@example.com</p>
              <div className="flex items-center gap-2 mt-1">
                <Crown className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium text-gold">Premium Member</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </motion.div>
      
      {/* Settings Sections */}
      <div className="px-4 space-y-6">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + sectionIndex * 0.05 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h3>
            <div className="rounded-2xl glass overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon
                const isLast = itemIndex === section.items.length - 1
                const isToggle = item.type === 'toggle'
                
                const content = (
                  <>
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <span className="text-foreground font-medium">{item.label}</span>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    
                    {item.type === 'link' && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    
                    {item.type === 'toggle' && (
                      <Switch 
                        checked={getToggleValue(item.label)}
                        onCheckedChange={() => handleToggle(item.label)}
                        className="data-[state=checked]:bg-gold"
                      />
                    )}
                    
                    {item.type === 'badge' && item.badge && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald/20 text-emerald text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </>
                )
                
                // Use div for toggle items to avoid nested buttons (Switch is a button)
                if (isToggle) {
                  return (
                    <motion.div
                      key={item.label}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                        !isLast && "border-b border-border"
                      )}
                      onClick={() => handleToggle(item.label)}
                    >
                      {content}
                    </motion.div>
                  )
                }
                
                return (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                      !isLast && "border-b border-border"
                    )}
                    onClick={() => {
                      if (item.label === 'Export Data') {
                        setShowExportOptions(!showExportOptions)
                      }
                    }}
                  >
                    {content}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ))}
        {/* Export Options */}
        {showExportOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass overflow-hidden"
          >
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left border-b border-border"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <Download className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-foreground font-medium">Export as CSV</span>
                <p className="text-sm text-muted-foreground">Spreadsheet format</p>
              </div>
            </button>
            
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <FileJson className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-foreground font-medium">Export as JSON</span>
                <p className="text-sm text-muted-foreground">For backup & import</p>
              </div>
            </button>
          </motion.div>
        )}
        
        {/* Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.4 }}
        >
          <motion.button
            onClick={async () => {
              try {
                await signOut()
              } catch (err) {
                console.error('Sign out failed:', err)
              }
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl glass text-crimson hover:bg-crimson/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </motion.button>
        </motion.div>
        
        {/* Version */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Renewly v1.0.0 • Made with care
        </p>
      </div>
    </div>
  )
}
