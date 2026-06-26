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
        // PDF parsing requires pdf.js library. Reconstruct line breaks from the
        // vertical position of each text item so section parsing works.
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageLines = [];
            let line = '';
            let lastY = null;
            for (const item of content.items) {
                const y = Math.round(item.transform[5]);
                if (lastY !== null && Math.abs(y - lastY) > 2) {
                    if (line.trim()) pageLines.push(line.trim());
                    line = '';
                }
                line += item.str + (item.str.endsWith(' ') ? '' : ' ');
                lastY = y;
            }
            if (line.trim()) pageLines.push(line.trim());
            text += pageLines.join('\n') + '\n';
        }

        return this.extractFromText(text);
    },
    
    async parseDOCX(file) {
        // DOCX parsing requires JSZip library. We extract text directly from the
        // document XML with a namespace-proof regex pass — DOM CSS selectors like
        // 'w\\:p' are unreliable across browsers for namespaced XML and silently
        // returned nothing for some Word files.
        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();
        const zipData = await zip.loadAsync(arrayBuffer);
        const docFile = zipData.file('word/document.xml');
        if (!docFile) {
            throw new Error('This does not look like a valid Word .docx (no document.xml). If it is an older .doc, re-save it as .docx, PDF, or TXT.');
        }
        const xmlContent = await docFile.async('string');
        const text = this.docxXmlToText(xmlContent);
        if (!text.trim()) {
            throw new Error('No readable text found in this Word file — it may be image-only or empty. Try exporting it to PDF or TXT.');
        }
        return this.extractFromText(text);
    },

    // Convert raw WordprocessingML into plain text. Paragraph/row/break tags
    // become newlines, tabs/cells become spaces, all other tags are stripped,
    // and XML entities are decoded.
    docxXmlToText(xml) {
        return String(xml || '')
            .replace(/<w:p\b[^>]*\/>/g, '\n')   // empty paragraphs
            .replace(/<\/w:p>/g, '\n')
            .replace(/<w:br\b[^>]*\/?>/g, '\n')
            .replace(/<\/w:tr>/g, '\n')
            .replace(/<w:tab\b[^>]*\/?>/g, '\t')
            .replace(/<\/w:tc>/g, ' ')
            .replace(/<[^>]+>/g, '')            // drop every remaining tag
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
            .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    },

    
    extractFromText(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const sections = this.splitSections(lines);

        return {
            id: Date.now().toString(),
            name: this.extractName(lines),
            email: this.extractEmail(lines),
            phone: this.extractPhone(lines),
            linkedin: this.extractLinkedIn(text),
            github: this.extractGitHub(text),
            summary: this.extractSummary(sections, lines),
            experience: this.extractExperience(sections),
            skills: this.extractSkills(sections, text),
            education: this.extractEducation(sections, lines),
            certifications: this.extractCertifications(text),
            languages: this.extractLanguages(text),
            rawText: text
        };
    },

    // Split a flat list of lines into labelled sections based on common resume
    // headers. A header is a short line that starts with a known keyword.
    splitSections(lines) {
        const headerMap = [
            { key: 'summary', re: /^(professional\s+summary|career\s+summary|summary|profile|objective|about\s+me|about)\b/i },
            { key: 'experience', re: /^(work\s+experience|professional\s+experience|employment(\s+history)?|work\s+history|experience)\b/i },
            { key: 'education', re: /^(education(\s+&?\s*training)?|academic(\s+background)?)\b/i },
            { key: 'skills', re: /^(technical\s+skills|core\s+competenc(?:ies|y)|key\s+skills|areas\s+of\s+expertise|skills(\s*&\s*\w+)?|technologies|competencies)\b/i },
            { key: 'certifications', re: /^(certifications?|licenses?\s*&?\s*certifications?|licenses?)\b/i },
            { key: 'projects', re: /^(projects?|key\s+projects|selected\s+projects)\b/i }
        ];
        const sections = { _preamble: [] };
        let current = '_preamble';
        for (const line of lines) {
            let matched = null;
            if (line.length <= 60) {
                for (const h of headerMap) {
                    if (h.re.test(line)) { matched = h.key; break; }
                }
            }
            if (matched) {
                current = matched;
                if (!sections[current]) sections[current] = [];
                // Capture any trailing content on the same line (e.g. "Skills: a, b, c")
                const rest = line.replace(/^[^:]*:?\s*/, '').trim();
                const headerOnly = headerMap.some(h => h.re.test(line) && line.replace(h.re, '').replace(/[:\s]/g, '').length === 0);
                if (!headerOnly && rest && rest.toLowerCase() !== line.toLowerCase()) {
                    sections[current].push(rest);
                }
            } else {
                if (!sections[current]) sections[current] = [];
                sections[current].push(line);
            }
        }
        return sections;
    },

    extractName(lines) {
        for (const raw of lines.slice(0, 8)) {
            const t = raw.trim();
            if (!t) continue;
            if (/@|https?:|www\.|linkedin|github|\d{3}/i.test(t)) continue;
            const words = t.split(/\s+/);
            if (words.length >= 2 && words.length <= 5 && /^[A-Za-z][A-Za-z.,'-]*$/.test(words[0])) {
                return t.replace(/\s{2,}/g, ' ');
            }
        }
        return (lines[0] || '').trim();
    },

    extractSummary(sections, lines) {
        if (sections.summary && sections.summary.length) {
            return sections.summary.join(' ').trim();
        }
        // Fallback: first substantial paragraph after the contact block
        const candidate = (lines || []).slice(1).find(l =>
            l.length > 60 && !/@|https?:|www\.|\d{3}[\s\-)]/.test(l));
        return candidate || '';
    },

    extractExperience(sections) {
        const block = sections.experience || [];
        if (!block.length) return [];

        const entries = [];
        let cur = null;
        const isHeader = (l) =>
            !/^[-•*\u2022]/.test(l) && (
                /\b(19|20)\d{2}\b/.test(l) ||                 // contains a year
                /\b(present|current)\b/i.test(l) ||
                / (at|@|\u2013|\u2014|\|) /.test(l)           // "Title at Company" / separators
            );

        for (const line of block) {
            if (isHeader(line)) {
                if (cur) entries.push(cur);
                cur = { position: line.replace(/\s{2,}/g, ' ').trim(), description: '' };
            } else {
                const clean = line.replace(/^[-•*\u2022]\s*/, '').trim();
                if (!cur) cur = { position: '', description: '' };
                cur.description += (cur.description ? '\n' : '') + clean;
            }
        }
        if (cur) entries.push(cur);

        // If nothing was detected as a header, keep the whole block as one entry
        if (!entries.length) {
            entries.push({ position: '', description: block.join('\n') });
        }
        return entries.slice(0, 8);
    },

    extractSkills(sections, text) {
        let raw = '';
        if (sections.skills && sections.skills.length) {
            raw = sections.skills.join(', ');
        } else {
            const idx = text.toLowerCase().indexOf('skill');
            if (idx !== -1) raw = text.substring(idx, idx + 400);
        }
        if (!raw) return [];
        const skills = raw
            .split(/[,;|\n•\u2022\u2023\u25CF]+/)
            .map(s => s.replace(/^[-•*\s]+/, '').trim())
            .filter(s => s.length > 1 && s.length < 40 && !/^skills?\b/i.test(s));
        // De-duplicate, preserve order
        return [...new Set(skills)].slice(0, 30);
    },

    extractEducation(sections, lines) {
        const block = sections.education && sections.education.length
            ? sections.education
            : (lines || []).filter(l =>
                /\b(university|college|institute|b\.?\s?tech|m\.?\s?tech|bachelor|master|ph\.?d|degree|diploma|b\.?sc|m\.?sc|mba|b\.?e\b|m\.?e\b)\b/i.test(l));
        return block.map(l => l.trim()).filter(Boolean).slice(0, 5);
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
