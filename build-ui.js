import esbuild from 'esbuild';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildConnectionManager() {
  console.log('Building Connection Manager UI...');

  // Create output directory
  const outDir = join(__dirname, 'dist/ui/connection-manager');
  await fs.mkdir(outDir, { recursive: true });

  // Bundle the React app
  const result = await esbuild.build({
    entryPoints: [join(__dirname, 'ui/connection-manager/app.tsx')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2020',
    write: false,
    jsx: 'automatic',
    platform: 'browser',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
  });

  const jsCode = result.outputFiles[0].text;

  // Create the final HTML file with inlined JS
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Connections</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>${jsCode}</script>
</body>
</html>`;

  await fs.writeFile(join(outDir, 'index.html'), html, 'utf-8');

  console.log('✓ Connection Manager UI built successfully');
}

async function build() {
  try {
    await buildConnectionManager();
    console.log('\nAll UI builds completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
