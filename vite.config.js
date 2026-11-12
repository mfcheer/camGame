import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: process.env.CAMGAME_HTTP === '1' ? [] : [basicSsl()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  preview: {
    port: 5173,
    host: '0.0.0.0'
  },
  assetsInclude: ['**/*.task', '**/*.wasm']
});
