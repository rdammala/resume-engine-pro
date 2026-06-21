# Resume Engine Pro - Complete Documentation

## 🚀 Overview

Resume Engine Pro is a comprehensive, browser-based resume and portfolio generation platform that runs entirely on your device. It leverages GitHub for storage and supports multiple AI providers for intelligent resume tailoring.

**Key Features:**
- ✅ Upload and parse existing resumes (PDF, DOCX, TXT)
- ✅ Intelligent AI-powered resume tailoring for job descriptions
- ✅ Multi-AI provider support (OpenAI, Claude, Gemini, Mistral, Ollama)
- ✅ Bulk resume generation (5+ at once)
- ✅ Beautiful portfolio website templates
- ✅ GitHub-based storage (no external cloud costs)
- ✅ Real-time cost estimation
- ✅ Complete privacy control
- ✅ Works offline

## 📚 Learning Hub

**Interactive development documentation for Resume Engine Pro**

👉 **[Visit the Learning Hub](https://rdammala.github.io/resume-engine-pro/learning-hub/INDEX.html)**

The Learning Hub is an interactive guide documenting the design decisions, bugs, and architectural patterns behind Resume Engine Pro. Explore 7 role-specific perspectives (SRE, DevOps, Build Engineer, Test Engineer, Release Manager) and track the resolution of 8 critical bugs with complete root cause analysis and lessons learned.

- **Bug Tracking:** 8 bugs documented with severity, status, and resolution details
- **Role Perspectives:** 500+ words each on SRE, DevOps, Build, Test, and Release Management
- **Live Link:** https://rdammala.github.io/resume-engine-pro/learning-hub/INDEX.html
- **Repository:** [learning-hub/](./learning-hub/) folder in this repository

## 📋 Architecture

### Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Pure client-side (no backend required)
- Responsive design (mobile, tablet, desktop)

**External Libraries:**
- **Octokit.js** - GitHub API client
- **pdf.js** - PDF parsing and extraction
- **JSZip** - DOCX file parsing
- **docx.js** - DOCX file generation
- **PDFKit** - PDF generation

**Data Storage:**
- **Browser LocalStorage** - Local data cache (5-10MB)
- **GitHub Repository** - Primary persistent storage (private by default)

**AI Providers:**
- OpenAI (GPT-4)
- Anthropic (Claude)
- Google Gemini
- Mistral AI
- Ollama (local, free)

### Project Structure

```
resume-engine-pro/
├── index.html          # Main UI (all 7 phases)
├── style.css           # Complete styling
├── script.js           # Main orchestration
├── core/
│   ├── storage-manager.js      # LocalStorage operations
│   ├── github-manager.js       # GitHub API integration
│   ├── profile-manager.js      # Resume profile management
│   ├── resume-parser.js        # PDF/DOCX/TXT parsing
│   ├── ai-integration.js       # Multi-AI provider abstraction
│   ├── cost-calculator.js      # Real-time cost estimation
│   ├── generator.js            # Document generation
│   └── portfolio-templates.js  # Portfolio design templates
├── README.md           # This file
└── .github/
    └── workflows/      # CI/CD (future)
```

## 🔧 Setup Instructions

### 1. Prerequisites

- Modern web browser (Chrome, Edge, Safari, Firefox)
- GitHub account with Personal Access Token

### 2. GitHub Personal Access Token

1. Go to GitHub Settings → Developer Settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (full control of private repositories)
   - `user` (read user profile data)
4. Copy the token (you'll need this)

### 3. Local Setup

**Option A: Direct File System**
```bash
# Clone or download the repository
git clone https://github.com/rdammala/resume-engine-pro.git
cd resume-engine-pro

# Open in browser
open index.html
# or right-click → Open with Browser
```

**Option B: Local Development Server** (recommended)
```bash
# Start a simple HTTP server
python -m http.server 8000

# Or with Node.js
npx http-server

# Visit: http://localhost:8000
```

### 4. First-Time Login

1. Click "Sign in with GitHub"
2. Paste your Personal Access Token
3. Authorize the app
4. App creates `/resume-engine-data` repository automatically

## 📖 Usage Guide

### Phase 1: Import Resumes

**Manual Entry:**
1. Go to "My Profiles" tab
2. Click "Create Profile"
3. Fill in your information
4. Save

**File Upload:**
1. Go to "My Profiles" tab
2. Click "Upload Resume"
3. Select PDF, DOCX, or TXT file
4. App automatically extracts:
   - Name, email, phone
   - Experience, education
   - Skills, certifications
   - Languages

### Phase 2: Tailor for Specific Jobs

**Single Resume Mode:**
1. Select a profile from "My Profiles"
2. Go to "Generate" tab
3. Paste job description into JD field
4. Choose AI provider and mode (fast/smart/ultra)
5. Review cost estimate
6. Click "Generate"
7. Download as DOCX or PDF

**Bulk Generation Mode:**
1. Same steps as single mode
2. Select "Bulk Mode"
3. Enter number of resumes
4. Generate multiple at once
5. Download all as ZIP

### Phase 3: AI Provider Configuration

**Connect Providers:**
1. Go to "Settings" tab
2. For each AI provider you want to use:
   - Get API key from provider's dashboard
   - Paste into the field
   - Click "Save"

**Cost Comparison:**
- Real-time cost display shows estimated cost per resume
- Toggle between modes to compare pricing
- AI Integration shows which providers are configured

### Phase 4: Generate Output

**Formats Supported:**
- **DOCX** - Microsoft Word format (editable)
- **PDF** - Universal format (ready to share)
- **Markdown** - Job details for reference
- **HTML** - Portfolio website

**Generation Options:**
- Fast mode: ~500 tokens, $0.002-0.015
- Smart mode: ~1500 tokens, $0.005-0.06
- Ultra mode: ~2500 tokens, $0.012-0.15

### Phase 5: Portfolio Creation

1. Go to "Generate" tab
2. Select "Portfolio Template"
3. Choose design:
   - Minimalist (clean, elegant)
   - Executive (professional)
   - Creative (bold, artistic)
   - Tech (developer-focused)
   - Startup (dynamic)
4. Click "Deploy to GitHub"
5. Portfolio goes live at: `https://github.com/[username]/[PortfolioName]`

### Phase 6: Bulk Operations

**Generate 5+ Resumes:**
1. Upload multiple profiles
2. Go to "Generate" → "Bulk Mode"
3. Select profiles
4. Single JD applies to all
5. Resumes tailored individually
6. Download all at once

**Batch Portfolio Updates:**
1. Select multiple templates
2. Click "Batch Deploy"
3. All deploy to GitHub simultaneously

### Phase 7: Advanced Features

**Resume Analysis:**
- ATS Scoring (how well your resume matches ATS systems)
- Keyword matching report
- Formatting recommendations

**Recruiter LinkedIn Analysis:**
- Analyze recruiter profiles
- Generate personalized outreach
- Identify decision makers

## 💰 Cost Breakdown

### Per-Resume Cost by Provider & Mode

| Provider | Fast | Smart | Ultra |
|----------|------|-------|-------|
| OpenAI   | $0.015 | $0.03 | $0.06 |
| Claude   | $0.002 | $0.005 | $0.012 |
| Gemini   | $0.003 | $0.0075 | $0.015 |
| Mistral  | $0.0005 | $0.002 | $0.005 |
| Ollama   | $0.000 | $0.000 | $0.000 |

### Bulk Savings Example

Generate 50 resumes with Claude Smart mode:
- Per resume: $0.005
- Total: $0.25
- Saves vs OpenAI: $1.45

## 🔐 Privacy & Security

**Data Stored Locally:**
- Resumes cached in browser LocalStorage
- API keys encrypted before storage
- Can export/backup anytime

**Data in GitHub:**
- Data repository is PRIVATE by default
- Only you can access your resume data
- Portfolio repos can be PUBLIC (you control)

**Never Stored Elsewhere:**
- No third-party cloud storage
- No external databases
- No telemetry or tracking

## 🐛 Troubleshooting

### Issue: "Unsupported file format"
**Solution:** Convert resume to PDF first, then upload

### Issue: "API rate limit exceeded"
**Solution:** Wait 1 hour or use different AI provider (Mistral/Claude cheaper)

### Issue: Resume not parsing correctly
**Solution:** 
- Try uploading as plain text instead
- Ensure resume has standard formatting
- Check that all sections are clearly labeled

### Issue: GitHub authentication fails
**Solution:**
- Verify Personal Access Token hasn't expired
- Ensure you have `repo` scope selected
- Try regenerating token and re-authenticating

### Issue: Portfolio not deploying
**Solution:**
- Check GitHub repo isn't at 100GB limit
- Ensure GitHub Pages is enabled in repo settings
- Wait 1-2 minutes for GitHub to process

## 📚 API Integration Guide

### Adding New AI Provider

1. Edit `core/ai-integration.js`
2. Add to `providers` object:
```javascript
newprovider: {
    name: 'Provider Name',
    endpoint: 'https://api.provider.com/endpoint',
    model: 'model-name',
    costs: { input: 0.001, output: 0.002 },
    modes: { fast: {...}, smart: {...}, ultra: {...} }
}
```
3. Add `tailorWithNewProvider` method
4. Update switch statement in `tailorResume`

### Extending Storage

1. Edit `core/storage-manager.js`
2. Add new methods for custom data types
3. Use `set()` and `get()` for persistence

## 📦 Export & Backup

**Export All Data:**
1. Go to Settings
2. Click "Export Data"
3. Saves JSON file locally

**Import Data:**
1. Go to Settings
2. Click "Import Data"
3. Select previously exported JSON file

## 🚀 Deployment

### Option 1: GitHub Pages (Recommended)

```bash
# Repository must be public for Pages
git push origin main

# Enable in repo settings:
# Settings → Pages → Source: main branch
```

Live at: `https://rdammala.github.io/resume-engine-pro/`

### Option 2: Deploy to Any Static Host

- Netlify: Drag & drop folder
- Vercel: Connect GitHub repo
- AWS S3: Upload files via CLI
- Cloudflare Pages: Connect GitHub

## 🤝 Contributing

To contribute improvements:
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - Use freely, modify as needed

## 🆘 Support

For issues or questions:
1. Check Troubleshooting section above
2. Review GitHub Issues
3. Create new issue with details
4. Include: browser, OS, error messages

## 🗺️ Roadmap

**Coming Soon:**
- [ ] Interview preparation mode
- [ ] ATS scoring engine
- [ ] Recruiter outreach assistant
- [ ] Resume version control
- [ ] Collaborative editing
- [ ] Mobile app (React Native)
- [ ] LinkedIn direct import
- [ ] Job board integration

## 📞 Contact

- GitHub: [@rdammala](https://github.com/rdammala)
- Email: See GitHub profile
- LinkedIn: [Rajesh Dammala](https://linkedin.com/in/rajesh-dammala)

---

**Last Updated:** 2026-06-20
**Version:** 1.0.0
**Status:** Production Ready
