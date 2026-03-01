// =====================================================
// SETTINGS PANEL - REDESIGN v2
// Card-based UI, chip selector, dễ sử dụng
// =====================================================

'use strict';

// ---- State ---- //
const SP = {
  activeTab: 'paperTypes',
  selectedSizeId: null,
  editingPaperId: null,
  selectedLamSize: null,
  printActiveSizeKey: null,
};

// =====================================================
// ENTRY POINT
// =====================================================
function openSettingModal(type) {
  SP.activeTab = type || 'paperTypes';
  SP.editingPaperId = null;

  const modal = document.getElementById('settingEditModal');
  const titleEl = document.getElementById('settingModalTitle');
  const bodyEl = document.getElementById('settingModalContent');
  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = '⚙️ Cài đặt giá';
  bodyEl.innerHTML = _buildPanel();
  modal.style.display = 'flex';
  _activateTab(SP.activeTab);
}

function closeSettingModal() {
  const modal = document.getElementById('settingEditModal');
  if (modal) modal.style.display = 'none';
  SP.editingPaperId = null;
}

function saveSettingModal() {
  savePaperSettings(false);
  closeSettingModal();
}

// =====================================================
// BUILD TOP-LEVEL
// =====================================================
function _buildPanel() {
  return `
    <div id="spRoot">
      <div class="sp-nav">
        <button class="sp-nav-tab" data-tab="paperTypes"    onclick="spSwitchTab('paperTypes')">📄 Loại Giấy</button>
        <button class="sp-nav-tab" data-tab="paperPrint"    onclick="spSwitchTab('paperPrint')">🖨️ Giá In</button>
        <button class="sp-nav-tab" data-tab="paperLam"      onclick="spSwitchTab('paperLam')">✨ Cán Màng</button>
        <button class="sp-nav-tab" data-tab="paperProc"     onclick="spSwitchTab('paperProc')">✂️ Gia Công</button>
        <button class="sp-nav-tab" data-tab="paperCustomer" onclick="spSwitchTab('paperCustomer')">👥 Loại Khách</button>
      </div>
      <div id="sp-panel-paperTypes"   class="sp-panel"></div>
      <div id="sp-panel-paperPrint"   class="sp-panel"></div>
      <div id="sp-panel-paperLam"     class="sp-panel"></div>
      <div id="sp-panel-paperProc"    class="sp-panel"></div>
      <div id="sp-panel-paperCustomer" class="sp-panel"></div>
    </div>`;
}

// =====================================================
// TAB SWITCHING
// =====================================================
function spSwitchTab(tab) {
  SP.activeTab = tab;
  _activateTab(tab);
}

