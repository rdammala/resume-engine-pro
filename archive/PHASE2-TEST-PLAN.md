# Phase 2 Test Plan - Resume Engine Pro

**Status:** Ready for Phase 2 testing after guard pattern fixes (all 12 modules verified functional)  
**Test Environment:** Local file:// serving on Windows 10  
**Test Date:** 2026-06-21  
**Browser:** Chrome/Edge (DevTools available)

---

## Pre-Test Checklist ✅

- [ ] Clear browser localStorage (DevTools → Application → Clear All)
- [ ] Hard refresh page (Ctrl+F5) to clear cache
- [ ] Open DevTools Console (F12) and verify no errors on load
- [ ] Click "Check Module Status" button → verify all 12 modules show ✅
- [ ] Verify git status is clean: `git status` in terminal

---

## TEST GROUP 1: Module & Storage Initialization

### Test 1.1 - StorageManager Initialization
**Steps:**
1. Open DevTools Console (F12)
2. Type: `window.StorageManager.getStorage()` → Should return object with 23 properties
3. Type: `window.StorageManager.get('PREFIX')` → Should return "RE_" prefix
4. **Expected:** No TypeError, returns string value
5. **Record:** ✅ PASS / ❌ FAIL + error message

### Test 1.2 - All 12 Modules Enumeration
**Steps:**
1. Console: `Object.keys(window).filter(k => k.includes('Manager') || k.includes('Templates') || k.includes('Integration') || k.includes('Parser'))`
2. Expected modules: StorageManager, GitHubManager, AIIntegration, Generator, JobTrackerManager, PortfolioTemplates, PortfolioTemplates50plus, ProfileManager, ResumeParser, ResumeTemplates, TrackerFunctions, CostCalculator
3. All 12 should appear in results
4. **Expected:** Array of 12 module names
5. **Record:** ✅ PASS / ❌ FAIL + missing modules

### Test 1.3 - Cross-Module Dependency Chain
**Steps:**
1. Console: `typeof window.GitHubManager.authenticate === 'function'`
2. Console: `typeof window.StorageManager.saveAPIKey === 'function'`
3. Console: `typeof window.AIIntegration.setAPIKey === 'function'`
4. Console: `typeof window.Generator.generateResume === 'function'`
5. All should return `true`
6. **Expected:** All return true
7. **Record:** ✅ PASS / ❌ FAIL + function not found

---

## TEST GROUP 2: UI & Navigation

### Test 2.1 - Initial Page Load
**Steps:**
1. Refresh page (Ctrl+F5)
2. Verify visible elements:
   - Resume Engine Pro heading
   - Feature list (5 bullet points)
   - "Sign in with GitHub" button
   - Settings button (⚙️)
   - Debug buttons (Test JS, Module Status, Debug Log)
   - Footer text
3. Check Console for any errors (should be empty red warnings)
4. **Expected:** All elements visible, Console clean
5. **Record:** ✅ PASS / ❌ FAIL + missing elements

### Test 2.2 - Settings Panel Toggle
**Steps:**
1. Click ⚙️ button in top-right
2. Verify sidebar appears with:
   - AI Provider selection
   - API Key input field(s)
   - Save button
   - Close button
3. Click close/background to dismiss
4. Verify sidebar closes cleanly
5. **Expected:** Smooth toggle behavior
6. **Record:** ✅ PASS / ❌ FAIL + error message

### Test 2.3 - Debug Buttons Functional
**Steps:**
1. Click "Test JavaScript" button
   - Should log test results to console
   - Should show success/failure for core functions
2. Click "Check Module Status" button
   - Should display module health check
   - Each module should show ✅ or ❌
3. Click "View Debug Log" button
   - Should toggle debug output visibility
   - Should show initialization steps
4. **Expected:** All buttons respond without errors
5. **Record:** ✅ PASS / ❌ FAIL + button behavior

---

## TEST GROUP 3: GitHub OAuth Flow (Requires Real Token)

### Test 3.1 - OAuth Button & Flow Entry
**Steps:**
1. Verify "Sign in with GitHub" button is clickable
2. Click button → should trigger OAuth flow
3. Browser console should show: `GitHub OAuth initiated`
4. Expect prompt for GitHub token input (or redirect if OAuth 2.0 implemented)
5. **Expected:** OAuth flow starts without JavaScript errors
6. **Note:** Requires real GitHub Personal Access Token to complete
7. **Record:** ✅ PASS / ❌ FAIL + error

