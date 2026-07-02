// Feature data for Learning Hub — a "feature tracker" companion to the bug
// tracker. Each entry documents a shipped capability: why it was built, the
// approach, the real code that landed, and the lesson behind it.
//
// Code snippets are stored as backtick template literals so they keep their
// real line breaks and indentation. The renderer prints them inside a <pre>
// block with HTML escaped, so they read like an IDE — not collapsed onto a
// single line the way the older bug snippets do.
console.log("features-data.js loaded");

window.FEATURES = [
    {
        id: 1,
        title: 'Auto-Sync Published Portfolios into the Job Applications Tracker',
        category: 'Job Tracker',
        status: 'Shipped',
        role: 'Full-Stack / UX',
        effort: '40 min',
        summary: 'Publishing a live portfolio now adds (or refreshes) its row at the TOP of the Job Applications Tracker automatically — no manual entry, no duplicate rows.',
        motivation: 'After a portfolio was published the tracker looked like it never updated. The data was actually being saved — it was just pushed to the BOTTOM of the list, and re-publishing the same entry silently created duplicate rows. A swallowed catch hid the whole thing.',
        solution: 'Insert new rows with unshift (newest first), add an idempotent upsert keyed on the GitHub repo URL so re-publishing updates the existing row instead of duplicating it, run a one-time dedupe whenever the tracker loads to clean historic duplicates, and let the publish path surface errors via a toast instead of failing silently.',
        codeExample: `// core/job-tracker-manager.js — newest-first + idempotent upsert
upsertApplicationByRepo(app) {
    const apps = this.loadApplications();
    const idx = app.repo ? apps.findIndex(a => a.repo && a.repo === app.repo) : -1;
    if (idx !== -1) {
        // Same package re-published — merge in the fresh link/date/status,
        // but keep the original row id so the table row is updated in place.
        apps[idx] = { ...apps[idx], ...app, id: apps[idx].id };
        this.saveApplications(apps);
        return apps[idx];
    }
    app.id = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
    apps.unshift(app);          // newest at the top, not buried at the bottom
    this.saveApplications(apps);
    return app;
}

// Collapse rows that point at the same repo (or live link) on load.
dedupeByRepo(apps) {
    const seen = new Set();
    const out = [];
    (apps || []).forEach(a => {
        const key = (a && (a.repo || a.link)) || '';
        if (key && seen.has(key)) return;   // drop later duplicate
        if (key) seen.add(key);
        out.push(a);                         // manual rows (no key) always kept
    });
    return out;
}`,
        lesson: 'When a user says "nothing updates", verify the write before touching the writer. Here the write worked — the row was just at the bottom and duplicated. Make writes observable (no silent catch) and idempotent (upsert on a stable key).',
        impact: 'High — the tracker is now trustworthy. Every publish is reflected exactly once, instantly, at the top of the list.'
    },
    {
        id: 2,
        title: 'Guard Against Benefit Phrases Being Mistaken for the Company Name',
        category: 'AI Extraction',
        status: 'Shipped',
        role: 'AI / Data Quality',
        effort: '30 min',
        summary: 'The generator no longer prints things like "Paid disability and life insurance" as the employer. The model is asked for a clean job_title / company, and a sanity filter rejects perk phrases.',
        motivation: 'On a stale build the company field was being filled from a random JD line — often a benefits bullet — so portfolios and tracker rows showed a perk as the hiring company.',
        solution: 'The cloud prompt now explicitly asks the model for job_title and company ("never guess a benefit or perk as the company"). On the client, looksLikeCompany() rejects values that are too short/long or that contain benefit keywords, and it gates BOTH the AI-provided company and the regex fallback.',
        codeExample: `// script.js — only accept a value that actually looks like a company
function looksLikeCompany(value) {
    const s = String(value || '').trim();
    if (s.length < 2 || s.length > 60) return false;
    // Reject perk/benefit phrases that often leak in as a "company".
    const perks = /\\b(insurance|disability|401k|pto|benefit|benefits|salary|bonus|vacation|paid|leave|coverage|equity|stipend)\\b/i;
    if (perks.test(s)) return false;
    return true;
}

// The AI company is only trusted when it passes the same guard.
if (aiData && typeof aiData.company === 'string'
        && looksLikeCompany(aiData.company)) {
    tailored._aiCompany = aiData.company.trim();
}`,
        lesson: 'LLM field extraction needs a cheap, deterministic validator on the way out. A tiny denylist of perk words stops the most common "wrong company" failure before it ever reaches the UI or the published files.',
        impact: 'Medium-High — published portfolios and tracker rows now name a real employer, not a benefit line.'
    },
    {
        id: 3,
        title: 'Single Generate: Merge JD Paste + Posting Link into One Flexible Step',
        category: 'Generator UX',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '50 min',
        summary: 'The Single Resume tab now takes a job description, a posting link, or both (each optional, at least one required). The link is saved to job-details.md in the published repo, and the confusing sun/moon mode icons were replaced with clear document icons.',
        motivation: 'The old tabbed "paste vs URL" toggle forced an either/or choice and hid one input behind the other. Portals frequently block automated fetching, so users needed to keep the link even when they pasted the text manually.',
        solution: 'Both inputs are shown together. If only a link is given, the app best-effort fetches the JD text; if the portal blocks it, the user pastes the text while the link is still recorded. The source link is written into job-details.md so every published package keeps its provenance.',
        codeExample: `// script.js — accept either input; keep the link no matter what
let jdText = (document.getElementById('jdText')?.value || '').trim();
const jobUrl = (document.getElementById('jdUrl')?.value || '').trim();

if (!jdText && !jobUrl) {
    showToast('Add a job description or a job posting link', 'warning');
    return;
}
if (!jdText && jobUrl) {
    // Try to read the posting; portals often block this (returns '').
    jdText = (await fetchJDPlainText(jobUrl)).slice(0, 8000);
    if (!jdText) {
        showToast('Could not read that link — paste the JD text. ' +
                  'The link is still saved to job-details.md.', 'warning');
        return;
    }
}

// job-details.md always records where the role came from.
function buildJobDetailsBlob(jobTitle, company, jdText, sourceUrl) {
    return [
        '# ' + jobTitle + ' — ' + company,
        '',
        '## Source / Link',
        sourceUrl ? sourceUrl : '(not provided)',
        '',
        '## Job Description',
        jdText || '(not provided)'
    ].join('\\n');
}`,
        lesson: 'When an external step can fail (blocked fetch), design the UI so the user always has a manual fallback AND the metadata (the link) is never lost. Optional-but-at-least-one beats a hard either/or toggle.',
        impact: 'Medium — fewer dead ends, and every published portfolio keeps a traceable source link.'
    },
    {
        id: 4,
        title: 'Bulk Generation: Per-Job Cards + Live Pricing + Parallel Ollama Cloud Runs',
        category: 'Generator UX',
        status: 'Shipped',
        role: 'Front-End / Cloud Orchestration',
        effort: '90 min',
        summary: 'Bulk mode was rebuilt around a dynamic list of job cards (each with an optional link AND JD, "+ Add another job"), accurate live cost estimates, and — for free Ollama — one GitHub cloud runner per job dispatched in PARALLEL.',
        motivation: 'The old bulk mode was a single textarea split on blank lines, only produced resume PDFs, and had no Ollama / cloud support. It also could not show real pricing per job.',
        solution: 'Each job is a card read into a { url, jd } object. updateBulkCost() counts cards live. generateBulk() fans out: paid/local providers build resume PDFs sequentially, while Ollama dispatches one ephemeral GitHub Actions runner per job via Promise.allSettled, records each as an in-progress History row, then lets the existing background monitor reconcile every run independently — true parallel "multiple containers at once".',
        codeExample: `// script.js — one free cloud runner per job, launched in parallel
const results = await Promise.allSettled(usable.map(async (job) => {
    const meta = extractJobMeta(job.jd);
    const histId = StorageManager.saveGeneration({
        profile: profile.displayName || profile.name,
        jobTitle: meta.title || '',
        company: meta.company || '',
        provider: 'ollama',
        status: 'in-progress',
        jd: job.jd.slice(0, 16000),
        baseName,
        jobUrl: job.url,
        genOpts: { ...genOptsBase, jobUrl: job.url }
    });
    const { runId } = await GitHubRunner.dispatch({
        resumeData: resumeText,
        jobDescription: job.jd,
        model
    });
    StorageManager.updateGeneration(histId, { runId });
    return runId;
}));

// The existing background monitor reconciles each run on its own.
scheduleResumeCheck();

// Dynamic job cards — readBulkJobs() turns the DOM into clean objects.
function readBulkJobs() {
    const list = document.getElementById('bulkJobList');
    return Array.from(list.querySelectorAll('.bulk-job-card')).map(card => ({
        url: (card.querySelector('.bulk-job-url')?.value || '').trim(),
        jd:  (card.querySelector('.bulk-job-jd')?.value  || '').trim()
    })).filter(j => j.url || j.jd);   // keep cards with at least one input
}`,
        lesson: 'Reuse proven async infrastructure instead of building a parallel pipeline. The single-resume History monitor already polled in-progress runs to completion — fanning out N dispatches and dropping N History rows in front of it gave parallel bulk for almost free.',
        impact: 'High — bulk now supports the free cloud model, scales to many jobs at once, and shows honest per-job pricing before you spend anything.'
    },
    {
        id: 5,
        title: 'README AI Model Guide — Which Model Is Best at What',
        category: 'Documentation',
        status: 'Shipped',
        role: 'Docs / Developer Experience',
        effort: '25 min',
        summary: 'Added a comprehensive "AI Models — Which One Is Best at What" section to the root README: a quick recommendation table, a provider cost comparison, and tuned model picks for the free GitHub runner.',
        motivation: 'Users had no guidance on which provider/model to pick. The trade-offs (free vs paid, quality vs speed, OOM risk on the free runner) lived only in code and chat.',
        solution: 'Documented every provider (None/Ollama/Pollinations/OpenAI/Claude/Gemini/Mistral/Custom) with approximate costs, plus an Ollama-on-free-runner table flagging safe defaults (llama3.2 3B), the best free quality pick (qwen2.5:7b), and models that risk OOM on the ~16 GB CPU runner.',
        codeExample: `<!-- README.md — runner-safe model picks (excerpt) -->
| Model         | Size | Notes                                   |
|---------------|------|-----------------------------------------|
| llama3.2      | 3B   | Default — fast, fits the free runner    |
| qwen2.5:7b    | 7B   | Best free quality that still fits        |
| mistral       | 7B   | Solid all-rounder                        |
| phi3          | 3.8B | Tiny + capable                           |
| llama3        | 8B   | Avoid — risks OOM on the ~16 GB runner   |
| gemma2:9b     | 9B   | Risky — only with trimmed context        |

> Tip: keep num_ctx around 8192 and num_predict around 2048 so larger
> models stay within the free runner's memory budget.`,
        lesson: 'Decision-making knowledge that only exists in code or conversation is invisible. A short comparison table in the README turns tribal knowledge into a self-serve choice.',
        impact: 'Medium — users can pick the right model up front instead of discovering OOM failures by trial and error.'
    },
    {
        id: 6,
        title: 'Distinct Portfolio Templates + Per-Profile Colour Palettes + Output Escaping',
        category: 'Portfolio',
        status: 'Shipped',
        role: 'Front-End / Security',
        effort: '95 min',
        summary: 'The portfolio picker is real again: Minimalist, Executive, Creative, Tech and Startup are now genuinely different designs, each with 5 colour palettes (25 distinct looks). Each resume profile is auto-assigned a stable palette (so every person gets a different-looking site, consistently), and every value is HTML-escaped so a public portfolio can never be broken or injected by unusual resume content.',
        motivation: 'A QA pass found all five "templates" just called generateMinimalist — so the picker had no visual effect — and the templates interpolated profile fields raw, so a name/summary containing < or " could break the page or inject markup into a public GitHub Pages site.',
        solution: 'Added a shared _prep() that escapes the whole profile once into a safe view model, a _body() that renders the About/Experience/Skills/Education sections with consistent class names (so content is identical across templates), and a _doc() wrapper. Each template defines 5 colour palettes and pulls colours from the one chosen by _schemeIndex(): a numeric scheme is honoured, while "auto" (passed by the generator) derives a STABLE palette from a hash of the profile name+title, so each person gets a consistent-but-varied look across re-generations. Multi-line summaries and experience bullets keep their line breaks via <br>.',
        codeExample: `// Stable, per-profile palette selection (auto) — same person, same colours.
_schemeIndex(profile, scheme, count) {
  if (typeof scheme === 'number' && isFinite(scheme))
    return ((Math.floor(scheme) % count) + count) % count;
  const s = (profile.name || profile.displayName || '') + '|' + (profile.title || '');
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % count;                       // deterministic bucket -> stable colours
}

generateStartup(profile, scheme) {
  const d = this._prep(profile);          // escaped view model
  const pals = [/* indigo */, /* emerald */, /* rose */, /* sky */, /* amber */];
  const c = pals[this._schemeIndex(profile, scheme, pals.length)];
  return this._doc(d, '🚀', '/* CSS using ' + c.a + '/' + c.b + ' gradient */');
}`,
        lesson: 'A picker with no effect is worse than no picker. Separate content from presentation: escape and assemble the content once, then let each theme — and each palette — vary only the CSS, so adding a template or colourway can never drop a field or reopen an injection hole. Derive per-entity variation from a stable hash (not randomness) so the same profile always renders identically, keeping re-generated and re-published sites consistent. And treat any user text rendered into a public page as untrusted, escaping it at the boundary even when it is "your own" data.',
        impact: 'Medium — five templates x five palettes give 25 distinct looks, every profile auto-gets its own stable colour scheme, and every published portfolio is safe from broken layout or HTML/script injection.'
    },
    {
        id: 7,
        title: 'Choose Where Your Data Lives: Local Download or Save to Your GitHub Account',
        category: 'Data / Backup',
        status: 'Shipped',
        role: 'Front-End / Data',
        effort: '50 min',
        summary: 'Backup & Restore now offers two destinations: download a JSON file locally, or save it to a backups/ folder in your own GitHub data repository so it survives clearing this browser and can be restored on any device. Restore works from either source.',
        motivation: 'All app data (profiles, history, applications, settings) lived only in browser localStorage, so clearing site data wiped everything and there was no cross-device option. The "data repository" existed but nothing actually wrote the user data into it.',
        solution: 'Reused StorageManager.exportAll()/importAll() (the existing full-backup format) and GitHubManager.pushFile() (user token, UTF-8-safe base64 + SHA overwrite). saveDataToGitHub() ensures the data repo exists (idempotent, honouring the Private/Public radio), then writes backups/latest.json plus a timestamped backups/backup_<stamp>.json history copy. Added GitHubManager.getFile() to read+decode the Contents API payload; restoreDataFromGitHub() fetches latest.json, confirms, and imports. The Settings UI now presents two clear rows — Back up (Download / Save to GitHub) and Restore (From file / From GitHub).',
        codeExample: `// Save a full backup to the user's OWN GitHub data repo (any device restore).
async function saveDataToGitHub(btn) {
  const repoName = (document.getElementById('githubDataRepo')?.value || '').trim()
                   || 'resume-engine-data';
  const access = document.querySelector('input[name="repoAccess"]:checked');
  const isPrivate = !access || access.value !== 'public';
  await GitHubManager.createDataRepository(repoName, isPrivate);   // idempotent
  const content = JSON.stringify(StorageManager.exportAll(), null, 2);
  await GitHubManager.pushFile(repoName, 'backups/latest.json', content, 'Update backup');
  await GitHubManager.pushFile(repoName, 'backups/backup_' + stamp + '.json', content, 'History');
}

// Restore reads it straight back and imports (replacing local data).
const f = await GitHubManager.getFile(repoName, 'backups/latest.json');
StorageManager.importAll(JSON.parse(f.content), { clearFirst: true });`,
        lesson: 'When the only copy of user data is per-browser, give a real choice of durability: a local file for offline control and a cloud copy (in their own account, not yours) for cross-device recovery. Build it from primitives you already have — a stable export/import format and an idempotent pushFile — instead of a new sync engine. Keep both a stable latest.json (easy restore) and timestamped copies (history), and always confirm before a destructive replace.',
        impact: 'Medium — users can now keep their data safe their way: a downloaded file, or their own private/public GitHub repo that restores on any device, instead of being trapped in one browser.'
    },
    {
        id: 8,
        title: 'Light/Dark Themes — Softer Portfolio Backgrounds, a Live Toggle on Every Published Page, and an App-Wide Theme Switch',
        category: 'Theming / UX',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '110 min',
        summary: 'The bright portfolio backgrounds were softened, every published portfolio now has a live 🌙/☀️ Light/Dark toggle (theme persists per visitor), and the Resume Engine Pro app itself gained a theme switch next to the Settings gear that flips the whole UI between dark (default) and light.',
        motivation: 'Users found the Minimalist/Executive/Creative/Startup template backgrounds too bright, and wanted control over light vs dark — both on the published portfolio pages and in the app itself.',
        solution: 'Refactored every portfolio template to drive its structural colours (bg, surface, text, muted, border, chip) from CSS custom properties, defined for both a softened light palette and a matching dark palette via :root[data-theme]. _doc() now injects those variables, a fixed toggle button, a pre-paint boot script (localStorage, else prefers-color-scheme), and a flip handler — so the page opens in the right theme with no flash and the visitor can switch live. For the app, a navbar button toggles data-theme on <html> (set before first paint by the existing boot script, persisted to rep-app-theme), and style.css gained an html[data-theme="light"] block overriding the CSS variables plus the surfaces/accents that hard-coded dark values.',
        codeExample: `// Templates now theme via CSS variables (light + dark) instead of fixed colours.
return this._doc(d, '📄', css, {
  light: { bg:'#eef0f3', surface:'#fff', text:'#2b2b2b', muted:'#6b7280', border:'#dfe3e8', chip:'rgba(0,0,0,.05)' },
  dark:  { bg:'#14161b', surface:'#1b1e25', text:'#e7e9ee', muted:'#99a2b0', border:'#2a2e37', chip:'rgba(255,255,255,.06)' }
});

// Each published page boots to the right theme (no flash) + a live toggle.
(function(){var K='rep-portfolio-theme',t;try{t=localStorage.getItem(K)}catch(e){}
  if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  document.documentElement.setAttribute('data-theme',t)})();

// App theme switch (navbar, next to Settings) — persisted, pre-paint applied.
function toggleAppTheme(){var h=document.documentElement,
  t=h.getAttribute('data-theme')==='light'?'dark':'light';
  h.setAttribute('data-theme',t); localStorage.setItem('rep-app-theme',t); applyAppThemeIcon();}`,
        lesson: 'Theme by token, not by literal: routing every structural colour through CSS variables lets one design support light AND dark (and a live toggle) without forking the markup. Decide the theme synchronously before the first paint (inline script reading localStorage, falling back to prefers-color-scheme) to avoid a flash. Persist the choice so it sticks. And when retrofitting a light mode onto a dark-first app, the variables cover most of it — the real work is hunting the hard-coded accents (here, the cyan #00d9ff) that were only ever chosen to read on dark.',
        impact: 'Medium — softer default portfolios, visitors can read any published portfolio in their preferred light/dark mode, and the whole app can be switched to a light theme from the navbar.'
    },
    {
        id: 9,
        title: 'First-Run Onboarding — Getting-Started Steps, In-App Help/FAQ, a Floating Help Button, and Clearer GitHub-Token Guidance',
        category: 'Onboarding / UX',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '150 min',
        summary: 'After real users (via LinkedIn) found the tool confusing, added a Dashboard "Get set up in 3 steps" banner, a floating ? Help button on every page opening a full Help & FAQ (with a first-timer GitHub-token walkthrough), consistent AI-status wording, an inline "could not fetch the link" note, and fixed the GitHub setup so it targets the user account instead of the project owner — including a real bug where the Initialize Data Repository button read the wrong input field.',
        motivation: 'Feedback: people did not know where to start (Quick Actions was buried at the bottom); AI-status badges were worded inconsistently (Ready / Not set / No key); the "could not fetch JD" toast was missed; the Settings tab scrolled out of view with no link back; the Ollama repo owner/token were hard-coded to the project owner (rdammala) instead of the user; and creating a data repo failed with an unhelpful "Failed to create repo:" message.',
        solution: 'Dashboard now leads with a 3-step getting-started card (Create profile → Generate → Publish/track) and Quick Actions moved to the top. renderAIStatus() uses one pattern: "✓ Ready" when usable, else a precise action ("Add API key" / "Add GitHub token" / "Add endpoint"), and Ollama now reflects whether the token is actually set. The JD fetch writes a persistent inline note (not just a toast) explaining portals block fetching and to paste instead. A floating ? button (every page) opens a Help & FAQ modal with the basic flow, the "some resumes do not auto-fill" explanation, AI-engine guidance, and a step-by-step fine-grained-token guide (Resource owner = your account, Repository access = All repositories — which is what makes the Actions/Contents permissions appear). The Ollama card auto-fills Repo owner with the logged-in username and links to fork the repo; createDataRepository() now surfaces the real GitHub error + an actionable hint (401/403/422); and the Initialize/Save/Restore buttons now read the Settings #dataRepoName field they sit next to (they were wired to a different tab #githubDataRepo).',
        codeExample: `// AI status: one consistent pattern, and Ollama tells the truth about its token.
const statusOf = (id) => {
  if (id === 'pollinations') return { ready: true,  label: '✓ Ready · free' };
  if (id === 'ollama')       return hasGhToken
        ? { ready: true,  label: '✓ Ready · free' }
        : { ready: false, label: 'Add GitHub token' };
  if (id === 'custom')       return AIIntegration.isConfigured('custom')
        ? { ready: true, label: '✓ Ready' } : { ready: false, label: 'Add endpoint' };
  return AIIntegration.isConfigured(id)
        ? { ready: true, label: '✓ Ready' } : { ready: false, label: 'Add API key' };
};

// Bug: the Initialize button read a different tab's field. Read the one beside it.
const repoName = (document.getElementById('dataRepoName')?.value
              || document.getElementById('githubDataRepo')?.value || '').trim()
              || 'resume-engine-data';

// Repo owner now defaults to the signed-in user (their fork), not the project owner.
const ownerVal = savedRunnerCfg.owner || GitHubManager.getUsername() || ghCfg.owner;`,
        lesson: 'Watch real first-time users: experts skip the friction newcomers hit. Lead with the intended flow (do not bury the call-to-action), and word status consistently — "Ready vs Not set vs No key" reads as three different systems. A transient toast is easy to miss; mirror critical feedback inline next to the field. For a tool that rides on the user own GitHub, never hard-code your own account into defaults — auto-fill theirs — and turn cryptic API failures into the exact fix (scope, owner, name-taken). Finally, put first-timer setup (especially token scopes most people see for the first time) behind an always-reachable Help button, not just prose they have to find.',
        impact: 'High — new users get an obvious path, ready-to-use clarity on AI engines, self-serve token/setup help, and a GitHub flow that actually creates repos in THEIR account; far less hand-holding needed to onboard.'
    },
    {
        id: 10,
        title: 'One-Click "Auto-Create My Cloud Generator" (Fork) + Screenshot Token Walkthrough',
        category: 'Onboarding / GitHub',
        status: 'Shipped',
        role: 'Front-End / GitHub',
        effort: '70 min',
        summary: 'The free Ollama cloud generator needs the workflow to live in a repo the user can dispatch — i.e. their own fork. Added a one-click button that forks the project into the user account with their token, enables Actions, and points the app at their fork. The Help/FAQ now has a 6-step, screenshot-illustrated GitHub-token guide, a fork-vs-clone explainer, and a clear "this never touches the owner quota" note.',
        motivation: 'Users were confused about how to run the free generator under their own account, worried that forks might consume the project owner Actions quota, and asked whether they could just clone the repo. The manual fork + field-filling was friction, and the token steps were the first time many had seen GitHub fine-grained tokens.',
        solution: 'GitHubRunner gained whoAmI(), forkSource() (POST /repos/OWNER/REPO/forks, idempotent) and a best-effort enableActions() (forks start with Actions disabled). A new setupCloudFork() handler forks with the user token, auto-fills their owner/repo, enables Actions, and saves the config — falling back to opening the fork Actions tab if enabling needs a broader scope. The FAQ embeds the real token screenshots (assets/help/token-1..6.png, hidden gracefully until present) with exact field values (Resource owner = your account, All repositories radio reveals Permissions, Actions + Contents = Read and write, Metadata is mandatory read-only), a copy-it-now-you-cannot-see-it-again warning, and a fork-vs-clone + free-quota explainer.',
        codeExample: `// Fork the template into the user's own account (idempotent), then enable Actions.
async forkSource() {
  const res = await this.api('/repos/' + this.SOURCE.owner + '/' + this.SOURCE.repo + '/forks',
                             { method: 'POST', body: JSON.stringify({ default_branch_only: true }) });
  if (!(res.ok || res.status === 202)) throw new Error('Fork failed (HTTP ' + res.status + ')');
  return await res.json();   // { owner: { login }, name, ... }
}

async function setupCloudFork(btn) {
  const fork  = await GitHubRunner.forkSource();
  const owner = fork.owner.login, repo = fork.name;
  await GitHubRunner.enableActions(owner, repo);   // forks start disabled
  GitHubRunner.setConfig({ owner, repo });          // point the app at THEIR fork
}`,
        lesson: 'When a feature requires the user to have their own copy of a repo, do the fork FOR them with their token instead of writing instructions — and reassure on the scary part: a fork runs on the user own free Actions minutes (unlimited for public repos) and can never touch the original owner quota, so there is nothing to clean up. Clarify fork (a repo in their account that can run Actions) vs clone (a local-only copy that cannot). And for first-time GitHub steps, real screenshots beat prose: embed them with an onerror fallback so the page still works before the images are added.',
        impact: 'High — users can stand up the free cloud generator in their own account with one click (no manual fork, no quota fear), and the illustrated token guide removes the biggest first-run blocker.'
    },
    {
        id: 11,
        title: 'Browser AI (WebLLM) — a Real LLM Running 100% On-Device, Free & Private',
        category: 'AI / Providers',
        status: 'Shipped',
        role: 'Front-End / AI',
        effort: '90 min',
        summary: 'Added WebLLM as a new free AI provider that runs a real instruction-tuned LLM entirely inside the browser via WebGPU — $0 cost, fully private (nothing leaves the device), no API key, no GitHub token, and no server. Users pick "Browser AI" in the Generate tab and choose a model (Llama 3.2 3B default, up to Qwen2.5 7B / Llama 3.1 8B) in Settings. The publish-to-GitHub experience is unchanged: WebLLM only tailors the content locally, then the resume & portfolio publish to a new repo in the user own account exactly as before.',
        motivation: 'The two existing free options each had a catch: Pollinations is a shared endpoint with no privacy guarantee and variable quality, and Ollama-cloud needs a GitHub token + fork and runs a 3B model on a CPU-only runner. Users wanted a genuinely private, higher-quality free option that needs zero setup and never sends their resume anywhere.',
        solution: 'AIIntegration gained a webllm provider (with a curated model list), webgpuSupported(), get/setWebLLMConfig(), and tailorWithWebLLM() which lazy-imports @mlc-ai/web-llm from a CDN, creates/caches an MLCEngine for the chosen model, and calls the OpenAI-compatible chat.completions.create() locally. isConfigured(webllm) returns whether WebGPU exists, and getCost returns 0. The Generate/bulk flows surface a live model-download progress card via an onWebLLMProgress hook, and Settings renders a model picker with WebGPU status. If WebGPU is missing, the error and UI explicitly steer users to Pollinations or Ollama (also free).',
        codeExample: `// Lazy-load the library + cache an engine per model, then tailor locally.
async tailorWithWebLLM(resumeData, jdData, mode) {
  if (!this.webgpuSupported())
    throw new Error('No WebGPU here \u2014 use Free AI (Pollinations), Ollama, or a paid key.');
  const model  = this.getWebLLMConfig().model;
  const engine = await this._getWebLLMEngine(model);   // downloads once, then cached
  const reply  = await engine.chat.completions.create({
    temperature: 0.4,
    max_tokens: Math.max(1800, this.providers.webllm.modes[mode].tokens),
    messages: [
      { role: 'system', content: 'Respond with ONLY a single valid minified JSON object.' },
      { role: 'user',   content: this.buildTailoringPrompt(resumeData, jdData, mode) }
    ]
  });
  return { success: true, provider: 'webllm', cost: 0,
           tailored: reply.choices[0].message.content };
}`,
        lesson: 'WebGPU + WebLLM make it possible to run a capable 3B\u20138B LLM with zero backend and zero cost while keeping the user data on their machine \u2014 a strong default for a privacy-first static app. Two practical lessons: (1) the first run downloads gigabytes, so a visible progress callback is essential or it looks frozen; cache the engine so later runs are instant. (2) Always provide a graceful fallback path in both the thrown error and the UI \u2014 not every browser/device exposes WebGPU \u2014 and name the concrete alternatives (Pollinations, Ollama) so users are never stuck.',
        impact: 'High \u2014 a new best-in-class free option: better and more private than the shared Pollinations endpoint, and no token/fork friction like Ollama-cloud, while the GitHub publish flow stays identical.'
    },
    {
        id: 12,
        title: 'Extraction Transparency + JD Match Score & Gap Analysis',
        category: 'UX / Trust',
        status: 'Shipped',
        role: 'Front-End',
        effort: '110 min',
        summary: 'Made résumé parsing and job-fit visible. After an upload, an extraction card shows exactly what was read (a ✅/⚠️ status, summary/skills/experience/education counts, and the raw extracted text). In the Generate tab, selecting a profile renders a content preview, and pasting a JD shows an ATS-style match score (a colour ring %), the matched keywords, and the missing keywords to add — so users finally know whether the parser worked and how well their résumé fits the job before generating.',
        motivation: 'Users could not tell if a résumé upload actually extracted anything — the parser silently pulled a few lines, and a sparse profile produced a blank résumé with no explanation. They also had no signal about how well a profile matched a given job. Two users in a row hit blank output because their uploads only yielded contact info, with no feedback that extraction had effectively failed.',
        solution: 'Added jdMatchKeywords() (stopword-filtered keyword frequency over the JD), profileTokenSet() (normalised tokens from summary + skills + experience + education + rawText), and computeJDMatch() returning {score, matched, missing}. renderExtractionPreview() runs right after parsing; renderProfilePreview() runs on profile select; renderMatchCard() runs on profile select, JD input (oninput), and JD fetch. A conic-gradient ring visualises the score with red/amber/green thresholds. Everything is a pure client-side heuristic — no API calls — and the copy reminds users never to add skills they do not have.',
        codeExample: `// ATS-style keyword overlap between a résumé and a job description.
function computeJDMatch(profile, jdText) {
  const keywords  = jdMatchKeywords(jdText);      // top JD terms, stopwords removed
  const resumeSet = profileTokenSet(profile);     // tokens from all résumé fields
  const matched = [], missing = [];
  for (const k of keywords) (resumeSet.has(k) ? matched : missing).push(k);
  const score = keywords.length
    ? Math.round(matched.length / keywords.length * 100) : 0;
  return { score, matched, missing, total: keywords.length };
}`,
        lesson: 'When an automated step (parsing, scoring) can silently under-deliver, surface its output to the user instead of hiding it — a visible "here is exactly what we read" panel turns a confusing blank result into an obvious, fixable one. A cheap keyword-overlap heuristic delivers most of the perceived value of an "ATS score" with zero backend, as long as the UI is honest that it is a heuristic and warns against keyword-stuffing skills you do not actually have.',
        impact: 'High \u2014 eliminates the "did my upload even work?" confusion, prevents blank-résumé surprises, and gives users actionable, JD-specific guidance (the exact missing keywords) before they spend a generation.'    },
    {
        id: 13,
        title: 'Learn-the-Gap: Free Learning Resources + Post-Generation Score Card & Downloadable Plan',
        category: 'UX / Career Growth',
        status: 'Shipped',
        role: 'Front-End',
        effort: '95 min',
        summary: 'Turned the JD gap analysis into an action plan. The match card now links each missing skill to free learning resources (beginner videos, full "zero-to-hero" courses, freeCodeCamp, docs) via always-valid search URLs. After generating, a result score card rates the tailored r\u00e9sum\u00e9 against the JD on the portal, lists the remaining gaps with learning links, and offers a one-click "Download learning plan (.md)" \u2014 a Markdown learning tracker. Nothing is persisted unless the user downloads it (or later commits it to their repo).',
        motivation: 'Knowing which keywords are missing is useful, but users then asked "where do I actually learn these?" and "how good is the r\u00e9sum\u00e9 I just generated?". They wanted growth guidance and a keepable record \u2014 without the app silently storing anything.',
        solution: 'Added learningLinksFor(keyword) returning SEARCH URLs (YouTube beginner + full course, freeCodeCamp, Google docs) so links never go stale or hallucinate a specific video. learningListHtml() renders them; renderMatchCard() embeds them in a collapsible section. After buildDocumentsFromProfile, resultScoreCardHtml(workingProfile, jdText) scores the TAILORED r\u00e9sum\u00e9, shows remaining gaps + learning links, and stashes window._lastLearningPlan. buildLearningPlanMarkdown() produces a Markdown table; downloadLearningPlan() Blob-downloads it on demand. Privacy-first: no storage unless the user explicitly downloads.',
        codeExample: `// Always-valid free resources (search URLs, never stale/hallucinated).
function learningLinksFor(keyword) {
  const q = encodeURIComponent(keyword);
  return [
    { label: '\u25b6 Beginner video',     url: 'https://www.youtube.com/results?search_query=' + q + '+tutorial+for+beginners' },
    { label: '\u25b6 Full course (0\u2192hero)', url: 'https://www.youtube.com/results?search_query=' + q + '+full+course+free' },
    { label: '\ud83d\udcf0 freeCodeCamp',       url: 'https://www.freecodecamp.org/news/search/?query=' + q },
    { label: '\ud83d\udd0e Docs & guides',      url: 'https://www.google.com/search?q=' + encodeURIComponent(keyword + ' tutorial documentation') }
  ];
}`,
        lesson: 'Diagnose-then-prescribe beats diagnose-only: pairing each gap with a concrete, free way to close it makes the tool feel like a coach, not just a scanner. Prefer search URLs over specific links for any auto-generated resource list \u2014 they stay valid forever and avoid recommending dead or wrong content. And honour "don\u2019t save my data": compute on the fly, keep the artifact in memory, and only persist when the user clicks download.',
        impact: 'High \u2014 closes the loop from "what\u2019s missing" to "here\u2019s how to learn it," scores the actual generated r\u00e9sum\u00e9, and gives users a portable Markdown learning tracker \u2014 all with zero server-side storage.'    },
    {
        id: 14,
        title: 'Résumé Template Gallery + AI "Top Picks" (Pick a Look, Like Word\u2019s Resume Gallery)',
        category: 'UX / Output Quality',
        status: 'Shipped',
        role: 'Front-End',
        effort: '120 min',
        summary: 'Replaced the single hard-coded résumé layout with a VISUAL gallery of 70 templates (7 layout styles — including a structural two-column Sidebar — × 10 accent colours) rendered as live SVG thumbnails, plus a build-your-own Custom designer (pick layout + any accent colour). The gallery has a search box and a scrollable, full-width two-column Step 4 so it no longer pushes the page down or gets cramped; role-aware "Top pick" badges float the best matches first. The chosen design drives both PDF and Word output, persists, and flows through single, bulk, publish, and Ollama-cloud rebuilds.',
        motivation: 'A user said the main reason they came to an AI résumé tool was to get help with wording, styling, colour, and \u2014 crucially \u2014 to CHOOSE from a variety of résumé templates (like opening Microsoft Word\u2019s resume gallery). The app only ever produced one fixed black-and-white layout, and the AI even mimicked the uploaded résumé\u2019s plain look. There was no design choice at all.',
        solution: 'Added a RESUME_TEMPLATES config (Classic ATS, Modern Blue, Executive Serif, Teal Minimal, Slate Header band, Burgundy Professional) \u2014 each with font (helvetica/times), accent/name/heading/divider colours, a header style (centered / left / colour band) and a heading style (underline / accent bar / caps-underline). buildResumePdfBlob (jsPDF) and buildResumeDocBlob (Word HTML) were refactored to render any template via a hexToRgb helper and per-style header/heading drawing. A new picker in Step 4 shows each template\u2019s name, tags and description; recommendResumeTemplates(jd, profile) surfaces three clickable "Top picks" based on role keywords. Selection is saved to localStorage and threaded through opts.resumeTemplate everywhere documents are built.',
        codeExample: `// One renderer, many looks - header & heading vary by template config.
const t = getResumeTemplate(templateId);                 // {font, accent, header, headingStyle, ...}
if (t.header === 'band') {                                // colour band w/ white name
  const [r,g,b] = hexToRgb(t.accent);
  doc.setFillColor(r,g,b); doc.rect(0,0,pageW,92,'F');
  doc.setTextColor(255,255,255); doc.text(name, pageW/2, 48, {align:'center'});
}
// "Top picks" suggester (curated shortlist, like a Word gallery)
function recommendResumeTemplates(jd, profile) {
  const text = (jd + ' ' + (profile && profile._aiJobTitle || '')).toLowerCase();
  const picks = [];
  if (/director|vp|head|principal|executive|manager|lead|program/.test(text)) picks.push('executive-serif','burgundy-pro');
  if (/engineer|developer|sre|devops|cloud|data/.test(text)) picks.push('modern-blue','teal-minimal');
  return [...new Set([...picks,'classic-ats'])].slice(0,3);
}`,
        lesson: 'When users compare you to a tool they already know (Word\u2019s resume gallery), give them that mental model directly: a visible gallery of named, described, tagged choices beats one "smart" default. Keep the structure identical and ATS-safe across templates \u2014 vary only the presentation (font, colour, header) \u2014 so design freedom never costs parseability. And reduce choice paralysis the way the user asked: surface a curated 3 "top picks" for their role instead of dumping 50 options.',
        impact: 'High — users now SEE 70 résumé designs as thumbnails (including a real two-column sidebar layout) or build a custom one, search/scroll them in a compact full-width two-column Step 4, get role-based "Top pick" badges, and the selected design carries through every output path including the published GitHub repo. Also fixed a duplicate `name` key that made template cards display hex colour codes instead of their names.'
    },
    {
        id: 15,
        title: 'More Résumé Layouts — Photo Header, Skill-Bars Sidebar, Timeline + Compact One-Page Density & Photo Upload',
        category: 'UX / Output Quality',
        status: 'Shipped',
        role: 'Front-End',
        effort: '110 min',
        summary: 'Grew the résumé gallery from 70 to ~100 designs by adding three structural layouts — a Photo Header (circular avatar or auto initials), a Skill-Bars Sidebar (skills rendered as proficiency bars), and a Timeline experience layout (accent rail + dots) — plus two global options that apply to ANY template: a Compact one-page density mode and an optional profile photo.',
        motivation: 'Users wanted the variety a real résumé builder offers: a headshot at the top, a visual skills sidebar, and a way to squeeze a long résumé onto a single page. The engine only had single-header layouts and one fixed spacing.',
        solution: 'Added three entries to RESUME_STYLES (photo/barsidebar/timeline), each auto-multiplied across the 10-colour palette. Both renderers (jsPDF and Word HTML) learned the new headers: a circular photo/initials block, a sidebar that draws rounded proficiency bars (deterministic skillLevels()), and a per-job accent rail. A getResumeDensity() toggle scales margins, font sizes and gaps by a compact factor across PDF and DOC, and getResumePhoto()/setResumePhoto() persist a data-URL photo (embedded circular in the big preview). New Step-4 controls (Density radios + photo picker) and SVG thumbnails for each layout keep the gallery WYSIWYG.',
        codeExample: `// One density knob scales the WHOLE document (PDF + DOC)
const compact = getResumeDensity() === 'compact';
const cf = compact ? 0.86 : 1;          // font/gap scale factor
const margin = compact ? 40 : 50;

// Skill "bars" — deterministic pseudo-proficiency, top skills score highest
function skillLevels(skills) {
  const n = skills.length || 1;
  return skills.map((s, i) => ({ name: s, level: Math.max(0.55, 1 - (i / Math.max(8, n)) * 0.5) }));
}

// Photo header: real avatar if uploaded, else an initials circle
if (photo) { try { doc.addImage(photo, px, py, dia, dia); drew = true; } catch (_) {} }
if (!drew) { doc.circle(cx, py + dia/2, dia/2, 'F'); doc.text(nameInitials(name), cx, y, {align:'center'}); }`,
        lesson: 'Treat "layout" and "density/photo" as orthogonal axes: encode layout in the template config, but read cross-cutting options (density, photo) inside the renderers from storage so you never have to thread them through every call site. Keep placeholders honest — an initials circle when no photo is uploaded communicates the photo layout without shipping a broken image.',
        impact: 'High — ~100 résumé designs including a headshot header, a visual skill-bars sidebar and a timeline, plus a one-click Compact mode to fit a single page. All flow through the same PDF/Word/publish paths.'
    },
    {
        id: 16,
        title: 'Big "Zoomed" Live Preview for Résumé Templates (Click or Hover to Enlarge)',
        category: 'UX',
        status: 'Shipped',
        role: 'Front-End',
        effort: '35 min',
        summary: 'Added a large live-preview panel above the template gallery. The tiny ~100px cards were hard to judge, so selecting (or even hovering) a card now renders that design at ~270px with its name, tags and description — and embeds your uploaded photo for Photo-Header designs.',
        motivation: 'A user said the little template tabs were "hard to see" and asked for the selected template to zoom out so they could actually see how it looks before generating.',
        solution: 'Reused the existing SVG thumbnail renderer at a larger CSS size in a dedicated preview stage. Cards got onmouseenter="previewResumeTemplate(id)" to preview-on-hover; leaving the gallery reverts to the selected template. resumeTemplateThumb() gained an opts.photo path that clips the uploaded data-URL into the avatar circle, so the big preview matches the real output.',
        codeExample: `// Same SVG renderer, just shown large — hover previews, click locks selection
function renderResumeTemplatePreview(previewId) {
  const t = getResumeTemplate(previewId || document.getElementById('resumeTemplate').value);
  const photo = (t.header === 'photo') ? getResumePhoto() : '';
  box.innerHTML =
    '<div class="rtp-head">…name / tags…</div>' +
    '<div class="rtp-stage">' + resumeTemplateThumb(t, { photo }) + '</div>' +
    '<div class="rtp-desc">' + t.desc + '</div>';
}`,
        lesson: 'When a picker has many small options, give one large "focus" preview that updates on hover — users browse with the mouse and commit with a click. Reusing the same render function for thumbnail AND preview guarantees the preview is truthful and costs almost nothing.',
        impact: 'Medium-High — picking a résumé design is now confident and WYSIWYG instead of squinting at thumbnails.'
    },
    {
        id: 17,
        title: 'Automatic Multi-Provider AI Failover Chain (Groq → Gemini → OpenRouter → … → Pollinations)',
        category: 'AI / Reliability',
        status: 'Shipped',
        role: 'Full-Stack',
        effort: '95 min',
        summary: 'Added six free-tier, OpenAI-compatible providers (Groq, OpenRouter, Cerebras, Together AI, GitHub Models, Cohere) and a "🔗 Auto failover chain" engine that, on each generation, tries providers in priority order, automatically SKIPS any without a key, and FAILS OVER on rate-limit / quota / server errors — ending on keyless Pollinations so it almost always succeeds.',
        motivation: 'Free AI tiers cap quickly. A user wanted the resilience of a chain: run one provider until it is rate-limited, then the next, then the next, until the job finishes — without manual switching.',
        solution: 'One generic tailorWithOpenAICompatible() handles all Bearer-token OpenAI-shaped providers. tailorResumeChain() iterates getFailoverOrder() (chain filtered to configured providers), catching errors; isRetryableError() detects 429 / 5xx / network / "rate limit"/"quota" and moves on. The Generate tab gained an "Auto failover chain" option; Settings groups the free providers with signup links; the used provider is surfaced via a toast.',
        codeExample: `isRetryableError(err) {
  const s = err && err.status;
  if (s === 429 || s === 0 || (typeof s === 'number' && s >= 500)) return true;
  return /rate limit|quota|too many requests|timeout|unavailable|5\\d\\d|429/i.test((err && err.message) || '');
},
async tailorResumeChain(resume, jd, mode, chain) {
  const order = (chain && chain.length) ? chain : this.getFailoverOrder();
  let lastErr;
  for (const id of order) {
    try { const r = await this.tailorResume(id, resume, jd, mode); r.usedProvider = id; return r; }
    catch (e) { lastErr = e; continue; }   // skip to the next provider
  }
  throw new Error('All providers failed: ' + (lastErr && lastErr.message));
}`,
        lesson: 'Design provider integrations around ONE canonical shape (OpenAI chat) so adding an engine is a config row, not new code. Make resilience the default: skip unconfigured providers, treat rate-limit/quota as "try the next one," and always terminate the chain on a keyless free provider so the user never hits a dead end.',
        impact: 'High — generation keeps working across free-tier caps by rotating engines automatically; users add as many free keys as they like and never manually switch providers.'
    },
    {
        id: 18,
        title: 'Dashboard & Settings Redesign — Compact AI Engine Chips, Categorized Providers, Key-Age & Saved Indicators',
        category: 'UX',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '80 min',
        summary: 'Redesigned the dashboard so the growing AI provider list no longer stretches the Quick Actions and Statistics cards, and rebuilt the Settings AI section into a clear, step-by-step, category-first layout with per-provider saved indicators and key-age hints.',
        motivation: 'Adding the failover-chain providers made the vertical "AI Status" list tall, which (via CSS grid stretch) inflated the sibling dashboard cards. Settings had also become cluttered with paid providers listed ABOVE free ones, no signal that a key was actually saved, and browser autofill dumping a saved password into the first (OpenAI) key field.',
        solution: 'The dashboard AI panel is now a full-width card of compact engine "chips" (green/grey status dot, short name, meta) grouped Free / Free-key / Premium / Custom, with align-items:start on the grid so nothing stretches. Settings is ordered free-first with numbered section headers (① Free · ② Free+key · ③ Premium · ④ Cloud), a reusable key card showing a ✓ saved dot and "saved N days ago", a Remove button, and autocomplete="new-password" + anti-manager data attributes so password autofill can no longer land in a key field.',
        codeExample: `// Shared readiness + "saved N days ago" for BOTH dashboard and settings
function aiKeyAgeLabel(id) {
  const s = (StorageManager.getAllAPIKeys() || {})[id];
  if (!s || !s.savedAt) return '';
  const days = Math.floor((Date.now() - new Date(s.savedAt)) / 86400000);
  return days <= 0 ? 'saved today' : 'saved ' + days + ' day' + (days>1?'s':'') + ' ago';
}
// Key input that browsers/password managers won't autofill:
// <input type="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore ...>`,
        lesson: 'CSS grid rows stretch every card to the tallest sibling — use align-items:start (or isolate the tall panel full-width) to stop one growing list from distorting the layout. For secret inputs, autocomplete="off" is not enough; use autocomplete="new-password" plus password-manager opt-out attributes, and always show whether a key is saved and how old it is, because API keys expire on a schedule.',
        impact: 'High — the dashboard stays balanced as more engines are added, and Settings is now a calm, free-first, step-by-step flow where users can see exactly which keys are saved, how old they are, and remove a mistaken one.'    },
    {
        id: 19,
        title: 'First-Run Guided Tour ("Rae") — Spotlight Coach-Marks That Show New Users What To Do Next',
        category: 'UX / Onboarding',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '70 min',
        summary: 'Added an interactive, first-run guided tour: a friendly mascot ("Rae") with a dimmed spotlight overlay walks a brand-new user through the whole flow one step at a time (Create profile → Generate → pick a free AI engine → Publish & track → where Settings live). It auto-runs once on first login and can be replayed anytime via a "🧭 Take a 60-sec tour" button. Also removed the redundant "Quick Actions" dashboard card that just duplicated the top 3-step box.',
        motivation: 'Users said there were too many steps and it was hard to follow along on first login — and that the Help/FAQ only helps AFTER you already know the app, not on day one. They asked for something that literally points and says "do this next". Separately, the "Quick Actions" card (Add Profile / Generate) was an exact duplicate of the getting-started 3-step box.',
        solution: 'Built a dependency-free tour engine (APP_TOUR_STEPS + startAppTour/positionTourStep). A single .tour-spot element uses a huge box-shadow (0 0 0 9999px rgba) to dim the page while cutting a glowing hole around the current target; a coach-mark bubble with a bobbing emoji mascot, title, body, progress dots and Skip/Back/Next is positioned below/above the target and repositioned on scroll/resize. Steps target elements by id (#tourStep1/2/3, #aiStatus, #settingsBtn); welcome/finish steps center on a fully dimmed screen. It switches to the dashboard first so targets exist, supports Esc/arrow keys, persists onboardingDone in localStorage (auto-runs only once), and is re-triggerable from a dashboard button. The duplicate Quick Actions card was deleted.',
        codeExample: `// Spotlight = one element with a giant box-shadow "hole"; bubble follows target
// .tour-spot { box-shadow: 0 0 0 9999px rgba(3,6,20,.72), 0 0 22px #38e0ff; }
function positionTourStep() {
  const step = APP_TOUR_STEPS[_tourIndex];
  const t = step.sel ? document.querySelector(step.sel) : null;
  if (t) {
    const r = t.getBoundingClientRect();
    Object.assign(spot.style, { top:(r.top-8)+'px', left:(r.left-8)+'px',
      width:(r.width+16)+'px', height:(r.height+16)+'px', display:'block' });
    // place bubble below if it fits, else above; clamp within viewport
  } else { spot.style.display='none'; bubble.classList.add('tour-bubble--center'); }
}
// Auto-run ONCE after first login
function maybeStartAppTour(){ if(!StorageManager.get('onboardingDone')) setTimeout(startAppTour, 700); }`,
        lesson: 'For multi-step tools, first-timers need guidance IN CONTEXT, not a static FAQ — a spotlight tour that points at the real UI and says "do this next" beats documentation for onboarding. Gate it behind a one-time flag but always leave a visible replay button. And audit for duplicate entry points: two controls that do the same thing (Quick Actions vs the 3-step box) add cognitive load — delete the redundant one.',
        impact: 'High — brand-new users are walked through the exact flow on first login instead of guessing among many steps; the tour is replayable on demand, and the dashboard is less cluttered after removing the duplicate Quick Actions card.'    },
    {
        id: 20,
        title: 'Multi-Page + Per-Page Guided Tour, plus Direct "Get API key" Links on Every Provider Card',
        category: 'UX / Onboarding',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '55 min',
        summary: 'Extended the guided tour beyond the dashboard: the full tour now walks across every page (Dashboard, My Profiles, Generate, Applications, History, Settings), switching tabs as it goes. Added a floating "Tour this page" button so a user can tour just the page they are on - starting there, not from the dashboard. Also added deep links straight to each provider API-key page (Gemini, Mistral, OpenAI, Claude, plus the existing free-tier providers) on the Settings cards.',
        motivation: 'Users asked why the tour ended on the dashboard and did not continue to the other pages, and wanted to replay a tour for a specific page without restarting from the top. They also wanted a fast path to where each provider issues API keys instead of hunting for it.',
        solution: 'Refactored the tour into a single ordered step list where every step carries a page key; a shared beginTour(steps) engine drives it. startAppTour() runs the whole list (auto-switching tabs via switchMainTab before spotlighting each target); startPageTour(page) filters to one page and defaults to the current active tab (read from .main-tab-content.active). renderTourStep switches to the step page first, then positions the spotlight on the next animation frame so a freshly-shown tab has laid out. A floating Tour-this-page FAB (shown only inside the app) calls startPageTour(). Provider cards gained signupUrl links (providerKeyCard renders "Get your API key at" for paid, "Get a free key at" for free tiers).',
        codeExample: `// Steps carry a page; the engine switches tabs then spotlights the target
function startPageTour(page){
  const p = page || (document.querySelector('.main-tab-content.active')||{}).id || 'dashboard';
  const steps = APP_TOUR_STEPS.filter(s => s.page === p);
  beginTour(steps.length ? steps : APP_TOUR_STEPS.slice());   // page-only, else full
}
function renderTourStep(){
  const step = _tourSteps[_tourIndex];
  if (step.page && activeTab() !== step.page) switchMainTab(step.page); // show the page
  // ...render bubble...
  requestAnimationFrame(positionTourStep);   // measure AFTER the tab lays out
}`,
        lesson: 'Model a guided tour as data (a flat list of steps, each tagged with the page it belongs to) rather than hard-coded to one screen - then the SAME engine can play the whole tour or any single page just by filtering. When a step lives on another tab, switch to it first and measure on the next animation frame so the target is laid out. And meet users where the friction is: a one-click deep link to each provider key page removes a real hunt-and-peck step.',
        impact: 'High — the tour now covers the entire portal and can be replayed per-page from a floating button, and every AI provider card links straight to its API-key page, so setup is noticeably faster and less confusing.'
    },
    {
        id: 21,
        title: 'Live Provider Status Radios — Green/Grey/Red Health Dots with Rate-Limit & Expiry Notes',
        category: 'AI / UX / Reliability',
        status: 'Shipped',
        role: 'Full-Stack',
        effort: '75 min',
        summary: 'Gave every AI engine a consistent status "radio" dot on both the dashboard chips and the Settings cards: GREEN when ready, GREY when not set up, RED when the engine recently failed. Pollinations and WebLLM are always green (no key needed); Ollama is green only once its GitHub token is added. On a real failure the dot goes RED with a plain-English note — "Free limit reached — try again in ~3 hours", "Key rejected or expired — replace it", or "Model unavailable right now — pick another" — and auto-recovers to green after a cooldown or the next successful call.',
        motivation: 'The key-based provider cards already had grey/green dots, but the no-key engines (Pollinations, WebLLM, Ollama) had none, so their readiness was inconsistent. Users also wanted to know WHY an engine is not working — a free-tier daily cap, an expired key, or a model outage — instead of a silent failure, with guidance on when to come back.',
        solution: 'Added a per-provider health store (StorageManager "providerHealth") with recordProviderHealth/getProviderHealth/clearProviderHealth. tailorResumeChain records health on each failed attempt and clears it on success; the single-provider path does the same in tailorProfileWithAI. recordProviderHealth classifies the error — 429/quota -> "limited" with a cooldown (Retry-After or 1h) and a humanized "try again in ~N hours"; 401/403/expired -> "expired"; model/unavailable -> short cooldown — and stores an until timestamp so the dot self-heals. aiProviderStatus() and providerKeyCard() now surface green/grey/red; the three no-key cards got matching dots via a freeCardStatus() helper; dashboard chips and cards show a red dot + message when unhealthy.',
        codeExample: `// Record WHY a provider failed, with a cooldown so the dot self-heals
recordProviderHealth(id, err){
  const s = err && err.status, msg = ((err&&err.message)||'').toLowerCase(), now = Date.now();
  let kind='error', until=0, label;
  if (s===429 || /rate limit|quota|exhaust/.test(msg)) {
    kind='limited'; until = now + (\+err.retryAfter||3600)*1000;
    label = 'Free limit reached — try again ' + this._humanizeUntil(until);
  } else if (s===401||s===403||/expired|invalid api key/.test(msg)) {
    kind='expired'; label='Key rejected or expired — replace it';
  } else { kind='error'; until=now+15*60*1000; label='Last attempt failed'; }
  // ...persist { kind, label, until } in providerHealth
}
// getProviderHealth() returns null once Date.now() > until  -> back to green`,
        lesson: 'Make status a first-class, consistent signal across every engine (one dot vocabulary: green/grey/red) so users can read readiness at a glance. When something fails, tell the user WHY and WHEN to retry — a "free limit reached, back in ~3h" note beats a silent error every time. Store failures with a cooldown timestamp so the UI self-heals without any manual reset.',
        impact: 'High — users instantly see which engines are ready, which need setup, and which are temporarily down (with a reason and a come-back time), turning opaque failures into clear, actionable status.'
    },
    {
        id: 22,
        title: 'Inline ⓘ Field-Help on the Cloud Generator Setup — Demystifying "Repo owner" & "Fork"',
        category: 'UX / Onboarding',
        status: 'Shipped',
        role: 'Front-End / UX',
        effort: '20 min',
        summary: 'Added a small ⓘ info button next to the "Repo owner" and "Repo name (your fork)" fields on the Ollama cloud-generator setup card. Clicking it toggles a plain-English note explaining what the field means and exactly what to do — so a non-technical user is not left guessing what a "fork" is or which value to enter.',
        motivation: 'A user pointed out that the "Repo name (your fork)" field is confusing: someone unfamiliar with GitHub sees the word "fork" and does not know what it means or what to type. The setup card had all the info in a paragraph above, but users skip long paragraphs — the help needed to sit right on the field, on demand.',
        solution: 'Rendered a reusable ⓘ button (.field-i) in each label that calls toggleFieldInfo(id) to show/hide a sibling .field-info-note div containing a short, friendly explanation. "Repo owner" clarifies it is just their own GitHub username (already pre-filled). "Repo name (your fork)" explains a fork is their personal copy of the project and that they should simply keep the default because the ⚡ Auto-create button makes it for them. No dependency on external tooltip libraries — pure toggle so it works offline in the static app.',
        codeExample: `// Label carries a lightweight ⓘ that reveals an on-field explanation
<label>Repo name (your fork)
  <button type="button" class="field-i"
          onclick="toggleFieldInfo('info-ghRepo')">ⓘ</button></label>
<div id="info-ghRepo" class="field-info-note" style="display:none;">
  🍴 A <strong>fork</strong> is your own personal copy of this project inside
  <em>your</em> GitHub account… just keep the default — the ⚡ Auto-create
  button makes the fork for you.
</div>

// Toggle helper (no library needed)
function toggleFieldInfo(id){
  const n = document.getElementById(id); if (!n) return;
  const open = n.style.display !== 'none' && n.style.display !== '';
  n.style.display = open ? 'none' : 'block';
}`,
        lesson: 'Put contextual help exactly where the confusion happens — on the field, one click away — not buried in a paragraph users scroll past. A tiny ⓘ that reveals a one-sentence "what this is and what to do" note removes jargon friction (like "fork") for non-technical users without cluttering the default view. Prefer a dependency-free toggle so it keeps working in a fully static, offline-capable app.',
        impact: 'Medium — lowers the setup drop-off for the free cloud generator by making its most jargon-heavy fields self-explanatory to first-time, non-technical users.'
    },
    {
        id: 23,
        title: 'Custom Domain — Resume Engine Pro Now Lives at rdammala.com (Cloudflare)',
        category: 'Infrastructure / Hosting',
        status: 'Shipped',
        role: 'DevOps / Platform',
        effort: '90 min',
        summary: 'Moved the app off the long GitHub Pages URL onto a clean custom domain — the tool is now served at https://rdammala.com (and www.rdammala.com) via a Cloudflare Worker with static assets. Rewrote every hardcoded rdammala.github.io/resume-engine-pro reference (30 across 12 files) to rdammala.com in one pass, including the OpenRouter HTTP-Referer, the social/OG meta tags, and the Learning Hub links.',
        motivation: 'A GitHub Pages project URL (user.github.io/repo) is long, ties the public link to a specific repo, and breaks the moment the repo is renamed or transferred (GitHub does NOT redirect Pages URLs on transfer). A custom domain decouples the public URL from the repo forever and looks far more professional on a resume.',
        solution: 'Registered rdammala.com, added it as a zone in Cloudflare, then connected it as a Custom Domain on the Worker (both apex + www — the apex needs its OWN custom-domain entry; www alone leaves rdammala.com unresolved, and browsers only *appear* to work by silently auto-prepending www). Cloudflare auto-creates the proxied A/AAAA records (apex via CNAME flattening) and provisions SSL. Then a scripted literal find/replace swapped rdammala.github.io/resume-engine-pro -> rdammala.com everywhere; validated JS with node --check afterward.',
        codeExample: `# Verify the apex authoritatively (bypasses cached negative lookups)
Resolve-DnsName rdammala.com -Type A -Server nia.ns.cloudflare.com
#  rdammala.com  A  104.21.91.254 / 172.67.183.110  -> live

# One-pass URL migration across tracked files
$files = git grep -l "rdammala.github.io/resume-engine-pro"
foreach($f in $files){
  $c = [IO.File]::ReadAllText((Resolve-Path $f))
  $n = $c -replace 'rdammala\\.github\\.io/resume-engine-pro','rdammala.com'
  if($n -ne $c){ [IO.File]::WriteAllText((Resolve-Path $f), $n) }
}`,
        lesson: 'On a custom domain you must connect BOTH the apex and www as separate custom domains — the apex is not automatic, and a browser silently rewriting rdammala.com -> www.rdammala.com hides the fact that the bare domain is dead (other browsers may not do the same). When debugging DNS, query the authoritative nameserver directly (Resolve-DnsName ... -Server <ns>.cloudflare.com) because public resolvers cache "no record" (NODATA) answers for the full SOA TTL, making a freshly-added record look missing. And a custom domain is the real fix for link-rot: it decouples the public URL from the underlying repo so you can move/rename hosting freely.',
        impact: 'High — the flagship tool now has a short, professional, permanent home (rdammala.com) that will never break when repos move, and every in-app/meta/doc reference points to it.'
    }
];

console.log("FEATURES array loaded with", window.FEATURES.length, "features");
