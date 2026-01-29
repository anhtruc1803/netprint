// ===== LỊCH SỬ TÍNH GIÁ =====
// Hệ thống quản lý lịch sử tính giá với giao diện nhỏ gọn, chuyên nghiệp

// Lưu báo giá vào lịch sử
function savePaperQuoteToHistory(quoteData) {
    try {
        let history = JSON.parse(localStorage.getItem('paperHistory') || '[]');

        // Thêm timestamp và id unique
        const newQuote = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...quoteData
        };

        // Thêm vào đầu mảng (mới nhất lênđầu)
        history.unshift(newQuote);

        // Giới hạn 100 record
        if (history.length > 100) {
            history = history.slice(0, 100);
        }

        localStorage.setItem('paperHistory', JSON.stringify(history));
        console.log('✅ Đã lưu vào lịch sử');

        // Reload lịch sử nếu đang ở tab history
        if (document.getElementById('paper-history').classList.contains('active')) {
            loadPaperHistory();
        }
    } catch (e) {
        console.error('❌ Lỗi lưu lịch sử:', e);
    }
}

// Load và hiển thị lịch sử
function loadPaperHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('paperHistory') || '[]');
        const listContainer = document.getElementById('paperHistoryList');

        if (!listContainer) return;

        if (history.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">Chưa có lịch sử tính giá</div>
                    <div class="empty-hint">Hãy tính giá để lưu lại lịch sử!</div>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = history.map(quote => createHistoryCard(quote)).join('');
    } catch (e) {
        console.error('❌ Lỗi load lịch sử:', e);
    }
}

// Tạo HTML cho 1 card lịch sử (gọn, chuyên nghiệp)
function createHistoryCard(quote) {
    const date = new Date(quote.timestamp);
    const dateStr = date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Tạo tên SP ngắn gọn
    const spec = `${quote.prodW}×${quote.prodH}mm`;
    const paper = quote.paperType || 'N/A';
    const print = quote.printSides || 'N/A';
    const lam = quote.lamination || 'Không cán';
    const processing = quote.processing && quote.processing.length > 0
        ? quote.processing.join(' + ')
        : '';

    const title = `SP: ${spec} | ${paper} | ${print} | ${lam}${processing ? ' | ' + processing : ''}`;

    return `
        <div class="history-card" data-id="${quote.id}">
            <div class="history-card-header">
                <div class="history-title">${title}</div>
                <div class="history-actions">
                    <button class="btn-icon" onclick="copyQuoteFromHistory(${quote.id})" title="Copy để tạo báo giá mới">
                        <span>📋</span>
                    </button>
                    <button class="btn-icon" onclick="editQuoteFromHistory(${quote.id})" title="Chỉnh sửa">
                        <span>✏️</span>
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteQuoteFromHistory(${quote.id})" title="Xóa">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
            
            <div class="history-card-body">
                <div class="history-row">
                    <div class="history-col">
                        <div class="history-label">📅 Thời gian:</div>
                        <div class="history-value">${dateStr}</div>
                    </div>
                    <div class="history-col">
                        <div class="history-label">📏 Quy cách SP:</div>
                        <div class="history-value">${spec}</div>
                    </div>
                </div>
                
                <div class="history-row">
                    <div class="history-col">
                        <div class="history-label">📄 Giấy:</div>
                        <div class="history-value">${paper}</div>
                    </div>
                    <div class="history-col">
                        <div class="history-label">🖨️ In:</div>
                        <div class="history-value">${print}</div>
                    </div>
                </div>
                
                <div class="history-row">
                    <div class="history-col">
                        <div class="history-label">✨ Cán:</div>
                        <div class="history-value">${lam}</div>
                    </div>
                    <div class="history-col">
                        <div class="history-label">🔧 Gia công:</div>
                        <div class="history-value">${processing || 'Không'}</div>
                    </div>
                </div>
                
                <div class="history-row highlight">
                    <div class="history-col">
                        <div class="history-label">📦 Số lượng:</div>
                        <div class="history-value-big">${formatNumber(quote.qty)}</div>
                    </div>
                    <div class="history-col">
                        <div class="history-label">🔥 Đơn giá:</div>
                        <div class="history-value-big price">${formatNumber(quote.sellPrice)}đ/sp</div>
                    </div>
                </div>
                
                <div class="history-row highlight">
                    <div class="history-col full">
                        <div class="history-label">💰 Thành tiền:</div>
                        <div class="history-value-big total">${formatNumber(quote.totalSell)}đ</div>
                    </div>
                </div>
                
                ${quote.customerType ? `
                <div class="history-row">
                    <div class="history-col">
                        <div class="history-label">👤 Loại KH:</div>
                        <div class="history-value">${quote.customerType}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Tìm kiếm lịch sử
function filterPaperHistory() {
    const searchText = (document.getElementById('paperHistorySearch')?.value || '').toLowerCase().trim();
    const history = JSON.parse(localStorage.getItem('paperHistory') || '[]');

    const filtered = searchText === ''
        ? history
        : history.filter(quote => {
            const searchStr = [
                quote.paperType,
                quote.printSides,
                quote.lamination,
                quote.processing ? quote.processing.join(' ') : '',
                quote.customerType,
                `${quote.prodW}×${quote.prodH}`
            ].join(' ').toLowerCase();

            return searchStr.includes(searchText);
        });

    const listContainer = document.getElementById('paperHistoryList');
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
        listContainer.innerHTML = filtered.map(quote => createHistoryCard(quote)).join('');
    }
}