### Test 3.2 - OAuth Token Storage (Workaround Method)
**Steps:**
1. In Console, manually store token:
   ```javascript
   const token = "YOUR_GITHUB_PAT_HERE";
   window.StorageManager.saveAPIKey('github', token);
   window.GitHubManager.authenticate(token);
   ```
2. Console should show: `GitHub user loaded` (or similar)
3. Check localStorage: `localStorage.getItem('RE_GITHUB_TOKEN')`
4. Should return encrypted token (Base64 string)
5. **Expected:** Token stored and encrypted properly
6. **Record:** ✅ PASS / ❌ FAIL + storage issue

### Test 3.3 - Session Persistence
**Steps:**
1. Store GitHub token (Test 3.2)
2. Reload page (Ctrl+R)
3. Console should auto-load session
4. Check: `window.GitHubManager.getUser()` returns stored user data
5. Verify token still encrypted in localStorage
6. **Expected:** Session restored without re-authentication
7. **Record:** ✅ PASS / ❌ FAIL + session lost

---

## TEST GROUP 4: Resume Upload & Parsing

### Test 4.1 - Resume File Upload (HTML Input Preparation)
**Steps:**
1. Verify resume file input exists in page
2. Try uploading a PDF resume:
   - Path: Use any PDF resume or create test file
3. Check Console for: `Parsing resume...`
4. Wait for completion message
5. **Expected:** File uploads without blocking
6. **Current Issue:** Check if PDF.js CDN is loading (may return MIME type error)
7. **Record:** ✅ PASS / ❌ FAIL + parsing error

### Test 4.2 - Resume Data Extraction
**Steps:**
1. After resume upload, check extracted data:
   - Console: `window.ProfileManager.getProfile()`
   - Should return object with: name, email, phone, linkedin, github, experience, skills, education
2. Verify each field is populated (not undefined)
3. **Expected:** All contact fields extracted
4. **Record:** ✅ PASS / ❌ FAIL + missing fields

### Test 4.3 - Multiple Resume Formats
**Steps:**
1. Test upload with PDF resume
2. Test upload with DOCX resume (if docx.js loading)
3. Test upload with TXT resume
4. Compare extraction accuracy
5. **Expected:** All formats parse without crashes
6. **Known Issue:** DOCX parser may fail due to CDN MIME type
7. **Record:** ✅ PASS / ❌ FAIL per format

---

## TEST GROUP 5: AI Integration

### Test 5.1 - AI Provider Configuration
**Steps:**
1. Click ⚙️ Settings
2. Select "OpenAI" from AI Provider dropdown
3. Enter test API key (or dummy key `test-key-xxx`)
4. Click Save
5. Verify: `window.StorageManager.getAPIKey('openai')` returns key
6. Repeat for: Claude, Gemini, Mistral
7. **Expected:** All providers accept keys without validation errors
8. **Record:** ✅ PASS / ❌ FAIL per provider

### Test 5.2 - Resume Tailoring with AI
**Steps:**
1. Configure AI provider (Test 5.1)
2. Load/upload resume (Test 4.1)
3. Paste sample Job Description (JD):
   ```
   Senior SRE Manager - Responsible for infrastructure reliability, 
   incident management, observability platforms. 5+ years SRE experience required.
   ```
4. Click "Tailor Resume to JD"
5. Monitor Console for API call
6. Wait for tailored resume output
7. **Expected:** Shows tailoring in progress, returns revised content
8. **Note:** Actual API call requires valid API key
9. **Record:** ✅ PASS / ❌ FAIL + API error

### Test 5.3 - Cost Calculator
**Steps:**
1. Console: `window.CostCalculator.calculateResumeGenerationCost('openai', 'tailoring', 5)`
2. Should return cost object: `{ provider: 'openai', cost: X, tokens: Y }`
3. Test with different:
   - Providers: openai, claude, gemini, mistral
   - Operations: parsing, tailoring, generation, bulk
   - Counts: 1, 5, 10, 50
