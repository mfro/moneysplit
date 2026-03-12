import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      name: 'material-symbols',
      resolveId(id, source, importer) {
        if (id.startsWith('material-symbols:')) {
          return {
            id: `\0${id}`,
          };
        }
      },
      async load(id) {
        if (id.startsWith('\0material-symbols:')) {
          const symbol = id.slice(18);

          const url = `https://github.com/google/material-design-icons/raw/refs/heads/master/symbols/web/${symbol}/materialsymbolsoutlined/${symbol}_24px.svg`

          const response = await fetch(url);
          const content = await response.text();

          return `export default ${JSON.stringify(content)}`;
        }
      },
    }
  ],
  server: {
    allowedHosts: [
      'test.mfro.me',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
