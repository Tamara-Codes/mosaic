import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Keep Clerk WITH React - they must share the same module state
            // Splitting them causes "Cannot set properties of undefined (setting 'Children')" errors
            if (id.includes('@clerk') || id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            
            // Radix UI components - used across the app
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            
            // Dashboard-specific libraries (dnd, table, charts)
            if (id.includes('@dnd-kit') || id.includes('@tanstack/react-table') || id.includes('recharts')) {
              return 'vendor-dashboard'
            }
            
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'vendor-forms'
            }
            
            // Other UI libraries
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('vaul')) {
              return 'vendor-ui'
            }
            
            // Everything else from node_modules
            return 'vendor-other'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      },
    },
  },
})
