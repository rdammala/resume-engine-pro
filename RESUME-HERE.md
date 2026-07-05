# Resume Engine Pro — Project History & AI Context ("RESUME HERE")

**This is the living memory of the project. Read it first.**

**If you are a human:** this is the honest running log of how Resume Engine Pro was built —
every feature, the gotchas we hit, the architecture, and the rules we hold ourselves to. It
pairs with the public [Learning Hub](learning-hub/INDEX.html) — where we lay our bugs and fixes
open so you can learn from our mistakes and tell your own story in your interviews.

**If you are an AI assistant helping Rajesh:** READ THIS ENTIRE FILE BEFORE CHANGING ANYTHING.
It tells you what exists, why it is built this way, what breaks, and the non-negotiables — chief
among them: **this is a NO-BACKEND, privacy-first static site. Never add a database for user
data.** User data lives only in the user's browser and their own GitHub account. When the user
says "pick up from where we left", restate the current state and the top pending item, then ASK
"do you want me to go ahead?" before proceeding.

---

## ✅ DONE 2026-07-03 — LANDING PAGE redesign (trigger word "Inspire" — task complete)
- Rebuilt #loginPage in index.html into a full marketing landing (sleek premium dark, "surprise me" vibe):
  animated gradient hero + value prop, 4-card value strip, 3-step how-it-works, a "why GitHub sign-in is safe"
  trust section (reframes token ask as the benefit), final CTA. Removed the 3 visible DEBUG buttons.
- New scoped CSS layer `.lp-*` appended in style.css (orbs/lpFloat, lpUp entrance anim, hover-lift cards,
  step badges, trust grid, final CTA) + light-theme overrides + prefers-reduced-motion guard.
- Kept auth hooks untouched (initiateGitHubLogin, openHelp) → zero JS change, anti-flash boot still works.
- Logged as Learning Hub feature #25; bumped feature count 24→25 in learning-hub/INDEX.html (2 spots).
- Committed + pushed to master (auto-deploys to rdammala.com via Cloudflare Worker + GitHub Pages).
- If user wants iteration: tweak copy/vibe in #loginPage markup + .lp-* CSS; may add IntersectionObserver
  scroll-reveal later (currently CSS-only entrance anims to keep JS risk zero).

## ✅ DONE 2026-07-03 — Contact channel + looping walkthrough animation (follow-ups)
- CONTACT: chose GitHub Issues (no email inbox). Footer links (Report a bug / Request a feature / Source) shown
  app-wide; landing "Tell us on GitHub" line; Settings-menu "Send feedback". All → /issues/new/choose.
  Added .github/ISSUE_TEMPLATE/{bug_report.yml,feature_request.yml,config.yml} (issue FORMS; blank_issues off;
  contact_links to Help + Learning Hub). Forms render only from default branch master (now live). Logged feature #26.
- WALKTHROUGH: pure-CSS looping storyboard in the gap above the final CTA (.lp-demo). 4 scenes on ONE shared 32s
  keyframe lpSceneCycle with animation-delay 0/8/16/24s (seamless loop, ZERO JS): (1) click Sign in, (2) GitHub
  Generate new token classic, (3) scopes repo/gist/user tick in via lpCheckA/B/C, (4) take the 60s tour (chips
  lpChip1/2/3 + bobbing Rae coach). Progress dots lpPg. prefers-reduced-motion → hides .lp-demo, shows static ol.
  Light-theme overrides added. Logged feature #27. Feature count now 27 (bumped in learning-hub/INDEX.html 2 spots).
- GOTCHA this session: a git pull --rebase + push chain HUNG on push in one terminal (commit made, stayed
  "ahead 1"). Fix: verify with git status -sb / git rev-parse HEAD in a fresh terminal, re-run git push. All synced.
- Local preview that WORKED: py -m http.server 8891 binds IPv6 only → open http://localhost:8891 (NOT 127.0.0.1).

