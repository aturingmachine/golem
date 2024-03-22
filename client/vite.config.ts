import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import YAML from 'yaml'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const config = YAML.parse(readFileSync(path.resolve(__dirname, '../config.yml'), { encoding: 'utf-8' }))

const apiPort = config.web.apiPort || 8211

const apiHost = process.env.NODE_ENV === 'production' ? '' : 'localhost'

const apiString = process.env.NODE_ENV === 'production' ? '' : `${apiHost}:${apiPort}`

console.log('ApiHost = %s', apiHost)
console.log('ApiString = %s', apiString)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __API_HOST__: JSON.stringify(`${apiString}`),
    __API_URL__: JSON.stringify(`${apiString}/api`)
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
