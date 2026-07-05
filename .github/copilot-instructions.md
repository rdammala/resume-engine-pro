# Copilot / AI assistant instructions — Resume Engine Pro

**Before you change or add anything, read [`/RESUME-HERE.md`](../RESUME-HERE.md) first.**
It is the full project history: what exists, why it is built this way, the gotchas that will
bite you, and the standing rules. Also skim the public [Learning Hub](../learning-hub/INDEX.html).

## Non-negotiables
- **No backend database for user data — ever.** This is a privacy-first, backendless-by-design
  static site (pure HTML/CSS/JS). User resumes, profiles, history, and API keys live only in the
  user's browser (localStorage) and in the user's own GitHub account. The only server component is
  a thin Cloudflare Worker that proxies a public job-search term + city (never user data).
- **Never accept or hardcode API keys.** Secrets are set by the user via `wrangler secret put`.
- **Validate JS with `node --check script.js`** (and any changed `core/*.js`) before committing —
  the editor can miss a paren error that breaks the whole app and kills login.
- `learning-hub/bugs-data.js` and `features-data.js` use single-quoted strings — avoid apostrophes.

## Standing directive
After ANY change/fix/feature, add a matching Learning Hub entry (`bugs-data.js` or
`features-data.js`) and bump the counts in `learning-hub/INDEX.html` (overview line + footer line)
in the same commit. Treat this as part of "done".

## Deploy
Every push to `master` auto-deploys to https://rdammala.com via Cloudflare Git integration.
