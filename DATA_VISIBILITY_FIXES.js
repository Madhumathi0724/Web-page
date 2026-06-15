// ═══════════════════════════════════════════════════════════════════════════
// DATA VISIBILITY & TABLE DISPLAY FIXES
// Add this JavaScript to your existing pr_oa_portal (11).html file
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════
// 1. LOCAL STORAGE - DATA PERSISTENCE
// ═══════════════════════════════════════

function initializeDataStorage() {
  if (!localStorage.getItem('portal_projects')) localStorage.setItem('portal_projects', JSON.stringify([]));
  if (!localStorage.getItem('portal_pr_notices')) localStorage.setItem('portal_pr_notices', JSON.stringify([]));
  if (!localStorage.getItem('portal_actions')) localStorage.setItem('portal_actions', JSON.stringify([]));
  if (!localStorage.getItem('portal_model_actions')) localStorage.setItem('portal_model_actions', JSON.stringify([]));
}

function getProjects() {
  return JSON.parse(localStorage.getItem('portal_projects')) || [];
}

function getPRNotices() {
  return JSON.parse(localStorage.getItem('portal_pr_notices')) || [];
}

function getActions() {
  return JSON.parse(localStorage.getItem('portal_actions')) || [];
}

function getModelActions() {
  return JSON.parse(localStorage.getItem('portal_model_actions')) || [];
}

function saveProjects(data) {
  localStorage.setItem('portal_projects', JSON.stringify(data));
  renderProjectsTable();
  renderProjectSummaryTable();
  updateDashboardMetrics();
}

function savePRNotices(data) {
  localStorage.setItem('portal_pr_notices', JSON.stringify(data));
  renderPRNoticeTable();
  updateDashboardMetrics();
}

function saveActions(data) {
  localStorage.setItem('portal_actions', JSON.stringify(data));
  renderOverallActionsTable();
  updateDashboardMetrics();
}

function saveModelActions(data) {
  localStorage.setItem('portal_model_actions', JSON.stringify(data));
  renderOverallActionsTable();
  updateDashboardMetrics();
}

// ═══════════════════════════════════════
// 2. PR NOTICE TABLE - DISPLAY ALL RECORDS
// ═══════════════════════════════════════

function renderPRNoticeTable() {
  const notices = getPRNotices();
  const tbody = document.getElementById('pr-notice-tbody');
  const emptyRow = document.getElementById('pr-empty-row');
  
  if (!tbody) return; // Element doesn't exist yet
  
  if (notices.length === 0) {
    tbody.innerHTML = '<tr id="pr-empty-row"><td colspan="13" style="text-align:center;padding:2.5rem;color:var(--text3)">No PR Notices yet. Click "Create PR" to add one.</td></tr>';
    document.getElementById('pr-total-count').textContent = '0';
    document.getElementById('pr-approval-count').textContent = '0';
    document.getElementById('pr-complete-count').textContent = '0';
    return;
  }
  
  // Build table rows with all data visible
  tbody.innerHTML = notices.map((pr, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${pr.docNo || ''}</td>
      <td style="color:#f7c94f;font-weight:600">${pr.woNo || ''}</td>
      <td>${pr.projectName || ''}</td>
      <td>${pr.modelName || ''}</td>
      <td>${pr.requestor || ''}</td>
      <td>${pr.stage || ''}</td>
      <td>${pr.buildDate || ''}</td>
      <td>${pr.dqaClass || ''}</td>
      <td>${pr.createdDate || new Date().toLocaleDateString()}</td>
      <td>${pr.depts || ''}</td>
      <td><span class="badge ${
        pr.status === 'Completed' ? 'badge-green' : 
        pr.status === 'In Approval' ? 'badge-amber' : 
        'badge-blue'
      }">${pr.status || 'Pending'}</span></td>
      <td><button class="btn btn-ghost" onclick="deletePRNotice(${pr.id})">Delete</button></td>
    </tr>
  `).join('');
  
  // Update counters
  document.getElementById('pr-total-count').textContent = notices.length;
  document.getElementById('pr-approval-count').textContent = notices.filter(p => p.status === 'In Approval').length;
  document.getElementById('pr-complete-count').textContent = notices.filter(p => p.status === 'Completed').length;
}

function deletePRNotice(id) {
  if (confirm('Delete this PR Notice?')) {
    let notices = getPRNotices();
    notices = notices.filter(p => p.id !== id);
    savePRNotices(notices);
  }
}

// ═══════════════════════════════════════
// 3. OVERALL ACTION TRACKER - ALL ACTIONS
// ═══════════════════════════════════════

function renderOverallActionsTable() {
  const allActions = [];
  
  // Combine model actions with regular actions
  const modelActions = getModelActions();
  const regularActions = getActions();
  
  allActions.push(...modelActions);
  allActions.push(...regularActions);
  
  const tbody = document.getElementById('overall-actions-tbody');
  
  if (!tbody) return; // Element doesn't exist yet
  
  if (allActions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text3)">No action points found.</td></tr>';
    updateActionCounts(0, 0);
    return;
  }
  
  // Render all action rows
  tbody.innerHTML = allActions.map((action, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${action.project || action.projectName || ''}</td>
      <td>${action.actionPoint || action.description || ''}</td>
      <td>${action.owner || action.assignee || ''}</td>
      <td>${action.dueDate || ''}</td>
      <td><span class="badge ${
        action.status === 'Closed' || action.status === 'Completed' ? 'badge-green' : 'badge-amber'
      }">${action.status || 'Open'}</span></td>
      <td>${action.remarks || action.notes || ''}</td>
    </tr>
  `).join('');
  
  // Count open and closed
  const openCount = allActions.filter(a => a.status === 'Open' || a.status === '').length;
  const closedCount = allActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
  
  updateActionCounts(openCount, closedCount);
}