## ✅ DONE 2026-07-03 — JOB SEARCH tab (new feature, MVP shipped)
- User idea: skip LinkedIn/Indeed noise, pull jobs DIRECT from company career systems; law-abiding, no spam,
  no contact harvesting, no auto-messaging. Rejected scraping/Apify/LinkedIn (CORS + cost + ToS + GDPR).
  Lawful core = public CORS-enabled ATS JSON feeds a static site CAN read.
- NEW core/job-search.js (window.JobSearch.init) — self-contained module. Providers: **Greenhouse**
  (boards-api.greenhouse.io/v1/boards/{token}/jobs?content=false) + **Ashby**
  (api.ashbyhq.com/posting-api/job-board/{token}). GOTCHA: **Lever open API is DEAD/gated** (30+ tokens all
  404 post-acquisition) — swapped to Ashby which tested clean. ALWAYS live-test ATS tokens before seeding.
- Seed (all live-tested): 14 Greenhouse (stripe, databricks, coinbase, robinhood, dropbox, airbnb, gitlab,
  reddit, cloudflare, discord, figma, lyft, brex, datadog, pinterest, twitch) + 4 Ashby (openai, notion, ramp,
  cohere). plaid+doordash 404'd → replaced with lyft+datadog. Users add own via ATS+board-token (localStorage
  key resumeEngineProV1_jobSearchCompanies).
- Filters: keyword (title), location (substring), posted-within 3/7/30/any (postedMs cutoff), newest-first.
  Company chips toggle (selected = searched; none selected = all). Save → JobTrackerManager.addApplication
  ({company, role, link, date, status:'Interested', comments}) into user's GitHub-backed tracker.
- Wiring: new main tab button '🔎 Job Search' in index.html main-tabs; #jobsearch content div w/ #jobSearchRoot;
  added 'jobsearch' to boot VALID array; script.js switchMainTab hook calls JobSearch.init(); core/job-search.js
  script tag added. Styles .js-* appended in style.css + light-theme overrides. node --check clean, committed+pushed
  master (auto-deploys rdammala.com). Logged Learning Hub feature #28 (count→28).

