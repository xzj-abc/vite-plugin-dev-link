# HMR 测试指南 - 依赖文件变化检测

## 🎯 测试目标

验证改进后的 vite-plugin-dev-link 是否解决了两个关键问题：

1. **文件变化后 HMR 没生效**
2. **依赖文件变化不会触发监听**

## 🚀 启动测试环境

```bash
cd example
DEV_LINK=true npm run dev
```

访问 `http://localhost:5173`，你应该看到：

-   页面标题：**Vite Plugin Dev Link 测试 - 依赖文件 HMR**
-   右上角状态面板显示已链接的包
-   控制台显示插件工作日志

## 📋 测试场景清单

### ✅ 1. 基础功能验证

**检查点：**

-   [ ] 页面正常加载，没有错误
-   [ ] 控制台显示：`🔗 [vite-plugin-dev-link] 成功链接包`
-   [ ] 控制台显示：`🔧 ui-components/utils.js 已加载 (依赖文件)`
-   [ ] 控制台显示：`🎨 icons/helpers.js 已加载 (依赖文件)`
-   [ ] UI 组件正常显示，按钮可点击
-   [ ] 图标显示正常，悬停有动画效果
-   [ ] 输入框有实时验证功能

### 🔥 2. 主文件 HMR 测试

**测试步骤：**

1. 点击计数器几次，记住当前数值
2. 修改 `local-packages/@test/ui-components/index.js`
3. 例如：将 `console.log('🔥 使用本地 UI Components 包!');` 改为 `console.log('🔥 主文件已更新!');`
4. 保存文件

**预期结果：**

-   [ ] 页面无刷新更新
-   [ ] 控制台显示 HMR 更新日志
-   [ ] 计数器状态保持不变
-   [ ] 控制台显示新的日志消息

### 🎯 3. 依赖文件 HMR 测试 (重点)

#### 3.1 UI 组件依赖文件测试

**测试步骤：**

1. 确保计数器有值（测试状态保持）
2. 修改 `local-packages/@test/ui-components/utils.js`
3. 将 `formatButtonText` 函数中的：
    ```javascript
    return `${text} (工具函数处理 🔧)`;
    ```
    改为：
    ```javascript
    return `${text} (依赖文件HMR成功 ✨)`;
    ```
4. 保存文件

**预期结果：**

-   [ ] 页面无刷新更新
-   [ ] 所有按钮的文本立即更新为新内容
-   [ ] 控制台显示：`🔥 检测到本地包文件变化`
-   [ ] 控制台显示：`🔥 HMR更新模块`
-   [ ] 计数器状态保持不变

#### 3.2 图标依赖文件测试

**测试步骤：**

1. 修改 `local-packages/@test/icons/helpers.js`
2. 将 `wrapIcon` 函数中的：
    ```javascript
    return `${icon} ${label} (辅助函数处理 🎨)`;
    ```
    改为：
    ```javascript
    return `${icon} ${label} (图标依赖HMR成功 🎉)`;
    ```
3. 保存文件

**预期结果：**

-   [ ] 页面无刷新更新
-   [ ] 所有图标的文本立即更新
-   [ ] 控制台显示 HMR 更新日志
-   [ ] 动画效果保持正常

#### 3.3 样式变化测试

**测试步骤：**

1. 修改 `local-packages/@test/ui-components/utils.js`
2. 在 `getButtonStyle` 函数中修改颜色：
    ```javascript
    const styles = {
        primary: "#ff6b6b", // 改为红色
        secondary: "#4ecdc4", // 改为青色
        success: "#45b7d1", // 改为蓝色
        danger: "#f9ca24", // 改为黄色
    };
    ```
3. 保存文件

**预期结果：**

-   [ ] 按钮颜色立即改变
-   [ ] 无整页刷新
-   [ ] HMR 日志显示更新

### 🔍 4. 错误场景测试

#### 4.1 语法错误恢复

**测试步骤：**

1. 在 `utils.js` 中引入语法错误（如删除一个括号）
2. 保存文件，观察错误处理
3. 修复语法错误
4. 保存文件

**预期结果：**

-   [ ] 语法错误时显示错误信息
-   [ ] 修复后自动恢复正常
-   [ ] 页面状态保持

#### 4.2 依赖关系断开测试

**测试步骤：**

1. 临时重命名 `utils.js` 为 `utils.js.bak`
2. 观察错误处理
3. 恢复文件名

**预期结果：**

-   [ ] 显示模块找不到的错误
-   [ ] 恢复后自动正常工作

## 📊 测试结果评估

### ✅ 成功标准

-   所有依赖文件变化都能触发 HMR
-   HMR 更新不会导致整页刷新
-   页面状态（如计数器）在 HMR 后保持
-   控制台有详细的 HMR 更新日志

### ❌ 失败情况

-   修改依赖文件后没有触发更新
-   页面整页刷新而不是 HMR
-   状态丢失（计数器重置）
-   控制台没有 HMR 日志

## 🛠️ 故障排除

### 如果依赖文件 HMR 不工作：

1. **检查控制台日志**

    ```
    🔥 检测到本地包文件变化: local-packages/@test/ui-components/utils.js
    🔥 查找所有依赖此文件的模块
    🔥 HMR更新模块: @test/ui-components
    ```

2. **检查文件映射**

    - 启用 `verbose: true` 选项
    - 查看文件到模块的映射日志

3. **检查模块图**
    - 确保 Vite 正确解析了依赖关系
    - 检查 import 语句是否正确

### 调试技巧：

1. **启用详细日志**

    ```javascript
    vitePluginDevLink({
        preset: "local-dev",
        verbose: true, // 启用详细日志
    });
    ```

2. **浏览器开发者工具**
    - Network 标签查看 HMR 请求
    - Console 查看详细错误信息

## 🎉 成功案例演示

如果一切正常，你应该看到：

```
🔗 [vite-plugin-dev-link] 🔥 检测到本地包文件变化: local-packages/@test/ui-components/utils.js
🔗 [vite-plugin-dev-link] 🔥 通过Vite模块图找到 1 个相关模块
🔗 [vite-plugin-dev-link] 🔥 HMR更新模块: @test/ui-components
🔗 [vite-plugin-dev-link] 🔥 共更新 1 个模块
```

同时页面内容实时更新，状态保持不变！

---

## 📝 测试记录

**测试日期：** ****\_****
**测试人员：** ****\_****

| 测试项目        | 结果  | 备注 |
| --------------- | ----- | ---- |
| 基础功能        | ✅/❌ |      |
| 主文件 HMR      | ✅/❌ |      |
| UI 组件依赖 HMR | ✅/❌ |      |
| 图标依赖 HMR    | ✅/❌ |      |
| 样式变化 HMR    | ✅/❌ |      |
| 错误恢复        | ✅/❌ |      |

**总体评估：** ****\_****
