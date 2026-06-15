import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'VueNativeWebSocket',
      formats: ['es', 'cjs', 'umd'],
      fileName: format => {
        if (format === 'es') return 'vue-native-websocket.mjs'
        if (format === 'cjs') return 'vue-native-websocket.cjs'
        return 'vue-native-websocket.umd.cjs'
      }
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    },
    sourcemap: true
  }
})
