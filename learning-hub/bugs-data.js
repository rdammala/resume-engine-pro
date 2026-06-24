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
    }
];console.log("BUGS array loaded with", window.BUGS.length, "bugs");
