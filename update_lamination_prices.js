// ===== CẬP NHẬT GIÁ CÁN MÀNG - Khổ 32.5x43 và 33x43 =====
// Chạy file này trong Console (F12 → Console) hoặc tích hợp vào app.js

/**
 * Bảng giá cán màng 1 mặt theo mốc số lượng (Giá vốn cán / tờ A3)
 * Khổ tiêu chuẩn: 32.5 x 43 cm (325 x 430 mm)
 * 
 * | Mốc số lượng | Giá 1 mặt | Giá 2 mặt (x2) |
 * |--------------|-----------|----------------|
 * | 1-20         | 2,000đ    | 4,000đ         |
 * | 21-50        | 1,500đ    | 3,000đ         |
 * | 51-100       | 1,200đ    | 2,400đ         |
 * | 101-300      | 1,000đ    | 2,000đ         |
 * | 301-500      | 850đ      | 1,700đ         |
 * | 501-1,000    | 750đ      | 1,500đ         |
 * | > 1,000      | 700đ      | 1,400đ         |
 */

function updateLaminationPricesForA3() {
    // Định nghĩa bảng giá cán màng 1 mặt (giá gốc)
    const LAMINATION_TIERS_ONE_SIDED = [
        { min: 1, max: 20, price: 2000, unit: 'per_sheet' },
        { min: 21, max: 50, price: 1500, unit: 'per_sheet' },
        { min: 51, max: 100, price: 1200, unit: 'per_sheet' },
        { min: 101, max: 300, price: 1000, unit: 'per_sheet' },
        { min: 301, max: 500, price: 850, unit: 'per_sheet' },
        { min: 501, max: 1000, price: 750, unit: 'per_sheet' },
        { min: 1001, max: 999999, price: 700, unit: 'per_sheet' }  // > 1000
    ];

    // Tự động tính giá 2 mặt = 1 mặt x 2
    const LAMINATION_TIERS_TWO_SIDED = LAMINATION_TIERS_ONE_SIDED.map(tier => ({
        min: tier.min,
        max: tier.max,
        price: tier.price * 2,  // ✨ CÔNG THỨC: 2 mặt = 1 mặt x 2
        unit: tier.unit
    }));

    // Tìm khổ giấy 32.5x43 (325x430mm) và 33x43 (330x430mm)
    const targetSizes = PAPER_SETTINGS.printSizes.filter(size =>
        (Math.abs(size.w - 325) < 5 && Math.abs(size.h - 430) < 5) ||  // 32.5 x 43
        (Math.abs(size.w - 330) < 5 && Math.abs(size.h - 430) < 5)     // 33 x 43
    );

    if (targetSizes.length === 0) {
        console.warn('⚠️ Không tìm thấy khổ giấy 32.5x43 hoặc 33x43!');
        return;
    }

    console.log(`📋 Tìm thấy ${targetSizes.length} khổ giấy cần cập nhật:`, targetSizes.map(s => `${s.w}x${s.h}mm`));

    // Đảm bảo laminationPricing tồn tại
    if (!PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = [];
    }

    // Cập nhật giá cho từng khổ giấy
    targetSizes.forEach(size => {
        // Tìm hoặc tạo pricing cho khổ này
        let pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === size.id);

        if (!pricing) {
            pricing = { printSizeId: size.id, laminations: [] };
            PAPER_SETTINGS.laminationPricing.push(pricing);
        }

        // Tạo ID base unique
        const baseId = Date.now() + size.id * 1000;

        // Cập nhật hoặc thêm mới các loại cán màng
        const laminationTypes = [
            {
                name: 'Không cán',
                tiers: [{ min: 1, max: 999999, price: 0, unit: 'per_sheet' }]
            },
            {
                name: 'Cán bóng 1 mặt',
                tiers: JSON.parse(JSON.stringify(LAMINATION_TIERS_ONE_SIDED))
            },
            {
                name: 'Cán bóng 2 mặt',
                tiers: JSON.parse(JSON.stringify(LAMINATION_TIERS_TWO_SIDED))
            },
            {
                name: 'Cán mờ 1 mặt',
                tiers: JSON.parse(JSON.stringify(LAMINATION_TIERS_ONE_SIDED))
            },
            {
                name: 'Cán mờ 2 mặt',
                tiers: JSON.parse(JSON.stringify(LAMINATION_TIERS_TWO_SIDED))
            }
        ];

        // Xóa laminations cũ và thêm mới
        pricing.laminations = laminationTypes.map((lamType, index) => {
            // Tìm xem đã có loại này chưa
            const existing = pricing.laminations.find(l => l.name === lamType.name);
            return {
                id: existing ? existing.id : (baseId + index + Math.random()),
                name: lamType.name,
                tiers: lamType.tiers
            };
        });

        console.log(`✅ Đã cập nhật giá cán màng cho khổ ${size.w}x${size.h}mm`);
    });

    // Lưu lại
    savePaperSettings();

    // Re-render nếu đang mở tab cán màng
    if (typeof renderLaminationSettings === 'function') {
        renderLaminationSettings();
    }

    console.log('🎉 Hoàn tất cập nhật bảng giá cán màng!');
    console.table([
        { 'Mốc số lượng': '1-20', 'Giá 1 mặt': '2,000đ', 'Giá 2 mặt': '4,000đ' },
        { 'Mốc số lượng': '21-50', 'Giá 1 mặt': '1,500đ', 'Giá 2 mặt': '3,000đ' },
        { 'Mốc số lượng': '51-100', 'Giá 1 mặt': '1,200đ', 'Giá 2 mặt': '2,400đ' },
        { 'Mốc số lượng': '101-300', 'Giá 1 mặt': '1,000đ', 'Giá 2 mặt': '2,000đ' },
        { 'Mốc số lượng': '301-500', 'Giá 1 mặt': '850đ', 'Giá 2 mặt': '1,700đ' },
        { 'Mốc số lượng': '501-1,000', 'Giá 1 mặt': '750đ', 'Giá 2 mặt': '1,500đ' },
        { 'Mốc số lượng': '> 1,000', 'Giá 1 mặt': '700đ', 'Giá 2 mặt': '1,400đ' }
    ]);

    if (typeof showToast === 'function') {
        showToast('✅ Đã cập nhật bảng giá cán màng!');
    }
}

// Tự động chạy khi load
updateLaminationPricesForA3();
