import { useState, useMemo, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { loadPaperSettings, loadCatalogueSettings } from '../data/default-settings';

// Catalogue size presets (kích thước sản phẩm cuối cùng)
const CAT_SIZES = [
    { value: 'A4', label: 'A4 đứng', w: 210, h: 297 },
    { value: 'A4_land', label: 'A4 ngang', w: 297, h: 210 },
    { value: 'A5', label: 'A5 đứng', w: 148, h: 210 },
    { value: 'A5_land', label: 'A5 ngang', w: 210, h: 148 },
    { value: 'A3', label: 'A3', w: 297, h: 420 },
    { value: 'custom', label: '📐 Tuỳ chọn', w: 0, h: 0 },
];

const PRINT_SIDES = [
    { id: 1, label: 'In 1 mặt' },
    { id: 2, label: 'In 2 mặt' },
];

function formatMoney(v) { return Math.round(v).toLocaleString('vi-VN') + 'đ'; }

function findTierPrice(tiers, qty) {
    if (!tiers || tiers.length === 0) return 0;
    const sorted = [...tiers].sort((a, b) => a.max - b.max);
    for (const t of sorted) { if (qty <= t.max) return t.price; }
    return sorted[sorted.length - 1].price;
}

// Helper: get all papers from paperPricing for a given printSizeId
function getPapersForSize(paperSettings, sizeId) {
    const pp = paperSettings.paperPricing?.find(p => p.printSizeId === sizeId);
    return pp?.papers || [];
}

// Section Header
function SectionHeader({ icon, title, color = 'primary', theme, borderColor }) {
    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Box sx={{
                width: 28, height: 28, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(theme.palette[color].main, 0.08), color: `${color}.main`,
            }}>
                <Iconify icon={icon} width={16} />
            </Box>
            <Typography variant="subtitle2" fontWeight={700} color={`${color}.main`} sx={{ letterSpacing: 0.5 }}>
                {title}
            </Typography>
            {borderColor && <Box sx={{ flex: 1, height: 2, bgcolor: `${color}.main`, borderRadius: 1, opacity: 0.3, ml: 1 }} />}
        </Stack>
    );
}

// Info card
function InfoCard({ label, value, color, icon, theme }) {
    return (
        <Box sx={{
            flex: 1, borderRadius: 2, p: 2, textAlign: 'center',
            border: '2px solid', borderColor: alpha(theme.palette[color].main, 0.2),
            bgcolor: alpha(theme.palette[color].main, 0.04),
        }}>
            <Typography variant="overline" sx={{ color: `${color}.main`, fontSize: 10, fontWeight: 700 }}>
                {icon} {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} color={`${color}.main`}>
                {value}
            </Typography>
        </Box>
    );
}

