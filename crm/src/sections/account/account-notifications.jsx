import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const NOTIFICATIONS = [
  {
    subheader: 'Hoạt động',
    caption: 'Nhận thông báo về các hoạt động liên quan đến bạn',
    items: [
      { id: 'activity_comments', label: 'Gửi email khi có người bình luận vào bài viết' },
      { id: 'activity_answers', label: 'Gửi email khi có người trả lời biểu mẫu' },
      { id: 'activityFollows', label: 'Gửi email khi có người theo dõi tôi' },
    ],
  },
  {
    subheader: 'Ứng dụng',
    caption: 'Cập nhật và tin tức từ hệ thống',
    items: [
      { id: 'application_news', label: 'Tin tức và thông báo' },
      { id: 'application_product', label: 'Cập nhật sản phẩm hàng tuần' },
      { id: 'application_blog', label: 'Tổng hợp blog hàng tuần' },
    ],
  },
];

// ----------------------------------------------------------------------

export function AccountNotifications({ sx, ...other }) {
  const methods = useForm({
    defaultValues: { selected: ['activity_comments', 'application_product'] },
  });

  const {
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Cập nhật thành công!');
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const getSelected = (selectedItems, item) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card
        sx={[
          {
            p: 3,
            gap: 3,
            display: 'flex',
            flexDirection: 'column',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {NOTIFICATIONS.map((notification) => (
          <Grid key={notification.subheader} container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ListItemText
                primary={notification.subheader}
                secondary={notification.caption}
                slotProps={{
                  primary: { sx: { typography: 'h6' } },
                  secondary: { sx: { mt: 0.5 } },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  p: 3,
                  gap: 1,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.neutral',
                }}
              >
                <Controller
                  name="selected"
                  control={control}
                  render={({ field }) => (
                    <>
                      {notification.items.map((item) => (
                        <FormControlLabel
                          key={item.id}
                          label={item.label}
                          labelPlacement="start"
                          control={
                            <Switch
                              checked={field.value.includes(item.id)}
                              onChange={() => field.onChange(getSelected(values.selected, item.id))}
                              slotProps={{
                                input: {
                                  id: `${item.label}-switch`,
                                  'aria-label': `${item.label} switch`,
                                },
                              }}
                            />
                          }
                          sx={{ m: 0, width: 1, justifyContent: 'space-between' }}
                        />
                      ))}
                    </>
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        ))}

        <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
          Lưu thay đổi
        </Button>
      </Card>
    </Form>
  );
}
