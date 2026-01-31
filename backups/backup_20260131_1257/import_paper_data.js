// ===== IMPORT BẢNG GIÁ GIẤY - IN NHANH =====
// Script để import toàn bộ bảng giá giấy vào PAPER_SETTINGS

function importPaperPriceData() {
    // Reset data
    PAPER_SETTINGS.printSizes = [];
    PAPER_SETTINGS.paperPricing = [];

    // ===== KHỔ GIẤY 32.5 x 43 cm (325 x 430 mm) =====
    const sizeId1 = 1;
    PAPER_SETTINGS.printSizes.push({
        id: sizeId1,
        w: 325,
        h: 430,
        name: '325 x 430 mm'
    });

    const papers1 = [
        // Couche
        { id: 1, name: 'C120', tiers: [{ max: 999999, price: 600 }] },
        { id: 2, name: 'C150', tiers: [{ max: 999999, price: 700 }] },
        { id: 3, name: 'C200', tiers: [{ max: 999999, price: 1000 }] },
        { id: 4, name: 'C250', tiers: [{ max: 999999, price: 1400 }] },
        { id: 5, name: 'C300', tiers: [{ max: 999999, price: 1700 }] },

        // Ivory
        { id: 6, name: 'I 250', tiers: [{ max: 999999, price: 1150 }] },
        { id: 7, name: 'I 300', tiers: [{ max: 999999, price: 1550 }] },

        // Ford/FO
        { id: 8, name: 'FO 80', tiers: [{ max: 999999, price: 380 }] },
        { id: 9, name: 'FO 100', tiers: [{ max: 999999, price: 420 }] },
        { id: 10, name: 'FO 120', tiers: [{ max: 999999, price: 600 }] },
        { id: 11, name: 'FO 150', tiers: [{ max: 999999, price: 900 }] },
        { id: 12, name: 'FO 250', tiers: [{ max: 999999, price: 1800 }] },
        { id: 13, name: 'FO 300', tiers: [{ max: 999999, price: 2200 }] },

        // Duplex
        { id: 14, name: 'D 300', tiers: [{ max: 999999, price: 1300 }] },

        // Kraft
        { id: 15, name: 'Kraft trắng 100', tiers: [{ max: 999999, price: 1000 }] },
        { id: 16, name: 'Kraft trắng 150', tiers: [{ max: 999999, price: 1500 }] },
        { id: 17, name: 'Kraft trắng 250 - NGA', tiers: [{ max: 999999, price: 2400 }] },

        // Bristol
        { id: 18, name: 'B300', tiers: [{ max: 999999, price: 2500 }] },

        // Giấy mỹ thuật trắng trơn
        { id: 19, name: 'Econo White 120', tiers: [{ max: 999999, price: 2000 }] },
        { id: 20, name: 'Econo White 150', tiers: [{ max: 999999, price: 2500 }] },
        { id: 21, name: 'Econo White 190', tiers: [{ max: 999999, price: 3000 }] },
        { id: 22, name: 'Econo White 250', tiers: [{ max: 999999, price: 4000 }] },
        { id: 23, name: 'Econo White 300', tiers: [{ max: 999999, price: 5000 }] },

        // Giấy mỹ thuật có vân
        { id: 24, name: 'Eco perform super fine linen (25) super white - 180 gsm', tiers: [{ max: 999999, price: 4000 }] },
        { id: 25, name: 'Eco perform super fine linen (25) super white - 240 gsm', tiers: [{ max: 999999, price: 5000 }] }
    ];

    PAPER_SETTINGS.paperPricing.push({
        printSizeId: sizeId1,
        papers: papers1
    });

    // ===== KHỔ GIẤY 32 x 42 cm (320 x 420 mm) - CHO DECAL =====
    const sizeId2 = 2;
    PAPER_SETTINGS.printSizes.push({
        id: sizeId2,
        w: 320,
        h: 420,
        name: '320 x 420 mm'
    });

    const papers2 = [
        { id: 26, name: 'Decal da bò (kraft)', tiers: [{ max: 999999, price: 3100 }] }
    ];

    PAPER_SETTINGS.paperPricing.push({
        printSizeId: sizeId2,
        papers: papers2
    });

    // ===== KHỔ GIẤY 33 x 43 cm (330 x 430 mm) - CHO DECAL =====
    const sizeId3 = 3;
    PAPER_SETTINGS.printSizes.push({
        id: sizeId3,
        w: 330,
        h: 430,
        name: '330 x 430 mm'
    });

    const papers3 = [
        // Decal bế
        { id: 27, name: 'Decal bế (tính lẻ)', tiers: [{ max: 999999, price: 20000 }] },
        { id: 28, name: 'Decal bế', tiers: [{ max: 999999, price: 12000 }] },

        // Decal khác
        { id: 29, name: 'Decal giấy', tiers: [{ max: 999999, price: 2500 }] },
        { id: 30, name: 'Decal nhựa sữa', tiers: [{ max: 999999, price: 3500 }] },
        { id: 31, name: 'Decal nhựa trong', tiers: [{ max: 999999, price: 3500 }] },
        { id: 32, name: 'Decal si bạc', tiers: [{ max: 999999, price: 4000 }] },
        { id: 33, name: 'Decal 7 màu', tiers: [{ max: 999999, price: 4500 }] }
    ];

    PAPER_SETTINGS.paperPricing.push({
        printSizeId: sizeId3,
        papers: papers3
    });

    // Lưu vào localStorage
    savePaperSettings();

    // Cập nhật dropdown
    if (typeof populatePaperSizeDropdown === 'function') {
        populatePaperSizeDropdown();
    }

    // Re-render giao diện
    if (typeof renderPaperPricingSettings === 'function') {
        renderPaperPricingSettings();
    }

    alert('✅ Đã import thành công ' + PAPER_SETTINGS.printSizes.length + ' khổ giấy với ' +
        (papers1.length + papers2.length + papers3.length) + ' loại giấy!');
}

// Tự động chạy khi load trang (chỉ chạy 1 lần nếu chưa import)
document.addEventListener('DOMContentLoaded', function () {
    // Kiểm tra xem đã import bảng giá chưa
    const imported = localStorage.getItem('paper_price_imported');

    // Nếu chưa import, tự động import
    if (!imported) {
        console.log('📊 Đang import bảng giá giấy lần đầu...');
        setTimeout(() => {
            importPaperPriceData();
            localStorage.setItem('paper_price_imported', 'true');
        }, 500);
    } else {
        console.log('✅ Bảng giá đã được import trước đó');
    }
});
