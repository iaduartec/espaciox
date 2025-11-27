import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const [target, label] = process.argv.slice(2);
if (!target) {
  console.error('Usage: node run-flows.mjs <url> <label>');
  process.exit(1);
}

import { createRequire } from 'module';
import puppeteer from 'puppeteer';

const require = createRequire(import.meta.url);
const { startFlow } = require('lighthouse');

const browser = await puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process',
  ],
});
const page = await browser.newPage();
const flow = await startFlow(page, {
  name: `flow-${label}`,
});

console.log(`Running Flow for ${target}`);
await flow.navigate(target);
await flow.startTimespan();
await page.waitForTimeout(4000);
await flow.endTimespan();
await flow.snapshot();

const report = await flow.generateReport();
writeFileSync(`flow-report-${label}.html`, report);
const result = await flow.createFlowResult();
writeFileSync(`flow-result-${label}.json`, JSON.stringify(result, null, 2));

await browser.close();
console.log(`Flow ${label} done.`);
