import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  external: ['vite', 'chokidar', 'fast-glob'],
  // 保持中文字符，不转换成Unicode编码
  esbuildOptions(options) {
    options.charset = 'utf8'
  }
}); 