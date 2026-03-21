# Renewly - Deployment Troubleshooting Guide

## Build Failures

### Issue: "Build failed - npm ERR! code ERESOLVE"

**Cause:** Dependency resolution conflict
**Severity:** Critical

**Quick Fix:**
1. Check Vercel build logs for specific conflict
2. Run locally: `npm ci` (uses package-lock.json)
3. If issue persists:
   - `npm install --legacy-peer-deps`
   - Commit changes
   - Redeploy

**If Still Broken:**
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Commit package-lock.json
- Rebuild

### Issue: "Cannot find module '@/lib/..."

**Cause:** Import path not resolving or file deleted
**Severity:** Critical

**Investigation:**
1. Check Vercel build logs - which file missing?
2. Verify file exists in codebase
3. Check path aliases in tsconfig.json
4. Verify import path is correct

**Fix:**
1. Create missing file or fix import path
2. Commit changes
3. Redeploy

### Issue: "TypeScript compilation error"

**Cause:** Type mismatches or missing types
**Severity:** Critical

**Steps:**
1. Check Vercel build logs for error details
2. Run locally: `npm run build`
3. Fix type issues in code
4. Verify with: `npm run lint`
5. Commit and redeploy

**Common Type Errors:**
- Missing type annotations on exported components
- Function parameter types not defined
- Return type mismatches

### Issue: Build takes > 10 minutes

**Cause:** Large dependencies or slow compilation
**Severity:** Medium

**Investigation:**
1. Check Vercel build logs for slow steps
2. Look for large bundle sizes
3. Check for unnecessary dependencies

**Optimization:**
1. Remove unused packages: `npm prune`
2. Use only needed submodules: `import { X } from 'lib'`
3. Lazy load heavy components
4. Implement code splitting

---

## Runtime Errors

### Issue: "Blank white screen after deployment"

**Cause:** JavaScript error or failed app initialization
**Severity:** Critical

**Diagnosis:**
1. Open DevTools (F12) → Console tab
2. Check for JavaScript errors
3. Check Network tab for failed requests
4. Look for specific error messages

**Common Causes & Fixes:**

**Missing Environment Variables:**
- Error: "Cannot read property 'NEXT_PUBLIC_SUPABASE_URL'"
- Fix: Verify all env vars in Vercel settings
- Add missing variables and redeploy

**Failed Supabase Connection:**
- Error: "Cannot connect to Supabase"
- Check:
  - NEXT_PUBLIC_SUPABASE_URL is valid
  - NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
  - Supabase project status is "Active"
  - Firewall not blocking requests

**Module Not Found:**
- Error: "Module 'X' not found"
- Check: Package installed in package.json
- Fix: Add package or fix import path
- Rebuild

**Failed Import:**
- Error: "Cannot find export 'X' from module 'Y'"
- Check: Export exists in module
- Fix: Verify correct export name
- Test locally with `npm run build`

---

### Issue: "Supabase authentication failed"

**Cause:** Database credentials invalid or environment variables missing
**Severity:** Critical

**Verification Steps:**
1. Check Vercel Environment Variables page
2. Verify these are set:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
3. Check values match Supabase dashboard

**Fix:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy correct URL and keys
3. Update Vercel Environment Variables
4. Redeploy

**If Still Failing:**
1. Check Supabase project status (not paused)
2. Verify API is enabled in Supabase
3. Check CORS settings allow your domain
4. Test locally with same credentials

### Issue: "Database connection timeout"

**Cause:** POSTGRES_URL invalid or database unreachable
**Severity:** Critical

**Investigation:**
1. Check console for "Connection refused" or "Timeout"
2. Verify POSTGRES_URL format is correct
3. Check database is running (Supabase dashboard)
4. Test connection string locally

**Fix:**
1. Verify POSTGRES_URL from Supabase dashboard
2. Check for special characters (escape if needed)
3. Ensure URL includes port and database name
4. Update in Vercel and redeploy

### Issue: "CORS error when calling API"

**Cause:** Cross-origin requests blocked by browser
**Severity:** High

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Check:**
1. Verify API endpoint is CORS-enabled
2. Check Supabase CORS settings
3. Verify correct headers being sent

**Fix:**
1. Enable CORS in Supabase (if applicable)
2. Or use server-side endpoint that calls API
3. Add proper headers: `Content-Type: application/json`

---

## Performance Issues

### Issue: "Page loads very slowly (> 5 seconds)"

**Cause:** Large JavaScript bundle, slow API, or network issues
**Severity:** Medium

**Diagnosis:**
1. Check Network tab (DevTools) for largest files
2. Check what takes longest to load
3. Compare to baseline from pre-deployment

**Fixes:**

**Large JavaScript Bundle:**
```
Check bundle size:
1. Install: npm install --save-dev webpack-bundle-analyzer
2. Analyze: npm run build
3. Look for large packages
4. Split code or lazy load
```

**Slow API Calls:**
1. Check Network tab → XHR filter
2. Look for requests taking > 1s
3. Optimize database queries
4. Add indexes to frequently queried columns

**Network Throttling (test environment specific):**
1. May only occur in "3G" throttling
2. Reduce asset sizes
3. Implement lazy loading
4. Cache static content

### Issue: "Images not loading or loading slowly"

**Cause:** Images not optimized or paths incorrect
**Severity:** Medium

**Check:**
1. Are images in /public folder?
2. DevTools Network tab → Img filter
3. Any 404 errors for images?
4. Are images very large (> 1MB)?

**Fixes:**

**Fix Image Paths:**
```tsx
// Wrong
<img src="images/logo.png" />

// Correct
<img src="/images/logo.png" />

// Best (with Next.js Image)
import Image from 'next/image'
<Image src="/images/logo.png" width={200} height={100} alt="Logo" />
```

