// ============================================================================
// GITHUB MANAGER - Handle GitHub API operations
// ============================================================================

const GitHubManager = {
    octokit: null,
    user: null,
    
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    
    async authenticate(token) {
        try {
            // Check if Octokit is loaded - try different namespaces
            let OctokitLib = null;
            if (typeof Octokit !== 'undefined' && Octokit.Octokit) {
                OctokitLib = Octokit.Octokit;
            } else if (typeof Octokit !== 'undefined') {
                OctokitLib = Octokit;
            } else if (typeof window.Octokit !== 'undefined') {
                OctokitLib = window.Octokit;
            } else {
                console.error('Octokit library not loaded');
                return { success: false, error: 'Octokit library not loaded. Please refresh the page.' };
            }
            
            this.octokit = new OctokitLib({ auth: token });
            const { data: user } = await this.octokit.rest.users.getAuthenticated();
            this.user = user;
            
            StorageManager.set('githubUser', user);
            StorageManager.saveAPIKey('github', token, true);
            
            return { success: true, user };
        } catch (error) {
            console.error('GitHub auth error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async loadSession() {
        const token = StorageManager.getAPIKey('github');
        if (token) {
            return await this.authenticate(token);
        }
        return { success: false };
    },
    
    logout() {
        this.octokit = null;
        this.user = null;
        StorageManager.deleteAPIKey('github');
        StorageManager.remove('githubUser');
    },
    
    isAuthenticated() {
        return !!this.octokit && !!this.user;
    },
    
    // ========================================================================
    // REPOSITORY OPERATIONS
    // ========================================================================
    
    async createDataRepository(repoName) {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            // Check if repo already exists
            try {
                await this.octokit.rest.repos.get({
                    owner: this.user.login,
                    repo: repoName
                });
                return { success: true, exists: true, repoName };
            } catch (e) {
                // Repo doesn't exist, create it
            }
            
            const { data: repo } = await this.octokit.rest.repos.createForAuthenticatedUser({
                name: repoName,
                description: 'Resume Engine Pro - Resume data, profiles, and generated files',
                private: true,
                has_wiki: false,
                has_projects: false,
                has_downloads: false
            });
            
            StorageManager.saveGithubConfig({
                dataRepoName: repoName,
                dataRepoUrl: repo.html_url
            });
            
            return { success: true, repo };
        } catch (error) {
            console.error('Repo creation error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // FILE OPERATIONS
    // ========================================================================
    
    async pushFile(repoName, path, content, message = 'Auto-update from Resume Engine Pro') {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const encodedContent = btoa(content);
            
            try {
                // Try to get existing file to get its SHA
                const { data: existing } = await this.octokit.rest.repos.getContent({
                    owner: this.user.login,
                    repo: repoName,
                    path: path
                });
                
                // Update existing file
                await this.octokit.rest.repos.createOrUpdateFileContents({
                    owner: this.user.login,
                    repo: repoName,
                    path: path,
                    message: message,
                    content: encodedContent,
                    sha: existing.sha
                });
            } catch (e) {
                // File doesn't exist, create it
                await this.octokit.rest.repos.createOrUpdateFileContents({
                    owner: this.user.login,
                    repo: repoName,
                    path: path,
                    message: message,
                    content: encodedContent
                });
            }
            
            return { success: true, path };
        } catch (error) {
            console.error('File push error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async deleteFile(repoName, path, message = 'Delete from Resume Engine Pro') {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const { data: file } = await this.octokit.rest.repos.getContent({
                owner: this.user.login,
                repo: repoName,
                path: path
            });
            
            await this.octokit.rest.repos.deleteFile({
                owner: this.user.login,
                repo: repoName,
                path: path,
                message: message,
                sha: file.sha
            });
            
            return { success: true };
        } catch (error) {
            console.error('File delete error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // FOLDER STRUCTURE SETUP
    // ========================================================================
    
    async initializeFolderStructure(repoName) {
        const structure = [
            { path: 'profiles/.gitkeep', content: '' },
            { path: 'generated/.gitkeep', content: '' },
            { path: 'portfolios/.gitkeep', content: '' },
            { 
                path: 'README.md', 
                content: `# Resume Engine Pro - Data Repository

This repository contains your resume profiles, generated resumes, cover letters, and portfolios.

## Structure
- \`profiles/\` - Your resume profiles (JSON format)
- \`generated/\` - Generated resumes, cover letters, and job details
- \`portfolios/\` - Portfolio websites for GitHub Pages

## Privacy
This repository is set to PRIVATE. Only you can view your resume data.

**Generated at:** ${new Date().toISOString()}
**Generator:** Resume Engine Pro v1.0
` 
            }
        ];
        
        for (const file of structure) {
            await this.pushFile(repoName, file.path, file.content, 'Initialize folder structure');
        }
        
        return { success: true };
    },
    
    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================
    
    async pushBatchFiles(repoName, files, baseMessage = 'Batch upload') {
        const results = [];
        
        for (const file of files) {
            const result = await this.pushFile(
                repoName,
                file.path,
                file.content,
                `${baseMessage} - ${file.name}`
            );
            results.push(result);
        }
        
        return { success: results.every(r => r.success), results };
    },
    
    // ========================================================================
    // PORTFOLIO DEPLOYMENT
    // ========================================================================
    
    async createPortfolioRepo(portfolioName, htmlContent) {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            // Check if repo exists
            try {
                const existing = await this.octokit.rest.repos.get({
                    owner: this.user.login,
                    repo: portfolioName
                });
                
                // Update existing
                await this.pushFile(portfolioName, 'index.html', htmlContent, 'Update portfolio');
            } catch {
                // Create new repo
                await this.octokit.rest.repos.createForAuthenticatedUser({
                    name: portfolioName,
                    description: `Portfolio - ${portfolioName}`,
                    private: false,
                    has_wiki: false,
                    has_projects: false
                });
                
                // Push files
                await this.pushFile(portfolioName, 'index.html', htmlContent, 'Initial portfolio');
                await this.pushFile(
                    portfolioName,
                    'README.md',
                    `# ${portfolioName}\n\nPortfolio generated by Resume Engine Pro`
                );
            }
            
            // Enable GitHub Pages
            try {
                await this.octokit.rest.repos.createPagesSite({
                    owner: this.user.login,
                    repo: portfolioName,
                    source: { branch: 'main', path: '/' }
                });
            } catch (e) {
                // GitHub Pages might already be enabled
                console.log('Pages might already be enabled:', e.message);
            }
            
            const portfolioUrl = `https://${this.user.login}.github.io/${portfolioName}/`;
            return { success: true, url: portfolioUrl };
        } catch (error) {
            console.error('Portfolio repo creation error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    
    getUsername() {
        return this.user?.login || null;
    },
    
    getUser() {
        return this.user || null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubManager;
}
