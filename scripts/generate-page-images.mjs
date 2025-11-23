import "dotenv/config";
import OpenAI from "openai";
import sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const imagesToGenerate = [
  {
    filePath: "assets/img/salon-celebraciones.jpg",
    prompt:
      "Warm, photo-realistic celebration lounge with sofas, round tables styled for a family gathering, candles and string lights for an intimate event.",
  },
  {
    filePath: "assets/img/zonas-polivalentes.jpg",
    prompt:
      "Bright multipurpose studio with modular tables, craft supplies and a casual meeting area ready for workshops or kids parties.",
  },
  {
    filePath: "assets/img/instalaciones/office-barra.jpg",
    prompt:
      "Modern catering kitchenette with marble island, coffee machine, stacked plates and fruit bowls ready for events.",
  },
  {
    filePath: "assets/img/instalaciones/salon-evento.jpg",
    prompt:
      "Panoramic banquet hall with long tables, gold chairs and ceiling chandeliers ready for a formal dinner.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-candybar-bodas.jpg",
    prompt:
      "Elegant wedding dessert table with white florals, glass jars of sweets and pastel cakes.",
  },
  {
    filePath: "assets/img/instalaciones/zona-infantil.jpg",
    prompt:
      "Soft indoor play zone with foam blocks, ball pit and kids having fun under adult supervision.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-sonido-luces.jpg",
    prompt:
      "DJ booth with mixer, speakers and colorful stage lighting prepared for a party.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-salon-familiar.jpg",
    prompt:
      "Family lounge area with sofas, coffee tables and decor for a relaxed gathering.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-office-isla.jpg",
    prompt:
      "Kitchen island setup with stools, espresso machine and snacks ready for self-service.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-office-frigo.jpg",
    prompt:
      "Event beverage station with display fridge full of drinks and countertop accessories.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-candybar-infantil.jpg",
    prompt:
      "Colorful kids candy bar with cupcakes, balloons and themed decorations.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-salon-azul.jpg",
    prompt:
      "Large reception room decorated in blue tones with banquet tables and ambient lighting.",
  },
  {
    filePath: "assets/img/instalaciones/instalaciones-sala-empresarial.jpg",
    prompt:
      "Corporate training room with triangular tables, notepads and projector ready for workshops.",
  },
];

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Falta OPENAI_API_KEY en el entorno (.env o variables de entorno).");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  for (const imageDef of imagesToGenerate) {
    const outPath = path.join(repoRoot, imageDef.filePath);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    console.log(`Generando ${imageDef.filePath}...`);

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imageDef.prompt,
      n: 1,
      size: imageDef.size ?? "1024x1024",
    });

    const rawBuffer = Buffer.from(response.data[0].b64_json, "base64");
    let pipeline = sharp(rawBuffer);

    if (imageDef.resize) {
      pipeline = pipeline.resize(imageDef.resize.width, imageDef.resize.height, {
        fit: imageDef.resize.fit ?? "cover",
      });
    } else {
      pipeline = pipeline.resize(1400, 900, { fit: "cover" });
    }

    const finalBuffer = await pipeline.jpeg({ quality: imageDef.quality ?? 80 }).toBuffer();
    await fs.promises.writeFile(outPath, finalBuffer);
    console.log(`→ Guardada ${imageDef.filePath}`);
  }

  console.log("Todas las imágenes han sido regeneradas y optimizadas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

