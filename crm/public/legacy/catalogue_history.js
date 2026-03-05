// ===== LỊCH SỬ TÍNH GIÁ CATALOGUE =====
// Hệ thống quản lý lịch sử tính giá Catalogue

// Lưu báo giá Catalogue vào lịch sử
function saveCatQuoteToHistory(quoteData) {
    try {
        let history = JSON.parse(localStorage.getItem('catalogueHistory') || '[]');

        // Thêm timestamp và id unique
        const newQuote = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...quoteData
        };

        // Thêm vào đầu mảng (mới nhất lên đầu)
        history.unshift(newQuote);

        // Giới hạn 100 record
        if (history.length > 100) {
            history = history.slice(0, 100);
        }

        localStorage.setItem('catalogueHistory', JSON.stringify(history));
        console.log('✅ Đã lưu Catalogue vào lịch sử');

        // Reload lịch sử nếu đang ở tab history
        if (document.getElementById('cat-history')?.classList.contains('active')) {
            loadCatHistory();
        }
    } catch (e) {
        console.error('❌ Lỗi lưu lịch sử Catalogue:', e);
    }
}

// Load và hiển thị lịch sử Catalogue
function loadCatHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('catalogueHistory') || '[]');
        const listContainer = document.getElementById('catHistoryList');

        if (!listContainer) return;

        if (history.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📚</div>
                    <div class="empty-text">Chưa có lịch sử tính giá Catalogue</div>
                    <div class="empty-hint">Hãy tính giá để lưu lại lịch sử!</div>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = history.map(quote => createCatHistoryCard(quote)).join('');
    } catch (e) {
        console.error('❌ Lỗi load lịch sử Catalogue:', e);
    }
}

// Tạo HTML cho 1 card lịch sử Catalogue - Giao diện compact giống Paper
function createCatHistoryCard(quote) {
    const date = new Date(quote.timestamp);
    const dateStr = date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Lấy thông tin từ quote
    const catSize = quote.catSize || 'N/A';
    const pages = quote.totalPages || 0;
    const binding = quote.bindingType || 'N/A';
    const coverPaper = quote.coverPaper || 'N/A';
    const innerPaper = quote.innerPaper || 'N/A';
    const coverPrint = quote.coverPrint || 'In 2 mặt';
    const innerPrint = quote.innerPrint || 'In 2 mặt';
    const coverLam = quote.coverLamination || 'Không cán';
    const innerLam = quote.innerLamination || 'Không cán';
    const customerType = quote.customerType || 'Khách lẻ';
    const qty = quote.qty || 0;
    const sellPrice = quote.sellPrice || 0;
    const totalSell = quote.totalSell || 0;

    // Tạo title ngắn gọn
    const title = `📚 ${catSize} | ${pages} trang | ${binding} | Bìa: ${coverPaper} | Ruột: ${innerPaper}`;

    return `
        <div class="history-card-single" data-id="${quote.id}">
            <!-- HEADER: Title + Actions -->
            <div class="history-card-header">
                <div class="history-title">${title}</div>
                <div class="history-actions">
                    <button class="btn-icon" onclick="copyCatQuoteFromHistory(${quote.id})" title="Copy">
                        <span>📋</span>
                    </button>
                    <button class="btn-icon" onclick="editCatQuoteFromHistory(${quote.id})" title="Sửa">
                        <span>✏️</span>
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteCatQuoteFromHistory(${quote.id})" title="Xóa">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
            
            <!-- BODY: Tất cả thông tin trong 1 dòng -->
            <div class="history-card-body-single">
                <span class="history-info">📅 ${dateStr}</span>
                <span class="history-separator">•</span>
                <span class="history-info">📐 ${catSize}</span>
                <span class="history-separator">•</span>
                <span class="history-info">📄 ${pages} trang</span>
                <span class="history-separator">•</span>
                <span class="history-info">📎 ${binding}</span>
                <span class="history-separator">•</span>
                <span class="history-info">📑 Bìa: ${coverPaper} (${coverPrint})</span>
                <span class="history-separator">•</span>
                <span class="history-info">📃 Ruột: ${innerPaper} (${innerPrint})</span>
                <span class="history-separator">•</span>
                <span class="history-info">✨ Cán bìa: ${coverLam}</span>
                <span class="history-separator">•</span>
                <span class="history-info">👤 ${customerType}</span>
                <span class="history-separator">•</span>
                <span class="history-info history-highlight">📦 ${formatNumber(qty)} cuốn</span>
                <span class="history-separator">•</span>
                <span class="history-info history-highlight history-price">🔥 ${formatNumber(sellPrice)}đ/cuốn</span>
                <span class="history-separator">•</span>
                <span class="history-info history-total">💰 ${formatNumber(totalSell)}đ</span>
            </div>
        </div>
    `;
}

