import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the Vite build output (this handles CSS/JS/images, etc.)
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route for client-side routing: Serve index.html for all other paths (including root '/')
// Use '/{*splat}' to match everything, including the root path
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use Render's PORT or default to 10000
const port = process.env.PORT || 10000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

// Increase timeouts to prevent potential 502 errors (as discussed previously)
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;