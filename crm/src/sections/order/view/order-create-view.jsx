import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const generateOrderCode = () => {
    const now = new Date();
    const num = Math.floor(Math.random() * 900) + 100;
    return `DH${num} - ${now.getFullYear()}`;
};

const todayStr = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// --- Section Header ---
function SectionHeader({ title, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Box sx={{ mb: 3 }}>
            <Box
                onClick={() => setOpen(!open)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: 0.5,
                    mb: open ? 2 : 0,
                    userSelect: 'none',
                }}
            >
                <Iconify
                    icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                    sx={{ color: 'primary.main', width: 20, height: 20 }}
                />
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {title}
                </Typography>
            </Box>
            {open && children}
        </Box>
    );
}

// --- Product Row ---
function ProductRow({ index, onRemove }) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                mb: 1.5,
            }}
        >
            <TextField
                size="small"
                placeholder="Nhập sản phẩm, dịch vụ"
                sx={{ flex: 3, minWidth: 180 }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                    },
                }}
            />
            <TextField
                size="small"
                select
                defaultValue=""
                sx={{ flex: 1, minWidth: 90 }}
                label="Đơn vị"
            >
                <MenuItem value="">--</MenuItem>
                <MenuItem value="cái">Cái</MenuItem>
                <MenuItem value="hộp">Hộp</MenuItem>
                <MenuItem value="cuộn">Cuộn</MenuItem>
                <MenuItem value="tờ">Tờ</MenuItem>
                <MenuItem value="kg">Kg</MenuItem>
            </TextField>
            <TextField size="small" placeholder="Giá bán" sx={{ flex: 1.2, minWidth: 100 }} type="number" />
            <TextField size="small" placeholder="SL" sx={{ flex: 0.7, minWidth: 60 }} type="number" />
            <TextField size="small" placeholder="%" sx={{ flex: 0.6, minWidth: 55 }} type="number" />
            <TextField size="small" placeholder="Số tiền" sx={{ flex: 1, minWidth: 90 }} type="number" />
            <TextField size="small" placeholder="Thành tiền" sx={{ flex: 1.2, minWidth: 100 }} type="number" />
            <IconButton size="small" color="error" onClick={onRemove} sx={{ flexShrink: 0 }}>
                <Iconify icon="mingcute:close-line" width={18} />
            </IconButton>
        </Box>
    );
}

// --- Payment Row ---
function PaymentRow({ index, onRemove }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
            <TextField size="small" defaultValue={`Lần ${index + 1}`} sx={{ flex: 0.6, minWidth: 70 }} />
            <TextField size="small" placeholder="Thanh toán..." sx={{ flex: 2, minWidth: 160 }} />
            <TextField size="small" type="date" sx={{ flex: 1.2, minWidth: 130 }} />
            <TextField
                size="small"
                placeholder="%"
                sx={{ flex: 0.6, minWidth: 60 }}
                type="number"
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
            />
            <TextField size="small" placeholder="Tiền" sx={{ flex: 1, minWidth: 90 }} type="number" />
            <IconButton size="small" color="error" onClick={onRemove} sx={{ flexShrink: 0 }}>
                <Iconify icon="mingcute:close-line" width={18} />
            </IconButton>
        </Box>
    );
}

// ======================================================================
// MAIN VIEW
// ======================================================================

