import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "github-pages-dist");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(join(root, "dist/client"), outDir, { recursive: true });

const workerUrl = pathToFileURL(join(root, "dist/server/index.js"));
workerUrl.searchParams.set("static-export", String(Date.now()));
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) {
  throw new Error(`Static render failed with status ${response.status}`);
}

const html = rewriteAbsoluteAssetPaths(await response.text());
await writeFile(join(outDir, "index.html"), html);
await writeFile(join(outDir, "404.html"), html);
await writeFile(join(outDir, ".nojekyll"), "");

const assetsDir = join(outDir, "assets");
for (const filename of await readdir(assetsDir)) {
  const assetPath = join(assetsDir, filename);
  if (filename.endsWith(".css")) {
    const css = await readFile(assetPath, "utf8");
    await writeFile(assetPath, css.replaceAll("url(/assets/", "url(./"));
  }
  if (filename.endsWith(".js")) {
    const js = await readFile(assetPath, "utf8");
    await writeFile(
      assetPath,
      js.replaceAll(
        "return`/`+e",
        "return new URL(e.replace(/^assets\\//,``),import.meta.url).href",
      ),
    );
  }
}

function rewriteAbsoluteAssetPaths(html) {
  return html
    .replaceAll('href="/assets/', 'href="./assets/')
    .replaceAll('src="/assets/', 'src="./assets/')
    .replaceAll('href="/favicon.svg"', 'href="./favicon.svg"')
    .replaceAll('import("/assets/', 'import("./assets/')
    .replaceAll("import('/assets/", "import('./assets/")
    .replaceAll("import(`/assets/", "import(`./assets/")
    .replaceAll("href=/assets/", "href=./assets/")
    .replaceAll("url(/assets/", "url(./assets/");
}
