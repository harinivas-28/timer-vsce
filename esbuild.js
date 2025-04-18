const esbuild = require('esbuild');
const args = process.argv.slice(2);
const watchMode = args.includes('--watch');

const buildOptions = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: './out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: ['node14'],
  sourcemap: true,
};

async function build() {
  try {
    if (watchMode) {
      // Use context for watch mode
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      // Use build for single build
      await esbuild.build(buildOptions);
      console.log('Build completed');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

build();