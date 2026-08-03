import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the scheduler shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>班班難排搬搬排<\/title>/i);
  assert.match(html, /班班難排搬搬排/);
  assert.match(html, /角色 \/ 人員/);
  assert.match(html, /排班目標/);
  assert.match(html, /時段/);
  assert.match(html, /總統計/);
  assert.match(html, /需求時段/);
  assert.match(html, /週數/);
  assert.match(html, /語言/);
  assert.match(html, /繁中/);
  assert.match(html, /简中/);
  assert.match(html, /EN/);
  assert.match(html, /匯出全部 PNG/);
  assert.match(html, /使用說明/);
  assert.doesNotMatch(html, /designed by yulin, generated with chatgpt/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("removes starter preview code from the product", async () => {
  const templateRoot = new URL("../", import.meta.url);
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const defaultPlan/);
  assert.match(page, /defaultStorageKey/);
  assert.match(page, /coverageWindows/);
  assert.match(page, /applyCoveragePreset/);
  assert.match(page, /weekCountOptions/);
  assert.match(page, /normalizeWeekCount/);
  assert.match(page, /coverageTargetOptions/);
  assert.match(page, /normalizeCoverageTarget/);
  assert.match(page, /translations:\s*Record<Locale, Copy>/);
  assert.match(page, /languageStorageKey/);
  assert.match(page, /setLocale/);
  assert.match(page, /zh-CN/);
  assert.match(page, /Banban Scheduler/);
  assert.match(page, /班班难排搬搬排/);
  assert.match(page, /helpOpen/);
  assert.match(page, /helpSteps/);
  assert.match(page, /用積木方式把班段排進日曆/);
  assert.match(page, /完成後可匯出 PNG、班表 CSV、工時 CSV/);
  assert.doesNotMatch(page, /helpDetails|詳細版本|Detailed version/);
  assert.match(page, /helpDialog/);
  assert.match(page, /helpCredit/);
  assert.match(page, /designed by yulin, generated with chatgpt/);
  assert.match(page, /setupDeck/);
  assert.match(page, /rosterControlGrid/);
  assert.match(page, /targetControlGrid/);
  assert.match(page, /shiftControlGrid/);
  assert.match(page, /singleWeekWorkspace/);
  assert.match(page, /shiftBuilderSection/);
  assert.match(page, /已選班段/);
  assert.match(page, /shiftBuilderSection[\s\S]*selectedShift[\s\S]*totalStats[\s\S]*hours[\s\S]*people[\s\S]*coverageWindows[\s\S]*export[\s\S]*preset/);
  assert.match(page, /chipDeleteButton/);
  assert.match(page, /weekScroll/);
  assert.match(page, /people:\s*\[\]/);
  assert.match(page, /downloadWeekPng/);
  assert.match(page, /schedule-week-/);
  assert.match(page, /schedule-plan\.json/);
  assert.match(page, /exportWeekWidth\s*=\s*2048/);
  assert.match(page, /exportWeekHeight\s*=\s*1600/);
  assert.match(page, /localStorage/);
  assert.match(css, /width:\s*min\(1680px, 100%\)/);
  assert.match(css, /minmax\(292px, 330px\)/);
  assert.match(css, /minmax\(360px, 1\.05fr\) minmax\(330px, \.95fr\)/);
  assert.match(css, /\.languagePicker/);
  assert.match(css, /\.topIconButton/);
  assert.match(css, /\.helpDialog/);
  assert.doesNotMatch(css, /\.helpDetails/);
  assert.match(css, /\.helpCredit/);
  assert.match(css, /font-family:\s*"Bradley Hand", "Segoe Print", "Marker Felt", var\(--font-geist-sans\)/);
  assert.doesNotMatch(css, /Snell Roundhand|Brush Script/);
  assert.doesNotMatch(css, /\.creditLine/);
  assert.match(css, /\.singleWeekWorkspace \.sidePanel/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /max-height:\s*min\(calc\(\(clamp\(24px, 2\.8vh, 30px\) \* 24\) \+ 152px\), calc\(100vh - 28px\)\)/);
  assert.match(css, /\.shiftBuilderSection \.shiftControlGrid/);
  assert.match(css, /repeat\(auto-fit, minmax\(132px, 1fr\)\)/);
  assert.match(css, /--hour-h:\s*clamp\(24px, 2\.8vh, 30px\)/);
  assert.match(layout, /班班難排搬搬排/);
  assert.doesNotMatch(layout, /description:/);
  assert.match(packageJson, /"name": "yulin-scheduler"/);
  assert.match(packageJson, /"lucide-react"/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|Reer Operations|reer-shift/);
  assert.doesNotMatch(page, /roleId|roles/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("app/_sites-preview", templateRoot)));
});
