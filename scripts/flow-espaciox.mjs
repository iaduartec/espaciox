import puppeteer from 'puppeteer';
import { startFlow } from 'lighthouse';
import { writeFileSync } from 'fs';

const target = 'https://espaciox.vercel.app/';
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
const flow = await startFlow(page, { name: 'flow-espaciox' });

console.log(`Running Lighthouse Flow against ${target}`);
await flow.navigate(target);
await flow.startTimespan();
await new Promise((resolve) => setTimeout(resolve, 3500));
await flow.endTimespan();

await flow.snapshot();

const report = await flow.generateReport();
writeFileSync('flow-report-espaciox.html', report);
writeFileSync('flow-result-espaciox.json', JSON.stringify(await flow.createFlowResult(), null, 2));

await browser.close();
console.log('Report saved to flow-report-espaciox.html and flow-result-espaciox.json');
