# DevOps Perspective: Resume Engine Web Application Development

**Date:** 2026-06-21 | **Scope:** Infrastructure, Deployment, CI/CD, Configuration  
**Role Focus:** Infrastructure automation, deployment pipelines, environment management, configuration as code

---

## Executive Summary

This document captures the DevOps perspective on Resume Engine Pro development, focusing on:
- Infrastructure setup and management
- Deployment automation and GitHub Pages publishing
- Configuration management and secrets handling
- CI/CD pipeline requirements
- Environment consistency and reproducibility

---

## Infrastructure Architecture (DevOps View)

### Current Deployment Topology

```
Development Environment:
├── Local machine (Developer machine)
│   ├── Python HTTP server (localhost:8000)
│   ├── Node.js environment (for testing)
│   └── Git repository (c:\rdammala\resume-engine-pro)
│
Staging Environment:
├── GitHub branch: develop
├── Preview via gh-pages branch
└── Testing: Manual in browser

Production Environment:
├── GitHub repository: github.com/rdammala/resume-engine-pro
├── GitHub Pages: https://rdammala.github.io/resume-engine-pro/
├── Data repository: github.com/rdammala/resume-engine-data (private)
└── CI/CD: GitHub Actions (planned)

Data Layer:
├── Browser LocalStorage (ephemeral, dev machine only)
├── Private GitHub repo (resume-engine-data)
│   ├── /profiles/ - User profiles
│   ├── /generated/ - Generated documents
│   ├── /portfolios/ - Portfolio exports
│   └── /contacts/ - Application tracking
└── GitHub Pages for portfolio hosting
```

### Deployment Flow

```
Local Development
    ↓ (git add . && git commit)
GitHub Master Branch
    ↓ (GitHub Actions workflow - NEEDED)
Build & Test Stage
    ↓
Deploy to GitHub Pages
    ↓
Live at https://rdammala.github.io/resume-engine-pro/
```

---

## CI/CD Pipeline Requirements (DevOps)

### Current State: Manual Deployment
```bash
# Current workflow (manual, error-prone):
cd c:\rdammala\resume-engine-pro
git add -A
git commit -m "commit message"
git push origin master
```

### Recommended: Automated GitHub Actions Workflow

**File to Create:** `.github/workflows/deploy.yml`

```yaml
name: Deploy Resume Engine Pro

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate HTML
        run: |
          npx html-validate index.html
      
      - name: Lint JavaScript
        run: |
          npx eslint script.js core/*.js
      
      - name: Check CSS
        run: |
          npx stylelint style.css
      
      - name: Verify Module Load Order
        run: node scripts/verify-modules.js

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          cname: resume-engine-pro.dev
```

---

## Configuration Management (DevOps)

### Environment Variables

**Current State:** Hardcoded values (PROBLEMATIC)

```javascript
// Current approach (DON'T DO THIS):
const GITHUB_API_ENDPOINT = 'https://api.github.com';
const DATA_REPO_NAME = 'resume-engine-data';
const STORAGE_PREFIX = 'resumeEngineProV1_';
```

### Recommended: Environment-Based Configuration

**File Structure:**
```
config/
├── development.json
├── staging.json
├── production.json
└── secrets.vault (encrypted)
```

**Development Config:**
```json
{
  "environment": "development",
  "github": {
    "apiEndpoint": "https://api.github.com",
    "dataRepository": "resume-engine-data",
    "pagesBranch": "gh-pages",
    "owner": "rdammala"
  },
  "storage": {
    "prefix": "resumeEngineProV1_DEV_",
    "quota": 5242880
  },
  "ai": {
    "providers": ["claude", "openai", "gemini"],
    "defaultProvider": "claude"
  },
  "logging": {
    "level": "debug",
    "enableConsole": true
  }
}
```

**Production Config:**
```json
{
  "environment": "production",
  "github": {
    "apiEndpoint": "https://api.github.com",
    "dataRepository": "resume-engine-data",
    "pagesBranch": "gh-pages",
    "owner": "rdammala"
  },
  "storage": {
    "prefix": "resumeEngineProV1_",
    "quota": 5242880
  },
  "ai": {
    "providers": ["claude", "openai", "gemini", "mistral", "ollama"],
    "defaultProvider": "claude"
  },
  "logging": {
    "level": "error",
    "enableConsole": false,
    "sentryDSN": "https://...(secrets)"
  }
}
```

