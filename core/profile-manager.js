// ============================================================================
// PROFILE MANAGER - Handle user resume profiles
// ============================================================================

const ProfileManager = {
    async parseResume(file) {
        const text = await file.text();
        
        // Simple extraction - extract lines with common patterns
        const lines = text.split('\n');
        const profile = {
            id: Date.now().toString(),
            name: this.extractName(lines),
            email: this.extractEmail(lines),
            phone: this.extractPhone(lines),
            linkedin: this.extractLinkedIn(lines),
            github: this.extractGitHub(lines),
            experience: this.extractExperience(lines),
            skills: this.extractSkills(lines),
            education: this.extractEducation(lines),
            rawText: text
        };
        
        return profile;
    },
    
    extractName(lines) {
        for (const line of lines) {
            if (line.length < 50 && line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)) {
                return line.trim();
            }
        }
        return '';
    },
    
    extractEmail(lines) {
        const match = lines.find(l => l.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/));
        return match ? match.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)[0] : '';
    },
    
    extractPhone(lines) {
        const match = lines.find(l => l.match(/\+?[\d\s\(\)\-]{10,}/));
        return match ? match.trim() : '';
    },
    
    extractLinkedIn(lines) {
        const match = lines.find(l => l.toLowerCase().includes('linkedin'));
        return match || '';
    },
    
    extractGitHub(lines) {
        const match = lines.find(l => l.toLowerCase().includes('github'));
        return match || '';
    },
    
    extractExperience(lines) {
        const exp = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/\d{4}/)) {
                exp.push(lines[i]);
            }
        }
        return exp.slice(0, 5);
    },
    
    extractSkills(lines) {
        const skillsLine = lines.find(l => l.toLowerCase().includes('skill'));
        return skillsLine ? skillsLine.split(':')[1]?.split(',').map(s => s.trim()) || [] : [];
    },
    
    extractEducation(lines) {
        const edu = [];
        const keywords = ['university', 'college', 'degree', 'diploma', 'bachelor', 'master'];
        for (const line of lines) {
            if (keywords.some(k => line.toLowerCase().includes(k))) {
                edu.push(line);
            }
        }
        return edu.slice(0, 3);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}

window.ProfileManager = ProfileManager;
