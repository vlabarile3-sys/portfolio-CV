// ==========================================
// VIRIATHUS EMAIL CREATOR — PORTFOLIO DEMO
// All Google APIs replaced with mock data
// ==========================================

// ── MOCK DATABASE ──────────────────────────
const MOCK_AGENTS_DB = {
  "Sales_Team_EU": [
    { id: "jsmith", name: "John Smith", email: "john.smith@example.com" },
    { id: "emartinez", name: "Elena Martinez", email: "elena.martinez@example.com" },
    { id: "lwilson", name: "Laura Wilson", email: "laura.wilson@example.com" },
    { id: "rpatel", name: "Raj Patel", email: "raj.patel@example.com" },
    { id: "ckim", name: "Claire Kim", email: "claire.kim@example.com" },
    { id: "tmueller", name: "Thomas Mueller", email: "thomas.mueller@example.com" },
    { id: "arossi", name: "Alessandro Rossi", email: "alessandro.rossi@example.com" }
  ],
  "Support_Tier2": [
    { id: "dgarcia", name: "Diego Garcia", email: "diego.garcia@example.com" },
    { id: "schen", name: "Sophie Chen", email: "sophie.chen@example.com" },
    { id: "mkowalski", name: "Marek Kowalski", email: "marek.kowalski@example.com" },
    { id: "nwilliams", name: "Naomi Williams", email: "naomi.williams@example.com" }
  ],
  "Marketing_EMEA": [
    { id: "asilva", name: "Ana Silva", email: "ana.silva@example.com" },
    { id: "lduarte", name: "Lucia Duarte", email: "lucia.duarte@example.com" },
    { id: "mbianchi", name: "Marco Bianchi", email: "marco.bianchi@example.com" },
    { id: "kjohansson", name: "Karin Johansson", email: "karin.johansson@example.com" },
    { id: "pnguyen", name: "Phong Nguyen", email: "phong.nguyen@example.com" }
  ]
};

const DEFAULT_TEMPLATES = {
  "Offline Day - Sales EU": {
    targetWorkflow: "Sales_Team_EU",
    ccEmails: "manager.a@example.com, lead.b@example.com",
    emailSubject: "{{AGENT_ID}} || Offline Day || {{DATE}}",
    driveFileId: "",
    emailBody: "Hi Team,<br><br>This is to inform you that <strong>{{AGENT_NAME}}</strong> will be in Offline Day mode on <strong>{{DATE}}</strong>.<br><br>The agent will recap all the updates during these days.<br><br>In the afternoon, the agent will have shadowing with a colleague.<br><br>Please let me know if you have any questions.<br><br>Regards,"
  },
  "Weekly Report - Support": {
    targetWorkflow: "Support_Tier2",
    ccEmails: "support.lead@example.com",
    emailSubject: "Weekly Performance Report — {{AGENT_NAME}} — {{DATE}}",
    driveFileId: "",
    emailBody: "Hello,<br><br>Please find attached the weekly performance summary for <strong>{{AGENT_NAME}}</strong>, covering the period ending <strong>{{DATE}}</strong>.<br><br><strong>Key Metrics:</strong><br>• Resolution Rate: [TBD]<br>• Average Handle Time: [TBD]<br>• CSAT Score: [TBD]<br><br>Best regards,"
  }
};

// ── STATE ──────────────────────────────────
let allTemplates = {};
let allWorkflows = [];

function getStoredDB() {
  try {
    const stored = localStorage.getItem('viriathus_demo_agents');
    return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(MOCK_AGENTS_DB));
  } catch(e) { return JSON.parse(JSON.stringify(MOCK_AGENTS_DB)); }
}
function saveDB(db) { localStorage.setItem('viriathus_demo_agents', JSON.stringify(db)); }

function getStoredTemplates() {
  try {
    const stored = localStorage.getItem('viriathus_demo_templates');
    return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
  } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)); }
}
function saveTemplates(t) { localStorage.setItem('viriathus_demo_templates', JSON.stringify(t)); }

