import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    clearMocks: true,
    restoreMocks: true
  }
})
