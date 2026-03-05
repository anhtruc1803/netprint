import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

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
 * Input nav data is an array of navigation section items used to define the structure and content of a navigation bar.
 * Each section contains a subheader and an array of items, which can include nested children items.
 *
 * Each item can have the following properties:
 * - `title`: The title of the navigation item.
 * - `path`: The URL path the item links to.
 * - `icon`: An optional icon component to display alongside the title.
 * - `info`: Optional additional information to display, such as a label.
 * - `allowedRoles`: An optional array of roles that are allowed to see the item.
 * - `caption`: An optional caption to display below the title.
 * - `children`: An optional array of nested navigation items.
 * - `disabled`: An optional boolean to disable the item.
 * - `deepMatch`: An optional boolean to indicate if the item should match subpaths.
 */
export const navData = [
  /**
   * Tổng quan
   */
  {
    subheader: 'Tổng quan',
    items: [
      { title: 'Bảng điều khiển', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Thương mại', path: paths.dashboard.general.ecommerce, icon: ICONS.ecommerce },
      { title: 'Phân tích', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
    ],
  },
  /**
   * Quản lý
   */
  {
    subheader: 'Quản lý',
    items: [
      {
        title: 'Khách hàng',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'Hồ sơ', path: paths.dashboard.user.root },
          { title: 'Thẻ KH', path: paths.dashboard.user.cards },
          { title: 'Danh sách', path: paths.dashboard.user.list },
          { title: 'Thêm mới', path: paths.dashboard.user.new },
          { title: 'Chỉnh sửa', path: paths.dashboard.user.demo.edit },
          { title: 'Tài khoản', path: paths.dashboard.user.account, deepMatch: true },
        ],
      },
      {
        title: 'Sản phẩm',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        children: [
          { title: 'Danh sách', path: paths.dashboard.product.root },
          { title: 'Chi tiết', path: paths.dashboard.product.demo.details },
          { title: 'Thêm mới', path: paths.dashboard.product.new },
          { title: 'Chỉnh sửa', path: paths.dashboard.product.demo.edit },
        ],
      },
      {
        title: 'Đơn hàng',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        children: [
          { title: 'Danh sách', path: paths.dashboard.order.root },
          { title: 'Chi tiết', path: paths.dashboard.order.demo.details },
        ],
      },
      {
        title: 'Hóa đơn',
        path: paths.dashboard.invoice.root,
        icon: ICONS.invoice,
        children: [
          { title: 'Danh sách', path: paths.dashboard.invoice.root },
          { title: 'Chi tiết', path: paths.dashboard.invoice.demo.details },
          { title: 'Tạo mới', path: paths.dashboard.invoice.new },
          { title: 'Chỉnh sửa', path: paths.dashboard.invoice.demo.edit },
        ],
      },
      { title: 'Quản lý file', path: paths.dashboard.fileManager, icon: ICONS.folder },
      { title: 'Lịch', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: 'Kanban', path: paths.dashboard.kanban, icon: ICONS.kanban },
    ],
  },
];