// ── MOCK BACKEND FUNCTIONS ─────────────────
function getInitialData() {
  const db = getStoredDB();
  allWorkflows = Object.keys(db);
  allTemplates = getStoredTemplates();
  return { success: true, workflows: allWorkflows, templates: allTemplates };
}

function getAgentsByWorkflow(wf) {
  const db = getStoredDB();
  return db[wf] || [];
}

function createWorkflow(name) {
  const db = getStoredDB();
  if (db[name]) return { success: false, message: "Workflow '" + name + "' already exists." };
  db[name] = [];
  saveDB(db);
  return { success: true, message: "Workflow '" + name + "' created!", workflows: Object.keys(db) };
}

function addAgentsBulk(agentsString, wf) {
  const db = getStoredDB();
  if (!db[wf]) return { success: false, message: "Workflow not found." };
  const ldaps = agentsString.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ''; });
  const existing = db[wf].map(function(a) { return a.id; });
  let added = 0; let skipped = [];
  ldaps.forEach(function(ldap) {
    if (existing.indexOf(ldap) !== -1) { skipped.push(ldap); }
    else { db[wf].push({ id: ldap, name: ldap, email: ldap + "@example.com" }); existing.push(ldap); added++; }
  });
  saveDB(db);
  let msg = "Added " + added + " agent(s).";
  if (skipped.length > 0) msg += " Skipped " + skipped.length + " existing.";
  return { success: true, message: msg };
}

function deleteAgentsBatch(agentIds, wf) {
  const db = getStoredDB();
  if (!db[wf]) return { success: false, message: "Workflow not found." };
  const before = db[wf].length;
  db[wf] = db[wf].filter(function(a) { return agentIds.indexOf(a.id) === -1; });
  const removed = before - db[wf].length;
  saveDB(db);
  return removed > 0
    ? { success: true, message: "Removed " + removed + " agent(s)." }
    : { success: false, message: "Agents not found." };
}

function saveTemplate(name, data) {
  allTemplates[name] = data;
  saveTemplates(allTemplates);
  return { success: true, message: "Template '" + name + "' saved!", templates: allTemplates };
}

function deleteTemplate(name) {
  if (!allTemplates[name]) return { success: false, error: "Template not found." };
  delete allTemplates[name];
  if (Object.keys(allTemplates).length === 0) allTemplates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
  saveTemplates(allTemplates);
  return { success: true, message: "Template '" + name + "' deleted.", templates: allTemplates };
}

function createAndPrepareEmailsBatch(wf, agentIds, dateVal, emailData) {
  // Simulate draft creation
  const agents = getAgentsByWorkflow(wf);
  let count = 0;
  agentIds.forEach(function(id) {
    if (agents.find(function(a) { return a.id === id; })) count++;
  });
  return { success: true, count: count, url: '#demo-drafts' };
}

// ── UI HELPERS ─────────────────────────────
function showLoading(msg) {
  document.getElementById('loader-message').textContent = msg || 'Please wait...';
  document.getElementById('loader').style.display = 'flex';
}
function hideLoading() { document.getElementById('loader').style.display = 'none'; }
function showBanner(message, type, duration) {
  type = type || 'success'; duration = duration || 4500;
  var b = document.getElementById('globalBanner');
  b.textContent = message; b.className = 'global-banner ' + type;
  b.style.transform = 'translate(-50%, 0)';
  setTimeout(function() { b.style.transform = 'translate(-50%, -100%)'; }, duration);
}

function openSettings() { document.getElementById('settings-modal').classList.add('active'); }
function closeSettings() { document.getElementById('settings-modal').classList.remove('active'); }
function toggleAdvanced() {
  document.getElementById('advanced-section').classList.toggle('open');
  document.getElementById('adv-toggle-btn').classList.toggle('open');
}
function toggleGuide() { document.getElementById('guide-panel').classList.toggle('open'); }
function formatText(cmd) { document.execCommand(cmd, false, null); document.getElementById('setting-body-editor').focus(); }
function insertVar(text) { document.getElementById('setting-body-editor').focus(); document.execCommand('insertText', false, text); }
function insertHyperlink() {
  var url = prompt("Enter web address or {{FILE_URL}}:", "{{FILE_URL}}");
  if (url) document.execCommand('createLink', false, url);
}

