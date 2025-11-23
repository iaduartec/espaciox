import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Falta GOOGLE_API_KEY en el entorno (.env o variables de entorno).");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  const baseDir = path.resolve(new URL("../assets/img", import.meta.url).pathname, "instalaciones");

  const imagesToGenerate = [
    {
      fileName: "office-barra.jpg",
      prompt:
        "Fotografía realista de un office moderno y luminoso en un salón privado, con encimera de mármol, ollas de acero, frutero con limones y pequeños toques de color, pensado para eventos familiares y de empresa.",
    },
    {
      fileName: "salon-evento.jpg",
      prompt:
        "Fotografía realista de un salón de celebraciones elegante con mesas redondas vestidas de blanco, sillas doradas y grandes lámparas de cristal encendidas, listo para un banquete o comunión.",
    },
    {
      fileName: "zona-infantil.jpg",
      prompt:
        "Fotografía realista de una zona infantil interior acolchada, con aros de colores, colchonetas y un monitor adulto acompañando a una niña pequeña que juega, ambiente seguro y alegre.",
    },
  ];

  await fs.promises.mkdir(baseDir, { recursive: true });

  for (const { fileName, prompt } of imagesToGenerate) {
    console.log(`Generando imagen para ${fileName}...`);

    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
      },
    });

    const generatedImage = response.generatedImages[0];
    const imgBytes = generatedImage.image.imageBytes;
    const buffer = Buffer.from(imgBytes, "base64");
    const outPath = path.join(baseDir, fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`→ Guardada ${outPath}`);
  }

  console.log("Imágenes generadas. Asegúrate de que las rutas en las páginas HTML apunten a estos archivos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

