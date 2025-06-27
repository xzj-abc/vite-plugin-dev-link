import { defineConfig } from 'vite';
import vitePluginDevLink from '../vite-plugin-dev-link/src/index';

export default defineConfig({
  plugins: [
    vitePluginDevLink({
      configFile: 'dev-link.json',
      verbose: true
    })
  ],
  build: {
    rollupOptions: {
      input: 'example/index.html'
    }
  },
  server: {
    port: 3000,
    host: true
  }
}); 