// ── MULTI-SELECT DROPDOWN ──────────────────
function toggleMultiSelect() {
  document.getElementById('custom-agent-select').classList.toggle('open');
  document.querySelector('.custom-multiselect-header').classList.toggle('active');
}
document.addEventListener('click', function(e) {
  var s = document.getElementById('custom-agent-select');
  if (s && !s.contains(e.target)) { s.classList.remove('open'); document.querySelector('.custom-multiselect-header').classList.remove('active'); }
  var g = document.getElementById('guide-panel'), h = document.querySelector('.help-trigger');
  if (g && g.classList.contains('open') && !g.contains(e.target) && h && !h.contains(e.target)) g.classList.remove('open');
});
function updateMultiSelectDisplay() {
  var cbs = document.querySelectorAll('.agent-cb:checked');
  var d = document.getElementById('multiselect-display');
  d.style.fontWeight = 'normal';
  if (cbs.length===0) { d.textContent='Select Agent(s)...'; d.style.color='var(--text-secondary)'; }
  else if (cbs.length===1) { d.textContent=cbs[0].dataset.name; d.style.color='var(--text-primary)'; }
  else if (cbs.length<=3) { d.textContent=Array.from(cbs).map(function(c){return c.dataset.name;}).join(', '); d.style.color='var(--text-primary)'; }
  else { d.textContent=cbs.length+' agents selected'; d.style.color='var(--primary-accent)'; d.style.fontWeight='bold'; }
}
function selectAllAgents(e) { e.stopPropagation(); document.querySelectorAll('.custom-option:not([style*="display: none"]) .agent-cb').forEach(function(c){c.checked=true;}); updateMultiSelectDisplay(); }
function deselectAllAgents(e) { e.stopPropagation(); document.querySelectorAll('.agent-cb').forEach(function(c){c.checked=false;}); updateMultiSelectDisplay(); }
function filterAgents() {
  var q = document.getElementById('agent-search').value.toLowerCase();
  document.querySelectorAll('.custom-option').forEach(function(l) { l.style.display = l.textContent.toLowerCase().indexOf(q)!==-1 ? 'flex' : 'none'; });
}
function getSelectedAgentsData() {
  var ids=[], names=[];
  document.querySelectorAll('.agent-cb:checked').forEach(function(c) { ids.push(c.value); names.push(c.dataset.name); });
  return { ids: ids, names: names };
}

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('offline-date').value = new Date().toISOString().split('T')[0];
  initConstellationAnimation();
  showLoading('Loading Database...');
  // Simulate async loading
  setTimeout(function() {
    var res = getInitialData();
    hideLoading();
    if (res.success) {
      allWorkflows = res.workflows;
      populateWorkflows();
      allTemplates = res.templates;
      populateTemplateDropdown();
    }
  }, 600);
});

// ── WORKFLOW & AGENT MGMT ──────────────────
function populateWorkflows() {
  var s = document.getElementById('workflow-select');
  var cv = s.value;
  s.innerHTML = '<option value="" disabled selected>Select a Workflow...</option>';
  var ts = document.getElementById('setting-target-workflow');
  var tv = ts.value;
  ts.innerHTML = '<option value="" disabled selected>Must be assigned to a workflow...</option>';
  allWorkflows.forEach(function(wf) {
    var o = document.createElement('option'); o.value=wf; o.textContent=wf; s.appendChild(o);
    var o2 = document.createElement('option'); o2.value=wf; o2.textContent=wf; ts.appendChild(o2);
  });
  if (allWorkflows.indexOf(cv)!==-1) s.value=cv;
  else if (allWorkflows.indexOf("Sales_Team_EU")!==-1) s.value="Sales_Team_EU";
  if (allWorkflows.indexOf(tv)!==-1) ts.value=tv;
  if (s.value) triggerWorkflowChange(true);
}

