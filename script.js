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
let parsedResumeProfile = null;

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

        // Render profile cards when entering My Profiles
        if (tabName === 'profiles' && typeof displayProfiles === 'function') {
            displayProfiles();
        }

        // Populate profile dropdowns when entering the Generate tab
        if (tabName === 'generator' && typeof populateProfileSelects === 'function') {
            populateProfileSelects();
        }

        // Render AI provider settings (keys + custom provider) when entering Settings
        if (tabName === 'settings' && typeof renderAISettings === 'function') {
            renderAISettings();
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
    if (!currentProfile) {
        showToast('Profile not found', 'error');
        return;
    }
    // Go to the Generate tab, populate the dropdowns, and preselect this profile
    switchMainTab('generator');
    populateProfileSelects(id);
    showToast(`Using profile: ${currentProfile.displayName || currentProfile.name}`, 'success');
}

// Fill the Single + Bulk profile dropdowns from saved profiles.
// Optionally preselect a given profile id.
function populateProfileSelects(selectedId) {
    const profiles = StorageManager.getAllProfiles();
    const ids = Object.keys(profiles);
    const optionsHtml = ['<option value="">-- Select a profile --</option>']
        .concat(ids.map(id => {
            const p = profiles[id];
            const label = p.displayName || p.name || 'Untitled';
            return `<option value="${id}">${label}</option>`;
        })).join('');

    ['selectProfile', 'bulkProfile'].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        sel.innerHTML = optionsHtml;
        if (selectedId && profiles[selectedId]) {
            sel.value = selectedId;
        }
    });

    // Keep currentProfile in sync with the single-resume dropdown
    if (selectedId && profiles[selectedId]) {
        currentProfile = profiles[selectedId];
    }
}
window.populateProfileSelects = populateProfileSelects;

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
    
    // Tab switching is handled by inline onclick="switchMainTab('...')" on each
    // .main-tab-btn. No extra listener needed here (a previous data-tab based
    // listener fired switchMainTab(undefined) because the buttons have no data-tab).
    
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

async function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    console.log('File selected:', file.name);

    const progress = document.getElementById('parseProgress');
    const fill = document.getElementById('progressFill');
    if (progress) progress.style.display = 'block';
    if (fill) fill.style.width = '40%';

    try {
        if (typeof ResumeParser === 'undefined') {
            throw new Error('ResumeParser module not loaded');
        }
        parsedResumeProfile = await ResumeParser.parseFile(file);
        if (fill) fill.style.width = '100%';

        // Suggest a reference name from the parsed resume
        const displayNameInput = document.getElementById('profileDisplayName');
        if (displayNameInput && !displayNameInput.value && parsedResumeProfile.name) {
            displayNameInput.value = parsedResumeProfile.name;
        }

        const label = parsedResumeProfile.name || file.name;
        showToast(`Resume parsed: ${label}. Click "Save Profile" to keep it.`, 'success');
    } catch (error) {
        console.error('Resume parse error:', error);
        parsedResumeProfile = null;
        showToast('Could not parse resume: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            if (progress) progress.style.display = 'none';
            if (fill) fill.style.width = '0%';
        }, 800);
    }
}
// This whole file is wrapped in a load-guard block. Regular function
// declarations leak to global scope (legacy Annex B semantics), but `async`
// function declarations inside a block do NOT — so async handlers referenced
// from inline HTML attributes must be exposed on window explicitly.
window.handleResumeUpload = handleResumeUpload;

