// ===== INIT LAMINATION PRICING - Chạy file này để khởi tạo dữ liệu mẫu =====

// Thêm đoạn code sau vào Console của trình duyệt (F12 → Console)
// hoặc thêm vào cuối file app.js tạm thời rồi xóa đi

// Khởi tạo laminationPricing nếu chưa có
if (!PAPER_SETTINGS.laminationPricing || PAPER_SETTINGS.laminationPricing.length === 0) {
    PAPER_SETTINGS.laminationPricing = [];

    // Duyệt qua tất cả các khổ giấy hiện có
    PAPER_SETTINGS.printSizes.forEach(size => {
        // Tạo pricing cho khổ giấy này
        PAPER_SETTINGS.laminationPricing.push({
            printSizeId: size.id,
            laminations: [
                {
                    id: Date.now() + Math.random(),
                    name: 'Không cán',
                    tiers: [
                        { max: 999999, price: 0, unit: 'per_sheet' }
                    ]
                },
                {
                    id: Date.now() + Math.random() + 1,
                    name: 'Cán bóng 1 mặt',
                    tiers: [
                        { max: 499, price: 600, unit: 'per_sheet' },
                        { max: 999999, price: 2500, unit: 'per_m2' }
                    ]
                },
                {
                    id: Date.now() + Math.random() + 2,
                    name: 'Cán bóng 2 mặt',
                    tiers: [
                        { max: 499, price: 1200, unit: 'per_sheet' },
                        { max: 999999, price: 5000, unit: 'per_m2' }
                    ]
                },
                {
                    id: Date.now() + Math.random() + 3,
                    name: 'Cán mờ 1 mặt',
                    tiers: [
                        { max: 499, price: 700, unit: 'per_sheet' },
                        { max: 999999, price: 2700, unit: 'per_m2' }
                    ]
                },
                {
                    id: Date.now() + Math.random() + 4,
                    name: 'Cán mờ 2 mặt',
                    tiers: [
                        { max: 499, price: 1400, unit: 'per_sheet' },
                        { max: 999999, price: 5400, unit: 'per_m2' }
                    ]
                }
            ]
        });
    });

    // Lưu lại
    localStorage.setItem('netprint_paper_settings', JSON.stringify(PAPER_SETTINGS));
    console.log('✅ Đã khởi tạo laminationPricing!');
    alert('✅ Đã khởi tạo dữ liệu mẫu cho cán màng! Hãy refresh lại trang.');
}