function createNewWorkflow(e) {
  var name = document.getElementById('new-workflow-input').value.trim();
  if (!name) { showBanner('Enter a workflow name.','error'); return; }
  var btn = e.currentTarget; btn.disabled=true;
  showLoading("Creating '"+name+"'...");
  setTimeout(function() {
    var r = createWorkflow(name);
    hideLoading(); btn.disabled=false;
    if (r.success) { showBanner(r.message,'success'); allWorkflows=r.workflows; populateWorkflows(); document.getElementById('workflow-select').value=name; triggerWorkflowChange(true); document.getElementById('new-workflow-input').value=''; }
    else showBanner(r.message,'error');
  }, 400);
}

function triggerWorkflowChange(isSwitching) {
  var wf = document.getElementById('workflow-select').value;
  if (!wf) return;
  showLoading("Loading Agents for "+wf+"...");
  setTimeout(function() {
    var agents = getAgentsByWorkflow(wf);
    hideLoading();
    populateAgentsDropdown(agents, isSwitching);
  }, 300);
}

function populateAgentsDropdown(agents, isSwitching) {
  var container = document.getElementById('agent-checkbox-list');
  var current = isSwitching ? [] : getSelectedAgentsData().ids;
  container.innerHTML = '';
  if (agents && agents.length > 0) {
    agents.forEach(function(a) {
      var lbl = document.createElement('label'); lbl.className='custom-option';
      var cb = document.createElement('input'); cb.type='checkbox'; cb.value=a.id; cb.dataset.name=a.name; cb.className='agent-cb';
      if (current.indexOf(a.id)!==-1) cb.checked=true;
      cb.addEventListener('change', updateMultiSelectDisplay);
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(a.name)); container.appendChild(lbl);
    });
  } else {
    container.innerHTML='<div style="padding:16px;color:var(--text-secondary);text-align:center;font-style:italic;">No agents in this workflow</div>';
  }
  updateMultiSelectDisplay();
  document.getElementById('agent-search').value='';
}

function addAgentBulk(e) {
  var wf=document.getElementById('workflow-select').value;
  if(!wf){showBanner('Select a workflow first.','error');return;}
  var inp=document.getElementById('new-agent-ldap-input'), val=inp.value.trim();
  if(!val){showBanner('Enter at least one LDAP.','error');return;}
  var btn=e.currentTarget; btn.disabled=true;
  showLoading("Adding agents...");
  setTimeout(function(){
    var r=addAgentsBulk(val,wf);
    hideLoading();btn.disabled=false;
    showBanner(r.message,r.success?'success':'error');
    if(r.success){inp.value='';triggerWorkflowChange(false);}
  },400);
}

function removeAgent(e) {
  var wf=document.getElementById('workflow-select').value, sel=getSelectedAgentsData();
  if(!wf||sel.ids.length===0){showBanner('Select workflow and agent(s).','error');return;}
  if(!confirm("Remove "+sel.ids.length+" agent(s) from "+wf+"?")) return;
  var btn=e.currentTarget;btn.disabled=true;
  showLoading("Removing...");
  setTimeout(function(){
    var r=deleteAgentsBatch(sel.ids,wf);
    hideLoading();btn.disabled=false;
    showBanner(r.message,r.success?'success':'error');
    if(r.success) triggerWorkflowChange(false);
  },400);
}

// ── WIZARD ─────────────────────────────────
function openWizard() {
  var wf=document.getElementById('workflow-select').value, sel=getSelectedAgentsData(), dt=document.getElementById('offline-date').value;
  if(!wf||sel.ids.length===0||!dt){showBanner('Select Workflow, Agent(s), and Date.','error');return;}
  var names=sel.names, display=names.length>4?names.slice(0,4).join(', ')+" (+"+(names.length-4)+" more)":names.join(', ');
  document.getElementById('wiz-workflow').textContent=wf;
  document.getElementById('wiz-agent').textContent=display;
  document.getElementById('wiz-count-badge').textContent=names.length;
  document.getElementById('wiz-date').textContent=new Date(dt).toLocaleDateString();
  var m=document.getElementById('wizard-modal');
  m.dataset.workflow=wf; m.dataset.agentIds=JSON.stringify(sel.ids); m.dataset.agentNames=JSON.stringify(names); m.dataset.dateVal=dt;
  populateWizardTemplateDropdown(wf);
  m.classList.add('active');
}
function closeWizard(){document.getElementById('wizard-modal').classList.remove('active');}