function _activateTab(tab) {
  document.querySelectorAll('#spRoot .sp-nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('#spRoot .sp-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`sp-panel-${tab}`);
  if (!panel) return;
  panel.classList.add('active');

  switch (tab) {
    case 'paperTypes': _renderPaperTypes(); break;
    case 'paperPrint': _renderPricing(); break;
    case 'paperLam': _renderLamination(); break;
    case 'paperProc': _renderProcessing(); break;
    case 'paperCustomer': _renderCustomers(); break;
  }
}

// =====================================================
// HELPERS
// =====================================================
function _fmt(n) { return Number(n).toLocaleString('vi-VN'); }

// =====================================================
// TAB 1: LOẠI GIẤY (Card-based)
// =====================================================
function _renderPaperTypes() {
  const panel = document.getElementById('sp-panel-paperTypes');
  if (!panel) return;

  const sizes = PAPER_SETTINGS.printSizes || [];
  if (!SP.selectedSizeId || !sizes.find(s => s.id === SP.selectedSizeId)) {
    SP.selectedSizeId = sizes.length > 0 ? sizes[0].id : null;
  }

  panel.innerHTML = `
    ${_renderSizeChips(sizes)}
    <div class="sp-scroll-content" id="spPaperContent">
      ${_renderPaperContent()}
    </div>`;
}

function _renderSizeChips(sizes) {
  const chips = sizes.map(s => {
    const label = formatSizeShort(s);
    const isActive = s.id === SP.selectedSizeId;
    const paperCount = (PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === s.id)?.papers || []).length;
    return `
      <div class="sp-size-chip ${isActive ? 'active' : ''}" onclick="spSelectSize(${s.id})">
        ${label} <span class="sp-chip-count">(${paperCount})</span>
        ${sizes.length > 1 ? `<button class="sp-chip-del" onclick="event.stopPropagation();spDeleteSize(${s.id})" title="Xóa">✕</button>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="sp-size-bar">
      ${chips}
      <div class="sp-size-add-chip" onclick="spAddSize()">➕ Thêm khổ</div>
    </div>`;
}

function _renderPaperContent() {
  if (!SP.selectedSizeId) {
    return `<div class="sp-empty"><div class="sp-empty-icon">📋</div><h4>Chưa có khổ giấy</h4><p>Nhấn "Thêm khổ" để bắt đầu</p></div>`;
  }

  const size = PAPER_SETTINGS.printSizes.find(s => s.id === SP.selectedSizeId);
  if (!size) return '';

  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === SP.selectedSizeId);
  const papers = pricing?.papers || [];

  // Size edit bar (sửa kích thước inline)
  const sizeEditBar = `
    <div class="sp-size-edit-bar">
      <label>📐 Kích thước:</label>
      <input type="number" value="${size.w}" onchange="spUpdateSizeDim(${size.id},'w',this.value)" title="Chiều ngang (mm)">
      <span class="sp-size-sep">×</span>
      <input type="number" value="${size.h}" onchange="spUpdateSizeDim(${size.id},'h',this.value)" title="Chiều dọc (mm)">
      <span class="sp-size-unit">mm</span>
    </div>`;

  // Paper cards
  const paperCards = papers.map(p => _renderPaperCard(p)).join('');

  return `
    ${sizeEditBar}
    ${papers.length === 0
      ? `<div class="sp-empty" style="padding:24px;"><div class="sp-empty-icon">📄</div><h4>Chưa có loại giấy</h4><p>Nhấn nút bên dưới để thêm loại giấy cho khổ này</p></div>`
      : paperCards}
    <button class="sp-add-paper-btn" onclick="spAddPaper(${SP.selectedSizeId})">
      ➕ Thêm loại giấy
    </button>`;
}

function _renderPaperCard(paper) {
  const sizeId = SP.selectedSizeId;
  const isExpanded = SP.editingPaperId === paper.id;
  const tiers = paper.tiers || [];

  // Mini badges for collapsed view
  const miniBadges = tiers.map(t => {
    const qty = t.max === 999999 ? '∞' : `≤${_fmt(t.max)}`;
    return `<span class="sp-mini-badge">${qty}: ${_fmt(t.price)}đ</span>`;
  }).join('');

  // Tier editor for expanded view
  let tierEditor = '';
  if (isExpanded) {
    const tierRows = tiers.map((t, i) => {
      const minQty = i === 0 ? 1 : (tiers[i - 1].max + 1);
      const isLast = t.max === 999999;
      return `
        <div class="sp-tier-grid-row">
          <input type="number" value="${minQty}" readonly>
          <input type="number" value="${isLast ? '' : t.max}" placeholder="${isLast ? '∞' : 'Max'}"
            ${isLast ? 'readonly' : ''}
            onchange="spUpdateTierMax(${sizeId},${paper.id},${i},this.value)">
          <input type="number" value="${t.price}" placeholder="Giá" min="0"
            onchange="spUpdateTierPrice(${sizeId},${paper.id},${i},this.value)">
          <span class="sp-tier-unit">đ/tờ</span>
          <button class="sp-tier-mini-del" ${tiers.length <= 1 ? 'disabled' : ''}
            onclick="spDeleteTier(${sizeId},${paper.id},${i})">✕</button>
        </div>`;
    }).join('');

    tierEditor = `
      <div class="sp-tier-grid">
        <div class="sp-tier-grid-header">
          <span>Từ</span><span>Đến</span><span>Giá</span><span></span><span></span>
        </div>
        ${tierRows}
        <button class="sp-tier-add-btn" onclick="spAddTier(${sizeId},${paper.id})">➕ Thêm mốc giá</button>
      </div>`;
  }

  return `
    <div class="sp-paper-card ${isExpanded ? 'expanded' : ''}" id="spCard-${paper.id}">
      <div class="sp-paper-card-header" onclick="spToggleTierEditor(${sizeId},${paper.id})">
        <input type="text" class="sp-paper-name-input" value="${paper.name.replace(/"/g, '&quot;')}"
          onclick="event.stopPropagation()" onblur="spUpdatePaperName(${sizeId},${paper.id},this.value)">
        <div class="sp-paper-tiers-preview">${miniBadges}</div>
        <div class="sp-paper-card-actions" onclick="event.stopPropagation()">
          <button class="sp-icon-btn dup" onclick="spDupPaper(${sizeId},${paper.id})" title="Nhân bản">📑</button>
          <button class="sp-icon-btn del" onclick="spDeletePaper(${sizeId},${paper.id})" title="Xóa">🗑️</button>
        </div>
        <span class="sp-expand-icon">${isExpanded ? '▲' : '▼'}</span>
      </div>
      <div class="sp-paper-card-body">
        ${tierEditor}
      </div>
    </div>`;
}

// ---- Size actions ----
function spSelectSize(sizeId) {
  SP.selectedSizeId = sizeId;
  SP.editingPaperId = null;
  _renderPaperTypes();
}

function spAddSize() {
  const newId = Math.max(...(PAPER_SETTINGS.printSizes.map(s => s.id) || [0]), 0) + 1;
  const defaultW = 325, defaultH = 430;

  PAPER_SETTINGS.printSizes.push({ id: newId, w: defaultW, h: defaultH, name: formatSizeName({ w: defaultW, h: defaultH }) });
  PAPER_SETTINGS.paperPricing.push({ printSizeId: newId, papers: [] });

  _ensureLamForSize(newId, defaultW, defaultH);
  _ensurePrintPricingForSize(newId, defaultW, defaultH);

  savePaperSettings(true);
  SP.selectedSizeId = newId;
  _renderPaperTypes();
  _syncDropdowns();
  showToast('✅ Đã thêm khổ giấy mới');
}

function spDeleteSize(sizeId) {
  if (PAPER_SETTINGS.printSizes.length <= 1) {
    alert('⚠️ Phải có ít nhất 1 khổ giấy!');
    return;
  }
  if (!confirm('🗑️ Xóa khổ giấy này? Toàn bộ loại giấy, cán màng và giá in sẽ bị xóa.')) return;

  const del = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);
  PAPER_SETTINGS.printSizes = PAPER_SETTINGS.printSizes.filter(s => s.id !== sizeId);
  PAPER_SETTINGS.paperPricing = PAPER_SETTINGS.paperPricing.filter(p => p.printSizeId !== sizeId);
  if (PAPER_SETTINGS.laminationPricing)
    PAPER_SETTINGS.laminationPricing = PAPER_SETTINGS.laminationPricing.filter(p => p.printSizeId !== sizeId);
  if (del && PAPER_SETTINGS.printPricingBySize) {
    const key = `${del.w}x${del.h}`;
    delete PAPER_SETTINGS.printPricingBySize[key];
  }

  SP.selectedSizeId = PAPER_SETTINGS.printSizes.length > 0 ? PAPER_SETTINGS.printSizes[0].id : null;
  SP.editingPaperId = null;
  savePaperSettings(true);
  _renderPaperTypes();
  _syncDropdowns();
  showToast('🗑️ Đã xóa khổ giấy');
}

function spUpdateSizeDim(sizeId, field, value) {
  const size = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);
  if (!size) return;
  const v = parseInt(value);
  if (isNaN(v) || v < 1) return;

  const oldKey = `${size.w}x${size.h}`;
  size[field] = v;
  size.name = formatSizeName(size);
  const newKey = `${size.w}x${size.h}`;

  if (PAPER_SETTINGS.printPricingBySize && oldKey !== newKey) {
    const old = PAPER_SETTINGS.printPricingBySize[oldKey];
    if (old) {
      delete PAPER_SETTINGS.printPricingBySize[oldKey];
      const isLarge = size.w > 480 || size.h > 480;
      PAPER_SETTINGS.printPricingBySize[newKey] = {
        ...old,
        sizeInfo: { ...old.sizeInfo, id: newKey, width: size.w, height: size.h, name: `Khổ ${formatMmToCm(size.w)}×${formatMmToCm(size.h)}${isLarge ? ' (Lớn)' : ''}` }
      };
    }
  }

  savePaperSettings(true);
  _syncDropdowns();
  _renderPaperTypes();
  if (typeof renderPrintPricingSettings === 'function') renderPrintPricingSettings();
  showToast('✅ Đã cập nhật kích thước');
}

// ---- Paper actions ----
function spAddPaper(sizeId) {
  let pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  if (!pricing) {
    pricing = { printSizeId: sizeId, papers: [] };
    PAPER_SETTINGS.paperPricing.push(pricing);
  }
  const newId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
  pricing.papers.push({ id: newId, name: 'Loại giấy mới', tiers: [{ max: 999999, price: 1000 }] });
  SP.editingPaperId = newId;
  savePaperSettings(true);
  _refreshPaperContent();
  _syncDropdowns();
  showToast('✅ Đã thêm loại giấy');
}

function spUpdatePaperName(sizeId, paperId, name) {
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  const paper = pricing?.papers.find(p => p.id === paperId);
  if (!paper || paper.name === name) return;
  paper.name = name;
  savePaperSettings(true);
  _syncDropdowns();
}

function spDupPaper(sizeId, paperId) {
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  const paper = pricing?.papers.find(p => p.id === paperId);
  if (!paper) return;
  const newId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
  pricing.papers.push({ id: newId, name: paper.name + ' (copy)', tiers: JSON.parse(JSON.stringify(paper.tiers)) });
  savePaperSettings(true);
  _refreshPaperContent();
  _syncDropdowns();
  showToast('✅ Đã nhân bản');
}

function spDeletePaper(sizeId, paperId) {
  if (!confirm('🗑️ Xóa loại giấy này?')) return;
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  if (!pricing) return;
  pricing.papers = pricing.papers.filter(p => p.id !== paperId);
  if (SP.editingPaperId === paperId) SP.editingPaperId = null;
  savePaperSettings(true);
  _refreshPaperContent();
  _syncDropdowns();
  showToast('🗑️ Đã xóa loại giấy');
}

// ---- Tier editor ----
function spToggleTierEditor(sizeId, paperId) {
  SP.editingPaperId = (SP.editingPaperId === paperId) ? null : paperId;
  _refreshPaperContent();
}

function spAddTier(sizeId, paperId) {
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  const paper = pricing?.papers.find(p => p.id === paperId);
  if (!paper) return;
  const tiers = paper.tiers;
  const last = tiers[tiers.length - 1];
  if (last.max === 999999) {
    const newMax = tiers.length === 1 ? 500 : tiers[tiers.length - 2].max * 2;
    tiers.splice(tiers.length - 1, 0, { max: newMax, price: last.price });
  } else {
    tiers.push({ max: 999999, price: last.price });
  }
  savePaperSettings(true);
  _refreshPaperContent();
}

function spUpdateTierMax(sizeId, paperId, tierIdx, value) {
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  const paper = pricing?.papers.find(p => p.id === paperId);
  if (!paper) return;
  const tier = paper.tiers[tierIdx];
  if (!tier || tier.max === 999999) return;
  const v = parseInt(value);
  if (isNaN(v) || v < 1) return;
  tier.max = v;
  savePaperSettings(true);
  _refreshPaperContent();
}

function spUpdateTierPrice(sizeId, paperId, tierIdx, value) {
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  const paper = pricing?.papers.find(p => p.id === paperId);
  if (!paper) return;
  const v = parseInt(value) || 0;
  if (v < 0) return;
  paper.tiers[tierIdx].price = v;
  savePaperSettings(true);
}

function spDeleteTier(sizeId, paperId, tierIdx) {
  const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
  const paper = pricing?.papers.find(p => p.id === paperId);
  if (!paper || paper.tiers.length <= 1) { alert('⚠️ Phải có ít nhất 1 mốc!'); return; }
  const isLast = paper.tiers[tierIdx].max === 999999;
  paper.tiers.splice(tierIdx, 1);
  if (isLast && paper.tiers.length > 0) paper.tiers[paper.tiers.length - 1].max = 999999;
  savePaperSettings(true);
  _refreshPaperContent();
}

function _refreshPaperContent() {
  const el = document.getElementById('spPaperContent');
  if (el) el.innerHTML = _renderPaperContent();
  // Also refresh chips
  const panel = document.getElementById('sp-panel-paperTypes');
  if (panel) {
    const chipBar = panel.querySelector('.sp-size-bar');
    if (chipBar) {
      const sizes = PAPER_SETTINGS.printSizes || [];
      const tmpDiv = document.createElement('div');
      tmpDiv.innerHTML = _renderSizeChips(sizes);
      const newBar = tmpDiv.querySelector('.sp-size-bar');
      if (newBar) chipBar.innerHTML = newBar.innerHTML;
    }
  }
}

// =====================================================
// TAB 2: GIÁ IN
// =====================================================
function _renderPricing() {
  const panel = document.getElementById('sp-panel-paperPrint');
  if (!panel) return;

  if (typeof initPrintPricingBySize === 'function') initPrintPricingBySize();

  const sizes = PAPER_SETTINGS.printSizes || [];
  if (sizes.length === 0) {
    panel.innerHTML = `<div class="sp-scroll-content"><div class="sp-empty"><div class="sp-empty-icon">📋</div><h4>Chưa có khổ giấy</h4><p>Vui lòng thêm khổ giấy trong tab "Loại Giấy" trước</p></div></div>`;
    return;
  }

  if (!SP.printActiveSizeKey) {
    SP.printActiveSizeKey = `${sizes[0].w}x${sizes[0].h}`;
  }

  // Size chips
  const chips = sizes.map(s => {
    const key = `${s.w}x${s.h}`;
    const isActive = key === SP.printActiveSizeKey;
    return `
      <div class="sp-size-chip ${isActive ? 'active' : ''}" onclick="spSelectPrintSize('${key}')">
        ${formatSizeShort(s)}
        <span class="sp-chip-count">${s.w > 480 || s.h > 480 ? '📐' : ''}</span>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="sp-size-bar">${chips}</div>
    <div class="sp-scroll-content" id="spPrintMain">${_renderPrintMain()}</div>`;
}

function spSelectPrintSize(key) {
  SP.printActiveSizeKey = key;
  // Refresh chips active state
  document.querySelectorAll('#sp-panel-paperPrint .sp-size-chip').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick').includes(`'${key}'`));
  });
  const main = document.getElementById('spPrintMain');
  if (main) main.innerHTML = _renderPrintMain();
}

function _renderPrintMain() {
  const key = SP.printActiveSizeKey;
  if (!key || !PAPER_SETTINGS.printPricingBySize?.[key]) {
    return `<div class="sp-empty"><div class="sp-empty-icon">👆</div><p>Chọn khổ giấy ở trên</p></div>`;
  }
  const sizeData = PAPER_SETTINGS.printPricingBySize[key];
  const oneSide = sizeData.oneSide || { tiers: [] };
  const twoSide = sizeData.twoSide || { tiers: [{ max: 999999, price: 0 }] };

  const renderTierTable = (tiers, side) => {
    const rows = tiers.map((t, i) => {
      const minQty = i === 0 ? 1 : (tiers[i - 1].max + 1);
      const isLast = t.max === 999999;
      return `
        <tr>
          <td><input type="number" value="${minQty}" readonly></td>
          <td><input type="number" value="${isLast ? '' : t.max}" placeholder="${isLast ? '∞' : ''}"
            ${isLast ? 'readonly' : ''} onchange="spUpdatePrintTierMax('${key}','${side}',${i},this.value)"></td>
          <td><input type="number" value="${t.price}" min="0"
            onchange="spUpdatePrintTierPrice('${key}','${side}',${i},this.value)"></td>
          <td style="font-size:12px;color:#64748b;">đ/tờ</td>
          <td>${tiers.length > 1 ? `<button class="sp-tier-mini-del" onclick="spDeletePrintTier('${key}','${side}',${i})">✕</button>` : ''}</td>
        </tr>`;
    }).join('');

    return `
      <table class="sp-print-tiers-table">
        <thead><tr>
          <th>TỪ</th><th>ĐẾN</th><th>GIÁ</th><th>Đơn vị</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <button class="sp-tier-add-btn" onclick="spAddPrintTier('${key}','${side}')">➕ Thêm mốc</button>`;
  };

  return `
    <div class="sp-print-block">
      <div class="sp-print-block-header">
        <div class="sp-print-block-title">🖨️ In 1 mặt</div>
      </div>
      <div class="sp-print-block-body">${renderTierTable(oneSide.tiers || [], 'oneSide')}</div>
    </div>
    <div class="sp-print-block">
      <div class="sp-print-block-header">
        <div class="sp-print-block-title">📄 In 2 mặt
          <span style="font-size:11px;font-weight:400;color:#64748b;">(Nếu giá = 0 → tính 2× in 1 mặt)</span>
        </div>
      </div>
      <div class="sp-print-block-body">${renderTierTable(twoSide.tiers || [{ max: 999999, price: 0 }], 'twoSide')}</div>
    </div>`;
}

function spUpdatePrintTierMax(key, side, idx, value) {
  const sizeData = PAPER_SETTINGS.printPricingBySize?.[key];
  if (!sizeData) return;
  if (side === 'twoSide' && !sizeData.twoSide) sizeData.twoSide = { name: 'In 2 mặt', tiers: [{ max: 999999, price: 0 }] };
  const tiers = sizeData[side]?.tiers;
  if (!tiers?.[idx] || tiers[idx].max === 999999) return;
  const v = parseInt(value);
  if (isNaN(v) || v < 1) return;
  tiers[idx].max = v;
  savePaperSettings(true);
  const main = document.getElementById('spPrintMain');
  if (main) main.innerHTML = _renderPrintMain();
}

function spUpdatePrintTierPrice(key, side, idx, value) {
  const sizeData = PAPER_SETTINGS.printPricingBySize?.[key];
  if (!sizeData) return;
  if (side === 'twoSide' && !sizeData.twoSide) sizeData.twoSide = { name: 'In 2 mặt', tiers: [{ max: 999999, price: 0 }] };
  const tiers = sizeData[side]?.tiers;
  if (!tiers?.[idx]) return;
  tiers[idx].price = parseInt(value) || 0;
  savePaperSettings(true);
}

function spAddPrintTier(key, side) {
  const sizeData = PAPER_SETTINGS.printPricingBySize?.[key];
  if (!sizeData) return;
  if (side === 'twoSide' && !sizeData.twoSide) sizeData.twoSide = { name: 'In 2 mặt', tiers: [{ max: 999999, price: 0 }] };
  const tiers = sizeData[side].tiers;
  const last = tiers[tiers.length - 1];
  const newMax = last.max === 999999 ? 1000 : last.max + 500;
  tiers.splice(tiers.length - 1, 0, { max: newMax, price: last.price });
  savePaperSettings(true);
  const main = document.getElementById('spPrintMain');
  if (main) main.innerHTML = _renderPrintMain();
  showToast('✅ Đã thêm mốc');
}

function spDeletePrintTier(key, side, idx) {
  const sizeData = PAPER_SETTINGS.printPricingBySize?.[key];
  if (!sizeData) return;
  const tiers = sizeData[side]?.tiers;
  if (!tiers || tiers.length <= 1) { alert('⚠️ Phải có ít nhất 1 mốc!'); return; }
  if (!confirm('🗑️ Xóa mốc này?')) return;
  const isLast = tiers[idx].max === 999999;
  tiers.splice(idx, 1);
  if (isLast && tiers.length > 0) tiers[tiers.length - 1].max = 999999;
  savePaperSettings(true);
  const main = document.getElementById('spPrintMain');
  if (main) main.innerHTML = _renderPrintMain();
  showToast('🗑️ Đã xóa mốc');
}

// =====================================================
// TAB 3: CÁN MÀNG
// =====================================================
function _renderLamination() {
  if (typeof renderLaminationSettings === 'function') {
    const panel = document.getElementById('sp-panel-paperLam');
    if (!panel) return;
    panel.innerHTML = `<div id="laminationContainer"></div>`;
    renderLaminationSettings();
    return;
  }
  _renderLamFallback();
}

function _renderLamFallback() {
  const panel = document.getElementById('sp-panel-paperLam');
  if (!panel) return;
  const sizes = PAPER_SETTINGS.printSizes || [];

  if (sizes.length === 0) {
    panel.innerHTML = `<div class="sp-scroll-content"><div class="sp-empty"><div class="sp-empty-icon">📋</div><h4>Chưa có khổ giấy</h4></div></div>`;
    return;
  }

  if (!SP.selectedLamSize || !sizes.find(s => s.id === SP.selectedLamSize))
    SP.selectedLamSize = sizes[0].id;

  // Size chips
  const chips = sizes.map(s => {
    const isActive = s.id === SP.selectedLamSize;
    return `<div class="sp-size-chip ${isActive ? 'active' : ''}" onclick="spSelectLamSize(${s.id})">${formatSizeShort(s)}</div>`;
  }).join('');

  panel.innerHTML = `
    <div class="sp-size-bar">${chips}</div>
    <div class="sp-scroll-content" id="spLamMain">${_renderLamMain()}</div>`;
}

function spSelectLamSize(sizeId) {
  SP.selectedLamSize = sizeId;
  document.querySelectorAll('#sp-panel-paperLam .sp-size-chip').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick').includes(sizeId));
  });
  const main = document.getElementById('spLamMain');
  if (main) main.innerHTML = _renderLamMain();
}

function _renderLamMain() {
  const pricing = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === SP.selectedLamSize);
  const lams = pricing?.laminations || [];
  if (lams.length === 0) return `<div class="sp-empty"><div class="sp-empty-icon">📋</div><h4>Chưa có cán màng cho khổ này</h4></div>`;

  return lams.map((lam, li) => {
    const tiers = lam.tiers || [];
    const rows = tiers.map((t, i) => {
      const minQty = i === 0 ? 1 : (tiers[i - 1].max + 1);
      const isLast = t.max === 999999;
      const unit = t.unit || 'per_sheet';
      return `
        <div class="sp-lam-tier-row">
          <input type="number" value="${minQty}" readonly>
          <span class="sep">—</span>
          <input type="number" value="${isLast ? '' : t.max}" placeholder="${isLast ? '∞' : ''}" ${isLast ? 'readonly' : ''}
            onchange="spUpdateLamTierMax(${SP.selectedLamSize},${lam.id},${i},this.value)">
          <span class="sep">×</span>
          <input type="number" value="${t.price}" min="0"
            onchange="spUpdateLamTierPrice(${SP.selectedLamSize},${lam.id},${i},this.value)">
          <select onchange="spUpdateLamTierUnit(${SP.selectedLamSize},${lam.id},${i},this.value)">
            <option value="per_sheet" ${unit === 'per_sheet' ? 'selected' : ''}>đ/tờ</option>
            <option value="per_m2"    ${unit === 'per_m2' ? 'selected' : ''}>đ/m²</option>
            <option value="per_lot"   ${unit === 'per_lot' ? 'selected' : ''}>đ/lô</option>
          </select>
          ${tiers.length > 1 ? `<button class="sp-tier-mini-del" onclick="spDeleteLamTier(${SP.selectedLamSize},${lam.id},${i})">✕</button>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="sp-print-block" style="margin-bottom:14px;">
        <div class="sp-print-block-header">
          <div class="sp-print-block-title">✨ ${lam.name}</div>
        </div>
        <div class="sp-print-block-body">
          ${rows}
          <button class="sp-tier-add-btn" onclick="spAddLamTier(${SP.selectedLamSize},${lam.id})">➕ Thêm mốc</button>
        </div>
      </div>`;
  }).join('');
}

