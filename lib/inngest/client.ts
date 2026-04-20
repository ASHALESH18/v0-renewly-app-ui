import { Inngest } from 'inngest'

// Create a client to send and receive events
export const inngest = new Inngest({
  id: 'renewly',
  name: 'Renewly Smart Capture',
})

// Event types for type safety
export type Events = {
  'smart-capture/email.received': {
    data: {
      userId: string
      accountId: string
      emailId: string
      from: string
      subject: string
      body: string
      receivedAt: string
      provider: 'gmail' | 'outlook'
    }
  }
  'smart-capture/notification.received': {
    data: {
      userId: string
      title: string
      body: string
      appName: string
      receivedAt: string
      source: 'notification_lab' | 'mobile_app'
    }
  }
  'smart-capture/candidate.process': {
    data: {
      userId: string
      eventId: string
      candidateId: string
    }
  }
  'smart-capture/candidate.confirmed': {
    data: {
      userId: string
      candidateId: string
      subscriptionId: string
    }
  }
  'smart-capture/sync.gmail': {
    data: {
      userId: string
      accountId: string
      fullSync?: boolean
    }
  }
  'smart-capture/sync.outlook': {
    data: {
      userId: string
      accountId: string
      fullSync?: boolean
    }
  }
}
