// ===== HELPER FUNCTIONS - CẤU TRÚC MỚI =====

/**
 * Format kích thước giấy (mm), bỏ số thập phân .0 nếu là số nguyên
 * Ví dụ: 325 → "325", 430 → "430", 330 → "330"
 */
function formatSizeValue(mm) {
    if (mm === null || mm === undefined) return '0';
    return mm % 1 === 0 ? mm.toFixed(0) : mm.toString();
}

// Alias cũ để backward-compatible
function formatMmToCm(mm) {
    return formatSizeValue(mm);
}

/**
 * Format tên khổ giấy chuẩn: "Khổ (W × H) mm"
 * @param {Object} size - { w: mm, h: mm }
 * @returns {string} ví dụ: "Khổ (325 × 430) mm"
 */
function formatSizeName(size) {
    return `Khổ (${formatSizeValue(size.w)} × ${formatSizeValue(size.h)}) mm`;
}

/**
 * Format tên ngắn (không có "Khổ"): "325 × 430 mm"
 */
function formatSizeShort(size) {
    return `${formatSizeValue(size.w)} × ${formatSizeValue(size.h)} mm`;
}

/**
 * Lấy tất cả loại giấy từ cấu trúc mới (flatten từ printSizes + paperPricing)
 * Trả về array với format: { id, name, w, h, printSizeId, tiers }
 */
function getAllPapers() {
    const allPapers = [];

    PAPER_SETTINGS.paperPricing.forEach(pricing => {
        const size = PAPER_SETTINGS.printSizes.find(s => s.id === pricing.printSizeId);
        if (!size) return;

        pricing.papers.forEach(paper => {
            allPapers.push({
                id: paper.id,
                name: paper.name,
                w: size.w,
                h: size.h,
                printSizeId: size.id,
                tiers: paper.tiers || []
            });
        });
    });

    return allPapers;
}

/**
 * Lấy danh sách loại giấy unique (theo tên) - chỉ trả về 1 paper cho mỗi tên
 * Trả về array với format: { id, name, ... } - id là ID đầu tiên tìm thấy
 */
function getUniquePaperNames() {
    const allPapers = getAllPapers();
    const uniquePapers = [];
    const seenNames = new Map(); // Dùng Map để lưu normalized name -> paper

    allPapers.forEach(paper => {
        // Normalize tên: lowercase, trim, loại bỏ khoảng trắng thừa
        // Loại bỏ tất cả khoảng trắng thừa và normalize unicode
        let normalizedName = (paper.name || '').toLowerCase().trim();
        // Loại bỏ multiple spaces
        normalizedName = normalizedName.replace(/\s+/g, ' ');
        // Normalize unicode (chữ có dấu)
        normalizedName = normalizedName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');

        if (normalizedName && !seenNames.has(normalizedName)) {
            seenNames.set(normalizedName, paper);
        }
    });

    // Convert Map values to array
    seenNames.forEach((paper, normalizedName) => {
        uniquePapers.push({
            ...paper,
            name: paper.name // Giữ nguyên tên gốc (chưa capitalize)
        });
    });

    // Debug: Log để kiểm tra
    console.log('📋 getUniquePaperNames - Total papers:', allPapers.length, 'Unique:', uniquePapers.length);

    // Kiểm tra Decal nhựa sữa
    const allDecalNhuaSua = allPapers.filter(p => {
        const name = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
        return name.includes('decal') && name.includes('nhua') && name.includes('sua');
    });
    if (allDecalNhuaSua.length > 0) {
        console.log('🔍 All "Decal nhựa sữa" entries:', allDecalNhuaSua.map(p => `"${p.name}" (id: ${p.id})`));
    }

    const uniqueDecalNhuaSua = uniquePapers.filter(p => {
        const name = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
        return name.includes('decal') && name.includes('nhua') && name.includes('sua');
    });
    console.log('✅ Unique "Decal nhựa sữa" entries:', uniqueDecalNhuaSua.length);

    return uniquePapers;
}

/**
 * Tìm loại giấy theo ID
 */
