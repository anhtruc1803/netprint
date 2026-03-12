---
description: Quản lý và deploy lên VPS DigitalOcean (Ubuntu)
---

# Thông tin VPS

## Server Details
- **IP Address**: 159.89.202.50
- **Username**: root
- **SSH Key**: C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk
- **OS**: Ubuntu

## Websites trên VPS (3 websites)

| Domain | Folder | Port Backend | Type | Backend Process |
|--------|--------|--------------|------|----------------|
| ptvh.oneliving.vn | /var/www/ptvh/main_baoviet | 8501 | Streamlit | AI Bảo hiểm Sức khỏe |
| tinhgia.netprint.vn | /var/www/netprint | 8510 | React SPA + Python API | CRM NetPrint (Nginx serve static + proxy `/api/` tới port 8510) |
| xs.oneliving.vn | /var/www/lottery_ai/backend | 8505 | FastAPI/Uvicorn | Lottery AI Prediction |

**Lưu ý tinhgia.netprint.vn**: React SPA (Vite build) + Backend Python API trên port 8510. Nginx serve static files + proxy `/api/` → backend. Systemd service: `netprint-api`. Data lưu tại `/var/www/netprint/data/settings.json`.

### Deploy CRM (build + upload)
```powershell
# 1. Build production
cd C:\Users\MSI\Code_Netprint\Code_NetPrint_8\CRM
npm run build

# 2. Xóa file web cũ trên VPS (GIỮ LẠI thư mục data/)
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "cd /var/www/netprint && rm -rf assets/ logo/ *.js *.css *.html *.json sw.js manifest.json"

# 3. Upload dist mới
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -r "C:\Users\MSI\Code_Netprint\Code_NetPrint_8\CRM\dist\*" root@159.89.202.50:/var/www/netprint/

# 4. Đồng bộ settings data (giá, gia công, cán màng...) từ local → VPS
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "C:\Users\MSI\Code_Netprint\Code_NetPrint_8\CRM\data\settings.json" root@159.89.202.50:/var/www/netprint/data/settings.json

# 5. Set quyền + reload nginx
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "chown -R www-data:www-data /var/www/netprint/ && systemctl reload nginx"
```

### Restart CRM backend API (port 8510)
```powershell
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "systemctl restart netprint-api && systemctl status netprint-api --no-pager"
```

### Upload backend mới (nếu sửa api_server.py)
```powershell
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "C:\Users\MSI\Code_Netprint\Code_NetPrint_8\CRM\api_server.py" root@159.89.202.50:/var/www/netprint/api_server.py
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "systemctl restart netprint-api"
```

## Lệnh SSH từ Windows

### Kiểm tra trạng thái
```powershell
# Xem các process đang chạy trên 3 ports
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "ps aux | grep -E '8501|8503|8505'"

# Xem các process Streamlit đang chạy
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "ps aux | grep streamlit"

# Xem process FastAPI/Uvicorn
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "ps aux | grep uvicorn"

# Xem cấu hình Nginx
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "cat /etc/nginx/sites-enabled/*"

# Xem port đang listen (ptvh: 8501, xs: 8505, tinhgia: không dùng port - nginx serve static)
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "netstat -tulpn | grep -E '8501|8503|8505|80|443'"
```

### Upload file lên VPS

#### Upload cho ptvh.oneliving.vn
```powershell
# Upload 1 file
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "e:\CODE\main_baoviet\app.py" root@159.89.202.50:/var/www/ptvh/main_baoviet/app.py

# Upload folder
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -r "e:\CODE\main_baoviet\modules" root@159.89.202.50:/var/www/ptvh/main_baoviet/
```

#### Upload cho xs.oneliving.vn (Lottery AI)
```powershell
# Upload backend file
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "web\backend\main.py" root@159.89.202.50:/var/www/lottery_ai/backend/main.py

# Upload frontend files
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "web\frontend\index.html" root@159.89.202.50:/var/www/lottery_ai/frontend/index.html
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "web\frontend\app.js" root@159.89.202.50:/var/www/lottery_ai/frontend/app.js
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "web\frontend\styles.css" root@159.89.202.50:/var/www/lottery_ai/frontend/styles.css

# Upload cả folder frontend
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -r "web\frontend" root@159.89.202.50:/var/www/lottery_ai/
```

### Restart các ứng dụng

#### Restart ptvh.oneliving.vn (port 8501 - Streamlit)
```powershell
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "pkill -f 'port=8501'; sleep 2; cd /var/www/ptvh/main_baoviet && nohup venv/bin/python3 -m streamlit run app.py --server.port=8501 --server.address=127.0.0.1 > streamlit_ptvh.log 2>&1 &"
```

