'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import { useCalendarEvents } from '@/lib/hooks/use-remote-data'
import { cn } from '@/lib/utils'
import { CalendarSkeleton } from '@/components/skeletons'
import { SubscriptionIcon } from '@/lib/brand-icons'

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
  logo: string | null
  color: string | null
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
          currency: String(sub?.currency ?? '₹'),
          category: String(sub?.category ?? 'Other'),
          logo: typeof sub?.logo === 'string' ? sub.logo : null,
          color: typeof sub?.color === 'string' ? sub.color : null,
        }))
        : []

      const totalAmount =
        typeof event?.totalAmount === 'number'
          ? event.totalAmount
          : subscriptions.reduce((sum, sub) => sum + Number(sub.amount || 0), 0)

      return {
        date: String(event?.date ?? ''),
        subscriptions,
        totalAmount: Number(totalAmount || 0),
      }
    })
    .filter((event) => event.date)
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function getInitial(name: string) {
  const safe = String(name || '').trim()
  return safe ? safe.charAt(0).toUpperCase() : '?'
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function CalendarScreen() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const { calendarEvents, isLoading, error } = useCalendarEvents()
  const events = useMemo(() => normalizeEvents(calendarEvents), [calendarEvents])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!events.length) {
      setSelectedDate(null)
      return
    }

    if (selectedDate) return

    const todayKey = toDateKey(new Date())
    const todayEvent = events.find((event) => event.date === todayKey)
    setSelectedDate(todayEvent?.date ?? events[0]?.date ?? null)
  }, [events, selectedDate])

  if (!isMounted || isLoading) {
    return <CalendarSkeleton />
  }

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const getEventForDate = (dateStr: string) => {
    return events.find((event) => event.date === dateStr) ?? null
  }

  const selectedEvent = selectedDate ? getEventForDate(selectedDate) : null

  const upcomingEvents = events
    .filter((event) => {
      const d = new Date(`${event.date}T00:00:00`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !Number.isNaN(d.getTime()) && d >= today
    })
    .slice(0, 5)

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

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  return (
    <PageTransition className="min-h-screen">
      <Header title="Calendar" subtitle="Renewal schedule" showSearch={false} />

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        {error && (
          <div className="rounded-2xl bg-card border border-border p-4 text-sm text-muted-foreground">
            Calendar data loaded with a temporary client warning. Refresh once after deploy.
          </div>
        )}

        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                viewMode === 'month' ? 'bg-card text-foreground' : 'text-muted-foreground'
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                viewMode === 'week' ? 'bg-card text-foreground' : 'text-muted-foreground'
              )}
            >
              Week
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-semibold text-foreground">
                {MONTHS[currentMonth]} {currentYear}
              </h2>

              <button
                type="button"
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4">
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
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        'aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative',
                        isToday && 'bg-gold text-obsidian',
                        !isToday && event && 'bg-gold/10',
                        !isToday && !event && 'hover:bg-muted',
                        selectedDate === dateStr && !isToday && 'ring-2 ring-gold/60'
                      )}
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
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shadow-sm"
                              style={{ backgroundColor: sub.color || '#7c6a46' }}
                              title={sub.name}
                            >
                              <SubscriptionIcon
                                name={sub.name}
                                fallbackColor={sub.color || undefined}
                                size="md"
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
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-card border border-border p-4">
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
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'flex-1 min-w-[60px] p-3 rounded-xl text-center cursor-pointer transition-colors',
                      isToday ? 'bg-gold text-obsidian' : 'bg-muted hover:bg-muted/80',
                      selectedDate === dateStr && !isToday && 'ring-2 ring-gold/60'
                    )}
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
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm"
                            style={{ backgroundColor: sub.color || '#7c6a46' }}
                            title={sub.name}
                          >
                            <SubscriptionIcon
                              name={sub.name}
                              fallbackColor={sub.color || undefined}
                              size="md"
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
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedEvent && (
          <div className="rounded-2xl bg-card border border-border p-4">
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
                {(selectedEvent.subscriptions[0]?.currency || '₹') +
                  Number(selectedEvent.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3">
              {selectedEvent.subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white shrink-0"
                      style={{ backgroundColor: sub.color || '#7c6a46' }}
                    >
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
                    {(sub.currency || '₹') + Number(sub.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
                <div key={`${event.date}-${index}`} className="relative pl-6">
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
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium shrink-0"
                              style={{ backgroundColor: sub.color || '#7c6a46' }}
                            >
                              <SubscriptionIcon
                                name={sub.name}
                                fallbackColor={sub.color || undefined}
                                size="md"
                              />
                            </div>
                            <span className="font-medium text-foreground truncate">{sub.name}</span>
                          </div>

                          <span className="font-semibold text-foreground whitespace-nowrap">
                            {(sub.currency || '₹') + Number(sub.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}