function getPaperById(paperId) {
    for (const pricing of PAPER_SETTINGS.paperPricing) {
        const paper = pricing.papers.find(p => p.id === paperId);
        if (paper) {
            const size = PAPER_SETTINGS.printSizes.find(s => s.id === pricing.printSizeId);
            return {
                ...paper,
                w: size.w,
                h: size.h,
                printSizeId: size.id
            };
        }
    }
    return null;
}

/**
 * Tính giá giấy theo số lượng tờ (dùng tiers)
 * Logic: Tìm tier đầu tiên mà sheets <= tier.max
 * Min được tính tự động: tier[0].min = 1, tier[i].min = tier[i-1].max + 1
 */
function getPaperPrice(paperId, sheets) {
    const paper = getPaperById(paperId);
    if (!paper || !paper.tiers || paper.tiers.length === 0) return 0;

    // Sắp xếp tiers theo max tăng dần để đảm bảo logic đúng
    const sortedTiers = [...paper.tiers].sort((a, b) => a.max - b.max);

    // Tìm tier phù hợp: tier đầu tiên mà sheets <= tier.max
    for (const tier of sortedTiers) {
        if (sheets <= tier.max) {
            return tier.price;
        }
    }

    // Fallback: tier cuối cùng (có max lớn nhất)
    return sortedTiers[sortedTiers.length - 1].price;
}

/**
 * Migration helper: Chuyển đổi từ paperTypes cũ sang cấu trúc mới
 * Dùng khi load settings từ localStorage (nếu còn dùng cấu trúc cũ)
 */
function migratePaperTypesToNewStructure(oldPaperTypes) {
    // Group theo khổ giấy
    const sizeGroups = {};

    oldPaperTypes.forEach(paper => {
        const sizeKey = `${paper.w}x${paper.h}`;
        if (!sizeGroups[sizeKey]) {
            sizeGroups[sizeKey] = {
                w: paper.w,
                h: paper.h,
                papers: []
            };
        }

        // Convert price thành tiers
        sizeGroups[sizeKey].papers.push({
            id: paper.id,
            name: paper.name,
            tiers: [
                { max: 100, price: Math.round(paper.price * 1.15) },
                { max: 500, price: Math.round(paper.price * 1.05) },
                { max: 999999, price: paper.price }
            ]
        });
    });

    // Tạo printSizes và paperPricing
    const printSizes = [];
    const paperPricing = [];
    let sizeId = 1;

    Object.values(sizeGroups).forEach(group => {
        printSizes.push({
            id: sizeId,
            w: group.w,
            h: group.h,
            name: formatSizeName({ w: group.w, h: group.h })
        });

        paperPricing.push({
            printSizeId: sizeId,
            papers: group.papers
        });

        sizeId++;
    });

    return { printSizes, paperPricing };
}

/**
 * Lấy danh sách loại giấy theo printSizeId
 */
function getPapersBySize(printSizeId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === parseInt(printSizeId));
    if (!pricing) return [];

    const size = PAPER_SETTINGS.printSizes.find(s => s.id === parseInt(printSizeId));
    if (!size) return [];

    return pricing.papers.map(paper => ({
        ...paper,
        w: size.w,
        h: size.h,
        printSizeId: size.id
    }));
}

/**
 * Lấy tất cả khổ in của một loại giấy (theo tên)
 * Trả về array: [{ paperId, printSizeId, sizeName, w, h, tiers }]
 */
function getPaperSizesByName(paperName) {
    const results = [];

    PAPER_SETTINGS.paperPricing.forEach(pricing => {
        const size = PAPER_SETTINGS.printSizes.find(s => s.id === pricing.printSizeId);
        if (!size) return;

        pricing.papers.forEach(paper => {
            if (paper.name.toLowerCase() === paperName.toLowerCase()) {
                results.push({
                    paperId: paper.id,
                    printSizeId: size.id,
                    sizeName: size.name,
                    w: size.w,
                    h: size.h,
                    tiers: paper.tiers || []
                });
            }
        });
    });

    return results;
}