// Tìm kiếm lịch sử Catalogue
function filterCatHistory() {
    const searchText = (document.getElementById('catHistorySearch')?.value || '').toLowerCase().trim();
    const history = JSON.parse(localStorage.getItem('catalogueHistory') || '[]');

    const filtered = searchText === ''
        ? history
        : history.filter(quote => {
            const searchStr = [
                quote.catSize,
                quote.bindingType,
                quote.coverPaper,
                quote.innerPaper,
                quote.customerType,
                `${quote.totalPages} trang`
            ].join(' ').toLowerCase();

            return searchStr.includes(searchText);
        });

    const listContainer = document.getElementById('catHistoryList');
    if (!listContainer) return;

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-history">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">Không tìm thấy kết quả</div>
                <div class="empty-hint">Thử từ khóa khác nhé!</div>
            </div>
        `;
    } else {
        listContainer.innerHTML = filtered.map(quote => createCatHistoryCard(quote)).join('');
    }
}

// Copy báo giá Catalogue từ lịch sử (điền vào form)
function copyCatQuoteFromHistory(id) {
    try {
        const history = JSON.parse(localStorage.getItem('catalogueHistory') || '[]');
        const quote = history.find(q => q.id === id);

        if (!quote) {
            alert('❌ Không tìm thấy báo giá!');
            return;
        }

        // Điền vào form
        const catQty = document.getElementById('catQty');
        const catPages = document.getElementById('catPages');

        if (catQty) catQty.value = quote.qty || 100;
        if (catPages) catPages.value = quote.totalPages || 16;

        // Chuyển sang tab Tính Giá Catalogue nếu có sub-tabs
        const calcSubTab = document.querySelector('#catalogue-calculator .sub-tab');
        if (calcSubTab) calcSubTab.click();

        // Scroll lên đầu
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Thông báo
        alert('✅ Đã copy thông tin báo giá Catalogue!\nVui lòng chọn lại các thông số khác để tính giá.');

    } catch (e) {
        console.error('❌ Lỗi copy Catalogue:', e);
        alert('❌ Có lỗi xảy ra!');
    }
}

// Edit báo giá từ lịch sử (điền và scroll về form)
function editCatQuoteFromHistory(id) {
    copyCatQuoteFromHistory(id); // Tạm thời dùng copy
}

// Xóa 1 báo giá Catalogue
function deleteCatQuoteFromHistory(id) {
    if (!confirm('🗑️ Xác nhận xóa báo giá Catalogue này?')) return;

    try {
        let history = JSON.parse(localStorage.getItem('catalogueHistory') || '[]');
        history = history.filter(q => q.id !== id);
        localStorage.setItem('catalogueHistory', JSON.stringify(history));

        loadCatHistory();
        console.log('✅ Đã xóa báo giá Catalogue');
    } catch (e) {
        console.error('❌ Lỗi xóa Catalogue:', e);
    }
}

// Xóa tất cả lịch sử Catalogue
function clearCatHistory() {
    if (!confirm('🗑️ XÓA TẤT CẢ lịch sử Catalogue?\nHành động này không thể hoàn tác!')) return;

    try {
        localStorage.setItem('catalogueHistory', '[]');
        loadCatHistory();
        console.log('✅ Đã xóa tất cả lịch sử Catalogue');
    } catch (e) {
        console.error('❌ Lỗi xóa Catalogue:', e);
    }
}
