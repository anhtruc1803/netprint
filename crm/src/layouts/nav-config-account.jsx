import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const _account = [
  { label: 'Trang chủ', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: 'Hồ sơ',
    href: '#',
    icon: <Iconify icon="custom:profile-duotone" />,
  },
  {
    label: 'Dự án',
    href: '#',
    icon: <Iconify icon="solar:notes-bold-duotone" />,
    info: '3',
  },
  {
    label: 'Gói dịch vụ',
    href: '#',
    icon: <Iconify icon="custom:invoice-duotone" />,
  },
  { label: 'Bảo mật', href: '#', icon: <Iconify icon="solar:shield-keyhole-bold-duotone" /> },
  { label: 'Cài đặt tài khoản', href: '#', icon: <Iconify icon="solar:settings-bold-duotone" /> },
];
