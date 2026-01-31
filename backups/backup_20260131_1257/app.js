// ===== NETPRINT - TÍNH GIÁ IN NHANH =====
// Version 2.0 - Cài đặt riêng biệt cho từng loại sản phẩm

const ADMIN_KEY = 'netprint2024';
let currentUser = null;

// ===== DEFAULT SETTINGS =====
// Version cho settings - tăng lên khi có thay đổi
const LAMINATIONS_VERSION = 12; // Version 12: Thêm Bo góc

// 1. CÀI ĐẶT IN GIẤY
let PAPER_SETTINGS = {
    // CẤU TRÚC MỚI: Khổ giấy → Loại giấy → Giá theo mốc số lượng
    printSizes: [],  // Để trống - anh tự thêm khổ giấy
    // Giá giấy theo khổ in - có tiers (mốc số lượng)
    paperPricing: [],  // Để trống - anh tự thêm loại giấy

    printOptions: [
        {
            id: 1, name: 'In 1 mặt', tiers: [
                { max: 500, price: 2000 },
                { max: 999999, price: 1800 }
            ]
        }
        // In 2 mặt: tính mốc theo số tờ 1 mặt tương đương (ví dụ: 300 tờ 2 mặt = 600 tờ 1 mặt)
    ],
    // CÁN MÀNG - Cấu trúc mới: Khổ giấy → Loại cán màng → Giá theo mốc số lượng
    // Mỗi mốc có unit: 'per_sheet' (đ/tờ), 'per_lot' (đ/lô), 'per_m2' (đ/m²)
    laminationPricing: [],  // Để trống - anh tự thêm loại cán màng

    // CÁN MÀNG CŨ - Giữ lại để backward compatible
    // Giá theo số TỜ (mặt)
    // < 500 tờ: giá cố định/tờ
    // ≥ 500 tờ: tính theo m² (cần tính diện tích tờ in)
    laminations: [
        { id: 1, name: 'Không cán', tiers: [{ max: 999999, price: 0 }] },
        // Cán bóng 1 mặt: <500 tờ = 600đ/tờ, ≥500 tờ = 2500đ/m²
        { id: 2, name: 'Cán bóng 1 mặt', tiers: [{ max: 499, price: 600 }], pricePerM2: 2500 },
        // Cán bóng 2 mặt: <500 tờ = 1200đ/tờ, ≥500 tờ = 5000đ/m²
        { id: 3, name: 'Cán bóng 2 mặt', tiers: [{ max: 499, price: 1200 }], pricePerM2: 5000 },
        // Cán mờ 1 mặt: <500 tờ = 700đ/tờ, ≥500 tờ = 2700đ/m²
        { id: 4, name: 'Cán mờ 1 mặt', tiers: [{ max: 499, price: 700 }], pricePerM2: 2700 },
        // Cán mờ 2 mặt: <500 tờ = 1400đ/tờ, ≥500 tờ = 5400đ/m²
        { id: 5, name: 'Cán mờ 2 mặt', tiers: [{ max: 499, price: 1400 }], pricePerM2: 5400 }
    ],
    // Gia công thành phẩm - giá theo mốc số lượng SP (CHÍNH XÁC THEO BẢNG GIÁ)
    // Lưu ý: 1-100, 101-200, 201-300 tính lô cố định, >300 tính theo số lượng
    processing: [
        // TIỀN CẮT: 1-100: lô 10k, 101-200: lô 20k, 201-300: lô 30k, >300: 100đ/sp
        { id: 1, name: 'Cắt thành phẩm', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        // TIỀN BẾ DEMI: 1-100: 2000đ/sp, 101-200: 1500đ/sp, 201-300: 1000đ/sp
        { id: 2, name: 'Bế demi', tiers: [{ max: 100, price: 2000 }, { max: 200, price: 1500 }, { max: 300, price: 1000 }, { max: 999999, price: 1000 }] },
        // TIỀN BẾ ĐỨT: 1-100: 2000đ/sp, 101-200: 1500đ/sp, 201-300: 1000đ/sp
        { id: 5, name: 'Bế đứt', tiers: [{ max: 100, price: 2000 }, { max: 200, price: 1500 }, { max: 300, price: 1000 }, { max: 999999, price: 1000 }] },
        // TIỀN BẾ + CẤN: 1-100: 3000đ/sp, 101-200: 2800đ/sp, 201-300: 2500đ/sp
        { id: 3, name: 'Bế + Cấn', tiers: [{ max: 100, price: 3000 }, { max: 200, price: 2800 }, { max: 300, price: 2500 }, { max: 999999, price: 2500 }] },
        // TIỀN CẤN THÀNH PHẨM: 1-100: lô 10k, 101-200: lô 20k, 201-300: lô 30k, >300: 100đ/sp
        { id: 6, name: 'Cấn thành phẩm', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        // TIỀN CẤN - RĂNG CƯA: 1-100: lô 10k, 101-200: lô 20k, 201-300: lô 30k, >300: 100đ/sp
        { id: 4, name: 'Cấn răng cưa', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        // ĐỤC LỖ
        { id: 7, name: 'Đục lỗ', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        // RỌC DEMI
        { id: 8, name: 'Rọc demi', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        // BO GÓC
        { id: 9, name: 'Bo góc', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] }
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí cấp 1', profit: 15 },
        { id: 2, name: 'Đại lí cấp 2', profit: 25 },
        { id: 3, name: 'Khách lẻ', profit: 40 },
        { id: 4, name: 'Hàng gấp', profit: 60 }
    ]
};

// 2. CÀI ĐẶT TEM NHÃN
let LABEL_SETTINGS = {
    decalTypes: [
        { id: 1, name: 'Decal bế (Tĩnh lệ)', w: 330, h: 430, price: 20000 },
        { id: 2, name: 'Decal bế', w: 330, h: 430, price: 12000 },
        { id: 3, name: 'Decal giấy', w: 330, h: 430, price: 2500 },
        { id: 4, name: 'Decal nhựa sữa', w: 330, h: 430, price: 3500 },
        { id: 5, name: 'Decal nhựa trong', w: 330, h: 430, price: 3500 },
        { id: 6, name: 'Decal si bạc', w: 330, h: 430, price: 4000 },
        { id: 7, name: 'Decal 7 màu', w: 330, h: 430, price: 4500 },
        { id: 8, name: 'Decal da bò (kraft)', w: 320, h: 420, price: 3100 }
    ],
    printOptions: [
        { id: 1, name: 'In 1 mặt', tiers: [{ max: 200, price: 3000 }, { max: 1000, price: 2500 }, { max: 999999, price: 2000 }] },
        { id: 2, name: 'In 2 mặt', tiers: [{ max: 200, price: 5000 }, { max: 1000, price: 4000 }, { max: 999999, price: 3500 }] }
    ],
    laminations: [
        { id: 1, name: 'Không cán màng', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cán màng bóng 1 mặt', tiers: [{ max: 200, price: 80 }, { max: 1000, price: 50 }, { max: 999999, price: 30 }] },
        { id: 3, name: 'Cán màng bóng 2 mặt', tiers: [{ max: 200, price: 160 }, { max: 1000, price: 100 }, { max: 999999, price: 60 }] },
        { id: 4, name: 'Cán màng mờ 1 mặt', tiers: [{ max: 200, price: 90 }, { max: 1000, price: 60 }, { max: 999999, price: 40 }] },
        { id: 5, name: 'Cán màng mờ 2 mặt', tiers: [{ max: 200, price: 180 }, { max: 1000, price: 120 }, { max: 999999, price: 80 }] },
        { id: 6, name: 'Cán màng keo bóng 1 mặt', tiers: [{ max: 200, price: 100 }, { max: 1000, price: 70 }, { max: 999999, price: 50 }] },
        { id: 7, name: 'Cán màng keo mờ 2 mặt', tiers: [{ max: 200, price: 200 }, { max: 1000, price: 140 }, { max: 999999, price: 100 }] }
    ],
    cutTypes: [
        { id: 1, name: 'Cắt thô (tờ)', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cắt rời', tiers: [{ max: 200, price: 100 }, { max: 1000, price: 50 }, { max: 999999, price: 30 }] },
        { id: 3, name: 'Bế kiss-cut', tiers: [{ max: 200, price: 150 }, { max: 1000, price: 80 }, { max: 999999, price: 50 }] },
        { id: 4, name: 'Bế die-cut', tiers: [{ max: 200, price: 200 }, { max: 1000, price: 100 }, { max: 999999, price: 70 }] }
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí', profit: 25 },
        { id: 2, name: 'Khách lẻ', profit: 50 },
        { id: 3, name: 'Hàng gấp', profit: 70 }
    ]
};

// 3. CÀI ĐẶT CATALOGUE
let CATALOGUE_SETTINGS = {
    papers: [
        { id: 1, name: 'C120', price: 600 },
        { id: 2, name: 'C150', price: 700 },
        { id: 3, name: 'C200', price: 1000 },
        { id: 4, name: 'C250', price: 1400 },
        { id: 5, name: 'C300', price: 1700 },
        { id: 6, name: 'I 250', price: 1150 },
        { id: 7, name: 'I 300', price: 1550 },
        { id: 8, name: 'FO 80', price: 380 },
        { id: 9, name: 'FO 100', price: 420 },
        { id: 10, name: 'FO 120', price: 600 },
        { id: 11, name: 'FO 150', price: 900 },
        { id: 12, name: 'FO 250', price: 1800 },
        { id: 13, name: 'FO 300', price: 2200 },
        { id: 14, name: 'D 300', price: 1300 },
        { id: 15, name: 'Kraft trắng 100', price: 1000 },
        { id: 16, name: 'Kraft trắng 150', price: 1500 },
        { id: 17, name: 'Kraft trắng 250 - NGA', price: 2400 },
        { id: 18, name: 'B300', price: 2500 },
        { id: 19, name: 'Econo White 120', price: 2000 },
        { id: 20, name: 'Econo White 150', price: 2500 },
        { id: 21, name: 'Econo White 190', price: 3000 },
        { id: 22, name: 'Econo White 250', price: 4000 },
        { id: 23, name: 'Econo White 300', price: 5000 }
    ],
    printPrice: 4000,
    laminations: [
        { id: 1, name: 'Không cán màng', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cán màng bóng 1 mặt', tiers: [{ max: 100, price: 2000 }, { max: 500, price: 1500 }, { max: 999999, price: 1000 }] },
        { id: 3, name: 'Cán màng bóng 2 mặt', tiers: [{ max: 100, price: 4000 }, { max: 500, price: 3000 }, { max: 999999, price: 2000 }] },
        { id: 4, name: 'Cán màng mờ 1 mặt', tiers: [{ max: 100, price: 2200 }, { max: 500, price: 1700 }, { max: 999999, price: 1200 }] },
        { id: 5, name: 'Cán màng mờ 2 mặt', tiers: [{ max: 100, price: 4400 }, { max: 500, price: 3400 }, { max: 999999, price: 2400 }] },
        { id: 6, name: 'Cán màng keo bóng 1 mặt', tiers: [{ max: 100, price: 2500 }, { max: 500, price: 2000 }, { max: 999999, price: 1500 }] },
        { id: 7, name: 'Cán màng keo mờ 2 mặt', tiers: [{ max: 100, price: 5000 }, { max: 500, price: 4000 }, { max: 999999, price: 3000 }] }
    ],
    bindings: [
        { id: 1, name: 'Ghim giữa', tiers: [{ max: 100, price: 500 }, { max: 500, price: 300 }, { max: 999999, price: 200 }] },
        { id: 2, name: 'Keo gáy', tiers: [{ max: 100, price: 3000 }, { max: 500, price: 2000 }, { max: 999999, price: 1500 }] },
        { id: 3, name: 'Lò xo', tiers: [{ max: 100, price: 5000 }, { max: 500, price: 4000 }, { max: 999999, price: 3000 }] }
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí', profit: 25 },
        { id: 2, name: 'Khách lẻ', profit: 45 },
        { id: 3, name: 'Hàng gấp', profit: 65 }
    ]
};

// ===== UTILITY FUNCTIONS =====
// Debounce để tối ưu performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== AUTHENTICATION =====
function initAuth() {
    let users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    if (users.length === 0) {
        users.push({ username: 'admin', password: 'admin123', role: 'admin', canViewCost: true });
        localStorage.setItem('netprint_users', JSON.stringify(users));
    }

    // Đảm bảo tất cả user có thuộc tính canViewCost (mặc định false cho staff, true cho admin)
    let hasUpdates = false;
    users.forEach(user => {
        if (user.canViewCost === undefined) {
            user.canViewCost = user.role === 'admin' ? true : false;
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        localStorage.setItem('netprint_users', JSON.stringify(users));
        console.log('✅ Đã cập nhật thuộc tính canViewCost cho user');
    }

    const saved = localStorage.getItem('netprint_current_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        // Đảm bảo current user có thuộc tính canViewCost
        if (currentUser.canViewCost === undefined) {
            currentUser.canViewCost = currentUser.role === 'admin' ? true : false;
            localStorage.setItem('netprint_current_user', JSON.stringify(currentUser));
        }
        showApp();
    }

    const regRole = document.getElementById('regRole');
    if (regRole) {
        regRole.addEventListener('change', (e) => {
            document.getElementById('adminKeyGroup').style.display = e.target.value === 'admin' ? 'block' : 'none';
        });
    }
}

function showLogin() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('registerModal').style.display = 'none';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    // Nếu đang ở phần quản lý tài khoản, không làm gì
    // Nếu từ màn hình đăng nhập, hiển thị lại login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal && document.getElementById('users') && document.getElementById('users').style.display === 'none') {
        loginModal.style.display = 'flex';
    }
}

function showRegister() {
    // Kiểm tra xem đang ở màn hình đăng nhập hay phần quản lý tài khoản
    const loginModal = document.getElementById('loginModal');
    const isFromLogin = loginModal && loginModal.style.display !== 'none';

    if (isFromLogin) {
        // Nếu từ màn hình đăng nhập, ẩn login modal
        loginModal.style.display = 'none';
    }

    // Hiển thị register modal
    document.getElementById('registerModal').style.display = 'flex';

    // Reset form
    document.getElementById('regUser').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regPassConfirm').value = '';
    document.getElementById('regRole').value = 'staff';
    document.getElementById('adminKey').value = '';
    document.getElementById('adminKeyGroup').style.display = 'none';
}

// ===== MOBILE VIEW MODAL =====
function showMobileViewModal() {
    const modal = document.getElementById('mobileViewModal');
    modal.style.display = 'flex';
    getLocalIP();
}

function closeMobileViewModal() {
    document.getElementById('mobileViewModal').style.display = 'none';
}

// Lấy địa chỉ IP local
function getLocalIP() {
    const ipDisplay = document.getElementById('ipDisplay');
    const urlDisplay = document.getElementById('urlDisplay');

    // Thử dùng WebRTC để lấy IP (chỉ hoạt động trên một số trình duyệt)
    const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    if (RTCPeerConnection) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const candidate = event.candidate.candidate;
                const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
                if (match) {
                    const ip = match[1];
                    // Lọc bỏ localhost và các IP không phải local
                    if (ip && !ip.startsWith('127.') && !ip.startsWith('169.254.')) {
                        ipDisplay.innerHTML = `<p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 10px 0;">${ip}</p>`;
                        urlDisplay.innerHTML = `<p style="font-size: 16px; font-weight: bold; color: #28a745; margin: 10px 0; word-break: break-all;">http://${ip}:8000</p>`;
                        pc.close();
                        return;
                    }
                }
            }
        };

        // Timeout sau 3 giây
        setTimeout(() => {
            if (ipDisplay.innerHTML.includes('Đang tìm')) {
                ipDisplay.innerHTML = '<p style="color: #dc3545;">Không thể tự động lấy IP. Vui lòng kiểm tra bằng cách:</p><p style="margin-top: 10px;">1. Mở Command Prompt</p><p>2. Gõ: <code>ipconfig</code></p><p>3. Tìm dòng "IPv4 Address"</p>';
                urlDisplay.innerHTML = '<p style="color: #dc3545;">Vui lòng tìm IP thủ công và thay vào: http://[IP]:8000</p>';
            }
            pc.close();
        }, 3000);
    } else {
        // Fallback nếu không hỗ trợ WebRTC
        ipDisplay.innerHTML = '<p style="color: #dc3545;">Trình duyệt không hỗ trợ tự động lấy IP.</p><p style="margin-top: 10px;">Vui lòng kiểm tra bằng cách:</p><p>1. Mở Command Prompt</p><p>2. Gõ: <code>ipconfig</code></p><p>3. Tìm dòng "IPv4 Address"</p>';
        urlDisplay.innerHTML = '<p style="color: #dc3545;">Sau khi có IP, truy cập: http://[IP]:8000</p>';
    }
}

function login() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    if (!username || !password) return alert('Vui lòng nhập đầy đủ!');

    const users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return alert('Sai tên đăng nhập hoặc mật khẩu!');

    // Đảm bảo current user có đầy đủ thông tin bao gồm canViewCost
    currentUser = {
        username: user.username,
        role: user.role,
        canViewCost: user.canViewCost !== undefined ? user.canViewCost : (user.role === 'admin' ? true : false)
    };
    localStorage.setItem('netprint_current_user', JSON.stringify(currentUser));
    showApp();
}

function register() {
    // Kiểm tra quyền admin nếu đang ở phần quản lý tài khoản
    const isFromUserManagement = document.getElementById('users') && document.getElementById('users').style.display !== 'none';
    if (isFromUserManagement && (!currentUser || currentUser.role !== 'admin')) {
        return alert('Chỉ Admin mới có quyền tạo tài khoản!');
    }

    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;
    const role = document.getElementById('regRole').value;
    const adminKey = document.getElementById('adminKey').value;

    if (!username || !password) return alert('Vui lòng nhập đầy đủ!');
    if (password !== confirm) return alert('Mật khẩu không khớp!');
    if (role === 'admin' && adminKey !== ADMIN_KEY) return alert('Mã Admin không đúng!');

    let users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    if (users.find(u => u.username === username)) return alert('Tên đăng nhập đã tồn tại!');

    // Mặc định staff không được xem giá vốn, admin được xem
    // Mặc định nhân viên không có quyền xem giá vốn, admin thì có
    const canViewCost = role === 'admin' ? true : false;
    users.push({ username, password, role, canViewCost });
    localStorage.setItem('netprint_users', JSON.stringify(users));
    alert('Tạo tài khoản thành công!');

    // Nếu đang ở phần quản lý tài khoản, đóng modal và reload danh sách
    if (isFromUserManagement) {
        document.getElementById('registerModal').style.display = 'none';
        // Reset form
        document.getElementById('regUser').value = '';
        document.getElementById('regPass').value = '';
        document.getElementById('regPassConfirm').value = '';
        document.getElementById('regRole').value = 'staff';
        document.getElementById('adminKey').value = '';
        document.getElementById('adminKeyGroup').style.display = 'none';
        loadUsers(); // Reload danh sách users
    } else {
        showLogin();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('netprint_current_user');
    location.reload();
}

function showApp() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    const roleText = currentUser.role === 'admin' ? '👑 Admin' : '👤 NV';
    document.getElementById('userDisplay').innerHTML = `${currentUser.username} <span class="role-badge ${currentUser.role}">${roleText}</span>`;

    const isAdmin = currentUser.role === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });

    // Hiển thị chi tiết giá vốn nếu user có quyền (Admin luôn có quyền)
    const canViewCost = currentUser.role === 'admin' || currentUser.canViewCost === true;
    document.querySelectorAll('.cost-detail').forEach(el => {
        el.style.display = canViewCost ? '' : 'none';
    });

    // Kiểm tra quyền xem chi tiết chi phí - ĐẢM BẢO GỌI NGAY SAU KHI ĐĂNG NHẬP
    // Sử dụng setTimeout để đảm bảo DOM đã render xong
    setTimeout(() => {
        updateCostDetailVisibility(canViewCost);
        // Force hiển thị nếu có quyền
        if (canViewCost) {
            const detailSection = document.getElementById('costDetailSection');
            const summarySection = document.getElementById('costSummarySection');
            const summaryDetails = document.getElementById('paperResSummaryDetails');
            if (detailSection) {
                detailSection.style.setProperty('display', 'grid', 'important');
                detailSection.style.setProperty('visibility', 'visible', 'important');
            }
            if (summarySection) {
                summarySection.style.setProperty('display', 'flex', 'important');
                summarySection.style.setProperty('visibility', 'visible', 'important');
            }
            if (summaryDetails) {
                summaryDetails.style.setProperty('display', 'block', 'important');
                summaryDetails.style.setProperty('visibility', 'visible', 'important');
            }
        }
    }, 200);

    loadAllSettings();
    populateAllDropdowns();
    loadUsers();

    // CRITICAL: Khởi tạo paper type search NGAY SAU KHI populate dropdowns
    // Đảm bảo elements đã tồn tại trước khi attach event listeners
    initPaperTypeSearch();

    setTimeout(() => {
        updatePaperPreview();
        updateLabelPreview();

        // Khôi phục tab đã lưu từ localStorage (giữ nguyên vị trí khi refresh)
        // Chạy sau khi DOM đã hoàn tất render
        restoreLastTab();
    }, 150);
}

// Show tab (users tab)
// ===== SETTINGS MENU TABS =====
function showSettingsTab(tabType) {
    // Ẩn tất cả các tab content
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Xóa active class từ tất cả các tab buttons
    document.querySelectorAll('.settings-menu-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hiển thị tab được chọn
    if (tabType === 'price') {
        document.getElementById('settingsPriceTab')?.classList.add('active');
        document.querySelectorAll('.settings-menu-tab')[0]?.classList.add('active');
    } else if (tabType === 'account') {
        document.getElementById('settingsAccountTab')?.classList.add('active');
        document.querySelectorAll('.settings-menu-tab')[1]?.classList.add('active');
    } else if (tabType === 'data') {
        document.getElementById('settingsDataTab')?.classList.add('active');
        document.querySelectorAll('.settings-menu-tab')[2]?.classList.add('active');
        // Render UI if function exists
        if (typeof renderBackupUI === 'function') renderBackupUI();
    }
}

function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });

    // Show selected tab
    const content = document.getElementById(tabId);
    if (content) {
        content.classList.add('active');
        content.style.display = 'block';

        // If users tab, load settings
        if (tabId === 'users') {
            loadUsers();
            renderPaperSettings();
            // Khôi phục trạng thái collapse/expand sau khi render
            setTimeout(() => {
                restoreSettingCardsState();
            }, 100);
        }
    }
}

// Toggle hiển thị chi tiết chi phí
let costDetailVisible = true;

function toggleCostDetail() {
    costDetailVisible = !costDetailVisible;
    const detailSection = document.getElementById('costDetailSection');
    const summarySection = document.getElementById('costSummarySection');
    const summaryDetails = document.getElementById('paperResSummaryDetails');
    const toggleIcon = document.getElementById('costDetailToggleIcon');
    const toggleText = document.getElementById('costDetailToggleText');

    if (detailSection && summarySection) {
        if (costDetailVisible) {
            detailSection.style.display = 'grid';
            summarySection.style.display = 'flex';
            if (summaryDetails) summaryDetails.style.display = 'block';
            if (toggleIcon) toggleIcon.textContent = '👁️';
            if (toggleText) toggleText.textContent = 'Ẩn chi tiết';
        } else {
            detailSection.style.display = 'none';
            summarySection.style.display = 'none';
            if (summaryDetails) summaryDetails.style.display = 'none';
            if (toggleIcon) toggleIcon.textContent = '👁️‍🗨️';
            if (toggleText) toggleText.textContent = 'Hiện chi tiết';
        }
    }
}

// Cập nhật hiển thị dựa trên quyền
function updateCostDetailVisibility(canView) {
    const detailSection = document.getElementById('costDetailSection');
    const summarySection = document.getElementById('costSummarySection');
    const summaryDetails = document.getElementById('paperResSummaryDetails');
    const toggleBtn = document.querySelector('.cost-detail-toggle');

    console.log('updateCostDetailVisibility called, canView:', canView);
    console.log('detailSection:', detailSection);
    console.log('summarySection:', summarySection);

    if (!canView) {
        // Không có quyền: ẩn luôn tất cả chi tiết giá vốn
        if (detailSection) {
            detailSection.style.display = 'none';
            detailSection.style.visibility = 'hidden';
        }
        if (summarySection) {
            summarySection.style.display = 'none';
            summarySection.style.visibility = 'hidden';
        }
        if (summaryDetails) {
            summaryDetails.style.display = 'none';
            summaryDetails.style.visibility = 'hidden';
        }
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
            toggleBtn.style.visibility = 'hidden';
        }
        costDetailVisible = false;
    } else {
        // Có quyền: hiển thị TẤT CẢ chi tiết giá vốn ngay (bao gồm cả chi tiết)
        // Đặt costDetailVisible = true để đảm bảo chi tiết hiển thị
        costDetailVisible = true;

        if (toggleBtn) {
            toggleBtn.style.display = 'block';
            toggleBtn.style.visibility = 'visible';
        }
        // Luôn hiển thị chi tiết khi có quyền - FORCE DISPLAY
        if (detailSection) {
            detailSection.style.display = 'grid';
            detailSection.style.visibility = 'visible';
            detailSection.style.opacity = '1';
        }
        if (summarySection) {
            summarySection.style.display = 'flex';
            summarySection.style.visibility = 'visible';
            summarySection.style.opacity = '1';
        }
        if (summaryDetails) {
            summaryDetails.style.display = 'block';
            summaryDetails.style.visibility = 'visible';
            summaryDetails.style.opacity = '1';
        }

        const toggleIcon = document.getElementById('costDetailToggleIcon');
        const toggleText = document.getElementById('costDetailToggleText');
        if (toggleIcon) toggleIcon.textContent = '👁️';
        if (toggleText) toggleText.textContent = 'Ẩn chi tiết';

        console.log('Chi tiết giá vốn đã được hiển thị cho nhân viên có quyền');
    }
}

// ===== LOAD & SAVE SETTINGS =====
function loadAllSettings() {
    // Check version - FORCE UPDATE nếu có thay đổi cấu trúc
    const savedVersion = parseInt(localStorage.getItem('netprint_laminations_version') || '0');
    const needUpdate = savedVersion < LAMINATIONS_VERSION;

    // Force clear old settings nếu cần update (version 3: cấu trúc mới)
    if (needUpdate) {
        localStorage.removeItem('netprint_paper_settings');
        localStorage.removeItem('netprint_label_settings');
        localStorage.removeItem('netprint_catalogue_settings');
        console.log('🔄 Cập nhật cấu trúc mới: Loại giấy + Khổ in, Gia công theo mốc SL...');
    }

    // Lưu defaults từ code (CẤU TRÚC MỚI)
    const defaultPrintSizes = PAPER_SETTINGS.printSizes;
    const defaultPaperPricing = PAPER_SETTINGS.paperPricing;
    const defaultPaperProcessing = PAPER_SETTINGS.processing;
    const defaultDecalTypes = LABEL_SETTINGS.decalTypes;
    const defaultCatPapers = CATALOGUE_SETTINGS.papers;
    const defaultPaperLaminations = PAPER_SETTINGS.laminations;
    const defaultLabelLaminations = LABEL_SETTINGS.laminations;
    const defaultCatLaminations = CATALOGUE_SETTINGS.laminations;

    const paperSaved = localStorage.getItem('netprint_paper_settings');
    if (paperSaved) {
        PAPER_SETTINGS = { ...PAPER_SETTINGS, ...JSON.parse(paperSaved) };
        // Nếu cần update, dùng defaults mới (CẤU TRÚC MỚI)
        if (needUpdate) {
            PAPER_SETTINGS.printSizes = defaultPrintSizes;
            PAPER_SETTINGS.paperPricing = defaultPaperPricing;
            PAPER_SETTINGS.processing = defaultPaperProcessing;
            PAPER_SETTINGS.laminations = defaultPaperLaminations;
        }
    }

    // Đảm bảo laminationPricing luôn tồn tại (cấu trúc mới)
    if (!PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = [];
    }

    const labelSaved = localStorage.getItem('netprint_label_settings');
    if (labelSaved) {
        LABEL_SETTINGS = { ...LABEL_SETTINGS, ...JSON.parse(labelSaved) };
        // Nếu cần update, dùng defaults mới
        if (needUpdate) {
            LABEL_SETTINGS.decalTypes = defaultDecalTypes;
            LABEL_SETTINGS.laminations = defaultLabelLaminations;
        }
    }

    const catSaved = localStorage.getItem('netprint_catalogue_settings');
    if (catSaved) {
        CATALOGUE_SETTINGS = { ...CATALOGUE_SETTINGS, ...JSON.parse(catSaved) };
        // Nếu cần update, dùng defaults mới
        if (needUpdate) {
            CATALOGUE_SETTINGS.papers = defaultCatPapers;
            CATALOGUE_SETTINGS.laminations = defaultCatLaminations;
        }
    }

    // Lưu version mới
    if (needUpdate) {
        localStorage.setItem('netprint_laminations_version', LAMINATIONS_VERSION.toString());
        // Lưu lại settings với laminations mới
        localStorage.setItem('netprint_paper_settings', JSON.stringify(PAPER_SETTINGS));
        localStorage.setItem('netprint_label_settings', JSON.stringify(LABEL_SETTINGS));
        localStorage.setItem('netprint_catalogue_settings', JSON.stringify(CATALOGUE_SETTINGS));
        console.log('✅ Đã cập nhật settings lên version', LAMINATIONS_VERSION);
    }

    // Render settings nếu là admin
    if (currentUser && currentUser.role === 'admin') {
        renderPaperSettings();
        renderLabelSettings();
        renderCatalogueSettings();
    }
}

function savePaperSettings() {
    // Validation: Kiểm tra dữ liệu trước khi lưu
    let errors = [];

    // Kiểm tra khổ giấy (CẤU TRÚC MỚI)
    if (!PAPER_SETTINGS.printSizes || PAPER_SETTINGS.printSizes.length === 0) {
        errors.push('Cần ít nhất 1 khổ giấy');
    }

    // Kiểm tra loại giấy trong mỗi khổ
    if (!PAPER_SETTINGS.paperPricing || PAPER_SETTINGS.paperPricing.length === 0) {
        errors.push('Cần ít nhất 1 loại giấy');
    } else {
        PAPER_SETTINGS.paperPricing.forEach(pricing => {
            const size = PAPER_SETTINGS.printSizes.find(s => s.id === pricing.printSizeId);
            if (!size) {
                errors.push(`Khổ giấy ID ${pricing.printSizeId} không tồn tại`);
            }
            // ✅ REMOVED: Không còn yêu cầu mỗi khổ phải có ít nhất 1 loại giấy
            // Điều này cho phép anh xóa hết để thiết lập lại từ đầu
            if (pricing.papers && pricing.papers.length > 0) {
                pricing.papers.forEach(p => {
                    if (!p.name || !p.tiers || p.tiers.length === 0) {
                        errors.push(`Loại giấy "${p.name}" có thông số không hợp lệ`);
                    }
                });
            }
        });
    }

    // Kiểm tra giá in 1 mặt
    const printOneSide = PAPER_SETTINGS.printOptions.find(p => p.id === 1);
    if (!printOneSide || !printOneSide.tiers || printOneSide.tiers.length === 0) {
        errors.push('Cần cài đặt giá in 1 mặt với ít nhất 1 mốc số lượng');
    }

    // Kiểm tra cán màng
    PAPER_SETTINGS.laminations.forEach(l => {
        if (!l.tiers || l.tiers.length === 0) {
            errors.push(`Cán màng "${l.name}" chưa có mốc giá`);
        }
    });

    // Kiểm tra gia công
    PAPER_SETTINGS.processing.forEach(p => {
        if (!p.tiers || p.tiers.length === 0) {
            errors.push(`Gia công "${p.name}" chưa có mốc giá`);
        }
    });

    // Kiểm tra loại khách
    if (PAPER_SETTINGS.customerTypes.length === 0) {
        errors.push('Cần ít nhất 1 loại khách hàng');
    }

    if (errors.length > 0) {
        alert('⚠️ Lỗi cài đặt:\n\n' + errors.join('\n'));
        // Phát âm thanh lỗi
        playSound('error');
        return;
    }

    // AUTO BACKUP trước khi lưu mới
    if (typeof autoBackup === 'function') {
        autoBackup();
    }

    // Lưu vào localStorage
    localStorage.setItem('netprint_paper_settings', JSON.stringify(PAPER_SETTINGS));

    // CẬP NHẬT DROPDOWNS QUAN TRỌNG!
    populatePaperDropdowns();

    // Phát âm thanh thành công
    playSound('success');

    // Hiển thị thông báo
    showToast('✅ Đã lưu tất cả cài đặt thành công!');

    console.log('✅ Đã lưu PAPER_SETTINGS:', PAPER_SETTINGS);
}

function saveLabelSettings() {
    // Validation
    let errors = [];

    if (LABEL_SETTINGS.decalTypes.length === 0) {
        errors.push('Cần ít nhất 1 loại decal');
    }
    LABEL_SETTINGS.decalTypes.forEach(d => {
        if (!d.name || d.w <= 0 || d.h <= 0 || d.price < 0) {
            errors.push(`Decal "${d.name}" có thông tin không hợp lệ`);
        }
    });

    if (errors.length > 0) {
        alert('⚠️ Lỗi cài đặt:\n\n' + errors.join('\n'));
        return;
    }

    localStorage.setItem('netprint_label_settings', JSON.stringify(LABEL_SETTINGS));
    populateLabelDropdowns();
    showToast('✅ Đã lưu cài đặt Tem Nhãn!');
    console.log('✅ Đã lưu LABEL_SETTINGS:', LABEL_SETTINGS);
}

function saveCatalogueSettings() {
    // Validation
    let errors = [];

    const printPrice = parseInt(document.getElementById('cataloguePrintPrice')?.value) || 0;
    if (printPrice < 0) {
        errors.push('Giá in không hợp lệ');
    }
    CATALOGUE_SETTINGS.printPrice = printPrice;

    if (CATALOGUE_SETTINGS.papers.length === 0) {
        errors.push('Cần ít nhất 1 loại giấy');
    }

    if (errors.length > 0) {
        alert('⚠️ Lỗi cài đặt:\n\n' + errors.join('\n'));
        return;
    }

    localStorage.setItem('netprint_catalogue_settings', JSON.stringify(CATALOGUE_SETTINGS));
    populateCatalogueDropdowns();
    showToast('✅ Đã lưu cài đặt Catalogue!');
    console.log('✅ Đã lưu CATALOGUE_SETTINGS:', CATALOGUE_SETTINGS);
}

function hardReset() {
    if (confirm('⚠️ XÓA TẤT CẢ CÀI ĐẶT?\n\nAnh có chắc không?')) {
        localStorage.clear();
        location.reload();
    }
}

