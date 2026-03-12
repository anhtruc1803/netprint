import React, { useMemo } from 'react';
import { varAlpha, mergeClasses } from 'minimal-shared/utils';
import { alpha, styled } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { layoutClasses } from '../core';
import { NavAppGrid } from './nav-app-grid';

// ----------------------------------------------------------------------

export function NavVertical({
  sx,
  data,
  gridData,
  slots,
  cssVars,
  className,
  isNavMini,
  onToggleNav,
  layoutQuery = 'md',
  ...other
}) {
  const pathname = usePathname();
  const [showAppLauncher, setShowAppLauncher] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const searchInputRef = React.useRef(null);

  // Đóng app launcher khi chuyển trang
  React.useEffect(() => {
    setShowAppLauncher(false);
  }, [pathname]);

  // Filter apps theo search
  const filteredGridData = useMemo(() => {
    if (!search.trim()) return gridData || [];
    const q = search.toLowerCase();
    return (gridData || [])
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [gridData, search]);

  // Lấy danh sách pinned items — bỏ qua app đang active nếu nó có sub-sidebar (children)
  const pinnedItems = useMemo(() => {
    const pinned = [];
    for (const group of (gridData || [])) {
      for (const item of group.items) {
        const isActive =
          item.path !== '/dashboard' &&
          (pathname === item.path || pathname.startsWith(item.path + '/'));
        
        // Nếu item active VÀ có children → đã hiển thị ở sub-sidebar, không cần ở slim sidebar
        if (isActive && item.children?.length) {
          continue;
        }

        if (isActive) {
          pinned.push(item);
        }
      }
    }
    // Nếu không có pinned, lấy 5 item đầu tiên (trừ item đang hiện ở sub-sidebar)
    if (pinned.length === 0) {
      for (const group of (gridData || [])) {
        for (const item of group.items) {
          const isActiveWithChildren =
            item.children?.length &&
            item.path !== '/dashboard' &&
            (pathname === item.path || pathname.startsWith(item.path + '/'));
          if (!isActiveWithChildren && pinned.length < 5) pinned.push(item);
        }
      }
    }
    return pinned;
  }, [gridData, pathname]);

  // Tìm active app và children cho sub-sidebar
  const activeAppWithChildren = useMemo(() => {
    for (const group of (gridData || [])) {
      for (const item of group.items) {
        if (item.children?.length) {
          const match =
            (item.path !== '/dashboard' && pathname.startsWith(item.path)) ||
            item.children.some((c) => c.path !== '/dashboard' && pathname.startsWith(c.path));
          if (match) return item;
        }
      }
    }
    return null;
  }, [gridData, pathname]);

  // ==================== SLIM SIDEBAR (luôn hiển thị — giống 1Office) ====================
  const renderSlimSidebar = () => (
    <SlimNavRoot
      layoutQuery={layoutQuery}
      className={mergeClasses([layoutClasses.nav.root, layoutClasses.nav.vertical, className])}
      sx={sx}
      {...other}
    >
      {/* Nút Grid (App Launcher) — giống 1Office */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 1 }}>
        <Tooltip title="Ứng dụng" placement="right" arrow>
          <Box
            onClick={() => {
              setShowAppLauncher((prev) => !prev);
              if (!showAppLauncher) {
                setSearch('');
              }
            }}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              ...(showAppLauncher
                ? {
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    color: '#fff',
                  }
                : {
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                      color: 'text.primary',
                    },
                  }),
            }}
          >
            <Iconify
              icon={showAppLauncher ? 'eva:close-fill' : 'solar:widget-5-bold-duotone'}
              width={22}
            />
          </Box>
        </Tooltip>
      </Box>

      {/* Active App Children — hiện children của app đang dùng */}
      <Scrollbar sx={{ flex: '1 1 auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, px: 0.5, pb: 2 }}>
          {/* App title header */}
          {activeAppWithChildren && (
            <Box sx={{
              width: '100%', py: 1.5, px: 0.5, mb: 0.5,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(activeAppWithChildren.color || '#666', 0.1),
              }}>
                <Iconify icon={activeAppWithChildren.iconName} width={24} sx={{ color: activeAppWithChildren.color || '#666' }} />
              </Box>
              <Typography noWrap sx={{
                fontSize: '0.55rem', maxWidth: 64, textAlign: 'center',
                fontWeight: 700, color: 'text.secondary',
                lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {activeAppWithChildren.title}
              </Typography>
            </Box>
          )}

          {/* Sub-menu items */}
          {(() => {
            // Nếu có active app với children → hiện children
            // Nếu không → hiện WORKPLACE items (nhóm đầu tiên)
            const items = activeAppWithChildren?.children
              || (gridData || [])[0]?.items
              || [];

            return items.map((item) => {
              const isActive =
                item.path !== '/dashboard' &&
                (pathname === item.path || pathname.startsWith(item.path + '/'));
              const itemColor = item.color || activeAppWithChildren?.color || '#666';

              return (
                <Tooltip key={item.title} title={item.title} placement="right" arrow>
                  <ButtonBase
                    component={RouterLink}
                    href={item.path}
                    sx={{
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      py: 1,
                      px: 0.5,
                      width: '100%',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(itemColor, isActive ? 0.12 : 0.06),
                      }}
                    >
                      <Iconify icon={item.iconName || 'solar:document-bold'} width={20} sx={{ color: itemColor }} />
                    </Box>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: '0.6rem',
                        maxWidth: 60,
                        textAlign: 'center',
                        color: isActive ? 'text.primary' : 'text.secondary',
                        fontWeight: isActive ? 700 : 500,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.title}
                    </Typography>
                  </ButtonBase>
                </Tooltip>
              );
            });
          })()}
        </Box>
      </Scrollbar>

      {/* Customize button ở bottom — giống 1Office */}
      {slots?.bottomArea ?? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5, borderTop: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}` }}>
          <Tooltip title="Tùy chỉnh" placement="right" arrow>
            <ButtonBase
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                color: 'text.disabled',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12), color: 'text.secondary' },
              }}
            >
              <Iconify icon="solar:tuning-2-bold-duotone" width={20} />
            </ButtonBase>
          </Tooltip>
        </Box>
      )}
    </SlimNavRoot>
  );

  // ==================== APP LAUNCHER OVERLAY (mở ra khi bấm nút Grid) ====================
  const renderAppLauncher = () => (
    <Fade in={showAppLauncher} timeout={200}>
      <AppLauncherOverlay layoutQuery={layoutQuery}>
        <ClickAwayListener onClickAway={() => setShowAppLauncher(false)}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Logo + Search */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Logo isSingle={false} />
              </Box>

              {/* Search input */}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  px: 1.5, py: 0.875,
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  border: '1px solid transparent',
                  transition: 'all 0.2s',
                  '&:focus-within': {
                    bgcolor: 'background.paper',
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
                  },
                }}
              >
                <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm ứng dụng..."
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontSize: '0.82rem', color: 'inherit', width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </Box>
            </Box>

            {/* App Grid */}
            <Scrollbar fillContent>
              <NavAppGrid
                data={filteredGridData}
                sx={{ flex: '1 1 auto' }}
              />
            </Scrollbar>
          </Box>
        </ClickAwayListener>
      </AppLauncherOverlay>
    </Fade>
  );

  return (
    <>
      {renderSlimSidebar()}
      {showAppLauncher && renderAppLauncher()}
    </>
  );
}

// ==================== STYLED COMPONENTS ====================

// Slim sidebar — luôn hiện, giống 1Office (~70px)
const SlimNavRoot = styled('div', {
  shouldForwardProp: (prop) => !['layoutQuery', 'sx'].includes(prop),
})(({ layoutQuery = 'md', theme }) => ({
  top: 0,
  left: 0,
  height: '100%',
  display: 'none',
  position: 'fixed',
  flexDirection: 'column',
  zIndex: 'var(--layout-nav-zIndex)',
  backgroundColor: 'var(--layout-nav-bg)',
  width: 'var(--layout-nav-mini-width)',
  borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
  [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
}));

// App Launcher Overlay — popup phủ lên content (giống 1Office)
const AppLauncherOverlay = styled('div', {
  shouldForwardProp: (prop) => !['layoutQuery'].includes(prop),
})(({ layoutQuery = 'md', theme }) => ({
  position: 'fixed',
  top: 0,
  left: 'var(--layout-nav-mini-width)',
  width: '380px',
  maxWidth: 'calc(100vw - var(--layout-nav-mini-width))',
  height: '100vh',
  zIndex: 1300,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[20],
  borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
  display: 'none',
  [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
  flexDirection: 'column',
}));
