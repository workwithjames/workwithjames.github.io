import fs from "node:fs";

const workerPath = new URL("../src/index.js", import.meta.url);
const appPath = new URL("../public/app.js", import.meta.url);

let worker = fs.readFileSync(workerPath, "utf8");
if (!worker.includes('from "./gsc.js"')) {
  worker = worker.replace(
    'import { auditTarget, AuditInputError } from "./crawler.js";',
    'import { auditTarget, AuditInputError } from "./crawler.js";\nimport { handleGscRequest, gscConfigured } from "./gsc.js";'
  );
}
worker = worker.replace('version: "0.2.1", database: Boolean(env.DB), authKdf: "pbkdf2-sha256"', 'version: "0.3.0", database: Boolean(env.DB), authKdf: "pbkdf2-sha256", searchConsoleConfigured: gscConfigured(env)');
if (!worker.includes('url.pathname.startsWith("/api/gsc/")')) {
  const anchor = '      const user = await requireUser(request, env);\n      if (user instanceof Response) return user;\n\n';
  if (!worker.includes(anchor)) throw new Error("Could not locate authenticated API routing anchor in src/index.js");
  worker = worker.replace(anchor, `${anchor}      if (url.pathname.startsWith("/api/gsc/")) return handleGscRequest(request, env, user);\n\n`);
}
fs.writeFileSync(workerPath, worker);

let app = fs.readFileSync(appPath, "utf8");
if (!app.includes('/gsc-ui.js')) {
  app += '\n\nimport("/gsc-ui.js?v=20260821-1").catch((error) => console.error("Search Console UI failed to load", error));\n';
}
fs.writeFileSync(appPath, app);

console.log("Integration entrypoints prepared.");
