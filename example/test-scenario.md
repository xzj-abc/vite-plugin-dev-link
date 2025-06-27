# 测试场景说明

## 场景设置

假设你有以下目录结构：

```
workspace/
├── vite-plugin-dev-link/          # 插件项目
├── my-ui-library/                 # 你的组件库源码
│   └── src/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── index.ts
└── test-app/                      # 测试应用
    ├── src/
    ├── vite.config.ts
    ├── dev-link.json
    └── package.json
```

## 1. 准备模拟组件库

创建 `my-ui-library/src/Button.tsx`:

```tsx
import React from "react";

export interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = "primary",
}) => {
    return (
        <button
            onClick={onClick}
            style={{
                backgroundColor: variant === "primary" ? "#007bff" : "#6c757d",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
            }}
        >
            {children} (本地版本 🔥)
        </button>
    );
};
```

创建 `my-ui-library/src/index.ts`:

```ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
```

## 2. 配置测试应用

在 `test-app/dev-link.json`:

```json
{
    "links": [
        {
            "package": "@my-org/ui-library",
            "localPath": "../my-ui-library/src"
        }
    ]
}
```

在 `test-app/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginDevLink from "vite-plugin-dev-link";

export default defineConfig({
    plugins: [
        react(),
        vitePluginDevLink({
            configFile: "dev-link.json",
            verbose: true,
        }),
    ],
});
```

在 `test-app/package.json` 添加依赖：

```json
{
    "dependencies": {
        "@my-org/ui-library": "^1.0.0"
    }
}
```

## 3. 测试步骤

1. **正常开发模式**（插件不激活）：

    ```bash
    cd test-app
    npm run dev
    ```

    此时会使用 node_modules 中的 @my-org/ui-library

2. **启用本地链接**：

    ```bash
    DEV_LINK=true npm run dev
    ```

    此时会使用 ../my-ui-library/src 中的本地代码

3. **验证效果**：
    - 修改 `my-ui-library/src/Button.tsx` 中的样式或文本
    - 页面应该自动热更新，显示修改后的效果

## 4. 预期结果

-   设置 `DEV_LINK=true` 时，控制台会显示：

    ```
    🔗 [vite-plugin-dev-link] 已加载配置文件: /path/to/dev-link.json
    🔗 [vite-plugin-dev-link] 开始处理 1 个链接配置
    🔗 [vite-plugin-dev-link] 链接: @my-org/ui-library -> ../my-ui-library/src
    ```

-   当解析模块时会显示：

    ```
    🔗 [vite-plugin-dev-link] 解析 @my-org/ui-library -> my-ui-library/src/index.ts
    ```

-   修改本地文件时，页面会自动热重载

## 5. 调试技巧

-   使用 `verbose: true` 查看详细日志
-   检查 `dev-link.json` 配置是否正确
-   确保本地路径存在且文件可访问
-   查看浏览器控制台的错误信息
