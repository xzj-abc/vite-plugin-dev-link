import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import vitePluginDevLink from '../src/index';

describe('vite-plugin-dev-link', () => {
  const testConfigPath = 'test-dev-link.json';
  const testConfig = {
    links: [
      {
        package: 'test-package',
        localPath: './test-local',
        exclude: ['**/*.test.ts']
      }
    ]
  };

  beforeEach(() => {
    // 创建测试配置文件
    writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    // 创建测试本地目录
    if (!existsSync('./test-local')) {
      mkdirSync('./test-local', { recursive: true });
    }
    writeFileSync('./test-local/index.ts', 'export const test = "hello";');
  });

  afterEach(() => {
    // 清理测试文件
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
    if (existsSync('./test-local')) {
      rmSync('./test-local', { recursive: true, force: true });
    }
  });

  it('应该创建插件实例', () => {
    const plugin = vitePluginDevLink({
      configFile: testConfigPath,
      enabled: true,
      verbose: false
    });

    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('vite-plugin-dev-link');
  });

  it('应该有正确的插件钩子', () => {
    const plugin = vitePluginDevLink();

    expect(plugin.configResolved).toBeDefined();
    expect(plugin.buildStart).toBeDefined();
    expect(plugin.resolveId).toBeDefined();
    expect(plugin.buildEnd).toBeDefined();
  });

  it('应该正确导出插件接口', () => {
    expect(vitePluginDevLink).toBeDefined();
    expect(typeof vitePluginDevLink).toBe('function');
  });

  it('应该检查环境变量 DEV_LINK', () => {
    // 设置环境变量
    const originalEnv = process.env.DEV_LINK;
    
    // 测试环境变量未设置时
    delete process.env.DEV_LINK;
    const pluginWithoutEnv = vitePluginDevLink();
    expect(pluginWithoutEnv.name).toBe('vite-plugin-dev-link');
    
    // 测试环境变量设置时
    process.env.DEV_LINK = 'true';
    const pluginWithEnv = vitePluginDevLink();
    expect(pluginWithEnv.name).toBe('vite-plugin-dev-link');
    
    // 恢复原始环境变量
    if (originalEnv !== undefined) {
      process.env.DEV_LINK = originalEnv;
    } else {
      delete process.env.DEV_LINK;
    }
  });
}); 