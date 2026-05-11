import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env.local in development (localhost, local tsx watch, etc.)
// In production (Vercel, Railway, Docker), env vars are already set by the platform
if (process.env.NODE_ENV !== 'production') {
  const envPath = join(projectRoot, '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
