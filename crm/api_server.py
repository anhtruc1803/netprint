#!/usr/bin/env python3
"""
NetPrint CRM - Settings API Backend
Lưu/đọc cài đặt từ file JSON trên VPS
Port: 8510
"""
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

SETTINGS_FILE = '/var/www/netprint/data/settings.json'

class SettingsHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/api/settings':
            try:
                if os.path.exists(SETTINGS_FILE):
                    with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                        data = f.read()
                    self._set_headers()
                    self.wfile.write(data.encode())
                else:
                    self._set_headers()
                    self.wfile.write(b'{}')
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(b'{"error": "Not found"}')

    def do_POST(self):
        if self.path == '/api/settings':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                # Validate JSON
                json.loads(body)
                # Ensure directory exists
                os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
                with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
                    f.write(body)
                self._set_headers()
                self.wfile.write(b'{"success": true}')
                print(f'[Settings API] Saved settings ({len(body)} bytes)')
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(b'{"error": "Not found"}')

    def log_message(self, format, *args):
        pass  # Tắt log mặc định

if __name__ == '__main__':
    port = 8510
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    server = HTTPServer(('127.0.0.1', port), SettingsHandler)
    print(f'NetPrint Settings API running on port {port}')
    server.serve_forever()
