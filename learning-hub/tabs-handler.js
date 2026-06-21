console.log("tabs-handler.js loaded");

// Export functions to window immediately so they're available for onclick handlers
window.switchTab = function(tabName) {
    console.log("switchTab called with:", tabName);
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    // Show the selected tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Find and activate the clicked button
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Render bugs tab if requested
    if (tabName === 'bugs') {
        window.renderBugs();
    }
};

window.renderBugs = function() {
    console.log("renderBugs called, BUGS length:", window.BUGS?.length || 0);
    if (!window.BUGS || window.BUGS.length === 0) {
        console.warn("No BUGS array available");
        return;
    }
    const tbody = document.getElementById('bugTableBody');
    if (!tbody) {
        console.warn("No bugTableBody element found");
        return;
    }
    tbody.innerHTML = window.BUGS.map(bug => `
        <tr>
            <td><span class="bug-link" onclick="window.showBugDetail(${bug.id})">#${bug.id}</span></td>
            <td>${bug.title}</td>
            <td><span class="severity-${bug.severity.toLowerCase()}">${bug.severity.toUpperCase()}</span></td>
            <td>${bug.status === 'Fixed' ? '✅ ' : bug.status === 'Pending' ? '⏳ ' : '🔄 '}${bug.status}</td>
            <td><span class="role-badge">${bug.role}</span></td>
            <td>${bug.fixTime}</td>
        </tr>
    `).join('');
};

window.showBugDetail = function(bugId) {
    console.log("showBugDetail called with ID:", bugId);
    if (!window.BUGS) {
        console.error("BUGS array not available");
        return;
    }
    const bug = window.BUGS.find(b => b.id === bugId);
    if (!bug) {
        console.error("Bug not found:", bugId);
        return;
    }
    
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) {
        console.error("modalBody not found");
        return;
    }
    
    modalBody.innerHTML = `
        <h3>#${bug.id}: ${bug.title}</h3>
        <p style="color: var(--text-light); margin-bottom: 1rem;"><strong>Role:</strong> ${bug.role} | <strong>Severity:</strong> <span class="severity-${bug.severity.toLowerCase()}">${bug.severity}</span> | <strong>Status:</strong> ${bug.status}</p>
        
        <h4>Description</h4>
        <p>${bug.description}</p>
        
        <h4>Root Cause</h4>
        <p>${bug.rootCause}</p>
        
        <h4>Resolution</h4>
        <p>${bug.resolution}</p>
        
        <h4>Code Changes</h4>
        <div class="code-block">${bug.codeExample}</div>
        
        <h4>Lesson Learned</h4>
        <p><strong>💡</strong> ${bug.lesson}</p>
        
        <h4>Impact Assessment</h4>
        <p><strong>🎯</strong> ${bug.impact}</p>
    `;
    
    document.getElementById('bugModal').classList.add('active');
};

window.closeModal = function() {
    const modal = document.getElementById('bugModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.filterBugs = function() {
    if (!window.BUGS) return;
    const search = document.getElementById('bugSearch').value.toLowerCase();
    const tbody = document.getElementById('bugTableBody');
    
    const filtered = window.BUGS.filter(bug => 
        bug.id.toString().includes(search) || 
        bug.title.toLowerCase().includes(search)
    );
    
    tbody.innerHTML = filtered.map(bug => `
        <tr>
            <td><span class="bug-link" onclick="window.showBugDetail(${bug.id})">#${bug.id}</span></td>
            <td>${bug.title}</td>
            <td><span class="severity-${bug.severity.toLowerCase()}">${bug.severity.toUpperCase()}</span></td>
            <td>${bug.status === 'Fixed' ? '✅ ' : bug.status === 'Pending' ? '⏳ ' : '🔄 '}${bug.status}</td>
            <td><span class="role-badge">${bug.role}</span></td>
            <td>${bug.fixTime}</td>
        </tr>
    `).join('');
};

window.filterBySeverity = function(severity) {
    if (!window.BUGS) return;
    const tbody = document.getElementById('bugTableBody');
    const filtered = severity === 'all' ? window.BUGS : window.BUGS.filter(b => b.severity.toLowerCase() === severity);
    
    tbody.innerHTML = filtered.map(bug => `
        <tr>
            <td><span class="bug-link" onclick="window.showBugDetail(${bug.id})">#${bug.id}</span></td>
            <td>${bug.title}</td>
            <td><span class="severity-${bug.severity.toLowerCase()}">${bug.severity.toUpperCase()}</span></td>
            <td>${bug.status === 'Fixed' ? '✅ ' : bug.status === 'Pending' ? '⏳ ' : '🔄 '}${bug.status}</td>
            <td><span class="role-badge">${bug.role}</span></td>
            <td>${bug.fixTime}</td>
        </tr>
    `).join('');
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
};

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired");
    document.addEventListener('click', (e) => {
        if (e.target.id === 'bugModal') {
            window.closeModal();
        }
    });
});

console.log("tabs-handler.js initialization complete - functions exported to window");
