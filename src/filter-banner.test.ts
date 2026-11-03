import {afterAll, beforeAll, expect, test} from 'bun:test';
import {chromium, type Browser} from 'playwright';
import {handle} from './app';
import {openDatabase} from './storage';

let browser: Browser;
let server: ReturnType<typeof Bun.serve>;

beforeAll(async () => {
  const db = openDatabase(':memory:');
  server = Bun.serve({port: 0, fetch: (req) => handle(req, db)});
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  server?.stop(true);
});

test('the filter banner is absent without a filter and present with one', async () => {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.port}/`);

  await expect(page.locator('#filter').isVisible()).resolves.toBe(false);
  await expect(page.locator('#clear-filter').isVisible()).resolves.toBe(false);

  await page.fill('#url', 'https://example.com/a');
  await page.fill('#tags', 'news');
  await page.click('#save');
  await page.click('button.tag');
  await page.waitForSelector('#filter:not([hidden])');

  await expect(page.locator('#filter').isVisible()).resolves.toBe(true);
  await expect(page.locator('#filter-tag').textContent()).resolves.toBe('news');

  await page.click('#clear-filter');
  await page.waitForSelector('#filter', {state: 'hidden'});
  await expect(page.locator('#filter').isVisible()).resolves.toBe(false);
  await page.close();
});
