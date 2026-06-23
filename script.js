// ============================================================================
// MAIN APPLICATION ORCHESTRATION
// ============================================================================

// Guard against double-loading
if (typeof window._scriptLoaded !== 'undefined') { } else {
window._scriptLoaded = true;

console.log('=== Resume Engine Pro Script Loaded ===');

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

let currentUser = null;
let currentProfile = null;
let selectedAIProvider = 'openai';
let selectedMode = 'smart';
let generatedResume = null;

console.log('Script variables initialized');

// ============================================================================
// HEALTH CHECK
// ============================================================================

function runHealthCheck() {
    console.log('=== HEALTH CHECK STARTING ===');
    
    const requiredModules = ['StorageManager', 'GitHubManager', 'ResumeParser', 'ProfileManager', 'AIIntegration', 'CostCalculator', 'PortfolioTemplates', 'ResumeTemplates', 'JobTrackerManager', 'Generator'];
    
    const results = {};
    for (const mod of requiredModules) {
        const exists = typeof window[mod] !== 'undefined';
        results[mod] = exists;
        console.log(`${mod}: ${exists ? '✅ LOADED' : '❌ MISSING'}`);
    }
    
    const functionChecks = {
        'initiateGitHubLogin': typeof initiateGitHubLogin === 'function',
        'handleLogin': typeof handleLogin === 'function',
        'initializeApp': typeof initializeApp === 'function',
        'showPage': typeof showPage === 'function',
    };
    
    for (const [funcName, exists] of Object.entries(functionChecks)) {
        console.log(`${funcName}(): ${exists ? '✅ AVAILABLE' : '❌ MISSING'}`);
    }
    
    console.log('=== HEALTH CHECK COMPLETE ===');
    return { modules: results, functions: functionChecks };
}

// Run health check when page loads
window.addEventListener('load', () => {
    console.log('PAGE LOAD EVENT FIRED');
    runHealthCheck();
    
    // Also setup button event listeners as backup
    const githubBtn = document.querySelector('button[onclick*="initiateGitHubLogin"]');
    if (githubBtn) {
        console.log('GitHub button found, adding event listener');
        githubBtn.addEventListener('click', (e) => {
            console.log('GitHub button clicked via event listener');
            initiateGitHubLogin();
        });
    } else {
        console.warn('GitHub button not found in DOM');
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeApp() {
    console.log('Initializing Resume Engine Pro');
    
    // Verify all required modules are loaded
    const requiredModules = ['StorageManager', 'GitHubManager', 'ResumeParser', 'ProfileManager'];
    const missingModules = requiredModules.filter(mod => typeof window[mod] === 'undefined');
    
    if (missingModules.length > 0) {
        console.error('Missing modules:', missingModules);
        alert('ERROR: Required modules not loaded: ' + missingModules.join(', ') + '\nPlease refresh the page.');
        return;
    }
    
    console.log('All modules loaded successfully');
    
    // Load any existing session
    const session = await GitHubManager.loadSession();
    console.log('Session load result:', session);
    
    if (session.success) {
        console.log('Session found, showing app');
        showPage('appPage');
        currentUser = session.user;
        updateUI();
        // ✅ RESTORE PREVIOUSLY ACTIVE TAB AFTER SESSION RELOAD
        restoreActiveTab();
        
        // ✅ VERIFY CONTENT IS ACTUALLY VISIBLE
        setTimeout(() => {
            const appPage = document.getElementById('appPage');
            const content = document.querySelector('.main-tab-content.active');
            console.log('Post-init check - appPage.active:', appPage?.classList.contains('active'));
            console.log('Post-init check - active content exists:', !!content);
            if (!content) {
                console.warn('⚠️ No active content div found! Forcing dashboard tab.');
                switchMainTab('dashboard');
            }
        }, 100);
    } else {
        console.log('No session, showing login');
        showPage('loginPage');
    }
}

// ============================================================================
// PAGE NAVIGATION
// ============================================================================

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageName);
    if (page) page.classList.add('active');
}

function switchMainTab(tabName) {
    try {
        if (!tabName || typeof tabName !== 'string') {
            console.error(`❌ Invalid tab name: ${tabName}`);
            return;
        }
        
        console.log(`📌 Switching to tab: "${tabName}"`);
        
        // Remove active class from ALL tabs and buttons
        const allTabs = document.querySelectorAll('.main-tab-content');
        const allButtons = document.querySelectorAll('.main-tab-btn');
        
        allTabs.forEach(tab => {
            tab.classList.remove('active');
            // Verify removal
            if (tab.classList.contains('active')) {
                console.warn(`⚠️ Failed to remove active from ${tab.id}`);
            }
        });
        
        allButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate the target content div
        const content = document.getElementById(tabName);
        if (content) {
            content.classList.add('active');
            // Verify it was added
            if (!content.classList.contains('active')) {
                console.error(`❌ Failed to add active class to ${tabName}`);
            } else {
                console.log(`✅ Tab content activated: ${tabName}`);
            }
        } else {
            console.error(`❌ Content div not found: id="${tabName}"`);
            return;
        }
        
        // Find and activate the button
        let buttonFound = false;
        allButtons.forEach(btn => {
            const onclick = btn.getAttribute('onclick') || '';
            if (onclick.includes(`'${tabName}'`) || onclick.includes(`"${tabName}"`)) {
                btn.classList.add('active');
                buttonFound = true;
                console.log(`✅ Tab button activated: ${tabName}`);
            }
        });
        
        if (!buttonFound) {
            console.warn(`⚠️ No button found for tab: ${tabName}`);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('activeMainTab', tabName);
        } catch (e) {
            console.warn(`⚠️ localStorage blocked: ${e.message}`);
        }
        
        // Initialize tracker if needed
        if (tabName === 'applications' && window.initializeTracker) {
            initializeTracker();
            // PHASE 8: Initialize voice recording
            if (window.initVoiceRecording) {
                initVoiceRecording();
            }
        }
    } catch (error) {
        console.error(`❌ switchMainTab error: ${error.message}`);
    }
}

// ============================================================================
// RESTORE ACTIVE TAB ON PAGE LOAD
// ============================================================================

function restoreActiveTab() {
    try {
        // ✅ RETRIEVE SAVED TAB FROM LOCALSTORAGE (non-blocking)
        let savedTab = null;
        try {
            savedTab = localStorage.getItem('activeMainTab');
            console.log(`🔄 Retrieved from localStorage: ${savedTab}`);
        } catch (storageError) {
            console.warn(`⚠️ localStorage blocked (tracking prevention?): ${storageError.message}`);
            savedTab = null;
        }
        
        const tabToActivate = savedTab || 'dashboard';
        console.log(`🔄 Restoring tab: ${tabToActivate} (savedTab was: ${savedTab})`);
        
        if (!tabToActivate || typeof tabToActivate !== 'string') {
            console.error(`❌ Invalid tab name: ${tabToActivate}, using dashboard`);
            switchMainTab('dashboard');
            return;
        }
        
        // Switch to the saved tab (or dashboard if none saved)
        switchMainTab(tabToActivate);
    } catch (error) {
        // Generic fallback - just default to dashboard
        console.error(`❌ restoreActiveTab error: ${error.message}`);
        switchMainTab('dashboard');
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

function initiateGitHubLogin() {
    console.log('======== GITHUB LOGIN INITIATED ========');
    console.log('GitHubManager available:', typeof window.GitHubManager !== 'undefined');
    console.log('Checking window keys:', Object.keys(window).filter(k => k.includes('GitHub') || k.includes('github')).slice(0, 5));
    
    try {
        // Verify GitHubManager is loaded
        if (typeof window.GitHubManager === 'undefined') {
            console.error('❌ CRITICAL: GitHubManager is undefined');
            alert('ERROR: GitHubManager module not loaded.\n\nPlease:\n1. Open DevTools (F12)\n2. Check Console for errors\n3. Hard refresh (Ctrl+Shift+R)\n\nIf errors persist, GitHub button cannot work.');
            return;
        }
        
        console.log('✅ GitHubManager is available');
        
        // Show token input modal (replaces prompt() for better compatibility)
        showGitHubTokenModal();
        
    } catch (error) {
        console.error('❌ initiateGitHubLogin error:', error);
        console.error('Error stack:', error.stack);
        alert('Login error: ' + error.message);
    }
}

// Modal-based token input (replaces unsupported prompt() function)
function showGitHubTokenModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="githubTokenModal" class="github-token-modal">
            <div class="github-token-modal-content">
                <button class="github-token-modal-close" onclick="closeGitHubTokenModal()">✕</button>
                <h2>GitHub Authentication</h2>
                <p>Enter your GitHub Personal Access Token to continue:</p>
                
                <div class="github-token-input-group">
                    <label for="githubTokenInput">Personal Access Token</label>
                    <input type="password" id="githubTokenInput" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                           class="github-token-input"
                           onkeypress="if(event.key==='Enter') submitGitHubToken()">
                </div>
                
                <div class="github-token-help">
                    <p><strong>How to create a token:</strong></p>
                    <ol>
                        <li>Go to <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a></li>
                        <li>Click "Generate new token (classic)"</li>
                        <li>Select scopes: <code>repo</code>, <code>gist</code>, <code>user</code></li>
                        <li>Copy and paste the token here</li>
                    </ol>
                </div>
                
                <div class="github-token-actions">
                    <button class="github-token-submit" onclick="submitGitHubToken()">Sign In</button>
                    <button class="github-token-cancel" onclick="closeGitHubTokenModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Create modal and inject into DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Show modal with animation
    const modal = document.getElementById('githubTokenModal');
    setTimeout(() => modal.classList.add('visible'), 10);
    
    // Focus input field
    document.getElementById('githubTokenInput').focus();
    
    console.log('GitHub token modal displayed');
}

function submitGitHubToken() {
    const token = document.getElementById('githubTokenInput').value;
    console.log('Token submitted:', !!token);
    
    if (!token || token.trim() === '') {
        alert('Please enter your GitHub token');
        return;
    }
    
    closeGitHubTokenModal();
    console.log('Calling handleLogin with token');
    handleLogin(token);
}

function closeGitHubTokenModal() {
    const modal = document.getElementById('githubTokenModal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }
}

async function handleLogin(token) {
    console.log('handleLogin called with token');
    if (!token) {
        alert('Please enter your GitHub Personal Access Token');
        return;
    }
    
    try {
        console.log('Authenticating with GitHubManager...');
        const result = await GitHubManager.authenticate(token);
        console.log('Authentication result:', result);
        
        if (result.success) {
            console.log('Authentication successful, updating UI');
            currentUser = result.user;
            showPage('appPage');
            updateUI();
            // ✅ RESTORE PREVIOUSLY ACTIVE TAB
            restoreActiveTab();
            
            // ✅ VERIFY CONTENT IS VISIBLE
            setTimeout(() => {
                const appPage = document.getElementById('appPage');
                const content = document.querySelector('.main-tab-content.active');
                console.log('Post-login check - appPage.active:', appPage?.classList.contains('active'));
                console.log('Post-login check - active content exists:', !!content);
                if (!content) {
                    console.warn('⚠️ No active content div! Forcing dashboard tab.');
                    switchMainTab('dashboard');
                }
            }, 100);
            console.log('Login complete');
        } else {
            console.error('Authentication failed:', result.error);
            alert('Authentication failed: ' + (result.error || 'Invalid token'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Close settings menu
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) settingsMenu.style.display = 'none';
        
        GitHubManager.logout();
        currentUser = null;
        showPage('loginPage');
        updateUI();
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userDisplay = document.getElementById('userDisplay');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (currentUser || GitHubManager.isAuthenticated()) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'inline-block';
        if (userDisplay) userDisplay.textContent = `👤 ${GitHubManager.getUsername() || 'User'}`;
    } else {
        // User is logged out
        if (loginBtn) loginBtn.style.display = 'block';
        if (settingsBtn) settingsBtn.style.display = 'none';
        if (userDisplay) userDisplay.textContent = '';
    }
}

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

async function handleProfileUpload() {
    const fileInput = document.getElementById('profileUpload');
    if (!fileInput.files.length) {
        alert('Please select a file');
        return;
    }
    
    try {
        const file = fileInput.files[0];
        const profile = await ResumeParser.parseFile(file);
        
        // Save to storage
        StorageManager.saveProfile(profile);
        
        alert('Profile uploaded successfully!');
        displayProfiles();
        fileInput.value = '';
    } catch (error) {
        alert('Error uploading profile: ' + error.message);
    }
}

function displayProfiles() {
    const profiles = StorageManager.getAllProfiles();
    const container = document.getElementById('profilesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const id in profiles) {
        const profile = profiles[id];
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <h4>${profile.name || 'Untitled'}</h4>
            <div class="profile-detail">
                <span>Email:</span>
                <span>${profile.email || 'N/A'}</span>
            </div>
            <div class="profile-detail">
                <span>Skills:</span>
                <span>${profile.skills?.length || 0}</span>
            </div>
            <div class="profile-card-buttons">
                <button class="btn btn-secondary" onclick="selectProfile('${id}')">Use</button>
                <button class="btn btn-danger" onclick="deleteProfile('${id}')">Delete</button>
            </div>
        `;
        container.appendChild(card);
    }
}

function selectProfile(id) {
    currentProfile = StorageManager.getProfile(id);
    alert(`Selected profile: ${currentProfile.name}`);
}

function deleteProfile(id) {
    if (confirm('Delete this profile?')) {
        StorageManager.deleteProfile(id);
        displayProfiles();
    }
}

// ============================================================================
// GENERATION
// ============================================================================

async function handleGenerateSingleResume() {
    if (!currentProfile) {
        alert('Please select a profile first');
        return;
    }
    
    const jdInput = document.getElementById('jdInput')?.value;
    if (!jdInput) {
        alert('Please enter the job description');
        return;
    }
    
    try {
        const result = await Generator.generateResume(
            currentProfile,
            jdInput,
            selectedAIProvider,
            selectedMode
        );
        
        if (result.success) {
            generatedResume = result;
            displayGenerationResult(result);
            
            // Save to history
            StorageManager.saveGeneration({
                type: 'resume',
                profile: currentProfile.name,
                provider: selectedAIProvider,
                mode: selectedMode,
                cost: result.cost
            });
        } else {
            alert('Generation failed: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function displayGenerationResult(result) {
    const statusBox = document.getElementById('statusContent');
    if (statusBox) {
        statusBox.innerHTML = `
            <div style="color: #00cc00;">✓ Resume generated successfully!</div>
            <div style="margin-top: 1rem; font-size: 0.9rem;">
                <div>Provider: ${result.provider}</div>
                <div>Cost: $${result.cost.toFixed(4)}</div>
            </div>
        `;
    }
}

function downloadGeneratedResume() {
    if (!generatedResume?.docx) {
        alert('No resume generated yet');
        return;
    }
    
    const filename = `${currentProfile.name}_Resume.docx`;
    Generator.downloadFile(generatedResume.docx, filename);
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

function updateCostEstimate() {
    const count = parseInt(document.getElementById('bulkCount')?.value || '1');
    const cost = AIIntegration.getCost(selectedAIProvider, selectedMode) * count;
    const costDisplay = document.getElementById('costDisplay');
    
    if (costDisplay) {
        costDisplay.innerHTML = `
            <strong>Estimated Cost: $${cost.toFixed(4)}</strong><br>
            <small>Provider: ${AIIntegration.providers[selectedAIProvider].name}</small>
        `;
    }
}

// ============================================================================
// AI PROVIDER SETUP
// ============================================================================

async function saveAPIKey(provider) {
    const keyInput = document.getElementById(`${provider}Key`);
    if (!keyInput || !keyInput.value) {
        alert('Please enter an API key');
        return;
    }
    
    try {
        AIIntegration.setAPIKey(provider, keyInput.value);
        alert(`${provider} API key saved`);
        updateAPIKeyStatus();
        keyInput.value = '';
    } catch (error) {
        alert('Error saving API key: ' + error.message);
    }
}

function updateAPIKeyStatus() {
    const providers = AIIntegration.getConfigured();
    const statusDiv = document.getElementById('apiKeyStatus');
    
    if (statusDiv) {
        statusDiv.innerHTML = Object.entries(providers)
            .map(([id, info]) => `<div class="ai-status-item"><span>${info.name}</span><span class="ai-status-badge badge-connected">✓ Configured</span></div>`)
            .join('');
    }
}

// ============================================================================
// SETTINGS
// ============================================================================

async function setupGitHubDataRepo() {
    const repoName = document.getElementById('dataRepoName')?.value || 'resume-engine-data';
    
    if (!GitHubManager.isAuthenticated()) {
        alert('Please login with GitHub first');
        return;
    }
    
    try {
        const result = await GitHubManager.createDataRepository(repoName);
        if (result.success) {
            await GitHubManager.initializeFolderStructure(repoName);
            alert('Data repository created and initialized!');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============================================================================
// HISTORY
// ============================================================================

function displayHistory() {
    const history = StorageManager.getHistory(50);
    const container = document.getElementById('historyList');
    if (!container) return;
    
    container.innerHTML = '';
    
    history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <h4>${item.profile}</h4>
            <p>Provider: ${item.provider}</p>
            <p>Mode: ${item.mode}</p>
            <p>Cost: $${item.cost?.toFixed(4) || '0.00'}</p>
            <p style="font-size: 0.8rem; color: #808080;">${new Date(item.generatedAt).toLocaleString()}</p>
        `;
        container.appendChild(card);
    });
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateUI() {
    if (currentUser) {
        const userDisplay = document.querySelector('.user-display');
        if (userDisplay) {
            userDisplay.textContent = `👤 ${currentUser.login}`;
        }
    }
    
    updateAPIKeyStatus();
    displayProfiles();
    displayHistory();
    updateStats();
}

function updateStats() {
    const stats = StorageManager.getStats();
    const statsDiv = document.getElementById('statsContainer');
    
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div class="dashboard-card">
                <h3>Profiles</h3>
                <div class="stat-item">
                    <span>Total Profiles:</span>
                    <span class="stat-value">${stats.profiles}</span>
                </div>
            </div>
            <div class="dashboard-card">
                <h3>Generations</h3>
                <div class="stat-item">
                    <span>Total Generated:</span>
                    <span class="stat-value">${stats.history}</span>
                </div>
            </div>
            <div class="dashboard-card">
                <h3>Storage</h3>
                <div class="stat-item">
                    <span>Used:</span>
                    <span class="stat-value">${stats.storageUsed}</span>
                </div>
            </div>
        `;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// ============================================================================
// SETTINGS MODAL
// ============================================================================

function openProfileCreation() {
    switchMainTab('profiles');
}

function generateSingleResume() {
    const profileSelect = document.querySelector('select[id*="profile"]');
    if (!profileSelect || profileSelect.value === '' || profileSelect.value === '-- Select a profile --') {
        alert('Please select a profile first');
        return;
    }
    alert('Resume generation started... (Feature coming soon)');
}

function generateBulkResumes() {
    alert('Bulk generation feature coming soon');
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
}

function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Close settings menu when clicking outside
window.addEventListener('click', (e) => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenu && !settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsMenu.style.display = 'none';
    }
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    // Tab switching
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchMainTab(tabName);
        });
    });
    
    // PHASE 8: Voice note button listener
    const voiceNoteBtn = document.getElementById('voiceNoteBtn');
    if (voiceNoteBtn) {
        voiceNoteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const editId = document.getElementById('contactEditId').value;
            if (editId) {
                openVoiceModal(parseInt(editId));
            }
        });
    }
    
    // Modal close handlers (click outside modal)
    window.addEventListener('click', (e) => {
        const settingsModal = document.getElementById('settingsModal');
        const appModal = document.getElementById('applicationModal');
        const contactModal = document.getElementById('contactModal');
        const voiceModal = document.getElementById('voiceModal');
        
        if (e.target === settingsModal) closeSettings();
        if (e.target === appModal && typeof closeApplicationModal !== 'undefined') closeApplicationModal();
        if (e.target === contactModal && typeof closeContactModal !== 'undefined') closeContactModal();
        if (e.target === voiceModal && typeof closeVoiceModal !== 'undefined') closeVoiceModal();
    });
    
    // AI Provider selection
    document.querySelectorAll('[data-provider]').forEach(btn => {
        btn.addEventListener('click', function() {
            selectedAIProvider = this.dataset.provider;
            updateCostEstimate();
        });
    });
    
    // Mode selection
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', function() {
            selectedMode = this.dataset.mode;
            updateCostEstimate();
        });
    });
});

// ============================================================================
// UTILITIES
// ============================================================================

function formatCost(cost) {
    return `$${parseFloat(cost).toFixed(2)}`;
}

// Lightweight non-blocking toast notification (replaces alert() for UX consistency)
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

// ============================================================================
// PROFILE MANAGEMENT HANDLERS
// ============================================================================

function openProfileCreation() {
    // Toggle the profile creation form
    const profileCreation = document.getElementById('profileCreation');
    if (profileCreation) {
        profileCreation.style.display = profileCreation.style.display === 'none' ? 'block' : 'none';
    }
}

function switchProfileTab(tabName) {
    // Hide all profile methods
    document.querySelectorAll('.profile-method').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.profile-method').forEach(el => el.style.display = 'none');
    
    // Remove active class from tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected method
    const method = document.getElementById(`${tabName}Method`);
    if (method) {
        method.classList.add('active');
        method.style.display = 'block';
    }
    
    // Mark tab button as active
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    console.log('File selected:', file.name);
    alert('Resume parsing starting for: ' + file.name + ' (Implementation coming soon)');
}

// ============================================================================
// RESUME GENERATION HANDLERS
// ============================================================================

function generateSingleResume() {
    const profileSelect = document.querySelector('select[value]');
    if (!profileSelect || profileSelect.value === '' || profileSelect.value === '-- Select a profile --') {
        alert('Please select a profile first');
        return;
    }
    alert('Resume generation started... (Feature coming soon)');
}

function generateBulkResumes() {
    alert('Bulk generation feature coming soon');
}

// ============================================================================
// GENERATOR MODE HANDLERS
// ============================================================================

function switchGeneratorMode(mode) {
    // Hide all modes
    document.getElementById('singleMode').style.display = 'none';
    document.getElementById('bulkMode').style.display = 'none';
    
    // Remove active class from buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected mode
    if (mode === 'single') {
        document.getElementById('singleMode').style.display = 'block';
        document.querySelector('.mode-btn:first-of-type').classList.add('active');
    } else if (mode === 'bulk') {
        document.getElementById('bulkMode').style.display = 'block';
        document.querySelector('.mode-btn:nth-of-type(2)').classList.add('active');
    }
}

function switchJDInput(type) {
    document.getElementById('pasteJD').style.display = 'none';
    document.getElementById('urlJD').style.display = 'none';
    
    document.querySelectorAll('.input-tab').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'paste') {
        document.getElementById('pasteJD').style.display = 'block';
        event.target.classList.add('active');
    } else if (type === 'url') {
        document.getElementById('urlJD').style.display = 'block';
        event.target.classList.add('active');
    }
}

function loadProfileData() {
    const select = document.getElementById('selectProfile');
    if (select && select.value) {
        console.log('Loading profile:', select.value);
    }
}

}

