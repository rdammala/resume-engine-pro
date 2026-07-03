// ============================================================================
// FETCH EXTERNAL (WORKDAY) JOBS — runs SERVER-SIDE in GitHub Actions.
//
// The giants (NVIDIA, Salesforce, Adobe, Workday, …) run their careers on
// Workday, whose public CxS JSON API works fine from a server but sends no CORS
// header, so a static browser app can't read it. This script fetches them on a
// GitHub runner (no CORS there), normalizes the shape, and writes
// data/external-jobs.json — which the Job Search tab reads same-origin.
// Public endpoints only, no secrets, no scraping (their own JSON API).
// ============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';

// Each entry is a public Workday career site. Verified live before shipping.
const COMPANIES = [
    { name: 'NVIDIA',     host: 'nvidia.wd5',     tenant: 'nvidia',     site: 'NVIDIAExternalCareerSite' },
    { name: 'Salesforce', host: 'salesforce.wd12', tenant: 'salesforce', site: 'External_Career_Site' },
    { name: 'Adobe',      host: 'adobe.wd5',       tenant: 'adobe',      site: 'external_experienced' },
    { name: 'Workday',    host: 'workday.wd5',     tenant: 'workday',    site: 'Workday' }
];

// Workday caps the CxS "limit" at 20 per request, so we paginate with offset.
const PAGE = 20;
const MAX_PER_COMPANY = 60;

// Workday returns a human "postedOn" like "Posted Today" / "Posted 3 Days Ago" /
// "Posted 30+ Days Ago" — turn that into an approximate epoch so the app's
// last-3/7/30-day filter still works.
function ageToMs(postedOn, now) {
    if (!postedOn) return 0;
    const s = String(postedOn).toLowerCase();
    let days = null;
    if (s.includes('today')) days = 0;
    else if (s.includes('yesterday')) days = 1;
    else {
        const m = s.match(/(\d+)\s*\+?\s*day/);
        if (m) days = parseInt(m[1], 10);
    }
    if (days === null) return 0;
    return now - days * 86400000;
}

async function fetchCompany(c, now) {
    const endpoint = `https://${c.host}.myworkdayjobs.com/wday/cxs/${c.tenant}/${c.site}/jobs`;
    const base = `https://${c.host}.myworkdayjobs.com/en-US/${c.site}`;
    const out = [];
    for (let offset = 0; offset < MAX_PER_COMPANY; offset += PAGE) {
        const body = JSON.stringify({ appliedFacets: {}, limit: PAGE, offset, searchText: '' });
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body
        });
        if (!res.ok) {
            if (offset === 0) throw new Error('HTTP ' + res.status);
            break;
        }
        const data = await res.json();
        const posts = data.jobPostings || [];
        for (const j of posts) {
            out.push({
                company: c.name,
                title: j.title || '',
                location: j.locationsText || '',
                url: base + (j.externalPath || ''),
                postedMs: ageToMs(j.postedOn, now),
                source: 'Workday'
            });
        }
        if (posts.length < PAGE) break; // no more pages
    }
    return out;
}

async function main() {
    const now = Date.now();
    const all = [];
    const meta = [];
    for (const c of COMPANIES) {
        try {
            const jobs = await fetchCompany(c, now);
            all.push(...jobs);
            meta.push(`${c.name}:${jobs.length}`);
        } catch (e) {
            meta.push(`${c.name}:ERR(${e.message})`);
        }
    }
    const out = {
        generatedAt: new Date(now).toISOString(),
        count: all.length,
        companies: COMPANIES.map(c => c.name),
        jobs: all
    };
    mkdirSync('data', { recursive: true });
    writeFileSync('data/external-jobs.json', JSON.stringify(out));
    console.log('Wrote data/external-jobs.json —', all.length, 'jobs |', meta.join(' '));
}

main().catch(e => { console.error(e); process.exit(1); });
