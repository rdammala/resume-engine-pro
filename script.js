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

    // Reconcile any cloud (Ollama) runs left 'in-progress' from a prior session.
    setTimeout(() => { try { resumePendingRuns(); } catch (_) {} }, 4000);
    
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
            <h4>${profile.displayName || profile.name || 'Untitled'}</h4>
            <div class="profile-detail">
                <span>Name:</span>
                <span>${profile.name || 'N/A'}</span>
            </div>
            <div class="profile-detail">
                <span>Email:</span>
                <span>${profile.email || 'N/A'}</span>
            </div>
            <div class="profile-detail">
                <span>Phone:</span>
                <span>${profile.phone || 'N/A'}</span>
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

    if (!history.length) {
        container.innerHTML = '<p style="color:#9fb3c8;">No generations yet. Every attempt — successful or not — will be logged here.</p>';
        return;
    }

    const providerLabel = (id) => {
        if (!id) return '—';
        const p = (window.AIIntegration && AIIntegration.providers && AIIntegration.providers[id]);
        return p && p.name ? p.name.split('(')[0].trim() : id;
    };

    const rows = history.map(item => {
        const when = item.generatedAt ? new Date(item.generatedAt) : null;
        const dateStr = when ? when.toLocaleDateString() : '—';
        const timeStr = when ? when.toLocaleTimeString() : '';
        const status = item.status || 'success';
        const statusClass = status === 'success' ? 'hist-ok'
            : status === 'failed' ? 'hist-fail'
            : status === 'in-progress' ? 'hist-run' : 'hist-muted';
        const statusLabel = status === 'in-progress' ? 'In progress'
            : status.charAt(0).toUpperCase() + status.slice(1);
        const cost = typeof item.cost === 'number' ? item.cost
            : (typeof item.aiCost === 'number' ? item.aiCost : 0);
        const details = item.error
            ? `<span class="hist-err">${escHtml(item.error)}</span>`
            : (item.outputs != null
                ? `${item.outputs} file(s)` + (item.matchedSkills != null ? `, ${item.matchedSkills} skill(s) matched` : '')
                : '—');
        let actionsCell = '—';
        if (item.id) {
            if (status === 'success') {
                if (item.published && item.repoUrl) {
                    actionsCell = `<a href="${item.repoUrl}" target="_blank" rel="noopener" class="hist-link">Repo ✓</a>`
                        + (item.pagesUrl ? ` · <a href="${item.pagesUrl}" target="_blank" rel="noopener" class="hist-link">Live</a>` : '')
                        + ` <button class="action-btn" title="Publish again (updates files)" onclick="publishHistoryEntry('${item.id}', this)">📤</button>`;
                } else {
                    actionsCell = `<button class="action-btn" title="Publish to GitHub & add to tracker" onclick="publishHistoryEntry('${item.id}', this)">📤 Publish</button>`;
                }
            } else if (status === 'in-progress' || status === 'failed') {
                actionsCell = `<button class="action-btn" title="Re-check the cloud run" onclick="recheckHistoryEntry('${item.id}', this)">🔄 Re-check</button>`;
            }
        }
        return `<tr>
            <td>${escHtml(item.profile || '—')}</td>
            <td>${escHtml(providerLabel(item.provider))}</td>
            <td>${escHtml(item.mode || '—')}</td>
            <td><span class="hist-status ${statusClass}">${escHtml(statusLabel)}</span></td>
            <td>$${cost.toFixed(4)}</td>
            <td style="text-align:center;">${item.outputs != null ? item.outputs : '—'}</td>
            <td>${escHtml(dateStr)}<br><small style="color:#808080;">${escHtml(timeStr)}</small></td>
            <td class="hist-details">${details}</td>
            <td class="hist-actions">${actionsCell}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="hist-table-wrap">
            <table class="hist-table">
                <thead>
                    <tr>
                        <th>Profile</th>
                        <th>Provider</th>
                        <th>Mode</th>
                        <th>Status</th>
                        <th>Cost</th>
                        <th>Outputs</th>
                        <th>Date &amp; Time</th>
                        <th>Details / Reason</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
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

// ============================================================================
// FULL BACKUP / RESTORE (one-click, timestamped)
// ============================================================================

function backupEverything() {
    try {
        const backup = StorageManager.exportAll();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-engine-pro-backup_${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (typeof showToast === 'function') {
            showToast(`Backup saved (${backup.keyCount} data sets)`, 'success');
        }
    } catch (err) {
        console.error('Backup failed:', err);
        if (typeof showToast === 'function') showToast('Backup failed: ' + err.message, 'error');
    }
}

function restoreEverything() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let backup;
            try {
                backup = JSON.parse(event.target.result);
            } catch {
                if (typeof showToast === 'function') showToast('Invalid JSON file.', 'error');
                return;
            }
            if (!confirm('Restore will REPLACE all current data in this browser (profiles, history, applications, settings) with the backup. Continue?')) {
                return;
            }
            const result = StorageManager.importAll(backup, { clearFirst: true });
            if (result.success) {
                if (typeof showToast === 'function') showToast(`Restored ${result.restored} data sets. Reloading...`, 'success');
                setTimeout(() => window.location.reload(), 1200);
            } else {
                if (typeof showToast === 'function') showToast('Restore failed: ' + result.error, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
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

    // Normalize the Generation Mode price tags for the default provider on load
    if (typeof refreshGenerationModeLabels === 'function') {
        refreshGenerationModeLabels(document.getElementById('aiProvider')?.value || '');
    }
    
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

        // Auto-fill the editable contact + skills fields so the user can verify/correct
        const emailInput = document.getElementById('uploadEmail');
        if (emailInput) emailInput.value = parsedResumeProfile.email || '';
        const phoneInput = document.getElementById('uploadPhone');
        if (phoneInput) phoneInput.value = parsedResumeProfile.phone || '';
        const skillsInput = document.getElementById('uploadSkills');
        if (skillsInput) skillsInput.value = (parsedResumeProfile.skills || []).join(', ');

        const label = parsedResumeProfile.name || file.name;
        showToast(`Resume parsed: ${label}. Review the fields below, then click "Save Profile".`, 'success');
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
        // Apply any edits the user made to the auto-filled contact/skills fields
        const em = document.getElementById('uploadEmail')?.value.trim();
        if (em) profile.email = em;
        const ph = document.getElementById('uploadPhone')?.value.trim();
        if (ph) profile.phone = ph;
        const sk = document.getElementById('uploadSkills')?.value.trim();
        if (sk) profile.skills = sk.split(',').map(s => s.trim()).filter(Boolean);
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
     'profileLocation', 'profileSummary', 'profileSkills', 'profileDisplayName',
     'uploadEmail', 'uploadPhone', 'uploadSkills'].forEach(id => {
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
    // Safety net: if structured parsing produced nothing but we still have the
    // raw resume text, surface it so the generated document isn't empty.
    const hasContent = (p.summary && p.summary.trim()) || p.skills.length || p.experience.length || p.education.length;
    if (!hasContent && p.rawText && p.rawText.trim()) {
        const raw = p.rawText.trim();
        p.summary = raw.split('\n').slice(0, 4).join(' ').slice(0, 600);
        p.experience = [{ position: '', description: raw.slice(0, 4000) }];
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
    const lines = (jdText || '').split('\n').map(l => l.trim()).filter(Boolean);
    const roleRe = /(engineer|manager|developer|analyst|architect|specialist|lead|director|administrator|consultant|designer|scientist|technician|coordinator|officer|head\s+of|vp\b|president)/i;

    // Prefer an explicit "Job Title:" / "Position:" line, then a role-like line
    let title = '';
    const labeled = lines.find(l => /^(job\s*title|position|role)\s*[:\-]/i.test(l));
    if (labeled) {
        title = labeled.replace(/^(job\s*title|position|role)\s*[:\-]\s*/i, '').trim();
    }
    if (!title) {
        const roleLine = lines.find(l => roleRe.test(l) && l.length < 70 && !/\?$/.test(l));
        if (roleLine) title = roleLine;
    }
    if (!title) {
        title = (lines.find(l => !/\?$/.test(l) && l.length > 3) || 'the role').slice(0, 80);
    }

    // Best-effort company extraction
    let company = 'the company';
    const compLine = lines.find(l => /^(company|employer|organization)\s*[:\-]/i.test(l));
    if (compLine) {
        company = compLine.replace(/^(company|employer|organization)\s*[:\-]\s*/i, '').trim() || company;
    } else {
        const atMatch = (jdText || '').match(/\bat\s+([A-Z][A-Za-z0-9&.\- ]{2,40})/);
        if (atMatch) company = atMatch[1].trim();
    }

    return { title: title || 'the role', company };
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
            <p style="font-family:Calibri,sans-serif;"><strong>${escHtml(exp.position || exp.title || '')}</strong>${exp.company ? ' — ' + escHtml(exp.company) : ''}${exp.year ? ' (' + escHtml(exp.year) + ')' : ''}<br>${escHtml(exp.description || '').replace(/\n/g, '<br>')}</p>`).join('')}` : ''}
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

            // jsPDF's built-in fonts are WinAnsi — normalize smart quotes, dashes,
            // bullets and drop any remaining non-ASCII so text never renders garbled.
            const ascii = (s) => String(s == null ? '' : s)
                .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
                .replace(/[\u201C\u201D\u201E]/g, '"')
                .replace(/[\u2013\u2014\u2212]/g, '-')
                .replace(/[\u2022\u2023\u25CF\u25AA\u25E6\u00B7\u2043]/g, '-')
                .replace(/\u2026/g, '...')
                .replace(/\u00A0/g, ' ')
                .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');

            const ensure = (h) => { if (y + h > pageH - margin) { doc.addPage(); y = margin; } };
            const writeBlock = (text, size, color, gap) => {
                if (!text) return;
                doc.setFontSize(size);
                doc.setTextColor(color);
                const lines = doc.splitTextToSize(ascii(text), maxW);
                lines.forEach(line => { ensure(size + 2); doc.text(line, margin, y); y += size + 3; });
                y += (gap || 0);
            };
            const heading = (text) => {
                y += 8; ensure(20);
                doc.setFontSize(12); doc.setTextColor('#1a73e8');
                doc.text(ascii(String(text)).toUpperCase(), margin, y); y += 6;
                doc.setDrawColor('#cccccc'); doc.line(margin, y, pageW - margin, y); y += 12;
            };

            // Header
            doc.setFontSize(22); doc.setTextColor('#111111');
            doc.text(ascii(p.displayName || p.name || 'Your Name'), pageW / 2, y, { align: 'center' }); y += 22;
            const contact = [p.email, p.phone, p.location, p.linkedin].filter(Boolean).join('   |   ');
            if (contact) { doc.setFontSize(9); doc.setTextColor('#555555'); doc.text(ascii(contact), pageW / 2, y, { align: 'center' }); y += 14; }

            if (p.summary) { heading('Summary'); writeBlock(p.summary, 10, '#333333', 4); }

            const skills = (matched && matched.length ? matched : p.skills);
            if (skills.length) { heading('Core Skills'); writeBlock(skills.join('  -  '), 10, '#333333', 4); }

            if (p.experience.length) {
                heading('Experience');
                p.experience.forEach(exp => {
                    const head = [exp.position || exp.title, exp.company].filter(Boolean).join(' - ');
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
    const aiData = parseAIResponse(result.tailored);

    const tailored = { ...profile };
    // Summary: only use it if it's real prose, never a stray JSON blob
    if (aiData.summary && typeof aiData.summary === 'string') {
        const sum = aiData.summary.trim();
        const looksLikeJson = sum.startsWith('{') || sum.startsWith('[') ||
            /"(summary|experience|skills|full_resume|ats_suggestions)"\s*:/.test(sum);
        if (sum && !looksLikeJson) tailored.summary = sum;
    }
    // Skills: accept array or comma string
    if (Array.isArray(aiData.skills) && aiData.skills.length) {
        tailored.skills = aiData.skills.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof aiData.skills === 'string' && aiData.skills.trim()) {
        tailored.skills = aiData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Experience: normalize the model's shape into what the builders expect
    if (Array.isArray(aiData.experience) && aiData.experience.length) {
        const mapped = aiData.experience.map(normalizeAIExperience)
            .filter(e => e.position || e.company || e.description);
        if (mapped.length) tailored.experience = mapped;
    }
    return { profile: tailored, cost: result.cost || 0, usedAI: true };
}

// Parse an AI response that may be wrapped in markdown code fences, contain
// surrounding prose, or be slightly malformed/truncated. Always returns an
// object. It NEVER returns the raw JSON text as the summary — if structured
// parsing fails entirely it returns {} so the caller keeps the original profile.
function parseAIResponse(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    let s = String(raw).replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    const candidate = (a !== -1 && b > a) ? s.slice(a, b + 1) : s;

    // 1) Clean parse of the whole object
    try {
        const obj = JSON.parse(candidate);
        if (obj && typeof obj === 'object') return obj;
    } catch (_) { /* fall through to field-level recovery */ }

    // 2) Field-level recovery from malformed/truncated JSON
    const recovered = {};
    const sumMatch = candidate.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (sumMatch) {
        recovered.summary = sumMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const skillsArr = extractBalancedArray(candidate, '"skills"');
    if (skillsArr) { try { recovered.skills = JSON.parse(skillsArr); } catch (_) { /* skip */ } }
    const expArr = extractBalancedArray(candidate, '"experience"');
    if (expArr) { try { recovered.experience = JSON.parse(expArr); } catch (_) { /* skip */ } }
    return recovered; // may be {} -> caller keeps the original profile data
}

// Extract a balanced [ ... ] array that follows the given JSON key token.
// Returns null if the array is missing or unbalanced (e.g. response truncated).
function extractBalancedArray(text, keyToken) {
    const ki = text.indexOf(keyToken);
    if (ki === -1) return null;
    const start = text.indexOf('[', ki);
    if (start === -1) return null;
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '[') depth++;
        else if (ch === ']') { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
    return null;
}

// Map a model experience entry (role/company/location/dates/details[]) onto the
// builder shape ({ position, company, year, description }).
function normalizeAIExperience(exp) {
    if (typeof exp === 'string') return { position: '', company: '', year: '', description: exp };
    const position = exp.position || exp.role || exp.title || '';
    const company = [exp.company || exp.employer || exp.organization || '', exp.location || '']
        .filter(Boolean).join(', ');
    const year = exp.year || exp.dates || exp.date || exp.duration || exp.period || '';
    let details = exp.details || exp.responsibilities || exp.bullets || exp.highlights || exp.achievements;
    let description = '';
    if (Array.isArray(details)) {
        description = details.map(d => String(d).trim()).filter(Boolean).map(d => '• ' + d).join('\n');
    } else {
        description = exp.description || exp.summary || '';
    }
    return { position, company, year, description };
}

// ============================================================================
// OLLAMA CLOUD PIPELINE (free, ephemeral GitHub Actions runner)
// ----------------------------------------------------------------------------
// Dispatches the ollama-resume.yml workflow, shows a live progress card while a
// fresh runner installs & runs Llama 3, then fetches the committed result and
// maps it onto the working profile. The runner self-destructs automatically.
// ============================================================================
async function runOllamaInCloud(profile, jdText, statusContent, histId) {
    const resumeText = buildResumeSourceText(profile);
    const model = (window.AIIntegration && AIIntegration.getOllamaConfig)
        ? (AIIntegration.getOllamaConfig().model || GitHubRunner.getConfig().model)
        : GitHubRunner.getConfig().model;

    const setProg = (pct, msg) => renderCloudProgress(statusContent, pct, msg);

    setProg(8, 'Connecting to GitHub…');
    const { runId } = await GitHubRunner.dispatch({ resumeData: resumeText, jobDescription: jdText, model });

    // Persist the runId immediately so a background monitor can reconcile this
    // attempt (flip it to Success) even if foreground tracking is interrupted.
    try { if (histId) { StorageManager.updateGeneration(histId, { runId }); } } catch (_) {}

    setProg(18, 'Launching a free, ephemeral cloud runner…');
    await GitHubRunner.waitForCompletion(runId, (status, run, elapsed) => {
        const t = formatElapsed(elapsed);
        if (status === 'queued') setProg(28, `Runner queued — installing & starting Ollama… (${t})`);
        else if (status === 'in_progress') setProg(58, `Running ${escHtml(model)} and tailoring your resume to the JD… (${t} elapsed). You can switch to other tabs and keep working — I’ll keep monitoring this job and update you right here.`);
        else if (status === 'completed') setProg(90, 'Committing the tailored resume back to GitHub…');
    });

    setProg(92, 'Fetching the generated resume…');
    const aiData = await GitHubRunner.fetchResult(runId);
    setProg(100, 'Done — building your documents…');

    if (aiData && aiData._raw) {
        throw new Error('The model did not return clean JSON. Try again or pick a different model in Settings.');
    }

    return mergeTailored(profile, aiData);
}

// Merge an AI/cloud result (summary/skills/experience) onto a clone of the profile.
function mergeTailored(profile, aiData) {
    const tailored = { ...profile };
    if (aiData && typeof aiData.summary === 'string' && aiData.summary.trim()) {
        tailored.summary = aiData.summary.trim();
    }
    if (aiData && Array.isArray(aiData.skills) && aiData.skills.length) {
        tailored.skills = aiData.skills.map(s => String(s).trim()).filter(Boolean);
    }
    if (aiData && Array.isArray(aiData.experience) && aiData.experience.length) {
        const mapped = aiData.experience.map(normalizeAIExperience)
            .filter(e => e.position || e.company || e.description);
        if (mapped.length) tailored.experience = mapped;
    }
    return tailored;
}

// Build the requested document set from a (possibly AI-tailored) profile.
// Shared by the foreground generator and the background run reconciler.
async function buildDocumentsFromProfile(workingProfile, jdText, baseName, opts, downloadLinks) {
    const meta = extractJobMeta(jdText);
    const matched = matchSkillsToJD(normalizeProfile(workingProfile), jdText);
    let count = 0;
    if (opts.wantResume) {
        const pdfBlob = await buildResumePdfBlob(workingProfile, matched);
        addDownloadLink(downloadLinks, pdfBlob, `${baseName}_Resume.pdf`, 'Resume (PDF)');
        const docBlob = buildResumeDocBlob(workingProfile, matched);
        addDownloadLink(downloadLinks, docBlob, `${baseName}_Resume.doc`, 'Resume (Word)');
        count++;
    }
    if (opts.wantCover) {
        const clBlob = buildCoverLetterDocBlob(workingProfile, meta.title, meta.company, jdText);
        addDownloadLink(downloadLinks, clBlob, `${baseName}_CoverLetter.doc`, 'Cover Letter (Word)');
        count++;
    }
    if (opts.wantPortfolio && window.PortfolioTemplates) {
        try {
            const html = PortfolioTemplates.generatePortfolio(normalizeProfile(workingProfile), opts.template || 'minimalist', 0);
            addDownloadLink(downloadLinks, new Blob([html], { type: 'text/html' }), `${baseName}_Portfolio.html`, 'Portfolio (HTML)');
            count++;
        } catch (e) {
            console.warn('Portfolio generation failed:', e.message);
        }
    }
    if (opts.wantJobDetails) {
        addDownloadLink(downloadLinks, buildJobDetailsBlob(meta.title, meta.company, jdText), `${baseName}_JobDetails.md`, 'Job Details (Markdown)');
        count++;
    }
    return { count, matched };
}

// ---------------------------------------------------------------------------
// Background reconciliation for cloud (Ollama) runs.
// If foreground tracking was interrupted (network blip, page reload, the user
// navigated away), any history entry left 'in-progress' with a runId is checked
// here. When the GitHub run completes we flip it to Success (and rebuild the
// downloadable documents) or Failed — so the status never stays wrong.
// ---------------------------------------------------------------------------
let _resumeTimer = null;

async function resumePendingRuns() {
    if (!(window.GitHubRunner && GitHubRunner.hasToken && GitHubRunner.hasToken())) return;
    let history;
    try { history = StorageManager.getHistory(50); } catch (_) { return; }
    const pending = (history || []).filter(h => h && h.status === 'in-progress' && h.runId);
    if (!pending.length) {
        if (_resumeTimer) { clearInterval(_resumeTimer); _resumeTimer = null; }
        return;
    }
    for (const item of pending) {
        let res;
        try { res = await GitHubRunner.checkAndFetch(item.runId); }
        catch (_) { continue; }
        if (!res) continue;
        if (res.state === 'success') {
            await finalizeResumedRun(item, res.data);
        } else if (res.state === 'failed') {
            try {
                StorageManager.updateGeneration(item.id, { status: 'failed', error: 'Cloud job concluded ' + (res.conclusion || 'failure') + '. See the Actions logs.' });
                displayHistory();
            } catch (_) {}
            showToast('An earlier Ollama cloud run failed — see History for details', 'error');
        }
        // 'pending' -> leave as-is; we'll check again on the next tick.
    }
    if (!_resumeTimer) _resumeTimer = setInterval(resumePendingRuns, 30000);
}

function scheduleResumeCheck() {
    // Near-term first check; resumePendingRuns then sets up its own interval.
    setTimeout(() => { try { resumePendingRuns(); } catch (_) {} }, 15000);
}

async function finalizeResumedRun(item, aiData) {
    try {
        if (!aiData || aiData._raw) {
            StorageManager.updateGeneration(item.id, { status: 'failed', error: 'Model did not return clean JSON.' });
            displayHistory();
            return;
        }
        const profile = item.profileId ? StorageManager.getProfile(item.profileId) : null;
        if (!profile) {
            // Can't rebuild documents without the profile, but the run succeeded and
            // the result is committed in the repo — mark it Success regardless.
            StorageManager.updateGeneration(item.id, { status: 'success', error: '' });
            displayHistory();
            showToast('An earlier Ollama cloud resume finished successfully (see History)', 'success');
            return;
        }
        const tailored = mergeTailored(profile, aiData);
        const opts = item.genOpts || { wantResume: true };
        const baseName = item.baseName || safeFileName(profile.displayName || profile.name);
        const downloadLinks = document.getElementById('downloadLinks');
        const statusContent = document.getElementById('statusContent');
        const statusBox = document.getElementById('generationStatus');
        if (downloadLinks) downloadLinks.innerHTML = '';
        const { count, matched } = await buildDocumentsFromProfile(tailored, item.jd || '', baseName, opts, downloadLinks);
        if (statusBox) statusBox.style.display = 'block';
        if (downloadLinks) downloadLinks.style.display = 'block';
        if (statusContent) statusContent.innerHTML = `<p>✅ Your earlier Ollama cloud resume is ready (${count} document set${count === 1 ? '' : 's'}). Download below.</p>`;
        StorageManager.updateGeneration(item.id, {
            status: 'success', error: '', outputs: count, matchedSkills: matched.length, aiUsed: true
        });
        displayHistory();
        showToast('Your Ollama cloud resume is ready — open the Generate tab to download', 'success');
    } catch (e) {
        console.warn('finalizeResumedRun failed:', e.message);
        // The cloud run itself SUCCEEDED (its result is committed in the repo);
        // only the local document rebuild failed. Never strand a succeeded run as
        // "in progress" - mark it Success so the row is actionable (Publish / retry).
        try {
            StorageManager.updateGeneration(item.id, {
                status: 'success',
                error: 'Run succeeded, but auto-rebuilding the documents failed (' + (e.message || 'error') + '). Use the Publish button or click Re-check to rebuild.'
            });
            displayHistory();
            showToast('Cloud run succeeded, but rebuilding documents failed — see History', 'warning');
        } catch (_) {}
    }
}

// ---------------------------------------------------------------------------
// PUBLISH a generation to the user's GitHub account: create a role-named repo,
// push the resume / cover letter / job-details / portfolio, enable GitHub Pages
// so the portfolio is live, then add the application to the tracker with the
// live portfolio + repo links. Driven by a manual button (Generate result row
// and History rows). Reuses the same PAT used for the Ollama pipeline.
// ---------------------------------------------------------------------------
function safeRepoName(s) {
    return String(s || 'application').trim()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90) || 'application';
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || '').split(',')[1] || '');
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

// Build { filename: Blob } for everything we want committed to the published repo.
async function buildPublishFiles(workingProfile, jdText, opts, baseName) {
    const meta = extractJobMeta(jdText);
    const matched = matchSkillsToJD(normalizeProfile(workingProfile), jdText);
    const files = {};
    if (opts.wantResume) {
        files[`${baseName}_Resume.pdf`] = await buildResumePdfBlob(workingProfile, matched);
        files[`${baseName}_Resume.doc`] = buildResumeDocBlob(workingProfile, matched);
    }
    if (opts.wantCover) {
        files[`${baseName}_CoverLetter.doc`] = buildCoverLetterDocBlob(workingProfile, meta.title, meta.company, jdText);
    }
    if (opts.wantJobDetails) {
        files['job-details.md'] = buildJobDetailsBlob(meta.title, meta.company, jdText);
    }
    // Portfolio is committed as index.html so GitHub Pages serves it at the root.
    if (opts.wantPortfolio && window.PortfolioTemplates) {
        try {
            const html = PortfolioTemplates.generatePortfolio(normalizeProfile(workingProfile), opts.template || 'minimalist', 0);
            if (html) files['index.html'] = new Blob([html], { type: 'text/html' });
        } catch (_) { /* portfolio optional */ }
    }
    return { files, meta };
}

async function publishHistoryEntry(histId, btnEl) {
    const item = (StorageManager.getHistory(100) || []).find(h => h.id === histId);
    if (!item) { showToast('Could not find that generation', 'error'); return; }
    if (!(window.GitHubRunner && GitHubRunner.hasToken())) {
        showToast('Add a GitHub token in Settings → Ollama first (it is also used for publishing)', 'warning');
        return;
    }
    if (item.published && item.repoUrl) {
        if (!confirm('This entry was already published to ' + item.repoUrl + '. Publish again and update the files?')) return;
    }
    const profile = item.profileId ? StorageManager.getProfile(item.profileId) : null;
    if (!profile) { showToast('The profile for this entry was not found — cannot rebuild documents', 'error'); return; }

    const statusContent = document.getElementById('statusContent');
    const statusBox = document.getElementById('generationStatus');
    if (statusBox) statusBox.style.display = 'block';
    const setMsg = (html) => { if (statusContent) statusContent.innerHTML = html; };
    const origLabel = btnEl ? btnEl.innerHTML : '';
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Publishing…'; }

    try {
        const jd = item.jd || '';
        const opts = item.genOpts || { wantResume: true, wantCover: true, wantPortfolio: true, wantJobDetails: true, template: 'minimalist' };
        const baseName = item.baseName || safeFileName(profile.displayName || profile.name);
        const meta = extractJobMeta(jd);
        const role = meta.title || item.jobTitle || profile.headline || 'Role';
        const company = meta.company || item.company || 'Company';

        // For Ollama entries re-fetch the committed AI result so the published docs
        // carry the tailored summary/skills/experience, not just the base profile.
        let workingProfile = profile;
        if (item.provider === 'ollama' && item.runId) {
            try {
                const aiData = await GitHubRunner.fetchResult(item.runId);
                if (aiData && !aiData._raw) workingProfile = mergeTailored(profile, aiData);
            } catch (_) { /* fall back to base profile */ }
        }

        const login = await GitHubRunner.getLogin();
        const repoName = safeRepoName(role);
        setMsg(`<p>⏳ Creating repository <code>${escHtml(login)}/${escHtml(repoName)}</code>…</p>`);
        await GitHubRunner.ensureRepo(login, repoName, `${role} — application package (resume, cover letter, portfolio)`);

        const { files } = await buildPublishFiles(workingProfile, jd, opts, baseName);
        const names = Object.keys(files);
        if (!names.length) throw new Error('Nothing to publish — no documents were selected for this generation.');
        let n = 0;
        for (const path of names) {
            n++;
            setMsg(`<p>⏳ Uploading ${n}/${names.length}: <code>${escHtml(path)}</code>…</p>`);
            const b64 = await blobToBase64(files[path]);
            await GitHubRunner.putFile(login, repoName, path, b64, 'Add ' + path);
        }

        const repoUrl = `https://github.com/${login}/${repoName}`;
        let pagesUrl = '';
        if (files['index.html']) {
            setMsg('<p>⏳ Enabling GitHub Pages for the live portfolio…</p>');
            const ok = await GitHubRunner.enablePages(login, repoName, 'main');
            if (ok) pagesUrl = `https://${login}.github.io/${repoName}/`;
        }

        // Applied date defaults to the generation time (editable later in tracker).
        const date = (item.generatedAt ? new Date(item.generatedAt) : new Date()).toISOString().split('T')[0];
        try {
            JobTrackerManager.addApplication({
                portfolio: repoName, role, company, date,
                link: pagesUrl || repoUrl, repo: repoUrl, status: 'Applied', comments: ''
            });
            if (typeof renderApplicationsList === 'function') renderApplicationsList();
        } catch (_) { /* tracker add is best-effort */ }

        try { StorageManager.updateGeneration(histId, { published: true, repoUrl, pagesUrl }); displayHistory(); } catch (_) {}

        const pagesLine = pagesUrl
            ? `<li>Live portfolio: <a href="${pagesUrl}" target="_blank" rel="noopener">${pagesUrl}</a> <small>(Pages can take ~1 min to go live)</small></li>`
            : '';
        setMsg(`<div class="cloud-error">
            <p>✅ <strong>Published to GitHub and added to your tracker.</strong></p>
            <ol class="cloud-error-steps">
                <li>Repository: <a href="${repoUrl}" target="_blank" rel="noopener">${repoUrl}</a></li>
                ${pagesLine}
            </ol>
        </div>`);
        showToast('Published to GitHub and added to the tracker', 'success');
    } catch (e) {
        console.error('Publish failed:', e);
        setMsg(`<p>❌ Publish failed: ${escHtml(e.message)}</p><p><small>Your token needs repo-create + contents + Pages write (classic <code>repo</code> scope, or fine-grained Administration/Contents/Pages = write on your account).</small></p>`);
        showToast('Publish failed: ' + e.message, 'error');
    } finally {
        if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origLabel || '📤 Publish to GitHub & add to tracker'; }
    }
}

