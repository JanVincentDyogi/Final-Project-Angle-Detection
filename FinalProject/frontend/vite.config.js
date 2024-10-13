// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/start_camera': 'http://localhost:5000',
      '/stop_camera': 'http://localhost:5000',
      '/video_feed': 'http://localhost:5000',
    },
  },
});