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
        impact: 'High \u2014 eliminates the "did my upload even work?" confusion, prevents blank-résumé surprises, and gives users actionable, JD-specific guidance (the exact missing keywords) before they spend a generation.'
    }
];

console.log("FEATURES array loaded with", window.FEATURES.length, "features");