function showToast(msg, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== PLAY SOUND FUNCTION =====
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (type === 'success') {
            // Âm thanh thành công: 2 nốt tăng dần (C5 → E5)
            const notes = [523.25, 659.25]; // C5, E5
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    osc.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.15);
                }, i * 100);
            });
        } else if (type === 'error') {
            // Âm thanh lỗi: nốt thấp
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 220; // A3
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (e) {
        // Fallback nếu không hỗ trợ Web Audio API
        console.log('Audio không khả dụng:', e);
    }
}

// Phát âm thanh báo hiệu tính giá xong
function playSuccessSound() {
    try {
        // Tạo âm thanh "beep" đơn giản bằng Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Âm thanh vui vẻ: C5 → E5 → G5
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        let time = audioContext.currentTime;

        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.1, time + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.1);

            osc.start(time + i * 0.1);
            osc.stop(time + i * 0.1 + 0.1);
        });
    } catch (e) {
        console.log('Không thể phát âm thanh:', e);
    }
}

// ===== TABS =====
function initTabs() {
    const tabs = document.querySelectorAll('.main-tabs .tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            if (this.style.display === 'none') return;

            // Remove active from all tabs
            document.querySelectorAll('.main-tabs .tab').forEach(t => t.classList.remove('active'));
            // Remove active from all tab contents
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            const content = document.getElementById(tabId);
            if (content) {
                content.classList.add('active');
            }
        });
    });
}

function showSubTab(section, tabName, btn) {
    // Hide all tab-content sections first
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const parent = document.getElementById(section + '-calculator');
    if (!parent) return;

    // Show the selected calculator section
    parent.style.display = 'block';
    parent.classList.add('active');

    parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.sub-content').forEach(c => c.classList.remove('active'));

    if (btn) btn.classList.add('active');

    const content = document.getElementById(section + '-' + tabName);
    if (content) content.classList.add('active');

    // Lưu tab hiện tại vào localStorage để khôi phục khi refresh
    localStorage.setItem('netprint_current_section', section);
    localStorage.setItem('netprint_current_tab', tabName);

    // Populate dropdowns when switching to calculator sections
    if (tabName === 'calc') {
        if (section === 'catalogue') {
            populateCatalogueDropdowns();
        }
    }

    // Load history when switching to history tab
    if (tabName === 'history') {
        loadHistory(section);
    }

    // Update main title based on section
    updateMainTitle(section);
}

// Update main title based on active section
function updateMainTitle(section) {
    const mainTitle = document.getElementById('mainTitle');
    if (!mainTitle) return;

    const titles = {
        'paper': 'TÍNH GIÁ IN NHANH',
        'catalogue': 'TÍNH GIÁ CATALOGUE',
        'label': 'TÍNH GIÁ TEM NHÃN',
        'offset': 'TÍNH GIÁ OFFSET'
    };

    mainTitle.textContent = titles[section] || 'TÍNH GIÁ IN NHANH';
}

// Khôi phục tab đã lưu từ localStorage khi refresh trang
function restoreLastTab() {
    const savedSection = localStorage.getItem('netprint_current_section');
    const savedTabName = localStorage.getItem('netprint_current_tab');

    console.log('=== RESTORE TAB DEBUG ===');
    console.log('Saved section:', savedSection);
    console.log('Saved tab:', savedTabName);

    // Nếu không có dữ liệu lưu, mặc định là paper/calc
    if (!savedSection || !savedTabName) {
        console.log('No saved tab data, using default: paper/calc');
        return;
    }

    // Nếu đã là paper/calc thì không cần làm gì (đã mặc định trong HTML)
    if (savedSection === 'paper' && savedTabName === 'calc') {
        console.log('Already on default tab paper/calc, no action needed');
        return;
    }

    // Tìm parent calculator section
    const parent = document.getElementById(savedSection + '-calculator');
    console.log('Parent element:', parent);

    if (parent) {
        // Tìm button đúng để active
        const allBtns = parent.querySelectorAll('.sub-tab');
        let targetBtn = null;

        allBtns.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            if (savedTabName === 'calc' && text.includes('tính giá')) {
                targetBtn = btn;
            } else if (savedTabName === 'history' && text.includes('lịch sử')) {
                targetBtn = btn;
            }
        });

        console.log('Target button:', targetBtn);
        console.log('Calling showSubTab with:', savedSection, savedTabName);

        // Gọi showSubTab để chuyển tab
        showSubTab(savedSection, savedTabName, targetBtn);

        console.log('Tab restored successfully to:', savedSection, savedTabName);
    } else {
        console.log('Parent element not found for section:', savedSection);
    }
}

// ===== QUẢN LÝ TAB CÀI ĐẶT =====
function showSettingsTab(tabName) {
    // Xóa active khỏi tất cả các tab menu
    document.querySelectorAll('.settings-menu-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));

    // Thêm active cho tab được chọn
    event.target.classList.add('active');

    // Hiển thị nội dung tương ứng
    const contentId = tabName === 'price' ? 'settingsPriceTab' : 'settingsAccountTab';
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.add('active');
    }
}

// ===== QUẢN LÝ MODAL CÀI ĐẶT =====
function openSettingModal(settingType) {
    const modal = document.getElementById('settingEditModal');
    const modalTitle = document.getElementById('settingModalTitle');
    const modalContent = document.getElementById('settingModalContent');

    if (!modal || !modalTitle || !modalContent) return;

    // Lưu loại cài đặt đang chỉnh sửa
    modal.dataset.settingType = settingType;

    // Đặt tiêu đề và nội dung theo loại cài đặt
    switch (settingType) {
        case 'paperTypes':
            modalTitle.textContent = '⚙️ Loại Giấy + Khổ In';
            // Render giao diện quản lý loại giấy và khổ in
            modalContent.innerHTML = `
                <div class="paper-pricing-settings">
                    <div class="settings-header">
                        <h3>📐 Quản lý Khổ Giấy và Loại Giấy</h3>
                        <button class="btn-add-size" onclick="addPrintSize()">+ Thêm khổ giấy</button>
                    </div>
                    <div id="paperPricingContainer"></div>
                </div>
            `;
            // Gọi hàm render từ paper_pricing_settings.js
            if (typeof renderPaperPricingSettings === 'function') {
                renderPaperPricingSettings();
            }
            break;

        case 'paperPrint':
            modalTitle.textContent = '⚙️ Giá In';
            modalContent.innerHTML = '<p>Đang phát triển chức năng chỉnh sửa giá in...</p>';
            break;

        case 'paperLam':
            modalTitle.textContent = '⚙️ Cán Màng';
            // Render giao diện quản lý cán màng
            modalContent.innerHTML = `
                <div class="lamination-settings">
                    <div class="settings-header">
                        <h3>✨ Quản lý Cán Màng theo Khổ Giấy</h3>
                        <p style="font-size: 13px; color: #666; margin-top: 5px;">
                            Đơn vị tính: <strong>đ/tờ</strong> (giá mỗi tờ), <strong>đ/lô</strong> (giá cố định theo lô), <strong>đ/m²</strong> (giá theo diện tích)
                        </p>
                    </div>
                    <div id="laminationContainer"></div>
                </div>
            `;
            // Gọi hàm render từ lamination_settings.js
            if (typeof renderLaminationSettings === 'function') {
                renderLaminationSettings();
            }
            break;

        case 'paperProc':
            modalTitle.textContent = '⚙️ Gia Công Thành Phẩm';
            modalContent.innerHTML = '<p>Đang phát triển chức năng chỉnh sửa gia công...</p>';
            break;

        case 'paperCustomer':
            modalTitle.textContent = '⚙️ Loại Khách Hàng (% lợi nhuận)';
            modalContent.innerHTML = '<p>Đang phát triển chức năng chỉnh sửa loại khách...</p>';
            break;

        default:
            modalTitle.textContent = '⚙️ Cài đặt';
            modalContent.innerHTML = '<p>Không tìm thấy loại cài đặt.</p>';
    }

    // Hiển thị modal
    modal.style.display = 'flex';
}

function closeSettingModal() {
    const modal = document.getElementById('settingEditModal');
    if (modal) {
        modal.style.display = 'none';
        // Xóa nội dung modal
        const modalContent = document.getElementById('settingModalContent');
        if (modalContent) {
            modalContent.innerHTML = '';
        }
    }
}

function saveSettingModal() {
    const modal = document.getElementById('settingEditModal');
    const settingType = modal?.dataset?.settingType;

    // Lưu cài đặt tùy theo loại
    if (settingType === 'paperTypes') {
        // Gọi hàm lưu settings từ app.js
        if (typeof savePaperSettings === 'function') {
            savePaperSettings();
            showToast('✅ Đã lưu cài đặt loại giấy và khổ in!');
            closeSettingModal();
        } else {
            alert('⚠️ Không tìm thấy hàm lưu cài đặt!');
        }
    } else if (settingType === 'paperLam') {
        // Lưu cài đặt cán màng
        if (typeof savePaperSettings === 'function') {
            savePaperSettings();
            showToast('✅ Đã lưu cài đặt cán màng!');
            closeSettingModal();
        } else {
            alert('⚠️ Không tìm thấy hàm lưu cài đặt!');
        }
    } else {
        // Các loại cài đặt khác
        showToast('✅ Đã lưu cài đặt!');
        closeSettingModal();
    }
}

// ===== THUẬT TOÁN DÀN IN THÔNG MINH - TỐI ƯU TỐI ĐA (Giống DyCut) =====
// Thuật toán tìm nhiều cách dàn khác nhau và chọn cách tối ưu nhất
// bleed = tràn màu (thêm vào kích thước SP)
// margin = lề tờ giấy (có thể là số hoặc object {top, bottom, left, right})
// spacing = khoảng cách giữa các SP
// allowRotation = cho phép xoay sản phẩm 90 độ (mặc định true)
function calculateImposition(prodW, prodH, stockW, stockH, bleed, margin, spacing, allowRotation = true) {
    bleed = bleed || 0;
    spacing = spacing || 0;

    // Xử lý margin: có thể là số (lề đều) hoặc object (lề riêng)
    let marginTop, marginBottom, marginLeft, marginRight;
    if (typeof margin === 'object' && margin !== null) {
        marginTop = margin.top || 0;
        marginBottom = margin.bottom || 0;
        marginLeft = margin.left || 0;
        marginRight = margin.right || 0;
    } else {
        marginTop = marginBottom = marginLeft = marginRight = margin || 0;
    }

    // Kích thước SP sau khi thêm tràn màu
    const itemW = prodW + (bleed * 2);
    const itemH = prodH + (bleed * 2);

    // Vùng in được = khổ giấy - lề 4 cạnh (đảm bảo không tràn)
    const printableW = Math.max(0, stockW - marginLeft - marginRight);
    const printableH = Math.max(0, stockH - marginTop - marginBottom);

    if (itemW <= 0 || itemH <= 0 || printableW <= 0 || printableH <= 0) {
        return { cols: 0, rows: 0, total: 0, rotated: false };
    }

    // Hàm tính số lượng SP có thể xếp được trong một chiều
    // Công thức: n * itemSize + (n-1) * spacing <= printableSize
    // => n <= (printableSize + spacing) / (itemSize + spacing)
    // Giống DyCut: thử nhiều cách để tìm tối ưu
    function calculateMaxCount(itemSize, printableSize) {
        if (itemSize <= 0) return 0;
        if (spacing === 0) {
            // Không có spacing: đơn giản là chia
            // Cho phép thử nhiều hơn để tìm cách tối ưu (như DyCut)
            return Math.ceil(printableSize / itemSize);
        }
        // Có spacing: tính chính xác
        const maxCount = Math.floor((printableSize + spacing) / (itemSize + spacing));
        // Kiểm tra lại để đảm bảo không tràn
        const actualSize = maxCount * itemSize + (maxCount > 0 ? (maxCount - 1) * spacing : 0);
        if (actualSize > printableSize && maxCount > 0) {
            return maxCount - 1;
        }
        return Math.max(0, maxCount);
    }

    // Hàm kiểm tra xem cách sắp xếp có hợp lệ không (không tràn)
    // Giống DyCut: cho phép một chút dung sai để tìm cách tối ưu
    function isValidLayout(cols, rows, useItemW, useItemH) {
        if (cols <= 0 || rows <= 0) return false;
        const actualW = cols * useItemW + (cols > 1 ? (cols - 1) * spacing : 0);
        const actualH = rows * useItemH + (rows > 1 ? (rows - 1) * spacing : 0);
        // Cho phép dung sai 2mm để tránh lỗi làm tròn và cho phép dàn tối ưu hơn (như DyCut)
        // Điều này giúp tìm được cách dàn 3x3 = 9 SP trong một số trường hợp
        return actualW <= printableW + 2 && actualH <= printableH + 2;
    }

    // Thử tất cả các cách sắp xếp có thể và chọn cách tốt nhất
    let bestOption = { cols: 0, rows: 0, total: 0, rotated: false };

    // === CÁCH 1: Không xoay (itemW x itemH) ===
    const cols1 = calculateMaxCount(itemW, printableW);
    const rows1 = calculateMaxCount(itemH, printableH);
    const total1 = cols1 * rows1;
    if (isValidLayout(cols1, rows1, itemW, itemH) && total1 > bestOption.total) {
        bestOption = { cols: cols1, rows: rows1, total: total1, rotated: false };
    }

    // === CÁCH 2: Xoay 90 độ (itemH x itemW) ===
    // Chỉ thử nếu cho phép xoay
    if (allowRotation) {
        const cols2 = calculateMaxCount(itemH, printableW);
        const rows2 = calculateMaxCount(itemW, printableH);
        const total2 = cols2 * rows2;
        if (isValidLayout(cols2, rows2, itemH, itemW) && total2 > bestOption.total) {
            bestOption = { cols: cols2, rows: rows2, total: total2, rotated: true };
        }
    }

    // === CÁCH 3: Thử tất cả các tổ hợp có thể để tối ưu ===
    // Tính maxCols và maxRows cho cả 2 hướng
    const maxColsNormal = calculateMaxCount(itemW, printableW);
    const maxRowsNormal = calculateMaxCount(itemH, printableH);

    // Thử tất cả tổ hợp không xoay (từ 1 đến max)
    for (let c = 1; c <= maxColsNormal; c++) {
        for (let r = 1; r <= maxRowsNormal; r++) {
            if (isValidLayout(c, r, itemW, itemH)) {
                const total = c * r;
                if (total > bestOption.total) {
                    bestOption = { cols: c, rows: r, total: total, rotated: false };
                }
            }
        }
    }

    // Thử tất cả tổ hợp xoay (từ 1 đến max) - chỉ nếu cho phép xoay
    if (allowRotation) {
        const maxColsRotated = calculateMaxCount(itemH, printableW);
        const maxRowsRotated = calculateMaxCount(itemW, printableH);

        for (let c = 1; c <= maxColsRotated; c++) {
            for (let r = 1; r <= maxRowsRotated; r++) {
                if (isValidLayout(c, r, itemH, itemW)) {
                    const total = c * r;
                    if (total > bestOption.total) {
                        bestOption = { cols: c, rows: r, total: total, rotated: true };
                    }
                }
            }
        }
    }

    // === CÁCH 4: Thử dàn hỗn hợp (một số hàng không xoay + một số hàng xoay) ===
    // Chỉ thử nếu cho phép xoay
    if (!allowRotation) {
        return bestOption; // Nếu không cho phép xoay, trả về kết quả hiện tại
    }

    const maxColsRotated = calculateMaxCount(itemH, printableW);
    const maxRowsRotated = calculateMaxCount(itemW, printableH);
    // Ví dụ: 2 hàng không xoay (4 cột) + 1 hàng xoay (1 cột) = 9 SP
    // Thử các cách kết hợp hàng không xoay và hàng xoay
    for (let rowsNormal = 1; rowsNormal <= maxRowsNormal; rowsNormal++) {
        for (let colsNormal = 1; colsNormal <= maxColsNormal; colsNormal++) {
            // Kiểm tra xem hàng không xoay có hợp lệ không
            const normalW = colsNormal * itemW + (colsNormal > 1 ? (colsNormal - 1) * spacing : 0);
            const normalH = rowsNormal * itemH + (rowsNormal > 1 ? (rowsNormal - 1) * spacing : 0);

            if (normalW > printableW || normalH > printableH) continue;

            // Tính không gian còn lại sau khi đặt hàng không xoay
            const remainingH = printableH - normalH - spacing; // Trừ thêm spacing giữa 2 phần

            if (remainingH < itemW) continue; // Không đủ chỗ cho hàng xoay

            // Thử đặt thêm hàng xoay
            // Hàng xoay: chiều cao = itemW, chiều rộng = itemH
            const maxColsRotatedInRemaining = calculateMaxCount(itemH, printableW);
            const maxRowsRotatedInRemaining = calculateMaxCount(itemW, remainingH);

            for (let rowsRotated = 1; rowsRotated <= maxRowsRotatedInRemaining; rowsRotated++) {
                for (let colsRotated = 1; colsRotated <= maxColsRotatedInRemaining; colsRotated++) {
                    const rotatedW = colsRotated * itemH + (colsRotated > 1 ? (colsRotated - 1) * spacing : 0);
                    const rotatedH = rowsRotated * itemW + (rowsRotated > 1 ? (rowsRotated - 1) * spacing : 0);

                    // Kiểm tra xem có vừa không
                    if (rotatedW <= printableW && rotatedH <= remainingH) {
                        const total = (colsNormal * rowsNormal) + (colsRotated * rowsRotated);
                        if (total > bestOption.total) {
                            // Lưu thông tin: nếu có hàng xoay, đánh dấu rotated = true
                            // Nhưng cần lưu thêm thông tin về cách dàn hỗn hợp
                            bestOption = {
                                cols: colsNormal,
                                rows: rowsNormal,
                                total: total,
                                rotated: false,
                                mixed: true,
                                rotatedCols: colsRotated,
                                rotatedRows: rowsRotated
                            };
                        }
                    }
                }
            }
        }
    }

    // Thử cách ngược lại: hàng xoay trước, hàng không xoay sau
    for (let rowsRotated = 1; rowsRotated <= maxRowsRotated; rowsRotated++) {
        for (let colsRotated = 1; colsRotated <= maxColsRotated; colsRotated++) {
            const rotatedW = colsRotated * itemH + (colsRotated > 1 ? (colsRotated - 1) * spacing : 0);
            const rotatedH = rowsRotated * itemW + (rowsRotated > 1 ? (rowsRotated - 1) * spacing : 0);

            if (rotatedW > printableW || rotatedH > printableH) continue;

            const remainingH = printableH - rotatedH - spacing;
            if (remainingH < itemH) continue;

            const maxColsNormalInRemaining = calculateMaxCount(itemW, printableW);
            const maxRowsNormalInRemaining = calculateMaxCount(itemH, remainingH);

            for (let rowsNormal = 1; rowsNormal <= maxRowsNormalInRemaining; rowsNormal++) {
                for (let colsNormal = 1; colsNormal <= maxColsNormalInRemaining; colsNormal++) {
                    const normalW = colsNormal * itemW + (colsNormal > 1 ? (colsNormal - 1) * spacing : 0);
                    const normalH = rowsNormal * itemH + (rowsNormal > 1 ? (rowsNormal - 1) * spacing : 0);

                    if (normalW <= printableW && normalH <= remainingH) {
                        const total = (colsRotated * rowsRotated) + (colsNormal * rowsNormal);
                        if (total > bestOption.total) {
                            bestOption = {
                                cols: colsRotated,
                                rows: rowsRotated,
                                total: total,
                                rotated: true,
                                mixed: true,
                                normalCols: colsNormal,
                                normalRows: rowsNormal
                            };
                        }
                    }
                }
            }
        }
    }

    return bestOption;
}

function calculateSheetsNeeded(qty, itemsPerSheet) {
    if (itemsPerSheet <= 0) return 0;
    return Math.ceil(qty / itemsPerSheet);
}

function findTierPrice(tiers, qty) {
    if (!tiers || tiers.length === 0) return 0;

    // Sắp xếp tiers theo max tăng dần để đảm bảo logic đúng
    const sortedTiers = [...tiers].sort((a, b) => a.max - b.max);

    // Tìm tier phù hợp: tier đầu tiên mà qty <= tier.max
    const tier = sortedTiers.find(t => qty <= t.max);
    return tier ? tier.price : sortedTiers[sortedTiers.length - 1].price;
}

function findTierWithMin(tiers, qty) {
    if (!tiers || tiers.length === 0) return null;
    const sorted = [...tiers].sort((a, b) => a.max - b.max);
    let prevMax = 0;
    for (const tier of sorted) {
        const min = prevMax + 1;
        const max = tier.max;
        if (qty <= max) {
            return { ...tier, min, max };
        }
        prevMax = max;
    }
    const last = sorted[sorted.length - 1];
    const min = sorted.length > 1 ? (sorted[sorted.length - 2].max + 1) : 1;
    return { ...last, min, max: last.max };
}

// Tính giá gia công - hỗ trợ 3 loại đơn vị theo TỪNG MỐC (tier.unit):
// - per_lot: giá cố định theo mốc (không nhân)
// - per_item: theo SP (qty × đơn giá)
// - per_sheet: theo tờ in (sheets × đơn giá)
function calculateProcessingCost(proc, qty, sheets) {
    if (!proc) return 0;

    // Backward compatible: fixedTiers (legacy)
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) {
        const sortedTiers = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
        const fixedTier = sortedTiers.find(t => qty <= t.max) || sortedTiers[sortedTiers.length - 1];
        return fixedTier ? fixedTier.fixed : 0;
    }

    if (!proc.tiers || proc.tiers.length === 0) return 0;
    if (!qty || qty <= 0) return 0;

    // Legacy edge case: proc.unit=per_lot but tiers chưa có unit (dữ liệu cũ có cả tiers + fixedTiers)
    const tiersHaveUnit = proc.tiers.some(t => !!t.unit);
    if (proc.unit === 'per_lot' && !tiersHaveUnit && proc.fixedTiers && proc.fixedTiers.length > 0) {
        const sortedTiers = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
        const fixedTier = sortedTiers.find(t => qty <= t.max) || sortedTiers[sortedTiers.length - 1];
        return fixedTier ? fixedTier.fixed : 0;
    }

    // Mốc luôn theo qty (số lượng SP)
    const selectedTier = findTierWithMin(proc.tiers, qty);
    if (!selectedTier) return 0;

    const unit = selectedTier.unit || proc.unit || 'per_item';

    if (unit === 'per_lot') {
        return Math.round(selectedTier.price || 0);
    }

    if (unit === 'per_sheet') {
        if (!sheets || sheets <= 0) return 0;
        return Math.round(sheets * (selectedTier.price || 0));
    }

    // per_item (default)
    return Math.round(qty * (selectedTier.price || 0));
}

function formatMoney(num) {
    return Math.round(num).toLocaleString('vi-VN') + 'đ';
}

// Helper function để set text an toàn
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (!sidebar) return;

    sidebar.classList.toggle('collapsed');

    // Lưu trạng thái vào localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);

    // Logo sẽ tự động hiển thị, không cần thay đổi
}

// Khôi phục trạng thái sidebar từ localStorage
function restoreSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    if (sidebar) {
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }

        // Logo sẽ tự động hiển thị, không cần thay đổi
    }
}

// Sidebar auto show/hide on hover (desktop only)
function initSidebarHoverAutoToggle() {
    // Avoid on touch devices
    if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;

    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (!sidebar || !toggleBtn) return;

    let shouldRestoreCollapsed = false;
    let closeTimer = null;

    const openSidebar = () => {
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
        // Only auto-open when user has it collapsed (so we don't override "pinned open")
        if (sidebar.classList.contains('collapsed')) {
            shouldRestoreCollapsed = true;
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('hover-open');
        }
    };

    const closeSidebar = () => {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            if (shouldRestoreCollapsed) {
                sidebar.classList.add('collapsed');
                sidebar.classList.remove('hover-open');
                shouldRestoreCollapsed = false;
            }
        }, 180);
    };

    sidebar.addEventListener('mouseenter', openSidebar);
    sidebar.addEventListener('mouseleave', closeSidebar);
    toggleBtn.addEventListener('mouseenter', openSidebar);
    toggleBtn.addEventListener('mouseleave', closeSidebar);
}

// ===== POPULATE DROPDOWNS =====
function populateAllDropdowns() {
    populatePaperDropdowns();
    populateLabelDropdowns();
    populateCatalogueDropdowns();

    // Khôi phục trạng thái sidebar
    restoreSidebarState();
}

function populatePaperDropdowns() {
    // Populate khổ giấy trước
    populatePaperSizeDropdown();

    const paperType = document.getElementById('paperType');
    const printSides = document.getElementById('paperPrintSides');
    const lamination = document.getElementById('paperLamination');
    const customerType = document.getElementById('paperCustomerType');

    // Lưu giá trị đang chọn
    const savedPaper = paperType?.value;
    const savedPrint = printSides?.value;
    const savedLam = lamination?.value;
    const savedCust = customerType?.value;

    // Loại giấy - Sẽ được populate bởi onPaperSizeChange() sau khi khổ in được set
    // Không populate ở đây vì cần filter theo khổ in đã chọn

    // Populate print options: In 1 mặt và In 2 mặt (tính mốc theo số tờ 1 mặt tương đương)
    if (printSides) {
        const printOneSide = PAPER_SETTINGS.printOptions.find(p => p.id === 1);
        if (printOneSide) {
            printSides.innerHTML = `
                <option value="1">In 1 mặt</option>
                <option value="2">In 2 mặt</option>
            `;
        } else {
            printSides.innerHTML = '<option value="">Chưa có cài đặt</option>';
        }
    }

    // Populate cán màng theo khổ giấy (CẤU TRÚC MỚI)
    if (typeof populateLaminationDropdown === 'function') {
        populateLaminationDropdown();
    }

    if (customerType) customerType.innerHTML = PAPER_SETTINGS.customerTypes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // Populate checkbox cho gia công thành phẩm
    const procGroup = document.getElementById('paperProcessingGroup');
    if (procGroup) {
        procGroup.innerHTML = PAPER_SETTINGS.processing.map(p => `
            <label>
                <input type="checkbox" name="paperProc" value="${p.id}" onchange="updatePaperMargin(); updatePaperPreview();">
                <span>${p.name}</span>
            </label>
        `).join('');
    }

    // Khôi phục giá trị đã chọn hoặc đặt mặc định
    if (paperType && savedPaper) {
        paperType.value = savedPaper;
        // Đồng bộ khổ in theo loại giấy đã chọn
        onPaperTypeChange();
        // Cập nhật search input với giá trị đã chọn
        const searchInput = document.getElementById('paperTypeSearch');
        if (searchInput) {
            const selectedOption = paperType.options[paperType.selectedIndex];
            if (selectedOption) {
                searchInput.value = selectedOption.text;
            }
        }
    }
    if (printSides && savedPrint) printSides.value = savedPrint;
    if (lamination && savedLam) lamination.value = savedLam;

    // Loại khách hàng: mặc định là "Khách lẻ" (id = 3)
    if (customerType) {
        if (savedCust) {
            customerType.value = savedCust;
        } else {
            // Tìm "Khách lẻ" và đặt làm mặc định
            const khachLe = PAPER_SETTINGS.customerTypes.find(c => c.name.toLowerCase().includes('khách lẻ') || c.name.toLowerCase().includes('khach le'));
            if (khachLe) {
                customerType.value = khachLe.id;
            }
        }
    }

    // Cập nhật preview sau khi populate
    updatePaperPreview();

    // Khởi tạo search cho paper type
    initPaperTypeSearch();
}

// ===== CAPITALIZE WORDS =====
function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

// ===== PAPER TYPE SEARCH =====
let paperTypeSearchInitialized = false; // Flag để tránh init nhiều lần

function initPaperTypeSearch() {
    // Chỉ init một lần duy nhất
    if (paperTypeSearchInitialized) return;

    const paperType = document.getElementById('paperType');
    const searchInput = document.getElementById('paperTypeSearch');

    if (!paperType || !searchInput) return;

    // Ẩn dropdown mặc định
    paperType.style.display = 'none';

    // Khi click hoặc focus vào search input, hiển thị dropdown
    searchInput.addEventListener('focus', function () {
        showPaperTypeDropdown();
    });

    searchInput.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent click from bubbling
        showPaperTypeDropdown();
    });

    // IMPROVED: Thêm click event để luôn nhận click ngay cả khi option đã selected
    paperType.addEventListener('click', function (e) {
        // Nếu click vào option (không phải container)
        if (e.target.tagName === 'OPTION' && e.target.value) {
            e.stopPropagation(); // Prevent event bubbling
            this.value = e.target.value; // Set value explicitly
            const selectedOption = e.target;
            searchInput.value = capitalizeWords(selectedOption.text);

            // ĐÓNG DROPDOWN NGAY LẬP TỨC
            paperType.style.display = 'none';
            paperType.style.visibility = 'hidden';

            // Blur search input để dropdown không tự mở lại
            searchInput.blur();

            // Đồng bộ khổ in theo loại giấy đã chọn
            onPaperTypeChange();
            updatePaperPreview();
        }
    });

    // Khi chọn option (fallback cho keyboard navigation)
    paperType.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.value) {
            searchInput.value = capitalizeWords(selectedOption.text);

            // ĐÓNG DROPDOWN NGAY LẬP TỨC
            paperType.style.display = 'none';
            paperType.style.visibility = 'hidden';

            // Blur search input
            searchInput.blur();

            // Đồng bộ khổ in theo loại giấy đã chọn
            onPaperTypeChange();
            updatePaperPreview();
        }
    });

    // Click outside để đóng dropdown
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !paperType.contains(e.target)) {
            paperType.style.display = 'none';
            paperType.style.visibility = 'hidden';
        }
    });

    // Khi search input blur, đóng dropdown
    searchInput.addEventListener('blur', function () {
        // Delay để cho phép click vào option trước khi đóng
        setTimeout(() => {
            paperType.style.display = 'none';
            paperType.style.visibility = 'hidden';

            const currentValue = paperType.value;
            if (currentValue) {
                const selectedOption = paperType.options[paperType.selectedIndex];
                if (selectedOption) {
                    searchInput.value = capitalizeWords(selectedOption.text);
                }
            }
        }, 200);
    });

    // Đánh dấu đã init
    paperTypeSearchInitialized = true;
}

function filterPaperTypes() {
    const searchInput = document.getElementById('paperTypeSearch');
    const paperType = document.getElementById('paperType');

    if (!searchInput || !paperType) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    let allOptions = JSON.parse(paperType.dataset.allOptions || '[]');

    // Đảm bảo allOptions là unique (theo tên) - fix cho trường hợp bị duplicate
    if (allOptions.length > 0) {
        const uniqueOptions = [];
        const seenNames = new Set();
        allOptions.forEach(p => {
            const normalizedName = (p.name || '').toLowerCase();
            if (!seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueOptions.push(p);
            }
        });
        allOptions = uniqueOptions;
        // Cập nhật lại allOptions nếu có thay đổi
        if (allOptions.length !== (JSON.parse(paperType.dataset.allOptions || '[]')).length) {
            paperType.dataset.allOptions = JSON.stringify(allOptions);
        }
    }

    if (!searchTerm) {
        // Hiển thị tất cả (unique)
        paperType.innerHTML = allOptions.map(p =>
            `<option value="${p.id}">${capitalizeWords(p.name)}</option>`
        ).join('');
    } else {
        // Filter theo search term - tìm trong allOptions (đã chứa tên gốc)
        const filtered = allOptions.filter(p => {
            return p.name.toLowerCase().includes(searchTerm);
        });
        paperType.innerHTML = filtered.length > 0
            ? filtered.map(p => `<option value="${p.id}">${capitalizeWords(p.name)}</option>`).join('')
            : '<option value="">Không tìm thấy</option>';

        // Nếu chỉ có 1 kết quả, tự động chọn
        if (filtered.length === 1) {
            paperType.value = filtered[0].id;
            searchInput.value = capitalizeWords(filtered[0].name);
            // Đồng bộ khổ in theo loại giấy đã chọn
            onPaperTypeChange();
            setTimeout(() => {
                paperType.style.display = 'none';
                updatePaperPreview();
            }, 300);
        }
    }

    // Hiển thị dropdown khi đang search
    if (searchTerm) {
        showPaperTypeDropdown();
    }
}

function showPaperTypeDropdown() {
    const paperType = document.getElementById('paperType');
    const searchInput = document.getElementById('paperTypeSearch');

    if (!paperType || !searchInput) return;

    paperType.style.display = 'block';
    paperType.style.visibility = 'visible'; // Ensure visible
    paperType.style.position = 'absolute';
    paperType.style.zIndex = '1000';
    paperType.style.width = searchInput.offsetWidth + 'px';
    paperType.style.marginTop = '4px';
    paperType.style.border = '1px solid #ddd';
    paperType.style.borderRadius = '8px';
    paperType.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    paperType.style.backgroundColor = '#fff';
    paperType.style.maxHeight = '200px';
    paperType.style.overflowY = 'auto';
}

function populateLabelDropdowns() {
    const decalType = document.getElementById('labelDecalType');
    const printType = document.getElementById('labelPrintType');
    const lamination = document.getElementById('labelLamination');
    const cutType = document.getElementById('labelCutType');
    const customerType = document.getElementById('labelCustomerType');

    // Lưu giá trị đang chọn
    const savedDecal = decalType?.value;
    const savedPrint = printType?.value;
    const savedLam = lamination?.value;
    const savedCut = cutType?.value;
    const savedCust = customerType?.value;

    if (decalType) decalType.innerHTML = LABEL_SETTINGS.decalTypes.map(d =>
        `<option value="${d.id}">${d.name}</option>`
    ).join('');
    if (printType) printType.innerHTML = LABEL_SETTINGS.printOptions.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (lamination) lamination.innerHTML = LABEL_SETTINGS.laminations.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
    if (cutType) cutType.innerHTML = LABEL_SETTINGS.cutTypes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (customerType) customerType.innerHTML = LABEL_SETTINGS.customerTypes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // Khôi phục giá trị đã chọn
    if (decalType && savedDecal) decalType.value = savedDecal;
    if (printType && savedPrint) printType.value = savedPrint;
    if (lamination && savedLam) lamination.value = savedLam;
    if (cutType && savedCut) cutType.value = savedCut;
    if (customerType && savedCust) customerType.value = savedCust;

    // Cập nhật preview sau khi populate
    updateLabelPreview();
}

/**
 * Event handler khi thay đổi kích thước Catalogue
 */
function onCatalogueSizeChange() {
    const sizeSelect = document.getElementById('catalogueSize');
    if (!sizeSelect) return;

    const isCustom = sizeSelect.value === 'custom';
    const customFields = document.getElementById('catalogueCustomFields');

    if (customFields) {
        customFields.style.display = isCustom ? 'block' : 'none';
        // Animation
        if (isCustom) {
            customFields.style.animation = 'slideDown 0.3s ease';
        }
    }

    // Tự động chọn khổ giấy in phù hợp khi thay đổi kích thước Catalogue
    autoSelectPaperSizeForCatalogue();

    // Validate
    validateCatalogueInputs();
}