4. **Expected:** Returns numeric cost, no errors
5. **Record:** ✅ PASS / ❌ FAIL + cost calc error

---

## TEST GROUP 6: Portfolio Generation

### Test 6.1 - Template Loading
**Steps:**
1. Console: `window.PortfolioTemplates.templates.length`
2. Should return number > 0 (expected: 50+)
3. Console: `window.PortfolioTemplates.templates[0]`
4. Should show template object: `{ id, name, colors, layout, ... }`
5. Repeat for 50+ templates: `window.PortfolioTemplates50plus.templates.length`
6. **Expected:** All template arrays populated
7. **Record:** ✅ PASS / ❌ FAIL + templates missing

### Test 6.2 - Portfolio HTML Generation
**Steps:**
1. Load resume profile (Test 4.2)
2. Select portfolio template (e.g., Template ID: "modern-blue")
3. Click "Generate Portfolio"
4. Wait for HTML output
5. Preview generated HTML
6. Check for:
   - Hero section with profile name
   - About section
   - Experience section
   - Skills section
   - Call-to-action buttons
7. **Expected:** Valid HTML structure
8. **Record:** ✅ PASS / ❌ FAIL + generation error

### Test 6.3 - Portfolio Styling Verification
**Steps:**
1. Generate portfolio (Test 6.2)
2. Check CSS variables applied:
   - `--primary` color
   - `--secondary` color
   - Font sizing (header, body, accent)
   - Layout (grid, flexbox, spacing)
3. Verify dark theme applied by default
4. Test dark/light mode toggle (if implemented)
5. **Expected:** Consistent styling, no layout breaks
6. **Record:** ✅ PASS / ❌ FAIL + styling issue

---

## TEST GROUP 7: Job Tracker

### Test 7.1 - Tracker Data Initialization
**Steps:**
1. Check localStorage: `localStorage.getItem('RE_APPLICATIONS')`
2. If missing, tracker should initialize with empty array
3. Console: `window.JobTrackerManager.getApplications()`
4. Should return array (empty or with sample data)
5. **Expected:** Returns valid array structure
6. **Record:** ✅ PASS / ❌ FAIL + initialization error

### Test 7.2 - Add Application Entry
**Steps:**
1. Console:
   ```javascript
   window.JobTrackerManager.addApplication({
     portfolio: 'Senior-Manager-SRE',
     role: 'Senior Manager, SRE',
     company: 'Acme Corp',
     date: '2026-06-21',
     link: 'https://example.com',
     status: 'Applied'
   });
   ```
2. Verify no errors
3. Console: `window.JobTrackerManager.getApplications()`
4. New entry should appear in returned array
5. **Expected:** Entry added successfully
6. **Record:** ✅ PASS / ❌ FAIL + add error

### Test 7.3 - Tracker Persistence
**Steps:**
1. Add application entry (Test 7.2)
2. Reload page (Ctrl+R)
3. Console: `window.JobTrackerManager.getApplications()`
4. Previously added entry should still exist
5. Check localStorage for tracker data
6. **Expected:** Data persists across reload
7. **Record:** ✅ PASS / ❌ FAIL + data lost

---

## TEST GROUP 8: GitHub Integration (Requires Real Token)

### Test 8.1 - Repository List
**Steps:**
1. Authenticate with GitHub (Test 3.2)
2. Console: `window.GitHubManager.listRepos()`
3. Should return array of repositories
4. Each repo should have: name, url, description
5. **Expected:** Returns user's GitHub repos
6. **Record:** ✅ PASS / ❌ FAIL + API error

### Test 8.2 - Create Test Repository
**Steps:**
1. Authenticate (Test 3.2)
2. Console:
   ```javascript
   window.GitHubManager.createRepo('test-portfolio-' + Date.now());
   ```
3. Monitor Console for success message
4. Should return new repo object
5. Verify on GitHub.com in browser tab
6. Delete test repo after verification
7. **Expected:** Repo created without errors
8. **Record:** ✅ PASS / ❌ FAIL + creation error

### Test 8.3 - File Upload to Repository
**Steps:**
1. Create test repo (Test 8.2)
2. Generate portfolio HTML (Test 6.2)
3. Console:
   ```javascript
   window.GitHubManager.createFile('test-portfolio-xxx', 'index.html', portfolioHtmlContent);
   ```