function populateWizardTemplateDropdown(wf) {
  var s=document.getElementById('wizard-template-select'), btn=document.getElementById('confirm-draft-btn');
  s.innerHTML='';
  var matching=Object.keys(allTemplates).filter(function(n){return allTemplates[n].targetWorkflow===wf;});
  if(matching.length===0){
    var o=document.createElement('option');o.value="";o.textContent="⚠️ No templates for '"+wf+"'";s.appendChild(o);
    s.disabled=true;btn.disabled=true;
    document.getElementById('wiz-preview-subject').innerHTML="";
    document.getElementById('wiz-preview-body').innerHTML='<span style="color:var(--error-color);">Create a template linked to "'+wf+'" in the Template Manager first.</span>';
  } else {
    s.disabled=false;btn.disabled=false;
    matching.forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;s.appendChild(o);});
    updateWizardPreview();
  }
}

function updateWizardPreview() {
  var tn=document.getElementById('wizard-template-select').value;
  if(!tn||!allTemplates[tn]) return;
  var td=allTemplates[tn], m=document.getElementById('wizard-modal');
  var ids=JSON.parse(m.dataset.agentIds), names=JSON.parse(m.dataset.agentNames);
  var d=new Date(m.dataset.dateVal), fd=d.getFullYear()+"/"+String(d.getMonth()+1).padStart(2,'0')+"/"+String(d.getDate()).padStart(2,'0');
  var rep=function(t){return t.replace(/{{AGENT_ID}}/g,ids[0]).replace(/{{AGENT_NAME}}/g,names[0]).replace(/{{DATE}}/g,fd).replace(/{{FILE_URL}}/g,'#demo-file');};
  var disc=ids.length>1?'<div style="font-size:12px;color:var(--primary-accent);margin-bottom:16px;font-style:italic;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.2);">* Preview for first agent ('+names[0]+').</div>':"";
  document.getElementById('wiz-preview-subject').innerHTML=rep(td.emailSubject);
  document.getElementById('wiz-preview-body').innerHTML=disc+rep(td.emailBody);
}

function executePrepareEmail() {
  var m=document.getElementById('wizard-modal'), tn=document.getElementById('wizard-template-select').value, td=allTemplates[tn];
  if(!td){showBanner('Template missing.','error');return;}
  var ids=JSON.parse(m.dataset.agentIds);
  closeWizard();
  showLoading("Generating "+ids.length+" draft(s)...");
  setTimeout(function(){
    var r=createAndPrepareEmailsBatch(m.dataset.workflow,ids,m.dataset.dateVal,td);
    hideLoading();
    showBanner("✅ Demo: "+r.count+" Draft(s) would be created in Gmail!",'success',5000);
    deselectAllAgents(new Event('x'));
  },800);
}

