# vite-plugin-dev-link

一个 Vite 插件，用于在开发过程中将本地包链接到项目中，替代 node_modules 中的对应包。支持热模块替换(HMR)、自动包扫描、智能路径解析等功能，让本地包开发体验如丝般顺滑。

## ✨ 功能特性

-   🔗 **本地包链接**: 将本地开发的包链接到项目中，替代 node_modules 中的包
-   🔥 **热模块替换(HMR)**: 支持本地包文件变化时的热更新，无需整页刷新
-   🔍 **自动包扫描**: 自动扫描本地目录，发现所有可用的包，无需手动配置
-   📁 **智能路径解析**: 相对路径相对于配置文件目录解析，支持多种路径配置方式
-   🎯 **精确控制**: 可以指定入口文件、排除文件，支持多包配置
-   📝 **清晰日志**: 提供详细且清晰的调试日志，快速定位包配置问题
-   🛡️ **安全启用**: 通过环境变量控制，避免意外启用影响正常开发
-   🔧 **灵活配置**: 支持全局配置和单包配置的灵活组合

## 📦 安装

```bash
npm install vite-plugin-dev-link --save-dev
```

## 🚀 快速开始

### 1. 配置 Vite

在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from "vite";
import vitePluginDevLink from "vite-plugin-dev-link";

