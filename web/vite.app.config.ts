import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Builds the screens bundled in the store app (app/ -> app-dist/), separately from the SvelteKit site.
export default defineConfig({
  root: 'app',
  base: './',
  plugins: [svelte()],
  resolve: { alias: { $lib: fileURLToPath(new URL('src/lib', import.meta.url)) } },
  build: { outDir: '../app-dist', emptyOutDir: true }
})
