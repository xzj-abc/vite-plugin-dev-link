# Vite Plugin Dev Link 测试项目

这个测试项目演示了 vite-plugin-dev-link 插件的完整功能，包括热模块替换(HMR)、自动包扫描、智能路径解析等特性。

## ✨ 最新功能特性

### 🔥 热模块替换 (HMR)

-   本地包文件修改后**不会整页刷新**，而是实现精准的热模块替换
-   保持页面状态，提供如丝般顺滑的开发体验
-   智能文件映射，精确更新变化的模块

### 🔍 自动包扫描

-   设置 `autoScan: true` 自动扫描 `globalLocalPath` 目录下的所有包
-   支持普通包和作用域包的自动发现
-   通过读取 `package.json` 自动建立包名和路径的映射

### 📁 智能路径解析

-   相对路径相对于**配置文件所在目录**解析，而不是工作目录
-   支持多种路径配置优先级：包配置 > 自动扫描 > 全局路径
-   支持 `entryFile` 和 `globalEntryFile` 配置

### 📦 多包支持

-   `package` 字段支持字符串数组：`"package": ["@test/ui-components", "@test/icons"]`
-   一个配置可以同时处理多个相关包

### 📝 清晰的日志系统

-   所有日志都会显示具体的包名，便于问题定位
-   详细的错误提示，包含文件路径和上下文信息
-   HMR 更新过程的详细日志

## 🚀 测试步骤

### 1. 正常模式（插件不激活）

```bash
npm run dev
```

此时插件不会激活，会显示提示信息：

```
🔗 [vite-plugin-dev-link] 提示：要启用 dev-link 功能，请设置环境变量 DEV_LINK=true
```

### 2. 启用本地链接功能

```bash
DEV_LINK=true npm run dev
```

此时插件会：

-   加载配置文件 `example/dev-link.json`
-   自动扫描 `local-packages/` 目录
-   发现并链接 `@test/ui-components` 和 `@test/icons` 包
-   启动文件监听，支持 HMR

### 3. 测试热模块替换 (HMR)

启用插件后，修改以下文件观察 HMR 效果：

#### 测试 UI 组件热更新

1. 修改 `local-packages/@test/ui-components/index.js`
2. 例如：更改按钮文本 `(本地版本 🔥)` 为 `(HMR测试 ✨)`
3. 保存文件，**页面会平滑更新，不会刷新**

#### 测试图标热更新

1. 修改 `local-packages/@test/icons/index.js`
2. 例如：更改图标文本 `🏠 (本地版本)` 为 `🏠 (HMR更新)`
3. 保存文件，图标会立即更新

## 📁 目录结构

```
vite-plugin-dev-link/
├── src/
│   └── index.ts              # 插件源码
├── example/                  # 测试项目
│   ├── dev-link.json         # 插件配置
│   ├── index.html            # 测试页面
│   ├── main.ts               # 测试代码
│   └── vite.config.ts        # Vite配置
├── local-packages/           # 本地包目录
│   └── @test/
│       ├── ui-components/    # UI组件包
│       └── icons/            # 图标包
```

## ⚙️ 配置文件说明

`example/dev-link.json` 配置：

```json
{
    "globalLocalPath": "../local-packages", // 全局本地包路径
    "autoScan": true, // 启用自动扫描
    "links": [
        {
            "package": ["@test/ui-components", "@test/icons"], // 多包配置
            "entryFile": "index.js" // 指定入口文件
        }
    ],
    "globalExclude": [
        // 全局排除模式
        "**/*.test.js",
        "**/*.test.ts",
        "**/*.spec.js",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/.git/**"
    ]
}
```

### 配置特点：

-   ✅ **相对路径解析**: `../local-packages` 相对于配置文件所在目录
-   ✅ **自动扫描**: 自动发现 `local-packages` 下的所有包
-   ✅ **多包配置**: 一个配置项处理多个包
-   ✅ **入口文件**: 指定 `index.js` 作为入口

## 📊 预期结果

启用插件后，控制台应显示：

```bash
🔗 [vite-plugin-dev-link] 已加载配置文件: /path/to/example/dev-link.json
🔗 [vite-plugin-dev-link] 开始处理 1 个链接配置
🔗 [vite-plugin-dev-link] 自动扫描本地包: ../local-packages
🔗 [vite-plugin-dev-link] 发现本地包: @test/ui-components -> local-packages/@test/ui-components
🔗 [vite-plugin-dev-link] 发现本地包: @test/icons -> local-packages/@test/icons
🔗 [vite-plugin-dev-link] 成功链接包: @test/ui-components -> local-packages/@test/ui-components
🔗 [vite-plugin-dev-link] 成功链接包: @test/icons -> local-packages/@test/icons
```

模块解析时：

```bash
🔗 [vite-plugin-dev-link] 解析 @test/ui-components -> local-packages/@test/ui-components/index.js (使用配置的 entryFile)
🔗 [vite-plugin-dev-link] 解析 @test/icons -> local-packages/@test/icons/index.js (使用配置的 entryFile)
```

HMR 更新时：

```bash
🔗 [vite-plugin-dev-link] 🔥 HMR更新: local-packages/@test/ui-components/index.js -> @test/ui-components
```

## 🎯 验证清单

### ✅ 基本功能

-   [ ] 环境变量未设置时显示提示信息
-   [ ] 配置文件正确加载和解析
-   [ ] 自动扫描发现本地包
-   [ ] 包路径正确链接

### ✅ 模块解析

-   [ ] 包名正确解析到本地文件
-   [ ] 入口文件按配置正确加载
-   [ ] 作用域包 (`@test/xxx`) 正常工作

### ✅ HMR 功能

-   [ ] 文件修改后触发 HMR，不会整页刷新
-   [ ] 页面状态保持，组件平滑更新
-   [ ] HMR 日志正确显示

### ✅ 错误处理

-   [ ] 不存在的包路径有清晰的错误提示
-   [ ] 包名明确标识，便于问题定位
-   [ ] 配置错误有详细的错误信息

## 🔧 故障排除

### 如果 HMR 不工作

1. 确认文件保存成功
2. 检查浏览器控制台是否有 HMR 日志
3. 确认修改的是正确的文件路径

### 如果包无法链接

1. 检查 `globalLocalPath` 路径是否正确
2. 确认本地包目录存在且有 `package.json`
3. 验证包名是否与配置一致

### 如果路径解析错误

1. 确认相对路径是相对于配置文件目录
2. 检查 `autoScan` 是否正确发现包
3. 查看详细日志定位问题

## 🎉 成功标准

测试成功的标准：

-   ✅ 所有本地包正确链接和加载
-   ✅ 页面功能正常，组件交互可用
-   ✅ HMR 热更新工作正常，无整页刷新
-   ✅ 日志信息清晰，便于调试
-   ✅ 错误处理友好，问题定位准确

---

> 🔥 享受如丝般顺滑的本地包开发体验！
