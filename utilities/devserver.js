#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// project root: one level up from utilities directory
const root = path.resolve(__dirname, '..');
const port = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon'
};

function serve(req, res) {
  const parsed = url.parse(req.url || '/');
  let pathname = decodeURIComponent(parsed.pathname || '/');
  console.log(`[REQ] ${req.method} ${pathname}`);
  // default route
  if (pathname === '/') {
    pathname = 'snap.html';
  }
  // strip leading slashes to ensure proper join on Windows
  pathname = pathname.replace(/^\/+/, '');
  let filePath = path.join(root, pathname);
  console.log(`[MAP] -> ${filePath}`);
  fs.stat(filePath, (err, stat) => {
    // fallback to snap.html if requested path missing
    if (err) {
      const fallback = path.join(root, 'snap.html');
      fs.stat(fallback, (e2, s2) => {
        if (e2 || !s2 || !s2.isFile()) {
          res.statusCode = 404;
          res.end('Not found');
          console.warn(`[404] ${pathname}`);
          return;
        }
        fs.readFile(fallback, (e3, data) => {
          if (e3) { res.statusCode = 500; res.end('Error'); return; }
          res.setHeader('Content-Type', MIME['.html']);
          res.end(data);
          console.log(`[FALLBACK] -> snap.html`);
        });
      });
      return;
    }
    if (stat.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      fs.readFile(index, (err2, data) => {
        if (err2) { res.statusCode = 404; res.end('Not found'); console.warn(`[404] dir index ${index}`); return; }
        res.setHeader('Content-Type', MIME['.html']);
        res.end(data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err3, data) => {
      if (err3) { res.statusCode = 500; res.end('Error'); console.error(`[500] read ${filePath}: ${err3}`); return; }
      res.setHeader('Content-Type', mime);
      res.end(data);
      console.log(`[200] ${filePath} (${mime})`);
    });
  });
}

http.createServer(serve).listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}/`);
});