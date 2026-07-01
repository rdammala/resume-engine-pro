// Bugs data for Learning Hub
console.log("bugs-data.js loaded");

window.BUGS = [
    {
        id: 1,
        title: 'Module Double Declaration - "Identifier already declared" Error',
        severity: 'critical',
        status: 'Fixed',
        role: 'SRE / DevOps',
        fixTime: '45 min',
        description: 'Resume Engine Pro shows 15 console errors: "Identifier X has already been declared" for modules like StorageManager, GitHubManager, etc. All buttons appear non-responsive.',
        rootCause: 'Modules use unguarded const declarations. When pages reload or scripts load multiple times, const declarations conflict and prevent module definitions.',
        resolution: 'Implemented SILENT GUARD PATTERN on all 12 core modules to prevent redeclaration errors.',
        codeExample: 'BEFORE: const StorageManager = {...};\nAFTER: if (typeof window.StorageManager !== "undefined") {} else { const StorageManager = {...}; window.StorageManager = StorageManager; }',
        lesson: 'Guard patterns are defensive initialization programming.',
        impact: 'CRITICAL - Completely blocked application with 15 errors. All modules failed to initialize.'
    },
    {
        id: 2,
        title: 'GitHub OAuth Button Non-Responsive',
        severity: 'critical',
        status: 'Fixed',
        role: 'Test Engineer / SRE',
        fixTime: '15 min',
        description: 'The "Sign in with GitHub" button did not respond to clicks after Bug #1 fix.',
        rootCause: 'script.js was loading multiple times, causing function declarations to be re-declared.',
        resolution: 'Applied silent guard pattern to script.js with window._scriptLoaded flag.',
        codeExample: 'if (typeof window._scriptLoaded !== "undefined") {} else { window._scriptLoaded = true; ... all functions ... }',
        lesson: 'Guard patterns must be applied to ALL scripts, not just modules.',
        impact: 'CRITICAL - GitHub authentication completely non-functional.'
    },
    {
        id: 3,
        title: 'GitHub Octokit Initialization Wrong Constructor',
        severity: 'high',
        status: 'Fixed',
        role: 'Build Engineer',
        fixTime: '12 min',
        description: 'GitHub integration fails because Octokit constructor was referenced incorrectly.',
        rootCause: 'Code tried new Octokit.Octokit() instead of new window.Octokit.Octokit().',
        resolution: 'Changed to new window.Octokit.Octokit() with typeof check.',
        codeExample: 'BEFORE: const octokit = new Octokit.Octokit();\nAFTER: const octokit = new window.Octokit.Octokit();',
        lesson: 'Always prefix CDN library references with window namespace.',
        impact: 'High - GitHub authentication cannot proceed without proper Octokit initialization.'
    },
    {
        id: 4,
        title: 'PDF.js Worker Path Not Configured',
        severity: 'medium',
        status: 'Deferred to Phase 2',
        role: 'Build Engineer / Test Engineer',
        fixTime: 'N/A',
        description: 'PDF parsing fails because worker script path not configured for CDN.',
        rootCause: 'PDFKit requires separate worker file but path might be incorrect or blocked by CORS.',
        resolution: 'Deferred to Phase 2. Configured worker path in index.html.',
        codeExample: 'pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/...pdf.worker.min.js"',
        lesson: 'Worker scripts need explicit path configuration.',
        impact: 'Medium - Resume PDF parsing unavailable. Users can only upload DOCX/TXT.'
    },
    {
        id: 5,
        title: 'Docx.js CDN MIME Type Not Executable',
        severity: 'medium',
        status: 'Deferred to Phase 2',
        role: 'Build Engineer',
        fixTime: 'N/A',
        description: 'Browser refuses to execute docx.js: MIME type application/node not executable.',
        rootCause: 'CDN link points to Node.js package, not browser-compatible build.',
        resolution: 'Deferred to Phase 2. Will use proper ESM build when resume generation starts.',
        codeExample: 'CURRENT: <!-- commented out -->\nTODO: import { Document, Packer } from "docx"',
        lesson: 'Verify MIME type matches content before using CDN links.',
        impact: 'Medium - Resume document generation unavailable.'
    },
    {
        id: 6,
        title: 'Silent Failure in Resume Text Extraction',
        severity: 'high',
        status: 'Documented',
        role: 'Test Engineer / SRE',
        fixTime: 'Ongoing',
        description: 'Resume parser uploads complete but extracted text is empty or incomplete.',
        rootCause: 'ResumeParser regex patterns fail silently on different formats. PDF extraction produces garbled characters.',
        resolution: 'Add comprehensive logging at each extraction step. Validate extracted text before returning.',
        codeExample: 'console.log("Extracted name:", name); console.log("Extracted email:", email);',
        lesson: 'Add observability at extraction boundaries.',
        impact: "High - Users see blank generated resume but don't know why."
    },
    {
        id: 7,
        title: 'GitHub API Rate Limiting (60 requests/hour)',
        severity: 'high',
        status: 'Documented',
        role: 'DevOps / SRE',
        fixTime: 'Varies',
        description: 'Bulk resume generation exceeds GitHub unauthenticated API limit (60/hour).',
        rootCause: 'Each GitHub operation (create repo, push, enable pages) counts separately. No rate limit tracking.',
        resolution: 'Implement rate limit tracking before operations. Queue if near limit. Prompt for Personal Access Token.',
        codeExample: 'const remaining = await checkRateLimit(); if (remaining < 5) alert("Rate limit approaching");',
        lesson: 'External API rate limits are infrastructure constraints.',
        impact: 'High - Bulk generation fails silently after 60 calls.'
    },
    {
        id: 8,
        title: 'Browser LocalStorage Quota Management (5-10MB)',
        severity: 'high',
        status: 'Documented',
        role: 'SRE / DevOps',
        fixTime: 'Varies',
        description: 'After 50+ bulk resumes, localStorage fills up and throws QuotaExceededError.',
        rootCause: 'No quota monitoring. Each profile 50-100KB. No cleanup strategy.',
        resolution: 'Monitor usage at 80% capacity. Implement cleanup for old resumes. Add GitHub sync option.',
        codeExample: 'const usage = getStorageUsage(); if (usage.percent > 90) throw new Error("Quota exceeded");',
        lesson: 'Browser storage is a limited resource like infrastructure.',
        impact: 'High - App becomes unusable after 50+ resumes. Silent failures.'
    },
    {
        id: 9,
        title: 'UTF-8 Mojibake Recurrence in script.js (User-Facing Glyphs Corrupted)',
        severity: 'high',
        status: 'Fixed',
        role: 'Build Engineer / Test Engineer',
        fixTime: '20 min',
        description: 'BUG-001 (UTF-8 encoding corruption) was fixed in index.html but never cleaned in script.js. 30+ corrupted sequences remained, including user-facing strings: the login modal close button, the logged-in user display, the generate-success message, and the AI status badge all showed garbled characters.',
        rootCause: 'Emoji/icon characters were saved with a mismatched encoding, turning bytes like the check-mark and warning glyphs into mojibake (e.g. the green tick rendered as a 3-character sequence). The earlier fix only scrubbed index.html, leaving script.js untouched.',
        resolution: 'Mapped each corrupted sequence to its intended glyph and replaced all 30 occurrences in one pass (success, error, warning, info, user, and close icons). Verified zero corrupted bytes remained and no syntax errors were introduced.',
        codeExample: 'BEFORE: <button ...>[mojibake]</button>   // close icon\nAFTER:  <button ...>\u2715</button>\n\nBEFORE: userDisplay.textContent = `[mojibake] ${user}`;\nAFTER:  userDisplay.textContent = `\ud83d\udc64 ${user}`;',
        lesson: 'When fixing an encoding bug, grep the ENTIRE codebase for the corrupted byte patterns, not just the file where it was first spotted. Save files as UTF-8 explicitly.',
        impact: 'High - Unprofessional first impression; core UI controls (login modal, user badge, success messages) displayed garbage characters.'
    },
    {
        id: 10,
        title: 'Save Profile & Resume Upload Non-Functional (Missing Implementations)',
        severity: 'critical',
        status: 'Fixed',
        role: 'Frontend Developer / Test Engineer',
        fixTime: '40 min',
        description: 'Creating a new profile was completely broken. Clicking "Save Profile" threw "saveProfile is not defined"; the Cancel button referenced an undefined closeProfileCreation(); and uploading a resume only showed an "Implementation coming soon" alert that never parsed the file.',
        rootCause: 'The Profiles UI was wired to handler functions (saveProfile, closeProfileCreation) that were never implemented, and handleResumeUpload was a placeholder alert instead of calling ResumeParser.',
        resolution: 'Implemented saveProfile() (supports both Upload Resume and Manual Entry modes with validation), closeProfileCreation() and clearProfileForm() helpers, and a real handleResumeUpload() that parses PDF/DOCX/TXT via ResumeParser with a progress bar and toast feedback. Also hardened parsePDF() to pass a typed array to pdf.js getDocument().',
        codeExample: 'BEFORE: function handleResumeUpload(e){ alert("...coming soon"); }\nAFTER:  parsedResumeProfile = await ResumeParser.parseFile(file);\n\nNEW: function saveProfile(){ /* manual vs upload */ StorageManager.saveProfile(profile); }',
        lesson: 'UI controls must never reference handlers that do not exist. Wire-up and implementation should land together; an inline onclick to a missing function is a silent ReferenceError until clicked.',
        impact: 'Critical - Users could not create profiles at all, blocking the entire resume-generation workflow.'
    },
    {
        id: 11,
        title: 'Redundant Tab Listener Firing switchMainTab(undefined)',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer / SRE',
        fixTime: '5 min',
        description: 'Every tab click logged a console error: "Invalid tab name: undefined". The tab still switched (via inline onclick), but the console was polluted with errors on every navigation.',
        rootCause: 'A DOMContentLoaded listener attached a second click handler to every .main-tab-btn that read this.dataset.tab and called switchMainTab(it). The buttons use inline onclick="switchMainTab(\'name\')" and have NO data-tab attribute, so dataset.tab was undefined.',
        resolution: 'Removed the redundant listener entirely since the inline onclick handlers already wire every tab button. This eliminates both the undefined call and the duplicate invocation.',
        codeExample: 'REMOVED:\ndocument.querySelectorAll(".main-tab-btn").forEach(btn => {\n  btn.addEventListener("click", function(){ switchMainTab(this.dataset.tab); }); // dataset.tab === undefined\n});',
        lesson: 'Do not double-wire events. If markup already binds via inline handlers, an extra JS listener is redundant and can introduce undefined-argument bugs.',
        impact: 'Medium - Non-blocking console noise on every tab switch; obscured real errors during debugging.'
    },
    {
        id: 12,
        title: 'async Function in Load-Guard Block Not Exposed to Global Scope',
        severity: 'critical',
        status: 'Fixed',
        role: 'Frontend Developer / Build Engineer',
        fixTime: '15 min',
        description: 'After converting handleResumeUpload to an async function, the file input threw "handleResumeUpload is not defined" on change. Parsing never ran, so Save Profile reported "please upload a resume first" even though a file was selected.',
        rootCause: 'The entire script.js is wrapped in a load-guard block (if(...){}else{ ...whole file... }). Inside a block, ordinary function declarations still leak to global scope via legacy Annex B.3.3 semantics, but async (and generator) function declarations do NOT. So the inline onchange handler, which resolves names against the global scope, could not find the async handler.',
        resolution: 'Explicitly assigned window.handleResumeUpload = handleResumeUpload; after its definition. This is now the only async function referenced from inline HTML in the app.',
        codeExample: 'if (window._scriptLoaded) {} else {\n  window._scriptLoaded = true;\n  async function handleResumeUpload(e){ ... }  // block-scoped, NOT global\n  window.handleResumeUpload = handleResumeUpload; // fix: expose explicitly\n}',
        lesson: 'Block-scoped async/generator function declarations are NOT hoisted to the global object the way ordinary function declarations are. Any async function called from inline HTML on* attributes must be explicitly attached to window (or refactored out of the guard block).',
        impact: 'Critical - Resume upload silently failed; the profile-creation flow appeared broken with a misleading "upload first" message.'
    },
    {
        id: 13,
        title: 'Generate Tab Profile Dropdown Never Populated; "Use" Button Was a Dead End',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '30 min',
        description: 'After creating a profile, clicking "Use" only popped an alert ("Selected profile: X") and did nothing else. The Generate tab\'s "Select a profile" dropdown was always empty, so users could never pick a profile to generate against. The "Create New Profile" button on the Generate tab also did nothing useful.',
        rootCause: 'The #selectProfile and #bulkProfile dropdowns were never filled from StorageManager.getAllProfiles(); there was no populate function and switchMainTab did not refresh them. selectProfile(id) (the Use button) only called alert() with no navigation or selection, and loadProfileData() was an empty stub that never set currentProfile.',
        resolution: 'Added populateProfileSelects(selectedId) to fill both dropdowns from saved profiles. switchMainTab now renders profiles on the Profiles tab and populates dropdowns on the Generate tab. selectProfile(id) now switches to Generate, preselects the profile, sets currentProfile and shows a toast. loadProfileData() now sets currentProfile from the dropdown. saveProfile() refreshes the dropdowns, and the Generate-tab create button now opens the creation form.',
        codeExample: 'function populateProfileSelects(selectedId){\n  const profiles = StorageManager.getAllProfiles();\n  const html = [\'<option value=\"\">-- Select a profile --</option>\']\n    .concat(Object.keys(profiles).map(id =>\n      `<option value=\"${id}\">${profiles[id].displayName || profiles[id].name}</option>`)).join(\'\');\n  [\'selectProfile\',\'bulkProfile\'].forEach(sid => {\n    const sel = document.getElementById(sid);\n    if (sel){ sel.innerHTML = html; if (selectedId) sel.value = selectedId; }\n  });\n}',
        lesson: 'A <select> bound to data must be explicitly populated AND refreshed on the events that change that data (tab switch, save, delete). UI actions like "Use" should perform the full flow (navigate + select + set state), not just acknowledge with an alert.',
        impact: 'High - Blocked the core workflow: users could create profiles but never select one to generate a resume.'
    },
    {
        id: 14,
        title: 'Generate Buttons Were Placeholders + docx.js Not Loaded (Generation Implemented)',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / Build Engineer',
        fixTime: '90 min',
        description: 'The entire Generate Resumes page was non-functional: "Generate Now" (generateSingle), "Generate All" (generateBulk), cost estimates (updateAICost/updateBulkCost), and "Fetch JD" (fetchJDFromURL) were never implemented. Additionally, the Generator module depended on docx.js, which is commented out in index.html, so any DOCX path would have thrown.',
        rootCause: 'Generation handlers referenced by inline onclick did not exist, so clicks were silent no-ops. The pre-existing Generator/AIIntegration modules also required a paid AI API key and the docx.js library (not loaded) to produce output, so end-to-end generation could never succeed during local testing.',
        resolution: 'Implemented a local, no-API-key generator in script.js. Resumes are produced as PDF via the loaded PDFKit + blob-stream libraries and as Word-compatible .doc via an HTML/msword Blob (sidestepping the missing docx.js). Cover letters render to .doc, portfolios via PortfolioTemplates, and job details to Markdown. JD keywords are matched against profile skills to highlight relevant ones. Bulk mode splits multiple JDs on blank lines and emits one PDF per job. Cost boxes now reflect that local generation is free unless an AI key is configured.',
        codeExample: `async function generateSingle(){
  const p = StorageManager.getProfile(selectProfile.value);
  const matched = matchSkillsToJD(p, jdText);
  const pdf = await buildResumePdfBlob(p, matched);   // PDFKit + blobStream
  addDownloadLink(downloadLinks, pdf, name+"_Resume.pdf", "Resume (PDF)");
  const doc = buildResumeDocBlob(p, matched);          // HTML -> application/msword
  addDownloadLink(downloadLinks, doc, name+"_Resume.doc", "Resume (Word)");
}
window.generateSingle = generateSingle; // async: must expose explicitly (see #12)`,
        lesson: 'When a heavy dependency (docx.js) is unavailable in the browser, prefer libraries already loaded (PDFKit) and degrade gracefully: an HTML Blob with application/msword opens cleanly in Word with zero dependencies. Always expose async handlers on window inside the load-guard block.',
        impact: 'High - The core value of the app (generating tailored resume documents) now works fully offline with no API key, producing downloadable PDF/Word/HTML/Markdown files.'
    },
    {
        id: 15,
        title: 'Optional AI Tailoring Wired Into Generation (Graceful Fallback)',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer / SRE',
        fixTime: '45 min',
        description: 'Generation was local-only. Users who configure an AI provider key now get the model to tailor the resume summary, skills, and experience to each job description, while everyone else keeps the free local path. The integration must never block generation if the AI call fails.',
        rootCause: 'The pre-existing AIIntegration.tailorResume() was never called from the generation flow. It returns a JSON string (keys: summary, experience, skills, ats_suggestions, full_resume) that needed parsing and merging into the profile before document building.',
        resolution: 'Added tailorProfileWithAI(profile, jd, provider, mode): it calls AIIntegration.tailorResume, JSON-parses the response (falling back to treating prose as the summary), and merges summary/skills/experience into a cloned profile. generateSingle and generateBulk call it only when the selected provider isConfigured(); any AI/network error is caught and the flow falls back to local generation with a warning toast. Cost and aiUsed flags are recorded to history.',
        codeExample: `async function tailorProfileWithAI(profile, jd, provider, mode){
  const r = await AIIntegration.tailorResume(provider, profile, jd, mode);
  let ai; try { ai = JSON.parse(r.tailored); } catch { ai = { summary: r.tailored }; }
  const t = { ...profile };
  if (ai.summary) t.summary = String(ai.summary);
  if (Array.isArray(ai.skills) && ai.skills.length) t.skills = ai.skills;
  if (Array.isArray(ai.experience) && ai.experience.length) t.experience = ai.experience;
  return { profile: t, cost: r.cost || 0, usedAI: true };
}
// in generateSingle: try AI -> on throw, showToast(warning) and use raw profile`,
        lesson: 'Enhancements that depend on a remote service must be strictly additive: wrap them in try/catch and fall back to the working baseline so a failed/blocked API call never breaks the core feature. Note: calling provider APIs directly from the browser exposes keys and is subject to CORS (Gemini works via key-in-URL; OpenAI/Anthropic typically block browser CORS) — a server-side proxy would be the production-grade approach.',
        impact: 'Medium - Adds higher-quality tailored output for users with an API key, with zero risk to the free offline path.'
    },
    {
        id: 16,
        title: 'PDF Library Not Loaded + Free/BYO AI Providers Added',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / Build Engineer / SRE',
        fixTime: '60 min',
        description: 'Generation failed at runtime with "Generation failed: PDF library not loaded". The PDFKit + blob-stream CDN build referenced in index.html does NOT expose the expected PDFDocument / blobStream globals in the browser, so buildResumePdfBlob() could never construct a document. Separately, users were forced to choose a paid AI provider (OpenAI/Claude/Gemini/Mistral) and the Settings page never rendered any key-entry UI, so there was no way to add a key or use AI for free.',
        rootCause: 'Two issues: (1) The cdnjs PDFKit standalone build does not attach PDFDocument/blobStream to window, so the PDF code path threw immediately. (2) The AI feature assumed a paid, key-based provider and there was no free option, no Bring-Your-Own-provider option, and the #aiProvidersSettings container was never populated by any JS, leaving users unable to configure keys.',
        resolution: 'Switched PDF generation to jsPDF 2.5.2 (window.jspdf.jsPDF), which reliably exposes its constructor in the browser; buildResumePdfBlob now uses doc.splitTextToSize for wrapping and returns doc.output("blob"). Added a free, no-key provider (Pollinations, OpenAI-compatible + CORS-friendly) and a Custom/BYO provider that accepts any OpenAI-compatible endpoint (OpenRouter, Together, Groq, LM Studio, Ollama). Both Generate-tab dropdowns now lead with "None - local free", "Free AI", and "Custom" options. A new renderAISettings() builds the Settings UI so users can save keys per provider or configure a custom endpoint/model/key; it is called when the Settings tab opens.',
        codeExample: 'function buildResumePdfBlob(profile, matched){\n  return new Promise((resolve, reject) => {\n    const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;\n    if (!jsPDFCtor) return reject(new Error("PDF library not loaded"));\n    const doc = new jsPDFCtor({ unit: "pt", format: "letter" });\n    const lines = doc.splitTextToSize(profile.summary, 540);\n    doc.text(lines, 36, 72);\n    resolve(doc.output("blob"));\n  });\n}\n// Free provider: POST https://text.pollinations.ai/openai { model:"openai", messages:[...] } - no key',
        lesson: 'CDN builds of the same library differ in what they attach to the global scope; never assume a global exists - verify and prefer a build with a documented browser global (jsPDF over the PDFKit standalone). For AI features, make the free/no-key path first-class and additive: offer a free provider and a Bring-Your-Own OpenAI-compatible option so users authenticate with their own accounts/tokens instead of requiring a payment gateway.',
        impact: 'High - Restores end-to-end document generation (PDF works again) and removes the paid-only AI barrier: anyone can tailor resumes for free or with their own AI account.'
    },
    {
        id: 17,
        title: 'Generated Documents Were Empty - Resume Parser Lost All Data',
        severity: 'critical',
        status: 'Fixed',
        role: 'Frontend Developer / Test Engineer',
        fixTime: '75 min',
        description: 'With "None - generate locally" selected, the downloaded Resume, Cover Letter, and Portfolio contained almost no data - only the profile reference name appeared (e.g. "pesi-test"), with empty Summary, Skills, Experience, and Education. The cover letter even used a stray JD heading ("Why TrueML?") as the job title. The expectation was a curated resume built from the uploaded resume + pasted job description.',
        rootCause: 'The ResumeParser extracted almost nothing from uploaded PDFs. parsePDF flattened every text item with .join(" "), destroying line breaks, so the entire resume became one giant line. All downstream extractors were line/keyword based (extractSummary took the 3 lines after a "summary" line; extractExperience needed Title+Year regex; extractSkills sliced 500 chars after the word "skill"), so with no line structure they returned empty arrays/strings. The saved profile therefore had only a name, and the generators faithfully rendered empty sections. Separately, extractJobMeta just took the first non-empty JD line as the title.',
        resolution: 'Rewrote PDF text extraction to reconstruct line breaks from each text item vertical position (item.transform[5]); a change in Y starts a new line. Replaced keyword extraction with a section splitter (splitSections) that detects standard headers (Summary, Experience, Education, Skills, Certifications, Projects) and assigns following lines to each section. New extractors build a real summary, a de-duplicated skills list (split on commas/pipes/bullets), grouped experience entries (year/separator lines start a new role; bullets become the description), and an education list. Added a normalizeProfile safety net: if structured parsing still yields nothing but rawText exists, surface the raw text so the document is never empty. extractJobMeta now prefers a "Job Title:"/"Position:" label or a role-keyword line and skips question headings, and best-effort extracts the company.',
        codeExample: 'async parsePDF(file){\n  // ... per page:\n  let line = "", lastY = null; const pageLines = [];\n  for (const item of content.items){\n    const y = Math.round(item.transform[5]);\n    if (lastY !== null && Math.abs(y - lastY) > 2){ pageLines.push(line.trim()); line = ""; }\n    line += item.str + " "; lastY = y;\n  }\n}\nsplitSections(lines){ /* map header regex -> {summary, experience, education, skills} */ }',
        lesson: 'PDF.js returns positioned text fragments, not lines - joining them with spaces silently destroys the structure every section parser depends on. Reconstruct lines from the Y coordinate first. Build parsers around section headers (which resumes reliably have) rather than brittle per-line keyword guesses, and always keep a rawText fallback so a parsing miss degrades to "shows everything" instead of "shows nothing".',
        impact: 'Critical - The generated resume/cover letter/portfolio now contain the actual uploaded resume content tailored to the job description, restoring the core promise of the app for free, local generation.'
    },
    {
        id: 18,
        title: 'ResumeParser Module "MISSING" - Orphaned Method Broke the Whole File',
        severity: 'critical',
        status: 'Fixed',
        role: 'Build Engineer / Frontend Developer',
        fixTime: '15 min',
        description: 'After the parser rewrite (bug #17), the live health check showed "ResumeParser: ❌ MISSING" and resume uploads failed with "ResumeParser module not loaded". Every other module loaded fine. The browser silently refused to define window.ResumeParser.',
        rootCause: 'A string-replace edit during the rewrite removed the "extractEmail(lines) {" method header but left its body in place. The result was an orphaned statement (const match = ...) sitting between two object-literal methods, producing "SyntaxError: Unexpected identifier" at parse time. A file with a syntax error is never executed, so window.ResumeParser = ResumeParser at the bottom never ran and the module appeared missing. The VS Code JS language service did NOT flag the error, so it slipped through; only node --check surfaced it.',
        resolution: 'Restored the missing "extractEmail(lines) {" method header so the body belongs to a real method again, then validated with "node --check core/resume-parser.js" (and script.js) before committing. Both now pass.',
        codeExample: '// BROKEN: header dropped, body orphaned inside the object literal\n    extractEducation(sections, lines) { /* ... */ },\n\n        const match = lines.find(l => l.match(/.../));  // <-- Unexpected identifier\n        return match ? ... : "";\n    },\n\n// FIXED:\n    extractEmail(lines) {\n        const match = lines.find(l => l.match(/.../));\n        return match ? ... : "";\n    },',
        lesson: 'Editor linters do not always catch JavaScript syntax errors in plain .js files - always run "node --check <file>" after non-trivial edits to client-side JS. When a module reports as "missing" at runtime but the file is clearly included, suspect a parse-time SyntaxError that aborts the whole script (and silently skips the window.X = X export at the end).',
        impact: 'Critical - Restored resume parsing/upload entirely; without the export the app could not load any uploaded resume.'
    },
    {
        id: 19,
        title: 'Learning Hub Data File Silently Broken - Multi-line Single-Quoted Strings',
        severity: 'high',
        status: 'Fixed',
        role: 'Build Engineer / Documentation',
        fixTime: '10 min',
        description: 'While validating the parser fix with "node --check", the Learning Hub data file learning-hub/bugs-data.js was found to have a SyntaxError of its own: "Invalid or unexpected token" at bug #14. Because the file never parsed, window.BUGS was never created, so the entire Bug Tracking table and modals in the Learning Hub silently rendered nothing - a latent break introduced in an earlier session that went unnoticed because nobody ran a syntax check.',
        rootCause: 'Two codeExample values (bugs #14 and #15) were written as single-quoted string literals that spanned multiple physical lines. JavaScript single- and double-quoted strings cannot contain raw newlines, so the parser failed at the first line break. A failed parse aborts the whole file, leaving window.BUGS undefined and the bug tracker empty. The error was invisible in the browser unless the console was open, and the VS Code linter did not surface it.',
        resolution: 'Converted the offending multi-line codeExample values from single quotes to backtick template literals (which legally span multiple lines), confirming none contained ${...} interpolation. Re-ran "node --check learning-hub/bugs-data.js" (pass) and loaded the file in Node to assert window.BUGS.length === expected count. Going forward, multi-line code snippets in bugs-data.js must use backticks or single-line strings with \\n.',
        codeExample: '// BROKEN - newline inside a single-quoted string is a SyntaxError\ncodeExample: \'async function generateSingle(){\n  const p = ...;\n}\',\n\n// FIXED - backtick template literal can span lines\ncodeExample: `async function generateSingle(){\n  const p = ...;\n}`,\n\n// Validate: node --check learning-hub/bugs-data.js\n// Assert load: node -e "window={}; require(\'./learning-hub/bugs-data.js\'); console.log(window.BUGS.length)"',
        lesson: 'Documentation and data files are code too - a broken data file can disable an entire feature with zero visible error. Validate every committed .js (including data/content files) with node --check, and prefer backtick template literals for any string that contains code snippets or spans multiple lines.',
        impact: 'High - Restored the entire Learning Hub Bug Tracking view (table + detail modals); window.BUGS now loads all documented bugs again.'
    },
    {
        id: 20,
        title: 'AI Output Rendered as Raw JSON + Garbled PDF Glyphs + Unstyled White Form Controls',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / SRE',
        fixTime: '70 min',
        description: 'A batch of user-reported defects on the Generate flow: (1) Documents tailored with the free Pollinations AI came out as the raw JSON the model returned (the whole {summary, experience, skills} blob dumped into the resume) instead of a formatted resume. (2) The PDF rendered special characters (en-dashes, bullets, smart quotes) as garbage "&"-separated glyphs. (3) The profile select, AI Provider, and Generation Mode dropdowns plus the URL field rendered as plain white-on-white, unreadable boxes. (4) The Paste-Text JD textarea could be dragged/resized until it overlapped other columns and could not be restored without a page refresh (which wiped pasted text). (5) The Generation Mode options still showed dollar price tags even when a free provider (None / Pollinations / Custom) was selected. (6) Uploaded-resume profile cards showed Untitled / N/A / 0 instead of the captured name, email, phone, and skills.',
        rootCause: 'AI models wrap their JSON answers in markdown ```json code fences and sometimes add prose, so JSON.parse() failed and the catch-block stuffed the entire response into the summary. The AI experience objects also used a different shape (role/company/location/dates/details[]) than the document builder expected (position/company/year/description), so even valid JSON would not render. jsPDF built-in fonts are WinAnsi/Latin1 and cannot draw characters above U+00FF, producing garbled output. The generator-step selects/inputs/textareas live OUTSIDE .form-group, so they never inherited the dark-theme form styling. The JD textarea had the browser default resize:both with no max bounds. Generation Mode price labels were hard-coded in the HTML. Upload profiles never captured/echoed email/phone/skills.',
        resolution: 'Added parseAIResponse() to strip ```json/``` fences, isolate the first {...} block, and JSON.parse with a clean-text summary fallback; added normalizeAIExperience() to map the model shape (role/title, company+location, dates/duration, details[]/responsibilities[]/bullets[]) onto the builder shape. Added an ascii() sanitizer in buildResumePdfBlob that converts smart quotes/dashes/bullets/ellipsis to ASCII and drops remaining non-Latin1 chars before every doc.text(). Added CSS for .generator-step and .jd-input selects/inputs/textareas (dark bg, light text, custom SVG dropdown arrow) and select option {background:#14162a} to fix the white dropdown popup; constrained #jdText/#bulkJDs to resize:vertical with min/max-height and max-width:100%, and laid out #urlJD as flex with an oninput title so the full pasted link shows on hover. Added refreshGenerationModeLabels(provider) to strip the price tags for free providers. Added editable Email/Phone/Skills fields to the upload form, auto-filled from the parser and merged into the saved profile, and the profile card now shows displayName/name/email/phone/skill-count.',
        codeExample: `function parseAIResponse(raw){
  let s = String(raw).replace(/\\\`\\\`\\\`[a-zA-Z]*\\s*/g,'').replace(/\\\`\\\`\\\`/g,'').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  try { return JSON.parse(a!==-1 && b>a ? s.slice(a,b+1) : s); }
  catch { return { summary: s }; }   // never dump raw JSON again
}
function normalizeAIExperience(e){
  return {
    position: e.position||e.role||e.title||'',
    company: [e.company||e.employer||'', e.location||''].filter(Boolean).join(', '),
    year: e.year||e.dates||e.duration||'',
    description: (e.details||e.responsibilities||e.bullets||[]).join('\\n') || e.description || ''
  };
}
// jsPDF is Latin1: sanitize before drawing
const ascii = s => String(s).replace(/[\\u2018\\u2019]/g,"'").replace(/[\\u201C\\u201D]/g,'"')
  .replace(/[\\u2013\\u2014]/g,'-').replace(/[\\u2022\\u25CF\\u00B7]/g,'-')
  .replace(/[^\\x09\\x0A\\x0D\\x20-\\x7E]/g,'');`,
        lesson: 'LLMs return JSON inside markdown code fences and with model-specific field names - always strip fences, isolate the {...} block, parse defensively, and normalize the shape before use; never let a parse failure leak raw JSON to the user. jsPDF built-in fonts are Latin1-only, so sanitize text to ASCII (or embed a Unicode font) to avoid garbled glyphs. Form controls that sit outside the shared .form-group wrapper get no theme styling - either reuse the wrapper or add explicit selectors, and remember <option> needs its own dark background to fix white-on-white popups. Constrain resizable textareas (resize:vertical + max-width:100%) so they cannot overlap the layout.',
        impact: 'High - Free-AI generation now produces properly formatted resumes (not raw JSON), PDFs render clean text, all Generate-tab controls are readable on the dark theme, the JD box no longer breaks the layout, free providers hide price tags, and uploaded profiles show real contact info and skills.'
    },
    {
        id: 21,
        title: 'Pollinations AI Still Dumped Raw JSON - Oversized Prompt Truncated the Response',
        severity: 'critical',
        status: 'Fixed',
        role: 'Frontend Developer / Prompt Engineering / SRE',
        fixTime: '50 min',
        description: 'Even after bug #20 added a fence-stripping JSON parser, resumes/cover letters/portfolios generated with the free Pollinations AI STILL rendered the entire model response as raw JSON in the Summary section (visible {"summary":..., "experience":[...], "skills":[...], "ats_suggestions":[...], "full_resume":"..."}). The structure/headings were correct, but the content was the JSON blob, so the output looked unformatted.',
        rootCause: 'The tailoring prompt asked the model for FIVE keys including "ats_suggestions" and a giant "full_resume" string containing the whole resume with embedded newlines and quotes. That field (a) bloated the output past the provider default token limit so the JSON was TRUNCATED mid-string, and (b) embedded raw newlines/quotes that make JSON invalid. JSON.parse therefore failed, and bug #20\'s fallback still set summary to the cleaned-but-raw JSON text. No max_tokens was sent, and the prompt sent the full resume with JSON.stringify(..., null, 2) wasting tokens.',
        resolution: 'Redesigned the prompt to request ONE minified JSON object with only three lean keys (summary as a single newline-free string, skills[], experience[{role,company,location,dates,details[]}]) and explicit rules to escape quotes and avoid raw newlines. Dropped full_resume and ats_suggestions entirely. Sent a compact candidate payload (no pretty-print) plus max_tokens (>=1800), temperature 0.4, and response_format:{type:"json_object"} to Pollinations/custom requests. Hardened parseAIResponse with field-level recovery (regex for summary, balanced-bracket array extraction for skills/experience) so a partially-truncated response still yields usable structured data, and it now returns {} rather than the raw JSON on total failure. Added a guard so a summary that still looks like JSON is rejected (keeps the original resume summary), and experience details now render as bullet lines.',
        codeExample: `// Lean schema (no full_resume / ats_suggestions) + hard limits
body: JSON.stringify({ model:'openai', temperature:0.4, max_tokens:1800,
  response_format:{type:'json_object'},
  messages:[{role:'system',content:'Respond with ONLY one valid minified JSON object.'},
            {role:'user',content:prompt}] });

// Never let JSON leak into the resume again
const looksLikeJson = sum.startsWith('{') || /"(summary|experience|skills)"\\s*:/.test(sum);
if (sum && !looksLikeJson) tailored.summary = sum;

// Recover fields from a truncated response instead of dumping the blob
const expArr = extractBalancedArray(candidate, '"experience"');
if (expArr) { try { recovered.experience = JSON.parse(expArr); } catch(_){} }`,
        lesson: 'A "return JSON" instruction is not enough: asking for a large nested string field (full_resume) almost guarantees the response exceeds the token budget and gets truncated into invalid JSON. Keep the schema minimal and flat, forbid raw newlines inside strings, set an explicit max_tokens, and request response_format json_object. Always pair a strict prompt with a tolerant parser that recovers individual fields from malformed output and degrades to the original data - never to the raw blob.',
        impact: 'Critical - Free Pollinations AI now returns compact, parseable JSON that maps cleanly into the resume template, so PDF/Word/portfolio outputs are properly formatted ATS resumes instead of a JSON dump.'
    },
    {
        id: 22,
        title: 'AI Produced an Identical Resume - Thin Profile + Echo-Prone Prompt; Added Ollama/Llama 3',
        severity: 'high',
        status: 'Fixed',
        role: 'Prompt Engineering / Frontend Developer',
        fixTime: '60 min',
        description: 'After the JSON-parsing fixes, the free AI ran but the generated resume came out essentially identical to the uploaded input - no real tailoring, no ATS optimization. The expectation was that the model extracts everything from the original resume(s) and curates a NEW, professional, ATS-optimized resume targeted at the pasted job description.',
        rootCause: 'Two issues. (1) The model only received the THIN parsed profile (the structured fields the parser managed to extract), which is lossy, and the prompt said "use ONLY facts present, rephrase and reorder" - a small model (gpt-oss-20b on Pollinations) interpreted that conservatively and largely echoed the input. (2) The prompt never gave the model the full original resume text, so it had little raw material to curate from, and it was not explicitly instructed to inject JD keywords, quantify bullets, or rewrite the summary for the target role.',
        resolution: 'Reworked buildTailoringPrompt to (a) include the candidate\'s FULL original resume text (rawText, up to 8000 chars) as the authoritative source alongside the structured fields, and (b) give explicit ATS-optimization instructions: mirror exact JD terminology/keywords where truthful, rewrite the summary into 3-4 targeted sentences, convert each experience line into an achievement bullet (action verb first, quantified), and reprioritize skills by JD relevance - while never fabricating employers/titles/dates. Also added Ollama (Llama 3) as a second free, private provider: an OpenAI-compatible route (tailorWithOllama) defaulting to http://localhost:11434/v1/chat/completions with a configurable endpoint for GitHub Codespaces, a Settings card, dropdown entries, and a scripts/ollama-generate.js CLI + OLLAMA-SETUP.md for the Codespaces run-and-delete workflow.',
        codeExample: `// Feed the model EVERYTHING, then tell it to genuinely rewrite for ATS
const rawText = (resumeData.rawText || '').slice(0, 8000);
prompt = \`...CANDIDATE FULL RESUME TEXT (authoritative source):
"""\${rawText}"""
TARGET JOB DESCRIPTION:
"""\${jdData}"""
Mirror exact JD keywords (only where truthful), rewrite the summary for THIS role,
make every bullet action-verb-first and quantified, reprioritize skills by relevance...\`;

// New free provider, OpenAI-compatible, configurable for Codespaces
async tailorWithOllama(resumeData, jdData, mode) {
  const cfg = this.getOllamaConfig();           // default localhost:11434
  const res = await fetch(cfg.endpoint, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model: cfg.model || 'llama3', stream:false, temperature:0.4, messages:[...] }) });
  return { success:true, provider:'ollama', cost:0, tailored: (await res.json()).choices[0].message.content };
}`,
        lesson: 'For genuine resume tailoring, give the model the FULL source resume text (not just lossy parsed fields) and instruct it concretely on HOW to optimize (keyword mirroring, quantification, summary rewrite, skill reordering) - a vague "rephrase, use only facts" prompt makes small models echo the input. Offering a local model (Ollama/Llama 3) gives users a free, private alternative; expose it as an OpenAI-compatible provider with a configurable endpoint so it works both locally and via a Codespaces forwarded port.',
        impact: 'High - The AI now meaningfully transforms the resume into an ATS-optimized, role-targeted document, and users have a second free, fully-private option (Ollama/Llama 3) runnable on their machine or a disposable Codespace.'
    },
    {
        id: 23,
        title: 'Ollama Required a Local Server (ERR_CONNECTION_REFUSED) - Replaced with Zero-Setup Cloud Runner',
        severity: 'high',
        status: 'Fixed',
        role: 'Platform / Frontend Developer / DevOps',
        fixTime: '120 min',
        description: 'Selecting Ollama and clicking Generate produced repeated "Failed to load resource: net::ERR_CONNECTION_REFUSED  localhost:11434/v1/chat/completions" errors, because the browser was trying to reach an Ollama server that was not running on the user\'s machine. Asking a static GitHub Pages site to depend on a local daemon (or a manually-forwarded Codespaces port) is brittle and confusing.',
        rootCause: 'The Ollama provider pointed the browser directly at http://localhost:11434. A static, client-only site has no Ollama runtime and no backend, so unless the user manually installed Ollama, ran OLLAMA_ORIGINS=* ollama serve, and (for Codespaces) forwarded the port publicly, every request was refused.',
        resolution: 'Re-architected Ollama into a fully automated, ephemeral GitHub Actions pipeline. On Generate, the site dispatches the ollama-resume.yml workflow (workflow_dispatch) via the GitHub REST API using a user-supplied fine-grained token stored (obfuscated) in localStorage. A fresh free runner installs Ollama, pulls Llama 3, runs scripts/ollama-actions-generate.js to tailor the resume to the JD, commits the result to generated/<run_id>.json, then self-destructs automatically. A new core/github-runner.js dispatches the run, polls run status, and fetches the committed JSON; the browser shows a live progress card (spinner + percentage + step text) and then builds the PDF/Word/Portfolio locally from the tailored data. GitHub Actions is preferable to Codespaces here because the runner is destroyed automatically when the job ends - no manual "delete the node" step.',
        codeExample: `// Browser dispatches the workflow (no local server, no backend)
await fetch(\`https://api.github.com/repos/\${owner}/\${repo}/actions/workflows/ollama-resume.yml/dispatches\`, {
  method:'POST',
  headers:{ Authorization:'Bearer '+token, Accept:'application/vnd.github+json' },
  body: JSON.stringify({ ref:'master', inputs:{ run_id, resume_data, job_description, model:'llama3.2' } })
});
// Workflow (ephemeral runner) — installs Ollama, generates, commits, self-destructs
//   curl -fsSL https://ollama.com/install.sh | sh
//   ollama serve & ; ollama pull llama3.2
//   node scripts/ollama-actions-generate.js   # writes generated/<run_id>.json
//   git add generated/ && git commit && git push
// Browser polls the run, then reads the committed file
const r = await fetch(\`.../contents/generated/\${runId}.json?ref=master\`);
const aiData = JSON.parse(decodeURIComponent(escape(atob(r.content))));`,
        lesson: 'A static site cannot depend on a localhost daemon. To run a free local-style model (Ollama/Llama 3) without any server, trigger an ephemeral CI runner (GitHub Actions workflow_dispatch) that does the heavy lifting and commits the artifact back - then poll + fetch from the browser. Prefer Actions over Codespaces for "create node -> run -> commit -> destroy" because Actions runners self-destruct automatically. Keep workflow_dispatch inputs under ~64KB, set run-name to the run id so the dispatch can be located (the API returns no run id), and store the PAT scoped to a single repo since it lives in the browser.',
        impact: 'High - Ollama now works with zero local setup: one-time GitHub token, then click Generate. Eliminates the ERR_CONNECTION_REFUSED failures, gives a transparent live progress card, and runs entirely on free, self-destructing infrastructure at $0 cost.'
    },
    {
        id: 24,
        title: 'Ollama Cloud Run "Could Not Be Located" + 8B Model OOM-Killed Mid-Generation',
        severity: 'high',
        status: 'Fixed',
        role: 'Platform / DevOps / Frontend Developer',
        fixTime: '60 min',
        description: 'After the cloud Ollama pipeline went live, two failures surfaced in real use: (1) the browser reported "Started the cloud job but could not locate the run. Check the repo Actions tab." even though the run WAS created, and (2) the GitHub Actions job itself failed at the generate step with "Generation failed: fetch failed" after ~5 minutes. Users had no guidance on what to do and worried a server was left running and billing them.',
        rootCause: 'Two distinct issues. (1) findRun polled the /actions/runs list for only 20x3s = 60s, and the browser/CDN cached that GET response, so the newly-created run did not appear inside the window even though dispatch + run-naming were correct (display_title/name both contained the runId). (2) The user had selected llama3 (8B); on the free CPU runner (~16GB RAM) the model was OOM-killed while loading/generating, dropping the TCP connection and surfacing in Node as a generic "fetch failed".',
        resolution: 'Hardened both layers. Client: findRun now polls up to 40x3s (~2 min) and adds a cache-buster query param + Cache-Control: no-cache header to defeat stale list responses; the timeout error is now reassuring and actionable. Added an actionable failure card (direct Actions-tab link, wait/retry steps, explicit "public repo = free, runner self-destructs, no cost" note). Runner: default model switched to llama3.2 (3B), callOllama now uses an AbortController timeout (9 min), keep_alive, a capped num_ctx of 4096, and retries once on a dropped connection. Workflow gained an if: failure() step that dumps the tail of ollama.log + free -h for future diagnosis. Settings card migrates a saved llama3 to llama3.2 and warns against 8B.',
        codeExample: `// findRun: defeat eventual-consistency + browser caching
const res = await this.api(
  \`/repos/\${owner}/\${repo}/actions/runs?event=workflow_dispatch&per_page=20&t=\${Date.now()}\`,
  { headers: { 'Cache-Control': 'no-cache', 'If-None-Match': '' } }
); // poll up to 40 x 3s

// callOllama: survive a slow/heavy free CPU runner
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 9 * 60 * 1000);
fetch(url, { signal: controller.signal, body: JSON.stringify({
  model, stream:false, keep_alive:'5m', options:{ num_ctx:4096 }, messages
})}); // retry once on "fetch failed"; default model = llama3.2 (3B), NOT llama3 (8B)`,
        lesson: 'GitHub run-list API is eventually consistent AND cacheable - when locating a just-dispatched run from the browser, always add a cache-buster + no-cache header and poll generously (minutes, not seconds). Match a free CPU CI runner memory budget: a 3B model (llama3.2) is the safe default; an 8B model (llama3) can be OOM-killed mid-inference and surface only as a generic "fetch failed", so cap num_ctx, set an AbortController timeout, retry once, and dump the server log on failure. Finally, when a long-running cloud job can fail, the UX must tell the user exactly what to do (link to the run, wait/retry) and reassure them about cost - public-repo Actions are free and the runner self-destructs.',
        impact: 'High - The cloud Ollama flow is now resilient end-to-end: runs are reliably located despite API lag, generation no longer crashes from OOM on the default model, failures give clear recovery steps with a direct Actions link, and users are explicitly reassured there is no lingering server and $0 cost.'
    },
    {
        id: 25,
        title: 'Cloud Resume Silently Lost: generated/ Was .gitignored + No History Logged for Failed/Partial Runs',
        severity: 'high',
        status: 'Fixed',
        role: 'DevOps / Frontend Developer / SRE',
        fixTime: '75 min',
        description: 'A live test exposed three end-user pain points. (1) The GitHub Actions run reached the generate step, produced generated/<run_id>.json successfully, then FAILED at the commit step - so the browser polled, never found the file, and showed "Failed to fetch". (2) The in-progress UI sat on a static "Failed to fetch" poster while the job was actually still running on GitHub, with no periodic "still working" updates. (3) After the failure, refreshing the page showed no trace of the attempt - the Generation History only recorded fully successful runs, and even those showed "Provider: undefined / Mode: undefined" as plain cards.',
        rootCause: 'Three independent gaps. (1) .gitignore contained generated/, and the workflow ran git add generated/ under bash -e; git add on an ignored path exits 1, aborting the commit step, so the artifact was never pushed and the runner self-destructed with the result trapped inside it. (2) waitForCompletion only invoked the progress callback on a status CHANGE, so a multi-minute in_progress phase produced no heartbeat. (3) saveGeneration was called once, only on full success, and omitted provider/mode/status; there was no updateGeneration to transition an attempt from in-progress to success/failed, and no failure path recorded anything.',
        resolution: 'Workflow: switched to git add -f generated/ so the committed artifact is never blocked by .gitignore. Storage: saveGeneration now assigns a stable id (and returns it), plus a new updateGeneration(id, patch) to transition a record. generateSingle now logs EVERY attempt up-front as status:in-progress (with profile, provider, mode, timestamp) and patches it to success (cost, outputs, matched skills) or failed (with the error reason) - including the Ollama token-missing and cloud-error paths. Runner: waitForCompletion adds an elapsed timer and emits a heartbeat on every status change AND roughly every ~21s, and the cloud card now shows "(Xm Ys elapsed). You can switch tabs and keep working - I will keep monitoring." The failure poster was softened from "did not complete / Failed to fetch / What to do" to "Still finishing... the job runs on GitHub servers, not this tab - navigate away and I will keep monitoring, or you can also:". Finally, Generation History was rebuilt from individual cards into a sortable-friendly table (Profile, Provider, Mode, Status badge, Cost, Outputs, Date & Time, Details/Reason).',
        codeExample: `// Workflow: never let .gitignore block the artifact
git add -f generated/   // was: git add generated/  (exited 1 under bash -e)

// Storage: log every attempt, then patch the outcome
const id = StorageManager.saveGeneration({ profile, provider, mode, status:'in-progress', cost:0, outputs:0 });
// ...on success:
StorageManager.updateGeneration(id, { status:'success', cost, outputs, matchedSkills });
// ...on any failure / early return:
StorageManager.updateGeneration(id, { status:'failed', error: e.message });

// Runner heartbeat so the UI never looks stuck
if (onProgress && (changed || i % 7 === 0)) onProgress(r.status, r, elapsedSec);`,
        lesson: 'When a CI job is the source of truth for an artifact, never leave its output directory in .gitignore - use git add -f (or a !generated/ un-ignore) or the commit step silently dies AFTER the expensive work, stranding the result in a runner that then self-destructs. For long async jobs, a status-change-only progress callback looks frozen; add a time-based heartbeat with elapsed time and tell users they can leave the tab. And treat history as an audit log, not a success log: record every attempt the moment it starts, give each a stable id, and patch it to success/failed (with the reason) so a refresh never erases evidence of what the user tried. A table beats cards once you track status + failure reasons.',
        impact: 'High - No more silently lost resumes (artifact always commits), the progress card stays alive with elapsed-time heartbeats and reassures users they can multitask, and every generation attempt - successful, failed, or in-progress - is now permanently logged in a clear table with provider, mode, status, cost, timestamp, outputs, and the failure reason.'
    },
    {
        id: 26,
        title: 'Cloud Run Marked Failed Forever: One Transient "Failed to fetch" Aborted the Flow + No Auto-Reconciliation to Success',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / SRE',
        fixTime: '90 min',
        description: 'A user noticed that the very first Generate Now showed a start-failed notification, yet the GitHub Actions tab showed the run actually started and was running healthy. They asked the honest question: if that run comes back green from Actions, will the history status move from Failed to Success? The truthful answer was NO - it stayed Failed permanently. Two problems caused this. (1) A single transient browser fetch rejection (Failed to fetch, from Edge Tracking Prevention, a network blip, or GitHub API eventual-consistency) threw out of the polling loop and aborted the whole foreground flow even though the dispatch had succeeded and the run was alive. (2) There was no mechanism that ever revisited an in-progress or failed entry to flip it to Success once the real run completed, so the UI stayed wrong forever.',
        rootCause: 'The polling helpers treated any thrown error as fatal. findRun, waitForCompletion, and fetchResult wrapped only the not-ok HTTP branch, not the fetch() call itself - so a rejected promise (Failed to fetch) bubbled straight up and rejected the generate flow. Separately, generation was strictly fire-and-forget in the foreground: once the await chain rejected, the history entry was patched to Failed and nothing was ever scheduled to re-check the run. The browser had a runId in hand but never persisted it against the attempt, so even a manual revisit had nothing to reconcile against.',
        resolution: 'Resilience: every fetch() in findRun, waitForCompletion, and fetchResult is now wrapped in try/catch that CONTINUES the loop on a transient throw (treating it like a not-yet-ready poll) instead of rejecting; only a definitive non-success conclusion throws. Reconciliation: a new checkAndFetch(runId) returns pending, success (with data), or failed without ever throwing. The foreground now persists the runId onto the in-progress history record immediately after dispatch, and classifies catch errors: a definitive failure marks Failed, but an indeterminate one (Failed to fetch / timeout) KEEPS the record in-progress. A background resumePendingRuns() scans history for in-progress entries that carry a runId, calls checkAndFetch, and on success rebuilds the documents (mergeTailored + buildDocumentsFromProfile, both extracted for reuse) and flips the record to Success - on page load, after an interrupted attempt, and on a 30s interval until none remain.',
        codeExample: `// Polling is now resilient: a transient throw CONTINUES, it does not abort.
let r = null;
try {
    const res = await api(\`/actions/runs/\${id}\`);
    r = await res.json();
} catch (_) { r = null; }            // Failed to fetch -> treat as not-ready
if (r && r.status === 'completed' && r.conclusion !== 'success') {
    throw new Error(\`Run finished as \${r.conclusion}\`); // only definitive failure throws
}

// Persist the runId so a background monitor can finish the job later.
const { runId } = await GitHubRunner.dispatch({ ... });
StorageManager.updateGeneration(histId, { runId });

// Auto-flip in-progress -> Success when the real Actions run completes.
async function resumePendingRuns() {
    const pending = StorageManager.getHistory(50)
        .filter(h => h.status === 'in-progress' && h.runId);
    for (const item of pending) {
        const res = await GitHubRunner.checkAndFetch(item.runId); // never throws
        if (res.state === 'success') await finalizeResumedRun(item, res.data);
        else if (res.state === 'failed') StorageManager.updateGeneration(item.id, { status: 'failed' });
    }
}`,
        lesson: 'A polling loop must tolerate transient network throws, not only non-ok HTTP responses - wrap the fetch() itself and continue, because one Failed to fetch from tracking prevention or eventual consistency should never abort a job that is genuinely running. When the real source of truth (a CI run) outlives the browser tab, the UI status is just a cached guess: persist the run identifier the moment you dispatch, keep indeterminate attempts in-progress instead of failing them, and run a background reconciler that flips the record to its true terminal state (and rebuilds any derived artifacts) on load and on an interval. Make every long-running side effect resumable and idempotent so a refresh, a blip, or navigating away never strands the user with a permanently wrong status.',
        impact: 'High - A healthy cloud run now reliably reconciles to Success even if the foreground poll hiccuped, the documents are rebuilt and offered for download automatically, and users can navigate away or reload without losing the result or seeing a false Failed.'
    },
    {
        id: 27,
        title: 'Stuck In-Progress Rows Could Not Self-Heal Without a Stored runId + New GitHub Publish & Recovery Workflow',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / DevOps / SRE',
        fixTime: '120 min',
        description: 'A live multi-trigger test surfaced a reconciliation gap and a missing capability. (1) The user rapidly refreshed and clicked Generate Now five or six times while the auto-reconcile fix (bug 26) was still being deployed, so those attempts were logged by the OLD code that did not yet persist a runId onto the history record. When the GitHub Actions runs later finished green, the foreground reconciler had no runId to correlate against and left the rows stuck on In progress forever, with no way to download the finished documents. (2) There was no path to take a finished generation and store it in the user GitHub account or host the portfolio live, and the in-app tracker lacked a repo link column. (3) A CI annotation warned that actions/checkout and actions/setup-node were pinned to the deprecated Node 20 runtime.',
        rootCause: 'The runId is only known in the browser after dispatch; the pre-fix code did not save it on the in-progress record, and it also did not store the profile or job-description context, so a legacy stuck row had nothing to reconcile or rebuild from. Separately, publishing simply did not exist: generated documents were download-only, never pushed to a repo, and the tracker data model had no repo field.',
        resolution: 'Recovery: a Re-check button now appears on every in-progress or failed history row. If the row carries a runId it calls a non-throwing checkAndFetch and finalizes to Success; if it has no runId (legacy) it lists recent successful workflow_dispatch runs, parses the latest run id, fetches the committed result, and rebuilds the documents. Every generation now also stores its profileId, a capped job description, baseName, and the selected outputs so any row can be rebuilt later. Publishing: a Publish to GitHub button (on the generate result and on each success row) creates a role-named public repo via the user token, uploads the resume, cover letter, job-details.md and the portfolio as index.html through the Contents API, enables GitHub Pages so the portfolio is live, and adds a tracker entry with the live portfolio link, the repo link, an applied date defaulting to the generation time, and status Applied. The Applications table gained a Links column (Portfolio and Repo) and the editor gained a Repo Link field. CI: bumped checkout and setup-node to v5 and the script runtime to Node 22 to clear the deprecation warning.',
        codeExample: `// Persist the runId so a stuck row can self-heal later.
const { runId } = await GitHubRunner.dispatch({ });
StorageManager.updateGeneration(histId, { runId });

// Recovery for legacy rows that never stored a runId:
const runs = await GitHubRunner.listRecentRuns(15);
const done = runs.filter(r => r.status === 'completed' && r.conclusion === 'success');
const rid = (String(done[0].name).match(/run-[a-z0-9-]+/i) || [])[0];
const aiData = await GitHubRunner.fetchResult(rid);
await finalizeResumedRun({ ...item, runId: rid }, aiData);

// Publish: create repo, push files, enable Pages, add to tracker.
await GitHubRunner.ensureRepo(login, repoName, desc);
await GitHubRunner.putFile(login, repoName, 'index.html', base64Html, 'Add portfolio');
await GitHubRunner.enablePages(login, repoName, 'main');
JobTrackerManager.addApplication({ role, company, link: pagesUrl, repo: repoUrl, status: 'Applied' });`,
        lesson: 'Any client-driven async job must persist its server-side identifier the instant it is dispatched; without it a later success cannot be matched back to the row that started it. Store enough context (inputs, options, source ids) up front to fully rebuild outputs later, and always provide a manual recovery path for rows created before a fix shipped, since old data will not benefit from new write-time logic. When a job already produces a durable artifact in a repo, listing recent runs and re-importing is a cheap, robust fallback. Finally, keep CI action versions current so deprecation warnings do not pile up.',
        impact: 'High - stuck rows can now be recovered with one click, every generation is rebuildable, finished application packages live in the user GitHub with a live portfolio, the tracker shows portfolio and repo links, and the CI deprecation warning is gone.'
    },
    {
        id: 28,
        title: 'Re-check and Publish Buttons Threw "not defined" Because async Function Declarations Do Not Leak to Global Scope + Data-Durability Hardening Pass',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / SRE',
        fixTime: '75 min',
        description: 'Right after the Publish and Re-check feature shipped, clicking the Re-check action in the History table did nothing and the console showed ReferenceError: recheckHistoryEntry is not defined (and the same for publishHistoryEntry). The buttons use inline onclick handlers, which require the function to be reachable on the global object. Separately, live testing exposed three smaller defects on the same screens: the Settings gear icon rendered as an empty dark box, the tracker toolbar showed doubled labels Export Export and Import Import, and the Export Settings and Import Settings buttons called functions that were never defined. A bigger reliability concern was also confirmed: all application data lives only in browser localStorage, so clearing browsing data silently wiped the user profiles and history with no backup path.',
        rootCause: 'The whole of script.js is wrapped in a load-guard if/else block. In sloppy mode browsers hoist plain function declarations out of a block to the enclosing (global) scope via Annex B, which is why earlier inline handlers worked. That legacy hoisting does NOT apply to async function, generator, or class declarations, so the new async function publishHistoryEntry and async function recheckHistoryEntry stayed block-scoped and invisible to the inline onclick attribute. The gear was invisible because .btn-icon set no color or font-size so the glyph inherited an unreadable value; the doubled labels and the dead Export/Import Settings buttons were stale markup pointing at functions that did not exist; and there was simply no full-backup feature.',
        resolution: 'Exposed both async handlers explicitly the same way generateSingle already was: window.publishHistoryEntry = publishHistoryEntry and window.recheckHistoryEntry = recheckHistoryEntry. Gave .btn-icon an explicit color and font-size and switched the glyph to the emoji gear so it is always visible. Replaced the doubled labels with single Export and Import, and replaced the dead Export Settings and Import Settings buttons with a working one-click Backup Everything (downloads a single timestamped JSON of every resumeEngineProV1_ key) and Restore Everything (validates a full-backup file, replaces local data, and reloads). Default tracker entries were also backfilled with repo links, and the merge step now backfills a missing repo onto rows already saved in the browser.',
        codeExample: `// script.js is wrapped in a load-guard block:
if (typeof window._scriptLoaded !== 'undefined') { } else {
  window._scriptLoaded = true;

  // Plain declarations leak to global in sloppy mode (Annex B) - this works:
  function toggleSettingsMenu() { }

  // async declarations DO NOT leak out of the block - inline onclick cannot see it:
  async function recheckHistoryEntry(id, btn) { }

  // Fix: expose async handlers on window explicitly (same as generateSingle):
  window.publishHistoryEntry = publishHistoryEntry;
  window.recheckHistoryEntry = recheckHistoryEntry;
}

// One-click durable backup of every app key, with a timestamped filename:
const backup = StorageManager.exportAll();      // { type: 'full-backup', data: { } }
download('resume-engine-pro-backup_' + stamp + '.json', JSON.stringify(backup));`,
        lesson: 'Inline onclick handlers can only call functions on the global object, so any handler must be verifiably global. Remember the asymmetry in block scoping: plain function declarations leak to the enclosing scope in sloppy mode, but async, generator, and class declarations do not, so inside any wrapper block they must be attached to window by hand. When a regular function and an async function sit side by side and only the async one is undefined at runtime, suspect exactly this. More broadly, if the only copy of user data lives in browser storage, treat a one-click export and restore as a first-class feature, warn before destructive clears, and timestamp every backup so restores are unambiguous.',
        impact: 'High - the Re-check and Publish actions work again, the settings menu is reachable, the tracker toolbar reads correctly, and users can now take a single timestamped backup of everything and restore it after clearing browser data.'
    },
    {
        id: 29,
        title: 'Every GitHub API Call Blocked by CORS Because We Sent a Cache-Control Request Header + Re-check Reconciliation Hardened',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / SRE / DevOps',
        fixTime: '60 min',
        description: 'After the stuck-row reconciler shipped, Re-check still did nothing and successful cloud runs stayed stuck on In progress. The browser console was flooded with: "Access to fetch at https://api.github.com/repos/rdammala/resume-engine-pro/... from origin https://rdammala.github.io has been blocked by CORS policy: Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response", and every request failed with net::ERR_FAILED. So findRun, checkAndFetch, fetchResult, waitForCompletion and listRecentRuns could never read run status, and rows never reconciled. Two reconciliation defects from the prior pass also contributed: a succeeded run whose document rebuild threw was left stranded In progress, and checkAndFetch made a fragile second per-run API call that could blip and falsely report Still running.',
        rootCause: 'To defeat stale, cached run-list responses we had added a Cache-Control: no-cache (and on findRun an If-None-Match) REQUEST header to the fetch calls. Sending any non-simple request header to a cross-origin endpoint triggers a CORS preflight (OPTIONS), and the GitHub REST API does not list cache-control in its Access-Control-Allow-Headers, so the preflight failed and the browser blocked the actual request entirely. The cache-buster ?t=Date.now() query param was already present and is sufficient to defeat caching on its own, making the header pure liability. Separately, finalizeResumedRun caught a document-rebuild error with only a console.warn, leaving a genuinely successful run stranded In progress, and checkAndFetch did a second runs/{id} GET after findRun whose transient failure surfaced as a false pending.',
        resolution: 'Removed the Cache-Control and If-None-Match request headers from all five GitHub fetch helpers (findRun, waitForCompletion, checkAndFetch, fetchResult, listRecentRuns); cache-busting now relies solely on the existing ?t= query param, which needs no preflight and is treated as a simple request. Made Re-check authoritative: recheckHistoryEntry now reads the recent run list once and resolves the row directly from each items status and conclusion (success -> fetch result and finalize, failure -> mark failed, otherwise still running) with an import-latest fallback for legacy rows. finalizeResumedRun now always marks a successful run as Success even if the derived document rebuild throws, attaching a note to use Publish or Re-check, instead of stranding the row. checkAndFetch was hardened to read status and conclusion straight from the findRun run-list item (no second call) and given more findRun attempts.',
        codeExample: `// BROKEN: a Cache-Control REQUEST header forces a CORS preflight that
// api.github.com rejects -> whole request fails with net::ERR_FAILED.
fetch(url + '?t=' + Date.now(), {
  headers: { 'Cache-Control': 'no-cache', 'If-None-Match': '' }
}); // CORS: cache-control not in Access-Control-Allow-Headers

// FIXED: the ?t= query param already busts the cache; send no extra header,
// so the request stays "simple" and skips preflight entirely.
fetch(url + '?t=' + Date.now());

// Re-check reads status/conclusion straight from the run list (one call):
const run = runs.find(r => (r.name || r.display_title || '').includes(runId));
if (run.status === 'completed') {
  run.conclusion === 'success'
    ? await finalizeResumedRun(item, await GitHubRunner.fetchResult(runId))
    : StorageManager.updateGeneration(item.id, { status: 'failed' });
}

// finalizeResumedRun never strands a succeeded run anymore:
try { rebuildDocuments(aiData); StorageManager.updateGeneration(id, { status:'success' }); }
catch (e) { StorageManager.updateGeneration(id, { status:'success', note:'Rebuild failed - use Publish/Re-check.' }); }`,
        lesson: 'When calling a cross-origin API from the browser, every request header you add is a CORS liability: any non-simple header (Cache-Control, If-None-Match, custom X- headers) forces a preflight, and if the server does not echo it in Access-Control-Allow-Headers the real request is blocked outright - so prefer a ?t= cache-buster query param over a no-cache header for defeating caches. Read a console "blocked by CORS policy: request header field X is not allowed" as "remove header X", not "the endpoint is down". And never let a derived step (document rebuild) failure mask the true terminal state of an async job - mark the job success and degrade the side effect, rather than stranding the record.',
        impact: 'High - GitHub API calls succeed again, Re-check now authoritatively flips success rows to Success (rebuilding and offering the documents) and failed rows to Failed, the 30s background reconciler works, and a successful run is never stranded In progress even when the optional document rebuild hiccups.'
    },
    {
        id: 30,
        title: 'Finished Documents Had No Re-download Path + Publish Failed 403 Because the Repo-Scoped Token Cannot Create New Repos',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer / DevOps',
        fixTime: '45 min',
        description: 'Once Re-check correctly flipped a cloud run to Success (4 files, 0 skills matched), the user asked a fair question: where are the files to download? The rebuilt documents had been rendered as download buttons on the Generate tab, but the user was on the History tab and never saw them, and the links vanish on reload - a success row offered only a Publish button, no way to get the files back. Separately, clicking Publish failed with HTTP 403 "Resource not accessible by personal access token" while trying to create the repo Team-Leadership-Engineering-Partnership, which looked like a lost approval but was actually a token-scope limitation.',
        rootCause: 'Two issues. (1) finalizeResumedRun (and the original generate flow) wrote the download links into the Generate tab download container and showed a toast, but there was no persistent, per-row way to re-obtain the files; once the user navigated away or reloaded, the object URLs were gone and the only stored copy was the committed JSON in the repo. (2) The generation token is a fine-grained PAT scoped to ONLY the resume-engine-pro repository with Actions + Contents - perfect for dispatching the cloud workflow, but the Publish flow calls POST /user/repos to create a brand-new role-named repo, and a single-repo fine-grained token has no account-level Administration permission to create repositories, so GitHub returns 403. Nothing was revoked; the token simply never had repo-create rights.',
        resolution: 'Added a Download action to every successful History row: downloadHistoryEntry(histId, btnEl) reloads the profile, re-fetches the committed Ollama result and re-applies mergeTailored so the docs stay tailored, rebuilds all selected outputs via buildDocumentsFromProfile, switches to the Generate tab, and auto-clicks each generated link (staggered 400ms so the browser does not coalesce them) - with the buttons also left visible as a fallback. The async handler is exposed on window (per the bug 28 lesson) so the inline onclick can reach it. For Publish, documented the exact token requirement in the failure card and to the user: either a classic token with repo + workflow scope, or a fine-grained token with access to All repositories and Administration + Contents + Pages + Actions = Read and write (single-repo tokens can dispatch the cloud job but cannot create the publish repo).',
        codeExample: `// Per-row re-download: rebuild tailored docs and auto-start the downloads.
async function downloadHistoryEntry(histId, btnEl) {
  const item = StorageManager.getHistory(100).find(h => h.id === histId);
  const profile = StorageManager.getProfile(item.profileId);
  let workingProfile = profile;
  if (item.provider === 'ollama' && item.runId) {
    const aiData = await GitHubRunner.fetchResult(item.runId);     // committed JSON
    if (aiData && !aiData._raw) workingProfile = mergeTailored(profile, aiData);
  }
  const links = document.getElementById('downloadLinks');
  links.innerHTML = '';
  await buildDocumentsFromProfile(workingProfile, item.jd, item.baseName, item.genOpts, links);
  switchMainTab('generator');
  links.querySelectorAll('a[download]').forEach((a, i) => setTimeout(() => a.click(), i * 400));
}
window.downloadHistoryEntry = downloadHistoryEntry;   // async fns must be put on window

// Publish 403: POST /user/repos needs repo-create rights the repo-scoped token lacks.
// Fix = classic token (repo + workflow) OR fine-grained token on ALL repositories
// with Administration + Contents + Pages + Actions = Read and write.`,
        lesson: 'If the only durable copy of a generated artifact is remote (a committed file) or transient (an object URL), give users a first-class, repeatable way to re-obtain it - do not assume they saw a one-time link on another tab. Persist enough context (profile id, run id, output options) so any finished row can be rebuilt on demand, and auto-trigger the download while still showing the buttons as a fallback. On tokens: scope is not approval - a 403 "Resource not accessible by personal access token" on POST /user/repos means the token cannot create repositories, not that access was revoked. A fine-grained PAT scoped to a single repo can drive that repo (dispatch, read/write contents) but cannot create NEW repos; that needs a classic repo scope or a fine-grained token over All repositories with Administration write. Match token scope to the broadest operation the feature performs.',
        impact: 'Medium - users can re-download every finished application package directly from History with one click (tailored, not just the base profile), and the Publish permission failure is now self-explanatory with exact token guidance, so creating the published repo + live portfolio succeeds once the right token is supplied.'
    },
    {
        id: 31,
        title: 'Published Repo Shipped a Bare Auto-Generated README With No Link to the Live Portfolio',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '25 min',
        description: 'After Publish started working end-to-end (creates the role-named repo, pushes the resume, cover letter and portfolio, enables GitHub Pages, and adds a tracker entry), the resulting repository README.md was just the one-line stub that auto_init generates from the repo description. A visitor landing on the repo had no obvious way to reach the live portfolio - the github.io URL was nowhere on the repo home page, even though Pages was live. The user asked for the live link to be written into the README created in their repo.',
        rootCause: 'ensureRepo creates the repository with auto_init: true, which seeds a minimal README.md containing only the repo name and description. The publish flow uploaded the document files and enabled Pages but never replaced that stub, so the live Pages URL (only known AFTER enablePages runs) was never surfaced anywhere a repo visitor would see it.',
        resolution: 'Added buildPublishReadme(), which composes a Markdown README that leads with a 🔗 Live Portfolio section linking the github.io Pages URL (with a note that Pages can take ~1 min), then a 📄 Documents section listing each committed file with a friendly label (Resume PDF/Word, Cover Letter, Job Details), the role as the H1, the company line, and a generated-on date. After enablePages resolves the pagesUrl, publishHistoryEntry writes this via GitHubRunner.putFile(login, repo, README.md, ...) - putFile already fetches the existing file SHA, so it cleanly overwrites the auto_init stub. Text is committed with a UTF-8-safe utf8ToBase64 helper (btoa(unescape(encodeURIComponent(str)))) so accented names and emoji survive base64. The README write is best-effort and wrapped in try/catch so a hiccup never fails the overall publish.',
        codeExample: `// README must be written AFTER Pages is enabled (that is when pagesUrl exists).
const ok = await GitHubRunner.enablePages(login, repoName, 'main');
if (ok) pagesUrl = \`https://\${login}.github.io/\${repoName}/\`;

const readme = buildPublishReadme({ role, company, pagesUrl, fileNames: names, date });
// putFile fetches the existing SHA, so this overwrites the auto_init stub cleanly.
await GitHubRunner.putFile(login, repoName, 'README.md',
  utf8ToBase64(readme), 'Add README with live portfolio link');

// UTF-8-safe base64 so accented names / emoji survive the Contents API:
function utf8ToBase64(str){ return btoa(unescape(encodeURIComponent(String(str||'')))); }`,
        lesson: 'When auto_init creates a repository it also creates a stub README - if you want a meaningful landing page you must overwrite it, and an idempotent putFile that reads the current SHA first makes that a one-liner. Sequence matters: a value that only exists after a later step (the Pages URL after enablePages) can only be written once that step completes, so order the README write last. Always base64-encode text for the Contents API through a UTF-8-safe path (btoa alone throws on non-Latin1 characters). And keep cosmetic finishing touches best-effort so they never jeopardize the core operation.',
        impact: 'Low - every published application repo now opens with a clear, clickable link to the live portfolio plus a tidy list of the included documents, so anyone landing on the repo (recruiter, the user) reaches the hosted portfolio in one click instead of hunting for the github.io URL.'
    },
    {
        id: 32,
        title: 'Re-Publish Looked Like a No-Op - Only the PDF Refreshed, README Never Changed',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer / Release',
        fixTime: '20 min',
        description: 'After shipping the README-with-live-link change, the user re-published an entry and reported that nothing seemed to update except the PDF: the README looked unchanged and they could not tell the publish had done anything new. It read like a broken feature even though the code was correct.',
        rootCause: 'Two compounding effects. First, the browser was running a cached copy of the old script.js (served by GitHub Pages with no cache-bust), so the very build that adds the README was not even executing - there was literally no Add README commit in the repo history. Second, once the fresh code did run, re-publishing identical inputs produces byte-identical .doc/.html/.md files, and the GitHub Contents API creates no new commit when content is unchanged. Only the PDF differs run-to-run because jsPDF embeds a generation timestamp, so the PDF was the single file that appeared to change - which is expected behavior, not a bug.',
        resolution: 'Confirmed the README write was present and correct, then made it observable and resilient: wrapped the README putFile in try/catch that raises a visible warning toast on failure (no more silent skips), and set the repo homepage to the live Pages URL via updateRepoMeta so the change is also reflected in the GitHub About sidebar. Documented that identical files = no new commit is correct API behavior, and that the real culprit was a stale cached bundle. The fix on the user side is a hard refresh (Ctrl+Shift+R) plus ~1 min for Pages to redeploy the new script.js.',
        codeExample: `// Make the README step observable instead of silently best-effort.
try {
  const readme = buildPublishReadme({ role, company, pagesUrl, fileNames: names, date });
  await GitHubRunner.putFile(login, repoName, 'README.md',
    utf8ToBase64(readme), 'Update README with live portfolio link');
} catch (e) {
  // A stale bundle or transient error must not look like success.
  showToast('Published, but updating the README failed: ' + (e && e.message), 'warning');
}

// Reflect the live link in the repo About sidebar too (best-effort).
if (pagesUrl) {
  try { await GitHubRunner.updateRepoMeta(login, repoName, { homepage: pagesUrl }); } catch (_) {}
}`,
        lesson: 'When a deployed static app appears to ignore a fix, suspect a cached bundle before suspecting the code - GitHub Pages serves stale assets aggressively, so verify the actual commit history (was the new commit ever created?) before debugging logic. The Contents API is content-addressed: writing identical bytes is intentionally a no-op with no new commit, so do not treat unchanged files as a failure. And make every best-effort step at least observable - a silent catch on the README write is indistinguishable from the feature not running at all.',
        impact: 'Low - re-publishing is now self-explanatory: README/homepage updates are confirmed or visibly warned, and the expected PDF-only diff on identical re-runs is understood rather than mistaken for breakage.'
    },
    {
        id: 33,
        title: 'Generated Resumes Were Thin and Sub-Par - One Bullet Per Role and Only ~7 Skills',
        severity: 'high',
        status: 'Fixed',
        role: 'AI / Prompt Engineering',
        fixTime: '90 min',
        description: 'The end product fell far short of an ATS-ready, technically strong resume. Generated documents had a single bullet per job, roughly 7 skills, and a thin summary - not the tight, metric-driven, recruiter-grade output expected. The pages were created but the content quality was poor, and the target company was sometimes mis-extracted (e.g. a benefit phrase like paid disability and life insurance was used as the company name).',
        rootCause: 'Three distinct defects. (1) num_ctx was 4096 in callOllama, but the input (a resume sliced to 28000 chars ~ 7000 tokens plus the JD plus instructions) is ~9000 tokens - the context window silently TRUNCATED the work history, so the model never saw the full career and had no room to generate. (2) The prompt schema example showed exactly ONE bullet in details and asked for 12-20 skills loosely; LLMs imitate the shape of the example, so the model emitted one bullet per role and ~7 skills regardless of the prose instructions. (3) Title/company were derived only by keyword heuristics on the raw JD (extractJobMeta), whose at <Word> regex and Company: label could latch onto perk/benefit text.',
        resolution: 'Raised num_ctx to 8192 and added num_predict 2048 (and lowered temperature to 0.35) in both generators so the full input fits and there is generation headroom. Rewrote buildPrompt in scripts/ollama-actions-generate.js and scripts/ollama-generate.js (and the schema in core/ai-integration.js): the schema example now shows FIVE quantified bullets, a HARD REQUIREMENTS block states each details array MUST have 4-6 bullets and skills MUST have >=14 entries, and the model now also returns job_title and company. mergeTailored captures aiData.job_title/company onto the tailored profile (filtered by looksLikeCompany, which rejects insurance/disability/benefit/PTO/etc.), and resolveJobMeta prefers those AI-read values over extractJobMeta. extractJobMeta itself was hardened with the same benefit-phrase guard and a tighter at <Company> regex.',
        codeExample: `// 1) Give the model room: full input + space to write.
options: { num_ctx: 8192, num_predict: 2048 }, temperature: 0.35

// 2) The schema EXAMPLE is the strongest instruction - show multiple bullets:
"details":["Architected X using Y, cutting Z by 40%","Led a team of 8 to ...",
           "Automated ... saving 200+ hours/quarter","Reduced MTTR 45m to 9m",
           "Scaled platform to 3x traffic at 99.95% uptime"]
// HARD REQUIREMENTS: each details array MUST contain 4-6 bullets; skills MUST have >=14.

// 3) Trust the model's company read, but never accept a perk as the company:
function looksLikeCompany(s){
  return s.length>=2 && s.length<=60 &&
    !/\\b(insurance|disability|401k|pto|benefit|benefits|salary|bonus|vacation|paid|leave|coverage|equity|stipend)\\b/i.test(s);
}`,
        lesson: 'An LLM imitates the SHAPE of your schema example far more faithfully than your prose rules - a single-bullet example yields single-bullet output no matter how many times you write produce 4-6 bullets, so the example itself must demonstrate the desired density. Context window is a silent failure mode: if num_ctx is smaller than your input the model just never sees the tail of the prompt, so size it to the real token count and leave num_predict headroom to generate. Add explicit, countable HARD REQUIREMENTS (>=14 skills, 4-6 bullets) the model can self-check. And prefer the structured extraction the model returns (job_title/company) over brittle regex heuristics, but still gate it with a sanity filter so a benefit phrase can never masquerade as the employer.',
        impact: 'High - new generations produce tight, ATS-ready resumes with 4-6 quantified, technology-named bullets per role and 14-18 prioritized JD-aligned skills, plus an accurate target title/company. This is the core value of the product, so the quality lift is the difference between an unusable draft and a recruiter-grade package.'
    },
    {
        id: 34,
        title: 'Published Apps Looked Like They Never Reached the Job Tracker',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend / UX',
        fixTime: '20 min',
        description: 'After publishing a generated package to GitHub (repo + live portfolio created), the Applications tab appeared unchanged - users reported that nothing was added to the Job Application Tracker. Re-publishing the same package made it worse by silently creating duplicate rows.',
        rootCause: 'The data WAS being saved - addApplication did apps.push(app), appending each new application to the END of a list that already had 10+ rows. With the table scrolled to the top showing the default entries, the freshly published row landed below the fold at the very bottom, so it looked like nothing happened. Separately, every publish called addApplication unconditionally, so re-publishing the same repo inserted a duplicate. And the tracker write was wrapped in catch(_){} which swallowed any failure with no toast or console trace.',
        resolution: 'Changed addApplication to apps.unshift(app) so new applications appear at the TOP of the list immediately. Added JobTrackerManager.upsertApplicationByRepo, which the Publish flow now uses: it finds an existing row by repo URL and updates it (link/date/status) instead of adding a duplicate, otherwise inserts at the top. The publish tracker block now logs failures and shows a warning toast instead of silently swallowing them, and refreshes the Last Updated stamp. loadApplications also runs a dedupeByRepo pass so the duplicate rows the old build already wrote get collapsed automatically the next time the tracker loads.',
        codeExample: `// Before: new rows buried at the bottom + duplicates on re-publish
addApplication(app){ /* ... */ apps.push(app); this.saveApplications(apps); }

// After: newest first, and de-duplicate by repo so re-publish refreshes the row
addApplication(app){ /* ... */ apps.unshift(app); this.saveApplications(apps); }
upsertApplicationByRepo(app){
  const apps = this.loadApplications();
  const idx = app.repo ? apps.findIndex(a => a.repo === app.repo) : -1;
  if (idx !== -1){ apps[idx] = { ...apps[idx], ...app, id: apps[idx].id }; }
  else { app.id = apps.length ? Math.max(...apps.map(a=>a.id))+1 : 1; apps.unshift(app); }
  this.saveApplications(apps); return apps[idx!==-1?idx:0];
}`,
        lesson: 'When a write succeeds but the user says nothing happened, suspect ordering and visibility before suspecting persistence. Appending to the end of a long list hides the result below the fold - surface new items where the eye lands (the top). Make idempotent actions actually idempotent (upsert by a stable key) so repeating them refreshes rather than duplicates. And never swallow a best-effort write with an empty catch: at minimum log it and toast, or a real failure becomes an invisible one.',
        impact: 'Medium - publishing now visibly updates the tracker (new row at the top) and re-publishing updates the same row instead of piling up duplicates, restoring trust that the end-to-end Generate -> Publish -> Track flow works.'
    },
    {
        id: 35,
        title: 'Refresh Flashed the Login/Dashboard for a Split Second Before Restoring the Last Tab (FOUC)',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer / UX',
        fixTime: '40 min',
        description: 'On the main app, refreshing the browser on any tab briefly flashed the home view (the login screen, or the Dashboard tab) for a split second, then jumped to the tab the user was actually on. It happened on every reload and felt janky even though the app ended up on the correct tab.',
        rootCause: 'Classic flash-of-unstyled/incorrect-content (FOUC) in a JS-driven single-page app with no server rendering. The static HTML hard-codes the initial visible state: #loginPage has class "page active" and #dashboard has "main-tab-content active", so the browser paints those immediately. The real state is only applied later by initializeApp(), which is async and awaits GitHubManager.loadSession() -> authenticate() (a network round-trip to api.github.com). Only after that promise resolves does showPage(\"appPage\") + restoreActiveTab() swap to the saved tab. The gap between first paint and the async resolution is the visible flash.',
        resolution: 'Decide the correct view SYNCHRONOUSLY before first paint. A tiny inline <script> in <head> reads localStorage directly - the presence of a github key under resumeEngineProV1_apiKeys (logged-in?) and activeMainTab (last tab) - and sets data-boot ("app"/"login") and data-tab on <html>. New CSS gated on html:not(.js-ready)[data-boot=...][data-tab=...] shows the right page + tab on the very first paint, overriding the static .active classes via higher specificity + !important. A second inline script at the end of <body> also pre-activates the saved tab BUTTON + content so the highlight is consistent during the async session check. Finally, script.js adds <html class="js-ready"> via initializeApp().finally(...), which deactivates the boot CSS and hands control back to the normal .active rules - so ongoing tab switching is unaffected, and an invalid stored session still corrects to login.',
        codeExample: `<!-- index.html <head>: decide the view before the first paint -->
<script>
  (function () {
    var VALID = ['dashboard','profiles','generator','applications','history','settings'];
    var raw = localStorage.getItem('resumeEngineProV1_apiKeys');
    var hasGithub = !!(raw && JSON.parse(raw).github && JSON.parse(raw).github.key);
    var tab = localStorage.getItem('activeMainTab');
    if (VALID.indexOf(tab) === -1) tab = 'dashboard';
    document.documentElement.setAttribute('data-boot', hasGithub ? 'app' : 'login');
    document.documentElement.setAttribute('data-tab', tab);
  })();
</script>

/* style.css: show the right page + tab instantly, until JS is ready */
html:not(.js-ready)[data-boot="app"] #loginPage { display: none !important; }
html:not(.js-ready)[data-boot="app"] #appPage  { display: block !important; }
html:not(.js-ready)[data-boot="app"] .main-tab-content { display: none !important; }
html:not(.js-ready)[data-boot="app"][data-tab="applications"] #applications { display: block !important; }

// script.js: hand off from boot CSS to normal .active rules (even if init throws)
initializeApp().finally(() => document.documentElement.classList.add('js-ready'));`,
        lesson: 'In a client-rendered SPA, anything the HTML hard-codes as visible will flash if the real state is decided asynchronously (especially behind a network call). Make the initial-state decision synchronous and pre-paint: read persisted state from localStorage in an inline <head> script and drive the first paint with CSS attribute selectors. Gate that boot CSS on a :not(.js-ready) latch that the app removes once it has applied the true state, so the anti-flash layer never fights normal interaction afterward. Optimistically render the logged-in view from a synchronous signal (a stored token) and let the slower async validation correct the rare invalid case.',
        impact: 'Low - purely cosmetic, but the app now loads straight into the correct page and tab on every refresh with no login/dashboard flash, making it feel instant and native instead of janky.'
    },
    {
        id: 36,
        title: 'Dashboard Statistics Stuck on 0 (Wrong Element) and Trapped in Browser Storage Instead of Live From GitHub',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '45 min',
        description: 'The Dashboard (also the landing view) always showed Total Resumes Generated: 0, Profiles Created: 0, and GitHub Data Repo: Not set, no matter how many resumes had been generated or profiles created. The numbers never updated, and what little data existed lived only in this browser, so the counts were neither correct nor consistent across devices.',
        rootCause: 'Two issues. (1) The app defines updateUI() twice; the second declaration wins and calls updateStats(), but updateStats() wrote its markup into document.getElementById("statsContainer") - an element that does not exist in the Dashboard. The real Dashboard fields have ids #totalGenerated, #totalProfiles and #githubRepo, which nothing ever populated, so they stayed at their hard-coded 0 / Not set. (2) Even the intended counts were sourced purely from localStorage (StorageManager history/profiles), so they reflected only the current browser and could not represent the true, cross-device total.',
        resolution: 'Rewrote updateStats() to populate the ACTUAL Dashboard elements (#totalProfiles from StorageManager.getAllProfiles(), #githubRepo as a link to owner/repo, and #totalGenerated). For a live, cross-device number it no longer trusts only the browser: refreshLiveStats() + fetchGitHubFileCount() read the public GitHub Contents API and count the files in the repo generated/ folder - the cloud pipeline already commits one <run_id>.json there per generation, making that folder an append-only, always-current tally that needs no extra writes and no token (public repos allow unauthenticated reads; the stored token is attached when present to raise the rate limit). The card shows max(liveGitHubCount, localCount) so brand-new or non-cloud local runs are still reflected, with a tooltip breaking down both. updateStats() now also runs whenever the Dashboard tab is opened, not just at login.',
        codeExample: `// BROKEN: writes to an element that isn't on the Dashboard -> fields stay 0.
function updateStats() {
  const statsDiv = document.getElementById('statsContainer'); // does not exist
  if (statsDiv) statsDiv.innerHTML = '...';
}

// FIXED: populate the real fields + pull a LIVE count from GitHub itself.
function updateStats() {
  document.getElementById('totalProfiles').textContent =
      Object.keys(StorageManager.getAllProfiles() || {}).length;
  refreshLiveStats();                          // GitHub = cross-device truth
}

async function fetchGitHubFileCount(folder, rx) {
  const { owner, repo, ref } = GitHubRunner.getConfig();
  const url = 'https://api.github.com/repos/' + owner + '/' + repo +
              '/contents/' + folder + '?ref=' + ref + '&t=' + Date.now();
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  const items = await res.json();              // one file per generation
  return items.filter(f => f.type === 'file' && rx.test(f.name)).length;
}`,
        lesson: 'When a counter is permanently stuck at its initial value, confirm the code is writing to the SAME element the HTML renders - a stale or mismatched id silently no-ops with no error. Beware duplicate function definitions: the last one wins and can quietly replace the version you think is running. And for stats that should be global, do not treat per-browser localStorage as the source of truth; derive them from a shared, durable store. An append-only folder that another process already writes (here, CI committing one file per run) is a perfect zero-extra-write, tokenless, cross-device counter - just list and count it via the public API.',
        impact: 'Medium - the Dashboard now shows correct, live numbers that update on every visit and reflect generations made from any device, instead of a permanently-zero landing page.'
    },
    {
        id: 37,
        title: 'Dashboard "AI Status" and "Credits & Usage" Cards Were Inert Placeholders',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '50 min',
        description: 'Two of the four Dashboard cards never did anything. "AI Status" was permanently stuck on its placeholder "Loading AI providers..." and "Credits & Usage" always showed "No AI providers configured yet" - even after engines were configured and resumes had been generated (including free Ollama runs). Users had no way to see which engines were ready or how much each had consumed.',
        rootCause: 'The markup had the containers (#aiStatus and #creditsDisplay) but no code ever populated them - there was no renderer wired to either element, so they kept their hard-coded placeholder HTML forever. Separately, no per-engine usage was being summarised anywhere; generation History stored provider and mode per record but nothing aggregated it, and free engines (Ollama/Pollinations) recorded $0 with no token figure, so "free" looked like "nothing happened".',
        resolution: 'Added renderAIStatus(), which walks AIIntegration.providers in a curated order and shows each engine with its effective model and a readiness badge derived from AIIntegration.isConfigured() (Key set / Ready·free / Configured / Not set), plus a "Manage in Settings" link and a ready-count. Added renderCreditsUsage(), which aggregates StorageManager.getHistory() by provider into generations, estimated tokens and cost: cost uses the stored value or AIIntegration.getCost(provider, mode); tokens are estimated per record from the mode token budget plus an input estimate from the stored JD length (~4 chars/token). Free engines show the estimated tokens consumed at $0 so Ollama usage is finally visible. Both renderers run from updateStats(), so they refresh on login and every time the Dashboard tab is opened.',
        codeExample: `// Nothing populated these containers — they kept their placeholder forever.
function updateStats() {
  renderAIStatus();       // fills #aiStatus from AIIntegration.isConfigured()
  renderCreditsUsage();   // fills #creditsDisplay from History, per engine
}

// Per-engine usage from History (free engines still show tokens at $0 cost).
history.forEach(rec => {
  const id = rec.provider;
  if (!AIIntegration.providers[id]) return;
  agg[id].count  += 1;
  agg[id].tokens += estimateRecordTokens(rec);   // mode budget + JD/4 input est.
  agg[id].cost   += rec.cost || AIIntegration.getCost(id, rec.mode || 'smart');
});`,
        lesson: 'A placeholder that never changes is a tell-tale that no renderer is bound to the element - having the container in the HTML is only half the wiring. Drive each dynamic card from a single refresh entry point (updateStats) that runs on the relevant tab open, so all cards stay in sync. And "free" is not the same as "zero usage": surface estimated token consumption for no-cost engines like Ollama so users can still reason about volume, clearly labelling figures as estimates when the engine does not report exact counts.',
        impact: 'Medium - the Dashboard now shows which AI engines are ready (with models) and a per-engine breakdown of generations, estimated tokens and spend, including visible token usage for free Ollama runs.'
    },
    {
        id: 38,
        title: 'Content-Cascade Audit: AI Education Dropped, Portfolio Showed [object Object], and Tailored Role Missing From Portfolio',
        severity: 'medium',
        status: 'Fixed',
        role: 'QA / Frontend Developer',
        fixTime: '70 min',
        description: 'A structured QA pass drove five diverse resume "subjects" (a fully structured tech profile, an AI/Ollama-tailored result, a profile with comma-string fields, a raw-text-only profile, and a unicode non-tech profile with object-shaped education) through the real single, bulk and portfolio generators to confirm every field cascades into the downloaded files. Core cascade was solid (67/67 checks for name, summary, skills, experience bullets, education, cover letter, job-details across PDF/Word/Markdown), but three real content defects surfaced: (1) AI-provided education never reached the documents, (2) an object-shaped education entry rendered as the literal "[object Object]" in the portfolio, and (3) the AI-tailored target role never appeared in the portfolio header (it showed the generic "Professional").',
        rootCause: 'Three independent gaps. (1) mergeTailored() merged summary, skills, experience and the job title/company from the AI result but silently omitted aiData.education, so any AI run lost the schooling section. (2) The portfolio template rendered education with `${edu}` assuming every entry is a string; when an entry was an object like { degree, school } it coerced to "[object Object]" (the resume Word/PDF builders already handled objects, so only the portfolio was wrong). (3) AI tailoring stores the target role on profile._aiJobTitle, but the portfolio header reads profile.title, which was never populated from it, so tailored portfolios fell back to "Professional".',
        resolution: 'Added an education merge to mergeTailored() (accepts an array or a string). Made normalizeProfile() populate p.title from p._aiJobTitle (then the first job role) when no explicit title exists, so the portfolio header reflects the tailored role. Hardened the portfolio education renderer to handle objects: string entries print as-is, object entries join degree/school/year. Re-running the harness confirmed the AI subject went from edu=0 to edu=3, the portfolio header showed the real role, and "[object Object]" disappeared - still 67/67 content checks. A separate finding (all five portfolio "templates" call generateMinimalist, so the picker has no visual effect) was logged for a follow-up template-variety pass.',
        codeExample: `// 1) mergeTailored: AI education was never merged — now it is.
if (aiData && Array.isArray(aiData.education) && aiData.education.length) {
  tailored.education = aiData.education;
} else if (aiData && typeof aiData.education === 'string' && aiData.education.trim()) {
  tailored.education = [aiData.education.trim()];
}

// 2) normalizeProfile: portfolio header now reflects the tailored role.
if (!p.title) {
  p.title = p._aiJobTitle || (p.experience[0] && (p.experience[0].position || p.experience[0].title)) || '';
}

// 3) portfolio-templates.js: render education objects, not "[object Object]".
profile.education.map(edu =>
  '<p>' + (typeof edu === 'string'
    ? edu
    : [edu.degree, edu.school, edu.year].filter(Boolean).join(', ')) + '</p>'
).join('')`,
        lesson: 'Test the data, not just the happy path: driving several genuinely different input shapes (arrays, comma-strings, raw text, objects, unicode) through the real generators is what exposes silent field-dropping and type assumptions that a single tidy fixture never would. When one builder handles a shape (objects) and a sibling builder does not, normalise the assumption in every renderer. And whenever a merge function hand-picks fields to copy, audit it for the ones it forgot - aiData.education fell through simply because it was never listed.',
        impact: 'Medium - AI-tailored resumes and portfolios now keep their education, the portfolio shows the tailored role instead of "Professional", and object-shaped education renders cleanly everywhere instead of leaking "[object Object]".'
    },
    {
        id: 39,
        title: 'Settings Menu: Underlined Link, Uneven AI-Provider Cards, and a Dead "Initialize Data Repository" Button',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '55 min',
        description: 'Three Settings-area defects surfaced together. (1) The gear-menu "Settings" link rendered underlined like a raw hyperlink. (2) The AI Providers cards were uneven and unprofessional - card heights changed with their content (the privacy note was tiny, the Ollama card was very tall), because the full-width privacy banner and the content-heavy Ollama/Custom cards were all dropped into the same auto-fit grid. (3) The Repository Access Private/Public radios appeared to do nothing: the "Initialize Data Repository" button called initializeGithubRepo(), a function that did not exist (ReferenceError), the only related handler (setupGitHubDataRepo) read a non-existent #dataRepoName input and never read the radio at all, and createDataRepository hardcoded private: true.',
        rootCause: 'Distinct causes. (1) .settings-menu a never set text-decoration, so the browser default underline showed. (2) #aiProvidersSettings is a CSS grid; the privacy <p> and the long Ollama/Custom cards were ordinary grid cells, so they sized to their content and threw off the row rhythm. (3) The button onclick referenced a function that was never defined; the real (legacy) setup function targeted the wrong element id and ignored the visibility radio, and the GitHub API call always requested a private repo.',
        resolution: 'Added text-decoration: none to the settings menu links. Reworked the AI Providers grid: the privacy note and the richer Ollama/Custom cards now span the full row (grid-column: 1 / -1), every card is a flex column with its helper <small> pinned to the bottom (margin-top: auto) so cards align cleanly, with a subtle header rule and hover. Implemented initializeGithubRepo(btn): it reads #githubDataRepo, reads the checked input[name="repoAccess"], and calls createDataRepository(repoName, isPrivate) - which now honours the flag (private: isPrivate !== false) - then initializes the folder structure, with success/error toasts and a busy state. The button passes (this).',
        codeExample: `// (3) The button called a function that did not exist; now it works and
// actually reads the Private/Public radio.
async function initializeGithubRepo(btn) {
  const repoName = (document.getElementById('githubDataRepo')?.value || '').trim()
                   || 'resume-engine-data';
  const access = document.querySelector('input[name="repoAccess"]:checked');
  const isPrivate = !access || access.value !== 'public';
  const result = await GitHubManager.createDataRepository(repoName, isPrivate);
  // …toast success/exists/error…
}
window.initializeGithubRepo = initializeGithubRepo;

/* (2) CSS: banner + heavy cards span the row; helper text pins to the bottom */
.ai-providers-grid > .ai-keys-privacy,
.ai-provider-card--wide { grid-column: 1 / -1; }
.ai-provider-card { display: flex; flex-direction: column; }
.ai-provider-card small { margin-top: auto; }`,
        lesson: 'An inline onclick that names a function which does not exist fails silently from the user side (just a console ReferenceError) - controls wired this way must point at a verifiably-global function, and "does this even work?" usually means the handler is missing or mis-named. For card grids, keep full-width banners and content-heavy panels out of the uniform track (span the whole row) and pin per-card helper text to the bottom so unequal content still lines up. And a control is only "working" once its value is actually consumed end-to-end: the radio looked fine but nothing ever read it.',
        impact: 'Medium - the Settings menu looks clean (no underline), the AI Providers section is visually consistent and professional, and the Repository Access radios now genuinely control whether the created data repo is private or public.'
    },
    {
        id: 40,
        title: 'Public App Seeded Every Visitor With the Owner\u2019s Real Job Applications',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / Privacy',
        fixTime: '30 min',
        description: 'After the project was shared publicly (LinkedIn), a user reported they could see the owner\u2019s actual job applications in the Job Application Tracker - six real rows (company, role, status, even a "denied due to no visa sponsorship" comment). Anyone opening the public app got the owner\u2019s private application history pre-loaded.',
        rootCause: 'JobTrackerManager shipped a hard-coded defaultApps array containing the owner\u2019s six real applications (and genericResumes held a personal portfolio entry). loadApplications() seeded these into every fresh visitor\u2019s localStorage on first load, and - worse - on every subsequent load it re-merged any missing default back in by portfolio name, so even deleting a row brought it back. Sample/seed data that happened to be REAL personal data leaked to every visitor.',
        resolution: 'Emptied defaultApps and genericResumes to [] so new visitors start with a blank tracker. Added a one-time migration in loadApplications(), gated by a seedAppsCleared flag, that strips the six known legacy seed rows (matched by portfolio name or the owner\u2019s github.com/rdammala/<name> repo URL) from any browser that already cached them from an earlier build - so returning visitors and the owner get the leftover rows auto-removed without touching applications they genuinely added.',
        codeExample: `// BEFORE: real personal applications shipped as defaults + re-seeded each load.
defaultApps: [ { role:'Technical Support Director', company:'Boulevard', \u2026 }, \u2026 ],

// AFTER: empty seed + a one-time purge of rows cached from the old build.
defaultApps: [],
loadApplications() {
  const stored = StorageManager.get('applications', false);
  if (!stored) { /* seed with [] */ }
  let working = stored;
  if (!StorageManager.get('seedAppsCleared', false)) {
    working = stored.filter(a => !this._isLegacySeed(a));   // strip owner rows
    StorageManager.set('seedAppsCleared', true);            // run once
  }
  /* \u2026merge (now empty) + dedupe\u2026 */
}`,
        lesson: 'Never ship real personal data as "sample"/seed content in a public app - placeholder data must be obviously fake or empty. Re-merging defaults on every load is doubly dangerous: it makes the leak sticky and un-deletable. And remember that emptying a seed only fixes NEW users; anyone who already loaded the old build has the data cached in their own storage, so a privacy regression needs a one-time client migration to scrub already-distributed copies, keyed on a stable signature so it never touches data the user added themselves.',
        impact: 'High - a privacy leak: the owner\u2019s real application history (companies, roles, statuses, a sponsorship note) was visible to every visitor. New visitors now get a blank tracker, and already-seeded browsers self-clean on next load.'
    },
    {
        id: 41,
        title: 'Publishing Created a SECOND Repo on Re-publish and the README Never Got the Live Portfolio Link',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / GitHub',
        fixTime: '50 min',
        description: 'A test user reported two problems publishing from another GitHub account: (1) two repositories were created for the same application (one named from a JD heading, "About-the-job", and another with the real role, "AI-Solutions-Automation-Developer"), and (2) the published README never showed the live portfolio link, even after clicking Re-publish or generating again. It worked fine for the project owner, which masked the bug.',
        rootCause: 'Two issues. (1) publishHistoryEntry computed the repo name fresh on EVERY publish as safeRepoName(resolvedRole). When the first (failed-AI) run had no real title, the JD heading "About the job" leaked through extractJobMeta and became the repo name; a later successful run resolved the real role and so created a SECOND repo. Re-publish never reused the previously-published repo. (2) pagesUrl was only set if GitHubRunner.enablePages() returned truthy — but enabling Pages right after pushing the first file races (the branch was just created), so it returned false, pagesUrl stayed empty, and buildPublishReadme() omitted the whole Live Portfolio section.',
        resolution: 'publishHistoryEntry now REUSES the already-published repo (item.repoName, else parsed from item.repoUrl) so re-publishing updates the same repo instead of forking a new one, and persists repoName on the history entry. The Pages URL for a project site is deterministic (https://<user>.github.io/<repo>/), so it is now set whenever an index.html is published and written into the README + tracker regardless of the enable call timing; enablePages is still attempted (now with a retry after a short delay) to actually turn Pages on. A new repoNameFor() helper and a JD-heading skip-list in extractJobMeta stop generic banners ("About the job", "Overview", "the role") from ever becoming the repo name — falling back to a candidate-based name instead.',
        codeExample: `// (1) Re-publish reuses the SAME repo instead of creating a second one.
const repoName = item.repoName
  || (item.repoUrl ? item.repoUrl.split('/').filter(Boolean).pop() : '')
  || repoNameFor(role, baseName);   // never names it from a JD heading

// (2) Pages URL is deterministic — write it regardless of the enable race.
let pagesUrl = '';
if (files['index.html']) {
  pagesUrl = 'https://' + login + '.github.io/' + repoName + '/';
  let ok = await GitHubRunner.enablePages(login, repoName, 'main');
  if (!ok) { await sleep(2500); ok = await GitHubRunner.enablePages(login, repoName, 'main'); }
}
// README + tracker now always carry the live link.`,
        lesson: 'Anything that names a remote resource from a re-derived value will duplicate it the moment that value changes — once you publish to a repo, REMEMBER it and reuse it on every update. Do not gate a deterministic URL on a flaky enable call: a GitHub Pages project URL is fully predictable, so write it immediately and let the (retried, best-effort) enable catch up. And a bug that "works for me" usually means a race the maintainer happens to win — test the cold path (a brand-new account, a freshly-created branch). Finally, validate extracted titles: a JD section heading is not a job title, and it should never leak into a repo name.',
        impact: 'High - re-publishing now updates one repo (no more orphan duplicates), every published package gets the live portfolio link in its README and tracker row, and repos get sensible names even when AI extraction fails.'
    },
    {
        id: 42,
        title: 'JD Match Score Stuck Low on Junk Keywords, and Resumes Showed Only the Handful of Matched Skills',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '70 min',
        description: 'After adding the JD match score, a user reported the score was stuck at 46% and never moved no matter how the AI tailored the resume, and the "missing keywords" were nonsense like "salary", "paid", "eligible", "base", "company", "ensure", "release", and "senior". Separately, the generated resume\u2019s Core Skills section listed only ~6 skills even though the profile had 18+, making every résumé look thin.',
        rootCause: 'Two problems. (1) jdMatchKeywords ranked JD terms purely by raw frequency against a tiny stopword list, so high-frequency HR/benefits/EEO boilerplate ("salary", "eligible", "paid", "company"\u2026) dominated the keyword set. No résumé ever contains those words, so the score was capped low and could not improve with tailoring, and the learning suggestions ("Learn Salary") were absurd. (2) Both resume builders did `const skills = (matched && matched.length ? matched : p.skills)` \u2014 i.e. they REPLACED the full skills list with only the few that literally appeared in the JD, discarding the rest.',
        resolution: 'Rebuilt keyword extraction: a much larger stopword list (HR/benefits/EEO/generic verbs), a ~250-term skill/tool lexicon that whitelists and boosts real skills, two-word phrase (bigram) detection for terms like "site reliability"/"incident management", capitalization checks to keep proper tool names, and stripping of trailing compensation/benefits/EEO sections before extraction. Scoring now matches against the résumé text with word boundaries (and phrase includes). Added prioritizedSkills(all, matched) which keeps ALL skills but lists JD-matched ones FIRST, and wired it into the PDF and Word builders. Also strengthened the AI tailoring prompt (exact-keyword mirroring, 16\u201324 prioritized skills, every bullet rewritten and quantified).',
        codeExample: `// BEFORE: only the matched handful survived \u2014 thin résumés.
const skills = (matched && matched.length ? matched : p.skills);

// AFTER: keep ALL skills, JD-matched ones first (ATS-friendly).
function prioritizedSkills(all, matched) {
  const dedup = [...new Set((all||[]).map(s => s.trim()).filter(Boolean))];
  if (!matched?.length) return dedup;
  const hit = new Set(matched.map(m => m.toLowerCase()));
  return [...dedup.filter(s => hit.has(s.toLowerCase())),
          ...dedup.filter(s => !hit.has(s.toLowerCase()))];
}
// + keyword extraction now drops HR boilerplate and boosts a real-skill lexicon.`,
        lesson: 'A keyword-match score is only as good as its keyword list \u2014 raw term frequency surfaces boilerplate (salary, benefits, EEO) that no résumé will ever match, pinning the score and making the gap analysis nonsensical. Bias extraction toward a real-skill lexicon + phrases and strip the non-skill sections. And never silently DROP user content to "tailor": showing only JD-matched skills makes the résumé weaker, not stronger \u2014 reorder for relevance, but keep everything the candidate has.',
        impact: 'High - the match score now reflects real skills and actually rises as the résumé improves, the gap list and learning links are meaningful, and generated résumés show the candidate\u2019s full, prioritized skill set instead of just six terms.'
    },
    {
        id: 43,
        title: 'Ollama Re-check Toasted "Success" While the Card Stayed Failed (and No Files)',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / GitHub',
        fixTime: '55 min',
        description: 'An Ollama cloud run finished green on GitHub, but the app showed a "Run completed — flipped to Success" toast WHILE the History row stayed "Failed" with "Model did not return clean JSON", and no documents were available to download. The success notification and the actual card state directly contradicted each other.',
        rootCause: 'Two problems. (1) In recheckHistoryEntry, the success toast fired UNCONDITIONALLY after finalizeResumedRun returned — but finalizeResumedRun had internally marked the row Failed because the committed result was {_raw:"..."} (the 3B Llama model wrapped its JSON in prose, so the cloud extractJson could not parse it). The caller never inspected the real outcome. (2) finalizeResumedRun treated any _raw envelope as a hard failure with no attempt to recover, so messy-but-recoverable model output produced zero files.',
        resolution: 'finalizeResumedRun now RETURNS its real outcome ("success" | "success-norebuild" | "failed") and no longer toasts internally; every caller (Re-check, the background monitor, and the import path) toasts based on that return so the message always matches the card. It also SALVAGES _raw output by running the tolerant parseAIResponse over it to recover summary/skills/experience before giving up; only truly unusable output is marked Failed, now with a clear message pointing to Re-check or Free AI (Pollinations). The cloud-side extractJson was also hardened (trailing-comma repair + a balanced-brace scan) so future runs commit clean JSON more often.',
        codeExample: `// BEFORE: toast always claimed success, even when the row was set to Failed.
await finalizeResumedRun(item, data);
showToast('Run completed — flipped to Success', 'success');

// AFTER: act on the real outcome; salvage messy output first.
const outcome = await finalizeResumedRun(item, data);   // 'success' | 'success-norebuild' | 'failed'
if (outcome === 'failed')      showToast('Finished, but the model returned unusable output — Re-check or use Free AI', 'error');
else if (outcome === 'success-norebuild') showToast('Marked Success — open History to Publish', 'success');
else                           showToast('Ready to download in the Generate tab', 'success');`,
        lesson: 'A function that mutates state must report what it actually did — never let a caller assume success and fire a notification that contradicts the very row it just updated. Return an outcome and toast on it. And before declaring an AI/cloud result a failure, try to salvage it: small local models routinely wrap valid content in prose, so a tolerant parser recovers most "bad JSON" cases that a strict JSON.parse rejects.',
        impact: 'High - notifications now always match the History card, recoverable cloud output yields downloadable documents instead of a false failure, and genuinely broken runs show an honest, actionable message.'
    },
    {
        id: 44,
        title: 'AI Replaced the Real Employer with the Hiring Company ("Docusign") and Used "Mon YYYY" Placeholder Dates',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / Prompt',
        fixTime: '60 min',
        description: 'A user tailoring to a DocuSign job got a generated résumé where every experience entry listed "Senior Site Reliability Engineer - Docusign, Remote" with dates "Mon YYYY - Mon YYYY". Their real employer (Microsoft Corporation, Redmond WA, May 2021 - Present) was gone and one real job had been split into several fabricated DocuSign roles. The rewritten bullets were good, but the work history was fabricated.',
        rootCause: 'Two prompt issues plus no guardrail. (1) The model conflated the TARGET (hiring) company from the job description with the candidate\u2019s employer, so it stamped "Docusign" onto every role. (2) The JSON schema example literally contained "dates":"Mon YYYY - Mon YYYY", and the weak 3B model echoed that placeholder verbatim. (3) Nothing on the client validated the model\u2019s experience output, so fabricated employers and placeholder dates flowed straight into the résumé/portfolio.',
        resolution: 'Hardened the prompts (both the in-app provider prompt and the Ollama cloud prompt): an explicit rule that company/role/location/dates are copied VERBATIM from the candidate and that the JD\u2019s hiring company is the target you apply TO, never an employer; placeholder dates ("Mon YYYY") are banned (use "" if unknown); the schema example is now labelled ILLUSTRATIVE with "replace with the candidate\u2019s REAL values". Added a client-side reconcileExperience() guardrail applied to BOTH the inline and Ollama-cloud paths: when role counts match it keeps the candidate\u2019s real employer/title/dates and adopts only the rewritten bullets; a single real employer absorbs all rewritten bullets (models love to split one job into many); otherwise it strips any experience whose company is the hiring company and removes placeholder ("YYYY") dates.',
        codeExample: `// Guardrail: real employer/title/dates win; only bullets come from the model.
function reconcileExperience(aiExp, originalExp, hiringCompany) {
  const ai = (aiExp||[]).map(normalizeAIExperience);
  const orig = (originalExp||[]).map(normalizeAIExperience);
  const isHiring = c => { const h=norm(hiringCompany), x=norm(c); return h && x && (x.includes(h)||h.includes(x)); };
  if (orig.length && orig.length === ai.length)          // 1:1 → keep real headers
    return orig.map((o,i) => ({ ...o, description: ai[i].description || o.description }));
  if (orig.length === 1)                                  // one real job, many fake → merge
    return [{ ...orig[0], description: ai.map(a=>a.description).filter(Boolean).join('\\n') }];
  return ai.map(a => ({ ...a, company: isHiring(a.company)?'':a.company, year: /yyyy/i.test(a.year)?'':a.year }));
}`,
        lesson: 'Never put a literal placeholder ("Mon YYYY") in a few-shot schema example — weak models copy examples verbatim. Label examples as illustrative and tell the model to substitute real data. And for anything an LLM must NOT change (employer, dates, identity), do not rely on the prompt alone: enforce it in code. The hiring company in a JD is a classic source of hallucination because it is the most prominent company name in the context — explicitly fence it off from the work-history fields.',
        impact: 'High - tailored résumés keep the candidate\u2019s real employers, titles and dates while still benefiting from rewritten, JD-aligned bullets; the JD\u2019s hiring company can no longer masquerade as a past employer, and placeholder dates never reach the document.'
    },
    {
        id: 45,
        title: '"Use" Button Skipped the Extraction Preview & Match Card on the Generate Tab',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '10 min',
        description: 'Clicking "Use" on a freshly created profile navigated to the Generate tab and selected the profile in the dropdown, but the extraction preview and JD match card did not appear. Selecting the same profile manually from the dropdown worked fine.',
        rootCause: 'selectProfile() set the dropdown value programmatically via populateProfileSelects(id). Setting a <select>\u2019s .value in code does NOT fire its onchange handler, so loadProfileData() (which calls renderProfilePreview() + refreshMatchCard()) never ran. Manual selection worked only because the user interaction fired onchange.',
        resolution: 'After preselecting the profile, selectProfile() now explicitly calls renderProfilePreview(currentProfile) and refreshMatchCard() \u2014 mirroring exactly what the onchange path does \u2014 so the preview and match/score cards render identically whether the profile is chosen via the "Use" button or the dropdown.',
        codeExample: `function selectProfile(id) {
  currentProfile = StorageManager.getProfile(id);
  switchMainTab('generator');
  populateProfileSelects(id);          // sets <select>.value but does NOT fire onchange
  renderProfilePreview(currentProfile); // so render the preview...
  refreshMatchCard();                   // ...and the match card ourselves
}`,
        lesson: 'Programmatically setting an input\u2019s value never triggers its change/input events. Any UI that a handler builds on selection must be invoked explicitly after a code-driven set (or dispatch a synthetic change event) \u2014 don\u2019t assume the listener will run.',
        impact: 'Medium - the "Use" shortcut now gives the same immediate feedback (extraction preview + match score) as manual selection, so users can confirm their new profile and its JD fit right away.'
    },
    {
        id: 46,
        title: 'Portfolio Template Dropdown Group Headers Unreadable on the Dark Theme',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '10 min',
        description: 'In the Portfolio Template <select>, the <optgroup> category headers (Minimalist, Executive, Creative, Tech, …) rendered with a bright/near-white default background that clashed harshly with the app\u2019s dark theme, hurting readability and looking unfinished.',
        rootCause: 'Native <optgroup> labels are painted by the OS/browser with a default light system background inside the dropdown popup. Nothing in the app styled them, so on a dark UI they stood out as bright bands. The rest of the dropdown (the <option> rows) was already dark, which made the mismatch obvious.',
        resolution: 'Added explicit CSS for #portfolioTemplate optgroup (dark background #0f1420, muted light label colour, non-italic bold) and #portfolioTemplate option (dark bg, light text) so the group headers blend into the dark theme. Noted that Chrome/Edge on Windows honour optgroup styling; Firefox/Safari restrict native select popups, so the darkening is a progressive enhancement there.',
        codeExample: `#portfolioTemplate optgroup {
  background: #0f1420;
  color: #8b97a8;
  font-weight: 700;
  font-style: normal;
}
#portfolioTemplate option { background: #161c28; color: #e6e9ef; }`,
        lesson: 'Native form-control chrome (optgroup labels, option rows, scrollbars) does not inherit your theme by default. On a dark UI, explicitly style optgroup/option — but treat it as progressive enhancement because some browsers lock down native select popups.',
        impact: 'Low - the portfolio template dropdown now reads cleanly on the dark theme in Chromium browsers instead of showing jarring bright category bands.'
    },
    {
        id: 47,
        title: 'Compact Density Radio Label Wrapped to Three Ragged Lines',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '5 min',
        description: 'In the Step-4 résumé options, the "Compact (fit 1 page)" density radio label wrapped awkwardly onto three lines in the narrow column ("Compact" / "(fit" / "1 page)"), looking broken next to the tidy "Comfortable" option.',
        rootCause: 'The label was a single run of text left to wrap freely inside a narrow flex column, so the browser broke it at arbitrary spaces. There was no control over WHERE the line breaks fell.',
        resolution: 'Rewrote the label as two intentional lines — "Compact" then "(fits 1 page)" — using an explicit <br> inside a span, and set white-space:nowrap on the radio label so neither line fragments further. Also corrected the copy from "fit" to "fits".',
        codeExample: `<!-- before: wraps into 3 ragged lines -->
<label class="reo-radio"><input type="radio" ...> Compact (fit 1 page)</label>

<!-- after: exactly two controlled lines -->
<label class="reo-radio"><input type="radio" ...> <span class="reo-two">Compact<br>(fits 1 page)</span></label>
/* .reo-radio { white-space: nowrap; }  .reo-two { display:inline-block; line-height:1.15; } */`,
        lesson: 'When a short label must break, control it: an explicit <br> plus white-space:nowrap gives predictable, tidy line breaks instead of letting a narrow container fragment text at random spaces.',
        impact: 'Low - the density toggle now reads as a clean two-line label that lines up with the rest of the options.'
    },
    {
        id: 48,
        title: 'Tall "AI Status" List Stretched the Quick Actions & Statistics Dashboard Cards',
        severity: 'medium',
        status: 'Fixed',
        role: 'Frontend Developer / UX',
        fixTime: '45 min',
        description: 'After the AI failover-chain providers were added, the dashboard\u2019s "AI Status" card became a long vertical list. Because the dashboard cards sit in a CSS grid row, the tall AI card stretched its shorter siblings (Quick Actions, Statistics) to the same height, leaving big empty gaps and a lopsided, "stretchy" dashboard.',
        rootCause: 'CSS grid defaults to align-items:stretch, so every card in a row grows to match the tallest item in that row. The AI Status card rendered one provider per row (a growing vertical list), so as providers were added it dictated the row height and inflated the other cards.',
        resolution: 'Made the AI panel a full-width card (grid-column: 1 / -1) rendering compact provider "chips" in a responsive multi-column grid (grouped Free / Free-key / Premium / Custom) instead of a tall single-column list, and set align-items:start on .dashboard-grid so shorter cards keep their natural height. Added a summary pill ("N of M ready") and an Auto-chain footer.',
        codeExample: `.dashboard-grid { display: grid; align-items: start; }   /* stop stretch */
.dashboard-card--full { grid-column: 1 / -1; }          /* AI panel spans row */
.ai-engine-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .5rem; }`,
        lesson: 'A single growing list inside a CSS grid row will silently distort every sibling because grid rows stretch to the tallest item. Either set align-items:start or promote the tall element to its own full-width row — and prefer a compact, wrapping chip grid over an unbounded vertical list for collections that keep growing.',
        impact: 'Medium - the dashboard stays balanced and professional as more AI engines are added; provider readiness is now scannable at a glance instead of a long list that warped the layout.'
    },
    {
        id: 49,
        title: 'Browser Password Autofill Saved into the OpenAI API-Key Field (No Saved/Age Indicator)',
        severity: 'high',
        status: 'Fixed',
        role: 'Frontend Developer / Security',
        fixTime: '40 min',
        description: 'In Settings, the browser\u2019s password manager autofilled a saved login into the FIRST password field on the page — the OpenAI API-key input — and the user, who had no OpenAI key, could unknowingly save that junk value; the card then showed a ✅ as if a real key existed. There was also no indication of WHICH keys were actually saved or HOW OLD they were (API keys expire on a schedule), and the paid providers (OpenAI, Claude) were listed above the free ones, nudging users toward paid engines.',
        rootCause: 'The key inputs were plain <input type="password"> with no autocomplete opt-out, so Chrome/1Password/LastPass treated the first one as a login field and autofilled it. "Configured" was inferred purely from key presence with no visible provenance (saved date) or easy way to remove a mistaken value, and the provider ordering put paid engines first.',
        resolution: 'Rebuilt the AI settings into a free-first, numbered, category layout (① Free · ② Free+key · ③ Premium · ④ Cloud) via a reusable providerKeyCard() helper. Each key input now uses autocomplete="new-password" plus autocorrect/autocapitalize/spellcheck off, a randomized name, and data-lpignore / data-1p-ignore / data-form-type="other" so password managers no longer autofill it. Configured cards show a green "✓ Key saved · saved N days ago" indicator (from the stored savedAt) and a Remove button that calls StorageManager.deleteAPIKey to clear a mistaken key.',
        codeExample: `<!-- Key input that browsers & password managers will NOT autofill -->
<input type="password" id="aikey_openai"
       autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false"
       name="aikey-openai-x8k2q" data-lpignore="true" data-1p-ignore data-form-type="other" />

// "saved N days ago" from the stored timestamp (keys expire on a schedule)
function aiKeyAgeLabel(id){
  const s = (StorageManager.getAllAPIKeys()||{})[id];
  if(!s||!s.savedAt) return '';
  const d = Math.floor((Date.now()-new Date(s.savedAt))/86400000);
  return d<=0?'saved today':('saved '+d+' day'+(d>1?'s':'')+' ago');
}`,
        lesson: 'autocomplete="off" does not stop modern password managers — use autocomplete="new-password" plus per-manager opt-out attributes (data-lpignore, data-1p-ignore) and unique names for any secret field, especially the first password input on a page. Always show provenance for stored secrets (saved? how old?) and an easy Remove, and order free options before paid so the UI never nudges users into charges.',
        impact: 'High - key fields no longer capture autofilled passwords, each provider clearly shows whether its key is saved and how old it is (jogging users to rotate expiring keys), mistaken keys are one click to remove, and the free-first ordering keeps the default experience free.'
    },
    {
        id: 50,
        title: 'One Stray Parenthesis in script.js Broke the ENTIRE App — Users Could Not Log In',
        severity: 'critical',
        status: 'Fixed',
        role: 'Build Engineer / SRE',
        fixTime: '15 min',
        description: 'Right after shipping the dashboard/settings redesign, users reported they could not log in to the live portal — clicking the GitHub sign-in button did nothing. The button, the token modal, and in fact EVERY interactive feature were dead, even though the page HTML rendered fine.',
        rootCause: 'A refactor added the line const nm = (AIIntegration.providers[provider] && ...replace(...).trim()) || provider); with an EXTRA closing parenthesis at the end (the ( ... ) wrapped only the && expression, so the trailing ) had no match). JavaScript aborts an entire script file on a single parse error, so script.js never executed and none of its functions — including initiateGitHubLogin() — were ever defined. The inline onclick then referenced an undefined function and silently failed. Critically, the VS Code language-service diagnostics (get_errors) reported "No errors found", so the bad code was committed and pushed to production.',
        resolution: 'Ran node --check script.js, which pinpointed the exact line and column ("Unexpected token )"), removed the extra parenthesis, re-checked until clean, then committed and pushed. Added a standing rule: after ANY edit to script.js run node --check script.js (authoritative) in addition to get_errors, because the editor diagnostics can miss unbalanced-delimiter syntax errors that take down the whole bundle.',
        codeExample: `// BROKEN - trailing ) has no matching ( -> whole file fails to parse
const nm = (AIIntegration.providers[provider] && AIIntegration.providers[provider].name.replace(/\\s*[\\(].*$/, '').trim()) || provider);

// FIXED - the ( ... ) wraps only the && expr; || provider sits outside
const nm = (AIIntegration.providers[provider] && AIIntegration.providers[provider].name.replace(/\\s*[\\(].*$/, '').trim()) || provider;

// Catch it BEFORE committing:  node --check script.js`,
        lesson: 'A single syntax error takes down an entire JS file - every function in it vanishes, so seemingly unrelated features (like login) break at once. Editor/linter diagnostics are not a substitute for the real parser: always run node --check on changed .js before pushing, especially for a static site with no build step to catch it. When "nothing works", suspect a parse error in a core script, not the feature that appears broken.',
        impact: 'Critical - restored the entire application (login and every feature) on the live GitHub Pages portal; hardened the pre-push checklist so an unbalanced-paren error cannot silently ship again.'
    },
    {
        id: 51,
        title: 'Guided-Tour Bubble: Skip/Back/Next Buttons Overflowed Outside the Card',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '10 min',
        description: 'On the multi-page guided tour, the footer controls (the progress dots plus the Skip / Back / Next buttons) spilled outside the right edge of the coach-mark bubble on every step, so the Next button was partly clipped by the card border.',
        rootCause: 'The footer was a single horizontal flex row (dots + buttons, justify-content:space-between, no wrapping). The full portal tour has 14 steps, so it renders 14 progress dots; that dot strip alone is wider than the narrow bubble body, and with no wrap it pushed the button group past the card edge. The bubble body could not shrink the row, so it overflowed instead of reflowing.',
        resolution: 'Changed the footer to a vertical stack (flex-direction:column): the dots sit on their own row and are allowed to wrap (flex-wrap), and the buttons sit on a second row right-aligned (justify-content:flex-end) and also wrap if needed. Added box-sizing:border-box and flex:1 1 auto on the body, and nudged the bubble width to min(360px,92vw). Now the controls always stay inside the card regardless of step count.',
        codeExample: `/* before: one row, no wrap -> 14 dots shove the buttons out */
.tour-foot { display:flex; justify-content:space-between; }

/* after: stack dots above buttons; both wrap; buttons right-aligned */
.tour-foot { display:flex; flex-direction:column; align-items:stretch; gap:.55rem; }
.tour-dots { display:flex; flex-wrap:wrap; gap:5px; }
.tour-btns { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:.4rem; }`,
        lesson: 'A fixed-width popover that shows a variable number of items (here, one progress dot per step) must let its contents WRAP or it will overflow once the count grows. Prefer stacking meta (dots) above actions (buttons) in narrow cards, and never rely on a single non-wrapping flex row for content whose length you do not control.',
        impact: 'Low - the tour coach-mark now looks clean on every step and screen size; the Skip/Back/Next controls always stay inside the bubble even on the long 14-step full tour.'
    },
    {
        id: 52,
        title: 'Settings Provider Cards Rendered Uneven (Ragged Heights) Within a Row',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '20 min',
        description: 'In Settings, two cards side by side (e.g. OpenAI with a saved key + Remove button vs Claude without) rendered at different heights, leaving a ragged, "not adjusted" look. An earlier attempt to fix a perceived stretch actually made it worse by forcing natural (unequal) heights.',
        rootCause: 'A previous change added align-items:start to the .ai-providers-grid (and the dashboard .ai-engine-grid) on the assumption that "stretch = bad". But for a simple grid of provider cards, EQUAL height is the tidy result; align-items:start sized each card to its own content, so a taller saved-key card sat next to a shorter unsaved one with mismatched bottoms.',
        resolution: 'Reverted both card grids to the CSS-grid default (align-items:stretch) so cards in a row share the tallest height, and relied on the existing rule .ai-provider-card small { margin-top:auto } which sinks each card footer to the bottom — so the "Get your API key at…" lines align across cards. Verified in an offline Playwright harness that loads the real style.css: paired paid cards measured 305/305px and free cards 285/285px (equal), with footers bottom-aligned. NOTE: this is different from the dashboard .dashboard-grid, which correctly KEEPS align-items:start because its cards (a full-width AI panel next to small Quick-Actions/Statistics cards) are intentionally different sizes.',
        codeExample: `/* WRONG for a plain card grid: makes neighbours ragged/unequal */
.ai-providers-grid { align-items: start; }

/* RIGHT: default stretch = equal height; footer sinks to the bottom so
   the "get key" lines align across cards */
.ai-providers-grid { /* (no align-items) => stretch */ }
.ai-provider-card { display:flex; flex-direction:column; }
.ai-provider-card small { margin-top: auto; }`,
        lesson: 'align-items:start is the right fix ONLY when a row deliberately mixes very different card sizes (like the dashboard AI panel vs small stat cards). For a uniform grid of peer cards, equal-height (the grid default stretch) plus margin-top:auto on the footer is what looks "adjusted". Do not blanket-apply one alignment rule to every grid — and validate layout visually (a tiny offline harness that loads the real CSS beats guessing).',
        impact: 'Low - Settings provider cards now render at equal heights with bottom-aligned "get key" links, so a saved key (extra Remove button/status line) no longer makes a card look mismatched next to its neighbour.'
    },
    {
        id: 53,
        title: 'Long Provider API-Key URLs Overflowed Outside the Settings Cards',
        severity: 'low',
        status: 'Fixed',
        role: 'Frontend Developer',
        fixTime: '15 min',
        description: 'The provider cards printed the full sign-up URL as the link text (e.g. platform.claude.com/docs/en/api/admin/api_keys/retrieve, admin.mistral.ai/organization/api-keys). Those are long unbroken strings, so the link ran past the right edge of the card instead of staying inside it.',
        rootCause: 'A URL has no spaces, so it is treated as one long word that will not wrap at the card boundary; with the raw URL used as the visible link text, the anchor overflowed its container. The card was the right width — the content simply could not break.',
        resolution: 'Replaced the raw-URL link text with a short, friendly hyperlink — "Get your API key ↗" (paid) / "Get a free key ↗" (free) — that links to the same URL (full URL kept in the title tooltip and href). Put it on its own line above the privacy note, and added overflow-wrap:anywhere / word-break:break-word to .ai-provider-card small as a safety net so any future long string still wraps instead of overflowing. Verified in an offline Playwright harness that loads the real style.css: every card reported the link fully inside its box (no overflow) at equal 290px heights.',
        codeExample: `// before: the raw URL as link text -> long unbroken word overflows the card
\`<a href="\${url}">\${url.replace(/^https?:\\/\\//,'')}</a>\`

// after: short label link (full URL in title + href) -> always fits
\`<a class="pk-keylink" href="\${url}" target="_blank" rel="noopener" title="\${url}">\${paid ? 'Get your API key' : 'Get a free key'} \\u2197</a>\`
/* safety net */ .ai-provider-card small { overflow-wrap: anywhere; word-break: break-word; }`,
        lesson: 'Never render a raw URL as visible link text inside a fixed-width card — URLs are unbreakable words and will overflow. Use a short human label ("Get your API key ↗") and keep the real URL in href/title. Always pair that with overflow-wrap:anywhere as a defensive fallback for any user- or data-supplied string.',
        impact: 'Low - provider cards now show a tidy "Get your API key ↗" link that stays inside the card on every provider and width, replacing the long URLs that spilled outside the box.'
    }
];console.log("BUGS array loaded with", window.BUGS.length, "bugs");
