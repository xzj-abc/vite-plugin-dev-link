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
  // 🎯 简化配置：零配置模式 - 自动扫描指定目录
  autoLink?: string | string[];
  // 🎯 简化配置：直接指定包映射
  packages?: Record<string, string>;
  // 🎯 简化配置：预设模式
  preset?: 'monorepo' | 'local-dev' | 'component-lib';
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
  
  // 🔥 改进的映射机制
  // 文件路径到模块ID的映射（支持多个模块ID）
  let fileToModuleMap: Map<string, Set<string>> = new Map();
  // 模块ID到文件路径的映射
  let moduleToFileMap: Map<string, string> = new Map();
  // 本地包路径集合，用于快速判断文件是否属于本地包
  let localPackagePaths: Set<string> = new Set();
  // 包名到本地路径的映射
  let packageToPathMap: Map<string, string> = new Map();

  const log = (message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (verbose || type !== 'info') {
      const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '🔗';
      console.log(`${prefix} [vite-plugin-dev-link] ${message}`);
    }
  };

  const loadConfig = (): DevLinkConfigFile | null => {
    // 🎯 预设模式
    if (options.preset) {
      const presets = {
        'monorepo': {
          globalLocalPath: '../packages',
          autoScan: true,
          links: [{ package: [] }],
          globalExclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.git/**']
        },
        'local-dev': {
          globalLocalPath: '../local-packages',
          autoScan: true,
          links: [{ package: [] }],
          globalExclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.git/**']
        },
        'component-lib': {
          globalLocalPath: '../components',
          autoScan: true,
          links: [{ package: [] }],
          globalExclude: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*', '**/node_modules/**', '**/.git/**']
        }
      };
      configFileDir = process.cwd();
      log(`🎯 使用预设模式: ${options.preset}`);
      return presets[options.preset] as DevLinkConfigFile;
    }

    // 🎯 零配置模式
    if (options.autoLink) {
      const autoLinkPaths = Array.isArray(options.autoLink) ? options.autoLink : [options.autoLink];
      const generatedConfig: DevLinkConfigFile = {
        globalLocalPath: autoLinkPaths[0],
        autoScan: true,
        links: [{ package: [] }], // 空数组，通过自动扫描填充
        globalExclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
      };
      configFileDir = process.cwd();
      log(`🎯 零配置模式，自动扫描: ${autoLinkPaths.join(', ')}`);
      return generatedConfig;
    }

    // 🎯 简化配置模式
    if (options.packages) {
      const generatedConfig: DevLinkConfigFile = {
        links: Object.entries(options.packages).map(([packageName, localPath]) => ({
          package: packageName,
          localPath: localPath
        })),
        globalExclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.git/**']
      };
      configFileDir = process.cwd();
      log(`🎯 简化配置模式，包映射: ${Object.keys(options.packages).join(', ')}`);
      return generatedConfig;
    }

    // 🎯 传统配置文件模式
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

  // 🔥 改进的映射机制
  const addFileToModuleMapping = (filePath: string, moduleId: string) => {
    // 文件路径到模块ID映射
    if (!fileToModuleMap.has(filePath)) {
      fileToModuleMap.set(filePath, new Set());
    }
    fileToModuleMap.get(filePath)!.add(moduleId);
    
    // 模块ID到文件路径映射
    moduleToFileMap.set(moduleId, filePath);
    
    if (verbose) {
      log(`添加文件映射: ${relative(process.cwd(), filePath)} -> ${moduleId}`);
    }
  };

  // 🔥 新增：检查文件是否属于本地包
  const isLocalPackageFile = (filePath: string): boolean => {
    // 标准化路径
    const normalizedPath = resolve(filePath);
    
    // 检查是否在任何本地包路径下
    for (const packagePath of localPackagePaths) {
      if (normalizedPath.startsWith(packagePath)) {
        return true;
      }
    }
    return false;
  };

  // 🔥 新增：查找依赖某个文件的所有模块
  const findDependentModules = (filePath: string): Set<string> => {
    const dependents = new Set<string>();
    
    if (!server) return dependents;
    
    // 直接映射的模块
    const directModules = fileToModuleMap.get(filePath);
    if (directModules) {
      directModules.forEach(moduleId => dependents.add(moduleId));
    }
    
    // 🔥 通过Vite模块图查找依赖关系
    const normalizedPath = resolve(filePath);
    
    // 查找所有可能的模块ID变体
    const possibleIds = [
      filePath,
      normalizedPath,
      relative(process.cwd(), filePath),
      relative(process.cwd(), normalizedPath)
    ];
    
    possibleIds.forEach(id => {
      const module = server!.moduleGraph.getModuleById(id);
      if (module) {
        dependents.add(module.id || module.url);
        
        // 查找所有导入这个模块的模块
        module.importers.forEach(importer => {
          if (importer.id || importer.url) {
            dependents.add(importer.id || importer.url);
          }
        });
      }
    });
    
    // 🔥 通过fileToModulesMap查找
    const modules = server.moduleGraph.fileToModulesMap.get(normalizedPath);
    if (modules) {
      modules.forEach(module => {
        if (module.id || module.url) {
          dependents.add(module.id || module.url);
          
          // 查找所有导入这个模块的模块
          module.importers.forEach(importer => {
            if (importer.id || importer.url) {
              dependents.add(importer.id || importer.url);
            }
          });
        }
      });
    }
    
    return dependents;
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
      // 只在开发模式下启用
      if (!enabled || config.command !== 'serve') {
        return;
      }

      // 🎯 简化配置模式下不需要环境变量
      const hasSimplifiedConfig = options.autoLink || options.packages || options.preset;
      if (!hasSimplifiedConfig && process.env.DEV_LINK !== 'true') {
        log('提示：传统配置模式需要设置环境变量 DEV_LINK=true，或使用简化配置模式', 'info');
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
          
          // 🔥 记录包映射信息
          const normalizedPath = resolve(localPath);
          localPackagePaths.add(normalizedPath);
          packageToPathMap.set(packageName, normalizedPath);

          // 🔥 简化文件监听逻辑，只监听不触发HMR
          const watcher = watch(localPath, {
            ignored: [
              'node_modules/**',
              '.git/**',
              '**/*.log',
              ...(mapping.exclude || []),
              ...(linkConfig?.globalExclude || [])
            ].map(pattern => join(localPath, pattern)),
            persistent: true,
            ignoreInitial: true // 改为true，避免初始扫描
          });

          // 🔥 简化监听逻辑，只记录日志
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
      if (!enabled || config.command !== 'serve') {
        return null;
      }

      // 🎯 简化配置模式下不需要环境变量
      const hasSimplifiedConfig = options.autoLink || options.packages || options.preset;
      if (!hasSimplifiedConfig && process.env.DEV_LINK !== 'true') {
        return null;
      }

      if (!linkConfig) {
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

    // 🔥 新增：load钩子，用于追踪模块依赖
    load(id) {
      // 如果是本地包文件，建立映射关系
      if (isLocalPackageFile(id)) {
        addFileToModuleMapping(id, id);
      }
      return null;
    },

    // 🔥 改进的HMR处理逻辑
    handleHotUpdate(ctx) {
      const filePath = ctx.file;
      
      // 检查是否是本地包文件
      if (!isLocalPackageFile(filePath)) {
        return undefined;
      }
      
      log(`🔥 检测到本地包文件变化: ${relative(process.cwd(), filePath)}`);
      
      // 🔥 查找所有依赖此文件的模块
      const dependentModules = findDependentModules(filePath);
      
      if (dependentModules.size === 0) {
        log(`⚠️ 未找到依赖文件 ${relative(process.cwd(), filePath)} 的模块，尝试通过Vite模块图查找`);
        
        // 🔥 后备方案：直接通过Vite的模块图查找
        const normalizedPath = resolve(filePath);
        const modules = ctx.server.moduleGraph.fileToModulesMap.get(normalizedPath);
        
        if (modules && modules.size > 0) {
          log(`🔥 通过Vite模块图找到 ${modules.size} 个相关模块`);
          const moduleArray = Array.from(modules);
          
          moduleArray.forEach(module => {
            log(`🔥 HMR更新模块: ${module.id || module.url}`);
          });
          
          return moduleArray;
        }
        
        // 🔥 最后的后备方案：让Vite处理默认的HMR逻辑
        log(`⚠️ 未找到相关模块，使用Vite默认HMR处理`);
        return undefined;
      }
      
      // 🔥 找到相关模块，返回需要更新的模块
      const modulesToUpdate = [];
      
      for (const moduleId of dependentModules) {
        const module = ctx.server.moduleGraph.getModuleById(moduleId);
        if (module) {
          modulesToUpdate.push(module);
          log(`🔥 HMR更新模块: ${moduleId}`);
        }
      }
      
      if (modulesToUpdate.length > 0) {
        log(`🔥 共更新 ${modulesToUpdate.length} 个模块`);
        return modulesToUpdate;
      }
      
      return undefined;
    },

    buildEnd() {
      // 清理监听器
      watchers.forEach(watcher => {
        watcher.close();
      });
      watchers = [];
      
      // 清理映射
      fileToModuleMap.clear();
      moduleToFileMap.clear();
      localPackagePaths.clear();
      packageToPathMap.clear();
      
      server = null;
    }
  };
}

export default vitePluginDevLink;
export { vitePluginDevLink }; 