// Save a profile from either the Upload Resume or Manual Entry method
function saveProfile() {
    const manualMethod = document.getElementById('manualMethod');
    const isManual = manualMethod && manualMethod.classList.contains('active');

    let profile;
    if (isManual) {
        const name = document.getElementById('profileName')?.value.trim();
        if (!name) {
            showToast('Please enter your full name', 'warning');
            return;
        }
        const skillsRaw = document.getElementById('profileSkills')?.value || '';
        profile = {
            id: Date.now().toString(),
            name,
            email: document.getElementById('profileEmail')?.value.trim() || '',
            phone: document.getElementById('profilePhone')?.value.trim() || '',
            linkedin: document.getElementById('profileLinkedIn')?.value.trim() || '',
            yearsExperience: document.getElementById('profileYears')?.value || '',
            location: document.getElementById('profileLocation')?.value.trim() || '',
            summary: document.getElementById('profileSummary')?.value.trim() || '',
            skills: skillsRaw.split(',').map(s => s.trim()).filter(Boolean),
            experience: [],
            education: [],
            source: 'manual'
        };
    } else {
        if (!parsedResumeProfile) {
            showToast('Please upload a resume first, or use Manual Entry', 'warning');
            return;
        }
        profile = { ...parsedResumeProfile, source: 'upload' };
    }

    const displayName = document.getElementById('profileDisplayName')?.value.trim();
    if (displayName) profile.displayName = displayName;

    try {
        StorageManager.saveProfile(profile);
        showToast('Profile saved successfully!', 'success');
        parsedResumeProfile = null;
        clearProfileForm();
        closeProfileCreation();
        displayProfiles();
        if (typeof populateProfileSelects === 'function') populateProfileSelects();
        if (typeof updateStats === 'function') updateStats();
    } catch (error) {
        console.error('Save profile error:', error);
        showToast('Error saving profile: ' + error.message, 'error');
    }
}

function closeProfileCreation() {
    const profileCreation = document.getElementById('profileCreation');
    if (profileCreation) profileCreation.style.display = 'none';
}

function clearProfileForm() {
    ['profileName', 'profileEmail', 'profilePhone', 'profileLinkedIn', 'profileYears',
     'profileLocation', 'profileSummary', 'profileSkills', 'profileDisplayName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const fileInput = document.getElementById('resumeFile');
    if (fileInput) fileInput.value = '';
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
        currentProfile = StorageManager.getProfile(select.value);
        console.log('Loading profile:', currentProfile?.name || select.value);
    } else {
        currentProfile = null;
    }
}

// ============================================================================
// RESUME / COVER LETTER / PORTFOLIO GENERATION (local, no API key required)
// ============================================================================

// Escape user-provided text before inserting into generated HTML/DOC output
function escHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeFileName(name) {
    return (name || 'Resume').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Resume';
}

// Normalize a stored profile so experience/education/skills are always arrays
function normalizeProfile(profile) {
    const p = { ...profile };
    if (typeof p.skills === 'string') {
        p.skills = p.skills.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(p.skills)) {
        p.skills = [];
    }
    if (typeof p.experience === 'string') {
        p.experience = p.experience.trim() ? [{ description: p.experience.trim() }] : [];
    } else if (!Array.isArray(p.experience)) {
        p.experience = [];
    }
    if (typeof p.education === 'string') {
        p.education = p.education.trim() ? [p.education.trim()] : [];
    } else if (!Array.isArray(p.education)) {
        p.education = [];
    }
    return p;
}

// Pull simple keywords from a job description and find matching profile skills
function matchSkillsToJD(profile, jdText) {
    const jd = (jdText || '').toLowerCase();
    if (!jd || !profile.skills || !profile.skills.length) return [];
    return profile.skills.filter(skill => jd.includes(String(skill).toLowerCase()));
}

// Try to guess job title + company from a pasted JD (best-effort, optional)
function extractJobMeta(jdText) {
    const firstLine = (jdText || '').split('\n').map(l => l.trim()).filter(Boolean)[0] || '';
    return {
        title: firstLine.slice(0, 80) || 'the role',
        company: 'the company'
    };
}

