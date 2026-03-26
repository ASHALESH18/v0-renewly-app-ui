'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition, springs, staggerItem, StaggerList } from '@/components/motion'
import { SegmentedControl } from '@/components/filter-chips'
import { useCalendarEvents } from '@/lib/hooks/use-remote-data'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'

const viewSegments = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function CalendarScreen() {
  const [viewMode, setViewMode] = useState('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [isMounted, setIsMounted] = useState(false)

  const { calendarEvents, isLoading } = useCalendarEvents()
  const subscriptions = useStore((state) => state.subscriptions)

  // Wait for store hydration before rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Early return: Don't render any content until store is hydrated
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] px-6 py-8 lg:px-8">
        <div className="h-10 w-44 rounded-2xl bg-white/5 animate-pulse" />
        <div className="mt-6 h-[420px] rounded-3xl bg-white/5 animate-pulse" />
      </div>
    )
  }
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calendarEvents.find(e => e.date === dateStr)
  }

  // Get week data
  const getWeekDates = () => {
    const dates = []
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Get upcoming events for the timeline
  const upcomingEvents = calendarEvents
    .filter(e => new Date(e.date) >= new Date())
    .slice(0, 5)

  return (
    <PageTransition className="min-h-screen">
      <Header
        title="Calendar"
        subtitle="Renewal schedule"
        showSearch={false}
      />

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        {/* View toggle */}
        <div className="flex justify-center">
          <SegmentedControl
            segments={viewSegments}
            selectedSegment={viewMode}
            onSegmentSelect={setViewMode}
          />
        </div>

        {viewMode === 'month' ? (
          <>
            {/* Month header */}
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <h2 className="text-lg font-semibold text-foreground">
                {MONTHS[currentMonth]} {currentYear}
              </h2>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Calendar grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="rounded-2xl bg-card border border-border p-4"
            >
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const event = getEventsForDate(day)
                  const today = new Date()
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

                  return (
                    <motion.div
                      key={day}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative',
                        isToday && 'bg-gold text-obsidian',
                        !isToday && event && 'bg-gold/10',
                        !isToday && !event && 'hover:bg-muted'
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium',
                        isToday ? 'text-obsidian' : 'text-foreground'
                      )}>
                        {day}
                      </span>
                      {event && !isToday && (
                        <div className="absolute bottom-1.5 flex gap-0.5">
                          {event.subscriptions.slice(0, 3).map((_, idx) => (
                            <div key={idx} className="w-1 h-1 rounded-full bg-gold" />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        ) : (
          /* Week view */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {getWeekDates().map((date, i) => {
                const todayRef = new Date()
                const isToday = date.getDate() === todayRef.getDate() && date.getMonth() === todayRef.getMonth() && date.getFullYear() === todayRef.getFullYear()
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                const event = calendarEvents.find(e => e.date === dateStr)

                return (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex-1 min-w-[60px] p-3 rounded-xl text-center cursor-pointer transition-colors',
                      isToday ? 'bg-gold text-obsidian' : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <p className={cn(
                      'text-xs',
                      isToday ? 'text-obsidian/70' : 'text-muted-foreground'
                    )}>
                      {DAYS[date.getDay()]}
                    </p>
                    <p className={cn(
                      'text-lg font-semibold',
                      isToday ? 'text-obsidian' : 'text-foreground'
                    )}>
                      {date.getDate()}
                    </p>
                    {event && (
                      <div className="mt-2 flex justify-center gap-0.5">
                        {event.subscriptions.slice(0, 2).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isToday ? 'bg-obsidian' : 'bg-gold'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Upcoming timeline */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-foreground">Upcoming Renewals</h2>
          </div>

          <StaggerList className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.date}
                variants={staggerItem}
                className="relative pl-6"
              >
                {/* Timeline line */}
                {index < upcomingEvents.length - 1 && (
                  <div className="absolute left-[7px] top-8 bottom-0 w-0.5 bg-border" />
                )}

                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-[14px] h-[14px] rounded-full bg-card border-2 border-gold" />

                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(event.date)}
                  </p>
                  {event.subscriptions.map((sub) => {
                    const subscription = subscriptions.find(s => s.id === sub.id)
                    return (
                      <div key={sub.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: subscription?.color }}
                          >
                            {subscription?.logo}
                          </div>
                          <span className="font-medium text-foreground">{sub.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {sub.currency}{sub.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </StaggerList>
        </div>
      </div>
    </PageTransition>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}
