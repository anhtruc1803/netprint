import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { getUsers, createUser, updateUser, deleteUser, toggleUserActive } from 'src/auth/user-store';
import { PERMISSION_GROUPS, DEFAULT_PERMISSIONS } from 'src/auth/permissions';

// ----------------------------------------------------------------------

const EMPTY_FORM = {
    displayName: '',
    email: '',
    password: '',
    role: 'staff',
    phoneNumber: '',
    department: '',
};

// ----------------------------------------------------------------------

export function AccountManagementView() {
    const theme = useTheme();
    const [users, setUsers] = useState(getUsers);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showPassword, setShowPassword] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Permissions dialog
    const [permDialog, setPermDialog] = useState(null); // user object
    const [permState, setPermState] = useState([]);
    const [expandedGroup, setExpandedGroup] = useState(null);

    const refreshUsers = useCallback(() => {
        setUsers(getUsers());
    }, []);

    const handleOpenCreate = () => {
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setOpenDialog(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setForm({
            displayName: user.displayName,
            email: user.email,
            password: '',
            role: user.role,
            phoneNumber: user.phoneNumber || '',
            department: user.department || '',
        });
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setForm(EMPTY_FORM);
    };

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = () => {
        try {
            if (!form.displayName.trim()) {
                toast.error('Vui lòng nhập họ tên!');
                return;
            }
            if (!form.email.trim()) {
                toast.error('Vui lòng nhập email!');
                return;
            }

            if (editingUser) {
                // Update
                const data = {
                    displayName: form.displayName,
                    email: form.email,
                    role: form.role,
                    phoneNumber: form.phoneNumber,
                    department: form.department,
                };
                if (form.password.trim()) {
                    data.password = form.password;
                }
                // Nếu đổi role → reset permissions về mặc định
                if (form.role !== editingUser.role) {
                    data.permissions = DEFAULT_PERMISSIONS[form.role] || DEFAULT_PERMISSIONS.staff;
                }
                updateUser(editingUser.id, data);
                toast.success('Cập nhật tài khoản thành công!');
            } else {
                // Create
                if (!form.password.trim()) {
                    toast.error('Vui lòng nhập mật khẩu!');
                    return;
                }
                createUser({
                    ...form,
                    permissions: DEFAULT_PERMISSIONS[form.role] || DEFAULT_PERMISSIONS.staff,
                });
                toast.success('Tạo tài khoản thành công!');
            }

            refreshUsers();
            handleClose();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = (id) => {
        try {
            deleteUser(id);
            toast.success('Đã xóa tài khoản!');
            refreshUsers();
            setDeleteConfirm(null);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleActive = (id) => {
        try {
            toggleUserActive(id);
            refreshUsers();
            toast.success('Đã cập nhật trạng thái!');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // ====== PERMISSIONS DIALOG ======

    const handleOpenPermissions = (user) => {
        setPermDialog(user);
        setPermState(user.permissions || DEFAULT_PERMISSIONS[user.role] || []);
        setExpandedGroup(null);
    };

    const handleTogglePerm = (key) => {
        setPermState((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );
    };

    const handleSavePermissions = () => {
        try {
            updateUser(permDialog.id, { permissions: permState });
            toast.success('Đã cập nhật quyền!');
            refreshUsers();
            setPermDialog(null);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleResetPermissions = () => {
        if (permDialog) {
            setPermState(DEFAULT_PERMISSIONS[permDialog.role] || DEFAULT_PERMISSIONS.staff);
        }
    };

    // ====== RENDER ======

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading="Quản lý tài khoản"
                links={[
                    { name: 'Trang chủ', href: paths.dashboard.root },
                    { name: 'Quản lý tài khoản' },
                ]}
                action={
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                    >
                        Tạo tài khoản
                    </Button>
                }
                sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card>
                <TableContainer sx={{ overflow: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Họ tên</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phòng ban</TableCell>
                                <TableCell>SĐT</TableCell>
                                <TableCell>Vai trò</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2">{user.displayName}</Typography>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.department || '—'}</TableCell>
                                    <TableCell>{user.phoneNumber || '—'}</TableCell>
                                    <TableCell>
                                        <Label color={user.role === 'admin' ? 'error' : 'info'}>
                                            {user.role === 'admin' ? 'Admin' : 'Nhân viên'}
                                        </Label>
                                    </TableCell>
                                    <TableCell>
                                        <Label color={user.isActive ? 'success' : 'default'}>
                                            {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                                        </Label>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenEdit(user)}
                                                title="Chỉnh sửa"
                                            >
                                                <Iconify icon="solar:pen-bold" width={20} />
                                            </IconButton>
                                            {user.role !== 'admin' && (
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => handleOpenPermissions(user)}
                                                    title="Phân quyền"
                                                >
                                                    <Iconify icon="solar:shield-keyhole-bold" width={20} />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color={user.isActive ? 'warning' : 'success'}
                                                onClick={() => handleToggleActive(user.id)}
                                                title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                            >
                                                <Iconify icon={user.isActive ? 'solar:lock-bold' : 'solar:lock-unlocked-bold'} width={20} />
                                            </IconButton>
                                            {deleteConfirm === user.id ? (
                                                <>
                                                    <Button size="small" color="error" variant="contained" onClick={() => handleDelete(user.id)}>
                                                        Xác nhận
                                                    </Button>
                                                    <Button size="small" onClick={() => setDeleteConfirm(null)}>
                                                        Hủy
                                                    </Button>
                                                </>
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setDeleteConfirm(user.id)}
                                                    title="Xóa"
                                                >
                                                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ====== Create/Edit Dialog ====== */}
            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Họ tên"
                            value={form.displayName}
                            onChange={handleChange('displayName')}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={handleChange('email')}
                            required
                        />
                        <TextField
                            fullWidth
                            label={editingUser ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleChange('password')}
                            required={!editingUser}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Vai trò</InputLabel>
                            <Select value={form.role} onChange={handleChange('role')} label="Vai trò">
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="staff">Nhân viên</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Phòng ban"
                            value={form.department}
                            onChange={handleChange('department')}
                            placeholder="VD: Kinh doanh, Thiết kế, Sản xuất..."
                        />
                        <TextField
                            fullWidth
                            label="Số điện thoại"
                            value={form.phoneNumber}
                            onChange={handleChange('phoneNumber')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ====== Permissions Dialog ====== */}
            <Dialog
                open={!!permDialog}
                onClose={() => setPermDialog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 },
                }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                            color: 'white',
                        }}>
                            <Iconify icon="solar:shield-keyhole-bold" width={22} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Phân quyền</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {permDialog?.displayName} ({permDialog?.email})
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 0 }}>
                    {PERMISSION_GROUPS.map((group) => {
                        const isExpanded = expandedGroup === group.label;
                        const groupPerms = group.permissions.map((p) => p.key);
                        const enabledCount = groupPerms.filter((k) => permState.includes(k)).length;
                        const allEnabled = enabledCount === groupPerms.length;

                        return (
                            <Box key={group.label}>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1.5}
                                    onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                                    sx={{
                                        px: 3, py: 1.5,
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                    }}
                                >
                                    <Box sx={{
                                        width: 36, height: 36, borderRadius: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        color: 'primary.main',
                                    }}>
                                        <Iconify icon={group.icon} width={20} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {group.label}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${enabledCount}/${groupPerms.length}`}
                                        size="small"
                                        color={allEnabled ? 'success' : enabledCount > 0 ? 'warning' : 'default'}
                                        variant="soft"
                                        sx={{ fontWeight: 700, fontSize: 12 }}
                                    />
                                    <Iconify
                                        icon={isExpanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                                        width={16}
                                        sx={{ color: 'text.secondary' }}
                                    />
                                </Stack>

                                <Collapse in={isExpanded}>
                                    <Stack spacing={0} sx={{ px: 3, pb: 1.5 }}>
                                        {group.permissions.map((perm) => (
                                            <Stack
                                                key={perm.key}
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                                sx={{
                                                    py: 0.75, pl: 5.5,
                                                    borderRadius: 1,
                                                    transition: 'background 0.15s',
                                                    '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.08) },
                                                }}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {perm.label}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {perm.desc}
                                                    </Typography>
                                                </Box>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={permState.includes(perm.key)}
                                                            onChange={() => handleTogglePerm(perm.key)}
                                                            color="success"
                                                        />
                                                    }
                                                    label=""
                                                    sx={{ m: 0 }}
                                                />
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Collapse>
                                <Divider />
                            </Box>
                        );
                    })}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={handleResetPermissions}
                        color="warning"
                        startIcon={<Iconify icon="solar:restart-bold" />}
                        size="small"
                    >
                        Đặt lại mặc định
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={() => setPermDialog(null)} color="inherit">
                        Hủy
                    </Button>
                    <Button onClick={handleSavePermissions} variant="contained" color="primary">
                        Lưu quyền
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardContent>
    );
}
