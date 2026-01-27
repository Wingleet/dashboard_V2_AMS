import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
  
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for debugging (can disable for smaller builds)
    sourcemap: false,
    
    // Minification
    minify: 'esbuild',
    
    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,
    
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // File naming with content hash for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        
        // ES module format
        format: 'es',
        
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - rarely changes
          'react-vendor': ['react', 'react-dom'],
          // Icons - can be large
          'icons': ['lucide-react'],
        },
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Disable module preload polyfill (modern browsers support it)
    modulePreload: {
      polyfill: false,
    },
  },
  
  // Development server with API proxy
  server: {
    port: 5173,
    strictPort: true,
    
    // CORS proxy for development
    proxy: {
      '/api': {
        target: process.env.VITE_AMS_BASE_URL || 'http://46.105.115.223:8181',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Proxy Error]', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('[Proxy]', req.method, req.url);
          });
        },
      },
    },
  },
  
  // Preview server (for testing production build locally)
  preview: {
    port: 4173,
    strictPort: true,
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
  
  // Resolve aliases (optional - for cleaner imports)
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@api': '/src/api',
      '@utils': '/src/utils',
      '@types': '/src/types',
    },
  },
});
