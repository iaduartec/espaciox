import sharp from 'sharp';
import { existsSync } from 'fs';

const sourcePng = 'assets/img/zonas-polivalentes.png';
const widths = [600, 900, 1200];
const targetImages = [];

if (!existsSync(sourcePng)) {
  console.error('Source image not found:', sourcePng);
  process.exit(1);
}

await Promise.all(
  widths.flatMap((width) => {
    const webp = `assets/img/zonas-polivalentes-hero-${width}w.webp`;
    const avif = `assets/img/zonas-polivalentes-hero-${width}w.avif`;
    targetImages.push({ width, webp, avif });
    return [
      sharp(sourcePng).resize({ width }).webp({ quality: 80 }).toFile(webp),
      sharp(sourcePng).resize({ width }).avif({ quality: 70 }).toFile(avif),
    ];
  })
);

console.log('Hero image optimized:', targetImages);
