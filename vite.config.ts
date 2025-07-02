import { defineConfig } from 'vite';
import path from 'path';
import vitePluginDevLink from '../vite-plugin-dev-link/src/index';

export default defineConfig({
  root: 'example',
  plugins: [
    vitePluginDevLink({
      configFile: path.resolve(__dirname,'example', 'dev-link.json'),
      verbose: true
    })
  ],
  server: {
    port: 3000,
    host: true
  }
}); 