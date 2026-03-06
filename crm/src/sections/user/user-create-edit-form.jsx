import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const UserCreateSchema = z.object({
  avatarUrl: schemaUtils.file({ error: 'Vui lòng tải ảnh đại diện!' }),
  name: z.string().min(1, { error: 'Vui lòng nhập họ tên!' }),
  email: schemaUtils.email(),
  phoneNumber: schemaUtils.phoneNumber({ isValid: isValidPhoneNumber }),
  country: schemaUtils.nullableInput(z.string().min(1, { error: 'Vui lòng chọn quốc gia!' }), {
    error: 'Vui lòng chọn quốc gia!',
  }),
  address: z.string().min(1, { error: 'Vui lòng nhập địa chỉ!' }),
  company: z.string().min(1, { error: 'Vui lòng nhập công ty!' }),
  state: z.string().min(1, { error: 'Vui lòng nhập tỉnh/thành!' }),
  city: z.string().min(1, { error: 'Vui lòng nhập thành phố!' }),
  role: z.string().min(1, { error: 'Vui lòng nhập vai trò!' }),
  zipCode: z.string().min(1, { error: 'Vui lòng nhập mã bưu chính!' }),
  // Not required
  status: z.string(),
  isVerified: z.boolean(),
});

// ----------------------------------------------------------------------

export function UserCreateEditForm({ currentUser }) {
  const router = useRouter();

  const defaultValues = {
    status: '',
    avatarUrl: null,
    isVerified: true,
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: '',
    company: '',
    role: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UserCreateSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      toast.success(currentUser ? 'Cập nhật thành công!' : 'Tạo thành công!');
      router.push(paths.dashboard.user.list);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'banned' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}

            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Cho phép *.jpeg, *.jpg, *.png, *.gif
                    <br /> dung lượng tối đa {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? 'banned' : 'active')
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Khóa tài khoản
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Vô hiệu hóa tài khoản người dùng
                    </Typography>
                  </>
                }
                sx={{
                  mx: 0,
                  mb: 3,
                  width: 1,
                  justifyContent: 'space-between',
                }}
              />
            )}

            <Field.Switch
              name="isVerified"
              labelPlacement="start"
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Xác minh email
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Tắt tùy chọn này sẽ tự động gửi email xác minh cho người dùng
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />

            {currentUser && (
              <Stack sx={{ mt: 3, alignItems: 'center', justifyContent: 'center' }}>
                <Button variant="soft" color="error">
                  Xóa người dùng
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="name" label="Họ tên" />
              <Field.Text name="email" label="Địa chỉ email" />
              <Field.Phone name="phoneNumber" label="Số điện thoại" defaultCountry="VN" />

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

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Tạo người dùng' : 'Lưu thay đổi'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
