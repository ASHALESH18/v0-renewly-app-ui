import { getUser } from '@/lib/supabase/server'
import { getUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch real subscriptions from Supabase
    const subscriptions = await getUserSubscriptions()

    // Calculate monthly spend data (last 12 months)
    const monthlySpendData = []
    const today = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      
      // Calculate total spend for this month based on billing cycles
      const monthTotal = subscriptions.reduce((sum, sub) => {
        if (sub.status !== 'active') return sum
        
        // Simple approximation: spread annual/quarterly/weekly costs to monthly equivalent
        let monthlyAmount = 0
        switch(sub.billing_cycle) {
          case 'daily':
            monthlyAmount = sub.amount * 30
            break
          case 'weekly':
            monthlyAmount = sub.amount * 4.33
            break
          case 'monthly':
            monthlyAmount = sub.amount
            break
          case 'quarterly':
            monthlyAmount = sub.amount / 3
            break
          case 'yearly':
            monthlyAmount = sub.amount / 12
            break
        }
        return sum + monthlyAmount
      }, 0)
      
      monthlySpendData.push({
        month: monthKey,
        amount: Math.round(monthTotal),
      })
    }

    // Calculate category breakdown
    const categoryMap = new Map()
    const COLORS = ['#C7A36A', '#2E5E52', '#7A3940', '#BCC2CC', '#F4EFE7']
    let colorIndex = 0

    subscriptions
      .filter(sub => sub.status === 'active')
      .forEach(sub => {
        const category = sub.category || 'Other'
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            value: 0,
            color: COLORS[colorIndex % COLORS.length],
          })
          colorIndex++
        }
        
        const categoryData = categoryMap.get(category)
        let monthlyAmount = 0
        switch(sub.billing_cycle) {
          case 'daily':
            monthlyAmount = sub.amount * 30
            break
          case 'weekly':
            monthlyAmount = sub.amount * 4.33
            break
          case 'monthly':
            monthlyAmount = sub.amount
            break
          case 'quarterly':
            monthlyAmount = sub.amount / 3
            break
          case 'yearly':
            monthlyAmount = sub.amount / 12
            break
        }
        categoryData.value += monthlyAmount
      })

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .map(cat => ({
        ...cat,
        value: Math.round(cat.value),
      }))

    return NextResponse.json({ monthlySpendData, categoryBreakdown })
  } catch (error) {
    console.error('[v0] Analytics API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
