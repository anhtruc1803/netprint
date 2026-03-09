import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const _account = [
  {
    label: 'Trang chủ',
    href: paths.dashboard.root,
    icon: <Iconify icon="solar:home-angle-bold-duotone" />,
  },
  {
    label: 'Hồ sơ',
    href: paths.dashboard.user.profile,
    icon: <Iconify icon="solar:user-circle-bold-duotone" />,
  },
  {
    label: 'Đơn hàng',
    href: paths.dashboard.order.root,
    icon: <Iconify icon="solar:cart-large-2-bold-duotone" />,
    info: '5',
  },
  {
    label: 'Bảo mật',
    href: `${paths.dashboard.user.account}/change-password`,
    icon: <Iconify icon="solar:shield-keyhole-bold-duotone" />,
  },
  {
    label: 'Cài đặt tài khoản',
    href: paths.dashboard.user.account,
    icon: <Iconify icon="solar:settings-bold-duotone" />,
  },
];
