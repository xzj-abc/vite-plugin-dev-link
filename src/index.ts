import { Plugin, ResolvedConfig } from 'vite';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, join, relative, dirname } from 'path';
import { watch } from 'chokidar';
import glob from 'fast-glob';

export interface DevLinkConfig {
  // 配置文件路径，默认为 dev-link.json
  configFile?: string;
  // 是否启用插件，默认仅在开发模式下启用
  enabled?: boolean;
  // 是否显示详细日志
  verbose?: boolean;
}

export interface LinkMapping {
  // 包名或模块名（可以是单个包名或包名数组）
  package: string | string[];
  // 本地源代码路径（可选，如果未指定则使用全局localPath）
  localPath?: string;
  // 要替换的文件或目录（相对于包根目录）
  files?: string[];
  // 排除的文件模式
  exclude?: string[];
}

export interface DevLinkConfigFile {
  // 全局本地路径（作为默认路径）
  globalLocalPath?: string;
  // 链接映射配置
  links: LinkMapping[];
  // 全局排除模式
  globalExclude?: string[];
  // 是否自动扫描本地目录下的package.json
  autoScan?: boolean;
}

function vitePluginDevLink(options: DevLinkConfig = {}): Plugin {
  const {
    configFile = 'dev-link.json',
    enabled = true,
    verbose = false
  } = options;

  let config: ResolvedConfig;
  let linkConfig: DevLinkConfigFile | null = null;
  let watchers: ReturnType<typeof watch>[] = [];

  const log = (message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (verbose || type !== 'info') {
      const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '🔗';
      console.log(`${prefix} [vite-plugin-dev-link] ${message}`);
    }
  };

  const loadConfig = (): DevLinkConfigFile | null => {
    const configPath = resolve(process.cwd(), configFile);
    
    if (!existsSync(configPath)) {
      log(`配置文件不存在: ${configPath}`, 'warn');
      return null;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content) as DevLinkConfigFile;
      log(`已加载配置文件: ${configPath}`);
      return parsed;
    } catch (error) {
      log(`解析配置文件失败: ${error}`, 'error');
      return null;
    }
  };

  const resolveLocalPath = (localPath: string): string => {
    if (localPath.startsWith('/')) {
      return localPath;
    }
    return resolve(process.cwd(), localPath);
  };

  const findPackagePath = (packageName: string): string | null => {
    try {
      const packagePath = require.resolve(`${packageName}/package.json`, {
        paths: [process.cwd()]
      });
      return dirname(packagePath);
    } catch {
      // 尝试在 node_modules 中查找
      const nodeModulesPath = join(process.cwd(), 'node_modules', packageName);
      if (existsSync(nodeModulesPath)) {
        return nodeModulesPath;
      }
      return null;
    }
  };

  const scanLocalPackages = (localPath: string): { [packageName: string]: string } => {
    const packages: { [packageName: string]: string } = {};
    
    if (!existsSync(localPath)) {
      return packages;
    }

    try {
      // 扫描 localPath 下的所有子目录
      const entries = glob.sync('*/package.json', {
        cwd: localPath,
        absolute: false
      });

      entries.forEach(entry => {
        const packageJsonPath = join(localPath, entry);
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (packageJson.name) {
            const packageDir = dirname(packageJsonPath);
            packages[packageJson.name] = packageDir;
            log(`发现本地包: ${packageJson.name} -> ${relative(process.cwd(), packageDir)}`);
          }
        } catch (error) {
          log(`读取 package.json 失败: ${packageJsonPath}`, 'warn');
        }
      });
    } catch (error) {
      log(`扫描本地包失败: ${error}`, 'error');
    }

    return packages;
  };

  const resolvePackageLocalPath = (mapping: LinkMapping, scannedPackages: { [key: string]: string }): { [packageName: string]: string } => {
    const result: { [packageName: string]: string } = {};
    const packages = Array.isArray(mapping.package) ? mapping.package : [mapping.package];
    
    packages.forEach(packageName => {
      let localPath: string;
      
      if (mapping.localPath) {
        // 使用映射指定的本地路径
        localPath = resolveLocalPath(mapping.localPath);
      } else if (linkConfig?.globalLocalPath) {
        // 使用全局本地路径
        if (scannedPackages[packageName]) {
          // 如果在扫描结果中找到了，使用扫描到的路径
          localPath = scannedPackages[packageName];
        } else {
          // 否则使用全局路径
          localPath = resolveLocalPath(linkConfig.globalLocalPath);
        }
      } else {
        log(`包 ${packageName} 没有配置 localPath，且没有全局 localPath`, 'warn');
        return;
      }
      
      result[packageName] = localPath;
    });
    
    return result;
  };

  const getFilesToLink = (mapping: LinkMapping): string[] => {
    if (!mapping.localPath) {
      log(`映射缺少 localPath 配置`, 'warn');
      return [];
    }
    
    const localPath = resolveLocalPath(mapping.localPath);
    
    if (!existsSync(localPath)) {
      log(`本地路径不存在: ${localPath}`, 'warn');
      return [];
    }

    const isDirectory = statSync(localPath).isDirectory();
    
    if (!isDirectory) {
      return [localPath];
    }

    // 如果指定了具体文件，只链接这些文件
    if (mapping.files && mapping.files.length > 0) {
      return mapping.files
        .map(file => join(localPath, file))
        .filter(existsSync);
    }

    // 否则获取目录下所有文件
    const patterns = ['**/*'];
    const ignore = [
      'node_modules/**',
      '.git/**',
      '**/*.log',
      ...(mapping.exclude || []),
      ...(linkConfig?.globalExclude || [])
    ];

    try {
      const files = glob.sync(patterns, {
        cwd: localPath,
        ignore,
        absolute: true,
        onlyFiles: true
      });
      
      return files;
    } catch (error) {
      log(`获取文件列表失败: ${error}`, 'error');
      return [];
    }
  };

  return {
    name: 'vite-plugin-dev-link',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    buildStart() {
      // 只在开发模式下启用，并且需要设置 DEV_LINK=true 环境变量
      if (!enabled || config.command !== 'serve' || process.env.DEV_LINK !== 'true') {
        if (process.env.DEV_LINK !== 'true' && config.command === 'serve') {
          log('提示：要启用 dev-link 功能，请设置环境变量 DEV_LINK=true', 'info');
        }
        return;
      }

      // 加载配置
      linkConfig = loadConfig();
      if (!linkConfig || !linkConfig.links.length) {
        return;
      }

      log(`开始处理 ${linkConfig.links.length} 个链接配置`);

      // 如果启用了自动扫描，先扫描本地包
      let scannedPackages: { [packageName: string]: string } = {};
      if (linkConfig.autoScan && linkConfig.globalLocalPath) {
        log(`自动扫描本地包: ${linkConfig.globalLocalPath}`);
        scannedPackages = scanLocalPackages(resolveLocalPath(linkConfig.globalLocalPath));
      }

      // 处理每个链接配置
      linkConfig.links.forEach((mapping, index) => {
        const packageLocalPaths = resolvePackageLocalPath(mapping, scannedPackages);
        
        Object.entries(packageLocalPaths).forEach(([packageName, localPath]) => {
          const packagePath = findPackagePath(packageName);
          if (!packagePath) {
            log(`找不到包: ${packageName}`, 'warn');
            return;
          }

          log(`链接: ${packageName} -> ${relative(process.cwd(), localPath)}`);

          // 监听本地文件变化
          const watcher = watch(localPath, {
            ignored: [
              'node_modules/**',
              '.git/**',
              '**/*.log',
              ...(mapping.exclude || []),
              ...(linkConfig?.globalExclude || [])
            ].map(pattern => join(localPath, pattern)),
            persistent: true,
            ignoreInitial: false
          });

          watcher.on('all', (event, filePath) => {
            if (verbose) {
              log(`文件变化 [${event}]: ${relative(process.cwd(), filePath)}`);
            }
          });

          watchers.push(watcher);
        });
      });
    },

    resolveId(id, importer) {
      if (!enabled || config.command !== 'serve' || process.env.DEV_LINK !== 'true' || !linkConfig) {
        return null;
      }

      // 先扫描本地包（如果需要）
      let scannedPackages: { [packageName: string]: string } = {};
      if (linkConfig.autoScan && linkConfig.globalLocalPath) {
        scannedPackages = scanLocalPackages(resolveLocalPath(linkConfig.globalLocalPath));
      }

      // 查找匹配的链接配置
      for (const mapping of linkConfig.links) {
        const packageLocalPaths = resolvePackageLocalPath(mapping, scannedPackages);
        
        for (const [packageName, localPath] of Object.entries(packageLocalPaths)) {
          // 检查是否匹配包名
          if (id === packageName || id.startsWith(`${packageName}/`)) {
            if (id === packageName) {
              // 直接导入包
              const indexFile = join(localPath, 'index.js');
              const indexTs = join(localPath, 'index.ts');
              const packageJson = join(localPath, 'package.json');
              
              if (existsSync(indexTs)) {
                log(`解析 ${id} -> ${relative(process.cwd(), indexTs)}`);
                return indexTs;
              } else if (existsSync(indexFile)) {
                log(`解析 ${id} -> ${relative(process.cwd(), indexFile)}`);
                return indexFile;
              } else if (existsSync(packageJson)) {
                try {
                  const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'));
                  const main = pkg.main || pkg.module || 'index.js';
                  const mainPath = join(localPath, main);
                  if (existsSync(mainPath)) {
                    log(`解析 ${id} -> ${relative(process.cwd(), mainPath)}`);
                    return mainPath;
                  }
                } catch (error) {
                  log(`读取 package.json 失败: ${error}`, 'error');
                }
              }
            } else {
              // 导入包的子路径
              const subPath = id.substring(packageName.length + 1);
              const targetPath = join(localPath, subPath);
              
              // 尝试不同的文件扩展名
              const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue'];
              for (const ext of extensions) {
                const fileWithExt = targetPath + ext;
                if (existsSync(fileWithExt)) {
                  log(`解析 ${id} -> ${relative(process.cwd(), fileWithExt)}`);
                  return fileWithExt;
                }
              }
              
              if (existsSync(targetPath)) {
                log(`解析 ${id} -> ${relative(process.cwd(), targetPath)}`);
                return targetPath;
              }
            }
          }
        }
      }

      return null;
    },

    buildEnd() {
      // 清理监听器
      watchers.forEach(watcher => {
        watcher.close();
      });
      watchers = [];
    }
  };
}

export default vitePluginDevLink;
export { vitePluginDevLink }; 