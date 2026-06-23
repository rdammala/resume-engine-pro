
// ============================================================================
// JOB TRACKER FUNCTIONS
// ============================================================================

window._trackerFunctionsLoaded = true;

// Tracker Initialization
async function initializeTracker() {
    renderApplicationsList();
    renderContactsList();
    renderPortfolioGuide();
    updateTrackerStats();
    updateTrackerLastUpdated();
}

// Tab Switching
function switchTrackerTab(tabName) {
    document.querySelectorAll('.tracker-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tracker-tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    const content = document.getElementById(`tracker${tabName.charAt(0).toUpperCase()}${tabName.slice(1)}`);
    if (content) content.classList.add('active');
}

// ========================================================================
// APPLICATIONS
// ========================================================================

function renderApplicationsList() {
    const apps = JobTrackerManager.getApplications();
    const stats = JobTrackerManager.getStats();
    
    // Render stats
    const statsHtml = `
        <div class="stat-badge">
            <div class="stat-badge-value">${stats.total}</div>
            <div class="stat-badge-label">Total</div>
        </div>
        <div class="stat-badge">
            <div class="stat-badge-value">${stats.applied}</div>
            <div class="stat-badge-label">Applied</div>
        </div>
        <div class="stat-badge">
            <div class="stat-badge-value">${stats.interviewing}</div>
            <div class="stat-badge-label">Interviewing</div>
        </div>
        <div class="stat-badge">
            <div class="stat-badge-value">${stats.offered}</div>
            <div class="stat-badge-label">Offered</div>
        </div>
        <div class="stat-badge">
            <div class="stat-badge-value">${stats.rejected}</div>
            <div class="stat-badge-label">Rejected</div>
        </div>
    `;
    document.getElementById('appStats').innerHTML = statsHtml;
    
    // Render table
    const tableHtml = `
        <table class="applications-table">
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Applied</th>
                    <th>Portfolio</th>
                    <th>Status</th>
                    <th>Comments</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${apps.map(app => `
                    <tr>
                        <td>${app.role}</td>
                        <td>${app.company}</td>
                        <td>${app.date}</td>
                        <td>
                            ${app.link ? `<a href="${app.link}" target="_blank" style="color: var(--primary);">View</a>` : 'N/A'}
                        </td>
                        <td>
                            <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
                        </td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${app.comments || ''}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn" onclick="editApplication(${app.id})" title="Edit">✏️</button>
                                <button class="action-btn" onclick="deleteApplication(${app.id})" title="Delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('applicationsList').innerHTML = tableHtml;
}

function filterTrackerApplications() {
    const search = document.getElementById('appSearch').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    
    let apps = JobTrackerManager.getApplications();
    
    if (search) {
        apps = apps.filter(app => 
            app.role.toLowerCase().includes(search) ||
            app.company.toLowerCase().includes(search) ||
            app.portfolio.toLowerCase().includes(search) ||
            app.comments.toLowerCase().includes(search)
        );
    }
    
    if (status) {
        apps = apps.filter(app => app.status === status);
    }
    
    // Render filtered
    const tableHtml = `
        <table class="applications-table">
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Applied</th>
                    <th>Portfolio</th>
                    <th>Status</th>
                    <th>Comments</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${apps.map(app => `
                    <tr>
                        <td>${app.role}</td>
                        <td>${app.company}</td>
                        <td>${app.date}</td>
                        <td>
                            ${app.link ? `<a href="${app.link}" target="_blank" style="color: var(--primary);">View</a>` : 'N/A'}
                        </td>
                        <td>
                            <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
                        </td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${app.comments || ''}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn" onclick="editApplication(${app.id})" title="Edit">✏️</button>
                                <button class="action-btn" onclick="deleteApplication(${app.id})" title="Delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('applicationsList').innerHTML = tableHtml;
}

function openApplicationModal(appId = null) {
    const modal = document.getElementById('applicationModal');
    const form = modal.querySelector('.modal-form');
    const title = document.getElementById('appModalTitle');
    
    if (appId) {
        title.textContent = 'Edit Application';
        const app = JobTrackerManager.getApplications().find(a => a.id === appId);
        if (app) {
            document.getElementById('appPortfolio').value = app.portfolio;
            document.getElementById('appDate').value = app.date;
            document.getElementById('appRole').value = app.role;
            document.getElementById('appCompany').value = app.company;
            document.getElementById('appLink').value = app.link || '';
            document.getElementById('appStatus').value = app.status;
            document.getElementById('appComments').value = app.comments || '';
        }
        modal.dataset.appId = appId;
    } else {
        title.textContent = 'Add Application';
        if (form) form.reset();
        document.getElementById('appDate').value = new Date().toISOString().split('T')[0];
        modal.removeAttribute('data-appId');
    }
    
    modal.style.display = 'flex';
}

function closeApplicationModal() {
    document.getElementById('applicationModal').style.display = 'none';
}

function saveApplication(event) {
    event.preventDefault();
    
    const app = {
        portfolio: document.getElementById('appPortfolio').value,
        date: document.getElementById('appDate').value,
        role: document.getElementById('appRole').value,
        company: document.getElementById('appCompany').value,
        link: document.getElementById('appLink').value,
        status: document.getElementById('appStatus').value,
        comments: document.getElementById('appComments').value
    };
    
    const modal = document.getElementById('applicationModal');
    const appId = modal.dataset.appId;
    
    if (appId) {
        JobTrackerManager.updateApplication(parseInt(appId), app);
    } else {
        JobTrackerManager.addApplication(app);
    }
    
    renderApplicationsList();
    closeApplicationModal();
    updateTrackerLastUpdated();
}

function editApplication(appId) {
    openApplicationModal(appId);
}

function deleteApplication(appId) {
    if (confirm('Delete this application?')) {
        JobTrackerManager.deleteApplication(appId);
        renderApplicationsList();
        updateTrackerLastUpdated();
    }
}

// ========================================================================
// CONTACTS
// ========================================================================

function renderContactsList() {
    const contacts = JobTrackerManager.getContacts();
    
    const html = contacts.map(contact => {
        let phoneHtml = '';
        if (contact.phoneCall) phoneHtml += `<div class="contact-phone">☎️ <a href="tel:${contact.phoneCall}">${contact.phoneCall}</a></div>`;
        if (contact.phoneWhatsApp) phoneHtml += `<div class="contact-phone">📱 <a href="https://wa.me/${contact.phoneWhatsApp.replace(/\D/g, '')}">${contact.phoneWhatsApp}</a></div>`;
        if (contact.phoneOther) phoneHtml += `<div class="contact-phone">🔗 ${contact.phoneOther}</div>`;
        
        const resumeBadge = contact.resumeShared ? '<span class="resume-badge">✓ Resume Shared</span>' : '';
        const voiceBadge = contact.voiceNote ? '<span class="voice-badge">🎤 Voice Note</span>' : '';
        
        return `
        <div class="contact-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3>${contact.name}</h3>
                    <div class="contact-info"><strong>${contact.company || 'N/A'}</strong></div>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
                    ${resumeBadge}
                    ${voiceBadge}
                </div>
            </div>
            <div class="contact-info">
                📧 ${contact.email || 'N/A'}
            </div>
            ${contact.linkedin ? `
            <div class="contact-info">
                💼 <a href="https://${contact.linkedin}" target="_blank">LinkedIn</a>
            </div>
            ` : ''}
            ${phoneHtml ? `<div style="margin: 0.5rem 0;">${phoneHtml}</div>` : ''}
            <div class="contact-info">
                🔗 <em>${contact.source || 'Direct contact'}</em>
            </div>
            ${contact.comments ? `
            <div class="contact-info" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                <small>${contact.comments}</small>
            </div>
            ` : ''}
            <div class="row-actions" style="margin-top: 1rem;">
                <button class="action-btn" onclick="editContact(${contact.id})" title="Edit">✏️</button>
                <button class="action-btn" onclick="deleteContact(${contact.id})" title="Delete">🗑️</button>
                ${contact.voiceNote ? `<button class="action-btn" onclick="openVoiceModal(${contact.id})" title="Voice Note">🎤</button>` : ''}
            </div>
        </div>
    `;
    }).join('');
    
    document.getElementById('contactsList').innerHTML = html || '<p style="grid-column: 1/-1;">No contacts yet</p>';
}

function filterTrackerContacts() {
    const search = document.getElementById('contactSearch').value.toLowerCase();
    const all = JobTrackerManager.getContacts();
    
    const contacts = all.filter(c => 
        c.name.toLowerCase().includes(search) ||
        (c.company || '').toLowerCase().includes(search) ||
        (c.email || '').toLowerCase().includes(search)
    );
    
    const html = contacts.map(contact => {
        let phoneHtml = '';
        if (contact.phoneCall) phoneHtml += `<div class="contact-phone">☎️ <a href="tel:${contact.phoneCall}">${contact.phoneCall}</a></div>`;
        if (contact.phoneWhatsApp) phoneHtml += `<div class="contact-phone">📱 <a href="https://wa.me/${contact.phoneWhatsApp.replace(/\D/g, '')}">${contact.phoneWhatsApp}</a></div>`;
        if (contact.phoneOther) phoneHtml += `<div class="contact-phone">🔗 ${contact.phoneOther}</div>`;
        
        const resumeBadge = contact.resumeShared ? '<span class="resume-badge">✓ Resume Shared</span>' : '';
        const voiceBadge = contact.voiceNote ? '<span class="voice-badge">🎤 Voice Note</span>' : '';
        
        return `
        <div class="contact-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3>${contact.name}</h3>
                    <div class="contact-info"><strong>${contact.company || 'N/A'}</strong></div>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
                    ${resumeBadge}
                    ${voiceBadge}
                </div>
            </div>
            <div class="contact-info">
                📧 ${contact.email || 'N/A'}
            </div>
            ${contact.linkedin ? `
            <div class="contact-info">
                💼 <a href="https://${contact.linkedin}" target="_blank">LinkedIn</a>
            </div>
            ` : ''}
            ${phoneHtml ? `<div style="margin: 0.5rem 0;">${phoneHtml}</div>` : ''}
            <div class="row-actions" style="margin-top: 1rem;">
                <button class="action-btn" onclick="editContact(${contact.id})" title="Edit">✏️</button>
                <button class="action-btn" onclick="deleteContact(${contact.id})" title="Delete">🗑️</button>
                ${contact.voiceNote ? `<button class="action-btn" onclick="openVoiceModal(${contact.id})" title="Voice Note">🎤</button>` : ''}
            </div>
        </div>
    `;
    }).join('');
    
    document.getElementById('contactsList').innerHTML = html || '<p style="grid-column: 1/-1;">No contacts found</p>';
}

function openContactModal(contactId = null) {
    const modal = document.getElementById('contactModal');
    const form = modal.querySelector('.modal-form');
    
    if (contactId) {
        const contact = JobTrackerManager.getContacts().find(c => c.id === contactId);
        if (contact) {
            document.getElementById('contactName').value = contact.name;
            document.getElementById('contactCompany').value = contact.company || '';
            document.getElementById('contactEmail').value = contact.email || '';
            document.getElementById('contactLinkedIn').value = contact.linkedin || '';
            document.getElementById('contactPhoneCall').value = contact.phoneCall || '';
            document.getElementById('contactPhoneWhatsApp').value = contact.phoneWhatsApp || '';
            document.getElementById('contactPhoneOther').value = contact.phoneOther || '';
            document.getElementById('contactSource').value = contact.source || '';
            document.getElementById('contactComments').value = contact.comments || '';
            document.getElementById('contactResumeShared').checked = contact.resumeShared || false;
            document.getElementById('voiceNoteBtn').style.display = contact.voiceNote ? 'inline-block' : 'none';
        }
        modal.dataset.contactId = contactId;
    } else {
        if (form) form.reset();
        document.getElementById('contactPhoneCall').value = '';
        document.getElementById('contactPhoneWhatsApp').value = '';
        document.getElementById('contactPhoneOther').value = '';
        document.getElementById('contactResumeShared').checked = false;
        document.getElementById('voiceNoteBtn').style.display = 'none';
        modal.removeAttribute('data-contactId');
    }
    
    modal.style.display = 'flex';
}

function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
}

