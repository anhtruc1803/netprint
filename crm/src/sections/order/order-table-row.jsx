import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function OrderTableRow({ row, selected, onSelectRow, onDeleteRow, detailsHref }) {
  const confirmDialog = useBoolean();
  const menuActions = usePopover();
  const collapseRow = useBoolean();

  const renderPrimaryRow = () => (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={onSelectRow}
          slotProps={{
            input: {
              id: `${row.id}-checkbox`,
              'aria-label': `${row.id} checkbox`,
            },
          }}
        />
      </TableCell>

      {/* Ngày tạo */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {new Date(row.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </TableCell>

      {/* Đơn hàng */}
      <TableCell>
        <Link
          component={RouterLink}
          href={detailsHref}
          color="inherit"
          underline="hover"
          sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}
        >
          {row.orderNumber}{row.name ? ` - ${row.name}` : ''}
        </Link>
      </TableCell>

      {/* Khách hàng */}
      <TableCell>
        <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center' }}>
          <Avatar alt={row.customer.name} src={row.customer.avatarUrl} sx={{ width: 32, height: 32, fontSize: '0.8rem' }} />
          <ListItemText
            primary={row.customer.name}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2', textTransform: 'uppercase', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' },
              },
            }}
          />
        </Box>
      </TableCell>

      {/* Giá trị */}
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}> {fCurrency(row.subtotal)} </TableCell>

      {/* Đã thu */}
      <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: row.paidAmount > 0 ? 'success.main' : 'text.disabled' }}>
        {row.paidAmount > 0 ? fCurrency(row.paidAmount) : '—'}
      </TableCell>

      {/* Còn lại */}
      <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: (row.subtotal - row.paidAmount) > 0 ? 'error.main' : 'text.disabled' }}>
        {(row.subtotal - row.paidAmount) > 0 ? fCurrency(row.subtotal - row.paidAmount) : '—'}
      </TableCell>

      <TableCell align="right">
        <Label
          variant="soft"
          color={
            (row.status === 'approved' && 'success') ||
            (row.status === 'pending_approval' && 'warning') ||
            'default'
          }
        >
          {(row.status === 'approved' && 'Đã duyệt') ||
            (row.status === 'pending_approval' && 'Chờ duyệt') ||
            row.status}
        </Label>
      </TableCell>

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        <IconButton
          color={collapseRow.value ? 'inherit' : 'default'}
          onClick={collapseRow.onToggle}
          sx={{ ...(collapseRow.value && { bgcolor: 'action.hover' }) }}
        >
          <Iconify icon="eva:arrow-ios-downward-fill" />
        </IconButton>

        <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  const renderSecondaryRow = () => (
    <TableRow>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
        <Collapse
          in={collapseRow.value}
          timeout="auto"
          unmountOnExit
          sx={{ bgcolor: 'background.neutral' }}
        >
          <Paper sx={{ m: 1.5 }}>
            {row.items.map((item) => (
              <Box
                key={item.id}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  p: theme.spacing(1.5, 2, 1.5, 1.5),
                  '&:not(:last-of-type)': {
                    borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                  },
                })}
              >
                <Avatar
                  src={item.coverUrl}
                  variant="rounded"
                  sx={{ width: 48, height: 48, mr: 2 }}
                />

                <ListItemText
                  primary={item.name}
                  secondary={item.sku}
                  slotProps={{
                    primary: { sx: { typography: 'body2' } },
                    secondary: { sx: { color: 'text.disabled' } },
                  }}
                />

                <div>x{item.quantity} </div>

                <Box sx={{ width: 110, textAlign: 'right' }}>{fCurrency(item.price)}</Box>
              </Box>
            ))}
          </Paper>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Xóa
        </MenuItem>

        <li>
          <MenuItem component={RouterLink} href={detailsHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:eye-bold" />
            Xem
          </MenuItem>
        </li>
      </MenuList>
    </CustomPopover>
  );

  const renderConfrimDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Xóa"
      content="Bạn có chắc chắn muốn xóa?"
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          Xóa
        </Button>
      }
    />
  );

  return (
    <>
      {renderPrimaryRow()}
      {renderSecondaryRow()}
      {renderMenuActions()}
      {renderConfrimDialog()}
    </>
  );
}
