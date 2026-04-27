import { NextRequest, NextResponse } from 'next/server'
import {
  sendContactSalesEmailToTeam,
  sendContactSalesConfirmationToUser,
} from '@/lib/email/resend'
import { CONTACT_INBOX_EMAIL, PUBLIC_CONTACT_EMAIL } from '@/lib/contact-config'

interface ContactSalesBody {
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  teamSize?: string
  message?: string
  website?: string
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateContactSales(data: ContactSalesBody): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.firstName || !data.firstName.trim()) {
    errors.push('First name is required')
  } else if (data.firstName.length > 80) {
    errors.push('First name must be less than 80 characters')
  }

  if (!data.lastName || !data.lastName.trim()) {
    errors.push('Last name is required')
  } else if (data.lastName.length > 80) {
    errors.push('Last name must be less than 80 characters')
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

  if (!data.teamSize || !data.teamSize.trim()) {
    errors.push('Team size is required')
  } else if (data.teamSize.length > 80) {
    errors.push('Team size must be less than 80 characters')
  }

  if (!data.message || !data.message.trim()) {
    errors.push('Message is required')
  } else if (data.message.length > 2000) {
    errors.push('Message must be less than 2000 characters')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactSalesBody = await request.json()

    // Honeypot check - if website field is filled, ignore silently
    if (body.website && body.website.trim() !== '') {
      return NextResponse.json({ success: true })
    }

    // Validate input
    const validation = validateContactSales(body)
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
      firstName: body.firstName!.trim(),
      lastName: body.lastName!.trim(),
      email: body.email!.trim(),
      company: body.company!.trim(),
      teamSize: body.teamSize!.trim(),
      message: body.message!.trim(),
    }

    // Send team email
    const teamEmailResult = await sendContactSalesEmailToTeam(cleanData)
    if (!teamEmailResult.success) {
      console.error('[v0] Failed to send contact sales team email:', teamEmailResult.error)
      return NextResponse.json({
        success: false,
        message: `We couldn't submit your request right now. Please email ${PUBLIC_CONTACT_EMAIL}.`,
      })
    }

    // Send confirmation email to user (optional - don't fail if this fails)
    await sendContactSalesConfirmationToUser(cleanData.email).catch((err) => {
      console.error('[v0] Failed to send confirmation email:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Contact sales API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: `We couldn't submit your request right now. Please email ${PUBLIC_CONTACT_EMAIL}.`,
      },
      { status: 500 }
    )
  }
}
