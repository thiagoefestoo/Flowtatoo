import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function utf8HtmlHeaders() {
  return {
    name: 'flowtatoo-utf8-html-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url?.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url?.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), utf8HtmlHeaders()],
});
