# Dev Link 插件测试场景

这个示例展示了如何使用 vite-plugin-dev-link 插件在开发时链接本地包。

## 🚀 启动测试

1. **启动开发服务器**：

    ```bash
    npm run dev
    ```

2. **启用 Dev Link 功能**：
    ```bash
    DEV_LINK=true npm run dev
    ```

## 📦 测试的本地包

示例中测试了以下本地包：

### 1. @test/ui-components

-   **本地路径**: `local-packages/@test/ui-components/`
-   **功能**: 提供 Button 和 Input 组件
-   **测试**: 页面会显示可交互的按钮和输入框
-   **HMR**: 修改组件代码会实时热更新，无需刷新页面

### 2. @test/icons

-   **本地路径**: `local-packages/@test/icons/`
-   **功能**: 提供图标组件
-   **测试**: 页面会显示各种图标
-   **HMR**: 修改图标代码会实时热更新

## 🔧 实时测试方法 (HMR)

### 测试 UI 组件热更新

1. 修改 `local-packages/@test/ui-components/index.js`
2. 例如：更改按钮文本 `(本地版本 🔥)` 为 `(HMR测试 ✨)`
3. 保存文件，**页面会平滑热更新，不会刷新**

### 测试图标热更新

1. 修改 `local-packages/@test/icons/index.js`
2. 例如：更改图标文本 `🏠 (本地版本)` 为 `🏠 (HMR更新)`
3. 保存文件，**图标会立即更新，保持页面状态**

### HMR 验证要点

-   ✅ **无整页刷新**: 页面不会白屏或重新加载
-   ✅ **状态保持**: 输入框的内容、按钮状态等都会保持
-   ✅ **即时更新**: 修改的内容立即反映在页面上
-   ✅ **HMR 日志**: 控制台会显示 HMR 更新日志

## 🎯 验证方法

### 控制台验证

-   打开浏览器开发者工具
-   查看控制台输出，应该看到类似：
    ```bash
    🔗 [vite-plugin-dev-link] 已加载配置文件: /path/to/dev-link.json
    🔗 [vite-plugin-dev-link] 发现本地包: @test/ui-components -> local-packages/@test/ui-components
    🔗 [vite-plugin-dev-link] 🔥 HMR更新: local-packages/@test/ui-components/index.js -> @test/ui-components
    🔥 使用本地 UI Components 包!
    🔥 使用本地 Icons 包!
    ```

### 页面验证

-   右上角会显示 Dev Link 状态面板
-   所有组件都应该正常工作
-   修改本地文件后，页面会**平滑热更新**

### 功能测试

1. **按钮测试**: 点击按钮应该触发事件
2. **输入框测试**: 在输入框中输入内容，控制台会显示
3. **HMR 测试**: 修改本地文件，页面实时更新但不刷新

## 🔄 HMR 测试步骤

1. 修改本地包文件 (如 `local-packages/@test/ui-components/index.js`)
2. 保存文件
3. 观察页面**平滑更新**，不会白屏刷新
4. 检查控制台 HMR 日志：
    ```bash
    🔗 [vite-plugin-dev-link] 🔥 HMR更新: local-packages/@test/ui-components/index.js -> @test/ui-components
    ```

## 🐛 故障排除

### 如果 HMR 不工作

1. 确认 `DEV_LINK=true` 环境变量已设置
2. 检查文件保存是否成功
3. 查看控制台是否有 HMR 日志输出
4. 确认修改的是正确的文件路径

### 如果包无法链接

1. 检查 `dev-link.json` 配置是否正确
2. 确认 `globalLocalPath` 路径相对于配置文件目录
3. 验证本地包目录存在且有 `package.json`
4. 检查包名是否与配置一致

### 如果路径解析错误

1. 确认相对路径是相对于配置文件所在目录
2. 检查 `autoScan` 是否正确发现包
3. 查看详细的错误日志定位问题

### 如果整页刷新而非 HMR

1. 检查是否有语法错误导致模块重新加载
2. 确认修改的文件确实被插件监听
3. 查看 HMR 相关的日志信息

## 📝 预期结果

成功运行后，你应该看到：

-   ✅ 页面正常加载所有本地组件
-   ✅ 控制台显示清晰的本地包链接日志
-   ✅ 右上角显示 Dev Link 状态面板
-   ✅ 所有交互功能正常工作
-   ✅ **修改本地文件后页面平滑热更新，无刷新**
-   ✅ HMR 日志清晰显示更新过程

---

> 🔥 体验如丝般顺滑的本地包 HMR 开发！
