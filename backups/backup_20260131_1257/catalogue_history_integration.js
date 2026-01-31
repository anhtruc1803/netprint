// ===== INTEGRATION CODE FOR CATALOGUE HISTORY =====
// Hook vào calculateCatPrice để tự động lưu lịch sử

const originalCalculateCatPrice = window.calculateCatPrice;
if (originalCalculateCatPrice) {
    window.calculateCatPrice = function () {
        // Call original function
        originalCalculateCatPrice();

        // Save to history after successful calculation
        try {
            // Get form values
            const catSizeSelect = document.getElementById('catSize');
            const catSizeOption = catSizeSelect?.options[catSizeSelect.selectedIndex];
            const catSizeName = catSizeOption?.text || 'Tùy chọn';

            const catW = parseFloat(document.getElementById('catW')?.value) || 0;
            const catH = parseFloat(document.getElementById('catH')?.value) || 0;
            const catSize = catSizeSelect?.value === 'custom'
                ? `${catW}×${catH}mm`
                : catSizeName;

            const totalPages = parseInt(document.getElementById('catPages')?.value) || 16;
            const qty = parseInt(document.getElementById('catQty')?.value) || 100;

            // Binding type
            const bindingSelect = document.getElementById('catBindingType');
            const bindingType = bindingSelect?.options[bindingSelect.selectedIndex]?.text || 'N/A';

            // Cover paper
            const coverPaperSelect = document.getElementById('catCoverPaperType');
            const coverPaper = coverPaperSelect?.options[coverPaperSelect.selectedIndex]?.text || 'N/A';

            // Inner paper
            const innerPaperSelect = document.getElementById('catInnerPaperType');
            const innerPaper = innerPaperSelect?.options[innerPaperSelect.selectedIndex]?.text || 'N/A';

            // Customer type
            const custSelect = document.getElementById('catCustomerType');
            const customerType = custSelect?.options[custSelect.selectedIndex]?.text || 'N/A';

            // Cover lamination
            const coverLamSelect = document.getElementById('catCoverLamination');
            const coverLam = coverLamSelect?.options[coverLamSelect.selectedIndex]?.text || 'Không cán';

            // Inner lamination
            const innerLamSelect = document.getElementById('catInnerLamination');
            const innerLam = innerLamSelect?.options[innerLamSelect.selectedIndex]?.text || 'Không cán';

            // Get calculation results from DOM
            const grandTotalEl = document.getElementById('catGrandTotal');
            const grandTotal = parseInt(grandTotalEl?.textContent?.replace(/[^0-9]/g, '')) || 0;

            // Calculate price per item
            const sellPrice = qty > 0 ? Math.round(grandTotal / qty) : 0;

            // Cover and inner sheets
            const coverSheets = parseInt(document.getElementById('catTotalCoverSheets')?.textContent?.replace(/[^0-9]/g, '')) || 0;
            const innerSheets = parseInt(document.getElementById('catTotalInnerSheets')?.textContent?.replace(/[^0-9]/g, '')) || 0;

            const quoteData = {
                // Catalogue specs
                catSize: catSize,
                catW: catW,
                catH: catH,
                totalPages: totalPages,
                qty: qty,

                // Binding
                bindingType: bindingType,

                // Papers
                coverPaper: coverPaper,
                innerPaper: innerPaper,

                // Lamination
                coverLam: coverLam,
                innerLam: innerLam,

                // Sheets
                coverSheets: coverSheets,
                innerSheets: innerSheets,

                // Calculation results
                sellPrice: sellPrice,
                totalSell: grandTotal,

                // Customer
                customerType: customerType
            };

            saveCatQuoteToHistory(quoteData);
        } catch (e) {
            console.error('❌ Lỗi lưu lịch sử Catalogue:', e);
        }
    };
}

// Auto-load history when switching to history tab
document.addEventListener('DOMContentLoaded', function () {
    // Load when clicking Lịch Sử tab in Catalogue
    const historyTabBtn = document.querySelector('#catalogue-calculator .sub-tab[onclick*="cat-history"]');

    if (historyTabBtn) {
        historyTabBtn.addEventListener('click', function () {
            setTimeout(loadCatHistory, 100);
        });
    }

    // Alternative: listen for all sub-tabs with Lịch Sử text in Catalogue section
    const catSubTabs = document.querySelectorAll('#catalogue-calculator .sub-tab');
    catSubTabs.forEach(tab => {
        if (tab.textContent.includes('Lịch Sử')) {
            tab.addEventListener('click', function () {
                setTimeout(loadCatHistory, 100);
            });
        }
    });
});
