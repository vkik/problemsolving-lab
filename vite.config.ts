/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from /<repository-name>/.
// The deploy workflow sets BASE_PATH from the repository name; local builds default to the expected name.
const base = process.env.BASE_PATH ?? '/problemsolving-lab/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'ProblemSolving Lab — From Problem to Action',
        short_name: 'ProblemSolving Lab',
        description: 'A seven-step problem-solving workspace: define, structure, prioritize, plan, analyse, synthesize, recommend.',
        theme_color: '#0b1f3a',
        background_color: '#0b1f3a',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
