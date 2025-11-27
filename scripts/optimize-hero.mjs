import sharp from 'sharp';
import { existsSync } from 'fs';

const sourcePng = 'assets/img/zonas-polivalentes.png';
const targetWebp = 'assets/img/zonas-polivalentes-hero.webp';
const targetAvif = 'assets/img/zonas-polivalentes-hero.avif';

if (!existsSync(sourcePng)) {
  console.error('Source image not found:', sourcePng);
  process.exit(1);
}

await Promise.all([
  sharp(sourcePng)
    .resize({ width: 1200 })
    .webp({ quality: 80 })
    .toFile(targetWebp),
  sharp(sourcePng)
    .resize({ width: 1200 })
    .avif({ quality: 70 })
    .toFile(targetAvif),
]);

console.log('Hero image optimized:', targetWebp, targetAvif);
