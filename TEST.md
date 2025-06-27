# Vite Plugin Dev Link 测试项目

这个测试项目演示了增强版的 vite-plugin-dev-link 插件功能。

## 新功能特性

### ✨ 全局 localPath 配置

-   可以在配置文件中设置 `globalLocalPath`，作为默认的本地包路径
-   单个包映射如果没有指定 `localPath` 将使用全局路径

### 🔍 自动包扫描

-   设置 `autoScan: true` 自动扫描 `globalLocalPath` 目录下的所有包
-   通过读取每个子目录的 `package.json` 自动发现包名和路径

### 📦 多包支持

-   `package` 字段支持字符串数组，可以同时配置多个包使用相同的本地路径
-   例如：`"package": ["@test/ui-components", "@test/icons"]`

### 🎯 智能路径解析

-   优先使用包映射中指定的 `localPath`
-   如果没有指定，则使用 `globalLocalPath` + 自动扫描结果
-   最后 fallback 到 `globalLocalPath` 本身

## 测试步骤

### 1. 正常模式（插件不激活）

```bash
npm run dev
```

此时插件不会激活，会尝试从 node_modules 加载包（会失败，这是正常的）

### 2. 启用本地链接功能

```bash
DEV_LINK=true npm run dev
```

此时插件会：

-   扫描 `local-packages/` 目录
-   自动发现 `@test/ui-components`、`@test/icons`、`lodash` 包
-   使用 `custom-utils/` 作为 `test-utils` 包的路径
-   启动文件监听，支持热更新

### 3. 测试热更新

启用插件后，可以修改以下文件观察热更新：

-   `local-packages/@test/ui-components/index.js` - 修改按钮样式或文本
-   `local-packages/@test/icons/index.js` - 修改图标
-   `local-packages/lodash/index.js` - 修改工具函数
-   `custom-utils/index.js` - 修改自定义工具函数

## 目录结构

```
test-enhanced-plugin/
├── src/
│   ├── main.ts              # 测试代码
│   └── style.css            # 样式
├── local-packages/          # 全局本地包目录
│   ├── @test/
│   │   ├── ui-components/   # UI组件包
│   │   └── icons/           # 图标包
│   └── lodash/              # 模拟的lodash包
├── custom-utils/            # 自定义工具包目录
├── dev-link.json            # 插件配置
└── vite.config.ts           # Vite配置
```

## 配置文件说明

```json
{
    "globalLocalPath": "./local-packages", // 全局本地包路径
    "autoScan": true, // 启用自动扫描
    "links": [
        {
            "package": ["@test/ui-components", "@test/icons"] // 多包配置
            // 没有 localPath，使用 globalLocalPath + 自动扫描
        },
        {
            "package": "test-utils", // 单包配置
            "localPath": "./custom-utils" // 使用指定路径
        },
        {
            "package": "lodash" // 使用 globalLocalPath + 自动扫描
        }
    ]
}
```

## 预期结果

启用插件后，控制台应显示：

```
🔗 [vite-plugin-dev-link] 提示：要启用 dev-link 功能，请设置环境变量 DEV_LINK=true
🔗 [vite-plugin-dev-link] 已加载配置文件
🔗 [vite-plugin-dev-link] 开始处理 3 个链接配置
🔗 [vite-plugin-dev-link] 自动扫描本地包: ./local-packages
🔗 [vite-plugin-dev-link] 发现本地包: @test/ui-components -> local-packages/@test/ui-components
🔗 [vite-plugin-dev-link] 发现本地包: @test/icons -> local-packages/@test/icons
🔗 [vite-plugin-dev-link] 发现本地包: lodash -> local-packages/lodash
🔗 [vite-plugin-dev-link] 链接: @test/ui-components -> local-packages/@test/ui-components
🔗 [vite-plugin-dev-link] 链接: @test/icons -> local-packages/@test/icons
🔗 [vite-plugin-dev-link] 链接: test-utils -> custom-utils
🔗 [vite-plugin-dev-link] 链接: lodash -> local-packages/lodash
```

页面会显示各种组件和工具函数的测试结果，证明本地包链接成功。
