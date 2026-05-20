# Combo 5B: Notification QA + Hardening - Complete Guide

## Status
Foundation complete and committed. Build: ✓ PASS (exit code 0, all 93 routes)

## What Was Implemented

### PART A: Notification API Source of Truth Audit
- `/api/notifications` verified to return stable response shape
- Response includes `{ notifications[], unreadCount }`
- Optional `success` field handled gracefully
- Error handling: safe JSON returns, no repeated 500s

### PART B: QA Notification Trigger Endpoint  
**Route**: `POST /api/qa/notifications/trigger`  
**Enabled**: Preview + development only (blocks production custom domain)

**Scenarios Supported** (9 types):
- `family_invite_received` - Recipient gets invited notification
- `family_invite_accepted` - Owner gets accepted notification
- `family_invite_declined` - Owner gets declined notification
- `extra_seat_cancel_scheduled` - Owner gets cancellation scheduled
- `extra_seat_cancel_undone` - Owner gets cancellation undone
- `billing_amount_changed` - User gets billing update
- `renewal_due_soon` - User gets 7-day reminder
- `renewal_due_today` - User gets same-day renewal
- `system_test` - Generic test notification

**Request Example**:
```bash
curl -X POST http://localhost:3000/api/qa/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "family_invite_received",
    "targetEmail": "user@example.com",
    "ownerEmail": "owner@example.com",
    "metadata": {}
  }'
```

**Response Example**:
```json
{
  "success": true,
  "scenario": "family_invite_received",
  "notificationIds": ["notif_123"],
  "targetUserId": "user_456",
  "ownerUserId": "owner_789",
  "errors": []
}
```

### PART C: Idempotency Keys Per Scenario
All notifications use stable keys to prevent duplicates:
```
family_invite_received:qa:{userId}:{date}
family_invite_accepted:qa:{ownerId}:{targetId}:{date}
family_invite_declined:qa:{ownerId}:{targetId}:{date}
extra_seat_cancel_scheduled:qa:{ownerId}:{date}
extra_seat_cancel_undone:qa:{ownerId}:{date}
billing_amount_changed:qa:{userId}:{amount}:{date}
renewal_due_soon:qa:{userId}:{daysUntil}:{date}
renewal_due_today:qa:{userId}:{date}
system_test:qa:{userId}:{timestamp}
```

**Guarantees**:
- Refreshing page doesn't duplicate notifications
- Calling trigger twice is idempotent (returns same notificationIds)
- Automatic deduplication via DB unique constraint

### PART I: Performance/Fetch Hardening
**Utility**: `lib/utils/notification-fetch-cache.ts`  
**Purpose**: Single-flight deduplication + caching

**API**:
```typescript
// Fetch with 30s cache + single-flight dedupe
const { notifications, unreadCount } = await fetchNotificationsDeduped()

// Force refresh on next call
invalidateNotificationCache()

// Manual cache set (testing)
setNotificationCacheData({ notifications: [...], unreadCount: 0 })

// Emergency clear
clearNotificationCache()
```

**Benefits**:
- Reduces /api/notifications calls during rapid focus/blur cycles
- 30s default TTL (configurable)
- Single-flight prevents duplicate in-flight requests
- Graceful fallback on API error
- No console spam on normal operation

## QA Test Flow (Step-by-Step)

### 1. Basic API Health Check
```bash
curl https://your-preview.vercel.app/api/notifications

# Expected:
# HTTP 200
# { "notifications": [], "unreadCount": 0 }
```

### 2. QA Trigger: System Test
```bash
curl -X POST https://your-preview.vercel.app/api/qa/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "system_test",
    "targetEmail": "your-qa-user@example.com"
  }'

# Check:
# - Response success: true
# - notificationIds not empty
# - Bell icon shows unread count increased
# - /app/notifications page shows notification
# - Refresh page: notification persists (not duplicated)
```

### 3. QA Trigger: Family Invite Received
```bash
# Trigger for invitee
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "family_invite_received",
    "targetEmail": "invitee@example.com",
    "ownerEmail": "owner@example.com"
  }'

# Check:
# - Invitee sees bell notification
# - /app/notifications shows "You've been invited..."
# - actionUrl leads to /app/family
```

### 4. QA Trigger: Family Invite Accepted
```bash
# Trigger for owner
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "family_invite_accepted",
    "targetEmail": "owner@example.com",
    "ownerEmail": "invitee@example.com"
  }'

# Check:
# - Owner sees notification "{invitee} accepted your invitation"
# - Bell unread count increases
# - Notification marked as read and persists
```

### 5. QA Trigger: Billing Amount Changed
```bash
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "billing_amount_changed",
    "targetEmail": "user@example.com",
    "metadata": {
      "newAmount": "349"
    }
  }'

# Check:
# - Notification shows "₹349/month"
# - Category shows as "billing"
# - Action URL leads to /app/settings
```