// Build a Word-compatible .doc Blob from HTML (docx.js isn't loaded in-browser)
function buildResumeDocBlob(profile, matched) {
    const p = normalizeProfile(profile);
    const contact = [p.email, p.phone, p.location, p.linkedin].filter(Boolean).map(escHtml).join(' &nbsp;|&nbsp; ');
    const skills = (matched && matched.length ? matched : p.skills);
    const body = `
        <h1 style="text-align:center;margin:0;font-family:Calibri,sans-serif;">${escHtml(p.displayName || p.name || 'Your Name')}</h1>
        <p style="text-align:center;font-size:10pt;color:#555;font-family:Calibri,sans-serif;">${contact}</p>
        ${p.summary ? `<h2 style="border-bottom:1px solid #888;font-family:Calibri,sans-serif;">Summary</h2><p style="font-family:Calibri,sans-serif;">${escHtml(p.summary)}</p>` : ''}
        ${skills.length ? `<h2 style="border-bottom:1px solid #888;font-family:Calibri,sans-serif;">Core Skills</h2><p style="font-family:Calibri,sans-serif;">${skills.map(escHtml).join(' • ')}</p>` : ''}
        ${p.experience.length ? `<h2 style="border-bottom:1px solid #888;font-family:Calibri,sans-serif;">Experience</h2>${p.experience.map(exp => `
            <p style="font-family:Calibri,sans-serif;"><strong>${escHtml(exp.position || exp.title || '')}</strong>${exp.company ? ' — ' + escHtml(exp.company) : ''}${exp.year ? ' (' + escHtml(exp.year) + ')' : ''}<br>${escHtml(exp.description || '')}</p>`).join('')}` : ''}
        ${p.education.length ? `<h2 style="border-bottom:1px solid #888;font-family:Calibri,sans-serif;">Education</h2>${p.education.map(e => `<p style="font-family:Calibri,sans-serif;">${escHtml(typeof e === 'string' ? e : (e.degree || e.school || ''))}</p>`).join('')}` : ''}
    `;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${body}</body></html>`;
    return new Blob(['\ufeff', html], { type: 'application/msword' });
}

// Build a PDF Blob using jsPDF (reliable browser global: window.jspdf.jsPDF)
function buildResumePdfBlob(profile, matched) {
    return new Promise((resolve, reject) => {
        try {
            const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
            if (!jsPDFCtor) {
                reject(new Error('PDF library not loaded'));
                return;
            }
            const p = normalizeProfile(profile);
            const doc = new jsPDFCtor({ unit: 'pt', format: 'letter' });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 50;
            const maxW = pageW - margin * 2;
            let y = margin;

            const ensure = (h) => { if (y + h > pageH - margin) { doc.addPage(); y = margin; } };
            const writeBlock = (text, size, color, gap) => {
                if (!text) return;
                doc.setFontSize(size);
                doc.setTextColor(color);
                const lines = doc.splitTextToSize(String(text), maxW);
                lines.forEach(line => { ensure(size + 2); doc.text(line, margin, y); y += size + 3; });
                y += (gap || 0);
            };
            const heading = (text) => {
                y += 8; ensure(20);
                doc.setFontSize(12); doc.setTextColor('#1a73e8');
                doc.text(String(text).toUpperCase(), margin, y); y += 6;
                doc.setDrawColor('#cccccc'); doc.line(margin, y, pageW - margin, y); y += 12;
            };

            // Header
            doc.setFontSize(22); doc.setTextColor('#111111');
            doc.text(p.displayName || p.name || 'Your Name', pageW / 2, y, { align: 'center' }); y += 22;
            const contact = [p.email, p.phone, p.location, p.linkedin].filter(Boolean).join('   |   ');
            if (contact) { doc.setFontSize(9); doc.setTextColor('#555555'); doc.text(contact, pageW / 2, y, { align: 'center' }); y += 14; }

            if (p.summary) { heading('Summary'); writeBlock(p.summary, 10, '#333333', 4); }

            const skills = (matched && matched.length ? matched : p.skills);
            if (skills.length) { heading('Core Skills'); writeBlock(skills.join('  •  '), 10, '#333333', 4); }

            if (p.experience.length) {
                heading('Experience');
                p.experience.forEach(exp => {
                    const head = [exp.position || exp.title, exp.company].filter(Boolean).join(' — ');
                    if (head) writeBlock(head + (exp.year ? `  (${exp.year})` : ''), 11, '#000000', 1);
                    if (exp.description) writeBlock(exp.description, 10, '#333333', 4);
                });
            }

            if (p.education.length) {
                heading('Education');
                p.education.forEach(e => writeBlock(typeof e === 'string' ? e : (e.degree || e.school || ''), 10, '#333333', 2));
            }

            resolve(doc.output('blob'));
        } catch (err) {
            reject(err);
        }
    });
}

function buildCoverLetterDocBlob(profile, jobTitle, company, jdText) {
    const p = normalizeProfile(profile);
    const topSkills = (matchSkillsToJD(p, jdText).slice(0, 4).join(', ')) || p.skills.slice(0, 4).join(', ');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const body = `
        <p style="font-family:Calibri,sans-serif;">${escHtml(today)}</p>
        <p style="font-family:Calibri,sans-serif;">Dear Hiring Manager,</p>
        <p style="font-family:Calibri,sans-serif;">I am excited to apply for the <strong>${escHtml(jobTitle)}</strong> position at ${escHtml(company)}. With my background${p.summary ? ' as ' + escHtml(p.summary.split('.')[0]) : ''}, I am confident I can deliver immediate value to your team.</p>
        ${topSkills ? `<p style="font-family:Calibri,sans-serif;">My strengths align closely with this role, particularly in ${escHtml(topSkills)}. I bring a proven track record of turning these capabilities into measurable outcomes.</p>` : ''}
        <p style="font-family:Calibri,sans-serif;">I would welcome the opportunity to discuss how my experience can contribute to your goals. Thank you for your consideration.</p>
        <p style="font-family:Calibri,sans-serif;">Sincerely,<br>${escHtml(p.displayName || p.name || '')}</p>
    `;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${body}</body></html>`;
    return new Blob(['\ufeff', html], { type: 'application/msword' });
}

