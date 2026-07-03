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
    var _mounted = false;

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

    // ---- rendering ----
    function companyChips() {
        var list = loadCompanies();
        return list.map(function (c, i) {
            return '<button type="button" class="js-chip js-selected" data-idx="' + i + '">'
                + esc(c.name) + ' <span class="js-chip-ats">' + esc(c.ats) + '</span>'
                + ' <span class="js-chip-x" data-remove="' + i + '" title="Remove">&times;</span></button>';
        }).join('');
    }

    function partnerCards() {
        return PARTNERS.map(function (p) {
            return '<a class="js-partner" href="' + esc(p.url) + '" target="_blank" rel="noopener">'
                + '<span class="js-partner-name">' + esc(p.name) + '</span>'
                + '<span class="js-partner-tag">' + esc(p.tag) + '</span>'
                + '<span class="js-partner-go">Open directory →</span></a>';
        }).join('');
    }

    function shellHtml() {
        return ''
        + '<h2>🔎 Job Search — straight from the source</h2>'
        + '<p class="js-lead">Skip the aggregator noise. This pulls <strong>live openings directly from companies\u2019 own career systems</strong> '
        + '(their public Greenhouse / Ashby feeds) so you see real, fresh roles — then save the ones you like into your tracker. '
        + 'No scraping, no logins, nothing leaves your browser.</p>'

        + '<div class="js-controls">'
        + '  <div class="js-row">'
        + '    <input id="jsKeyword" class="js-input" type="text" placeholder="Keyword — e.g. SRE, reliability, support manager" />'
        + '    <input id="jsLocation" class="js-input" type="text" placeholder="Location — e.g. remote, London, India" />'
        + '    <select id="jsPosted" class="js-input js-input-sm">'
        + '      <option value="0">Any time</option>'
        + '      <option value="3">Last 3 days</option>'
        + '      <option value="7" selected>Last 7 days</option>'
        + '      <option value="30">Last 30 days</option>'
        + '    </select>'
        + '    <button id="jsSearchBtn" class="btn btn-primary">Search jobs</button>'
        + '  </div>'
        + '  <div class="js-companies-head">Companies to search <span class="js-muted">(click to toggle; searches the highlighted ones)</span></div>'
        + '  <div id="jsChips" class="js-chips">' + companyChips() + '</div>'
        + '  <div class="js-row js-add">'
        + '    <input id="jsAddName" class="js-input" type="text" placeholder="Add company (display name)" />'
        + '    <select id="jsAddAts" class="js-input js-input-sm"><option value="greenhouse">Greenhouse</option><option value="ashby">Ashby</option></select>'
        + '    <input id="jsAddToken" class="js-input js-input-sm" type="text" placeholder="board token (e.g. stripe)" />'
        + '    <button id="jsAddBtn" class="btn btn-secondary">+ Add</button>'
        + '  </div>'
        + '  <p class="js-hint">💡 The <strong>board token</strong> is the company id in its careers URL — e.g. <code>boards.greenhouse.io/<b>stripe</b></code> or <code>jobs.ashbyhq.com/<b>openai</b></code>.</p>'
        + '</div>'

        + '<div id="jsStatus" class="js-status"></div>'
        + '<div id="jsResults" class="js-results"></div>'

        + '<div class="js-partners-wrap">'
        + '  <h3>🤝 Partner directories — hidden-market research</h3>'
        + '  <p class="js-lead">Implementation partners of the big clouds are almost always hiring. These are <strong>official, public partner directories</strong> — '
        + 'browse companies in your target tech, research them, and reach out respectfully on your own. (We never auto-contact anyone.)</p>'
        + '  <div class="js-partners">' + partnerCards() + '</div>'
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
        if (!selected.length) selected = all.slice();

        var statusEl = document.getElementById('jsStatus');
        var resultsEl = document.getElementById('jsResults');
        statusEl.innerHTML = '⏳ Searching ' + selected.length + ' companies…';
        resultsEl.innerHTML = '';

        Promise.all(selected.map(fetchCompany)).then(function (settled) {
            var jobs = [];
            var failed = [];
            settled.forEach(function (res) {
                if (!res.ok) { failed.push(res.company.name); return; }
                res.jobs.forEach(function (j) { jobs.push(j); });
            });

            // filters
            var filtered = jobs.filter(function (j) {
                if (cutoff && (!j.postedMs || j.postedMs < cutoff)) return false;
                if (kw && (j.title || '').toLowerCase().indexOf(kw) === -1) return false;
                if (locq && (j.location || '').toLowerCase().indexOf(locq) === -1) return false;
                return true;
            });
            // newest first
            filtered.sort(function (a, b) { return (b.postedMs || 0) - (a.postedMs || 0); });

            _last = filtered;

            var msg = '<strong>' + filtered.length + '</strong> role' + (filtered.length === 1 ? '' : 's')
                + ' from ' + (selected.length - failed.length) + ' companies'
                + (kw || locq || days ? ' (filtered)' : '');
            if (failed.length) msg += ' · <span class="js-muted">couldn\u2019t reach: ' + esc(failed.join(', ')) + '</span>';
            statusEl.innerHTML = msg;

            if (!filtered.length) {
                resultsEl.innerHTML = '<div class="js-empty">No roles matched. Try widening the date range, clearing the keyword/location, or selecting more companies.</div>';
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

    function wire(root) {
        root.addEventListener('click', function (e) {
            var t = e.target;
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
