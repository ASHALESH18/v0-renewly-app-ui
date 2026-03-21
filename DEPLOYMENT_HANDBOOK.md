# Renewly - Deployment Handbook - Quick Reference

## Executive Summary

This handbook provides a comprehensive deployment strategy for Renewly on Vercel. All critical build issues have been resolved (motion.tsx duplicate exports fixed), and the application is ready for production deployment.

**Current Status:** ✅ READY FOR DEPLOYMENT
**Critical Issues:** ✅ RESOLVED
**Build Status:** ✅ PASSING

---

## Before You Deploy

### Critical Preparation (Do This First)
1. **Review Fixed Issues:**
   - ✅ motion.tsx duplicate exports removed
   - ✅ All animation variants unique
   - ✅ Clean build passing

2. **Verify Environment Setup:**
   - [ ] All Supabase credentials obtained
   - [ ] Environment variables documented
   - [ ] Database tables created (if needed)
   - [ ] Authentication configured

3. **Test Locally:**
   ```bash
   npm run build      # Should succeed
   npm run start      # Should start successfully
   npm run lint       # Should pass
   ```

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
SUPABASE_URL
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_PRISMA_URL
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST
POSTGRES_DATABASE
```

---

## Deployment Checklist

### ✅ Step 1: Repository Setup (5 min)
- [ ] Code pushed to main branch
- [ ] All changes committed
- [ ] GitHub repository connected to Vercel
- [ ] Main branch set as production

### ✅ Step 2: Vercel Configuration (5 min)
- [ ] Project created in Vercel
- [ ] Framework detected as Next.js
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### ✅ Step 3: Environment Variables (5 min)
- [ ] All env vars added to Vercel
- [ ] Scope set to: Production, Preview, Development
- [ ] Secret keys only in Production
- [ ] Redeploy triggered after adding vars

### ✅ Step 4: Deploy (Automatic)
- [ ] Push to main triggers deployment
- [ ] Vercel builds automatically
- [ ] Monitor build progress
- [ ] Watch for completion email

### ✅ Step 5: Immediate Testing (5 min)
- [ ] Deployment shows "Ready"
- [ ] Landing page loads
- [ ] Sign up flow works
- [ ] No console errors

### ✅ Step 6: Full Testing (30 min)
- [ ] All features tested (see POST_DEPLOYMENT_TESTING.md)
- [ ] Performance verified
- [ ] Mobile tested
- [ ] Errors logged and addressed

---

## Document Guide

### For Planning & Preparation
**→ PRE_DEPLOYMENT_CHECKLIST.md**
- Critical issues checklist
- Build verification
- Security requirements
- Final sign-off

### For Step-by-Step Deployment
**→ DEPLOYMENT_PLAN.md**
- Phase 1: Pre-deployment preparation
- Phase 2: Deployment steps
- Phase 3: Post-deployment verification
- Phase 4-7: Monitoring and scaling

### For Testing After Deployment
**→ POST_DEPLOYMENT_TESTING.md**
- Quick status check (5 min)
- Detailed testing protocol
- Performance testing
- Browser compatibility
- Security verification
- Issue reporting template

### For When Things Break
**→ DEPLOYMENT_TROUBLESHOOTING.md**
- Build failures and fixes
- Runtime errors and solutions
- Performance issues
- Feature-specific problems
- Rollback procedures
- Emergency contacts

---

## Timeline

### Week Before Deployment
- [ ] Complete PRE_DEPLOYMENT_CHECKLIST.md
- [ ] Get Supabase credentials
- [ ] Prepare environment variables
- [ ] Test build locally

### Day Before Deployment
- [ ] Get team approval
- [ ] Backup database
- [ ] Final code review
- [ ] Have rollback plan ready

### Deployment Day
- **T-5 min:** Final pre-deployment checks
- **T-0:** Push to main (automatic deployment starts)
- **T+3-5 min:** Build completes, auto-deploy to production
- **T+5 min:** Start POST_DEPLOYMENT_TESTING.md
- **T+30 min:** All testing complete, verify success
- **T+1 hour:** Monitor for issues

### Post-Deployment (First Week)
- [ ] Daily performance checks
- [ ] Monitor error logs
- [ ] User feedback collection
- [ ] Optimization opportunities

---

## Key Success Criteria

✅ All checks must pass:
- Build completes without errors
- Landing page loads
- Authentication works
- Dashboard displays data
- Performance acceptable (Lighthouse >85)
- No critical console errors
- Mobile responsive
- All features accessible

---

## Critical Contacts

**Vercel Support:** vercel.com/help/contact
- Enterprise: +1-844-VERCEL-1
- Email: support@vercel.com

**Supabase Support:** supabase.com/support
- Community: Discord
- Email: support@supabase.io

**Status Pages:**
- Vercel: status.vercel.com
- Supabase: status.supabase.com

---

## Incident Response

### If Deployment Fails

1. **Immediate (< 5 min):**
   - [ ] Check Vercel build logs
   - [ ] Identify specific error
   - [ ] Check DEPLOYMENT_TROUBLESHOOTING.md

2. **Response (< 15 min):**
   - [ ] Fix issue or rollback
   - [ ] Document what happened
   - [ ] Notify team

3. **Prevention (< 1 hour):**
   - [ ] Update deployment procedures
   - [ ] Add preventive checks
   - [ ] Schedule post-mortem

### If Runtime Issues Occur

1. **Triage (< 5 min):**
   - [ ] Check Vercel Analytics
   - [ ] Review error logs
   - [ ] Test critical features

2. **Decision (< 10 min):**
   - [ ] Can fix quickly? → Fix
   - [ ] Rollback needed? → Use Vercel "Promote"
   - [ ] Acceptable? → Monitor closely

3. **Fix (< 1 hour):**
   - [ ] Identify root cause
   - [ ] Deploy fix or rollback
   - [ ] Verify resolution

---

## Performance Targets

### Lighthouse Scores (Minimum)
- Performance: 85+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Core Web Vitals (Targets)
- Largest Contentful Paint: < 2.5s
- First Input Delay: < 100ms
- Cumulative Layout Shift: < 0.1

### Load Time Targets
- First byte to browser: < 1s
- Full page load: < 3s
- Time to interactive: < 5s

---

## Post-Deployment Monitoring

### Daily (First Week)
- [ ] Check Vercel dashboard
- [ ] Review error logs
- [ ] Test critical path
- [ ] Monitor performance

### Weekly (First Month)
- [ ] Review analytics
- [ ] Check performance trends
- [ ] User feedback collection
- [ ] Update documentation

### Monthly (Ongoing)
- [ ] Performance analysis
- [ ] Security updates
- [ ] Dependency updates
- [ ] Optimization review

---

## Quick Commands Reference

```bash
# Local Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Check code quality

