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
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { playCalculateSound } from '../../../utils/sound';
import { loadPaperSettings, loadCatalogueSettings } from '../data/default-settings';

// Catalogue size presets (kích thước sản phẩm cuối cùng)
const CAT_SIZES = [
    { value: 'A4', label: 'A4 đứng', w: 210, h: 297 },
    { value: 'A4_land', label: 'A4 ngang', w: 297, h: 210 },
    { value: 'A5', label: 'A5 đứng', w: 148, h: 210 },
    { value: 'A5_land', label: 'A5 ngang', w: 210, h: 148 },
    { value: 'A6', label: 'A6 đứng', w: 105, h: 148 },
    { value: 'A6_land', label: 'A6 ngang', w: 148, h: 105 },
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

function findTier(tiers, qty) {
    if (!tiers || tiers.length === 0) return null;
    const sorted = [...tiers].sort((a, b) => a.max - b.max);
    for (const t of sorted) { if (qty <= t.max) return t; }
    return sorted[sorted.length - 1];
}

// Helper: get all papers from paperPricing for a given printSizeId
function getPapersForSize(paperSettings, sizeId) {
    const pp = paperSettings.paperPricing?.find(p => String(p.printSizeId) === String(sizeId));
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

// Paper Row for cover/inner — synced UI with In Nhanh
function PaperRow({ item, index, papers, laminations, onUpdate, onRemove, canRemove }) {
    // Build composite lam value: "2" for id=2 1side, "2_2mat" for 2-side
    const lamValue = item.lamDoubleSide ? `${item.laminationId}_2mat` : String(item.laminationId);
    const isCustomPaper = item.paperId === '__custom__';

    const handleLamChange = (e) => {
        const val = String(e.target.value);
        if (val.endsWith('_2mat')) {
            onUpdate(index, 'laminationId', Number(val.replace('_2mat', '')));
            onUpdate(index, 'lamDoubleSide', true);
        } else {
            onUpdate(index, 'laminationId', Number(val));
            onUpdate(index, 'lamDoubleSide', false);
        }
    };

    const handlePaperChange = (e) => {
        const val = e.target.value;
        onUpdate(index, 'paperId', val);
        if (val !== '__custom__') {
            onUpdate(index, 'customPrice', '');
            onUpdate(index, 'customPaperName', '');
        }
    };

    return (
        <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.background.default, 0.5), border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                {/* Loại giấy — Autocomplete with search & grouping */}
                <Autocomplete
                    size="small"
                    sx={{ minWidth: 190, flex: 1.2 }}
                    options={(() => {
                        const PAPER_GROUPS = {
                            'C': 'Couché (C)', 'FO': 'Ford (FO)', 'I': 'Ivory (I)',
                            'Decal': 'Decal', 'D': 'Duplex (D)', 'B': 'Bristol (B)',
                            'Kraft': 'Kraft',
                        };
                        const grouped = papers.map(p => {
                            const name = p.name || '';
                            let group = 'Khác';
                            for (const [prefix, label] of Object.entries(PAPER_GROUPS)) {
                                if (name.startsWith(prefix)) { group = label; break; }
                            }
                            return { ...p, _id: p.id || p.name, group };
                        });
                        grouped.push({ _id: '__custom__', id: '__custom__', name: '✏️ Loại giấy khác', group: '⚡ Tuỳ chọn' });
                        return grouped;
                    })()}
                    groupBy={(option) => option.group}
                    getOptionLabel={(option) => option.name || ''}
                    value={(() => {
                        if (!item.paperId) return null;
                        if (item.paperId === '__custom__') return { _id: '__custom__', id: '__custom__', name: '✏️ Loại giấy khác', group: '⚡ Tuỳ chọn' };
                        const found = papers.find(pp => (pp.id || pp.name) === item.paperId);
                        return found ? { ...found, _id: found.id || found.name } : null;
                    })()}
                    onChange={(_, newValue) => {
                        if (!newValue) {
                            onUpdate(index, 'paperId', '');
                            onUpdate(index, 'customPrice', '');
                            onUpdate(index, 'customPaperName', '');
                        } else if (newValue._id === '__custom__') {
                            onUpdate(index, 'paperId', '__custom__');
                        } else {
                            onUpdate(index, 'paperId', newValue._id);
                            onUpdate(index, 'customPrice', '');
                            onUpdate(index, 'customPaperName', '');
                        }
                    }}
                    isOptionEqualToValue={(option, value) => option._id === value?._id}
                    noOptionsText="Không tìm thấy giấy"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Loại giấy"
                            placeholder="Tìm giấy..."
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <>
                                        <InputAdornment position="start">
                                            <Iconify icon="solar:layers-minimalistic-bold" width={18} sx={{ color: 'info.main' }} />
                                        </InputAdornment>
                                        {params.InputProps.startAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option._id}>
                            {option._id === '__custom__' ? (
                                <Typography variant="body2" fontWeight={700} color="warning.main">{option.name}</Typography>
                            ) : (
                                <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                            )}
                        </li>
                    )}
                    renderGroup={(params) => (
                        <li key={params.key}>
                            <Box sx={{
                                position: 'sticky', top: -8, py: 0.5, px: 2,
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                                borderBottom: '1px solid', borderColor: 'divider',
                            }}>
                                <Typography variant="caption" fontWeight={800} color="primary.main"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                                    {params.group}
                                </Typography>
                            </Box>
                            <Box component="ul" sx={{ p: 0 }}>{params.children}</Box>
                        </li>
                    )}
                    slotProps={{
                        paper: {
                            sx: {
                                borderRadius: 2,
                                boxShadow: (t) => t.shadows[8],
                                '& .MuiAutocomplete-listbox': {
                                    py: 0,
                                    maxHeight: 300,
                                },
                                '& .MuiAutocomplete-option': { py: 0.8, px: 2, minHeight: 34 },
                            },
                        },
                    }}
                />

                {/* Số mặt in */}
                <FormControl size="small" sx={{ minWidth: 120, flex: 0.8 }}>
                    <InputLabel>Số mặt in</InputLabel>
                    <Select value={item.printSides} label="Số mặt in"
                        onChange={e => onUpdate(index, 'printSides', e.target.value)}
                        startAdornment={<InputAdornment position="start"><Iconify icon="solar:document-bold" width={18} sx={{ color: 'text.secondary' }} /></InputAdornment>}>
                        <MenuItem value={1}>In 1 mặt</MenuItem>
                        <MenuItem value={2}>In 2 mặt</MenuItem>
                    </Select>
                </FormControl>

                {/* Cán màng - giống In Nhanh (có option 2 mặt) */}
                <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                    <InputLabel>Cán màng</InputLabel>
                    <Select value={lamValue} label="Cán màng"
                        onChange={handleLamChange}
                        startAdornment={<InputAdornment position="start"><Iconify icon="solar:layers-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>}>
                        {laminations.map(l => {
                            if (l.id === 1) {
                                return <MenuItem key={l.id} value={String(l.id)}>{l.name}</MenuItem>;
                            }
                            return [
                                <MenuItem key={l.id} value={String(l.id)}>
                                    {l.name} (1 mặt)
                                </MenuItem>,
                                <MenuItem key={`${l.id}_2mat`} value={`${l.id}_2mat`}
                                    sx={{ pl: 4, color: 'warning.dark', fontWeight: 600 }}>
                                    {l.name} (2 mặt)
                                    <Chip label="×2" size="small" color="warning" variant="soft"
                                        sx={{ ml: 1, height: 18, fontSize: 10, fontWeight: 800 }} />
                                </MenuItem>,
                            ];
                        })}
                    </Select>
                </FormControl>

                {canRemove && (
                    <IconButton size="small" color="error" onClick={() => onRemove(index)}>
                        <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                    </IconButton>
                )}
            </Stack>

            {/* Tuỳ chọn giấy — giống In Nhanh */}
            <Collapse in={isCustomPaper}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center"
                    sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.04), border: '1px dashed', borderColor: (t) => alpha(t.palette.warning.main, 0.3) }}>
                    <TextField size="small" label="Tên giấy" value={item.customPaperName || ''}
                        onChange={e => onUpdate(index, 'customPaperName', e.target.value)}
                        placeholder="VD: Couche 200gsm"
                        InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="solar:document-text-bold" width={18} sx={{ color: 'info.main' }} /></InputAdornment> }}
                        sx={{ flex: 1 }} />
                    <TextField size="small" label="Giá giấy" type="number" value={item.customPrice || ''}
                        onChange={e => onUpdate(index, 'customPrice', e.target.value)}
                        placeholder="Nhập giá"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Iconify icon="solar:tag-price-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>,
                            endAdornment: <InputAdornment position="end">đ/tờ</InputAdornment>,
                        }}
                        sx={{ flex: 1 }} />
                </Stack>
            </Collapse>
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
        { paperId: '', printSides: 1, laminationId: 1, lamDoubleSide: false, showCustomPrice: false, customPrice: '' }
    ]);
    const [innerPapers, setInnerPapers] = useState([
        { paperId: '', printSides: 1, laminationId: 1, lamDoubleSide: false, showCustomPrice: false, customPrice: '' }
    ]);
    const [catName, setCatName] = useState('');
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
            return getPapersForSize(paperSettings, printSizeId);
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

    // Auto-select first print size when available
    useEffect(() => {
        if (printSizes.length > 0 && !printSizeId) {
            setPrintSizeId(String(printSizes[0].id));
        }
    }, [printSizes, printSizeId]);

    // A4 ngang → mặc định khổ giấy in 330×610mm
    const SIZE_330x610_ID = '1772942053499';
    useEffect(() => {
        if (catSize === 'A4_land') {
            const has610 = printSizes.find(s => String(s.id) === SIZE_330x610_ID);
            if (has610) setPrintSizeId(SIZE_330x610_ID);
        }
    }, [catSize, printSizes]);

    // Calculated info
    const innerPages = Math.max(0, pages - 4);

    // Catalogue dimensions
    const sizePreset = CAT_SIZES.find(s => s.value === catSize);
    const catW = isCustomSize ? (Number(customW) || 0) : sizePreset?.w || 0;
    const catH = isCustomSize ? (Number(customH) || 0) : sizePreset?.h || 0;

    // ====== PHÂN BIỆT KIỂU ĐÓNG CUỐN ======
    // Ghim giữa (id=1): tờ trải gấp đôi → 1 tờ = 4 trang
    // Lò xo (id=3), Keo gáy (id=2): trang rời, KHÔNG gấp
    const isFoldedBinding = bindId === 1; // Chỉ Ghim giữa là gấp đôi

    // Số mặt in (lấy từ giấy ruột đầu tiên)
    const innerPrintSides = innerPapers[0]?.printSides || 1;
    const coverPrintSides = coverPapers[0]?.printSides || 1;

    // Số tờ giấy thành phẩm ruột / cuốn
    let innerSheetsPerBook;
    if (isFoldedBinding) {
        // Ghim giữa: 1 tờ trải gấp đôi = 4 trang
        innerSheetsPerBook = Math.ceil(innerPages / 4);
    } else {
        // Lò xo / Keo gáy: trang rời
        // In 1 mặt: mỗi tờ giấy = 1 trang → cần innerPages tờ
        // In 2 mặt: mỗi tờ giấy = 2 trang → cần ceil(innerPages/2) tờ
        innerSheetsPerBook = innerPrintSides === 2
            ? Math.ceil(innerPages / 2)
            : innerPages;
    }

    // Kích thước đơn vị xếp trên tờ in
    // Ghim giữa: tờ trải = gấp đôi chiều rộng (spreadW = catW × 2)
    // Lò xo/Keo gáy: trang đơn (unitW = catW, không gấp)
    const unitW = isFoldedBinding ? catW * 2 : catW;
    const unitH = catH;

    // Imposition: bao nhiêu đơn vị (tờ trải hoặc trang) vừa trên 1 tờ giấy in
    const selectedSheet = printSizes.find(s => String(s.id) === String(printSizeId));
    const sheetW = selectedSheet?.w || 325;
    const sheetH = selectedSheet?.h || 430;
    const MARGIN = 5; // 5mm lề mỗi bên
    const printableW = sheetW - MARGIN * 2;
    const printableH = sheetH - MARGIN * 2;

    const imposition = useMemo(() => {
        if (unitW <= 0 || unitH <= 0) return 1;
        // Thử 2 hướng: thẳng và xoay 90°
        const imp1 = Math.floor(printableW / unitW) * Math.floor(printableH / unitH);
        const imp2 = Math.floor(printableW / unitH) * Math.floor(printableH / unitW);
        return Math.max(imp1, imp2, 1);
    }, [unitW, unitH, printableW, printableH]);

    // Số đơn vị bìa / cuốn
    // Ghim giữa: 1 tờ trải bìa (4 trang bìa trên 1 tờ gấp)
    // Lò xo/Keo gáy: 2 tờ bìa riêng (bìa trước + bìa sau)
    const coverUnitsPerBook = isFoldedBinding ? 1 : 2;

    // Tổng tờ in (có imposition)
    const totalCoverUnits = coverUnitsPerBook * numQty;
    const totalInnerUnits = innerSheetsPerBook * numQty;
    const totalCoverSheets = numQty > 0 ? Math.ceil(totalCoverUnits / imposition) : 0;
    const totalInnerSheets = numQty > 0 ? Math.ceil(totalInnerUnits / imposition) : 0;

    // Extra costs
    const totalExtraCosts = extraCostItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const addExtraCost = () => setExtraCostItems([...extraCostItems, { name: '', amount: '' }]);
    const updateExtraCost = (idx, field, val) => setExtraCostItems(extraCostItems.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    const removeExtraCost = (idx) => setExtraCostItems(extraCostItems.filter((_, i) => i !== idx));

    // Cover/Inner papers helpers — use functional setState to avoid stale state
    const updateCover = (idx, field, val) => setCoverPapers(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    const updateInner = (idx, field, val) => setInnerPapers(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    // Get paper price (using custom or tier)
    const getPaperPrice = useCallback((paperItem, papers) => {
        // Custom paper: use entered price
        if (paperItem.paperId === '__custom__' && paperItem.customPrice) return Number(paperItem.customPrice);
        if (!paperItem.paperId || paperItem.paperId === '__custom__') return 0;
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

        const printPrice = catSettings.printPrice; // fallback giá in cũ
        const currentPrintSizeId = printSizeId ? parseInt(printSizeId) : null;

        // Helper: lấy giá in theo khổ giấy từ printPricingBySize (ưu tiên) hoặc fallback catSettings.printPrice
        const getPerSheetPrintPrice = (sheets, printSides) => {
            const pricingBySize = paperSettings.printPricingBySize;
            if (Array.isArray(pricingBySize) && pricingBySize.length > 0 && currentPrintSizeId) {
                const sizeData = pricingBySize.find(pp => pp.printSizeId === currentPrintSizeId);
                if (sizeData && sizeData.tiers && sizeData.tiers.length > 0) {
                    const sides = printSides || 1;
                    const totalSides = sheets * sides;
                    const pricePerSide = findTierPrice(sizeData.tiers, totalSides);
                    return pricePerSide * sides;
                }
            }
            // Fallback: printOptions from paper settings (In 1 mặt)
            const oneSideOpt = paperSettings.printOptions?.find(o => o.id === 1);
            if (oneSideOpt?.tiers?.length > 0) {
                const sides = printSides || 1;
                const totalSides = sheets * sides;
                const pricePerSide = findTierPrice(oneSideOpt.tiers, totalSides);
                return pricePerSide * sides;
            }
            // Final fallback: catalogue flat price
            return printPrice * (printSides || 1);
        };

        // Helper: lấy giá cán màng theo khổ giấy từ laminationPricing (ưu tiên) hoặc fallback laminations.tiers
        const getLamCostPerSheet = (lamId2, totalSheets) => {
            if (!lamId2 || lamId2 === 1) return 0;
            // Ưu tiên: laminationPricing theo khổ giấy
            if (currentPrintSizeId && paperSettings.laminationPricing?.length > 0) {
                const pricing = paperSettings.laminationPricing.find(
                    lp => lp.printSizeId === currentPrintSizeId && lp.lamId === lamId2
                );
                if (pricing?.tiers?.length > 0) {
                    return findTierPrice(pricing.tiers, totalSheets);
                }
            }
            // Fallback: laminations global tiers
            const lam = sharedLaminations.find(l => l.id === lamId2);
            if (lam?.tiers) return findTierPrice(lam.tiers, totalSheets);
            return 0;
        };

        // Calculate cover costs
        let coverCost = 0, coverPrintCost = 0, coverLamCost = 0;
        coverPapers.forEach(cp => {
            const price = getPaperPrice(cp, availablePapers);
            coverCost += totalCoverSheets * price;
            if (cp.printSides > 0) {
                coverPrintCost += totalCoverSheets * getPerSheetPrintPrice(totalCoverSheets, cp.printSides);
            }
            if (cp.laminationId && cp.laminationId !== 1) {
                const lamSides = cp.lamDoubleSide ? 2 : 1;
                coverLamCost += totalCoverSheets * getLamCostPerSheet(cp.laminationId, totalCoverSheets) * lamSides;
            }
        });

        // Calculate inner costs
        let innerCost = 0, innerPrintCost = 0, innerLamCost = 0;
        innerPapers.forEach(ip => {
            const price = getPaperPrice(ip, availablePapers);
            innerCost += totalInnerSheets * price;
            if (ip.printSides > 0) {
                innerPrintCost += totalInnerSheets * getPerSheetPrintPrice(totalInnerSheets, ip.printSides);
            }
            if (ip.laminationId && ip.laminationId !== 1) {
                const lamSides = ip.lamDoubleSide ? 2 : 1;
                innerLamCost += totalInnerSheets * getLamCostPerSheet(ip.laminationId, totalInnerSheets) * lamSides;
            }
        });

        // Binding
        const bind = catSettings.bindings.find(b => b.id === bindId);
        const matchedBindTier = findTier(bind?.tiers, numQty);
        const bindBasePrice = matchedBindTier?.price || 0;
        const bindPerPage = matchedBindTier?.pricePerPage || 0;
        const bindUnit = matchedBindTier?.unit || 'per_item';
        const bindIsLot = bindUnit === 'per_lot';
        // đ/lô: phí lô cố định + SL × trang × phụ thu
        // đ/cuốn: SL × (giá/cuốn + trang × phụ thu)
        const bindPageTotal = bindPerPage * pages;
        const bindCost = bindIsLot
            ? bindBasePrice + (numQty * bindPageTotal)
            : numQty * (bindBasePrice + bindPageTotal);

        const totalCost = coverCost + coverPrintCost + coverLamCost + innerCost + innerPrintCost + innerLamCost + bindCost + totalExtraCosts;
        const costPerItem = totalCost / numQty;
        const cust = sharedCustomerTypes.find(c => c.id === custId);
        const profitPercent = cust?.profit || 25;
        const sellPerItem = Math.round(costPerItem * (1 + profitPercent / 100));
        const totalSell = sellPerItem * numQty;
        const profit = totalSell - totalCost;

        // Paper names for display
        const fmtN = (v) => Math.round(v).toLocaleString('vi-VN');
        const coverPaperName = coverPapers.map(cp => {
            if (cp.paperId === '__custom__') return cp.customPaperName || 'Giấy tuỳ chọn';
            const p = availablePapers.find(pp => (pp.id || pp.name) === cp.paperId);
            return p?.name || '';
        }).filter(Boolean).join(', ') || 'Giấy bìa';
        const innerPaperName = innerPapers.map(ip => {
            if (ip.paperId === '__custom__') return ip.customPaperName || 'Giấy tuỳ chọn';
            const p = availablePapers.find(pp => (pp.id || pp.name) === ip.paperId);
            return p?.name || '';
        }).filter(Boolean).join(', ') || 'Giấy ruột';

        const coverPricePerSheet = coverPapers.length > 0 ? getPaperPrice(coverPapers[0], availablePapers) : 0;
        const innerPricePerSheet = innerPapers.length > 0 ? getPaperPrice(innerPapers[0], availablePapers) : 0;
        const coverPrintPerSheet = coverPapers.length > 0 && coverPapers[0].printSides > 0 ? getPerSheetPrintPrice(totalCoverSheets, coverPapers[0].printSides) : 0;
        const innerPrintPerSheet = innerPapers.length > 0 && innerPapers[0].printSides > 0 ? getPerSheetPrintPrice(totalInnerSheets, innerPapers[0].printSides) : 0;

        const coverLamName = coverPapers.map(cp => {
            const l = sharedLaminations.find(ll => ll.id === cp.laminationId);
            return l?.id !== 1 ? (l?.name + (cp.lamDoubleSide ? ' (2 mặt)' : ' (1 mặt)')) : null;
        }).filter(Boolean).join(', ') || '';
        const innerLamName = innerPapers.map(ip => {
            const l = sharedLaminations.find(ll => ll.id === ip.laminationId);
            return l?.id !== 1 ? (l?.name + (ip.lamDoubleSide ? ' (2 mặt)' : ' (1 mặt)')) : null;
        }).filter(Boolean).join(', ') || '';


        // Get per-side print price for detail display
        const cp0 = coverPapers[0];
        const ip0 = innerPapers[0];
        const coverSides = cp0?.printSides || 1;
        const innerSides = ip0?.printSides || 1;
        const coverTotalSides = totalCoverSheets * coverSides;
        const innerTotalSides = totalInnerSheets * innerSides;

        // Per-side price (for display — getPerSheetPrintPrice returns per-sheet, divide by sides)
        const coverPrintPerSide = coverSides > 0 && coverPrintPerSheet > 0 ? Math.round(coverPrintPerSheet / coverSides) : 0;
        const innerPrintPerSide = innerSides > 0 && innerPrintPerSheet > 0 ? Math.round(innerPrintPerSheet / innerSides) : 0;

        // Lam per-side detail
        const coverLamPerSheet = coverLamCost > 0 && totalCoverSheets > 0 ? Math.round(coverLamCost / totalCoverSheets) : 0;
        const coverLamSides2 = cp0?.lamDoubleSide ? 2 : 1;
        const innerLamPerSheet = innerLamCost > 0 && totalInnerSheets > 0 ? Math.round(innerLamCost / totalInnerSheets) : 0;
        const innerLamSides2 = ip0?.lamDoubleSide ? 2 : 1;

        setResult({
            qty: numQty, pages, sellPerItem, totalSell, totalCost, profit,
            profitPercent: totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0,
            breakdown: [
                {
                    emoji: '📄', label: `Giấy bìa — ${coverPaperName}`, color: 'primary', value: coverCost,
                    lines: [
                        `Mốc ${fmtN(totalCoverSheets)} tờ → ${fmtN(coverPricePerSheet)}đ/tờ`,
                        `${fmtN(totalCoverSheets)} tờ × ${fmtN(coverPricePerSheet)}đ/tờ = ${formatMoney(coverCost)}`,
                    ],
                },
                {
                    emoji: '🖨️', label: `In bìa (${coverSides === 2 ? '2 mặt' : '1 mặt'})`, color: 'info', value: coverPrintCost,
                    lines: coverSides === 2 ? [
                        `Mặt in: ${fmtN(totalCoverSheets)} tờ × ${coverSides} mặt = ${fmtN(coverTotalSides)} mặt in`,
                        `Mốc ${fmtN(coverTotalSides)} mặt → ${fmtN(coverPrintPerSide)}đ/mặt`,
                        `${fmtN(coverTotalSides)} mặt × ${fmtN(coverPrintPerSide)}đ = ${formatMoney(coverPrintCost)}`,
                    ] : [
                        `Mốc ${fmtN(totalCoverSheets)} tờ → ${fmtN(coverPrintPerSheet)}đ/tờ`,
                        `${fmtN(totalCoverSheets)} tờ × ${fmtN(coverPrintPerSheet)}đ = ${formatMoney(coverPrintCost)}`,
                    ],
                },
                ...(coverLamCost > 0 ? [{
                    emoji: '✨', label: `Cán màng bìa — ${coverLamName}`, color: 'warning', value: coverLamCost,
                    lines: (() => {
                        const lines = [];
                        if (coverLamSides2 === 2) lines.push(`Mặt cán: ${fmtN(totalCoverSheets)} tờ × 2 mặt = ${fmtN(totalCoverSheets * 2)} mặt`);
                        lines.push(`${fmtN(totalCoverSheets * coverLamSides2)} mặt × ${fmtN(Math.round(coverLamPerSheet / coverLamSides2))}đ/mặt = ${formatMoney(coverLamCost)}`);
                        return lines;
                    })(),
                }] : []),
                {
                    emoji: '📋', label: `Giấy ruột — ${innerPaperName}`, color: 'primary', value: innerCost,
                    lines: [
                        `Mốc ${fmtN(totalInnerSheets)} tờ → ${fmtN(innerPricePerSheet)}đ/tờ`,
                        `${fmtN(totalInnerSheets)} tờ × ${fmtN(innerPricePerSheet)}đ/tờ = ${formatMoney(innerCost)}`,
                    ],
                },
                {
                    emoji: '🖨️', label: `In ruột (${innerSides === 2 ? '2 mặt' : '1 mặt'})`, color: 'info', value: innerPrintCost,
                    lines: innerSides === 2 ? [
                        `Mặt in: ${fmtN(totalInnerSheets)} tờ × ${innerSides} mặt = ${fmtN(innerTotalSides)} mặt in`,
                        `Mốc ${fmtN(innerTotalSides)} mặt → ${fmtN(innerPrintPerSide)}đ/mặt`,
                        `${fmtN(innerTotalSides)} mặt × ${fmtN(innerPrintPerSide)}đ = ${formatMoney(innerPrintCost)}`,
                    ] : [
                        `Mốc ${fmtN(totalInnerSheets)} tờ → ${fmtN(innerPrintPerSheet)}đ/tờ`,
                        `${fmtN(totalInnerSheets)} tờ × ${fmtN(innerPrintPerSheet)}đ = ${formatMoney(innerPrintCost)}`,
                    ],
                },
                ...(innerLamCost > 0 ? [{
                    emoji: '✨', label: `Cán màng ruột — ${innerLamName}`, color: 'warning', value: innerLamCost,
                    lines: (() => {
                        const lines = [];
                        if (innerLamSides2 === 2) lines.push(`Mặt cán: ${fmtN(totalInnerSheets)} tờ × 2 mặt = ${fmtN(totalInnerSheets * 2)} mặt`);
                        lines.push(`${fmtN(totalInnerSheets * innerLamSides2)} mặt × ${fmtN(Math.round(innerLamPerSheet / innerLamSides2))}đ/mặt = ${formatMoney(innerLamCost)}`);
                        return lines;
                    })(),
                }] : []),
                {
                    emoji: '📎', label: `Đóng cuốn — ${bind?.name || ''}`, color: 'error', value: bindCost,
                    lines: (() => {
                        const lines = [];
                        if (bindIsLot) {
                            lines.push(`Phí lô: ${formatMoney(bindBasePrice)} (mốc ${fmtN(numQty)} cuốn)`);
                            if (bindPageTotal > 0) {
                                lines.push(`Phụ thu: ${fmtN(numQty)} cuốn × ${pages} trang × ${fmtN(bindPerPage)}đ = ${formatMoney(numQty * bindPageTotal)}`);
                                lines.push(`Tổng: ${formatMoney(bindBasePrice)} + ${formatMoney(numQty * bindPageTotal)} = ${formatMoney(bindCost)}`);
                            }
                        } else {
                            lines.push(`Mốc ${fmtN(numQty)} cuốn → ${fmtN(bindBasePrice)}đ/cuốn`);
                            if (bindPageTotal > 0) {
                                lines.push(`Phụ thu: ${pages} trang × ${fmtN(bindPerPage)}đ/trang = ${fmtN(bindPageTotal)}đ/cuốn`);
                                lines.push(`Đơn giá: ${fmtN(bindBasePrice)} + ${fmtN(bindPageTotal)} = ${fmtN(bindBasePrice + bindPageTotal)}đ/cuốn`);
                            }
                            lines.push(`${fmtN(numQty)} cuốn × ${fmtN(bindBasePrice + bindPageTotal)}đ = ${formatMoney(bindCost)}`);
                        }
                        return lines;
                    })(),
                },
                ...(totalExtraCosts > 0 ? [{
                    emoji: '💰', label: 'Chi phí khác', color: 'secondary', value: totalExtraCosts,
                    lines: extraCostItems.filter(i => Number(i.amount) > 0).map(i => `${i.name || 'Chi phí'}: ${formatMoney(Number(i.amount))}`),
                }] : []),
            ].filter(r => r.value > 0),
        });

        // Save to history
        const coverPaperNames = coverPapers.map(cp => {
            const p = availablePapers.find(pp => (pp.id || pp.name) === cp.paperId);
            return p?.name || '';
        }).filter(Boolean).join(', ');
        const innerPaperNames = innerPapers.map(ip => {
            const p = availablePapers.find(pp => (pp.id || pp.name) === ip.paperId);
            return p?.name || '';
        }).filter(Boolean).join(', ');
        const histCoverLamName = coverPapers.map(cp => {
            const l = sharedLaminations.find(ll => ll.id === cp.laminationId);
            return l?.id !== 1 ? (l?.name + (cp.lamDoubleSide ? ' (2 mặt)' : ' (1 mặt)')) : null;
        }).filter(Boolean).join(', ') || 'Không cán';
        const histInnerLamName = innerPapers.map(ip => {
            const l = sharedLaminations.find(ll => ll.id === ip.laminationId);
            return l?.id !== 1 ? (l?.name + (ip.lamDoubleSide ? ' (2 mặt)' : ' (1 mặt)')) : null;
        }).filter(Boolean).join(', ') || 'Không cán';
        const bindName = bind?.name || '';
        const printSizeName = printSizes.find(s => String(s.id) === String(printSizeId))?.name || '';
        const entry = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            catName: catName || 'Catalogue',
            catSize: sizePreset?.label || 'Tuỳ chọn',
            catW, catH, pages, qty: numQty,
            coverPaperNames, innerPaperNames,
            coverPrintSides: coverPapers[0]?.printSides || 1,
            innerPrintSides: innerPapers[0]?.printSides || 1,
            coverLamName: histCoverLamName, innerLamName: histInnerLamName,
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
    }, [numQty, pages, coverPapers, innerPapers, bindId, custId, catSettings, totalExtraCosts, availablePapers, getPaperPrice, isCustomSize, customW, customH, totalCoverSheets, totalInnerSheets, sharedLaminations, sharedCustomerTypes, paperSettings, printSizeId]);

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
  <div class="section-title">📋 Thông tin Catalogue</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Kích thước</div><div class="info-value">${ent.catSize} (${ent.catW}×${ent.catH})</div></div>
    <div class="info-item"><div class="info-label">Số trang</div><div class="info-value">${ent.pages} trang</div></div>
    <div class="info-item"><div class="info-label">Số lượng</div><div class="info-value">${Number(ent.qty).toLocaleString('vi-VN')} cuốn</div></div>
    <div class="info-item"><div class="info-label">Khổ giấy in</div><div class="info-value">${ent.printSizeName || '—'}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📄 Bìa</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Loại giấy</div><div class="info-value">${ent.coverPaperNames || '—'}</div></div>
    <div class="info-item"><div class="info-label">Quy cách in</div><div class="info-value">In ${ent.coverPrintSides === 2 ? '2 mặt' : '1 mặt'}</div></div>
    <div class="info-item"><div class="info-label">Cán màng</div><div class="info-value">${ent.coverLamName}</div></div>
    <div class="info-item"><div class="info-label">Tờ in bìa</div><div class="info-value">${Number(ent.totalCoverSheets).toLocaleString('vi-VN')} tờ</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📋 Ruột</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Loại giấy</div><div class="info-value">${ent.innerPaperNames || '—'}</div></div>
    <div class="info-item"><div class="info-label">Quy cách in</div><div class="info-value">In ${ent.innerPrintSides === 2 ? '2 mặt' : '1 mặt'}</div></div>
    <div class="info-item"><div class="info-label">Cán màng</div><div class="info-value">${ent.innerLamName}</div></div>
    <div class="info-item"><div class="info-label">Tờ in ruột</div><div class="info-value">${Number(ent.totalInnerSheets).toLocaleString('vi-VN')} tờ</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📎 Đóng cuốn</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Quy cách</div><div class="info-value">${ent.bindName}</div></div>
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
            (h.catName || '').toLowerCase().includes(q) ||
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
                <Badge badgeContent={priceHistory.length} color="primary" max={99}
                    sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: 11 } }}>
                    <Button
                        variant="outlined" color="primary"
                        startIcon={<Iconify icon="solar:history-bold" />}
                        onClick={() => setHistoryOpen(true)}
                        sx={{ fontWeight: 700, borderRadius: 2, px: 2.5 }}
                    >
                        Lịch sử
                    </Button>
                </Badge>
            </Stack>

            <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2], mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    {/* QUY CÁCH CATALOGUE */}
                    <SectionHeader icon="solar:ruler-angular-bold-duotone" title="QUY CÁCH CATALOGUE" color="warning" theme={theme} borderColor />

                    <TextField size="small" fullWidth label="Tên Catalogue" placeholder="VD: Catalogue sản phẩm ABC" value={catName}
                        onChange={e => setCatName(e.target.value)} sx={{ mb: 2 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="solar:document-text-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment> }} />

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
                            <Select value={printSizeId} label="Khổ giấy in"
                                onChange={e => setPrintSizeId(e.target.value)}
                                disabled={catSize === 'A4_land'}>
                                {printSizes.length > 0 ? printSizes.map(s => (
                                    <MenuItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </MenuItem>
                                )) : (
                                    <MenuItem value="" disabled>Chưa có khổ giấy — Thêm ở Cài đặt giá</MenuItem>
                                )}
                            </Select>
                            {catSize === 'A4_land' && (
                                <Typography variant="caption" color="info.main" sx={{ mt: 0.5, ml: 0.5 }}>
                                    A4 ngang → mặc định 330 × 610 mm
                                </Typography>
                            )}
                        </FormControl>
                    </Stack>

                    {/* 5 thẻ thông tin */}
                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                        <InfoCard label="SỐ TRANG BÌA" value="4 trang" color="error" icon="📄" theme={theme} />
                        <InfoCard label="TỔNG TỜ IN BÌA" value={`${numQty > 0 ? totalCoverSheets.toLocaleString('vi-VN') : 0} tờ`} color="primary" icon="🖨" theme={theme} />
                        <InfoCard label="SỐ TRANG RUỘT" value={`${innerPages} trang`} color="success" icon="📋" theme={theme} />
                        <InfoCard label="TỔNG TỜ IN RUỘT" value={`${numQty > 0 ? totalInnerSheets.toLocaleString('vi-VN') : 0} tờ`} color="info" icon="📑" theme={theme} />
                        <InfoCard label={isFoldedBinding ? 'SP / TỜ IN' : 'TRANG / TỜ IN'} value={`${imposition} ${isFoldedBinding ? 'sp' : 'trang'}`} color="warning" icon="📐" theme={theme} />
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
                            <TextField size="small" placeholder="Số tiền" type="number" value={item.amount} sx={{ width: 220 }}
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
                        <Button variant="contained" size="large" onClick={() => { playCalculateSound(); calculate(); }}
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

            {/* RESULT — synced with In Nhanh style */}
            <Collapse in={!!result}>
                {result && (
                    <Card sx={{
                        borderRadius: 3, boxShadow: theme.shadows[4], overflow: 'visible', mt: 3,
                        animation: 'slideUp 0.4s ease',
                        '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            {/* Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                        color: 'white',
                                    }}>
                                        <Iconify icon="solar:chart-bold" width={22} />
                                    </Box>
                                    <Typography variant="h6" fontWeight={800}>Kết quả tính giá</Typography>
                                </Stack>
                                <Button size="small" variant="soft" color="inherit"
                                    onClick={() => setShowDetail(!showDetail)}
                                    startIcon={<Iconify icon={showDetail ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />}>
                                    {showDetail ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                </Button>
                            </Stack>

                            {/* Summary cards */}
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                {[
                                    { label: 'Số lượng', value: `${result.qty.toLocaleString('vi-VN')} cuốn`, color: 'warning', icon: 'solar:layers-bold-duotone' },
                                    { label: 'Đơn giá / cuốn', value: formatMoney(result.sellPerItem), color: 'success', icon: 'solar:tag-price-bold-duotone' },
                                    { label: 'Tổng tiền', value: formatMoney(result.totalSell), color: 'info', icon: 'solar:wallet-money-bold-duotone' },
                                ].map((card) => (
                                    <Grid item xs={4} key={card.label}>
                                        <Box sx={{
                                            p: 2.5, borderRadius: 2, textAlign: 'center', position: 'relative', overflow: 'hidden',
                                            bgcolor: alpha(theme.palette[card.color].main, 0.08),
                                            border: `1px solid ${alpha(theme.palette[card.color].main, 0.16)}`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 16px ${alpha(theme.palette[card.color].main, 0.16)}` },
                                        }}>
                                            <Iconify icon={card.icon} width={28} sx={{
                                                position: 'absolute', top: 12, right: 12,
                                                color: `${card.color}.main`, opacity: 0.2,
                                            }} />
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" sx={{ letterSpacing: 1 }}>
                                                {card.label}
                                            </Typography>
                                            <Typography variant="h4" fontWeight={800} color={`${card.color}.dark`} sx={{ mt: 0.5 }}>
                                                {card.value}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>

                            <Collapse in={showDetail}>
                                {/* Cost breakdown — detailed like In Nhanh */}
                                <Box sx={{
                                    borderRadius: 2, p: 2.5, mb: 2.5,
                                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                                    border: `1px solid ${theme.palette.divider}`,
                                }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                                        💰 Chi tiết chi phí
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {result.breakdown.map((row, idx) => (
                                            <Stack key={idx} direction="row" alignItems="flex-start" justifyContent="space-between"
                                                sx={{
                                                    py: 1.25, px: 1.5, borderRadius: 1.5,
                                                    '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.06) },
                                                    transition: 'background 0.2s ease',
                                                }}>
                                                <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontSize: 18, mt: 0.25 }}>{row.emoji}</Typography>
                                                    <Stack>
                                                        <Typography variant="body2" fontWeight={700}>{row.label}</Typography>
                                                        {row.lines && row.lines.map((line, li) => (
                                                            <Typography key={li} variant="caption" color="text.secondary"
                                                                sx={{ fontFamily: 'monospace', fontSize: 11.5 }}>
                                                                {line}
                                                            </Typography>
                                                        ))}
                                                    </Stack>
                                                </Stack>
                                                <Typography variant="body2" fontWeight={700} color={`${row.color}.main`} sx={{ mt: 0.25, whiteSpace: 'nowrap' }}>
                                                    {formatMoney(row.value)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Per item cost */}
                                    <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>Giá vốn / cuốn</Typography>
                                        <Typography variant="body2" fontWeight={700}>{formatMoney(result.totalCost / result.qty)}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1, bgcolor: alpha(theme.palette.success.main, 0.06), borderRadius: 1 }}>
                                        <Typography variant="body2" fontWeight={700} color="success.main">Giá bán / cuốn (+{result.profitPercent}%)</Typography>
                                        <Typography variant="body2" fontWeight={700} color="success.main">{formatMoney(result.sellPerItem)}</Typography>
                                    </Stack>
                                </Box>

                                {/* Total bar - gradient */}
                                <Box sx={{
                                    borderRadius: 2, p: 2.5, color: 'white', position: 'relative', overflow: 'hidden',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.info.dark} 100%)`,
                                }}>
                                    <Box sx={{
                                        position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                                        borderRadius: '50%', bgcolor: alpha('#fff', 0.06),
                                    }} />
                                    <Stack direction="row" justifyContent="space-around">
                                        <Box textAlign="center">
                                            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 1.5 }}>Tổng vốn</Typography>
                                            <Typography variant="h5" fontWeight={800}>{formatMoney(result.totalCost)}</Typography>
                                        </Box>
                                        <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.2) }} />
                                        <Box textAlign="center">
                                            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 1.5 }}>Lợi nhuận</Typography>
                                            <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.success.light }}>
                                                +{formatMoney(result.profit)}
                                            </Typography>
                                        </Box>
                                        <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.2) }} />
                                        <Box textAlign="center">
                                            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 1.5 }}>% Lãi</Typography>
                                            <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.warning.light }}>
                                                {result.profitPercent}%
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Collapse>
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
                            <Card key={entry.id} variant="outlined" sx={{
                                mb: 1.5, transition: 'all 0.2s ease',
                                '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
                            }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Stack spacing={0.5} sx={{ flex: 1 }}>
                                            {/* Title row */}
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Chip label={`#${idx + 1}`} size="small" color="primary" variant="soft"
                                                    sx={{ height: 20, fontSize: 11, fontWeight: 700, minWidth: 36 }} />
                                                <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: 180 }}>
                                                    {entry.catName || 'Catalogue'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dateStr} {timeStr}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                                {entry.catSize} ({entry.catW}×{entry.catH})
                                            </Typography>

                                            {/* Info chips */}
                                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                <Chip label={`${entry.pages} trang`} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                                <Chip label={`${Number(entry.qty).toLocaleString('vi-VN')} cuốn`} size="small" color="warning" variant="soft"
                                                    icon={<Iconify icon="solar:layers-bold" width={12} />} sx={{ height: 22, fontSize: 11 }} />
                                                <Chip label={entry.bindName} size="small" variant="soft" color="error" sx={{ height: 22, fontSize: 11 }} />
                                            </Stack>

                                            {/* Price */}
                                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Đơn giá/cuốn</Typography>
                                                    <Typography variant="body2" fontWeight={800} color="success.dark">
                                                        {Number(entry.sellPerItem).toLocaleString('vi-VN')}đ
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Tổng tiền</Typography>
                                                    <Typography variant="body2" fontWeight={800} color="info.dark">
                                                        {Number(entry.totalSell).toLocaleString('vi-VN')}đ
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Stack>

                                        {/* Actions — vertical like In Nhanh */}
                                        <Stack spacing={0.5} sx={{ ml: 1 }}>
                                            <Tooltip title="Xem trước báo giá">
                                                <IconButton size="small" color="success"
                                                    onClick={() => setPreviewEntry(entry)}
                                                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                                                    <Iconify icon="solar:eye-bold" width={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="In / Xuất PDF">
                                                <IconButton size="small" color="primary"
                                                    onClick={() => handleExportQuotation(entry)}
                                                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                                                    <Iconify icon="solar:printer-bold" width={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xoá">
                                                <IconButton size="small" color="error"
                                                    onClick={() => setPriceHistory(prev => {
                                                        const updated = prev.filter(h => h.id !== entry.id);
                                                        localStorage.setItem('netprint_cat_history', JSON.stringify(updated));
                                                        return updated;
                                                    })}
                                                    sx={{ bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                                                    <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
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

                            {/* Section 1: Kích thước */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    📋 Kích thước
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: 'Kích thước', value: `${e.catSize} (${e.catW}×${e.catH})` },
                                        { label: 'Số trang', value: `${e.pages} trang` },
                                        { label: 'Số lượng', value: `${Number(e.qty).toLocaleString('vi-VN')} cuốn` },
                                        { label: 'Khổ giấy in', value: e.printSizeName || '—' },
                                    ].map((item, i) => (
                                        <Grid item xs={4} key={i}>
                                            <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.label}</Typography>
                                                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Section 2: Bìa */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    📄 Bìa
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: 'Loại giấy', value: e.coverPaperNames || '—' },
                                        { label: 'Quy cách in', value: `In ${e.coverPrintSides === 2 ? '2 mặt' : '1 mặt'}` },
                                        { label: 'Cán màng', value: e.coverLamName },
                                        { label: 'Tờ in bìa', value: `${Number(e.totalCoverSheets).toLocaleString('vi-VN')} tờ` },
                                    ].map((item, i) => (
                                        <Grid item xs={4} key={i}>
                                            <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.label}</Typography>
                                                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Section 3: Ruột */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    📋 Ruột
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: 'Loại giấy', value: e.innerPaperNames || '—' },
                                        { label: 'Quy cách in', value: `In ${e.innerPrintSides === 2 ? '2 mặt' : '1 mặt'}` },
                                        { label: 'Cán màng', value: e.innerLamName },
                                        { label: 'Tờ in ruột', value: `${Number(e.totalInnerSheets).toLocaleString('vi-VN')} tờ` },
                                    ].map((item, i) => (
                                        <Grid item xs={4} key={i}>
                                            <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{item.label}</Typography>
                                                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Section 4: Đóng cuốn */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                                    📎 Đóng cuốn
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {[
                                        { label: 'Quy cách', value: e.bindName },
                                    ].map((item, i) => (
                                        <Grid item xs={4} key={i}>
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