function saveContact(event) {
    event.preventDefault();
    
    const contact = {
        name: document.getElementById('contactName').value,
        company: document.getElementById('contactCompany').value,
        email: document.getElementById('contactEmail').value,
        linkedin: document.getElementById('contactLinkedIn').value,
        phoneCall: document.getElementById('contactPhoneCall').value || '',
        phoneWhatsApp: document.getElementById('contactPhoneWhatsApp').value || '',
        phoneOther: document.getElementById('contactPhoneOther').value || '',
        source: document.getElementById('contactSource').value,
        comments: document.getElementById('contactComments').value,
        resumeShared: document.getElementById('contactResumeShared').checked,
        resumeSharedDate: document.getElementById('contactResumeShared').checked ? new Date().toISOString().split('T')[0] : null
    };
    
    const modal = document.getElementById('contactModal');
    const contactId = modal.dataset.contactId;
    
    if (contactId) {
        JobTrackerManager.updateContact(parseInt(contactId), contact);
    } else {
        JobTrackerManager.addContact(contact);
    }
    
    renderContactsList();
    closeContactModal();
    updateTrackerLastUpdated();
}

function editContact(contactId) {
    openContactModal(contactId);
}

function deleteContact(contactId) {
    if (confirm('Delete this contact?')) {
        JobTrackerManager.deleteContact(contactId);
        renderContactsList();
        updateTrackerLastUpdated();
    }
}