### Secrets Management

**Current Issue:** GitHub token stored in localStorage (acceptable for client-side, but should be short-lived)

**Recommended Approach:**
1. **OAuth Token:** Use GitHub OAuth App instead of personal tokens
2. **Token Rotation:** Implement 24-hour token expiry
3. **Vault Integration:** Store master secrets in GitHub encrypted secrets

**GitHub Secrets to Configure:**
```
GITHUB_OAUTH_CLIENT_ID=xxx
GITHUB_OAUTH_CLIENT_SECRET=xxx (DO NOT COMMIT)
SENTRY_DSN=xxx
ANALYTICS_KEY=xxx
```

---

## DevOps Incident Analysis

### Incident #1: Build Process Not Defined

**Problem:** No automated build, test, or validation pipeline  
**Impact:** Bugs ship directly to production; no validation before deployment  
**Root Cause:** Manual push workflow, no CI/CD gate  
**DevOps Fix:** Implement GitHub Actions workflow with:
- HTML/CSS/JS linting
- Module load order verification
- Security checks for hardcoded secrets
- Automated deploy on master push

### Incident #2: No Environment Parity

**Problem:** Development and production configurations identical  
**Impact:** Dev secrets leaked to production; feature flags not possible  
**Root Cause:** Environment-specific config not implemented  
**DevOps Fix:** Implement config.json pattern with environment-specific overrides

### Incident #3: Module Load Order Fragile

**Problem:** 12 scripts must load in exact sequence (undocumented)  
**Impact:** Reordering causes silent failures; hard to debug  
**Root Cause:** No dependency management system  
**DevOps Fix:** Implement module verification in CI pipeline

---

## Deployment Checklist (DevOps)

### Pre-Deployment

```yaml
□ Code Review
  - Security: No hardcoded credentials
  - Performance: No blocking operations
  - Testing: All major paths tested

□ Build Validation
  - HTML valid (html-validate)
  - JavaScript no syntax errors (node -c)
  - CSS valid (stylelint)
  - No console errors on load

□ Configuration
  - Correct API endpoints for environment
  - Feature flags set appropriately
  - Logging level appropriate

□ Data Integrity
  - No database migrations needed (static site)
  - GitHub API accessible
  - Data repository exists and accessible
```

### Deployment Steps

```bash
# 1. Verify code is ready
git status  # Should be clean

# 2. Run pre-deployment checks
npm run validate

# 3. Tag release (optional but recommended)
git tag -a v0.1.0 -m "Initial MVP release"

# 4. Push to master (triggers GitHub Actions)
git push origin master
git push origin v0.1.0

# 5. Monitor deployment
# Watch GitHub Actions tab for workflow completion

# 6. Verify production
curl -I https://rdammala.github.io/resume-engine-pro/
# Expected: 200 OK
```

### Post-Deployment

```yaml
□ Smoke Tests
  - Page loads without errors
  - Authentication works
  - Can view all tabs
  - No console errors

□ Monitoring
  - GitHub Pages returns 200
  - Assets loaded from CDN
  - No rate limiting from GitHub API

□ Rollback Plan
  - If critical issue: git revert + push
  - Estimated rollback time: 2 minutes
```

---

## Infrastructure as Code (DevOps)

### GitHub Actions Workflow (Recommended)

```yaml
name: Resume Engine CI/CD

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io

jobs:
  validate:
    runs-on: ubuntu-latest
    name: Validate Code Quality
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for commits
      
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: npm install --save-dev eslint stylelint html-validate
      
      - name: Lint JavaScript
        run: npx eslint script.js core/*.js
        continue-on-error: true
      
      - name: Lint CSS
        run: npx stylelint style.css
        continue-on-error: true
      
      - name: Validate HTML
        run: npx html-validate index.html
        continue-on-error: true
      
      - name: Node Syntax Check
        run: |
          node -c script.js
          for file in core/*.js; do
            node -c "$file"
          done

  security:
    runs-on: ubuntu-latest
    name: Security Checks
    steps:
      - uses: actions/checkout@v3
      
      - name: Check for hardcoded secrets
        run: |
          # Fail if credentials found
          ! grep -r "github_token\|GITHUB_TOKEN\|password" . --include="*.js" --include="*.html"
      
      - name: Dependency check
        uses: dependabot/fetch-metadata@v1

  deploy:
    needs: [validate, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          cname: resume-engine-pro.dev
      
      - name: Verify deployment
        run: |
          sleep 5
          curl -f https://rdammala.github.io/resume-engine-pro/ || exit 1
```

