import { readFileSync } from 'fs';
import path from 'path';

const baselinePath = path.resolve('flow-baseline.json');
const resultPath = path.resolve('flow-result-espaciox.json');

if (!baselinePath || !resultPath) {
  console.error('baseline or result path missing');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));
const result = JSON.parse(readFileSync(resultPath, 'utf-8'));
const step = result.steps?.[0];
if (!step) throw new Error('No Lighthouse steps found');

const metricsAudit = step.lhr.audits.metrics;
const items = metricsAudit?.details?.items?.[0];
if (metricsAudit?.scoreDisplayMode === 'error') {
  console.warn(`Metrics audit error: ${metricsAudit.errorMessage}`);
}

const metricFromAudit = (fallbackId) => step.lhr.audits?.[fallbackId]?.numericValue ?? 0;
const metrics = {
  cumulativeLayoutShift: metricFromAudit('cumulative-layout-shift'),
  largestContentfulPaint: metricFromAudit('largest-contentful-paint'),
  firstContentfulPaint: metricFromAudit('first-contentful-paint'),
};

const current = {
  cls: items?.cumulativeLayoutShift ?? metrics.cumulativeLayoutShift ?? 0,
  lcp: items?.largestContentfulPaint ?? metrics.largestContentfulPaint ?? 0,
  fcp: items?.firstContentfulPaint ?? metrics.firstContentfulPaint ?? 0,
  seo: step.lhr.categories.seo?.score ?? 0
};

const checks = [
  {
    name: 'CLS',
    key: 'cls',
    compare: (cur, base) => cur <= base + 0.1,
    message: (cur, base) => `CLS (${cur.toFixed(3)}) > baseline (${base.toFixed(3)}) +0.1`
  },
  {
    name: 'LCP',
    key: 'lcp',
    compare: (cur, base) => cur <= Math.max(base * 1.2, 4200),
    message: (cur, base) =>
      `LCP (${cur} ms) > max(baseline (${base} ms) * 1.2, 4200 ms noise ceiling)`
  },
  {
    name: 'FCP',
    key: 'fcp',
    compare: (cur, base) => cur <= base * 1.2,
    message: (cur, base) => `FCP (${cur} ms) > baseline (${base} ms) * 1.2`
  },
  {
    name: 'SEO score',
    key: 'seo',
    compare: (cur, base) => cur >= base,
    message: (cur, base) => `SEO score ${cur.toFixed(2)} < baseline ${base.toFixed(2)}`
  }
];

console.log('Baseline vs current metrics:');
for (const item of checks) {
  const cur = current[item.key];
  const base = baseline[item.key];
  const ok = item.compare(cur, base);
  console.log(
    `${item.name}: current ${cur}${item.key === 'cls' ? '' : ' ms'} | baseline ${base}${item.key === 'cls' ? '' : ' ms'} → ${
      ok ? 'OK' : 'REGRESIÓN'
    }`
  );
  if (!ok) {
    console.error(item.message(cur, base));
    process.exit(2);
  }
}
console.log('Flow metrics are within baseline thresholds.');
