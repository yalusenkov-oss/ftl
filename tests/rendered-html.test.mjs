import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the contract generator controls", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>FTL COMPANY<\/title>/);
  assert.match(html, /Сбросить всё/);
  assert.match(html, /Скачать PDF/);
  assert.match(html, /ЛИЦЕНЗИОННЫЙ ДОГОВОР/);
  assert.match(html, /1 000 \(одна тысяча\) рублей/);
  assert.match(html, /Марцинкевич Никита Владимирович/);
});

test("document export keeps page sections and strips the site name from the contract", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /return `\$\{year\}-\$\{String\(random\[0\] % 1_000_000\)/);
  assert.match(page, /\^\\d\{4\}-\\d\{6\}\$/);
  assert.match(page, /localStorage\.removeItem\(DRAFT_STORAGE_KEY\)/);
  assert.match(page, /<title>Договор № \$\{data\.contractNumber\}<\/title>/);
  assert.match(page, /className="document-section appendix-section"/);
  assert.match(page, /className="document-section addendum-section"/);
  assert.doesNotMatch(page, /paper-break/);
  assert.doesNotMatch(page, /ЛИЦЕНЗИОННЫЙ ДОГОВОР DreamMotion/);
  assert.match(page, /Минимальная накопленная сумма для выплаты составляет <b>1 000/);
  assert.match(page, /name: "Марцинкевич Никита Владимирович"/);
  assert.match(page, /passport: "5224 399808"/);
  assert.match(page, /passportDivisionCode: "550-001"/);
  assert.match(page, /address: "Омск, Саргатский р-н, ул\. Мопра, 13"/);
  assert.match(page, /DRAFT_STORAGE_KEY = "ftl-company-contract-draft"/);
  assert.match(page, /SIGNATURE_SRC = "\/signature-martsinkevich\.png"/);
  assert.match(page, /Факсимильное воспроизведение подписи Марцинкевича Никиты Владимировича/);
  assert.match(page, /replaceAll\(`src="\$\{SIGNATURE_SRC\}"`/);
  assert.doesNotMatch(page, /Курочкин|DreamMotion|signature-kurochkin/);
  assert.match(page, /<th>Смежные права<\/th><th>Авторские права<\/th>/);
  assert.match(page, /<td>100%<\/td><td>100%<\/td>/);
  assert.doesNotMatch(page, /link\.download = `\$\{fileName\}\.html`/);
  assert.match(css, /\.document-section \{ break-before:page; page-break-before:always;/);
  assert.match(css, /\.addendum-section \{ break-inside:avoid; page-break-inside:avoid;/);
  assert.match(css, /@page \{ size:A4; margin:10mm 18mm 14mm; \}/);
});