export default defineConfig({
    plugins: [
        vitePluginDevLink({
            configFile: "dev-link.json", // 配置文件路径
            enabled: true, // 是否启用插件
            verbose: true, // 是否显示详细日志
        }),
    ],
});
```

### 2. 创建配置文件

在项目根目录创建 `dev-link.json` 配置文件：

```json
{
    "globalLocalPath": "../local-packages",
    "autoScan": true,
    "links": [
        {
            "package": ["@my-org/ui-components", "@my-org/icons"],
            "entryFile": "index.js"
        }
    ],
    "globalExclude": [
        "**/*.test.js",
        "**/*.test.ts",
        "**/*.spec.js",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/.git/**"
    ]
}
```

### 3. 启动开发服务器

使用环境变量启用 dev-link 功能：

```bash
DEV_LINK=true npm run dev
```

## ⚙️ 配置选项

### 插件选项

| 选项         | 类型      | 默认值            | 描述             |
| ------------ | --------- | ----------------- | ---------------- |
| `configFile` | `string`  | `'dev-link.json'` | 配置文件路径     |
| `enabled`    | `boolean` | `true`            | 是否启用插件     |
| `verbose`    | `boolean` | `false`           | 是否显示详细日志 |

### 配置文件格式

#### DevLinkConfigFile

| 字段              | 类型            | 必填 | 描述                                         |
| ----------------- | --------------- | ---- | -------------------------------------------- |
| `globalLocalPath` | `string`        | ❌   | 全局本地包路径，作为默认路径                 |
| `links`           | `LinkMapping[]` | ✅   | 链接配置数组                                 |
| `globalExclude`   | `string[]`      | ❌   | 全局排除模式                                 |
| `autoScan`        | `boolean`       | ❌   | 是否自动扫描本地目录下的 package.json        |
| `globalEntryFile` | `string`        | ❌   | 全局默认入口文件（相对于对应包的 localPath） |

#### LinkMapping

| 字段        | 类型                 | 必填 | 描述                                     |
| ----------- | -------------------- | ---- | ---------------------------------------- |
| `package`   | `string \| string[]` | ✅   | 包名或包名数组                           |
| `localPath` | `string`             | ❌   | 本地源码路径（如果未指定则使用全局路径） |
| `entryFile` | `string`             | ❌   | 指定包的入口文件（相对于 localPath）     |
| `exclude`   | `string[]`           | ❌   | 排除的文件模式                           |

## 🔧 高级功能

### 自动包扫描 (autoScan)

启用 `autoScan: true` 后，插件会自动扫描 `globalLocalPath` 目录下的所有包：

```json
{
    "globalLocalPath": "../local-packages",
    "autoScan": true,
    "links": [
        {
            "package": ["@test/ui-components", "@test/icons"]
            // 不需要配置 localPath，会自动发现
        }
    ]
}
```

扫描规则：

-   支持普通包：`package-name/package.json`
-   支持作用域包：`@scope/package-name/package.json`
-   通过读取 `package.json` 中的 `name` 字段获取包名

### 路径解析优先级

1. **包配置的 localPath**: 如果在 `links` 中指定了 `localPath`
2. **自动扫描结果**: 如果启用了 `autoScan` 且找到了包
3. **全局路径**: 使用 `globalLocalPath` 作为后备

### 入口文件解析

支持多种入口文件配置方式：

1. **包级 entryFile**: 在 `links` 中为特定包配置
2. **全局 entryFile**: 在根配置中配置 `globalEntryFile`
3. **自动查找**: 按顺序查找 `index.ts` → `index.js` → `package.json`

### 热模块替换 (HMR)

插件内置了智能的 HMR 支持：

-   📁 **文件映射**: 自动建立文件路径到模块 ID 的映射
-   🔥 **精准更新**: 只更新变化的模块，不会整页刷新
-   🔄 **多级回退**: 智能查找需要更新的模块
-   📝 **详细日志**: 显示 HMR 更新过程

## 📖 使用场景

### 场景 1: 组件库开发

开发组件库时在另一个项目中实时测试：

```json
{
    "globalLocalPath": "../my-ui-lib",
    "autoScan": true,
    "links": [
        {
            "package": "@company/ui-kit",
            "entryFile": "dist/index.js",
            "exclude": ["**/*.test.*", "**/*.stories.*"]
        }
    ]
}
```

### 场景 2: 多包工作区

同时开发多个相关包：

```json
{
    "globalLocalPath": "../packages",
    "autoScan": true,
    "globalEntryFile": "src/index.ts",
    "links": [
        {
            "package": [
                "@company/core",
                "@company/utils",
                "@company/components"
            ]
        }
    ]
}
```

### 场景 3: 混合配置

部分包使用自动扫描，部分包手动配置：

```json
{
    "globalLocalPath": "../packages",
    "autoScan": true,
    "links": [
        {
            "package": ["@company/ui", "@company/icons"]
            // 使用自动扫描
        },
        {
            "package": "legacy-package",
            "localPath": "../legacy/src",
            "entryFile": "main.js"
            // 手动配置
        }
    ]
}
```

## 🔍 工作原理

1. **环境检测**: 检查 `DEV_LINK` 环境变量是否设置为 `true`
2. **配置加载**: 读取配置文件，相对路径相对于配置文件目录解析
3. **包扫描**: 如果启用了 `autoScan`，扫描并发现本地包
4. **模块解析**: 拦截模块导入请求，检查是否匹配配置的包名
5. **路径重写**: 将匹配的包导入重定向到本地文件路径
6. **文件监听**: 监听本地文件变化，建立文件到模块的映射
7. **HMR 处理**: 文件变化时触发精准的热模块替换

## 📝 日志说明

插件提供清晰的日志信息：

```bash
# 启动时
🔗 [vite-plugin-dev-link] 已加载配置文件: /path/to/dev-link.json
🔗 [vite-plugin-dev-link] 自动扫描本地包: ../local-packages
🔗 [vite-plugin-dev-link] 发现本地包: @test/ui-components -> local-packages/@test/ui-components
🔗 [vite-plugin-dev-link] 成功链接包: @test/ui-components -> local-packages/@test/ui-components

# 模块解析时
🔗 [vite-plugin-dev-link] 解析 @test/ui-components -> local-packages/@test/ui-components/index.js (使用配置的 entryFile)

# HMR更新时
🔗 [vite-plugin-dev-link] 🔥 HMR更新: local-packages/@test/ui-components/index.js -> @test/ui-components

# 错误提示
🔗 [vite-plugin-dev-link] 包 "@test/ui-components" 的 entryFile 不存在: path/to/file (localPath: path/to/local)
```

## ⚠️ 注意事项

1. **环境变量**: 必须设置 `DEV_LINK=true` 环境变量才能启用插件功能
2. **路径解析**: 相对路径相对于配置文件所在目录解析，不是工作目录
3. **文件扩展名**: 插件会自动尝试 `.ts`, `.tsx`, `.js`, `.jsx`, `.vue` 等扩展名
4. **作用域包**: 完全支持 `@scope/package-name` 格式的作用域包
5. **性能优化**: 只在开发模式下启用，不影响生产构建
6. **热更新**: 修改本地文件时会自动触发 HMR 更新，保持页面状态
7. **安全性**: 不设置环境变量时插件完全不启用

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 构建插件
npm run build

# 开发插件（监听文件变化）
npm run dev:plugin

# 运行测试
npm test

# 启动示例项目
cd example
DEV_LINK=true npm run dev
```

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

> 🔥 让本地包开发如丝般顺滑！再也不用为复杂的包链接和热更新而烦恼。
