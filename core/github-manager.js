// ============================================================================
// GITHUB MANAGER - Handle GitHub API operations (using direct fetch API)
// ============================================================================

const GitHubManager = {
    token: null,
    user: null,
    baseUrl: 'https://api.github.com',
    
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    
    async authenticate(token) {
        try {
            if (!token || token.trim() === '') {
                return { success: false, error: 'Token is empty' };
            }
            
            this.token = token;
            
            // Test token by fetching authenticated user
            const response = await fetch(`${this.baseUrl}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    return { success: false, error: 'Invalid token. Please check your GitHub Personal Access Token.' };
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const user = await response.json();
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
        this.token = null;
        this.user = null;
        StorageManager.deleteAPIKey('github');
        StorageManager.remove('githubUser');
    },
    
    isAuthenticated() {
        return !!this.token && !!this.user;
    },
    
    getUsername() {
        return this.user?.login || null;
    },
    
    getUser() {
        return this.user;
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
                const response = await fetch(`${this.baseUrl}/repos/${this.user.login}/${repoName}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (response.ok) {
                    return { success: true, exists: true, repoName };
                }
            } catch (e) {
                // Repo doesn't exist
            }
            
            // Create new repository
            const response = await fetch(`${this.baseUrl}/user/repos`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: 'Resume Engine Pro - Resume data, profiles, and generated files',
                    private: true,
                    has_wiki: false,
                    has_projects: false,
                    has_downloads: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create repo: ${response.statusText}`);
            }
            
            const repo = await response.json();
            
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
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Try to get existing file SHA
            let sha = null;
            try {
                const getResponse = await fetch(
                    `${this.baseUrl}/repos/${this.user.login}/${repoName}/contents/${path}`,
                    {
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // File doesn't exist
            }
            
            // Create or update file
            const response = await fetch(
                `${this.baseUrl}/repos/${this.user.login}/${repoName}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: message,
                        content: encodedContent,
                        ...(sha && { sha })
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to push file: ${response.statusText}`);
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
            // Get file SHA
            const getResponse = await fetch(
                `${this.baseUrl}/repos/${this.user.login}/${repoName}/contents/${path}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (!getResponse.ok) {
                throw new Error(`File not found: ${path}`);
            }
            
            const fileData = await getResponse.json();
            
            // Delete file
            const response = await fetch(
                `${this.baseUrl}/repos/${this.user.login}/${repoName}/contents/${path}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: message,
                        sha: fileData.sha
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to delete file: ${response.statusText}`);
            }
            
            return { success: true, path };
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
                content: `# Resume Engine Pro - Data Repository\n\nThis repository contains your resume profiles, generated resumes, and portfolios.\n\nGenerated: ${new Date().toISOString()}` 
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
                const response = await fetch(`${this.baseUrl}/repos/${this.user.login}/${portfolioName}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    // Update existing
                    await this.pushFile(portfolioName, 'index.html', htmlContent, 'Update portfolio');
                    return { success: true, created: false, repoName: portfolioName };
                }
            } catch (e) {
                // Repo doesn't exist, create it
            }
            
            // Create new repository
            const createResponse = await fetch(`${this.baseUrl}/user/repos`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: portfolioName,
                    description: `Portfolio - ${portfolioName}`,
                    private: false,
                    has_wiki: false,
                    has_projects: false
                })
            });
            
            if (!createResponse.ok) {
                throw new Error(`Failed to create repo: ${createResponse.statusText}`);
            }
            
            const repo = await createResponse.json();
            
            // Push index.html
            await this.pushFile(portfolioName, 'index.html', htmlContent, 'Initial portfolio');
            
            // Enable GitHub Pages
            await this.enableGitHubPages(portfolioName);
            
            return { success: true, created: true, repo, url: `https://${this.user.login}.github.io/${portfolioName}/` };
        } catch (error) {
            console.error('Portfolio creation error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async enableGitHubPages(repoName) {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.user.login}/${repoName}/pages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        source: {
                            branch: 'main',
                            path: '/'
                        }
                    })
                }
            );
            
            return response.ok;
        } catch (error) {
            console.warn('GitHub Pages setup error:', error);
            return false;
        }
    }
};