export function OrderCreateView() {
    const [products, setProducts] = useState([0]);
    const [payments, setPayments] = useState([0]);

    const addProduct = () => setProducts((p) => [...p, p.length]);
    const removeProduct = (i) => setProducts((p) => p.filter((_, idx) => idx !== i));

    const addPayment = () => setPayments((p) => [...p, p.length]);
    const removePayment = (i) => setPayments((p) => p.filter((_, idx) => idx !== i));

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading="Tạo mới đơn hàng bán"
                links={[
                    { name: 'Bảng điều khiển', href: paths.dashboard.root },
                    { name: 'Đơn hàng', href: paths.dashboard.order.root },
                    { name: 'Tạo mới' },
                ]}
                sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card sx={{ p: 3 }}>
                {/* ============ THÔNG TIN CHUNG ============ */}
                <SectionHeader title="Thông tin chung">
                    <Stack spacing={2.5}>
                        {/* Row 1: Mã đơn hàng + Ngày bán */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Mã đơn hàng *"
                                defaultValue={generateOrderCode()}
                                size="small"
                                sx={{ flex: 1 }}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Iconify icon="solar:refresh-bold" sx={{ cursor: 'pointer', color: 'text.disabled' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <TextField
                                label="Ngày bán *"
                                defaultValue={todayStr()}
                                size="small"
                                sx={{ flex: 1 }}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Iconify icon="solar:calendar-bold" sx={{ color: 'text.disabled' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Box>

                        {/* Báo giá */}
                        <TextField
                            label="Báo giá"
                            size="small"
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        {/* Khách hàng */}
                        <TextField
                            label="Khách hàng *"
                            size="small"
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        {/* Người phụ trách */}
                        <TextField label="Người phụ trách" size="small" fullWidth defaultValue="Admin" />

                        {/* Người theo dõi */}
                        <TextField
                            label="Người theo dõi"
                            size="small"
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        {/* Mẫu đơn hàng */}
                        <TextField
                            label="Mẫu đơn hàng *"
                            size="small"
                            fullWidth
                            select
                            defaultValue="chietkhau"
                        >
                            <MenuItem value="chietkhau">Chiết khấu trên từng hàng hóa, thuế trên tổng đơn hàng</MenuItem>
                            <MenuItem value="khongchietkhau">Không chiết khấu</MenuItem>
                        </TextField>

                        {/* Checkbox */}
                        <FormControlLabel
                            control={<Checkbox size="small" />}
                            label={
                                <Typography variant="body2">
                                    Tự động sinh phiếu xuất kho
                                </Typography>
                            }
                        />
                    </Stack>
                </SectionHeader>

                <Divider sx={{ my: 3 }} />

                {/* ============ HÀNG HÓA ============ */}
                <SectionHeader title="Hàng hóa">
                    {/* Column Headers */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 0.5 }}>
                        <Typography variant="caption" sx={{ flex: 3, minWidth: 180, fontWeight: 600 }}>Sản phẩm *</Typography>
                        <Typography variant="caption" sx={{ flex: 1, minWidth: 90, fontWeight: 600 }}>Đơn vị</Typography>
                        <Typography variant="caption" sx={{ flex: 1.2, minWidth: 100, fontWeight: 600 }}>Giá bán</Typography>
                        <Typography variant="caption" sx={{ flex: 0.7, minWidth: 60, fontWeight: 600 }}>Số lượng *</Typography>
                        <Typography variant="caption" sx={{ flex: 0.6, minWidth: 55, fontWeight: 600 }}>CK (%)</Typography>
                        <Typography variant="caption" sx={{ flex: 1, minWidth: 90, fontWeight: 600 }}>Tiền chiết khấu</Typography>
                        <Typography variant="caption" sx={{ flex: 1.2, minWidth: 100, fontWeight: 600 }}>Thành tiền *</Typography>
                        <Box sx={{ width: 30, flexShrink: 0 }} />
                    </Box>

                    {products.map((_, i) => (
                        <ProductRow key={i} index={i} onRemove={() => removeProduct(i)} />
                    ))}

                    <Button
                        size="small"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={addProduct}
                        sx={{ mt: 1, color: 'primary.main' }}
                    >
                        Thêm sản phẩm
                    </Button>

                    {/* Summary */}
                    <Stack spacing={1.5} sx={{ mt: 3, maxWidth: 450, ml: 'auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600}>Tổng tiền</Typography>
                            <TextField size="small" placeholder="Số tiền" sx={{ width: 160 }} type="number" />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>Thuế</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="%"
                                    sx={{ width: 80 }}
                                    type="number"
                                    slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                                />
                                <TextField size="small" placeholder="Hoặc số tiền" sx={{ width: 140 }} type="number" />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>Phí trên tổng đơn hàng</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField size="small" select defaultValue="" sx={{ width: 90 }} label="Phí">
                                    <MenuItem value="">--</MenuItem>
                                    <MenuItem value="ship">Vận chuyển</MenuItem>
                                    <MenuItem value="setup">Thiết kế</MenuItem>
                                </TextField>
                                <TextField size="small" placeholder="Số tiền" sx={{ width: 120 }} type="number" />
                                <IconButton size="small" color="primary">
                                    <Iconify icon="mingcute:add-circle-line" />
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={700}>Tổng tiền sau CK</Typography>
                            <TextField size="small" placeholder="Số tiền" sx={{ width: 160 }} type="number" />
                        </Box>
                    </Stack>
                </SectionHeader>

                <Divider sx={{ my: 3 }} />

                {/* ============ KHUYẾN MÃI ============ */}
                <SectionHeader title="Khuyến mãi" defaultOpen={false}>
                    <TextField
                        label="Mã khuyến mãi"
                        size="small"
                        fullWidth
                        placeholder="Nhập mã khuyến mãi..."
                    />
                </SectionHeader>

                <Divider sx={{ my: 3 }} />

                {/* ============ THANH TOÁN ============ */}
                <SectionHeader title="Thanh toán">
                    {/* Payment column headers */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 0.5 }}>
                        <Typography variant="caption" sx={{ flex: 0.6, minWidth: 70, fontWeight: 600 }}>Số</Typography>
                        <Typography variant="caption" sx={{ flex: 2, minWidth: 160, fontWeight: 600 }}>Nội dung thanh toán</Typography>
                        <Typography variant="caption" sx={{ flex: 1.2, minWidth: 130, fontWeight: 600 }}>Ngày thanh toán</Typography>
                        <Typography variant="caption" sx={{ flex: 0.6, minWidth: 60, fontWeight: 600 }}>Thanh toán (%)</Typography>
                        <Typography variant="caption" sx={{ flex: 1, minWidth: 90, fontWeight: 600 }}>Số tiền</Typography>
                        <Box sx={{ width: 30, flexShrink: 0 }} />
                    </Box>

                    {payments.map((_, i) => (
                        <PaymentRow key={i} index={i} onRemove={() => removePayment(i)} />
                    ))}

                    <Button
                        size="small"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={addPayment}
                        sx={{ mt: 1, color: 'primary.main' }}
                    >
                        Thêm đợt thanh toán
                    </Button>

                    {/* Mô tả */}
                    <TextField
                        label="Mô tả"
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Ghi chú đơn hàng bán"
                        sx={{ mt: 3 }}
                    />

                    {/* Đính kèm */}
                    <Box
                        sx={{
                            mt: 2,
                            p: 3,
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 1.5,
                            textAlign: 'center',
                        }}
                    >
                        <Iconify icon="solar:cloud-upload-bold-duotone" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            Kéo thả file vào đây để tải lên hoặc
                        </Typography>
                        <Button variant="contained" color="error" size="small" startIcon={<Iconify icon="solar:upload-bold" />}>
                            Chọn từ máy
                        </Button>
                    </Box>

                    {/* Người duyệt */}
                    <TextField
                        label="Người duyệt 1 *"
                        size="small"
                        fullWidth
                        select
                        defaultValue=""
                        sx={{ mt: 3 }}
                    >
                        <MenuItem value="">-- Chọn người duyệt --</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="manager">Quản lý</MenuItem>
                    </TextField>
                </SectionHeader>

                <Divider sx={{ my: 3 }} />

                {/* ============ ĐỐI TƯỢNG LIÊN QUAN ============ */}
                <SectionHeader title="Đối tượng liên quan" defaultOpen={false}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            label="Đối tượng liên quan"
                            size="small"
                            select
                            defaultValue=""
                            sx={{ flex: 1 }}
                        >
                            <MenuItem value="">-- Chọn --</MenuItem>
                            <MenuItem value="duan">Dự án</MenuItem>
                            <MenuItem value="hopdong">Hợp đồng</MenuItem>
                        </TextField>
                        <IconButton size="small" color="error">
                            <Iconify icon="mingcute:close-line" width={18} />
                        </IconButton>
                    </Box>
                </SectionHeader>

                <Divider sx={{ my: 3 }} />

                {/* ============ ACTION BUTTONS ============ */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        size="large"
                        component={RouterLink}
                        href={paths.dashboard.order.root}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<Iconify icon="solar:check-circle-bold" />}
                    >
                        Lưu đơn hàng
                    </Button>
                </Box>
            </Card>
        </DashboardContent>
    );
}
