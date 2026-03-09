import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// Mock data cho workplace
const QUICK_ACTIONS = [
    { title: 'Tính giá In Nhanh', icon: 'solar:calculator-bold-duotone', color: 'primary', path: '/dashboard/pricing/calculator' },
    { title: 'Tính giá Catalogue', icon: 'solar:notebook-bold-duotone', color: 'info', path: '/dashboard/pricing/catalogue' },
    { title: 'Tạo đơn hàng', icon: 'solar:cart-plus-bold-duotone', color: 'success', path: '/dashboard/order/new' },
    { title: 'Cài đặt giá', icon: 'solar:settings-bold-duotone', color: 'warning', path: '/dashboard/pricing/settings' },
    { title: 'Khách hàng', icon: 'solar:users-group-rounded-bold-duotone', color: 'error', path: '/dashboard/user/list' },
    { title: 'Sản phẩm', icon: 'solar:box-bold-duotone', color: 'secondary', path: '/dashboard/product/list' },
];

const MOCK_TASKS = [
    { id: 1, title: 'Báo giá in catalogue cho Cty Thành Đạt', priority: 'high', done: false, dueDate: 'Hôm nay' },
    { id: 2, title: 'In 500 namecard C300 — KH Nguyễn Văn A', priority: 'high', done: false, dueDate: 'Hôm nay' },
    { id: 3, title: 'Giao hàng đơn #1042 — Sticker decal', priority: 'medium', done: false, dueDate: 'Ngày mai' },
    { id: 4, title: 'Cập nhật giá giấy C200 theo nhà cung cấp', priority: 'low', done: true, dueDate: 'Hôm qua' },
    { id: 5, title: 'Liên hệ KH Trần Thị B về mẫu thiết kế', priority: 'medium', done: false, dueDate: 'Ngày mai' },
    { id: 6, title: 'Kiểm kho giấy FO 150 & C250', priority: 'low', done: true, dueDate: 'Hôm qua' },
];

const MOCK_ACTIVITIES = [
    { id: 1, user: 'Minh Anh', avatar: '🧑‍💼', action: 'tạo đơn hàng mới', target: '#1045 — In tờ rơi A5', time: '10 phút trước', icon: 'solar:cart-plus-bold', color: 'success' },
    { id: 2, user: 'Hùng', avatar: '👨‍🔧', action: 'hoàn thành gia công', target: 'Bế demi 200 tờ decal', time: '25 phút trước', icon: 'solar:check-circle-bold', color: 'primary' },
    { id: 3, user: 'Trang', avatar: '👩‍💻', action: 'cập nhật báo giá', target: 'Catalogue 16 trang — KH Phúc An', time: '1 giờ trước', icon: 'solar:pen-bold', color: 'info' },
    { id: 4, user: 'Minh Anh', avatar: '🧑‍💼', action: 'thêm khách hàng mới', target: 'Công ty TNHH ABC Print', time: '2 giờ trước', icon: 'solar:user-plus-bold', color: 'warning' },
    { id: 5, user: 'Hùng', avatar: '👨‍🔧', action: 'giao hàng thành công', target: '#1038 — 1000 tờ rơi A4', time: '3 giờ trước', icon: 'solar:delivery-bold', color: 'success' },
    { id: 6, user: 'Trang', avatar: '👩‍💻', action: 'in xong', target: '500 namecard C300 2 mặt', time: '4 giờ trước', icon: 'solar:printer-bold', color: 'secondary' },
];

const MOCK_STATS = [
    { title: 'Đơn hàng hôm nay', value: 12, icon: 'solar:cart-large-2-bold-duotone', color: 'primary', change: '+3 so với hôm qua' },
    { title: 'Doanh thu hôm nay', value: '4.2tr', icon: 'solar:wallet-money-bold-duotone', color: 'success', change: '+18% so với hôm qua' },
    { title: 'Đơn đang xử lý', value: 5, icon: 'solar:clock-circle-bold-duotone', color: 'warning', change: '2 đơn gấp' },
    { title: 'Khách hàng mới', value: 3, icon: 'solar:user-plus-rounded-bold-duotone', color: 'info', change: 'Tuần này: 14' },
];

const PRODUCTION_STATUS = [
    { name: 'Chờ in', count: 3, color: 'warning', icon: 'solar:clock-circle-bold' },
    { name: 'Đang in', count: 2, color: 'info', icon: 'solar:printer-bold' },
    { name: 'Gia công', count: 4, color: 'primary', icon: 'solar:scissors-bold' },
    { name: 'Chờ giao', count: 2, color: 'success', icon: 'solar:delivery-bold' },
    { name: 'Hoàn thành', count: 8, color: 'default', icon: 'solar:check-circle-bold' },
];

// ----------------------------------------------------------------------

