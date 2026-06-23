// ============================================================================
// RESUME PARSER - Parse and extract resume data
// ============================================================================

const ResumeParser = {
    async parseFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext === 'txt') {
            return this.parseTXT(file);
        } else if (ext === 'pdf') {
            return this.parsePDF(file);
        } else if (ext === 'docx') {
            return this.parseDOCX(file);
        }
        
        throw new Error('Unsupported file format');
    },
    
    async parseTXT(file) {
        const text = await file.text();
        return this.extractFromText(text);
    },
    
    async parsePDF(file) {
        // PDF parsing requires pdf.js library
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        
        return this.extractFromText(text);
    },
    
    async parseDOCX(file) {
        // DOCX parsing requires JSZip library
        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();
        const zipData = await zip.loadAsync(arrayBuffer);
        const xmlContent = await zipData.file('word/document.xml').async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        const paragraphs = xmlDoc.querySelectorAll('w\\:p');
        let text = '';
        
        paragraphs.forEach(p => {
            const runs = p.querySelectorAll('w\\:r');
            let paragraphText = '';
            runs.forEach(r => {
                const textElements = r.querySelectorAll('w\\:t');
                textElements.forEach(t => {
                    paragraphText += t.textContent;
                });
            });
            text += paragraphText + '\n';
        });
        
        return this.extractFromText(text);
    },
    
    extractFromText(text) {
        const lines = text.split('\n').filter(l => l.trim());
        
        return {
            id: Date.now().toString(),
            name: this.extractName(lines),
            email: this.extractEmail(lines),
            phone: this.extractPhone(lines),
            linkedin: this.extractLinkedIn(text),
            github: this.extractGitHub(text),
            summary: this.extractSummary(lines),
            experience: this.extractExperience(text),
            skills: this.extractSkills(text),
            education: this.extractEducation(text),
            certifications: this.extractCertifications(text),
            languages: this.extractLanguages(text),
            rawText: text
        };
    },
    
    extractName(lines) {
        return lines.find(l => l.match(/^[A-Z][a-z]+ [A-Z][a-z]+/))?.trim() || '';
    },
    
    extractEmail(lines) {
        const match = lines.find(l => l.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/));
        return match ? match.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)[0] : '';
    },
    
    extractPhone(lines) {
        const match = lines.find(l => l.match(/\+?[\d\s\(\)\-]{10,}/));
        return match?.trim() || '';
    },
    
    extractLinkedIn(text) {
        const match = text.match(/linkedin\.com\/in\/[\w-]+/i);
        return match ? match[0] : '';
    },
    
    extractGitHub(text) {
        const match = text.match(/github\.com\/[\w-]+/i);
        return match ? match[0] : '';
    },
    
    extractSummary(lines) {
        const summaryIdx = lines.findIndex(l => l.toLowerCase().includes('summary') || l.toLowerCase().includes('professional'));
        return summaryIdx !== -1 ? lines.slice(summaryIdx + 1, summaryIdx + 4).join(' ') : '';
    },
    
    extractExperience(text) {
        const experience = [];
        const expPattern = /([A-Z][a-zA-Z ]+)\s+(\d{4})[^.]*?(?=[A-Z][a-zA-Z ]+\s+\d{4}|$)/gs;
        const matches = text.matchAll(expPattern);
        
        for (const match of matches) {
            experience.push({
                position: match[1].trim(),
                year: match[2]
            });
        }
        
        return experience.slice(0, 5);
    },
    
    extractSkills(text) {
        const skillsIdx = text.toLowerCase().indexOf('skill');
        if (skillsIdx === -1) return [];
        
        const skillsText = text.substring(skillsIdx, skillsIdx + 500);
        const skills = skillsText.split(/[,;\n]/)
            .slice(1, 11)
            .map(s => s.trim())
            .filter(s => s.length > 2);
        
        return skills;
    },
    
    extractEducation(text) {
        const education = [];
        const eduKeywords = ['university', 'college', 'degree', 'diploma', 'bachelor', 'master', 'phd'];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (eduKeywords.some(kw => line.toLowerCase().includes(kw))) {
                education.push(line.trim());
            }
        }
        
        return education.slice(0, 3);
    },
    
    extractCertifications(text) {
        const certLines = [];
        const certKeywords = ['certification', 'certified', 'certificate'];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (certKeywords.some(kw => line.toLowerCase().includes(kw))) {
                certLines.push(line.trim());
            }
        }
        
        return certLines.slice(0, 3);
    },
    
    extractLanguages(text) {
        const languages = [];
        const langKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'portuguese', 'hindi'];
        
        for (const lang of langKeywords) {
            if (text.toLowerCase().includes(lang)) {
                languages.push(lang.charAt(0).toUpperCase() + lang.slice(1));
            }
        }
        
        return languages;
    }
};

window.ResumeParser = ResumeParser;
