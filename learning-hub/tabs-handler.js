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

    // Render features tab if requested
    if (tabName === 'features') {
        window.renderFeatures();
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
        ${window.renderCodeBlock(bug.codeExample)}
        
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

// ===========================================================================
// FEATURE TRACKER — companion to the bug tracker. Code snippets render inside a
// <pre> with HTML escaped so they keep real line breaks + indentation (the
// older bug snippets collapse onto one line because they use a <div>).
// ===========================================================================
window.escapeCode = function(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// Reusable code block: IDE-style multi-line formatting (<pre>) with a copy
// button that appears on hover. Used by BOTH the bug and feature trackers.
window.renderCodeBlock = function(code) {
    return `<div class="code-wrap">
        <button class="copy-btn" type="button" title="Copy code" onclick="window.copyCode(this)">📋 Copy</button>
        <pre class="code-block code-pre"><code>${window.escapeCode(code)}</code></pre>
    </div>`;
};

window.copyCode = function(btn) {
    const wrap = btn && btn.closest('.code-wrap');
    const codeEl = wrap && (wrap.querySelector('code') || wrap.querySelector('.code-block'));
    if (!codeEl) return;
    const text = codeEl.textContent;
    const done = () => {
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
        fallbackCopy(text, done);
    }
    function fallbackCopy(str, cb) {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); cb(); } catch (_) {}
        document.body.removeChild(ta);
    }
};

window.featureStatusIcon = function(status) {
    if (status === 'Shipped') return '✅ ';
    if (status === 'In Progress') return '🔄 ';
    if (status === 'Planned') return '🗓️ ';
    return '✨ ';
};

window.renderFeatureRows = function(features) {
    const tbody = document.getElementById('featureTableBody');
    if (!tbody) return;
    tbody.innerHTML = features.map(f => `
        <tr>
            <td><span class="bug-link" onclick="window.showFeatureDetail(${f.id})">#${f.id}</span></td>
            <td>${f.title}</td>
            <td><span class="role-badge">${f.category}</span></td>
            <td>${window.featureStatusIcon(f.status)}${f.status}</td>
            <td><span class="role-badge">${f.role}</span></td>
            <td>${f.effort}</td>
        </tr>
    `).join('');
};

window.renderFeatures = function() {
    console.log("renderFeatures called, FEATURES length:", window.FEATURES?.length || 0);
    if (!window.FEATURES || window.FEATURES.length === 0) {
        console.warn("No FEATURES array available");
        return;
    }
    window.renderFeatureRows(window.FEATURES);
};

window.filterFeatures = function() {
    if (!window.FEATURES) return;
    const search = document.getElementById('featureSearch').value.toLowerCase();
    const filtered = window.FEATURES.filter(f =>
        f.id.toString().includes(search) ||
        f.title.toLowerCase().includes(search) ||
        f.category.toLowerCase().includes(search)
    );
    window.renderFeatureRows(filtered);
};

window.showFeatureDetail = function(featureId) {
    if (!window.FEATURES) return;
    const f = window.FEATURES.find(x => x.id === featureId);
    if (!f) return;
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <h3>✨ #${f.id}: ${f.title}</h3>
        <p style="color: var(--text-light); margin-bottom: 1rem;"><strong>Category:</strong> ${f.category} | <strong>Role:</strong> ${f.role} | <strong>Status:</strong> ${window.featureStatusIcon(f.status)}${f.status} | <strong>Effort:</strong> ${f.effort}</p>

        <h4>Summary</h4>
        <p>${f.summary}</p>

        <h4>Why It Was Built</h4>
        <p>${f.motivation}</p>

        <h4>How It Works</h4>
        <p>${f.solution}</p>

        <h4>Code</h4>
        ${window.renderCodeBlock(f.codeExample)}

        <h4>Lesson Learned</h4>
        <p><strong>💡</strong> ${f.lesson}</p>

        <h4>Impact</h4>
        <p><strong>🎯</strong> ${f.impact}</p>
    `;

    document.getElementById('bugModal').classList.add('active');
};

// Enhance the STATIC code blocks that live in the role/perspective tabs (they
// are hard-coded <div class="code-block"> in the HTML). Give them the same
// IDE-style formatting (preserve line breaks) and the hover copy button, so
// every tab behaves like the Bug/Feature trackers. Runs once at load.
window.enhanceStaticCodeBlocks = function() {
    document.querySelectorAll('.code-block').forEach(block => {
        if (block.closest('.code-wrap')) return; // already enhanced / dynamic

        // Plain-text blocks: preserve their internal formatting and trim the
        // blank first/last line that comes from the HTML indentation.
        if (block.children.length === 0) {
            block.classList.add('code-pre');
            block.textContent = block.textContent.replace(/^\s*\n/, '').replace(/\s+$/, '');
        }

        const wrap = document.createElement('div');
        wrap.className = 'code-wrap';
        block.parentNode.insertBefore(wrap, block);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.title = 'Copy code';
        btn.innerHTML = '📋 Copy';
        btn.setAttribute('onclick', 'window.copyCode(this)');

        wrap.appendChild(btn);
        wrap.appendChild(block);
    });
};

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired");
    window.enhanceStaticCodeBlocks();
    document.addEventListener('click', (e) => {
        if (e.target.id === 'bugModal') {
            window.closeModal();
        }
    });
});

console.log("tabs-handler.js initialization complete - functions exported to window");
