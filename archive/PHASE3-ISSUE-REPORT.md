# Phase 3 Issue Report - Resume Engine Pro
**Date:** 2026-06-21 | **Issues:** 2 Critical | **Status:** DIAGNOSED

---

## Issue #1: GitHub OAuth - prompt() Not Supported ⚠️ CRITICAL

### Severity: HIGH
**Impact:** Authentication completely broken in test environments (Playwright, headless browsers)  
**Duration:** Affects all local testing and automated test runs  
**User Facing:** YES - Sign in button completely non-functional

### Symptoms
```
Error Message: "Login error: prompt() is not supported."
File: script.js, line 169
Function: initiateGitHubLogin()
Trigger: Click "Sign in with GitHub" button
```

### Root Cause Analysis
The GitHub authentication flow uses browser's native `prompt()` dialog:

```javascript
// PROBLEMATIC CODE (line 169 in script.js)
const token = prompt('Enter your GitHub Personal Access Token:\n\nCreate one at: https://github.com/settings/tokens\n\nScopes needed: repo, gist, user');
```

**Why This Fails:**
- `prompt()` is NOT supported in headless browsers (Playwright automation)
- `prompt()` NOT supported in some sandboxed contexts
- `prompt()` NOT supported when browser is in automation mode
- Direct browser APIs are blocked in headless environments

### Architecture Issue
Current flow:
```
User clicks "Sign in with GitHub" 
  ↓
initiateGitHubLogin() called
  ↓
prompt() dialog shown (FAILS in headless)
  ↓
Browser throws: "prompt() is not supported"
  ↓
Error caught, displayed to user
  ↓
Authentication blocked
```

### Solution Strategy
**Replace prompt() with:**
1. Modal dialog component (in-page HTML modal)
2. Graceful fallback for automation/testing environments
3. Better error handling with retry logic
4. Support for both interactive and programmatic token input

---

## Issue #2: Missing Favicon Resource 🔴 MEDIUM

### Severity: MEDIUM
**Impact:** Console error (non-blocking), missing visual branding  
**Duration:** Throughout app lifecycle  
**User Facing:** NO (console error only)

### Symptoms
```
Error: Failed to load resource: the server responded with a status 404 (File not found)
File: localhost:8000/favicon.ico
Appears in: Browser Console → Network/Console tab
```

### Root Cause Analysis
HTML references `favicon.svg` but file does not exist:

```html
<!-- index.html, line 7 -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">
```

**File Status:**
- ✅ Reference exists in index.html
- ❌ File `favicon.svg` does NOT exist in root directory
- ❌ Browser auto-requests `/favicon.ico` as fallback (also missing)

### Solution
Create `favicon.svg` with simple branding design OR use data URI to embed directly

---

## Testing Impact

### Current Test Results
| Test | Before Fix | After Fix | Impact |
|------|-----------|-----------|--------|
| GitHub OAuth Flow | ❌ FAIL (prompt error) | ✅ PASS | BLOCKING |
| Console Errors | 1 favicon 404 | 0 | MINOR |
| Page Load | ~1.2s + error | ~1.2s clean | UX |

### Automated Testing Issue
Playwright tests cannot use `prompt()`, so:
- Cannot test GitHub authentication in headless mode
- Cannot simulate user token input
- Workaround in tests: direct token injection via StorageManager

---

## Fix Strategy

### For Issue #1: GitHub OAuth
1. Create reusable HTML modal component
2. Replace `prompt()` with modal input
3. Add fallback for automation environments
4. Add retry logic and better error messages

### For Issue #2: Favicon
1. Create `favicon.svg` with simple design
2. Ensure browser serves it correctly
3. Verify no more 404 errors

---

## Files to Modify
- ✏️ script.js (replace prompt() with modal)
- ✏️ index.html (add modal HTML structure)
- ✏️ style.css (add modal styling)
- ✨ favicon.svg (CREATE NEW)

## Estimated Fix Time
- Issue #1: 30 minutes (modal implementation + testing)
- Issue #2: 5 minutes (create SVG)
- Testing: 15 minutes (validate both fixes)
- Documentation: 20 minutes

**Total: ~70 minutes**
