// ============================================================================
// PORTFOLIO TEMPLATES - 50+ Professional Portfolio Styles
// ============================================================================

const PortfolioTemplates50Plus = {
    styles: [
        // MINIMALIST SERIES (5)
        { id: 'minimal-clean', name: 'Minimal Clean', accent: '#0099ff', secondary: '#00d9ff', bg: '#0a0a0a' },
        { id: 'minimal-swiss', name: 'Swiss Style', accent: '#333333', secondary: '#666666', bg: '#ffffff' },
        { id: 'minimal-zen', name: 'Zen Design', accent: '#2c3e50', secondary: '#ecf0f1', bg: '#ffffff' },
        { id: 'minimal-stark', name: 'Stark', accent: '#000000', secondary: '#888888', bg: '#f5f5f5' },
        { id: 'minimal-nord', name: 'Nord Theme', accent: '#88c0d0', secondary: '#81a1c1', bg: '#2e3440' },
        
        // EXECUTIVE SERIES (5)
        { id: 'exec-gold', name: 'Executive Gold', accent: '#1a3a52', secondary: '#d4af37', bg: '#f5f5f0' },
        { id: 'exec-navy', name: 'Navy Royal', accent: '#003d82', secondary: '#1e90ff', bg: '#f9fafb' },
        { id: 'exec-burgundy', name: 'Burgundy', accent: '#8b0000', secondary: '#c41e3a', bg: '#faf9f6' },
        { id: 'exec-forest', name: 'Forest', accent: '#1b4332', secondary: '#2d6a4f', bg: '#f1faee' },
        { id: 'exec-slate', name: 'Slate Premium', accent: '#475569', secondary: '#64748b', bg: '#f8fafc' },
        
        // CREATIVE SERIES (5)
        { id: 'creative-vibrant', name: 'Vibrant', accent: '#ff6b9d', secondary: '#feca57', bg: '#0f0f1e' },
        { id: 'creative-sunset', name: 'Sunset', accent: '#ff6b6b', secondary: '#ffd93d', bg: '#fff5e6' },
        { id: 'creative-ocean', name: 'Ocean Wave', accent: '#0077be', secondary: '#00d4ff', bg: '#e8f4f8' },
        { id: 'creative-neon', name: 'Neon Lights', accent: '#ff006e', secondary: '#8338ec', bg: '#0f0f1e' },
        { id: 'creative-gradient', name: 'Gradient Flow', accent: '#667eea', secondary: '#764ba2', bg: '#f5f7fa' },
        
        // TECH SERIES (5)
        { id: 'tech-github', name: 'GitHub Dark', accent: '#30a14e', secondary: '#79c0ff', bg: '#0d1117' },
        { id: 'tech-vscode', name: 'VS Code', accent: '#007acc', secondary: '#dcdcaa', bg: '#1e1e1e' },
        { id: 'tech-hacker', name: 'Hacker Terminal', accent: '#00ff00', secondary: '#00aa00', bg: '#0a0a0a' },
        { id: 'tech-docker', name: 'Docker Blue', accent: '#2496ed', secondary: '#0db7ed', bg: '#0f1419' },
        { id: 'tech-kubernetes', name: 'K8s Cloud', accent: '#326ce5', secondary: '#ffd700', bg: '#1a1a2e' },
        
        // STARTUP SERIES (5)
        { id: 'startup-dynamic', name: 'Dynamic Growth', accent: '#6c5ce7', secondary: '#a29bfe', bg: '#fdcb6e' },
        { id: 'startup-bold', name: 'Bold & Bright', accent: '#0984e3', secondary: '#fab1a0', bg: '#fff5e1' },
        { id: 'startup-energetic', name: 'Energetic', accent: '#e17055', secondary: '#fd79a8', bg: '#f8f9fa' },
        { id: 'startup-thriving', name: 'Thriving', accent: '#10ac84', secondary: '#48dbfb', bg: '#ecf0f1' },
        { id: 'startup-innovate', name: 'Innovate', accent: '#5f27cd', secondary: '#ff9ff3', bg: '#fff3e0' },
        
        // CORPORATE SERIES (5)
        { id: 'corp-ibm', name: 'IBM Blue', accent: '#0f62fe', secondary: '#393939', bg: '#f4f4f4' },
        { id: 'corp-google', name: 'Google Colors', accent: '#1f2937', secondary: '#3b82f6', bg: '#f9fafb' },
        { id: 'corp-microsoft', name: 'Microsoft', accent: '#0078d4', secondary: '#50e6ff', bg: '#f3f3f3' },
        { id: 'corp-amazon', name: 'Amazon Orange', accent: '#ff9900', secondary: '#146eb4', bg: '#f5f5f5' },
        { id: 'corp-linkedin', name: 'LinkedIn Pro', accent: '#0a66c2', secondary: '#0a66c2', bg: '#ececec' },
        
        // ACADEMIC SERIES (5)
        { id: 'acad-research', name: 'Research Paper', accent: '#003d82', secondary: '#0099ff', bg: '#fafafa' },
        { id: 'acad-journal', name: 'Journal', accent: '#1a1a1a', secondary: '#666666', bg: '#ffffff' },
        { id: 'acad-scholar', name: 'Scholar', accent: '#1b4332', secondary: '#74a853', bg: '#f1f1f1' },
        { id: 'acad-formal', name: 'Formal Academic', accent: '#000080', secondary: '#666666', bg: '#f9f9f9' },
        { id: 'acad-elegant', name: 'Elegant', accent: '#2c3e50', secondary: '#8b7355', bg: '#f5f3f0' },
        
        // INDUSTRY-SPECIFIC (5)
        { id: 'ind-finance', name: 'Finance', accent: '#003d5c', secondary: '#ff6b35', bg: '#f0f0f0' },
        { id: 'ind-healthcare', name: 'Healthcare', accent: '#005c99', secondary: '#00cc99', bg: '#f0f9f9' },
        { id: 'ind-legal', name: 'Legal', accent: '#1a1a4d', secondary: '#4d4d99', bg: '#f5f5fa' },
        { id: 'ind-design', name: 'Design', accent: '#ff006e', secondary: '#00d4ff', bg: '#fafafa' },
        { id: 'ind-marketing', name: 'Marketing', accent: '#ff1744', secondary: '#ffb300', bg: '#fff8e1' },
        
        // DARK MODE SERIES (5)
        { id: 'dark-midnight', name: 'Midnight', accent: '#00d9ff', secondary: '#00a8cc', bg: '#0a0e27' },
        { id: 'dark-obsidian', name: 'Obsidian', accent: '#64b5f6', secondary: '#42a5f5', bg: '#121212' },
        { id: 'dark-cosmic', name: 'Cosmic', accent: '#b39ddb', secondary: '#9575cd', bg: '#1a1a2e' },
        { id: 'dark-void', name: 'Void', accent: '#00ff88', secondary: '#00cc66', bg: '#0d0d0d' },
        { id: 'dark-aurora', name: 'Aurora', accent: '#1dd1a1', secondary: '#10ac84', bg: '#1e272e' },
        
        // LIGHT & BRIGHT SERIES (5)
        { id: 'light-sunshine', name: 'Sunshine', accent: '#ffc107', secondary: '#ff9800', bg: '#fffbf0' },
        { id: 'light-fresh', name: 'Fresh', accent: '#4caf50', secondary: '#8bc34a', bg: '#f1f8e9' },
        { id: 'light-aqua', name: 'Aqua', accent: '#00bcd4', secondary: '#009688', bg: '#e0f7fa' },
        { id: 'light-peach', name: 'Peach', accent: '#ff7043', secondary: '#ff5722', bg: '#ffe0b2' },
        { id: 'light-lavender', name: 'Lavender', accent: '#9c27b0', secondary: '#7b1fa2', bg: '#f3e5f5' }
    ],
    
    // ========================================================================
    // GET RANDOM STYLE
    // ========================================================================
    
    getRandomStyle() {
        return this.styles[Math.floor(Math.random() * this.styles.length)];
    },
    
    // ========================================================================
    // GET STYLE BY ID
    // ========================================================================
    
    getStyle(id) {
        return this.styles.find(s => s.id === id) || this.getRandomStyle();
    },
    
    // ========================================================================
    // GET ALL STYLES
    // ========================================================================
    
    getAllStyles() {
        return this.styles;
    },
    
    // ========================================================================
    // GET STYLES BY CATEGORY
    // ========================================================================
    
    getByCategory(categoryPrefix) {
        return this.styles.filter(s => s.id.startsWith(categoryPrefix));
    },
    
    // ========================================================================
    // GENERATE PORTFOLIO HTML
    // ========================================================================
    
    generatePortfolio(profile, styleId = null) {
        const style = styleId ? this.getStyle(styleId) : this.getRandomStyle();
        const { accent, secondary, bg } = style;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${profile.name} - Portfolio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>">
    <style>
        :root {
            --accent: ${accent};
            --secondary: ${secondary};
            --bg: ${bg};
            --text: ${bg === '#ffffff' || bg.startsWith('#f') ? '#1a1a1a' : '#ffffff'};
            --muted: ${bg === '#ffffff' || bg.startsWith('#f') ? '#666666' : '#aaaaaa'};
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: var(--bg); 
            color: var(--text); 
            line-height: 1.6;
            transition: all 0.3s ease;
        }
        
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 2rem;
        }
        
        header { 
            text-align: center; 
            padding: 4rem 2rem; 
            margin-bottom: 2rem;
        }
        
        h1 { 
            font-family: 'Playfair Display', serif;
            font-size: 3rem; 
            color: var(--accent); 
            margin-bottom: 0.5rem;
        }
        
        .subtitle { 
            font-size: 1.3rem; 
            color: var(--secondary); 
            margin-bottom: 1.5rem;
        }
        
        .bio { 
            max-width: 600px; 
            margin: 2rem auto; 
            font-size: 1rem;
            color: var(--muted);
        }
        
        .social { 
            display: flex; 
            justify-content: center; 
            gap: 1.5rem; 
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        
        .social a { 
            color: var(--accent); 
            text-decoration: none;
            font-size: 0.95rem;
            transition: color 0.2s;
        }
        
        .social a:hover { 
            color: var(--secondary);
        }
        
        section { 
            margin: 3rem 0; 
        }
        
        h2 { 
            font-size: 1.8rem;
            color: var(--accent); 
            border-bottom: 3px solid var(--secondary); 
            padding-bottom: 0.5rem; 
            margin-bottom: 1.5rem;
        }
        
        .experience, .skills { 
            display: grid; 
            gap: 1.5rem;
        }
        
        .item { 
            padding: 1.5rem; 
            background: rgba(0, 0, 0, 0.03);
            border-left: 4px solid var(--accent);
            border-radius: 6px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .item h3 { 
            color: var(--secondary); 
            margin-bottom: 0.3rem;
        }
        
        .meta { 
            font-size: 0.9rem; 
            color: var(--muted); 
            margin-bottom: 0.5rem;
        }
        
        .skills { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 1rem;
        }
        
        .skill { 
            background: var(--accent);
            color: white;
            padding: 0.6rem 1.2rem; 
            border-radius: 20px;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        
        .skill:hover {
            background: var(--secondary);
            transform: scale(1.05);
        }
        
        .download-btn {
            display: inline-block;
            background: var(--accent);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            margin: 2rem 0;
            font-weight: 600;
            transition: all 0.2s;
        }
        
        .download-btn:hover {
            background: var(--secondary);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        footer {
            text-align: center;
            padding: 2rem 0;
            border-top: 1px solid var(--secondary);
            color: var(--muted);
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .subtitle { font-size: 1rem; }
            .container { padding: 1rem; }
            header { padding: 2rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>\${profile.name}</h1>
            <div class="subtitle">\${profile.title || 'Professional'}</div>
            <p class="bio">\${profile.summary || 'Innovative professional with expertise in driving results and leading teams to success.'}</p>
            <div class="social">
                \${profile.email ? \`<a href="mailto:\${profile.email}">📧 Email</a>\` : ''}
                \${profile.linkedin ? \`<a href="https://\${profile.linkedin}" target="_blank">💼 LinkedIn</a>\` : ''}
                \${profile.github ? \`<a href="https://\${profile.github}" target="_blank">🐙 GitHub</a>\` : ''}
            </div>
        </header>
        
        \${profile.experience ? \`
        <section>
            <h2>Experience</h2>
            <div class="experience">
                \${profile.experience.map(exp => \`
                    <div class="item">
                        <h3>\${exp.position || ''}</h3>
                        <div class="meta">\${exp.company || ''} • \${exp.year || ''}</div>
                        <p>\${exp.description || ''}</p>
                    </div>
                \`).join('')}
            </div>
        </section>
        \` : ''}
        
        \${profile.skills && profile.skills.length ? \`
        <section>
            <h2>Core Skills</h2>
            <div class="skills">
                \${profile.skills.map(skill => \`<span class="skill">\${skill}</span>\`).join('')}
            </div>
        </section>
        \` : ''}
        
        \${profile.education ? \`
        <section>
            <h2>Education</h2>
            <div class="experience">
                \${profile.education.map(edu => \`<div class="item"><p>\${edu}</p></div>\`).join('')}
            </div>
        </section>
        \` : ''}
        
        <footer>
            <p>📄 <a href="Rajesh_Dammala_Resume.pdf" style="color: var(--accent); text-decoration: none;">⬇ Download Resume</a></p>
            <p>© 2026 \${profile.name}. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>`;
    }
};

window.PortfolioTemplates50Plus = PortfolioTemplates50Plus;
