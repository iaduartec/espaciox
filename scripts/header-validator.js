import 'dotenv/config';

/**
 * Simple header validator for static assets and pages.
 * Usage:
 *   node scripts/header-validator.js https://example.com/ https://example.com/assets/css/styles.css
 * If no args are provided, it falls back to the URLs in the default list.
 */
const baseUrl = process.env.ESPACIOX_STATIC_BASE || 'https://tusitio.com';

const urls = process.argv.slice(2).filter(Boolean).length
  ? process.argv.slice(2)
  : [
    `${baseUrl}/`,
    `${baseUrl}/assets/css/styles.css`,
    `${baseUrl}/assets/js/main.js`,
    `${baseUrl}/assets/img/logo.png`,
  ];

// Expected headers (regex match)
const expectedHeaders = {
  'cache-control': /max-age=31536000.*immutable/i,
  'x-content-type-options': /nosniff/i,
  'content-security-policy': /frame-ancestors/i,
};

// Headers that should not appear
const forbiddenHeaders = ['x-frame-options', 'x-xss-protection', 'expires'];

const validate = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`\n🔍 Revisando: ${url}`);

    for (const [key, regex] of Object.entries(expectedHeaders)) {
      const value = res.headers.get(key);
      if (value && regex.test(value)) {
        console.log(`✅ ${key} correcto: ${value}`);
      } else {
        console.warn(`⚠️ Falta o incorrecto: ${key}`);
      }
    }

    for (const header of forbiddenHeaders) {
      const value = res.headers.get(header);
      if (value) {
        console.error(`❌ Cabecera obsoleta detectada: ${header} = ${value}`);
      }
    }
  } catch (error) {
    console.error(`Error al revisar ${url}: ${error.message}`);
  }
};

const run = async () => {
  for (const url of urls) {
    await validate(url);
  }
};

run();
