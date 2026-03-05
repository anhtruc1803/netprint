// Integration code for history feature

// Modify calculatePaper to save to history
const originalCalculatePaper = window.calculatePaper;
if (originalCalculatePaper) {
    window.calculatePaper = function () {
        // Call original function
        originalCalculatePaper();

        // Save to history after successful calculation
        try {
            // Get form values
            const prodW = parseFloat(document.getElementById('paperProdW')?.value) || 0;
            const prodH = parseFloat(document.getElementById('paperProdH')?.value) || 0;
            const qty = parseInt(document.getElementById('paperQty')?.value) || 0;
            const paperTypeId = parseInt(document.getElementById('paperType')?.value);
            const printId = parseInt(document.getElementById('paperPrintSides')?.value);
            const lamId = parseInt(document.getElementById('paperLamination')?.value);
            const custId = parseInt(document.getElementById('paperCustomerType')?.value);

            // Get selected processing
            const selectedProcs = Array.from(document.querySelectorAll('input[name="paperProc"]:checked'))
                .map(cb => parseInt(cb.value));

            // Get names from settings
            const paper = getPaperById(paperTypeId);
            const lam = PAPER_SETTINGS.laminations.find(l => l.id === lamId);
            const cust = PAPER_SETTINGS.customerTypes.find(c => c.id === custId);
            const printName = printId === 2 ? 'In 2 mặt' : 'In 1 mặt';

            const processingNames = selectedProcs
                .map(procId => PAPER_SETTINGS.processing.find(p => p.id === procId)?.name)
                .filter(Boolean);

            // Get calculation results from DOM
            const sellPrice = parseInt(document.getElementById('paperResSellPrice')?.textContent.replace(/[^0-9]/g, '')) || 0;
            const totalSell = parseInt(document.getElementById('paperResTotalSell')?.textContent.replace(/[^0-9]/g, '')) || 0;
            const sheets = parseInt(document.getElementById('paperResSheets')?.textContent) || 0;
            const yieldValue = parseInt(document.getElementById('paperYield')?.textContent) || 0;

            const quoteData = {
                // Product specs
                prodW: prodW,
                prodH: prodH,
                qty: qty,

                // Paper, Print, Lamination
                paperType: paper ? paper.name : 'N/A',
                printSides: printName,
                lamination: lam ? lam.name : 'Không cán',
                processing: processingNames,

                // Calculation results
                sheets: sheets,
                yield: yieldValue,
                sellPrice: sellPrice,
                totalSell: totalSell,

                // Customer
                customerType: cust ? cust.name : 'N/A'
            };

            savePaperQuoteToHistory(quoteData);
        } catch (e) {
            console.error('❌ Lỗi lưu lịch sử:', e);
        }
    };
}

// Auto-load history when switching to history tab
document.addEventListener('DOMContentLoaded', function () {
    // Load when clicking Lịch Sử Tính Giá tab
    const historyTabBtn = Array.from(document.querySelectorAll('.sub-tab'))
        .find(tab => tab.textContent.includes('Lịch Sử'));

    if (historyTabBtn) {
        historyTabBtn.addEventListener('click', function () {
            setTimeout(loadPaperHistory, 100);
        });
    }
});
