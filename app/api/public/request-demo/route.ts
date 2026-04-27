import { NextRequest, NextResponse } from 'next/server'
import {
  sendDemoRequestEmailToTeam,
  sendDemoRequestConfirmationToUser,
} from '@/lib/email/resend'
import { CONTACT_INBOX_EMAIL, PUBLIC_CONTACT_EMAIL } from '@/lib/contact-config'

interface DemoRequestBody {
  name?: string
  email?: string
  company?: string
  preferredDate?: string
  preferredTime?: string
  focus?: string
  website?: string
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateDemoRequest(data: DemoRequestBody): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.name || !data.name.trim()) {
    errors.push('Name is required')
  } else if (data.name.length > 120) {
    errors.push('Name must be less than 120 characters')
  }

  if (!data.email || !data.email.trim()) {
    errors.push('Email is required')
  } else if (!validateEmail(data.email)) {
    errors.push('Email is invalid')
  } else if (data.email.length > 200) {
    errors.push('Email must be less than 200 characters')
  }

  if (!data.company || !data.company.trim()) {
    errors.push('Company is required')
  } else if (data.company.length > 160) {
    errors.push('Company must be less than 160 characters')
  }

  if (!data.preferredDate || !data.preferredDate.trim()) {
    errors.push('Preferred date is required')
  }

  if (!data.preferredTime || !data.preferredTime.trim()) {
    errors.push('Preferred time is required')
  }

  if (!data.focus || !data.focus.trim()) {
    errors.push('Focus area is required')
  } else if (data.focus.length > 120) {
    errors.push('Focus area must be less than 120 characters')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DemoRequestBody = await request.json()

    // Honeypot check - if website field is filled, ignore silently
    if (body.website && body.website.trim() !== '') {
      return NextResponse.json({ success: true })
    }

    // Validate input
    const validation = validateDemoRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'We couldn\'t submit your request right now. Please email contact@renewly.in.',
        },
        { status: 400 }
      )
    }

    // Trim all strings
    const cleanData = {
      name: body.name!.trim(),
      email: body.email!.trim(),
      company: body.company!.trim(),
      preferredDate: body.preferredDate!.trim(),
      preferredTime: body.preferredTime!.trim(),
      focus: body.focus!.trim(),
    }

    // Send team email
    const teamEmailResult = await sendDemoRequestEmailToTeam(cleanData)
    if (!teamEmailResult.success) {
      console.error('[v0] Failed to send demo request team email:', teamEmailResult.error)
      return NextResponse.json({
        success: false,
        message: `We couldn't submit your request right now. Please email ${PUBLIC_CONTACT_EMAIL}.`,
      })
    }

    // Send confirmation email to user (optional - don't fail if this fails)
    await sendDemoRequestConfirmationToUser(cleanData.email).catch((err) => {
      console.error('[v0] Failed to send confirmation email:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Demo request API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: `We couldn't submit your request right now. Please email ${PUBLIC_CONTACT_EMAIL}.`,
      },
      { status: 500 }
    )
  }
}
