import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function GridItem({ item, isActive }) {
    const color = item.color || '#666';

    return (
        <ButtonBase
            component={RouterLink}
            href={item.path}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                py: 1.25,
                px: 0.5,
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: alpha(color, 0.06),
                    transform: 'translateY(-2px)',
                    '& .grid-icon-box': {
                        boxShadow: `0 6px 18px ${alpha(color, 0.28)}`,
                        transform: 'scale(1.06)',
                    },
                },
                ...(isActive && {
                    '& .grid-icon-box': {
                        boxShadow: `0 4px 16px ${alpha(color, 0.3)}`,
                        transform: 'scale(1.04)',
                    },
                }),
            }}
        >
            {/* Icon tile — 1Office style phẳng */}
            <Box
                className="grid-icon-box"
                sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, 0.08),
                    transition: 'all 0.25s ease',
                }}
            >
                <Iconify
                    icon={item.iconName}
                    width={24}
                    sx={{ color }}
                />
            </Box>

            {/* Label */}
            <Typography
                noWrap
                sx={{
                    maxWidth: '100%',
                    textAlign: 'center',
                    fontWeight: 400,
                    color: 'text.primary',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                }}
            >
                {item.title}
            </Typography>
        </ButtonBase>
    );
}

// ----------------------------------------------------------------------

export function NavAppGrid({ data, sx, ...other }) {
    const pathname = usePathname();

    return (
        <Box
            sx={{
                px: 2,
                py: 1.5,
                flex: '1 1 auto',
                ...sx,
            }}
            {...other}
        >
            {data.map((group) => (
                <Box key={group.subheader} sx={{ mb: 3 }}>
                    {/* Section header */}
                    <Typography
                        sx={{
                            mb: 1.5,
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'text.primary',
                            letterSpacing: 0,
                        }}
                    >
                        {group.subheader}
                    </Typography>

                    {/* Grid 4 cột */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 0.5,
                        }}
                    >
                        {group.items.map((item) => (
                            <GridItem
                                key={item.title}
                                item={item}
                                isActive={pathname === item.path || pathname.startsWith(item.path + '/')}
                            />
                        ))}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}
