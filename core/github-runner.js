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
    async findRun(runId, attempts = 20) {
        const cfg = this.getConfig();
        for (let i = 0; i < attempts; i++) {
            const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs?event=workflow_dispatch&per_page=30`);
            if (res.ok) {
                const data = await res.json();
                const run = (data.workflow_runs || []).find(r =>
                    (r.name && r.name.includes(runId)) ||
                    (r.display_title && r.display_title.includes(runId))
                );
                if (run) return run;
            }
            await this._sleep(3000);
        }
        throw new Error('Started the cloud job but could not locate the run. Check the repo Actions tab.');
    },

    // ----- poll until the run completes -----
    async waitForCompletion(runId, onProgress) {
        const cfg = this.getConfig();
        const run = await this.findRun(runId);
        if (onProgress) onProgress(run.status || 'queued', run);
        let last = run.status;
        for (let i = 0; i < 130; i++) { // ~6.5 min at 3s
            const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs/${run.id}`);
            if (res.ok) {
                const r = await res.json();
                if (r.status !== last) { last = r.status; if (onProgress) onProgress(r.status, r); }
                if (r.status === 'completed') {
                    if (r.conclusion === 'success') return r;
                    throw new Error('Cloud job finished as "' + (r.conclusion || 'failure') + '". See the Actions logs.');
                }
            }
            await this._sleep(3000);
        }
        throw new Error('Cloud job timed out. Check the repo Actions tab for progress.');
    },

    // ----- read the committed result file -----
    async fetchResult(runId) {
        const cfg = this.getConfig();
        const filePath = `generated/${runId}.json`;
        for (let i = 0; i < 12; i++) {
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
            await this._sleep(2500);
        }
        throw new Error('Cloud job finished but the generated file was not found yet. Try again in a moment.');
    },

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
};

window.GitHubRunner = GitHubRunner;