function buildJobDetailsBlob(jobTitle, company, jdText) {
    const md = `# Job Application Details

## Position
${jobTitle}

## Company
${company}

## Date
${new Date().toISOString().split('T')[0]}

## Job Description
${jdText || '(not provided)'}

---
Generated by Resume Engine Pro
`;
    return new Blob([md], { type: 'text/markdown' });
}

function addDownloadLink(container, blob, filename, label) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.className = 'btn btn-secondary';
    a.style.margin = '0.25rem';
    a.textContent = `⬇ ${label}`;
    container.appendChild(a);
}

// Optional AI tailoring: when a provider is selected AND has an API key, call
// the model and merge its tailored summary/skills/experience into the profile.
// Returns { profile, cost, usedAI }. Throws on AI/network failure (caller falls back).
async function tailorProfileWithAI(profile, jdText, provider, mode) {
    const result = await AIIntegration.tailorResume(provider, profile, jdText, mode);
    let aiData;
    try {
        aiData = JSON.parse(result.tailored);
    } catch {
        // Model returned prose, not JSON — use it as the summary
        aiData = { summary: result.tailored };
    }
    const tailored = { ...profile };
    if (aiData.summary) tailored.summary = String(aiData.summary);
    if (Array.isArray(aiData.skills) && aiData.skills.length) {
        tailored.skills = aiData.skills;
    } else if (typeof aiData.skills === 'string' && aiData.skills.trim()) {
        tailored.skills = aiData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(aiData.experience) && aiData.experience.length) {
        tailored.experience = aiData.experience;
    }
    return { profile: tailored, cost: result.cost || 0, usedAI: true };
}

