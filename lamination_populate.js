// ===== POPULATE LAMINATION DROPDOWN =====
// Populate dropdown cán màng dựa trên khổ giấy đã chọn

/**
 * Populate lamination dropdown based on selected paper size
 * Gọi function này khi:
 * - User chọn khổ giấy
 * - Load trang lần đầu
 */
function populateLaminationDropdown() {
    const sizeSelect = document.getElementById('paperSize');
    const laminationSelect = document.getElementById('paperLamination');

    if (!sizeSelect || !laminationSelect) return;

    const selectedSizeId = parseInt(sizeSelect.value);
    if (!selectedSizeId) {
        laminationSelect.innerHTML = '<option value="">Chọn khổ giấy trước</option>';
        return;
    }

    // Lưu giá trị đang chọn
    const savedLamId = laminationSelect.value;

    // Lấy danh sách cán màng cho khổ giấy này
    const laminations = getLaminationsBySize(selectedSizeId);

    if (laminations.length === 0) {
        laminationSelect.innerHTML = '<option value="">Chưa có loại cán màng</option>';
        return;
    }

    // Populate dropdown
    laminationSelect.innerHTML = laminations.map(lam =>
        `<option value="${lam.id}">${lam.name}</option>`
    ).join('');

    // Khôi phục giá trị đã chọn (nếu có)
    if (savedLamId && laminations.find(l => l.id === parseInt(savedLamId))) {
        laminationSelect.value = savedLamId;
    }
}
