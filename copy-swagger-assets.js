const fs = require("fs");
const path = require("path");
const swaggerUiDist = require("swagger-ui-dist");

// Paths
const outAssets = path.join(__dirname, "dist", "docs-assets");
const outDocsDir = path.join(__dirname, "dist", "docs");
const swaggerJsonSrc = path.join(__dirname, "swagger-output.json");
const swaggerJsonDest = path.join(__dirname, "dist", "swagger-output.json");

// Cleanup
fs.rmSync(outAssets, { recursive: true, force: true });
fs.rmSync(outDocsDir, { recursive: true, force: true });
fs.mkdirSync(outAssets, { recursive: true });
fs.mkdirSync(outDocsDir, { recursive: true });

// Copy Swagger UI assets
const srcAssets = swaggerUiDist.getAbsoluteFSPath();
fs.readdirSync(srcAssets).forEach(f => {
  const s = path.join(srcAssets, f);
  const d = path.join(outAssets, f);
  if (fs.statSync(s).isFile()) fs.copyFileSync(s, d);
});

// Copy JSON
if (fs.existsSync(swaggerJsonSrc)) {
  fs.copyFileSync(swaggerJsonSrc, swaggerJsonDest);
  console.log("Copied swagger-output.json -> dist/");
} else {
  console.warn("swagger-output.json not found. Generate it first.");
}

// Generate index.html
const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Orderease API Docs</title>
  <link rel="stylesheet" type="text/css" href="/docs-assets/swagger-ui.css">
  <style>
    /* dark theme overrides */
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
      SwaggerUIBundle({
        url: "/swagger-output.json", // load from dist
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true
      });
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDocsDir, "index.html"), indexHtml);
console.log("Wrote dist/docs/index.html");
