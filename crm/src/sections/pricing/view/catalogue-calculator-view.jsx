import { useState, useMemo, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
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
    const catSettings = useMemo(() => loadCatalogueSettings(), []);
    const paperSettings = useMemo(() => loadPaperSettings(), []);

    // Form state
    const [catSize, setCatSize] = useState('A4');
    const [customW, setCustomW] = useState('');
    const [customH, setCustomH] = useState('');
    const [pages, setPages] = useState(8);
    const [qty, setQty] = useState('');
    const [bindId, setBindId] = useState(catSettings.bindings[0]?.id || 1);
    const [printSizeId, setPrintSizeId] = useState('');
    const [custId, setCustId] = useState(catSettings.customerTypes[0]?.id || 1);

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

    const numQty = Number(qty) || 0;
    const isCustomSize = catSize === 'custom';

    // Get print sizes from paper settings
    const printSizes = paperSettings.printSizes || [];

    // Get papers for selected print size
    const availablePapers = useMemo(() => {
        if (!printSizeId) return catSettings.papers || [];
        return getPapersForSize(paperSettings, parseInt(printSizeId));
    }, [printSizeId, paperSettings, catSettings.papers]);

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
        // From catalogue settings papers
        const catPaper = catSettings.papers.find(p => p.id === paperItem.paperId);
        if (catPaper) return catPaper.price;
        // From paper settings (tiers)
        const pp = papers.find(p => (p.id || p.name) === paperItem.paperId);
        if (pp?.tiers) return findTierPrice(pp.tiers, numQty);
        return 0;
    }, [catSettings.papers, numQty]);

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
                const lam = catSettings.laminations.find(l => l.id === cp.laminationId);
                if (lam?.tiers) coverLamCost += numQty * findTierPrice(lam.tiers, numQty);
            }
        });

        // Calculate inner costs
        let innerCost = 0, innerPrintCost = 0, innerLamCost = 0;
        innerPapers.forEach(ip => {
            const price = getPaperPrice(ip, availablePapers);
            innerCost += totalInnerSheets * price;
            if (ip.printSides > 0) innerPrintCost += totalInnerSheets * printPrice * ip.printSides;
            if (ip.laminationId && ip.laminationId !== 1) {
                const lam = catSettings.laminations.find(l => l.id === ip.laminationId);
                if (lam?.tiers) innerLamCost += numQty * findTierPrice(lam.tiers, numQty);
            }
        });

        // Binding
        const bind = catSettings.bindings.find(b => b.id === bindId);
        const bindCost = numQty * findTierPrice(bind?.tiers, numQty);

        const totalCost = coverCost + coverPrintCost + coverLamCost + innerCost + innerPrintCost + innerLamCost + bindCost + totalExtraCosts;
        const costPerItem = totalCost / numQty;
        const cust = catSettings.customerTypes.find(c => c.id === custId);
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
    }, [numQty, pages, coverPapers, innerPapers, bindId, custId, catSettings, totalExtraCosts, availablePapers, getPaperPrice, isCustomSize, customW, customH, totalCoverSheets, totalInnerSheets]);

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
                                    <MenuItem key={s.id} value={String(s.id)}>{s.name} ({s.w}×{s.h})</MenuItem>
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
                                papers={availablePapers.length > 0 ? availablePapers : catSettings.papers}
                                laminations={catSettings.laminations} onUpdate={updateCover}
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
                                papers={availablePapers.length > 0 ? availablePapers : catSettings.papers}
                                laminations={catSettings.laminations} onUpdate={updateInner}
                                onRemove={(i) => setInnerPapers(innerPapers.filter((_, j) => j !== i))}
                                canRemove={innerPapers.length > 1} />
                        ))}
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* CHI PHÍ KHÁC */}
                    <SectionHeader icon="solar:tag-bold-duotone" title="CHI PHÍ KHÁC" color="secondary" theme={theme} />
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {extraCostItems.map((item, idx) => (
                            <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                                <TextField size="small" label="Tên" value={item.name} sx={{ flex: 1 }}
                                    onChange={e => updateExtraCost(idx, 'name', e.target.value)} />
                                <TextField size="small" label="Số tiền" type="number" value={item.amount} sx={{ width: 150 }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }}
                                    onChange={e => updateExtraCost(idx, 'amount', e.target.value)} />
                                <IconButton size="small" color="error" onClick={() => removeExtraCost(idx)}>
                                    <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                                </IconButton>
                            </Stack>
                        ))}
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>💡 Gợi ý chi phí</InputLabel>
                                <Select value="" label="💡 Gợi ý chi phí"
                                    onChange={e => {
                                        if (e.target.value) setExtraCostItems([...extraCostItems, { name: e.target.value, amount: '' }]);
                                    }}>
                                    {suggestedCosts.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button size="small" variant="contained" color="secondary"
                                startIcon={<Iconify icon="mingcute:add-line" />}
                                onClick={addExtraCost}>
                                + Thêm
                            </Button>
                        </Stack>
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* LOẠI KHÁCH + TÍNH GIÁ */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="center">
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Loại khách</InputLabel>
                            <Select value={custId} label="Loại khách" onChange={e => setCustId(e.target.value)}>
                                {catSettings.customerTypes.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name} (+{c.profit}%)</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button variant="contained" size="large" color="primary" onClick={calculate}
                            startIcon={<Iconify icon="solar:calculator-bold" />}
                            sx={{ px: 5, py: 1.5, borderRadius: 2, fontWeight: 800, fontSize: 16 }}>
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
        </DashboardContent>
    );
}