/**
 * Event handler khi thay đổi kích thước tự chọn
 */
function onCatalogueCustomSizeChange() {
    // Tự động chọn khổ giấy in phù hợp khi thay đổi kích thước tự chọn
    autoSelectPaperSizeForCatalogue();

    // Validate
    validateCatalogueInputs();
}

/**
 * Tự động chọn khổ giấy in phù hợp dựa trên kích thước Catalogue
 */
function autoSelectPaperSizeForCatalogue() {
    const catalogueSizeSelect = document.getElementById('catalogueSize');
    const paperSizeSelect = document.getElementById('cataloguePaperSize');

    if (!catalogueSizeSelect || !paperSizeSelect) return;

    const catalogueSize = catalogueSizeSelect.value;
    if (!catalogueSize) return;

    let dim = null;

    // Nếu là kích thước tự chọn
    if (catalogueSize === 'custom') {
        const customW = parseFloat(document.getElementById('catalogueCustomWidth')?.value) || 0;
        const customH = parseFloat(document.getElementById('catalogueCustomHeight')?.value) || 0;

        if (customW > 0 && customH > 0) {
            dim = { w: customW, h: customH };
        } else {
            // Nếu chưa nhập đủ, không tự động chọn
            return;
        }
    } else {
        // Định nghĩa kích thước Catalogue chuẩn (mm)
        const catalogueDimensions = {
            'A4': { w: 210, h: 297 },
            'A5': { w: 148, h: 210 },
            'A3': { w: 297, h: 420 }
        };

        dim = catalogueDimensions[catalogueSize];
    }

    if (!dim) return;

    // Tìm khổ giấy in phù hợp: phải lớn hơn hoặc bằng kích thước Catalogue
    // Ưu tiên khổ giấy có kích thước gần nhất (để tiết kiệm giấy)
    let bestSize = null;
    let minWaste = Infinity;

    PAPER_SETTINGS.printSizes.forEach(size => {
        // Kiểm tra xem khổ giấy có đủ lớn không (cần thêm lề để cắt)
        // Thường cần thêm ít nhất 5-10mm mỗi cạnh cho lề cắt
        const margin = 10; // Lề cắt tối thiểu
        const requiredW = dim.w + (margin * 2);
        const requiredH = dim.h + (margin * 2);

        // Kiểm tra cả 2 hướng (ngang và dọc)
        const fitsNormal = size.w >= requiredW && size.h >= requiredH;
        const fitsRotated = size.w >= requiredH && size.h >= requiredW;

        if (fitsNormal || fitsRotated) {
            // Tính diện tích thừa (waste) để chọn khổ giấy tối ưu nhất
            let waste;
            if (fitsNormal) {
                waste = (size.w * size.h) - (dim.w * dim.h);
            } else {
                waste = (size.w * size.h) - (dim.h * dim.w);
            }

            // Chọn khổ giấy có waste nhỏ nhất (tiết kiệm nhất)
            if (waste < minWaste) {
                minWaste = waste;
                bestSize = size;
            }
        }
    });

    // Nếu tìm thấy khổ giấy phù hợp, tự động chọn
    if (bestSize && paperSizeSelect.value != bestSize.id) {
        paperSizeSelect.value = bestSize.id;
        // Trigger change để filter loại giấy
        onCataloguePaperSizeChange();
    }
}

/**
 * Populate dropdown khổ giấy cho Catalogue
 */
function populateCataloguePaperSizeDropdown() {
    const sizeSelect = document.getElementById('cataloguePaperSize');
    if (!sizeSelect) return;

    // Lưu giá trị đang chọn
    const savedSize = sizeSelect.value;

    // Populate dropdown từ PAPER_SETTINGS.printSizes
    sizeSelect.innerHTML = PAPER_SETTINGS.printSizes.map(size =>
        `<option value="${size.id}">${size.name}</option>`
    ).join('');

    // Khôi phục giá trị hoặc tự động chọn dựa trên kích thước Catalogue
    if (savedSize && PAPER_SETTINGS.printSizes.find(s => s.id === parseInt(savedSize))) {
        sizeSelect.value = savedSize;
    } else {
        // Tự động chọn khổ giấy in phù hợp với kích thước Catalogue
        autoSelectPaperSizeForCatalogue();

        // Nếu không tìm thấy, fallback về mặc định
        if (!sizeSelect.value) {
            // Tìm khổ 325 x 430 mm (mặc định)
            const defaultSize = PAPER_SETTINGS.printSizes.find(s =>
                (s.w === 325 && s.h === 430) || s.name === '325 x 430 mm'
            );
            if (defaultSize) {
                sizeSelect.value = defaultSize.id;
            } else if (PAPER_SETTINGS.printSizes.length > 0) {
                // Fallback: chọn khổ đầu tiên
                sizeSelect.value = PAPER_SETTINGS.printSizes[0].id;
            }
        }
    }

    // Trigger change để filter loại giấy
    onCataloguePaperSizeChange();
}

/**
 * Event handler khi chọn khổ giấy trong Catalogue - filter loại giấy theo khổ in
 */
function onCataloguePaperSizeChange() {
    const sizeSelect = document.getElementById('cataloguePaperSize');
    if (!sizeSelect) return;

    const selectedSizeId = parseInt(sizeSelect.value);
    if (!selectedSizeId) return;

    // Re-render danh sách giấy bìa và ruột để filter theo khổ giấy
    renderCatalogueCoverPapers();
    renderCatalogueInnerPapers();

    // Tính lại số tờ khi thay đổi khổ giấy in
    updateCatalogueSheets();
}

