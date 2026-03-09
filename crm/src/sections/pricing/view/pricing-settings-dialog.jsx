import { useState, useEffect, useCallback, useRef } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, Typography, Button, TextField, IconButton,
    Tabs, Tab, Chip, Divider, InputAdornment, Tooltip, Paper,
    Table, TableHead, TableRow, TableCell, TableBody,
    Collapse,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { loadPaperSettings, savePaperSettings, loadCatalogueSettings, saveCatalogueSettings } from '../data/default-settings';

// ===== TabPanel =====
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

// ===== Section wrapper =====
function SettingSection({ icon, title, color, onAdd, addLabel, children }) {
    const theme = useTheme();
    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon={icon} width={22} sx={{ color: `${color}.main` }} />
                    <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
                </Stack>
                {onAdd && (
                    <Button size="small" variant="soft" color={color} startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={onAdd}>{addLabel || 'Thêm'}</Button>
                )}
            </Stack>
            {children}
        </Paper>
    );
}

// ===== Tier Row =====
function TierRow({ tier, index, isLast, onChange, onDelete, canDelete, unit = 'đ/sp', unitOptions, onUnitChange, prevMax = 0 }) {
    const theme = useTheme();
    const min = prevMax + 1;
    const isInfinity = tier.max === 999999;

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, mb: 1,
            p: 1, borderRadius: 1.5,
            bgcolor: alpha(theme.palette.background.default, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            transition: 'all 0.15s ease',
            '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderColor: alpha(theme.palette.primary.main, 0.15),
            },
        }}>
            {/* ── Số lượng group ── */}
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: '0 0 auto' }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600}
                    sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 22 }}>
                    SL
                </Typography>
                {/* Min */}
                <Box sx={{
                    px: 1.25, py: 0.5, borderRadius: 1, minWidth: 52, textAlign: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                }}>
                    <Typography variant="body2" fontWeight={700} color="info.dark" sx={{ fontSize: 13 }}>
                        {min.toLocaleString('vi-VN')}
                    </Typography>
                </Box>

                <Typography variant="body2" fontWeight={700} color="text.disabled" sx={{ fontSize: 11 }}>→</Typography>

                {/* Max */}
                {isInfinity ? (
                    <Tooltip title="Bấm để nhập số cụ thể" arrow>
                        <Box onClick={() => onChange(index, 'max', prevMax + 100 || 500)}
                            sx={{
                                px: 1.25, py: 0.5, borderRadius: 1, minWidth: 52, textAlign: 'center', cursor: 'pointer',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.08)})`,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: theme.palette.info.main, transform: 'scale(1.03)' },
                            }}>
                            <Typography variant="body2" fontWeight={800} color="info.main" sx={{ fontSize: 15 }}>∞</Typography>
                        </Box>
                    </Tooltip>
                ) : (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <TextField size="small" type="number" value={tier.max}
                            sx={{
                                width: 72,
                                '& input': { textAlign: 'center', fontWeight: 700, fontSize: 13, py: 0.6 },
                                '& .MuiOutlinedInput-root': { borderRadius: 1 },
                            }}
                            onChange={e => onChange(index, 'max', parseInt(e.target.value) || 0)} />
                        <Tooltip title="Đặt vô hạn (∞)" arrow>
                            <IconButton size="small"
                                onClick={() => onChange(index, 'max', 999999)}
                                sx={{
                                    width: 26, height: 26, fontSize: 13, fontWeight: 800,
                                    color: 'info.main',
                                    bgcolor: alpha(theme.palette.info.main, 0.06),
                                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) },
                                }}>
                                ∞
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </Stack>

            {/* ── Divider ── */}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* ── Đơn giá group ── */}
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600}
                    sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 22 }}>
                    Giá
                </Typography>
                <TextField size="small" type="number" value={tier.price}
                    sx={{
                        width: 100,
                        '& input': { fontWeight: 700, fontSize: 13, py: 0.6 },
                        '& .MuiOutlinedInput-root': { borderRadius: 1 },
                    }}
                    onChange={e => onChange(index, 'price', parseInt(e.target.value) || 0)} />

                {/* Unit */}
                {unitOptions && onUnitChange ? (
                    <TextField size="small" variant="outlined" select value={tier.unit || unit}
                        onChange={e => onUnitChange(index, e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{
                            width: 95,
                            '& .MuiInputBase-input': { py: 0.5, px: 1, fontSize: 12, fontWeight: 600 },
                            '& .MuiOutlinedInput-root': { borderRadius: 1 },
                        }}>
                        {unitOptions.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </TextField>
                ) : (
                    <Chip label={unit} size="small" variant="outlined"
                        sx={{ height: 24, fontSize: 11, fontWeight: 700, borderRadius: 1, color: 'text.secondary' }} />
                )}
            </Stack>

            {/* ── Delete ── */}
            <IconButton size="small" color="error" onClick={() => onDelete(index)} disabled={!canDelete}
                sx={{
                    width: 30, height: 30, opacity: canDelete ? 0.6 : 0.2,
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.08) },
                }}>
                <Iconify icon="solar:trash-bin-minimalistic-bold" width={15} />
            </IconButton>
        </Box>
    );
}

// ===== MAIN COMPONENT =====
export default function PricingSettingsDialog({ open, onClose, onSettingsChanged, embedded = false }) {
    const theme = useTheme();
    const [tab, setTab] = useState(0);
    const [settings, setSettings] = useState(() => loadPaperSettings());
    const [catSettings, setCatSettings] = useState(() => loadCatalogueSettings());
    const [expandedSizes, setExpandedSizes] = useState({});
    const [expandedProcs, setExpandedProcs] = useState({});
    const [expandedPrint, setExpandedPrint] = useState({});
    const [expandedBinds, setExpandedBinds] = useState({});
    const [expandedLamSizes, setExpandedLamSizes] = useState({});

    // ===== DRAG & DROP for PAPERS =====
    const dragRef = useRef({ sizeId: null, dragIdx: null, overIdx: null });
    const [dragOverInfo, setDragOverInfo] = useState({ sizeId: null, overIdx: null });

    // ===== DRAG & DROP for PRINT SIZES =====
    const sizeDragRef = useRef({ dragIdx: null, overIdx: null });
    const [sizeDragOverIdx, setSizeDragOverIdx] = useState(null);

    // ===== DRAG & DROP for PROCESSING =====
    const procDragRef = useRef({ dragIdx: null, overIdx: null });
    const [procDragOverIdx, setProcDragOverIdx] = useState(null);

    const toggleSizeExpand = useCallback((sizeId) => {
        setExpandedSizes(prev => ({ ...prev, [sizeId]: !prev[sizeId] }));
    }, []);
    const toggleProcExpand = useCallback((procId) => {
        setExpandedProcs(prev => ({ ...prev, [procId]: !prev[procId] }));
    }, []);
    const togglePrintExpand = useCallback((sizeId) => {
        setExpandedPrint(prev => ({ ...prev, [sizeId]: !prev[sizeId] }));
    }, []);
    const toggleBindExpand = useCallback((bindId) => {
        setExpandedBinds(prev => ({ ...prev, [bindId]: !prev[bindId] }));
    }, []);
    const toggleLamSizeExpand = useCallback((sizeId) => {
        setExpandedLamSizes(prev => ({ ...prev, [sizeId]: !prev[sizeId] }));
    }, []);

    // ===== PAPER DRAG & DROP HANDLERS =====
    const handleDragStart = useCallback((sizeId, idx, e) => {
        dragRef.current = { sizeId, dragIdx: idx, overIdx: idx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `paper-${idx}`);
        if (e.target) e.target.style.opacity = '0.5';
    }, []);

    const handleDragEnd = useCallback((e) => {
        if (e.target) e.target.style.opacity = '1';
        const { sizeId, dragIdx, overIdx } = dragRef.current;
        if (sizeId != null && dragIdx != null && overIdx != null && dragIdx !== overIdx) {
            movePaper(sizeId, dragIdx, overIdx - dragIdx);
        }
        dragRef.current = { sizeId: null, dragIdx: null, overIdx: null };
        setDragOverInfo({ sizeId: null, overIdx: null });
    }, []);

    const handleDragOver = useCallback((sizeId, idx, e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragRef.current.sizeId === sizeId && dragRef.current.overIdx !== idx) {
            dragRef.current.overIdx = idx;
            setDragOverInfo({ sizeId, overIdx: idx });
        }
    }, []);

    // ===== PRINT SIZE DRAG & DROP HANDLERS =====
    const handleSizeDragStart = useCallback((idx, e) => {
        sizeDragRef.current = { dragIdx: idx, overIdx: idx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `size-${idx}`);
        if (e.currentTarget) e.currentTarget.style.opacity = '0.5';
    }, []);

    const handleSizeDragEnd = useCallback((e) => {
        if (e.currentTarget) e.currentTarget.style.opacity = '1';
        const { dragIdx, overIdx } = sizeDragRef.current;
        if (dragIdx != null && overIdx != null && dragIdx !== overIdx) {
            movePrintSizeOrder(dragIdx, overIdx);
        }
        sizeDragRef.current = { dragIdx: null, overIdx: null };
        setSizeDragOverIdx(null);
    }, []);

    const handleSizeDragOver = useCallback((idx, e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (sizeDragRef.current.dragIdx != null && sizeDragRef.current.overIdx !== idx) {
            sizeDragRef.current.overIdx = idx;
            setSizeDragOverIdx(idx);
        }
    }, []);

    useEffect(() => {
        if (open) {
            setSettings(loadPaperSettings());
            setCatSettings(loadCatalogueSettings());
        }
    }, [open]);

    const save = useCallback((newSettings) => {
        setSettings(newSettings);
        savePaperSettings(newSettings);
        if (onSettingsChanged) onSettingsChanged(newSettings);
    }, [onSettingsChanged]);

    // ===== PRINT OPTIONS =====
    const updatePrintTier = (optId, tierIdx, field, value) => {
        const ns = {
            ...settings, printOptions: settings.printOptions.map(o => o.id === optId ? {
                ...o, tiers: o.tiers.map((t, i) => i === tierIdx ? { ...t, [field]: value } : t)
            } : o)
        };
        save(ns);
    };
    const addPrintTier = (optId) => {
        const ns = {
            ...settings, printOptions: settings.printOptions.map(o => {
                if (o.id !== optId) return o;
                const lastTier = o.tiers[o.tiers.length - 1];
                const newMax = lastTier.max === 999999 ? 1000 : lastTier.max + 500;
                const newTiers = [...o.tiers];
                newTiers.splice(newTiers.length - 1, 0, { max: newMax, price: lastTier.price });
                return { ...o, tiers: newTiers };
            })
        };
        save(ns);
    };
    const deletePrintTier = (optId, tierIdx) => {
        const ns = {
            ...settings, printOptions: settings.printOptions.map(o => o.id === optId ? {
                ...o, tiers: o.tiers.filter((_, i) => i !== tierIdx)
            } : o)
        };
        save(ns);
    };

    // ===== LAMINATIONS =====
    const UNIT_OPTIONS = [
        { value: 'per_sheet', label: 'đ/tờ' },
        { value: 'per_m2', label: 'đ/m²' },
        { value: 'per_lot', label: 'đ/lô' },
    ];
    const getUnitLabel = (unit) => UNIT_OPTIONS.find(u => u.value === unit)?.label || 'đ/tờ';

    const updateLam = (id, field, value) => {
        const ns = {
            ...settings, laminations: settings.laminations.map(l =>
                l.id === id ? { ...l, [field]: value } : l
            )
        };
        save(ns);
    };
    const addLam = () => {
        const ns = {
            ...settings, laminations: [...settings.laminations, {
                id: Date.now(), name: 'Loại mới', unit: 'per_sheet', tiers: [{ max: 499, price: 0 }], pricePerM2: 0
            }]
        };
        save(ns);
    };
    const deleteLam = (id) => {
        if (id === 1) return;
        const ns = {
            ...settings,
            laminations: settings.laminations.filter(l => l.id !== id),
            laminationPricing: (settings.laminationPricing || []).filter(lp => lp.lamId !== id),
        };
        save(ns);
    };

    // Laminiation pricing per print size
    const lamPricing = settings.laminationPricing || [];

    const getLamPricing = (printSizeId, lamId) =>
        lamPricing.find(lp => lp.printSizeId === printSizeId && lp.lamId === lamId);

    const setLamPricing = (printSizeId, lamId, data) => {
        const existing = lamPricing.find(lp => lp.printSizeId === printSizeId && lp.lamId === lamId);
        let newLP;
        if (existing) {
            newLP = lamPricing.map(lp =>
                (lp.printSizeId === printSizeId && lp.lamId === lamId) ? { ...lp, ...data } : lp
            );
        } else {
            const lam = settings.laminations.find(l => l.id === lamId);
            const defaultUnit = lam?.unit || 'per_sheet';
            newLP = [...lamPricing, { printSizeId, lamId, unit: defaultUnit, tiers: [{ max: 999999, price: 0, unit: defaultUnit }], ...data }];
        }
        save({ ...settings, laminationPricing: newLP });
    };

    const updateLamPricingTier = (printSizeId, lamId, tierIdx, field, value) => {
        const pricing = getLamPricing(printSizeId, lamId);
        if (!pricing) return;
        const newTiers = pricing.tiers.map((t, i) => i === tierIdx ? { ...t, [field]: value } : t);
        setLamPricing(printSizeId, lamId, { tiers: newTiers });
    };

    const updateLamPricingTierUnit = (printSizeId, lamId, tierIdx, unitValue) => {
        const pricing = getLamPricing(printSizeId, lamId);
        if (!pricing) return;
        const newTiers = pricing.tiers.map((t, i) => i === tierIdx ? { ...t, unit: unitValue } : t);
        setLamPricing(printSizeId, lamId, { tiers: newTiers });
    };

    const addLamPricingTier = (printSizeId, lamId) => {
        const pricing = getLamPricing(printSizeId, lamId);
        const lam = settings.laminations.find(l => l.id === lamId);
        const defaultUnit = lam?.unit || 'per_sheet';
        if (!pricing) {
            setLamPricing(printSizeId, lamId, { tiers: [{ max: 500, price: 0, unit: defaultUnit }, { max: 999999, price: 0, unit: defaultUnit }] });
            return;
        }
        const lastT = pricing.tiers[pricing.tiers.length - 1];
        const newMax = lastT.max === 999999 ? 500 : lastT.max + 200;
        const newTiers = [...pricing.tiers];
        newTiers.splice(newTiers.length - 1, 0, { max: newMax, price: lastT.price, unit: lastT.unit || defaultUnit });
        setLamPricing(printSizeId, lamId, { tiers: newTiers });
    };

    const deleteLamPricingTier = (printSizeId, lamId, tierIdx) => {
        const pricing = getLamPricing(printSizeId, lamId);
        if (!pricing) return;
        setLamPricing(printSizeId, lamId, { tiers: pricing.tiers.filter((_, i) => i !== tierIdx) });
    };

    const removeLamPricing = (printSizeId, lamId) => {
        save({ ...settings, laminationPricing: lamPricing.filter(lp => !(lp.printSizeId === printSizeId && lp.lamId === lamId)) });
    };

    // ===== TAB 2: CÁN MÀNG =====
    const renderLaminations = () => (
        <>
            {/* Danh sách loại cán màng */}
            <SettingSection icon="solar:layers-bold-duotone" title="Loại cán màng" color="warning" onAdd={addLam} addLabel="Thêm loại">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Tên</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} width={150}>Đơn vị mặc định</TableCell>
                            <TableCell width={40} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {settings.laminations.map(l => (
                            <TableRow key={l.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
                                <TableCell>
                                    <TextField size="small" variant="standard" value={l.name} fullWidth
                                        onChange={e => updateLam(l.id, 'name', e.target.value)}
                                        InputProps={{ disableUnderline: l.id === 1 }}
                                        disabled={l.id === 1} />
                                </TableCell>
                                <TableCell>
                                    {l.id !== 1 ? (
                                        <TextField size="small" variant="standard" select value={l.unit || 'per_sheet'}
                                            onChange={e => updateLam(l.id, 'unit', e.target.value)}
                                            SelectProps={{ native: true }}
                                            sx={{ width: 100 }}>
                                            {UNIT_OPTIONS.map(u => (
                                                <option key={u.value} value={u.value}>{u.label}</option>
                                            ))}
                                        </TextField>
                                    ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                                </TableCell>
                                <TableCell>
                                    {l.id !== 1 && (
                                        <IconButton size="small" color="error" onClick={() => deleteLam(l.id)}>
                                            <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SettingSection>

            {/* Bảng giá theo khổ giấy */}
            <SettingSection icon="solar:tuning-2-bold-duotone" title="Bảng giá cán theo khổ giấy" color="info">
                {printSizes.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                        Chưa có khổ in — Thêm khổ in ở tab &quot;Loại giấy&quot; trước
                    </Typography>
                ) : (
                    <Stack spacing={1.5}>
                        {printSizes.map(size => {
                            const lamCount = settings.laminations.filter(l => l.id !== 1 && getLamPricing(size.id, l.id)).length;
                            const isExpLam = !!expandedLamSizes[size.id];
                            return (
                                <Paper key={size.id} variant="outlined" sx={{
                                    borderRadius: 2, overflow: 'hidden',
                                    borderColor: isExpLam ? alpha(theme.palette.info.main, 0.4) : alpha(theme.palette.divider, 0.8),
                                    ...(isExpLam && { boxShadow: `0 2px 12px ${alpha(theme.palette.info.main, 0.08)}` }),
                                }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}
                                        onClick={() => toggleLamSizeExpand(size.id)}
                                        sx={{
                                            px: 2, py: 1.5, cursor: 'pointer',
                                            bgcolor: isExpLam ? alpha(theme.palette.info.main, 0.06) : alpha(theme.palette.background.default, 0.4),
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) },
                                        }}>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleLamSizeExpand(size.id); }} sx={{
                                            width: 28, height: 28, transition: 'transform 0.25s ease',
                                            transform: isExpLam ? 'rotate(90deg)' : 'rotate(0deg)', color: 'info.main',
                                        }}>
                                            <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                                        </IconButton>
                                        <Iconify icon="solar:maximize-square-bold" width={20} sx={{ color: 'info.main' }} />
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                                            {size.name}
                                        </Typography>
                                        <Chip label={`${size.w}×${size.h} mm`} size="small" variant="outlined"
                                            sx={{ height: 24, fontSize: 12, fontWeight: 600, borderRadius: 1 }} />
                                        <Chip label={lamCount > 0 ? `${lamCount} loại` : 'Chưa cài'} size="small" variant="soft"
                                            color={lamCount > 0 ? 'info' : 'default'}
                                            sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                                    </Stack>

                                    <Collapse in={isExpLam} timeout={250}>
                                        <Box sx={{ p: 2, pt: 1.5 }}>
                                            {settings.laminations.filter(l => l.id !== 1).map(lam => {
                                                const pricing = getLamPricing(size.id, lam.id);
                                                const hasCustomPricing = pricing && pricing.tiers && pricing.tiers.length > 0;
                                                const defaultUnit = lam.unit || 'per_sheet';

                                                return (
                                                    <Paper key={lam.id} variant="outlined" sx={{
                                                        p: 1.5, borderRadius: 1.5, mb: 1.5,
                                                        bgcolor: hasCustomPricing ? alpha(theme.palette.warning.main, 0.04) : 'transparent',
                                                        borderColor: hasCustomPricing ? alpha(theme.palette.warning.main, 0.3) : theme.palette.divider,
                                                    }}>
                                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: hasCustomPricing ? 1 : 0 }}>
                                                            <Chip label="✨" size="small" variant="soft" sx={{ height: 24 }} />
                                                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                                                                {lam.name}
                                                            </Typography>
                                                            <Chip label={`Mặc định: ${getUnitLabel(defaultUnit)}`} size="small" variant="soft" color="info" sx={{ height: 22, fontSize: 11 }} />
                                                            {hasCustomPricing ? (
                                                                <Stack direction="row" spacing={0.5}>
                                                                    <Tooltip title="Thêm mốc">
                                                                        <IconButton size="small" color="primary" onClick={() => addLamPricingTier(size.id, lam.id)}>
                                                                            <Iconify icon="mingcute:add-line" width={14} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Xóa giá riêng">
                                                                        <IconButton size="small" color="error" onClick={() => removeLamPricing(size.id, lam.id)}>
                                                                            <Iconify icon="solar:trash-bin-minimalistic-bold" width={14} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Stack>
                                                            ) : (
                                                                <Button size="small" variant="soft" color="warning"
                                                                    startIcon={<Iconify icon="mingcute:add-line" />}
                                                                    onClick={() => {
                                                                        const dUnit = lam.unit || 'per_sheet';
                                                                        setLamPricing(size.id, lam.id, {
                                                                            unit: dUnit,
                                                                            tiers: [{ max: 500, price: 0, unit: dUnit }, { max: 999999, price: 0, unit: dUnit }]
                                                                        });
                                                                    }}
                                                                    sx={{ fontSize: 12 }}>
                                                                    Thêm giá
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                        {hasCustomPricing && (
                                                            <Box sx={{ pl: 1 }}>
                                                                {[...pricing.tiers].sort((a, b) => a.max - b.max).map((tier, idx, sortedArr) => (
                                                                    <TierRow key={idx} tier={tier} index={idx}
                                                                        prevMax={idx > 0 ? sortedArr[idx - 1].max : 0}
                                                                        unit={getUnitLabel(tier.unit || defaultUnit)}
                                                                        unitOptions={UNIT_OPTIONS}
                                                                        onUnitChange={(i, v) => updateLamPricingTierUnit(size.id, lam.id, i, v)}
                                                                        onChange={(i, f, v) => updateLamPricingTier(size.id, lam.id, i, f, v)}
                                                                        onDelete={(i) => deleteLamPricingTier(size.id, lam.id, i)}
                                                                        canDelete={pricing.tiers.length > 1} />
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                );
                                            })}
                                        </Box>
                                    </Collapse>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </SettingSection>
        </>
    );
    const updateProc = (id, field, value) => {
        const ns = {
            ...settings, processing: settings.processing.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            )
        };
        save(ns);
    };
    const updateProcTier = (id, tierIdx, field, value) => {
        const ns = {
            ...settings, processing: settings.processing.map(p => p.id === id ? {
                ...p, tiers: p.tiers.map((t, i) => i === tierIdx ? { ...t, [field]: value } : t)
            } : p)
        };
        save(ns);
    };
    const addProcTier = (id) => {
        const ns = {
            ...settings, processing: settings.processing.map(p => {
                if (p.id !== id) return p;
                const sorted = [...p.tiers].sort((a, b) => a.max - b.max);
                const hasInfinity = sorted[sorted.length - 1]?.max === 999999;
                const lastFinite = hasInfinity && sorted.length >= 2 ? sorted[sorted.length - 2] : sorted[sorted.length - 1];
                const newMax = (lastFinite?.max || 100) + 100;
                return { ...p, tiers: [...p.tiers, { max: newMax, price: lastFinite?.price || 100 }] };
            })
        };
        save(ns);
    };
    const deleteProcTier = (id, tierIdx) => {
        const ns = {
            ...settings, processing: settings.processing.map(p => p.id === id ? {
                ...p, tiers: p.tiers.filter((_, i) => i !== tierIdx)
            } : p)
        };
        save(ns);
    };
    const addProc = () => {
        const ns = {
            ...settings, processing: [...settings.processing, {
                id: Date.now(), name: 'Gia công mới', unit: 'per_item',
                tiers: [{ max: 100, price: 200 }, { max: 500, price: 100 }, { max: 999999, price: 50 }]
            }]
        };
        save(ns);
    };
    const deleteProc = (id) => {
        const ns = { ...settings, processing: settings.processing.filter(p => p.id !== id) };
        save(ns);
    };
    const updateProcTierUnit = (id, tierIdx, unitValue) => {
        const ns = {
            ...settings, processing: settings.processing.map(p => p.id === id ? {
                ...p, tiers: p.tiers.map((t, i) => i === tierIdx ? { ...t, unit: unitValue } : t)
            } : p)
        };
        save(ns);
    };
    const moveProc = (fromIdx, toIdx) => {
        const arr = [...settings.processing];
        if (toIdx < 0 || toIdx >= arr.length) return;
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        save({ ...settings, processing: arr });
    };
    const handleProcDragStart = useCallback((idx, e) => {
        procDragRef.current = { dragIdx: idx, overIdx: idx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `proc-${idx}`);
        if (e.currentTarget) e.currentTarget.style.opacity = '0.5';
    }, []);
    const handleProcDragEnd = useCallback((e) => {
        if (e.currentTarget) e.currentTarget.style.opacity = '1';
        const { dragIdx, overIdx } = procDragRef.current;
        if (dragIdx != null && overIdx != null && dragIdx !== overIdx) {
            moveProc(dragIdx, overIdx);
        }
        procDragRef.current = { dragIdx: null, overIdx: null };
        setProcDragOverIdx(null);
    }, []);
    const handleProcDragOver = useCallback((idx, e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (procDragRef.current.dragIdx != null && procDragRef.current.overIdx !== idx) {
            procDragRef.current.overIdx = idx;
            setProcDragOverIdx(idx);
        }
    }, []);

    // ===== CUSTOMER TYPES =====
    const updateCust = (id, field, value) => {
        const ns = {
            ...settings, customerTypes: settings.customerTypes.map(c =>
                c.id === id ? { ...c, [field]: field === 'profit' ? parseInt(value) || 0 : value } : c
            )
        };
        save(ns);
    };
    const addCust = () => {
        const ns = {
            ...settings, customerTypes: [...settings.customerTypes, {
                id: Date.now(), name: 'Loại mới', profit: 20
            }]
        };
        save(ns);
    };
    const deleteCust = (id) => {
        const ns = { ...settings, customerTypes: settings.customerTypes.filter(c => c.id !== id) };
        save(ns);
    };

    // ===== BINDINGS (catalogue settings) =====
    const catBindings = catSettings.bindings || [];
    const saveCat = useCallback((newCat) => {
        setCatSettings(newCat);
        saveCatalogueSettings(newCat);
        onSettingsChanged?.();
    }, [onSettingsChanged]);
    const addBinding = () => {
        const ns = { ...catSettings, bindings: [...catBindings, { id: Date.now(), name: 'Loại mới', tiers: [{ max: 100, price: 500 }, { max: 999999, price: 300 }] }] };
        saveCat(ns);
    };
    const updateBinding = (id, field, value) => {
        const ns = { ...catSettings, bindings: catBindings.map(b => b.id === id ? { ...b, [field]: value } : b) };
        saveCat(ns);
    };
    const deleteBinding = (id) => {
        const ns = { ...catSettings, bindings: catBindings.filter(b => b.id !== id) };
        saveCat(ns);
    };
    const updateBindTier = (id, tierIdx, field, value) => {
        const ns = {
            ...catSettings, bindings: catBindings.map(b =>
                b.id === id ? { ...b, tiers: b.tiers.map((t, i) => i === tierIdx ? { ...t, [field]: value } : t) } : b
            )
        };
        saveCat(ns);
    };
    const addBindTier = (id) => {
        const ns = {
            ...catSettings, bindings: catBindings.map(b => {
                if (b.id !== id) return b;
                const sorted = [...b.tiers].sort((a, bb) => a.max - bb.max);
                const hasInfinity = sorted[sorted.length - 1]?.max === 999999;
                const lastFinite = hasInfinity && sorted.length >= 2 ? sorted[sorted.length - 2] : sorted[sorted.length - 1];
                const newMax = (lastFinite?.max || 100) + 100;
                return { ...b, tiers: [...b.tiers, { max: newMax, price: lastFinite?.price || 500, pricePerPage: lastFinite?.pricePerPage || 0 }] };
            })
        };
        saveCat(ns);
    };
    const deleteBindTier = (id, tierIdx) => {
        const ns = {
            ...catSettings, bindings: catBindings.map(b =>
                b.id === id ? { ...b, tiers: b.tiers.filter((_, i) => i !== tierIdx) } : b
            )
        };
        saveCat(ns);
    };
    const updateBindTierUnit = (id, tierIdx, unitValue) => {
        const ns = {
            ...catSettings, bindings: catBindings.map(b =>
                b.id === id ? { ...b, tiers: b.tiers.map((t, i) => i === tierIdx ? { ...t, unit: unitValue } : t) } : b
            )
        };
        saveCat(ns);
    };
    const BIND_UNIT_OPTIONS = [
        { value: 'per_item', label: 'đ/cuốn' },
        { value: 'per_lot', label: 'đ/lô' },
    ];
    const getBindUnitLabel = (unit) => BIND_UNIT_OPTIONS.find(u => u.value === unit)?.label || 'đ/cuốn';

    // ===== DRAG & DROP for BINDINGS =====
    const bindDragRef = useRef({ dragIdx: null, overIdx: null });
    const [bindDragOverIdx, setBindDragOverIdx] = useState(null);
    const moveBinding = (fromIdx, toIdx) => {
        const arr = [...catBindings];
        if (toIdx < 0 || toIdx >= arr.length) return;
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        saveCat({ ...catSettings, bindings: arr });
    };
    const handleBindDragStart = useCallback((idx, e) => {
        bindDragRef.current = { dragIdx: idx, overIdx: idx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `bind-${idx}`);
        if (e.currentTarget) e.currentTarget.style.opacity = '0.5';
    }, []);
    const handleBindDragEnd = useCallback((e) => {
        if (e.currentTarget) e.currentTarget.style.opacity = '1';
        const { dragIdx, overIdx } = bindDragRef.current;
        if (dragIdx != null && overIdx != null && dragIdx !== overIdx) moveBinding(dragIdx, overIdx);
        bindDragRef.current = { dragIdx: null, overIdx: null };
        setBindDragOverIdx(null);
    }, []);
    const handleBindDragOver = useCallback((idx, e) => {
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        if (bindDragRef.current.dragIdx != null && bindDragRef.current.overIdx !== idx) {
            bindDragRef.current.overIdx = idx; setBindDragOverIdx(idx);
        }
    }, []);

    // ===== DRAG & DROP for CUSTOMERS =====
    const custDragRef = useRef({ dragIdx: null, overIdx: null });
    const [custDragOverIdx, setCustDragOverIdx] = useState(null);
    const moveCust = (fromIdx, toIdx) => {
        const arr = [...settings.customerTypes];
        if (toIdx < 0 || toIdx >= arr.length) return;
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        save({ ...settings, customerTypes: arr });
    };
    const handleCustDragStart = useCallback((idx, e) => {
        custDragRef.current = { dragIdx: idx, overIdx: idx };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `cust-${idx}`);
        if (e.currentTarget) e.currentTarget.style.opacity = '0.5';
    }, []);
    const handleCustDragEnd = useCallback((e) => {
        if (e.currentTarget) e.currentTarget.style.opacity = '1';
        const { dragIdx, overIdx } = custDragRef.current;
        if (dragIdx != null && overIdx != null && dragIdx !== overIdx) moveCust(dragIdx, overIdx);
        custDragRef.current = { dragIdx: null, overIdx: null };
        setCustDragOverIdx(null);
    }, []);
    const handleCustDragOver = useCallback((idx, e) => {
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        if (custDragRef.current.dragIdx != null && custDragRef.current.overIdx !== idx) {
            custDragRef.current.overIdx = idx; setCustDragOverIdx(idx);
        }
    }, []);

    // ===== PRINT SIZES & PAPER TYPES =====
    const printSizes = settings.printSizes || [];
    const paperPricing = settings.paperPricing || [];

    const addPrintSize = () => {
        const newId = Date.now();
        const ns = {
            ...settings,
            printSizes: [...printSizes, { id: newId, name: 'Khổ mới', w: 325, h: 430 }],
            paperPricing: [...paperPricing, { printSizeId: newId, papers: [] }],
        };
        save(ns);
    };
    const updatePrintSize = (id, field, value) => {
        const ns = {
            ...settings, printSizes: printSizes.map(s =>
                s.id === id ? { ...s, [field]: field === 'name' ? value : parseInt(value) || 0 } : s
            )
        };
        save(ns);
    };
    const deletePrintSize = (id) => {
        const ns = {
            ...settings,
            printSizes: printSizes.filter(s => s.id !== id),
            paperPricing: paperPricing.filter(pp => pp.printSizeId !== id),
        };
        save(ns);
    };
    const addPaperType = (printSizeId) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp =>
                pp.printSizeId === printSizeId ? {
                    ...pp, papers: [...pp.papers, {
                        id: Date.now(), name: 'Giấy mới', tiers: [{ max: 500, price: 1000 }, { max: 999999, price: 800 }]
                    }]
                } : pp
            )
        };
        save(ns);
    };
    const updatePaperName = (printSizeId, paperId, name) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp =>
                pp.printSizeId === printSizeId ? {
                    ...pp, papers: pp.papers.map(p =>
                        p.id === paperId ? { ...p, name } : p
                    )
                } : pp
            )
        };
        save(ns);
    };
    const updatePaperTier = (printSizeId, paperId, tierIdx, field, value) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp =>
                pp.printSizeId === printSizeId ? {
                    ...pp, papers: pp.papers.map(p =>
                        p.id === paperId ? {
                            ...p, tiers: p.tiers.map((t, i) =>
                                i === tierIdx ? { ...t, [field]: value } : t
                            )
                        } : p
                    )
                } : pp
            )
        };
        save(ns);
    };
    const addPaperTier = (printSizeId, paperId) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp =>
                pp.printSizeId === printSizeId ? {
                    ...pp, papers: pp.papers.map(p => {
                        if (p.id !== paperId) return p;
                        const lastT = p.tiers[p.tiers.length - 1];
                        const newMax = lastT.max === 999999 ? 1000 : lastT.max + 500;
                        const newTiers = [...p.tiers];
                        newTiers.splice(newTiers.length - 1, 0, { max: newMax, price: lastT.price });
                        return { ...p, tiers: newTiers };
                    })
                } : pp
            )
        };
        save(ns);
    };
    const deletePaperTier = (printSizeId, paperId, tierIdx) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp =>
                pp.printSizeId === printSizeId ? {
                    ...pp, papers: pp.papers.map(p =>
                        p.id === paperId ? { ...p, tiers: p.tiers.filter((_, i) => i !== tierIdx) } : p
                    )
                } : pp
            )
        };
        save(ns);
    };
    const deletePaperType = (printSizeId, paperId) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp =>
                pp.printSizeId === printSizeId ? { ...pp, papers: pp.papers.filter(p => p.id !== paperId) } : pp
            )
        };
        save(ns);
    };
    const movePaper = (printSizeId, fromIdx, offset) => {
        const ns = {
            ...settings, paperPricing: paperPricing.map(pp => {
                if (pp.printSizeId !== printSizeId) return pp;
                const arr = [...pp.papers];
                const toIdx = fromIdx + offset;
                if (toIdx < 0 || toIdx >= arr.length) return pp;
                // Remove item and insert at new position
                const [moved] = arr.splice(fromIdx, 1);
                arr.splice(toIdx, 0, moved);
                return { ...pp, papers: arr };
            })
        };
        save(ns);
    };
    const movePrintSizeOrder = (fromIdx, toIdx) => {
        const newSizes = [...printSizes];
        const [moved] = newSizes.splice(fromIdx, 1);
        newSizes.splice(toIdx, 0, moved);
        save({ ...settings, printSizes: newSizes });
    };

    // ===== TAB 0: LOẠI GIẤY & KHỔ IN =====
    const renderPaperTypes = () => (
        <>
            <SettingSection icon="solar:document-bold-duotone" title="Khổ in" color="info" onAdd={addPrintSize} addLabel="Thêm khổ">
                {printSizes.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                        Chưa có khổ in nào — Bấm &quot;Thêm khổ&quot; để bắt đầu
                    </Typography>
                ) : (
                    <Stack spacing={1.5}>
                        {printSizes.map((size, sizeIdx) => {
                            const pricing = paperPricing.find(pp => pp.printSizeId === size.id);
                            const papers2 = pricing?.papers || [];
                            const isExpanded = !!expandedSizes[size.id];
                            const isSizeDragOver = sizeDragOverIdx === sizeIdx;
                            return (
                                <Paper key={size.id} variant="outlined"
                                    draggable
                                    onDragStart={(e) => handleSizeDragStart(sizeIdx, e)}
                                    onDragEnd={handleSizeDragEnd}
                                    onDragOver={(e) => handleSizeDragOver(sizeIdx, e)}
                                    sx={{
                                        borderRadius: 2, overflow: 'hidden',
                                        borderColor: isSizeDragOver
                                            ? theme.palette.primary.main
                                            : isExpanded
                                                ? alpha(theme.palette.info.main, 0.4)
                                                : alpha(theme.palette.divider, 0.8),
                                        borderWidth: isSizeDragOver ? 2 : 1,
                                        transition: 'all 0.2s ease',
                                        ...(isSizeDragOver && {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        }),
                                        ...(isExpanded && !isSizeDragOver && {
                                            boxShadow: `0 2px 12px ${alpha(theme.palette.info.main, 0.08)}`,
                                        }),
                                    }}>
                                    {/* Print size header — clickable to toggle */}
                                    <Stack direction="row" alignItems="center" spacing={1.5}
                                        onClick={() => toggleSizeExpand(size.id)}
                                        sx={{
                                            px: 2, py: 1.5, cursor: 'pointer',
                                            bgcolor: isExpanded
                                                ? alpha(theme.palette.info.main, 0.06)
                                                : alpha(theme.palette.background.default, 0.4),
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.info.main, 0.08),
                                            },
                                        }}>
                                        {/* Drag handle for print size */}
                                        <Box
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'grab', px: 0.25, py: 0.5, borderRadius: 0.5,
                                                color: 'text.disabled',
                                                transition: 'all 0.15s',
                                                '&:hover': {
                                                    color: 'text.secondary',
                                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                },
                                                '&:active': { cursor: 'grabbing' },
                                            }}>
                                            <Iconify icon="solar:hamburger-menu-outline" width={18} />
                                        </Box>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleSizeExpand(size.id); }} sx={{
                                            width: 28, height: 28,
                                            transition: 'transform 0.25s ease',
                                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                            color: 'info.main',
                                        }}>
                                            <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                                        </IconButton>
                                        <Iconify icon="solar:maximize-square-bold" width={20} sx={{ color: 'info.main' }} />
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 90 }}>
                                            {size.name}
                                        </Typography>
                                        <Chip label={`${size.w}×${size.h} mm`} size="small" variant="outlined"
                                            sx={{ height: 24, fontSize: 12, fontWeight: 600, borderRadius: 1 }} />
                                        <Chip label={`${papers2.length} loại giấy`} size="small" variant="soft" color="info"
                                            sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                                        <Box sx={{ flex: 1 }} />
                                        <Tooltip title="Thêm loại giấy">
                                            <Button size="small" variant="soft" color="primary"
                                                startIcon={<Iconify icon="mingcute:add-line" />}
                                                onClick={(e) => { e.stopPropagation(); addPaperType(size.id); if (!isExpanded) toggleSizeExpand(size.id); }}>Thêm giấy</Button>
                                        </Tooltip>
                                        <Tooltip title="Xóa khổ in">
                                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deletePrintSize(size.id); }}>
                                                <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>

                                    {/* Collapsible content */}
                                    <Collapse in={isExpanded} timeout={250}>
                                        <Box sx={{ p: 2, pt: 1.5 }}>
                                            {/* Editable dimensions */}
                                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>Kích thước:</Typography>
                                                <TextField size="small" variant="standard" value={size.name}
                                                    sx={{ width: 100, '& input': { fontWeight: 700, fontSize: 14 } }}
                                                    onChange={e => updatePrintSize(size.id, 'name', e.target.value)} />
                                                <TextField size="small" type="number" value={size.w} sx={{ width: 100 }}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                                                    onChange={e => updatePrintSize(size.id, 'w', e.target.value)} />
                                                <Typography variant="body2" fontWeight={700}>×</Typography>
                                                <TextField size="small" type="number" value={size.h} sx={{ width: 100 }}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                                                    onChange={e => updatePrintSize(size.id, 'h', e.target.value)} />
                                            </Stack>

                                            {/* Paper types list */}
                                            {papers2.length === 0 ? (
                                                <Typography variant="caption" color="text.disabled" sx={{ pl: 2 }}>
                                                    Chưa có loại giấy — Bấm &quot;Thêm giấy&quot;
                                                </Typography>
                                            ) : (
                                                <Stack spacing={1}>
                                                    {papers2.map((paper, paperIdx) => {
                                                        const isDragOver = dragOverInfo.sizeId === size.id && dragOverInfo.overIdx === paperIdx;
                                                        return (
                                                            <Paper key={paper.id} variant="outlined"
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(size.id, paperIdx, e)}
                                                                onDragEnd={handleDragEnd}
                                                                onDragOver={(e) => handleDragOver(size.id, paperIdx, e)}
                                                                sx={{
                                                                    p: 1.5, borderRadius: 1.5,
                                                                    bgcolor: isDragOver
                                                                        ? alpha(theme.palette.primary.main, 0.06)
                                                                        : alpha(theme.palette.background.default, 0.5),
                                                                    borderColor: isDragOver
                                                                        ? theme.palette.primary.main
                                                                        : theme.palette.divider,
                                                                    borderWidth: isDragOver ? 2 : 1,
                                                                    transition: 'background-color 0.15s, border-color 0.15s',
                                                                    cursor: 'default',
                                                                }}>
                                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                                    {/* Drag handle */}
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            cursor: 'grab', px: 0.25, py: 0.5, borderRadius: 0.5,
                                                                            color: 'text.disabled',
                                                                            transition: 'all 0.15s',
                                                                            '&:hover': {
                                                                                color: 'text.secondary',
                                                                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                                            },
                                                                            '&:active': { cursor: 'grabbing' },
                                                                        }}>
                                                                        <Iconify icon="solar:hamburger-menu-outline" width={18} />
                                                                    </Box>
                                                                    <Chip label={`#${paperIdx + 1}`} size="small" variant="soft"
                                                                        sx={{ height: 22, fontSize: 10, fontWeight: 700, borderRadius: 1, minWidth: 32 }} />
                                                                    <TextField size="small" variant="standard" value={paper.name}
                                                                        sx={{ flex: 1, '& input': { fontWeight: 600 } }}
                                                                        onChange={e => updatePaperName(size.id, paper.id, e.target.value)} />
                                                                    <Tooltip title="Thêm mốc giá">
                                                                        <IconButton size="small" color="primary" onClick={() => addPaperTier(size.id, paper.id)}>
                                                                            <Iconify icon="mingcute:add-line" width={14} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Xóa giấy">
                                                                        <IconButton size="small" color="error" onClick={() => deletePaperType(size.id, paper.id)}>
                                                                            <Iconify icon="solar:trash-bin-minimalistic-bold" width={14} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Stack>
                                                                {[...paper.tiers].sort((a, b) => a.max - b.max).map((tier, idx, sortedArr) => (
                                                                    <TierRow key={idx} tier={tier} index={idx} unit="đ/tờ"
                                                                        prevMax={idx > 0 ? sortedArr[idx - 1].max : 0}
                                                                        onChange={(i, f, v) => updatePaperTier(size.id, paper.id, i, f, v)}
                                                                        onDelete={(i) => deletePaperTier(size.id, paper.id, i)}
                                                                        canDelete={paper.tiers.length > 1} />
                                                                ))}
                                                            </Paper>
                                                        );
                                                    })}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </SettingSection>
        </>
    );

    // ===== TAB 1: GIÁ IN (THEO KHỔ GIẤY) =====
    const printPricingBySize = settings.printPricingBySize || [];

    const getPrintPricingForSize = (printSizeId) =>
        printPricingBySize.find(pp => pp.printSizeId === printSizeId);

    const setPrintPricingForSize = (printSizeId, data) => {
        const existing = printPricingBySize.find(pp => pp.printSizeId === printSizeId);
        let newPP;
        if (existing) {
            newPP = printPricingBySize.map(pp =>
                pp.printSizeId === printSizeId ? { ...pp, ...data } : pp
            );
        } else {
            // Default: copy from global printOptions (In 1 mặt)
            const globalOpt = settings.printOptions.find(o => o.id === 1);
            const defaultTiers = globalOpt ? globalOpt.tiers.map(t => ({ ...t })) : [{ max: 500, price: 2000 }, { max: 999999, price: 1800 }];
            newPP = [...printPricingBySize, { printSizeId, tiers: defaultTiers, ...data }];
        }
        save({ ...settings, printPricingBySize: newPP });
    };

    const updatePrintPricingSizeTier = (printSizeId, tierIdx, field, value) => {
        const pricing = getPrintPricingForSize(printSizeId);
        if (!pricing) return;
        const newTiers = pricing.tiers.map((t, i) => i === tierIdx ? { ...t, [field]: value } : t);
        setPrintPricingForSize(printSizeId, { tiers: newTiers });
    };

    const addPrintPricingSizeTier = (printSizeId) => {
        const pricing = getPrintPricingForSize(printSizeId);
        if (!pricing) {
            // Init with global tiers
            const globalOpt = settings.printOptions.find(o => o.id === 1);
            const defaultTiers = globalOpt ? globalOpt.tiers.map(t => ({ ...t })) : [{ max: 500, price: 2000 }, { max: 999999, price: 1800 }];
            setPrintPricingForSize(printSizeId, { tiers: defaultTiers });
            return;
        }
        const lastT = pricing.tiers[pricing.tiers.length - 1];
        const newMax = lastT.max === 999999 ? 500 : lastT.max + 200;
        const newTiers = [...pricing.tiers];
        newTiers.splice(newTiers.length - 1, 0, { max: newMax, price: lastT.price });
        setPrintPricingForSize(printSizeId, { tiers: newTiers });
    };

    const deletePrintPricingSizeTier = (printSizeId, tierIdx) => {
        const pricing = getPrintPricingForSize(printSizeId);
        if (!pricing) return;
        setPrintPricingForSize(printSizeId, { tiers: pricing.tiers.filter((_, i) => i !== tierIdx) });
    };

    const initPrintPricingForSize = (printSizeId) => {
        const globalOpt = settings.printOptions.find(o => o.id === 1);
        const defaultTiers = globalOpt ? globalOpt.tiers.map(t => ({ ...t })) : [{ max: 500, price: 2000 }, { max: 999999, price: 1800 }];
        setPrintPricingForSize(printSizeId, { tiers: defaultTiers });
    };

    const renderPrintPricing = () => (
        <SettingSection icon="solar:printer-bold-duotone" title="Giá in / tờ" color="primary">
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                💡 Giá in 2 mặt tự động = In 1 mặt × 2 — Giá in được cài đặt riêng cho từng khổ giấy
            </Typography>

            {printSizes.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                    Chưa có khổ in — Thêm khổ in ở tab &quot;Loại giấy&quot; trước
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {printSizes.map(size => {
                        const pricing = getPrintPricingForSize(size.id);
                        const hasPricing = pricing && pricing.tiers && pricing.tiers.length > 0;
                        const isExpPrint = !!expandedPrint[size.id];

                        return (
                            <Paper key={size.id} variant="outlined" sx={{
                                borderRadius: 2, overflow: 'hidden',
                                borderColor: isExpPrint ? alpha(theme.palette.primary.main, 0.4) : alpha(theme.palette.divider, 0.8),
                                ...(isExpPrint && { boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}` }),
                            }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}
                                    onClick={() => togglePrintExpand(size.id)}
                                    sx={{
                                        px: 2, py: 1.5, cursor: 'pointer',
                                        bgcolor: isExpPrint ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.background.default, 0.4),
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                    }}>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); togglePrintExpand(size.id); }} sx={{
                                        width: 28, height: 28, transition: 'transform 0.25s ease',
                                        transform: isExpPrint ? 'rotate(90deg)' : 'rotate(0deg)',
                                        color: 'primary.main',
                                    }}>
                                        <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                                    </IconButton>
                                    <Iconify icon="solar:printer-bold" width={20} sx={{ color: 'primary.main' }} />
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                                        {size.name}
                                    </Typography>
                                    <Chip label={`${size.w}×${size.h} mm`} size="small" variant="outlined"
                                        sx={{ height: 24, fontSize: 12, fontWeight: 600, borderRadius: 1 }} />
                                    {hasPricing ? (
                                        <Chip label={`${pricing.tiers.length} mốc`} size="small" variant="soft" color="primary"
                                            sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                                    ) : (
                                        <Chip label="Chưa cài" size="small" variant="soft" color="default"
                                            sx={{ height: 22, fontSize: 11 }} />
                                    )}
                                    <Tooltip title="Thêm mốc">
                                        <IconButton size="small" color="primary" onClick={(e) => {
                                            e.stopPropagation();
                                            if (!hasPricing) initPrintPricingForSize(size.id);
                                            else addPrintPricingSizeTier(size.id);
                                            if (!isExpPrint) togglePrintExpand(size.id);
                                        }}>
                                            <Iconify icon="mingcute:add-line" width={14} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>

                                <Collapse in={isExpPrint} timeout={250}>
                                    <Box sx={{ p: 2, pt: 1.5 }}>
                                        {hasPricing ? (
                                            <>
                                                <Chip label="In 1 mặt" size="small" color="primary" variant="soft" sx={{ height: 22, fontSize: 11, mb: 1.5 }} />
                                                {[...pricing.tiers].sort((a, b) => a.max - b.max).map((tier, idx, sortedArr) => (
                                                    <TierRow key={idx} tier={tier} index={idx} unit="đ/tờ"
                                                        prevMax={idx > 0 ? sortedArr[idx - 1].max : 0}
                                                        onChange={(i, f, v) => updatePrintPricingSizeTier(size.id, i, f, v)}
                                                        onDelete={(i) => deletePrintPricingSizeTier(size.id, i)}
                                                        canDelete={pricing.tiers.length > 1} />
                                                ))}
                                            </>
                                        ) : (
                                            <Button size="small" variant="soft" color="primary"
                                                startIcon={<Iconify icon="mingcute:add-line" />}
                                                onClick={() => initPrintPricingForSize(size.id)}
                                                sx={{ fontSize: 12 }}>
                                                Cài giá in
                                            </Button>
                                        )}
                                    </Box>
                                </Collapse>
                            </Paper>
                        );
                    })}
                </Stack>
            )}
        </SettingSection>
    );

    // ===== TAB 3: GIA CÔNG =====
    const PROC_UNIT_OPTIONS = [
        { value: 'per_lot', label: 'đ/lô' },
        { value: 'per_item', label: 'đ/sp' },
        { value: 'per_sheet', label: 'đ/tờ' },
    ];
    const getProcUnitLabel = (unit) => PROC_UNIT_OPTIONS.find(u => u.value === unit)?.label || 'đ/sp';

    const renderProcessing = () => (
        <SettingSection icon="solar:scissors-bold-duotone" title="Gia công" color="error" onAdd={addProc} addLabel="Thêm gia công">
            <Stack spacing={1.5}>
                {settings.processing.filter(Boolean).map((proc, procIdx) => {
                    const procUnit = proc.unit || 'per_item';
                    const procTiers = (proc.tiers || []).filter(Boolean);
                    const isExpanded = !!expandedProcs[proc.id];
                    const isProcDragOver = procDragOverIdx === procIdx;
                    return (
                        <Paper key={proc.id} variant="outlined"
                            draggable
                            onDragStart={(e) => handleProcDragStart(procIdx, e)}
                            onDragEnd={handleProcDragEnd}
                            onDragOver={(e) => handleProcDragOver(procIdx, e)}
                            sx={{
                                borderRadius: 2, overflow: 'hidden',
                                borderColor: isProcDragOver
                                    ? theme.palette.primary.main
                                    : isExpanded
                                        ? alpha(theme.palette.error.main, 0.4)
                                        : alpha(theme.palette.divider, 0.8),
                                borderWidth: isProcDragOver ? 2 : 1,
                                transition: 'all 0.2s ease',
                                ...(isProcDragOver && { bgcolor: alpha(theme.palette.primary.main, 0.04) }),
                                ...(isExpanded && !isProcDragOver && {
                                    boxShadow: `0 2px 12px ${alpha(theme.palette.error.main, 0.08)}`,
                                }),
                            }}>
                            {/* Header — clickable to toggle */}
                            <Stack direction="row" alignItems="center" spacing={1.5}
                                onClick={() => toggleProcExpand(proc.id)}
                                sx={{
                                    px: 2, py: 1.5, cursor: 'pointer',
                                    bgcolor: isExpanded
                                        ? alpha(theme.palette.error.main, 0.06)
                                        : alpha(theme.palette.background.default, 0.4),
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                                }}>
                                {/* Drag handle */}
                                <Box
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'grab', px: 0.25, py: 0.5, borderRadius: 0.5,
                                        color: 'text.disabled', transition: 'all 0.15s',
                                        '&:hover': { color: 'text.secondary', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                                        '&:active': { cursor: 'grabbing' },
                                    }}>
                                    <Iconify icon="solar:hamburger-menu-outline" width={18} />
                                </Box>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleProcExpand(proc.id); }} sx={{
                                    width: 28, height: 28, transition: 'transform 0.25s ease',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    color: 'error.main',
                                }}>
                                    <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                                </IconButton>
                                <Iconify icon="solar:scissors-bold" width={20} sx={{ color: 'error.main' }} />
                                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                                    {proc.name}
                                </Typography>
                                <Chip label={getProcUnitLabel(procUnit)} size="small" variant="outlined"
                                    sx={{ height: 24, fontSize: 12, fontWeight: 600, borderRadius: 1 }} />
                                <Chip label={`${procTiers.length} mốc`} size="small" variant="soft" color="error"
                                    sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                                <Tooltip title="Thêm mốc">
                                    <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); addProcTier(proc.id); if (!isExpanded) toggleProcExpand(proc.id); }}>
                                        <Iconify icon="mingcute:add-line" width={14} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteProc(proc.id); }}>
                                        <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            {/* Collapsible content */}
                            <Collapse in={isExpanded} timeout={250}>
                                <Box sx={{ p: 2, pt: 1.5 }}>
                                    {/* Editable name & unit */}
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>Tên:</Typography>
                                        <TextField size="small" variant="standard" value={proc.name}
                                            sx={{ flex: 1, '& input': { fontWeight: 700, fontSize: 14 } }}
                                            onChange={e => updateProc(proc.id, 'name', e.target.value)} />
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>Đơn vị:</Typography>
                                        <TextField size="small" variant="outlined" select value={procUnit}
                                            onChange={e => updateProc(proc.id, 'unit', e.target.value)}
                                            SelectProps={{ native: true }}
                                            sx={{ width: 90, '& .MuiInputBase-input': { py: 0.5, fontSize: 13 } }}>
                                            {PROC_UNIT_OPTIONS.map(u => (
                                                <option key={u.value} value={u.value}>{u.label}</option>
                                            ))}
                                        </TextField>
                                    </Stack>
                                    {/* Tier rows */}
                                    {procTiers
                                        .map((tier, origIdx) => ({ ...tier, _oi: origIdx }))
                                        .sort((a, b) => a.max - b.max)
                                        .map((tier, displayIdx, sortedArr) => (
                                            <TierRow key={tier._oi} tier={tier} index={tier._oi}
                                                prevMax={displayIdx > 0 ? sortedArr[displayIdx - 1].max : 0}
                                                unit={getProcUnitLabel(tier.unit || procUnit)}
                                                unitOptions={PROC_UNIT_OPTIONS}
                                                onUnitChange={(i, v) => updateProcTierUnit(proc.id, i, v)}
                                                onChange={(i, f, v) => updateProcTier(proc.id, i, f, v)}
                                                onDelete={(i) => deleteProcTier(proc.id, i)}
                                                canDelete={procTiers.length > 1} />
                                        ))}
                                </Box>
                            </Collapse>
                        </Paper>
                    );
                })}
            </Stack>
        </SettingSection>
    );

    // ===== TAB 5: ĐÓNG CUỐN =====
    const renderBindings = () => (
        <SettingSection icon="solar:bookmark-bold-duotone" title="Đóng cuốn" color="warning" onAdd={addBinding} addLabel="Thêm loại">
            <Stack spacing={1.5}>
                {catBindings.filter(Boolean).map((bind, bindIdx) => {
                    const isExpBind = !!expandedBinds[bind.id];
                    const isBindDragOver = bindDragOverIdx === bindIdx;
                    return (
                        <Paper key={bind.id} variant="outlined"
                            draggable
                            onDragStart={(e) => handleBindDragStart(bindIdx, e)}
                            onDragEnd={handleBindDragEnd}
                            onDragOver={(e) => handleBindDragOver(bindIdx, e)}
                            sx={{
                                borderRadius: 2, overflow: 'hidden',
                                borderColor: isBindDragOver ? theme.palette.primary.main
                                    : isExpBind ? alpha(theme.palette.warning.main, 0.4) : alpha(theme.palette.divider, 0.8),
                                borderWidth: isBindDragOver ? 2 : 1,
                                transition: 'all 0.2s ease',
                                ...(isBindDragOver && { bgcolor: alpha(theme.palette.primary.main, 0.04) }),
                                ...(isExpBind && !isBindDragOver && { boxShadow: `0 2px 12px ${alpha(theme.palette.warning.main, 0.08)}` }),
                            }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}
                                onClick={() => toggleBindExpand(bind.id)}
                                sx={{
                                    px: 2, py: 1.5, cursor: 'pointer',
                                    bgcolor: isExpBind ? alpha(theme.palette.warning.main, 0.06) : alpha(theme.palette.background.default, 0.4),
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.08) },
                                }}>
                                <Box onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
                                    sx={{
                                        display: 'flex', alignItems: 'center', cursor: 'grab', px: 0.25, py: 0.5, borderRadius: 0.5,
                                        color: 'text.disabled', transition: 'all 0.15s',
                                        '&:hover': { color: 'text.secondary', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                                        '&:active': { cursor: 'grabbing' }
                                    }}>
                                    <Iconify icon="solar:hamburger-menu-outline" width={18} />
                                </Box>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleBindExpand(bind.id); }} sx={{
                                    width: 28, height: 28, transition: 'transform 0.25s ease',
                                    transform: isExpBind ? 'rotate(90deg)' : 'rotate(0deg)', color: 'warning.main',
                                }}>
                                    <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                                </IconButton>
                                <Iconify icon="solar:bookmark-bold" width={20} sx={{ color: 'warning.main' }} />
                                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>{bind.name}</Typography>
                                <Chip label={`${bind.tiers.length} mốc`} size="small" variant="soft" color="warning"
                                    sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                                <Tooltip title="Thêm mốc">
                                    <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); addBindTier(bind.id); if (!isExpBind) toggleBindExpand(bind.id); }}>
                                        <Iconify icon="mingcute:add-line" width={14} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteBinding(bind.id); }}>
                                        <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <Collapse in={isExpBind} timeout={250}>
                                <Box sx={{ p: 2, pt: 1.5 }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>Tên:</Typography>
                                        <TextField size="small" variant="standard" value={bind.name}
                                            sx={{ flex: 1, '& input': { fontWeight: 700, fontSize: 14 } }}
                                            onChange={e => updateBinding(bind.id, 'name', e.target.value)} />
                                    </Stack>
                                    {(bind.tiers || []).filter(Boolean)
                                        .map((tier, origIdx) => ({ ...tier, _oi: origIdx }))
                                        .sort((a, b) => a.max - b.max)
                                        .map((tier, displayIdx, sortedArr) => (
                                            <Stack key={tier._oi} direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ flex: 1 }}>
                                                    <TierRow tier={tier} index={tier._oi}
                                                        prevMax={displayIdx > 0 ? sortedArr[displayIdx - 1].max : 0}
                                                        unit={getBindUnitLabel(tier.unit)}
                                                        unitOptions={BIND_UNIT_OPTIONS}
                                                        onUnitChange={(i, v) => updateBindTierUnit(bind.id, i, v)}
                                                        onChange={(i, f, v) => updateBindTier(bind.id, i, f, v)}
                                                        onDelete={(i) => deleteBindTier(bind.id, i)}
                                                        canDelete={bind.tiers.length > 1} />
                                                </Box>
                                                <TextField size="small" type="number" value={tier.pricePerPage || 0}
                                                    onChange={e => updateBindTier(bind.id, tier._oi, 'pricePerPage', parseInt(e.target.value) || 0)}
                                                    InputProps={{ endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: 10 } }}>đ/trang</InputAdornment> }}
                                                    sx={{ width: 110, '& input': { py: 0.5, fontSize: 12, fontWeight: 600 }, mb: 1 }}
                                                />
                                            </Stack>
                                        ))}
                                </Box>
                            </Collapse>
                        </Paper>
                    );
                })}
            </Stack>
        </SettingSection>
    );

    // ===== TAB 4: LOẠI KHÁCH =====
    const renderCustomerTypes = () => (
        <SettingSection icon="solar:users-group-rounded-bold-duotone" title="Loại khách hàng" color="success" onAdd={addCust} addLabel="Thêm loại">
            <Stack spacing={1}>
                {settings.customerTypes.filter(Boolean).map((c, custIdx) => {
                    const isCustDragOver = custDragOverIdx === custIdx;
                    return (
                        <Paper key={c.id} variant="outlined"
                            draggable
                            onDragStart={(e) => handleCustDragStart(custIdx, e)}
                            onDragEnd={handleCustDragEnd}
                            onDragOver={(e) => handleCustDragOver(custIdx, e)}
                            sx={{
                                px: 2, py: 1.5, borderRadius: 2,
                                borderColor: isCustDragOver ? theme.palette.primary.main : alpha(theme.palette.divider, 0.8),
                                borderWidth: isCustDragOver ? 2 : 1,
                                transition: 'all 0.2s ease',
                                ...(isCustDragOver && { bgcolor: alpha(theme.palette.primary.main, 0.04) }),
                                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.04) },
                            }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', cursor: 'grab', px: 0.25, py: 0.5, borderRadius: 0.5,
                                    color: 'text.disabled', transition: 'all 0.15s',
                                    '&:hover': { color: 'text.secondary', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                                    '&:active': { cursor: 'grabbing' }
                                }}>
                                    <Iconify icon="solar:hamburger-menu-outline" width={18} />
                                </Box>
                                <Iconify icon="solar:user-bold" width={20} sx={{ color: 'success.main' }} />
                                <TextField size="small" variant="standard" value={c.name} sx={{ flex: 1, '& input': { fontWeight: 700, fontSize: 14 } }}
                                    onChange={e => updateCust(c.id, 'name', e.target.value)} />
                                <Chip label="Lợi nhuận" size="small" variant="soft" color="success" sx={{ height: 22, fontSize: 11 }} />
                                <TextField size="small" variant="outlined" type="number" value={c.profit}
                                    sx={{ width: 80, '& input': { py: 0.5, textAlign: 'right', fontWeight: 700, fontSize: 14 } }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                    onChange={e => updateCust(c.id, 'profit', e.target.value)} />
                                <IconButton size="small" color="error" onClick={() => deleteCust(c.id)}>
                                    <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                </IconButton>
                            </Stack>
                        </Paper>
                    );
                })}
            </Stack>
        </SettingSection>
    );

    // ===== SHARED CONTENT =====
    const renderContent = (
        <>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable"
                sx={{ px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Tab icon={<Iconify icon="solar:document-bold" width={18} />} iconPosition="start" label="Loại giấy" />
                <Tab icon={<Iconify icon="solar:printer-bold" width={18} />} iconPosition="start" label="Giá in" />
                <Tab icon={<Iconify icon="solar:layers-bold" width={18} />} iconPosition="start" label="Cán màng" />
                <Tab icon={<Iconify icon="solar:scissors-bold" width={18} />} iconPosition="start" label="Gia công" />
                <Tab icon={<Iconify icon="solar:bookmark-bold" width={18} />} iconPosition="start" label="Đóng cuốn" />
                <Tab icon={<Iconify icon="solar:users-group-rounded-bold" width={18} />} iconPosition="start" label="Loại khách" />
            </Tabs>
            <Box sx={{ px: 3, py: 2, maxHeight: embedded ? 'none' : 500, overflowY: embedded ? 'visible' : 'auto' }}>
                <TabPanel value={tab} index={0}>{renderPaperTypes()}</TabPanel>
                <TabPanel value={tab} index={1}>{renderPrintPricing()}</TabPanel>
                <TabPanel value={tab} index={2}>{renderLaminations()}</TabPanel>
                <TabPanel value={tab} index={3}>{renderProcessing()}</TabPanel>
                <TabPanel value={tab} index={4}>{renderBindings()}</TabPanel>
                <TabPanel value={tab} index={5}>{renderCustomerTypes()}</TabPanel>
            </Box>
            <Divider />
            <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="caption" color="success.main">
                    <Iconify icon="solar:check-circle-bold" width={16} sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Tự động lưu khi thay đổi
                </Typography>
            </Box>
        </>
    );

    // ===== EMBEDDED MODE =====
    if (embedded) {
        return (
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {renderContent}
            </Paper>
        );
    }

    // ===== DIALOG MODE =====
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '85vh' } }}>
            <DialogTitle sx={{ pb: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    }}>
                        <Iconify icon="solar:settings-bold-duotone" width={22} sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Cài đặt giá in</Typography>
                        <Typography variant="caption" color="text.secondary">Quản lý loại giấy, giá in, cán màng, gia công, loại khách hàng</Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <Divider sx={{ mt: 2 }} />
            <DialogContent sx={{ p: 0 }}>
                {renderContent}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button variant="contained" color="primary" onClick={onClose}
                    startIcon={<Iconify icon="solar:check-circle-bold" />}>
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
}
