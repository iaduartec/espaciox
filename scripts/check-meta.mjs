import { promises as fs } from 'fs';
import path from 'path';

const root = path.resolve('.');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name.startsWith('flow-report')) {
        continue;
      }
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      if (entry.name.startsWith('flow-report')) continue;
      files.push(fullPath);
    }
  }
  return files;
}

async function analyze() {
  const files = await walk(root);
  const report = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const hasTitle = /<title>.*<\/title>/i.test(content);
    const hasCanonical = /<link\s+rel=["']canonical["']/i.test(content);
    const hasRobots = /<meta\s+name=["']robots["']/i.test(content);
    if (!hasTitle || !hasCanonical || !hasRobots) {
      report.push({
        file: path.relative(root, file),
        title: Boolean(hasTitle),
        canonical: Boolean(hasCanonical),
        robots: Boolean(hasRobots),
      });
    }
  }
  if (!report.length) {
    console.log('✅ Todas las páginas HTML tienen <title>, canonical y robots.');
    return;
  }
  console.log('🚨 Páginas con meta faltantes:');
  for (const entry of report) {
    const missing = [];
    if (!entry.title) missing.push('<title>');
    if (!entry.canonical) missing.push('canonical');
    if (!entry.robots) missing.push('robots');
    console.log(`${entry.file}: faltan ${missing.join(', ')}`);
  }
  process.exit(1);
}

analyze().catch((error) => {
  console.error('Error al analizar metadatos:', error);
  process.exit(2);
});
