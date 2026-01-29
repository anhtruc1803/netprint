function updatePaperTier(sizeId, paperId, tierIdx, field, value) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (paper && paper.tiers[tierIdx]) {
        paper.tiers[tierIdx][field] = parseInt(value);
        savePaperSettings();
    }
}