export function WorkplaceView() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useMockedUser();
    const [tasks, setTasks] = useState(MOCK_TASKS);
    const [newTask, setNewTask] = useState('');

    const toggleTask = useCallback((id) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    }, []);

    const addTask = useCallback(() => {
        if (!newTask.trim()) return;
        setTasks(prev => [...prev, { id: Date.now(), title: newTask.trim(), priority: 'medium', done: false, dueDate: 'Hôm nay' }]);
        setNewTask('');
    }, [newTask]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const getPriorityColor = (p) => {
        if (p === 'high') return 'error';
        if (p === 'medium') return 'warning';
        return 'default';
    };

    const getPriorityLabel = (p) => {
        if (p === 'high') return 'Gấp';
        if (p === 'medium') return 'Bình thường';
        return 'Thấp';
    };

    const completedTasks = tasks.filter(t => t.done).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <DashboardContent maxWidth="xl">
            {/* ===== WELCOME BANNER ===== */}
            <Card sx={{
                mb: 3, p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.info.main} 100%)`,
                color: 'white', borderRadius: 3,
            }}>
                {/* Decorative circles */}
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: alpha('#fff', 0.08) }} />
                <Box sx={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', bgcolor: alpha('#fff', 0.05) }} />
                <Box sx={{ position: 'absolute', top: 20, right: 180, width: 80, height: 80, borderRadius: '50%', bgcolor: alpha('#fff', 0.06) }} />

                <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack spacing={1}>
                        <Typography variant="h4" fontWeight={800}>
                            {getGreeting()}, {user?.displayName || 'Admin'} 👋
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.85 }}>
                            Hôm nay bạn có <strong>{tasks.filter(t => !t.done).length} công việc</strong> cần hoàn thành.
                            Cùng bắt đầu ngày mới hiệu quả nhé!
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                            <Chip icon={<Iconify icon="solar:calendar-bold" />} label={new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                sx={{ bgcolor: alpha('#fff', 0.15), color: 'white', fontWeight: 600, '& .MuiChip-icon': { color: 'white' } }} />
                        </Stack>
                    </Stack>
                    <Box sx={{ display: { xs: 'none', md: 'block' }, fontSize: 80, lineHeight: 1 }}>🏭</Box>
                </Stack>
            </Card>

            {/* ===== STATS ROW ===== */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {MOCK_STATS.map((stat) => (
                    <Grid key={stat.title} size={{ xs: 6, md: 3 }}>
                        <Card sx={{ p: 2.5, borderRadius: 2.5, height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.customShadows?.z16 || theme.shadows[16] } }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Box sx={{
                                    width: 52, height: 52, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette[stat.color].main, 0.16)}, ${alpha(theme.palette[stat.color].main, 0.08)})`,
                                }}>
                                    <Iconify icon={stat.icon} width={28} sx={{ color: `${stat.color}.main` }} />
                                </Box>
                                <Stack spacing={0.25}>
                                    <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>{stat.title}</Typography>
                                </Stack>
                            </Stack>
                            <Typography variant="caption" color={`${stat.color}.main`} sx={{ mt: 1.5, display: 'block', fontWeight: 600 }}>
                                {stat.change}
                            </Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* ===== LEFT COLUMN ===== */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Quick Actions */}
                        <Card sx={{ borderRadius: 2.5 }}>
                            <CardHeader title={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Iconify icon="solar:bolt-bold-duotone" width={24} sx={{ color: 'warning.main' }} />
                                    <Typography variant="h6" fontWeight={700}>Truy cập nhanh</Typography>
                                </Stack>
                            } />
                            <CardContent>
                                <Grid container spacing={2}>
                                    {QUICK_ACTIONS.map((action) => (
                                        <Grid key={action.title} size={{ xs: 6, sm: 4 }}>
                                            <Paper variant="outlined" onClick={() => router.push(action.path)}
                                                sx={{
                                                    p: 2, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: `${action.color}.main`,
                                                        bgcolor: alpha(theme.palette[action.color].main, 0.06),
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 4px 16px ${alpha(theme.palette[action.color].main, 0.16)}`,
                                                    },
                                                }}>
                                                <Box sx={{
                                                    width: 48, height: 48, borderRadius: 2, mx: 'auto', mb: 1.5,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: `linear-gradient(135deg, ${theme.palette[action.color].main}, ${theme.palette[action.color].dark})`,
                                                    color: 'white',
                                                }}>
                                                    <Iconify icon={action.icon} width={24} />
                                                </Box>
                                                <Typography variant="body2" fontWeight={600}>{action.title}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Tasks */}
                        <Card sx={{ borderRadius: 2.5 }}>
                            <CardHeader
                                title={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Iconify icon="solar:checklist-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
                                        <Typography variant="h6" fontWeight={700}>Công việc hôm nay</Typography>
                                        <Chip label={`${completedTasks}/${totalTasks}`} size="small" color="primary" variant="soft" />
                                    </Stack>
                                }
                            />
                            <CardContent sx={{ pt: 0 }}>
                                {/* Progress */}
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <LinearProgress variant="determinate" value={progress} color="primary"
                                        sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.12) }} />
                                    <Typography variant="caption" fontWeight={700} color="primary.main">
                                        {Math.round(progress)}%
                                    </Typography>
                                </Stack>

                                {/* Add new task */}
                                <TextField fullWidth size="small" placeholder="Thêm công việc mới..." value={newTask}
                                    onChange={e => setNewTask(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTask()}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Iconify icon="solar:add-circle-bold" width={20} sx={{ color: 'primary.main' }} /></InputAdornment>,
                                        endAdornment: newTask && (
                                            <InputAdornment position="end">
                                                <Button size="small" variant="soft" color="primary" onClick={addTask}>Thêm</Button>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                                {/* Task list */}
                                <Stack spacing={0.5}>
                                    {tasks.map((task) => (
                                        <Paper key={task.id} variant="outlined" sx={{
                                            px: 1.5, py: 1, borderRadius: 1.5, display: 'flex', alignItems: 'center',
                                            transition: 'all 0.15s',
                                            opacity: task.done ? 0.6 : 1,
                                            bgcolor: task.done ? alpha(theme.palette.success.main, 0.04) : 'transparent',
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                        }}>
                                            <Checkbox size="small" checked={task.done} onChange={() => toggleTask(task.id)}
                                                sx={{ '&.Mui-checked': { color: 'success.main' } }} />
                                            <Typography variant="body2" sx={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', fontWeight: task.done ? 400 : 500 }}>
                                                {task.title}
                                            </Typography>
                                            <Chip label={getPriorityLabel(task.priority)} size="small" color={getPriorityColor(task.priority)}
                                                variant="soft" sx={{ mr: 1, height: 22, fontSize: 11 }} />
                                            <Typography variant="caption" color="text.disabled">{task.dueDate}</Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* ===== RIGHT COLUMN ===== */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        {/* Production Status */}
                        <Card sx={{ borderRadius: 2.5 }}>
                            <CardHeader title={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Iconify icon="solar:factory-bold-duotone" width={24} sx={{ color: 'info.main' }} />
                                    <Typography variant="h6" fontWeight={700}>Trạng thái sản xuất</Typography>
                                </Stack>
                            } />
                            <CardContent>
                                <Stack spacing={1.5}>
                                    {PRODUCTION_STATUS.map((status) => (
                                        <Stack key={status.name} direction="row" alignItems="center" spacing={1.5}
                                            sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette[status.color === 'default' ? 'primary' : status.color].main, 0.06) }}>
                                            <Iconify icon={status.icon} width={20}
                                                sx={{ color: status.color === 'default' ? 'text.secondary' : `${status.color}.main` }} />
                                            <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                                                {status.name}
                                            </Typography>
                                            <Chip label={status.count} size="small"
                                                color={status.color === 'default' ? 'default' : status.color}
                                                variant="soft" sx={{ fontWeight: 700, minWidth: 32 }} />
                                        </Stack>
                                    ))}
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">Tổng đơn hôm nay</Typography>
                                    <Typography variant="h5" fontWeight={800} color="primary.main">
                                        {PRODUCTION_STATUS.reduce((s, p) => s + p.count, 0)}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Activity Feed */}
                        <Card sx={{ borderRadius: 2.5 }}>
                            <CardHeader title={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Iconify icon="solar:history-bold-duotone" width={24} sx={{ color: 'success.main' }} />
                                    <Typography variant="h6" fontWeight={700}>Hoạt động gần đây</Typography>
                                </Stack>
                            } />
                            <CardContent>
                                <Stack spacing={2}>
                                    {MOCK_ACTIVITIES.map((activity, idx) => (
                                        <Stack key={activity.id} direction="row" spacing={1.5} alignItems="flex-start">
                                            {/* Timeline dot + line */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                                                <Box sx={{
                                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: alpha(theme.palette[activity.color].main, 0.12),
                                                }}>
                                                    <Iconify icon={activity.icon} width={16} sx={{ color: `${activity.color}.main` }} />
                                                </Box>
                                                {idx < MOCK_ACTIVITIES.length - 1 && (
                                                    <Box sx={{ width: 2, flex: 1, bgcolor: theme.palette.divider, mt: 0.5, minHeight: 20 }} />
                                                )}
                                            </Box>
                                            <Box sx={{ flex: 1, pb: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>{activity.user}</strong> {activity.action}
                                                </Typography>
                                                <Typography variant="body2" color="primary.main" fontWeight={600}>
                                                    {activity.target}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    {activity.time}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </DashboardContent>
    );
}
