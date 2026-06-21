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
    
    generateMinimalist(profile, colorScheme = 0) {
        const colors = this.templates[0].colors;
        const primary = colors[0];
        const secondary = colors[1];
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${profile.name} - Portfolio</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📱</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #e0e0e0; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
        header { text-align: center; padding: 3rem 0; }
        h1 { font-size: 2.5rem; color: ${primary}; margin-bottom: 0.5rem; }
        .title { font-size: 1.2rem; color: ${secondary}; margin-bottom: 1rem; }
        .contact { display: flex; justify-content: center; gap: 2rem; margin: 2rem 0; font-size: 0.9rem; }
        .contact a { color: ${primary}; text-decoration: none; }
        section { margin: 3rem 0; }
        h2 { color: ${primary}; border-bottom: 2px solid ${secondary}; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .experience { display: grid; gap: 1.5rem; }
        .job { background: rgba(255, 255, 255, 0.05); padding: 1.5rem; border-left: 4px solid ${primary}; }
        .job h3 { color: ${secondary}; margin-bottom: 0.25rem; }
        .job .meta { font-size: 0.9rem; color: #a0a0a0; margin-bottom: 0.5rem; }
        .job p { color: #d0d0d0; }
        .skills { display: flex; flex-wrap: wrap; gap: 1rem; }
        .skill { background: rgba(100, 200, 255, 0.1); padding: 0.75rem 1rem; border-radius: 6px; color: ${secondary}; }
        .btn { display: inline-block; background: ${primary}; color: white; padding: 1rem 2rem; border-radius: 6px; text-decoration: none; margin-top: 2rem; }
        .btn:hover { background: ${secondary}; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${profile.name}</h1>
            <div class="title">${profile.title || 'Professional'}</div>
            <div class="contact">
                ${profile.email ? `<a href="mailto:${profile.email}">Email</a>` : ''}
                ${profile.linkedin ? `<a href="https://${profile.linkedin}" target="_blank">LinkedIn</a>` : ''}
                ${profile.github ? `<a href="https://${profile.github}" target="_blank">GitHub</a>` : ''}
            </div>
        </header>
        
        ${profile.summary ? `<section><h2>About</h2><p>${profile.summary}</p></section>` : ''}
        
        ${profile.experience ? `<section><h2>Experience</h2><div class="experience">${profile.experience.map(exp => `<div class="job"><h3>${exp.position || ''}</h3><div class="meta">${exp.company || ''} • ${exp.year || ''}</div><p>${exp.description || ''}</p></div>`).join('')}</div></section>` : ''}
        
        ${profile.skills && profile.skills.length ? `<section><h2>Skills</h2><div class="skills">${profile.skills.map(skill => `<div class="skill">${skill}</div>`).join('')}</div></section>` : ''}
        
        ${profile.education ? `<section><h2>Education</h2>${profile.education.map(edu => `<p>${edu}</p>`).join('')}</section>` : ''}
    </div>
</body>
</html>`;
    },
    
    generateExecutive(profile, colorScheme = 0) {
        const colors = this.templates[1].colors;
        return this.generateMinimalist(profile, colorScheme);
    },
    
    generateCreative(profile, colorScheme = 0) {
        const colors = this.templates[2].colors;
        return this.generateMinimalist(profile, colorScheme);
    },
    
    generateTech(profile, colorScheme = 0) {
        const colors = this.templates[3].colors;
        return this.generateMinimalist(profile, colorScheme);
    },
    
    generateStartup(profile, colorScheme = 0) {
        const colors = this.templates[4].colors;
        return this.generateMinimalist(profile, colorScheme);
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
