// ============================================================================
// JOB SEARCH — direct-from-company job discovery (no backend, no scraping).
//
// Pulls live openings straight from companies' own applicant-tracking systems
// via their FREE, public, CORS-friendly JSON APIs:
//   • Greenhouse: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
//   • Ashby:      https://api.ashbyhq.com/posting-api/job-board/{token}
// Nothing is scraped; these are the same public endpoints the companies serve
// their own careers pages from. Results can be filtered by keyword, location,
// and "posted within N days", and saved into the user's Applications tracker
// (which lives in their own GitHub). Also surfaces official PARTNER DIRECTORIES
// for ethical self-research. No contact harvesting, no automated messaging.
// ============================================================================
(function () {
    'use strict';

    var LS_KEY = 'resumeEngineProV1_jobSearchCompanies';
    var PN_KEY = 'resumeEngineProV1_partnerships';
    var _mounted = false;
    var _locSel = null;   // place picked from autocomplete: {city,state,country,label}
    var _acTimer = null;  // debounce timer for city autocomplete

    // Curated starter companies (users can add/remove their own). These use
    // public Greenhouse/Ashby boards; if a token ever changes the fetch just
    // skips that company gracefully.
    var SEED = [
        { name: 'Stripe', ats: 'greenhouse', token: 'stripe' },
        { name: 'Databricks', ats: 'greenhouse', token: 'databricks' },
        { name: 'Coinbase', ats: 'greenhouse', token: 'coinbase' },
        { name: 'Robinhood', ats: 'greenhouse', token: 'robinhood' },
        { name: 'Dropbox', ats: 'greenhouse', token: 'dropbox' },
        { name: 'Airbnb', ats: 'greenhouse', token: 'airbnb' },
        { name: 'GitLab', ats: 'greenhouse', token: 'gitlab' },
        { name: 'Reddit', ats: 'greenhouse', token: 'reddit' },
        { name: 'Cloudflare', ats: 'greenhouse', token: 'cloudflare' },
        { name: 'Discord', ats: 'greenhouse', token: 'discord' },
        { name: 'Figma', ats: 'greenhouse', token: 'figma' },
        { name: 'Lyft', ats: 'greenhouse', token: 'lyft' },
        { name: 'Brex', ats: 'greenhouse', token: 'brex' },
        { name: 'Datadog', ats: 'greenhouse', token: 'datadog' },
        { name: 'Pinterest', ats: 'greenhouse', token: 'pinterest' },
        { name: 'Twitch', ats: 'greenhouse', token: 'twitch' },
        { name: 'OpenAI', ats: 'ashby', token: 'openai' },
        { name: 'Notion', ats: 'ashby', token: 'notion' },
        { name: 'Ramp', ats: 'ashby', token: 'ramp' },
        { name: 'Cohere', ats: 'ashby', token: 'cohere' }
    ];

    // Official partner / marketplace directories — public, sanctioned places to
    // find implementation partners that are frequently hiring. Ethical research
    // only: the user browses these and reaches out on their own.
    var PARTNERS = [
        { name: 'Google Partners Directory', url: 'https://partnersdirectory.withgoogle.com/intl/root/', tag: 'Google Cloud / Ads' },
        { name: 'AWS Partner Finder', url: 'https://partners.amazonaws.com/search/partners/', tag: 'Amazon Web Services' },
        { name: 'Microsoft Marketplace', url: 'https://marketplace.microsoft.com/en-us/', tag: 'Microsoft / Azure' },
        { name: 'Microsoft AppSource', url: 'https://appsource.microsoft.com/', tag: 'Microsoft solution partners' },
        { name: 'Salesforce AppExchange (Consulting)', url: 'https://appexchange.salesforce.com/consulting', tag: 'Salesforce partners' },
        { name: 'ServiceNow Partner Finder', url: 'https://www.servicenow.com/partners/partner-finder.html', tag: 'ServiceNow' },
        { name: 'Snowflake Partner Network', url: 'https://www.snowflake.com/en/data-cloud/partner-network/', tag: 'Data / Snowflake' },
        { name: 'Databricks Partners', url: 'https://www.databricks.com/company/partners', tag: 'Data / AI' },
        { name: 'Oracle Partner Finder', url: 'https://partner-finder.oracle.com/', tag: 'Oracle / OCI' },
        { name: 'IBM Business Partner Directory', url: 'https://www.ibm.com/partnerplus/directory', tag: 'IBM' }
    ];

    // Starter partnership examples (publicly reported — the user should VERIFY at
    // the source link). Users maintain their own list; nothing is asserted as fact.
    var PARTNERSHIPS_SEED = [
        { org: 'Netflix', partner: 'Amazon Web Services (AWS)', area: 'Cloud infrastructure & streaming', source: 'https://aws.amazon.com/solutions/case-studies/netflix/' },
        { org: 'HealthCare.gov (CMS)', partner: 'Accenture Federal Services', area: 'Platform operations', source: 'https://www.accenture.com/us-en/industries/public-service' },
        { org: 'NHS England (UK)', partner: 'Palantir', area: 'Federated Data Platform', source: 'https://www.england.nhs.uk/' }
    ];

    // Giants run their OWN career systems (often Workday) which a browser can't
    // read cross-origin (no CORS). So we deep-link into each company's own search,
    // pre-filled with the user's keyword + location. {kw}/{loc} are filled at click.
    var DIRECT_PORTALS = [
        { name: 'Microsoft', tmpl: 'https://jobs.careers.microsoft.com/global/en/search?q={kw}&lc={loc}' },
        { name: 'Amazon', tmpl: 'https://www.amazon.jobs/en/search?base_query={kw}&loc_query={loc}' },
        { name: 'Google', tmpl: 'https://www.google.com/about/careers/applications/jobs/results/?q={kw}&location={loc}' },
        { name: 'Apple', tmpl: 'https://jobs.apple.com/en-us/search?search={kw}&location={loc}' },
        { name: 'Meta', tmpl: 'https://www.metacareers.com/jobs?q={kw}' },
        { name: 'NVIDIA', tmpl: 'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite?q={kw}' },
        { name: 'Netflix', tmpl: 'https://explore.jobs.netflix.net/careers?query={kw}&location={loc}' },
        { name: 'Salesforce', tmpl: 'https://careers.salesforce.com/en/jobs/?search={kw}' },
        { name: 'Oracle', tmpl: 'https://careers.oracle.com/jobs/#en/sites/jobsearch/requisitions?keyword={kw}' },
        { name: 'IBM', tmpl: 'https://www.ibm.com/careers/search?q={kw}' },
        { name: 'Deloitte', tmpl: 'https://apply.deloitte.com/careers/SearchJobs?searchword={kw}' },
        { name: 'Accenture', tmpl: 'https://www.accenture.com/us-en/careers/jobsearch?jk={kw}' }
    ];

    // ---- helpers ----
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function loadCompanies() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length) return arr;
            }
        } catch (e) { /* fall through to seed */ }
        return SEED.slice();
    }

    function saveCompanies(list) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    }

    function daysAgo(n) { return Date.now() - n * 24 * 60 * 60 * 1000; }

    function fmtDate(ms) {
        if (!ms) return '';
        try { return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch (e) { return ''; }
    }

    function ageLabel(ms) {
        if (!ms) return '';
        var d = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
        if (d <= 0) return 'today';
        if (d === 1) return '1 day ago';
        if (d < 30) return d + ' days ago';
        if (d < 60) return '1 month ago';
        return Math.floor(d / 30) + ' months ago';
    }

    // ---- fetchers (public ATS JSON APIs; CORS-enabled) ----
    function fetchGreenhouse(company) {
        var url = 'https://boards-api.greenhouse.io/v1/boards/' + encodeURIComponent(company.token) + '/jobs?content=false';
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (d) {
            return (d.jobs || []).map(function (j) {
                return {
                    company: company.name,
                    title: j.title || '',
                    location: (j.location && j.location.name) || '',
                    url: j.absolute_url || '',
                    postedMs: j.updated_at ? Date.parse(j.updated_at) : (j.first_published ? Date.parse(j.first_published) : 0),
                    source: 'Greenhouse'
                };
            });
        });
    }

    function fetchAshby(company) {
        var url = 'https://api.ashbyhq.com/posting-api/job-board/' + encodeURIComponent(company.token);
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (d) {
            return (d.jobs || []).map(function (j) {
                var loc = j.location || '';
                if (j.isRemote && loc.toLowerCase().indexOf('remote') === -1) loc = loc ? (loc + ' · Remote') : 'Remote';
                return {
                    company: company.name,
                    title: j.title || '',
                    location: loc,
                    url: j.jobUrl || j.applyUrl || '',
                    postedMs: j.publishedAt ? Date.parse(j.publishedAt) : 0,
                    source: 'Ashby'
                };
            });
        });
    }

    function fetchCompany(company) {
        var p = company.ats === 'ashby' ? fetchAshby(company) : fetchGreenhouse(company);
        return p.then(function (jobs) {
            return { ok: true, company: company, jobs: jobs };
        }).catch(function (err) {
            return { ok: false, company: company, error: (err && err.message) || 'failed', jobs: [] };
        });
    }

    // The Big-tech (Workday) feed is fetched server-side by a GitHub Action and
    // committed to generated/external-jobs.json, so the browser reads it
    // same-origin (no CORS). Giants like NVIDIA/Salesforce/Adobe live here.
    function fetchScheduled() {
        return fetch('data/external-jobs.json?cb=' + Date.now())
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (d) { return { ok: true, company: { name: 'Big-tech feed' }, jobs: (d.jobs || []) }; })
            .catch(function (err) { return { ok: false, company: { name: 'Big-tech feed' }, error: (err && err.message) || 'feed not built yet', jobs: [] }; });
    }

    // The Muse public API is free, keyless and CORS-friendly. No server-side
    // keyword search, so we pull the newest few pages and let the shared
    // keyword/location/date filters narrow them client-side.
    function fetchMuse() {
        var pages = [1, 2, 3, 4, 5];
        var reqs = pages.map(function (p) {
            return fetch('https://www.themuse.com/api/public/jobs?page=' + p + '&descending=true')
                .then(function (r) { return r.ok ? r.json() : { results: [] }; })
                .then(function (d) { return d.results || []; })
                .catch(function () { return []; });
        });
        return Promise.all(reqs).then(function (arrs) {
            var jobs = [];
            arrs.forEach(function (arr) {
                arr.forEach(function (j) {
                    jobs.push({
                        company: (j.company && j.company.name) || 'The Muse',
                        title: j.name || '',
                        location: (j.locations || []).map(function (l) { return l.name; }).join(', '),
                        url: (j.refs && j.refs.landing_page) || '',
                        postedMs: j.publication_date ? Date.parse(j.publication_date) : 0,
                        source: 'The Muse'
                    });
                });
            });
            return { ok: true, company: { name: 'The Muse (global)' }, jobs: jobs };
        }).catch(function (err) {
            return { ok: false, company: { name: 'The Muse (global)' }, error: (err && err.message) || 'failed', jobs: [] };
        });
    }

    // Adzuna via the same-origin Cloudflare Worker proxy. The proxy already did
    // the keyword/location/recency matching server-side, so these results skip
    // the client-side filters (see runSearch).
    function fetchAdzuna(what, where, country, days) {
        var qs = 'country=' + encodeURIComponent(country || 'us');
        if (what) qs += '&what=' + encodeURIComponent(what);
        if (where) qs += '&where=' + encodeURIComponent(where);
        if (days) qs += '&max_days_old=' + encodeURIComponent(days);
        return fetch('/api/adzuna?' + qs)
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (d) {
                var jobs = (d.results || []).map(function (j) {
                    return {
                        company: (j.company && j.company.display_name) || '',
                        title: j.title || '',
                        location: (j.location && j.location.display_name) || '',
                        url: j.redirect_url || '',
                        postedMs: j.created ? Date.parse(j.created) : 0,
                        source: 'Adzuna'
                    };
                });
                return { ok: true, company: { name: 'Adzuna' }, jobs: jobs };
            }).catch(function (err) { return { ok: false, company: { name: 'Adzuna' }, error: (err && err.message) || 'not available here', jobs: [] }; });
    }

    // ---- rendering ----
    function companyChips() {
        var list = loadCompanies();
        return list.map(function (c, i) {
            return '<button type="button" class="js-chip js-selected" data-idx="' + i + '">'
                + esc(c.name) + ' <span class="js-chip-ats">' + esc(c.ats) + '</span>'
                + ' <span class="js-chip-x" data-remove="' + i + '" title="Remove">&times;</span></button>';
        }).join('');
    }

    // Special chip for the daily Big-tech (Workday) feed committed by a GitHub Action.
    function scheduledChip() {
        return '<button type="button" class="js-chip js-selected js-chip-sched" data-sched="1" title="NVIDIA, Salesforce, Adobe, Workday — refreshed daily by a GitHub Action (these run on Workday, which browsers can’t read live)">🗓️ Big-tech feed <span class="js-chip-ats">Workday</span></button>';
    }

    // The Muse = free, keyless, GLOBAL board with real companies across many
    // countries AND lots of non-tech roles (healthcare, finance, trades).
    function museChip() {
        return '<button type="button" class="js-chip js-chip-muse" data-muse="1" title="The Muse — a free global board: many countries + non-tech roles (nursing, finance, trades). Broader reach, but listings can be OLDER — turn it on and set the date to Any time. Off by default.">🌍 Global / non-tech <span class="js-chip-ats">The Muse · optional</span></button>';
    }
    // Adzuna = LIVE worldwide keyword+location+country search via the Cloudflare
    // Worker proxy (/api/adzuna), which injects the API key server-side. Works on
    // the deployed site; degrades gracefully anywhere the proxy is not present.
    function adzunaChip() {
        return '<button type="button" class="js-chip js-selected js-chip-adzuna" data-adzuna="1" title="Adzuna — live worldwide search (keyword + location + country) via a secure server-side proxy. Great for India, Australia, the UK and more. Fires when you enter a keyword or location.">🌐 Adzuna (live global) <span class="js-chip-ats">18 countries</span></button>';
    }

    function adzunaCountry(name) {
        var m = { 'united states':'us','united states of america':'us','usa':'us','united kingdom':'gb','uk':'gb','england':'gb','scotland':'gb','india':'in','australia':'au','canada':'ca','germany':'de','france':'fr','spain':'es','italy':'it','netherlands':'nl','new zealand':'nz','singapore':'sg','south africa':'za','brazil':'br','mexico':'mx','poland':'pl','austria':'at','switzerland':'ch' };
        return m[String(name || '').toLowerCase()] || '';
    }
    function partnerCards() {
        return PARTNERS.map(function (p) {
            return '<a class="js-partner" href="' + esc(p.url) + '" target="_blank" rel="noopener">'
                + '<span class="js-partner-name">' + esc(p.name) + '</span>'
                + '<span class="js-partner-tag">' + esc(p.tag) + '</span>'
                + '<span class="js-partner-go">Open directory →</span></a>';
        }).join('');
    }

    function directPortalCards() {
        return DIRECT_PORTALS.map(function (p, i) {
            return '<button type="button" class="js-portal-btn" data-portal="' + i + '">' + esc(p.name) + ' ↗</button>';
        }).join('');
    }

    function shellHtml() {
        return ''
        + '<h2>🔎 Job Search — straight from the source</h2>'
        + '<p class="js-lead">Skip the aggregator noise. This pulls <strong>live openings directly from companies\u2019 own career systems</strong> '
        + '(their public Greenhouse / Ashby feeds, plus a daily <strong>Big-tech Workday feed</strong>) so you see real, fresh roles — then save the ones you like into your tracker. '
        + 'No scraping, no logins, nothing leaves your browser.</p>'

        + '<div class="js-controls">'
        + '  <div class="js-row">'
        + '    <input id="jsKeyword" class="js-input" type="text" placeholder="Keyword — e.g. SRE, reliability, support manager" />'
        + '    <span class="js-ac-wrap"><input id="jsLocation" class="js-input" type="text" autocomplete="off" placeholder="Location — type a city (auto-suggests, matches vicinity)" /><div id="jsAcList" class="js-ac-list" style="display:none"></div></span>'
        + '    <select id="jsPosted" class="js-input js-input-sm">'
        + '      <option value="0">Any time</option>'
        + '      <option value="3">Last 3 days</option>'
        + '      <option value="7" selected>Last 7 days</option>'
        + '      <option value="30">Last 30 days</option>'
        + '    </select>'
        + '    <select id="jsRadius" class="js-input js-input-sm" title="How wide to match the location you pick">'
        + '      <option value="nearby" selected>📍 City + nearby</option>'
        + '      <option value="exact">🎯 Exact city</option>'
        + '      <option value="country">🌍 Whole country</option>'
        + '    </select>'
        + '    <button id="jsSearchBtn" class="btn btn-primary">Search jobs</button>'
        + '  </div>'
        + '  <div class="js-sources">📡 Live results come from <strong>Greenhouse</strong>, <strong>Ashby</strong> &amp; the daily <strong>Workday</strong> feed — fresh, direct from each company — plus <strong>🌐 Adzuna</strong> for live worldwide search across 18 countries (great for India, Australia, the UK). Turn on the optional <strong>🌍 Global / non-tech</strong> chip (The Muse) for even more countries and non-tech roles (nursing, finance, trades), though those listings can be older — pair it with <strong>Any time</strong>. This is <strong>not</strong> the whole web; for any other employer, use the <strong>Big-tech portals</strong> &amp; <strong>partner directories</strong> below.</div>'
        + '  <div class="js-companies-head">Companies in the live feed <span class="js-muted">— we search every highlighted one <em>plus</em> the 🗓️ Big-tech feed. Click to toggle, or add your own by board token.</span></div>'
        + '  <div id="jsChips" class="js-chips">' + scheduledChip() + adzunaChip() + museChip() + companyChips() + '</div>'
        + '  <div class="js-row js-add">'
        + '    <input id="jsAddName" class="js-input" type="text" placeholder="Add company (display name)" />'
        + '    <select id="jsAddAts" class="js-input js-input-sm"><option value="greenhouse">Greenhouse</option><option value="ashby">Ashby</option></select>'
        + '    <input id="jsAddToken" class="js-input js-input-sm" type="text" placeholder="board token (e.g. stripe)" />'
        + '    <button id="jsAddBtn" class="btn btn-secondary">+ Add</button>'
        + '  </div>'
        + '  <p class="js-hint">� <strong>City + nearby</strong> matches the whole state/region — e.g. <em>Bellevue, WA</em> also surfaces <em>Seattle</em> &amp; <em>Redmond</em>, so you don’t miss vicinity roles. Switch to <strong>Exact city</strong> to narrow, or <strong>Whole country</strong> to widen.</p>'
        + '  <p class="js-hint">�💡 The <strong>board token</strong> is the company id in its careers URL — e.g. <code>boards.greenhouse.io/<b>stripe</b></code> or <code>jobs.ashbyhq.com/<b>openai</b></code>.</p>'
        + '</div>'

        + '<div id="jsStatus" class="js-status"></div>'
        + '<div id="jsResults" class="js-results"></div>'

        + '<div class="js-direct-wrap">'
        + '  <h3>🏢 Big-tech &amp; enterprise portals — search directly</h3>'
        + '  <p class="js-lead">Giants like Microsoft, Amazon and Google run their own career systems (often Workday), which a browser can’t read directly. These buttons open each company’s <strong>own search, pre-filled with your keyword &amp; location above</strong> — one click, their site, no aggregator.</p>'
        + '  <div class="js-portals">' + directPortalCards() + '</div>'
        + '</div>'

        + '<div class="js-partners-wrap">'
        + '  <h3>🤝 Partner directories — hidden-market research</h3>'
        + '  <p class="js-lead">Implementation partners of the big clouds are almost always hiring. These are <strong>official, public partner directories</strong> — '
        + 'browse companies in your target tech, research them, and reach out respectfully on your own. (We never auto-contact anyone.)</p>'
        + '  <div class="js-partners">' + partnerCards() + '</div>'
        + '  <div class="js-pn">'
        + '    <h3>🔗 Who works with whom — partnership tracker</h3>'
        + '    <p class="js-lead">Like a “board token” for the hidden market: track which organizations publicly work with which implementation partners, so you know where the downstream hiring is (e.g. an agency and the vendor that runs its tech). <strong>User-maintained — always verify at the source link.</strong></p>'
        + '    <input id="jsPnQuery" class="js-input" type="text" placeholder="Filter — e.g. Netflix, Accenture, payments" />'
        + '    <div id="jsPnList" class="js-pn-list">' + partnershipRows() + '</div>'
        + '    <div class="js-row js-add">'
        + '      <input id="jsPnOrg" class="js-input" type="text" placeholder="Organization (e.g. Netflix)" />'
        + '      <input id="jsPnPartner" class="js-input" type="text" placeholder="Works with (e.g. AWS)" />'
        + '      <input id="jsPnArea" class="js-input js-input-sm" type="text" placeholder="Area (e.g. payments)" />'
        + '      <input id="jsPnSource" class="js-input" type="text" placeholder="Source URL (public proof)" />'
        + '      <button id="jsPnAddBtn" class="btn btn-secondary">+ Add</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';
    }

    function resultCard(job, id) {
        var loc = job.location ? '<span class="js-jc-loc">📍 ' + esc(job.location) + '</span>' : '';
        var age = job.postedMs ? '<span class="js-jc-age" title="' + esc(fmtDate(job.postedMs)) + '">🕒 ' + esc(ageLabel(job.postedMs)) + '</span>' : '';
        return '<div class="js-jobcard">'
            + '<div class="js-jc-main">'
            + '  <div class="js-jc-title">' + esc(job.title) + '</div>'
            + '  <div class="js-jc-meta"><span class="js-jc-co">' + esc(job.company) + '</span>' + loc + age
            + '    <span class="js-jc-src">' + esc(job.source) + '</span></div>'
            + '</div>'
            + '<div class="js-jc-actions">'
            + '  <a class="btn btn-secondary btn-sm" href="' + esc(job.url) + '" target="_blank" rel="noopener">Open</a>'
            + '  <button class="btn btn-primary btn-sm" data-save="' + id + '">＋ Save</button>'
            + '</div>'
            + '</div>';
    }

    // module-scoped last results (for save-by-index)
    var _last = [];

    function runSearch() {
        var kw = (document.getElementById('jsKeyword').value || '').trim().toLowerCase();
        var locq = (document.getElementById('jsLocation').value || '').trim().toLowerCase();
        var days = parseInt(document.getElementById('jsPosted').value, 10) || 0;
        var cutoff = days ? daysAgo(days) : 0;

        var all = loadCompanies();
        var chips = document.querySelectorAll('#jsChips .js-chip');
        var selected = [];
        chips.forEach(function (ch) {
            if (ch.classList.contains('js-selected')) {
                var idx = parseInt(ch.getAttribute('data-idx'), 10);
                if (all[idx]) selected.push(all[idx]);
            }
        });
        if (!selected.length && !document.querySelector('#jsChips .js-chip-sched.js-selected') && !document.querySelector('#jsChips .js-chip-muse.js-selected') && !document.querySelector('#jsChips .js-chip-adzuna.js-selected')) selected = all.slice();

        var schedOn = !!document.querySelector('#jsChips .js-chip-sched.js-selected');
        var museOn = !!document.querySelector('#jsChips .js-chip-muse.js-selected');
        var adzunaOn = !!document.querySelector('#jsChips .js-chip-adzuna.js-selected');
        var tasks = selected.map(fetchCompany);
        if (schedOn) tasks.push(fetchScheduled());
        if (museOn) tasks.push(fetchMuse());
        if (adzunaOn && (kw || locq)) {
            var adzCountry = adzunaCountry(_locSel && _locSel.country) || adzunaCountry(locq) || 'us';
            var adzWhere = (_locSel && _locSel.city) || locq || '';
            tasks.push(fetchAdzuna(kw, adzWhere, adzCountry, days));
        }

        var statusEl = document.getElementById('jsStatus');
        var resultsEl = document.getElementById('jsResults');
        statusEl.innerHTML = '⏳ Searching ' + tasks.length + ' sources…';
        resultsEl.innerHTML = '';

        Promise.all(tasks).then(function (settled) {
            var jobs = [];
            var failed = [];
            settled.forEach(function (res) {
                if (!res.ok) { failed.push(res.company.name); return; }
                res.jobs.forEach(function (j) { jobs.push(j); });
            });

            // Vicinity breadth: how wide to match the place picked from autocomplete.
            // nearby = city + state/region, exact = city only, country = whole country.
            // Free-typed text is always a plain substring match.
            var radiusEl = document.getElementById('jsRadius');
            var radius = radiusEl ? radiusEl.value : 'nearby';
            var locTerms = [];
            if (_locSel && _locSel.label && _locSel.label.toLowerCase() === locq) {
                if (radius === 'exact') {
                    if (_locSel.city) locTerms.push(_locSel.city.toLowerCase());
                } else if (radius === 'country') {
                    if (_locSel.country) locTerms.push(_locSel.country.toLowerCase());
                } else {
                    if (_locSel.city) locTerms.push(_locSel.city.toLowerCase());
                    if (_locSel.state) locTerms.push(_locSel.state.toLowerCase());
                }
            } else if (locq) {
                locTerms = [locq];
            }

            // filters
            var filtered = jobs.filter(function (j) {
                if (j.source === 'Adzuna') return true;   // already matched server-side (what/where/recency)
                if (cutoff && (!j.postedMs || j.postedMs < cutoff)) return false;
                if (kw && (j.title || '').toLowerCase().indexOf(kw) === -1) return false;
                if (locTerms.length) {
                    var jl = (j.location || '').toLowerCase();
                    var hit = locTerms.some(function (term) { return jl.indexOf(term) !== -1; });
                    if (!hit) return false;
                }
                return true;
            });
            // newest first
            filtered.sort(function (a, b) { return (b.postedMs || 0) - (a.postedMs || 0); });

            _last = filtered;

            var reached = settled.filter(function (r) { return r.ok; }).length;
            var msg = '<strong>' + filtered.length + '</strong> role' + (filtered.length === 1 ? '' : 's')
                + ' from ' + reached + ' sources'
                + (kw || locq || days ? ' (filtered)' : '')
                + ' · <span class="js-muted">via Greenhouse · Ashby' + (schedOn ? ' · Workday' : '') + (adzunaOn ? ' · Adzuna' : '') + (museOn ? ' · The Muse' : '') + ' — for other employers use the portals below</span>';
            if (failed.length) msg += ' · <span class="js-muted">couldn\u2019t reach: ' + esc(failed.join(', ')) + '</span>';
            statusEl.innerHTML = msg;

            if (!filtered.length) {
                var pre = jobs.length;
                var tip = pre
                    ? 'Those sources returned <strong>' + pre + '</strong> roles, but none match your filters. The keyword matches the job <em>title</em> — so a narrow term like “Azure” can zero out companies that don’t use that word. Try a <strong>broader keyword</strong> (e.g. “engineer”, “nurse”, “sales”) or clear it; widen the date to <strong>Any time</strong>; or set the location to <strong>Whole country</strong>.'
                    : 'No roles came back from these sources. Try selecting more companies, adding your own by board token, or the Big-tech portals below.';
                resultsEl.innerHTML = '<div class="js-empty">' + tip + '</div>';
                return;
            }
            resultsEl.innerHTML = filtered.map(function (j, i) { return resultCard(j, i); }).join('');
        }).catch(function (err) {
            statusEl.innerHTML = '⚠️ Search failed: ' + esc((err && err.message) || 'unknown error');
        });
    }

    function saveJob(idx) {
        var job = _last[idx];
        if (!job) return;
        if (!window.JobTrackerManager) { toast('Tracker not available', 'error'); return; }
        var today = new Date().toISOString().slice(0, 10);
        JobTrackerManager.addApplication({
            portfolio: '',
            date: today,
            role: job.title,
            company: job.company,
            link: job.url,
            repo: '',
            status: 'Interested',
            comments: 'Found via Job Search · ' + (job.location || 'location n/a') + ' · source: ' + job.source
        });
        toast('Saved “' + job.title + '” to your Applications tracker', 'success');
    }

    function toast(msg, kind) {
        if (typeof window.showToast === 'function') { window.showToast(msg, kind || 'info'); return; }
        if (typeof window.showNotification === 'function') { window.showNotification(msg, kind || 'info'); return; }
        console.log('[JobSearch] ' + msg);
    }

    function addCompany() {
        var name = (document.getElementById('jsAddName').value || '').trim();
        var ats = document.getElementById('jsAddAts').value;
        var token = (document.getElementById('jsAddToken').value || '').trim();
        if (!name || !token) { toast('Enter a company name and board token', 'error'); return; }
        var list = loadCompanies();
        list.push({ name: name, ats: ats, token: token });
        saveCompanies(list);
        document.getElementById('jsChips').innerHTML = companyChips();
        document.getElementById('jsAddName').value = '';
        document.getElementById('jsAddToken').value = '';
        toast('Added ' + name, 'success');
    }

    // ---- location autocomplete (Photon — free, CORS, no key) + vicinity ----
    function acSearch(q) {
        var listEl = document.getElementById('jsAcList');
        if (!listEl) return;
        if (!q || q.length < 2) { listEl.style.display = 'none'; listEl.innerHTML = ''; return; }
        fetch('https://photon.komoot.io/api/?limit=6&lang=en&q=' + encodeURIComponent(q))
            .then(function (r) { return r.ok ? r.json() : { features: [] }; })
            .then(function (d) {
                var bad = { house: 1, street: 1 };
                var seen = {};
                var items = [];
                (d.features || []).forEach(function (f) {
                    var p = f.properties || {};
                    if (p.type && bad[p.type]) return;
                    var parts = [p.name, p.state, p.country].filter(Boolean);
                    var label = parts.join(', ');
                    if (!label || seen[label]) return;
                    seen[label] = 1;
                    items.push({ label: label, city: p.name || '', state: p.state || '', country: p.country || '' });
                });
                if (!items.length) { listEl.style.display = 'none'; listEl.innerHTML = ''; return; }
                listEl.innerHTML = items.map(function (it, i) {
                    return '<div class="js-ac-item" data-ac="' + i + '">📍 ' + esc(it.label) + '</div>';
                }).join('');
                listEl._items = items;
                listEl.style.display = 'block';
            }).catch(function () { listEl.style.display = 'none'; });
    }

    function pickPlace(i) {
        var listEl = document.getElementById('jsAcList');
        var input = document.getElementById('jsLocation');
        if (!listEl || !listEl._items || !input) return;
        var it = listEl._items[i];
        if (!it) return;
        input.value = it.label;
        _locSel = { city: it.city, state: it.state, country: it.country, label: it.label };
        listEl.style.display = 'none';
    }

    // open a giant's own career search, pre-filled with the current keyword/location
    function openDirectPortal(i) {
        var p = DIRECT_PORTALS[i];
        if (!p) return;
        var kwEl = document.getElementById('jsKeyword');
        var locEl = document.getElementById('jsLocation');
        var kw = (kwEl && kwEl.value ? kwEl.value : '').trim();
        var loc = (locEl && locEl.value ? locEl.value : '').trim();
        var url = p.tmpl.replace('{kw}', encodeURIComponent(kw)).replace('{loc}', encodeURIComponent(loc));
        window.open(url, '_blank', 'noopener');
    }

    // ---- partnership tracker (who works with whom) ----
    function loadPartnerships() {
        try {
            var raw = localStorage.getItem(PN_KEY);
            if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; }
        } catch (e) { /* fall through */ }
        return PARTNERSHIPS_SEED.slice();
    }
    function savePartnerships(list) {
        try { localStorage.setItem(PN_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    }
    function partnershipRows() {
        var list = loadPartnerships();
        var qEl = document.getElementById('jsPnQuery');
        var q = (qEl && qEl.value ? qEl.value : '').trim().toLowerCase();
        var rows = list.map(function (p, i) { return { p: p, i: i }; });
        if (q) rows = rows.filter(function (r) {
            return (r.p.org + ' ' + r.p.partner + ' ' + (r.p.area || '')).toLowerCase().indexOf(q) !== -1;
        });
        if (!rows.length) return '<div class="js-empty">No partnerships tracked yet. Add one below — an organization and the vendor it publicly works with, plus a source link.</div>';
        return '<table class="js-pn-table"><tr><th>Organization</th><th>Works with</th><th>Area</th><th></th></tr>'
            + rows.map(function (r) {
                var src = r.p.source ? '<a href="' + esc(r.p.source) + '" target="_blank" rel="noopener">source ↗</a>' : '';
                return '<tr><td>' + esc(r.p.org) + '</td><td><strong>' + esc(r.p.partner) + '</strong></td><td>' + esc(r.p.area || '') + '</td>'
                    + '<td>' + src + ' <span class="js-pn-x" data-pnremove="' + r.i + '" title="Remove">×</span></td></tr>';
            }).join('') + '</table>';
    }
    function addPartnership() {
        function v(id) { var el = document.getElementById(id); return (el && el.value ? el.value : '').trim(); }
        var org = v('jsPnOrg'), partner = v('jsPnPartner'), area = v('jsPnArea'), source = v('jsPnSource');
        if (!org || !partner) { toast('Enter at least the organization and the partner', 'error'); return; }
        var list = loadPartnerships();
        list.push({ org: org, partner: partner, area: area, source: source });
        savePartnerships(list);
        document.getElementById('jsPnList').innerHTML = partnershipRows();
        ['jsPnOrg', 'jsPnPartner', 'jsPnArea', 'jsPnSource'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
        toast('Partnership added', 'success');
    }

    function wire(root) {
        root.addEventListener('click', function (e) {
            var t = e.target;
            // hide the autocomplete dropdown when clicking outside it
            var acList = document.getElementById('jsAcList');
            if (acList && t.id !== 'jsLocation' && !(t.className && String(t.className).indexOf('js-ac') !== -1)) {
                acList.style.display = 'none';
            }
            // pick an autocomplete suggestion
            var ac = t.getAttribute && t.getAttribute('data-ac');
            if (ac !== null && ac !== undefined && t.classList.contains('js-ac-item')) {
                pickPlace(parseInt(ac, 10)); return;
            }
            // remove a tracked partnership
            var pnr = t.getAttribute && t.getAttribute('data-pnremove');
            if (pnr !== null && pnr !== undefined && t.classList.contains('js-pn-x')) {
                var pl = loadPartnerships(); pl.splice(parseInt(pnr, 10), 1); savePartnerships(pl);
                document.getElementById('jsPnList').innerHTML = partnershipRows(); return;
            }
            // remove-company (x on chip)
            var rm = t.getAttribute && t.getAttribute('data-remove');
            if (rm !== null && rm !== undefined && t.classList.contains('js-chip-x')) {
                e.stopPropagation();
                var list = loadCompanies();
                list.splice(parseInt(rm, 10), 1);
                saveCompanies(list);
                document.getElementById('jsChips').innerHTML = companyChips();
                return;
            }
            // toggle chip
            var chip = t.closest && t.closest('.js-chip');
            if (chip && !t.classList.contains('js-chip-x')) {
                chip.classList.toggle('js-selected');
                return;
            }
            // save job
            var sv = t.getAttribute && t.getAttribute('data-save');
            if (sv !== null && sv !== undefined && sv !== '') {
                saveJob(parseInt(sv, 10));
                t.textContent = '✓ Saved';
                t.setAttribute('disabled', 'disabled');
                return;
            }
            if (t.id === 'jsSearchBtn') { runSearch(); return; }
            if (t.id === 'jsAddBtn') { addCompany(); return; }
            if (t.id === 'jsPnAddBtn') { addPartnership(); return; }
            // open a big-tech / enterprise portal pre-filled
            var dp = t.getAttribute && t.getAttribute('data-portal');
            if (dp !== null && dp !== undefined && t.classList.contains('js-portal-btn')) { openDirectPortal(parseInt(dp, 10)); return; }
        });
        root.addEventListener('input', function (e) {
            if (e.target.id === 'jsLocation') {
                _locSel = null; // manual edit invalidates a prior pick
                var q = e.target.value || '';
                if (_acTimer) clearTimeout(_acTimer);
                _acTimer = setTimeout(function () { acSearch(q.trim()); }, 220);
            } else if (e.target.id === 'jsPnQuery') {
                var el = document.getElementById('jsPnList');
                if (el) el.innerHTML = partnershipRows();
            }
        });
        root.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && (e.target.id === 'jsKeyword' || e.target.id === 'jsLocation')) {
                e.preventDefault(); runSearch();
            }
            if (e.key === 'Enter' && e.target.id === 'jsAddToken') { e.preventDefault(); addCompany(); }
        });
    }

    function init() {
        var root = document.getElementById('jobSearchRoot');
        if (!root) return;
        if (_mounted) return;
        _mounted = true;
        root.innerHTML = shellHtml();
        wire(root);
    }

    window.JobSearch = { init: init };
})();
