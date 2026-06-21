# Resume Engine Pro Configuration

This file stores configuration for Resume Engine Pro.

## GitHub Setup

Create a `resume-engine-data` repository (or use your preferred name):

```bash
gh repo create resume-engine-data --private --description "Resume Engine Pro - Resume data, profiles, and generated files"
```

## API Keys Setup

### OpenAI
- Endpoint: https://api.openai.com/v1
- Model: gpt-4
- Get key: https://platform.openai.com/api-keys
- Cost: High ($0.03 per smart mode resume)

### Claude (Anthropic)
- Endpoint: https://api.anthropic.com/v1
- Model: claude-3-sonnet-20240229
- Get key: https://console.anthropic.com
- Cost: Medium ($0.005 per smart mode resume) ⭐ **RECOMMENDED**

### Google Gemini
- Endpoint: https://generativelanguage.googleapis.com/v1beta
- Model: gemini-pro
- Get key: https://ai.google.dev/
- Cost: Low ($0.0075 per smart mode resume)

### Mistral AI
- Endpoint: https://api.mistral.ai/v1
- Model: mistral-large-latest
- Get key: https://console.mistral.ai
- Cost: Very Low ($0.002 per smart mode resume) ⭐ **CHEAPEST**

### Ollama (Local)
- Endpoint: http://localhost:11434
- Model: llama2, neural-chat, or custom
- Get key: None (runs locally)
- Cost: Free ($0.000)

## GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click: Generate new token (classic)
3. Select scopes:
   - ✅ repo (full control)
   - ✅ user (read profile)
4. Copy and keep safe

## Recommended Setup

**For Best Results:**
1. Primary: Claude (balanced cost/quality)
2. Backup: Mistral (cheapest)
3. Occasional: OpenAI (best quality)
4. Local: Ollama (free, offline)

**Estimated Monthly Cost (100 resumes/month):**
- OpenAI: $3.00
- Claude: $0.50 ⭐ **BEST VALUE**
- Gemini: $0.75
- Mistral: $0.20
- Ollama: $0.00

## Environment Variables (for advanced setup)

```env
# GitHub
GITHUB_TOKEN=your_token_here

# AI Providers
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
MISTRAL_API_KEY=your_key_here

# Data Repository
DATA_REPO_NAME=resume-engine-data
DATA_REPO_PRIVATE=true
```

## File Structure in Data Repository

```
resume-engine-data/
├── profiles/
│   ├── rajesh-profile.json
│   └── sample-profile.json
├── generated/
│   ├── 2026-06-20/
│   │   ├── Google_SRE_Resume.docx
│   │   ├── Google_CoverLetter.docx
│   │   └── job-details.md
│   └── 2026-06-21/
├── portfolios/
│   ├── Senior-Manager-SRE/
│   └── Technical-Lead-DevOps/
└── README.md
```

## Security Notes

1. **API Keys**: Never commit to version control
2. **GitHub Token**: Keep personal - don't share
3. **Data**: Use private GitHub repo for resume data
4. **Encryption**: Keys encrypted in browser storage
5. **HTTPS**: Always use HTTPS in production

## Testing

### Local Testing
```bash
# Start local server
python -m http.server 8000

# Visit
http://localhost:8000
```

### Test with Real Data
1. Upload sample resume
2. Configure one AI provider
3. Generate single resume
4. Verify output quality
5. Check cost accuracy

### Browser Compatibility
- ✅ Chrome/Chromium (best)
- ✅ Edge
- ✅ Safari
- ✅ Firefox
- ⚠️ IE11 (not supported)

## Maintenance

### Regular Tasks
- Review generated resume samples
- Update profile library quarterly
- Check AI provider pricing changes
- Monitor GitHub storage usage
- Test portfolio deployments

### Backup
- Export data regularly: Settings → Export
- Store exports in secure location
- Backup GitHub repos periodically

## Troubleshooting Checklist

- [ ] GitHub token valid and not expired
- [ ] At least one AI provider configured
- [ ] Data repo is private for security
- [ ] LocalStorage not full (check browser settings)
- [ ] JavaScript enabled in browser
- [ ] Cookies/LocalStorage not being cleared
- [ ] Using modern browser (not IE11)
- [ ] API rate limits not exceeded