#### Restart tinhgia.netprint.vn (port 8510 - CRM Settings API)
```powershell
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "systemctl restart netprint-api"
```

#### Restart xs.oneliving.vn (port 8505 - FastAPI/Uvicorn)
```powershell
# Sử dụng script start_lottery.sh (load API key từ .env file)
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "bash /var/www/lottery_ai/start_lottery.sh"

# Hoặc restart trực tiếp (API key sẽ được load từ .env file trong backend directory)
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "pkill -f 'port 8505'; sleep 2; cd /var/www/lottery_ai/backend && nohup /var/www/lottery_ai/venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8505 > /var/www/lottery_ai/lottery.log 2>&1 &"
```

### Reload Nginx
```powershell
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "nginx -t && systemctl reload nginx"
```

### Xem logs
```powershell
# Streamlit log - ptvh.oneliving.vn
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "tail -50 /var/www/ptvh/main_baoviet/streamlit_ptvh.log"

# CRM API log - tinhgia.netprint.vn
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "journalctl -u netprint-api -n 50 --no-pager"

# FastAPI log - xs.oneliving.vn
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "tail -50 /var/www/lottery_ai/lottery.log"

# Nginx error log
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "tail -50 /var/log/nginx/error.log"

# Nginx access logs
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "tail -50 /var/log/nginx/ptvh_access.log"
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "tail -50 /var/log/nginx/tinhgia_access.log"
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "tail -50 /var/log/nginx/xs_access.log"
```

## Cấu trúc thư mục trên VPS

```
/var/www/
├── ptvh/
│   └── main_baoviet/       # App Streamlit - ptvh.oneliving.vn (port 8501)
│       ├── app.py
│       ├── config.py
│       ├── modules/
│       ├── data/
│       ├── assets/
│       ├── venv/
│       └── streamlit_ptvh.log
├── netprint/               # CRM NetPrint - tinhgia.netprint.vn (static + API port 8510)
│   ├── index.html          # React SPA (Vite build)
│   ├── assets/             # JS/CSS/fonts (Vite build)
│   ├── logo/               # Logo files
│   ├── api_server.py       # Backend Python API (port 8510, systemd: netprint-api)
│   └── data/
│       └── settings.json   # Cài đặt giá, tài khoản, avatar
├── lottery_ai/            # FastAPI - xs.oneliving.vn (port 8505)
│   ├── backend/
│   │   └── main.py        # FastAPI app
│   ├── frontend/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   ├── venv/
│   └── lottery.log
└── fix_all_domains.sh      # Script fix nginx cho các domain
```

## Cấu hình Nginx

### File cấu hình nginx
- `/etc/nginx/sites-available/ptvh.oneliving.vn.conf` → `/etc/nginx/sites-enabled/ptvh.oneliving.vn.conf`
- `/etc/nginx/sites-available/tinhgia.netprint.vn.conf` → `/etc/nginx/sites-enabled/tinhgia.netprint.vn.conf`
- `/etc/nginx/sites-available/xs.oneliving.vn.conf` → `/etc/nginx/sites-enabled/xs.oneliving.vn.conf`

### Chi tiết cấu hình:
- **ptvh.oneliving.vn**: Proxy HTTPS → http://127.0.0.1:8501 (Streamlit)
- **tinhgia.netprint.vn**: Serve static files + Proxy `/api/` → http://127.0.0.1:8510 (Python API). Systemd service: `netprint-api`
- **xs.oneliving.vn**: Proxy HTTPS → http://127.0.0.1:8505 (FastAPI/Uvicorn)

### Upload và apply nginx config
```powershell
# Upload config từ local lên VPS
pscp -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" "web\nginx_*.conf" root@159.89.202.50:/etc/nginx/sites-available/

# Test và reload nginx
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "nginx -t && systemctl reload nginx"
```

## Script sửa lỗi domain
Nếu các domain bị trỏ nhầm, chạy:
```powershell
plink -i "C:\Users\Administrator\.ssh\SSH-DIGITAL.ppk" -batch root@159.89.202.50 "bash /var/www/fix_all_domains.sh"
```

## Lưu ý quan trọng
1. **xs.oneliving.vn**: Route "/" phải serve `index.html` từ frontend, không phải JSON. File `main.py` đã được fix để serve HTML ở route "/".
2. **tinhgia.netprint.vn**: React SPA + Python API backend (port 8510). Nginx serve static + proxy `/api/`. Systemd service `netprint-api` tự khởi động. Data lưu tại `/var/www/netprint/data/settings.json`.
3. **ptvh.oneliving.vn**: Proxy tới Streamlit trên port 8501.
4. Tất cả 3 websites đều có SSL certificate từ Let's Encrypt.