function spUpdateLamTierMax(sizeId, lamId, idx, value) {
  const p = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === sizeId);
  const lam = p?.laminations?.find(l => l.id === lamId);
  if (!lam || !lam.tiers[idx] || lam.tiers[idx].max === 999999) return;
  const v = parseInt(value);
  if (isNaN(v) || v < 1) return;
  lam.tiers[idx].max = v;
  savePaperSettings(true);
  const main = document.getElementById('spLamMain');
  if (main) main.innerHTML = _renderLamMain();
}

function spUpdateLamTierPrice(sizeId, lamId, idx, value) {
  const p = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === sizeId);
  const lam = p?.laminations?.find(l => l.id === lamId);
  if (!lam?.tiers[idx]) return;
  lam.tiers[idx].price = parseInt(value) || 0;
  savePaperSettings(true);
}

function spUpdateLamTierUnit(sizeId, lamId, idx, value) {
  const p = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === sizeId);
  const lam = p?.laminations?.find(l => l.id === lamId);
  if (!lam?.tiers[idx]) return;
  lam.tiers[idx].unit = value;
  savePaperSettings(true);
}

function spAddLamTier(sizeId, lamId) {
  const p = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === sizeId);
  const lam = p?.laminations?.find(l => l.id === lamId);
  if (!lam) return;
  const last = lam.tiers[lam.tiers.length - 1];
  const newMax = last.max === 999999 ? 500 : last.max + 500;
  lam.tiers.splice(lam.tiers.length - 1, 0, { max: newMax, price: last.price, unit: last.unit || 'per_sheet' });
  savePaperSettings(true);
  const main = document.getElementById('spLamMain');
  if (main) main.innerHTML = _renderLamMain();
  showToast('✅ Đã thêm mốc cán màng');
}

