# Family Plan Foundation Documentation

## Overview

The Family Plan feature allows users to share subscriptions and insights with family members. This document describes the F0/F1 batch scope, which establishes the database foundation and configuration layer.

## Product Rules

- **Family Plan Composition**: Owner + up to 4 invited family members
- **Extra Members**: Additional members beyond 4 cost ₹99/member/month
- **Authentication**: Google/Apple-first approach, primarily Google
- **Invite Acceptance**: Can be accepted from invite email link OR by signing into Renewly directly
- **Email Match**: Signed-in email must match the invited email
- **Removed Members**: Lose Family access immediately
- **Personal Data**: Removed members' personal accounts and subscriptions are NOT deleted

## Architecture

### Tables

1. **family_groups**
   - Represents a family plan subscription
   - One owner per group
   - Tracks subscription status (active, past_due, cancelled)
   - Stores member limits and extra seat count

2. **family_members**
   - Members in a family group
   - Roles: owner or member
   - Status: active or removed
   - Seat types: owner, included (within 4), or extra

3. **family_invites**
   - Pending and accepted invitations
   - Status: pending, accepted, expired, cancelled
   - Token-based (hashed for security)
   - Auto-expires after 7 days

4. **family_seat_addons**
   - Tracks extra member seat subscriptions
   - One subscription per family group
   - Status: active, cancelled, past_due

### Row Level Security (RLS)

- Owners can view and manage their own family group and members
- Active members can view their family group and members
- Members can view their own membership
- Invited user acceptance is handled via service-role API routes (future batch)
- No client-side insert permissions for family memberships

## Future Batches

### F2: Dashboard Subscription Sync
- Auto-add "Renewly Family" subscription to family group owner and active members
- Auto-add "Renewly Pro" subscription when Pro plan is purchased
- Dashboard displays shared subscriptions

### F3: Invite Email and Accept Flow
- Send invite emails via Resend
- Build invite email link handler
- Direct sign-in prompt for family members
- Email/auth email matching validation

### F4: Member Management UI
- Owner can view family members
- Owner can remove members
- Owner can add/remove extra seats
- Members can view family group info

### F5+: Advanced Features
- Ownership transfer
- Member permissions UI
- Shared expense analytics
- Family spending reports

## Feature Flag

The Family Plan is disabled by default:

```
NEXT_PUBLIC_FAMILY_PLAN_ENABLED=true
```

Set this in development or production to enable the foundation. This batch does NOT expose any UI.

## Constants

- `FAMILY_INCLUDED_MEMBER_COUNT`: 4 members included
- `FAMILY_EXTRA_MEMBER_PRICE_INR`: ₹99 per extra member per month
- `FAMILY_INVITE_EXPIRY_DAYS`: 7 days for invite expiration

## What's NOT in This Batch

- Invite email sending (F3)
- Invite accept page (F3)
- Family member management UI (F4)
- Extra seat payment add-ons (F4)
- Razorpay add-on logic (Payment team)
- Dashboard Renewly subscription auto-add (F2)
- Shared family dashboard (F4)
- Member permissions (F5+)
- Ownership transfer (F5+)

## Database Triggers

All family tables have `updated_at` triggers that automatically set the timestamp on updates. These are created using the existing `public.update_updated_at_column()` function.

## Testing

The foundation enables backend tests for:
- Creating family groups
- Adding/removing members
- Sending invites
- Checking RLS policies

UI and email integration testing will happen in F3.
