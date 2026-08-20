import { chromium } from 'playwright';

const OUT = 'C:\\Users\\Micro\\AppData\\Local\\Temp\\claude\\c--Users-Micro-Downloads-estudeseg\\cc24a0b5-b99f-4574-bf9e-81afa610944b\\scratchpad\\';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1400 } })).newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Curso EJA EAD', { timeout: 15000 });
await page.getByText('Curso EJA EAD').scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, -60));
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + 'eja-cards-height-fixed.png' });

const heights = await page.evaluate(() => {
  const h = Array.from(document.querySelectorAll('h3')).find(x => x.textContent.includes('EJA EAD'));
  const row = h.closest('div').parentElement.querySelector('.overflow-x-auto');
  return Array.from(row.children).map(c => c.getBoundingClientRect().height);
});
console.log('card heights:', JSON.stringify(heights));

await browser.close();
