import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  resolve: {
    alias: {
      'vue-native-websocket': new URL('../../src/index.ts', import.meta.url).pathname
    }
  },
  server: {
    port: 5173
  }
})
