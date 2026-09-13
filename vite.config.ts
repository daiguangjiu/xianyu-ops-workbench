import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' 以支持 GitHub Pages 子路径托管；路由使用 HashRouter 无需 404 兜底
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5181,
  },
});
