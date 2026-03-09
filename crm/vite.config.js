import fs from 'fs';
import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const PORT = 3333;
const SETTINGS_FILE = path.resolve(process.cwd(), 'data/settings.json');

// Đảm bảo thư mục data tồn tại
function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

export default defineConfig({
  plugins: [
    react(),
    settingsApiPlugin(),
    checker({
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error'] },
      },
      overlay: false,
    }),
  ],
  resolve: {
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
});
