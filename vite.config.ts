import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: 'sidepanel.html',
        content: 'public/content.js',
        background: 'public/background.ts'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Output content.js as content.mjs
          if (chunkInfo.name === 'content') {
            return 'content.mjs';
          }
          return '[name].js';
        },
        format: 'es',
        dir: 'dist'
      }
    }
  }
})