**Optimize Large Images:**
1. Resize to actual display size
2. Convert to WebP format
3. Compress with TinyPNG or similar
4. Replace with smaller versions

### Issue: "Memory usage high / Lambda timeout"

**Cause:** Server-side operation taking too long
**Severity:** High

**Symptoms:**
- "Function execution timeout" error
- Page stops loading
- 504 Gateway Timeout errors

**Fixes:**
1. Optimize database queries
2. Add caching (Redis or in-memory)
3. Reduce data processing per request
4. Split long operations into background jobs

---

## Feature-Specific Issues

### Issue: "Authentication not working - users can't login"

**Cause:** Supabase auth misconfiguration
**Severity:** Critical

**Verify:**
1. Supabase authentication provider enabled
2. SUPABASE_URL and ANON_KEY in env
3. JWT secret configured
4. Email provider configured (if email auth)

**Test:**
1. Try signup with test email
2. Check email inbox for confirmation
3. Verify confirmation link works
4. Attempt login with confirmed account

**Fix:**
1. Check Supabase Dashboard → Authentication
2. Verify provider setup complete
3. Check email provider credentials
4. Test recovery email for password reset

### Issue: "User data not persisting / Lost after refresh"

**Cause:** Session not being saved properly
**Severity:** High

**Check:**
1. DevTools → Application → Cookies
2. Look for Supabase session cookie
3. Check Storage → Local Storage for tokens
4. Verify cookie expiration is far future

**Verify Code:**
1. Check useEffect cleanup in app-shell
2. Verify store hydration happening
3. Check session fetch in middleware
4. Verify token refresh mechanism

**Fix:**
1. Ensure session persisted to cookies
2. Check token refresh timing
3. Verify Supabase session valid
4. Clear cookies and re-test

### Issue: "Subscriptions not displaying or updating"

**Cause:** Database query failing or permissions issue
**Severity:** High

**Check:**
1. Console errors about database
2. Network tab → API calls to Supabase
3. Any 400/401/403 responses?
4. Verify row-level security policies

**Test:**
1. Add new subscription → Check appears immediately
2. Edit subscription → Changes persist
3. Delete subscription → Removed from list
4. Refresh page → Data still present

**Debug:**
1. Check Supabase database explorer
2. Verify data exists in database
3. Check RLS policies allow select/insert/update
4. Verify user_id foreign key correct

---

## Rollback Procedures

### Quick Rollback (< 2 minutes)

**If Critical Issue Found:**
1. Go to Vercel Dashboard → renewly project
2. Go to "Deployments" tab
3. Find last known good deployment
4. Click "..." menu
5. Select "Promote to Production"
6. Confirm promotion
7. Monitor for stability

**Verification:**
- Page should load within 30 seconds
- Previous version features working
- No new errors introduced

### Full Rollback (with Git)

**If Rollback Deployment Also Broken:**
1. In Git terminal:
   ```bash
   git log --oneline -5
   git revert HEAD  # Creates new commit undoing changes
   git push origin main
   ```
2. Wait for Vercel to redeploy previous version
3. Verify deployment successful
4. Notify team

### Manual Database Rollback

**If Database Changed:**
1. Go to Supabase Dashboard
2. Database → Backups
3. Select backup before deployment
4. Restore to point-in-time
5. Test data integrity
6. Notify users if data affected

---

## Monitoring & Prevention

### Set Up Alerts

**Vercel Analytics:**
1. Vercel Dashboard → Analytics
2. Set alerts for:
   - High error rate (>5%)
   - Slow page loads (>3s)
   - Function timeouts

**Error Tracking (Optional):**
1. Integrate Sentry or similar
2. Get real-time error notifications
3. Stack traces for debugging
4. User session context

### Regular Health Checks

**Daily:**
- [ ] Check Vercel dashboard status
- [ ] Review error logs
- [ ] Test key features (signup, login, add subscription)
- [ ] Monitor Core Web Vitals

**Weekly:**
- [ ] Review Vercel analytics trends
- [ ] Check for performance regression
- [ ] Update dependencies if security patches
- [ ] Review database query performance

**Monthly:**
- [ ] Full functionality test
- [ ] Performance analysis
- [ ] Security audit
- [ ] Backup verification

---

## When All Else Fails

### Emergency Contact Process

1. **Check Status Pages:**
   - Vercel: status.vercel.com
   - Supabase: status.supabase.com

2. **Review Recent Changes:**
   - What was deployed?
   - What configuration changed?
   - Were new packages added?

3. **Check Version Compatibility:**
   - Are all packages compatible?
   - Run `npm audit` for vulnerabilities
   - Check for version conflicts

4. **Contact Support:**
   - Vercel: vercel.com/help/contact
   - Supabase: supabase.com/support

### Debug Information to Gather

Before contacting support:
- Deployment ID from Vercel
- Complete error message and stack trace
- Reproduction steps
- When issue started
- What changed recently
- Current environment variables set (no secrets)
- Vercel build logs (full output)
- Browser console errors
- Network requests in DevTools

---

## Prevention Checklist

- [x] Fix all critical issues before deployment
- [x] Test locally with `npm run build`
- [x] Test locally with `npm run start`
- [x] Verify all env vars set in Vercel
- [x] Check git history for recent changes
- [x] Review pull request changes
- [x] Run linter: `npm run lint`
- [x] Have rollback plan ready
- [x] Notify team before deploying
- [x] Monitor first 30 minutes after deployment
- [x] Have support contacts ready
- [x] Document any issues found