// ========================================================================
// PORTFOLIO GUIDE
// ========================================================================

function renderPortfolioGuide() {
    const portfolios = JobTrackerManager.getPortfolioGuide();
    
    const html = portfolios.map(portfolio => `
        <div class="portfolio-item">
            <h3>${portfolio.name}</h3>
            <span class="portfolio-count">${portfolio.count} application${portfolio.count > 1 ? 's' : ''}</span>
            <a href="${portfolio.url}" target="_blank" class="portfolio-link">${portfolio.url}</a>
        </div>
    `).join('');
    
    document.getElementById('portfolioGuide').innerHTML = html || '<p>No portfolios yet</p>';
}

// ========================================================================
// UTILITIES
// ========================================================================

function updateTrackerStats() {
    const stats = JobTrackerManager.getStats();
    // Stats rendered inline in renderApplicationsList
}

function updateTrackerLastUpdated() {
    const updated = JobTrackerManager.getLastUpdated();
    if (updated) {
        document.getElementById('trackerLastUpdated').textContent = `Last Updated: ${updated}`;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('appTheme', newTheme);
}

function exportTrackerData() {
    const data = JobTrackerManager.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importTrackerData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = JobTrackerManager.import(event.target.result);
            if (result.success) {
                showToast('Tracker data imported successfully', 'success');
                renderApplicationsList();
                renderContactsList();
                renderPortfolioGuide();
            } else {
                showToast(`Import failed: ${result.error}`, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ========================================================================
// PHASE 8B: VOICE RECORDING INFRASTRUCTURE
// ========================================================================

let voiceRecorder, mediaRecorder, currentVoiceBlob, recordingStartTime, voiceTimerInterval;
let currentVoiceContactId = null;

function initVoiceRecording() {
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
        voiceRecorder = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        voiceRecorder.lang = 'en-US';
        voiceRecorder.continuous = true;
        voiceRecorder.interimResults = true;
        
        voiceRecorder.onstart = () => {
            console.log('Voice recognition started');
        };
        
        voiceRecorder.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    interim += event.results[i][0].transcript + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            const transcriptBox = document.getElementById('voiceTranscript');
            if (transcriptBox) {
                transcriptBox.value = (transcriptBox.value + interim).trim();
            }
        };
        
        voiceRecorder.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    }
}

function openVoiceModal(contactId) {
    currentVoiceContactId = contactId;
    const modal = document.getElementById('voiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('voiceTranscript').value = '';
        document.getElementById('voiceTimer').textContent = '0:00';
        document.getElementById('voiceRecordBtn').textContent = '🔴 Start Recording';
        document.getElementById('voiceRecordBtn').classList.remove('recording');
    }
    initVoiceRecording();
}

function closeVoiceModal() {
    stopVoiceRecording();
    const modal = document.getElementById('voiceModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function toggleVoiceRecording() {
    const btn = document.getElementById('voiceRecordBtn');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            currentVoiceBlob = new Blob(chunks, { type: 'audio/webm' });
            const audioElement = document.getElementById('voicePlayback');
            if (audioElement) {
                audioElement.src = URL.createObjectURL(currentVoiceBlob);
            }
        };
        
        mediaRecorder.start();
        document.getElementById('voiceRecordBtn').textContent = '⏹ Stop Recording';
        document.getElementById('voiceRecordBtn').classList.add('recording');
        
        recordingStartTime = Date.now();
        updateVoiceTimer();
        
        // Start Web Speech API for transcription
        if (voiceRecorder) {
            voiceRecorder.start();
        }
    } catch (err) {
        console.error('Recording error:', err);
        showToast('Microphone access denied. Please check permissions.', 'error');
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        document.getElementById('voiceRecordBtn').textContent = '🔴 Start Recording';
        document.getElementById('voiceRecordBtn').classList.remove('recording');
        
        if (voiceRecorder) {
            voiceRecorder.stop();
        }
    }
    
    if (voiceTimerInterval) {
        clearInterval(voiceTimerInterval);
    }
}

function updateVoiceTimer() {
    voiceTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        document.getElementById('voiceTimer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (elapsed >= 60) {
            stopVoiceRecording();
        }
    }, 100);
}

function saveVoiceNote() {
    if (!currentVoiceBlob) {
        showToast('No recording available', 'warning');
        return;
    }
    
    const contact = JobTrackerManager.getContacts().find(c => c.id === currentVoiceContactId);
    if (!contact) return;
    
    const updatedContact = {
        ...contact,
        voiceNote: currentVoiceBlob,
        voiceTranscript: document.getElementById('voiceTranscript').value.trim(),
        voiceRecordedAt: new Date().toISOString()
    };
    
    JobTrackerManager.updateContact(currentVoiceContactId, updatedContact);
    renderContactsList();
    updateTrackerLastUpdated();
    closeVoiceModal();
}

// Modal close on background click
document.addEventListener('click', (e) => {
    if (e.target.id === 'applicationModal') {
        closeApplicationModal();
    }
    if (e.target.id === 'contactModal') {
        closeContactModal();
    }
    if (e.target.id === 'voiceModal') {
        closeVoiceModal();
    }
});