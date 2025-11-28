/* Proyecto El Santuario
  Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

import "./load-env.js";
// OpenAI se importará dinámicamente solo si es necesario
import sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const imagesToGenerate = [
  {
    filePath: "assets/img/salon-celebraciones.webp",
    prompt:
      "Warm, photo-realistic celebration lounge with sofas, round tables styled for a family gathering, candles and string lights for an intimate event.",
  },
  {
    filePath: "assets/img/zonas-polivalentes.webp",
    prompt:
      "Bright multipurpose studio with modular tables, craft supplies and a casual meeting area ready for workshops or kids parties.",
  },
  {
    filePath: "assets/img/instalaciones/office-barra.webp",
    prompt:
      "Modern catering kitchenette with marble island, coffee machine, stacked plates and fruit bowls ready for events.",
  },
  {
    filePath: "assets/img/instalaciones/salon-evento.webp",
    prompt:
      "Panoramic banquet hall with long tables, gold chairs and ceiling chandeliers ready for a formal dinner.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-candybar-bodas.webp",
    prompt:
      "Elegant wedding dessert table with white florals, glass jars of sweets and pastel cakes.",
  },
  {
    filePath: "assets/img/instalaciones/zona-infantil.webp",
    prompt:
      "Soft indoor play zone with foam blocks, ball pit and kids having fun under adult supervision.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-sonido-luces.webp",
    prompt:
      "DJ booth with mixer, speakers and colorful stage lighting prepared for a party.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-salon-familiar.webp",
    prompt:
      "Family lounge area with sofas, coffee tables and decor for a relaxed gathering.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-office-isla.webp",
    prompt:
      "Kitchen island setup with stools, espresso machine and snacks ready for self-service.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-office-frigo.webp",
    prompt:
      "Event beverage station with display fridge full of drinks and countertop accessories.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-candybar-infantil.webp",
    prompt:
      "Colorful kids candy bar with cupcakes, balloons and themed decorations.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-salon-azul.webp",
    prompt:
      "Large reception room decorated in blue tones with banquet tables and ambient lighting.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-sala-empresarial.webp",
    prompt:
      "Corporate training room with triangular tables, notepads and projector ready for workshops.",
  },
];

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  let openai = null;
  if (apiKey) {
    const { default: OpenAI } = await import("openai");
    openai = new OpenAI({ apiKey });
  }

  for (const imageDef of imagesToGenerate) {
    const outPath = path.join(repoRoot, imageDef.filePath);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    console.log(`Procesando ${imageDef.filePath}...`);

    const webpExists = fs.existsSync(outPath);
    const avifOutPath = outPath.replace(/\.webp$/i, ".avif");
    const avifExists = fs.existsSync(avifOutPath);

    if (webpExists) {
      // Si ya hay WebP, opcionalmente re-encode, pero por defecto solo crear AVIF si falta
      if (!avifExists) {
        const pipeline = sharp(outPath);
        const avifBuffer = await pipeline.avif({ quality: Math.min(80, (imageDef.quality ?? 80)) }).toBuffer();
        await fs.promises.writeFile(avifOutPath, avifBuffer);
        console.log(`→ Guardada ${path.relative(repoRoot, avifOutPath)}`);
      } else {
        console.log(`✓ Ya existe AVIF para ${imageDef.filePath}`);
      }
      continue;
    }

    if (!openai) {
      console.warn(`No existe ${imageDef.filePath} y no hay OPENAI_API_KEY. Omitiendo.`);
      continue;
    }

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imageDef.prompt,
      n: 1,
      size: imageDef.size ?? "1024x1024",
    });

    const rawBuffer = Buffer.from(response.data[0].b64_json, "base64");
    let pipeline = sharp(rawBuffer).resize(1400, 900, { fit: "cover" });
    if (imageDef.resize) {
      pipeline = sharp(rawBuffer).resize(imageDef.resize.width, imageDef.resize.height, {
        fit: imageDef.resize.fit ?? "cover",
      });
    }

    // WebP (nuevo)
    const webpBuffer = await pipeline.webp({ quality: imageDef.quality ?? 80 }).toBuffer();
    await fs.promises.writeFile(outPath, webpBuffer);
    console.log(`→ Guardada ${imageDef.filePath}`);

    // AVIF junto a WebP
    const avifBuffer = await pipeline.avif({ quality: Math.min(80, (imageDef.quality ?? 80)) }).toBuffer();
    await fs.promises.writeFile(avifOutPath, avifBuffer);
    console.log(`→ Guardada ${path.relative(repoRoot, avifOutPath)}`);
  }

  console.log("Todas las imágenes han sido regeneradas y optimizadas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