# Deployment
git push origin main     # Triggers auto-deployment in Vercel

# Debugging
npm run build -- --debug # Verbose build output
```

---

## Success Metrics

Track these after deployment:

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | < 3s | — |
| Lighthouse Score | > 85 | — |
| Error Rate | < 1% | — |
| Uptime | > 99.5% | — |
| CLS (Stability) | < 0.1 | — |
| LCP (Speed) | < 2.5s | — |

---

## Final Checklist Before Clicking Deploy

- [ ] Code compiled locally without errors
- [ ] All env vars obtained from Supabase
- [ ] Environment variables added to Vercel
- [ ] GitHub repository connected
- [ ] Main branch set as production
- [ ] Team notified of deployment time
- [ ] Database backed up (if applicable)
- [ ] Rollback plan prepared
- [ ] Testing guide reviewed
- [ ] Support contacts documented

**Ready to Deploy?** ✅ YES - PROCEED WITH CONFIDENCE

---

## Document Navigation

```
DEPLOYMENT HANDBOOK
├── PRE_DEPLOYMENT_CHECKLIST.md ─ What to verify before deploying
├── DEPLOYMENT_PLAN.md ───────── How to deploy step-by-step
├── POST_DEPLOYMENT_TESTING.md ─ What to test after deploying
├── DEPLOYMENT_TROUBLESHOOTING.md ─ How to fix deployment issues
└── This document ────────────── Quick reference guide
```

---

**Version:** 1.0
**Last Updated:** 2026-03-21
**Status:** ✅ PRODUCTION READY
