const esbuild = require('esbuild');

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: 'dist/index.js',
      sourcemap: true,
      minify: true,
      format: 'cjs',
      packages: 'external', // This ensures node_modules are bundled
      banner: {
        js: '#!/usr/bin/env node',
      },
    });
    console.log('⚡ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build(); 