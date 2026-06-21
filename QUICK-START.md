# 🚀 Resume Engine Pro - Quick Start (5 minutes)

## Step 1: Get Your GitHub Token (2 min)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: `resume-engine-pro`
4. Check:
   - ☑️ `repo` (allows private repo access)
   - ☑️ `user` (reads your profile)
5. Click "Generate token"
6. **Copy the token** (you'll only see it once!)

## Step 2: Open Resume Engine Pro (1 min)

**Option A - Online (Recommended):**
- Visit: https://rdammala.github.io/resume-engine-pro/

**Option B - Local File:**
- Download: `index.html` and save locally
- Double-click to open in browser

**Option C - Local Server:**
```bash
# In the folder with index.html
python -m http.server 8000
# Visit: http://localhost:8000
```

## Step 3: Login & Setup (2 min)

1. Click **"Sign in with GitHub"**
2. Paste your Personal Access Token
3. Click **"Authorize"**
4. App automatically creates `resume-engine-data` repo

✅ **You're ready!**

## Step 4: Generate Your First Resume (3 min)

### Quick Mode:

1. **Create Profile** (My Profiles tab)
   - Enter your name, email, phone
   - Add top 5 skills
   - Save

2. **Select AI Provider** (Settings tab)
   - Claude recommended (cheap + good)
   - Or use Mistral (cheapest)
   - Paste API key, click Save
   - [Get free Claude credits](https://console.anthropic.com)

3. **Generate Resume** (Generate tab)
   - Paste job description
   - Select "Smart" mode (best balance)
   - Click Generate ($0.005 cost shown)
   - Download as DOCX or PDF

### Advanced Mode:

**Upload Existing Resume:**
1. Go to "My Profiles"
2. Click "Upload Resume"
3. Select PDF/DOCX/TXT file
4. App extracts everything automatically
5. Follow Step 4 above

**Bulk Generation:**
1. Go to "Generate" → "Bulk Mode"
2. Enter 5-50 resumes
3. Single job description applies to all
4. Download all at once

## Common AI Providers Setup

### Claude (Recommended ⭐)
```
1. Visit: https://console.anthropic.com
2. Click "API Keys"
3. Create new key
4. Get $5 free credits
5. Paste in Resume Engine Pro
```

### Mistral (Cheapest)
```
1. Visit: https://console.mistral.ai
2. Sign up free
3. Create API key
4. Get $5 free credits
5. Paste in Resume Engine Pro
```

### Ollama (Free, Local)
```
1. Download: https://ollama.ai
2. Run: ollama run neural-chat
3. No API key needed
4. Runs on your computer only
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Generate Resume | Ctrl+Enter |
| Download DOCX | Ctrl+D |
| Export Data | Ctrl+E |
| Settings | Ctrl+, |

## First Resume Checklist

- ✅ GitHub login works
- ✅ AI provider configured
- ✅ Profile created (or uploaded)
- ✅ Job description added
- ✅ Cost shown correctly
- ✅ Resume generated
- ✅ Downloaded successfully

## Next Steps

1. **Create Portfolio** → Portfolio tab
2. **Generate for 3+ jobs** → Compare AI quality
3. **Try bulk mode** → Generate 10+ at once
4. **Save to GitHub** → Settings → Auto-save

## Pricing Reality

**For 10 Job Applications:**
- Claude: $0.05
- Mistral: $0.02
- Ollama: $0.00 (free)
- OpenAI: $0.30

**Get Free Credits:**
- OpenAI: $5 (sign up)
- Claude: $5 (sign up)
- Gemini: $300/month free tier
- Mistral: $5 (sign up)

## Troubleshooting

**"API Key Invalid"**
- Check you copied entire key (no spaces)
- Verify key hasn't expired
- Ensure provider account active
- Try different provider

**"Resume won't generate"**
- Paste job description (not blank)
- Select valid profile
- Try "Fast" mode first
- Check browser console (F12)

**"Can't upload resume"**
- Use PDF format first
- Check file isn't corrupted
- Try plain text format
- File size < 10MB

**"GitHub login fails"**
- Token hasn't expired
- Check you have `repo` scope
- Try regenerating token
- Clear browser cache

## FAQ

**Q: Is my data private?**
A: Yes! Data stored in private GitHub repo. Only you can access.

**Q: Can I use offline?**
A: Yes, with Ollama (free local AI). No internet needed.

**Q: How much does it cost?**
A: $0.002 - $0.06 per resume (depending on provider). Free with Ollama.

**Q: Can I generate 100 resumes?**
A: Yes! But costs would be $0.20 - $6.00. Use Mistral/Ollama to save.

**Q: Does it work on mobile?**
A: Yes! Responsive design. Upload/download works on phones.

**Q: Can I share portfolios?**
A: Yes! Portfolio repos are public. Share GitHub Pages link.

## Pro Tips

1. **Test first** - Generate one resume before bulk
2. **Compare modes** - Try Fast vs Smart to see quality difference
3. **Use credit wisely** - Save free credits for important jobs
4. **Portfolio first** - Generate portfolio before applying
5. **Batch process** - Generate 5+ at once (cheaper per unit)
6. **Archive resumes** - Go to History tab to redownload
7. **Backup data** - Settings → Export to save everything

## Support

- 📖 Full docs: README.md
- ⚙️ Config help: CONFIGURATION.md
- 🐛 Troubleshooting: See README.md
- 💬 Questions: GitHub Issues

---

**Ready?** Open [Resume Engine Pro](https://rdammala.github.io/resume-engine-pro/) and get started!

**Estimated Time:** 5 minutes ⏱️
