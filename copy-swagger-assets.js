const fs = require("fs");
const path = require("path");
const swaggerUiDist = require("swagger-ui-dist");

const outAssets = path.join(__dirname, "dist", "docs-assets");
const outDocsDir = path.join(__dirname, "dist", "docs");
const swaggerJsonSrc = path.resolve(__dirname, "../swagger-output.json");
const swaggerJsonDest = path.resolve(__dirname, "dist", "swagger-output.json");

// Cleanup and recreate
fs.rmSync(outAssets, { recursive: true, force: true });
fs.rmSync(outDocsDir, { recursive: true, force: true });
fs.mkdirSync(outAssets, { recursive: true });
fs.mkdirSync(outDocsDir, { recursive: true });

// Copy swagger-ui assets
const srcAssets = swaggerUiDist.getAbsoluteFSPath();
fs.readdirSync(srcAssets).forEach(f => {
  const s = path.join(srcAssets, f);
  const d = path.join(outAssets, f);
  if (fs.statSync(s).isFile()) fs.copyFileSync(s, d);
});

// Copy swagger JSON
fs.copyFileSync(swaggerJsonSrc, swaggerJsonDest);

// Build index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orderease API Docs</title>
<link rel="stylesheet" type="text/css" href="/docs-assets/swagger-ui.css">
<style>
.swagger-ui { background:#0b0b0d; color:#e6eef6; }
.swagger-ui .topbar { background:#0f1720 !important; box-shadow:none !important; }
.swagger-ui .scheme-container { background:#0f1720 !important; color:#e6eef6 !important; }
.opblock { background:#071224 !important; }
</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="/docs-assets/swagger-ui-bundle.js"></script>
<script src="/docs-assets/swagger-ui-standalone-preset.js"></script>
<script>
window.onload = function() {
  const ui = SwaggerUIBundle({
    url: "/api/swagger.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout",
    deepLinking: true
  });
  window.ui = ui;
};
</script>
</body>
</html>`;

fs.writeFileSync(path.join(outDocsDir, "index.html"), indexHtml, "utf8");
console.log("Swagger assets and index.html built in dist/");
