// VIRIATHUS SLIDE AI - PORTFOLIO DEMO JS
// Mock logic replacing Google Apps Script

const MOCK_DATA = Array.from({length: 154}, (_, i) => [
    `Issue ${82000 + i}`,
    `user_input_${i}`,
    `bot_output_${i}`,
    i % 3 === 0 ? 'Violation' : (i % 5 === 0 ? 'Pending' : 'Safe'),
    `This was analyzed due to Policy B violation...`,
    `Agent Notes ${i}`,
    `2023-10-${(i%30)+1}`,
    'user@viriathus.com'
]);

const mockBackend = {
    checkInitialState: () => Promise.resolve({ presets: {}, workflow: 'Category A', headers: ['ID', 'User Content', 'Bot Content', 'Verdict', 'Explanation', 'Notes', 'Date', 'Email'] }),
    fetchHeaders: (url, tab, row) => new Promise(res => setTimeout(() => res({ headers: ['ID', 'User Content', 'Bot Content', 'Verdict', 'Explanation', 'Notes', 'Date', 'Email'] }), 500)),
    fetchData: (url, tab, row, headers) => new Promise(res => setTimeout(() => res({ data: MOCK_DATA, metadata: { totalRows: MOCK_DATA.length } }), 800)),
    generateMultiSlides: (items, cfg) => new Promise((res, rej) => {
        if(!items || items.length === 0) return rej({message: "No slides staged!"});
        setTimeout(() => res({url: 'https://docs.google.com/presentation/mock_demo', msg: `Successfully created ${items.length} slides.`}), 2000);
    }),
    saveSettings: (cfg) => Promise.resolve(),
    startDbSync: () => new Promise(res => setTimeout(() => res('STARTED'), 1000)),
    getSyncStatus: () => Promise.resolve('ACTIVE')
};

let rawData = [];
let headers = [];
let cart = [];
let pageSize = 50, currentPage = 0;
let editIndex = -1;
let currentWorkflow = 'Category A';

function initLoader() { document.getElementById('loader').style.width = '100%'; setTimeout(() => document.getElementById('loader').style.width = '0%', 500); }
function showToast(msg, type='info') {
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    box.innerHTML = `<span class="toast-icon">${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span> ${msg}`;
    document.getElementById('toast-container').appendChild(box);
    setTimeout(() => { box.classList.add('hiding'); setTimeout(() => box.remove(), 400); }, 3000);
}

