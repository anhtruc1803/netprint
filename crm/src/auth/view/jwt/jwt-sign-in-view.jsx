import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

const REMEMBER_KEY = 'netprint_remember_account';

function getSavedAccount() {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_e) {
    // ignore
  }
  return null;
}

// ----------------------------------------------------------------------

export const SignInSchema = z.object({
  email: schemaUtils.email(),
  password: z
    .string()
    .min(1, { error: 'Vui lòng nhập mật khẩu!' })
    .min(6, { error: 'Mật khẩu phải có ít nhất 6 ký tự!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState(null);

  const savedAccount = getSavedAccount();

  const [rememberMe, setRememberMe] = useState(!!savedAccount);

  const defaultValues = {
    email: savedAccount?.email || '',
    password: savedAccount?.password || '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ email: data.email, password: data.password });

      // Save or remove remembered account
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: data.email, password: data.password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 2.5, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label="Tên đăng nhập"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:user-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Field.Text
        name="password"
        label="Mật khẩu"
        placeholder="Tối thiểu 6 ký tự"
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:lock-password-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify
                    icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                  />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              size="small"
              sx={{
                color: 'text.disabled',
                '&.Mui-checked': { color: '#D32F2F' },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Lưu tài khoản
            </Typography>
          }
          sx={{ m: 0 }}
        />

        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          sx={{
            color: '#D32F2F',
            fontWeight: 500,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Quên mật khẩu?
        </Link>
      </Box>

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Đang đăng nhập..."
        sx={{
          py: 1.4,
          mt: 0.5,
          fontWeight: 700,
          fontSize: '0.95rem',
          bgcolor: '#D32F2F',
          borderRadius: 1.5,
          textTransform: 'none',
          boxShadow: '0 4px 12px rgba(211,47,47,0.25)',
          '&:hover': {
            bgcolor: '#B71C1C',
            boxShadow: '0 6px 20px rgba(211,47,47,0.35)',
          },
        }}
      >
        Đăng nhập
      </Button>
    </Box>
  );

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            textAlign: { xs: 'center', md: 'left' },
            mb: 1,
          }}
        >
          Đăng nhập tài khoản
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          Vui lòng nhập thông tin đăng nhập của bạn
        </Typography>
      </Box>

      <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

      {!!errorMessage && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 1.5,
          }}
        >
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      {/* Footer */}
      <Divider sx={{ mt: 4, mb: 2, borderStyle: 'dashed' }} />
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          color: 'text.disabled',
        }}
      >
        © 2026 NetPrint · Tô sáng thương hiệu Việt
      </Typography>
    </>
  );
}
