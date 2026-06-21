// ============================================================================
// STORAGE MANAGER - Handle LocalStorage, Encryption, and Syncing
// ============================================================================

const StorageManager = {
    PREFIX: 'resumeEngineProV1_',
    
    // ========================================================================
    // BASIC STORAGE OPERATIONS
    // ========================================================================
    
    set(key, value, encrypt = false) {
        try {
            const fullKey = this.PREFIX + key;
            let data = typeof value === 'string' ? value : JSON.stringify(value);
            
            if (encrypt) {
                data = this.encrypt(data);
            }
            
            localStorage.setItem(fullKey, data);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },
    
    get(key, decrypt = false) {
        try {
            const fullKey = this.PREFIX + key;
            let data = localStorage.getItem(fullKey);
            
            if (!data) return null;
            
            if (decrypt) {
                data = this.decrypt(data);
            }
            
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } catch (error) {
            console.error('Storage retrieval error:', error);
            return null;
        }
    },
    
    remove(key) {
        try {
            const fullKey = this.PREFIX + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Storage removal error:', error);
            return false;
        }
    },
    
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },
    
    // ========================================================================
    // ENCRYPTION / DECRYPTION (Simple XOR - browser only, use API in production)
    // ========================================================================
    
    encrypt(text) {
        // In production, use proper encryption library
        // For MVP, using simple encoding
        return btoa(text);
    },
    
    decrypt(text) {
        try {
            return atob(text);
        } catch {
            return text;
        }
    },
    
    // ========================================================================
    // PROFILE STORAGE
    // ========================================================================
    
    saveProfile(profile) {
        const profiles = this.get('profiles', false) || {};
        profiles[profile.id] = {
            ...profile,
            savedAt: new Date().toISOString()
        };
        return this.set('profiles', profiles);
    },
    
    getProfile(id) {
        const profiles = this.get('profiles', false) || {};
        return profiles[id] || null;
    },
    
    getAllProfiles() {
        return this.get('profiles', false) || {};
    },
    
    deleteProfile(id) {
        const profiles = this.get('profiles', false) || {};
        delete profiles[id];
        return this.set('profiles', profiles);
    },
    
    // ========================================================================
    // GENERATION HISTORY
    // ========================================================================
    
    saveGeneration(generation) {
        const history = this.get('history', false) || [];
        history.unshift({
            ...generation,
            generatedAt: new Date().toISOString()
        });
        // Keep only last 100 entries
        const trimmed = history.slice(0, 100);
        return this.set('history', trimmed);
    },
    
    getHistory(limit = 50) {
        const history = this.get('history', false) || [];
        return history.slice(0, limit);
    },
    
    // ========================================================================
    // API KEYS (ENCRYPTED)
    // ========================================================================
    
    saveAPIKey(provider, key, encrypted = true) {
        const keys = this.get('apiKeys', false) || {};
        keys[provider] = {
            key: encrypted ? this.encrypt(key) : key,
            savedAt: new Date().toISOString(),
            encrypted: encrypted
        };
        return this.set('apiKeys', keys);
    },
    
    getAPIKey(provider) {
        const keys = this.get('apiKeys', false) || {};
        const entry = keys[provider];
        if (!entry) return null;
        
        return entry.encrypted ? this.decrypt(entry.key) : entry.key;
    },
    
    getAllAPIKeys() {
        const keys = this.get('apiKeys', false) || {};
        const result = {};
        for (const provider in keys) {
            result[provider] = {
                hasKey: !!keys[provider].key,
                savedAt: keys[provider].savedAt
            };
        }
        return result;
    },
    
    deleteAPIKey(provider) {
        const keys = this.get('apiKeys', false) || {};
        delete keys[provider];
        return this.set('apiKeys', keys);
    },
    
    // ========================================================================
    // GITHUB CONFIGURATION
    // ========================================================================
    
    saveGithubConfig(config) {
        return this.set('githubConfig', config);
    },
    
    getGithubConfig() {
        return this.get('githubConfig', false) || {};
    },
    
    // ========================================================================
    // EXPORT / IMPORT
    // ========================================================================
    
    export() {
        const data = {
            profiles: this.get('profiles', false),
            history: this.get('history', false),
            githubConfig: this.get('githubConfig', false),
            apiKeysHashes: this.getAllAPIKeys(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },
    
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.profiles) {
                this.set('profiles', data.profiles);
            }
            if (data.githubConfig) {
                this.set('githubConfig', data.githubConfig);
            }
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },
    
    // ========================================================================
    // USAGE STATISTICS
    // ========================================================================
    
    getStats() {
        const profiles = Object.keys(this.getAllProfiles()).length;
        const history = this.getHistory().length;
        const apiKeys = Object.keys(this.getAllAPIKeys()).length;
        
        return {
            profiles,
            history,
            apiKeys,
            storageUsed: this.getStorageUsed()
        };
    },
    
    getStorageUsed() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith(this.PREFIX)) {
                total += localStorage[key].length;
            }
        }
        return (total / 1024 / 1024).toFixed(2) + ' MB';
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
