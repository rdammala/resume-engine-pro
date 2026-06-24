// ============================================================================
// GITHUB RUNNER - Drives the free, ephemeral Ollama pipeline from the browser
// ----------------------------------------------------------------------------
// When the user picks "Ollama" and clicks Generate, we don't need a local
// Ollama server. Instead we trigger the `ollama-resume.yml` GitHub Actions
// workflow (workflow_dispatch). GitHub spins up a fresh, free runner, installs
// and runs Llama 3, tailors the resume, commits the result back to
// generated/<run_id>.json, and the runner self-destructs automatically.
// This module dispatches the run, polls its status, and fetches the result.
//
// AUTH: a GitHub Personal Access Token is stored (obfuscated) in localStorage.
//   - Fine-grained token: this repo only, Actions = Read & write, Contents =
//     Read & write.
//   - Classic token: scopes `repo` + `workflow`.
// Because this is a static site (no backend), the token lives in the browser.
// Use a token scoped to just this one repo so the blast radius is minimal.
// ============================================================================

const GitHubRunner = {
    KEY_TOKEN: 'ghRunnerToken',
    KEY_CONFIG: 'ghRunnerConfig',

    defaults: {
        owner: 'rdammala',
        repo: 'resume-engine-pro',
        workflow: 'ollama-resume.yml',
        ref: 'master',
        model: 'llama3.2'
    },

    // ----- token & config -----
    setToken(t) { StorageManager.set(this.KEY_TOKEN, String(t || '').trim(), true); },
    getToken() { return StorageManager.get(this.KEY_TOKEN, true) || ''; },
    hasToken() { return !!this.getToken(); },
    clearToken() { StorageManager.remove(this.KEY_TOKEN); },

    setConfig(cfg) {
        const clean = {};
        Object.keys(cfg || {}).forEach(k => {
            if (cfg[k] !== undefined && cfg[k] !== null && String(cfg[k]).trim() !== '') clean[k] = String(cfg[k]).trim();
        });
        StorageManager.set(this.KEY_CONFIG, { ...(StorageManager.get(this.KEY_CONFIG) || {}), ...clean });
    },
    getConfig() {
        return { ...this.defaults, ...(StorageManager.get(this.KEY_CONFIG) || {}) };
    },

    // ----- low-level API helper -----
    async api(pathName, opts = {}) {
        const token = this.getToken();
        if (!token) throw new Error('No GitHub token set. Add one in Settings → Ollama.');
        return fetch('https://api.github.com' + pathName, {
            ...opts,
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': 'Bearer ' + token,
                'X-GitHub-Api-Version': '2022-11-28',
                ...(opts.headers || {})
            }
        });
    },

    _hint(status) {
        if (status === 401) return 'Your GitHub token is missing, expired, or invalid.';
        if (status === 403) return 'Token lacks permission (needs Actions + Contents read/write on this repo).';
        if (status === 404) return 'Workflow or repo not found — make sure ollama-resume.yml is pushed and the owner/repo are correct in Settings.';
        if (status === 422) return 'Invalid inputs, or the workflow has no workflow_dispatch trigger on the target branch yet.';
        return '';
    },

    // ----- trigger a run -----
    async dispatch({ resumeData, jobDescription, model }) {
        const cfg = this.getConfig();
        const runId = 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
        const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${encodeURIComponent(cfg.workflow)}/dispatches`, {
            method: 'POST',
            body: JSON.stringify({
                ref: cfg.ref,
                inputs: {
                    run_id: runId,
                    // workflow_dispatch inputs share a ~64KB budget; keep them lean
                    resume_data: String(resumeData || '').slice(0, 28000),
                    job_description: String(jobDescription || '').slice(0, 6000),
                    model: model || cfg.model
                }
            })
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Could not start the cloud job (HTTP ${res.status}). ${this._hint(res.status)} ${txt.slice(0, 200)}`.trim());
        }
        return { runId };
    },

    // ----- locate the run we just triggered (dispatch returns no id) -----
    // GitHub's run-list endpoint is eventually consistent and browsers/CDNs
    // cache it, so we add a cache-buster + no-cache header and poll generously.
    async findRun(runId, attempts = 40) {
        const cfg = this.getConfig();
        for (let i = 0; i < attempts; i++) {
            try {
                const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs?event=workflow_dispatch&per_page=20&t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache', 'If-None-Match': '' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const run = (data.workflow_runs || []).find(r =>
                        (r.name && r.name.includes(runId)) ||
                        (r.display_title && r.display_title.includes(runId))
                    );
                    if (run) return run;
                }
            } catch (_) {
                // Transient network error (offline blip, Tracking Prevention,
                // rate-limit reset) — do NOT abort; the run is likely fine.
            }
            await this._sleep(3000);
        }
        throw new Error('The cloud job was started but is not showing in the run list yet (GitHub can lag ~1–2 min). It is almost certainly still running — open the Actions tab to watch it, then click Generate again to re-attach once it appears.');
    },

    // Convenient link to the repo's Actions tab for this workflow.
    actionsUrl() {
        const cfg = this.getConfig();
        return `https://github.com/${cfg.owner}/${cfg.repo}/actions/workflows/${encodeURIComponent(cfg.workflow)}`;
    },

    // ----- poll until the run completes -----
    async waitForCompletion(runId, onProgress) {
        const cfg = this.getConfig();
        const started = Date.now();
        const run = await this.findRun(runId);
        if (onProgress) onProgress(run.status || 'queued', run, 0);
        let last = run.status;
        for (let i = 0; i < 220; i++) { // ~11 min at 3s
            let r = null;
            try {
                const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs/${run.id}?t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (res.ok) r = await res.json();
            } catch (_) {
                // Transient network error — keep polling, the run is still going.
            }
            if (r) {
                const elapsed = Math.round((Date.now() - started) / 1000);
                const changed = r.status !== last;
                if (changed) last = r.status;
                // Heartbeat: report on every status change AND roughly every ~21s
                // so the UI keeps saying "still working" instead of looking stuck.
                if (onProgress && (changed || i % 7 === 0)) onProgress(r.status, r, elapsed);
                if (r.status === 'completed') {
                    if (r.conclusion === 'success') return r;
                    throw new Error('Cloud job finished as "' + (r.conclusion || 'failure') + '". See the Actions logs.');
                }
            }
            await this._sleep(3000);
        }
        throw new Error('The cloud job is taking longer than usual. It is still running on GitHub — check the Actions tab; your result will be committed there when it finishes.');
    },

    // ----- one-shot background check: is the run done, and if so fetch result? -----
    // Returns { state: 'pending' | 'success' | 'failed', data?, conclusion? }.
    // Never throws — designed for a quiet background reconciler.
    async checkAndFetch(runId) {
        let run;
        try { run = await this.findRun(runId, 4); } catch (_) { return { state: 'pending' }; }
        // findRun returns the run-list item, which already carries status +
        // conclusion — trust it directly instead of making a second call that
        // can blip and falsely report "pending".
        if (run.status === 'completed') {
            if (run.conclusion === 'success') {
                try {
                    const data = await this.fetchResult(runId);
                    return { state: 'success', data };
                } catch (_) {
                    return { state: 'success', data: null };
                }
            }
            return { state: 'failed', conclusion: run.conclusion };
        }
        return { state: 'pending' };
    },

    // ----- read the committed result file -----
    async fetchResult(runId) {
        const cfg = this.getConfig();
        const filePath = `generated/${runId}.json`;
        for (let i = 0; i < 12; i++) {
            try {
                const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${cfg.ref}&t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const b64 = String(data.content || '').replace(/\n/g, '');
                    let txt;
                    try { txt = decodeURIComponent(escape(atob(b64))); }
                    catch (_) { txt = atob(b64); }
                    return JSON.parse(txt);
                }
            } catch (_) {
                // Transient network error — retry below.
            }
            await this._sleep(2500);
        }
        throw new Error('Cloud job finished but the generated file was not found yet. Try again in a moment.');
    },

    // ----- list recent workflow_dispatch runs (for manual recovery) -----
    async listRecentRuns(n = 10) {
        const cfg = this.getConfig();
        try {
            const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs?event=workflow_dispatch&per_page=${n}&t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (res.ok) {
                const d = await res.json();
                return d.workflow_runs || [];
            }
        } catch (_) { /* transient */ }
        return [];
    },

    // ========================================================================
    // PUBLISHING — create a per-application repo in the user's account, push
    // the generated documents + portfolio, and enable GitHub Pages so the
    // portfolio is live. Uses the same PAT (needs repo create + contents +
    // pages write; classic `repo` scope or fine-grained Administration/Contents/
    // Pages = write across the account).
    // ========================================================================

    async getLogin() {
        const res = await this.api('/user');
        if (!res.ok) throw new Error(`Could not read your GitHub account (HTTP ${res.status}). ${this._hint(res.status)}`.trim());
        const u = await res.json();
        if (!u || !u.login) throw new Error('Could not determine your GitHub username from the token.');
        return u.login;
    },

    async ensureRepo(owner, name, description) {
        // Already exists? reuse it.
        const check = await this.api(`/repos/${owner}/${name}`);
        if (check.ok) return { existed: true };
        // Create a fresh public repo with an initial commit (gives us `main`).
        const res = await this.api('/user/repos', {
            method: 'POST',
            body: JSON.stringify({ name, description: String(description || '').slice(0, 350), private: false, auto_init: true })
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Could not create repo "${name}" (HTTP ${res.status}). ${this._hint(res.status)} ${txt.slice(0, 200)}`.trim());
        }
        await this._sleep(1500); // let the auto_init commit settle
        return { existed: false };
    },

    // path must be a repo-root filename (no nested folders) to keep the URL safe.
    async putFile(owner, name, path, contentBase64, message) {
        let sha = null;
        try {
            const getRes = await this.api(`/repos/${owner}/${name}/contents/${path}`);
            if (getRes.ok) { const j = await getRes.json(); sha = j.sha; }
        } catch (_) { /* file does not exist yet */ }
        const body = { message: message || `Add ${path}`, content: contentBase64 };
        if (sha) body.sha = sha;
        const res = await this.api(`/repos/${owner}/${name}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Could not upload ${path} (HTTP ${res.status}). ${this._hint(res.status)} ${txt.slice(0, 160)}`.trim());
        }
        return true;
    },

    async enablePages(owner, name, branch = 'main') {
        try {
            const res = await this.api(`/repos/${owner}/${name}/pages`, {
                method: 'POST',
                body: JSON.stringify({ source: { branch, path: '/' } })
            });
            // 201 created, 409 already enabled — both fine.
            return res.ok || res.status === 409;
        } catch (_) {
            return false;
        }
    },

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
};

window.GitHubRunner = GitHubRunner;