// ── TEMPLATE MANAGER ───────────────────────
function populateTemplateDropdown() {
  var s=document.getElementById('template-select');s.innerHTML='';
  var names=Object.keys(allTemplates);
  names.forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;s.appendChild(o);});
  if(names.length>0){s.value=names[0];loadSelectedTemplate();}
}
function loadSelectedTemplate() {
  var n=document.getElementById('template-select').value;
  if(n&&allTemplates[n]){var d=allTemplates[n];
    document.getElementById('setting-target-workflow').value=d.targetWorkflow||'';
    document.getElementById('setting-drive-id').value=d.driveFileId||'';
    document.getElementById('setting-cc').value=d.ccEmails||'';
    document.getElementById('setting-subject').value=d.emailSubject||'';
    document.getElementById('setting-body-editor').innerHTML=d.emailBody||'';
    document.getElementById('new-template-name').value=n;
  }
}
function saveAsTemplate(e) {
  if(e)e.stopPropagation();
  var n=document.getElementById('new-template-name').value.trim();
  if(!n){showBanner("Provide a name.",'error');return;}
  var d={targetWorkflow:document.getElementById('setting-target-workflow').value,driveFileId:document.getElementById('setting-drive-id').value.trim(),ccEmails:document.getElementById('setting-cc').value.trim(),emailSubject:document.getElementById('setting-subject').value.trim(),emailBody:document.getElementById('setting-body-editor').innerHTML.trim()};
  if(!d.targetWorkflow){showBanner("Select a Linked Workflow.",'error');return;}
  if(!d.emailSubject||!d.emailBody||d.emailBody==='<br>'){showBanner("Subject and body required.",'error');return;}
  showLoading('Saving...');
  setTimeout(function(){
    var r=saveTemplate(n,d);hideLoading();
    if(r.success){showBanner(r.message,'success');allTemplates=r.templates;populateTemplateDropdown();document.getElementById('template-select').value=n;closeSettings();}
    else showBanner(r.error,'error');
  },400);
}
function deleteCurrentTemplate() {
  var n=document.getElementById('template-select').value;
  if(!n||!confirm("Delete '"+n+"'?")) return;
  showLoading('Deleting...');
  setTimeout(function(){
    var r=deleteTemplate(n);hideLoading();
    if(r.success){showBanner(r.message,'success');allTemplates=r.templates;populateTemplateDropdown();}
    else showBanner(r.error,'error');
  },400);
}

// ── CONSTELLATION ANIMATION ────────────────
var canvas,ctx,width,height,stars=[],animFrameId;
var starCount=120,maxDist=150;
function Star(x,y){this.x=x;this.y=y;this.r=Math.random()*1.2+0.6;this.sx=(Math.random()-0.5)*0.15;this.sy=(Math.random()-0.5)*0.15;this.tp=Math.random()*Math.PI*2;}
Star.prototype.update=function(){this.x+=this.sx;this.y+=this.sy;if(this.x<0||this.x>width)this.sx*=-1;if(this.y<0||this.y>height)this.sy*=-1;this.tp+=0.01;};
Star.prototype.draw=function(c){c.beginPath();var op=0.5+Math.sin(this.tp)*0.3;c.fillStyle="rgba(212,175,55,"+op+")";c.shadowColor='rgba(212,175,55,0.6)';c.shadowBlur=6*op;c.arc(this.x,this.y,this.r,0,Math.PI*2);c.fill();c.shadowBlur=0;};
function initConstellationAnimation(){canvas=document.getElementById('network-canvas');ctx=canvas.getContext('2d');width=canvas.width=window.innerWidth;height=canvas.height=window.innerHeight;stars=[];for(var i=0;i<starCount;i++)stars.push(new Star(Math.random()*width,Math.random()*height));if(!animFrameId)animLoop();}
function animLoop(){ctx.clearRect(0,0,width,height);stars.forEach(function(s){s.update();});ctx.lineWidth=0.6;for(var i=0;i<stars.length;i++)for(var j=i+1;j<stars.length;j++){var dx=stars[i].x-stars[j].x,dy=stars[i].y-stars[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<maxDist){ctx.beginPath();ctx.strokeStyle="rgba(169,169,179,"+((1-d/maxDist)*0.35)+")";ctx.moveTo(stars[i].x,stars[i].y);ctx.lineTo(stars[j].x,stars[j].y);ctx.stroke();}}stars.forEach(function(s){s.draw(ctx);});animFrameId=requestAnimationFrame(animLoop);}
window.addEventListener('resize',function(){if(animFrameId)cancelAnimationFrame(animFrameId);animFrameId=null;clearTimeout(window._rz);window._rz=setTimeout(initConstellationAnimation,250);});
