# vite-plugin-dev-link

一个 Vite 插件，用于在开发过程中将本地组件目录链接到项目中，替代 node_modules 中的对应包。这样可以实现本地组件的热更新和实时调试。

## 功能特性

-   🔗 **本地链接**: 将本地开发的组件链接到项目中，替代 node_modules 中的包
-   🔄 **热更新**: 支持本地组件文件变化时的热更新
-   📁 **灵活配置**: 支持通过 JSON 配置文件灵活配置链接规则
-   🎯 **精确控制**: 可以指定具体的文件或目录进行链接
-   🚫 **排除模式**: 支持排除不需要的文件（如测试文件、构建文件等）
-   📝 **详细日志**: 提供详细的调试日志，方便问题排查
-   🛡️ **安全启用**: 通过环境变量控制，避免意外启用影响正常开发

## 安装

```bash
npm install vite-plugin-dev-link --save-dev
```

## 使用方法

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
    "links": [
        {
            "package": "@my-org/ui-components",
            "localPath": "../ui-components/src",
            "files": [
                "components/Button.tsx",
                "components/Input.tsx",
                "index.ts"
            ],
            "exclude": ["**/*.test.ts", "**/*.stories.ts"]
        },
        {
            "package": "my-utils",
            "localPath": "../my-utils/src",
            "exclude": ["**/*.test.js", "**/*.spec.js"]
        }
    ],
    "globalExclude": [
        "**/*.d.ts",
        "**/*.map",
        "**/node_modules/**",
        "**/.git/**"
    ]
}
```

### 3. 运行开发服务器

使用环境变量启用 dev-link 功能：

```bash
DEV_LINK=true npm run dev
```

或者在 Windows 中：

```bash
set DEV_LINK=true && npm run dev
```

## 配置选项

### 插件选项

| 选项         | 类型      | 默认值            | 描述             |
| ------------ | --------- | ----------------- | ---------------- |
| `configFile` | `string`  | `'dev-link.json'` | 配置文件路径     |
| `enabled`    | `boolean` | `true`            | 是否启用插件     |
| `verbose`    | `boolean` | `false`           | 是否显示详细日志 |

### 配置文件格式

#### LinkMapping 配置

| 字段        | 类型       | 必填 | 描述                                 |
| ----------- | ---------- | ---- | ------------------------------------ |
| `package`   | `string`   | ✅   | 要替换的包名                         |
| `localPath` | `string`   | ✅   | 本地源码路径                         |
| `files`     | `string[]` | ❌   | 指定要链接的文件（相对于 localPath） |
| `exclude`   | `string[]` | ❌   | 排除的文件模式                       |

#### 全局配置

| 字段            | 类型            | 必填 | 描述         |
| --------------- | --------------- | ---- | ------------ |
| `links`         | `LinkMapping[]` | ✅   | 链接配置数组 |
| `globalExclude` | `string[]`      | ❌   | 全局排除模式 |

## 工作原理

1. **环境检测**: 检查 `DEV_LINK` 环境变量是否设置为 `true`
2. **配置加载**: 插件启动时读取配置文件，解析链接规则
3. **模块解析**: 拦截模块导入请求，检查是否匹配配置的包名
4. **路径重写**: 将匹配的包导入重定向到本地文件路径
5. **文件监听**: 监听本地文件变化，触发热更新
6. **智能匹配**: 支持包的子路径导入和多种文件扩展名

## 使用场景

### 场景 1: 组件库开发

当你在开发一个组件库，并且需要在另一个项目中实时测试时：

```json
{
    "links": [
        {
            "package": "@company/ui-kit",
            "localPath": "../ui-kit/src",
            "exclude": ["**/*.test.*", "**/*.stories.*"]
        }
    ]
}
```

### 场景 2: 工具库调试

调试工具库时只链接特定模块：

```json
{
    "links": [
        {
            "package": "my-utils",
            "localPath": "../utils/src",
            "files": ["index.ts", "debounce.ts", "throttle.ts"]
        }
    ]
}
```

### 场景 3: 多包开发

同时开发多个相关包：

```json
{
    "links": [
        {
            "package": "@company/core",
            "localPath": "../core/src"
        },
        {
            "package": "@company/components",
            "localPath": "../components/src"
        },
        {
            "package": "@company/utils",
            "localPath": "../utils/src"
        }
    ]
}
```

## 注意事项

1. **环境变量**: 必须设置 `DEV_LINK=true` 环境变量才能启用插件功能
2. **路径解析**: 本地路径支持相对路径和绝对路径
3. **文件扩展名**: 插件会自动尝试 `.ts`, `.tsx`, `.js`, `.jsx`, `.vue` 等扩展名
4. **包查找**: 优先使用 `require.resolve` 查找包，fallback 到 node_modules 目录
5. **性能优化**: 只在开发模式下启用，不影响生产构建
6. **热更新**: 修改本地文件时会自动触发页面更新
7. **安全性**: 不设置环境变量时插件不会启用，避免意外影响正常开发流程

## 开发

```bash
# 安装依赖
npm install

# 开发插件（监听文件变化）
npm run dev:plugin

# 启动示例项目
npm run dev

# 启用链接功能的开发模式
DEV_LINK=true npm run dev

# 构建
npm run build

# 测试
npm run test
```

## 许可证

MIT