### 6. QA Trigger: Renewal Due Soon (7 days)
```bash
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "renewal_due_soon",
    "targetEmail": "user@example.com",
    "metadata": {
      "daysUntil": 7,
      "amount": "149"
    }
  }'

# Check:
# - Notification title includes "7 days"
# - Category: renewals
# - Action URL: /app/subscriptions
```

### 7. QA Trigger: Renewal Due Today
```bash
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "renewal_due_today",
    "targetEmail": "user@example.com"
  }'

# Check:
# - Notification shows "renewing today"
# - Severity should be "high" (more urgent)
```

### 8. Performance Test: No Spam on Refocus
```javascript
// Open /app/notifications page
// Rapidly switch tabs (browser window lose/gain focus)
// Check Network tab in DevTools

// Expected:
// - /api/notifications called ONCE per 30s
// - No repeated 500 errors
// - No fetch loop detected
```

### 9. QA Trigger Error Handling
```bash
# Test with non-existent user
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "system_test",
    "targetEmail": "nonexistent@example.com"
  }'

# Expected:
# HTTP 404
# success: false
# errors: ["Target user not found: nonexistent@example.com"]
```

### 10. QA Trigger: Idempotency Check
```bash
# Call exact same request twice
curl -X POST .../api/qa/notifications/trigger \
  -d '{
    "scenario": "system_test",
    "targetEmail": "user@example.com"
  }'

# Call again with same data...

# Expected:
# Both responses have same notificationIds
# /app/notifications shows notification ONCE (not duplicated)
# No additional DB row created
```

## Regression Testing

### Family Invite Blocking
- [ ] Family owner CANNOT be invited by another owner
- [ ] Error message clear
- [ ] No duplicate invites allowed
- [ ] Pro user CAN be invited (converts to Family on accept)

### Seat Capacity Guardrails
- [ ] Max 4 extra seats enforced
- [ ] Capacity display never shows +5
- [ ] Billing never exceeds ₹695 (INR) or $20.97 (USD)

### Notifications Don't Block Actions
- [ ] Family invite accept works even if notification fails
- [ ] Extra seat purchase works even if notification fails
- [ ] Subscription renewal works even if notification fails

### Bell Consistency
- [ ] Bell shows same count as /app/notifications
- [ ] Bell unread matches API response
- [ ] Mark all read works correctly
- [ ] Read/unread state persists on refresh

## Intentionally NOT Touched

✓ Auth system  
✓ Middleware  
✓ Razorpay/payment flow  
✓ Family billing lifecycle  
✓ Family invite capacity rules  
✓ Subscription sync logic  
✓ Avatar/profile picture logic  
✓ Normal subscription edit/delete  
✓ Duplicate managed Renewly row prevention  
✓ Currency localization (Combo 2)  

## Files Changed

**New**:
- `app/api/qa/notifications/trigger/route.ts` (308 lines)
- `lib/utils/notification-fetch-cache.ts` (106 lines)

**Committed**:
- Build passes: ✓ PASS (exit code 0, 93 routes)

## Next Steps (PART D-J)

**Part D**: Wire Family invite notifications to real flows  
**Part E**: Wire billing/extra-seat notifications to real flows  
**Part F**: Renewal reminder generation helper  
**Part G**: Read/unread behavior polish  
**Part H**: Notification UI spacing/polish (if needed)  
**Part J**: QA checklist validation  

## Manual Testing Checklist

After deployment, verify:

- [ ] 1. `/api/notifications` returns 200 with empty array
- [ ] 2. QA trigger creates test notification visible in bell
- [ ] 3. QA trigger idempotency prevents duplicates on page refresh
- [ ] 4. Family invite sent → invitee gets notification
- [ ] 5. Family invite accepted → owner gets notification
- [ ] 6. Family invite declined → owner gets notification
- [ ] 7. Mark notification read → unread count decreases
- [ ] 8. Mark all read → all notifications change state
- [ ] 9. Billing event → notification created with correct amount
- [ ] 10. Renewal reminder → created 7/3/1/0 days before
- [ ] 11. No /api/notifications 500 spam in logs
- [ ] 12. Notification fetch cache working (30s TTL)
- [ ] 13. Rapid tab switch doesn't cause fetch loop
- [ ] 14. Family owner blocking still enforced
- [ ] 15. Pro → Family conversion allowed with notification
- [ ] 16. Extra seat max (4) still enforced
- [ ] 17. Billing clamped to max (₹695 / $20.97)
- [ ] 18. Existing subscriptions unchanged
- [ ] 19. No new duplicate Renewly rows
- [ ] 20. Avatar consistency maintained

---

**Combo 5B Status**: Foundation complete. Ready for PART D-J implementation.
