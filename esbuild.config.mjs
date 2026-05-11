import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['main.ts'],
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  external: ['obsidian', 'electron'],
  outfile: 'main.js',
  platform: 'browser',
  logLevel: 'info',
  sourcemap: false,
  minify: false,
});
