import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = new URL('../.mediakit-test/', import.meta.url);
const base = process.env.MEDIAKIT_BASE_URL || 'http://127.0.0.1:4322';
const routes = { en: '/mediakit', es: '/es/mediakit', ru: '/ru/mediakit' };
const report = { base, started: new Date().toISOString(), checks: [], screenshots: [], axe: [], runtime: [] };
let server, browser, serverError, serverLog = '';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function check(name, run) {
  try { await run(); report.checks.push({ name, passed: true }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.error(`FAIL ${name}: ${error.message.slice(0, 450)}`); }
}
async function images(page) {
  await page.evaluate(() => document.fonts.ready);
  for (const image of await page.locator('img:visible').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img) => Promise.race([
      img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error(`Image timeout: ${img.currentSrc || img.src}`)), 8000)),
    ]));
    assert.ok(await image.evaluate((img) => img.complete && img.naturalWidth > 0), 'Broken visible image');
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}
async function overflow(page) {
  const failures = await page.evaluate(() => {
    const selectors = 'html, body, .mediakit, .wrap, .facts, .team-list, .season-roadmap, .scene-controls, [data-scene-panel], .preview-canvas, .placements, .channel-layout, .scheduled-line, .broadcast-time, .proposal-steps';
    return [...document.querySelectorAll(selectors)].filter((el) => el.checkVisibility()).flatMap((el) => {
      const r = el.getBoundingClientRect();
      return el.scrollWidth > el.clientWidth + 2 || r.left < -2 || r.right > innerWidth + 2
        ? [{ element: el.id || el.className || el.tagName, client: el.clientWidth, scroll: el.scrollWidth, left: r.left, right: r.right }] : [];
    });
  });
  assert.deepEqual(failures, [], 'Horizontal overflow: ' + JSON.stringify(failures));
}
try {
  await mkdir(artifacts, { recursive: true });
  if (!process.env.MEDIAKIT_BASE_URL) {
    // Keep this test server in the foreground, including inside agent environments.
    server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', '4322'], { cwd: root, env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.on('error', (error) => { serverError = error.message; });
    for (const stream of [server.stdout, server.stderr]) stream.on('data', (data) => { serverLog = (serverLog + data).slice(-12000); });
  }
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) {
    if (serverError || (server && server.exitCode !== null)) throw new Error(`Astro preview failed: ${serverError || serverLog}`);
    try { ready = (await fetch(new URL('/es/mediakit', base), { signal: AbortSignal.timeout(1500) })).ok; } catch {}
    if (ready) break;
    await pause(250);
  }
  assert.ok(ready, `Readiness timeout (30s): ${base}/es/mediakit. Build dist first. ${serverLog}`);
  browser = await chromium.launch();
  const matrix = Object.keys(routes).flatMap((locale) => [320, 390, 768, 1024, 1440, 1920].map((width) => ({ locale, width, theme: 'dark' })));
  matrix.push(...[390, 768, 1440].map((width) => ({ locale: 'es', width, theme: 'light' })));
  for (const { locale, width, theme } of matrix) {
    const id = `${locale}-${width}-${theme}`;
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce', hasTouch: width < 768 });
    await context.addInitScript((value) => localStorage.setItem('nexus-theme', value), theme);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(15000);
    const errors = [];
    page.on('pageerror', (error) => errors.push({ type: 'pageerror', message: error.message }));
    page.on('console', (message) => { if (message.type() === 'error') errors.push({ type: 'console', message: message.text() }); });
    const test = (label, run) => check(`${id}: ${label}`, run);
    try {
      await test('navigation', async () => assert.equal((await page.goto(new URL(routes[locale], base).href)).status(), 200));
      await test('initial contract', async () => {
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.equal(await page.locator('.team-list img').count(), 8);
        assert.equal(await page.locator('.season-roadmap li').count(), 3);
        assert.equal(await page.locator('[data-print]').count(), 0);
        assert.equal(await page.locator('.header-links a:visible').count(), 3);
        const contact = new URL(await page.locator('.cover-pitch .btn').getAttribute('href'));
        assert.ok(contact.searchParams.get('body')?.trim().length > 50, 'Missing proposal brief');
        assert.ok(await page.locator('.season-roadmap li').evaluateAll((els) => els.every((el) => getComputedStyle(el).getPropertyValue('--stage-color').trim())));
        assert.equal(await page.locator('[data-scene-button]').count(), 4);
        assert.equal(await page.locator('[data-scene-panel]').count(), 4);
        assert.equal(await page.locator('[data-scene-button][aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator('[data-scene-button]').nth(1).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('figure[data-scene-panel]:visible').count(), 1);
        assert.match(await page.locator('[data-scene-panel]:visible img').first().getAttribute('src'), /mediakit-draft\.webp/);
        assert.equal(await page.locator('button[data-sponsor-toggle]').getAttribute('aria-pressed'), 'false');
        const markers = page.locator('[data-scene-panel]:visible .sponsor-marker');
        assert.ok(await markers.count(), 'Missing initial sponsor markers');
        for (const marker of await markers.all()) { assert.equal(await marker.isVisible(), false); assert.notEqual(await marker.getAttribute('hidden'), null); }
        for (const selector of ['details#schedule', 'details.proposal-details']) assert.equal(await page.locator(selector).getAttribute('open'), null);
        assert.equal(await page.locator('#information .media-evidence').count(), 1);
        assert.equal(await page.locator('[data-demo], .sample-metrics, .report-summary, .demo-disclaimer').count(), 0);
        assert.doesNotMatch(await page.locator('#information').innerText(), /24[.,\s]?800|58[.,\s]?400|18[.,\s]?600/);
        const sectionOrder = await page.locator('main > section[id]').evaluateAll((sections) => sections.map((section) => section.id));
        assert.deepEqual(sectionOrder, ['tournament', 'visibility', 'broadcast', 'season', 'information', 'contact']);
        assert.match(await page.locator('#information .commercial-cta').getAttribute('href'), /^mailto:partners@nexusseries\.org\?subject=.+&body=.+/);
      });
      await test('noindex', async () => assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /\bnoindex\b/i));
      await test('initial images/fonts', () => images(page));
      await test('initial overflow', () => overflow(page));
      if ([390, 768, 1440].includes(width)) await test('initial screenshot', async () => {
        const filename = `${id}-initial.png`;
        await page.screenshot({ path: fileURLToPath(new URL(filename, artifacts)), fullPage: true, animations: 'disabled' });
        report.screenshots.push(filename);
      });
      if ((locale === 'es' && ((width === 1440 && theme === 'dark') || (width === 390 && theme === 'light'))) || (locale === 'ru' && width === 768)) await test('axe', async () => {
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        report.axe.push({ id, violations: result.violations, incomplete: result.incomplete });
        assert.equal(result.violations.length, 0, `Axe: ${result.violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}`);
      });
      await test('touch targets', async () => {
        for (const button of await page.locator('[data-scene-button], [data-sponsor-toggle]').all()) {
          const box = await button.boundingBox();
          assert.ok(box && box.width >= 44 && box.height >= 44, `Target <44px: ${await button.textContent()} ${JSON.stringify(box)}`);
          assert.ok((await button.getAttribute('aria-label')) || (await button.innerText()).trim(), 'Unnamed control');
        }
      });
      for (let scene = 0; scene < 4; scene++) await test(`scene ${scene} / sponsors / asset`, async () => {
        await page.locator('[data-scene-button]').nth(scene).click();
        assert.equal(await page.locator('[data-scene-button][aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator('[data-scene-button]').nth(scene).getAttribute('aria-pressed'), 'true');
        const panel = page.locator('[data-scene-panel]:visible');
        assert.equal(await panel.count(), 1);
        assert.equal(await page.locator('[data-scene-panel]').nth(scene).isVisible(), true);
        const link = panel.locator('a.preview-expand');
        assert.equal(await link.getAttribute('target'), '_blank');
        const href = await link.getAttribute('href');
        assert.match(href, /^\/media\/mediakit-[\w-]+\.webp$/);
        const asset = await context.request.get(new URL(href, base).href, { maxRetries: 1 });
        assert.equal(asset.status(), 200);
        assert.ok((await asset.body()).length <= 512000, `Oversized preview: ${href}`);
        await panel.locator('img').evaluate((img) => img.decode());
        assert.ok(await panel.locator('img').evaluate((img) => img.naturalWidth <= 1920), 'Unoptimized image dimensions');
        assert.equal(await panel.locator('.game-feed-note').count(), 0);
        const markers = panel.locator('.sponsor-marker');
        assert.ok(await markers.count(), 'Missing sponsor markers');
        for (const pressed of ['false', 'true', 'false']) {
          const toggle = page.locator('button[data-sponsor-toggle]');
          if (await toggle.getAttribute('aria-pressed') !== pressed) await toggle.click();
          assert.equal(await toggle.getAttribute('aria-pressed'), pressed);
          for (const marker of await markers.all()) { assert.equal(await marker.isVisible(), pressed === 'true'); assert.equal(await marker.getAttribute('hidden') !== null, pressed === 'false'); }
        }
        await images(page);
        await overflow(page);
      });
      await test('schedule geometry', async () => {
        await page.locator('details#schedule > summary').click();
        const rows = page.locator('#schedule .scheduled-line');
        assert.equal(await rows.count(), 4);
        for (const row of await rows.all()) {
          const times = row.locator('.broadcast-time');
          assert.equal(await times.locator('time').count(), 2);
          assert.match(await times.innerText(), /PET/); assert.match(await times.innerText(), /CEST/);
          const [home, away, clock, line] = await Promise.all([row.locator('.home-seat').boundingBox(), row.locator('.away-seat').boundingBox(), times.boundingBox(), row.boundingBox()]);
          assert.ok(home && away && clock && line, 'Hidden schedule geometry');
          assert.ok(clock.x >= home.x + home.width - 2 && clock.x + clock.width <= away.x + 2, 'Hours overlap teams');
          assert.ok(Math.abs(clock.x + clock.width / 2 - (line.x + line.width / 2)) <= 2, 'Hours not centered between teams');
          for (const time of await times.locator('time').all()) { const b = await time.boundingBox(); assert.ok(b && b.x >= clock.x - 2 && b.x + b.width <= clock.x + clock.width + 2, 'Hour outside central column'); }
        }
        await images(page); await overflow(page);
      });
      await test('locale menu / Escape', async () => {
        const toggle = page.locator('.kit-header [data-locale-toggle]');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.ok(await page.locator('#locale-menu').isVisible());
        const links = await page.locator('#locale-menu a').evaluateAll((els) => els.map((el) => new URL(el.href).pathname.replace(/\/$/, '')));
        assert.deepEqual(links.sort(), Object.values(routes).sort());
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('#locale-menu').isVisible(), false);
      });
      await test('keyboard controls and theme', async () => {
        const scene = page.locator('[data-scene-button]').nth(1);
        await scene.focus(); await page.keyboard.press('Enter');
        assert.equal(await scene.getAttribute('aria-pressed'), 'true');
        const sponsor = page.locator('[data-sponsor-toggle]');
        await sponsor.focus(); await page.keyboard.press('Enter');
        assert.equal(await sponsor.getAttribute('aria-pressed'), 'true');
        await page.keyboard.press('Enter');
        assert.equal(await sponsor.getAttribute('aria-pressed'), 'false');
        const summary = page.locator('details.proposal-details > summary');
        await summary.focus(); await page.keyboard.press('Enter');
        assert.notEqual(await page.locator('details.proposal-details').getAttribute('open'), null);
        await overflow(page);
        await summary.focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('details.proposal-details').getAttribute('open'), null);
        await page.locator('[data-theme-toggle]').click();
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme === 'dark' ? 'light' : 'dark');
        await overflow(page);
      });
    } finally { await context.close(); report.runtime.push({ id, errors }); await test('console/pageerror', () => assert.deepEqual(errors, [])); }
    console.log(`Checked ${id}`);
  }
  for (const home of ['/', '/es/', '/ru/']) await check(`home ${home}: no mediakit links`, async () => {
    const page = await browser.newPage();
    try { assert.equal((await page.goto(new URL(home, base).href, { timeout: 15000 })).status(), 200); assert.equal(await page.locator('a[href*="mediakit"]').count(), 0); } finally { await page.close(); }
  });
  await check('no-JavaScript fallback', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage(); await page.goto(new URL('/es/mediakit/', base).href);
      assert.equal(await page.locator('[data-scene-panel]:visible').count(), 4);
      assert.equal(await page.locator('[data-sponsor-toggle]:visible').count(), 0);
      await page.locator('#schedule > summary').click();
      assert.equal(await page.locator('#schedule .scheduled-line:visible').count(), 4);
    } finally { await context.close(); }
  });
  await check('sitemap excludes mediakit', async () => {
    const pending = [new URL('/sitemap-index.xml', base).href], seen = new Set();
    while (pending.length) {
      const url = pending.shift(); if (seen.has(url)) continue;
      seen.add(url); assert.ok(seen.size <= 20, 'Sitemap crawl exceeds 20 documents');
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) }); assert.equal(response.status, 200);
      const xml = await response.text(); assert.match(xml, /<(sitemapindex|urlset)\b/); assert.doesNotMatch(xml, /mediakit/i);
      if (/<sitemapindex\b/.test(xml)) for (const match of xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)) { const child = new URL(match[1].replaceAll('&amp;', '&'), url); pending.push(new URL(child.pathname + child.search, base).href); }
    }
  });
} catch (error) { await check('runner', () => { throw error; }); }
finally {
  if (browser) await check('browser cleanup', () => browser.close());
  if (server && server.exitCode === null) { server.kill(); await Promise.race([new Promise((resolve) => server.once('exit', resolve)), pause(3000)]); if (server.exitCode === null) server.kill('SIGKILL'); }
  report.finished = new Date().toISOString(); report.serverLog = serverLog;
  report.failed = report.checks.filter((item) => !item.passed).length;
  await mkdir(artifacts, { recursive: true });
  await writeFile(new URL('report.json', artifacts), JSON.stringify(report, null, 2));
  console.log(`${report.checks.length} checks, ${report.failed} failures. Artifacts: .mediakit-test/`);
  if (report.failed) process.exitCode = 1;
}