4. Should return success message
5. Verify file appears on GitHub.com repo
6. **Expected:** File created in repo
7. **Record:** ✅ PASS / ❌ FAIL + upload error

### Test 8.4 - GitHub Pages Setup
**Steps:**
1. Create repo and upload HTML (Test 8.3)
2. Console: `window.GitHubManager.setupGitHubPages('test-portfolio-xxx')`
3. Should enable GitHub Pages on the repo
4. Monitor for success message
5. Visit GitHub.com repo → Settings → Pages
6. Verify GitHub Pages is enabled and live URL is accessible
7. **Expected:** Pages enabled, accessible via https://rdammala.github.io/test-portfolio-xxx/
8. **Record:** ✅ PASS / ❌ FAIL + pages setup error

---

## TEST GROUP 9: Error Handling & Edge Cases

### Test 9.1 - Resume Upload with Invalid File
**Steps:**
1. Try uploading non-document file (.txt with binary data, .jpg, etc.)
2. Should show error message, not crash
3. Console should log specific error type
4. **Expected:** Graceful error handling
5. **Record:** ✅ PASS / ❌ FAIL + unhandled error

### Test 9.2 - AI API with Invalid/Missing Key
**Steps:**
1. Configure AI provider with invalid key: "invalid-key-12345"
2. Try tailoring resume
3. Should show API error message
4. Should not crash application
5. **Expected:** Error message displayed, app recovers
6. **Record:** ✅ PASS / ❌ FAIL + crash or hang

### Test 9.3 - Storage Quota Exceeded
**Steps:**
1. In Console, add large amounts of data to localStorage:
   ```javascript
   for (let i = 0; i < 100; i++) {
     window.StorageManager.set(`test_${i}`, 'x'.repeat(1000000));
   }
   ```
2. Try uploading resume (large file)
3. Should handle quota error gracefully
4. **Expected:** QuotaExceededError caught and reported
5. **Record:** ✅ PASS / ❌ FAIL + uncaught exception

### Test 9.4 - Concurrent Operations
**Steps:**
1. Trigger multiple operations simultaneously:
   - Upload resume
   - Start portfolio generation
   - Add job tracker entry
2. Monitor Console for race conditions
3. Should all complete without conflicts
4. **Expected:** Operations complete without data corruption
5. **Record:** ✅ PASS / ❌ FAIL + conflict error

---

## TEST GROUP 10: Performance & Browser Compatibility

### Test 10.1 - Page Load Time
**Steps:**
1. Open DevTools → Performance tab
2. Reload page (Ctrl+F5)
3. Record metrics:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
4. All should be < 2 seconds
5. **Expected:** < 2s load time
6. **Record:** ✅ PASS / ❌ FAIL + load time: X seconds

### Test 10.2 - Module Loading Waterfall
**Steps:**
1. DevTools → Network tab
2. Reload page
3. Check all 12 core .js files load successfully
4. Verify no failed requests (status 200)
5. Record total time to load all modules
6. **Expected:** All files 200 OK, loaded sequentially
7. **Record:** ✅ PASS / ❌ FAIL + slow/missing file

### Test 10.3 - Memory Usage
**Steps:**
1. DevTools → Memory tab
2. Take heap snapshot on fresh page load
3. Perform 10 operations (resume upload, portfolio generation, etc.)
4. Take second heap snapshot
5. Compare memory growth
6. Should not exceed 100 MB additional
7. **Expected:** Reasonable memory usage, no leaks
8. **Record:** ✅ PASS / ❌ FAIL + memory: X MB

### Test 10.4 - Browser Compatibility
**Steps:**
1. Test on Chrome → Record results
2. Test on Edge → Record results
3. Test on Firefox (if available) → Record results
4. Each browser should pass Tests 2.1 (Page Load), 1.1 (StorageManager), 6.2 (Portfolio Gen)
5. **Expected:** Works on major browsers
6. **Record:** ✅ PASS per browser

---

## TEST GROUP 11: CDN & External Dependencies