// Copy báo giá từ lịch sử (điền vào form)
function copyQuoteFromHistory(id) {
    try {
        const history = JSON.parse(localStorage.getItem('paperHistory') || '[]');
        const quote = history.find(q => q.id === id);

        if (!quote) {
            alert('❌ Không tìm thấy báo giá!');
            return;
        }

        // Điền vào form
        document.getElementById('paperProdW').value = quote.prodW || 0;
        document.getElementById('paperProdH').value = quote.prodH || 0;
        document.getElementById('paperQty').value = quote.qty || 0;

        // Chuyển sang tab Tính Giá
        const calcTab = document.querySelector('.sub-tab');
        if (calcTab) calcTab.click();

        // Scroll lên đầu
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Thông báo
        alert('✅ Đã copy thông tin báo giá!\nVui lòng chọn lại loại giấy, in, cán để tính giá.');

    } catch (e) {
        console.error('❌ Lỗi copy:', e);
        alert('❌ Có lỗi xảy ra!');
    }
}

// Edit báo giá từ lịch sử (điền và scroll về form)
function editQuoteFromHistory(id) {
    copyQuoteFromHistory(id); // Tạm thời dùng copy, sau này có thể mở rộng
}

// Xóa 1 báo giá
function deleteQuoteFromHistory(id) {
    if (!confirm('🗑️ Xác nhận xóa báo giá này?')) return;

    try {
        let history = JSON.parse(localStorage.getItem('paperHistory') || '[]');
        history = history.filter(q => q.id !== id);
        localStorage.setItem('paperHistory', JSON.stringify(history));

        loadPaperHistory();
        console.log('✅ Đã xóa');
    } catch (e) {
        console.error('❌ Lỗi xóa:', e);
    }
}

// Xóa tất cả lịch sử
function clearPaperHistory() {
    if (!confirm('🗑️ XÓA TẤT CẢ lịch sử?\nHành động này không thể hoàn tác!')) return;

    try {
        localStorage.setItem('paperHistory', '[]');
        loadPaperHistory();
        console.log('✅ Đã xóa tất cả lịch sử');
    } catch (e) {
        console.error('❌ Lỗi xóa:', e);
    }
}

// Helper: Format số
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return Math.round(num).toLocaleString('vi-VN');
}