// Manually reconcile a stuck row. Reads the recent run list once (reliable -
// it carries status + conclusion + the run-id in name/display_title), resolves
// this row's runId directly, and falls back to importing the latest success.
async function recheckHistoryEntry(histId, btnEl) {
    const item = (StorageManager.getHistory(100) || []).find(h => h.id === histId);
    if (!item) { showToast('Could not find that generation', 'error'); return; }
    if (!(window.GitHubRunner && GitHubRunner.hasToken())) {
        showToast('Add a GitHub token in Settings → Ollama first', 'warning');
        return;
    }
    const origLabel = btnEl ? btnEl.innerHTML : '';
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Checking…'; }
    try {
        const runs = await GitHubRunner.listRecentRuns(20);
        const matchRun = (rid) => runs.find(r =>
            (r.name && r.name.includes(rid)) || (r.display_title && r.display_title.includes(rid))
        );

        // 1) If this row carries a runId, resolve it straight from the run list.
        if (item.runId) {
            const run = matchRun(item.runId);
            if (run) {
                if (run.status === 'completed') {
                    if (run.conclusion === 'success') {
                        const data = await GitHubRunner.fetchResult(item.runId);
                        await finalizeResumedRun(item, data);
                        showToast('Run completed — flipped to Success', 'success');
                    } else {
                        StorageManager.updateGeneration(item.id, { status: 'failed', error: 'Concluded ' + (run.conclusion || 'failure') + '. See the Actions logs.' });
                        displayHistory();
                        showToast('That run concluded as a failure', 'error');
                    }
                    return;
                }
                showToast('Still running on GitHub — check again shortly', 'warning');
                return;
            }
            // runId not in the recent list (aged out) — fall through to import.
        }

        // 2) No runId, or it is no longer in the recent list: import the most
        //    recent successful run so the user still gets their documents.
        const done = runs.filter(r => r.status === 'completed' && r.conclusion === 'success');
        if (!done.length) { showToast('No completed successful runs found to import', 'warning'); return; }
        const pick = done[0];
        const rid = ((String(pick.display_title || pick.name || '')).match(/run-[a-z0-9-]+/i) || [])[0];
        if (!rid) { showToast('Could not parse a run id from the latest run', 'warning'); return; }
        if (!confirm('This entry has no matching run. Import documents from the latest successful run "' + rid + '"?')) return;
        const data = await GitHubRunner.fetchResult(rid);
        await finalizeResumedRun({ ...item, runId: rid }, data);
        showToast('Imported the latest successful run', 'success');
    } catch (e) {
        console.error('Re-check failed:', e);
        showToast('Re-check failed: ' + e.message, 'error');
    } finally {
        if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origLabel || '🔄 Re-check'; }
    }
}

