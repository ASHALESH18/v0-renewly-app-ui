import type { Subscription } from './types'

export function exportAsCSV(subscriptions: Subscription[]) {
  const headers = ['Name', 'Category', 'Amount', 'Currency', 'Billing Cycle', 'Renewal Date', 'Status']
  const rows = subscriptions.map(sub => [
    sub.name,
    sub.category,
    sub.amount,
    sub.currency,
    sub.billingCycle,
    sub.renewalDate || '',
    sub.status
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csv
}

export function exportAsJSON(subscriptions: Subscription[]) {
  return JSON.stringify(subscriptions, null, 2)
}

export function downloadFile(content: string, filename: string, type: 'text/csv' | 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportSubscriptions(subscriptions: Subscription[], format: 'csv' | 'json') {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `renewly-subscriptions-${timestamp}.${format === 'csv' ? 'csv' : 'json'}`
  
  if (format === 'csv') {
    const content = exportAsCSV(subscriptions)
    downloadFile(content, filename, 'text/csv')
  } else {
    const content = exportAsJSON(subscriptions)
    downloadFile(content, filename, 'application/json')
  }
}