function updateActionCounts(openCount, closedCount) {
  const openElement = document.getElementById('overall-open-count');
  const closedElement = document.getElementById('overall-closed-count');
  
  if (openElement) openElement.textContent = openCount;
  if (closedElement) closedElement.textContent = closedCount;
}

// ═══════════════════════════════════════
// 4. PROJECT SUMMARY - ALL MODELS
// ═══════════════════════════════════════

function renderProjectSummaryTable() {
  const projects = getProjects();
  const tbody = document.getElementById('project-summary-tbody');
  
  if (!tbody) return; // Element doesn't exist yet
  
  if (projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:var(--text3)">No projects found.</td></tr>';
    return;
  }
  
  // Display all project data in summary table
  tbody.innerHTML = projects.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${p.projectName || ''}</td>
      <td>${p.modelName || ''}</td>
      <td>${p.customer || ''}</td>
      <td><span class="badge badge-blue">${p.bg || ''}</span></td>
      <td>${p.bu || ''}</td>
      <td>${p.stage || ''}</td>
      <td><span class="badge ${
        p.status === 'In Progress' ? 'badge-amber' : 
        p.status === 'Completed' ? 'badge-green' : 
        'badge-gray'
      }">${p.status || 'Pending'}</span></td>
      <td>${p.owner || ''}</td>
      <td>${p.mpDate || ''}</td>
    </tr>
  `).join('');
}

// ═══════════════════════════════════════
// 5. PROJECTS LIST - MODEL LIST
// ═══════════════════════════════════════

function renderProjectsTable() {
  const projects = getProjects();
  const tbody = document.getElementById('proj-table');
  const searchTerm = (document.getElementById('proj-search')?.value || '').toLowerCase();
  const bgFilter = document.getElementById('bg-filter')?.value || '';
  
  if (!tbody) return; // Element doesn't exist yet
  
  // Filter projects
  let filtered = projects.filter(p => {
    const matchesSearch = !searchTerm || 
      p.projectName?.toLowerCase().includes(searchTerm) ||
      p.modelName?.toLowerCase().includes(searchTerm) ||
      p.customer?.toLowerCase().includes(searchTerm);
    
    const matchesBG = !bgFilter || p.bg === bgFilter;
    
    return matchesSearch && matchesBG;
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:2.5rem;color:var(--text3)">No projects found.</td></tr>';
    return;
  }
  
  // Display filtered projects
  tbody.innerHTML = filtered.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${p.projectName || ''}</td>
      <td>${p.modelName || ''}</td>
      <td>${p.customer || ''}</td>
      <td><span class="badge badge-blue">${p.bg || ''}</span></td>
      <td>${p.bu || ''}</td>
      <td>${p.projectType || ''}</td>
      <td>${p.stage || ''}</td>
      <td>${p.mpDate || ''}</td>
      <td><span class="badge ${
        p.status === 'In Progress' ? 'badge-amber' : 
        p.status === 'Completed' ? 'badge-green' : 
        'badge-gray'
      }">${p.status || 'Pending'}</span></td>
      <td>${p.owner || ''}</td>
      <td>${p.koFile ? '✓' : '-'}</td>
      <td>${p.points || '0'}</td>
      <td><button class="btn btn-ghost" onclick="editProject(${p.id})">Edit</button></td>
    </tr>
  `).join('');
}

function editProject(id) {
  alert('Edit functionality coming soon for project ID: ' + id);
}

// ═══════════════════════════════════════
// 6. DASHBOARD METRICS - AUTO UPDATE
// ═══════════════════════════════════════

function updateDashboardMetrics() {
  const projects = getProjects();
  const prNotices = getPRNotices();
  const allActions = [...getActions(), ...getModelActions()];
  const openActions = allActions.filter(a => a.status === 'Open' || a.status === '').length;
  const closedActions = allActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
  
  // Update dashboard KPI cards
  const kpiTotal = document.getElementById('kpi-total');
  const kpiInprog = document.getElementById('kpi-inprog');
  const kpiDone = document.getElementById('kpi-done');
  
  if (kpiTotal) kpiTotal.textContent = projects.length;
  if (kpiInprog) kpiInprog.textContent = projects.filter(p => p.status === 'In Progress').length;
  if (kpiDone) kpiDone.textContent = projects.filter(p => p.status === 'Completed').length;
}

// ═══════════════════════════════════════
// 7. AUTO-REFRESH TABLES ON PAGE LOAD
// ═══════════════════════════════════════

function refreshAllTables() {
  renderPRNoticeTable();
  renderOverallActionsTable();
  renderProjectSummaryTable();
  renderProjectsTable();
  updateDashboardMetrics();
}

// ═══════════════════════════════════════
// 8. INITIALIZE ON PAGE LOAD
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  initializeDataStorage();
  refreshAllTables();
});

// Re-render tables when page is shown
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    setTimeout(refreshAllTables, 500);
  }
});