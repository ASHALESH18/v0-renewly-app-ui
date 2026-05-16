'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import { SegmentedControl } from '@/components/filter-chips'
import { useCalendarEvents } from '@/lib/hooks/use-remote-data'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { cn } from '@/lib/utils'
import { CalendarSkeleton } from '@/components/skeletons'
import useStore from '@/lib/store'
import { useExchangeRates } from '@/lib/hooks/use-exchange-rates'
import { formatMoney, formatSubscriptionMoney } from '@/lib/preferences-format'
import { convertSubscriptionAmount } from '@/lib/currency'

// Fast transition for responsive feel
const fastTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] }

const viewSegments = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type CalendarSubscriptionItem = {
  id: string
  name: string
  amount: number
  currency: string
  category: string
  logo?: string | null
  color?: string | null
  status?: string
  billingCycle?: string
}

type CalendarEventItem = {
  date: string
  subscriptions: CalendarSubscriptionItem[]
  totalAmount: number
}

function normalizeEvents(input: unknown): CalendarEventItem[] {
  if (!Array.isArray(input)) return []

  return input
    .map((event: any) => {
      const subscriptions = Array.isArray(event?.subscriptions)
        ? event.subscriptions.map((sub: any, index: number) => ({
          id: String(sub?.id ?? `${event?.date ?? 'unknown'}-${index}`),
          name: String(sub?.name ?? 'Unknown'),
          amount: Number(sub?.amount ?? 0),
          currency: String(sub?.currency ?? 'INR'),
          category: String(sub?.category ?? 'Other'),
          logo: typeof sub?.logo === 'string' ? sub.logo : null,
          color: typeof sub?.color === 'string' ? sub.color : null,
          status: typeof sub?.status === 'string' ? sub.status : undefined,
          billingCycle:
            typeof sub?.billingCycle === 'string' ? sub.billingCycle : undefined,
        }))
        : []

      return {
        date: String(event?.date ?? ''),
        subscriptions,
        totalAmount: Number(
          event?.totalAmount ??
          subscriptions.reduce((sum, sub) => sum + Number(sub.amount || 0), 0)
        ),
      }
    })
    .filter((event) => event.date)
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // F6C.2B: Sync Renewly billing before loading calendar events
  useEffect(() => {
    const syncBilling = async () => {
      try {
        await fetch('/api/sync/renewly-billing', {
          method: 'POST',
          cache: 'no-store',
        })
      } catch (error) {
        console.error('[v0] Error syncing billing for calendar:', error)
        // Continue loading calendar even if sync fails
      }
    }

    syncBilling()
  }, [])

  const { calendarEvents, isLoading, error } = useCalendarEvents()
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const preferredLanguage = notificationSettings.language || 'en'
  const { rates } = useExchangeRates()

  // Move all useMemo/useCallback hooks BEFORE any conditional return
  const events = useMemo<CalendarEventItem[]>(
    () => normalizeEvents(calendarEvents),
    [calendarEvents]
  )

  useEffect(() => {
    if (!events.length || selectedDate) return

    const todayKey = toDateKey(new Date())
    const todayEvent = events.find((event) => event.date === todayKey)
    setSelectedDate(todayEvent?.date ?? events[0]?.date ?? null)
  }, [events, selectedDate])

  const getEventForDate = useCallback((dateStr: string) => {
    return events.find((event) => event.date === dateStr) ?? null
  }, [events])

  // Calculate upcomingEvents BEFORE any early return
  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return events
      .filter((event) => {
        const eventDate = new Date(`${event.date}T00:00:00`)
        return !Number.isNaN(eventDate.getTime()) && eventDate >= today
      })
      .slice(0, 5)
  }, [events])

  // NOW we can return early if loading
  if (isLoading) {
    return <CalendarSkeleton />
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

  const getWeekDates = () => {
    const dates: Date[] = []
    const baseDate = new Date(currentDate)
    const dayOfWeek = baseDate.getDay()
    const startOfWeek = new Date(baseDate)
    startOfWeek.setDate(baseDate.getDate() - dayOfWeek)

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  const selectedEvent = selectedDate ? getEventForDate(selectedDate) : null

  return (
    <PageTransition className="min-h-screen">
      <Header title="Calendar" subtitle="Renewal schedule" showSearch={false} />

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        {error && (
          <div className="rounded-2xl border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
            Failed to refresh calendar data. Existing data may still be shown.
          </div>
        )}

        <div className="flex justify-center">
          <SegmentedControl
            segments={viewSegments}
            selectedSegment={viewMode}
            onSegmentSelect={setViewMode}
          />
        </div>

        {viewMode === 'month' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                type="button"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <h2 className="text-lg font-semibold text-foreground">
                {MONTHS[currentMonth]} {currentYear}
              </h2>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                type="button"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative rounded-3xl bg-card/90 backdrop-blur-xl border border-gold/10 p-5 shadow-card overflow-hidden"
            >
              {/* Subtle ambient glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
                    2,
                    '0'
                  )}-${String(day).padStart(2, '0')}`

                  const event = getEventForDate(dateStr)

                  const today = new Date()
                  const isToday =
                    day === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear()

                  return (
                    <motion.button
                      key={day}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        'aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative group',
                        isToday && 'bg-gold text-obsidian shadow-[0_8px_24px_-4px_rgba(199,163,106,0.4)]',
                        !isToday && event && 'bg-gold/15 hover:bg-gold/25',
                        !isToday && !event && 'hover:bg-muted/60',
                        selectedDate === dateStr && !isToday && 'ring-2 ring-gold/70 bg-gold/10'
                      )}
                      type="button"
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isToday ? 'text-obsidian' : 'text-foreground'
                        )}
                      >
                        {day}
                      </span>

                      {event && event.subscriptions.length > 0 && (
                        <div className="absolute bottom-1.5 flex items-center gap-1">
                          {event.subscriptions.slice(0, 2).map((sub) => (
                            <div
                              key={sub.id}
                              className="w-5 h-5 rounded-full overflow-hidden bg-muted ring-1 ring-white/10"
                              title={sub.name}
                            >
                              <SubscriptionIcon
                                name={sub.name}
                                fallbackColor={sub.color || undefined}
                                size="sm"
                              />
                            </div>
                          ))}

                          {event.subscriptions.length > 2 && (
                            <div className="min-w-[20px] h-5 px-1 rounded-full bg-muted text-[9px] font-semibold text-foreground flex items-center justify-center">
                              +{event.subscriptions.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fastTransition}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {getWeekDates().map((date, i) => {
                const todayRef = new Date()
                const isToday =
                  date.getDate() === todayRef.getDate() &&
                  date.getMonth() === todayRef.getMonth() &&
                  date.getFullYear() === todayRef.getFullYear()

                const dateStr = toDateKey(date)
                const event = getEventForDate(dateStr)

                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'flex-1 min-w-[60px] p-3 rounded-xl text-center cursor-pointer transition-colors',
                      isToday ? 'bg-gold text-obsidian' : 'bg-muted hover:bg-muted/80',
                      selectedDate === dateStr && !isToday && 'ring-2 ring-gold/60'
                    )}
                    type="button"
                  >
                    <p
                      className={cn(
                        'text-xs',
                        isToday ? 'text-obsidian/70' : 'text-muted-foreground'
                      )}
                    >
                      {DAYS[date.getDay()]}
                    </p>

                    <p
                      className={cn(
                        'text-lg font-semibold',
                        isToday ? 'text-obsidian' : 'text-foreground'
                      )}
                    >
                      {date.getDate()}
                    </p>

                    {event && event.subscriptions.length > 0 && (
                      <div className="mt-2 flex justify-center items-center gap-1">
                        {event.subscriptions.slice(0, 2).map((sub) => (
                          <div
                            key={sub.id}
                            className="w-6 h-6 rounded-full overflow-hidden bg-muted ring-1 ring-white/10"
                            title={sub.name}
                          >
                            <SubscriptionIcon
                              name={sub.name}
                              fallbackColor={sub.color || undefined}
                              size="sm"
                            />
                          </div>
                        ))}

                        {event.subscriptions.length > 2 && (
                          <div className="min-w-[22px] h-6 px-1 rounded-full bg-black/10 text-[10px] font-semibold flex items-center justify-center">
                            +{event.subscriptions.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fastTransition}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className="flex items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Renewals on {formatDate(selectedEvent.date)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.subscriptions.length} subscription
                  {selectedEvent.subscriptions.length > 1 ? 's' : ''}
                </p>
              </div>

              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {formatMoney(
                  selectedEvent.subscriptions.reduce(
                    (sum, sub) => sum + convertSubscriptionAmount(sub, preferredCurrency, rates),
                    0
                  ),
                  preferredCurrency,
                  preferredLanguage
                )}
              </span>
            </div>

            <div className="space-y-3">
              {selectedEvent.subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted ring-1 ring-white/10 shrink-0">
                      <SubscriptionIcon
                        name={sub.name}
                        fallbackColor={sub.color || undefined}
                        size="md"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.category}</p>
                    </div>
                  </div>

                  <span className="font-semibold text-foreground whitespace-nowrap">
                    {formatSubscriptionMoney(sub, preferredCurrency, preferredLanguage, rates)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-foreground">Upcoming Renewals</h2>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-4 text-sm text-muted-foreground">
              No upcoming renewals found.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={`${event.date}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, ...fastTransition }}
                  className="relative pl-6"
                >
                  {index < upcomingEvents.length - 1 && (
                    <div className="absolute left-[7px] top-8 bottom-0 w-0.5 bg-border" />
                  )}

                  <div className="absolute left-0 top-2 w-[14px] h-[14px] rounded-full bg-card border-2 border-gold" />

                  <button
                    type="button"
                    className={cn(
                      'w-full text-left rounded-xl bg-card border border-border p-4 cursor-pointer transition-colors',
                      selectedDate === event.date && 'ring-2 ring-gold/60'
                    )}
                    onClick={() => setSelectedDate(event.date)}
                  >
                    <p className="text-sm text-muted-foreground mb-3">{formatDate(event.date)}</p>

                    <div className="space-y-3">
                      {event.subscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted ring-1 ring-white/10 shrink-0">
                              <SubscriptionIcon
                                name={sub.name}
                                fallbackColor={sub.color || undefined}
                                size="sm"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{sub.name}</p>
                              <p className="text-xs text-muted-foreground">{sub.category}</p>
                            </div>
                          </div>

                          <span className="font-semibold text-foreground whitespace-nowrap">
                            {formatSubscriptionMoney(sub, preferredCurrency, preferredLanguage, rates)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
