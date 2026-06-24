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
    return `You are a world-class resume writer and ATS (Applicant Tracking System) optimization specialist.

GOAL: Produce a NEW, polished, ATS-optimized resume for the candidate, targeted at the JOB DESCRIPTION below. Actively rewrite — do not echo the input.

RULES:
- Mirror the exact terminology, hard skills, tools and keywords from the job description, but only where the candidate genuinely has that experience.
- Rewrite the summary into 3-4 punchy sentences positioning the candidate for THIS role.
- Rewrite each experience bullet: strong action verb first, quantified impact where supported, aligned to the job's responsibilities.
- Prioritize and reorder skills so the most JD-relevant come first.
- Stay truthful: use only the candidate's real employers, titles, dates and accomplishments. Never fabricate.

CANDIDATE RESUME(S) (authoritative source — extract every useful data point):
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jdText}
"""

Respond with ONE valid minified JSON object and NOTHING else. Use EXACTLY these keys:
{"summary":"3-4 sentence ATS-optimized summary, plain text, no line breaks","skills":["12-20 prioritized JD-aligned skills"],"experience":[{"role":"job title","company":"employer","location":"city, ST","dates":"Mon YYYY - Mon YYYY","details":["rewritten achievement bullet, action-verb first, quantified, under 28 words"]}],"education":["degree, institution, year"]}
Return ONLY the JSON object.`;
}

async function callOllama(prompt) {
    const url = ENDPOINT + '/v1/chat/completions';
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0.4,
            stream: false,
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
}

function extractJson(raw) {
    let s = String(raw).replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    const candidate = (a !== -1 && b > a) ? s.slice(a, b + 1) : s;
    try {
        return JSON.parse(candidate);
    } catch (e) {
        console.error('Model did not return valid JSON; saving raw output for inspection.');
        return { _raw: raw };
    }
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
