// ============================================================================
// MAIN APPLICATION ORCHESTRATION
// ============================================================================

let currentUser = null;
let currentProfile = null;
let selectedAIProvider = 'openai';
let selectedMode = 'smart';
let generatedResume = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeApp() {
    // Load any existing session
    const session = await GitHubManager.loadSession();
    if (session.success) {
        showPage('appPage');
        currentUser = session.user;
        updateUI();
    } else {
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
    // Remove active class from all buttons and content
    document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.main-tab-content').forEach(tab => tab.classList.remove('active'));
    
    // Find and activate the clicked button by matching onclick content
    const buttons = document.querySelectorAll('.main-tab-btn');
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });
    
    // Activate the content tab
    const content = document.getElementById(tabName);
    if (content) {
        content.classList.add('active');
    }
    
    // Initialize tracker when switching to applications tab
    if (tabName === 'applications' && window.initializeTracker) {
        initializeTracker();
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function initiateGitHubLogin() {
    // Show token input modal
    const token = prompt('Enter your GitHub Personal Access Token:\n\nCreate one at: https://github.com/settings/tokens\n\nScopes needed: repo, gist, user');
    if (!token || token.trim() === '') return;
    
    await handleLogin(token);
}

async function handleLogin(token) {
    if (!token) {
        alert('Please enter your GitHub Personal Access Token');
        return;
    }
    
    try {
        const result = await GitHubManager.authenticate(token);
        if (result.success) {
            currentUser = result.user;
            showPage('appPage');
            updateUI();
        } else {
            alert('Authentication failed: ' + (result.error || 'Invalid token'));
        }
    } catch (error) {
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
    
    // Modal close handlers (click outside modal)
    window.addEventListener('click', (e) => {
        const settingsModal = document.getElementById('settingsModal');
        const appModal = document.getElementById('applicationModal');
        const contactModal = document.getElementById('contactModal');
        
        if (e.target === settingsModal) closeSettings();
        if (e.target === appModal && typeof closeApplicationModal !== 'undefined') closeApplicationModal();
        if (e.target === contactModal && typeof closeContactModal !== 'undefined') closeContactModal();
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

function generateSingleResume() {\n    const profileSelect = document.querySelector('select[value]');\n    if (!profileSelect || profileSelect.value === '' || profileSelect.value === '-- Select a profile --') {\n        alert('Please select a profile first');\n        return;\n    }\n    alert('Resume generation started... (Feature coming soon)');\n}\n\nfunction generateBulkResumes() {\n    alert('Bulk generation feature coming soon');\n}\n\n// ============================================================================\n// GENERATOR MODE HANDLERS\n// ============================================================================\n\nfunction switchGeneratorMode(mode) {\n    // Hide all modes\n    document.getElementById('singleMode').style.display = 'none';\n    document.getElementById('bulkMode').style.display = 'none';\n    \n    // Remove active class from buttons\n    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));\n    \n    // Show selected mode\n    if (mode === 'single') {\n        document.getElementById('singleMode').style.display = 'block';\n        document.querySelector('.mode-btn:first-of-type').classList.add('active');\n    } else if (mode === 'bulk') {\n        document.getElementById('bulkMode').style.display = 'block';\n        document.querySelector('.mode-btn:nth-of-type(2)').classList.add('active');\n    }\n}\n\nfunction switchJDInput(type) {\n    document.getElementById('pasteJD').style.display = 'none';\n    document.getElementById('urlJD').style.display = 'none';\n    \n    document.querySelectorAll('.input-tab').forEach(btn => btn.classList.remove('active'));\n    \n    if (type === 'paste') {\n        document.getElementById('pasteJD').style.display = 'block';\n        event.target.classList.add('active');\n    } else if (type === 'url') {\n        document.getElementById('urlJD').style.display = 'block';\n        event.target.classList.add('active');\n    }\n}\n\nfunction loadProfileData() {\n    const select = document.getElementById('selectProfile');\n    if (select && select.value) {\n        console.log('Loading profile:', select.value);\n    }\n}