function initCanvas() {
    const canvas = document.getElementById('network-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({length:80}, () => ({x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5}));
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; if(p.x < 0 || p.x > canvas.width) p.vx *= -1; if(p.y < 0 || p.y > canvas.height) p.vy *= -1; });
        for(let i=0; i<particles.length; i++) {
            for(let j=i+1; j<particles.length; j++) {
                let dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if(dist < 120) { ctx.beginPath(); ctx.strokeStyle = `rgba(220, 210, 166, ${1 - dist/120})`; ctx.lineWidth = 0.5; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}

async function connectSheet() {
    initLoader();
    document.getElementById('sourceId').value = "mock_spreadsheet_db_id";
    document.getElementById('configArea').style.display = 'block';
    const tabSelect = document.getElementById('tabSelect');
    tabSelect.innerHTML = '<option>Sheet1</option><option>Archive</option>';
    await fetchHeaders(true);
}

async function fetchHeaders(force = false) {
    if(!force) return;
    initLoader();
    document.getElementById('tableInfo').innerText = "Fetching Headers...";
    const res = await mockBackend.fetchHeaders();
    headers = res.headers;
    updateMappingSelects();
    await forceRefresh();
}

function updateMappingSelects() {
    const selects = document.querySelectorAll('.col-map');
    selects.forEach(s => { s.innerHTML = '<option value="">-- Ignore --</option>' + headers.map((h, i) => `<option value="${i}">${h}</option>`).join(''); });
}

async function forceRefresh() {
    initLoader();
    document.getElementById('tableInfo').innerText = "Loading data...";
    const res = await mockBackend.fetchData();
    rawData = res.data;
    currentPage = 0;
    renderTable();
}

function renderTable() {
    const thead = document.getElementById('tHead');
    const tbody = document.getElementById('tBody');
    thead.innerHTML = headers.map((h, i) => `<th>${h}</th>`).join('');
    
    let html = '';
    let start = currentPage * pageSize;
    let sliced = rawData.slice(start, start + pageSize);
    
    sliced.forEach((row, rIdx) => {
        html += `<tr onclick="selectRow(${start + rIdx})">`;
        row.forEach(cell => html += `<td>${cell||''}</td>`);
        html += `</tr>`;
    });
    tbody.innerHTML = html;
    document.getElementById('tableInfo').innerText = `Rows ${start+1}-${Math.min(start+pageSize, rawData.length)} of ${rawData.length}`;
}

function selectRow(index) {
    const row = rawData[index];
    document.getElementById('rowDisp').value = `Row ${index + 1}`;
    
    const userCol = document.querySelector('.col-map[data-field="user"]').value || 1;
    const botCol = document.querySelector('.col-map[data-field="bot"]').value || 2;
    const explCol = document.querySelector('.col-map[data-field="explanation"]').value || 4;
    const descCol = document.querySelector('.col-map[data-field="description"]').value || 5;

    document.getElementById('val-user').value = row[userCol] || '';
    document.getElementById('val-bot').value = row[botCol] || '';
    document.getElementById('val-explanation').value = row[explCol] || '';
    document.getElementById('val-description').value = row[descCol] || '';
}

function addCurrentToBatch() {
    const date = document.getElementById('slideDate').value || new Date().toISOString().split('T')[0];
    const data = {
        date: date,
        user: document.getElementById('val-user').value,
        bot: document.getElementById('val-bot').value,
        explanation: document.getElementById('val-explanation').value,
        description: document.getElementById('val-description').value,
    };
    if(!data.user && !data.bot) return showToast('Cannot add empty slide', 'error');
    cart.push(data);
    updateCartUI();
    showToast('Added to Batch', 'success');
}

function updateCartUI() {
    const list = document.getElementById('cartList');
    document.getElementById('cartView').style.display = cart.length > 0 ? 'block' : 'none';
    document.getElementById('clearBtn').style.display = cart.length > 0 ? 'block' : 'none';
    list.innerHTML = cart.map((c, i) => `
        <div class="cart-item">
            <div><span class="cart-badge">Slide ${i+1}</span> ${c.date}</div>
            <div class="cart-actions">
                <span class="cart-action-btn cart-remove" onclick="removeCartItem(${i})">X</span>
            </div>
        </div>
    `).join('');
    document.getElementById('status').innerText = `${cart.length} Slides Ready`;
}

function removeCartItem(idx) { cart.splice(idx, 1); updateCartUI(); }
function clearCart() { cart = []; updateCartUI(); showToast('Cart cleared', 'info'); }

function changePage(dir) {
    currentPage += dir;
    if(currentPage < 0) currentPage = 0;
    let maxPage = Math.ceil(rawData.length / pageSize) - 1;
    if(currentPage > maxPage) currentPage = maxPage;
    renderTable();
}

async function generate() {
    if(cart.length === 0) return showToast("Cart is empty!", "error");
    initLoader();
    document.getElementById('genBtn').disabled = true;
    document.getElementById('genBtn').innerText = 'GENERATING...';
    try {
        const res = await mockBackend.generateMultiSlides(cart, {});
        showToast(res.msg, 'success');
        clearCart();
        setTimeout(() => window.open(res.url, '_blank'), 1500);
    } catch(e) {
        showToast(e.message||"Error generating.", "error");
    } finally {
        document.getElementById('genBtn').disabled = false;
        document.getElementById('genBtn').innerText = 'GENERATE';
    }
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openSettings() { document.getElementById('settingsModal').style.display = 'block'; }
function onWorkflowFilterChange() { currentWorkflow = document.getElementById('workflowFilter').value; showToast(`Workflow changed to ${currentWorkflow}`); }
function setPreset(type, e) { document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active')); e.target.classList.add('active'); }

window.onload = () => { initCanvas(); };