function populateCatalogueDropdowns() {
    const binding = document.getElementById('catalogueBinding');
    const customerType = document.getElementById('catalogueCustomerType');

    // Lưu giá trị đang chọn
    const savedBind = binding?.value;
    const savedCust = customerType?.value;

    if (binding && typeof CATALOGUE_SETTINGS !== 'undefined') {
        binding.innerHTML = CATALOGUE_SETTINGS.bindings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
    if (customerType && typeof CATALOGUE_SETTINGS !== 'undefined') {
        customerType.innerHTML = CATALOGUE_SETTINGS.customerTypes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Khôi phục giá trị đã chọn
    if (binding && savedBind) binding.value = savedBind;
    if (customerType && savedCust) customerType.value = savedCust;

    // GỌI HÀM MỚI - Populate dropdown từ PAPER_SETTINGS và LAMINATION_SETTINGS
    if (typeof initCatalogueDropdowns === 'function') {
        initCatalogueDropdowns();
    }

    // Populate khổ giấy trước (nếu hàm cũ còn cần)
    if (typeof populateCataloguePaperSizeDropdown === 'function') {
        populateCataloguePaperSizeDropdown();
    }

    // Render danh sách giấy bìa và ruột (nếu hàm cũ còn cần)
    if (typeof renderCatalogueCoverPapers === 'function') {
        renderCatalogueCoverPapers();
    }
    if (typeof renderCatalogueInnerPapers === 'function') {
        renderCatalogueInnerPapers();
    }

    // Cập nhật số tờ khi load
    if (typeof updateCatalogueSheets === 'function') {
        updateCatalogueSheets();
    }

    // Event handler đã được xử lý trong HTML onchange="onCatalogueSizeChange()"
}

// ===== PREVIEW UPDATES =====
// Tự động tính margin và khoảng cách SP dựa trên các công đoạn gia công
// Khi chọn Bế demi hoặc Bế + Cấn: lề = 10mm, khoảng cách SP = 2mm
function updatePaperMargin() {
    const selectedProcs = Array.from(document.querySelectorAll('input[name="paperProc"]:checked'))
        .map(cb => parseInt(cb.value));

    // Kiểm tra xem có công đoạn Bế demi hoặc Bế + Cấn không (case-insensitive)
    const hasBeDemiOrCan = selectedProcs.some(procId => {
        const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
        if (!proc) return false;
        const name = proc.name.toLowerCase();
        return name.includes('bế demi') || name.includes('bế + cấn');
    });

    // Lấy các input lề và khoảng cách
    const marginH = document.getElementById('paperMarginH');
    const marginV = document.getElementById('paperMarginV');
    const spacing = document.getElementById('paperSpacingCalc');

    // Khi có Bế demi hoặc Bế + Cấn: lề = 10mm, khoảng cách SP = 2mm
    // Chỉ tự động set khi giá trị hiện tại là mặc định hoặc rỗng/0
    if (marginV) {
        const currentValueV = parseFloat(marginV.value);
        if (isNaN(currentValueV) || currentValueV === 0 || currentValueV === 5 || currentValueV === 10) {
            marginV.value = hasBeDemiOrCan ? 10 : 5;
        }
    }

    if (marginH) {
        const currentValueH = parseFloat(marginH.value);
        if (isNaN(currentValueH) || currentValueH === 0 || currentValueH === 5 || currentValueH === 10) {
            marginH.value = hasBeDemiOrCan ? 10 : 5;
        }
    }

    // Khoảng cách SP: 2mm khi có Bế demi/Bế + Cấn, 0mm khi không có
    if (spacing) {
        const currentSpacing = parseFloat(spacing.value);
        if (isNaN(currentSpacing) || currentSpacing === 0 || currentSpacing === 2) {
            spacing.value = hasBeDemiOrCan ? 2 : 0;
        }
    }
}

// Toggle khóa/mở lề ngang và lề dọc
window.isMarginLocked = true;

// Toggle rotation on/off
function toggleRotation() {
    const btn = document.getElementById('btnRotationToggle');
    const icon = document.getElementById('rotationIcon');
    const label = document.getElementById('rotationLabel');

    if (!btn || !icon || !label) return;

    const isActive = btn.classList.contains('active');

    if (isActive) {
        // Tắt xoay
        btn.classList.remove('active');
        icon.textContent = '🚫';
        label.textContent = 'Không xoay';
        localStorage.setItem('allowRotation', 'false');
    } else {
        // Bật xoay
        btn.classList.add('active');
        icon.textContent = '🔄';
        label.textContent = 'Xoay';
        localStorage.setItem('allowRotation', 'true');
    }

    // Cập nhật lại preview
    updatePaperPreview();
}

function toggleMarginLock() {
    window.isMarginLocked = !window.isMarginLocked;
    const lockIcon = document.getElementById('marginLockIcon');
    const btnLock = document.getElementById('btnMarginLock');
    const marginH = document.getElementById('paperMarginH');
    const marginV = document.getElementById('paperMarginV');

    if (lockIcon && btnLock) {
        if (window.isMarginLocked) {
            // Khóa: đồng bộ lề dọc theo lề ngang
            lockIcon.textContent = '🔒';
            btnLock.classList.add('locked');

            // Đồng bộ giá trị lề dọc theo lề ngang
            if (marginH && marginV) {
                marginV.value = marginH.value;

                // Khi khóa, chỉ cho phép chỉnh lề ngang, lề dọc tự động đồng bộ
                marginH.oninput = function () {
                    if (window.isMarginLocked && marginV) {
                        marginV.value = this.value;
                    }
                    updatePaperPreview();
                };

                marginV.oninput = function () {
                    if (window.isMarginLocked && marginH) {
                        marginH.value = this.value;
                    }
                    updatePaperPreview();
                };
            }
        } else {
            // Mở: cho phép chỉnh độc lập
            lockIcon.textContent = '🔓';
            btnLock.classList.remove('locked');

            // Cho phép chỉnh độc lập
            if (marginH) {
                marginH.oninput = function () {
                    updatePaperPreview();
                };
            }
            if (marginV) {
                marginV.oninput = function () {
                    updatePaperPreview();
                };
            }
        }
        updatePaperPreview();
    }
}

// Hàm chọn nhanh khổ giấy A6, A5, A4, A3
function setQuickSize(size) {
    const sizes = {
        'A6': { w: 105, h: 148 },
        'A5': { w: 148, h: 210 },
        'A4': { w: 210, h: 297 },
        'A3': { w: 297, h: 420 }
    };

    const selectedSize = sizes[size];
    if (selectedSize) {
        document.getElementById('paperProdW').value = selectedSize.w;
        document.getElementById('paperProdH').value = selectedSize.h;

        // Xóa active class từ tất cả nút
        document.querySelectorAll('.btn-quick-size').forEach(btn => {
            btn.classList.remove('active');
        });

        // Thêm active class cho nút được chọn
        event.target.classList.add('active');

        updatePaperPreview();
    }
}

function updatePaperPreview() {
    const prodW = parseFloat(document.getElementById('paperProdW')?.value) || 90;
    const prodH = parseFloat(document.getElementById('paperProdH')?.value) || 55;
    const qty = parseInt(document.getElementById('paperQty')?.value) || 100;
    const paperTypeId = parseInt(document.getElementById('paperType')?.value);

    // Không tự động cập nhật margin ở đây - chỉ cập nhật khi thay đổi gia công (bế)
    // updatePaperMargin() được gọi riêng khi checkbox gia công thay đổi

    const spacing = parseFloat(document.getElementById('paperSpacingCalc')?.value) || 0;
    const bleed = 0; // Đã bỏ ô tràn màu, luôn dùng 0

    // Lấy lề ngang (top/bottom) và lề dọc (left/right)
    const marginH = parseFloat(document.getElementById('paperMarginH')?.value) || 5; // Lề ngang
    const marginV = parseFloat(document.getElementById('paperMarginV')?.value) || 5; // Lề dọc

    // Chuyển đổi thành object margin
    const margin = {
        top: marginH,
        bottom: marginH,
        left: marginV,
        right: marginV
    };

    // Lấy loại giấy từ CẤU TRÚC MỚI - dùng helper function
    let paper = getPaperById(paperTypeId);
    if (!paper) {
        // Fallback: lấy loại đầu tiên
        const allPapers = getAllPapers();
        if (allPapers.length === 0) return;
        const firstPaper = allPapers[0];
        paper = firstPaper;
    }

    // Kiểm tra xem có cho phép xoay không
    const rotationBtn = document.getElementById('btnRotationToggle');
    const allowRotation = rotationBtn ? rotationBtn.classList.contains('active') : false; // Mặc định là false (không xoay)
    const imposition = calculateImposition(prodW, prodH, paper.w, paper.h, bleed, margin, spacing, allowRotation);
    const baseSheets = calculateSheetsNeeded(qty, imposition.total);
    const waste = parseInt(document.getElementById('paperWasteCalc')?.value) || 0;
    const sheets = baseSheets + waste;

    // Cập nhật hiển thị - hiện tên giấy + khổ
    setText('paperSheetSize', `${paper.name} (${paper.w}×${paper.h} mm)`);
    setText('paperYield', imposition.total || 0);
    setText('paperSheets', sheets || 0);

    drawImpositionGrid('paperSheetGrid', imposition.cols, imposition.rows, imposition.rotated, imposition);
}

function updateLabelPreview() {
    const labelW = parseFloat(document.getElementById('labelW')?.value) || 50;
    const labelH = parseFloat(document.getElementById('labelH')?.value) || 30;
    const qty = parseInt(document.getElementById('labelQty')?.value) || 500;
    const decalId = document.getElementById('labelDecalType')?.value;

    const margin = parseFloat(document.getElementById('labelMarginCalc')?.value) || 0;

    const decal = LABEL_SETTINGS.decalTypes.find(d => d.id === parseInt(decalId)) || LABEL_SETTINGS.decalTypes[0];

    // Tem nhãn không cần bleed, chỉ cần lề tờ
    const imposition = calculateImposition(labelW, labelH, decal.w, decal.h, 0, margin);
    const sheets = calculateSheetsNeeded(qty, imposition.total);

    // Hiển thị tên decal (đồng bộ với dropdown)
    setText('labelSheetSize', decal.name);
    setText('labelYield', imposition.total);
    setText('labelSheets', sheets);

    drawImpositionGrid('labelSheetGrid', imposition.cols, imposition.rows, imposition.rotated, imposition);
}

function drawImpositionGrid(containerId, cols, rows, rotated, impositionData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    if (cols <= 0 || rows <= 0) {
        container.innerHTML = '<div class="grid-more">Không thể dàn</div>';
        return;
    }

    // Kiểm tra xem có dàn hỗn hợp không
    const isMixed = impositionData && impositionData.mixed === true;

    if (isMixed) {
        // Dàn hỗn hợp: một số hàng không xoay, một số hàng xoay
        const normalCols = impositionData.rotated ? impositionData.normalCols : cols;
        const normalRows = impositionData.rotated ? impositionData.normalRows : rows;
        const rotatedCols = impositionData.rotated ? cols : impositionData.rotatedCols;
        const rotatedRows = impositionData.rotated ? rows : impositionData.rotatedRows;

        const maxCols = Math.max(normalCols, rotatedCols);
        container.style.gridTemplateColumns = `repeat(${Math.min(maxCols, 10)}, 1fr)`;
        container.style.maxWidth = '100%';
        container.style.overflow = 'hidden';

        let itemIndex = 0;
        const displayLimit = 50;

        // Vẽ hàng không xoay trước (nếu có)
        if (normalRows > 0 && normalCols > 0) {
            for (let r = 0; r < normalRows && itemIndex < displayLimit; r++) {
                for (let c = 0; c < normalCols && itemIndex < displayLimit; c++) {
                    const item = document.createElement('div');
                    item.className = 'grid-item';
                    item.style.maxWidth = '100%';
                    item.style.boxSizing = 'border-box';
                    container.appendChild(item);
                    itemIndex++;
                }
            }
        }

        // Vẽ hàng xoay sau (nếu có)
        if (rotatedRows > 0 && rotatedCols > 0) {
            for (let r = 0; r < rotatedRows && itemIndex < displayLimit; r++) {
                for (let c = 0; c < rotatedCols && itemIndex < displayLimit; c++) {
                    const item = document.createElement('div');
                    item.className = 'grid-item rotated';
                    item.style.maxWidth = '100%';
                    item.style.boxSizing = 'border-box';
                    // Nếu hàng xoay có ít cột hơn, căn trái
                    if (rotatedCols < maxCols && c === 0) {
                        item.style.gridColumnStart = 1;
                    }
                    container.appendChild(item);
                    itemIndex++;
                }
            }
        }

        const total = (normalCols * normalRows) + (rotatedCols * rotatedRows);
        if (total > displayLimit) {
            const more = document.createElement('div');
            more.className = 'grid-more';
            more.textContent = `+${total - displayLimit}`;
            more.style.gridColumn = `1 / ${maxCols + 1}`;
            container.appendChild(more);
        }
    } else {
        // Dàn đơn giản: tất cả cùng hướng
        const maxCols = Math.min(cols, 10);
        container.style.gridTemplateColumns = `repeat(${maxCols}, 1fr)`;
        container.style.maxWidth = '100%';
        container.style.overflow = 'hidden';

        const total = cols * rows;
        const displayItems = Math.min(total, 50);

        for (let i = 0; i < displayItems; i++) {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.style.maxWidth = '100%';
            item.style.boxSizing = 'border-box';
            if (rotated === true) {
                item.classList.add('rotated');
            }
            container.appendChild(item);
        }

        if (total > displayItems) {
            const more = document.createElement('div');
            more.className = 'grid-more';
            more.textContent = `+${total - displayItems}`;
            more.style.gridColumn = `1 / ${maxCols + 1}`;
            container.appendChild(more);
        }
    }
}

function setLabelQuickSize(w, h) {
    document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    if (w > 0 && h > 0) {
        document.getElementById('labelW').value = w;
        document.getElementById('labelH').value = h;
    }
    updateLabelPreview();
}

// ===== CALCULATE FUNCTIONS =====

// 1. TÍNH GIÁ IN GIẤY
function calculatePaper() {
    // ===== 1. LẤY DỮ LIỆU TỪ FORM =====
    const prodW = parseFloat(document.getElementById('paperProdW')?.value) || 0;
    const prodH = parseFloat(document.getElementById('paperProdH')?.value) || 0;
    const qty = parseInt(document.getElementById('paperQty')?.value) || 0;
    const paperTypeId = parseInt(document.getElementById('paperType')?.value);
    const printId = parseInt(document.getElementById('paperPrintSides')?.value);
    const lamId = parseInt(document.getElementById('paperLamination')?.value);
    const custId = parseInt(document.getElementById('paperCustomerType')?.value);
    const otherCosts = getTotalPaperExtraCosts();

    // Lấy danh sách gia công đã chọn (checkbox)
    const selectedProcs = Array.from(document.querySelectorAll('input[name="paperProc"]:checked'))
        .map(cb => parseInt(cb.value));

    // ===== 2. VALIDATION =====
    if (prodW <= 0 || prodH <= 0) return alert('⚠️ Vui lòng nhập kích thước sản phẩm!');
    if (qty <= 0) return alert('⚠️ Vui lòng nhập số lượng sản phẩm!');

    // ===== 3. LẤY DỮ LIỆU TỪ SETTINGS (CẤU TRÚC MỚI) =====
    // Sử dụng helper functions từ paper_helpers.js
    const paper = getPaperById(paperTypeId);
    // Lấy giá in 1 mặt (luôn dùng id = 1)
    const printOneSide = PAPER_SETTINGS.printOptions.find(p => p.id === 1);
    // Lấy thông tin cán màng từ cấu trúc mới (laminationPricing theo khổ giấy)
    // Sẽ được lấy chi tiết sau khi có paper.printSizeId
    const cust = PAPER_SETTINGS.customerTypes.find(c => c.id === custId);

    // Kiểm tra dữ liệu settings
    if (!paper) return alert('⚠️ Vui lòng chọn loại giấy!');
    if (!printOneSide || !printOneSide.tiers) return alert('⚠️ Vui lòng cài đặt giá in 1 mặt!');
    if (!cust) return alert('⚠️ Vui lòng chọn loại khách hàng!');

    // printId = 1: In 1 mặt, printId = 2: In 2 mặt (tính mốc theo số tờ 1 mặt tương đương)
    const isTwoSided = printId === 2;
    const printName = isTwoSided ? 'In 2 mặt' : 'In 1 mặt';

    // ===== 4. LẤY THÔNG SỐ DÀN IN =====
    // Tự động cập nhật margin dựa trên công đoạn gia công
    updatePaperMargin();

    const spacing = parseFloat(document.getElementById('paperSpacingCalc')?.value) || 0;
    const bleed = 0; // Đã bỏ ô tràn màu, luôn dùng 0

    // Lấy lề ngang và lề dọc
    const marginH = parseFloat(document.getElementById('paperMarginH')?.value) || 5;
    const marginV = parseFloat(document.getElementById('paperMarginV')?.value) || 5;
    const margin = {
        top: marginH,
        bottom: marginH,
        left: marginV,
        right: marginV
    };

    // ===== 5. TÍNH TOÁN DÀN IN =====
    // Kiểm tra xem có cho phép xoay không
    const rotationBtn = document.getElementById('btnRotationToggle');
    const allowRotation = rotationBtn ? rotationBtn.classList.contains('active') : false;
    const imposition = calculateImposition(prodW, prodH, paper.w, paper.h, bleed, margin, spacing, allowRotation);

    if (imposition.total <= 0) return alert('⚠️ Sản phẩm quá lớn so với khổ in! Hãy chọn loại giấy với khổ lớn hơn.');

    const baseSheets = calculateSheetsNeeded(qty, imposition.total);
    const waste = parseInt(document.getElementById('paperWasteCalc')?.value) || 0;
    const sheets = baseSheets + waste;

    // ===== 6. TÍNH GIÁ VỐN =====
    // Giá giấy: số tờ × giá theo tier (sử dụng helper function)
    const paperPricePerSheet = getPaperPrice(paperTypeId, sheets);
    const paperCost = Math.round(sheets * paperPricePerSheet);
    const paperTier = (() => {
        const paperObj = getPaperById(paperTypeId);
        return paperObj ? findTierWithMin(paperObj.tiers || [], sheets) : null;
    })();

    // Giá in: tính theo mốc số lượng
    // QUY CHUẨN: In 2 mặt tính theo số tờ 1 mặt tương đương
    // Ví dụ: 300 tờ 2 mặt = 600 tờ 1 mặt → tìm mốc theo 600 tờ
    let sheetsForTier = sheets;
    if (isTwoSided) {
        // Chuyển đổi số tờ 2 mặt sang số tờ 1 mặt tương đương để tìm mốc giá
        sheetsForTier = sheets * 2;
    }
    const printPricePerSheet = findTierPrice(printOneSide.tiers, sheetsForTier);
    const printTier = findTierWithMin(printOneSide.tiers, sheetsForTier);
    // Giá = số tờ thực tế × đơn giá (đã tìm đúng mốc)
    const printCost = Math.round(sheets * printPricePerSheet);

    // Giá cán màng: SỬ DỤNG CẤU TRÚC MỚI (Khổ giấy → Loại cán màng → Tiers)
    // Lấy printSizeId từ paper đã chọn
    let lamCost = 0;
    if (lamId && paper.printSizeId) {
        // Sử dụng helper function mới từ lamination_helpers.js
        lamCost = calculateLaminationCost(paper.printSizeId, lamId, sheets, paper.w, paper.h);
    }

    // Giá gia công: TỔNG của tất cả công đoạn đã chọn
    // Bế demi, Bế đứt, Bế + Cấn: tính theo số tờ in (sheets)
    // Cắt, Cấn, Cấn răng cưa: tính theo số lượng thành phẩm (qty)
    let procCost = 0;
    let procNames = [];
    selectedProcs.forEach(procId => {
        const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
        if (proc) {
            // Truyền cả qty và sheets để hàm tự phân biệt
            procCost += calculateProcessingCost(proc, qty, sheets);
            procNames.push(proc.name);
        }
    });
    const procDisplay = procNames.length > 0 ? procNames.join(' + ') : 'Không';

    // Tổng giá vốn
    const totalCost = paperCost + printCost + lamCost + procCost + otherCosts;
    const costPerItem = totalCost / qty;

    // ===== 7. TÍNH GIÁ BÁN =====
    const profitPercent = cust.profit;
    const sellPerItem = Math.round(costPerItem * (1 + profitPercent / 100));
    const totalSell = sellPerItem * qty;
    const profit = totalSell - totalCost;
    const actualProfitPercent = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : 0;

    // ===== 8. HIỂN THỊ KẾT QUẢ =====
    const results = document.getElementById('paperResults');
    if (results) {
        // Kết quả chính (theo thứ tự: Số lượng → Giá bán/SP → Tổng tiền)
        setText('paperResQty', qty.toLocaleString('vi-VN') + ' sp');
        setText('paperResSellPrice', formatMoney(sellPerItem));
        setText('paperResTotalSell', formatMoney(totalSell));

        // Chi tiết Giấy: số tờ × đơn giá = tổng
        setText('paperResSheets', sheets.toLocaleString('vi-VN'));
        setText('paperResPaperPrice', paperPricePerSheet.toLocaleString('vi-VN'));
        setText('paperResPaperCost', formatMoney(paperCost));
        const paperDetailsEl = document.getElementById('paperResPaperDetails');
        if (paperDetailsEl) {
            const details = [];
            details.push(`<div class="cost-sub-item"><span>Dàn in</span><span>${imposition.total.toLocaleString('vi-VN')} sp/tờ${imposition.rotated ? ' (xoay)' : ''}${imposition.mixed ? ' (mix)' : ''}</span></div>`);
            details.push(`<div class="cost-sub-item"><span>Số tờ</span><span>ceil(${qty.toLocaleString('vi-VN')} / ${imposition.total.toLocaleString('vi-VN')}) = ${baseSheets.toLocaleString('vi-VN')} tờ</span></div>`);
            details.push(`<div class="cost-sub-item"><span>Hao hụt</span><span>+ ${waste.toLocaleString('vi-VN')} tờ → Tổng ${sheets.toLocaleString('vi-VN')} tờ</span></div>`);
            if (paperTier) {
                const maxText = paperTier.max === 999999 ? '∞' : paperTier.max.toLocaleString('vi-VN');
                details.push(`<div class="cost-sub-item"><span>Mốc giấy</span><span>${paperTier.min.toLocaleString('vi-VN')}–${maxText} tờ → ${paperTier.price.toLocaleString('vi-VN')}đ/tờ</span></div>`);
            }
            paperDetailsEl.innerHTML = details.join('');
        }

        // Chi tiết In: số tờ × đơn giá = tổng
        // Đơn giá đã được tính đúng theo quy chuẩn (in 2 mặt = tìm mốc theo số tờ 1 mặt tương đương)
        setText('paperResPrintName', printName); // Hiển thị "In 1 mặt" hoặc "In 2 mặt"
        setText('paperResPrintSheets', sheets.toLocaleString('vi-VN'));
        setText('paperResPrintPrice', printPricePerSheet.toLocaleString('vi-VN'));
        setText('paperResPrintCost', formatMoney(printCost));
        const printDetailsEl = document.getElementById('paperResPrintDetails');
        if (printDetailsEl) {
            const details = [];
            if (isTwoSided) {
                details.push(`<div class="cost-sub-item"><span>Quy đổi mốc</span><span>${sheets.toLocaleString('vi-VN')} tờ × 2 = ${sheetsForTier.toLocaleString('vi-VN')} tờ (tìm mốc)</span></div>`);
            } else {
                details.push(`<div class="cost-sub-item"><span>Mốc tính</span><span>${sheetsForTier.toLocaleString('vi-VN')} tờ</span></div>`);
            }
            if (printTier) {
                const maxText = printTier.max === 999999 ? '∞' : printTier.max.toLocaleString('vi-VN');
                details.push(`<div class="cost-sub-item"><span>Mốc in</span><span>${printTier.min.toLocaleString('vi-VN')}–${maxText} tờ → ${printTier.price.toLocaleString('vi-VN')}đ/tờ</span></div>`);
            }
            details.push(`<div class="cost-sub-item"><span>Công thức</span><span>${sheets.toLocaleString('vi-VN')} tờ × ${printPricePerSheet.toLocaleString('vi-VN')}đ = ${formatMoney(printCost)}</span></div>`);
            printDetailsEl.innerHTML = details.join('');
        }

        // Chi tiết Cán màng: số tờ × đơn giá = tổng
        // Sử dụng cấu trúc mới để lấy thông tin
        const lamInfo = getLaminationBySizeAndId(paper.printSizeId, lamId);
        // Hiển thị tên đầy đủ (đã bao gồm "1 mặt" hoặc "2 mặt" nếu có)
        // Nếu không có hoặc không chọn, hiển thị "Không cán"
        const lamDisplayName = lamInfo ? lamInfo.name : (lamId === 1 || !lamId ? 'Không cán' : 'Cán màng');
        setText('paperResLamName', lamDisplayName);

        let lamPricePerSheet = 0;
        if (lamInfo && lamInfo.tiers && lamInfo.tiers.length > 0) {
            // Sắp xếp tiers theo max tăng dần để đảm bảo logic đúng
            const sortedTiers = [...lamInfo.tiers].sort((a, b) => a.max - b.max);

            // Tìm tier phù hợp: tier đầu tiên mà sheets <= tier.max
            let selectedTier = null;
            for (const tier of sortedTiers) {
                if (sheets <= tier.max) {
                    selectedTier = tier;
                    break;
                }
            }
            if (!selectedTier) {
                selectedTier = sortedTiers[sortedTiers.length - 1];
            }

            // Tính giá hiển thị dựa trên unit
            // LƯU Ý: Giá đã được nhập sẵn cho từng loại (1 mặt hoặc 2 mặt)
            // KHÔNG cần nhân thêm sideMultiplier
            if (selectedTier.unit === 'per_sheet') {
                lamPricePerSheet = selectedTier.price;
            } else if (selectedTier.unit === 'per_m2') {
                const sheetAreaM2 = (paper.w * paper.h) / 1000000;
                lamPricePerSheet = Math.round(sheetAreaM2 * selectedTier.price);
            } else if (selectedTier.unit === 'per_lot') {
                // Giá theo lô: hiển thị tổng chi phí chia cho số tờ
                lamPricePerSheet = Math.round(selectedTier.price / sheets);
            }
        }
        setText('paperResLamSheets', sheets.toLocaleString('vi-VN'));
        setText('paperResLamPrice', lamPricePerSheet.toLocaleString('vi-VN'));
        setText('paperResLamCost', formatMoney(lamCost));
        const lamDetailsEl = document.getElementById('paperResLamDetails');
        if (lamDetailsEl) {
            if (!lamInfo || !lamInfo.tiers || lamInfo.tiers.length === 0) {
                lamDetailsEl.innerHTML = `<div class="cost-sub-item"><span>Công thức</span><span>0</span></div>`;
            } else {
                const sortedTiers = [...lamInfo.tiers].sort((a, b) => a.max - b.max);
                let selectedTier = null;
                let prevMax = 0;
                for (const tier of sortedTiers) {
                    if (sheets <= tier.max) { selectedTier = tier; break; }
                    prevMax = tier.max;
                }
                if (!selectedTier) selectedTier = sortedTiers[sortedTiers.length - 1];
                const min = prevMax + 1;
                const maxText = selectedTier.max === 999999 ? '∞' : selectedTier.max.toLocaleString('vi-VN');
                const unitName = selectedTier.unit === 'per_sheet' ? 'đ/tờ' : selectedTier.unit === 'per_m2' ? 'đ/m²' : 'đ/lô';
                const details = [];
                details.push(`<div class="cost-sub-item"><span>Mốc cán</span><span>${min.toLocaleString('vi-VN')}–${maxText} tờ → ${selectedTier.price.toLocaleString('vi-VN')} ${unitName}</span></div>`);
                if (selectedTier.unit === 'per_m2') {
                    const sheetAreaM2 = (paper.w * paper.h) / 1000000;
                    details.push(`<div class="cost-sub-item"><span>Diện tích tờ</span><span>${paper.w}×${paper.h}mm = ${sheetAreaM2.toFixed(4)} m²</span></div>`);
                    const total = Math.round(sheetAreaM2 * sheets * selectedTier.price);
                    details.push(`<div class="cost-sub-item"><span>Công thức</span><span>${sheetAreaM2.toFixed(4)} × ${sheets.toLocaleString('vi-VN')} × ${selectedTier.price.toLocaleString('vi-VN')} = ${formatMoney(total)}</span></div>`);
                } else if (selectedTier.unit === 'per_lot') {
                    details.push(`<div class="cost-sub-item"><span>Công thức</span><span>${selectedTier.price.toLocaleString('vi-VN')}đ/lô = ${formatMoney(lamCost)}</span></div>`);
                } else {
                    const total = Math.round(sheets * selectedTier.price);
                    details.push(`<div class="cost-sub-item"><span>Công thức</span><span>${sheets.toLocaleString('vi-VN')} tờ × ${selectedTier.price.toLocaleString('vi-VN')}đ = ${formatMoney(total)}</span></div>`);
                }
                lamDetailsEl.innerHTML = details.join('');
            }
        }

        // Chi tiết Gia công - gọn
        setText('paperResProcCost', formatMoney(procCost));
        const procDetailsEl = document.getElementById('paperResProcDetails');
        if (procDetailsEl) {
            if (selectedProcs.length > 0) {
                let procHtml = '';
                selectedProcs.forEach(procId => {
                    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
                    if (proc) {
                        const thisProcCost = calculateProcessingCost(proc, qty, sheets);

                        // Build formula detail (unit per tier) + legacy compatibility
                        let selectedTier = findTierWithMin(proc.tiers || [], qty);
                        const tiersHaveUnit = (proc.tiers || []).some(t => !!t.unit);
                        if (proc.unit === 'per_lot' && !tiersHaveUnit && proc.fixedTiers && proc.fixedTiers.length > 0) {
                            const fixedSorted = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
                            let prevMax = 0;
                            let picked = null;
                            for (const t of fixedSorted) {
                                if (qty <= t.max) { picked = { min: prevMax + 1, max: t.max, price: t.fixed, unit: 'per_lot' }; break; }
                                prevMax = t.max;
                            }
                            if (!picked && fixedSorted.length > 0) {
                                const last = fixedSorted[fixedSorted.length - 1];
                                const min = fixedSorted.length > 1 ? (fixedSorted[fixedSorted.length - 2].max + 1) : 1;
                                picked = { min, max: last.max, price: last.fixed, unit: 'per_lot' };
                            }
                            selectedTier = picked;
                        }

                        const unit = selectedTier?.unit || proc.unit || 'per_item';
                        const maxText = selectedTier ? (selectedTier.max === 999999 ? '∞' : selectedTier.max.toLocaleString('vi-VN')) : '';
                        const minText = selectedTier ? selectedTier.min.toLocaleString('vi-VN') : '';
                        const price = selectedTier ? (selectedTier.price || 0) : 0;

                        let formula = '';
                        if (unit === 'per_lot') {
                            formula = `Mốc ${minText}–${maxText} sp → ${price.toLocaleString('vi-VN')}đ/lô`;
                        } else if (unit === 'per_sheet') {
                            formula = `${sheets.toLocaleString('vi-VN')} tờ × ${price.toLocaleString('vi-VN')}đ/tờ (mốc ${minText}–${maxText} sp)`;
                        } else {
                            formula = `${qty.toLocaleString('vi-VN')} sp × ${price.toLocaleString('vi-VN')}đ/sp (mốc ${minText}–${maxText} sp)`;
                        }

                        procHtml += `<div class="cost-sub-item"><span>${proc.name}</span><span>${formatMoney(thisProcCost)}</span></div>`;
                        procHtml += `<div class="cost-sub-item"><span style="padding-left:12px; opacity:0.8;">↳ ${formula}</span><span></span></div>`;
                    }
                });
                procDetailsEl.innerHTML = procHtml;
            } else {
                procDetailsEl.innerHTML = '';
            }
        }

        // Chi tiết Chi phí khác - gọn
        setText('paperResExtraCost', formatMoney(otherCosts));
        const extraDetailsEl = document.getElementById('paperResExtraDetails');
        if (extraDetailsEl) {
            if (paperExtraCosts.length > 0) {
                let extraHtml = '';
                paperExtraCosts.forEach(item => {
                    extraHtml += `<div class="cost-sub-item"><span>${item.name || 'Chi phí'}</span><span>${formatMoney(item.amount)}</span></div>`;
                });
                extraDetailsEl.innerHTML = extraHtml;
            } else {
                extraDetailsEl.innerHTML = '';
            }
        }

        // Tổng kết
        setText('paperResTotalCost', formatMoney(totalCost));
        setText('paperResCostPerItem', formatMoney(Math.round(costPerItem)));
        setText('paperResProfit', formatMoney(profit) + ` (${actualProfitPercent}%)`);
        const summaryDetailsEl = document.getElementById('paperResSummaryDetails');
        if (summaryDetailsEl) {
            const details = [];
            details.push(`<div class="cost-sub-item"><span>Tổng vốn</span><span>${formatMoney(paperCost)} + ${formatMoney(printCost)} + ${formatMoney(lamCost)} + ${formatMoney(procCost)} + ${formatMoney(otherCosts)} = ${formatMoney(totalCost)}</span></div>`);
            details.push(`<div class="cost-sub-item"><span>Giá vốn/SP</span><span>${formatMoney(totalCost)} / ${qty.toLocaleString('vi-VN')} = ${formatMoney(Math.round(costPerItem))}</span></div>`);
            details.push(`<div class="cost-sub-item"><span>Giá bán/SP</span><span>round(${formatMoney(Math.round(costPerItem))} × (1 + ${profitPercent}%)) = ${formatMoney(sellPerItem)}</span></div>`);
            details.push(`<div class="cost-sub-item"><span>Tổng tiền</span><span>${formatMoney(sellPerItem)} × ${qty.toLocaleString('vi-VN')} = ${formatMoney(totalSell)}</span></div>`);
            details.push(`<div class="cost-sub-item"><span>Lợi nhuận</span><span>${formatMoney(totalSell)} - ${formatMoney(totalCost)} = ${formatMoney(profit)} (${actualProfitPercent}%)</span></div>`);
            summaryDetailsEl.innerHTML = details.join('');
        }

        // Phát âm âm thanh báo hiệu và hiển thị thông báo
        showCalcNotification('paperCalcNotification');

        // Cập nhật hiển thị nút toggle sau khi tính giá - KIỂM TRA QUYỀN
        const canViewCost = currentUser && (currentUser.canViewCost === true || currentUser.role === 'admin');
        console.log('Sau khi tính giá - canViewCost:', canViewCost, 'currentUser:', currentUser);

        // Gọi ngay và đảm bảo hiển thị đầy đủ
        updateCostDetailVisibility(canViewCost);

        // Đảm bảo các phần tử chi tiết hiển thị nếu có quyền (force display với !important)
        if (canViewCost) {
            const detailSection = document.getElementById('costDetailSection');
            const summarySection = document.getElementById('costSummarySection');
            const summaryDetails = document.getElementById('paperResSummaryDetails');
            if (detailSection) {
                detailSection.style.setProperty('display', 'grid', 'important');
                detailSection.style.setProperty('visibility', 'visible', 'important');
                detailSection.style.setProperty('opacity', '1', 'important');
            }
            if (summarySection) {
                summarySection.style.setProperty('display', 'flex', 'important');
                summarySection.style.setProperty('visibility', 'visible', 'important');
                summarySection.style.setProperty('opacity', '1', 'important');
            }
            if (summaryDetails) {
                summaryDetails.style.setProperty('display', 'block', 'important');
                summaryDetails.style.setProperty('visibility', 'visible', 'important');
                summaryDetails.style.setProperty('opacity', '1', 'important');
            }
            console.log('Đã force hiển thị chi tiết giá vốn');
        }

        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ===== 9. LƯU LỊCH SỬ (TỰ ĐỘNG) =====
    // Lấy thông tin cán màng từ cấu trúc mới để hiển thị trong history
    const lamInfoForHistory = getLaminationBySizeAndId(paper.printSizeId, lamId);
    const lamNameForHistory = lamInfoForHistory ? lamInfoForHistory.name : 'Không cán';

    // Tạo note tự động từ quy cách sản phẩm nếu chưa có
    let note = document.getElementById('paperNote')?.value || '';
    if (!note) {
        // Tự động tạo note: "SP: WxHmm | Giấy: Tên | In: X mặt | Cán: Tên | Gia công: ..."
        note = `SP: ${prodW}×${prodH}mm | ${paper.name} | ${printName} | ${lamNameForHistory}${procDisplay !== 'Không' ? ' | ' + procDisplay : ''}`;
    }

    saveToHistory('paper', {
        note: note,
        // Quy cách sản phẩm
        productSize: `${prodW}×${prodH}mm`,
        width: prodW,
        height: prodH,
        // Quy cách giấy in
        paperTypeId: paperTypeId,
        paperTypeName: paper.name,
        paperSize: `${paper.w}×${paper.h}mm`,
        // In
        printOptionId: printId,
        printOptionName: printName,
        // Cán màng
        laminationId: lamId,
        laminationName: lamNameForHistory,
        // Quy cách gia công
        processingIds: selectedProcs,
        processingNames: procDisplay,
        processingDetails: selectedProcs.map(procId => {
            const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
            return proc ? proc.name : '';
        }).filter(n => n),
        // Số lượng và giá
        quantity: qty,
        unitPrice: sellPerItem, // Đơn giá (giá bán/SP)
        totalPrice: totalSell,  // Thành tiền (tổng tiền)
        // Chi phí khác
        extraCost: otherCosts,
        // Chi tiết khác
        totalSell: totalSell,
        totalCost: totalCost,
        costPerItem: Math.round(costPerItem),
        profit: profit,
        // Dàn in
        sheets: sheets,
        itemsPerSheet: imposition.total,
        // Khách hàng
        customerTypeId: custId,
        customerTypeName: cust.name
    });

    // Log để debug
    console.log('=== TÍNH GIÁ IN GIẤY ===');
    console.log('Kích thước SP:', prodW, '×', prodH, 'mm');
    console.log('Khổ giấy:', paper.name, '(', paper.w, '×', paper.h, 'mm)');
    console.log('Loại giấy:', paper.name, '-', paperPricePerSheet, 'đ/tờ');
    console.log('In:', printName, '-', printPricePerSheet, 'đ/tờ');
    console.log('Dàn in:', imposition.total, 'sp/tờ', imposition.rotated ? '(xoay)' : '');
    console.log('Số tờ cần:', sheets);
    console.log('Giá vốn:', totalCost, '| Giá bán:', totalSell, '| Lợi nhuận:', profit, '(', actualProfitPercent, '%)');
}

// 2. TÍNH GIÁ TEM NHÃN
function calculateLabel() {
    const labelW = parseFloat(document.getElementById('labelW').value) || 0;
    const labelH = parseFloat(document.getElementById('labelH').value) || 0;
    const qty = parseInt(document.getElementById('labelQty').value) || 0;
    const decalId = document.getElementById('labelDecalType').value;
    const printId = document.getElementById('labelPrintType').value;
    const lamId = document.getElementById('labelLamination').value;
    const cutId = document.getElementById('labelCutType').value;
    const custId = document.getElementById('labelCustomerType').value;
    const otherCosts = parseInt(document.getElementById('labelOtherCosts').value) || 0;

    if (labelW <= 0 || labelH <= 0) return alert('Vui lòng nhập kích thước tem!');
    if (qty <= 0) return alert('Vui lòng nhập số lượng!');

    const decal = LABEL_SETTINGS.decalTypes.find(d => d.id === parseInt(decalId)) || LABEL_SETTINGS.decalTypes[0];
    const print = LABEL_SETTINGS.printOptions.find(p => p.id === parseInt(printId));
    const lam = LABEL_SETTINGS.laminations.find(l => l.id === parseInt(lamId));
    const cut = LABEL_SETTINGS.cutTypes.find(c => c.id === parseInt(cutId));
    const cust = LABEL_SETTINGS.customerTypes.find(c => c.id === parseInt(custId));

    const margin = parseFloat(document.getElementById('labelMarginCalc')?.value) || 0;

    const imposition = calculateImposition(labelW, labelH, decal.w, decal.h, 0, margin);

    if (imposition.total <= 0) return alert('Tem quá lớn so với khổ in!');

    const sheets = calculateSheetsNeeded(qty, imposition.total);

    const decalPrice = decal.price;
    const printPrice = findTierPrice(print?.tiers, qty);

    // Giá cán màng
    let lamPrice = 0;
    if (lam && lam.tiers) {
        lamPrice = findTierPrice(lam.tiers, qty);
    }

    const cutPrice = findTierPrice(cut?.tiers, qty);

    const sizeRatio = (decal.w * decal.h) / (325 * 430);

    const materialCost = sheets * decalPrice * sizeRatio;
    const printCost = sheets * printPrice * sizeRatio;
    const lamCost = qty * lamPrice;
    const cutCost = qty * cutPrice;
    const totalCost = materialCost + printCost + lamCost + cutCost + otherCosts;
    const costPerItem = totalCost / qty;

    const profitPercent = cust ? cust.profit : 25;
    const sellPerItem = Math.round(costPerItem * (1 + profitPercent / 100));
    const totalSell = sellPerItem * qty;
    const profit = totalSell - totalCost;

    document.getElementById('labelResults').style.display = 'block';
    document.getElementById('labelResSellPrice').textContent = formatMoney(sellPerItem);
    document.getElementById('labelResTotalSell').textContent = formatMoney(totalSell);
    document.getElementById('labelResSize').textContent = `${labelW}×${labelH}mm`;
    document.getElementById('labelResYield').textContent = imposition.total;
    document.getElementById('labelResSheets').textContent = sheets;
    document.getElementById('labelResMaterialCost').textContent = formatMoney(materialCost);
    document.getElementById('labelResPrintCost').textContent = formatMoney(printCost);
    document.getElementById('labelResLamCost').textContent = formatMoney(lamCost);
    document.getElementById('labelResCutCost').textContent = formatMoney(cutCost);
    document.getElementById('labelResOtherCost').textContent = formatMoney(otherCosts);
    document.getElementById('labelResTotalCost').textContent = formatMoney(totalCost);
    document.getElementById('labelResCostPerItem').textContent = formatMoney(costPerItem);
    document.getElementById('labelResProfit').textContent = formatMoney(profit);

    document.getElementById('labelResults').scrollIntoView({ behavior: 'smooth' });
}

// 3. TÍNH GIÁ CATALOGUE
function calculateCatalogue() {
    const sizeType = document.getElementById('catalogueSize').value;
    const pages = parseInt(document.getElementById('cataloguePages').value) || 8;
    const qty = parseInt(document.getElementById('catalogueQty').value) || 0;
    const bindId = document.getElementById('catalogueBinding').value;
    const custId = document.getElementById('catalogueCustomerType').value;
    const otherCosts = getTotalCatalogueExtraCosts();

    // Validation với thông báo đẹp hơn
    if (qty <= 0) {
        showToast('⚠️ Vui lòng nhập số lượng lớn hơn 0!', 'error');
        validateCatalogueInputs();
        return;
    }
    if (pages < 4) {
        showToast('⚠️ Catalogue cần ít nhất 4 trang!', 'error');
        validateCatalogueInputs();
        return;
    }

    // Validate kích thước tự chọn
    if (sizeType === 'custom') {
        const customW = parseFloat(document.getElementById('catalogueCustomWidth')?.value) || 0;
        const customH = parseFloat(document.getElementById('catalogueCustomHeight')?.value) || 0;
        if (customW <= 0 || customH <= 0) {
            showToast('⚠️ Vui lòng nhập đầy đủ kích thước Catalogue!', 'error');
            validateCatalogueInputs();
            return;
        }
    }

    const bind = CATALOGUE_SETTINGS.bindings.find(b => b.id === parseInt(bindId));
    const cust = CATALOGUE_SETTINGS.customerTypes.find(c => c.id === parseInt(custId));

    const innerPages = pages - 4;
    const innerSheetsPerBook = Math.ceil(innerPages / 4);
    const coverSheetsPerBook = 1;

    const totalInnerSheets = innerSheetsPerBook * qty;
    const totalCoverSheets = coverSheetsPerBook * qty;

    const printPrice = CATALOGUE_SETTINGS.printPrice;

    // Tính chi phí giấy bìa (tổng của tất cả các loại giấy bìa)
    let coverCost = 0;
    let coverPrintCost = 0;
    let coverLamCost = 0;
    let totalCoverSheetsUsed = 0;

    catalogueCoverPapers.forEach(coverPaperItem => {
        if (!coverPaperItem.paperId) return;

        const paper = CATALOGUE_SETTINGS.papers.find(p => p.id === parseInt(coverPaperItem.paperId));
        if (paper) {
            coverCost += totalCoverSheets * paper.price;
            totalCoverSheetsUsed += totalCoverSheets;
        }

        // Tính in bìa
        if (coverPaperItem.printSides > 0) {
            coverPrintCost += totalCoverSheets * printPrice * coverPaperItem.printSides;
        }

        // Tính cán màng bìa
        if (coverPaperItem.laminationId) {
            const lam = CATALOGUE_SETTINGS.laminations.find(l => l.id === parseInt(coverPaperItem.laminationId));
            if (lam && lam.tiers) {
                const lamPrice = findTierPrice(lam.tiers, qty);
                coverLamCost += qty * lamPrice;
            }
        }
    });

    // Tính chi phí giấy ruột (tổng của tất cả các loại giấy ruột)
    let innerCost = 0;
    let innerPrintCost = 0;
    let innerLamCost = 0;
    let totalInnerSheetsUsed = 0;

    catalogueInnerPapers.forEach(innerPaperItem => {
        if (!innerPaperItem.paperId) return;

        const paper = CATALOGUE_SETTINGS.papers.find(p => p.id === parseInt(innerPaperItem.paperId));
        if (paper) {
            innerCost += totalInnerSheets * paper.price;
            totalInnerSheetsUsed += totalInnerSheets;
        }

        // Tính in ruột
        if (innerPaperItem.printSides > 0) {
            innerPrintCost += totalInnerSheets * printPrice * innerPaperItem.printSides;
        }

        // Tính cán màng ruột
        if (innerPaperItem.laminationId) {
            const lam = CATALOGUE_SETTINGS.laminations.find(l => l.id === parseInt(innerPaperItem.laminationId));
            if (lam && lam.tiers) {
                const lamPrice = findTierPrice(lam.tiers, qty);
                innerLamCost += qty * lamPrice;
            }
        }
    });

    const totalPrintCost = coverPrintCost + innerPrintCost;

    const bindPrice = findTierPrice(bind?.tiers, qty);
    const bindCost = qty * bindPrice;

    const totalCost = innerCost + coverCost + totalPrintCost + coverLamCost + innerLamCost + bindCost + otherCosts;
    const costPerItem = totalCost / qty;

    const profitPercent = cust ? cust.profit : 25;
    const sellPerItem = Math.round(costPerItem * (1 + profitPercent / 100));
    const totalSell = sellPerItem * qty;
    const profit = totalSell - totalCost;

    const catalogueResultsEl = document.getElementById('catalogueResults');
    if (catalogueResultsEl) {
        catalogueResultsEl.style.display = 'block';
        // Animation
        catalogueResultsEl.style.animation = 'slideDown 0.5s ease';
    }

    document.getElementById('catalogueResQty').textContent = qty.toLocaleString('vi-VN');
    document.getElementById('catalogueResSellPrice').textContent = formatMoney(sellPerItem);
    document.getElementById('catalogueResTotalSell').textContent = formatMoney(totalSell);

    // Giấy bìa - tổng hợp
    document.getElementById('catalogueResCoverSheets').textContent = totalCoverSheetsUsed.toLocaleString('vi-VN');
    const avgCoverPrice = totalCoverSheetsUsed > 0 ? coverCost / totalCoverSheetsUsed : 0;
    document.getElementById('catalogueResCoverPrice').textContent = formatMoney(avgCoverPrice);
    document.getElementById('catalogueResCoverCost').textContent = formatMoney(coverCost);

    // In bìa - tổng hợp
    document.getElementById('catalogueResCoverPrintName').textContent = coverPrintCost > 0 ? 'In bìa' : 'Không in';
    document.getElementById('catalogueResCoverPrintSheets').textContent = coverPrintCost > 0 ? totalCoverSheets.toLocaleString('vi-VN') : '0';
    document.getElementById('catalogueResCoverPrintPrice').textContent = formatMoney(printPrice);
    document.getElementById('catalogueResCoverPrintCost').textContent = formatMoney(coverPrintCost);

    // Cán màng bìa - tổng hợp
    document.getElementById('catalogueResCoverLamName').textContent = coverLamCost > 0 ? 'Cán màng bìa' : 'Không cán';
    document.getElementById('catalogueResCoverLamCost').textContent = formatMoney(coverLamCost);

    // Giấy ruột - tổng hợp
    document.getElementById('catalogueResInnerSheets').textContent = totalInnerSheetsUsed.toLocaleString('vi-VN');
    const avgInnerPrice = totalInnerSheetsUsed > 0 ? innerCost / totalInnerSheetsUsed : 0;
    document.getElementById('catalogueResInnerPrice').textContent = formatMoney(avgInnerPrice);
    document.getElementById('catalogueResInnerCost').textContent = formatMoney(innerCost);

    // In ruột - tổng hợp
    document.getElementById('catalogueResInnerPrintName').textContent = innerPrintCost > 0 ? 'In ruột' : 'Không in';
    document.getElementById('catalogueResInnerPrintSheets').textContent = innerPrintCost > 0 ? totalInnerSheets.toLocaleString('vi-VN') : '0';
    document.getElementById('catalogueResInnerPrintPrice').textContent = formatMoney(printPrice);
    document.getElementById('catalogueResInnerPrintCost').textContent = formatMoney(innerPrintCost);

    // Cán màng ruột - tổng hợp
    document.getElementById('catalogueResInnerLamName').textContent = innerLamCost > 0 ? 'Cán màng ruột' : 'Không cán';
    document.getElementById('catalogueResInnerLamCost').textContent = formatMoney(innerLamCost);

    // Gia công đóng cuốn
    document.getElementById('catalogueResBindName').textContent = bind ? bind.name : 'Gia công đóng cuốn';
    document.getElementById('catalogueResBindCost').textContent = formatMoney(bindCost);

    // Chi phí khác và tổng
    document.getElementById('catalogueResExtraCost').textContent = formatMoney(otherCosts);
    document.getElementById('catalogueResTotalCost').textContent = formatMoney(totalCost);
    document.getElementById('catalogueResProfit').textContent = formatMoney(profit);

    // Show notification
    const notification = document.getElementById('catalogueCalcNotification');
    if (notification) {
        notification.style.display = 'block';
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Show toast
    showToast('✅ Đã tính giá Catalogue thành công!', 'success');

    // Scroll to results
    if (catalogueResultsEl) {
        setTimeout(() => {
            catalogueResultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Lưu vào lịch sử
    const customW = sizeType === 'custom' ? parseFloat(document.getElementById('catalogueCustomWidth')?.value) || 0 : 0;
    const customH = sizeType === 'custom' ? parseFloat(document.getElementById('catalogueCustomHeight')?.value) || 0 : 0;

    saveCatalogueToHistory({
        note: document.getElementById('catalogueNote')?.value || '',
        // Quy cách Catalogue
        size: sizeType,
        sizeText: sizeType === 'custom'
            ? `${customW}×${customH}mm`
            : sizeType === 'A4' ? 'A4 (210×297mm)'
                : sizeType === 'A5' ? 'A5 (148×210mm)'
                    : sizeType === 'A3' ? 'A3 (297×420mm)'
                        : sizeType,
        pages: pages,
        quantity: qty,
        // Giấy bìa
        coverPapers: catalogueCoverPapers.map(item => {
            const paper = CATALOGUE_SETTINGS.papers.find(p => p.id === parseInt(item.paperId));
            return paper ? paper.name : '';
        }).filter(Boolean),
        // Giấy ruột
        innerPapers: catalogueInnerPapers.map(item => {
            const paper = CATALOGUE_SETTINGS.papers.find(p => p.id === parseInt(item.paperId));
            return paper ? paper.name : '';
        }).filter(Boolean),
        // Đóng sách
        bindingId: bindId,
        bindingName: bind ? bind.name : 'Gia công đóng cuốn',
        // Loại khách hàng
        customerTypeId: custId,
        customerTypeName: cust ? cust.name : '',
        // Giá
        sellPerItem: sellPerItem,
        totalSell: totalSell,
        totalCost: totalCost,
        profit: profit
    });
}

// ===== RENDER TIERED LIST =====
function renderTieredList(containerId, items, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = items.map(item => {
        // Nếu là "Cán 2 mặt" (isDouble = true), hiển thị đơn giản
        if (item.isDouble) {
            return `
                <div class="tier-item auto-double">
                    <div class="tier-item-header">
                        <input type="text" value="${item.name}" disabled style="background:#f0f0f0">
                        <span class="auto-label">Tự động = Cán màng 1 mặt × 2</span>
                    </div>
                </div>
            `;
        }

        // Render bình thường cho các loại khác
        const tiersHtml = item.tiers.map((tier, idx) => {
            const minQty = idx === 0 ? 1 : (item.tiers[idx - 1].max + 1);
            return `
                <div class="tier-row">
                    <span class="tier-label">Từ</span>
                    <input type="number" class="tier-qty" value="${minQty}" disabled>
                    <span class="tier-label">đến</span>
                    <input type="number" class="tier-qty" value="${tier.max}" onchange="update${prefix}Tier(${item.id}, ${idx}, 'max', this.value)">
                    <span class="tier-label">→</span>
                    <input type="number" class="tier-price" value="${tier.price}" onchange="update${prefix}Tier(${item.id}, ${idx}, 'price', this.value)">
                    <span class="tier-unit">đ</span>
                    <button class="delete-btn" onclick="delete${prefix}Tier(${item.id}, ${idx})" ${item.tiers.length <= 1 ? 'disabled' : ''}>✕</button>
                </div>
            `;
        }).join('');

        return `
            <div class="tier-item">
                <div class="tier-item-header">
                    <input type="text" value="${item.name}" onchange="update${prefix}(${item.id}, 'name', this.value)">
                    <button class="btn-add" style="padding:4px 8px;font-size:0.75rem" onclick="add${prefix}Tier(${item.id})">+ Mốc</button>
                    <button class="delete-btn" onclick="delete${prefix}(${item.id})">✕</button>
                </div>
                <div class="tier-rows">${tiersHtml}</div>
            </div>
        `;
    }).join('');
}

// ===== SETTING MODAL =====
let currentSettingType = null;

function openSettingModal(type) {
    currentSettingType = type;
    const modal = document.getElementById('settingEditModal');
    const titleEl = document.getElementById('settingModalTitle');
    const contentEl = document.getElementById('settingModalContent');

    if (!modal || !titleEl || !contentEl) return;

    // Set title
    const titles = {
        'paperTypes': '📄 Loại Giấy + Khổ In',
        'paperPrint': '🖨️ Giá In',
        'paperLam': '✨ Cán Màng',
        'paperProc': '✂️ Gia Công Thành Phẩm',
        'paperCustomer': '👥 Loại Khách (% lợi nhuận)'
    };
    titleEl.textContent = titles[type] || '⚙️ Chỉnh sửa cài đặt';

    // Render content based on type
    let html = '';
    if (type === 'paperTypes') {
        // GIAO DIỆN MỚI: Cấu trúc phân cấp
        html = `
            <div id="paperPricingContainer"></div>
            <button class="btn-add-print-size" onclick="addPrintSize()">
                📐 + Thêm khổ giấy
            </button>
        `;
    } else if (type === 'paperPrint') {
        html = `
            <div class="print-pricing-settings">
                <div class="settings-header">
                    <h3>🖨️ Quản lý Giá In</h3>
                    <p style="font-size: 13px; color: #666; margin-top: 5px;">
                        Đơn vị tính: <strong>đ/tờ</strong> (giá mỗi tờ in)
                    </p>
                </div>
                <div id="printPricingContainer"></div>
            </div>
        `;
    } else if (type === 'paperLam') {
        html = `
            <div class="lamination-settings">
                <div class="settings-header">
                    <h3>✨ Quản lý Cán Màng theo Khổ Giấy</h3>
                </div>
                <div id="laminationContainer"></div>
            </div>
        `;
    } else if (type === 'paperProc') {
        html = `
            <div class="processing-settings">
                <div class="settings-header">
                    <h3>✂️ Quản lý Gia Công Thành Phẩm</h3>
                </div>
                <div id="processingContainer"></div>
            </div>
        `;
    } else if (type === 'paperCustomer') {
        html = `
            <div class="setting-modal-list" id="paperCustomerTypesList"></div>
            <div class="setting-modal-actions">
                <button class="btn-add-sm" onclick="addPaperCustomerType()">+ Thêm loại khách</button>
            </div>
        `;
    }

    contentEl.innerHTML = html;

    // Render the actual list content
    if (type === 'paperTypes') {
        // Giao diện mới
        renderPaperPricingSettings();
    } else if (type === 'paperPrint') {
        // Giao diện mới cho giá in
        if (typeof renderPrintPricingSettings === 'function') {
            renderPrintPricingSettings();
        } else {
            renderPaperSettings();
        }
    } else if (type === 'paperLam') {
        // Giao diện mới cho cán màng
        if (typeof renderLaminationSettings === 'function') {
            renderLaminationSettings();
        }
    } else if (type === 'paperProc') {
        // Giao diện mới cho gia công
        if (typeof renderProcessingSettings === 'function') {
            renderProcessingSettings();
        } else {
            renderPaperSettings();
        }
    } else {
        // Giao diện cũ cho các phần khác
        renderPaperSettings();
    }

    // Show modal
    modal.style.display = 'flex';
}

function closeSettingModal() {
    const modal = document.getElementById('settingEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentSettingType = null;
}

function saveSettingModal() {
    // Settings are saved automatically on change, so just close
    closeSettingModal();
    showToast('✅ Đã lưu thay đổi!');
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('settingEditModal');
    if (event.target === modal) {
        closeSettingModal();
    }
}

// Khôi phục trạng thái collapse/expand khi load
function restoreSettingCardsState() {
    const cardIds = ['paperTypesCard', 'paperPrintCard', 'paperLamCard', 'paperProcCard'];
    cardIds.forEach(cardId => {
        const card = document.getElementById(cardId)?.closest('.setting-card');
        if (!card) return;

        const savedState = localStorage.getItem(`setting_${cardId}`);
        if (savedState === 'collapsed') {
            card.classList.add('collapsed');
        }
    });
}

// ===== RENDER SETTINGS =====
function renderPaperSettings() {
    // Paper Types (Loại giấy + Khổ in + Giá) - DÙNG CẤU TRÚC MỚI
    // Gọi hàm render từ paper_pricing_settings.js
    if (typeof renderPaperPricingSettings === 'function') {
        renderPaperPricingSettings();
    }

    // Print Options (Giá in/tờ) - Chỉ cài đặt In 1 mặt với mốc số lượng
    const printList = document.getElementById('paperPrintPricesList');
    if (printList) {
        let printOneSide = PAPER_SETTINGS.printOptions.find(p => p.id === 1);

        // Tự động khởi tạo nếu chưa có
        if (!printOneSide) {
            printOneSide = {
                id: 1, name: 'In 1 mặt', tiers: [
                    { max: 500, price: 2000 },
                    { max: 999999, price: 1800 }
                ]
            };
            PAPER_SETTINGS.printOptions.push(printOneSide);
        }

        // Đảm bảo có tiers
        if (!printOneSide.tiers || printOneSide.tiers.length === 0) {
            printOneSide.tiers = [
                { max: 500, price: 2000 },
                { max: 999999, price: 1800 }
            ];
        }

        printList.innerHTML = `
            <div class="setting-item-tiered">
                <div class="setting-item-tiered-header">
                    <input type="text" value="In 1 mặt" disabled style="background:#f0f0f0; color:#666; font-weight:700;">
                    <span style="color:#667eea; font-weight:700; font-size:13px; padding:6px 12px; background:linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%); border-radius:6px; border:1px solid #e0e8ff;">Tự động</span>
                </div>
                <div class="setting-tiers">
                    ${printOneSide.tiers.map((tier, idx) => {
            const minQty = idx === 0 ? 1 : (printOneSide.tiers[idx - 1].max + 1);
            return `
                            <div class="tier-row" style="background:#fff; border:2px solid #e8e8e8; border-radius:10px; padding:14px 16px; margin-bottom:10px; transition:all 0.3s ease;">
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <span class="tier-label" style="min-width:35px; font-weight:700; color:#555;">Từ</span>
                                    <input type="number" class="tier-qty" value="${minQty}" disabled style="background:#f5f5f5; border:2px solid #e0e0e0; border-radius:8px; padding:10px 12px; width:80px; font-weight:600; text-align:center;">
                                    <span class="tier-label" style="min-width:40px; font-weight:700; color:#555;">đến</span>
                                    <input type="number" class="tier-qty" value="${tier.max === 999999 ? '' : tier.max}" placeholder="∞" onchange="updatePaperPrintTier(1, ${idx}, 'max', this.value)" style="border:2px solid #e0e0e0; border-radius:8px; padding:10px 12px; width:100px; font-weight:600; text-align:center; transition:all 0.3s ease;" onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'" onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                                    <span class="tier-label" style="min-width:20px; font-weight:700; color:#667eea; font-size:16px;">→</span>
                                    <input type="number" class="tier-price" value="${tier.price}" onchange="updatePaperPrintTier(1, ${idx}, 'price', this.value)" style="border:2px solid #e0e0e0; border-radius:8px; padding:10px 12px; width:120px; font-weight:700; text-align:right; transition:all 0.3s ease;" onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'" onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                                    <span class="unit" style="font-weight:700; color:#667eea; min-width:50px;">đ/tờ</span>
                                    ${printOneSide.tiers.length > 1 ? `<button class="btn-del" onclick="deletePaperPrintTier(1, ${idx})" style="width:36px;height:36px;padding:0; display:flex;align-items:center;justify-content:center; background:linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%); color:#e74c3c; border:2px solid #ffd0d0; border-radius:8px; cursor:pointer; font-size:16px; font-weight:700; transition:all 0.3s ease; flex-shrink:0;" onmouseover="this.style.background='linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'; this.style.color='#fff'; this.style.borderColor='#e74c3c'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)'; this.style.color='#e74c3c'; this.style.borderColor='#ffd0d0'; this.style.transform='scale(1)'">✕</button>` : '<div style="width:36px;"></div>'}
                                </div>
                            </div>
                        `;
        }).join('')}
                    <button class="btn-add-tier" onclick="addPaperPrintTier(1)" style="width:100%; padding:14px; margin-top:12px; font-size:14px; font-weight:700; font-family:'Nunito', sans-serif; color:#667eea; background:linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%); border:2px dashed #667eea; border-radius:10px; cursor:pointer; transition:all 0.3s ease; box-shadow:0 2px 4px rgba(102, 126, 234, 0.1);" onmouseover="this.style.background='linear-gradient(135deg, #e8edff 0%, #d6e0ff 100%)'; this.style.borderColor='#764ba2'; this.style.color='#764ba2'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(102, 126, 234, 0.2)'" onmouseout="this.style.background='linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%)'; this.style.borderColor='#667eea'; this.style.color='#667eea'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(102, 126, 234, 0.1)'">➕ Thêm mốc số lượng</button>
                </div>
            </div>
            <div class="setting-hint" style="margin-top:16px; padding:14px 18px; background:linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%); border-radius:12px; border-left:4px solid #667eea; font-size:14px; color:#667eea; font-weight:600; font-family:'Nunito', sans-serif;">
                💡 <strong>Lưu ý:</strong> Giá in 2 mặt sẽ tự động = Giá in 1 mặt × 2
            </div>
        `;
    }

    // Laminations (Cán màng - giá/tờ < 500, giá/m² >= 500)
    const lamList = document.getElementById('paperLaminationList');
    if (lamList) lamList.innerHTML = PAPER_SETTINGS.laminations.map(l => `
        <div class="setting-item-tiered">
            <div class="setting-item-tiered-header">
                <input type="text" value="${l.name}" onchange="updatePaperLam(${l.id}, 'name', this.value)">
                <button class="btn-del" onclick="deletePaperLam(${l.id})">✕</button>
            </div>
            ${l.id !== 1 ? `
            <div class="setting-tiers">
                <div class="tier-row">
                    <span>&lt;500 tờ:</span>
                    <input type="number" value="${l.tiers?.[0]?.price || 0}" onchange="updatePaperLamTier(${l.id}, this.value)">
                    <span class="unit">đ/tờ</span>
                </div>
                <div class="tier-row">
                    <span>≥500 tờ:</span>
                    <input type="number" value="${l.pricePerM2 || 0}" onchange="updatePaperLamM2(${l.id}, this.value)">
                    <span class="unit">đ/m²</span>
                </div>
            </div>
            ` : ''}
        </div>
    `).join('');

    // Processing (Gia công - giá theo mốc SL)
    const procList = document.getElementById('paperProcessingList');
    if (procList) procList.innerHTML = PAPER_SETTINGS.processing.map(p => `
        <div class="setting-item-tiered">
            <div class="setting-item-tiered-header">
                <input type="text" value="${p.name}" onchange="updatePaperProc(${p.id}, 'name', this.value)">
                <button class="btn-del" onclick="deletePaperProc(${p.id})">✕</button>
            </div>
            <div class="setting-tiers">
                ${p.tiers.map((t, i) => `
                    <div class="tier-row">
                        <span class="tier-label">≤</span>
                        <input type="number" value="${t.max === 999999 ? '' : t.max}" placeholder="∞" onchange="updatePaperProcTier(${p.id}, ${i}, 'max', this.value)">
                        <span>sp →</span>
                        <input type="number" value="${t.price}" onchange="updatePaperProcTier(${p.id}, ${i}, 'price', this.value)">
                        <span class="unit">đ/sp</span>
                    </div>
                `).join('')}
                <button class="btn-add-tier" onclick="addPaperProcTier(${p.id})">+ Thêm mốc</button>
                ${p.fixedTiers && p.fixedTiers.length > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ddd;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 5px; font-weight: 600;">💰 Giá lô cố định:</div>
                        ${p.fixedTiers.map((ft, i) => `
                            <div class="tier-row" style="background: #fff8e1;">
                                <span class="tier-label">≤</span>
                                <input type="number" value="${ft.max === 999999 ? '' : ft.max}" placeholder="∞" onchange="updatePaperProcFixedTier(${p.id}, ${i}, 'max', this.value)">
                                <span>sp →</span>
                                <input type="number" value="${ft.fixed}" onchange="updatePaperProcFixedTier(${p.id}, ${i}, 'fixed', this.value)">
                                <span class="unit">đ/lô</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Customer Types (Loại khách - % lợi nhuận)
    const custList = document.getElementById('paperCustomerTypesList');
    if (custList) custList.innerHTML = PAPER_SETTINGS.customerTypes.map(c => `
        <div class="setting-item">
            <input type="text" value="${c.name}" onchange="updatePaperCust(${c.id}, 'name', this.value)">
            <input type="number" value="${c.profit}" onchange="updatePaperCust(${c.id}, 'profit', this.value)">
            <span class="unit">%</span>
            <button class="btn-del" onclick="deletePaperCust(${c.id})">✕</button>
        </div>
    `).join('');
}

// Helper function để update giá cán màng đơn giản
// Cập nhật giá cán màng < 500 tờ (đ/tờ)
function updatePaperLamTier(id, value) {
    const item = PAPER_SETTINGS.laminations.find(l => l.id === id);
    if (item) {
        item.tiers = [{ max: 499, price: parseInt(value) || 0 }];
    }
}

// Cập nhật giá cán màng >= 500 tờ (đ/m²)
function updatePaperLamM2(id, value) {
    const item = PAPER_SETTINGS.laminations.find(l => l.id === id);
    if (item) {
        item.pricePerM2 = parseInt(value) || 0;
    }
}

function updatePaperLam(id, field, value) {
    const item = PAPER_SETTINGS.laminations.find(l => l.id === id);
    if (item) item[field] = value;
    populatePaperDropdowns();
}

function deletePaperLam(id) {
    if (id === 1) return alert('Không thể xóa "Không cán"!');
    PAPER_SETTINGS.laminations = PAPER_SETTINGS.laminations.filter(l => l.id !== id);
    renderPaperSettings();
    populatePaperDropdowns();
}

function addPaperLamination() {
    const name = prompt('Nhập tên cán màng:');
    if (!name) return;
    const priceTier = parseInt(prompt('Giá < 500 tờ (đ/tờ):')) || 0;
    const priceM2 = parseInt(prompt('Giá >= 500 tờ (đ/m²):')) || 0;
    PAPER_SETTINGS.laminations.push({
        id: Date.now(),
        name: name.trim(),
        tiers: [{ max: 499, price: priceTier }],
        pricePerM2: priceM2
    });
    renderPaperSettings();
    populatePaperDropdowns();
}

function renderLabelSettings() {
    // Decal Types
    const decalList = document.getElementById('labelDecalTypesList');
    if (decalList) decalList.innerHTML = LABEL_SETTINGS.decalTypes.map(d => `
        <div class="settings-item decal-item">
            <input type="text" value="${d.name}" style="flex:2" onchange="updateLabelDecal(${d.id}, 'name', this.value)">
            <input type="number" value="${d.w}" style="width:60px" onchange="updateLabelDecal(${d.id}, 'w', this.value)">
            <span class="unit">×</span>
            <input type="number" value="${d.h}" style="width:60px" onchange="updateLabelDecal(${d.id}, 'h', this.value)">
            <span class="unit">mm</span>
            <input type="number" value="${d.price}" style="width:80px" onchange="updateLabelDecal(${d.id}, 'price', this.value)">
            <span class="unit">đ</span>
            <button class="delete-btn" onclick="deleteLabelDecal(${d.id})">✕</button>
        </div>
    `).join('');

    // Print Options (tiered)
    renderTieredList('labelPrintPricesList', LABEL_SETTINGS.printOptions, 'LabelPrint');

    // Laminations
    renderTieredList('labelLaminationList', LABEL_SETTINGS.laminations, 'LabelLam');

    // Cut Types
    renderTieredList('labelCutTypesList', LABEL_SETTINGS.cutTypes, 'LabelCut');

    // Customer Types
    const custList = document.getElementById('labelCustomerTypesList');
    if (custList) custList.innerHTML = LABEL_SETTINGS.customerTypes.map(c => `
        <div class="settings-item">
            <input type="text" value="${c.name}" onchange="updateLabelCust(${c.id}, 'name', this.value)">
            <input type="number" value="${c.profit}" style="width:60px" onchange="updateLabelCust(${c.id}, 'profit', this.value)">
            <span class="unit">%</span>
            <button class="delete-btn" onclick="deleteLabelCust(${c.id})">✕</button>
        </div>
    `).join('');
}

function renderCatalogueSettings() {
    // Papers
    const paperList = document.getElementById('cataloguePapersList');
    if (paperList) paperList.innerHTML = CATALOGUE_SETTINGS.papers.map(p => `
        <div class="settings-item">
            <input type="text" value="${p.name}" onchange="updateCatPaper(${p.id}, 'name', this.value)">
            <input type="number" value="${p.price}" style="width:80px" onchange="updateCatPaper(${p.id}, 'price', this.value)">
            <span class="unit">đ/tờ</span>
            <button class="delete-btn" onclick="deleteCatPaper(${p.id})">✕</button>
        </div>
    `).join('');

    // Print Price
    const printPriceEl = document.getElementById('cataloguePrintPrice');
    if (printPriceEl) printPriceEl.value = CATALOGUE_SETTINGS.printPrice;

    // Laminations
    renderTieredList('catalogueLaminationList', CATALOGUE_SETTINGS.laminations, 'CatLam');

    // Bindings
    renderTieredList('catalogueBindingList', CATALOGUE_SETTINGS.bindings, 'CatBind');

    // Customer Types
    const custList = document.getElementById('catalogueCustomerTypesList');
    if (custList) custList.innerHTML = CATALOGUE_SETTINGS.customerTypes.map(c => `
        <div class="settings-item">
            <input type="text" value="${c.name}" onchange="updateCatCust(${c.id}, 'name', this.value)">
            <input type="number" value="${c.profit}" style="width:60px" onchange="updateCatCust(${c.id}, 'profit', this.value)">
            <span class="unit">%</span>
            <button class="delete-btn" onclick="deleteCatCust(${c.id})">✕</button>
        </div>
    `).join('');
}

// ===== PAPER SETTINGS FUNCTIONS =====
// CẤU TRÚC MỚI: Các hàm quản lý loại giấy đã được chuyển sang paper_pricing_settings.js
// (addPrintSize, addPaperType, updatePrintSize, updatePaperName, deletePrintSize, deletePaper)


// Cập nhật mốc giá in 1 mặt
function updatePaperPrintTier(id, tierIndex, field, value) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (item && item.tiers && item.tiers[tierIndex]) {
        if (field === 'max') {
            item.tiers[tierIndex].max = value === '' ? 999999 : parseInt(value) || 999999;
        } else {
            item.tiers[tierIndex].price = parseInt(value) || 0;
        }
        populatePaperDropdowns();
        // Re-render modal if open
        if (currentSettingType === 'paperPrint') {
            renderPaperSettings();
        }
    }
}

// Thêm mốc giá in
function addPaperPrintTier(id) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (item && item.tiers) {
        const lastTier = item.tiers[item.tiers.length - 1];
        const newMax = lastTier.max === 999999 ? 1000 : lastTier.max + 500;
        item.tiers.splice(item.tiers.length - 1, 0, { max: newMax, price: lastTier.price });
        renderPaperSettings();
        populatePaperDropdowns();
    }
}

// Xóa mốc giá in
function deletePaperPrintTier(id, tierIndex) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (item && item.tiers && item.tiers.length > 1) {
        item.tiers.splice(tierIndex, 1);
        renderPaperSettings();
        populatePaperDropdowns();
    }
}

// Hàm cũ đã được thay thế ở trên

function addPaperLamTier(id) {
    const item = PAPER_SETTINGS.laminations.find(l => l.id === id);
    if (item) {
        item.tiers.splice(item.tiers.length - 1, 0, { max: 500, price: 0 });
        renderPaperSettings();
    }
}
function deletePaperLamTier(id, idx) {
    const item = PAPER_SETTINGS.laminations.find(l => l.id === id);
    if (item && item.tiers.length > 1) {
        item.tiers.splice(idx, 1);
        renderPaperSettings();
    }
}

function addPaperProcessing() {
    const name = document.getElementById('newPaperProcName').value.trim();
    if (!name) return alert('Nhập tên!');
    PAPER_SETTINGS.processing.push({ id: Date.now(), name, tiers: [{ max: 100, price: 0 }, { max: 500, price: 0 }, { max: 999999, price: 0 }] });
    renderPaperSettings();
    populatePaperDropdowns();
    document.getElementById('newPaperProcName').value = '';
}
function updatePaperProc(id, field, value) {
    const item = PAPER_SETTINGS.processing.find(p => p.id === id);
    if (item && field === 'name') item.name = value;
    populatePaperDropdowns();
}
function deletePaperProc(id) {
    PAPER_SETTINGS.processing = PAPER_SETTINGS.processing.filter(p => p.id !== id);
    renderPaperSettings();
    populatePaperDropdowns();
}

function addPaperCustomerType() {
    const name = prompt('Nhập tên loại khách:');
    if (!name) return;
    const profit = parseInt(prompt('Nhập % lợi nhuận:')) || 0;
    PAPER_SETTINGS.customerTypes.push({ id: Date.now(), name, profit });
    renderPaperSettings();
    populatePaperDropdowns();
}
function updatePaperCust(id, field, value) {
    const item = PAPER_SETTINGS.customerTypes.find(c => c.id === id);
    if (item) item[field] = field === 'name' ? value : parseInt(value) || 0;
    populatePaperDropdowns();
}
function deletePaperCust(id) {
    PAPER_SETTINGS.customerTypes = PAPER_SETTINGS.customerTypes.filter(c => c.id !== id);
    renderPaperSettings();
    populatePaperDropdowns();
}

// ===== PAPER PROCESSING FUNCTIONS =====
function addPaperProcessing() {
    const name = prompt('Nhập tên gia công:');
    if (!name) return;
    const newId = Date.now();
    PAPER_SETTINGS.processing.push({
        id: newId,
        name: name.trim(),
        tiers: [
            { max: 100, price: 200 },
            { max: 500, price: 100 },
            { max: 999999, price: 50 }
        ]
    });
    renderPaperSettings();
    populatePaperDropdowns();
}

function updatePaperProc(id, field, value) {
    const item = PAPER_SETTINGS.processing.find(p => p.id === id);
    if (item) item[field] = value;
    populatePaperDropdowns();
}

function updatePaperProcTier(id, tierIndex, field, value) {
    const item = PAPER_SETTINGS.processing.find(p => p.id === id);
    if (item && item.tiers[tierIndex]) {
        if (field === 'max') {
            item.tiers[tierIndex].max = value === '' ? 999999 : parseInt(value) || 999999;
        } else {
            item.tiers[tierIndex].price = parseInt(value) || 0;
        }
    }
}

function addPaperProcTier(id) {
    const item = PAPER_SETTINGS.processing.find(p => p.id === id);
    if (item) {
        // Thêm mốc mới trước mốc cuối (∞)
        const lastTier = item.tiers[item.tiers.length - 1];
        const newMax = (lastTier.max === 999999) ? 1000 : lastTier.max + 500;
        item.tiers.splice(item.tiers.length - 1, 0, { max: newMax, price: lastTier.price });
        renderPaperSettings();
    }
}

function updatePaperProcFixedTier(id, tierIndex, field, value) {
    const item = PAPER_SETTINGS.processing.find(p => p.id === id);
    if (item && item.fixedTiers && item.fixedTiers[tierIndex]) {
        if (field === 'max') {
            item.fixedTiers[tierIndex].max = value === '' ? 999999 : parseInt(value) || 999999;
        } else {
            item.fixedTiers[tierIndex].fixed = parseInt(value) || 0;
        }
    }
}

function deletePaperProc(id) {
    PAPER_SETTINGS.processing = PAPER_SETTINGS.processing.filter(p => p.id !== id);
    renderPaperSettings();
    populatePaperDropdowns();
}

// ===== LABEL SETTINGS FUNCTIONS =====
function addLabelDecalType() {
    const name = document.getElementById('newDecalName').value.trim();
    const w = parseInt(document.getElementById('newDecalW').value) || 325;
    const h = parseInt(document.getElementById('newDecalH').value) || 430;
    const price = parseInt(document.getElementById('newDecalPrice').value) || 0;
    if (!name) return alert('Nhập tên!');
    LABEL_SETTINGS.decalTypes.push({ id: Date.now(), name, w, h, price });
    renderLabelSettings();
    populateLabelDropdowns();
    document.getElementById('newDecalName').value = '';
    document.getElementById('newDecalPrice').value = '';
}
function updateLabelDecal(id, field, value) {
    const item = LABEL_SETTINGS.decalTypes.find(d => d.id === id);
    if (item) item[field] = field === 'name' ? value : parseInt(value) || 0;
    populateLabelDropdowns();
}
function deleteLabelDecal(id) {
    if (LABEL_SETTINGS.decalTypes.length <= 1) return alert('Cần ít nhất 1 loại decal!');
    LABEL_SETTINGS.decalTypes = LABEL_SETTINGS.decalTypes.filter(d => d.id !== id);
    renderLabelSettings();
    populateLabelDropdowns();
}

function addLabelPrintOption() {
    const name = document.getElementById('newLabelPrintName').value.trim();
    if (!name) return alert('Nhập tên!');
    LABEL_SETTINGS.printOptions.push({ id: Date.now(), name, tiers: [{ max: 200, price: 0 }, { max: 1000, price: 0 }, { max: 999999, price: 0 }] });
    renderLabelSettings();
    populateLabelDropdowns();
    document.getElementById('newLabelPrintName').value = '';
}
function updateLabelPrint(id, field, value) {
    const item = LABEL_SETTINGS.printOptions.find(p => p.id === id);
    if (item && field === 'name') item.name = value;
    populateLabelDropdowns();
}
function updateLabelPrintTier(id, idx, field, value) {
    const item = LABEL_SETTINGS.printOptions.find(p => p.id === id);
    if (item && item.tiers[idx]) item.tiers[idx][field] = parseInt(value) || 0;
}
function addLabelPrintTier(id) {
    const item = LABEL_SETTINGS.printOptions.find(p => p.id === id);
    if (item) {
        item.tiers.splice(item.tiers.length - 1, 0, { max: 500, price: 0 });
        renderLabelSettings();
    }
}
function deleteLabelPrintTier(id, idx) {
    const item = LABEL_SETTINGS.printOptions.find(p => p.id === id);
    if (item && item.tiers.length > 1) {
        item.tiers.splice(idx, 1);
        renderLabelSettings();
    }
}
function deleteLabelPrint(id) {
    LABEL_SETTINGS.printOptions = LABEL_SETTINGS.printOptions.filter(p => p.id !== id);
    renderLabelSettings();
    populateLabelDropdowns();
}

function addLabelLamination() {
    const name = document.getElementById('newLabelLamName').value.trim();
    if (!name) return alert('Nhập tên!');
    LABEL_SETTINGS.laminations.push({ id: Date.now(), name, tiers: [{ max: 200, price: 0 }, { max: 1000, price: 0 }, { max: 999999, price: 0 }] });
    renderLabelSettings();
    populateLabelDropdowns();
    document.getElementById('newLabelLamName').value = '';
}
function updateLabelLam(id, field, value) {
    const item = LABEL_SETTINGS.laminations.find(l => l.id === id);
    if (item && field === 'name') item.name = value;
    populateLabelDropdowns();
}
function updateLabelLamTier(id, idx, field, value) {
    const item = LABEL_SETTINGS.laminations.find(l => l.id === id);
    if (item && item.tiers[idx]) item.tiers[idx][field] = parseInt(value) || 0;
}
function addLabelLamTier(id) {
    const item = LABEL_SETTINGS.laminations.find(l => l.id === id);
    if (item) {
        item.tiers.splice(item.tiers.length - 1, 0, { max: 500, price: 0 });
        renderLabelSettings();
    }
}
function deleteLabelLamTier(id, idx) {
    const item = LABEL_SETTINGS.laminations.find(l => l.id === id);
    if (item && item.tiers.length > 1) {
        item.tiers.splice(idx, 1);
        renderLabelSettings();
    }
}
function deleteLabelLam(id) {
    LABEL_SETTINGS.laminations = LABEL_SETTINGS.laminations.filter(l => l.id !== id);
    renderLabelSettings();
    populateLabelDropdowns();
}

function addLabelCutType() {
    const name = document.getElementById('newLabelCutName').value.trim();
    if (!name) return alert('Nhập tên!');
    LABEL_SETTINGS.cutTypes.push({ id: Date.now(), name, tiers: [{ max: 200, price: 0 }, { max: 1000, price: 0 }, { max: 999999, price: 0 }] });
    renderLabelSettings();
    populateLabelDropdowns();
    document.getElementById('newLabelCutName').value = '';
}
function updateLabelCut(id, field, value) {
    const item = LABEL_SETTINGS.cutTypes.find(c => c.id === id);
    if (item && field === 'name') item.name = value;
    populateLabelDropdowns();
}
function updateLabelCutTier(id, idx, field, value) {
    const item = LABEL_SETTINGS.cutTypes.find(c => c.id === id);
    if (item && item.tiers[idx]) item.tiers[idx][field] = parseInt(value) || 0;
}
function addLabelCutTier(id) {
    const item = LABEL_SETTINGS.cutTypes.find(c => c.id === id);
    if (item) {
        item.tiers.splice(item.tiers.length - 1, 0, { max: 500, price: 0 });
        renderLabelSettings();
    }
}
function deleteLabelCutTier(id, idx) {
    const item = LABEL_SETTINGS.cutTypes.find(c => c.id === id);
    if (item && item.tiers.length > 1) {
        item.tiers.splice(idx, 1);
        renderLabelSettings();
    }
}
function deleteLabelCut(id) {
    LABEL_SETTINGS.cutTypes = LABEL_SETTINGS.cutTypes.filter(c => c.id !== id);
    renderLabelSettings();
    populateLabelDropdowns();
}

function addLabelCustomerType() {
    const name = document.getElementById('newLabelCustName').value.trim();
    const profit = parseInt(document.getElementById('newLabelCustProfit').value) || 0;
    if (!name) return alert('Nhập tên!');
    LABEL_SETTINGS.customerTypes.push({ id: Date.now(), name, profit });
    renderLabelSettings();
    populateLabelDropdowns();
    document.getElementById('newLabelCustName').value = '';
    document.getElementById('newLabelCustProfit').value = '';
}
function updateLabelCust(id, field, value) {
    const item = LABEL_SETTINGS.customerTypes.find(c => c.id === id);
    if (item) item[field] = field === 'name' ? value : parseInt(value) || 0;
    populateLabelDropdowns();
}
function deleteLabelCust(id) {
    LABEL_SETTINGS.customerTypes = LABEL_SETTINGS.customerTypes.filter(c => c.id !== id);
    renderLabelSettings();
    populateLabelDropdowns();
}

// ===== CATALOGUE SETTINGS FUNCTIONS =====
function addCataloguePaper() {
    const name = document.getElementById('newCatPaperName').value.trim();
    const price = parseInt(document.getElementById('newCatPaperPrice').value) || 0;
    if (!name) return alert('Nhập tên!');
    CATALOGUE_SETTINGS.papers.push({ id: Date.now(), name, price });
    renderCatalogueSettings();
    populateCatalogueDropdowns();
    document.getElementById('newCatPaperName').value = '';
    document.getElementById('newCatPaperPrice').value = '';
}
function updateCatPaper(id, field, value) {
    const item = CATALOGUE_SETTINGS.papers.find(p => p.id === id);
    if (item) item[field] = field === 'name' ? value : parseInt(value) || 0;
    populateCatalogueDropdowns();
}
function deleteCatPaper(id) {
    CATALOGUE_SETTINGS.papers = CATALOGUE_SETTINGS.papers.filter(p => p.id !== id);
    renderCatalogueSettings();
    populateCatalogueDropdowns();
}

function addCatalogueLamination() {
    const name = document.getElementById('newCatLamName').value.trim();
    if (!name) return alert('Nhập tên!');
    CATALOGUE_SETTINGS.laminations.push({ id: Date.now(), name, tiers: [{ max: 100, price: 0 }, { max: 500, price: 0 }, { max: 999999, price: 0 }] });
    renderCatalogueSettings();
    populateCatalogueDropdowns();
    document.getElementById('newCatLamName').value = '';
}
function updateCatLam(id, field, value) {
    const item = CATALOGUE_SETTINGS.laminations.find(l => l.id === id);
    if (item && field === 'name') item.name = value;
    populateCatalogueDropdowns();
}
function updateCatLamTier(id, idx, field, value) {
    const item = CATALOGUE_SETTINGS.laminations.find(l => l.id === id);
    if (item && item.tiers[idx]) item.tiers[idx][field] = parseInt(value) || 0;
}
function addCatLamTier(id) {
    const item = CATALOGUE_SETTINGS.laminations.find(l => l.id === id);
    if (item) {
        item.tiers.splice(item.tiers.length - 1, 0, { max: 500, price: 0 });
        renderCatalogueSettings();
    }
}
function deleteCatLamTier(id, idx) {
    const item = CATALOGUE_SETTINGS.laminations.find(l => l.id === id);
    if (item && item.tiers.length > 1) {
        item.tiers.splice(idx, 1);
        renderCatalogueSettings();
    }
}
function deleteCatLam(id) {
    CATALOGUE_SETTINGS.laminations = CATALOGUE_SETTINGS.laminations.filter(l => l.id !== id);
    renderCatalogueSettings();
    populateCatalogueDropdowns();
}

function addCatalogueBinding() {
    const name = document.getElementById('newCatBindName').value.trim();
    if (!name) return alert('Nhập tên!');
    CATALOGUE_SETTINGS.bindings.push({ id: Date.now(), name, tiers: [{ max: 100, price: 0 }, { max: 500, price: 0 }, { max: 999999, price: 0 }] });
    renderCatalogueSettings();
    populateCatalogueDropdowns();
    document.getElementById('newCatBindName').value = '';
}
function updateCatBind(id, field, value) {
    const item = CATALOGUE_SETTINGS.bindings.find(b => b.id === id);
    if (item && field === 'name') item.name = value;
    populateCatalogueDropdowns();
}
function updateCatBindTier(id, idx, field, value) {
    const item = CATALOGUE_SETTINGS.bindings.find(b => b.id === id);
    if (item && item.tiers[idx]) item.tiers[idx][field] = parseInt(value) || 0;
}
function addCatBindTier(id) {
    const item = CATALOGUE_SETTINGS.bindings.find(b => b.id === id);
    if (item) {
        item.tiers.splice(item.tiers.length - 1, 0, { max: 500, price: 0 });
        renderCatalogueSettings();
    }
}
function deleteCatBindTier(id, idx) {
    const item = CATALOGUE_SETTINGS.bindings.find(b => b.id === id);
    if (item && item.tiers.length > 1) {
        item.tiers.splice(idx, 1);
        renderCatalogueSettings();
    }
}
function deleteCatBind(id) {
    CATALOGUE_SETTINGS.bindings = CATALOGUE_SETTINGS.bindings.filter(b => b.id !== id);
    renderCatalogueSettings();
    populateCatalogueDropdowns();
}

function addCatalogueCustomerType() {
    const name = document.getElementById('newCatCustName').value.trim();
    const profit = parseInt(document.getElementById('newCatCustProfit').value) || 0;
    if (!name) return alert('Nhập tên!');
    CATALOGUE_SETTINGS.customerTypes.push({ id: Date.now(), name, profit });
    renderCatalogueSettings();
    populateCatalogueDropdowns();
    document.getElementById('newCatCustName').value = '';
    document.getElementById('newCatCustProfit').value = '';
}
function updateCatCust(id, field, value) {
    const item = CATALOGUE_SETTINGS.customerTypes.find(c => c.id === id);
    if (item) item[field] = field === 'name' ? value : parseInt(value) || 0;
    populateCatalogueDropdowns();
}
function deleteCatCust(id) {
    CATALOGUE_SETTINGS.customerTypes = CATALOGUE_SETTINGS.customerTypes.filter(c => c.id !== id);
    renderCatalogueSettings();
    populateCatalogueDropdowns();
}

// ===== USER MANAGEMENT =====
function loadUsers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    const users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td><span class="role-badge ${u.role}">${u.role === 'admin' ? '👑 Admin' : '👤 NV'}</span></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${u.canViewCost ? 'checked' : ''} onchange="toggleViewCost('${u.username}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <button class="btn-change-password" onclick="showChangePasswordModal('${u.username}')">🔑 Đổi MK</button>
                ${u.username !== 'admin' ? `<button class="delete-btn" onclick="deleteUser('${u.username}')">✕</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ===== TOGGLE VIEW COST FUNCTIONS =====
function toggleViewCost(username, canView) {
    let users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    const user = users.find(u => u.username === username);

    if (!user) {
        alert('Không tìm thấy tài khoản!');
        return;
    }

    user.canViewCost = canView;
    localStorage.setItem('netprint_users', JSON.stringify(users));

    // Nếu đang thay đổi quyền của user hiện tại, cập nhật ngay
    if (currentUser && currentUser.username === username) {
        currentUser.canViewCost = canView;
        localStorage.setItem('netprint_current_user', JSON.stringify(currentUser));
        // Cập nhật hiển thị chi tiết giá vốn ngay lập tức
        updateCostDetailVisibility(canView);
        // Reload để đảm bảo đồng bộ
        showApp();
    }

    const message = canView ? '✅ Đã bật quyền xem giá vốn (bao gồm chi tiết)' : '❌ Đã tắt quyền xem giá vốn';
    alert(message);
}

function deleteUser(username) {
    if (!confirm(`Xóa tài khoản "${username}"?`)) return;
    let users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    users = users.filter(u => u.username !== username);
    localStorage.setItem('netprint_users', JSON.stringify(users));
    loadUsers();
    alert('Đã xóa tài khoản!');
}

// ===== CHANGE PASSWORD FUNCTIONS =====
function showChangePasswordModal(username) {
    document.getElementById('changePasswordUsername').value = username;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('changePasswordModal').style.display = 'block';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

function changePassword() {
    const username = document.getElementById('changePasswordUsername').value;
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // Validation
    if (!newPassword) {
        alert('Vui lòng nhập mật khẩu mới!');
        return;
    }

    if (newPassword.length < 3) {
        alert('Mật khẩu phải có ít nhất 3 ký tự!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }

    // Update password
    let users = JSON.parse(localStorage.getItem('netprint_users') || '[]');
    const user = users.find(u => u.username === username);

    if (!user) {
        alert('Không tìm thấy tài khoản!');
        return;
    }

    user.password = newPassword;
    localStorage.setItem('netprint_users', JSON.stringify(users));

    // Update current user if changing own password
    if (currentUser && currentUser.username === username) {
        currentUser.password = newPassword;
        localStorage.setItem('netprint_current_user', JSON.stringify(currentUser));
    }

    closeChangePasswordModal();
    alert(`✅ Đã thay đổi mật khẩu cho tài khoản "${username}" thành công!`);
}

// ===== DELIVERY SUGGESTION =====
function addDeliverySuggestion() {
    const select = document.getElementById('deliverySuggestions');
    const selectedValue = select.value;

    if (!selectedValue) return;

    const [name, amount] = selectedValue.split('|');
    const cost = parseInt(amount);

    // Thêm vào danh sách chi phí khác
    paperExtraCosts.push({
        id: Date.now(),
        name: name,
        amount: cost
    });

    // Reset dropdown
    select.value = '';

    // Cập nhật hiển thị
    renderPaperExtraCosts();

    // Thông báo
    showNotification(`✅ Đã thêm ${name}: ${formatMoney(cost)}`);
}

function showNotification(message) {
    // Tạo thông báo tạm thời
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Tự động xóa sau 2 giây
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// ===== HOME NAVIGATION =====
function goToHome() {
    // Ẩn tất cả các tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    // Hiển thị tab paper-calculator (trang chủ)
    const homeTab = document.getElementById('paper-calculator');
    if (homeTab) {
        homeTab.style.display = 'block';
        homeTab.classList.add('active');
    }

    // Update title
    updateMainTitle('paper');

    // Reset về sub-tab đầu tiên (Tính Giá In Nhanh)
    showSubTab('paper', 'calc');

    // Cập nhật active state cho sub-tab
    document.querySelectorAll('.sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const firstSubTab = document.querySelector('.sub-tab');
    if (firstSubTab) {
        firstSubTab.classList.add('active');
    }
}

// Quay lại trang trước (lịch sử trình duyệt)
function goBack() {
    // Nếu có history thì quay lại
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Nếu không có history, về trang chủ
        goToHome();
    }
}

// ===== HAMBURGER MENU =====
function toggleHamburgerMenu() {
    const dropdown = document.getElementById('hamburgerDropdown');
    const btn = document.querySelector('.hamburger-btn');

    if (dropdown && btn) {
        dropdown.classList.toggle('show');
        btn.classList.toggle('active');
    }
}

function closeHamburgerMenu() {
    const dropdown = document.getElementById('hamburgerDropdown');
    const btn = document.querySelector('.hamburger-btn');

    if (dropdown) dropdown.classList.remove('show');
    if (btn) btn.classList.remove('active');
}

// Đóng menu khi click ra ngoài
document.addEventListener('click', function (e) {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (hamburgerMenu && !hamburgerMenu.contains(e.target)) {
        closeHamburgerMenu();
    }
});

// ===== HISTORY SYSTEM =====
const HISTORY_LIMIT = 50;

function saveToHistory(type, data) {
    const key = `netprint_history_${type}`;
    let history = JSON.parse(localStorage.getItem(key) || '[]');

    // Tạo item lịch sử mới
    const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        note: data.note || '',
        data: data
    };

    // Thêm vào đầu mảng
    history.unshift(historyItem);

    // Giới hạn số lượng (giữ 50 item mới nhất)
    if (history.length > HISTORY_LIMIT) {
        history = history.slice(0, HISTORY_LIMIT);
    }

    // Lưu vào localStorage
    localStorage.setItem(key, JSON.stringify(history));

    // Reload history để hiển thị
    loadHistory(type);
}

function loadHistory(type) {
    const key = `netprint_history_${type}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    renderHistory(type, history);
}

function renderHistory(type, history) {
    const containerId = `${type}-history`;
    const container = document.getElementById(containerId);
    if (!container) return;

    // Nếu container đã có card (như catalogue-history), chỉ cập nhật list
    const existingCard = container.querySelector('.card');
    if (existingCard) {
        const listContainer = document.getElementById(`${type}HistoryList`);
        if (!listContainer) return;

        if (history.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">Chưa có lịch sử tính giá</div>
                    <div class="empty-hint">Hãy tính giá để lưu lại lịch sử!</div>
                </div>
            `;
        } else {
            listContainer.innerHTML = history.map(item => createHistoryItemHTML(type, item)).join('');
        }
        return;
    }

    // Tạo HTML mới cho các type khác
    let html = `
        <div class="card">
            <h2>📋 Lịch Sử Tính Giá</h2>
            <input type="text" id="${type}HistorySearch" placeholder="🔍 Tìm kiếm..." onkeyup="filterHistory('${type}')" style="margin-bottom: 15px; width: 100%;">
            <div id="${type}HistoryList">
    `;

    if (history.length === 0) {
        html += '<p style="text-align: center; color: #999; padding: 30px;">Chưa có lịch sử tính giá</p>';
    } else {
        history.forEach(item => {
            html += createHistoryItemHTML(type, item);
        });
    }

    html += `
            </div>
            <button class="btn-danger" onclick="clearHistory('${type}')" style="margin-top: 15px;">🗑️ Xóa Tất Cả</button>
        </div>
    `;

    container.innerHTML = html;
}

function createHistoryItemHTML(type, item) {
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString('vi-VN');
    const timeStr = date.toLocaleTimeString('vi-VN');

    return `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <strong style="color: #e74c3c; font-size: 1.1rem;">${item.note || 'Không có ghi chú'}</strong>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 5px;">⏰ ${dateStr} ${timeStr}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-table btn-view" onclick="load${capitalize(type)}FromHistory(${item.id})" title="Load lại">📥</button>
                    <button class="btn-table btn-convert-quote" onclick="convertHistoryToQuote('${type}', ${item.id})" title="Chuyển sang Báo giá">💰</button>
                    <button class="btn-table btn-delete" onclick="delete${capitalize(type)}History(${item.id})" title="Xóa">🗑️</button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.9rem; margin-top: 10px; padding-top: 15px; border-top: 1px solid #eee;">
                ${type === 'catalogue' ? `
                <!-- Catalogue specific fields -->
                ${item.data.sizeText ? `<div><strong style="color: #2980b9;">📐 Kích thước:</strong><br/>${item.data.sizeText}</div>` : ''}
                ${item.data.pages ? `<div><strong style="color: #2980b9;">📄 Số trang:</strong><br/>${item.data.pages} trang</div>` : ''}
                ${item.data.coverPapers && item.data.coverPapers.length > 0 ? `<div><strong style="color: #2980b9;">📑 Giấy bìa:</strong><br/>${item.data.coverPapers.join(', ')}</div>` : ''}
                ${item.data.innerPapers && item.data.innerPapers.length > 0 ? `<div><strong style="color: #2980b9;">📖 Giấy ruột:</strong><br/>${item.data.innerPapers.join(', ')}</div>` : ''}
                ${item.data.bindingName ? `<div><strong style="color: #e67e22;">📌 Đóng sách:</strong><br/>${item.data.bindingName}</div>` : ''}
                <div><strong style="color: #27ae60;">📦 Số lượng:</strong><br/>${(item.data.quantity || 0).toLocaleString('vi-VN')} cuốn</div>
                <div><strong style="color: #e74c3c;">💰 Đơn giá:</strong><br/><span style="color: #e74c3c; font-weight: 600;">${formatMoney(item.data.sellPerItem || 0)}</span>/cuốn</div>
                <div><strong style="color: #27ae60;">💵 Thành tiền:</strong><br/><span style="color: #27ae60; font-weight: 600; font-size: 1.05rem;">${formatMoney(item.data.totalSell || 0)}</span></div>
                ${item.data.customerTypeName ? `<div><strong>👥 Loại KH:</strong><br/>${item.data.customerTypeName}</div>` : ''}
                ` : `
                <!-- Paper/Label specific fields -->
                ${item.data.productSize ? `<div><strong style="color: #2980b9;">📏 Quy cách SP:</strong><br/>${item.data.productSize}</div>` : ''}
                ${item.data.paperTypeName ? `<div><strong style="color: #2980b9;">📄 Giấy:</strong><br/>${item.data.paperTypeName}</div>` : ''}
                ${item.data.printOptionName ? `<div><strong style="color: #2980b9;">🖨️ In:</strong><br/>${item.data.printOptionName}</div>` : ''}
                ${item.data.laminationName && item.data.laminationName !== 'Không' ? `<div><strong style="color: #2980b9;">✨ Cán:</strong><br/>${item.data.laminationName}</div>` : ''}
                ${item.data.processingNames && item.data.processingNames !== 'Không' ? `<div><strong style="color: #e67e22;">✂️ Gia công:</strong><br/>${item.data.processingNames}</div>` : ''}
                <div><strong style="color: #27ae60;">📦 Số lượng:</strong><br/>${(item.data.quantity || 0).toLocaleString('vi-VN')} sp</div>
                <div><strong style="color: #e74c3c;">💰 Đơn giá:</strong><br/><span style="color: #e74c3c; font-weight: 600;">${formatMoney(item.data.unitPrice || item.data.sellPerItem || 0)}</span>/sp</div>
                <div><strong style="color: #27ae60;">💵 Thành tiền:</strong><br/><span style="color: #27ae60; font-weight: 600; font-size: 1.05rem;">${formatMoney(item.data.totalPrice || item.data.totalSell || 0)}</span></div>
                ${item.data.customerTypeName ? `<div><strong>👥 Loại KH:</strong><br/>${item.data.customerTypeName}</div>` : ''}
                `}
            </div>
        </div>
    `;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterHistory(type) {
    const searchTerm = document.getElementById(`${type}HistorySearch`).value.toLowerCase();
    const items = document.querySelectorAll(`#${type}HistoryList .history-item`);

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function clearHistory(type) {
    if (!confirm('Xóa toàn bộ lịch sử tính giá?')) return;

    localStorage.removeItem(`netprint_history_${type}`);
    loadHistory(type);
    alert('✅ Đã xóa lịch sử!');
}

// Wrapper functions for paper history (called from HTML)
function filterPaperHistory() {
    filterHistory('paper');
}

// Wrapper functions for catalogue history (called from HTML)
function filterCatalogueHistory() {
    filterHistory('catalogue');
}

function clearCatalogueHistory() {
    clearHistory('catalogue');
}

function deleteCatalogueHistory(id) {
    if (!confirm('Xóa lịch sử này?')) return;
    let history = JSON.parse(localStorage.getItem('netprint_history_catalogue') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('netprint_history_catalogue', JSON.stringify(history));
    loadHistory('catalogue');
}

// Lưu Catalogue vào lịch sử
function saveCatalogueToHistory(data) {
    // Tạo note tự động nếu chưa có
    let note = data.note || '';
    if (!note) {
        note = `Catalogue: ${data.sizeText || data.size} | ${data.pages} trang | ${data.quantity} cuốn`;
    }

    saveToHistory('catalogue', {
        note: note,
        ...data
    });
}

function clearPaperHistory() {
    clearHistory('paper');
}

// Delete history item functions
function deletePaperHistory(id) {
    if (!confirm('Xóa lịch sử này?')) return;
    let history = JSON.parse(localStorage.getItem('netprint_history_paper') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('netprint_history_paper', JSON.stringify(history));
    loadHistory('paper');
}

function deleteLabelHistory(id) {
    if (!confirm('Xóa lịch sử này?')) return;
    let history = JSON.parse(localStorage.getItem('netprint_history_label') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('netprint_history_label', JSON.stringify(history));
    loadHistory('label');
}

function deleteCatalogueHistory(id) {
    if (!confirm('Xóa lịch sử này?')) return;
    let history = JSON.parse(localStorage.getItem('netprint_history_catalogue') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('netprint_history_catalogue', JSON.stringify(history));
    loadHistory('catalogue');
}

function deleteOffsetHistory(id) {
    if (!confirm('Xóa lịch sử này?')) return;
    let history = JSON.parse(localStorage.getItem('netprint_history_offset') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('netprint_history_offset', JSON.stringify(history));
    loadHistory('offset');
}

// Load from history functions
function loadPaperFromHistory(id) {
    const history = JSON.parse(localStorage.getItem('netprint_history_paper') || '[]');
    const item = history.find(h => h.id === id);
    if (!item) return;

    const data = item.data;
    document.getElementById('paperProdW').value = data.width || 0;
    document.getElementById('paperProdH').value = data.height || 0;
    document.getElementById('paperQty').value = data.quantity || 0;
    if (data.paperTypeId) document.getElementById('paperType').value = data.paperTypeId;
    if (data.printOptionId) document.getElementById('paperPrintSides').value = data.printOptionId;
    if (data.laminationId) document.getElementById('paperLamination').value = data.laminationId;
    if (data.customerTypeId) document.getElementById('paperCustomerType').value = data.customerTypeId;
    document.getElementById('paperOtherCosts').value = data.extraCost || 0;
    if (document.getElementById('paperNote')) document.getElementById('paperNote').value = item.note || '';

    showSubTab('paper', 'calc', document.querySelector('#paper-calculator .sub-tab'));
    alert('✅ Đã load dữ liệu từ lịch sử!');
}

function loadLabelFromHistory(id) {
    const history = JSON.parse(localStorage.getItem('netprint_history_label') || '[]');
    const item = history.find(h => h.id === id);
    if (!item) return;

    const data = item.data;
    document.getElementById('labelW').value = data.width || 0;
    document.getElementById('labelH').value = data.height || 0;
    document.getElementById('labelQty').value = data.quantity || 0;
    if (data.decalTypeId) document.getElementById('labelDecalType').value = data.decalTypeId;
    if (data.laminationId) document.getElementById('labelLamination').value = data.laminationId;
    if (data.customerTypeId) document.getElementById('labelCustomerType').value = data.customerTypeId;

    showSubTab('label', 'calc', document.querySelector('#label-calculator .sub-tab'));
    alert('✅ Đã load dữ liệu từ lịch sử!');
}

function loadCatalogueFromHistory(id) {
    const history = JSON.parse(localStorage.getItem('netprint_history_catalogue') || '[]');
    const item = history.find(h => h.id === id);
    if (!item) return;

    const data = item.data;
    if (document.getElementById('cataloguePages')) document.getElementById('cataloguePages').value = data.pages || 0;
    document.getElementById('catalogueQty').value = data.quantity || 0;
    if (data.customerTypeId) document.getElementById('catalogueCustomerType').value = data.customerTypeId;

    showSubTab('catalogue', 'calc', document.querySelector('#catalogue-calculator .sub-tab'));
    alert('✅ Đã load dữ liệu từ lịch sử!');
}

function loadOffsetFromHistory(id) {
    const history = JSON.parse(localStorage.getItem('netprint_history_offset') || '[]');
    const item = history.find(h => h.id === id);
    if (!item) return;

    const data = item.data;
    if (document.getElementById('offsetProdW')) document.getElementById('offsetProdW').value = data.width || 0;
    if (document.getElementById('offsetProdH')) document.getElementById('offsetProdH').value = data.height || 0;
    if (document.getElementById('offsetQty')) document.getElementById('offsetQty').value = data.quantity || 0;
    if (data.stockSizeId && document.getElementById('offsetStockSize')) document.getElementById('offsetStockSize').value = data.stockSizeId;
    if (data.customerTypeId && document.getElementById('offsetCustomerType')) document.getElementById('offsetCustomerType').value = data.customerTypeId;

    showSubTab('offset', 'calc', document.querySelector('#offset-calculator .sub-tab'));
    alert('✅ Đã load dữ liệu từ lịch sử!');
}

// ===== HISTORY TO QUOTE CONVERSION =====
function convertHistoryToQuote(type, historyId) {
    const history = JSON.parse(localStorage.getItem(`netprint_history_${type}`) || '[]');
    const item = history.find(h => h.id === historyId);
    if (!item) return alert('⚠️ Không tìm thấy lịch sử!');

    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
        return alert('⚠️ Chỉ Admin mới có thể tạo báo giá!');
    }

    // Switch to CRM tab
    const crmTab = document.querySelector('[data-tab="crm"]');
    if (crmTab) crmTab.click();

    // Wait for tab to load
    setTimeout(() => {
        showCRMTab('quotes');
        setTimeout(() => {
            showAddQuoteModal();

            // Fill quote form with DETAILED history data
            const data = item.data;
            const productTypeMap = {
                'paper': 'In Giấy',
                'label': 'In Tem Nhãn Decal',
                'catalogue': 'In Catalogue',
                'offset': 'In Offset'
            };

            // Build detailed description from history data
            let description = item.note || '';

            // Add detailed specs based on type
            if (type === 'paper') {
                description += `\n📐 Kích thước SP: ${data.productSize || (data.width || 0) + '×' + (data.height || 0) + 'mm'}`;
                description += `\n📝 Loại giấy: ${data.paperTypeName || ''}`;
                description += `\n🖨️ In: ${data.printOptionName || ''}`;
                if (data.laminationName && data.laminationName !== 'Không' && data.laminationName !== 'Không cán màng') {
                    description += `\n✨ Cán màng: ${data.laminationName}`;
                }
                if (data.processingNames && data.processingNames !== 'Không') {
                    description += `\n✂️ Gia công: ${data.processingNames}`;
                }
            } else if (type === 'label') {
                description += `\n📐 Kích thước tem: ${data.width || 0}×${data.height || 0}mm`;
                description += `\n📄 Loại decal: ${data.decalTypeName || ''}`;
                if (data.laminationName && data.laminationName !== 'Không cán màng') {
                    description += `\n✨ Cán màng: ${data.laminationName}`;
                }
            } else if (type === 'catalogue') {
                description += `\n📖 Số trang: ${data.pages || 0}`;
                description += `\n📄 Giấy ruột: ${data.paperTypeName || ''}`;
                description += `\n📄 Giấy bìa: ${data.coverPaperTypeName || ''}`;
                if (data.bindingName) {
                    description += `\n📚 Đóng gáy: ${data.bindingName}`;
                }
            } else if (type === 'offset') {
                description += `\n📐 Kích thước: ${data.width || 0}×${data.height || 0}mm`;
                description += `\n📄 Khổ giấy: ${data.stockSizeName || ''}`;
                description += `\n📝 Loại giấy: ${data.paperTypeName || ''}`;
                description += `\n🖨️ In: ${data.printOptionName || ''}`;
            }

            description += `\n👥 Loại KH: ${data.customerTypeName || ''}`;
            description += `\n💰 Tổng tiền: ${formatMoney(data.totalPrice || data.totalSell || 0)}`;

            document.getElementById('quoteProductType').value = productTypeMap[type] || type;
            document.getElementById('quoteDescription').value = description.trim();
            document.getElementById('quoteQuantity').value = data.quantity || 0;
            const unitPrice = Math.round((data.totalPrice || data.totalSell || 0) / (data.quantity || 1));
            document.getElementById('quoteUnitPrice').value = unitPrice;
            updateQuoteForm();

            alert('✅ Đã chuyển sang form báo giá với đầy đủ thông tin!\nVui lòng chọn khách hàng và kiểm tra lại.');
        }, 300);
    }, 300);
}

// ===== CRM SYSTEM =====

// CRM Data Storage
let CRM_DATA = {
    customers: [],
    quotes: [],
    orders: []
};

// Load CRM Data
function loadCRMData() {
    const saved = localStorage.getItem('netprint_crm_data');
    if (saved) {
        CRM_DATA = JSON.parse(saved);
    }
}

// Save CRM Data
function saveCRMData() {
    localStorage.setItem('netprint_crm_data', JSON.stringify(CRM_DATA));
}

// ===== CRM TAB SWITCHING =====
function showCRMTab(tabName, button) {
    // Hide all sub-contents
    document.querySelectorAll('#crm .sub-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active from all sub-tabs
    document.querySelectorAll('#crm .sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected content
    const selectedContent = document.getElementById(`crm-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // Add active to clicked tab
    if (button) {
        button.classList.add('active');
    }

    // Load data for the tab
    if (tabName === 'customers') renderCustomers();
    if (tabName === 'quotes') renderQuotes();
    if (tabName === 'orders') renderOrders();
    if (tabName === 'stats') renderStats();
}

// ===== CUSTOMERS MANAGEMENT =====
let editingCustomerId = null;

function showAddCustomerModal() {
    editingCustomerId = null;
    document.getElementById('customerModalTitle').textContent = '➕ Thêm Khách Hàng';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerType').value = 'Khách lẻ';
    document.getElementById('customerNote').value = '';
    document.getElementById('customerModal').style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function saveCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const type = document.getElementById('customerType').value;
    const note = document.getElementById('customerNote').value.trim();

    if (!name) return alert('⚠️ Vui lòng nhập tên khách hàng!');
    if (!phone) return alert('⚠️ Vui lòng nhập số điện thoại!');

    const customer = {
        id: editingCustomerId || Date.now(),
        code: editingCustomerId ? CRM_DATA.customers.find(c => c.id === editingCustomerId).code : `KH${Date.now().toString().slice(-6)}`,
        name,
        phone,
        email,
        address,
        type,
        note,
        totalOrders: editingCustomerId ? CRM_DATA.customers.find(c => c.id === editingCustomerId).totalOrders : 0,
        totalRevenue: editingCustomerId ? CRM_DATA.customers.find(c => c.id === editingCustomerId).totalRevenue : 0,
        createdAt: editingCustomerId ? CRM_DATA.customers.find(c => c.id === editingCustomerId).createdAt : new Date().toISOString()
    };

    if (editingCustomerId) {
        const index = CRM_DATA.customers.findIndex(c => c.id === editingCustomerId);
        CRM_DATA.customers[index] = customer;
    } else {
        CRM_DATA.customers.push(customer);
    }

    saveCRMData();
    renderCustomers();
    closeCustomerModal();
    alert('✅ Đã lưu khách hàng thành công!');
}

function renderCustomers() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (CRM_DATA.customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">Chưa có khách hàng. Nhấn "Thêm Khách Hàng" để bắt đầu.</td></tr>';
        return;
    }

    tbody.innerHTML = CRM_DATA.customers.map(customer => `
        <tr>
            <td><strong>${customer.code}</strong></td>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || '-'}</td>
            <td><span class="status-badge ${customer.type === 'Đại lí' ? 'status-approved' : customer.type === 'Doanh nghiệp' ? 'status-processing' : 'status-pending'}">${customer.type}</span></td>
            <td>${customer.totalOrders}</td>
            <td><strong>${formatMoney(customer.totalRevenue)}</strong></td>
            <td>
                <div class="table-actions">
                    <button class="btn-table btn-view" onclick="viewCustomer(${customer.id})" title="Xem chi tiết">👁️</button>
                    <button class="btn-table btn-edit" onclick="editCustomer(${customer.id})" title="Sửa">✏️</button>
                    <button class="btn-table btn-delete" onclick="deleteCustomer(${customer.id})" title="Xóa">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editCustomer(id) {
    const customer = CRM_DATA.customers.find(c => c.id === id);
    if (!customer) return;

    editingCustomerId = id;
    document.getElementById('customerModalTitle').textContent = '✏️ Sửa Khách Hàng';
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerType').value = customer.type;
    document.getElementById('customerNote').value = customer.note || '';
    document.getElementById('customerModal').style.display = 'flex';
}

function deleteCustomer(id) {
    if (!confirm('Xóa khách hàng này?')) return;

    CRM_DATA.customers = CRM_DATA.customers.filter(c => c.id !== id);
    saveCRMData();
    renderCustomers();
    alert('✅ Đã xóa khách hàng!');
}

function viewCustomer(id) {
    const customer = CRM_DATA.customers.find(c => c.id === id);
    if (!customer) return;

    const customerOrders = CRM_DATA.orders.filter(o => o.customerId === id);

    const content = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
            <h3>📋 Thông Tin</h3>
            <p><strong>Mã:</strong> ${customer.code}</p>
            <p><strong>Tên:</strong> ${customer.name}</p>
            <p><strong>SĐT:</strong> ${customer.phone}</p>
            <p><strong>Email:</strong> ${customer.email || '-'}</p>
            <p><strong>Loại:</strong> ${customer.type}</p>
            <p><strong>Tổng đơn:</strong> ${customer.totalOrders}</p>
            <p><strong>Doanh thu:</strong> <strong style="color: #27ae60;">${formatMoney(customer.totalRevenue)}</strong></p>
        </div>
    `;

    document.getElementById('customerDetailContent').innerHTML = content;
    document.getElementById('customerDetailModal').style.display = 'flex';
}

function closeCustomerDetailModal() {
    document.getElementById('customerDetailModal').style.display = 'none';
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const typeFilter = document.getElementById('customerTypeFilter').value;

    const rows = document.querySelectorAll('#customersTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchSearch = text.includes(searchTerm);
        const matchType = !typeFilter || text.includes(typeFilter.toLowerCase());

        row.style.display = matchSearch && matchType ? '' : 'none';
    });
}

// ===== QUOTES MANAGEMENT =====
function showAddQuoteModal() {
    // Populate customer dropdown
    const customerSelect = document.getElementById('quoteCustomer');
    customerSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>' +
        CRM_DATA.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');

    document.getElementById('quoteProductType').value = '';
    document.getElementById('quoteDescription').value = '';
    document.getElementById('quoteQuantity').value = '';
    document.getElementById('quoteUnitPrice').value = '';
    document.getElementById('quoteTotalPrice').value = '';
    document.getElementById('quoteNote').value = '';

    document.getElementById('quoteModal').style.display = 'flex';
}

function closeQuoteModal() {
    document.getElementById('quoteModal').style.display = 'none';
}

function updateQuoteForm() {
    const qty = parseFloat(document.getElementById('quoteQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('quoteUnitPrice').value) || 0;
    document.getElementById('quoteTotalPrice').value = qty * unitPrice;
}

function saveQuote() {
    const customerId = parseInt(document.getElementById('quoteCustomer').value);
    const productType = document.getElementById('quoteProductType').value;
    const description = document.getElementById('quoteDescription').value.trim();
    const quantity = parseInt(document.getElementById('quoteQuantity').value);
    const unitPrice = parseFloat(document.getElementById('quoteUnitPrice').value);
    const totalPrice = parseFloat(document.getElementById('quoteTotalPrice').value);
    const note = document.getElementById('quoteNote').value.trim();

    if (!customerId) return alert('⚠️ Vui lòng chọn khách hàng!');
    if (!productType) return alert('⚠️ Vui lòng chọn loại sản phẩm!');
    if (!description) return alert('⚠️ Vui lòng nhập mô tả sản phẩm!');
    if (!quantity || quantity <= 0) return alert('⚠️ Vui lòng nhập số lượng hợp lệ!');
    if (!unitPrice || unitPrice <= 0) return alert('⚠️ Vui lòng nhập đơn giá hợp lệ!');

    const customer = CRM_DATA.customers.find(c => c.id === customerId);

    const quote = {
        id: Date.now(),
        code: `BG${Date.now().toString().slice(-6)}`,
        customerId,
        customerName: customer.name,
        productType,
        description,
        quantity,
        unitPrice,
        totalPrice,
        status: 'Chờ duyệt',
        note,
        createdAt: new Date().toISOString()
    };

    CRM_DATA.quotes.push(quote);
    saveCRMData();
    renderQuotes();
    closeQuoteModal();
    alert('✅ Đã tạo báo giá thành công!');
}

function renderQuotes() {
    const tbody = document.getElementById('quotesTableBody');
    if (!tbody) return;

    if (CRM_DATA.quotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">Chưa có báo giá.</td></tr>';
        return;
    }

    tbody.innerHTML = CRM_DATA.quotes.map(quote => `
        <tr>
            <td><strong>${quote.code}</strong></td>
            <td>${new Date(quote.createdAt).toLocaleDateString('vi-VN')}</td>
            <td>${quote.customerName}</td>
            <td>${quote.description.substring(0, 30)}...</td>
            <td>${quote.quantity.toLocaleString('vi-VN')}</td>
            <td><strong>${formatMoney(quote.totalPrice)}</strong></td>
            <td><span class="status-badge status-${quote.status === 'Đã duyệt' ? 'approved' : quote.status === 'Đã hủy' ? 'cancelled' : 'pending'}">${quote.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-table btn-edit" onclick="convertQuoteToOrder(${quote.id})" title="Chuyển sang Đơn hàng">📦</button>
                    <button class="btn-table btn-delete" onclick="deleteQuote(${quote.id})" title="Xóa">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteQuote(id) {
    if (!confirm('Xóa báo giá này?')) return;

    CRM_DATA.quotes = CRM_DATA.quotes.filter(q => q.id !== id);
    saveCRMData();
    renderQuotes();
    alert('✅ Đã xóa báo giá!');
}

function filterQuotes() {
    const searchTerm = document.getElementById('quoteSearch').value.toLowerCase();
    const statusFilter = document.getElementById('quoteStatusFilter').value;

    const rows = document.querySelectorAll('#quotesTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchSearch = text.includes(searchTerm);
        const matchStatus = !statusFilter || text.includes(statusFilter.toLowerCase());

        row.style.display = matchSearch && matchStatus ? '' : 'none';
    });
}

// ===== CONVERT QUOTE TO ORDER =====
function convertQuoteToOrder(quoteId) {
    const quote = CRM_DATA.quotes.find(q => q.id === quoteId);
    if (!quote) return alert('⚠️ Không tìm thấy báo giá!');

    showCRMTab('orders');
    setTimeout(() => {
        showAddOrderModal();

        // Fill order form with quote data
        document.getElementById('orderCustomer').value = quote.customerId;
        document.getElementById('orderProductType').value = quote.productType;
        document.getElementById('orderDescription').value = quote.description;
        document.getElementById('orderQuantity').value = quote.quantity;
        document.getElementById('orderTotalPrice').value = quote.totalPrice;
        document.getElementById('orderNote').value = quote.note || '';

        alert('✅ Đã chuyển sang form đơn hàng!');
    }, 300);
}

// ===== ORDERS MANAGEMENT =====
function showAddOrderModal() {
    // Populate customer dropdown
    const customerSelect = document.getElementById('orderCustomer');
    customerSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>' +
        CRM_DATA.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');

    document.getElementById('orderProductType').value = '';
    document.getElementById('orderDescription').value = '';
    document.getElementById('orderQuantity').value = '';
    document.getElementById('orderTotalPrice').value = '';
    document.getElementById('orderDeliveryDate').value = '';
    document.getElementById('orderStatus').value = 'Chờ xử lý';
    document.getElementById('orderNote').value = '';

    document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function saveOrder() {
    const customerId = parseInt(document.getElementById('orderCustomer').value);
    const productType = document.getElementById('orderProductType').value;
    const description = document.getElementById('orderDescription').value.trim();
    const quantity = parseInt(document.getElementById('orderQuantity').value);
    const totalPrice = parseFloat(document.getElementById('orderTotalPrice').value);
    const deliveryDate = document.getElementById('orderDeliveryDate').value;
    const status = document.getElementById('orderStatus').value;
    const note = document.getElementById('orderNote').value.trim();

    if (!customerId) return alert('⚠️ Vui lòng chọn khách hàng!');
    if (!productType) return alert('⚠️ Vui lòng chọn loại sản phẩm!');
    if (!description) return alert('⚠️ Vui lòng nhập mô tả sản phẩm!');
    if (!quantity || quantity <= 0) return alert('⚠️ Vui lòng nhập số lượng hợp lệ!');
    if (!totalPrice || totalPrice <= 0) return alert('⚠️ Vui lòng nhập tổng tiền hợp lệ!');

    const customer = CRM_DATA.customers.find(c => c.id === customerId);

    const order = {
        id: Date.now(),
        code: `DH${Date.now().toString().slice(-6)}`,
        customerId,
        customerName: customer.name,
        productType,
        description,
        quantity,
        totalPrice,
        deliveryDate,
        status,
        note,
        createdAt: new Date().toISOString()
    };

    CRM_DATA.orders.push(order);

    // Update customer stats
    customer.totalOrders++;
    customer.totalRevenue += totalPrice;

    saveCRMData();
    renderOrders();
    renderCustomers();
    closeOrderModal();
    alert('✅ Đã tạo đơn hàng thành công!');
}

function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (CRM_DATA.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">Chưa có đơn hàng.</td></tr>';
        return;
    }

    tbody.innerHTML = CRM_DATA.orders.map(order => `
        <tr>
            <td><strong>${order.code}</strong></td>
            <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
            <td>${order.customerName}</td>
            <td>${order.description.substring(0, 30)}...</td>
            <td>${order.quantity.toLocaleString('vi-VN')}</td>
            <td><strong>${formatMoney(order.totalPrice)}</strong></td>
            <td><span class="status-badge status-${order.status === 'Hoàn thành' ? 'completed' : order.status === 'Đang in' ? 'processing' : order.status === 'Đã hủy' ? 'cancelled' : 'pending'}">${order.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-table btn-edit" onclick="changeOrderStatus(${order.id})" title="Đổi trạng thái">🔄</button>
                    <button class="btn-table btn-delete" onclick="deleteOrder(${order.id})" title="Xóa">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function changeOrderStatus(id) {
    const order = CRM_DATA.orders.find(o => o.id === id);
    if (!order) return;

    const newStatus = prompt('Chọn trạng thái:\n1. Chờ xử lý\n2. Đang in\n3. Hoàn thành\n4. Đã hủy', '2');
    if (!newStatus) return;

    const statusMap = { '1': 'Chờ xử lý', '2': 'Đang in', '3': 'Hoàn thành', '4': 'Đã hủy' };
    order.status = statusMap[newStatus] || 'Chờ xử lý';

    saveCRMData();
    renderOrders();
}

function deleteOrder(id) {
    if (!confirm('Xóa đơn hàng này?')) return;

    const order = CRM_DATA.orders.find(o => o.id === id);
    if (order) {
        const customer = CRM_DATA.customers.find(c => c.id === order.customerId);
        if (customer) {
            customer.totalOrders--;
            customer.totalRevenue -= order.totalPrice;
        }
    }

    CRM_DATA.orders = CRM_DATA.orders.filter(o => o.id !== id);
    saveCRMData();
    renderOrders();
    renderCustomers();
    alert('✅ Đã xóa đơn hàng!');
}

function filterOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const statusFilter = document.getElementById('orderStatusFilter').value;

    const rows = document.querySelectorAll('#ordersTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchSearch = text.includes(searchTerm);
        const matchStatus = !statusFilter || text.includes(statusFilter.toLowerCase());

        row.style.display = matchSearch && matchStatus ? '' : 'none';
    });
}

// ===== STATISTICS =====
function renderStats() {
    document.getElementById('totalCustomers').textContent = CRM_DATA.customers.length;
    document.getElementById('totalQuotes').textContent = CRM_DATA.quotes.length;
    document.getElementById('totalOrders').textContent = CRM_DATA.orders.length;

    const totalRevenue = CRM_DATA.orders.reduce((sum, order) => sum + order.totalPrice, 0);
    document.getElementById('totalRevenue').textContent = formatMoney(totalRevenue);

    const topCustomers = [...CRM_DATA.customers]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

    const topCustomersBody = document.getElementById('topCustomersBody');
    if (topCustomersBody) {
        if (topCustomers.length === 0) {
            topCustomersBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Chưa có dữ liệu</td></tr>';
        } else {
            topCustomersBody.innerHTML = topCustomers.map((customer, index) => `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>${customer.name}</td>
                    <td>${customer.totalOrders}</td>
                    <td><strong>${formatMoney(customer.totalRevenue)}</strong></td>
                </tr>
            `).join('');
        }
    }
}

// ===== EXTRA COSTS MANAGEMENT =====
let paperExtraCosts = [];
let labelExtraCosts = [];
let catalogueExtraCosts = [];
let offsetExtraCosts = [];

// Catalogue Paper Management
let catalogueCoverPapers = [];
let catalogueInnerPapers = [];

// Paper Extra Costs
function addPaperExtraCost() {
    const id = Date.now();
    paperExtraCosts.push({ id, name: '', amount: 0 });
    renderPaperExtraCosts();
}

function removePaperExtraCost(id) {
    paperExtraCosts = paperExtraCosts.filter(c => c.id !== id);
    renderPaperExtraCosts();
}

function updatePaperExtraCost(id, field, value) {
    const cost = paperExtraCosts.find(c => c.id === id);
    if (cost) {
        cost[field] = field === 'amount' ? parseFloat(value) || 0 : value;
    }
}

// Tự động điền giá tiền khi chọn từ gợi ý
function autoFillCostAmount(id, name) {
    if (!name) return;

    // Tìm trong datalist
    const datalist = document.getElementById('costNameSuggestions');
    if (!datalist) return;

    const options = datalist.querySelectorAll('option');
    for (let option of options) {
        if (option.value === name && option.dataset.amount) {
            const amount = parseInt(option.dataset.amount);
            const cost = paperExtraCosts.find(c => c.id === id);
            if (cost) {
                // Tự động điền giá tiền
                cost.amount = amount;
                // Tìm input amount trong cùng extra-cost-item
                const container = document.getElementById('paperExtraCosts');
                if (container) {
                    const costItems = container.querySelectorAll('.extra-cost-item');
                    costItems.forEach(item => {
                        const nameInput = item.querySelector('input[type="text"]');
                        const amountInput = item.querySelector('input[type="number"]');
                        if (nameInput && nameInput.value === name && amountInput) {
                            amountInput.value = amount;
                        }
                    });
                }
            }
            break;
        }
    }
}

function renderPaperExtraCosts() {
    const container = document.getElementById('paperExtraCosts');
    if (!container) return;

    if (paperExtraCosts.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = paperExtraCosts.map(cost => `
        <div class="extra-cost-item">
            <input type="text" placeholder="Tên chi phí" value="${cost.name}" 
                   list="costNameSuggestions"
                   oninput="updatePaperExtraCost(${cost.id}, 'name', this.value)"
                   onchange="autoFillCostAmount(${cost.id}, this.value)">
            <input type="number" placeholder="Số tiền" value="${cost.amount}" 
                   oninput="updatePaperExtraCost(${cost.id}, 'amount', this.value)">
            <button class="btn-remove" onclick="removePaperExtraCost(${cost.id})" title="Xóa">🗑</button>
        </div>
    `).join('');
}

function getTotalPaperExtraCosts() {
    return paperExtraCosts.reduce((sum, cost) => sum + cost.amount, 0);
}

// Label Extra Costs
function addLabelExtraCost() {
    const id = Date.now();
    labelExtraCosts.push({ id, name: '', amount: 0 });
    renderLabelExtraCosts();
}

function removeLabelExtraCost(id) {
    labelExtraCosts = labelExtraCosts.filter(c => c.id !== id);
    renderLabelExtraCosts();
}

function updateLabelExtraCost(id, field, value) {
    const cost = labelExtraCosts.find(c => c.id === id);
    if (cost) {
        cost[field] = field === 'amount' ? parseFloat(value) || 0 : value;
    }
}

function renderLabelExtraCosts() {
    const container = document.getElementById('labelExtraCosts');
    if (!container) return;

    if (labelExtraCosts.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = labelExtraCosts.map(cost => `
        <div class="extra-cost-item">
            <input type="text" placeholder="Tên chi phí" value="${cost.name}" 
                   oninput="updateLabelExtraCost(${cost.id}, 'name', this.value)">
            <input type="number" placeholder="Số tiền" value="${cost.amount}" 
                   oninput="updateLabelExtraCost(${cost.id}, 'amount', this.value)">
            <button class="btn-remove" onclick="removeLabelExtraCost(${cost.id})" title="Xóa">🗑</button>
        </div>
    `).join('');
}

function getTotalLabelExtraCosts() {
    return labelExtraCosts.reduce((sum, cost) => sum + cost.amount, 0);
}

// Catalogue Extra Costs
function addCatalogueExtraCost() {
    const id = Date.now();
    catalogueExtraCosts.push({ id, name: '', amount: 0 });
    renderCatalogueExtraCosts();
}

function removeCatalogueExtraCost(id) {
    catalogueExtraCosts = catalogueExtraCosts.filter(c => c.id !== id);
    renderCatalogueExtraCosts();
}

function updateCatalogueExtraCost(id, field, value) {
    const cost = catalogueExtraCosts.find(c => c.id === id);
    if (cost) {
        cost[field] = field === 'amount' ? parseFloat(value) || 0 : value;
    }
}

function renderCatalogueExtraCosts() {
    const container = document.getElementById('catalogueExtraCosts');
    if (!container) return;

    if (catalogueExtraCosts.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = catalogueExtraCosts.map(cost => `
        <div class="extra-cost-item">
            <input type="text" placeholder="Tên chi phí" value="${cost.name}" 
                   list="costNameSuggestions"
                   oninput="updateCatalogueExtraCost(${cost.id}, 'name', this.value)"
                   onchange="autoFillCatalogueCostAmount(${cost.id}, this.value)">
            <input type="number" placeholder="Số tiền" value="${cost.amount}" 
                   oninput="updateCatalogueExtraCost(${cost.id}, 'amount', this.value)">
            <button class="btn-remove" onclick="removeCatalogueExtraCost(${cost.id})" title="Xóa">🗑</button>
        </div>
    `).join('');
}

function autoFillCatalogueCostAmount(id, name) {
    if (!name) return;

    const datalist = document.getElementById('costNameSuggestions');
    if (!datalist) return;

    const options = datalist.querySelectorAll('option');
    for (let option of options) {
        if (option.value === name && option.dataset.amount) {
            const amount = parseInt(option.dataset.amount);
            const cost = catalogueExtraCosts.find(c => c.id === id);
            if (cost) {
                cost.amount = amount;
                const container = document.getElementById('catalogueExtraCosts');
                if (container) {
                    const costItems = container.querySelectorAll('.extra-cost-item');
                    costItems.forEach(item => {
                        const nameInput = item.querySelector('input[type="text"]');
                        const amountInput = item.querySelector('input[type="number"]');
                        if (nameInput && nameInput.value === name && amountInput) {
                            amountInput.value = amount;
                        }
                    });
                }
            }
            break;
        }
    }
}

function addCatalogueDeliverySuggestion() {
    const select = document.getElementById('catalogueDeliverySuggestions');
    const selectedValue = select.value;

    if (!selectedValue) return;

    const [name, amount] = selectedValue.split('|');
    const cost = parseInt(amount);

    // Thêm vào danh sách chi phí khác
    catalogueExtraCosts.push({
        id: Date.now(),
        name: name,
        amount: cost
    });

    // Reset dropdown
    select.value = '';

    // Cập nhật hiển thị
    renderCatalogueExtraCosts();

    // Thông báo
    showNotification(`✅ Đã thêm ${name}: ${formatMoney(cost)}`);
}

function toggleCatalogueCostDetail() {
    const section = document.getElementById('catalogueCostDetailSection');
    const summarySection = document.getElementById('catalogueCostSummarySection');
    const toggleIcon = document.getElementById('catalogueCostDetailToggleIcon');
    const toggleText = document.getElementById('catalogueCostDetailToggleText');

    if (!section || !summarySection) return;

    const isHidden = section.style.display === 'none';

    if (isHidden) {
        section.style.display = 'grid';
        summarySection.style.display = 'flex';
        if (toggleIcon) toggleIcon.textContent = '👁️';
        if (toggleText) toggleText.textContent = 'Ẩn chi tiết';
    } else {
        section.style.display = 'none';
        summarySection.style.display = 'none';
        if (toggleIcon) toggleIcon.textContent = '👁️‍🗨️';
        if (toggleText) toggleText.textContent = 'Hiện chi tiết';
    }
}

function getTotalCatalogueExtraCosts() {
    return catalogueExtraCosts.reduce((sum, cost) => sum + cost.amount, 0);
}

// ===== CATALOGUE SHEETS CALCULATION =====
function updateCatalogueSheets() {
    const pagesEl = document.getElementById('cataloguePages');
    const qtyEl = document.getElementById('catalogueQty');

    // Guard clause - nếu elements chưa tồn tại thì return
    if (!pagesEl || !qtyEl) return;

    const pages = parseInt(pagesEl.value) || 8;
    const qty = parseInt(qtyEl.value) || 0;

    // Lấy kích thước Catalogue
    const catalogueSizeSelect = document.getElementById('catalogueSize');
    const catalogueSize = catalogueSizeSelect ? catalogueSizeSelect.value : 'A4';

    let catalogueW = 0, catalogueH = 0;

    if (catalogueSize === 'custom') {
        catalogueW = parseFloat(document.getElementById('catalogueCustomWidth')?.value) || 0;
        catalogueH = parseFloat(document.getElementById('catalogueCustomHeight')?.value) || 0;
    } else {
        // Định nghĩa kích thước Catalogue chuẩn (mm)
        const catalogueDimensions = {
            'A4': { w: 210, h: 297 },
            'A5': { w: 148, h: 210 },
            'A3': { w: 297, h: 420 }
        };
        const dim = catalogueDimensions[catalogueSize];
        if (dim) {
            catalogueW = dim.w;
            catalogueH = dim.h;
        }
    }

    // Lấy khổ giấy in
    const paperSizeSelect = document.getElementById('cataloguePaperSize');
    const paperSizeId = paperSizeSelect ? parseInt(paperSizeSelect.value) : null;

    if (!paperSizeId || catalogueW <= 0 || catalogueH <= 0) {
        // Nếu chưa có đủ thông tin, dùng công thức cũ
        const coverSheetsPerBook = 1;
        const innerPages = Math.max(0, pages - 4);
        const innerSheetsPerBook = Math.ceil(innerPages / 4);
        const totalCoverSheets = coverSheetsPerBook * qty;
        const totalInnerSheets = innerSheetsPerBook * qty;

        updateCatalogueSheetsDisplay(coverSheetsPerBook, innerSheetsPerBook, totalCoverSheets, totalInnerSheets, qty);
        return;
    }

    // Tìm khổ giấy in
    const paperSize = PAPER_SETTINGS.printSizes.find(s => s.id === paperSizeId);
    if (!paperSize) {
        updateCatalogueSheetsDisplay(1, Math.ceil((pages - 4) / 4), qty, Math.ceil((pages - 4) / 4) * qty, qty);
        return;
    }

    const stockW = paperSize.w;
    const stockH = paperSize.h;

    // Lề cắt tối thiểu (mm)
    const margin = 5;
    const spacing = 0; // Không có spacing giữa các bìa/ruột khi in catalogue

    // ===== TÍNH SỐ TỜ BÌA =====
    // Bìa: 1 cuốn cần 2 mặt bìa (trước + sau)
    // Kích thước 1 mặt bìa = kích thước Catalogue
    // Tính imposition: 1 tờ giấy in được bao nhiêu mặt bìa
    const coverImposition = calculateImposition(
        catalogueW,  // Chiều rộng 1 mặt bìa
        catalogueH,  // Chiều cao 1 mặt bìa
        stockW,      // Chiều rộng khổ giấy in
        stockH,      // Chiều cao khổ giấy in
        0,           // Bleed = 0
        margin,      // Lề
        spacing,     // Spacing
        true         // Cho phép xoay
    );

    // Số mặt bìa in được trên 1 tờ giấy
    const coverFacesPerSheet = coverImposition.total || 1;

    // 1 cuốn cần 2 mặt bìa (trước + sau)
    // Số tờ giấy cần cho 1 cuốn = 2 mặt / số mặt in được trên 1 tờ
    const coverSheetsPerBook = 2 / coverFacesPerSheet;

    // Tính tổng số mặt bìa cần cho tất cả cuốn
    const totalCoverFaces = 2 * qty;
    // Tính tổng số tờ giấy in cần = tổng số mặt / số mặt in được trên 1 tờ
    const totalCoverSheets = totalCoverFaces / coverFacesPerSheet;

    // ===== TÍNH SỐ TỜ RUỘT =====
    // Ruột: số trang ruột = tổng trang - 4 (bìa)
    const innerPages = Math.max(0, pages - 4);

    // Số tờ ruột cần cho 1 cuốn (mỗi tờ ruột = 4 trang: 2 mặt × 2 trang/mặt)
    const innerSheetsNeededPerBook = Math.ceil(innerPages / 4);

    if (innerSheetsNeededPerBook > 0) {
        // Tính imposition cho 1 tờ ruột (kích thước = kích thước Catalogue)
        // 1 tờ ruột = kích thước Catalogue (khi in 2 mặt, mỗi mặt = kích thước Catalogue)
        const innerImposition = calculateImposition(
            catalogueW,  // Chiều rộng 1 tờ ruột
            catalogueH,  // Chiều cao 1 tờ ruột
            stockW,      // Chiều rộng khổ giấy in
            stockH,      // Chiều cao khổ giấy in
            0,           // Bleed = 0
            margin,      // Lề
            spacing,     // Spacing
            true         // Cho phép xoay
        );

        // Số tờ ruột in được trên 1 tờ giấy
        const innerSheetsPerPaperSheet = innerImposition.total || 1;

        // Số tờ giấy in cần cho 1 cuốn = số tờ ruột cần / số tờ ruột in được trên 1 tờ giấy
        const innerSheetsPerBook = innerSheetsNeededPerBook / innerSheetsPerPaperSheet;

        // Tính tổng số tờ ruột cần cho tất cả cuốn
        const totalInnerSheetsNeeded = innerSheetsNeededPerBook * qty;
        // Tính tổng số tờ giấy in cần = tổng số tờ ruột / số tờ ruột in được trên 1 tờ
        const totalInnerSheets = totalInnerSheetsNeeded / innerSheetsPerPaperSheet;

        // Hiển thị (làm tròn đến 2 chữ số thập phân)
        updateCatalogueSheetsDisplay(
            Math.round(coverSheetsPerBook * 100) / 100,
            Math.round(innerSheetsPerBook * 100) / 100,
            Math.round(totalCoverSheets * 100) / 100,
            Math.round(totalInnerSheets * 100) / 100,
            qty
        );
    } else {
        // Không có ruột
        updateCatalogueSheetsDisplay(
            Math.round(coverSheetsPerBook * 100) / 100,
            0,
            Math.round(totalCoverSheets * 100) / 100,
            0,
            qty
        );
    }
}

/**
 * Validation cho Catalogue inputs
 */
function validateCatalogueInputs() {
    const pages = parseInt(document.getElementById('cataloguePages')?.value) || 0;
    const qty = parseInt(document.getElementById('catalogueQty')?.value) || 0;
    const sizeSelect = document.getElementById('catalogueSize');
    const customWidth = parseFloat(document.getElementById('catalogueCustomWidth')?.value) || 0;
    const customHeight = parseFloat(document.getElementById('catalogueCustomHeight')?.value) || 0;
    const validationMsg = document.getElementById('catalogueValidationMsg');

    if (!validationMsg) return;

    const errors = [];
    const warnings = [];

    // Validate số trang
    if (pages < 4) {
        errors.push('Số trang phải tối thiểu 4 trang');
    } else if (pages % 4 !== 0) {
        warnings.push('Số trang nên là bội số của 4 (4, 8, 12, 16...) để tối ưu');
    }

    // Validate số lượng
    if (qty <= 0) {
        errors.push('Vui lòng nhập số lượng lớn hơn 0');
    }

    // Validate kích thước tự chọn
    if (sizeSelect?.value === 'custom') {
        if (customWidth <= 0 || customHeight <= 0) {
            errors.push('Vui lòng nhập đầy đủ kích thước Catalogue');
        } else if (customWidth < 50 || customHeight < 50) {
            warnings.push('Kích thước Catalogue quá nhỏ (tối thiểu 50mm)');
        } else if (customWidth > 1000 || customHeight > 1000) {
            warnings.push('Kích thước Catalogue quá lớn (tối đa 1000mm)');
        }
    }

    // Hiển thị thông báo
    if (errors.length > 0) {
        validationMsg.className = 'validation-message error';
        validationMsg.innerHTML = '⚠️ ' + errors.join('. ');
        validationMsg.style.display = 'block';
    } else if (warnings.length > 0) {
        validationMsg.className = 'validation-message warning';
        validationMsg.innerHTML = '💡 ' + warnings.join('. ');
        validationMsg.style.display = 'block';
    } else {
        validationMsg.style.display = 'none';
    }

    // Update custom size hint
    if (sizeSelect?.value === 'custom' && customWidth > 0 && customHeight > 0) {
        const hintEl = document.getElementById('catalogueCustomSizeHint');
        if (hintEl) {
            const area = (customWidth * customHeight / 1000000).toFixed(2);
            hintEl.textContent = `Diện tích: ${area} m²`;
            hintEl.style.color = '#2e7d32';
        }
    }
}

/**
 * Tự động tính giá nếu đã có đủ thông tin
 */
function autoCalculateIfReady() {
    const pages = parseInt(document.getElementById('cataloguePages')?.value) || 0;
    const qty = parseInt(document.getElementById('catalogueQty')?.value) || 0;
    const sizeSelect = document.getElementById('catalogueSize');
    const customWidth = parseFloat(document.getElementById('catalogueCustomWidth')?.value) || 0;
    const customHeight = parseFloat(document.getElementById('catalogueCustomHeight')?.value) || 0;

    // Kiểm tra điều kiện
    if (pages < 4 || qty <= 0) return;

    if (sizeSelect?.value === 'custom') {
        if (customWidth <= 0 || customHeight <= 0) return;
    }

    // Kiểm tra xem đã có giấy bìa và ruột chưa
    const coverPapers = document.querySelectorAll('#catalogueCoverPapersList .extra-cost-item');
    const innerPapers = document.querySelectorAll('#catalogueInnerPapersList .extra-cost-item');

    if (coverPapers.length === 0 || innerPapers.length === 0) return;

    // Kiểm tra xem đã chọn đầy đủ chưa
    let hasValidCover = false;
    let hasValidInner = false;

    coverPapers.forEach(item => {
        const paperSelect = item.querySelector('select[data-type="paper"]');
        if (paperSelect && paperSelect.value) hasValidCover = true;
    });

    innerPapers.forEach(item => {
        const paperSelect = item.querySelector('select[data-type="paper"]');
        if (paperSelect && paperSelect.value) hasValidInner = true;
    });

    if (!hasValidCover || !hasValidInner) return;

    // Tự động tính giá (chỉ khi user đã nhập đủ thông tin và chưa có kết quả)
    const resultsEl = document.getElementById('catalogueResults');
    if (resultsEl && resultsEl.style.display === 'none') {
        // Delay một chút để user thấy feedback
        setTimeout(() => {
            calculateCatalogue();
        }, 500);
    }
}

/**
 * Helper function để cập nhật hiển thị số tờ
 */
function updateCatalogueSheetsDisplay(coverSheetsPerBook, innerSheetsPerBook, totalCoverSheets, totalInnerSheets, qty) {
    const coverSheetsPerBookEl = document.getElementById('catalogueCoverSheetsPerBook');
    const innerSheetsPerBookEl = document.getElementById('catalogueInnerSheetsPerBook');
    const totalCoverSheetsEl = document.getElementById('catalogueTotalCoverSheets');
    const totalInnerSheetsEl = document.getElementById('catalogueTotalInnerSheets');

    // Format số: nếu là số thập phân, hiển thị 1-2 chữ số, nếu là số nguyên thì không hiển thị .0
    const formatSheet = (num) => {
        if (num === 0) return '0';
        if (num % 1 === 0) return num.toString();
        return num.toFixed(2).replace(/\.?0+$/, '');
    };

    if (coverSheetsPerBookEl) coverSheetsPerBookEl.textContent = formatSheet(coverSheetsPerBook);
    if (innerSheetsPerBookEl) innerSheetsPerBookEl.textContent = formatSheet(innerSheetsPerBook);
    if (totalCoverSheetsEl) totalCoverSheetsEl.textContent = qty > 0 ? formatSheet(totalCoverSheets) : '0';
    if (totalInnerSheetsEl) totalInnerSheetsEl.textContent = qty > 0 ? formatSheet(totalInnerSheets) : '0';
}

// ===== CATALOGUE PAPER MANAGEMENT =====
function addCatalogueCoverPaper() {
    const id = Date.now();
    catalogueCoverPapers.push({
        id,
        paperId: '',
        printSides: 1,
        laminationId: ''
    });
    renderCatalogueCoverPapers();
}

function removeCatalogueCoverPaper(id) {
    catalogueCoverPapers = catalogueCoverPapers.filter(p => p.id !== id);
    renderCatalogueCoverPapers();
}

function updateCatalogueCoverPaper(id, field, value) {
    const paper = catalogueCoverPapers.find(p => p.id === id);
    if (paper) {
        if (field === 'printSides' || field === 'paperId' || field === 'laminationId') {
            paper[field] = field === 'printSides' ? parseInt(value) || 0 : value;
        }
    }
}

function renderCatalogueCoverPapers() {
    const container = document.getElementById('catalogueCoverPapersList');
    if (!container) return;

    if (catalogueCoverPapers.length === 0) {
        // Thêm mặc định 1 item nếu chưa có
        addCatalogueCoverPaper();
        return;
    }

    // Lấy khổ giấy đã chọn
    const sizeSelect = document.getElementById('cataloguePaperSize');
    const selectedSizeId = sizeSelect ? parseInt(sizeSelect.value) : null;

    // Lấy danh sách loại giấy theo khổ giấy (nếu có), nếu không thì dùng CATALOGUE_SETTINGS.papers
    let availablePapers = [];
    if (selectedSizeId && typeof getPapersBySize === 'function') {
        availablePapers = getPapersBySize(selectedSizeId);
        // Tạo danh sách unique papers (theo tên)
        const uniqueAvailablePapers = [];
        const seenNames = new Set();
        availablePapers.forEach(p => {
            const normalizedName = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
            if (normalizedName && !seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueAvailablePapers.push(p);
            }
        });
        availablePapers = uniqueAvailablePapers;
    } else {
        // Fallback: dùng CATALOGUE_SETTINGS.papers
        availablePapers = CATALOGUE_SETTINGS.papers || [];
    }

    container.innerHTML = catalogueCoverPapers.map(paper => {
        const papersOptions = availablePapers.map(p =>
            `<option value="${p.id}" ${paper.paperId == p.id ? 'selected' : ''}>${p.name}</option>`
        ).join('');

        // Lấy danh sách cán màng theo khổ giấy (nếu có)
        let laminationOptions = '';
        if (selectedSizeId && typeof getLaminationsBySize === 'function') {
            const laminations = getLaminationsBySize(selectedSizeId);
            laminationOptions = laminations.map(l =>
                `<option value="${l.id}" ${paper.laminationId == l.id ? 'selected' : ''}>${l.name}</option>`
            ).join('');
        } else {
            // Fallback: dùng CATALOGUE_SETTINGS.laminations
            laminationOptions = (CATALOGUE_SETTINGS.laminations || []).map(l =>
                `<option value="${l.id}" ${paper.laminationId == l.id ? 'selected' : ''}>${l.name}</option>`
            ).join('');
        }

        return `
            <div class="extra-cost-item" style="grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; align-items: center;">
                <select onchange="updateCatalogueCoverPaper(${paper.id}, 'paperId', this.value)" style="width: 100%;">
                    <option value="">-- Chọn giấy bìa --</option>
                    ${papersOptions}
                </select>
                <select onchange="updateCatalogueCoverPaper(${paper.id}, 'printSides', this.value)" style="width: 100%;">
                    <option value="0" ${paper.printSides == 0 ? 'selected' : ''}>Không in</option>
                    <option value="1" ${paper.printSides == 1 ? 'selected' : ''}>In 1 mặt</option>
                    <option value="2" ${paper.printSides == 2 ? 'selected' : ''}>In 2 mặt</option>
                </select>
                <select onchange="updateCatalogueCoverPaper(${paper.id}, 'laminationId', this.value)" style="width: 100%;">
                    <option value="">-- Chọn cán màng --</option>
                    ${laminationOptions}
                </select>
                <button class="btn-remove" onclick="removeCatalogueCoverPaper(${paper.id})" title="Xóa">🗑</button>
            </div>
        `;
    }).join('');
}

function addCatalogueInnerPaper() {
    const id = Date.now();
    catalogueInnerPapers.push({
        id,
        paperId: '',
        printSides: 1,
        laminationId: ''
    });
    renderCatalogueInnerPapers();
}

function removeCatalogueInnerPaper(id) {
    catalogueInnerPapers = catalogueInnerPapers.filter(p => p.id !== id);
    renderCatalogueInnerPapers();
}

function updateCatalogueInnerPaper(id, field, value) {
    const paper = catalogueInnerPapers.find(p => p.id === id);
    if (paper) {
        if (field === 'printSides' || field === 'paperId' || field === 'laminationId') {
            paper[field] = field === 'printSides' ? parseInt(value) || 0 : value;
        }
    }
}

function renderCatalogueInnerPapers() {
    const container = document.getElementById('catalogueInnerPapersList');
    if (!container) return;

    if (catalogueInnerPapers.length === 0) {
        // Thêm mặc định 1 item nếu chưa có
        addCatalogueInnerPaper();
        return;
    }

    // Lấy khổ giấy đã chọn
    const sizeSelect = document.getElementById('cataloguePaperSize');
    const selectedSizeId = sizeSelect ? parseInt(sizeSelect.value) : null;

    // Lấy danh sách loại giấy theo khổ giấy (nếu có), nếu không thì dùng CATALOGUE_SETTINGS.papers
    let availablePapers = [];
    if (selectedSizeId && typeof getPapersBySize === 'function') {
        availablePapers = getPapersBySize(selectedSizeId);
        // Tạo danh sách unique papers (theo tên)
        const uniqueAvailablePapers = [];
        const seenNames = new Set();
        availablePapers.forEach(p => {
            const normalizedName = (p.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
            if (normalizedName && !seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueAvailablePapers.push(p);
            }
        });
        availablePapers = uniqueAvailablePapers;
    } else {
        // Fallback: dùng CATALOGUE_SETTINGS.papers
        availablePapers = CATALOGUE_SETTINGS.papers || [];
    }

    container.innerHTML = catalogueInnerPapers.map(paper => {
        const papersOptions = availablePapers.map(p =>
            `<option value="${p.id}" ${paper.paperId == p.id ? 'selected' : ''}>${p.name}</option>`
        ).join('');

        // Lấy danh sách cán màng theo khổ giấy (nếu có)
        let laminationOptions = '';
        if (selectedSizeId && typeof getLaminationsBySize === 'function') {
            const laminations = getLaminationsBySize(selectedSizeId);
            laminationOptions = laminations.map(l =>
                `<option value="${l.id}" ${paper.laminationId == l.id ? 'selected' : ''}>${l.name}</option>`
            ).join('');
        } else {
            // Fallback: dùng CATALOGUE_SETTINGS.laminations
            laminationOptions = (CATALOGUE_SETTINGS.laminations || []).map(l =>
                `<option value="${l.id}" ${paper.laminationId == l.id ? 'selected' : ''}>${l.name}</option>`
            ).join('');
        }

        return `
            <div class="extra-cost-item" style="grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; align-items: center;">
                <select onchange="updateCatalogueInnerPaper(${paper.id}, 'paperId', this.value)" style="width: 100%;">
                    <option value="">-- Chọn giấy ruột --</option>
                    ${papersOptions}
                </select>
                <select onchange="updateCatalogueInnerPaper(${paper.id}, 'printSides', this.value)" style="width: 100%;">
                    <option value="0" ${paper.printSides == 0 ? 'selected' : ''}>Không in</option>
                    <option value="1" ${paper.printSides == 1 ? 'selected' : ''}>In 1 mặt</option>
                    <option value="2" ${paper.printSides == 2 ? 'selected' : ''}>In 2 mặt</option>
                </select>
                <select onchange="updateCatalogueInnerPaper(${paper.id}, 'laminationId', this.value)" style="width: 100%;">
                    <option value="">-- Chọn cán màng --</option>
                    ${laminationOptions}
                </select>
                <button class="btn-remove" onclick="removeCatalogueInnerPaper(${paper.id})" title="Xóa">🗑</button>
            </div>
        `;
    }).join('');
}

// Offset Extra Costs
function addOffsetExtraCost() {
    const id = Date.now();
    offsetExtraCosts.push({ id, name: '', amount: 0 });
    renderOffsetExtraCosts();
}

function removeOffsetExtraCost(id) {
    offsetExtraCosts = offsetExtraCosts.filter(c => c.id !== id);
    renderOffsetExtraCosts();
}

function updateOffsetExtraCost(id, field, value) {
    const cost = offsetExtraCosts.find(c => c.id === id);
    if (cost) {
        cost[field] = field === 'amount' ? parseFloat(value) || 0 : value;
    }
}

function renderOffsetExtraCosts() {
    const container = document.getElementById('offsetExtraCosts');
    if (!container) return;

    if (offsetExtraCosts.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = offsetExtraCosts.map(cost => `
        <div class="extra-cost-item">
            <input type="text" placeholder="Tên chi phí" value="${cost.name}" 
                   oninput="updateOffsetExtraCost(${cost.id}, 'name', this.value)">
            <input type="number" placeholder="Số tiền" value="${cost.amount}" 
                   oninput="updateOffsetExtraCost(${cost.id}, 'amount', this.value)">
            <button class="btn-remove" onclick="removeOffsetExtraCost(${cost.id})" title="Xóa">🗑</button>
        </div>
    `).join('');
}

function getTotalOffsetExtraCosts() {
    return offsetExtraCosts.reduce((sum, cost) => sum + cost.amount, 0);
}

// Save paper note to history
function savePaperNote() {
    const noteInput = document.getElementById('paperNote');
    if (!noteInput) return;

    const note = noteInput.value.trim();
    if (!note) {
        alert('⚠️ Vui lòng nhập tên tính giá!');
        return;
    }

    // Show success notification
    showToast('✅ Đã lưu tên tính giá: ' + note);
}

// Save label note
function saveLabelNote() {
    const noteInput = document.getElementById('labelNote');
    if (!noteInput) return;

    const note = noteInput.value.trim();
    if (!note) {
        alert('⚠️ Vui lòng nhập tên tính giá!');
        return;
    }

    showToast('✅ Đã lưu tên tính giá: ' + note);
}

// Save catalogue note
function saveCatalogueNote() {
    const noteInput = document.getElementById('catalogueNote');
    if (!noteInput) return;

    const note = noteInput.value.trim();
    if (!note) {
        alert('⚠️ Vui lòng nhập tên tính giá!');
        return;
    }

    showToast('✅ Đã lưu tên tính giá: ' + note);
}

// Save offset note to history
function saveOffsetNote() {
    const noteInput = document.getElementById('offsetNote');
    if (!noteInput) return;

    const note = noteInput.value.trim();
    if (!note) {
        alert('⚠️ Vui lòng nhập tên tính giá!');
        return;
    }

    // Show success notification
    showToast('✅ Đã lưu tên tính giá: ' + note);
}

// Show calculation notification
function showCalcNotification(elementId) {
    const notification = document.getElementById(elementId);
    if (!notification) return;

    notification.style.display = 'block';
    playSuccessSound();

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Calculate Offset (placeholder - will be implemented)
function calculateOffset() {
    // Get extra costs
    const extraCosts = getTotalOffsetExtraCosts();

    // Show notification
    showCalcNotification('offsetCalcNotification');

    // TODO: Implement full offset calculation
    alert('Tính năng Offset đang được phát triển. Chi phí gia công khác: ' + formatMoney(extraCosts));
}

// ===== THEME SYSTEM =====
function initTheme() {
    const savedTheme = localStorage.getItem('netprint_theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('netprint_theme', newTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    initTheme(); // Khởi tạo theme trước
    restoreSidebarState(); // Khôi phục trạng thái sidebar
    initSidebarHoverAutoToggle(); // Hover mở/đóng sidebar (desktop)
    initAuth();
    initTabs();
    loadCRMData();
    renderPaperExtraCosts();
    renderLabelExtraCosts();
    renderCatalogueExtraCosts();
    renderOffsetExtraCosts();

    // Khởi tạo trạng thái khóa lề ban đầu
    if (window.isMarginLocked === undefined) {
        window.isMarginLocked = true;
    }
    // Thiết lập đồng bộ ban đầu nếu đang khóa
    if (window.isMarginLocked) {
        const marginH = document.getElementById('paperMarginH');
        const marginV = document.getElementById('paperMarginV');
        if (marginH && marginV) {
            marginV.value = marginH.value;
            marginH.oninput = function () {
                if (window.isMarginLocked && marginV) {
                    marginV.value = this.value;
                }
                updatePaperPreview();
            };
            marginV.oninput = function () {
                if (window.isMarginLocked && marginH) {
                    marginH.value = this.value;
                }
                updatePaperPreview();
            };
        }
    }

    // Khởi tạo rotation toggle state (mặc định BẬT XOAY để tối ưu)
    const rotationBtn = document.getElementById('btnRotationToggle');
    if (rotationBtn) {
        const savedRotation = localStorage.getItem('allowRotation');
        // Mặc định BẬT, trừ khi user đã tắt trước đó
        if (savedRotation === 'false') {
            // User đã tắt trước đó
            rotationBtn.classList.remove('active');
            const icon = document.getElementById('rotationIcon');
            const label = document.getElementById('rotationLabel');
            if (icon) icon.textContent = '🚫';
            if (label) label.textContent = 'Không xoay';
        } else {
            // Mặc định: BẬT xoay (tối ưu thông minh)
            rotationBtn.classList.add('active');
            const icon = document.getElementById('rotationIcon');
            const label = document.getElementById('rotationLabel');
            if (icon) icon.textContent = '🔄';
            if (label) label.textContent = 'Xoay';
            // Lưu trạng thái mặc định
            localStorage.setItem('allowRotation', 'true');
        }
    }

    // Auto-calculate quote total
    const qtyInput = document.getElementById('quoteQuantity');
    const priceInput = document.getElementById('quoteUnitPrice');
    if (qtyInput) qtyInput.addEventListener('input', updateQuoteForm);
    if (priceInput) priceInput.addEventListener('input', updateQuoteForm);
});
// viết hàm js tính số tờ in catalogue từ số trang

// Filter lịch sử Catalogue
function filterCatHistory() {
    const searchValue = document.getElementById('catHistorySearch')?.value?.toLowerCase() || '';
    const items = document.querySelectorAll('#catHistoryList .history-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchValue) ? '' : 'none';
    });
}

// Xóa lịch sử Catalogue
function clearCatHistory() {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử tính giá Catalogue?')) return;

    const historyList = document.getElementById('catHistoryList');
    if (historyList) historyList.innerHTML = '<p style="color:#888; text-align:center;">Chưa có lịch sử</p>';

    // Xóa khỏi localStorage
    localStorage.removeItem('catalogueHistory');
    showNotification('✅ Đã xóa toàn bộ lịch sử Catalogue');
}

// Format number helper for catalogue demo
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return Math.round(num).toLocaleString('vi-VN');
}

// ===== CATALOGUE EXTRA COSTS FUNCTIONS =====

// Danh sách chi phí khác Catalogue
let catExtraCosts = [];

// Thêm chi phí khác Catalogue
function addCatExtraCost() {
    const name = prompt('Nhập tên chi phí:');
    if (!name) return;

    const amountStr = prompt('Nhập số tiền:');
    const amount = parseInt(amountStr) || 0;
    if (amount <= 0) {
        alert('Số tiền phải lớn hơn 0');
        return;
    }

    catExtraCosts.push({ name, amount });
    renderCatExtraCosts();
    calculateCatPrice();
}

// Thêm từ gợi ý Catalogue
function addCatDeliverySuggestion() {
    const select = document.getElementById('catDeliverySuggestions');
    if (!select || !select.value) return;

    const [name, amountStr] = select.value.split('|');
    const amount = parseInt(amountStr) || 0;

    catExtraCosts.push({ name, amount });
    renderCatExtraCosts();
    calculateCatPrice();

    select.value = '';
}

// Xóa chi phí khác Catalogue
function removeCatExtraCost(index) {
    catExtraCosts.splice(index, 1);
    renderCatExtraCosts();
    calculateCatPrice();
}

// Render danh sách chi phí khác Catalogue
function renderCatExtraCosts() {
    const container = document.getElementById('catExtraCosts');
    if (!container) return;

    if (catExtraCosts.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = catExtraCosts.map((cost, index) => `
        <div class="extra-cost-item">
            <span class="extra-cost-name">${cost.name}</span>
            <span class="extra-cost-amount">${formatNumber(cost.amount)}đ</span>
            <button type="button" class="btn-remove-extra" onclick="removeCatExtraCost(${index})">×</button>
        </div>
    `).join('');
}

// Tính tổng chi phí khác Catalogue
function getTotalCatExtraCosts() {
    return catExtraCosts.reduce((sum, cost) => sum + cost.amount, 0);
}

// Toggle ẩn/hiện chi tiết tính giá Catalogue
function toggleCatCostDetail() {
    const detailSection = document.getElementById('catCostDetailSection');
    const summarySection = document.getElementById('catCostSummarySection');
    const toggleIcon = document.getElementById('catCostDetailToggleIcon');
    const toggleText = document.getElementById('catCostDetailToggleText');

    if (detailSection && summarySection) {
        const isHidden = detailSection.style.display === 'none';
        detailSection.style.display = isHidden ? '' : 'none';
        summarySection.style.display = isHidden ? '' : 'none';
        if (toggleIcon) toggleIcon.textContent = isHidden ? '👁️' : '👁️‍🗨️';
        if (toggleText) toggleText.textContent = isHidden ? 'Ẩn chi tiết' : 'Xem chi tiết';
    }
}

// ===== CATALOGUE FUNCTIONS - DÙNG CHUNG VỚI PAPER_SETTINGS =====

// Giá đóng cuốn (binding) - giữ riêng vì không có trong settings
const CAT_BINDING_PRICES = {
    'ghim': 500,
    'keo': 1000,
    'lo-xo': 1500
};

// Giá in mỗi tờ (print) - giữ riêng vì không có trong settings
const CAT_PRINT_PRICES = {
    '1mat': 500,
    '2mat': 800
};

// ===== CATALOGUE CALCULATION FUNCTIONS =====

/**
 * CÔNG THỨC CHUẨN: Số trang/tờ in A3 (32.5×43cm)
 * - A4 đứng (210×297): 4 trang/tờ
 * - A5 đứng/ngang (148×210 hoặc 210×148): 8 trang/tờ  
 * - A6 đứng/ngang (105×148 hoặc 148×105): 16 trang/tờ
 * 
 * Khổ tùy chọn: map về khổ chuẩn gần nhất LỚN HƠN
 */

// Bảng khổ chuẩn (diện tích mm²)
const CAT_SIZE_TIERS = [
    { name: 'A6', maxArea: 105 * 148, pagesPerSheet: 16 },  // 15,540 mm²
    { name: 'A5', maxArea: 148 * 210, pagesPerSheet: 8 },   // 31,080 mm²
    { name: 'A4', maxArea: 210 * 297, pagesPerSheet: 4 },   // 62,370 mm²
];

/**
 * Tính số trang/tờ in dựa trên khổ catalogue
 * @param {number} catW - Chiều rộng catalogue (mm)
 * @param {number} catH - Chiều cao catalogue (mm)
 * @returns {Object} { pagesPerSheet, tierName, catArea }
 */
function calculateOptimalLayout(printW, printH, catW, catH) {
    const catArea = catW * catH;

    // Tìm tier phù hợp (khổ gần nhất LỚN HƠN hoặc bằng)
    let tierName = 'A4';  // Default
    let pagesPerSheet = 4;

    for (const tier of CAT_SIZE_TIERS) {
        if (catArea <= tier.maxArea) {
            tierName = tier.name;
            pagesPerSheet = tier.pagesPerSheet;
            break;
        }
    }

    // Nếu lớn hơn A4, vẫn tính bằng A4 (4 trang/tờ) nhưng có thể cần nhiều tờ hơn
    if (catArea > 210 * 297) {
        tierName = 'Lớn hơn A4';
        pagesPerSheet = 2;  // Chỉ vừa 2 trang/tờ (1 trang/mặt)

        // Kiểm tra nếu quá lớn
        if (catW > printW || catH > printH) {
            if (catH <= printW && catW <= printH) {
                // Có thể xoay
            } else {
                pagesPerSheet = 0;  // Không thể in
            }
        }
    }

    return {
        pagesPerSheet: pagesPerSheet,
        pagesPerSide: pagesPerSheet / 2,
        tierName: tierName,
        catArea: catArea,
        cols: 0,  // Không cần thiết nữa
        rows: 0,
        rotated: false
    };
}

/**
 * Kiểm tra khổ catalogue có hợp lệ với khổ in không
 * @param {number} catW - Chiều rộng catalogue (mm)
 * @param {number} catH - Chiều cao catalogue (mm)
 * @param {number} printW - Chiều rộng tờ in (mm)
 * @param {number} printH - Chiều cao tờ in (mm)
 * @param {string} bindingType - Kiểu đóng: 'ghim', 'lo-xo', 'keo'
 * @returns {Object} { isValid, maxCatW, maxCatH, suggestion }
 */
function validateCatSize(catW, catH, printW, printH, bindingType) {
    let isValid = false;
    let maxCatW = 0, maxCatH = 0;
    let suggestion = '';

    if (bindingType === 'ghim') {
        // Ghim giữa: cần gấp đôi 1 chiều
        // Thử gấp theo W (chiều ngang)
        if (catW * 2 <= printW && catH <= printH) {
            isValid = true;
        }
        // Thử gấp theo H (chiều dọc)
        else if (catH * 2 <= printH && catW <= printW) {
            isValid = true;
        }
        // Thử xoay rồi gấp
        else if (catH * 2 <= printW && catW <= printH) {
            isValid = true;
        }
        else if (catW * 2 <= printH && catH <= printW) {
            isValid = true;
        }
        // Tính khổ max có thể (đứng)
        maxCatW = Math.floor(printW / 2);
        maxCatH = printH;
    } else {
        // Lò xo / Keo: không cần gấp, chỉ cần vừa tờ
        if ((catW <= printW && catH <= printH) ||
            (catH <= printW && catW <= printH)) {
            isValid = true;
        }
        maxCatW = printW;
        maxCatH = printH;
    }

    if (!isValid) {
        suggestion = `Khổ tối đa: ${maxCatW}×${maxCatH}mm. Vui lòng chọn khổ nhỏ hơn hoặc đổi khổ in.`;
    }

    return { isValid, maxCatW, maxCatH, suggestion };
}

/**
 * Tính số tờ in cần thiết theo kiểu đóng cuốn
 * @param {number} totalPages - Tổng số trang catalogue
 * @param {string} bindingType - Kiểu đóng: 'ghim', 'lo-xo', 'keo'
 * @param {string} coverPrint - In bìa: '1mat' hoặc '2mat'
 * @param {string} innerPrint - In ruột: '1mat' hoặc '2mat'
 * @param {number} pagesPerSheet - Số trang/tờ in (từ calculateOptimalLayout)
 * @returns {Object} { coverPages, innerPages, coverSheets, innerSheets, totalSheets, minPages, warning }
 */
function calculateCatSheets(totalPages, bindingType, coverPrint, innerPrint, pagesPerSheet) {
    let result = {
        coverPages: 0,          // Số trang bìa/cuốn
        innerPages: 0,          // Số trang ruột/cuốn  
        coverSheets: 0,         // Số tờ bìa/cuốn
        innerSheets: 0,         // Số tờ ruột/cuốn
        totalSheets: 0,         // Tổng số tờ/cuốn
        minPages: 8,            // Số trang tối thiểu
        warning: ''             // Cảnh báo nếu có
    };

    // Validate số trang
    if (!totalPages || totalPages < 4) {
        result.warning = 'Số trang phải >= 4';
        return result;
    }

    switch (bindingType) {
        case 'ghim':  // Ghim giữa - CÔNG THỨC CHUẨN
            // Phải chia hết cho 4
            if (totalPages % 4 !== 0) {
                const rounded = Math.ceil(totalPages / 4) * 4;
                result.warning = `Đóng ghim cần số trang chia hết cho 4. Đề xuất: ${rounded} trang`;
                totalPages = rounded;
            }
            // Bìa: 4 trang, Ruột: tổng - 4
            result.coverPages = 4;
            result.innerPages = Math.max(0, totalPages - 4);
            // Số tờ = số trang / pagesPerSheet (VD: 4/8 = 0.5 tờ/cuốn)
            result.coverSheets = result.coverPages / pagesPerSheet;
            result.innerSheets = result.innerPages / pagesPerSheet;
            result.totalSheets = result.coverSheets + result.innerSheets;
            result.minPages = 8;
            break;

        case 'lo-xo':  // Lò xo - CÔNG THỨC CHUẨN
            result.coverPages = 4;  // 4 trang bìa
            result.innerPages = Math.max(0, totalPages - 4);
            // Số tờ = số trang / pagesPerSheet (VD: 4/8 = 0.5 tờ/cuốn)
            result.coverSheets = result.coverPages / pagesPerSheet;
            result.innerSheets = result.innerPages / pagesPerSheet;
            result.totalSheets = result.coverSheets + result.innerSheets;
            result.minPages = 8;
            break;

        case 'keo':  // Keo gáy - CÔNG THỨC CHUẨN
            if (totalPages < 28) {
                result.warning = `Đóng keo gáy cần tối thiểu 28 trang để gáy đủ dày`;
            }
            result.coverPages = 4;  // 4 trang bìa
            result.innerPages = Math.max(0, totalPages - 4);
            // Số tờ = số trang / pagesPerSheet (VD: 4/8 = 0.5 tờ/cuốn)
            result.coverSheets = result.coverPages / pagesPerSheet;
            result.innerSheets = result.innerPages / pagesPerSheet;
            result.totalSheets = result.coverSheets + result.innerSheets;
            result.minPages = 28;
            break;

        default:
            result.warning = 'Kiểu đóng cuốn không hợp lệ';
    }

    return result;
}

/**
 * Lấy kích thước catalogue từ dropdown hoặc input tùy chọn
 * @returns {Object} { width, height } in mm
 */
function getCatSizeFromUI() {
    const sizeSelect = document.getElementById('catSize');
    const sizeValue = sizeSelect ? sizeSelect.value : 'A5';

    // Các khổ preset
    const presets = {
        'A4': { w: 210, h: 297 },
        'A5': { w: 148, h: 210 },
        'A6': { w: 105, h: 148 },
        'A4-ngang': { w: 297, h: 210 },
        'A5-ngang': { w: 210, h: 148 },
        'A6-ngang': { w: 148, h: 105 },
        '14x20': { w: 140, h: 200 },
        '20x14': { w: 200, h: 140 }
    };

    if (sizeValue === 'custom') {
        const wInput = document.getElementById('catCustomW');
        const hInput = document.getElementById('catCustomH');
        return {
            w: parseFloat(wInput?.value) * 10 || 148,  // cm to mm
            h: parseFloat(hInput?.value) * 10 || 210
        };
    }

    return presets[sizeValue] || { w: 148, h: 210 };  // Default A5
}

/**
 * Lấy kích thước khổ in từ dropdown
 * @returns {Object} { width, height } in mm
 */
function getPrintSizeFromUI() {
    const printSizeSelect = document.getElementById('catPrintSize');
    const printSizeId = printSizeSelect ? parseInt(printSizeSelect.value) : null;

    if (printSizeId && PAPER_SETTINGS && PAPER_SETTINGS.printSizes) {
        const size = PAPER_SETTINGS.printSizes.find(s => s.id === printSizeId);
        if (size) {
            return { w: size.w || 325, h: size.h || 430 };
        }
    }

    // Default A3
    return { w: 325, h: 430 };
}

/**
 * Khởi tạo các dropdown cho Catalogue từ PAPER_SETTINGS
 */
function initCatalogueDropdowns() {
    // 1. Populate khổ in TRƯỚC
    populateCatPrintSizeDropdown();
    // 2. Sau đó populate loại giấy theo khổ in đã chọn
    populateCatPaperDropdowns();
    // 3. Cuối cùng populate cán màng
    populateCatLaminationDropdowns();
    // 4. Populate loại khách hàng từ PAPER_SETTINGS (đồng bộ với In Nhanh)
    populateCatCustomerTypeDropdown();
}

/**
 * Event handler khi thay đổi khổ in - filter loại giấy và cán màng theo khổ in mới
 */
function onCatPrintSizeChange() {
    // Re-populate loại giấy theo khổ in mới
    populateCatPaperDropdowns();
    // Re-populate cán màng theo khổ in mới
    populateCatLaminationDropdowns();
    // Cập nhật tính toán
    updateCatCalculation();
}
/**
 * Populate dropdown loại giấy bìa và giấy ruột - FILTER THEO KHỔ IN ĐÃ CHỌN
 */
function populateCatPaperDropdowns() {
    const coverSelect = document.getElementById('catCoverPaperType');
    const innerSelect = document.getElementById('catInnerPaperType');

    if (!coverSelect || !innerSelect) return;

    // Lưu tên loại giấy đang chọn (để restore sau khi re-populate)
    const currentCoverName = coverSelect.options.length > 0 ? coverSelect.options[coverSelect.selectedIndex].text : '';
    const currentInnerName = innerSelect.options.length > 0 ? innerSelect.options[innerSelect.selectedIndex].text : '';

    // Lấy khổ in đã chọn
    const printSizeSelect = document.getElementById('catPrintSize');
    let selectedPrintSizeId = printSizeSelect ? parseInt(printSizeSelect.value) : null;

    // Fallback: lấy khổ in đầu tiên nếu chưa có
    if (!selectedPrintSizeId && PAPER_SETTINGS && PAPER_SETTINGS.printSizes && PAPER_SETTINGS.printSizes.length > 0) {
        selectedPrintSizeId = PAPER_SETTINGS.printSizes[0].id;
    }

    // Lấy danh sách loại giấy THEO KHỔ IN đã chọn
    let papers = [];
    if (typeof getPapersBySize === 'function' && selectedPrintSizeId) {
        papers = getPapersBySize(selectedPrintSizeId);
    }

    if (papers.length === 0) {
        console.warn('⚠️ Catalogue: Không tìm thấy loại giấy nào cho khổ in này. Hãy thêm loại giấy trong Cài Đặt > Giấy.');
        // Thêm option placeholder
        coverSelect.innerHTML = '<option value="">-- Chưa có loại giấy --</option>';
        innerSelect.innerHTML = '<option value="">-- Chưa có loại giấy --</option>';
        return;
    }

    // Tạo options HTML
    const optionsHTML = papers.map(p =>
        `<option value="${p.id}">${p.name || p.id}</option>`
    ).join('');

    // Populate dropdown
    coverSelect.innerHTML = optionsHTML;
    innerSelect.innerHTML = optionsHTML;

    // Restore selection based on name
    restoreDropdownSelectionByName(coverSelect, currentCoverName);
    restoreDropdownSelectionByName(innerSelect, currentInnerName);

    console.log('✅ Catalogue: Đã populate dropdown loại giấy -', papers.length, 'loại cho khổ in ID:', selectedPrintSizeId);
}

// Helper: Restore selection by text content (name)
function restoreDropdownSelectionByName(selectElement, nameToMatch) {
    if (!nameToMatch || !selectElement) return;

    // 1. Try exact match
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text === nameToMatch) {
            selectElement.selectedIndex = i;
            return;
        }
    }

    // 2. Try partial match (case insensitive)
    const lowerName = nameToMatch.toLowerCase().trim();
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text.toLowerCase().trim() === lowerName) {
            selectElement.selectedIndex = i;
            return;
        }
    }
}

/**
 * Populate dropdown cán màng cho bìa và ruột
 */
function populateCatLaminationDropdowns() {
    const coverLamSelect = document.getElementById('catCoverLamination');
    const innerLamSelect = document.getElementById('catInnerLamination');

    if (!coverLamSelect || !innerLamSelect) return;

    // Lưu lựa chọn hiện tại
    const currentCoverLamName = coverLamSelect.options.length > 0 ? coverLamSelect.options[coverLamSelect.selectedIndex].text : '';
    const currentInnerLamName = innerLamSelect.options.length > 0 ? innerLamSelect.options[innerLamSelect.selectedIndex].text : '';

    // Lấy selectedPrintSizeId từ dropdown khổ in
    const printSizeSelect = document.getElementById('catPrintSize');
    let selectedPrintSizeId = printSizeSelect ? parseInt(printSizeSelect.value) : null;

    // Fallback: lấy khổ in đầu tiên nếu chưa có
    if (!selectedPrintSizeId && PAPER_SETTINGS && PAPER_SETTINGS.printSizes && PAPER_SETTINGS.printSizes.length > 0) {
        selectedPrintSizeId = PAPER_SETTINGS.printSizes[0].id;
    }

    // Lấy danh sách cán màng từ PAPER_SETTINGS.laminationPricing
    let laminationOptions = '<option value="none">Không cán</option>';

    // Sử dụng hàm getLaminationsBySize nếu có
    if (typeof getLaminationsBySize === 'function' && selectedPrintSizeId) {
        const laminations = getLaminationsBySize(selectedPrintSizeId);
        // Filter bỏ các entry "Không cán" hoặc id "none" để tránh trùng lặp
        laminations.filter(lam => lam.id !== 'none' && lam.name !== 'Không cán').forEach(lam => {
            laminationOptions += `<option value="${lam.id}">${lam.name || lam.id}</option>`;
        });
    } else if (PAPER_SETTINGS && PAPER_SETTINGS.laminationPricing && selectedPrintSizeId) {
        // Fallback: truy cập trực tiếp
        const lamPricing = PAPER_SETTINGS.laminationPricing.find(l => l.printSizeId === selectedPrintSizeId);
        if (lamPricing && lamPricing.laminations) {
            // Filter bỏ các entry "Không cán" hoặc id "none" để tránh trùng lặp
            lamPricing.laminations.filter(lam => lam.id !== 'none' && lam.name !== 'Không cán').forEach(lam => {
                laminationOptions += `<option value="${lam.id}">${lam.name || lam.id}</option>`;
            });
        }
    }

    // Nếu không có settings, dùng default
    if (laminationOptions === '<option value="none">Không cán</option>') {
        laminationOptions += `
            <option value="bong_1mat">Cán bóng 1 mặt</option>
            <option value="nham_1mat">Cán nhám 1 mặt</option>
        `;
    }

    coverLamSelect.innerHTML = laminationOptions;
    innerLamSelect.innerHTML = laminationOptions;

    // Restore selection
    restoreDropdownSelectionByName(coverLamSelect, currentCoverLamName);
    restoreDropdownSelectionByName(innerLamSelect, currentInnerLamName);

    console.log('✅ Catalogue: Đã populate dropdown cán màng');
}

/**
 * Populate dropdown khổ in từ PAPER_SETTINGS
 */
function populateCatPrintSizeDropdown() {
    const printSizeSelect = document.getElementById('catPrintSize');
    if (!printSizeSelect) return;

    if (!PAPER_SETTINGS || !PAPER_SETTINGS.printSizes) {
        console.warn('⚠️ Catalogue: PAPER_SETTINGS chưa được khởi tạo');
        return;
    }

    // Tạo options
    const optionsHTML = PAPER_SETTINGS.printSizes.map(size =>
        `<option value="${size.id}">${size.name || size.w + ' x ' + size.h + ' mm'}</option>`
    ).join('');

    printSizeSelect.innerHTML = optionsHTML;

    // Chọn mặc định A3 (325 x 430 mm) nếu có
    const defaultSize = PAPER_SETTINGS.printSizes.find(s =>
        (s.w === 325 && s.h === 430) || s.name === '325 x 430 mm' || s.name.includes('A3')
    );
    if (defaultSize) {
        printSizeSelect.value = defaultSize.id;
    }

    console.log('✅ Catalogue: Đã populate dropdown khổ in -', PAPER_SETTINGS.printSizes.length, 'khổ');
}

/**
 * Populate dropdown loại khách hàng từ PAPER_SETTINGS (đồng bộ với In Nhanh)
 */
function populateCatCustomerTypeDropdown() {
    const customerTypeSelect = document.getElementById('catCustomerType');
    if (!customerTypeSelect) return;

    if (!PAPER_SETTINGS || !PAPER_SETTINGS.customerTypes || PAPER_SETTINGS.customerTypes.length === 0) {
        console.warn('⚠️ Catalogue: Chưa có loại khách hàng trong cài đặt');
        return;
    }

    // Tạo options từ PAPER_SETTINGS.customerTypes
    const optionsHTML = PAPER_SETTINGS.customerTypes.map(cust =>
        `<option value="${cust.id}">${cust.name}</option>`
    ).join('');

    customerTypeSelect.innerHTML = optionsHTML;

    // Chọn mặc định "Khách lẻ" nếu có
    const defaultCust = PAPER_SETTINGS.customerTypes.find(c =>
        (c.name || '').toLowerCase().includes('lẻ')
    );
    if (defaultCust) {
        customerTypeSelect.value = defaultCust.id;
    }

    console.log('✅ Catalogue: Đã populate dropdown loại khách -', PAPER_SETTINGS.customerTypes.length, 'loại');
}

/**
 * Lấy giá giấy cho Catalogue từ PAPER_SETTINGS
 * @param {number} paperId - ID loại giấy
 * @param {number} sheets - Số tờ in
 * @returns {number} - Giá mỗi tờ
 */
function getCatPaperPrice(paperId, sheets) {
    if (typeof getPaperPrice === 'function') {
        return getPaperPrice(paperId, sheets);
    }
    // Fallback nếu hàm không tồn tại
    return 5000;
}

/**
 * Lấy giá cán màng cho Catalogue từ PAPER_SETTINGS.laminationPricing
 * @param {string|number} lamId - ID loại cán màng
 * @param {number} sheets - Số tờ cán
 * @returns {number} - Giá mỗi tờ
 */
function getCatLaminationPrice(lamId, sheets) {
    if (lamId === 'none' || !lamId) return 0;

    // Lấy printSizeId từ dropdown khổ in
    const printSizeSelect = document.getElementById('catPrintSize');
    let selectedPrintSizeId = printSizeSelect ? parseInt(printSizeSelect.value) : null;

    // Fallback
    if (!selectedPrintSizeId && PAPER_SETTINGS && PAPER_SETTINGS.printSizes && PAPER_SETTINGS.printSizes.length > 0) {
        selectedPrintSizeId = PAPER_SETTINGS.printSizes[0].id;
    }

    // Dùng hàm getLaminationBySizeAndId từ lamination_helpers.js
    if (typeof getLaminationBySizeAndId === 'function' && selectedPrintSizeId) {
        const lam = getLaminationBySizeAndId(selectedPrintSizeId, parseInt(lamId));
        if (lam && lam.tiers && lam.tiers.length > 0) {
            // Tìm giá theo số lượng
            for (const tier of lam.tiers) {
                if (sheets <= tier.max) {
                    return tier.price || 0;
                }
            }
            // Fallback: tier cuối
            return lam.tiers[lam.tiers.length - 1].price || 0;
        }
    }

    // Fallback: truy cập trực tiếp
    if (PAPER_SETTINGS && PAPER_SETTINGS.laminationPricing && selectedPrintSizeId) {
        const lamPricing = PAPER_SETTINGS.laminationPricing.find(l => l.printSizeId === selectedPrintSizeId);
        if (lamPricing && lamPricing.laminations) {
            const lam = lamPricing.laminations.find(l => l.id === parseInt(lamId));
            if (lam && lam.tiers && lam.tiers.length > 0) {
                for (const tier of lam.tiers) {
                    if (sheets <= tier.max) {
                        return tier.price || 0;
                    }
                }
                return lam.tiers[lam.tiers.length - 1].price || 0;
            }
        }
    }

    // Fallback mặc định
    return 1000;
}

// Toggle custom size inputs
function toggleCatCustomSize() {
    const sizeValue = document.getElementById('catSize').value;
    const customInputs = document.getElementById('catCustomSizeInputs');

    if (sizeValue === 'custom') {
        customInputs.style.display = 'flex';
    } else {
        customInputs.style.display = 'none';
    }

    updateCatCalculation();
}

// Cập nhật thông tin catalogue - DÙNG CÁC HÀM MỚI
function updateCatCalculation() {
    const pagesEl = document.getElementById('catPages');
    const qtyEl = document.getElementById('catQty');
    const sizeEl = document.getElementById('catSize');
    const bindingEl = document.getElementById('catBinding');

    if (!pagesEl || !qtyEl || !sizeEl) return;

    const pages = parseInt(pagesEl.value) || 8;
    const qty = parseInt(qtyEl.value) || 0;
    const sizeValue = sizeEl.value;
    const bindingType = bindingEl?.value || 'ghim';

    // Lấy kích thước catalogue (mm)
    let catW, catH;
    if (sizeValue === 'custom') {
        catW = parseInt(document.getElementById('catCustomWidth')?.value) || 148;
        catH = parseInt(document.getElementById('catCustomHeight')?.value) || 210;
    } else {
        const [w, h] = sizeValue.split('x').map(Number);
        catW = w || 148;
        catH = h || 210;
    }

    // Lấy khổ in từ settings hoặc default A3
    const printSize = getPrintSizeFromUI();
    const printW = printSize.w;
    const printH = printSize.h;

    // BƯỚC 1: Validate khổ catalogue
    const validation = validateCatSize(catW, catH, printW, printH, bindingType);

    // Hiển thị cảnh báo nếu có
    const warningEl = document.getElementById('catSizeWarning');
    if (warningEl) {
        if (!validation.isValid) {
            warningEl.textContent = `⚠️ ${validation.suggestion}`;
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    }

    // BƯỚC 2: Tính layout tối ưu
    const layout = calculateOptimalLayout(printW, printH, catW, catH);

    // BƯỚC 3: Tính số tờ theo kiểu đóng cuốn
    const coverPrint = document.getElementById('catCoverPrint')?.value || '1mat';
    const innerPrint = document.getElementById('catInnerPrint')?.value || '2mat';
    const sheets = calculateCatSheets(pages, bindingType, coverPrint, innerPrint, layout.pagesPerSheet);

    // Tính tổng số tờ cho cả lô - LÀM TRÒN LÊN
    const totalCoverSheets = Math.ceil(sheets.coverSheets * qty);
    const totalInnerSheets = Math.ceil(sheets.innerSheets * qty);

    // Cập nhật UI
    const catCoverPages = document.getElementById('catCoverPages');
    const catTotalCoverSheets = document.getElementById('catTotalCoverSheets');
    const catCoverSheetsHint = document.getElementById('catCoverSheetsHint');
    const catInnerPages = document.getElementById('catInnerPages');
    const catInnerPagesHint = document.getElementById('catInnerPagesHint');
    const catTotalInnerSheets = document.getElementById('catTotalInnerSheets');
    const catInnerSheetsHint = document.getElementById('catInnerSheetsHint');

    // Hiển thị số trang - ĐỒNG NHẤT CHO TẤT CẢ KIỂU ĐÓNG
    if (catCoverPages) {
        catCoverPages.textContent = `${sheets.coverPages} trang`;
    }

    if (catInnerPages) {
        catInnerPages.textContent = `${sheets.innerPages} trang`;
    }
    if (catInnerPagesHint) {
        catInnerPagesHint.textContent = `${pages} - ${sheets.coverPages} trang bìa`;
    }

    // Hiển thị số tờ - ĐỒNG NHẤT CHO TẤT CẢ KIỂU ĐÓNG
    if (catTotalCoverSheets) {
        catTotalCoverSheets.textContent = `${formatNumber(totalCoverSheets)} tờ`;
    }
    if (catCoverSheetsHint) {
        catCoverSheetsHint.textContent = `${sheets.coverSheets} tờ/cuốn × ${formatNumber(qty)} cuốn`;
    }

    if (catTotalInnerSheets) catTotalInnerSheets.textContent = `${formatNumber(totalInnerSheets)} tờ`;
    if (catInnerSheetsHint) {
        catInnerSheetsHint.textContent = `${sheets.innerSheets} tờ/cuốn × ${formatNumber(qty)} cuốn`;
    }

    // Hiển thị warning từ calculateCatSheets
    if (sheets.warning && warningEl) {
        warningEl.textContent = `⚠️ ${sheets.warning}`;
        warningEl.style.display = 'block';
    }

    // Log để debug
    console.log('📊 Catalogue calculation:', {
        catSize: `${catW}×${catH}mm`,
        printSize: `${printW}×${printH}mm`,
        binding: bindingType,
        layout,
        sheets,
        validation
    });

    // Tự động tính giá
    calculateCatPrice();
}

// Tính giá Catalogue - ĐỒNG BỘ VỚI updateCatCalculation
function calculateCatPrice() {
    const pagesEl = document.getElementById('catPages');
    const qtyEl = document.getElementById('catQty');
    const sizeEl = document.getElementById('catSize');
    const bindingEl = document.getElementById('catBinding');

    if (!pagesEl || !qtyEl) return;

    const pages = parseInt(pagesEl.value) || 8;
    const qty = parseInt(qtyEl.value) || 0;
    const sizeValue = sizeEl?.value || '148x210';
    const bindingType = bindingEl?.value || 'ghim';

    // Lấy kích thước catalogue (mm)
    let catW, catH;
    if (sizeValue === 'custom') {
        catW = parseInt(document.getElementById('catCustomWidth')?.value) || 148;
        catH = parseInt(document.getElementById('catCustomHeight')?.value) || 210;
    } else {
        const [w, h] = sizeValue.split('x').map(Number);
        catW = w || 148;
        catH = h || 210;
    }

    // Lấy khổ in từ settings hoặc default A3
    const printSize = getPrintSizeFromUI();
    const printW = printSize.w;
    const printH = printSize.h;

    // Tính layout để có pagesPerSheet
    const layout = calculateOptimalLayout(printW, printH, catW, catH);
    const pagesPerSheet = layout.pagesPerSheet;

    // CÔNG THỨC CHUẨN - ĐỒNG BỘ VỚI calculateCatSheets
    const coverPages = 4;
    const innerPages = Math.max(0, pages - 4);
    const coverPerBook = coverPages / pagesPerSheet;
    const innerPerBook = innerPages / pagesPerSheet;
    const totalCoverSheets = Math.ceil(coverPerBook * qty);
    const totalInnerSheets = Math.ceil(innerPerBook * qty);

    // Giá giấy - lấy từ PAPER_SETTINGS
    const coverPaperId = parseInt(document.getElementById('catCoverPaperType')?.value) || 0;
    const innerPaperId = parseInt(document.getElementById('catInnerPaperType')?.value) || 0;
    const coverPaperPrice = getCatPaperPrice(coverPaperId, totalCoverSheets);
    const innerPaperPrice = getCatPaperPrice(innerPaperId, totalInnerSheets);

    // Giá in - dùng CAT_PRINT_PRICES
    const coverPrint = document.getElementById('catCoverPrint')?.value || '1mat';
    const innerPrint = document.getElementById('catInnerPrint')?.value || '1mat';
    const coverPrintPrice = CAT_PRINT_PRICES[coverPrint] || 500;
    const innerPrintPrice = CAT_PRINT_PRICES[innerPrint] || 500;

    // Giá cán - lấy từ LAMINATION_SETTINGS
    const coverLamination = document.getElementById('catCoverLamination')?.value || 'none';
    const innerLamination = document.getElementById('catInnerLamination')?.value || 'none';
    const coverLaminationPrice = getCatLaminationPrice(coverLamination, totalCoverSheets);
    const innerLaminationPrice = getCatLaminationPrice(innerLamination, totalInnerSheets);

    // Giá đóng cuốn - dùng CAT_BINDING_PRICES
    const binding = document.getElementById('catBinding')?.value || 'ghim';
    const bindingPrice = CAT_BINDING_PRICES[binding] || 500;

    // TÍNH TỔNG CHI PHÍ
    const coverPaperCost = totalCoverSheets * coverPaperPrice;
    const coverPrintCost = totalCoverSheets * coverPrintPrice;
    const coverLamCost = totalCoverSheets * coverLaminationPrice;

    const innerPaperCost = totalInnerSheets * innerPaperPrice;
    const innerPrintCost = totalInnerSheets * innerPrintPrice;
    const innerLamCost = totalInnerSheets * innerLaminationPrice;

    const bindingCost = qty * bindingPrice;

    const totalCost = coverPaperCost + coverPrintCost + coverLamCost +
        innerPaperCost + innerPrintCost + innerLamCost + bindingCost;

    // TÍNH GIÁ BÁN - LẤY TỶ LỆ % TỪ LOẠI KHÁCH (ĐỒNG BỘ VỚI IN NHANH)
    const catCustomerTypeEl = document.getElementById('catCustomerType');
    const custId = parseInt(catCustomerTypeEl?.value) || null;

    // Tìm loại khách trong PAPER_SETTINGS.customerTypes theo ID
    let profitPercent = 20; // Default 20%
    if (PAPER_SETTINGS && PAPER_SETTINGS.customerTypes && custId) {
        const cust = PAPER_SETTINGS.customerTypes.find(c => c.id === custId);
        if (cust) {
            profitPercent = cust.profit || 20;
        }
    }

    const profitMargin = profitPercent / 100;
    const profitAmount = totalCost * profitMargin;
    const grandTotal = totalCost + profitAmount;

    // CẬP NHẬT UI - Chi tiết bìa
    const catCoverPaperDetail = document.getElementById('catCoverPaperDetail');
    const catCoverPaperCost = document.getElementById('catCoverPaperCost');
    const catCoverPrintDetail = document.getElementById('catCoverPrintDetail');
    const catCoverPrintCost = document.getElementById('catCoverPrintCost');
    const catCoverLamDetail = document.getElementById('catCoverLamDetail');
    const catCoverLamCost = document.getElementById('catCoverLamCost');

    if (catCoverPaperDetail) catCoverPaperDetail.textContent = `${formatNumber(totalCoverSheets)} tờ × ${formatNumber(coverPaperPrice)}đ`;
    if (catCoverPaperCost) catCoverPaperCost.textContent = formatNumber(coverPaperCost) + 'đ';
    if (catCoverPrintDetail) catCoverPrintDetail.textContent = `${formatNumber(totalCoverSheets)} tờ × ${formatNumber(coverPrintPrice)}đ`;
    if (catCoverPrintCost) catCoverPrintCost.textContent = formatNumber(coverPrintCost) + 'đ';
    if (catCoverLamDetail) catCoverLamDetail.textContent = `${formatNumber(totalCoverSheets)} tờ × ${formatNumber(coverLaminationPrice)}đ`;
    if (catCoverLamCost) catCoverLamCost.textContent = formatNumber(coverLamCost) + 'đ';

    // CẬP NHẬT UI - Chi tiết ruột
    const catInnerPaperDetail = document.getElementById('catInnerPaperDetail');
    const catInnerPaperCost = document.getElementById('catInnerPaperCost');
    const catInnerPrintDetail = document.getElementById('catInnerPrintDetail');
    const catInnerPrintCost = document.getElementById('catInnerPrintCost');
    const catInnerLamDetail = document.getElementById('catInnerLamDetail');
    const catInnerLamCost = document.getElementById('catInnerLamCost');

    if (catInnerPaperDetail) catInnerPaperDetail.textContent = `${formatNumber(totalInnerSheets)} tờ × ${formatNumber(innerPaperPrice)}đ`;
    if (catInnerPaperCost) catInnerPaperCost.textContent = formatNumber(innerPaperCost) + 'đ';
    if (catInnerPrintDetail) catInnerPrintDetail.textContent = `${formatNumber(totalInnerSheets)} tờ × ${formatNumber(innerPrintPrice)}đ`;
    if (catInnerPrintCost) catInnerPrintCost.textContent = formatNumber(innerPrintCost) + 'đ';
    if (catInnerLamDetail) catInnerLamDetail.textContent = `${formatNumber(totalInnerSheets)} tờ × ${formatNumber(innerLaminationPrice)}đ`;
    if (catInnerLamCost) catInnerLamCost.textContent = formatNumber(innerLamCost) + 'đ';

    // CẬP NHẬT UI - Gia công
    const catBindingCostEl = document.getElementById('catBindingCost');
    if (catBindingCostEl) catBindingCostEl.textContent = formatNumber(bindingCost) + 'đ';

    // Chi phí khác
    const extraCosts = getTotalCatExtraCosts();
    const catResExtraCost = document.getElementById('catResExtraCost');
    if (catResExtraCost) catResExtraCost.textContent = formatNumber(extraCosts) + 'đ';

    // Tổng vốn (bao gồm chi phí khác)
    const totalCostWithExtra = totalCost + extraCosts;

    // CẬP NHẬT UI - Tổng vốn và lợi nhuận
    const catTotalCostEl = document.getElementById('catTotalCost');
    const catProfitAmountEl = document.getElementById('catProfitAmount');

    const finalProfitAmount = totalCostWithExtra * profitMargin;
    const grandTotalWithExtra = totalCostWithExtra + finalProfitAmount;
    const sellPricePerUnit = qty > 0 ? Math.ceil(grandTotalWithExtra / qty) : 0;

    if (catTotalCostEl) catTotalCostEl.textContent = formatNumber(totalCostWithExtra) + 'đ';
    if (catProfitAmountEl) catProfitAmountEl.textContent = formatNumber(finalProfitAmount) + 'đ';

    // CẬP NHẬT UI - Summary Row (Số lượng, Giá bán/SP, Tổng tiền)
    const catResQty = document.getElementById('catResQty');
    const catResSellPrice = document.getElementById('catResSellPrice');
    const catResTotalSell = document.getElementById('catResTotalSell');

    if (catResQty) catResQty.textContent = formatNumber(qty);
    if (catResSellPrice) catResSellPrice.textContent = formatNumber(sellPricePerUnit) + 'đ';
    if (catResTotalSell) catResTotalSell.textContent = formatNumber(grandTotalWithExtra) + 'đ';

    // Hiển thị thông báo tính giá thành công
    const notification = document.getElementById('catCalcNotification');
    if (notification) {
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

// Initialize catalogue demo on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    // Initialize demo catalogue calculation if elements exist
    if (document.getElementById('catSize')) {
        updateCatCalculation();
    }
});