### Test 11.1 - CDN Resource Loading
**Steps:**
1. DevTools → Network tab
2. Filter by type: XHR, Script
3. Reload page
4. Check all CDN loads:
   - PDF.js (v3.11.174)
   - docx.js (v8.5.0)
   - pdfkit (v0.13.0)
   - JSZip (v3.10.1)
   - HTML2PDF (v0.10.1)
   - jsPDF (v2.5.1)
   - Google Fonts (Inter)
5. **Known Issue:** pdfkit and docx.js may return MIME type error (text/html instead of application/javascript)
6. **Expected:** All load (MIME errors noted but don't block)
7. **Record:** ✅ PASS / ❌ FAIL + failed CDN

### Test 11.2 - Font Loading (Google Fonts)
**Steps:**
1. DevTools → Network tab
2. Filter: font
3. Reload page
4. Verify "Inter" font loads from Google Fonts
5. Check page rendering uses Inter font
6. **Expected:** Font loads and applies
7. **Record:** ✅ PASS / ❌ FAIL + font not loading

---

## Known Issues & Workarounds

| Issue | Severity | Workaround | Status |
|-------|----------|-----------|--------|
| pdfkit MIME type error | Medium | Use jsPDF instead for PDF generation | Identified, needs fix |
| docx.js MIME type error | Medium | Consider local hosting or alternative CDN | Identified, needs fix |
| OAuth prompt() in automation | Low | Use console method or localStorage injection | Documented in Test 3.2 |
| GitHub Pages setup timing | Low | Wait 1-2 minutes for DNS propagation | Known GitHub behavior |

---

## Testing Checklist - Quick Summary

- [ ] Module Status (Test 1.1-1.3) → All modules load correctly
- [ ] UI & Navigation (Test 2.1-2.3) → Page renders, buttons respond
- [ ] OAuth Flow (Test 3.1-3.3) → GitHub authentication works
- [ ] Resume Upload (Test 4.1-4.3) → PDFs parse, data extracts
- [ ] AI Integration (Test 5.1-5.3) → Providers configure, API calls work
- [ ] Portfolio Generation (Test 6.1-6.3) → Templates load, HTML generates
- [ ] Job Tracker (Test 7.1-7.3) → Data persists, entries tracked
- [ ] GitHub Integration (Test 8.1-8.4) → Repos create, files upload
- [ ] Error Handling (Test 9.1-9.4) → Graceful failures
- [ ] Performance (Test 10.1-10.4) → Fast load, reasonable memory
- [ ] CDN Dependencies (Test 11.1-11.2) → External resources load

---

## How to Run Tests

### Option A: Manual Testing (Interactive)
1. Open application in browser: `file:///C:/rdammala/resume-engine-pro/index.html`
2. Follow each test step in sequence
3. Record results in "Record" field (✅ PASS / ❌ FAIL)
4. Note any errors or unexpected behavior

### Option B: Automated Testing (Console Script)
Create a test script in DevTools Console and run:
```javascript
// Example automation for Test 1.1
const tests = [];
tests.push({
  name: "StorageManager Load",
  test: () => Object.keys(window.StorageManager).length === 23,
  status: Object.keys(window.StorageManager).length === 23 ? "✅ PASS" : "❌ FAIL"
});
console.table(tests);
```

### Option C: Git Integration (CI/CD Ready)
After manual testing, document all results in PHASE2-TEST-RESULTS.md:
```bash
git add PHASE2-TEST-PLAN.md PHASE2-TEST-RESULTS.md
git commit -m "Phase 2 testing: Full feature validation complete"
git push origin master
```

---

## Next Steps After Testing

1. **If all tests PASS:** Move to Phase 3 (Production deployment, GitHub Pages)
2. **If some tests FAIL:** 
   - Document failures in PHASE2-TEST-RESULTS.md
   - Create GitHub issues for each failure
   - Fix issues in order of severity
   - Re-run failed tests
3. **If BLOCKED by CDN issues:** 
   - Resolve pdfkit/docx.js MIME types first
   - Consider local file hosting or alternative CDN
   - Test resume parsing alternatives

---

**Document Last Updated:** 2026-06-21  
**Prepared for:** User Resume Engine Pro Testing  
**Estimated Test Time:** 2-4 hours (depending on parallel execution)
