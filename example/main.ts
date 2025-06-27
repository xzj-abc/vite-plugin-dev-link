// 这里展示如何导入通过 dev-link 链接的本地组件
// 在实际使用中，这些包通常安装在 node_modules 中
// 但在开发时会被本地文件替换

console.log('🔗 Vite Plugin Dev Link 示例启动');

// 检查环境变量（在开发时通过服务端日志查看实际状态）
if (import.meta.env.DEV) {
  console.log('💡 提示：在服务端控制台查看 DEV_LINK 环境变量状态');
  console.log('   启用方式：DEV_LINK=true npm run dev');
}

// 示例1: 导入整个包
try {
  // import { Button, Input } from '@my-org/ui-components';
  console.log('📦 尝试导入 @my-org/ui-components');
} catch (error) {
  console.log('⚠️ @my-org/ui-components 未找到（这是正常的，因为这只是示例）');
}

// 示例2: 导入包的子路径
try {
  // import { debounce } from 'my-utils/debounce';
  console.log('📦 尝试导入 my-utils/debounce');
} catch (error) {
  console.log('⚠️ my-utils 未找到（这是正常的，因为这只是示例）');
}

// 创建示例内容
const app = document.getElementById('components');
if (app) {
  app.innerHTML = `
    <div style="padding: 20px; border: 1px solid #ccc; margin: 10px 0;">
      <h3>模拟的 Button 组件</h3>
      <button style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">
        点击我
      </button>
      <p style="font-size: 12px; color: #666;">
        在实际使用中，这个按钮会来自 @my-org/ui-components 包，
        但在开发时会使用 ../ui-components/src/components/Button.tsx 的本地版本
      </p>
    </div>
    
    <div style="padding: 20px; border: 1px solid #ccc; margin: 10px 0;">
      <h3>模拟的 Input 组件</h3>
      <input 
        type="text" 
        placeholder="输入内容..." 
        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 200px;"
      />
      <p style="font-size: 12px; color: #666;">
        这个输入框也会来自链接的本地组件
      </p>
    </div>
    
    <div style="padding: 20px; border: 1px solid #ccc; margin: 10px 0;">
      <h3>工具函数示例</h3>
      <p>debounce 函数来自 my-utils 包的本地版本</p>
      <p style="font-size: 12px; color: #666;">
        当你修改 ../my-utils/src 下的文件时，页面会自动更新
      </p>
    </div>
  `;
}

// 添加一些交互
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ 页面加载完成');
  
  // 模拟组件更新检测
  let updateCount = 0;
  setInterval(() => {
    updateCount++;
    const status = document.createElement('div');
    status.textContent = `🔄 检查更新 #${updateCount}`;
    status.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-size: 12px;';
    
    // 移除之前的状态
    const existing = document.querySelector('[data-update-status]');
    if (existing) existing.remove();
    
    status.setAttribute('data-update-status', 'true');
    document.body.appendChild(status);
    
    setTimeout(() => status.remove(), 1000);
  }, 5000);
}); 