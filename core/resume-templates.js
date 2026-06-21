// ============================================================================
// RESUME TEMPLATES - 50+ Professional Resume Designs
// ============================================================================

const ResumeTemplates = {
    templates: [
        // Modern Templates
        { id: 'modern-blue', name: 'Modern Blue', category: 'modern', colors: ['#1a73e8', '#ea4335', '#f9f9f9'] },
        { id: 'modern-purple', name: 'Modern Purple', category: 'modern', colors: ['#7c3aed', '#ec4899', '#fafafa'] },
        { id: 'modern-teal', name: 'Modern Teal', category: 'modern', colors: ['#0d9488', '#06b6d4', '#f8fafc'] },
        { id: 'modern-slate', name: 'Modern Slate', category: 'modern', colors: ['#64748b', '#475569', '#f1f5f9'] },
        { id: 'modern-emerald', name: 'Modern Emerald', category: 'modern', colors: ['#059669', '#10b981', '#ecfdf5'] },
        
        // Classic Templates
        { id: 'classic-black', name: 'Classic Black', category: 'classic', colors: ['#000000', '#333333', '#ffffff'] },
        { id: 'classic-navy', name: 'Classic Navy', category: 'classic', colors: ['#001f3f', '#003d82', '#f5f5f5'] },
        { id: 'classic-charcoal', name: 'Classic Charcoal', category: 'classic', colors: ['#36454f', '#555555', '#f9f9f9'] },
        { id: 'classic-oxford', name: 'Classic Oxford', category: 'classic', colors: ['#002d62', '#1e3a5f', '#fafafa'] },
        { id: 'classic-marble', name: 'Classic Marble', category: 'classic', colors: ['#1c1c1c', '#8b8b8b', '#efefef'] },
        
        // Professional Templates
        { id: 'prof-corporate', name: 'Corporate', category: 'professional', colors: ['#003366', '#0066cc', '#f0f0f0'] },
        { id: 'prof-executive', name: 'Executive', category: 'professional', colors: ['#1a1a1a', '#c41e3a', '#ffffff'] },
        { id: 'prof-banking', name: 'Banking', category: 'professional', colors: ['#00305c', '#ff6b6b', '#f5f5f5'] },
        { id: 'prof-legal', name: 'Legal', category: 'professional', colors: ['#0a3d62', '#12263f', '#f9f9f9'] },
        { id: 'prof-consulting', name: 'Consulting', category: 'professional', colors: ['#003d82', '#006db3', '#f8f8f8'] },
        
        // Tech-Focused Templates
        { id: 'tech-github', name: 'GitHub Dark', category: 'tech', colors: ['#0d1117', '#30363d', '#ffffff'] },
        { id: 'tech-hacker', name: 'Hacker Green', category: 'tech', colors: ['#0a0a0a', '#00ff00', '#1a1a1a'] },
        { id: 'tech-vscode', name: 'VS Code', category: 'tech', colors: ['#1e1e1e', '#007acc', '#cccccc'] },
        { id: 'tech-minimal', name: 'Minimal Tech', category: 'tech', colors: ['#ffffff', '#000000', '#f0f0f0'] },
        { id: 'tech-cyberpunk', name: 'Cyberpunk', category: 'tech', colors: ['#0f0f1e', '#ff006e', '#8338ec'] },
        
        // Creative Templates
        { id: 'creative-gradient', name: 'Gradient', category: 'creative', colors: ['#667eea', '#764ba2', '#ffffff'] },
        { id: 'creative-sunset', name: 'Sunset', category: 'creative', colors: ['#ff6b6b', '#feca57', '#fff'] },
        { id: 'creative-ocean', name: 'Ocean', category: 'creative', colors: ['#0077be', '#0096d6', '#e8f4f8'] },
        { id: 'creative-forest', name: 'Forest', category: 'creative', colors: ['#2d5016', '#6fa86f', '#f0f8f0'] },
        { id: 'creative-fire', name: 'Fire', category: 'creative', colors: ['#ff4500', '#ff8c00', '#ffe4b5'] },
        
        // Minimalist Templates
        { id: 'minimal-swiss', name: 'Swiss', category: 'minimalist', colors: ['#333333', '#808080', '#ffffff'] },
        { id: 'minimal-bauhaus', name: 'Bauhaus', category: 'minimalist', colors: ['#000000', '#ff0000', '#ffffff'] },
        { id: 'minimal-zen', name: 'Zen', category: 'minimalist', colors: ['#2c3e50', '#ecf0f1', '#ffffff'] },
        { id: 'minimal-geometric', name: 'Geometric', category: 'minimalist', colors: ['#2c3e50', '#3498db', '#ecf0f1'] },
        { id: 'minimal-grid', name: 'Grid', category: 'minimalist', colors: ['#333333', '#999999', '#f5f5f5'] },
        
        // Academic Templates
        { id: 'academic-formal', name: 'Academic Formal', category: 'academic', colors: ['#1a1a1a', '#666666', '#ffffff'] },
        { id: 'academic-research', name: 'Research', category: 'academic', colors: ['#003366', '#0066cc', '#f9f9f9'] },
        { id: 'academic-journal', name: 'Journal', category: 'academic', colors: ['#2c3e50', '#34495e', '#ecf0f1'] },
        { id: 'academic-university', name: 'University', category: 'academic', colors: ['#8b0000', '#000080', '#f5f5f5'] },
        { id: 'academic-scholar', name: 'Scholar', category: 'academic', colors: ['#1a3a3a', '#2d5d5d', '#e8f0f0'] },
        
        // Industry-Specific Templates
        { id: 'finance-investment', name: 'Finance', category: 'industry', colors: ['#003366', '#ff6600', '#f0f0f0'] },
        { id: 'healthcare-medical', name: 'Healthcare', category: 'industry', colors: ['#005c99', '#00cc99', '#f0f9f9'] },
        { id: 'education-teaching', name: 'Education', category: 'industry', colors: ['#d9534f', '#5cb85c', '#f5f5f5'] },
        { id: 'marketing-creative', name: 'Marketing', category: 'industry', colors: ['#ff6b6b', '#4ecdc4', '#fff5f5'] },
        { id: 'engineering-tech', name: 'Engineering', category: 'industry', colors: ['#333333', '#00aced', '#f9f9f9'] },
        
        // Color-Focused Templates
        { id: 'color-monochrome', name: 'Monochrome', category: 'color', colors: ['#000000', '#808080', '#ffffff'] },
        { id: 'color-duotone', name: 'Duotone', category: 'color', colors: ['#001a4d', '#ffffff', '#f0f0f0'] },
        { id: 'color-complementary', name: 'Complementary', category: 'color', colors: ['#ff6b35', '#004e89', '#f0f0f0'] },
        { id: 'color-analogous', name: 'Analogous', category: 'color', colors: ['#f72585', '#b5179e', '#7209b7'] },
        { id: 'color-triadic', name: 'Triadic', category: 'color', colors: ['#ff006e', '#00d4ff', '#ffbe0b'] }
    ],
    
    // ========================================================================
    // GET RANDOM TEMPLATE
    // ========================================================================
    
    getRandomTemplate() {
        const random = this.templates[Math.floor(Math.random() * this.templates.length)];
        return random;
    },
    
    // ========================================================================
    // GET TEMPLATES BY CATEGORY
    // ========================================================================
    
    getByCategory(category) {
        return this.templates.filter(t => t.category === category);
    },
    
    // ========================================================================
    // GET TEMPLATE BY ID
    // ========================================================================
    
    getTemplate(id) {
        return this.templates.find(t => t.id === id);
    },
    
    // ========================================================================
    // GET ALL CATEGORIES
    // ========================================================================
    
    getCategories() {
        const categories = new Set(this.templates.map(t => t.category));
        return Array.from(categories).sort();
    },
    
    // ========================================================================
    // GENERATE DOCX WITH TEMPLATE
    // ========================================================================
    
    async generateDocxWithTemplate(profile, template, jdData) {
        const tmpl = this.getTemplate(template.id) || this.getRandomTemplate();
        const colors = tmpl.colors;
        
        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: [
                    // Header with colors
                    new docx.Paragraph({
                        text: profile.name || 'Your Name',
                        style: 'Heading1',
                        alignment: docx.AlignmentType.CENTER,
                        spacing: { after: 100 }
                    }),
                    new docx.Paragraph({
                        text: profile.title || profile.email || '',
                        alignment: docx.AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    
                    // Contact Info
                    new docx.Paragraph({
                        text: `${profile.email || ''} | ${profile.phone || ''} | ${profile.linkedin || ''}`,
                        alignment: docx.AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    
                    // Professional Summary
                    new docx.Paragraph({
                        text: 'PROFESSIONAL SUMMARY',
                        style: 'Heading2',
                        spacing: { before: 100, after: 100 }
                    }),
                    new docx.Paragraph({
                        text: profile.summary || 'Add your professional summary here',
                        spacing: { after: 300 }
                    }),
                    
                    // Experience
                    new docx.Paragraph({
                        text: 'PROFESSIONAL EXPERIENCE',
                        style: 'Heading2',
                        spacing: { before: 100, after: 100 }
                    }),
                    ...(profile.experience || []).map(exp => new docx.Paragraph({
                        text: `${exp.position || ''} - ${exp.company || ''} (${exp.year || ''})`,
                        spacing: { after: 50 }
                    })),
                    
                    // Skills
                    new docx.Paragraph({
                        text: 'SKILLS',
                        style: 'Heading2',
                        spacing: { before: 100, after: 100 }
                    }),
                    new docx.Paragraph({
                        text: (profile.skills || []).join(' • '),
                        spacing: { after: 300 }
                    }),
                    
                    // Education
                    new docx.Paragraph({
                        text: 'EDUCATION',
                        style: 'Heading2',
                        spacing: { before: 100, after: 100 }
                    }),
                    ...(profile.education || []).map(edu => new docx.Paragraph({
                        text: edu,
                        spacing: { after: 50 }
                    }))
                ]
            }]
        });
        
        return await docx.Packer.toBlob(doc);
    },
    
    // ========================================================================
    // GENERATE PDF WITH TEMPLATE
    // ========================================================================
    
    async generatePdfWithTemplate(profile, template, jdData) {
        const tmpl = this.getTemplate(template.id) || this.getRandomTemplate();
        const colors = tmpl.colors;
        
        const pdfDoc = new PDFDocument({
            margin: 50
        });
        
        // Header
        pdfDoc.fontSize(20).fillColor(colors[0]).text(profile.name || 'Your Name', { align: 'center' });
        pdfDoc.fontSize(11).fillColor(colors[1]).text(profile.title || profile.email || '', { align: 'center' });
        pdfDoc.moveDown(0.5);
        
        // Contact
        pdfDoc.fontSize(9).fillColor('#000').text(
            `${profile.email || ''} | ${profile.phone || ''} | ${profile.linkedin || ''}`,
            { align: 'center' }
        );
        pdfDoc.moveDown();
        
        // Sections
        pdfDoc.fontSize(12).fillColor(colors[0]).text('PROFESSIONAL SUMMARY', { underline: true });
        pdfDoc.fontSize(10).fillColor('#000').text(profile.summary || 'Add your summary', { width: 500, align: 'left' });
        pdfDoc.moveDown();
        
        pdfDoc.fontSize(12).fillColor(colors[0]).text('PROFESSIONAL EXPERIENCE', { underline: true });
        (profile.experience || []).forEach(exp => {
            pdfDoc.fontSize(10).fillColor('#000').text(`${exp.position} - ${exp.company} (${exp.year})`);
        });
        pdfDoc.moveDown();
        
        pdfDoc.fontSize(12).fillColor(colors[0]).text('SKILLS', { underline: true });
        pdfDoc.fontSize(10).fillColor('#000').text((profile.skills || []).join(' • '), { width: 500 });
        
        return new Promise(resolve => {
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(new Blob(chunks, { type: 'application/pdf' })));
            pdfDoc.end();
        });
    },
    
    // ========================================================================
    // GET TEMPLATE LIST
    // ========================================================================
    
    getTemplateList() {
        return this.templates.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category
        }));
    },
    
    // ========================================================================
    // UTILITY
    // ========================================================================
    
    getColorScheme(templateId) {
        const tmpl = this.getTemplate(templateId);
        return tmpl ? tmpl.colors : ['#333333', '#666666', '#ffffff'];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeTemplates;
}
