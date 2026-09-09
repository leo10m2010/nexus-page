import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:4323";
const server = spawn(process.execPath, ["node_modules/astro/bin/astro.mjs", "preview", "--ignore-lock", "--host", "127.0.0.1", "--port", "4323"], { env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: "1" }, stdio: "ignore" });
let browser;
try {
  const deadline = Date.now() + 20000;
  while (true) {
    try { if ((await fetch(`${base}/admin/sync/`)).ok) break; } catch {}
    if (Date.now() > deadline) throw new Error("Preview no disponible. Ejecuta npm run build antes.");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  await mkdir(".liquipedia-test", { recursive: true });
  browser = await chromium.launch();
  for (const width of [1280, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage(), writes = [], errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let conflict = false, gatewayFailure = false;
    await context.route("**/api/auth", (route) => route.fulfill({ contentType: "text/html", body: `<script>addEventListener('message', e => { if (e.source === opener && e.origin === location.origin) opener.postMessage('authorization:github:success:' + JSON.stringify({token:'mock_token_for_ui_tests_only'}), location.origin); }); opener.postMessage('authorizing:github', location.origin);</script>` }));
    await context.route("**/api/liquipedia/sync", async (route) => {
      const body = route.request().postDataJSON();
      assert.equal(route.request().headers().authorization, "Bearer mock_token_for_ui_tests_only");
      if (gatewayFailure) { await route.fulfill({ status: 502, contentType: "text/html", body: "<h1>Bad Gateway</h1>" }); return; }
      if (body.action === "apply") {
        writes.push(body);
        await route.fulfill({ status: conflict ? 409 : 200, json: conflict ? { error: "La web cambió. Revisa de nuevo." } : { updated: 1, message: "Cambios guardados. La web se actualizará al terminar el despliegue." } });
      } else await route.fulfill({ json: {
        head: "head1", revision: 42, url: "https://liquipedia.net/dota2/NEXUS_SERIES/1", warnings: [], formatChange: { before: "roundRobin", after: "modifiedGsl" },
        rows: [
          { sourceId: "groupA/M1", home: "Amaru Gaming", away: "Pibbles Corp", startsAt: "2026-09-06T17:00:00Z", score: { home: 0, away: 2 }, state: "finished", selectable: true, issues: [], changes: { score: { before: null, after: { home: 0, away: 2 } } } },
          { sourceId: "groupA/M2", home: "Chandogs", away: "Estar Backs", startsAt: "2026-09-06T20:25:00Z", score: null, state: "pending", selectable: true, issues: [], changes: { startsAt: { before: "2026-09-06T20:00:00Z", after: "2026-09-06T20:25:00Z" } } },
          { sourceId: "groupA/M3", home: "<img src=x onerror=window.injected=true>", away: null, startsAt: null, score: null, state: "pending", selectable: false, issues: ["Equipo no reconocido"], changes: {} },
        ],
      } });
    });
    await page.goto(`${base}/admin/sync/`);
    assert.equal(await page.locator("#sync-preview").isDisabled(), true);
    await page.locator("#sync-login").click();
    await page.waitForFunction(() => !document.getElementById("sync-preview").disabled);
    await page.locator("#sync-preview").click();
    await page.locator("#sync-review").waitFor({ state: "visible" });
    assert.equal(await page.locator("#sync-matches li").count(), 3);
    assert.equal(await page.locator("#sync-matches input:checked").count(), 0);
    assert.equal(await page.locator("#sync-matches input:disabled").count(), 1);
    assert.equal(await page.locator("#sync-save").isDisabled(), true);
    assert.equal(await page.locator("#sync-matches img").count(), 0);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `.liquipedia-test/review-${width}.png`, fullPage: true });
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    assert.deepEqual(audit.violations.map((v) => v.id), []);
    await page.locator("#sync-matches input").first().check();
    await page.locator("#sync-save").click();
    await page.locator('#sync-confirm button[value="cancel"]').click();
    assert.equal(writes.length, 0);
    await page.locator("#sync-save").click();
    await page.locator('#sync-confirm button[value="confirm"]').click();
    await page.waitForFunction(() => document.getElementById("sync-review").hidden);
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0].selected, ["groupA/M1"]);
    assert.equal(writes[0].approveFormat, false);
    assert.equal(writes[0].revision, 42);
    assert.equal(await page.evaluate(() => Object.values(localStorage).some((value) => value.includes("mock_token"))), false);
    conflict = true;
    await page.locator("#sync-preview").click();
    await page.locator("#sync-review").waitFor({ state: "visible" });
    await page.locator("#sync-matches input").first().check();
    await page.locator("#sync-save").click(); await page.locator('#sync-confirm button[value="confirm"]').click();
    await page.waitForFunction(() => document.getElementById("sync-status").dataset.error === "true");
    assert.equal(await page.locator("#sync-save").isDisabled(), true);
    gatewayFailure = true;
    const attempts = writes.length;
    await page.locator("#sync-preview").click();
    await page.waitForFunction(() => document.getElementById("sync-status").textContent.includes("HTTP 502"));
    assert.equal(await page.locator("#sync-save").isDisabled(), true);
    assert.equal(writes.length, attempts);
    assert.deepEqual(errors, []);
    await page.goto(`${base}/es/competition/season-one/`);
    await page.locator("#matches").evaluate((el) => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 130, behavior: "instant" }));
    await page.screenshot({ path: `.liquipedia-test/results-${width}.png` });
    await context.close();
    console.log(`PASS admin ${width}px: login, preview, statuses, approval, cancellation, conflicts, escaping, accessibility`);
  }
} finally { if (browser) await browser.close(); server.kill(); }
