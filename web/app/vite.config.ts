import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Builds the screens bundled in the store app (src/ -> dist/). A package of its own, so the servers never install the app tooling.
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [svelte()],
  resolve: { alias: { $lib: fileURLToPath(new URL('../src/lib', import.meta.url)) }, dedupe: ['svelte'] },
  build: { outDir: '../dist', emptyOutDir: true }
})
