import { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, Typography, Button, TextField, IconButton,
    Tabs, Tab, Chip, Divider, InputAdornment, Tooltip, Paper,
    Table, TableHead, TableRow, TableCell, TableBody,
    alpha, useTheme,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { loadPaperSettings, savePaperSettings } from '../data/default-settings';

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
function TierRow({ tier, index, isLast, onChange, onDelete, canDelete, unit = 'đ/sp' }) {
    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={600} sx={{ minWidth: 24 }}>≤</Typography>
            <TextField size="small" type="number" value={tier.max === 999999 ? '' : tier.max}
                placeholder="∞" sx={{ width: 90 }}
                onChange={e => onChange(index, 'max', e.target.value === '' ? 999999 : parseInt(e.target.value) || 0)} />
            <Typography variant="caption" fontWeight={700} color="primary">→</Typography>
            <TextField size="small" type="number" value={tier.price} sx={{ width: 100 }}
                InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption">{unit}</Typography></InputAdornment> }}
                onChange={e => onChange(index, 'price', parseInt(e.target.value) || 0)} />
            <IconButton size="small" color="error" onClick={() => onDelete(index)} disabled={!canDelete}>
                <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
            </IconButton>
        </Stack>
    );
}

// ===== MAIN COMPONENT =====
export default function PricingSettingsDialog({ open, onClose, onSettingsChanged }) {
    const theme = useTheme();
    const [tab, setTab] = useState(0);
    const [settings, setSettings] = useState(() => loadPaperSettings());

    useEffect(() => {
        if (open) setSettings(loadPaperSettings());
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
    const updateLam = (id, field, value) => {
        const ns = {
            ...settings, laminations: settings.laminations.map(l =>
                l.id === id ? { ...l, [field]: value } : l
            )
        };
        save(ns);
    };
    const updateLamTier = (id, value) => {
        const ns = {
            ...settings, laminations: settings.laminations.map(l =>
                l.id === id ? { ...l, tiers: [{ max: 499, price: parseInt(value) || 0 }] } : l
            )
        };
        save(ns);
    };
    const updateLamM2 = (id, value) => {
        const ns = {
            ...settings, laminations: settings.laminations.map(l =>
                l.id === id ? { ...l, pricePerM2: parseInt(value) || 0 } : l
            )
        };
        save(ns);
    };
    const addLam = () => {
        const ns = {
            ...settings, laminations: [...settings.laminations, {
                id: Date.now(), name: 'Loại mới', tiers: [{ max: 499, price: 0 }], pricePerM2: 0
            }]
        };
        save(ns);
    };
    const deleteLam = (id) => {
        if (id === 1) return;
        const ns = { ...settings, laminations: settings.laminations.filter(l => l.id !== id) };
        save(ns);
    };

    // ===== PROCESSING =====
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
                const lastT = p.tiers[p.tiers.length - 1];
                const newMax = lastT.max === 999999 ? 500 : lastT.max + 200;
                const newTiers = [...p.tiers];
                newTiers.splice(newTiers.length - 1, 0, { max: newMax, price: lastT.price });
                return { ...p, tiers: newTiers };
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
                id: Date.now(), name: 'Gia công mới',
                tiers: [{ max: 100, price: 200 }, { max: 500, price: 100 }, { max: 999999, price: 50 }]
            }]
        };
        save(ns);
    };
    const deleteProc = (id) => {
        const ns = { ...settings, processing: settings.processing.filter(p => p.id !== id) };
        save(ns);
    };

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

    // ===== TAB 0: LOẠI GIẤY & KHỔ IN =====
    const renderPaperTypes = () => (
        <>
            <SettingSection icon="solar:document-bold-duotone" title="Khổ in" color="info" onAdd={addPrintSize} addLabel="Thêm khổ">
                {printSizes.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                        Chưa có khổ in nào — Bấm &quot;Thêm khổ&quot; để bắt đầu
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {printSizes.map(size => {
                            const pricing = paperPricing.find(pp => pp.printSizeId === size.id);
                            const papers2 = pricing?.papers || [];
                            return (
                                <Paper key={size.id} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: alpha(theme.palette.info.main, 0.3) }}>
                                    {/* Print size header */}
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                                        <Iconify icon="solar:maximize-square-bold" width={20} sx={{ color: 'info.main' }} />
                                        <TextField size="small" variant="standard" value={size.name}
                                            sx={{ width: 100, '& input': { fontWeight: 700, fontSize: 15 } }}
                                            onChange={e => updatePrintSize(size.id, 'name', e.target.value)} />
                                        <TextField size="small" type="number" value={size.w} sx={{ width: 110 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                                            onChange={e => updatePrintSize(size.id, 'w', e.target.value)} />
                                        <Typography variant="body2" fontWeight={700}>×</Typography>
                                        <TextField size="small" type="number" value={size.h} sx={{ width: 110 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                                            onChange={e => updatePrintSize(size.id, 'h', e.target.value)} />
                                        <Box sx={{ flex: 1 }} />
                                        <Tooltip title="Thêm loại giấy">
                                            <Button size="small" variant="soft" color="primary"
                                                startIcon={<Iconify icon="mingcute:add-line" />}
                                                onClick={() => addPaperType(size.id)}>Thêm giấy</Button>
                                        </Tooltip>
                                        <Tooltip title="Xóa khổ in">
                                            <IconButton size="small" color="error" onClick={() => deletePrintSize(size.id)}>
                                                <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>

                                    {/* Paper types list */}
                                    {papers2.length === 0 ? (
                                        <Typography variant="caption" color="text.disabled" sx={{ pl: 4 }}>
                                            Chưa có loại giấy — Bấm &quot;Thêm giấy&quot;
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.5} sx={{ pl: 1 }}>
                                            {papers2.map(paper => (
                                                <Paper key={paper.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                        <Chip label="📄" size="small" variant="soft" sx={{ height: 24 }} />
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
                                                    {paper.tiers.map((tier, idx) => (
                                                        <TierRow key={idx} tier={tier} index={idx} unit="đ/tờ"
                                                            onChange={(i, f, v) => updatePaperTier(size.id, paper.id, i, f, v)}
                                                            onDelete={(i) => deletePaperTier(size.id, paper.id, i)}
                                                            canDelete={paper.tiers.length > 1} />
                                                    ))}
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </SettingSection>
        </>
    );

    // ===== TAB 1: GIÁ IN =====
    const renderPrintPricing = () => (
        <SettingSection icon="solar:printer-bold-duotone" title="Giá in / tờ" color="primary">
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                💡 Giá in 2 mặt tự động = In 1 mặt × 2
            </Typography>
            {settings.printOptions.filter(o => o.id === 1).map(opt => (
                <Box key={opt.id}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" fontWeight={700}>In 1 mặt</Typography>
                        <Chip label="Tự động" size="small" color="info" variant="soft" />
                    </Stack>
                    {opt.tiers.map((tier, idx) => (
                        <TierRow key={idx} tier={tier} index={idx} unit="đ/tờ"
                            onChange={(i, f, v) => updatePrintTier(opt.id, i, f, v)}
                            onDelete={(i) => deletePrintTier(opt.id, i)}
                            canDelete={opt.tiers.length > 1} />
                    ))}
                    <Button size="small" variant="outlined" color="primary" fullWidth sx={{ mt: 1 }}
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={() => addPrintTier(opt.id)}>
                        Thêm mốc số lượng
                    </Button>
                </Box>
            ))}
        </SettingSection>
    );

    // ===== TAB 2: CÁN MÀNG =====
    const renderLaminations = () => (
        <SettingSection icon="solar:layers-bold-duotone" title="Cán màng" color="warning" onAdd={addLam} addLabel="Thêm loại">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Tên</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">&lt;500 tờ (đ/tờ)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">≥500 tờ (đ/m²)</TableCell>
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
                            <TableCell align="right">
                                {l.id !== 1 ? (
                                    <TextField size="small" variant="standard" type="number" value={l.tiers?.[0]?.price || 0}
                                        sx={{ width: 80 }} inputProps={{ style: { textAlign: 'right' } }}
                                        onChange={e => updateLamTier(l.id, e.target.value)} />
                                ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                            </TableCell>
                            <TableCell align="right">
                                {l.id !== 1 ? (
                                    <TextField size="small" variant="standard" type="number" value={l.pricePerM2 || 0}
                                        sx={{ width: 80 }} inputProps={{ style: { textAlign: 'right' } }}
                                        onChange={e => updateLamM2(l.id, e.target.value)} />
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
    );

    // ===== TAB 3: GIA CÔNG =====
    const renderProcessing = () => (
        <SettingSection icon="solar:scissors-bold-duotone" title="Gia công" color="error" onAdd={addProc} addLabel="Thêm gia công">
            <Stack spacing={2}>
                {settings.processing.map(proc => (
                    <Paper key={proc.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <TextField size="small" variant="standard" value={proc.name} sx={{ fontWeight: 700 }}
                                onChange={e => updateProc(proc.id, 'name', e.target.value)} />
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Thêm mốc">
                                    <IconButton size="small" color="primary" onClick={() => addProcTier(proc.id)}>
                                        <Iconify icon="mingcute:add-line" width={16} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                    <IconButton size="small" color="error" onClick={() => deleteProc(proc.id)}>
                                        <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                        {proc.tiers.map((tier, idx) => (
                            <TierRow key={idx} tier={tier} index={idx}
                                onChange={(i, f, v) => updateProcTier(proc.id, i, f, v)}
                                onDelete={(i) => deleteProcTier(proc.id, i)}
                                canDelete={proc.tiers.length > 1} />
                        ))}
                    </Paper>
                ))}
            </Stack>
        </SettingSection>
    );

    // ===== TAB 4: LOẠI KHÁCH =====
    const renderCustomerTypes = () => (
        <SettingSection icon="solar:users-group-rounded-bold-duotone" title="Loại khách hàng" color="success" onAdd={addCust} addLabel="Thêm loại">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Tên loại khách</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">% Lợi nhuận</TableCell>
                        <TableCell width={40} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {settings.customerTypes.map(c => (
                        <TableRow key={c.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
                            <TableCell>
                                <TextField size="small" variant="standard" value={c.name} fullWidth
                                    onChange={e => updateCust(c.id, 'name', e.target.value)} />
                            </TableCell>
                            <TableCell align="right">
                                <TextField size="small" variant="standard" type="number" value={c.profit}
                                    sx={{ width: 60 }} inputProps={{ style: { textAlign: 'right' } }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                    onChange={e => updateCust(c.id, 'profit', e.target.value)} />
                            </TableCell>
                            <TableCell>
                                <IconButton size="small" color="error" onClick={() => deleteCust(c.id)}>
                                    <Iconify icon="solar:trash-bin-minimalistic-bold" width={16} />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </SettingSection>
    );

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
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable"
                    sx={{ px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Tab icon={<Iconify icon="solar:document-bold" width={18} />} iconPosition="start" label="Loại giấy" />
                    <Tab icon={<Iconify icon="solar:printer-bold" width={18} />} iconPosition="start" label="Giá in" />
                    <Tab icon={<Iconify icon="solar:layers-bold" width={18} />} iconPosition="start" label="Cán màng" />
                    <Tab icon={<Iconify icon="solar:scissors-bold" width={18} />} iconPosition="start" label="Gia công" />
                    <Tab icon={<Iconify icon="solar:users-group-rounded-bold" width={18} />} iconPosition="start" label="Loại khách" />
                </Tabs>
                <Box sx={{ px: 3, py: 2, maxHeight: 500, overflowY: 'auto' }}>
                    <TabPanel value={tab} index={0}>{renderPaperTypes()}</TabPanel>
                    <TabPanel value={tab} index={1}>{renderPrintPricing()}</TabPanel>
                    <TabPanel value={tab} index={2}>{renderLaminations()}</TabPanel>
                    <TabPanel value={tab} index={3}>{renderProcessing()}</TabPanel>
                    <TabPanel value={tab} index={4}>{renderCustomerTypes()}</TabPanel>
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Typography variant="caption" color="success.main" sx={{ flex: 1 }}>
                    <Iconify icon="solar:check-circle-bold" width={16} sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Tự động lưu khi thay đổi
                </Typography>
                <Button variant="contained" color="primary" onClick={onClose}
                    startIcon={<Iconify icon="solar:check-circle-bold" />}>
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
}
