import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@workspace': path.resolve(__dirname, '../../'),
      '@life-manager/ui/styles': path.resolve(__dirname, '../../packages/ui/src/styles/index.ts'),
      '@life-manager/ui/components': path.resolve(__dirname, '../../packages/ui/src/components/index.ts'),
      '@life-manager/ui/contexts': path.resolve(__dirname, '../../packages/ui/src/contexts/index.ts'),
      '@life-manager/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@life-manager/schema': path.resolve(__dirname, '../../packages/schema/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: false,
    strictPort: true,
    hmr: {
      overlay: true, // Show errors as overlay
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react-calendar'],
  },
  build: {
    sourcemap: true, // Better debugging in development
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
  },
});
