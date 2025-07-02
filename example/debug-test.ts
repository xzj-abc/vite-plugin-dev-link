// debug-test.ts - 调试模式测试示例
import { defineConfig } from 'vite';
import vitePluginDevLink from '../src/index';

export default defineConfig({
  plugins: [
    vitePluginDevLink({
      // 🔧 启用调试模式 - 这会显示详细的模块解析过程
      debug: true,
      
      // 使用简化配置，不需要环境变量
      preset: 'local-dev',
      
      // 也可以使用其他简化配置方式：
      // autoLink: '../local-packages',
      // packages: {
      //   '@test/ui-components': '../local-packages/@test/ui-components',
      //   '@test/icons': '../local-packages/@test/icons'
      // }
    })
  ]
});

/*
启用调试模式后，当您在代码中导入本地包时：

import { Button } from '@test/ui-components';

控制台会显示类似如下的调试信息：

🔍 [vite-plugin-dev-link] 尝试解析模块: @test/ui-components (importer: /src/main.ts)
🔍 [vite-plugin-dev-link] 当前可用的包映射:
🔍 [vite-plugin-dev-link]   - @test/ui-components -> local-packages/@test/ui-components
🔍 [vite-plugin-dev-link]   - @test/icons -> local-packages/@test/icons
🔍 [vite-plugin-dev-link] 检查包名匹配: "@test/ui-components" vs "@test/ui-components"
🔗 [vite-plugin-dev-link] 解析 @test/ui-components -> local-packages/@test/ui-components/index.js (默认 index.js)

如果没有看到这些日志，说明：
1. 插件配置有问题
2. 导入的包名与配置不匹配
3. 本地包路径不存在

根据具体的日志输出可以快速定位问题所在。
*/ 