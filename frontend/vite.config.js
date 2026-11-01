import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const buildTarget = env.VITE_BUILD_TARGET || 'web';
  const devApiTarget = env.VITE_DEV_API_TARGET || 'https://bensmma.onrender.com';
  const allowedHosts = (env.VITE_DEV_ALLOWED_HOSTS || '.localhost,localhost,127.0.0.1')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    // Web builds use normal absolute routes, Electron/file builds keep relative assets.
    base: buildTarget === 'electron' ? './' : '/',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    server: {
      port: 5173,
      strictPort: true,
      host: true,
      open: false,
      allowedHosts,
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: devApiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
