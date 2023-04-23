import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __API_HOST__: JSON.stringify('localhost:8211'),
    __API_URL__: JSON.stringify('http://localhost:8211/api')
  },
  base: "/app/",
  // server: {
  //   port:  8211,
  // },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