function spDeleteLamTier(sizeId, lamId, idx) {
  const p = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === sizeId);
  const lam = p?.laminations?.find(l => l.id === lamId);
  if (!lam || lam.tiers.length <= 1) { alert('⚠️ Phải có ít nhất 1 mốc!'); return; }
  if (!confirm('🗑️ Xóa mốc này?')) return;
  const isLast = lam.tiers[idx].max === 999999;
  lam.tiers.splice(idx, 1);
  if (isLast && lam.tiers.length > 0) lam.tiers[lam.tiers.length - 1].max = 999999;
  savePaperSettings(true);
  const main = document.getElementById('spLamMain');
  if (main) main.innerHTML = _renderLamMain();
  showToast('🗑️ Đã xóa mốc');
}

// =====================================================
// TAB 4: GIA CÔNG
// =====================================================
function _renderProcessing() {
  const panel = document.getElementById('sp-panel-paperProc');
  if (!panel) return;
  panel.innerHTML = `<div id="processingContainer"></div>`;
  if (typeof renderProcessingSettings === 'function') {
    renderProcessingSettings();
  }
}

// =====================================================
// TAB 5: LOẠI KHÁCH HÀNG
// =====================================================
function _renderCustomers() {
  const panel = document.getElementById('sp-panel-paperCustomer');
  if (!panel) return;

  const custs = PAPER_SETTINGS.customerTypes || [];

  const cards = custs.map(c => `
    <div class="sp-paper-card">
      <div class="sp-paper-card-header" style="cursor:default;">
        <input type="text" class="sp-paper-name-input" value="${c.name.replace(/"/g, '&quot;')}" placeholder="Tên loại khách"
          onblur="spUpdateCustomer(${c.id},'name',this.value)">
        <div style="display:flex;align-items:center;gap:6px;">
          <input type="number" value="${c.profit}" min="0" max="500" step="1" style="width:65px;padding:7px 8px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;font-size:14px;font-weight:700;background:#fafbfc;"
            onchange="spUpdateCustomer(${c.id},'profit',this.value)">
          <span style="font-size:14px;font-weight:700;color:#10b981;">% LN</span>
        </div>
        ${custs.length > 1 ? `<button class="sp-icon-btn del" onclick="spDeleteCustomer(${c.id})" title="Xóa">🗑️</button>` : ''}
      </div>
    </div>`).join('');

  panel.innerHTML = `
    <div class="sp-scroll-content" style="max-width:650px;">
      <div class="sp-info-tip">
        💡 <strong>% LN</strong> = phần trăm lợi nhuận cộng vào giá vốn khi tính giá bán.
        Ví dụ: Vốn 10.000đ, LN 40% → Giá bán: 14.000đ
      </div>
      ${cards.length > 0 ? cards : '<div class="sp-empty"><div class="sp-empty-icon">👥</div><h4>Chưa có loại khách</h4></div>'}
      <button class="sp-add-paper-btn" style="margin-top:12px;" onclick="spAddCustomer()">
        ➕ Thêm loại khách hàng
      </button>
    </div>`;
}

