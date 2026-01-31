// ===== BACKUP & RESTORE MODULE =====

const BACKUP_PREFIX = 'netprint_';
const BACKUP_FILENAME_PREFIX = 'netprint_backup_';

function exportData() {
    try {
        const data = {};
        let count = 0;

        // Collect all data starting with prefix
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(BACKUP_PREFIX)) {
                data[key] = localStorage.getItem(key);
                count++;
            }
        }

        if (count === 0) {
            showToast('⚠️ Không có dữ liệu để sao lưu', 'error');
            return;
        }

        // Add metadata
        const exportObj = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: data
        };

        // Create blob and download
        const jsonStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const a = document.createElement('a');
        a.href = url;
        a.download = `${BACKUP_FILENAME_PREFIX}${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('✅ Đã tải xuống file sao lưu');
    } catch (e) {
        console.error('Export error:', e);
        showToast('❌ Lỗi khi sao lưu dữ liệu', 'error');
    }
}

function importDataInput() {
    document.getElementById('importFile').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const importObj = JSON.parse(content);

            // Validate basic structure
            if (!importObj.version || !importObj.data) {
                if (!confirm('⚠️ File không đúng định dạng chuẩn. Bạn có chắc chắn muốn thử khôi phục không?')) {
                    return;
                }
                // Attempt to restore raw data if it looks like a simple key-value object
                // (Fallback logic implied, but better to enforce structure)
            }

            const data = importObj.data || importObj; // Support both structures just in case

            if (confirm(`⚠️ CẢNH BÁO: Hành động này sẽ GHI ĐÈ dữ liệu hiện tại bằng dữ liệu từ file backup.\n\nBạn có chắc chắn muốn tiếp tục không?`)) {

                let count = 0;
                // Restore data
                for (const key in data) {
                    if (key.startsWith(BACKUP_PREFIX)) {
                        localStorage.setItem(key, data[key]);
                        count++;
                    }
                }

                showToast(`✅ Đã khôi phục thành công ${count} mục dữ liệu`);

                // Reload to apply changes after short delay
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }

        } catch (err) {
            console.error('Import error:', err);
            showToast('❌ Lỗi: File không hợp lệ', 'error');
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// ===== AUTO BACKUP MODULE (NEW) =====
const AUTO_BACKUP_KEY = 'netprint_auto_backups';
const MAX_AUTO_BACKUPS = 20;

function autoBackup() {
    try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(BACKUP_PREFIX) && key !== AUTO_BACKUP_KEY) {
                data[key] = localStorage.getItem(key);
            }
        }

        const snapshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: data
        };

        let backups = getAutoBackups();
        backups.unshift(snapshot); // Thêm vào đầu list

        // Giới hạn số lượng
        if (backups.length > MAX_AUTO_BACKUPS) {
            backups = backups.slice(0, MAX_AUTO_BACKUPS);
        }

        localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups));
        console.log('✅ Auto backup saved:', snapshot.timestamp);

        // Re-render danh sách nếu đang mở
        renderAutoBackupList();
    } catch (e) {
        console.error('Auto backup error:', e);
    }
}

function getAutoBackups() {
    try {
        const str = localStorage.getItem(AUTO_BACKUP_KEY);
        return str ? JSON.parse(str) : [];
    } catch (e) {
        return [];
    }
}

function restoreAutoBackup(id) {
    if (!confirm('⚠️ Bạn có chắc chắn muốn quay lại mốc thời gian này? Dữ liệu hiện tại sẽ bị thay thế.')) return;

    const backups = getAutoBackups();
    const snapshot = backups.find(b => b.id === id);

    if (!snapshot || !snapshot.data) {
        showToast('❌ Không tìm thấy dữ liệu backup', 'error');
        return;
    }

    try {
        // Restore data
        for (const key in snapshot.data) {
            localStorage.setItem(key, snapshot.data[key]);
        }

        showToast('✅ Đã khôi phục dữ liệu thành công!');
        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        console.error('Restore error:', e);
        showToast('❌ Lỗi khi khôi phục', 'error');
    }
}

function renderAutoBackupList() {
    const container = document.getElementById('autoBackupList');
    if (!container) return;

    const backups = getAutoBackups();
    if (backups.length === 0) {
        container.innerHTML = '<p style="color: #888; font-style: italic;">Chưa có bản lưu tự động nào.</p>';
        return;
    }

    container.innerHTML = backups.map(b => {
        const time = new Date(b.timestamp).toLocaleString('vi-VN');
        return `
            <div class="auto-backup-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div>
                    <span style="font-weight: bold; color: #333;">⏱️ ${time}</span>
                    <br>
                    <span style="font-size: 0.8em; color: #666;">${Object.keys(b.data).length} mục dữ liệu</span>
                </div>
                <button onclick="restoreAutoBackup(${b.id})" class="btn-restore-mini" style="padding: 4px 10px; font-size: 0.85rem; border-radius: 4px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
                    ↩️ Khôi phục
                </button>
            </div>
        `;
    }).join('');
}

// Add to settings UI
function renderBackupUI() {
    const container = document.getElementById('backupUIContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="card setting-card">
            <div class="setting-card-header">
                <h3>💾 Sao lưu & Khôi phục Dữ liệu</h3>
                <p>An toàn khi cập nhật phiên bản mới hoặc chuyển máy</p>
            </div>
            <div class="setting-card-body" style="padding: 20px;">
                <div class="backup-actions" style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div class="backup-item" style="flex: 1; min-width: 250px; background: #e3f2fd; padding: 15px; border-radius: 12px; border: 1px solid #bbdefb;">
                        <h4 style="color: #1565c0; margin-bottom: 10px;">📤 Sao lưu dữ liệu</h4>
                        <p style="font-size: 0.9rem; color: #555; margin-bottom: 15px;">Tải toàn bộ cài đặt (giá, khổ giấy, lịch sử...) về máy tính thành file .json.</p>
                        <button onclick="exportData()" class="btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>⬇️</span> Tải xuống bản sao lưu
                        </button>
                    </div>

                    <div class="backup-item" style="flex: 1; min-width: 250px; background: #ffebee; padding: 15px; border-radius: 12px; border: 1px solid #ffcdd2;">
                        <h4 style="color: #c62828; margin-bottom: 10px;">📥 Khôi phục dữ liệu</h4>
                        <p style="font-size: 0.9rem; color: #555; margin-bottom: 15px;">Khôi phục cài đặt từ file .json đã lưu. Cẩn thận: Dữ liệu hiện tại sẽ bị thay thế.</p>
                        <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleFileSelect(event)">
                        <button onclick="importDataInput()" class="btn-danger" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>⬆️</span> Chọn file để khôi phục
                        </button>
                    </div>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    <h4 style="margin-bottom: 15px; color: #444;">⏱️ Lịch sử Thay đổi (Tự động lưu)</h4>
                    <div id="autoBackupList" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; padding: 10px;">
                        Loading...
                    </div>
                    <p style="font-size: 0.8rem; color: #888; margin-top: 10px;">* Hệ thống tự động lưu lại 20 thay đổi gần nhất.</p>
                </div>
                
                <div class="backup-note" style="margin-top: 20px; font-size: 0.85rem; color: #666; font-style: italic;">
                    💡 Mẹo: Hãy sao lưu dữ liệu thường xuyên, đặc biệt là trước khi cập nhật tính năng mới.
                </div>
            </div>
        </div>
    `;

    // Render list immediately
    renderAutoBackupList();
}
