import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import {
    formatMoney,
    formatNumber,
    getAllPapers,
    calculateImposition,
    calculateSheetsNeeded,
    calculatePaperPricing,
} from '../utils/pricing-calc';

import { loadPaperSettings } from '../data/default-settings';
import PricingSettingsDialog from './pricing-settings-dialog';

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

    // Form state
    const [prodW, setProdW] = useState('');
    const [prodH, setProdH] = useState('');
    const [qty, setQty] = useState('');
    const [paperTypeId, setPaperTypeId] = useState('');
    const [printSideId, setPrintSideId] = useState(1);
    const [lamId, setLamId] = useState(1);
    const [custId, setCustId] = useState(settings.customerTypes[0]?.id || 1);
    const [selectedProcs, setSelectedProcs] = useState([]);
    const [spacing, setSpacing] = useState(0);
    const [marginH, setMarginH] = useState(5);
    const [marginV, setMarginV] = useState(5);
    const [waste, setWaste] = useState(0);
    const [allowRotation, setAllowRotation] = useState(false);
    const [activeSize, setActiveSize] = useState('');
    const [extraCostItems, setExtraCostItems] = useState([]);
    const [result, setResult] = useState(null);
    const [showDetail, setShowDetail] = useState(true);
    const [error, setError] = useState('');

    const papers = useMemo(() => getAllPapers(settings), [settings]);
    const selectedPaper = useMemo(() => papers.find(p => p.id === paperTypeId), [papers, paperTypeId]);

    const numProdW = Number(prodW) || 0;
    const numProdH = Number(prodH) || 0;
    const numQty = Number(qty) || 0;

    const imposition = useMemo(() => {
        if (numProdW <= 0 || numProdH <= 0) return { cols: 0, rows: 0, total: 0, rotated: false };
        const sheetW = selectedPaper?.w || 325;
        const sheetH = selectedPaper?.h || 430;
        const m = { top: marginH, bottom: marginH, left: marginV, right: marginV };
        return calculateImposition(numProdW, numProdH, sheetW, sheetH, 0, m, spacing, allowRotation);
    }, [numProdW, numProdH, selectedPaper, marginH, marginV, spacing, allowRotation]);

    const sheetsPreview = useMemo(() => {
        if (numQty <= 0 || imposition.total <= 0) return 0;
        return calculateSheetsNeeded(numQty, imposition.total) + waste;
    }, [numQty, imposition.total, waste]);

    const handleQuickSize = useCallback((size) => {
        setProdW(String(size.w));
        setProdH(String(size.h));
        setActiveSize(size.label);
    }, []);

    const handleProcToggle = useCallback((procId) => {
        setSelectedProcs(prev =>
            prev.includes(procId) ? prev.filter(id => id !== procId) : [...prev, procId]
        );
    }, []);

    const totalExtraCosts = useMemo(() =>
        extraCostItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        [extraCostItems]
    );

    const handleCalculate = useCallback(() => {
        setError('');
        const res = calculatePaperPricing({
            prodW: numProdW, prodH: numProdH, qty: numQty, paperTypeId, printSideId, lamId, custId,
            extraCosts: totalExtraCosts, selectedProcIds: selectedProcs,
            spacing, marginH, marginV, waste, allowRotation, settings,
        });
        if (!res) { setError('Vui lòng nhập đầy đủ thông tin!'); return; }
        if (res.error) { setError(res.error); return; }
        setResult(res);
    }, [numProdW, numProdH, numQty, paperTypeId, printSideId, lamId, custId, totalExtraCosts, selectedProcs, spacing, marginH, marginV, waste, allowRotation, settings]);

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
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={4}>
                    {/* Sheet visual */}
                    <Box sx={{
                        width: 160, height: 200, bgcolor: 'background.paper', borderRadius: 2,
                        border: '2px dashed', borderColor: alpha(theme.palette.primary.main, 0.3),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: 'primary.main', transform: 'scale(1.02)' },
                    }}>
                        {imposition.total > 0 ? (() => {
                            const maxCols = imposition.cols;
                            const maxRows = Math.ceil(imposition.total / maxCols);
                            const displayRows = Math.min(maxRows, 12);
                            const displayTotal = Math.min(imposition.total, maxCols * displayRows);
                            const gap = maxCols > 6 ? 2 : 3;
                            return (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
                                    gridTemplateRows: `repeat(${displayRows}, 1fr)`,
                                    gap: `${gap}px`, p: 1,
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
                                            transition: 'all 0.2s ease',
                                            animation: `fadeIn 0.3s ease ${Math.min(i, 20) * 0.02}s both`,
                                            '@keyframes fadeIn': { from: { opacity: 0, transform: 'scale(0.5)' }, to: { opacity: 1, transform: 'scale(1)' } },
                                        }} />
                                    ))}
                                </Box>
                            );
                        })() : (
                            <Stack alignItems="center" spacing={0.5}>
                                <Iconify icon="solar:document-add-bold-duotone" width={36} sx={{ color: 'text.disabled', opacity: 0.5 }} />
                                <Typography variant="caption" color="text.disabled">Nhập kích thước</Typography>
                            </Stack>
                        )}
                    </Box>

                    {/* Sheet info */}
                    <Stack spacing={2} flex={1}>
                        <Chip
                            icon={<Iconify icon="solar:ruler-angular-bold" width={16} />}
                            label={selectedPaper ? `Khổ ${selectedPaper.w}×${selectedPaper.h} mm` : 'Khổ A3 (325×430 mm)'}
                            variant="soft" color="primary"
                            sx={{ fontWeight: 700, alignSelf: 'flex-start', fontSize: 13 }}
                        />
                        <Stack direction="row" spacing={4}>
                            <Box sx={{
                                textAlign: 'center', p: 1.5, borderRadius: 2, minWidth: 90,
                                bgcolor: alpha(theme.palette.success.main, 0.08),
                                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            }}>
                                <Typography variant="h3" fontWeight={800} color="success.dark"
                                    sx={{ lineHeight: 1, transition: 'all 0.3s ease' }}>
                                    {imposition.total}
                                </Typography>
                                <Typography variant="caption" color="success.dark" fontWeight={700} sx={{ opacity: 0.7 }}>
                                    SP/TỜ
                                </Typography>
                            </Box>
                            <Box sx={{
                                textAlign: 'center', p: 1.5, borderRadius: 2, minWidth: 90,
                                bgcolor: alpha(theme.palette.info.main, 0.08),
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            }}>
                                <Typography variant="h3" fontWeight={800} color="info.dark"
                                    sx={{ lineHeight: 1, transition: 'all 0.3s ease' }}>
                                    {sheetsPreview}
                                </Typography>
                                <Typography variant="caption" color="info.dark" fontWeight={700} sx={{ opacity: 0.7 }}>
                                    TỜ IN
                                </Typography>
                            </Box>
                        </Stack>
                        {imposition.rotated && (
                            <Chip label="↻ Đã xoay sản phẩm" size="small" color="info" variant="soft" sx={{ alignSelf: 'flex-start' }} />
                        )}
                        {imposition.mixed && (
                            <Chip label="🔀 Dàn hỗn hợp" size="small" color="warning" variant="soft" sx={{ alignSelf: 'flex-start' }} />
                        )}
                    </Stack>

                    {/* Imposition controls */}
                    <Stack spacing={1.5} sx={{
                        p: 2, borderRadius: 2, bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                        minWidth: 200,
                    }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Cài đặt dàn in
                        </Typography>
                        <TextField size="small" label="Khoảng cách SP" type="number" value={spacing}
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
                        <Stack direction="row" spacing={1}>
                            <TextField size="small" label="Bù hao" type="number" value={waste}
                                onChange={e => setWaste(Number(e.target.value))} sx={{ flex: 1 }}
                                InputProps={{ endAdornment: <InputAdornment position="end">tờ</InputAdornment> }} />
                            <Button size="small" variant={allowRotation ? 'contained' : 'outlined'}
                                color={allowRotation ? 'info' : 'inherit'}
                                onClick={() => setAllowRotation(!allowRotation)}
                                sx={{ minWidth: 100, fontWeight: 600 }}
                                startIcon={<Iconify icon={allowRotation ? 'solar:refresh-bold' : 'solar:lock-bold'} />}>
                                {allowRotation ? 'Xoay' : 'Cố định'}
                            </Button>
                        </Stack>
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
                <Grid container spacing={2.5} sx={{ mb: 1 }}>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Chiều rộng" type="number" value={prodW}
                            onChange={e => { setProdW(e.target.value); setActiveSize(''); }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Iconify icon="solar:ruler-bold" width={18} sx={{ color: 'primary.main' }} /></InputAdornment>,
                                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                            }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Chiều cao" type="number" value={prodH}
                            onChange={e => { setProdH(e.target.value); setActiveSize(''); }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Iconify icon="solar:ruler-bold" width={18} sx={{ color: 'error.main', transform: 'rotate(90deg)' }} /></InputAdornment>,
                                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                            }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Số lượng sản phẩm" type="number" value={qty}
                            onChange={e => setQty(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Iconify icon="solar:layers-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>,
                                endAdornment: <InputAdornment position="end">sp</InputAdornment>,
                            }} />
                    </Grid>
                </Grid>

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
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ flex: 1 }}>
                        <InputLabel>Loại giấy</InputLabel>
                        <Select value={paperTypeId} onChange={e => setPaperTypeId(e.target.value)} label="Loại giấy"
                            displayEmpty
                            startAdornment={<InputAdornment position="start"><Iconify icon="solar:layers-minimalistic-bold" width={18} sx={{ color: 'info.main' }} /></InputAdornment>}
                            renderValue={(selected) => {
                                if (!selected) return <Typography color="text.secondary">Chọn loại giấy</Typography>;
                                const p = papers.find(pp => pp.id === selected);
                                return p ? p.name : '';
                            }}>
                            {papers.length === 0 && (
                                <MenuItem disabled value=""><em>Chưa có loại giấy — Vui lòng cài đặt</em></MenuItem>
                            )}
                            {papers.map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                        <Chip label={`${p.w}×${p.h}`} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
                        <Select value={lamId} onChange={e => setLamId(e.target.value)} label="Cán màng"
                            startAdornment={<InputAdornment position="start"><Iconify icon="solar:layers-bold" width={18} sx={{ color: 'warning.main' }} /></InputAdornment>}>
                            {settings.laminations.map(l => (
                                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

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
                        <TextField size="small" placeholder="Số tiền" type="number" value={item.amount} sx={{ width: 160 }}
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
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                        <Chip label={`+${c.profit}%`} size="small" color="success" variant="soft" sx={{ height: 20, fontSize: 11 }} />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" size="large" onClick={handleCalculate}
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

                <Collapse in={showDetail}>
                    {/* Cost breakdown */}
                    <Box sx={{
                        borderRadius: 2, p: 2.5, mb: 2.5,
                        bgcolor: alpha(theme.palette.grey[500], 0.04),
                        border: `1px solid ${theme.palette.divider}`,
                    }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                            Chi tiết chi phí
                        </Typography>
                        <Stack spacing={1.5}>
                            {[
                                { icon: '📄', label: result.paperName, detail: `${formatNumber(result.sheets)} tờ × ${formatNumber(result.paperPricePerSheet)}đ`, value: result.paperCost, color: 'primary' },
                                { icon: '🖨️', label: result.printName, detail: `${formatNumber(result.sheets)} tờ × ${formatNumber(result.printPricePerSheet)}đ`, value: result.printCost, color: 'info' },
                                { icon: '✨', label: 'Cán màng', detail: '', value: result.lamCost, color: 'warning' },
                                { icon: '✂️', label: 'Gia công', detail: result.procDetails.map(p => p.name).join(', '), value: result.procCost, color: 'error' },
                                ...(result.extraCosts > 0 ? [{ icon: '💰', label: 'Chi phí khác', detail: '', value: result.extraCosts, color: 'secondary' }] : []),
                            ].map((row, i) => (
                                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between"
                                    sx={{
                                        py: 1, px: 1.5, borderRadius: 1,
                                        '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.06) },
                                        transition: 'background 0.2s ease',
                                    }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: 18 }}>{row.icon}</Typography>
                                        <Stack>
                                            <Typography variant="body2" fontWeight={600}>{row.label}</Typography>
                                            {row.detail && <Typography variant="caption" color="text.secondary">{row.detail}</Typography>}
                                        </Stack>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={700} color={`${row.color}.main`}>
                                        {formatMoney(row.value)}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    {/* Total bar */}
                    <Box sx={{
                        borderRadius: 2, p: 2.5, color: 'white', position: 'relative', overflow: 'hidden',
                        background: `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[900]} 100%)`,
                    }}>
                        <Box sx={{
                            position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                            borderRadius: '50%', bgcolor: alpha('#fff', 0.03),
                        }} />
                        <Stack direction="row" justifyContent="space-around">
                            <Box textAlign="center">
                                <Typography variant="overline" sx={{ opacity: 0.5, letterSpacing: 1.5 }}>Tổng vốn</Typography>
                                <Typography variant="h5" fontWeight={800}>{formatMoney(result.totalCost)}</Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.12) }} />
                            <Box textAlign="center">
                                <Typography variant="overline" sx={{ opacity: 0.5, letterSpacing: 1.5 }}>Lợi nhuận</Typography>
                                <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.success.light }}>
                                    +{formatMoney(result.profit)}
                                </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.12) }} />
                            <Box textAlign="center">
                                <Typography variant="overline" sx={{ opacity: 0.5, letterSpacing: 1.5 }}>% Lãi</Typography>
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

    return (
        <DashboardContent maxWidth="lg">
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white', boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}>
                        <Iconify icon="solar:calculator-bold-duotone" width={26} />
                    </Box>
                    <Stack>
                        <Typography variant="h4" fontWeight={800}>Tính Giá In Nhanh</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tính toán chi phí in ấn chuyên nghiệp
                        </Typography>
                    </Stack>
                </Stack>
                <Button variant="outlined" color="inherit" startIcon={<Iconify icon="solar:settings-bold-duotone" />}
                    onClick={() => setSettingsOpen(true)}
                    sx={{ borderRadius: 1.5, fontWeight: 700, borderColor: 'divider', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
                    Cài đặt giá
                </Button>
            </Stack>

            {renderImpositionPreview}
            {renderForm}
            {renderResult}
            <PricingSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onSettingsChanged={handleSettingsChanged} />
        </DashboardContent>
    );
}
