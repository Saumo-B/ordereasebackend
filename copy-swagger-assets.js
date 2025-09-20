// copy-swagger-assets.js
const fs = require("fs");
const path = require("path");
const swaggerUiDist = require("swagger-ui-dist");

const outAssets = path.join(__dirname, "dist", "docs-assets");
const outDocsDir = path.join(__dirname, "dist", "docs");
const swaggerJsonSrc = path.join(__dirname, "swagger-output.json");
const swaggerJsonDest = path.join(__dirname, "dist", "swagger-output.json");

// Cleanup & recreate directories
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

// Copy swagger JSON into dist
if (fs.existsSync(swaggerJsonSrc)) {
  fs.copyFileSync(swaggerJsonSrc, swaggerJsonDest);
  console.log("Copied swagger-output.json -> dist/");
} else {
  console.warn("WARNING: swagger-output.json not found. Generate it first.");
}

// Dark theme CSS overrides
const darkCss = `
.swagger-ui { background: #0b0b0d !important; color: #e6eef6 !important; }
.swagger-ui .topbar { background: #0f1720 !important; box-shadow: none !important; }
.swagger-ui .info h1, .swagger-ui .info p, .swagger-ui .scheme-container { color: #e6eef6 !important; }
.swagger-ui .scheme-container { background: #0f1720 !important; color: #e6eef6 !important; border: 1px solid #1f2937 !important; }
.swagger-ui .opblock { background: #071224 !important; border-color: #112233 !important; }
.swagger-ui .opblock-summary, .swagger-ui .opblock-summary-method, .swagger-ui .opblock-summary-path { color: #cfe8ff !important; }
.swagger-ui .responses-wrapper, .swagger-ui .response-col_description, .swagger-ui .response-col_status,
.swagger-ui .response-col_description pre, .swagger-ui .response-col_status pre,
.swagger-ui .parameters, .swagger-ui .parameter__name, .swagger-ui .parameter__type, .swagger-ui .parameter__example,
.swagger-ui .schema, .swagger-ui pre, .swagger-ui code { background: #061216 !important; color: #cfe8ff !important; border: 1px solid #14232e !important; }
.swagger-ui a { color: #7dd3fc !important; }
.swagger-ui .btn, .swagger-ui .try-out, .swagger-ui input, .swagger-ui textarea, .swagger-ui select { background: #112026 !important; color: #e6eef6 !important; border: 1px solid #20323a !important; }
`;

// Create index.html with dark theme
const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Orderease API Docs</title>
  <link rel="stylesheet" type="text/css" href="/docs-assets/swagger-ui.css" >
  <style>${darkCss}</style>
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
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDocsDir, "index.html"), indexHtml, "utf8");
console.log("Wrote dist/docs/index.html with dark theme and copied docs-assets.");
