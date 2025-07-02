import { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, join, relative, dirname, isAbsolute } from 'path';
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
  // 排除的文件模式
  exclude?: string[];
  // 指定包的入口文件（支持相对路径和绝对路径，相对路径相对于 localPath）
  entryFile?: string;
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
  // 全局默认入口文件（支持相对路径和绝对路径，相对路径相对于对应包的 localPath）
  globalEntryFile?: string;
}

function vitePluginDevLink(options: DevLinkConfig = {}): Plugin {
  const {
    configFile = 'dev-link.json',
    enabled = true,
    verbose = false
  } = options;

  let config: ResolvedConfig;
  let linkConfig: DevLinkConfigFile | null = null;
  let configFileDir: string = '';
  let watchers: ReturnType<typeof watch>[] = [];
  let server: ViteDevServer | null = null;
  // 文件路径到模块ID的映射，用于HMR
  let fileToModuleMap: Map<string, Set<string>> = new Map();

  const log = (message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (verbose || type !== 'info') {
      const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '🔗';
      console.log(`${prefix} [vite-plugin-dev-link] ${message}`);
    }
  };

  const loadConfig = (): DevLinkConfigFile | null => {
    // 如果 configFile 是绝对路径，直接使用；否则相对于当前工作目录解析
    const configPath = isAbsolute(configFile) ? configFile : resolve(process.cwd(), configFile);
    
    if (!existsSync(configPath)) {
      log(`配置文件不存在: ${configPath}`, 'warn');
      return null;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content) as DevLinkConfigFile;
      // 保存配置文件所在的目录
      configFileDir = dirname(configPath);
      log(`已加载配置文件: ${configPath}`);
      return parsed;
    } catch (error) {
      log(`解析配置文件失败: ${error}`, 'error');
      return null;
    }
  };

  const resolveLocalPath = (localPath: string): string => {
    if (isAbsolute(localPath)) {
      return localPath;
    }
    // 相对路径相对于配置文件所在目录解析
    return resolve(configFileDir || process.cwd(), localPath);
  };



  const scanLocalPackages = (localPath: string): { [packageName: string]: string } => {
    const packages: { [packageName: string]: string } = {};
    
    if (!existsSync(localPath)) {
      return packages;
    }

    try {
      // 扫描 localPath 下的所有子目录，支持作用域包（最多两层结构）
      const entries = glob.sync([
        '*/package.json',        // 普通包: package-name/package.json
        '*/*/package.json'       // 作用域包: @scope/package-name/package.json
      ], {
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

  const addFileToModuleMapping = (filePath: string, moduleId: string) => {
    if (!fileToModuleMap.has(filePath)) {
      fileToModuleMap.set(filePath, new Set());
    }
    fileToModuleMap.get(filePath)!.add(moduleId);
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
        log(`包 "${packageName}" 没有配置 localPath，且没有全局 globalLocalPath，请检查配置`, 'warn');
        return;
      }
      
      result[packageName] = localPath;
    });
    
    return result;
  };



  return {
    name: 'vite-plugin-dev-link',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(srv) {
      server = srv;
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
          // 检查本地路径是否存在
          if (!existsSync(localPath)) {
            log(`包 "${packageName}" 的本地路径不存在: ${relative(process.cwd(), localPath)}`, 'warn');
            return;
          }

          log(`成功链接包: ${packageName} -> ${relative(process.cwd(), localPath)}`);

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
            
            // 触发HMR更新
            if (server && (event === 'change' || event === 'add' || event === 'unlink')) {
              const affectedModules = fileToModuleMap.get(filePath);
              if (affectedModules && affectedModules.size > 0) {
                log(`🔥 HMR更新: ${relative(process.cwd(), filePath)} -> ${Array.from(affectedModules).join(', ')}`);
                affectedModules.forEach(moduleId => {
                  const module = server!.moduleGraph.getModuleById(moduleId);
                  if (module) {
                    server!.reloadModule(module);
                  }
                });
              } else {
                // 如果没有找到对应的模块，尝试通过文件路径直接查找
                const module = server.moduleGraph.getModuleById(filePath);
                if (module) {
                  log(`🔥 HMR更新: ${relative(process.cwd(), filePath)} (直接匹配)`);
                  server.reloadModule(module);
                } else {
                  // 作为后备方案，查找所有可能相关的模块
                  const modules = server.moduleGraph.fileToModulesMap.get(filePath);
                  if (modules && modules.size > 0) {
                    log(`🔥 HMR更新: ${relative(process.cwd(), filePath)} (通过fileToModulesMap)`);
                    modules.forEach(mod => server!.reloadModule(mod));
                  }
                }
              }
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
              
              // 优先使用配置的 entryFile
              if (mapping.entryFile) {
                const entryPath = isAbsolute(mapping.entryFile) 
                  ? mapping.entryFile 
                  : join(localPath, mapping.entryFile);
                if (existsSync(entryPath)) {
                  log(`解析 ${id} -> ${relative(process.cwd(), entryPath)} (使用配置的 entryFile)`);
                  addFileToModuleMapping(entryPath, id);
                  return entryPath;
                } else {
                  log(`包 "${packageName}" 的 entryFile 不存在: ${relative(process.cwd(), entryPath)} (localPath: ${relative(process.cwd(), localPath)})`, 'warn');
                }
              }
              
              // 尝试使用全局 entryFile
              if (linkConfig.globalEntryFile) {
                const globalEntryPath = isAbsolute(linkConfig.globalEntryFile)
                  ? linkConfig.globalEntryFile
                  : join(localPath, linkConfig.globalEntryFile);
                if (existsSync(globalEntryPath)) {
                  log(`解析 ${id} -> ${relative(process.cwd(), globalEntryPath)} (使用全局 entryFile)`);
                  addFileToModuleMapping(globalEntryPath, id);
                  return globalEntryPath;
                } else {
                  log(`包 "${packageName}" 的全局 entryFile 不存在: ${relative(process.cwd(), globalEntryPath)} (localPath: ${relative(process.cwd(), localPath)})`, 'warn');
                }
              }
              
              // 回退到默认行为
              const indexFile = join(localPath, 'index.js');
              const indexTs = join(localPath, 'index.ts');
              const packageJson = join(localPath, 'package.json');
              
              if (existsSync(indexTs)) {
                log(`解析 ${id} -> ${relative(process.cwd(), indexTs)} (默认 index.ts)`);
                addFileToModuleMapping(indexTs, id);
                return indexTs;
              } else if (existsSync(indexFile)) {
                log(`解析 ${id} -> ${relative(process.cwd(), indexFile)} (默认 index.js)`);
                addFileToModuleMapping(indexFile, id);
                return indexFile;
              } else if (existsSync(packageJson)) {
                try {
                  const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'));
                  const main = pkg.main || pkg.module || 'index.js';
                  const mainPath = join(localPath, main);
                  if (existsSync(mainPath)) {
                    log(`解析 ${id} -> ${relative(process.cwd(), mainPath)} (从 package.json)`);
                    addFileToModuleMapping(mainPath, id);
                    return mainPath;
                  } else {
                    log(`包 "${packageName}" 的 package.json 中指定的入口文件不存在: ${relative(process.cwd(), mainPath)}`, 'warn');
                  }
                } catch (error) {
                  log(`包 "${packageName}" 的 package.json 读取失败: ${error}`, 'error');
                }
              } else {
                log(`包 "${packageName}" 找不到可用的入口文件 (检查了 index.ts, index.js, package.json)，localPath: ${relative(process.cwd(), localPath)}`, 'warn');
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
                  log(`解析 ${id} -> ${relative(process.cwd(), fileWithExt)} (子路径)`);
                  addFileToModuleMapping(fileWithExt, id);
                  return fileWithExt;
                }
              }
              
              if (existsSync(targetPath)) {
                log(`解析 ${id} -> ${relative(process.cwd(), targetPath)} (子路径)`);
                addFileToModuleMapping(targetPath, id);
                return targetPath;
              } else {
                log(`包 "${packageName}" 的子路径不存在: ${id} -> ${relative(process.cwd(), targetPath)}`, 'warn');
              }
            }
          }
        }
      }

      return null;
    },

    handleHotUpdate(ctx) {
      // 检查文件是否是被链接的本地包文件
      const filePath = ctx.file;
      const affectedModules = fileToModuleMap.get(filePath);
      
      if (affectedModules && affectedModules.size > 0) {
        log(`🔥 HMR处理: ${relative(process.cwd(), filePath)} -> ${Array.from(affectedModules).join(', ')}`);
        
        // 返回需要更新的模块
        const modules = [];
        for (const moduleId of affectedModules) {
          const module = ctx.server.moduleGraph.getModuleById(moduleId);
          if (module) {
            modules.push(module);
          }
        }
        
        if (modules.length > 0) {
          return modules;
        }
      }
      
      // 如果没有找到映射，让Vite处理默认的HMR逻辑
      return undefined;
    },

    buildEnd() {
      // 清理监听器
      watchers.forEach(watcher => {
        watcher.close();
      });
      watchers = [];
      // 清理文件映射
      fileToModuleMap.clear();
      server = null;
    }
  };
}

export default vitePluginDevLink;
export { vitePluginDevLink }; 