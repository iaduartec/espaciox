import "dotenv/config";
import OpenAI from "openai";
import { Jimp } from "jimp";
import * as path from "node:path";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Falta OPENAI_API_KEY en el entorno (.env o variables de entorno).");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  const baseDir = path.resolve(new URL("../assets/img", import.meta.url).pathname, "instalaciones");

  const imagesToGenerate = [
    {
      fileName: "office-barra.jpg",
      prompt:
        "Photo-realistic image of a modern, bright kitchenette in a private event venue, with marble countertop, steel pots, a bowl of lemons and colorful details, styled for small parties and corporate events.",
    },
    {
      fileName: "salon-evento.jpg",
      prompt:
        "Photo-realistic image of an elegant event hall with round tables dressed in white, golden chairs and large crystal chandeliers turned on, ready for a family celebration or corporate dinner.",
    },
    {
      fileName: "zona-infantil.jpg",
      prompt:
        "Photo-realistic indoor kids play area with padded floor, colorful hoops and soft blocks, with an adult monitor nearby helping a small child, safe and joyful atmosphere.",
    },
  ];

  for (const { fileName, prompt } of imagesToGenerate) {
    console.log(`Generando imagen para ${fileName}...`);

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageBase64 = response.data[0].b64_json;
    const buffer = Buffer.from(imageBase64, "base64");

    const image = await Jimp.read(buffer);
    image.quality(80).resize(1024, Jimp.AUTO);

    const outPath = path.join(baseDir, fileName);
    await image.writeAsync(outPath);
    console.log(`→ Guardada ${outPath}`);
  }

  console.log("Imágenes generadas y optimizadas (JPG, 1024px de ancho, calidad 80).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