---

## Monitoring & Alerting (DevOps)

### Recommended Monitoring Stack

**Uptime Monitoring:**
```yaml
Service: Resume Engine Pro
URL: https://rdammala.github.io/resume-engine-pro/
Expected: 200 OK
Frequency: Every 5 minutes
Alert: Down for >15 minutes
Provider: UptimeRobot (free tier)
```

**GitHub Actions Status:**
- Monitor workflow failures in GitHub UI
- Set email notifications for deployment failures

**Error Tracking:**
- Implement Sentry integration
- Alert on >10 errors in 5 minutes
- Track error trends by type

---

## Disaster Recovery Plan (DevOps)

### Recovery Objectives

| Metric | Target | Approach |
|--------|--------|----------|
| RTO (Recovery Time Objective) | 5 minutes | Git revert + push |
| RPO (Recovery Point Objective) | 1 hour | Git history retained |
| Data Backup | All in GitHub | Private backup repo |

### Backup Strategy

```bash
# Automated backup (GitHub Actions weekly):
- Export all profiles to JSON
- Backup to private resume-engine-backups repo
- Retain 90 days of backups

# Manual backup:
git clone --mirror https://github.com/rdammala/resume-engine-pro.git
git clone --mirror https://github.com/rdammala/resume-engine-data.git
```

### Rollback Procedure

```bash
# Identify bad commit
git log --oneline | head -5

# Revert (creates new commit)
git revert <bad-commit-hash>
git push origin master

# OR force reset to known good state
git reset --hard <good-commit-hash>
git push origin master --force

# Verify rollback
curl https://rdammala.github.io/resume-engine-pro/
```

---

## DevOps Recommendations

### Immediate (Pre-Launch)
- [ ] Implement GitHub Actions workflow
- [ ] Set up GitHub secrets for sensitive data
- [ ] Add pre-commit hooks for linting
- [ ] Document deployment procedures

### Month 1
- [ ] Implement uptime monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Create runbooks for common issues
- [ ] Add performance monitoring

### Month 2+
- [ ] Implement feature flags system
- [ ] Set up canary deployment strategy
- [ ] Implement Infrastructure as Code for GitHub repos
- [ ] Automate backup and recovery procedures

---

## Interview Q&A (DevOps Perspective)

**Q: How would you set up CI/CD for this project?**  
A: Implement GitHub Actions workflow with three stages: validate (linting, syntax checks), security (hardcoded secret detection), and deploy (push to GitHub Pages). This ensures no bad code reaches production, failures are caught early, and rollback is a simple git revert.

**Q: What's your approach to managing secrets in a browser application?**  
A: Store user-provided tokens (GitHub PAT) in localStorage with short TTL, use GitHub OAuth instead of PAT for production, implement GitHub encrypted secrets for CI/CD credentials. Never commit secrets, use .gitignore for config files.

**Q: How would you handle deployment to multiple environments?**  
A: Use environment-specific config files (dev/staging/prod), environment variables in GitHub Actions, and separate branches for each environment. For this app: develop branch for staging (GitHub Pages preview), master for production.

**Q: What's your disaster recovery plan?**  
A: All code and data in GitHub with full history. Rollback via `git revert` (creates new commit, preserves history) or `git reset --hard` (for emergency). RTO: 5 minutes. RPO: 1 hour (based on commit frequency).

**Q: How do you ensure code quality before deployment?**  
A: Pre-commit hooks for linting, CI pipeline with automated tests, security scans for hardcoded credentials, and manual code review before merge. Fail fast, fail early.

---

## Lessons Learned (DevOps)

✅ **What Worked:**
- GitHub Pages for free hosting (zero ops)
- git-based deployment (simple, reversible)
- Single code repository (easy to manage)

❌ **What Didn't:**
- No automated validation (bugs slipped through)
- Manual deployment (error-prone, slow)
- No environment separation (dev/prod identical)

🔄 **What To Improve:**
- Implement CI/CD pipeline ASAP
- Use infrastructure-as-code for all configs
- Separate secrets from code
- Add automated health checks

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-21  
**DevOps Owner:** DevOps Engineering Team  
**Related:** SRE-PERSPECTIVE.md, BUILD-ENGINEER-PERSPECTIVE.md
