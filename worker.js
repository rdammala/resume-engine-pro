// ============================================================================
// Cloudflare Worker for Resume Engine Pro.
//
// Default behavior is unchanged: every request serves the static site via the
// ASSETS binding. It adds ONE server-side API route — /api/adzuna — that proxies
// the Adzuna Jobs API so the browser can do LIVE global job search WITHOUT ever
// seeing the API credentials. The app_id / app_key live only as Cloudflare
// secrets (set once with: npx wrangler secret put ADZUNA_APP_ID / ADZUNA_APP_KEY)
// — never in the browser, never in git, never in the repo.
// ============================================================================

// Countries Adzuna supports (2-letter codes).
const ADZUNA_COUNTRIES = new Set([
    'gb', 'us', 'au', 'at', 'br', 'ca', 'ch', 'de', 'es',
    'fr', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'za'
]);

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/api/adzuna') {
            return handleAdzuna(url, env);
        }
        // Everything else is the static site, exactly as before.
        return env.ASSETS.fetch(request);
    }
};

async function handleAdzuna(url, env) {
    const cors = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    // Graceful, honest failure until the secret is configured.
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
        return new Response(JSON.stringify({ error: 'adzuna_not_configured' }), { status: 503, headers: cors });
    }

    const country = (url.searchParams.get('country') || 'us').toLowerCase();
    if (!ADZUNA_COUNTRIES.has(country)) {
        return new Response(JSON.stringify({ results: [], note: 'country_not_supported' }), { status: 200, headers: cors });
    }

    const page = (url.searchParams.get('page') || '1').replace(/[^0-9]/g, '') || '1';
    const api = new URL('https://api.adzuna.com/v1/api/jobs/' + country + '/search/' + page);
    api.searchParams.set('app_id', env.ADZUNA_APP_ID);
    api.searchParams.set('app_key', env.ADZUNA_APP_KEY);
    api.searchParams.set('results_per_page', '50');
    api.searchParams.set('content-type', 'application/json');

    const what = url.searchParams.get('what');
    const where = url.searchParams.get('where');
    const maxDays = url.searchParams.get('max_days_old');
    if (what) api.searchParams.set('what', what);
    if (where) api.searchParams.set('where', where);
    if (maxDays && /^[0-9]+$/.test(maxDays)) api.searchParams.set('max_days_old', maxDays);

    try {
        const r = await fetch(api.toString(), { headers: { 'Accept': 'application/json' } });
        const body = await r.text();
        return new Response(body, { status: r.status, headers: { ...cors, 'Cache-Control': 'public, max-age=300' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'adzuna_fetch_failed' }), { status: 502, headers: cors });
    }
}
