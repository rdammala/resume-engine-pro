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
        return !!this.getAPIKey(provider);
    },
    
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
    // PROMPT BUILDING
    // ========================================================================
    
    buildTailoringPrompt(resumeData, jdData, mode) {
        const modePrompts = {
            fast: 'Quickly match key resume points to the job description.',
            smart: 'Thoroughly tailor the resume to the job description, reorder sections by relevance, and optimize for ATS.',
            ultra: 'Completely rewrite the resume to perfectly match the job description, add missing keywords, and ensure ATS compatibility.'
        };
        
        return `
${modePrompts[mode]}

CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jdData}

Please provide:
1. A tailored summary optimized for this role
2. Reordered experiences with emphasis on relevant skills
3. Updated skills section highlighting keywords from JD
4. ATS optimization suggestions
5. Full tailored resume text ready to use

Format as JSON with keys: summary, experience, skills, ats_suggestions, full_resume
`;
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
console.log('AIIntegration initialized');

} // End of guard

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIntegration;
}
