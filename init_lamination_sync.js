// ===== SCRIPT KHỞI TẠO CÁN MÀNG CHO CÁC KHỔ GIẤY HIỆN CÓ =====
// Chạy script này 1 lần để đồng bộ dữ liệu cán màng cho tất cả khổ giấy đã có

(function initLaminationForExistingPaperSizes() {
    console.log('🚀 Bắt đầu khởi tạo cán màng...');

    if (!PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = [];
    }

    let addedCount = 0;
    let skippedCount = 0;

    // Duyệt qua tất cả khổ giấy
    PAPER_SETTINGS.printSizes.forEach(size => {
        // Kiểm tra xem khổ này đã có lamination pricing chưa
        const existing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === size.id);

        if (existing) {
            console.log(`⏭️ Bỏ qua khổ ${size.w}×${size.h}mm - Đã có dữ liệu cán màng`);
            skippedCount++;
            return;
        }

        // Tạo ID mới cho laminations
        const existingLamIds = PAPER_SETTINGS.laminationPricing
            .flatMap(p => p.laminations || [])
            .map(l => l.id);

        const newLamId = existingLamIds.length > 0
            ? Math.max(...existingLamIds) + 1
            : 1;

        // Tạo 5 loại cán màng mặc định
        PAPER_SETTINGS.laminationPricing.push({
            printSizeId: size.id,
            laminations: [
                {
                    id: newLamId,
                    name: 'Không cán',
                    tiers: [{ max: 999999, price: 0, unit: 'per_sheet' }]
                },
                {
                    id: newLamId + 1,
                    name: 'Cán bóng 1 mặt',
                    tiers: [
                        { max: 100, price: 800, unit: 'per_sheet' },
                        { max: 300, price: 700, unit: 'per_sheet' },
                        { max: 500, price: 600, unit: 'per_sheet' },
                        { max: 999999, price: 2500, unit: 'per_m2' }
                    ]
                },
                {
                    id: newLamId + 2,
                    name: 'Cán bóng 2 mặt',
                    tiers: [
                        { max: 100, price: 1600, unit: 'per_sheet' },
                        { max: 300, price: 1400, unit: 'per_sheet' },
                        { max: 500, price: 1200, unit: 'per_sheet' },
                        { max: 999999, price: 5000, unit: 'per_m2' }
                    ]
                },
                {
                    id: newLamId + 3,
                    name: 'Cán mờ 1 mặt',
                    tiers: [
                        { max: 100, price: 900, unit: 'per_sheet' },
                        { max: 300, price: 800, unit: 'per_sheet' },
                        { max: 500, price: 700, unit: 'per_sheet' },
                        { max: 999999, price: 2700, unit: 'per_m2' }
                    ]
                },
                {
                    id: newLamId + 4,
                    name: 'Cán mờ 2 mặt',
                    tiers: [
                        { max: 100, price: 1800, unit: 'per_sheet' },
                        { max: 300, price: 1600, unit: 'per_sheet' },
                        { max: 500, price: 1400, unit: 'per_sheet' },
                        { max: 999999, price: 5400, unit: 'per_m2' }
                    ]
                }
            ]
        });

        console.log(`✅ Đã tạo cán màng cho khổ ${size.w}×${size.h}mm (ID: ${newLamId} - ${newLamId + 4})`);
        addedCount++;
    });

    // Lưu vào localStorage
    savePaperSettings();

    console.log('\n📊 Kết quả:');
    console.log(`   ✅ Đã thêm: ${addedCount} khổ giấy`);
    console.log(`   ⏭️ Bỏ qua: ${skippedCount} khổ giấy (đã có dữ liệu)`);
    console.log(`   💾 Đã lưu vào localStorage`);
    console.log('\n🎉 Hoàn thành! Hãy refresh lại trang.');

    alert(`✅ Đã khởi tạo cán màng cho ${addedCount} khổ giấy!\n\nHãy refresh lại trang để áp dụng.`);
})();