async function generateSingle() {
    const select = document.getElementById('selectProfile');
    const profileId = select && select.value;
    if (!profileId) {
        showToast('Please select a profile first', 'warning');
        return;
    }
    const profile = StorageManager.getProfile(profileId);
    if (!profile) {
        showToast('Selected profile not found', 'error');
        return;
    }
    const jdText = (document.getElementById('jdText')?.value || '').trim();
    if (!jdText) {
        showToast('Please paste a job description (Step 2)', 'warning');
        return;
    }

    const wantResume = document.getElementById('genResume')?.checked;
    const wantCover = document.getElementById('genCoverLetter')?.checked;
    const wantPortfolio = document.getElementById('genPortfolio')?.checked;
    const wantJobDetails = document.getElementById('genJobDetails')?.checked;
    const template = document.getElementById('portfolioTemplate')?.value || 'minimalist';

    const statusBox = document.getElementById('generationStatus');
    const statusContent = document.getElementById('statusContent');
    const downloadLinks = document.getElementById('downloadLinks');
    if (statusBox) statusBox.style.display = 'block';
    if (downloadLinks) { downloadLinks.style.display = 'none'; downloadLinks.innerHTML = ''; }
    if (statusContent) statusContent.innerHTML = '<p>⏳ Generating your documents...</p>';

    try {
        const meta = extractJobMeta(jdText);
        const baseName = safeFileName(profile.displayName || profile.name);
        let count = 0;

        // Optional AI tailoring (falls back to the raw profile on any failure)
        const provider = document.getElementById('aiProvider')?.value;
        const mode = document.getElementById('generationMode')?.value || 'smart';
        let workingProfile = profile;
        let aiUsed = false;
        let aiCost = 0;
        if (provider && window.AIIntegration && AIIntegration.isConfigured(provider)) {
            if (statusContent) statusContent.innerHTML = '<p>🤖 Tailoring with AI...</p>';
            try {
                const r = await tailorProfileWithAI(profile, jdText, provider, mode);
                workingProfile = r.profile;
                aiUsed = true;
                aiCost = r.cost;
            } catch (e) {
                console.warn('AI tailoring failed, using local:', e.message);
                showToast('AI tailoring failed — generating locally instead', 'warning');
            }
            if (statusContent) statusContent.innerHTML = '<p>⏳ Building your documents...</p>';
        }

        const matched = matchSkillsToJD(normalizeProfile(workingProfile), jdText);

        if (wantResume) {
            const pdfBlob = await buildResumePdfBlob(workingProfile, matched);
            addDownloadLink(downloadLinks, pdfBlob, `${baseName}_Resume.pdf`, 'Resume (PDF)');
            const docBlob = buildResumeDocBlob(workingProfile, matched);
            addDownloadLink(downloadLinks, docBlob, `${baseName}_Resume.doc`, 'Resume (Word)');
            count++;
        }
        if (wantCover) {
            const clBlob = buildCoverLetterDocBlob(workingProfile, meta.title, meta.company, jdText);
            addDownloadLink(downloadLinks, clBlob, `${baseName}_CoverLetter.doc`, 'Cover Letter (Word)');
            count++;
        }
        if (wantPortfolio && window.PortfolioTemplates) {
            try {
                const html = PortfolioTemplates.generatePortfolio(normalizeProfile(workingProfile), template, 0);
                addDownloadLink(downloadLinks, new Blob([html], { type: 'text/html' }), `${baseName}_Portfolio.html`, 'Portfolio (HTML)');
                count++;
            } catch (e) {
                console.warn('Portfolio generation failed:', e.message);
            }
        }
        if (wantJobDetails) {
            addDownloadLink(downloadLinks, buildJobDetailsBlob(meta.title, meta.company, jdText), `${baseName}_JobDetails.md`, 'Job Details (Markdown)');
            count++;
        }

        // Save to history
        try {
            StorageManager.saveGeneration({
                profile: profile.name,
                jobTitle: meta.title,
                outputs: count,
                matchedSkills: matched.length,
                aiUsed,
                aiCost
            });
        } catch (e) { /* non-fatal */ }

        const matchNote = matched.length ? ` Matched ${matched.length} skill(s) to the JD.` : '';
        const aiNote = aiUsed ? ` AI-tailored (~$${aiCost.toFixed(4)}).` : '';
        if (statusContent) statusContent.innerHTML = `<p>✅ Generated ${count} document set(s).${aiNote}${matchNote} Click below to download.</p>`;
        if (downloadLinks) downloadLinks.style.display = 'block';
        showToast(`Generated ${count} document set(s)`, 'success');
    } catch (error) {
        console.error('Generation error:', error);
        if (statusContent) statusContent.innerHTML = `<p>❌ Generation failed: ${escHtml(error.message)}</p>`;
        showToast('Generation failed: ' + error.message, 'error');
    }
}

