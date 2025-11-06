#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = path.resolve(__dirname, '..', '..');
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
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') {
    pathname = '/snap.html';
  }
  const filePath = path.join(root, pathname);
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    if (stat.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      fs.readFile(index, (err2, data) => {
        if (err2) { res.statusCode = 404; res.end('Not found'); return; }
        res.setHeader('Content-Type', MIME['.html']);
        res.end(data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err3, data) => {
      if (err3) { res.statusCode = 500; res.end('Error'); return; }
      res.setHeader('Content-Type', mime);
      res.end(data);
    });
  });
}

http.createServer(serve).listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}/`);
});