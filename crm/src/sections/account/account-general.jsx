import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fData } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1, { error: 'Vui lòng nhập tên!' }),
  email: schemaUtils.email(),
  photoURL: z.any().optional(),
  phoneNumber: z.string().optional().or(z.literal('')),
  country: z.any().optional().nullable(),
  address: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  about: z.string().optional().or(z.literal('')),
  // Not required
  isPublic: z.boolean(),
});

// ----------------------------------------------------------------------

export function AccountGeneral() {
  const { user, updateUser } = useMockedUser();

  const currentUser = {
    displayName: user?.displayName,
    email: user?.email,
    photoURL: user?.photoURL,
    phoneNumber: user?.phoneNumber,
    country: user?.country,
    address: user?.address,
    state: user?.state,
    city: user?.city,
    zipCode: user?.zipCode,
    about: user?.about,
    isPublic: user?.isPublic,
  };

  const defaultValues = {
    displayName: '',
    email: '',
    photoURL: null,
    phoneNumber: '',
    country: null,
    address: '',
    state: '',
    city: '',
    zipCode: '',
    about: '',
    isPublic: false,
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Convert avatar File to base64 for localStorage storage
      let photoURL = data.photoURL;
      if (photoURL instanceof File) {
        photoURL = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(photoURL);
        });
      }

      updateUser({ ...data, photoURL });
      toast.success('Cập nhật thành công!');
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              pt: 10,
              pb: 5,
              px: 3,
              textAlign: 'center',
            }}
          >
            <Field.UploadAvatar
              name="photoURL"
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

            <Field.Switch
              name="isPublic"
              labelPlacement="start"
              label="Hồ sơ công khai"
              sx={{ mt: 5 }}
            />

            <Button variant="soft" color="error" sx={{ mt: 3 }}>
              Xóa người dùng
            </Button>
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
              <Field.Text name="displayName" label="Họ tên" />
              <Field.Text name="email" label="Địa chỉ email" />
              <Field.Phone name="phoneNumber" label="Số điện thoại" />
              <Field.Text name="address" label="Địa chỉ" />

              <Field.CountrySelect name="country" label="Quốc gia" placeholder="Chọn quốc gia" />

              <Field.Text name="state" label="Tỉnh/Thành phố" />
              <Field.Text name="city" label="Quận/Huyện" />
              <Field.Text name="zipCode" label="Mã bưu chính" />
            </Box>

            <Stack spacing={3} sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Field.Text name="about" multiline rows={4} label="Giới thiệu" />

              <Button type="submit" variant="contained" loading={isSubmitting}>
                Lưu thay đổi
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
