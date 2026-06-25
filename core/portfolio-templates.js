// ============================================================================
// PORTFOLIO TEMPLATES - Pre-designed portfolio templates
// ============================================================================
const PortfolioTemplates = {
    templates: [
        {
            id: 'minimalist',
            name: 'Minimalist',
            description: 'Clean, simple, elegant design',
            colors: ['#0099ff', '#00d9ff', '#e0e0e0']
        },
        {
            id: 'executive',
            name: 'Executive',
            description: 'Professional and authoritative',
            colors: ['#1a3a52', '#d4af37', '#e0e0e0']
        },
        {
            id: 'creative',
            name: 'Creative',
            description: 'Bold, artistic, modern',
            colors: ['#ff6b9d', '#feca57', '#48dbfb']
        },
        {
            id: 'tech',
            name: 'Tech',
            description: 'Developer-friendly design',
            colors: ['#0a0e27', '#00ff88', '#e0e0e0']
        },
        {
            id: 'startup',
            name: 'Startup',
            description: 'Dynamic and growth-focused',
            colors: ['#6c5ce7', '#a29bfe', '#fdcb6e']
        }
    ],
    
    // Human-readable names for each template's 5 palettes (same order as the
    // `pals` arrays inside the generate* functions). Used to build the picker.
    _paletteNames: {
        minimalist: ['Blue', 'Teal', 'Violet', 'Orange', 'Rose'],
        executive: ['Navy & Gold', 'Charcoal & Bronze', 'Forest & Gold', 'Burgundy & Gold', 'Royal & Silver'],
        creative: ['Pink Sunburst', 'Purple Pop', 'Mint Fresh', 'Sunset', 'Ocean Violet'],
        tech: ['Neon Green', 'Cyan', 'Amber', 'Magenta', 'Lime'],
        startup: ['Indigo', 'Emerald', 'Rose', 'Sky', 'Amber']
    },

    _families: [
        ['minimalist', 'Minimalist', '📄'],
        ['executive', 'Executive', '🏛️'],
        ['creative', 'Creative', '🎨'],
        ['tech', 'Tech', '💻'],
        ['startup', 'Startup', '🚀']
    ],

    // Grouped option list for the Portfolio Template <select> (25 named styles).
    listStyles() {
        return this._families.map(([id, label]) => ({
            group: label,
            options: (this._paletteNames[id] || []).map((n, i) => ({
                value: id + ':' + i,
                label: label + ' — ' + n
            }))
        }));
    },

    generatePortfolio(profile, template = 'minimalist', colorScheme = 0) {
        let tpl = template;
        let scheme = colorScheme;
        // "family:index" picks an exact template + palette (from the dropdown).
        if (typeof template === 'string' && template.indexOf(':') !== -1) {
            const parts = template.split(':');
            tpl = parts[0];
            scheme = parseInt(parts[1], 10);
        } else if (template === 'auto') {
            // Full auto: derive BOTH the family and the palette from the profile
            // (salted so they vary independently), for unique-per-person variety.
            const fams = this._families.map(f => f[0]);
            tpl = fams[this._schemeIndex(profile, 'family', fams.length)];
            scheme = 'auto';
        }
        const templateFn = this[`generate${tpl.charAt(0).toUpperCase()}${tpl.slice(1)}`];
        if (!templateFn) {
            throw new Error(`Unknown template: ${tpl}`);
        }
        return templateFn.call(this, profile, scheme);
    },

    // ------------------------------------------------------------------
    // Shared helpers — all profile-derived text is HTML-escaped ONCE here
    // so every template renders safely (published portfolios are public).
    // ------------------------------------------------------------------
    _esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    _escMulti(s) {
        return this._esc(s).replace(/\n/g, '<br>');
    },

    // Escape + normalize a profile into a safe view model the templates share.
    _prep(profile) {
        const p = profile || {};
        const exp = Array.isArray(p.experience) ? p.experience : [];
        const edu = Array.isArray(p.education) ? p.education : [];
        const skills = Array.isArray(p.skills) ? p.skills : [];
        return {
            name: this._esc(p.name || p.displayName || 'Your Name'),
            title: this._esc(p.title || 'Professional'),
            summary: p.summary ? this._escMulti(p.summary) : '',
            email: this._esc(p.email || ''),
            phone: this._esc(p.phone || ''),
            location: this._esc(p.location || ''),
            linkedin: this._esc(p.linkedin || ''),
            github: this._esc(p.github || ''),
            experience: exp.map(e => ({
                position: this._esc(e.position || e.title || e.role || ''),
                company: this._esc(e.company || ''),
                year: this._esc(e.year || e.dates || ''),
                description: e.description ? this._escMulti(e.description) : ''
            })),
            skills: skills.map(s => this._esc(s)).filter(Boolean),
            education: edu.map(e => typeof e === 'string'
                ? this._esc(e)
                : this._esc([e.degree, e.school, e.year].filter(Boolean).join(', '))
            ).filter(Boolean)
        };
    },

    _contacts(d) {
        const parts = [];
        if (d.email) parts.push(`<a href="mailto:${d.email}">Email</a>`);
        if (d.linkedin) parts.push(`<a href="https://${d.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`);
        if (d.github) parts.push(`<a href="https://${d.github}" target="_blank" rel="noopener">GitHub</a>`);
        if (d.phone) parts.push(`<span>${d.phone}</span>`);
        if (d.location) parts.push(`<span>${d.location}</span>`);
        return parts.join('');
    },

    // Body sections share class names so each template styles them via CSS —
    // this guarantees identical content across every template.
    _body(d) {
        return `
        ${d.summary ? `<section class="about"><h2>About</h2><p>${d.summary}</p></section>` : ''}
        ${d.experience.length ? `<section class="experience"><h2>Experience</h2><div class="jobs">${d.experience.map(e => `<div class="job"><h3>${e.position}</h3><div class="meta">${[e.company, e.year].filter(Boolean).join(' • ')}</div><p>${e.description}</p></div>`).join('')}</div></section>` : ''}
        ${d.skills.length ? `<section class="skills"><h2>Skills</h2><div class="skill-list">${d.skills.map(s => `<span class="skill">${s}</span>`).join('')}</div></section>` : ''}
        ${d.education.length ? `<section class="education"><h2>Education</h2>${d.education.map(e => `<p>${e}</p>`).join('')}</section>` : ''}`;
    },

    _doc(d, emoji, css, vars) {
        const v = vars || {};
        const L = v.light || {};
        const K = v.dark || {};
        const keys = ['bg', 'surface', 'text', 'muted', 'border', 'chip'];
        const decl = (o) => keys.map(k => (o[k] != null ? `--${k}:${o[k]};` : '')).join('');
        // Default (no attribute) = light; an explicit data-theme overrides it.
        const themeCss = `:root,:root[data-theme="light"]{${decl(L)}}:root[data-theme="dark"]{${decl(K)}}`;
        const toggleCss = `.theme-toggle{position:fixed;top:14px;right:14px;z-index:50;display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .75rem;font:600 .8rem/1 'Inter',-apple-system,sans-serif;cursor:pointer;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);box-shadow:0 2px 12px rgba(0,0,0,.15)}.theme-toggle:hover{filter:brightness(1.08)}@media print{.theme-toggle{display:none}}`;
        // Pre-paint theme decision (localStorage, else prefers-color-scheme).
        const bootScript = `(function(){var K='rep-portfolio-theme',t;try{t=localStorage.getItem(K)}catch(e){}if(t!=='light'&&t!=='dark'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}document.documentElement.setAttribute('data-theme',t)})();`;
        const toggleScript = `function __toggleTheme(){var K='rep-portfolio-theme',h=document.documentElement,t=h.getAttribute('data-theme')==='dark'?'light':'dark';h.setAttribute('data-theme',t);try{localStorage.setItem(K,t)}catch(e){}__syncToggle()}function __syncToggle(){var b=document.querySelector('.theme-toggle');if(b)b.textContent=document.documentElement.getAttribute('data-theme')==='dark'?'☀️ Light':'🌙 Dark'}document.addEventListener('DOMContentLoaded',__syncToggle);`;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${d.name} - Portfolio</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>">
    <script>${bootScript}</script>
    <style>${themeCss}${toggleCss}${css}</style>
</head>
<body>
    <button class="theme-toggle" type="button" onclick="__toggleTheme()" aria-label="Toggle light or dark mode">🌙 Dark</button>
    <div class="container">
        <header>
            <h1>${d.name}</h1>
            <div class="title">${d.title}</div>
            <div class="contact">${this._contacts(d)}</div>
        </header>
        ${this._body(d)}
        <footer class="site-foot">Built with Resume Engine Pro</footer>
    </div>
    <script>${toggleScript}</script>
</body>
</html>`;
    },

    // Resolve which colour palette to use. A numeric scheme is honoured; any
    // other value ('auto'/undefined) derives a STABLE palette from the profile,
    // so each person gets a consistent-but-varied colour scheme automatically
    // (the same profile always maps to the same palette across re-generations).
    _schemeIndex(profile, scheme, count) {
        if (typeof scheme === 'number' && isFinite(scheme)) {
            return ((Math.floor(scheme) % count) + count) % count;
        }
        const salt = (typeof scheme === 'string') ? scheme : '';
        const s = String((profile && (profile.name || profile.displayName || '')) + '|' + ((profile && profile.title) || '') + '|' + salt);
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h % count;
    },

    // ------------------------------------------------------------------
    // 1) MINIMALIST — clean, light, airy, single accent.
    // ------------------------------------------------------------------
    generateMinimalist(profile, scheme) {
        const d = this._prep(profile);
        const pals = [
            { accent: '#2f7df6', soft: '#eef4ff' },
            { accent: '#0ca678', soft: '#e6fcf5' },
            { accent: '#7048e8', soft: '#f3f0ff' },
            { accent: '#e8590c', soft: '#fff4e6' },
            { accent: '#c2255c', soft: '#ffe3ef' }
        ];
        const c = pals[this._schemeIndex(profile, scheme, pals.length)];
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; }
        .container { max-width: 820px; margin: 0 auto; padding: 3rem 2rem; }
        header { padding: 2rem 0 2.5rem; border-bottom: 1px solid var(--border); margin-bottom: 2.5rem; }
        h1 { font-size: 2.4rem; font-weight: 700; letter-spacing: -0.02em; }
        .title { font-size: 1.1rem; color: ${c.accent}; margin-top: 0.35rem; }
        .contact { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1.1rem; font-size: 0.9rem; color: var(--muted); }
        .contact a { color: ${c.accent}; text-decoration: none; }
        .contact a:hover { text-decoration: underline; }
        section { margin: 2.25rem 0; }
        h2 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 1rem; }
        .jobs { display: grid; gap: 1.5rem; }
        .job h3 { font-size: 1.1rem; }
        .job .meta { font-size: 0.85rem; color: var(--muted); margin: 0.15rem 0 0.5rem; }
        .job p { color: var(--text); }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .skill { background: var(--chip); color: ${c.accent}; padding: 0.4rem 0.85rem; border-radius: 4px; font-size: 0.88rem; }
        .education p { color: var(--text); margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--muted); text-align: center; }`;
        return this._doc(d, '📄', css, {
            light: { bg: '#eef0f3', surface: '#ffffff', text: '#2b2b2b', muted: '#6b7280', border: '#dfe3e8', chip: 'rgba(0,0,0,0.05)' },
            dark: { bg: '#14161b', surface: '#1b1e25', text: '#e7e9ee', muted: '#99a2b0', border: '#2a2e37', chip: 'rgba(255,255,255,0.06)' }
        });
    },

    // ------------------------------------------------------------------
    // 2) EXECUTIVE — formal serif, refined two-tone header.
    // ------------------------------------------------------------------
    generateExecutive(profile, scheme) {
        const d = this._prep(profile);
        const pals = [
            { head: '#1a2a3a', gold: '#c9a14a', soft: '#d8b766', text: '#6a5524', meta: '#8a7a52' },
            { head: '#2b2b2b', gold: '#b08d57', soft: '#c9a978', text: '#6a5524', meta: '#8a7a52' },
            { head: '#14352a', gold: '#caa94a', soft: '#d8c06a', text: '#5a6a24', meta: '#7a8a52' },
            { head: '#3a1a24', gold: '#caa14a', soft: '#d8b766', text: '#6a4524', meta: '#8a6a52' },
            { head: '#1a2440', gold: '#9aa6d8', soft: '#b8c2e8', text: '#3a4574', meta: '#5a6a9a' }
        ];
        const c = pals[this._schemeIndex(profile, scheme, pals.length)];
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, 'Times New Roman', serif; background: var(--bg); color: var(--text); line-height: 1.7; }
        .container { max-width: 860px; margin: 0 auto; background: var(--surface); box-shadow: 0 0 40px rgba(0,0,0,0.10); }
        header { background: ${c.head}; color: #fff; text-align: center; padding: 3.5rem 2rem; border-bottom: 4px solid ${c.gold}; }
        h1 { font-size: 2.6rem; font-weight: 400; letter-spacing: 0.04em; }
        .title { font-size: 1.15rem; color: ${c.soft}; font-style: italic; margin-top: 0.5rem; }
        .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; margin-top: 1.25rem; font-size: 0.88rem; color: #c8d2dc; }
        .contact a { color: ${c.soft}; text-decoration: none; }
        section { padding: 0 3rem; margin: 2.4rem 0; }
        h2 { font-size: 1.25rem; color: ${c.gold}; border-bottom: 2px solid ${c.gold}; padding-bottom: 0.4rem; margin-bottom: 1.1rem; letter-spacing: 0.02em; }
        .jobs { display: grid; gap: 1.6rem; }
        .job h3 { font-size: 1.15rem; color: var(--text); }
        .job .meta { font-size: 0.9rem; color: var(--muted); font-style: italic; margin: 0.2rem 0 0.55rem; }
        .job p { color: var(--text); }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .skill { border: 1px solid ${c.gold}; color: ${c.gold}; padding: 0.4rem 0.9rem; border-radius: 2px; font-size: 0.85rem; }
        .education p { color: var(--text); margin-bottom: 0.4rem; }
        .site-foot { padding: 2rem 3rem 2.5rem; font-size: 0.8rem; color: var(--muted); text-align: center; }`;
        return this._doc(d, '🏛️', css, {
            light: { bg: '#e9e3d6', surface: '#fbf8f2', text: '#232a33', muted: '#6f6750', border: '#e0d8c8' },
            dark: { bg: '#17150f', surface: '#201d16', text: '#ece6db', muted: '#b3a88f', border: '#3a3326' }
        });
    },

    // ------------------------------------------------------------------
    // 3) CREATIVE — bold gradient, colorful, playful, rounded.
    // ------------------------------------------------------------------
    generateCreative(profile, scheme) {
        const d = this._prep(profile);
        const pals = [
            { g1: '#ff6b9d', g2: '#feca57', g3: '#48dbfb', card: '#ff6b9d', meta: '#a0166b', h3: '#d6336c' },
            { g1: '#845ef7', g2: '#ff6b9d', g3: '#ffa94d', card: '#845ef7', meta: '#6741d9', h3: '#7048e8' },
            { g1: '#20c997', g2: '#51cf66', g3: '#94d82d', card: '#20c997', meta: '#0b7285', h3: '#0ca678' },
            { g1: '#ff922b', g2: '#ff6b6b', g3: '#f06595', card: '#ff6b6b', meta: '#c92a2a', h3: '#e8590c' },
            { g1: '#4dabf7', g2: '#9775fa', g3: '#f783ac', card: '#9775fa', meta: '#5f3dc4', h3: '#7048e8' }
        ];
        const c = pals[this._schemeIndex(profile, scheme, pals.length)];
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; }
        .container { max-width: 880px; margin: 0 auto; padding: 0 1.5rem 3rem; }
        header { text-align: center; padding: 4rem 2rem 3rem; margin: 0 -1.5rem 2.5rem; background: linear-gradient(135deg, ${c.g1} 0%, ${c.g2} 50%, ${c.g3} 100%); color: #fff; border-radius: 0 0 32px 32px; }
        h1 { font-size: 3rem; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .title { font-size: 1.3rem; font-weight: 600; margin-top: 0.4rem; }
        .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.25rem; margin-top: 1.25rem; font-size: 0.92rem; }
        .contact a, .contact span { color: #fff; text-decoration: none; background: rgba(255,255,255,0.25); padding: 0.35rem 0.9rem; border-radius: 20px; }
        section { margin: 2.5rem 0; }
        h2 { font-size: 1.5rem; font-weight: 700; background: linear-gradient(90deg, ${c.g1}, ${c.g2}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.2rem; }
        .jobs { display: grid; gap: 1.4rem; }
        .job { background: var(--surface); padding: 1.5rem; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.10); border-left: 5px solid ${c.card}; }
        .job h3 { font-size: 1.2rem; color: ${c.h3}; }
        .job .meta { font-size: 0.88rem; color: ${c.meta}; margin: 0.2rem 0 0.55rem; }
        .job p { color: var(--text); }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.7rem; }
        .skill { background: linear-gradient(135deg, ${c.g1}, ${c.g2}); color: #fff; padding: 0.5rem 1.1rem; border-radius: 24px; font-size: 0.88rem; font-weight: 600; }
        .education p { color: var(--text); margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; font-size: 0.8rem; color: var(--muted); text-align: center; }`;
        return this._doc(d, '🎨', css, {
            light: { bg: '#f3edf6', surface: '#ffffff', text: '#2d1b3d', muted: '#6b5878', border: '#ece0f0' },
            dark: { bg: '#161018', surface: '#1f1726', text: '#f0e6f5', muted: '#b6a3c2', border: '#2e2438' }
        });
    },

    // ------------------------------------------------------------------
    // 4) TECH — dark terminal/developer aesthetic, monospace, neon accent.
    // ------------------------------------------------------------------
    generateTech(profile, scheme) {
        const d = this._prep(profile);
        const pals = [
            { accent: '#00ff88', link: '#58a6ff' },
            { accent: '#22d3ee', link: '#7dd3fc' },
            { accent: '#fbbf24', link: '#fcd34d' },
            { accent: '#f472b6', link: '#c4b5fd' },
            { accent: '#a3e635', link: '#7dd3fc' }
        ];
        const c = pals[this._schemeIndex(profile, scheme, pals.length)];
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; background: var(--bg); color: var(--text); line-height: 1.7; }
        .container { max-width: 880px; margin: 0 auto; padding: 3rem 2rem; }
        header { border: 1px solid var(--border); border-left: 3px solid ${c.accent}; background: var(--surface); padding: 2rem; border-radius: 8px; margin-bottom: 2.5rem; }
        h1 { font-size: 2.2rem; color: ${c.accent}; }
        h1::before { content: '$ '; color: var(--muted); }
        .title { font-size: 1rem; color: ${c.link}; margin-top: 0.4rem; }
        .title::before { content: '// '; color: var(--muted); }
        .contact { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1rem; font-size: 0.85rem; }
        .contact a, .contact span { color: ${c.link}; text-decoration: none; }
        .contact a:hover { color: ${c.accent}; }
        section { margin: 2.2rem 0; }
        h2 { font-size: 1.05rem; color: ${c.accent}; margin-bottom: 1rem; }
        h2::before { content: '> '; color: var(--muted); }
        .jobs { display: grid; gap: 1.25rem; }
        .job { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 1.25rem; }
        .job h3 { font-size: 1.05rem; color: var(--text); }
        .job .meta { font-size: 0.82rem; color: ${c.link}; margin: 0.2rem 0 0.5rem; }
        .job p { color: var(--muted); }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.55rem; }
        .skill { background: var(--chip); border: 1px solid ${c.accent}55; color: var(--text); padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.82rem; }
        .education p { color: var(--muted); margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 0.78rem; color: var(--muted); text-align: center; }`;
        return this._doc(d, '💻', css, {
            light: { bg: '#e9edf2', surface: '#ffffff', text: '#1f2630', muted: '#5a6675', border: '#dbe1e8', chip: 'rgba(0,0,0,0.045)' },
            dark: { bg: '#0a0e14', surface: '#0d1117', text: '#c9d1d9', muted: '#8a96a3', border: '#1f2630', chip: 'rgba(255,255,255,0.04)' }
        });
    },

    // ------------------------------------------------------------------
    // 5) STARTUP — modern SaaS landing vibe, gradient hero, card shadows.
    // ------------------------------------------------------------------
    generateStartup(profile, scheme) {
        const d = this._prep(profile);
        const pals = [
            { a: '#6c5ce7', b: '#8e7bff', accent: '#6c5ce7', soft: '#ece9ff', meta: '#8e7bff', dark: '#4a3fc0', titleC: '#e3deff', shadow: '108,92,231' },
            { a: '#0ca678', b: '#20c997', accent: '#0ca678', soft: '#e6fcf5', meta: '#12b886', dark: '#087f5b', titleC: '#c3fae8', shadow: '18,184,134' },
            { a: '#e64980', b: '#ff8787', accent: '#e64980', soft: '#ffdeeb', meta: '#f06595', dark: '#a61e4d', titleC: '#ffd6e6', shadow: '230,73,128' },
            { a: '#1c7ed6', b: '#4dabf7', accent: '#1c7ed6', soft: '#e7f5ff', meta: '#4dabf7', dark: '#1864ab', titleC: '#d0ebff', shadow: '28,126,214' },
            { a: '#f76707', b: '#ff922b', accent: '#e8590c', soft: '#fff4e6', meta: '#ff922b', dark: '#d9480f', titleC: '#ffe8cc', shadow: '247,103,7' }
        ];
        const c = pals[this._schemeIndex(profile, scheme, pals.length)];
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; }
        .container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; }
        header { text-align: center; padding: 4.5rem 2rem 3.5rem; margin: 0 -1.5rem 2.5rem; background: linear-gradient(135deg, ${c.a} 0%, ${c.b} 100%); color: #fff; }
        h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.02em; }
        .title { font-size: 1.25rem; color: ${c.titleC}; margin-top: 0.5rem; font-weight: 500; }
        .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 1.5rem; font-size: 0.9rem; }
        .contact a, .contact span { color: ${c.accent}; background: var(--surface); text-decoration: none; padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 14px rgba(${c.shadow},0.25); }
        section { margin: 2.5rem 0; }
        h2 { font-size: 1.4rem; font-weight: 700; color: ${c.accent}; margin-bottom: 1.2rem; }
        .jobs { display: grid; gap: 1.3rem; }
        .job { background: var(--surface); padding: 1.6rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(${c.shadow},0.12); border: 1px solid var(--border); }
        .job h3 { font-size: 1.15rem; color: var(--text); }
        .job .meta { font-size: 0.86rem; color: ${c.meta}; font-weight: 600; margin: 0.2rem 0 0.55rem; }
        .job p { color: var(--muted); }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .skill { background: var(--chip); color: ${c.accent}; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.86rem; font-weight: 600; }
        .education p { color: var(--muted); margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; font-size: 0.8rem; color: var(--muted); text-align: center; }`;
        return this._doc(d, '🚀', css, {
            light: { bg: '#eef0fb', surface: '#ffffff', text: '#1e1b3a', muted: '#5a5675', border: '#e2e0f2', chip: 'rgba(0,0,0,0.05)' },
            dark: { bg: '#13111c', surface: '#1c1930', text: '#ece9ff', muted: '#a29dc4', border: '#2c2840', chip: 'rgba(255,255,255,0.07)' }
        });
    },
    
    getTemplateList() {
        return this.templates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description
        }));
    }
};

window.PortfolioTemplates = PortfolioTemplates;