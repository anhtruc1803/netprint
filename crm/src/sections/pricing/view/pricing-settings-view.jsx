import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { loadPaperSettings } from '../data/default-settings';
import PricingSettingsDialog from './pricing-settings-dialog';

// ----------------------------------------------------------------------

export function PricingSettingsView() {
    const theme = useTheme();
    const [settings, setSettings] = useState(() => loadPaperSettings());
    const handleSettingsChanged = useCallback((newSettings) => setSettings({ ...newSettings }), []);

    return (
        <DashboardContent maxWidth="lg">
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <Box sx={{
                    width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white', boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}>
                    <Iconify icon="solar:settings-bold-duotone" width={26} />
                </Box>
                <Stack>
                    <Typography variant="h4" fontWeight={800}>Cài Đặt Giá</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Quản lý loại giấy, giá in, cán màng, gia công — đồng bộ cho In Nhanh & Catalogue
                    </Typography>
                </Stack>
            </Stack>

            {/* Render the settings dialog as always-open */}
            <PricingSettingsDialog
                open
                onClose={() => { }}
                onSettingsChanged={handleSettingsChanged}
                embedded
            />
        </DashboardContent>
    );
}