// async function declarations inside this load-guard block do not leak to the
// global scope (no Annex B hoisting), so inline onclick= handlers can't see them.
// Expose them explicitly, the same way generateSingle is exposed below.
window.publishHistoryEntry = publishHistoryEntry;
window.recheckHistoryEntry = recheckHistoryEntry;

// Build the richest possible plain-text source for the model: the full original
// resume text if we captured it, otherwise a reconstruction from structured data.
function buildResumeSourceText(profile) {
    const parts = [];
    if (profile && profile.rawText && String(profile.rawText).trim()) {
        parts.push(String(profile.rawText).trim());
    } else {
        const p = (typeof normalizeProfile === 'function') ? normalizeProfile(profile) : (profile || {});
        if (p.name) parts.push('Name: ' + p.name);
        if (p.email) parts.push('Email: ' + p.email);
        if (p.phone) parts.push('Phone: ' + p.phone);
        if (p.location) parts.push('Location: ' + p.location);
        if (p.summary) parts.push('Summary: ' + p.summary);
        if (Array.isArray(p.skills) && p.skills.length) parts.push('Skills: ' + p.skills.join(', '));
        if (Array.isArray(p.experience) && p.experience.length) {
            parts.push('Experience:');
            p.experience.forEach(e => {
                parts.push([e.position, e.company, e.year].filter(Boolean).join(' | '));
                if (e.description) parts.push(e.description);
            });
        }
        if (Array.isArray(p.education) && p.education.length) {
            parts.push('Education: ' + p.education.map(ed => (typeof ed === 'string' ? ed : [ed.degree, ed.school, ed.year].filter(Boolean).join(', '))).join('; '));
        }
    }
    return parts.join('\n\n').slice(0, 28000);
}

