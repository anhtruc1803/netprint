import { useMemo } from 'react';
import { alpha, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

// ---------------------------------------------------------------------- 

/**
 * Tìm app đang active từ toàn bộ navGridData
 * Trả về item nếu URL match, hoặc null
 */
function findActiveItem(gridData, pathname) {
    if (!gridData || !pathname) return null;

    for (const group of gridData) {
        for (const item of group.items) {
            if (!item.children?.length) continue;
            // Match nếu item.path hoặc bất kỳ child nào match URL
            const itemPathMatch = item.path !== '/dashboard' && pathname.startsWith(item.path);
            const childPathMatch = item.children.some(
                (c) => c.path !== '/dashboard' && pathname.startsWith(c.path)
            );
            if (itemPathMatch || childPathMatch) return item;
        }
    }
    return null;
}

// ----------------------------------------------------------------------

export function NavSubSidebar({ gridData, sx }) {
    const pathname = usePathname();

    const activeItem = useMemo(
        () => findActiveItem(gridData, pathname),
        [gridData, pathname]
    );

    if (!activeItem || !activeItem.children?.length) return null;

    return (
        <SubSidebarRoot sx={sx}>
            {/* Sub items — icon + tên, kiểu 1Office (đen trắng) */}
            <Box sx={{ pt: 1.5, pb: 2, px: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {activeItem.children.map((child) => {
                    const isChildActive = child.path !== '/dashboard' && pathname.startsWith(child.path);

                    return (
                        <ButtonBase
                            key={child.title}
                            component={RouterLink}
                            href={child.path}
                            sx={{
                                width: '100%', borderRadius: 1.5,
                                display: 'flex', alignItems: 'center',
                                gap: 1.5, py: 1, px: 1.25,
                                transition: 'all 0.15s ease',
                                bgcolor: isChildActive
                                  ? (theme) => alpha(theme.palette.grey[500], 0.12)
                                  : 'transparent',
                                '&:hover': {
                                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                                },
                            }}
                        >
                            {/* Icon — đen/xám, không nền màu */}
                            <Iconify
                                icon={child.iconName || 'solar:point-on-map-bold'}
                                width={20}
                                sx={{
                                  color: isChildActive ? 'text.primary' : 'text.secondary',
                                  flexShrink: 0,
                                }}
                            />

                            {/* Label */}
                            <Typography sx={{
                                fontSize: '0.78rem',
                                fontWeight: isChildActive ? 600 : 400,
                                color: isChildActive ? 'text.primary' : 'text.secondary',
                                lineHeight: 1.3,
                                overflow: 'hidden', display: '-webkit-box',
                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            }}>
                                {child.title}
                            </Typography>
                        </ButtonBase>
                    );
                })}
            </Box>
        </SubSidebarRoot>
    );
}

// ----------------------------------------------------------------------

const SubSidebarRoot = styled('div')(({ theme }) => ({
    top: 0,
    left: 'var(--layout-nav-mini-width)',
    height: '100%',
    width: 'var(--layout-nav-sub-width)',
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 'calc(var(--layout-nav-zIndex) - 1)',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: theme.transitions.create(['left'], {
        easing: 'ease',
        duration: '200ms',
    }),
}));
