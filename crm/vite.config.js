import fs from 'fs';
import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const PORT = 3333;
const SETTINGS_FILE = path.resolve(process.cwd(), 'data/settings.json');
const HISTORY_FILE = path.resolve(process.cwd(), 'data/price_history.json');
const MAX_HISTORY = 500;

// Đảm bảo thư mục data tồn tại
function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile(filepath, defaultVal) {
  try {
    if (fs.existsSync(filepath)) return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch { /* ignore */ }
  return defaultVal;
}

function writeJsonFile(filepath, data) {
  ensureDataDir();
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// Plugin API lưu/đọc settings từ file JSON trên ổ cứng
function settingsApiPlugin() {
  return {
    name: 'settings-api',
    configureServer(server) {
      // GET /api/settings — Đọc settings từ file
      server.middlewares.use('/api/settings', (req, res, next) => {
        if (req.method === 'GET') {
          ensureDataDir();
          try {
            if (fs.existsSync(SETTINGS_FILE)) {
              const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end('{}');
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        // POST /api/settings — Lưu settings vào file
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            ensureDataDir();
            try {
              // Validate JSON
              JSON.parse(body);
              fs.writeFileSync(SETTINGS_FILE, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
              console.log('[Settings API] ✅ Settings saved to disk');
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// Plugin API lịch sử tính giá
function historyApiPlugin() {
  return {
    name: 'history-api',
    configureServer(server) {
      server.middlewares.use('/api/history', (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          const history = readJsonFile(HISTORY_FILE, []);
          const userId = url.searchParams.get('userId');
          const filtered = userId ? history.filter(h => h.userId === userId) : history;
          res.end(JSON.stringify(filtered));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const entry = JSON.parse(body);
              const history = readJsonFile(HISTORY_FILE, []);
              history.unshift(entry);
              writeJsonFile(HISTORY_FILE, history.slice(0, MAX_HISTORY));
              res.end(JSON.stringify({ success: true, total: Math.min(history.length, MAX_HISTORY) }));
              console.log(`[History API] ✅ Entry saved by ${entry.userName || '?'}`);
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        if (req.method === 'DELETE') {
          const entryId = url.searchParams.get('id');
          let history = readJsonFile(HISTORY_FILE, []);
          if (entryId) {
            history = history.filter(h => String(h.id) !== String(entryId));
          } else {
            history = [];
          }
          writeJsonFile(HISTORY_FILE, history);
          res.end(JSON.stringify({ success: true, total: history.length }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    settingsApiPlugin(),
    historyApiPlugin(),
    // Chỉ chạy ESLint checker khi dev, bỏ qua khi build
    ...(command === 'serve'
      ? [
          checker({
            eslint: {
              useFlatConfig: true,
              lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
              dev: { logLevel: ['error'] },
            },
            overlay: false,
          }),
        ]
      : []),
  ],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/material/styles',
      '@mui/lab',
      '@mui/system',
      '@mui/x-date-pickers',
      '@mui/x-data-grid',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      'framer-motion',
      'react-router',
      'minimal-shared',
    ],
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.resolve(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: { port: PORT, host: true },
  preview: { port: PORT, host: true },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      '@mui/material',
      '@mui/material/styles',
      '@mui/lab',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      '@iconify/react',
      'framer-motion',
      'dayjs',
      'react-hook-form',
      '@hookform/resolvers',
      'sonner',
      'simplebar-react',
      'nprogress',
      'react-apexcharts',
      'apexcharts',
      'swr',
      'axios',
      'react-dropzone',
      'minimal-shared',
    ],
  },
}));