// Paper Row for cover/inner
function PaperRow({ item, index, papers, laminations, onUpdate, onRemove, canRemove, showCustomPrice, onToggleCustomPrice }) {
    return (
        <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.background.default, 0.5), border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                    <InputLabel>Loại giấy</InputLabel>
                    <Select value={item.paperId} label="Loại giấy"
                        onChange={e => onUpdate(index, 'paperId', e.target.value)}>
                        <MenuItem value="">-- Chọn loại giấy --</MenuItem>
                        {papers.map(p => (
                            <MenuItem key={p.id || p.name} value={p.id || p.name}>
                                {p.name}{p.tiers ? ` — ${findTierPrice(p.tiers, 100).toLocaleString()}đ/tờ` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>In</InputLabel>
                    <Select value={item.printSides} label="In"
                        onChange={e => onUpdate(index, 'printSides', e.target.value)}>
                        {PRINT_SIDES.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Cán màng</InputLabel>
                    <Select value={item.laminationId} label="Cán màng"
                        onChange={e => onUpdate(index, 'laminationId', e.target.value)}>
                        {laminations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                    </Select>
                </FormControl>
                {canRemove && (
                    <IconButton size="small" color="error" onClick={() => onRemove(index)}>
                        <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                    </IconButton>
                )}
            </Stack>
            {/* Nhập giá thủ công */}
            {item.showCustomPrice && (
                <TextField size="small" label="Giá giấy thủ công" type="number" value={item.customPrice || ''}
                    InputProps={{ endAdornment: <InputAdornment position="end">đ/tờ</InputAdornment> }}
                    onChange={e => onUpdate(index, 'customPrice', e.target.value)} sx={{ maxWidth: 220 }} />
            )}
            <Button size="small" variant="text" color="warning"
                startIcon={<Iconify icon="solar:tag-price-bold" width={16} />}
                onClick={() => onUpdate(index, 'showCustomPrice', !item.showCustomPrice)}
                sx={{ alignSelf: 'flex-start', fontSize: 12 }}>
                {item.showCustomPrice ? 'Ẩn nhập giá' : '💰 Nhập giá'}
            </Button>
        </Stack>
    );
}

// ======================================================================

export function CatalogueCalculatorView() {
    const theme = useTheme();
    const [catSettings, setCatSettings] = useState(() => loadCatalogueSettings());
    const [paperSettings, setPaperSettings] = useState(() => loadPaperSettings());

    // Auto-sync when settings changed from Cài đặt giá
    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.type === 'paper') {
                setPaperSettings(loadPaperSettings());
            } else if (e.detail?.type === 'catalogue') {
                setCatSettings(loadCatalogueSettings());
            }
        };
        window.addEventListener('netprint-settings-changed', handler);
        return () => window.removeEventListener('netprint-settings-changed', handler);
    }, []);

    // Use shared settings for laminations & customer types (synced with Cài đặt giá)
    const sharedLaminations = paperSettings.laminations || catSettings.laminations;
    const sharedCustomerTypes = paperSettings.customerTypes || catSettings.customerTypes;

    // Form state
    const [catSize, setCatSize] = useState('A4');
    const [customW, setCustomW] = useState('');
    const [customH, setCustomH] = useState('');
    const [pages, setPages] = useState(8);
    const [qty, setQty] = useState('');
    const [bindId, setBindId] = useState(catSettings.bindings[0]?.id || 1);
    const [printSizeId, setPrintSizeId] = useState('');
    const [custId, setCustId] = useState(sharedCustomerTypes[0]?.id || 1);

    const [coverPapers, setCoverPapers] = useState([
        { paperId: '', printSides: 1, laminationId: 1, showCustomPrice: false, customPrice: '' }
    ]);
    const [innerPapers, setInnerPapers] = useState([
        { paperId: '', printSides: 1, laminationId: 1, showCustomPrice: false, customPrice: '' }
    ]);
    const [extraCostItems, setExtraCostItems] = useState([]);
    const [result, setResult] = useState(null);
    const [showDetail, setShowDetail] = useState(true);
    const [error, setError] = useState('');

    // History & Preview state
    const [priceHistory, setPriceHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('netprint_cat_history') || '[]'); } catch { return []; }
    });
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [previewEntry, setPreviewEntry] = useState(null);

    const numQty = Number(qty) || 0;
    const isCustomSize = catSize === 'custom';

    // Get print sizes from paper settings
    const printSizes = paperSettings.printSizes || [];

    // Get papers for selected print size — synced from Cài đặt giá
    const availablePapers = useMemo(() => {
        if (printSizeId) {
            return getPapersForSize(paperSettings, parseInt(printSizeId));
        }
        // No print size selected: combine all papers from all print sizes
        const allPapers = [];
        const seen = new Set();
        (paperSettings.paperPricing || []).forEach(pp => {
            (pp.papers || []).forEach(p => {
                const key = p.name || p.id;
                if (!seen.has(key)) {
                    seen.add(key);
                    allPapers.push(p);
                }
            });
        });
        return allPapers;
    }, [printSizeId, paperSettings]);

    // Auto-select print size based on catalogue size
    useEffect(() => {
        if (printSizes.length === 0) return;
        const sizePreset = CAT_SIZES.find(s => s.value === catSize);
        if (!sizePreset) return;

        const catW = isCustomSize ? (Number(customW) || 0) : sizePreset.w;
        const catH = isCustomSize ? (Number(customH) || 0) : sizePreset.h;
        if (catW <= 0 || catH <= 0) return;

        // Find best fitting print size
        const margin = 10;
        const reqW = catW + margin * 2;
        const reqH = catH + margin * 2;
        let bestSize = null;
        let minWaste = Infinity;

        printSizes.forEach(size => {
            const fitsNormal = size.w >= reqW && size.h >= reqH;
            const fitsRotated = size.w >= reqH && size.h >= reqW;
            if (fitsNormal || fitsRotated) {
                const waste = (size.w * size.h) - (catW * catH);
                if (waste < minWaste) { minWaste = waste; bestSize = size; }
            }
        });

        if (bestSize) setPrintSizeId(String(bestSize.id));
        else if (printSizes.length > 0 && !printSizeId) setPrintSizeId(String(printSizes[0].id));
    }, [catSize, customW, customH, printSizes, isCustomSize, printSizeId]);

    // Calculated info
    const innerPages = Math.max(0, pages - 4);
    const innerSheetsPerBook = Math.ceil(innerPages / 4);
    const totalCoverSheets = 1 * numQty;
    const totalInnerSheets = innerSheetsPerBook * numQty;

    // Extra costs
    const totalExtraCosts = extraCostItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const addExtraCost = () => setExtraCostItems([...extraCostItems, { name: '', amount: '' }]);
    const updateExtraCost = (idx, field, val) => setExtraCostItems(extraCostItems.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    const removeExtraCost = (idx) => setExtraCostItems(extraCostItems.filter((_, i) => i !== idx));

    // Cover/Inner papers helpers
    const updateCover = (idx, field, val) => setCoverPapers(coverPapers.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    const updateInner = (idx, field, val) => setInnerPapers(innerPapers.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    // Get paper price (using custom or tier)
    const getPaperPrice = useCallback((paperItem, papers) => {
        if (paperItem.showCustomPrice && paperItem.customPrice) return Number(paperItem.customPrice);
        if (!paperItem.paperId) return 0;
        // From paper settings (tiers)
        const pp = papers.find(p => (p.id || p.name) === paperItem.paperId);
        if (pp?.tiers) return findTierPrice(pp.tiers, numQty);
        return 0;
    }, [numQty]);

    // Calculate
    const calculate = useCallback(() => {
        setError('');
        if (numQty <= 0) { setError('Vui lòng nhập số lượng lớn hơn 0!'); return; }
        if (pages < 4) { setError('Catalogue cần ít nhất 4 trang!'); return; }
        if (isCustomSize && (!Number(customW) || !Number(customH))) { setError('Vui lòng nhập kích thước tuỳ chọn!'); return; }

        const printPrice = catSettings.printPrice;

        // Calculate cover costs
        let coverCost = 0, coverPrintCost = 0, coverLamCost = 0;
        coverPapers.forEach(cp => {
            const price = getPaperPrice(cp, availablePapers);
            coverCost += totalCoverSheets * price;
            if (cp.printSides > 0) coverPrintCost += totalCoverSheets * printPrice * cp.printSides;
            if (cp.laminationId && cp.laminationId !== 1) {
                const lam = sharedLaminations.find(l => l.id === cp.laminationId);
                if (lam?.tiers) coverLamCost += totalCoverSheets * findTierPrice(lam.tiers, totalCoverSheets);
            }
        });

        // Calculate inner costs
        let innerCost = 0, innerPrintCost = 0, innerLamCost = 0;
        innerPapers.forEach(ip => {
            const price = getPaperPrice(ip, availablePapers);
            innerCost += totalInnerSheets * price;
            if (ip.printSides > 0) innerPrintCost += totalInnerSheets * printPrice * ip.printSides;
            if (ip.laminationId && ip.laminationId !== 1) {
                const lam = sharedLaminations.find(l => l.id === ip.laminationId);
                if (lam?.tiers) innerLamCost += totalInnerSheets * findTierPrice(lam.tiers, totalInnerSheets);
            }
        });

        // Binding
        const bind = catSettings.bindings.find(b => b.id === bindId);
        const bindCost = numQty * findTierPrice(bind?.tiers, numQty);

        const totalCost = coverCost + coverPrintCost + coverLamCost + innerCost + innerPrintCost + innerLamCost + bindCost + totalExtraCosts;
        const costPerItem = totalCost / numQty;
        const cust = sharedCustomerTypes.find(c => c.id === custId);
        const profitPercent = cust?.profit || 25;
        const sellPerItem = Math.round(costPerItem * (1 + profitPercent / 100));
        const totalSell = sellPerItem * numQty;
        const profit = totalSell - totalCost;

        setResult({
            qty: numQty, pages, sellPerItem, totalSell, totalCost, profit,
            profitPercent: totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0,
            breakdown: [
                { label: 'Giấy bìa', value: coverCost, icon: 'solar:document-bold-duotone', color: 'info' },
                { label: 'In bìa', value: coverPrintCost, icon: 'solar:printer-bold-duotone', color: 'primary' },
                { label: 'Cán màng bìa', value: coverLamCost, icon: 'solar:layers-bold-duotone', color: 'warning' },
                { label: 'Giấy ruột', value: innerCost, icon: 'solar:document-bold-duotone', color: 'info' },
                { label: 'In ruột', value: innerPrintCost, icon: 'solar:printer-bold-duotone', color: 'primary' },
                { label: 'Cán màng ruột', value: innerLamCost, icon: 'solar:layers-bold-duotone', color: 'warning' },
                { label: 'Đóng cuốn', value: bindCost, icon: 'solar:bookmark-bold-duotone', color: 'error' },
                { label: 'Chi phí khác', value: totalExtraCosts, icon: 'solar:tag-bold-duotone', color: 'secondary' },
            ].filter(r => r.value > 0),
        });

        // Save to history
        const sizePreset = CAT_SIZES.find(s => s.value === catSize);
        const catW = isCustomSize ? (Number(customW) || 0) : sizePreset?.w || 0;
        const catH = isCustomSize ? (Number(customH) || 0) : sizePreset?.h || 0;
        const coverPaperNames = coverPapers.map(cp => {
            const p = availablePapers.find(pp => (pp.id || pp.name) === cp.paperId);
            return p?.name || '';
        }).filter(Boolean).join(', ');
        const innerPaperNames = innerPapers.map(ip => {
            const p = availablePapers.find(pp => (pp.id || pp.name) === ip.paperId);
            return p?.name || '';
        }).filter(Boolean).join(', ');
        const coverLamName = coverPapers.map(cp => {
            const l = sharedLaminations.find(ll => ll.id === cp.laminationId);
            return l?.id !== 1 ? l?.name : null;
        }).filter(Boolean).join(', ') || 'Không cán';
        const innerLamName = innerPapers.map(ip => {
            const l = sharedLaminations.find(ll => ll.id === ip.laminationId);
            return l?.id !== 1 ? l?.name : null;
        }).filter(Boolean).join(', ') || 'Không cán';
        const bindName = bind?.name || '';
        const printSizeName = printSizes.find(s => String(s.id) === String(printSizeId))?.name || '';
        const entry = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            catSize: sizePreset?.label || 'Tuỳ chọn',
            catW, catH, pages, qty: numQty,
            coverPaperNames, innerPaperNames,
            coverLamName, innerLamName,
            bindName, printSizeName,
            custName: cust?.name || '',
            totalCoverSheets, totalInnerSheets,
            sellPerItem, totalSell, totalCost,
        };
        setPriceHistory(prev => {
            const updated = [entry, ...prev].slice(0, 50);
            localStorage.setItem('netprint_cat_history', JSON.stringify(updated));
            return updated;
        });
    }, [numQty, pages, coverPapers, innerPapers, bindId, custId, catSettings, totalExtraCosts, availablePapers, getPaperPrice, isCustomSize, customW, customH, totalCoverSheets, totalInnerSheets, sharedLaminations, sharedCustomerTypes]);

    // ===== EXPORT =====
    const handleExportQuotation = (ent) => {
        const d = new Date(ent.createdAt);
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Thông tin tính giá Catalogue - NetPrint</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #e53935; }
  .company-info { text-align: right; font-size: 13px; color: #718096; line-height: 1.7; }
  .title { font-size: 22px; font-weight: 800; text-align: center; margin: 24px 0 8px; color: #1a202c; text-transform: uppercase; letter-spacing: 1px; }
  .subtitle { text-align: center; color: #718096; font-size: 13px; margin-bottom: 28px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4a5568; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .info-item { background: #f7fafc; border-radius: 8px; padding: 12px 14px; }
  .info-label { font-size: 11px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .info-value { font-size: 15px; font-weight: 700; color: #1a202c; }
  .price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .price-card { border-radius: 10px; padding: 16px; text-align: center; }
  .price-card.sell { background: linear-gradient(135deg, #e6f4ea, #c8e6c9); border: 1px solid #a5d6a7; }
  .price-card.total { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 1px solid #90caf9; }
  .price-card.qty { background: linear-gradient(135deg, #fff8e1, #ffecb3); border: 1px solid #ffe082; }
  .price-card .plabel { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4a5568; margin-bottom: 6px; }
  .price-card .pvalue { font-size: 22px; font-weight: 900; color: #1a202c; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #a0aec0; }
  .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 20px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <img src="/logo/logo-full.png" alt="NetPrint" style="height:56px;object-fit:contain" />
  </div>
  <div class="company-info">
    <div>Ngày tính giá: ${dateStr}</div>
    <div>Mã tính giá: #TG${ent.id.toString().slice(-6)}</div>
  </div>
</div>

<div class="title">Thông Tin Tính Giá Catalogue</div>
<div class="subtitle">Kết quả tính toán tự động từ hệ thống NetPrint</div>

<div class="section">
  <div class="section-title">📋 Thông tin sản phẩm</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Kích thước</div><div class="info-value">${ent.catSize} (${ent.catW}×${ent.catH})</div></div>
    <div class="info-item"><div class="info-label">Số trang</div><div class="info-value">${ent.pages} trang</div></div>
    <div class="info-item"><div class="info-label">Số lượng</div><div class="info-value">${Number(ent.qty).toLocaleString('vi-VN')} cuốn</div></div>
    <div class="info-item"><div class="info-label">Đóng cuốn</div><div class="info-value">${ent.bindName}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📊 Thông tin giấy & in</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Giấy bìa</div><div class="info-value">${ent.coverPaperNames || '—'}</div></div>
    <div class="info-item"><div class="info-label">Cán màng bìa</div><div class="info-value">${ent.coverLamName}</div></div>
    <div class="info-item"><div class="info-label">Giấy ruột</div><div class="info-value">${ent.innerPaperNames || '—'}</div></div>
    <div class="info-item"><div class="info-label">Cán màng ruột</div><div class="info-value">${ent.innerLamName}</div></div>
    <div class="info-item"><div class="info-label">Khổ giấy in</div><div class="info-value">${ent.printSizeName || '—'}</div></div>
    <div class="info-item"><div class="info-label">Tờ in bìa</div><div class="info-value">${Number(ent.totalCoverSheets).toLocaleString('vi-VN')} tờ</div></div>
    <div class="info-item"><div class="info-label">Tờ in ruột</div><div class="info-value">${Number(ent.totalInnerSheets).toLocaleString('vi-VN')} tờ</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">💰 Đơn giá</div>
  <div class="price-grid">
    <div class="price-card qty"><div class="plabel">Số lượng</div><div class="pvalue">${Number(ent.qty).toLocaleString('vi-VN')} cuốn</div></div>
    <div class="price-card sell"><div class="plabel">Đơn giá / cuốn</div><div class="pvalue">${Number(ent.sellPerItem).toLocaleString('vi-VN')}đ</div></div>
    <div class="price-card total"><div class="plabel">Tổng tiền</div><div class="pvalue">${Number(ent.totalSell).toLocaleString('vi-VN')}đ</div></div>
    <div class="price-card" style="background:linear-gradient(135deg,#f3e5f5,#e1bee7);border:1px solid #ce93d8"><div class="plabel">Loại khách</div><div class="pvalue" style="font-size:18px">${ent.custName || '—'}</div></div>
  </div>
</div>

<div class="note">⚠️ Đây là kết quả tính giá tự động. Giá thực tế có thể thay đổi tùy theo điều kiện thực tế và số lượng đặt hàng.</div>

<div class="footer">
  <span>NetPrint — Tính toán chi phí in Catalogue chuyên nghiệp</span>
  <span>Ngày tạo: ${dateStr}</span>
</div>

<script>window.onload = () => window.print();</script>
</body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    // ===== HISTORY =====
    const filteredHistory = priceHistory.filter(h => {
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return (
            (h.catSize || '').toLowerCase().includes(q) ||
            (h.coverPaperNames || '').toLowerCase().includes(q) ||
            String(h.qty).includes(q)
        );
    });

    // Suggested extra cost items
    const suggestedCosts = ['Khuôn bế', 'Ép kim', 'Ép nhũ', 'UV điểm/toàn phần', 'In phun', 'Vận chuyển'];

    return (
        <DashboardContent maxWidth="lg">
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                        color: 'white', boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
                    }}>
                        <Iconify icon="solar:book-bold-duotone" width={26} />
                    </Box>
                    <Stack>
                        <Typography variant="h4" fontWeight={800}>Tính Giá Catalogue</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tính toán chi phí in catalogue, brochure chuyên nghiệp
                        </Typography>
                    </Stack>
                </Stack>
                <Tooltip title="Lịch sử tính giá">
                    <IconButton onClick={() => setHistoryOpen(true)}
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
                        <Badge badgeContent={priceHistory.length} color="error" max={99}>
                            <Iconify icon="solar:history-bold-duotone" width={24} />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Stack>

            <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2], mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    {/* QUY CÁCH CATALOGUE */}
                    <SectionHeader icon="solar:ruler-angular-bold-duotone" title="QUY CÁCH CATALOGUE" color="warning" theme={theme} borderColor />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                        <FormControl size="small" sx={{ flex: 1 }}>
                            <InputLabel>Kích thước Catalogue</InputLabel>
                            <Select value={catSize} label="Kích thước Catalogue" onChange={e => setCatSize(e.target.value)}>
                                {CAT_SIZES.map(s => <MenuItem key={s.value} value={s.value}>{s.label} {s.w > 0 ? `(${s.w}×${s.h})` : ''}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField size="small" label="Số trang" type="number" value={pages} sx={{ flex: 0.5 }}
                            helperText="Tổng gồm bìa"
                            InputProps={{ endAdornment: <InputAdornment position="end">trang</InputAdornment> }}
                            onChange={e => setPages(parseInt(e.target.value) || 0)} />
                        <TextField size="small" label="Số lượng" type="number" value={qty} sx={{ flex: 0.5 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">cuốn</InputAdornment>,
                                startAdornment: <InputAdornment position="start"><Iconify icon="solar:layers-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>
                            }}
                            onChange={e => setQty(e.target.value)} />
                    </Stack>

                    {/* Custom size */}
                    <Collapse in={isCustomSize}>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <TextField size="small" label="Ngang (mm)" type="number" value={customW} sx={{ flex: 1 }}
                                onChange={e => setCustomW(e.target.value)} />
                            <TextField size="small" label="Cao (mm)" type="number" value={customH} sx={{ flex: 1 }}
                                onChange={e => setCustomH(e.target.value)} />
                        </Stack>
                    </Collapse>

                    {/* Đóng cuốn + Khổ giấy in */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                        <FormControl size="small" sx={{ flex: 1 }}>
                            <InputLabel>Quy cách đóng cuốn</InputLabel>
                            <Select value={bindId} label="Quy cách đóng cuốn" onChange={e => setBindId(e.target.value)}>
                                {catSettings.bindings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ flex: 1 }}>
                            <InputLabel>Khổ giấy in</InputLabel>
                            <Select value={printSizeId} label="Khổ giấy in" onChange={e => setPrintSizeId(e.target.value)}>
                                {printSizes.length > 0 ? printSizes.map(s => (
                                    <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                                )) : <MenuItem value="" disabled>Chưa có khổ giấy — Thêm ở Cài đặt giá</MenuItem>}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* 4 thẻ thông tin */}
                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                        <InfoCard label="SỐ TRANG BÌA" value="4 trang" color="error" icon="📄" theme={theme} />
                        <InfoCard label="TỔNG TỜ IN BÌA" value={`${numQty > 0 ? totalCoverSheets.toLocaleString('vi-VN') : 0} tờ`} color="primary" icon="🖨" theme={theme} />
                        <InfoCard label="SỐ TRANG RUỘT" value={`${innerPages} trang`} color="success" icon="📋" theme={theme} />
                        <InfoCard label="TỔNG TỜ IN RUỘT" value={`${numQty > 0 ? totalInnerSheets.toLocaleString('vi-VN') : 0} tờ`} color="info" icon="📑" theme={theme} />
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* GIẤY BÌA */}
                    <SectionHeader icon="solar:document-bold-duotone" title="GIẤY BÌA" color="error" theme={theme} borderColor />
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {coverPapers.map((cp, idx) => (
                            <PaperRow key={idx} item={cp} index={idx}
                                papers={availablePapers}
                                laminations={sharedLaminations} onUpdate={updateCover}
                                onRemove={(i) => setCoverPapers(coverPapers.filter((_, j) => j !== i))}
                                canRemove={coverPapers.length > 1} />
                        ))}
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* GIẤY RUỘT */}
                    <SectionHeader icon="solar:document-text-bold-duotone" title="GIẤY RUỘT" color="success" theme={theme} borderColor />
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {innerPapers.map((ip, idx) => (
                            <PaperRow key={idx} item={ip} index={idx}
                                papers={availablePapers}
                                laminations={sharedLaminations} onUpdate={updateInner}
                                onRemove={(i) => setInnerPapers(innerPapers.filter((_, j) => j !== i))}
                                canRemove={innerPapers.length > 1} />
                        ))}
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* CHI PHÍ KHÁC */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <SectionHeader icon="solar:wallet-bold-duotone" title="CHI PHÍ KHÁC" color="error" theme={theme} />
                        <Button size="small" variant="soft" color="primary"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            onClick={addExtraCost}>
                            Thêm
                        </Button>
                    </Stack>
                    {extraCostItems.map((item, idx) => (
                        <Stack key={idx} direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                            <TextField size="small" placeholder="Tên chi phí" value={item.name} sx={{ flex: 1 }}
                                onChange={e => updateExtraCost(idx, 'name', e.target.value)} />
                            <TextField size="small" placeholder="Số tiền" type="number" value={item.amount} sx={{ width: 160 }}
                                InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }}
                                onChange={e => updateExtraCost(idx, 'amount', e.target.value)} />
                            <IconButton size="small" color="error" onClick={() => removeExtraCost(idx)}>
                                <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                        </Stack>
                    ))}

                    <Divider sx={{ my: 3 }} />

                    {/* LOẠI KHÁCH + TÍNH GIÁ */}
                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Loại khách hàng</InputLabel>
                            <Select value={custId} onChange={e => setCustId(e.target.value)} label="Loại khách hàng">
                                {sharedCustomerTypes.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button variant="contained" size="large" onClick={calculate}
                            startIcon={<Iconify icon="solar:calculator-bold-duotone" />}
                            sx={{
                                px: 5, py: 1.5, fontWeight: 800, fontSize: 16, borderRadius: 2,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.36)}`,
                                },
                            }}>
                            Tính giá
                        </Button>
                    </Stack>

                    {error && (
                        <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>⚠️ {error}</Typography>
                    )}
                </CardContent>
            </Card>

            {/* RESULT */}
            <Collapse in={!!result}>
                {result && (
                    <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4], overflow: 'hidden' }}>
                        <CardContent sx={{ p: 3 }}>
                            {/* Price hero */}
                            <Box sx={{
                                borderRadius: 3, p: 3, mb: 3, position: 'relative', overflow: 'hidden',
                                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                                color: 'white',
                            }}>
                                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', bgcolor: alpha('#fff', 0.06) }} />
                                <Stack direction="row" justifyContent="space-around" alignItems="center">
                                    <Box textAlign="center">
                                        <Typography variant="overline" sx={{ opacity: 0.7 }}>Đơn giá / cuốn</Typography>
                                        <Typography variant="h3" fontWeight={900}>{formatMoney(result.sellPerItem)}</Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.2) }} />
                                    <Box textAlign="center">
                                        <Typography variant="overline" sx={{ opacity: 0.7 }}>Tổng bán ({result.qty} cuốn)</Typography>
                                        <Typography variant="h4" fontWeight={800}>{formatMoney(result.totalSell)}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Detail toggle */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700}>📊 Chi tiết chi phí</Typography>
                                <Button size="small" variant="text" onClick={() => setShowDetail(!showDetail)}
                                    endIcon={<Iconify icon={showDetail ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} />}>
                                    {showDetail ? 'Thu gọn' : 'Mở rộng'}
                                </Button>
                            </Stack>

                            <Collapse in={showDetail}>
                                <Stack spacing={1} sx={{ mb: 3 }}>
                                    {result.breakdown.map((row, idx) => (
                                        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center"
                                            sx={{ py: 1, px: 2, borderRadius: 1.5, bgcolor: alpha(theme.palette[row.color].main, 0.04) }}>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Box sx={{
                                                    width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: alpha(theme.palette[row.color].main, 0.1),
                                                }}>
                                                    <Iconify icon={row.icon} width={16} sx={{ color: `${row.color}.main` }} />
                                                </Box>
                                                <Typography variant="body2">{row.label}</Typography>
                                            </Stack>
                                            <Typography variant="body2" fontWeight={700} color={`${row.color}.main`}>
                                                {formatMoney(row.value)}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Collapse>

                            {/* Total bar */}
                            <Box sx={{
                                borderRadius: 2, p: 2.5, color: 'white', position: 'relative', overflow: 'hidden',
                                background: `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[900]} 100%)`,
                            }}>
                                <Stack direction="row" justifyContent="space-around">
                                    <Box textAlign="center">
                                        <Typography variant="overline" sx={{ opacity: 0.5 }}>Tổng vốn</Typography>
                                        <Typography variant="h5" fontWeight={800}>{formatMoney(result.totalCost)}</Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.12) }} />
                                    <Box textAlign="center">
                                        <Typography variant="overline" sx={{ opacity: 0.5 }}>Lợi nhuận</Typography>
                                        <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.success.light }}>
                                            +{formatMoney(result.profit)}
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.12) }} />
                                    <Box textAlign="center">
                                        <Typography variant="overline" sx={{ opacity: 0.5 }}>% Lãi</Typography>
                                        <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.warning.light }}>
                                            {result.profitPercent}%
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Collapse>

            {/* ===== HISTORY DRAWER ===== */}
            <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}
                PaperProps={{ sx: { width: 420, bgcolor: '#f8fafc' } }}>
                <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Iconify icon="solar:history-bold-duotone" width={24} />
                            <Typography variant="h6" fontWeight={800}>Lịch sử tính giá</Typography>
                        </Stack>
                        <IconButton onClick={() => setHistoryOpen(false)} sx={{ color: 'white' }}>
                            <Iconify icon="mingcute:close-line" width={22} />
                        </IconButton>
                    </Stack>
                    <TextField fullWidth size="small" placeholder="🔍 Tìm kiếm..." value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        sx={{ mt: 2, bgcolor: 'white', borderRadius: 1, '& fieldset': { border: 'none' } }} />
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {filteredHistory.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Iconify icon="solar:archive-bold-duotone" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary">Chưa có lịch sử</Typography>
                        </Box>
                    ) : filteredHistory.map((entry, idx) => {
                        const d = new Date(entry.createdAt);
                        const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        return (
                            <Card key={entry.id} sx={{ mb: 1.5, borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Chip label={`#${idx + 1}`} size="small" color="primary" sx={{ fontWeight: 700, height: 22 }} />
                                            <Typography variant="body2" fontWeight={700}>{entry.catSize} ({entry.catW}×{entry.catH})</Typography>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">{dateStr} {timeStr}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                                        <Chip label={`${entry.pages} trang`} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                        <Chip label={`${Number(entry.qty).toLocaleString('vi-VN')} cuốn`} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                        <Chip label={entry.bindName} size="small" variant="soft" color="error" sx={{ height: 22, fontSize: 11 }} />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                                        <Typography variant="body2" fontWeight={800} color="success.dark">
                                            {Number(entry.sellPerItem).toLocaleString('vi-VN')}đ / cuốn
                                        </Typography>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="Xem trước">
                                                <IconButton size="small" color="info" onClick={() => setPreviewEntry(entry)}>
                                                    <Iconify icon="solar:eye-bold" width={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xoá">
                                                <IconButton size="small" color="error"
                                                    onClick={() => setPriceHistory(prev => {
                                                        const updated = prev.filter(h => h.id !== entry.id);
                                                        localStorage.setItem('netprint_cat_history', JSON.stringify(updated));
                                                        return updated;
                                                    })}>
                                                    <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            </Drawer>

            {/* ===== PREVIEW DIALOG ===== */}
            {(() => {
                if (!previewEntry) return null;
                const e = previewEntry;
                const d = new Date(e.createdAt);
                const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                    <Dialog open onClose={() => setPreviewEntry(null)} maxWidth="md" fullWidth
                        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                        {/* Header */}
                        <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack>
                                    <Typography variant="subtitle1" fontWeight={800}>Xem trước thông tin tính giá</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Mã: #TG{String(e.id).slice(-6)} · {dateStr}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" size="small" color="inherit"
                                        startIcon={<Iconify icon="solar:printer-bold" />}
                                        onClick={() => handleExportQuotation(e)}
                                        sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700 }}>
                                        In / PDF
                                    </Button>
                                    <IconButton onClick={() => setPreviewEntry(null)} sx={{ color: 'white' }}>
                                        <Iconify icon="mingcute:close-line" width={22} />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Body */}
                        <Box sx={{ p: 4, bgcolor: '#f8fafc', maxHeight: '75vh', overflow: 'auto' }}>
                            {/* Company header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, pb: 2.5, borderBottom: '3px solid #e53935' }}>
                                <Box>
                                    <Box component="img" src="/logo/logo-full.png" alt="NetPrint" sx={{ height: 52, objectFit: 'contain' }} />
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Ngày tính giá: {dateStr}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">Mã tính giá: #TG{String(e.id).slice(-6)}</Typography>
                                </Box>
                            </Stack>

                            {/* Title */}
                            <Typography variant="h5" fontWeight={800} align="center" sx={{ mb: 0.5, textTransform: 'uppercase' }}>
                                Thông Tin Tính Giá Catalogue
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                Kết quả tính toán tự động từ hệ thống NetPrint
                            </Typography>

                            {/* Section 1: Product */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    📋 Thông tin sản phẩm
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: 'Kích thước', value: `${e.catSize} (${e.catW}×${e.catH})` },
                                        { label: 'Số trang', value: `${e.pages} trang` },
                                        { label: 'Số lượng', value: `${Number(e.qty).toLocaleString('vi-VN')} cuốn` },
                                        { label: 'Đóng cuốn', value: e.bindName },
                                    ].map((item, i) => (
                                        <Grid item xs={3} key={i}>
                                            <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.label}</Typography>
                                                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Section 2: Paper & Print */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    📊 Thông tin giấy & in
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: 'Giấy bìa', value: e.coverPaperNames || '—' },
                                        { label: 'Cán màng bìa', value: e.coverLamName },
                                        { label: 'Giấy ruột', value: e.innerPaperNames || '—' },
                                        { label: 'Cán màng ruột', value: e.innerLamName },
                                        { label: 'Khổ giấy in', value: e.printSizeName || '—' },
                                        { label: 'Tờ in bìa', value: `${Number(e.totalCoverSheets).toLocaleString('vi-VN')} tờ` },
                                        { label: 'Tờ in ruột', value: `${Number(e.totalInnerSheets).toLocaleString('vi-VN')} tờ` },
                                    ].map((item, i) => (
                                        <Grid item xs={3} key={i}>
                                            <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.label}</Typography>
                                                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Section 3: Price */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    💰 Đơn giá
                                </Typography>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={3}>
                                        <Box sx={{ borderRadius: 2, p: 2.5, textAlign: 'center', bgcolor: '#fff8e1', border: '1px solid #ffe082' }}>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Số lượng</Typography>
                                            <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{Number(e.qty).toLocaleString('vi-VN')} cuốn</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Box sx={{ borderRadius: 2, p: 2.5, textAlign: 'center', bgcolor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Đơn giá / cuốn</Typography>
                                            <Typography variant="h5" fontWeight={900} color="success.dark" sx={{ mt: 0.5 }}>{Number(e.sellPerItem).toLocaleString('vi-VN')}đ</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Box sx={{ borderRadius: 2, p: 2.5, textAlign: 'center', bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Tổng tiền</Typography>
                                            <Typography variant="h5" fontWeight={900} color="info.dark" sx={{ mt: 0.5 }}>{Number(e.totalSell).toLocaleString('vi-VN')}đ</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Box sx={{ borderRadius: 2, p: 2.5, textAlign: 'center', bgcolor: '#f3e5f5', border: '1px solid #ce93d8' }}>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Loại khách</Typography>
                                            <Typography variant="h6" fontWeight={900} color="purple" sx={{ mt: 0.5 }}>{e.custName || '—'}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Note */}
                            <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2, p: 2 }}>
                                <Typography variant="caption" color="warning.dark">
                                    ⚠️ Đây là kết quả tính giá tự động. Giá thực tế có thể thay đổi tùy theo điều kiện thực tế và số lượng đặt hàng.
                                </Typography>
                            </Box>
                        </Box>
                    </Dialog>
                );
            })()}
        </DashboardContent>
    );
}