## ✅ DONE 2026-07-03 — JOB SEARCH v2 (autocomplete + vicinity + partnerships + tour fix)
- CITY AUTOCOMPLETE: free Photon geocoder (photon.komoot.io/api?q=..&limit=6&lang=en) — no key, CORS-enabled,
  returns properties {name,state,country,type}. Debounced 220ms input listener on #jsLocation renders a
  dropdown (#jsAcList); exclude type house/street; pick stores _locSel={city,state,country,label}.
- VICINITY MATCH: when input still == picked label, job matches if location contains city OR state OR country
  (locTerms OR set); free-typed text = plain substring (old behavior). In runSearch filter.
- PARTNERSHIP TRACKER (#jsPn*): localStorage 'resumeEngineProV1_partnerships', table org/works-with/area/source,
  filter+add+remove. Seeded publicly-reported examples LABELLED verify-at-source. NEVER assert partnerships as
  fact — user-maintained + source URL.
- TOUR FIX: 'Tour this page' on jobsearch had no steps → fell back to full portal tour (misleading). Added 4
  jobsearch steps to APP_TOUR_STEPS in script.js (#jobsearch h2, #jsKeyword, #jsChips, .js-partners).
- All in core/job-search.js + script.js (tour) + style.css (.js-ac-*, .js-pn-*). node --check clean, pushed,
  Learning Hub feature #29 (count→29). node --check is authoritative (get_errors can miss paren breaks).

## ✅ DONE 2026-07-03 — Big-tech direct-portal launcher (#30) + CORS finding
- USER Q: what about companies NOT on Greenhouse/Ashby (Microsoft etc.)? FINDING (tested w/ Origin header):
  giants run own systems (mostly WORKDAY) or custom; Amazon jobs API returns JSON server-side but sends NO
  Access-Control-Allow-Origin → browser BLOCKS it. Microsoft/Workday same (same-origin SPA only). A static
  no-backend app CANNOT fetch the giants into the feed. Rule: test cross-origin reachability (send Origin,
  check ACAO), not just HTTP 200.
- FIX (feature #30): DIRECT_PORTALS array in core/job-search.js — pill buttons (.js-portal-btn) that
  window.open() each giant's OWN career search PRE-FILLED with #jsKeyword + #jsLocation ({kw}/{loc} templates).
  Navigation not fetch → no CORS, ToS-clean. 12 seeded: Microsoft, Amazon, Google, Apple, Meta, NVIDIA,
  Netflix, Salesforce, Oracle, IBM, Deloitte, Accenture. Pushed, count→30.

## ✅ DONE 2026-07-03 — WORKDAY feed via GitHub Action (#31) + partnership swap
- Brought CORS-blocked Workday giants INTO the feed. scripts/fetch-workday-jobs.mjs (Node 20 global fetch)
  POSTs Workday CxS: https://{host}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs. VERIFIED live tenants:
  NVIDIA(nvidia.wd5/nvidia/NVIDIAExternalCareerSite), Salesforce(salesforce.wd12/salesforce/External_Career_Site),
  Adobe(adobe.wd5/adobe/external_experienced), Workday(workday.wd5/workday/Workday). 240 jobs (60 each).
- WORKDAY GOTCHAS (found by printing raw 400 body, not guessing): (1) limit MAX 20 — asking 60 → HTTP 400;
  must paginate offset 0/20/40. (2) sending a custom browser User-Agent → 400; DEFAULT undici UA → 200.
  (3) postedOn is a human string ("Posted Today/N Days Ago/30+ Days Ago") not a date → parse to approx epoch.
  job URL = https://{host}.myworkdayjobs.com/en-US/{site}{externalPath}.
- .github/workflows/fetch-external-jobs.yml: cron daily 06:00 UTC + workflow_dispatch, permissions contents:write,
  runs node script, commits feed if changed. RE-DISPATCH: gh workflow run "fetch-external-jobs.yml".
- ⚠️ BIG GOTCHA: generated/ is in .gitignore → git add of generated/external-jobs.json FAILED under `set -e`
  AND local commit silently skipped it. Cannot un-ignore a file whose PARENT dir is ignored. FIX: put committed
  feed in a TRACKED folder → **data/external-jobs.json**. Script writes data/, workflow adds data/, app
  fetchScheduled() GETs 'data/external-jobs.json?cb=' same-origin.
- APP wiring (core/job-search.js): special chip scheduledChip() '🗓 Big-tech feed' (class js-chip-sched,
  selected by default, no remove-x). runSearch: schedOn → tasks.push(fetchScheduled()); status now "N sources".
- Feature #31 logged, count→31. data/external-jobs.json tracked + live.

## ✅ DONE 2026-07-03 — Job Search transparency + vicinity radius (#32)
- SOURCES CLARITY: added .js-sources info banner in controls; results status line names the sources
  (Greenhouse · Ashby · Workday) and points to portals for the rest; relabeled chips head. Kept honest dynamic
  "N sources" (no fake counts).
- VICINITY RADIUS: new #jsRadius select (nearby[default] | exact | country). runSearch locTerms: nearby =
  city+state, exact = city only, country = country. No per-job geocoding (job locations are free text).
- Feature #32 logged, count→32. Pushed.

## ✅ DONE 2026-07-05 — Global reach + self-explaining empty state (#33)
- USER: "nothing from India/Sydney/Dublin" (searched keyword "Azure"). DIAGNOSIS (verified server-side):
  NOT a coverage gap — Stripe Greenhouse = 490 jobs, 107 in India/Dublin/Sydney, but "Azure" in title = 0
  (these are AWS/GCP shops). The KEYWORD nuked it, stacked with last-7-days. Rule again: verify before believing.
- SMART EMPTY-STATE: now reads pre-filter count (jobs.length) and teaches the real cause (keyword matches the
  TITLE; a narrow term like Azure zeroes out AWS/GCP shops; broaden / clear / widen date / whole country).
- GLOBAL SOURCE: tested 5 free aggregators for CORS (all send ACAO). Added **The Muse**
  (themuse.com/api/public/jobs?page=N&descending=true) as OPT-IN chip (DEFAULT OFF) via fetchMuse() (5 pages).
  Good for non-tech roles (nursing/finance/trades). ⚠️ CAVEAT: The Muse public data is STALE (~10mo old) →
  labelled optional, off by default. Feature #33 logged, count→33. Pushed.

## ✅ DONE 2026-07-05 — LIVE Adzuna global search via Cloudflare Worker proxy (#34)
- User signed up for Adzuna (app_id+app_key). SECURITY: never accept API keys via chat/model. Keys set by
  USER in their terminal (wrangler secret put) — assistant references by name only.
- ARCHITECTURE: the site already runs on a Cloudflare Worker (Static Assets). Extended it: wrangler.jsonc now has
  `main:"worker.js"` + `assets:{directory:"./",binding:"ASSETS"}`. NEW worker.js: fetch handler serves
  env.ASSETS.fetch for everything EXCEPT /api/adzuna, which proxies Adzuna injecting env.ADZUNA_APP_ID/
  ADZUNA_APP_KEY (Cloudflare SECRETS) server-side, returns same-origin JSON (no CORS, key never in browser).
  worker.js added to .assetsignore. SAFE: Workers+Assets serves static files directly, Worker only runs for
  /api/* → a proxy bug cannot take the site down.
- SECRETS: user runs `npx wrangler secret put ADZUNA_APP_ID` + `ADZUNA_APP_KEY`. Deploy = Cloudflare Git
  integration (NOT a GH Action). Until secret set, /api/adzuna returns 503 (graceful "couldn't reach: Adzuna").
- APP (core/job-search.js): adzunaChip() DEFAULT ON. fetchAdzuna(what,where,country,days) → GET /api/adzuna.
  adzunaCountry(name) maps country→2-letter (18 Adzuna countries; Ireland NOT supported). Adzuna results BYPASS
  client filter (matched server-side). Feature #34, count→34.
- GOTCHA: git NOT on Machine/User PATH in some fresh terminals → use `$env:Path = "C:\Program Files\Git\cmd;" + $env:Path`.

## ✅ DONE 2026-07-05 — Adzuna LIVE + privacy manifesto (#35) + no-DB decision
- ADZUNA VERIFIED LIVE: user set both secrets. Health check
  https://rdammala.com/api/adzuna?country=in&what=engineer&where=Bengaluru → count=21586. Worker proxy works, key sealed.
- CLEANUP: .wrangler/cache/wrangler-account.json had been committed by `git add -A` → untracked it
  (git rm -r --cached .wrangler) + added `.wrangler/` to .gitignore. `git add -A` here can catch the wrangler cache.
- USER Q "should I add a free-tier DB for user data?" → ANSWER: NO for user data (breaks the privacy promise,
  makes him a data controller/liability). Rule: PRIVATE user data → browser + user's own GitHub, never a server
  DB. PUBLIC/operational data → static JSON + Actions + edge Worker; if truly needed use Cloudflare KV/D1
  (native, non-personal only). A DB is not a marker of a "real" app; the right architecture is.
- DELIVERED: (1) index.html Help/FAQ section ⑧ rewritten into a full privacy MANIFESTO. (2) Learning Hub feature
  #35 "Privacy by Architecture" (count→35). (3) Compass interview prep: SRE Q&A "When would you deliberately NOT
  use a database? (privacy-by-architecture)".

## ✅ DONE 2026-07-05 — Private notes backup, then made PUBLIC + reachable (#36)
- Backed up this file to the PRIVATE rdammala/resume-engine-reference repo (post-July-8 access), then the user
  chose to make the whole project OPEN: this file moved to the PUBLIC resume-engine-pro repo (root RESUME-HERE.md)
  as a teaching artifact + AI-continuity context. Added .github/copilot-instructions.md pointing any future AI
  here first; README Quick Links points to it too.
- LEARNING HUB made reachable from the app: a bottom-left floater (.story-fab, "📖 Learn from our mistakes") on
  every page opens learning-hub/INDEX.html (it previously had no in-app entry point). Reframed the Hub intro from
  a dry "journey" line into a warm invitation (learn from our mistakes, borrow patterns, tell your own interview
  story) + a GitHub Issues feedback CTA (no comment DB — stays privacy-true). Feature #36, count→36.
- resume-engine-reference repo: README rewritten as a private mirror / self-reminder (Option-C archive kept
  lifeless on purpose as a values check). Its notes/ copy of this file removed — canonical home is now this
  public file.

## Repo / environment
- Repo: rdammala/resume-engine-pro · branch **master** · PUBLIC · static site (pure HTML/CSS/JS, no backend for user data).
- Local path: c:\rdammala\resume-engine-pro
- Live: https://rdammala.com/ (Cloudflare Worker + Static Assets) · Learning Hub: /learning-hub/INDEX.html
- Push pattern: git add -A; git commit -q -m "..."; git pull --rebase -q origin master; git push -q; echo "PUSHED $LASTEXITCODE"; verify `git status -sb` shows `## master...origin/master`.

## Validation before pushing
- JS: `node --check script.js` (and changed core/*.js) + editor errors.
- ⚠️ The editor language server can MISS unbalanced-paren SyntaxErrors that break the WHOLE script. ALWAYS run
  `node --check script.js` after editing it — it is authoritative. One parse error → NO functions load → login dead.
- bugs-data.js / features-data.js: `node -e "global.window={}; require('./learning-hub/bugs-data.js'); console.log(window.BUGS.length)"` (and FEATURES).
- These two data files use SINGLE-QUOTED JS strings → apostrophes break parsing. Reword to avoid apostrophes.

## Learning Hub is DATA-DRIVEN (the old MD->HTML workflow is retired)
- Bugs: `learning-hub/bugs-data.js` → window.BUGS (currently 54). Features: `learning-hub/features-data.js` → window.FEATURES (currently 36).
- Renderers + hover copy button + code formatting in `learning-hub/tabs-handler.js`.
- STANDING DIRECTIVE (ALWAYS, proactively): after ANY change/fix/feature/update, add the matching Learning Hub
  entry + bump the counts in learning-hub/INDEX.html (overview line + footer line), in the SAME session, with the
  commit. Bug fix → bugs-data.js; new feature/UX change → features-data.js. Validate with node --check. Treat this
  as part of "done" for every task.

## Architecture quick facts
- Ollama runs FREE in ephemeral GitHub Actions runner (ollama-resume.yml). Browser dispatches via
  GitHubRunner.dispatch, polls, fetches generated/<run_id>.json. resumePendingRuns() reconciles in-progress rows.
- Portfolio engine: `core/portfolio-templates.js` — _prep() escapes all profile fields ONCE; _doc() injects theme
  vars + light/dark toggle. 5 families x 5 palettes. generatePortfolio(profile,'auto', ...).
- App theme: data-theme on <html> set pre-paint by inline boot script; toggleAppTheme() in script.js.
- Backup: StorageManager.exportAll()/importAll(); GitHubManager.pushFile()/getFile(); saveDataToGitHub()/restoreDataFromGitHub().

## Style/process directives
- Do NOT create markdown docs unless requested. Use batch edits. Keep replies concise. This is a privacy-first,
  backendless-by-design project — protect that contract above all.