/**
 * Lấy tất cả khổ in của một loại giấy (theo ID - cho trường hợp cùng tên)
 * Trả về array: [{ paperId, printSizeId, sizeName, ... }]
 */
function getPaperSizesByPaperId(paperId) {
    const paper = getPaperById(paperId);
    if (!paper) return [];

    // Tìm tất cả các khổ in có cùng tên loại giấy
    return getPaperSizesByName(paper.name);
}

/**
 * Event handler khi chọn loại giấy - chỉ cập nhật preview
 * Không filter khổ in (vì khổ in đã được chọn trước)
 */
function onPaperTypeChange() {
    // Chỉ cập nhật preview, không cần filter khổ in
    // Khổ in đã được chọn trước, loại giấy chỉ được filter theo khổ in đó

    // Cập nhật preview
    if (typeof updatePaperPreview === 'function') {
        updatePaperPreview();
    }
}

/**
 * Event handler khi chọn khổ giấy - filter loại giấy theo khổ in
 */
function onPaperSizeChange() {
    const sizeSelect = document.getElementById('paperSize');
    const paperTypeSelect = document.getElementById('paperType');
    const paperTypeSearch = document.getElementById('paperTypeSearch');

    if (!sizeSelect) return;

    const selectedSizeId = parseInt(sizeSelect.value);
    if (!selectedSizeId) return;

    // Lấy danh sách loại giấy của khổ in đã chọn
    const availablePapers = getPapersBySize(selectedSizeId);

    // Re-populate dropdown loại giấy với danh sách khả dụng (unique theo tên)
    if (paperTypeSelect) {
        const currentPaperId = parseInt(paperTypeSelect.value);

        // Tạo danh sách unique papers (theo tên)
        const uniqueAvailablePapers = [];
        const seenNames = new Set();
        availablePapers.forEach(p => {
            const normalizedName = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
            if (normalizedName && !seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueAvailablePapers.push({
                    ...p,
                    name: capitalizeWords(p.name)
                });
            }
        });

        // Re-populate dropdown
        paperTypeSelect.innerHTML = uniqueAvailablePapers.map(p =>
            `<option value="${p.id}">${p.name}</option>`
        ).join('');

        // Cập nhật allOptions cho search
        paperTypeSelect.dataset.allOptions = JSON.stringify(uniqueAvailablePapers);

        // Chọn loại giấy
        const availablePaperIds = uniqueAvailablePapers.map(p => p.id);
        if (availablePaperIds.includes(currentPaperId)) {
            // Giữ loại giấy hiện tại nếu khả dụng
            paperTypeSelect.value = currentPaperId;
            if (paperTypeSearch) {
                const selectedPaper = uniqueAvailablePapers.find(p => p.id === currentPaperId);
                if (selectedPaper) {
                    paperTypeSearch.value = selectedPaper.name;
                }
            }
        } else if (uniqueAvailablePapers.length > 0) {
            // Chọn loại giấy đầu tiên nếu loại giấy hiện tại không khả dụng
            paperTypeSelect.value = uniqueAvailablePapers[0].id;
            if (paperTypeSearch) {
                paperTypeSearch.value = uniqueAvailablePapers[0].name;
            }
        }
    }

    // Cập nhật dropdown cán màng theo khổ giấy mới
    if (typeof populateLaminationDropdown === 'function') {
        populateLaminationDropdown();
    }

    // Cập nhật preview
    if (typeof updatePaperPreview === 'function') {
        updatePaperPreview();
    }
}

/**
 * Populate dropdown khổ giấy
 */
