# Renewly Configuration Guide

## Overview

This document explains how to configure optional services (Redis/Upstash and Inngest) for the Renewly application. The app is designed to **work gracefully without these services** for development and testing.

## Services

### 1. Redis/Upstash (Optional - Caching)

**Purpose**: Speeds up API responses by caching candidate counts, integrations, and other frequently accessed data.

**When needed**: For production and high-volume testing. Not required for development.

**Configuration**:
- Set `KV_REST_API_URL` environment variable with your Upstash Redis REST URL
- Set `KV_REST_API_TOKEN` environment variable with your Upstash token

**If not configured**:
- The app will still work - APIs will fetch directly from Supabase
- No caching layer is applied
- All data is freshly fetched from the database
- Performance is slower but functionality is identical

**Files affected**:
- `lib/redis.ts` - Safe initialization with graceful degradation
- All API routes that use `withCache()` - automatically skip caching if Redis is unavailable

### 2. Inngest (Optional - Background Jobs)

**Purpose**: Processes emails from Gmail/Outlook, analyzes notifications, and handles async subscription detection tasks.

**When needed**: For background job processing. Not required for manual notification lab testing.

**Configuration**:
- Set `INNGEST_EVENT_KEY` environment variable
- Set `INNGEST_SIGNING_KEY` environment variable

**If not configured**:
- The notification lab still works - you can submit test notifications
- Events are created in the `ingestion_events` table but won't be automatically processed
- The app doesn't crash - it logs a warning and continues
- Manual processing can be done later when Inngest is configured

**Files affected**:
- `lib/inngest/client.ts` - Safe initialization with mock functions
- `lib/inngest/functions.ts` - Functions return no-op if Inngest unavailable
- `app/api/smart-capture/notification-lab/route.ts` - Works with or without Inngest
- `app/api/smart-capture/candidates/[id]/decision/route.ts` - Works with or without Inngest
- `app/api/inngest/route.ts` - Returns 503 if Inngest not configured

### 3. Supabase (Required - Database)

**Purpose**: Stores all application data (users, subscriptions, candidates, integrations, etc.).

**Configuration**:
- Set `NEXT_PUBLIC_SUPABASE_URL` (public)
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- Set `SUPABASE_SERVICE_ROLE_KEY` (secret)

**If not configured**: The app will not work. All data is persisted in Supabase.

## Graceful Degradation Architecture

### Redis/Upstash Degradation

```typescript
// If Redis is unavailable:
async function withCache(key, fetcher) {
  // ❌ Redis unavailable
  // → Skip directly to fetcher
  // → Return fresh data from Supabase
  // → Performance hit but functionally correct
  return fetcher()
}
```

### Inngest Degradation

```typescript
// If Inngest is unavailable:
await sendEvent({ name: 'event' })
  // ❌ Inngest unavailable
  // → Logs warning
  // → Returns { ok: false, reason: 'inngest_not_configured' }
  // → App continues - no crash

// For routes:
// POST /api/smart-capture/notification-lab
  // ✅ Event is created in database
  // ❌ Not queued to Inngest (if unavailable)
  // → Return 202 anyway - event is persisted
  // → Can be manually processed later
```

## API Routes Behavior

### With all services configured ✅
- **Fast responses**: Data cached in Redis
- **Async processing**: Jobs queued to Inngest
- **Optimal experience**: Everything works smoothly

### With only Supabase configured (typical dev setup) ✅
- **Direct DB queries**: No caching, slightly slower
- **Notification lab works**: Events persisted in DB
- **Events not auto-processed**: Can test manually via Notification Lab
- **All CRUD operations**: Work normally

### Partial configuration
- **Redis only**: Caching works, Inngest events buffered
- **Inngest only**: Background jobs run, no caching
- **Neither**: Slowest but fully functional

## Testing Different Configurations

### Development (Recommended)
```bash
# Only set Supabase variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Redis and Inngest are optional
```

### Production (Recommended)
```bash
# All three services
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

## Debugging

### Check what's available

Look at server logs:

```
[Redis] KV_REST_API_URL or KV_REST_API_TOKEN not configured - caching disabled
[Inngest] INNGEST_EVENT_KEY or INNGEST_SIGNING_KEY not configured - background jobs disabled
```

### Test caching

```bash
# Fetch with cache
GET /api/smart-capture/counts

# Logs show:
# [Redis] Cache hit: inbox:counts:user123
# OR
# [Redis] Cache bypass - Redis unavailable, fetching directly: inbox:counts:user123
```

### Test Inngest

```bash
# Check if available
POST /api/smart-capture/notification-lab
{
  "appName": "Netflix",
  "title": "Payment received",
  "body": "Your subscription was charged $10"
}

# Response includes:
{
  "inngestConfigured": false,  // ← Inngest not configured
  "inngestQueued": false,       // ← Event not queued
  "event": { ... },             // ← Event still created in DB
  "status": "queued"
}
```

## Error Handling

All API routes follow this pattern:

```typescript
try {
  // Try Redis cache
  const cached = await withCache(key, fetcher)
  // → Automatically skips if Redis unavailable
  
  // Try Inngest
  if (isInngestAvailable()) {
    await sendEvent(...)
  }
  // → Gracefully continues if Inngest unavailable
  
  return success()
} catch (error) {
  console.error('[route] Error:', error)
  return error500()
}
```

## Common Issues

### Dashboard/Calendar/Smart Inbox shows error

**Cause**: Check `console.log()` in browser for the actual error

**Solutions**:
1. Verify Supabase credentials are correct
2. Check Supabase database has the required tables
3. Ensure you're authenticated (logged in)

### Notification Lab returns error

**Most likely**: Missing or incorrect Supabase credentials

**Verify**:
- Can submit notifications?
  - Check if event appears in response
  - Response status should be 202 (accepted)
- Can see events in list?
  - Check browser console for API errors
  - Verify Supabase connection

### API responses are slow

**Cause**: Redis not configured

**Solution**: Response time is normal without caching - Supabase direct queries are slower but fully functional

## Environment Variables Checklist

### Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Optional (Recommended for Production)
- [ ] `KV_REST_API_URL`
- [ ] `KV_REST_API_TOKEN`
- [ ] `INNGEST_EVENT_KEY`
- [ ] `INNGEST_SIGNING_KEY`

### Development
- Set required Supabase variables
- Optional services can be added as needed
- App works perfectly without them

## Next Steps

1. **Get started**: Just set Supabase variables
2. **Add caching**: Configure Redis when needed
3. **Add automation**: Configure Inngest when ready

The app guides you through each step with helpful logs!
