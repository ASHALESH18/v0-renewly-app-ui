# Product Requirements Document: Vercel Deployment for Renewly Next.js Application

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Active  
**Author:** Development Team

---

## 1. Executive Summary

This document outlines the requirements, troubleshooting procedures, and best practices for successfully deploying the Renewly Next.js 16 application on Vercel. It specifically addresses the build failure `Command "pnpm run build" exited with 1` and provides a structured approach to diagnose, resolve, and prevent similar deployment issues.

---

## 2. Build Failure Analysis

### 2.1 Error Context

```
Build Error: Command "pnpm run build" exited with 1
Build Machine: 2 cores, 8 GB RAM (iad1 - Washington, D.C.)
Next.js Version: 16.1.6 (Turbopack)
Package Manager: pnpm 10.11.0
```

### 2.2 Root Cause Identification

The specific build failure was caused by:

| Error Type | File | Line | Description |
|------------|------|------|-------------|
| JSX Parsing Error | `components/screens/dashboard.tsx` | 290 | Mismatched closing tag: `</motion.div>` instead of `</div>` |
| Config Warning | `next.config.mjs` | N/A | Deprecated `eslint` configuration option in Next.js 16 |

### 2.3 Error Categories

Build failures on Vercel typically fall into these categories:

1. **Syntax Errors** - JSX/TSX parsing failures, mismatched tags
2. **Type Errors** - TypeScript compilation failures (if not ignored)
3. **Missing Dependencies** - Packages not in lockfile or unresolved imports
4. **Environment Issues** - Missing environment variables
5. **Configuration Errors** - Invalid next.config options
6. **Memory/Timeout** - Build exceeds resource limits

---

## 3. Deployment Requirements

### 3.1 Pre-Deployment Checklist

#### Environment Configuration
- [ ] All required environment variables are set in Vercel project settings
- [ ] Supabase integration is properly connected
- [ ] API keys and secrets are configured (never committed to repository)

#### Code Quality
- [ ] Local build passes: `pnpm run build`
- [ ] No JSX syntax errors (balanced tags, proper escaping)
- [ ] TypeScript compiles without critical errors
- [ ] All imports resolve to existing modules

#### Dependencies
- [ ] `pnpm-lock.yaml` is committed and up-to-date
- [ ] No conflicting peer dependencies
- [ ] Native dependencies (sharp, msw) are properly handled

### 3.2 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |

---

## 4. Troubleshooting Guide

### 4.1 JSX/TSX Parsing Errors

**Symptoms:**
```
Parsing ecmascript source code failed
Expected '</', got 'jsx text'
```

**Resolution Steps:**
1. Identify the file and line number from the error output
2. Check for mismatched opening/closing tags
3. Verify JSX expressions are properly wrapped in curly braces
4. Ensure special characters are escaped: `&apos;`, `&quot;`, `&lt;`, `&gt;`

**Prevention:**
- Enable ESLint with `eslint-plugin-react` for JSX validation
- Use IDE extensions for real-time JSX validation
- Run `pnpm run build` locally before pushing

### 4.2 Next.js 16 Configuration Errors

**Common Issues:**

| Deprecated Option | Replacement |
|-------------------|-------------|
| `eslint.ignoreBuildErrors` | Use `.eslintrc` or remove; ESLint is now configured separately |
| `middleware.ts` | Migrate to `proxy.js` (backwards compatible) |

**Valid next.config.mjs for Next.js 16:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Only for development
  },
  images: {
    unoptimized: true, // Or configure remotePatterns
  },
}

export default nextConfig
```

### 4.3 Dependency Resolution Failures

**Symptoms:**
```
Lockfile is up to date, resolution step is skipped
Ignored build scripts: msw, sharp
```

**Resolution:**
1. For `sharp`: Vercel handles this automatically; no action needed
2. For `msw`: Only needed in development; exclude from production bundle
3. Run `pnpm approve-builds` locally if native modules need scripts

### 4.4 Memory/Timeout Issues

**Symptoms:**
- Build hangs without output
- `SIGKILL` or out-of-memory errors

**Resolution:**
1. Reduce bundle size by code-splitting
2. Use dynamic imports for heavy components
3. Upgrade Vercel plan for more build resources
4. Add `experimental.memoryBasedWorkersCount` to config

---

## 5. Build Optimization Recommendations

### 5.1 Turbopack Configuration

Next.js 16 uses Turbopack by default. Ensure compatibility:

```javascript
// next.config.mjs
const nextConfig = {
  // Turbopack is now default - no explicit configuration needed
}
```

### 5.2 Bundle Size Optimization

1. **Analyze Bundle:**
   ```bash
   pnpm add -D @next/bundle-analyzer
   ANALYZE=true pnpm run build
   ```

2. **Code Splitting:**
   - Use `next/dynamic` for heavy components
   - Lazy load non-critical features

3. **Image Optimization:**
   - Use `next/image` with proper `sizes` attribute
   - Configure `remotePatterns` instead of `unoptimized: true`

### 5.3 Caching Strategy

Vercel caches builds automatically. To optimize:

1. Keep `pnpm-lock.yaml` stable
2. Use incremental builds where possible
3. Configure `cacheLife` profiles for data fetching

---

## 6. Deployment Workflow

### 6.1 Recommended Git Flow

```
main (production)
  └── develop (staging)
       └── feature/* (development)
```

### 6.2 Pre-Push Validation

Create a pre-push hook (`.husky/pre-push`):

```bash
#!/bin/sh
pnpm run build
```

### 6.3 Vercel Project Settings

| Setting | Recommended Value |
|---------|-------------------|
| Framework Preset | Next.js |
| Build Command | `pnpm run build` (auto-detected) |
| Output Directory | `.next` (auto-detected) |
| Install Command | `pnpm install` (auto-detected) |
| Node.js Version | 20.x |

---

## 7. Monitoring and Alerts

### 7.1 Build Failure Notifications

Configure in Vercel Dashboard:
- Enable Slack/Discord notifications for failed deployments
- Set up email alerts for the development team

### 7.2 Runtime Error Tracking

Consider integrating:
- Vercel Analytics for performance monitoring
- Sentry for error tracking (MCP preset available)

---

## 8. Resolved Issues Log

| Date | Issue | Resolution | Files Affected |
|------|-------|------------|----------------|
| April 2026 | JSX parsing error - mismatched tag | Changed `</motion.div>` to `</div>` | `components/screens/dashboard.tsx:290` |
| April 2026 | Deprecated eslint config warning | Removed `eslint` block from config | `next.config.mjs` |

---

## 9. Quick Reference Commands

```bash
# Local build verification
pnpm run build

# Start production server locally
pnpm run start

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml && pnpm install

# Check for peer dependency issues
pnpm why <package-name>
```

---

## 10. Support Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/help)
- [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)

---

## Appendix A: Build Log Interpretation

Key markers in Vercel build logs:

| Log Entry | Meaning |
|-----------|---------|
| `Restored build cache` | Previous build cache is being used |
| `Lockfile is up to date` | Dependencies haven't changed |
| `Creating an optimized production build` | Build process started |
| `Build error occurred` | Build failed - check following lines |
| `ELIFECYCLE` | Process exited with non-zero code |

---

**Document maintained by:** Renewly Development Team  
**Next review date:** Quarterly or after major Next.js updates
