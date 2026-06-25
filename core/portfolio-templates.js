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
    
    generatePortfolio(profile, template = 'minimalist', colorScheme = 0) {
        const templateFn = this[`generate${template.charAt(0).toUpperCase()}${template.slice(1)}`];
        if (!templateFn) {
            throw new Error(`Unknown template: ${template}`);
        }
        
        return templateFn.call(this, profile, colorScheme);
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

    _doc(d, emoji, css) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${d.name} - Portfolio</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>">
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${d.name}</h1>
            <div class="title">${d.title}</div>
            <div class="contact">${this._contacts(d)}</div>
        </header>
        ${this._body(d)}
        <footer class="site-foot">Built with Resume Engine Pro</footer>
    </div>
</body>
</html>`;
    },

    // ------------------------------------------------------------------
    // 1) MINIMALIST — clean, light, airy, single accent.
    // ------------------------------------------------------------------
    generateMinimalist(profile) {
        const d = this._prep(profile);
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #fafafa; color: #2b2b2b; line-height: 1.65; }
        .container { max-width: 820px; margin: 0 auto; padding: 3rem 2rem; }
        header { padding: 2rem 0 2.5rem; border-bottom: 1px solid #e6e6e6; margin-bottom: 2.5rem; }
        h1 { font-size: 2.4rem; font-weight: 700; letter-spacing: -0.02em; }
        .title { font-size: 1.1rem; color: #2f7df6; margin-top: 0.35rem; }
        .contact { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1.1rem; font-size: 0.9rem; color: #777; }
        .contact a { color: #2f7df6; text-decoration: none; }
        .contact a:hover { text-decoration: underline; }
        section { margin: 2.25rem 0; }
        h2 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.12em; color: #999; margin-bottom: 1rem; }
        .jobs { display: grid; gap: 1.5rem; }
        .job h3 { font-size: 1.1rem; }
        .job .meta { font-size: 0.85rem; color: #888; margin: 0.15rem 0 0.5rem; }
        .job p { color: #444; }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .skill { background: #eef4ff; color: #2f7df6; padding: 0.4rem 0.85rem; border-radius: 4px; font-size: 0.88rem; }
        .education p { color: #444; margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e6e6e6; font-size: 0.8rem; color: #aaa; text-align: center; }`;
        return this._doc(d, '📄', css);
    },

    // ------------------------------------------------------------------
    // 2) EXECUTIVE — formal serif, navy + gold, refined.
    // ------------------------------------------------------------------
    generateExecutive(profile) {
        const d = this._prep(profile);
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, 'Times New Roman', serif; background: #f7f5f0; color: #232a33; line-height: 1.7; }
        .container { max-width: 860px; margin: 0 auto; background: #fffdf9; box-shadow: 0 0 40px rgba(0,0,0,0.06); }
        header { background: #1a2a3a; color: #fff; text-align: center; padding: 3.5rem 2rem; border-bottom: 4px solid #c9a14a; }
        h1 { font-size: 2.6rem; font-weight: 400; letter-spacing: 0.04em; }
        .title { font-size: 1.15rem; color: #d8b766; font-style: italic; margin-top: 0.5rem; }
        .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; margin-top: 1.25rem; font-size: 0.88rem; color: #c8d2dc; }
        .contact a { color: #d8b766; text-decoration: none; }
        section { padding: 0 3rem; margin: 2.4rem 0; }
        h2 { font-size: 1.25rem; color: #1a2a3a; border-bottom: 2px solid #c9a14a; padding-bottom: 0.4rem; margin-bottom: 1.1rem; letter-spacing: 0.02em; }
        .jobs { display: grid; gap: 1.6rem; }
        .job h3 { font-size: 1.15rem; color: #232a33; }
        .job .meta { font-size: 0.9rem; color: #8a7a52; font-style: italic; margin: 0.2rem 0 0.55rem; }
        .job p { color: #3a424c; }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .skill { border: 1px solid #c9a14a; color: #6a5524; padding: 0.4rem 0.9rem; border-radius: 2px; font-size: 0.85rem; }
        .education p { color: #3a424c; margin-bottom: 0.4rem; }
        .site-foot { padding: 2rem 3rem 2.5rem; font-size: 0.8rem; color: #aaa; text-align: center; }`;
        return this._doc(d, '🏛️', css);
    },

    // ------------------------------------------------------------------
    // 3) CREATIVE — bold gradient, colorful, playful, rounded.
    // ------------------------------------------------------------------
    generateCreative(profile) {
        const d = this._prep(profile);
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', 'Segoe UI', sans-serif; background: #fff5fb; color: #2d1b3d; line-height: 1.65; }
        .container { max-width: 880px; margin: 0 auto; padding: 0 1.5rem 3rem; }
        header { text-align: center; padding: 4rem 2rem 3rem; margin: 0 -1.5rem 2.5rem; background: linear-gradient(135deg, #ff6b9d 0%, #feca57 50%, #48dbfb 100%); color: #fff; border-radius: 0 0 32px 32px; }
        h1 { font-size: 3rem; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .title { font-size: 1.3rem; font-weight: 600; margin-top: 0.4rem; }
        .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.25rem; margin-top: 1.25rem; font-size: 0.92rem; }
        .contact a, .contact span { color: #fff; text-decoration: none; background: rgba(255,255,255,0.25); padding: 0.35rem 0.9rem; border-radius: 20px; }
        section { margin: 2.5rem 0; }
        h2 { font-size: 1.5rem; font-weight: 700; background: linear-gradient(90deg, #ff6b9d, #feca57); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.2rem; }
        .jobs { display: grid; gap: 1.4rem; }
        .job { background: #fff; padding: 1.5rem; border-radius: 16px; box-shadow: 0 6px 20px rgba(255,107,157,0.12); border-left: 5px solid #ff6b9d; }
        .job h3 { font-size: 1.2rem; color: #d6336c; }
        .job .meta { font-size: 0.88rem; color: #a0166b; margin: 0.2rem 0 0.55rem; }
        .job p { color: #4a3a52; }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.7rem; }
        .skill { background: linear-gradient(135deg, #ff6b9d, #feca57); color: #fff; padding: 0.5rem 1.1rem; border-radius: 24px; font-size: 0.88rem; font-weight: 600; }
        .education p { color: #4a3a52; margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; font-size: 0.8rem; color: #c79; text-align: center; }`;
        return this._doc(d, '🎨', css);
    },

    // ------------------------------------------------------------------
    // 4) TECH — dark terminal/developer aesthetic, monospace, green-on-black.
    // ------------------------------------------------------------------
    generateTech(profile) {
        const d = this._prep(profile);
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; background: #0a0e14; color: #c9d1d9; line-height: 1.7; }
        .container { max-width: 880px; margin: 0 auto; padding: 3rem 2rem; }
        header { border: 1px solid #1f2630; border-left: 3px solid #00ff88; background: #0d1117; padding: 2rem; border-radius: 8px; margin-bottom: 2.5rem; }
        h1 { font-size: 2.2rem; color: #00ff88; }
        h1::before { content: '$ '; color: #3a4250; }
        .title { font-size: 1rem; color: #58a6ff; margin-top: 0.4rem; }
        .title::before { content: '// '; color: #3a4250; }
        .contact { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1rem; font-size: 0.85rem; }
        .contact a, .contact span { color: #58a6ff; text-decoration: none; }
        .contact a:hover { color: #00ff88; }
        section { margin: 2.2rem 0; }
        h2 { font-size: 1.05rem; color: #00ff88; margin-bottom: 1rem; }
        h2::before { content: '> '; color: #3a4250; }
        .jobs { display: grid; gap: 1.25rem; }
        .job { background: #0d1117; border: 1px solid #1f2630; border-radius: 6px; padding: 1.25rem; }
        .job h3 { font-size: 1.05rem; color: #e6edf3; }
        .job .meta { font-size: 0.82rem; color: #00ff88; margin: 0.2rem 0 0.5rem; }
        .job p { color: #9aa6b2; }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.55rem; }
        .skill { background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.3); color: #00ff88; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.82rem; }
        .education p { color: #9aa6b2; margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1f2630; font-size: 0.78rem; color: #3a4250; text-align: center; }`;
        return this._doc(d, '💻', css);
    },

    // ------------------------------------------------------------------
    // 5) STARTUP — modern SaaS landing vibe, indigo gradient, card shadows.
    // ------------------------------------------------------------------
    generateStartup(profile) {
        const d = this._prep(profile);
        const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f6ff; color: #1e1b3a; line-height: 1.65; }
        .container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; }
        header { text-align: center; padding: 4.5rem 2rem 3.5rem; margin: 0 -1.5rem 2.5rem; background: linear-gradient(135deg, #6c5ce7 0%, #8e7bff 100%); color: #fff; }
        h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.02em; }
        .title { font-size: 1.25rem; color: #e3deff; margin-top: 0.5rem; font-weight: 500; }
        .contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 1.5rem; font-size: 0.9rem; }
        .contact a, .contact span { color: #6c5ce7; background: #fff; text-decoration: none; padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 14px rgba(108,92,231,0.25); }
        section { margin: 2.5rem 0; }
        h2 { font-size: 1.4rem; font-weight: 700; color: #4a3fc0; margin-bottom: 1.2rem; }
        .jobs { display: grid; gap: 1.3rem; }
        .job { background: #fff; padding: 1.6rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(108,92,231,0.1); }
        .job h3 { font-size: 1.15rem; color: #1e1b3a; }
        .job .meta { font-size: 0.86rem; color: #8e7bff; font-weight: 600; margin: 0.2rem 0 0.55rem; }
        .job p { color: #4a4660; }
        .skill-list { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .skill { background: #ece9ff; color: #6c5ce7; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.86rem; font-weight: 600; }
        .education p { color: #4a4660; margin-bottom: 0.4rem; }
        .site-foot { margin-top: 3rem; font-size: 0.8rem; color: #9b95c0; text-align: center; }`;
        return this._doc(d, '🚀', css);
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