function spUpdateCustomer(id, field, value) {
  const c = PAPER_SETTINGS.customerTypes.find(c => c.id === id);
  if (!c) return;
  if (field === 'profit') {
    const v = parseFloat(value);
    if (!isNaN(v) && v >= 0) c.profit = v;
  } else {
    c[field] = value;
  }
  savePaperSettings(true);
  _syncDropdowns();
}

function spAddCustomer() {
  const newId = Math.max(...PAPER_SETTINGS.customerTypes.map(c => c.id), 0) + 1;
  PAPER_SETTINGS.customerTypes.push({ id: newId, name: 'Loại khách mới', profit: 30 });
  savePaperSettings(true);
  _syncDropdowns();
  _renderCustomers();
  showToast('✅ Đã thêm loại khách');
}

function spDeleteCustomer(id) {
  if (PAPER_SETTINGS.customerTypes.length <= 1) { alert('⚠️ Phải có ít nhất 1 loại khách!'); return; }
  if (!confirm('🗑️ Xóa loại khách này?')) return;
  PAPER_SETTINGS.customerTypes = PAPER_SETTINGS.customerTypes.filter(c => c.id !== id);
  savePaperSettings(true);
  _syncDropdowns();
  _renderCustomers();
  showToast('🗑️ Đã xóa');
}

