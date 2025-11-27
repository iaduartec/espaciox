import './load-env.js';

/**
 * Simple header validator for static assets and pages.
 * Usage:
 *   node scripts/header-validator.js https://example.com/ https://example.com/assets/css/styles.css
 * If no args are provided, it falls back to espaciox defaults.
 */
const defaultBase = process.env.ESPACIOX_STATIC_BASE || 'https://espaciox.onrender.com';
const shouldSkipFetch = Boolean(process.env.SKIP_HEADER_FETCH);

const urls = process.argv.slice(2).filter(Boolean).length
  ? process.argv.slice(2)
  : [
    `${defaultBase}/`,
    `${defaultBase}/api/spaces`,
  ];

// Expected headers (regex match)
const expectedHeaders = {
  'cache-control': /max-age=31536000.*immutable/i,
  'x-content-type-options': /nosniff/i,
  'content-security-policy': /frame-ancestors/i,
};

// Headers that should not appear
const forbiddenHeaders = ['x-frame-options', 'x-xss-protection', 'expires'];

const fetchHeaders = async (url) => {
  // Try HEAD first; some hosts block it, so fallback to GET
  const res = await fetch(url, { method: 'HEAD' });
  if (res.status === 405 || res.status === 501) {
    return fetch(url, { method: 'GET' });
  }
  return res;
};

const validate = async (url) => {
  if (shouldSkipFetch) {
    console.warn(`⏭ SKIP_HEADER_FETCH activo. Se omite la revisión de ${url}.`);
    return;
  }

  try {
    const res = await fetchHeaders(url);
    console.log(`\n🔍 Revisando: ${url} (status ${res.status})`);

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