function populatePaperSizeDropdown() {
    const sizeSelect = document.getElementById('paperSize');
    if (!sizeSelect) return;

    // Lưu giá trị đang chọn
    const savedSize = sizeSelect.value;

    // Populate dropdown - dùng formatSizeName cho hiển thị đẹp
    sizeSelect.innerHTML = PAPER_SETTINGS.printSizes.map(size =>
        `<option value="${size.id}">${formatSizeName(size)}</option>`
    ).join('');

    // Khôi phục giá trị hoặc chọn mặc định (325 x 430 mm)
    if (savedSize && PAPER_SETTINGS.printSizes.find(s => s.id === parseInt(savedSize))) {
        sizeSelect.value = savedSize;
    } else {
        // Tìm khổ 325 x 430 mm (mặc định)
        const defaultSize = PAPER_SETTINGS.printSizes.find(s =>
            (s.w === 325 && s.h === 430) || s.name === '325 x 430 mm'
        );
        if (defaultSize) {
            sizeSelect.value = defaultSize.id;
        } else if (PAPER_SETTINGS.printSizes.length > 0) {
            // Fallback: chọn khổ đầu tiên
            sizeSelect.value = PAPER_SETTINGS.printSizes[0].id;
        }
    }

    // Trigger change để filter loại giấy theo khổ in mặc định
    onPaperSizeChange();
}

// ===== CUSTOM PRICE - Nhập giá tay =====

/**
 * Toggle bật/tắt chế độ nhập giá tay
 */
function toggleCustomPrice() {
    const btn = document.getElementById('btnCustomPriceToggle');
    const customPriceInput = document.getElementById('customPriceInput');
    const paperTypeSearch = document.getElementById('paperTypeSearch');
    const paperTypeSelect = document.getElementById('paperType');

    if (!btn || !customPriceInput) return;

    const isActive = btn.classList.toggle('active');
    customPriceInput.style.display = isActive ? 'block' : 'none';

    // Khi bật toggle: cho phép nhập tên loại giấy tuỳ ý
    if (isActive) {
        // Lưu giá trị cũ để restore khi tắt
        if (paperTypeSearch && !paperTypeSearch.dataset.originalValue) {
            paperTypeSearch.dataset.originalValue = paperTypeSearch.value;
        }

        // Cho phép nhập tên tuỳ ý - thay placeholder
        if (paperTypeSearch) {
            paperTypeSearch.placeholder = '✍️ Nhập tên loại giấy...';
            paperTypeSearch.value = ''; // Xoá để nhập mới
            paperTypeSearch.style.borderColor = '#ff9800';
            paperTypeSearch.style.background = 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
        }

        // Ẩn dropdown select
        if (paperTypeSelect) {
            paperTypeSelect.style.display = 'none';
        }

        // Focus vào ô nhập giá
        const priceInput = document.getElementById('paperCustomPrice');
        if (priceInput) {
            priceInput.focus();
            priceInput.select();
        }
    } else {
        // Khi tắt toggle: quay về chức năng tìm kiếm bình thường
        if (paperTypeSearch) {
            paperTypeSearch.placeholder = '🔍 Tìm kiếm loại giấy...';
            // Restore giá trị cũ nếu có
            if (paperTypeSearch.dataset.originalValue) {
                paperTypeSearch.value = paperTypeSearch.dataset.originalValue;
                delete paperTypeSearch.dataset.originalValue;
            }
            paperTypeSearch.style.borderColor = '';
            paperTypeSearch.style.background = '';
        }

        // Hiện lại dropdown select
        if (paperTypeSelect) {
            paperTypeSelect.style.display = '';
        }
    }

    // Cập nhật preview
    if (typeof updatePaperPreview === 'function') {
        updatePaperPreview();
    }
}

/**
 * Kiểm tra xem chế độ nhập giá tay có đang bật không
 */
function isCustomPriceEnabled() {
    const btn = document.getElementById('btnCustomPriceToggle');
    return btn && btn.classList.contains('active');
}

/**
 * Lấy giá tuỳ chỉnh từ input (nếu đang bật chế độ nhập giá tay)
 */
function getCustomPaperPrice() {
    if (!isCustomPriceEnabled()) return null;

    const customPriceInputEl = document.getElementById('paperCustomPrice');
    if (!customPriceInputEl) return null;

    const price = parseInt(customPriceInputEl.value) || 0;
    return price;
}

// ===== CATALOGUE CUSTOM PRICE =====

/**
 * Toggle bật/tắt nhập giá tay cho Giấy BÌA Catalogue
 */