// =====================================================
// HELPERS
// =====================================================
function _syncDropdowns() {
  if (typeof populatePaperDropdowns === 'function') populatePaperDropdowns();
  if (typeof populatePaperSizeDropdown === 'function') populatePaperSizeDropdown();
}

function _ensureLamForSize(sizeId, w, h) {
  if (!PAPER_SETTINGS.laminationPricing) PAPER_SETTINGS.laminationPricing = [];
  if (PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId)) return;
  const base = Math.max(...PAPER_SETTINGS.laminationPricing.flatMap(p => p.laminations || []).map(l => l.id), 0) + 1;
  PAPER_SETTINGS.laminationPricing.push({
    printSizeId: sizeId,
    laminations: [
      { id: base, name: 'Không cán', tiers: [{ max: 999999, price: 0, unit: 'per_sheet' }] },
      { id: base + 1, name: 'Cán bóng 1 mặt', tiers: [{ max: 100, price: 800, unit: 'per_sheet' }, { max: 999999, price: 2500, unit: 'per_m2' }] },
      { id: base + 2, name: 'Cán bóng 2 mặt', tiers: [{ max: 100, price: 1600, unit: 'per_sheet' }, { max: 999999, price: 5000, unit: 'per_m2' }] },
      { id: base + 3, name: 'Cán mờ 1 mặt', tiers: [{ max: 100, price: 900, unit: 'per_sheet' }, { max: 999999, price: 2700, unit: 'per_m2' }] },
      { id: base + 4, name: 'Cán mờ 2 mặt', tiers: [{ max: 100, price: 1800, unit: 'per_sheet' }, { max: 999999, price: 5400, unit: 'per_m2' }] },
    ]
  });
}

function _ensurePrintPricingForSize(sizeId, w, h) {
  if (!PAPER_SETTINGS.printPricingBySize) PAPER_SETTINGS.printPricingBySize = {};
  const key = `${w}x${h}`;
  if (PAPER_SETTINGS.printPricingBySize[key]) return;
  const isLarge = w > 480 || h > 480;
  PAPER_SETTINGS.printPricingBySize[key] = {
    sizeInfo: { id: key, name: `Khổ ${formatMmToCm(w)}×${formatMmToCm(h)}${isLarge ? ' (Lớn)' : ''}`, width: w, height: h, isLargeFormat: isLarge, printSizeId: sizeId },
    oneSide: {
      name: 'In 1 mặt',
      tiers: isLarge
        ? [{ max: 2, price: 5000 }, { max: 100, price: 3500 }, { max: 500, price: 3000 }, { max: 999999, price: 2800 }]
        : [{ max: 2, price: 3000 }, { max: 500, price: 2000 }, { max: 999999, price: 1900 }]
    }
  };
}

// =====================================================
// Backward-compat
// =====================================================
function renderPaperCustomerTypes() { _renderCustomers(); }
function addPaperCustomerType() { spAddCustomer(); }
