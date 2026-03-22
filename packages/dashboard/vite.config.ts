import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

const workspaceRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  plugins: [tanstackRouter(), react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@env': path.resolve(__dirname, './src/env.ts'),
      '@client': path.resolve(__dirname, '../api-client/src/client.ts'),
      '@finza/api-client/hooks': path.resolve(
        __dirname,
        '../api-client/src/generated/hooks',
      ),
      '@finza/api-client/schemas': path.resolve(
        __dirname,
        '../api-client/src/generated/schemas',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