async function generateBulk() {
    const select = document.getElementById('bulkProfile');
    const profileId = select && select.value;
    if (!profileId) {
        showToast('Please select a profile first', 'warning');
        return;
    }
    const profile = StorageManager.getProfile(profileId);
    if (!profile) {
        showToast('Selected profile not found', 'error');
        return;
    }
    const raw = (document.getElementById('bulkJDs')?.value || '').trim();
    if (!raw) {
        showToast('Please paste one or more job descriptions', 'warning');
        return;
    }
    // Split on blank lines (one JD block per paragraph)
    const jds = raw.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    if (!jds.length) {
        showToast('No job descriptions detected', 'warning');
        return;
    }

    const statusBox = document.getElementById('bulkStatus');
    const statusContent = document.getElementById('bulkStatusContent');
    if (statusBox) statusBox.style.display = 'block';
    if (statusContent) statusContent.innerHTML = `<p>⏳ Generating resumes for ${jds.length} job(s)...</p>`;

    const baseName = safeFileName(profile.displayName || profile.name);
    const linkWrap = document.createElement('div');
    linkWrap.className = 'download-section';
    let done = 0;

    // Optional AI tailoring per job when a bulk provider key is configured
    const provider = document.getElementById('bulkAiProvider')?.value;
    const useAI = provider && window.AIIntegration && AIIntegration.isConfigured(provider);

    try {
        for (let i = 0; i < jds.length; i++) {
            if (statusContent) statusContent.innerHTML = `<p>⏳ Generating resume ${i + 1} of ${jds.length}${useAI ? ' (AI tailoring)' : ''}...</p>`;
            let workingProfile = profile;
            if (useAI) {
                try {
                    const r = await tailorProfileWithAI(profile, jds[i], provider, 'smart');
                    workingProfile = r.profile;
                } catch (e) {
                    console.warn(`AI tailoring failed for job ${i + 1}, using local:`, e.message);
                }
            }
            const matched = matchSkillsToJD(normalizeProfile(workingProfile), jds[i]);
            const pdfBlob = await buildResumePdfBlob(workingProfile, matched);
            addDownloadLink(linkWrap, pdfBlob, `${baseName}_Resume_${i + 1}.pdf`, `Resume #${i + 1} (PDF)`);
            done++;
        }
        try {
            StorageManager.saveGeneration({ profile: profile.name, bulk: true, count: done, aiUsed: !!useAI });
        } catch (e) { /* non-fatal */ }
        if (statusContent) {
            statusContent.innerHTML = `<p>✅ Generated ${done} resume(s). Click below to download.</p>`;
            statusContent.appendChild(linkWrap);
        }
        showToast(`Generated ${done} resume(s)`, 'success');
    } catch (error) {
        console.error('Bulk generation error:', error);
        if (statusContent) statusContent.innerHTML = `<p>❌ Bulk generation failed: ${escHtml(error.message)}</p>`;
        showToast('Bulk generation failed: ' + error.message, 'error');
    }
}

function updateAICost() {
    const provider = document.getElementById('aiProvider')?.value;
    const mode = document.getElementById('generationMode')?.value || 'smart';
    const box = document.getElementById('costEstimate');
    if (!box) return;
    if (!provider) {
        box.innerHTML = '<p>No AI provider selected — documents are generated locally for free.</p>';
        return;
    }
    const cost = (window.AIIntegration && AIIntegration.getCost) ? AIIntegration.getCost(provider, mode) : 0;
    const configured = window.AIIntegration && AIIntegration.isConfigured(provider);
    if (provider === 'pollinations') {
        box.innerHTML = '<p>✅ <strong>Free AI</strong> selected — no key needed, $0.00 cost. Tailoring runs in your browser.</p>';
        return;
    }
    if (provider === 'custom') {
        box.innerHTML = configured
            ? '<p>✅ Using your <strong>custom AI provider</strong> — billed by your own account/provider.</p>'
            : '<p>⚠️ Custom provider not configured yet. Add your endpoint &amp; key in the <strong>Settings</strong> tab.</p>';
        return;
    }
    box.innerHTML = `<p>Estimated AI cost: <strong>$${cost.toFixed(4)}</strong> per resume (${mode}).` +
        (configured ? '' : ' <em>No API key set — add it in Settings, or it will generate locally for free.</em>') + '</p>';
}

function updateBulkCost() {
    const provider = document.getElementById('bulkAiProvider')?.value;
    const raw = (document.getElementById('bulkJDs')?.value || '').trim();
    const count = raw ? raw.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean).length : 0;
    const box = document.getElementById('bulkCostEstimate');
    if (!box) return;
    if (!provider) {
        box.innerHTML = `${count} job(s) detected — generated locally for free.`;
        return;
    }
    if (provider === 'pollinations') {
        box.innerHTML = `${count} job(s) × <strong>Free AI</strong> (Pollinations) — $0.00 total, no key needed.`;
        return;
    }
    if (provider === 'custom') {
        box.innerHTML = `${count} job(s) via your <strong>custom AI provider</strong> — billed by your own account.`;
        return;
    }
    const cost = (window.AIIntegration && AIIntegration.getBulkCost) ? AIIntegration.getBulkCost(provider, count, 'smart') : 0;
    box.innerHTML = `${count} job(s) × estimated <strong>$${cost.toFixed(4)}</strong> total (if using AI).`;
}

