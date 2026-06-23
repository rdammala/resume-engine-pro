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
    }
];console.log("BUGS array loaded with", window.BUGS.length, "bugs");
