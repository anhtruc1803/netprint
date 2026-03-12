import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { PERMISSIONS } from 'src/auth/permissions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

/**
 * Nav data chuẩn (cho mobile nav, horizontal nav)
 */
export const navData = [
  {
    subheader: 'Tổng quan',
    items: [
      { title: 'Tổng quan', path: paths.dashboard.root, icon: ICONS.dashboard },
    ],
  },
  {
    subheader: 'Quản lý',
    items: [
      {
        title: 'Đơn hàng',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        requiredPermission: PERMISSIONS.ORDERS_VIEW,
        children: [
          { title: 'Danh sách', path: paths.dashboard.order.root },
          { title: 'Chi tiết', path: paths.dashboard.order.demo.details },
        ],
      },
      {
        title: 'Khách hàng',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        requiredPermission: PERMISSIONS.CUSTOMERS_VIEW,
        children: [
          { title: 'Danh sách', path: paths.dashboard.user.list },
          { title: 'Thêm mới', path: paths.dashboard.user.new },
          { title: 'Chỉnh sửa', path: paths.dashboard.user.demo.edit },
        ],
      },
      {
        title: 'Sản phẩm',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        requiredPermission: PERMISSIONS.PRODUCTS_VIEW,
        children: [
          { title: 'Danh sách', path: paths.dashboard.product.root },
          { title: 'Thêm mới', path: paths.dashboard.product.new },
          { title: 'Chỉnh sửa', path: paths.dashboard.product.demo.edit },
        ],
      },
    ],
  },
  {
    subheader: 'Công cụ',
    items: [
      {
        title: 'Tính giá',
        path: paths.dashboard.pricing.root,
        icon: ICONS.analytics,
        requiredPermission: PERMISSIONS.PRICING_VIEW,
        children: [
          { title: 'In Nhanh', path: paths.dashboard.pricing.calculator },
          { title: 'In Catalogue', path: paths.dashboard.pricing.catalogue },
          { title: 'Cài đặt giá', path: paths.dashboard.pricing.settings, requiredPermission: PERMISSIONS.PRICING_SETTINGS },
        ],
      },
    ],
  },
  {
    subheader: 'Hệ thống',
    items: [
      {
        title: 'Quản lý tài khoản',
        path: '/dashboard/account-management',
        icon: ICONS.lock,
        requiredPermission: PERMISSIONS.ACCOUNTS_MANAGE,
      },
    ],
  },
];

// ----------------------------------------------------------------------

/**
 * Nav data dạng grid (cho sidebar kiểu app launcher)
 * Mỗi item là 1 ô icon trong lưới — flat, không có children
 */
