import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/client/**/*.ts', 'src/server/**/*.ts', 'src/shared/**/*.ts'],
  dts: true, // generate .d.ts files
  outDir: 'lib',
  treeshake: true,
  clean: true,
  external: ['react'], // mark peer dependencies as external
});
