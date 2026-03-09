import { useState, useMemo, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
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
import FormControlLabel from '@mui/material/FormControlLabel';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { loadPaperSettings } from '../data/default-settings';
import PricingSettingsDialog from './pricing-settings-dialog';
import { playCalculateSound, playErrorSound } from '../../../utils/sound';
import {
    formatMoney,
    formatNumber,
    getAllPapers,
    calculateImposition,
    calculateSheetsNeeded,
    calculatePaperPricing,
} from '../utils/pricing-calc';

// Quick size presets
const QUICK_SIZES = [
    { label: 'A3', w: 297, h: 420, desc: '297×420' },
    { label: 'A4', w: 210, h: 297, desc: '210×297' },
    { label: 'A5', w: 148, h: 210, desc: '148×210' },
    { label: 'A6', w: 105, h: 148, desc: '105×148' },
];

// ----------------------------------------------------------------------

export function PricingCalculatorView() {
    const theme = useTheme();
    const [settings, setSettings] = useState(() => loadPaperSettings());
    const [settingsOpen, setSettingsOpen] = useState(false);
    const handleSettingsChanged = useCallback((newSettings) => setSettings({ ...newSettings }), []);

    // Auto-sync when settings changed from Cài đặt giá
    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.type === 'paper') {
                setSettings(loadPaperSettings());
            }
        };
        window.addEventListener('netprint-settings-changed', handler);
        return () => window.removeEventListener('netprint-settings-changed', handler);
    }, []);

    // Form state
    const [prodW, setProdW] = useState('');
    const [prodH, setProdH] = useState('');
    const [qty, setQty] = useState('');
    const [printSizeIdCalc, setPrintSizeIdCalc] = useState('');
    const [paperTypeId, setPaperTypeId] = useState('');
    const [printSideId, setPrintSideId] = useState(1);
    const [lamId, setLamId] = useState(1);
    const [lamDoubleSide, setLamDoubleSide] = useState(false);
    const [custId, setCustId] = useState(settings.customerTypes[0]?.id || 1);
    const [selectedProcs, setSelectedProcs] = useState([]);
    const [spacing, setSpacing] = useState(0);
    const [marginH, setMarginH] = useState(5);
    const [marginV, setMarginV] = useState(5);
    const [waste, setWaste] = useState(0);
    const [allowRotation, setAllowRotation] = useState(true);
    const [activeSize, setActiveSize] = useState('');
    const [extraCostItems, setExtraCostItems] = useState([]);
    const [result, setResult] = useState(null);
    const [showDetail, setShowDetail] = useState(true);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showCustomPrice, setShowCustomPrice] = useState(false);
    const [customPaperPrice, setCustomPaperPrice] = useState('');
    const [customPaperName, setCustomPaperName] = useState('');

    // History
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [previewEntry, setPreviewEntry] = useState(null);
    const [priceHistory, setPriceHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('netprint_price_history') || '[]'); } catch { return []; }
    });

    // Print sizes from settings
    const printSizes = settings.printSizes || [];

    // Auto-select first print size if none selected
    useEffect(() => {
        if (!printSizeIdCalc && printSizes.length > 0) {
            setPrintSizeIdCalc(String(printSizes[0].id));
        }
    }, [printSizes, printSizeIdCalc]);

    const allPapers = useMemo(() => getAllPapers(settings), [settings]);

    // Filter papers by selected print size
    const papers = useMemo(() => {
        if (!printSizeIdCalc) return allPapers;
        return allPapers.filter(p => String(p.printSizeId) === String(printSizeIdCalc));
    }, [allPapers, printSizeIdCalc]);

    const selectedPaper = useMemo(() => allPapers.find(p => p.id === paperTypeId), [allPapers, paperTypeId]);

    // Reset paper selection when print size changes and current paper isn't in filtered list
    useEffect(() => {
        if (paperTypeId && paperTypeId !== '__custom__' && papers.length > 0 && !papers.find(p => p.id === paperTypeId)) {
            setPaperTypeId('');
        }
    }, [printSizeIdCalc, papers, paperTypeId]);

    const numProdW = Number(prodW) || 0;
    const numProdH = Number(prodH) || 0;
    const numQty = Number(qty) || 0;

    // Get the selected print size dimensions
    const selectedPrintSize = useMemo(() => {
        if (!printSizeIdCalc) return null;
        return printSizes.find(s => String(s.id) === String(printSizeIdCalc)) || null;
    }, [printSizeIdCalc, printSizes]);

    const imposition = useMemo(() => {
        if (numProdW <= 0 || numProdH <= 0) return { cols: 0, rows: 0, total: 0, rotated: false };
        const sheetW = selectedPaper?.w || selectedPrintSize?.w || 325;
        const sheetH = selectedPaper?.h || selectedPrintSize?.h || 430;
        const m = { top: marginH, bottom: marginH, left: marginV, right: marginV };
        return calculateImposition(numProdW, numProdH, sheetW, sheetH, 0, m, spacing, allowRotation);
    }, [numProdW, numProdH, selectedPaper, selectedPrintSize, marginH, marginV, spacing, allowRotation]);

    const sheetsPreview = useMemo(() => {
        if (numQty <= 0 || imposition.total <= 0) return 0;
        return calculateSheetsNeeded(numQty, imposition.total) + waste;
    }, [numQty, imposition.total, waste]);

    const handleQuickSize = useCallback((size) => {
        setProdW(String(size.w));
        setProdH(String(size.h));
        setActiveSize(size.label);
    }, []);

    // Processing ID groups for auto imposition presets
    const PROC_CAT = { id: 1 };         // Cắt thành phẩm: margin 5, spacing 3
    const PROC_BE_IDS = [2, 5, 3, 9];   // Bế demi, Bế đứt, Bế + Cấn, Bo góc: margin 10, spacing 3

    const handleProcToggle = useCallback((procId) => {
        setSelectedProcs(prev => {
            const isRemoving = prev.includes(procId);
            const next = isRemoving ? prev.filter(id => id !== procId) : [...prev, procId];

            // Auto-apply imposition preset based on highest-priority proc in new selection
            const hasBeType = next.some(id => PROC_BE_IDS.includes(id));
            const hasCat = next.includes(PROC_CAT.id);

            if (hasBeType) {
                // Bế loại → lề 10mm, khoảng cách 3mm
                setMarginH(10); setMarginV(10); setSpacing(3);
            } else if (hasCat) {
                // Chỉ cắt thành phẩm → lề 5mm, khoảng cách 3mm
                setMarginH(5); setMarginV(5); setSpacing(3);
            }
            // Nếu không chọn gì thì giữ nguyên (user có thể đã tuỳ chỉnh)

            return next;
        });
    }, []);


    const totalExtraCosts = useMemo(() =>
        extraCostItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        [extraCostItems]
    );

    const handleCalculate = useCallback(() => {
        setError('');

        // Validate từng field bắt buộc
        const errs = {};
        if (!numProdW || numProdW <= 0) errs.prodW = 'Nhập chiều rộng';
        if (!numProdH || numProdH <= 0) errs.prodH = 'Nhập chiều cao';
        if (!numQty || numQty <= 0) errs.qty = 'Nhập số lượng';
        if (!printSizeIdCalc) errs.printSizeIdCalc = 'Chọn khổ in';
        if (!paperTypeId) errs.paperTypeId = 'Chọn loại giấy';

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            playErrorSound();
            setError('Vui lòng điền đầy đủ các trường bắt buộc!');
            return;
        }
        setFieldErrors({});

        const res = calculatePaperPricing({
            prodW: numProdW, prodH: numProdH, qty: numQty, paperTypeId, printSideId, lamId, custId,
            extraCosts: totalExtraCosts, selectedProcIds: selectedProcs,
            spacing, marginH, marginV, waste, allowRotation, lamDoubleSide, settings,
            customPaperPrice: showCustomPrice && customPaperPrice ? Number(customPaperPrice) : null,
        });
        if (!res) { setError('Vui lòng nhập đầy đủ thông tin!'); return; }
        if (res.error) { setError(res.error); return; }

        setResult(res);

        // Save to history
        const cust = settings.customerTypes.find(c => c.id === custId);
        const entry = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            prodW: numProdW, prodH: numProdH, qty: numQty,
            paperName: res.paperName,
            printSides: printSideId === 1 ? 'In 1 mặt' : 'In 2 mặt',
            lamName: (settings.laminations.find(l => l.id === lamId)?.name || '') + (lamId !== 1 ? (lamDoubleSide ? ' (2 mặt)' : ' (1 mặt)') : ''),
            procNames: selectedProcs.map(id => settings.processing.find(p => p.id === id)?.name).filter(Boolean),
            custName: cust?.name || '',
            custProfit: cust?.profit || 0,
            sheetSize: res.sheetSize,
            spPerSheet: res.imposition?.total || 0,
            sheets: res.sheets,
            baseSheets: res.baseSheets,
            waste: res.waste,
            spacing,
            marginH,
            marginV,
            sellPerItem: res.sellPerItem,
            totalSell: res.totalSell,
            costPerItem: res.costPerItem,
        };
        setPriceHistory(prev => {
            const updated = [entry, ...prev].slice(0, 50);
            localStorage.setItem('netprint_price_history', JSON.stringify(updated));
            return updated;
        });
    }, [numProdW, numProdH, numQty, paperTypeId, printSideId, lamId, lamDoubleSide, custId, totalExtraCosts, selectedProcs, spacing, marginH, marginV, waste, allowRotation, settings, printSizeIdCalc, showCustomPrice, customPaperPrice]);

    // ===== SECTION HEADER =====
    const SectionHeader = ({ icon, title, color = 'primary' }) => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
            <Box sx={{
                width: 32, height: 32, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(theme.palette[color].main, 0.08),
                color: `${color}.main`,
            }}>
                <Iconify icon={icon} width={18} />
            </Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                {title}
            </Typography>
        </Stack>
    );

    // ===== RENDER: IMPOSITION PREVIEW =====
    const renderImpositionPreview = (
        <Card sx={{
            mb: 3, overflow: 'visible',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.lighter, 0.5)} 0%, ${alpha(theme.palette.info.lighter, 0.3)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        }}>
            <CardContent sx={{ p: 2.5 }}>
                {/* TOP: chip banner */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Chip
                        icon={<Iconify icon="solar:ruler-angular-bold" width={16} />}
                        label={selectedPrintSize ? `${selectedPrintSize.name} (${selectedPrintSize.w}×${selectedPrintSize.h} mm)` : 'Chưa chọn khổ in'}
                        variant="soft" color="primary"
                        sx={{ fontWeight: 700, fontSize: 13 }}
                    />
                    {imposition.rotated && <Chip label="↻ Đã xoay" size="small" color="info" variant="soft" />}
                    {imposition.mixed && <Chip label="🔀 Hỗn hợp" size="small" color="warning" variant="soft" />}
                </Stack>

                {/* MAIN: 3 columns */}
                <Stack direction="row" spacing={2} alignItems="stretch">
                    {/* Column 1: Sheet preview - large */}
                    <Box sx={{
                        flex: 2, minHeight: 170, bgcolor: 'background.paper', borderRadius: 2,
                        border: '2px dashed', borderColor: alpha(theme.palette.primary.main, 0.3),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: theme.palette.primary.main },
                    }}>
                        {imposition.total > 0 ? (() => {
                            const maxCols = imposition.cols;
                            const maxRows = Math.ceil(imposition.total / maxCols);
                            const displayRows = Math.min(maxRows, 12);
                            const displayTotal = Math.min(imposition.total, maxCols * displayRows);
                            const gap = maxCols > 6 ? 2 : 5;
                            return (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
                                    gridTemplateRows: `repeat(${displayRows}, 1fr)`,
                                    gap: `${gap}px`, p: 2,
                                    width: '100%', height: '100%',
                                    boxSizing: 'border-box',
                                }}>
                                    {Array.from({ length: displayTotal }).map((_, i) => (
                                        <Box key={i} sx={{
                                            background: imposition.rotated
                                                ? `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.light})`
                                                : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                            borderRadius: 0.5,
                                            minWidth: 0, minHeight: 0,
                                            animation: `fadeIn 0.3s ease ${Math.min(i, 20) * 0.02}s both`,
                                            '@keyframes fadeIn': { from: { opacity: 0, transform: 'scale(0.5)' }, to: { opacity: 1, transform: 'scale(1)' } },
                                        }} />
                                    ))}
                                </Box>
                            );
                        })() : (
                            <Stack alignItems="center" spacing={1}>
                                <Iconify icon="solar:document-add-bold-duotone" width={44} sx={{ color: 'text.disabled', opacity: 0.35 }} />
                                <Typography variant="caption" color="text.disabled">Nhập kích thước sản phẩm</Typography>
                            </Stack>
                        )}
                    </Box>

                    {/* Column 2: Stat cards */}
                    <Stack spacing={1.5} sx={{ flex: 1 }} justifyContent="center">
                        <Box sx={{
                            p: 2, borderRadius: 2, textAlign: 'center',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)}, ${alpha(theme.palette.success.light, 0.06)})`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}>
                            <Iconify icon="solar:layers-bold" width={22} sx={{ color: 'success.dark', mb: 0.5 }} />
                            <Typography variant="h3" fontWeight={800} color="success.dark" sx={{ lineHeight: 1 }}>
                                {imposition.total}
                            </Typography>
                            <Typography variant="caption" color="success.dark" fontWeight={700} sx={{ opacity: 0.7 }}>
                                SP / TỜ
                            </Typography>
                        </Box>
                        <Box sx={{
                            p: 2, borderRadius: 2, textAlign: 'center',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)}, ${alpha(theme.palette.info.light, 0.06)})`,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        }}>
                            <Iconify icon="solar:printer-bold" width={22} sx={{ color: 'info.dark', mb: 0.5 }} />
                            <Typography variant="h3" fontWeight={800} color="info.dark" sx={{ lineHeight: 1 }}>
                                {sheetsPreview}
                            </Typography>
                            <Typography variant="caption" color="info.dark" fontWeight={700} sx={{ opacity: 0.7 }}>
                                TỜ IN
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Column 3: Settings */}
                    <Stack spacing={1.5} sx={{
                        flex: 1, p: 2, borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                    }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Cài đặt dàn in
                        </Typography>
                        <TextField size="small" label="Khoảng cách" type="number" value={spacing}
                            onChange={e => setSpacing(Number(e.target.value))}
                            InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }} />
                        <Stack direction="row" spacing={1}>
                            <TextField size="small" label="Lề ngang" type="number" value={marginH}
                                onChange={e => setMarginH(Number(e.target.value))}
                                InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }} />
                            <TextField size="small" label="Lề dọc" type="number" value={marginV}
                                onChange={e => setMarginV(Number(e.target.value))}
                                InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }} />
                        </Stack>
                        <TextField size="small" label="Bù hao" type="number" value={waste}
                            onChange={e => setWaste(Number(e.target.value))}
                            InputProps={{ endAdornment: <InputAdornment position="end">tờ</InputAdornment> }} />
                        <Button size="small" variant={allowRotation ? 'contained' : 'outlined'}
                            color={allowRotation ? 'info' : 'inherit'}
                            onClick={() => setAllowRotation(!allowRotation)}
                            fullWidth sx={{ fontWeight: 600, mt: 'auto' }}
                            startIcon={<Iconify icon={allowRotation ? 'solar:refresh-bold' : 'solar:lock-bold'} />}>
                            {allowRotation ? 'Xoay tự động' : 'Cố định hướng'}
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );


    // ===== RENDER: FORM =====
    const renderForm = (
        <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
                {/* Product specs */}
                <SectionHeader icon="solar:box-bold-duotone" title="QUY CÁCH SẢN PHẨM" color="primary" />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
                    <TextField fullWidth label="Chiều rộng *" type="number" value={prodW} sx={{ flex: 1 }}
                        error={!!fieldErrors.prodW}
                        helperText={fieldErrors.prodW || ''}
                        onChange={e => { setProdW(e.target.value); setActiveSize(''); setFieldErrors(prev => ({ ...prev, prodW: '' })); }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Iconify icon="solar:ruler-bold" width={18} sx={{ color: fieldErrors.prodW ? 'error.main' : 'primary.main' }} /></InputAdornment>,
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                        }} />
                    <TextField fullWidth label="Chiều cao *" type="number" value={prodH} sx={{ flex: 1 }}
                        error={!!fieldErrors.prodH}
                        helperText={fieldErrors.prodH || ''}
                        onChange={e => { setProdH(e.target.value); setActiveSize(''); setFieldErrors(prev => ({ ...prev, prodH: '' })); }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Iconify icon="solar:ruler-bold" width={18} sx={{ color: fieldErrors.prodH ? 'error.main' : 'error.main', transform: 'rotate(90deg)' }} /></InputAdornment>,
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                        }} />
                    <TextField fullWidth label="Số lượng *" type="number" value={qty} sx={{ flex: 1 }}
                        error={!!fieldErrors.qty}
                        helperText={fieldErrors.qty || ''}
                        onChange={e => { setQty(e.target.value); setFieldErrors(prev => ({ ...prev, qty: '' })); }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Iconify icon="solar:layers-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>,
                            endAdornment: <InputAdornment position="end">sp</InputAdornment>,
                        }} />
                </Stack>

                {/* Quick sizes */}
                <Stack direction="row" spacing={1} sx={{ mb: 3, mt: 2 }}>
                    {QUICK_SIZES.map(size => (
                        <Button key={size.label}
                            variant={activeSize === size.label ? 'contained' : 'outlined'}
                            color={activeSize === size.label ? 'primary' : 'inherit'}
                            size="medium" onClick={() => handleQuickSize(size)}
                            sx={{
                                minWidth: 72, fontWeight: 700, borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                ...(activeSize === size.label && {
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                }),
                            }}>
                            <Stack alignItems="center" spacing={0}>
                                <span>{size.label}</span>
                                <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>
                                    {size.desc}
                                </Typography>
                            </Stack>
                        </Button>
                    ))}
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* Paper specs */}
                <SectionHeader icon="solar:document-bold-duotone" title="QUY CÁCH GIẤY IN" color="info" />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ flex: 1 }} error={!!fieldErrors.printSizeIdCalc}>
                        <InputLabel>Chọn khổ in *</InputLabel>
                        <Select value={printSizeIdCalc}
                            onChange={e => { setPrintSizeIdCalc(e.target.value); setFieldErrors(prev => ({ ...prev, printSizeIdCalc: '' })); }}
                            label="Chọn khổ in *"
                            startAdornment={<InputAdornment position="start"><Iconify icon="solar:maximize-square-bold" width={18} sx={{ color: fieldErrors.printSizeIdCalc ? 'error.main' : 'primary.main' }} /></InputAdornment>}>
                            {printSizes.length === 0 && (
                                <MenuItem disabled value=""><em>Chưa có khổ in — Thêm ở Cài đặt giá</em></MenuItem>
                            )}
                            {printSizes.map(s => (
                                <MenuItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {fieldErrors.printSizeIdCalc && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{fieldErrors.printSizeIdCalc}</Typography>}
                    </FormControl>
                    <Autocomplete
                        fullWidth
                        sx={{ flex: 1 }}
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
                                return { ...p, group };
                            });
                            grouped.push({ id: '__custom__', name: '✏️ Loại giấy khác', group: '⚡ Tuỳ chọn' });
                            return grouped;
                        })()}
                        groupBy={(option) => option.group}
                        getOptionLabel={(option) => option.name || ''}
                        value={(() => {
                            if (!paperTypeId) return null;
                            if (paperTypeId === '__custom__') return { id: '__custom__', name: '✏️ Loại giấy khác', group: '⚡ Tuỳ chọn' };
                            return papers.find(p => p.id === paperTypeId) || null;
                        })()}
                        onChange={(_, newValue) => {
                            if (!newValue) {
                                setPaperTypeId('');
                                setShowCustomPrice(false); setCustomPaperPrice(''); setCustomPaperName('');
                            } else if (newValue.id === '__custom__') {
                                setPaperTypeId('__custom__');
                                setShowCustomPrice(true);
                            } else {
                                setPaperTypeId(newValue.id);
                                setShowCustomPrice(false); setCustomPaperPrice(''); setCustomPaperName('');
                            }
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        noOptionsText="Không tìm thấy giấy"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Loại giấy"
                                placeholder="Tìm kiếm giấy..."
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
                            <li {...props} key={option.id}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                                    {option.id === '__custom__' ? (
                                        <Typography variant="body2" fontWeight={700} color="warning.main">{option.name}</Typography>
                                    ) : (
                                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                    )}
                                </Stack>
                            </li>
                        )}
                        renderGroup={(params) => (
                            <li key={params.key}>
                                <Box sx={{
                                    position: 'sticky', top: -8, py: 0.5, px: 2,
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
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
                                        maxHeight: 320,
                                    },
                                    '& .MuiAutocomplete-option': { py: 0.8, px: 2, minHeight: 36 },
                                },
                            },
                        }}
                    />
                    <FormControl fullWidth sx={{ flex: 1 }}>
                        <InputLabel>Số mặt in</InputLabel>
                        <Select value={printSideId} onChange={e => setPrintSideId(e.target.value)} label="Số mặt in"
                            startAdornment={<InputAdornment position="start"><Iconify icon="solar:document-bold" width={18} sx={{ color: 'text.secondary' }} /></InputAdornment>}>
                            <MenuItem value={1}>In 1 mặt</MenuItem>
                            <MenuItem value={2}>In 2 mặt</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ flex: 1 }}>
                        <InputLabel>Cán màng</InputLabel>
                        <Select
                            value={lamDoubleSide ? `${lamId}_2mat` : String(lamId)}
                            onChange={e => {
                                const val = String(e.target.value);
                                if (val.endsWith('_2mat')) {
                                    setLamId(Number(val.replace('_2mat', '')));
                                    setLamDoubleSide(true);
                                } else {
                                    setLamId(Number(val));
                                    setLamDoubleSide(false);
                                }
                            }}
                            label="Cán màng"
                            startAdornment={<InputAdornment position="start"><Iconify icon="solar:layers-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>}
                        >
                            {settings.laminations.map(l => {
                                // "Không cán" chỉ hiện 1 dòng
                                if (l.id === 1) {
                                    return <MenuItem key={l.id} value={String(l.id)}>{l.name}</MenuItem>;
                                }
                                // Các loại khác: hiện cả 1 mặt và 2 mặt
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
                </Stack>

                {/* Custom paper inputs - only show when "Tuỳ chọn giấy" is selected */}
                <Collapse in={showCustomPrice}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2, mt: 1, p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.04), border: '1px dashed', borderColor: (t) => alpha(t.palette.warning.main, 0.3) }}>
                        <TextField
                            size="small"
                            label="Tên giấy"
                            value={customPaperName}
                            onChange={e => setCustomPaperName(e.target.value)}
                            placeholder="VD: Couche 200gsm"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Iconify icon="solar:document-text-bold" width={18} sx={{ color: 'info.main' }} /></InputAdornment>,
                            }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            size="small"
                            label="Giá giấy"
                            type="number"
                            value={customPaperPrice}
                            onChange={e => setCustomPaperPrice(e.target.value)}
                            placeholder="Nhập giá"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Iconify icon="solar:tag-price-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>,
                                endAdornment: <InputAdornment position="end">đ/tờ</InputAdornment>,
                            }}
                            sx={{ flex: 1 }}
                        />
                    </Stack>
                </Collapse>

                {/* Processing */}
                <SectionHeader icon="solar:scissors-bold-duotone" title="GIA CÔNG THÀNH PHẨM" color="warning" />
                <Box sx={{
                    display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3,
                }}>
                    {settings.processing.map(proc => {
                        const isSelected = selectedProcs.includes(proc.id);
                        return (
                            <Chip
                                key={proc.id}
                                label={proc.name}
                                onClick={() => handleProcToggle(proc.id)}
                                variant={isSelected ? 'filled' : 'outlined'}
                                color={isSelected ? 'primary' : 'default'}
                                icon={isSelected ? <Iconify icon="solar:check-circle-bold" width={18} /> : undefined}
                                sx={{
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: 13, height: 36, borderRadius: '18px',
                                    px: 0.5,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    ...(isSelected && {
                                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                                    }),
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                    },
                                }}
                            />
                        );
                    })}
                </Box>

                {/* Extra costs */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <SectionHeader icon="solar:wallet-bold-duotone" title="CHI PHÍ KHÁC" color="error" />
                    <Button size="small" variant="soft" color="primary"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={() => setExtraCostItems(prev => [...prev, { name: '', amount: '' }])}>
                        Thêm
                    </Button>
                </Stack>
                {extraCostItems.map((item, index) => (
                    <Stack key={index} direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                        <TextField size="small" placeholder="Tên chi phí" value={item.name} sx={{ flex: 1 }}
                            onChange={e => {
                                const next = [...extraCostItems];
                                next[index] = { ...next[index], name: e.target.value };
                                setExtraCostItems(next);
                            }} />
                        <TextField size="small" placeholder="Số tiền" type="number" value={item.amount} sx={{ width: 220 }}
                            InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }}
                            onChange={e => {
                                const next = [...extraCostItems];
                                next[index] = { ...next[index], amount: e.target.value };
                                setExtraCostItems(next);
                            }} />
                        <IconButton size="small" color="error"
                            onClick={() => setExtraCostItems(prev => prev.filter((_, i) => i !== index))}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                    </Stack>
                ))}

                <Divider sx={{ my: 3 }} />

                {/* Calculate */}
                <Stack direction="row" spacing={2.5} alignItems="center">
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Loại khách hàng</InputLabel>
                        <Select value={custId} onChange={e => setCustId(e.target.value)} label="Loại khách hàng">
                            {settings.customerTypes.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" size="large"
                        onClick={() => { playCalculateSound(); handleCalculate(); }}
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

                {error && <Alert severity="warning" sx={{ mt: 2, borderRadius: 1.5 }} variant="outlined">{error}</Alert>}
            </CardContent>
        </Card>
    );

    // ===== RENDER: RESULT =====
    const renderResult = result && (
        <Card sx={{
            overflow: 'visible',
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
                        { label: 'Số lượng', value: `${formatNumber(result.qty)} sp`, color: 'warning', icon: 'solar:layers-bold-duotone' },
                        { label: 'Đơn giá bán', value: formatMoney(result.sellPerItem), color: 'success', icon: 'solar:tag-price-bold-duotone' },
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

                {/* Thông tin đơn hàng + dàn in - always visible */}
                <Box sx={{
                    borderRadius: 2, mb: 2.5,
                    bgcolor: alpha(theme.palette.info.main, 0.03),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.16)}`,
                    overflow: 'hidden',
                }}>
                    {/* Section 1: Thông tin đơn hàng */}
                    <Box sx={{ p: 2.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Box sx={{
                                width: 28, height: 28, borderRadius: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }}>
                                <Iconify icon="solar:document-text-bold" width={16} sx={{ color: 'primary.main' }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.dark">
                                THÔNG TIN ĐƠN HÀNG
                            </Typography>
                        </Stack>

                        <Stack direction="row" sx={{ width: '100%' }} justifyContent="space-between">
                            {/* Loại giấy */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                    Loại giấy
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Iconify icon="solar:layers-minimalistic-bold" width={14} sx={{ color: 'info.main' }} />
                                    <Typography variant="body2" fontWeight={700}>{result.paperName || '—'}</Typography>
                                </Stack>
                            </Box>

                            {/* Kích thước SP */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                    Kích thước SP
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Iconify icon="solar:ruler-angular-bold" width={14} sx={{ color: 'primary.main' }} />
                                    <Typography variant="body2" fontWeight={700}>{prodW} × {prodH} mm</Typography>
                                </Stack>
                            </Box>

                            {/* Số mặt in */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                    Số mặt in
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Iconify icon="solar:document-bold" width={14} sx={{ color: 'text.secondary' }} />
                                    <Typography variant="body2" fontWeight={700}>{printSideId === 1 ? 'In 1 mặt' : 'In 2 mặt'}</Typography>
                                </Stack>
                            </Box>

                            {/* Cán màng */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                    Cán màng
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Iconify icon="solar:layers-bold" width={14} sx={{ color: 'warning.main' }} />
                                    <Typography variant="body2" fontWeight={700}>
                                        {settings.laminations.find(l => l.id === lamId)?.name || '—'}
                                        {lamDoubleSide && ' (2 mặt)'}
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Gia công */}
                            <Box sx={{ flex: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                    Gia công
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                    <Iconify icon="solar:scissors-bold" width={14} sx={{ color: 'error.main' }} />
                                    {selectedProcs.length > 0 ? (
                                        selectedProcs.map(id => {
                                            const proc = settings.processing.find(p => p.id === id);
                                            return proc ? (
                                                <Chip key={id} label={proc.name} size="small"
                                                    sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />
                                            ) : null;
                                        })
                                    ) : (
                                        <Typography variant="body2" fontWeight={700} color="text.secondary">Không có</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Section 2: Thông tin dàn in */}
                    <Box sx={{ p: 2.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Box sx={{
                                width: 28, height: 28, borderRadius: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                            }}>
                                <Iconify icon="solar:graph-up-bold" width={16} sx={{ color: 'info.main' }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="info.dark">
                                THÔNG TIN DÀN IN
                            </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="flex-start" sx={{ width: '100%' }} justifyContent="space-between">
                            {/* Stats */}
                            {[
                                { label: 'Khổ giấy in', value: result.sheetSize, icon: 'solar:maximize-square-bold', color: 'primary' },
                                { label: 'SP / tờ', value: `${result.imposition?.total || 0} sp`, icon: 'solar:layers-bold', color: 'success' },
                                { label: 'Số tờ in', value: `${formatNumber(result.sheets)} tờ`, icon: 'solar:printer-bold', color: 'info' },
                                { label: 'Tờ gốc', value: `${formatNumber(result.baseSheets)} tờ`, icon: 'solar:document-bold', color: 'warning' },
                                { label: 'Bù hao', value: `${result.waste} tờ`, icon: 'solar:danger-triangle-bold', color: 'error' },
                            ].map((info, i) => (
                                <Box key={i} sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                        {info.label}
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Iconify icon={info.icon} width={14} sx={{ color: `${info.color}.main` }} />
                                        <Typography variant="body2" fontWeight={700}>{info.value}</Typography>
                                    </Stack>
                                </Box>
                            ))}

                            {/* Divider */}
                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                            {/* Settings — same style as stats */}
                            {[
                                { label: 'Khoảng cách', value: `${spacing} mm`, icon: 'solar:ruler-bold', color: 'text.secondary' },
                                { label: 'Lề ngang', value: `${marginH} mm`, icon: 'solar:align-horizontal-spacing-bold', color: 'text.secondary' },
                                { label: 'Lề dọc', value: `${marginV} mm`, icon: 'solar:align-vertical-spacing-bold', color: 'text.secondary' },
                            ].map((s, i) => (
                                <Box key={i} sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                                        {s.label}
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Iconify icon={s.icon} width={14} sx={{ color: s.color }} />
                                        <Typography variant="body2" fontWeight={700}>{s.value}</Typography>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Box>

                <Collapse in={showDetail}>
                    {/* Cost breakdown */}
                    <Box sx={{
                        borderRadius: 2, p: 2.5, mb: 2.5,
                        bgcolor: alpha(theme.palette.grey[500], 0.04),
                        border: `1px solid ${theme.palette.divider}`,
                    }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                            💰 Chi tiết chi phí
                        </Typography>
                        <Stack spacing={1.5}>
                            {(() => {
                                const lamName = (settings.laminations.find(l => l.id === lamId)?.name || 'Không cán') + (lamId !== 1 ? (lamDoubleSide ? ' (2 mặt)' : ' (1 mặt)') : '');
                                const rows = [
                                    {
                                        icon: '📄', label: result.paperName || 'Giấy', color: 'primary',
                                        value: result.paperCost,
                                        lines: [
                                            `${formatNumber(result.sheets)} tờ × ${formatNumber(result.paperPricePerSheet)}đ/tờ = ${formatMoney(result.paperCost)}`,
                                        ],
                                    },
                                    {
                                        icon: '🖨️', label: result.printName, color: 'info',
                                        value: result.printCost,
                                        lines: result.printSides === 2 ? [
                                            `Mặt in: ${formatNumber(result.sheets)} tờ × ${result.printSides} mặt = ${formatNumber(result.totalPrintSides)} mặt in`,
                                            `Mốc ${formatNumber(result.totalPrintSides)} mặt → ${formatNumber(result.printPricePerSide)}đ/mặt`,
                                            `${formatNumber(result.totalPrintSides)} mặt × ${formatNumber(result.printPricePerSide)}đ = ${formatMoney(result.printCost)}`,
                                        ] : [
                                            `Mốc ${formatNumber(result.sheets)} tờ → ${formatNumber(result.printPricePerSheet)}đ/tờ`,
                                            `${formatNumber(result.sheets)} tờ × ${formatNumber(result.printPricePerSheet)}đ = ${formatMoney(result.printCost)}`,
                                        ],
                                    },
                                    {
                                        icon: '✨', label: `Cán màng — ${lamName}`, color: 'warning',
                                        value: result.lamCost,
                                        lines: (() => {
                                            if (result.lamCost <= 0) return ['Không cán'];
                                            const d = result.lamDetail;
                                            const maxLabel = d.tierMax === 999999 ? '∞' : formatNumber(d.tierMax);
                                            const lines = [];
                                            // Hiện quy đổi mặt cán nếu 2 mặt
                                            if (lamDoubleSide) {
                                                lines.push(`Mặt cán: ${formatNumber(result.sheets)} tờ × 2 mặt = ${formatNumber(d.totalSides)} mặt`);
                                            }
                                            lines.push(`Mốc ${formatNumber(d.tierMin)}→${maxLabel}`);
                                            if (d.unit === 'per_m2') {
                                                lines.push(`S = ${(d.area).toFixed(4)} m²`);
                                                lines.push(`${formatNumber(d.totalSides)} mặt × ${(d.area).toFixed(4)} m² × ${formatNumber(d.tierPrice)}đ/m² = ${formatMoney(result.lamCost)}`);
                                            } else if (d.unit === 'per_lot') {
                                                lines.push(`Giá trọn lô: ${formatMoney(d.tierPrice)}`);
                                            } else {
                                                lines.push(`${formatNumber(d.totalSides)} mặt × ${formatNumber(d.tierPrice)}đ/mặt = ${formatMoney(result.lamCost)}`);
                                            }
                                            return lines;
                                        })(),
                                    },
                                    ...(result.procDetails.length > 0 ? result.procDetails.map(p => ({
                                        icon: '✂️', label: p.name, color: 'error',
                                        value: p.cost,
                                        lines: [`${formatMoney(p.cost)}`],
                                    })) : [{ icon: '✂️', label: 'Gia công', color: 'error', value: 0, lines: ['Không chọn'] }]),
                                    ...(result.extraCosts > 0 ? [{
                                        icon: '💰', label: 'Chi phí khác', color: 'secondary',
                                        value: result.extraCosts,
                                        lines: [`${formatMoney(result.extraCosts)}`],
                                    }] : []),
                                ];
                                return rows.map((row, i) => (
                                    <Stack key={i} direction="row" alignItems="flex-start" justifyContent="space-between"
                                        sx={{
                                            py: 1.25, px: 1.5, borderRadius: 1.5,
                                            '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.06) },
                                            transition: 'background 0.2s ease',
                                        }}>
                                        <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: 18, mt: 0.25 }}>{row.icon}</Typography>
                                            <Stack>
                                                <Typography variant="body2" fontWeight={700}>{row.label}</Typography>
                                                {row.lines.map((line, li) => (
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
                                ));
                            })()}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {/* Per item cost */}
                        <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
                            <Typography variant="body2" fontWeight={700}>Giá vốn / sp</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatMoney(result.costPerItem)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1, bgcolor: alpha(theme.palette.success.main, 0.06), borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={700} color="success.main">Giá bán / sp (+{result.profitPercent}%)</Typography>
                            <Typography variant="body2" fontWeight={700} color="success.main">{formatMoney(result.sellPerItem)}</Typography>
                        </Stack>
                    </Box>

                    {/* Total bar - gradient instead of dark */}
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
    );

    // ===== EXPORT QUOTATION =====
    const handleExportQuotation = (entry) => {
        const d = new Date(entry.createdAt);
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Thông tin tính giá in - NetPrint</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #e53935; }
  .company-info { text-align: right; font-size: 13px; color: #718096; line-height: 1.7; }
  .title { font-size: 22px; font-weight: 800; text-align: center; margin: 24px 0 8px; color: #1a202c; text-transform: uppercase; letter-spacing: 1px; }
  .subtitle { text-align: center; color: #718096; font-size: 13px; margin-bottom: 28px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4a5568; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .info-item { background: #f7fafc; border-radius: 8px; padding: 12px 14px; }
  .info-label { font-size: 11px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .info-value { font-size: 15px; font-weight: 700; color: #1a202c; }
  .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
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
    <div>Mã tính giá: #TG${entry.id.toString().slice(-6)}</div>
  </div>
</div>

<div class="title">Thông Tin Tính Giá</div>
<div class="subtitle">Kết quả tính toán tự động từ hệ thống NetPrint</div>

<div class="section">
  <div class="section-title">📋 Thông tin sản phẩm</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Loại giấy</div><div class="info-value">${entry.paperName || '—'}</div></div>
    <div class="info-item"><div class="info-label">Kích thước SP</div><div class="info-value">${entry.prodW} × ${entry.prodH} mm</div></div>
    <div class="info-item"><div class="info-label">Số lượng</div><div class="info-value">${Number(entry.qty).toLocaleString('vi-VN')} sản phẩm</div></div>
    <div class="info-item"><div class="info-label">Số mặt in</div><div class="info-value">${entry.printSides}</div></div>
    <div class="info-item"><div class="info-label">Cán màng</div><div class="info-value">${entry.lamName || 'Không cán'}</div></div>
    <div class="info-item"><div class="info-label">Gia công</div><div class="info-value">${entry.procNames.length > 0 ? entry.procNames.join(', ') : 'Không có'}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📊 Thông tin dàn in</div>
  <div class="info-grid" style="grid-template-columns: repeat(4, 1fr)">
    <div class="info-item"><div class="info-label">Khổ giấy in</div><div class="info-value">${entry.sheetSize}</div></div>
    <div class="info-item"><div class="info-label">SP / tờ</div><div class="info-value">${entry.spPerSheet} sản phẩm</div></div>
    <div class="info-item"><div class="info-label">Số tờ in</div><div class="info-value">${Number(entry.sheets).toLocaleString('vi-VN')} tờ</div></div>
    <div class="info-item"><div class="info-label">Tờ gốc</div><div class="info-value">${Number(entry.baseSheets || 0).toLocaleString('vi-VN')} tờ</div></div>
    <div class="info-item"><div class="info-label">Bù hao</div><div class="info-value">${entry.waste ?? 0} tờ</div></div>
    <div class="info-item"><div class="info-label">Khoảng cách</div><div class="info-value">${entry.spacing ?? 0} mm</div></div>
    <div class="info-item"><div class="info-label">Lề ngang</div><div class="info-value">${entry.marginH ?? 0} mm</div></div>
    <div class="info-item"><div class="info-label">Lề dọc</div><div class="info-value">${entry.marginV ?? 0} mm</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">💰 Đơn giá</div>
  <div class="price-grid" style="grid-template-columns: repeat(4, 1fr)">
    <div class="price-card qty"><div class="plabel">Số lượng</div><div class="pvalue">${Number(entry.qty).toLocaleString('vi-VN')} sp</div></div>
    <div class="price-card sell"><div class="plabel">Đơn giá / sp</div><div class="pvalue">${Number(entry.sellPerItem).toLocaleString('vi-VN')}đ</div></div>
    <div class="price-card total"><div class="plabel">Tổng tiền</div><div class="pvalue">${Number(entry.totalSell).toLocaleString('vi-VN')}đ</div></div>
    <div class="price-card" style="background:linear-gradient(135deg,#f3e5f5,#e1bee7);border:1px solid #ce93d8"><div class="plabel">Loại khách</div><div class="pvalue" style="font-size:18px">${entry.custName || '—'}</div></div>
  </div>
</div>

<div class="note">⚠️ Báo giá này chỉ mang tính tham khảo. Giá thực tế có thể thay đổi tùy theo điều kiện thực tế và số lượng đặt hàng. Vui lòng liên hệ trực tiếp để xác nhận giá cuối cùng.</div>

<div class="footer">
  <span>NetPrint — Tính toán chi phí in ấn chuyên nghiệp</span>
  <span>Ngày tạo: ${dateStr}</span>
</div>

<script>window.onload = () => window.print();</script>
</body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    // ===== HISTORY DRAWER =====
    const filteredHistory = priceHistory.filter(h => {
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return (
            `${h.prodW}x${h.prodH}`.includes(q) ||
            (h.paperName || '').toLowerCase().includes(q) ||
            String(h.qty).includes(q)
        );
    });

    const renderHistoryDrawer = (
        <Drawer
            anchor="right"
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 0 } }}
        >
            {/* Drawer Header */}
            <Box sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Iconify icon="solar:history-bold" width={24} />
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="white">Lịch sử tính giá</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, color: 'white' }}>{priceHistory.length} lần tính gần nhất</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        {priceHistory.length > 0 && (
                            <Tooltip title="Xoá toàn bộ lịch sử">
                                <IconButton size="small" sx={{ color: 'white', opacity: 0.7 }}
                                    onClick={() => { setPriceHistory([]); localStorage.removeItem('netprint_price_history'); }}>
                                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <IconButton size="small" sx={{ color: 'white' }} onClick={() => setHistoryOpen(false)}>
                            <Iconify icon="solar:close-circle-bold" width={20} />
                        </IconButton>
                    </Stack>
                </Stack>

                <TextField
                    size="small" fullWidth
                    placeholder="Tìm theo kích thước, loại giấy, số lượng..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Iconify icon="solar:magnifer-bold" width={18} sx={{ color: 'white', opacity: 0.7 }} /></InputAdornment>,
                        sx: {
                            bgcolor: alpha('#fff', 0.15), borderRadius: 1.5, color: 'white',
                            '& input': { color: 'white' },
                            '& input::placeholder': { color: alpha('#fff', 0.6) },
                            '& fieldset': { borderColor: alpha('#fff', 0.2) },
                        },
                    }}
                    sx={{ mt: 2 }}
                />
            </Box>

            {/* History List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {filteredHistory.length === 0 ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
                        <Iconify icon="solar:history-bold" width={56} sx={{ color: 'text.disabled', opacity: 0.3 }} />
                        <Typography color="text.secondary" variant="body2">
                            {historySearch ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử tính giá'}
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={1.5}>
                        {filteredHistory.map((entry, idx) => {
                            const d = new Date(entry.createdAt);
                            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                            const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            return (
                                <Card key={entry.id} variant="outlined" sx={{
                                    transition: 'all 0.2s ease',
                                    '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
                                }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Stack spacing={0.5} sx={{ flex: 1 }}>
                                                {/* Title row */}
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Chip label={`#${idx + 1}`} size="small" color="primary" variant="soft"
                                                        sx={{ height: 20, fontSize: 11, fontWeight: 700, minWidth: 36 }} />
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {entry.prodW} × {entry.prodH} mm
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dateStr} {timeStr}
                                                    </Typography>
                                                </Stack>

                                                {/* Info chips */}
                                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                    <Chip label={`${Number(entry.qty).toLocaleString('vi-VN')} sp`}
                                                        size="small" color="warning" variant="soft"
                                                        icon={<Iconify icon="solar:layers-bold" width={12} />}
                                                        sx={{ height: 22, fontSize: 11 }} />
                                                    <Chip label={entry.paperName || '—'}
                                                        size="small" color="info" variant="soft"
                                                        sx={{ height: 22, fontSize: 11 }} />
                                                    <Chip label={entry.printSides}
                                                        size="small" variant="soft"
                                                        sx={{ height: 22, fontSize: 11 }} />
                                                    {entry.procNames?.map(n => (
                                                        <Chip key={n} label={n} size="small" color="error" variant="soft"
                                                            sx={{ height: 22, fontSize: 11 }} />
                                                    ))}
                                                </Stack>

                                                {/* Price */}
                                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">Đơn giá/sp</Typography>
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
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">SP/tờ</Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {entry.spPerSheet} sp
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Stack>

                                            {/* Actions */}
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
                                                            localStorage.setItem('netprint_price_history', JSON.stringify(updated));
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
                    </Stack>
                )}
            </Box>
        </Drawer>
    );

    // ===== PREVIEW DIALOG =====
    const renderPreviewDialog = previewEntry && (() => {
        const e = previewEntry;
        const d = new Date(e.createdAt);
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return (
            <Dialog open={!!previewEntry} onClose={() => setPreviewEntry(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                {/* Dialog Header */}
                <Box sx={{
                    px: 3, py: 2,
                    background: `linear-gradient(135deg, #1a73e8, #0d47a1)`,
                    color: 'white',
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Iconify icon="solar:document-text-bold" width={22} />
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="white">Xem trước thông tin tính giá</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, color: 'white' }}>Mã: #TG{String(e.id).slice(-6)} · {dateStr}</Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Button variant="contained" size="small"
                                onClick={() => handleExportQuotation(e)}
                                startIcon={<Iconify icon="solar:printer-bold" width={16} />}
                                sx={{ bgcolor: 'white', color: '#1a73e8', fontWeight: 700, '&:hover': { bgcolor: '#f0f4ff' } }}>
                                In / PDF
                            </Button>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={() => setPreviewEntry(null)}>
                                <Iconify icon="solar:close-circle-bold" width={20} />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Box>

                {/* Dialog Body */}
                <Box sx={{ p: 4, bgcolor: '#f8fafc', maxHeight: '75vh', overflow: 'auto' }}>
                    {/* Company header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, pb: 2.5, borderBottom: '3px solid #e53935' }}>
                        <Box>
                            <Box
                                component="img"
                                src="/logo/logo-full.png"
                                alt="NetPrint"
                                sx={{ height: 52, objectFit: 'contain' }}
                            />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" display="block">Ngày tính giá: {dateStr}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">Mã tính giá: #TG{String(e.id).slice(-6)}</Typography>
                        </Box>
                    </Stack>

                    <Typography variant="h5" fontWeight={900} textAlign="center" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Thông Tin Tính Giá
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                        Kết quả tính toán tự động từ hệ thống NetPrint
                    </Typography>

                    {/* Section 1: Product info */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                            📋 Thông tin sản phẩm
                        </Typography>
                        <Grid container spacing={1.5}>
                            {[
                                { label: 'Loại giấy', value: e.paperName || '—' },
                                { label: 'Kích thước SP', value: `${e.prodW} × ${e.prodH} mm` },
                                { label: 'Số lượng', value: `${Number(e.qty).toLocaleString('vi-VN')} sản phẩm` },
                                { label: 'Số mặt in', value: e.printSides },
                                { label: 'Cán màng', value: e.lamName || 'Không cán' },
                                { label: 'Gia công', value: e.procNames?.length > 0 ? e.procNames.join(', ') : 'Không có' },
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

                    {/* Section 2: Imposition info */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5, pb: 0.75, borderBottom: '1px solid #e2e8f0' }}>
                            📊 Thông tin dàn in
                        </Typography>
                        <Grid container spacing={1.5}>
                            {[
                                { label: 'Khổ giấy in', value: `${e.sheetSize}` },
                                { label: 'SP / tờ', value: `${e.spPerSheet} sản phẩm` },
                                { label: 'Số tờ in', value: `${Number(e.sheets).toLocaleString('vi-VN')} tờ` },
                                { label: 'Tờ gốc', value: `${Number(e.baseSheets || 0).toLocaleString('vi-VN')} tờ` },
                                { label: 'Bù hao', value: `${e.waste ?? 0} tờ` },
                                { label: 'Khoảng cách', value: `${e.spacing ?? 0} mm` },
                                { label: 'Lề ngang', value: `${e.marginH ?? 0} mm` },
                                { label: 'Lề dọc', value: `${e.marginV ?? 0} mm` },
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
                                    <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{Number(e.qty).toLocaleString('vi-VN')} sp</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={3}>
                                <Box sx={{ borderRadius: 2, p: 2.5, textAlign: 'center', bgcolor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Đơn giá / sp</Typography>
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
    })();

    return (
        <DashboardContent maxWidth="lg">
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <Box sx={{
                    width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white', boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}>
                    <Iconify icon="solar:calculator-bold-duotone" width={26} />
                </Box>
                <Stack sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight={800}>Tính Giá In Nhanh</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tính toán chi phí in ấn chuyên nghiệp
                    </Typography>
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

            {renderImpositionPreview}
            {renderForm}
            {renderResult}
            {renderHistoryDrawer}
            {renderPreviewDialog}
            <PricingSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onSettingsChanged={handleSettingsChanged} />
        </DashboardContent>
    );
}
