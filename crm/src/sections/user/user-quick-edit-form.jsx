import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { USER_STATUS_OPTIONS } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const UserQuickEditSchema = z.object({
  name: z.string().min(1, { error: 'Vui lòng nhập họ tên!' }),
  email: schemaUtils.email(),
  phoneNumber: schemaUtils.phoneNumber({ isValid: isValidPhoneNumber }),
  country: schemaUtils.nullableInput(z.string().min(1, { error: 'Vui lòng chọn quốc gia!' }), {
    error: 'Vui lòng chọn quốc gia!',
  }),
  state: z.string().min(1, { error: 'Vui lòng nhập tỉnh/thành!' }),
  city: z.string().min(1, { error: 'Vui lòng nhập thành phố!' }),
  address: z.string().min(1, { error: 'Vui lòng nhập địa chỉ!' }),
  zipCode: z.string().min(1, { error: 'Vui lòng nhập mã bưu chính!' }),
  company: z.string().min(1, { error: 'Vui lòng nhập công ty!' }),
  role: z.string().min(1, { error: 'Vui lòng nhập vai trò!' }),
  // Not required
  status: z.string(),
});

// ----------------------------------------------------------------------

export function UserQuickEditForm({ currentUser, open, onClose }) {
  const defaultValues = {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    status: '',
    company: '',
    role: '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      reset();
      onClose();

      toast.promise(promise, {
        loading: 'Đang xử lý...',
        success: 'Cập nhật thành công!',
        error: 'Lỗi cập nhật!',
      });

      await promise;

      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 720 },
        },
      }}
    >
      <DialogTitle>Cập nhật nhanh</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Tài khoản đang chờ xác nhận
          </Alert>

          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Select name="status" label="Trạng thái">
              {USER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

            <Field.Text name="name" label="Họ tên" />
            <Field.Text name="email" label="Địa chỉ email" />
            <Field.Phone name="phoneNumber" label="Số điện thoại" />

            <Field.CountrySelect
              fullWidth
              name="country"
              label="Quốc gia"
              placeholder="Chọn quốc gia"
            />

            <Field.Text name="state" label="Tỉnh/Thành phố" />
            <Field.Text name="city" label="Quận/Huyện" />
            <Field.Text name="address" label="Địa chỉ" />
            <Field.Text name="zipCode" label="Mã bưu chính" />
            <Field.Text name="company" label="Công ty" />
            <Field.Text name="role" label="Vai trò" />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Cập nhật
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
