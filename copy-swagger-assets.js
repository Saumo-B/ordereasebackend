// copy-swagger-assets.js
const fs = require("fs");
const path = require("path");
const swaggerUiDist = require("swagger-ui-dist");

const outAssets = path.join(__dirname, "dist", "docs-assets");
const outDocsDir = path.join(__dirname, "dist", "docs");
const swaggerJsonSrc = path.join(__dirname, "swagger-output.json");
const swaggerJsonDest = path.join(__dirname, "dist", "swagger-output.json");

// cleanup & recreate dirs
fs.rmSync(outAssets, { recursive: true, force: true });
fs.rmSync(outDocsDir, { recursive: true, force: true });
fs.mkdirSync(outAssets, { recursive: true });
fs.mkdirSync(outDocsDir, { recursive: true });

// copy all files from swagger-ui-dist
const srcAssets = swaggerUiDist.getAbsoluteFSPath();
fs.readdirSync(srcAssets).forEach(f => {
  const s = path.join(srcAssets, f);
  const d = path.join(outAssets, f);
  if (fs.statSync(s).isFile()) fs.copyFileSync(s, d);
});

// copy swagger JSON into dist
if (fs.existsSync(swaggerJsonSrc)) {
  fs.copyFileSync(swaggerJsonSrc, swaggerJsonDest);
  console.log("Copied swagger-output.json -> dist/");
} else {
  console.warn("WARNING: swagger-output.json not found. Generate it first.");
}

// create index.html
const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Orderease API Docs</title>
  <link rel="stylesheet" type="text/css" href="/docs-assets/swagger-ui.css">
  <style>
    /* full dark theme */
    html, body { background:#0b0b0d !important; margin:0; padding:0; }
    .swagger-ui { background:#0b0b0d !important; color:#e6eef6 !important; border:none !important; box-shadow:none !important; }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .scheme-container { display: none !important; }
    .opblock { background:#071224 !important; border:none !important; }
    .opblock .opblock-summary-method, .opblock .opblock-summary-path { color:#cfe8ff !important; }
    .responses-wrapper, .schema, .parameters { background:#071224 !important; color:#d7e7f7 !important; border:none !important; }
    pre, code { background:#061216 !important; color:#cfe8ff !important; }
    a { color:#7dd3fc !important; }
    .btn, .try-out, input, textarea, select { background:#112026 !important; color:#e6eef6 !important; border:1px solid #20323a !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs-assets/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/swagger.json",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout",
        deepLinking: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDocsDir, "index.html"), indexHtml, "utf8");
console.log("Wrote dist/docs/index.html and copied docs-assets.");
