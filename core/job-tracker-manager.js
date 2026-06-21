// ============================================================================
// JOB TRACKER MANAGER - Job application & networking contact management
// ============================================================================

const JobTrackerManager = {
    APP_KEY: 'resumeEngineProV1_applications',
    CONTACT_KEY: 'resumeEngineProV1_contacts',
    META_KEY: 'resumeEngineProV1_tracker_meta',
    
    // Default applications (from your existing tracker)
    defaultApps: [
        { id:1, portfolio:'RD-Profile', role:'Technical Support Director', company:'Boulevard', date:'2026-06-10', link:'https://rdammala.github.io/RD-Profile/', status:'Applied', comments:'' },
        { id:2, portfolio:'Senior-Incident-Manager', role:'Senior Incident Manager', company:'Amazon Prime Video', date:'2026-06-11', link:'https://rdammala.github.io/Senior-Incident-Manager/', status:'Applied', comments:'' },
        { id:3, portfolio:'Staff-Escalation-Manager', role:'Staff Escalation Manager', company:'Snowflake', date:'2026-06-12', link:'https://rdammala.github.io/Staff-Escalation-Manager/', status:'Applied', comments:'' },
        { id:4, portfolio:'Technical-Lead-Deployment-Operations', role:'Technical Lead, Deployment Operations', company:'OpenAI', date:'2026-06-13', link:'https://rdammala.github.io/Technical-Lead-Deployment-Operations/', status:'Applied', comments:'' },
        { id:5, portfolio:'Manager-Cloud-Support', role:'Manager, Cloud Support Engineering', company:'Cox Enterprises / RapidScale', date:'2026-06-14', link:'https://rdammala.github.io/Manager-Cloud-Support/', status:'Denied', comments:'Application denied due to no visa sponsorship; candidate on H1B.' },
        { id:6, portfolio:'Senior-Manager-SRE', role:'Senior Manager, Site Reliability Engineering', company:'NVIDIA', date:'2026-06-14', link:'https://rdammala.github.io/Senior-Manager-SRE/', status:'Applied', comments:'' }
    ],
    
    genericResumes: [
        { name: 'RD-Profile', desc: 'Technical Support Director', url: 'https://rdammala.github.io/RD-Profile/', icon: '🏗️' }
    ],
    
    // ========================================================================
    // LOAD & SAVE
    // ========================================================================
    
    loadApplications() {
        const stored = StorageManager.get('applications', false);
        if (!stored) {
            const apps = [...this.defaultApps];
            this.saveApplications(apps);
            return apps;
        }
        
        // Merge new default apps with stored ones
        const byPortfolio = new Map(stored.map(a => [a.portfolio, a]));
        this.defaultApps.forEach(d => {
            if (!byPortfolio.has(d.portfolio)) {
                stored.push(d);
            }
        });
        
        this.saveApplications(stored);
        return stored;
    },
    
    saveApplications(apps) {
        StorageManager.set('applications', apps);
        this.markLastUpdated();
    },
    
    loadContacts() {
        return StorageManager.get('contacts', false) || [];
    },
    
    saveContacts(contacts) {
        StorageManager.set('contacts', contacts);
        this.markLastUpdated();
    },
    
    // ========================================================================
    // APPLICATION OPERATIONS
    // ========================================================================
    
    addApplication(app) {
        const apps = this.loadApplications();
        app.id = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
        apps.push(app);
        this.saveApplications(apps);
        return app;
    },
    
    updateApplication(id, updates) {
        const apps = this.loadApplications();
        const index = apps.findIndex(a => a.id === id);
        if (index !== -1) {
            apps[index] = { ...apps[index], ...updates };
            this.saveApplications(apps);
            return apps[index];
        }
        return null;
    },
    
    deleteApplication(id) {
        const apps = this.loadApplications();
        const filtered = apps.filter(a => a.id !== id);
        this.saveApplications(filtered);
        return true;
    },
    
    getApplications() {
        return this.loadApplications();
    },
    
    // ========================================================================
    // CONTACT OPERATIONS
    // ========================================================================
    
    addContact(contact) {
        const contacts = this.loadContacts();
        contact.id = contacts.length ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
        contact.created = new Date().toISOString().split('T')[0];
        contacts.push(contact);
        this.saveContacts(contacts);
        return contact;
    },
    
    updateContact(id, updates) {
        const contacts = this.loadContacts();
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            contacts[index] = { ...contacts[index], ...updates };
            this.saveContacts(contacts);
            return contacts[index];
        }
        return null;
    },
    
    deleteContact(id) {
        const contacts = this.loadContacts();
        const filtered = contacts.filter(c => c.id !== id);
        this.saveContacts(filtered);
        return true;
    },
    
    getContacts() {
        return this.loadContacts();
    },
    
    // ========================================================================
    // SEARCH & FILTER
    // ========================================================================
    
    searchApplications(query) {
        const apps = this.loadApplications();
        const q = query.toLowerCase();
        return apps.filter(a => {
            const searchFields = [a.portfolio, a.role, a.company, a.comments].map(f => (f || '').toLowerCase());
            return searchFields.some(f => f.includes(q));
        });
    },
    
    filterApplicationsByStatus(status) {
        const apps = this.loadApplications();
        if (!status) return apps;
        return apps.filter(a => a.status === status);
    },
    
    searchContacts(query) {
        const contacts = this.loadContacts();
        const q = query.toLowerCase();
        return contacts.filter(c => {
            const searchFields = [c.name, c.company, c.email, c.comments, c.source].map(f => (f || '').toLowerCase());
            return searchFields.some(f => f.includes(q));
        });
    },
    
    // ========================================================================
    // STATISTICS
    // ========================================================================
    
    getStats() {
        const apps = this.loadApplications();
        return {
            total: apps.length,
            applied: apps.filter(a => a.status === 'Applied').length,
            interviewing: apps.filter(a => a.status === 'Interviewing').length,
            offered: apps.filter(a => a.status === 'Offered').length,
            rejected: apps.filter(a => ['Rejected', 'Denied'].includes(a.status)).length,
            contacts: this.loadContacts().length
        };
    },
    
    // ========================================================================
    // PORTFOLIO GUIDE
    // ========================================================================
    
    getPortfolioGuide() {
        const apps = this.loadApplications();
        const portfolioMap = new Map();
        
        apps.forEach(app => {
            if (!portfolioMap.has(app.portfolio)) {
                portfolioMap.set(app.portfolio, {
                    name: app.portfolio,
                    url: app.link,
                    count: 0
                });
            }
            portfolioMap.get(app.portfolio).count++;
        });
        
        return Array.from(portfolioMap.values()).sort((a, b) => b.count - a.count);
    },
    
    // ========================================================================
    // EXPORT & IMPORT
    // ========================================================================
    
    export() {
        const data = {
            applications: this.loadApplications(),
            contacts: this.loadContacts(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },
    
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.applications) {
                this.saveApplications(data.applications);
            }
            if (data.contacts) {
                this.saveContacts(data.contacts);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // SYNC WITH GITHUB
    // ========================================================================
    
    async syncToGitHub(repoName) {
        if (!GitHubManager.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const appsBlob = JSON.stringify(this.loadApplications(), null, 2);
            const contactsBlob = JSON.stringify(this.loadContacts(), null, 2);
            
            await GitHubManager.pushFile(
                repoName,
                'applications.json',
                appsBlob,
                'Sync applications to GitHub'
            );
            
            await GitHubManager.pushFile(
                repoName,
                'contacts.json',
                contactsBlob,
                'Sync contacts to GitHub'
            );
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // UTILITY
    // ========================================================================
    
    extractGitHubRepoUrl(portfolioLink) {
        if (!portfolioLink) return null;
        const match = portfolioLink.match(/github\.io\/([^\/]+)/);
        return match && match[1] ? `https://github.com/rdammala/${match[1]}` : null;
    },
    
    markLastUpdated() {
        const meta = { lastUpdatedMs: Date.now() };
        StorageManager.set('trackerMeta', meta);
    },
    
    getLastUpdated() {
        const meta = StorageManager.get('trackerMeta', false) || {};
        if (!meta.lastUpdatedMs) return null;
        
        const dt = new Date(meta.lastUpdatedMs);
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(dt);
    }
};

window.JobTrackerManager = JobTrackerManager;
