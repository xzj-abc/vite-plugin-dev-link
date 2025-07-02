// 实际导入通过 dev-link 链接的本地包
// 这些包在开发时会被本地文件替换，在生产时使用正常的 node_modules 版本

console.log('🔗 Vite Plugin Dev Link 示例启动');

// 导入本地包 - 这些在开发时会使用 local-packages 中的版本
import { Button, Input } from '@test/ui-components';
import { HomeIcon, UserIcon, SearchIcon } from '@test/icons';

// 检查环境变量
if (import.meta.env?.DEV) {
  console.log('💡 开发模式：使用本地包版本');
  console.log('   启用方式：DEV_LINK=true npm run dev');
}

// 创建示例内容
const app = document.getElementById('components');
if (app) {
  app.innerHTML = `
    <div style="padding: 20px; border: 1px solid #ccc; margin: 10px 0;">
      <h3>本地 UI 组件测试</h3>
      <div id="ui-components-demo"></div>
      <p style="font-size: 12px; color: #666;">
        这些组件来自 @test/ui-components 的本地版本
      </p>
    </div>
    
    <div style="padding: 20px; border: 1px solid #ccc; margin: 10px 0;">
      <h3>本地图标测试</h3>
      <div id="icons-demo"></div>
      <p style="font-size: 12px; color: #666;">
        这些图标来自 @test/icons 的本地版本
      </p>
    </div>
    

  `;

  // 测试 UI 组件
  const uiDemo = document.getElementById('ui-components-demo');
  if (uiDemo) {
    const button1 = Button({ 
      children: '主要按钮', 
      variant: 'primary',
      onClick: () => alert('按钮被点击了！')
    });
    const button2 = Button({ 
      children: '次要按钮', 
      variant: 'secondary',
      onClick: () => console.log('次要按钮点击')
    });
    const input = Input({ 
      placeholder: '输入内容...',
      onChange: (value) => console.log('输入值:', value)
    });
    
    uiDemo.appendChild(button1);
    uiDemo.appendChild(button2);
    uiDemo.appendChild(input);
  }

  // 测试图标
  const iconsDemo = document.getElementById('icons-demo');
  if (iconsDemo) {
    const homeIcon = document.createElement('span');
    homeIcon.textContent = `首页图标: ${HomeIcon()}`;
    homeIcon.style.marginRight = '20px';
    
    const userIcon = document.createElement('span');
    userIcon.textContent = `用户图标: ${UserIcon()}`;
    userIcon.style.marginRight = '20px';
    
    const searchIcon = document.createElement('span');
    searchIcon.textContent = `搜索图标: ${SearchIcon()}`;
    
    iconsDemo.appendChild(homeIcon);
    iconsDemo.appendChild(userIcon);
    iconsDemo.appendChild(searchIcon);
  }


}

// 添加一些交互和状态显示
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ 页面加载完成，所有本地包已成功导入');
  
  // 显示当前使用的包版本信息
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #e8f5e8;
    border: 1px solid #4caf50;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    max-width: 300px;
    z-index: 1000;
  `;
  statusDiv.innerHTML = `
    <strong>🔗 Dev Link 状态</strong><br>
    ✅ @test/ui-components (本地版本)<br>
    ✅ @test/icons (本地版本)<br>
    <small>修改 local-packages 中的文件会实时更新</small>
  `;
  document.body.appendChild(statusDiv);
  
  // 模拟热更新检测
  let updateCount = 0;
  setInterval(() => {
    updateCount++;
    console.log(`🔄 检查本地包更新 #${updateCount}`);
  }, 10000);
}); 