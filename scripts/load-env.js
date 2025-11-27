import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const [key, ...rest] = line.split('=');
    if (!key) continue;

    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
