import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const QUICK_LINKS = [
  {
    title: 'Tính giá In Nhanh',
    icon: 'solar:calculator-bold-duotone',
    href: paths.dashboard.pricing.calculator,
    color: '#2065D1',
    description: 'Tính giá in ấn nhanh chóng',
  },
  {
    title: 'Tính giá Catalogue',
    icon: 'solar:book-bold-duotone',
    href: paths.dashboard.pricing.catalogue,
    color: '#E4520B',
    description: 'Tính giá catalogue, tờ rơi',
  },
  {
    title: 'Đơn hàng',
    icon: 'solar:bag-bold-duotone',
    href: paths.dashboard.order.root,
    color: '#00A76F',
    description: 'Quản lý đơn hàng',
  },
  {
    title: 'Sản phẩm',
    icon: 'solar:box-bold-duotone',
    href: paths.dashboard.product.root,
    color: '#7635DC',
    description: 'Quản lý sản phẩm',
  },
  {
    title: 'Cài đặt giá',
    icon: 'solar:settings-bold-duotone',
    href: paths.dashboard.pricing.settings,
    color: '#637381',
    description: 'Cấu hình giá giấy, cán màng',
  },
  {
    title: 'Người dùng',
    icon: 'solar:users-group-rounded-bold-duotone',
    href: paths.dashboard.user.list,
    color: '#00B8D9',
    description: 'Quản lý nhân viên',
  },
];

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { user } = useMockedUser();

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Welcome Banner */}
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              p: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Xin chào, {user?.displayName} 👋
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.85 }}>
                Chào mừng bạn đến với NetPrint CRM. Chọn chức năng bên dưới để bắt đầu.
              </Typography>
            </Box>
            <Box
              component="img"
              src="/logo/logo-icon.png"
              sx={{ width: 80, height: 80, objectFit: 'contain', display: { xs: 'none', md: 'block' } }}
            />
          </Card>
        </Grid>

        {/* Quick Links */}
        {QUICK_LINKS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              component={RouterLink}
              href={item.href}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.customShadows?.z16 || '0 8px 16px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1.5,
                  bgcolor: `${item.color}14`,
                }}
              >
                <Iconify icon={item.icon} width={28} sx={{ color: item.color }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                  {item.description}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardContent>
  );
}