export const navGridData = [
  {
    subheader: 'WORKPLACE',
    items: [
      {
        title: 'Tổng quan',
        path: paths.dashboard.root,
        iconName: 'solar:chart-2-bold-duotone',
        color: '#FF5630',
      },
      {
        title: 'Công việc',
        path: paths.dashboard.root,
        iconName: 'solar:checklist-minimalistic-bold-duotone',
        color: '#22C55E',
      },
      {
        title: 'Lịch biểu',
        path: paths.dashboard.root,
        iconName: 'solar:calendar-bold-duotone',
        color: '#3B82F6',
      },
      {
        title: 'Tài liệu',
        path: paths.dashboard.root,
        iconName: 'solar:folder-with-files-bold-duotone',
        color: '#F59E0B',
      },
    ],
  },
  {
    subheader: 'CRM',
    items: [
      {
        title: 'Đơn hàng bán',
        path: paths.dashboard.order.root,
        iconName: 'solar:cart-large-2-bold-duotone',
        color: '#3B82F6',
        requiredPermission: PERMISSIONS.ORDERS_VIEW,
        children: [
          { title: 'Đơn hàng bán', path: paths.dashboard.order.root, iconName: 'solar:cart-large-2-bold' },
          { title: 'In Nhanh Đại Lý', path: paths.dashboard.quickOrder.root, iconName: 'solar:printer-minimalistic-bold' },
        ],
      },
      {
        title: 'Báo Giá',
        path: paths.dashboard.root,
        iconName: 'solar:document-text-bold-duotone',
        color: '#F59E0B',
        children: [
          { title: 'Danh sách báo giá', path: paths.dashboard.root, iconName: 'solar:list-bold' },
          { title: 'Tạo báo giá mới', path: paths.dashboard.root, iconName: 'solar:add-circle-bold' },
        ],
      },
      {
        title: 'Mua Hàng',
        path: paths.dashboard.root,
        iconName: 'solar:bag-4-bold-duotone',
        color: '#8B5CF6',
        children: [
          { title: 'Đơn mua hàng', path: paths.dashboard.root, iconName: 'solar:list-bold' },
          { title: 'Nhà cung cấp', path: paths.dashboard.root, iconName: 'solar:buildings-bold' },
          { title: 'Tạo đơn mua', path: paths.dashboard.root, iconName: 'solar:add-circle-bold' },
        ],
      },
      {
        title: 'Kho hàng',
        path: paths.dashboard.product.root,
        iconName: 'solar:box-bold-duotone',
        color: '#EF4444',
        requiredPermission: PERMISSIONS.PRODUCTS_VIEW,
        children: [
          { title: 'Danh sách sản phẩm', path: paths.dashboard.product.root, iconName: 'solar:list-bold' },
          { title: 'Nhập kho', path: paths.dashboard.product.root, iconName: 'solar:import-bold' },
          { title: 'Xuất kho', path: paths.dashboard.product.root, iconName: 'solar:export-bold' },
          { title: 'Kiểm kê kho', path: paths.dashboard.product.root, iconName: 'solar:clipboard-list-bold' },
        ],
      },
      {
        title: 'Tài chính',
        path: paths.dashboard.root,
        iconName: 'solar:card-bold-duotone',
        color: '#22C55E',
        children: [
          { title: 'Thu tiền', path: paths.dashboard.root, iconName: 'solar:dollar-minimalistic-bold' },
          { title: 'Chi tiền', path: paths.dashboard.root, iconName: 'solar:banknote-bold' },
          { title: 'Báo cáo tài chính', path: paths.dashboard.root, iconName: 'solar:chart-2-bold' },
        ],
      },
      {
        title: 'Khách Hàng',
        path: paths.dashboard.user.list,
        iconName: 'solar:users-group-rounded-bold-duotone',
        color: '#06B6D4',
        requiredPermission: PERMISSIONS.CUSTOMERS_VIEW,
        children: [
          { title: 'Danh sách khách hàng', path: paths.dashboard.user.list, iconName: 'solar:list-bold' },
          { title: 'Thêm khách hàng', path: paths.dashboard.user.new, iconName: 'solar:add-circle-bold' },
          { title: 'Nhóm khách hàng', path: paths.dashboard.user.list, iconName: 'solar:users-group-two-rounded-bold' },
        ],
      },
      {
        title: 'Nhà cung cấp',
        path: paths.dashboard.root,
        iconName: 'solar:buildings-bold-duotone',
        color: '#F43F5E',
        children: [
          { title: 'Danh sách NCC', path: paths.dashboard.root, iconName: 'solar:list-bold' },
          { title: 'Thêm NCC mới', path: paths.dashboard.root, iconName: 'solar:add-circle-bold' },
        ],
      },
      {
        title: 'Mạng nội bộ',
        path: paths.dashboard.root,
        iconName: 'solar:global-bold-duotone',
        color: '#0EA5E9',
        children: [
          { title: 'Tin tức nội bộ', path: paths.dashboard.root, iconName: 'solar:bell-bold' },
          { title: 'Tài liệu', path: paths.dashboard.root, iconName: 'solar:folder-with-files-bold' },
          { title: 'Thông báo', path: paths.dashboard.root, iconName: 'solar:notification-bold' },
        ],
      },
    ],
  },
  {
    subheader: 'PRICING TOOLS',
    items: [
      {
        title: 'In Nhanh',
        path: paths.dashboard.pricing.calculator,
        iconName: 'solar:calculator-bold-duotone',
        color: '#7B1FA2',
        requiredPermission: PERMISSIONS.PRICING_VIEW,
        children: [
          { title: 'Tính giá in nhanh', path: paths.dashboard.pricing.calculator, iconName: 'solar:calculator-bold' },
          { title: 'Lịch sử tính giá', path: paths.dashboard.pricing.calculator, iconName: 'solar:history-bold' },
          { title: 'Danh sách báo giá', path: paths.dashboard.pricing.calculator, iconName: 'solar:list-bold' },
        ],
      },
      {
        title: 'Catalogue',
        path: paths.dashboard.pricing.catalogue,
        iconName: 'solar:notebook-bold-duotone',
        color: '#00897B',
        requiredPermission: PERMISSIONS.PRICING_VIEW,
        children: [
          { title: 'Tính giá Catalogue', path: paths.dashboard.pricing.catalogue, iconName: 'solar:notebook-bold' },
          { title: 'Lịch sử tính giá', path: paths.dashboard.pricing.catalogue, iconName: 'solar:history-bold' },
          { title: 'Danh sách báo giá', path: paths.dashboard.pricing.catalogue, iconName: 'solar:list-bold' },
        ],
      },
      {
        title: 'Tổng Hợp',
        path: paths.dashboard.root,
        iconName: 'solar:document-add-bold-duotone',
        color: '#1565C0',
        requiredPermission: PERMISSIONS.PRICING_VIEW,
        children: [
          { title: 'Tổng hợp báo giá', path: paths.dashboard.root, iconName: 'solar:document-add-bold' },
          { title: 'Báo cáo doanh thu', path: paths.dashboard.root, iconName: 'solar:chart-2-bold' },
        ],
      },
      {
        title: 'In Offset',
        path: paths.dashboard.root,
        iconName: 'solar:printer-minimalistic-bold-duotone',
        color: '#D84315',
        requiredPermission: PERMISSIONS.PRICING_VIEW,
        children: [
          { title: 'Tính giá In Offset', path: paths.dashboard.root, iconName: 'solar:printer-minimalistic-bold' },
          { title: 'Lịch sử tính giá', path: paths.dashboard.root, iconName: 'solar:history-bold' },
        ],
      },
    ],
  },
  {
    subheader: 'HRM',
    items: [
      {
        title: 'Nhân sự',
        path: paths.dashboard.root,
        iconName: 'solar:user-id-bold-duotone',
        color: '#6366F1',
        children: [
          { title: 'Danh sách nhân viên', path: paths.dashboard.root, iconName: 'solar:list-bold' },
          { title: 'Thêm nhân viên', path: paths.dashboard.root, iconName: 'solar:add-circle-bold' },
          { title: 'Phòng ban', path: paths.dashboard.root, iconName: 'solar:buildings-2-bold' },
          { title: 'Hợp đồng', path: paths.dashboard.root, iconName: 'solar:document-bold' },
        ],
      },
      {
        title: 'Chấm công',
        path: paths.dashboard.root,
        iconName: 'solar:clock-circle-bold-duotone',
        color: '#14B8A6',
        children: [
          { title: 'Bảng chấm công', path: paths.dashboard.root, iconName: 'solar:calendar-bold' },
          { title: 'Đơn xin nghỉ phép', path: paths.dashboard.root, iconName: 'solar:document-text-bold' },
          { title: 'Tăng ca', path: paths.dashboard.root, iconName: 'solar:clock-circle-bold' },
        ],
      },
      {
        title: 'Bảng lương',
        path: paths.dashboard.root,
        iconName: 'solar:wallet-money-bold-duotone',
        color: '#F43F5E',
        children: [
          { title: 'Tính lương tháng', path: paths.dashboard.root, iconName: 'solar:wallet-money-bold' },
          { title: 'Phiếu lương', path: paths.dashboard.root, iconName: 'solar:document-bold' },
          { title: 'Cấu hình lương', path: paths.dashboard.root, iconName: 'solar:settings-bold' },
        ],
      },
      {
        title: 'KPI',
        path: paths.dashboard.root,
        iconName: 'solar:graph-up-bold-duotone',
        color: '#FF9500',
        children: [
          { title: 'Mục tiêu KPI', path: paths.dashboard.root, iconName: 'solar:target-bold' },
          { title: 'Kết quả KPI', path: paths.dashboard.root, iconName: 'solar:graph-up-bold' },
          { title: 'Báo cáo KPI', path: paths.dashboard.root, iconName: 'solar:chart-2-bold' },
        ],
      },
    ],
  },
  {
    subheader: 'SETTING',
    items: [
      {
        title: 'Cài đặt giá',
        path: paths.dashboard.pricing.settings,
        iconName: 'solar:settings-bold-duotone',
        color: '#E65100',
        requiredPermission: PERMISSIONS.PRICING_SETTINGS,
        children: [
          { title: 'Loại giấy', path: paths.dashboard.pricing.settings, iconName: 'solar:document-bold' },
          { title: 'Gia công', path: paths.dashboard.pricing.settings, iconName: 'solar:settings-bold' },
          { title: 'Cán màng', path: paths.dashboard.pricing.settings, iconName: 'solar:layers-bold' },
          { title: 'Loại khách', path: paths.dashboard.pricing.settings, iconName: 'solar:users-group-rounded-bold' },
        ],
      },
      {
        title: 'Quản lý TK',
        path: '/dashboard/account-management',
        iconName: 'solar:shield-user-bold-duotone',
        color: '#D32F2F',
        requiredPermission: PERMISSIONS.ACCOUNTS_MANAGE,
        children: [
          { title: 'Danh sách tài khoản', path: '/dashboard/account-management', iconName: 'solar:list-bold' },
          { title: 'Thêm tài khoản', path: '/dashboard/account-management', iconName: 'solar:add-circle-bold' },
          { title: 'Phân quyền', path: '/dashboard/account-management', iconName: 'solar:shield-bold' },
        ],
      },
      {
        title: 'Hồ sơ',
        path: '/dashboard/user/account',
        iconName: 'solar:user-circle-bold-duotone',
        color: '#546E7A',
        children: [
          { title: 'Thông tin cá nhân', path: '/dashboard/user/account', iconName: 'solar:user-bold' },
          { title: 'Đổi mật khẩu', path: '/dashboard/user/account', iconName: 'solar:lock-bold' },
          { title: 'Cài đặt thông báo', path: '/dashboard/user/account', iconName: 'solar:bell-bold' },
        ],
      },
    ],
  },
];
