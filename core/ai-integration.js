// ============================================================================
// AI INTEGRATION - Multi-provider support (OpenAI, Claude, Gemini, Mistral)
// ============================================================================

const AIIntegration = {
    providers: {
        openai: {
            name: 'OpenAI (GPT-4)',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4',
            costs: {
                input: 0.00003,
                output: 0.00006
            },
            modes: {
                fast: { tokens: 500, cost: 0.015 },
                smart: { tokens: 1500, cost: 0.03 },
                ultra: { tokens: 2500, cost: 0.06 }
            }
        },
        claude: {
            name: 'Claude (Anthropic)',
            endpoint: 'https://api.anthropic.com/v1/messages',
            model: 'claude-3-sonnet-20240229',
            costs: {
                input: 0.000003,
                output: 0.000015
            },
            modes: {
                fast: { tokens: 500, cost: 0.002 },
                smart: { tokens: 1500, cost: 0.005 },
                ultra: { tokens: 2500, cost: 0.012 }
            }
        },
        gemini: {
            name: 'Google Gemini',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            model: 'gemini-pro',
            costs: {
                input: 0.000000125,
                output: 0.000000375
            },
            modes: {
                fast: { tokens: 500, cost: 0.003 },
                smart: { tokens: 1500, cost: 0.0075 },
                ultra: { tokens: 2500, cost: 0.015 }
            }
        },
        mistral: {
            name: 'Mistral AI',
            endpoint: 'https://api.mistral.ai/v1/chat/completions',
            model: 'mistral-large-latest',
            costs: {
                input: 0.0000024,
                output: 0.0000072
            },
            modes: {
                fast: { tokens: 500, cost: 0.0005 },
                smart: { tokens: 1500, cost: 0.002 },
                ultra: { tokens: 2500, cost: 0.005 }
            }
        },
        pollinations: {
            name: 'Free AI (Pollinations — no key needed)',
            endpoint: 'https://text.pollinations.ai/openai',
            model: 'openai',
            free: true,
            noKey: true,
            costs: { input: 0, output: 0 },
            modes: {
                fast: { tokens: 500, cost: 0 },
                smart: { tokens: 1500, cost: 0 },
                ultra: { tokens: 2500, cost: 0 }
            }
        },
        ollama: {
            name: 'Ollama (Llama 3 — free, runs on your machine/Codespace)',
            endpoint: 'http://localhost:11434/v1/chat/completions',
            model: 'llama3.2',
            free: true,
            noKey: true,
            local: true,
            costs: { input: 0, output: 0 },
            modes: {
                fast: { tokens: 500, cost: 0 },
                smart: { tokens: 1500, cost: 0 },
                ultra: { tokens: 2500, cost: 0 }
            }
        },
        webllm: {
            name: 'Browser AI (WebLLM — free, private, runs on your device)',
            model: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
            free: true,
            noKey: true,
            browser: true,
            costs: { input: 0, output: 0 },
            modes: {
                fast: { tokens: 900, cost: 0 },
                smart: { tokens: 1800, cost: 0 },
                ultra: { tokens: 2600, cost: 0 }
            },
            // Curated free, in-browser models (downloaded once, then cached). All $0.
            models: [
                { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 3B — balanced default (~2 GB)' },
                { id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 · 7B — best quality (~4.5 GB)' },
                { id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', label: 'Llama 3.1 · 8B — top quality (~5 GB)' },
                { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', label: 'Phi-3.5 mini · 3.8B — fast & capable (~2.2 GB)' },
                { id: 'gemma-2-2b-it-q4f16_1-MLC', label: 'Gemma 2 · 2B — lightweight (~1.5 GB)' }
            ]
        },
        custom: {
            name: 'Custom / Your own provider (OpenAI-compatible)',
            endpoint: '',
            model: '',
            custom: true,
            costs: { input: 0, output: 0 },
            modes: {
                fast: { tokens: 500, cost: 0 },
                smart: { tokens: 1500, cost: 0 },
                ultra: { tokens: 2500, cost: 0 }
            }
        }
    },
    
    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    setAPIKey(provider, key) {
        if (!this.providers[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        StorageManager.saveAPIKey(provider, key, true);
        return true;
    },
    
    getAPIKey(provider) {
        return StorageManager.getAPIKey(provider);
    },
    
    isConfigured(provider) {
        if (provider === 'pollinations') return true; // free, no key required
        if (provider === 'ollama') return true; // free local/Codespace server, no key
        if (provider === 'webllm') return this.webgpuSupported(); // ready only on WebGPU devices
        if (provider === 'custom') {
            const c = this.getCustomConfig();
            return !!(c && c.endpoint);
        }
        return !!this.getAPIKey(provider);
    },

    // Custom OpenAI-compatible provider configuration (BYO endpoint/model/key)
    setCustomConfig(endpoint, model, key) {
        StorageManager.set('customAIConfig', { endpoint: endpoint || '', model: model || '' }, false);
        if (key) {
            StorageManager.saveAPIKey('custom', key, true);
        }
        return true;
    },

    getCustomConfig() {
        const cfg = StorageManager.get('customAIConfig', false) || {};
        return {
            endpoint: cfg.endpoint || '',
            model: cfg.model || '',
            key: this.getAPIKey('custom') || ''
        };
    },

    // Ollama (local Llama 3) configuration — OpenAI-compatible, no key needed.
    // Defaults to the standard local Ollama port; override the endpoint when
    // running in GitHub Codespaces (paste the forwarded https URL + /v1/chat/completions).
    setOllamaConfig(endpoint, model) {
        StorageManager.set('ollamaConfig', {
            endpoint: endpoint || '',
            model: model || ''
        }, false);
    },

    getOllamaConfig() {
        const cfg = StorageManager.get('ollamaConfig', false) || {};
        return {
            endpoint: cfg.endpoint || this.providers.ollama.endpoint,
            model: cfg.model || this.providers.ollama.model
        };
    },

    // WebLLM (in-browser) configuration — which model to run on the device.
    webgpuSupported() {
        return typeof navigator !== 'undefined' && !!navigator.gpu;
    },
    setWebLLMConfig(model) {
        StorageManager.set('webllmConfig', { model: model || '' }, false);
    },
    getWebLLMConfig() {
        const cfg = StorageManager.get('webllmConfig', false) || {};
        return { model: cfg.model || this.providers.webllm.model };
    },
    // Settable by the UI to show model-download progress (init can pull GBs once).
    onWebLLMProgress: null,
    
    getConfigured() {
        const configured = {};
        for (const provider in this.providers) {
            if (this.isConfigured(provider)) {
                configured[provider] = {
                    name: this.providers[provider].name,
                    configured: true
                };
            }
        }
        return configured;
    },
    
    // ========================================================================
    // COST CALCULATION
    // ========================================================================
    
    getCost(provider, mode = 'smart') {
        if (provider === 'pollinations' || provider === 'custom' || provider === 'ollama' || provider === 'webllm') return 0;
        if (!this.providers[provider]) return 0;
        return this.providers[provider].modes[mode]?.cost || 0;
    },
    
    getBulkCost(provider, count, mode = 'smart') {
        return this.getCost(provider, mode) * count;
    },
    
    // ========================================================================
    // RESUME TAILORING
    // ========================================================================
    
    async tailorResume(provider, resumeData, jdData, mode = 'smart') {
        // Free + custom providers handle their own auth
        if (provider === 'pollinations') {
            return this.tailorWithPollinations(resumeData, jdData, mode);
        }
        if (provider === 'ollama') {
            return this.tailorWithOllama(resumeData, jdData, mode);
        }
        if (provider === 'webllm') {
            return this.tailorWithWebLLM(resumeData, jdData, mode);
        }
        if (provider === 'custom') {
            return this.tailorWithCustom(resumeData, jdData, mode);
        }

        const key = this.getAPIKey(provider);
        if (!key) {
            throw new Error(`${provider} API key not configured`);
        }
        
        switch(provider) {
            case 'openai':
                return this.tailorWithOpenAI(key, resumeData, jdData, mode);
            case 'claude':
                return this.tailorWithClaude(key, resumeData, jdData, mode);
            case 'gemini':
                return this.tailorWithGemini(key, resumeData, jdData, mode);
            case 'mistral':
                return this.tailorWithMistral(key, resumeData, jdData, mode);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    },
    
    // ========================================================================
    // OPENAI INTEGRATION
    // ========================================================================
    
    async tailorWithOpenAI(apiKey, resumeData, jdData, mode) {
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        
        try {
            const response = await fetch(this.providers.openai.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.providers.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert resume writer and ATS optimization specialist.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: this.providers.openai.modes[mode].tokens
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                provider: 'openai',
                cost: this.getCost('openai', mode),
                tailored: data.choices[0].message.content
            };
        } catch (error) {
            throw new Error(`OpenAI error: ${error.message}`);
        }
    },
    
    // ========================================================================
    // CLAUDE INTEGRATION
    // ========================================================================
    
    async tailorWithClaude(apiKey, resumeData, jdData, mode) {
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        
        try {
            const response = await fetch(this.providers.claude.endpoint, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.providers.claude.model,
                    max_tokens: this.providers.claude.modes[mode].tokens,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                provider: 'claude',
                cost: this.getCost('claude', mode),
                tailored: data.content[0].text
            };
        } catch (error) {
            throw new Error(`Claude error: ${error.message}`);
        }
    },
    
    // ========================================================================
    // GEMINI INTEGRATION
    // ========================================================================
    
    async tailorWithGemini(apiKey, resumeData, jdData, mode) {
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        
        try {
            const response = await fetch(
                `${this.providers.gemini.endpoint}?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: this.providers.gemini.modes[mode].tokens,
                            temperature: 0.7
                        }
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                provider: 'gemini',
                cost: this.getCost('gemini', mode),
                tailored: data.candidates[0].content.parts[0].text
            };
        } catch (error) {
            throw new Error(`Gemini error: ${error.message}`);
        }
    },
    
    // ========================================================================
    // MISTRAL INTEGRATION
    // ========================================================================
    
    async tailorWithMistral(apiKey, resumeData, jdData, mode) {
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        
        try {
            const response = await fetch(this.providers.mistral.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.providers.mistral.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert resume writer.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.providers.mistral.modes[mode].tokens
                })
            });
            
            if (!response.ok) {
                throw new Error(`Mistral API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                provider: 'mistral',
                cost: this.getCost('mistral', mode),
                tailored: data.choices[0].message.content
            };
        } catch (error) {
            throw new Error(`Mistral error: ${error.message}`);
        }
    },

    // ========================================================================
    // FREE PROVIDER (Pollinations - no API key, CORS-enabled, OpenAI-compatible)
    // ========================================================================

    async tailorWithPollinations(resumeData, jdData, mode) {
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        const maxTokens = Math.max(1800, this.providers.pollinations.modes[mode]?.tokens || 1500);
        try {
            const response = await fetch(this.providers.pollinations.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'openai',
                    temperature: 0.4,
                    max_tokens: maxTokens,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: 'You are an expert resume writer and ATS specialist. Respond with ONLY a single valid minified JSON object — no markdown, no code fences, no commentary.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            if (!response.ok) {
                throw new Error(`Pollinations API error: ${response.status}`);
            }
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content
                ?? (typeof data === 'string' ? data : JSON.stringify(data));
            return { success: true, provider: 'pollinations', cost: 0, tailored: content };
        } catch (error) {
            throw new Error(`Pollinations error: ${error.message}`);
        }
    },

    // ========================================================================
    // OLLAMA (local Llama 3 — OpenAI-compatible, no key)
    // ========================================================================

    async tailorWithOllama(resumeData, jdData, mode) {
        const cfg = this.getOllamaConfig();
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        const maxTokens = Math.max(1800, this.providers.ollama.modes[mode]?.tokens || 1500);
        try {
            const response = await fetch(cfg.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: cfg.model || 'llama3',
                    temperature: 0.4,
                    max_tokens: maxTokens,
                    stream: false,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: 'You are an expert resume writer and ATS specialist. Respond with ONLY a single valid minified JSON object — no markdown, no code fences, no commentary.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            if (!response.ok) {
                throw new Error(`Ollama error: ${response.status} (is the Ollama server running and reachable at ${cfg.endpoint}?)`);
            }
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content
                ?? data?.message?.content
                ?? (typeof data === 'string' ? data : JSON.stringify(data));
            return { success: true, provider: 'ollama', cost: 0, tailored: content };
        } catch (error) {
            throw new Error(`Ollama error: ${error.message}`);
        }
    },

    // ========================================================================
    // WEBLLM (in-browser, WebGPU — free, private, no key, no server)
    // ========================================================================

    async _loadWebLLM() {
        if (this._webllmMod) return this._webllmMod;
        // Lazy ESM import so the (large) library only loads when actually used.
        this._webllmMod = await import('https://esm.run/@mlc-ai/web-llm');
        return this._webllmMod;
    },

    async _getWebLLMEngine(model) {
        const webllm = await this._loadWebLLM();
        if (this._webllmEngine && this._webllmEngineModel === model) return this._webllmEngine;
        // A device can expose navigator.gpu yet still have no usable adapter
        // (e.g. GPU blocklisted, headless, or disabled) — catch that early with
        // a clear message instead of a cryptic engine-internal failure.
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error('No compatible WebGPU adapter is available on this device (the GPU may be disabled or blocklisted).');
            }
        } catch (e) {
            throw new Error(e.message || 'WebGPU adapter request failed.');
        }
        try { if (this._webllmEngine && this._webllmEngine.unload) await this._webllmEngine.unload(); } catch (_) {}
        this._webllmEngine = await webllm.CreateMLCEngine(model, {
            initProgressCallback: (report) => { try { if (this.onWebLLMProgress) this.onWebLLMProgress(report); } catch (_) {} }
        });
        this._webllmEngineModel = model;
        return this._webllmEngine;
    },

    async tailorWithWebLLM(resumeData, jdData, mode) {
        if (!this.webgpuSupported()) {
            throw new Error('Your browser/device has no WebGPU, so Browser AI cannot run here. Use Free AI (Pollinations), Ollama, or a paid API key instead.');
        }
        const model = this.getWebLLMConfig().model;
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        const maxTokens = Math.max(1800, this.providers.webllm.modes[mode]?.tokens || 1800);
        const runOnce = async () => {
            const engine = await this._getWebLLMEngine(model);
            // Inference produces no progress events, so tell the UI we've moved
            // past the download/load phase and are now actually writing.
            try { if (this.onWebLLMProgress) this.onWebLLMProgress({ progress: 1, text: 'Model ready — writing your tailored resume now…', phase: 'generating' }); } catch (_) {}
            const reply = await engine.chat.completions.create({
                temperature: 0.4,
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: 'You are an expert resume writer and ATS specialist. Respond with ONLY a single valid minified JSON object — no markdown, no code fences, no commentary.' },
                    { role: 'user', content: prompt }
                ]
            });
            return reply?.choices?.[0]?.message?.content
                ?? (typeof reply === 'string' ? reply : JSON.stringify(reply));
        };
        try {
            const content = await runOnce();
            return { success: true, provider: 'webllm', cost: 0, tailored: content };
        } catch (error) {
            // A failed run can leave the cached engine in a disposed/broken state
            // (common on Intel iGPUs) — drop it so a retry rebuilds cleanly, and
            // retry once for transient "disposed / device lost" errors.
            this._webllmEngine = null;
            this._webllmEngineModel = null;
            if (/dispos|destroy|device.*lost|lost.*device/i.test(error.message || '')) {
                try {
                    const content = await runOnce();
                    return { success: true, provider: 'webllm', cost: 0, tailored: content };
                } catch (e2) {
                    this._webllmEngine = null;
                    this._webllmEngineModel = null;
                    throw new Error(`Browser AI (WebLLM) error: ${e2.message}`);
                }
            }
            throw new Error(`Browser AI (WebLLM) error: ${error.message}`);
        }
    },

    // ========================================================================
    // CUSTOM PROVIDER (user's own OpenAI-compatible endpoint + model + key)
    // ========================================================================

    async tailorWithCustom(resumeData, jdData, mode) {        const cfg = this.getCustomConfig();
        if (!cfg || !cfg.endpoint) {
            throw new Error('Custom provider not configured. Add your endpoint, model, and key in Settings.');
        }
        const prompt = this.buildTailoringPrompt(resumeData, jdData, mode);
        const headers = { 'Content-Type': 'application/json' };
        if (cfg.key) headers['Authorization'] = `Bearer ${cfg.key}`;
        const maxTokens = Math.max(1800, this.providers.custom.modes[mode]?.tokens || 1500);
        try {
            const response = await fetch(cfg.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: cfg.model || 'gpt-3.5-turbo',
                    temperature: 0.4,
                    max_tokens: maxTokens,
                    messages: [
                        { role: 'system', content: 'You are an expert resume writer and ATS specialist. Respond with ONLY a single valid minified JSON object — no markdown, no code fences, no commentary.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            if (!response.ok) {
                throw new Error(`Custom provider error: ${response.status}`);
            }
            const data = await response.json();
            // Support OpenAI-style and Anthropic-style responses
            const content = data?.choices?.[0]?.message?.content
                ?? data?.content?.[0]?.text
                ?? (typeof data === 'string' ? data : JSON.stringify(data));
            return { success: true, provider: 'custom', cost: 0, tailored: content };
        } catch (error) {
            throw new Error(`Custom provider error: ${error.message}`);
        }
    },

    // ========================================================================
    // PROMPT BUILDING
    // ========================================================================
    
    buildTailoringPrompt(resumeData, jdData, mode) {
        const modeNote = {
            fast: 'Tailor the wording and reorder content to the job; keep it efficient.',
            smart: 'Thoroughly rewrite the resume to the job: surface relevant achievements, inject exact ATS keywords, and strengthen every bullet.',
            ultra: 'Completely re-engineer the resume for maximum ATS score and recruiter appeal while staying truthful to the candidate\'s real history.'
        }[mode] || '';

        // Give the model EVERYTHING we have about the candidate so it can extract
        // and curate freely: the structured fields plus the full original text.
        const structured = {
            name: resumeData.name || resumeData.displayName || '',
            email: resumeData.email || '',
            phone: resumeData.phone || '',
            location: resumeData.location || '',
            summary: resumeData.summary || '',
            skills: resumeData.skills || [],
            experience: resumeData.experience || [],
            education: resumeData.education || [],
            certifications: resumeData.certifications || []
        };
        const rawText = (resumeData.rawText || '').slice(0, 8000);

        return `You are a world-class resume writer and ATS (Applicant Tracking System) optimization specialist. ${modeNote}

GOAL: Produce a NEW, polished, ATS-optimized resume for the candidate, specifically targeted at the JOB DESCRIPTION below. Do not simply echo the input — actively rewrite it.

HOW TO OPTIMIZE FOR ATS AND RECRUITERS:
- Mirror the exact terminology, hard skills, tools, and keywords used in the job description (only where the candidate genuinely has that experience).
- Rewrite the professional summary into 3-4 punchy sentences that position the candidate for THIS role, leading with their strongest, most relevant value.
- Rewrite each experience bullet to be achievement-oriented: strong action verb first, quantified impact (numbers, %, scale) where the source supports it, and aligned to the job's responsibilities.
- Prioritize and reorder skills so the most JD-relevant ones come first; include synonyms/variants the ATS may scan for.
- Stay truthful: use only the candidate's real employers, titles, dates, and accomplishments from the data below. Never fabricate.

CANDIDATE STRUCTURED DATA (JSON):
${JSON.stringify(structured)}

CANDIDATE FULL RESUME TEXT (authoritative source — extract any details missing from the structured data):
"""
${rawText}
"""

TARGET JOB DESCRIPTION:
"""
${jdData}
"""

Respond with ONE valid minified JSON object and NOTHING else — no markdown, no code fences, no commentary. Use EXACTLY these keys:
{"job_title":"the role being applied for","company":"the hiring company","summary":"3-4 sentence ATS-optimized professional summary, plain text, no line breaks","skills":["14-18 prioritized, JD-aligned skills"],"experience":[{"role":"job title","company":"employer","location":"city, ST","dates":"Mon YYYY - Mon YYYY","details":["Architected X using Y, cutting Z by 40%","Led a team of 8 to deliver ...","Automated ... saving 200+ hours/quarter","Reduced MTTR from 45m to 9m by ...","Scaled platform to 3x traffic at 99.95% uptime"]}]}

Rules:
- "summary" must be a single plain-text string with NO newline characters.
- Escape any double quotes inside strings; never use raw newlines inside strings.
- Order experience most-recent first; each role MUST have 4-6 strong, quantified bullets — a single-bullet role is unacceptable.
- "skills" must contain at least 14 entries.
- For "job_title"/"company", read the JOB DESCRIPTION; use "" if genuinely unclear and never guess a benefit or perk as the company.
- Return ONLY the JSON object.`;
    },
    
    // ========================================================================
    // UTILITY
    // ========================================================================
    
    getProviders() {
        return Object.keys(this.providers).map(key => ({
            id: key,
            ...this.providers[key]
        }));
    },
    
    getProviderInfo(provider) {
        return this.providers[provider] || null;
    }
};

window.AIIntegration = AIIntegration;