function toggleCatCoverCustomPrice() {
    const btn = document.getElementById('btnCatCoverCustomPrice');
    const customPriceInput = document.getElementById('catCoverCustomPriceInput');
    const paperTypeSelect = document.getElementById('catCoverPaperType');
    const paperNameInput = document.getElementById('catCoverPaperName');

    if (!btn || !customPriceInput) return;

    const isActive = btn.classList.toggle('active');
    customPriceInput.style.display = isActive ? 'block' : 'none';

    // Hiện/ẩn ô nhập tên giấy và dropdown select
    if (isActive) {
        // Ẩn dropdown, hiện ô nhập tên
        if (paperTypeSelect) paperTypeSelect.style.display = 'none';
        if (paperNameInput) {
            paperNameInput.style.display = 'block';
            paperNameInput.focus();
        }

        // Focus vào ô nhập giá
        const priceInput = document.getElementById('catCoverCustomPrice');
        if (priceInput) {
            setTimeout(() => {
                priceInput.focus();
                priceInput.select();
            }, 100);
        }
    } else {
        // Hiện lại dropdown, ẩn ô nhập tên
        if (paperTypeSelect) paperTypeSelect.style.display = '';
        if (paperNameInput) {
            paperNameInput.style.display = 'none';
            paperNameInput.value = ''; // Xoá giá trị
        }
    }

    if (typeof updateCatCalculation === 'function') {
        updateCatCalculation();
    }
}

/**
 * Toggle bật/tắt nhập giá tay cho Giấy RUỘT Catalogue
 */
function toggleCatInnerCustomPrice() {
    const btn = document.getElementById('btnCatInnerCustomPrice');
    const customPriceInput = document.getElementById('catInnerCustomPriceInput');
    const paperTypeSelect = document.getElementById('catInnerPaperType');
    const paperNameInput = document.getElementById('catInnerPaperName');

    if (!btn || !customPriceInput) return;

    const isActive = btn.classList.toggle('active');
    customPriceInput.style.display = isActive ? 'block' : 'none';

    // Hiện/ẩn ô nhập tên giấy và dropdown select
    if (isActive) {
        // Ẩn dropdown, hiện ô nhập tên
        if (paperTypeSelect) paperTypeSelect.style.display = 'none';
        if (paperNameInput) {
            paperNameInput.style.display = 'block';
            paperNameInput.focus();
        }

        // Focus vào ô nhập giá
        const priceInput = document.getElementById('catInnerCustomPrice');
        if (priceInput) {
            setTimeout(() => {
                priceInput.focus();
                priceInput.select();
            }, 100);
        }
    } else {
        // Hiện lại dropdown, ẩn ô nhập tên
        if (paperTypeSelect) paperTypeSelect.style.display = '';
        if (paperNameInput) {
            paperNameInput.style.display = 'none';
            paperNameInput.value = ''; // Xoá giá trị
        }
    }

    if (typeof updateCatCalculation === 'function') {
        updateCatCalculation();
    }
}

/**
 * Kiểm tra toggle giá tay BÌA có bật không
 */
function isCatCoverCustomPriceEnabled() {
    const btn = document.getElementById('btnCatCoverCustomPrice');
    return btn && btn.classList.contains('active');
}

/**
 * Kiểm tra toggle giá tay RUỘT có bật không
 */
function isCatInnerCustomPriceEnabled() {
    const btn = document.getElementById('btnCatInnerCustomPrice');
    return btn && btn.classList.contains('active');
}

/**
 * Lấy giá tuỳ chỉnh BÌA
 */
function getCatCoverCustomPrice() {
    if (!isCatCoverCustomPriceEnabled()) return null;

    const input = document.getElementById('catCoverCustomPrice');
    if (!input) return null;

    return parseInt(input.value) || 0;
}

/**
 * Lấy giá tuỳ chỉnh RUỘT
 */
function getCatInnerCustomPrice() {
    if (!isCatInnerCustomPriceEnabled()) return null;

    const input = document.getElementById('catInnerCustomPrice');
    if (!input) return null;

    return parseInt(input.value) || 0;
}
