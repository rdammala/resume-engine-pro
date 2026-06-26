#!/usr/bin/env node
/**
 * ollama-actions-generate.js
 * ------------------------------------------------------------------
 * Environment-driven companion to ollama-generate.js, built to run
 * inside the `ollama-resume.yml` GitHub Actions workflow.
 *
 * It reads its inputs from environment variables (set by the workflow
 * from the website's workflow_dispatch payload), tailors the resume to
 * the job description with a free local Llama 3 model, and writes the
 * result to generated/<OUTPUT_NAME>.json (+ .md) so the workflow can
 * commit it back to the repository. The website then fetches that file.
 *
 * ENV VARS
 *   BULK_DATA        Combined raw text of the candidate's existing resume(s).
 *   JOB_DESC         Target job description.
 *   OUTPUT_NAME      Unique run id; used as the output filename.
 *   OLLAMA_MODEL     Model name (default llama3.2).
 *   OLLAMA_ENDPOINT  Base URL (default http://localhost:11434).
 * ------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const BULK = process.env.BULK_DATA || '';
const JD = process.env.JOB_DESC || '';
const NAME = (process.env.OUTPUT_NAME || 'tailored').replace(/[^a-zA-Z0-9._-]/g, '_');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const ENDPOINT = (process.env.OLLAMA_ENDPOINT || 'http://localhost:11434').replace(/\/+$/, '');

if (!BULK.trim() || !JD.trim()) {
    console.error('Missing BULK_DATA or JOB_DESC environment variables.');
    process.exit(1);
}

function buildPrompt(resumeText, jdText) {
    return `You are a world-class executive resume writer and ATS (Applicant Tracking System) optimization specialist with 15+ years placing senior technical talent. You write tight, metric-driven, recruiter-grade resumes.

GOAL: Produce a NEW, polished, ATS-optimized resume for the candidate, precisely targeted at the JOB DESCRIPTION. Aggressively REWRITE — never echo the input verbatim.

QUALITY BAR (non-negotiable):
- SUMMARY: 3-4 punchy sentences. Lead with seniority + years + domain, then 2-3 signature strengths that mirror the JD, and a closing value statement. Plain text, no line breaks.
- SKILLS: return 14-18 skills, prioritized so the most JD-relevant appear first. Use the EXACT tool/technology/keyword terminology from the job description wherever the candidate genuinely has it (e.g., "Kubernetes", "Terraform", "Azure", "SLO/SLA", "CI/CD", "Incident Management"). Mix hard skills, platforms, and methodologies — no soft-skill filler.
- EXPERIENCE: for EACH role write 4-6 distinct achievement bullets (NOT one). Every bullet MUST:
    * start with a strong past-tense action verb (Led, Architected, Reduced, Automated, Scaled, Migrated, Drove, Delivered),
    * contain a QUANTIFIED result wherever the source supports it (%, $, time saved, scale, headcount, uptime, MTTR, throughput),
    * name concrete technologies/methods relevant to the JD,
    * be a single line under ~28 words, no trailing period required.
  Order roles most-recent first. Do NOT merge multiple roles. Keep the candidate's real employers, titles, and dates.
- EDUCATION & CERTS: include real degrees/certifications if present.
- TRUTHFULNESS: use only the candidate's real employers, titles, dates and accomplishments. Never invent employers or metrics that are not implied by the source. If a number is not supported, write a strong qualitative bullet instead.
- Also extract the target job's title and the hiring company from the JOB DESCRIPTION into "job_title" and "company" (best-effort; use "" if genuinely unclear — never guess a benefit or perk as the company).

CANDIDATE RESUME(S) (authoritative source — mine every useful data point: roles, dates, tools, metrics, scope):
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jdText}
"""

Respond with ONE valid minified JSON object and NOTHING else (no markdown, no code fences, no commentary). Use EXACTLY these keys:
{"job_title":"the role being applied for","company":"the hiring company","summary":"3-4 sentence ATS-optimized summary, plain text, no line breaks","skills":["14-18 prioritized JD-aligned skills"],"experience":[{"role":"job title","company":"employer","location":"city, ST","dates":"Mon YYYY - Mon YYYY","details":["Architected X using Y, cutting Z by 40%","Led a team of 8 to deliver ... on time","Automated ... reducing manual toil by 200+ hours/quarter","Reduced MTTR from 45m to 9m by ...","Scaled platform to handle 3x traffic with 99.95% uptime"]}],"education":["degree, institution, year"]}

HARD REQUIREMENTS:
- Each "details" array MUST contain 4 to 6 bullets. A single-bullet role is unacceptable.
- "skills" MUST contain at least 14 entries.
- Escape any double quotes inside strings; never use raw newline characters inside strings.
- Return ONLY the JSON object.`;
}

async function callOllama(prompt, attempt = 1) {
    const url = ENDPOINT + '/v1/chat/completions';
    // The free CPU runner can take several minutes for the first inference
    // (model load + generation), so give it a generous abort timeout.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9 * 60 * 1000);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: MODEL,
                temperature: 0.35,
                stream: false,
                keep_alive: '5m',
                // num_ctx must be large enough to hold the resume + JD + instructions
                // AND leave room to generate. The old 4096 truncated most of the
                // input, so the model never saw the full work history and had no
                // room for rich output (1 bullet/role). 8192 is safe for a 3B model
                // on the ~16 GB free runner (small KV cache). num_predict ensures a
                // full, multi-bullet resume is generated instead of a short stub.
                options: { num_ctx: 8192, num_predict: 2048 },
                messages: [
                    { role: 'system', content: 'You are an expert resume writer and ATS specialist. Respond with ONLY a single valid minified JSON object — no markdown, no code fences.' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        if (!res.ok) {
            throw new Error(`Ollama HTTP ${res.status} — is the server running? Try: ollama serve`);
        }
        const data = await res.json();
        return data?.choices?.[0]?.message?.content
            ?? data?.message?.content
            ?? (typeof data === 'string' ? data : JSON.stringify(data));
    } catch (err) {
        // "fetch failed" / aborted usually means the server dropped the
        // connection (often a transient hiccup or memory pressure). Retry once.
        if (attempt < 2) {
            console.warn(`Ollama call failed (${err.message}); retrying once in 5s...`);
            await new Promise(r => setTimeout(r, 5000));
            return callOllama(prompt, attempt + 1);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

function extractJson(raw) {
    let s = String(raw).replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    const candidate = (a !== -1 && b > a) ? s.slice(a, b + 1) : s;
    const tryParse = (str) => { try { return JSON.parse(str); } catch (_) { return null; } };

    // 1) Straight parse, then 2) strip trailing commas (a very common LLM slip).
    let obj = tryParse(candidate) || tryParse(candidate.replace(/,\s*([}\]])/g, '$1'));
    if (obj) return obj;

    // 3) Balanced-brace scan: find the first COMPLETE top-level object, ignoring
    //    braces inside strings. Handles trailing prose after the JSON.
    if (a !== -1) {
        let depth = 0, inStr = false, esc = false;
        for (let i = a; i < s.length; i++) {
            const ch = s[i];
            if (inStr) {
                if (esc) esc = false;
                else if (ch === '\\') esc = true;
                else if (ch === '"') inStr = false;
            } else if (ch === '"') inStr = true;
            else if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) {
                    const seg = s.slice(a, i + 1);
                    obj = tryParse(seg) || tryParse(seg.replace(/,\s*([}\]])/g, '$1'));
                    if (obj) return obj;
                    break;
                }
            }
        }
    }
    console.error('Model did not return valid JSON; saving raw output for inspection.');
    return { _raw: raw };
}

function toMarkdown(r) {
    const lines = [];
    if (r.summary) lines.push('## Summary', '', r.summary, '');
    if (Array.isArray(r.skills) && r.skills.length) lines.push('## Skills', '', r.skills.join(' • '), '');
    if (Array.isArray(r.experience) && r.experience.length) {
        lines.push('## Experience', '');
        r.experience.forEach(e => {
            const head = [e.role, e.company, e.location, e.dates].filter(Boolean).join(' | ');
            lines.push(`### ${head}`);
            (e.details || []).forEach(d => lines.push(`- ${d}`));
            lines.push('');
        });
    }
    if (Array.isArray(r.education) && r.education.length) {
        lines.push('## Education', '', ...r.education.map(e => `- ${e}`), '');
    }
    return lines.join('\n');
}

(async () => {
    console.log(`Tailoring resume with Ollama model "${MODEL}" at ${ENDPOINT} ...`);
    const raw = await callOllama(buildPrompt(BULK, JD));
    const result = extractJson(raw);

    const outDir = path.join(process.cwd(), 'generated');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const jsonPath = path.join(outDir, `${NAME}.json`);
    const mdPath = path.join(outDir, `${NAME}.md`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
    fs.writeFileSync(mdPath, toMarkdown(result), 'utf8');

    console.log(`Done. Wrote:\n  ${jsonPath}\n  ${mdPath}`);
})().catch(err => {
    console.error('Generation failed:', err.message);
    process.exit(1);
});