// Format a seconds count as "Xm Ys" (or "Ys" under a minute).
function formatElapsed(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
}

// Render the live "what's happening on the backend" progress card.
function renderCloudProgress(container, pct, msg) {
    if (!container) return;
    const safePct = Math.max(0, Math.min(100, Math.round(pct)));
    container.innerHTML = `
        <div class="cloud-progress">
            <div class="cloud-progress-head">
                <span class="cloud-spinner"></span>
                <strong>Ollama Cloud Generator — Llama 3 on GitHub Actions</strong>
            </div>
            <p class="cloud-progress-msg">${escHtml(msg)}</p>
            <div class="cloud-progress-track"><div class="cloud-progress-fill" style="width:${safePct}%"></div></div>
            <small>A free, ephemeral GitHub runner is installing Ollama, generating your ATS-optimized resume, and committing it back — then it self-destructs. No server to manage, $0 cost (~1–3 min).</small>
        </div>`;
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

    let histId = null;
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

        // Record this attempt up-front so EVERY try is logged (success or not).
        try {
            histId = StorageManager.saveGeneration({
                profile: profile.displayName || profile.name || 'Profile',
                profileId,
                jobTitle: meta.title || '',
                company: meta.company || '',
                provider: provider || 'local',
                mode,
                status: 'in-progress',
                cost: 0,
                outputs: 0,
                jd: jdText.slice(0, 16000),
                baseName,
                genOpts: {
                    wantResume: !!wantResume,
                    wantCover: !!wantCover,
                    wantPortfolio: !!wantPortfolio,
                    wantJobDetails: !!wantJobDetails,
                    template
                }
            });
            displayHistory();
        } catch (_) { /* non-fatal */ }

        if (provider === 'ollama') {
            // Ollama runs in a free, ephemeral GitHub Actions cloud runner — no
            // local server needed. Dispatch the workflow, show live progress,
            // then fetch the committed result and tailor the profile.
            if (!window.GitHubRunner || !GitHubRunner.hasToken()) {
                if (statusContent) statusContent.innerHTML = '<p>⚙️ <strong>Ollama runs in a free GitHub cloud runner.</strong> Add a GitHub Personal Access Token in <strong>Settings → Ollama / Llama 3 (cloud)</strong> first, then click Generate again.</p>';
                showToast('Add a GitHub token in Settings to use the Ollama cloud generator', 'warning');
                try { StorageManager.updateGeneration(histId, { status: 'failed', error: 'No GitHub token configured (Settings → Ollama).' }); displayHistory(); } catch (_) {}
                return;
            }
            try {
                workingProfile = await runOllamaInCloud(profile, jdText, statusContent, histId);
                aiUsed = true;
            } catch (e) {
                console.warn('Ollama cloud generation failed:', e.message);
                const msg = e.message || '';
                // "definitive" = the run actually concluded as a failure or returned
                // bad output. Anything else (Failed to fetch, timeout, not-yet-listed)
                // means the run is still going — keep it in-progress so the background
                // monitor can flip it to Success when it completes.
                const definitive = /finished as|did not return clean JSON/i.test(msg);
                try {
                    if (definitive) {
                        StorageManager.updateGeneration(histId, { status: 'failed', provider: 'ollama', error: msg });
                    } else {
                        StorageManager.updateGeneration(histId, { status: 'in-progress', provider: 'ollama', error: '' });
                    }
                    displayHistory();
                } catch (_) {}
                const actionsUrl = (window.GitHubRunner && GitHubRunner.actionsUrl) ? GitHubRunner.actionsUrl() : '#';
                if (statusContent) statusContent.innerHTML = `
                    <div class="cloud-error">
                        <p>⏳ <strong>Still finishing your Ollama cloud resume…</strong></p>
                        <p>${escHtml(e.message)}</p>
                        <p style="margin-top:0.6rem;">Good news — the job runs on GitHub's servers, not in this browser tab, so it keeps going on its own. <strong>You can navigate to other pages and finish other work while I keep monitoring and updating this job for you</strong>, or you can also:</p>
                        <ol class="cloud-error-steps">
                            <li>Open your <a href="${actionsUrl}" target="_blank" rel="noopener">Actions tab</a> and find the latest <em>Ollama Resume</em> run. If it's still running (yellow dot), just wait — it can take ~2–4 min on the free CPU runner.</li>
                            <li>Click <strong>Generate Now</strong> again to re-attach / start a fresh attempt (it's free). The app now waits longer and bypasses GitHub's API cache, so it should attach correctly.</li>
                            <li>If a run shows a red ✗, click it to read the logs (usually a token-permission or model-name issue), fix it in <strong>Settings → Ollama</strong>, and retry. Tip: use model <code>llama3.2</code> (3B) — it finishes faster than <code>llama3</code> (8B).</li>
                        </ol>
                        <p class="cloud-error-cost">💸 <strong>No cost concern:</strong> this repo is public, so GitHub Actions minutes are <strong>unlimited and free</strong>. The runner is temporary and shuts itself down automatically when the job finishes (or after 15 min max) — there is no server left running to bill you.</p>
                    </div>`;
                showToast('Ollama cloud job is still running or needs attention — see the options shown', 'warning');
                if (!definitive) scheduleResumeCheck();
                return;
            }
            if (statusContent) statusContent.innerHTML = '<p>⏳ Building your documents...</p>';
        } else if (provider && window.AIIntegration && AIIntegration.isConfigured(provider)) {
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

        const { count: builtCount, matched } = await buildDocumentsFromProfile(
            workingProfile, jdText, baseName,
            { wantResume, wantCover, wantPortfolio, wantJobDetails, template },
            downloadLinks
        );
        count = builtCount;

        // Update the history record for this attempt (now that we know the outcome).
        try {
            StorageManager.updateGeneration(histId, {
                jobTitle: meta.title,
                provider: provider || 'local',
                mode,
                status: 'success',
                outputs: count,
                matchedSkills: matched.length,
                aiUsed,
                cost: aiCost
            });
            displayHistory();
        } catch (e) { /* non-fatal */ }

        const matchNote = matched.length ? ` Matched ${matched.length} skill(s) to the JD.` : '';
        const aiNote = aiUsed ? ` AI-tailored (~$${aiCost.toFixed(4)}).` : '';
        const publishBtn = (window.GitHubRunner && GitHubRunner.hasToken())
            ? `<button class="btn btn-primary" style="margin-top:0.7rem;" onclick="publishHistoryEntry('${histId}', this)">📤 Publish to GitHub &amp; add to tracker</button>`
            : `<p style="margin-top:0.6rem;"><small>💡 Add a GitHub token in <strong>Settings → Ollama</strong> to publish these to your GitHub (repo + live portfolio) and auto-add to the tracker.</small></p>`;
        if (statusContent) statusContent.innerHTML = `<p>✅ Generated ${count} document set(s).${aiNote}${matchNote} Click below to download.</p>${publishBtn}`;
        if (downloadLinks) downloadLinks.style.display = 'block';
        showToast(`Generated ${count} document set(s)`, 'success');
    } catch (error) {
        console.error('Generation error:', error);
        try { StorageManager.updateGeneration(histId, { status: 'failed', error: error.message }); displayHistory(); } catch (_) {}
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
    // Show/hide the per-mode price tags depending on whether the provider charges
    refreshGenerationModeLabels(provider);
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
    if (provider === 'ollama') {
        const ready = window.GitHubRunner && GitHubRunner.hasToken();
        box.innerHTML = ready
            ? '<p>✅ <strong>Ollama / Llama 3 (cloud)</strong> — on Generate, a free GitHub Actions runner spins up, runs Llama 3, commits the tailored resume, and self-destructs. $0 cost, ~1–3 min. A live progress card will show each step.</p>'
            : '<p>⚙️ <strong>Ollama / Llama 3 (cloud)</strong> runs on a free GitHub Actions runner — no local server needed. Add a GitHub token in <strong>Settings → Ollama</strong> to enable it.</p>';
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

// Free providers (none / Pollinations / your own custom endpoint) must not show
// dollar price tags on the Generation Mode options. Paid providers do.
function refreshGenerationModeLabels(provider) {
    const sel = document.getElementById('generationMode');
    if (!sel) return;
    const free = !provider || provider === 'pollinations' || provider === 'custom' || provider === 'ollama';
    const base = {
        fast: 'Fast (Quick keyword matching)',
        smart: 'Smart (Full tailoring)',
        ultra: 'Ultra (Full + Portfolio content)'
    };
    const price = { fast: ' - $0.001', smart: ' - $0.03', ultra: ' - $0.06' };
    Array.from(sel.options).forEach(o => {
        if (base[o.value]) o.textContent = base[o.value] + (free ? '' : price[o.value]);
    });
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
    if (provider === 'ollama') {
        box.innerHTML = `${count} job(s) × <strong>Ollama / Llama 3</strong> — free, runs in an ephemeral GitHub cloud runner (single-resume tab supported).`;
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

    // Ollama (Llama 3) — runs FREE in an ephemeral GitHub Actions cloud runner.
    // No local server: the website dispatches a workflow that installs Ollama,
    // generates the tailored resume, commits it back, and self-destructs.
    const oll = AIIntegration.getOllamaConfig();
    const ghCfg = (window.GitHubRunner && GitHubRunner.getConfig) ? GitHubRunner.getConfig() : { owner: 'rdammala', repo: 'resume-engine-pro', model: 'llama3.2' };
    const hasTok = !!(window.GitHubRunner && GitHubRunner.hasToken());
    const tokenScopeUrl = 'https://github.com/settings/tokens?type=beta';
    html += `<div class="ai-provider-card">
        <h4>${escHtml(AIIntegration.providers.ollama.name)} ${hasTok ? '✅' : ''}</h4>
        <p>Free &amp; automated — when you click <strong>Generate</strong>, the site triggers a GitHub Actions workflow that spins up a fresh cloud runner, installs Ollama, runs <strong>Llama 3</strong>, tailors your resume to the JD, commits the result, and <strong>self-destructs</strong>. No local server, $0 cost.</p>
        <p style="font-size:0.85rem;opacity:0.85;">One-time setup: create a <a href="${tokenScopeUrl}" target="_blank" rel="noopener">fine-grained GitHub token</a> scoped to <code>${escHtml(ghCfg.owner)}/${escHtml(ghCfg.repo)}</code> with <strong>Actions: Read &amp; write</strong> and <strong>Contents: Read &amp; write</strong> (or a classic token with <code>repo</code> + <code>workflow</code>). It is stored only in your browser.</p>
        <div class="form-group">
            <label>GitHub Personal Access Token</label>
            <input type="password" id="ghPat" placeholder="${hasTok ? '•••••••• (saved — paste to replace)' : 'github_pat_… or ghp_…'}" />
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Repo owner</label>
                <input type="text" id="ghOwner" placeholder="rdammala" value="${escHtml(ghCfg.owner)}" />
            </div>
            <div class="form-group">
                <label>Repo name</label>
                <input type="text" id="ghRepo" placeholder="resume-engine-pro" value="${escHtml(ghCfg.repo)}" />
            </div>
        </div>
        <div class="form-group">
            <label>Model — recommended <code>llama3.2</code> (3B, fast &amp; reliable on the free CPU runner)</label>
            <input type="text" id="ollamaModel" placeholder="llama3.2" value="${escHtml((oll.model === 'llama3' ? 'llama3.2' : (oll.model || ghCfg.model)))}" />
        </div>
        <button class="btn btn-secondary" onclick="saveOllamaCloudConfig()">Save Ollama Cloud Settings</button>
        ${hasTok ? '<button class="btn btn-secondary" onclick="clearOllamaToken()">Remove Token</button>' : ''}
        <small>💸 This repo is <strong>public</strong>, so GitHub Actions minutes are <strong>unlimited &amp; free ($0)</strong>. The runner is temporary and shuts itself down when the job finishes (15-min max) — nothing keeps running, nothing is billed. Requires the <code>ollama-resume.yml</code> workflow (already included). Avoid <code>llama3</code> (8B) — it can run out of memory mid-generation on the free runner; stick with <code>llama3.2</code>.</small>
    </div>`;

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

function saveOllamaCloudConfig() {
    const token = document.getElementById('ghPat')?.value.trim();
    const owner = document.getElementById('ghOwner')?.value.trim();
    const repo = document.getElementById('ghRepo')?.value.trim();
    const model = document.getElementById('ollamaModel')?.value.trim();
    if (!window.GitHubRunner) {
        showToast('GitHub runner module not loaded', 'error');
        return;
    }
    if (token) GitHubRunner.setToken(token);
    GitHubRunner.setConfig({ owner, repo, model });
    // keep AIIntegration's model in sync so the cloud flow reads a consistent value
    if (model) {
        const cur = AIIntegration.getOllamaConfig();
        AIIntegration.setOllamaConfig(cur.endpoint, model);
    }
    if (!GitHubRunner.hasToken()) {
        showToast('Saved — add a GitHub token to enable the cloud generator', 'warning');
    } else {
        showToast('Ollama cloud settings saved', 'success');
    }
    renderAISettings();
}

function clearOllamaToken() {
    if (window.GitHubRunner) GitHubRunner.clearToken();
    showToast('GitHub token removed', 'info');
    renderAISettings();
}

}