async function fetchJDFromURL() {
    const url = (document.getElementById('jdUrl')?.value || '').trim();
    if (!url) {
        showToast('Please enter a job posting URL', 'warning');
        return;
    }
    showToast('Fetching job description...', 'info');
    try {
        const resp = await fetch(url);
        const text = await resp.text();
        // Strip HTML tags to approximate the JD text
        const plain = text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const jdArea = document.getElementById('jdText');
        if (jdArea) jdArea.value = plain.slice(0, 5000);
        switchJDInput('paste');
        document.querySelector('.input-tab')?.classList.add('active');
        showToast('Job description fetched. Review and edit as needed.', 'success');
    } catch (error) {
        console.error('JD fetch error:', error);
        showToast('Could not fetch URL (site may block cross-origin). Please paste the JD manually.', 'error');
    }
}

// async function declarations do NOT leak to global from inside the load-guard
// block (Annex B applies to plain functions only) — expose handlers used by
// inline onclick attributes explicitly. See bug #12 in the Learning Hub.
window.generateSingle = generateSingle;
window.generateBulk = generateBulk;
window.fetchJDFromURL = fetchJDFromURL;

// ============================================================================
// AI PROVIDER SETTINGS UI (free, key-based, and custom BYO providers)
// ============================================================================

function renderAISettings() {
    const container = document.getElementById('aiProvidersSettings');
    if (!container || !window.AIIntegration) return;
    const providers = AIIntegration.providers;

    let html = '';

    // Free, no-key provider
    html += `<div class="ai-provider-card">
        <h4>${escHtml(providers.pollinations.name)}</h4>
        <p>✅ Ready to use — no account or API key required. Just pick <strong>Free AI</strong> in the Generate tab.</p>
    </div>`;

    // Key-based providers (use your own account/token)
    ['openai', 'claude', 'gemini', 'mistral'].forEach(id => {
        const configured = AIIntegration.isConfigured(id);
        html += `<div class="ai-provider-card">
            <h4>${escHtml(providers[id].name)} ${configured ? '✅' : ''}</h4>
            <div class="form-group">
                <input type="password" id="aikey_${id}" placeholder="Paste your ${escHtml(id)} API key" />
                <button class="btn btn-secondary" onclick="saveAIProviderKey('${id}')">Save Key</button>
            </div>
            <small>Use your own token from your ${escHtml(providers[id].name)} account. Stored only in your browser.</small>
        </div>`;
    });

    // Custom / BYO OpenAI-compatible provider
    const cfg = AIIntegration.getCustomConfig();
    html += `<div class="ai-provider-card">
        <h4>Custom / Your own AI provider ${cfg.endpoint ? '✅' : ''}</h4>
        <p>Use any OpenAI-compatible endpoint — e.g. OpenRouter, Together, Groq, LM Studio, or a local Ollama server.</p>
        <div class="form-group">
            <label>API Endpoint URL</label>
            <input type="text" id="customEndpoint" placeholder="https://openrouter.ai/api/v1/chat/completions" value="${escHtml(cfg.endpoint)}" />
        </div>
        <div class="form-group">
            <label>Model name</label>
            <input type="text" id="customModel" placeholder="e.g. gpt-4o-mini, llama-3.1-70b-instruct" value="${escHtml(cfg.model)}" />
        </div>
        <div class="form-group">
            <label>API Key (leave blank for local servers like Ollama)</label>
            <input type="password" id="customKey" placeholder="Paste your key" />
        </div>
        <button class="btn btn-secondary" onclick="saveCustomAIConfig()">Save Custom Provider</button>
    </div>`;

    container.innerHTML = html;
}

function saveAIProviderKey(provider) {
    const input = document.getElementById('aikey_' + provider);
    const key = input && input.value.trim();
    if (!key) {
        showToast('Please paste an API key first', 'warning');
        return;
    }
    try {
        AIIntegration.setAPIKey(provider, key);
        showToast(`${provider} key saved`, 'success');
        renderAISettings();
    } catch (e) {
        showToast('Could not save key: ' + e.message, 'error');
    }
}

function saveCustomAIConfig() {
    const endpoint = document.getElementById('customEndpoint')?.value.trim();
    const model = document.getElementById('customModel')?.value.trim();
    const key = document.getElementById('customKey')?.value.trim();
    if (!endpoint) {
        showToast('Please enter the API endpoint URL', 'warning');
        return;
    }
    AIIntegration.setCustomConfig(endpoint, model, key);
    showToast('Custom AI provider saved', 'success');
    renderAISettings();
}

}

