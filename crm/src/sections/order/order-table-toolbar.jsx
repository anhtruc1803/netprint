import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const VIEW_MODES = [
  { value: 'default', label: 'Mặc định' },
  { value: 'slide', label: 'Trượt qua' },
  { value: 'split', label: 'Chia đôi' },
];

export function OrderTableToolbar({ filters, onResetPage, dateError, table, totalCount = 0 }) {
  const menuActions = usePopover();
  const viewPopover = usePopover();
  const [viewMode, setViewMode] = useState('default');

  const { state: currentFilters, setState: updateFilters } = filters;

  const rowsPerPage = table?.rowsPerPage || 5;
  const page = table?.page || 0;            // 0-indexed
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const startRow = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const endRow = Math.min((page + 1) * rowsPerPage, totalCount);

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ name: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handlePageChange = useCallback(
    (event) => {
      const newPage = Number(event.target.value) - 1;
      table?.onChangePage(null, newPage);
    },
    [table]
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          In
        </MenuItem>
        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:import-bold" />
          Nhập
        </MenuItem>
        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:export-bold" />
          Xuất
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderViewPopover = () => (
    <CustomPopover
      open={viewPopover.open}
      anchorEl={viewPopover.anchorEl}
      onClose={viewPopover.onClose}
      slotProps={{ arrow: { placement: 'top-left' } }}
    >
      <MenuList sx={{ minWidth: 140 }}>
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: 'text.secondary' }}>
          Chọn kiểu xem
        </Typography>
        {VIEW_MODES.map((mode) => (
          <MenuItem
            key={mode.value}
            selected={viewMode === mode.value}
            onClick={() => { setViewMode(mode.value); viewPopover.onClose(); }}
            sx={{
              typography: 'body2',
              color: viewMode === mode.value ? 'primary.main' : 'text.primary',
              fontWeight: viewMode === mode.value ? 600 : 400,
            }}
          >
            {mode.label}
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 1,
          gap: 1,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 48,
        }}
      >
        {/* ── Pagination info (left) ─────────────────────────── */}
        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          Hiển thị <strong>{startRow} - {endRow}</strong> / <strong>{totalCount}</strong> bản ghi
        </Typography>

        <Box sx={{ width: '1px', height: 16, bgcolor: 'divider', mx: 0.5 }} />

        {/* Page selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            Trang:
          </Typography>
          <Select
            value={page + 1}
            onChange={handlePageChange}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.8rem',
              height: 28,
              minWidth: 52,
              '& .MuiSelect-select': { py: 0, px: 1 },
              '& fieldset': { borderColor: 'divider' },
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1} sx={{ fontSize: '0.8rem' }}>
                {String(i + 1).padStart(2, '0')}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            / {totalPages}
          </Typography>
        </Box>

        {/* Prev / Next */}
        <IconButton
          size="small"
          disabled={page === 0}
          onClick={() => table?.onChangePage(null, page - 1)}
          sx={{ p: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        </IconButton>
        <IconButton
          size="small"
          disabled={page >= totalPages - 1}
          onClick={() => table?.onChangePage(null, page + 1)}
          sx={{ p: 0.5 }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        {/* ── Action buttons ─────────────────────────────────── */}
        <Tooltip title="Lọc">
          <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}>
            <Iconify icon="solar:filter-bold-duotone" width={18} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Chọn kiểu xem">
          <IconButton
            size="small"
            onClick={viewPopover.onOpen}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}
          >
            <Iconify icon="solar:list-bold" width={18} />
          </IconButton>
        </Tooltip>

        <Tooltip title="In">
          <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}>
            <Iconify icon="solar:printer-minimalistic-bold" width={18} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Nhập Excel">
          <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}>
            <Iconify icon="solar:import-bold" width={18} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Xuất Excel">
          <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}>
            <Iconify icon="solar:export-bold" width={18} />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: '1px', height: 16, bgcolor: 'divider', mx: 0.5 }} />

        {/* Search */}
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            height: 32,
            px: 1.5,
            borderRadius: 1,
            border: `1px solid ${theme.vars.palette.divider}`,
            width: 200,
            '&:focus-within': { borderColor: theme.vars.palette.primary.main },
          })}
        >
          <Iconify icon="eva:search-fill" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
          <InputBase
            value={currentFilters.name}
            onChange={handleFilterName}
            placeholder="Tìm kiếm..."
            sx={{ flex: 1, fontSize: '0.8rem', '& input': { p: 0 } }}
          />
          {currentFilters.name && (
            <IconButton size="small" onClick={() => updateFilters({ name: '' })} sx={{ p: 0.25 }}>
              <Iconify icon="mingcute:close-line" width={12} />
            </IconButton>
          )}
        </Box>
      </Box>

      {renderMenuActions()}
      {renderViewPopover()}
    </>
  );
}
