// 实际导入通过 dev-link 链接的本地包
// 这些包在开发时会被本地文件替换，在生产时使用正常的 node_modules 版本

import './style.css'

console.log('🔗 Vite Plugin Dev Link 示例启动 - 支持依赖文件HMR测试');

// 动态导入本地包进行测试
async function testLocalPackages() {
  try {
    console.log('\n=== 测试 @test/ui-components (带依赖文件) ===');
    const { Button, Input } = await import('@test/ui-components');
    
    console.log('\n=== 测试 @test/icons (带依赖文件) ===');
    const { HomeIcon, UserIcon, SearchIcon } = await import('@test/icons');
    
    console.log('\n=== 测试 lodash ===');
    const { debounce, throttle, clone } = await import('lodash');
    
    console.log('\n=== 测试 test-utils ===');
    const { formatDate, randomId, capitalize } = await import('test-utils');
    
    // 创建 UI 测试
    const app = document.querySelector<HTMLDivElement>('#app')!;
    
    app.innerHTML = `
      <div>
        <h1>Vite Plugin Dev Link 测试 - 依赖文件HMR</h1>
        <div class="card">
          <h3>UI组件测试区域 (带依赖文件)</h3>
          <p>依赖文件: <code>utils.js</code> - 包含按钮样式和输入验证逻辑</p>
          <div id="components-area"></div>
        </div>
        
        <div class="card">
          <h3>图标测试区域 (带依赖文件)</h3>
          <p>依赖文件: <code>helpers.js</code> - 包含图标样式和动画逻辑</p>
          <div id="icons-area"></div>
        </div>
        
        <div class="card">
          <h3>工具函数测试</h3>
          <div id="utils-area"></div>
        </div>
        
        <div class="card">
          <button id="counter" type="button"></button>
        </div>
        
        <div class="instructions">
          <h4>🔥 HMR 测试说明：</h4>
          <ol>
            <li><strong>正常模式：</strong> <code>npm run dev</code> - 插件不会激活</li>
            <li><strong>开发链接模式：</strong> <code>DEV_LINK=true npm run dev</code> - 使用本地包</li>
            <li><strong>测试主文件 HMR：</strong> 修改 <code>local-packages/@test/ui-components/index.js</code></li>
            <li><strong>🎯 测试依赖文件 HMR：</strong> 修改 <code>local-packages/@test/ui-components/utils.js</code></li>
            <li><strong>🎯 测试图标依赖 HMR：</strong> 修改 <code>local-packages/@test/icons/helpers.js</code></li>
            <li>查看控制台日志了解HMR更新过程</li>
          </ol>
          <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px;">
            <strong>🔥 重点测试场景：</strong> 
            <ul>
              <li>修改 <code>utils.js</code> 中的 <code>formatButtonText</code> 函数，观察按钮文本是否实时更新</li>
              <li>修改 <code>helpers.js</code> 中的 <code>wrapIcon</code> 函数，观察图标文本是否实时更新</li>
              <li>查看是否不会导致整页刷新，保持页面状态</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // 测试UI组件
    const componentsArea = document.getElementById('components-area')!;
    
    const button1 = Button({ 
      children: '主要按钮', 
      onClick: () => {
        alert('点击了主要按钮! (测试按钮功能)');
        console.log('🔥 按钮点击事件触发 - 来自依赖文件的样式处理');
      },
      variant: 'primary'
    });
    
    const button2 = Button({ 
      children: '成功按钮', 
      onClick: () => {
        console.log('🔥 点击了成功按钮 - 样式来自utils.js');
      },
      variant: 'success'
    });
    
    const button3 = Button({ 
      children: '危险按钮', 
      onClick: () => {
        console.log('🔥 点击了危险按钮 - 颜色定义在依赖文件中');
      },
      variant: 'danger'
    });
    
    const input1 = Input({ 
      placeholder: '请输入内容（测试依赖HMR）', 
      onChange: (value, validation) => {
        console.log('🔥 输入变化:', value, '验证结果:', validation);
        console.log('💡 验证逻辑来自 utils.js 依赖文件');
      }
    });
    
    componentsArea.appendChild(button1);
    componentsArea.appendChild(button2);
    componentsArea.appendChild(button3);
    componentsArea.appendChild(input1);

    // 测试图标（现在返回DOM元素）
    const iconsArea = document.getElementById('icons-area')!;
    
    const homeIcon = HomeIcon({ size: 'large', animated: true });
    const userIcon = UserIcon({ size: 'large', animated: true });
    const searchIcon = SearchIcon({ size: 'large', animated: true });
    
    const iconContainer = document.createElement('div');
    iconContainer.style.display = 'flex';
    iconContainer.style.gap = '20px';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.padding = '10px';
    
    const iconLabel = document.createElement('p');
    iconLabel.textContent = '悬停图标查看动画效果（动画逻辑在helpers.js中）：';
    iconLabel.style.margin = '0 0 10px 0';
    iconLabel.style.fontSize = '14px';
    iconLabel.style.color = '#666';
    
    iconsArea.appendChild(iconLabel);
    iconContainer.appendChild(homeIcon);
    iconContainer.appendChild(userIcon);
    iconContainer.appendChild(searchIcon);
    iconsArea.appendChild(iconContainer);

    // 测试工具函数
    const utilsArea = document.getElementById('utils-area')!;
    utilsArea.innerHTML = `
      <p>📊 工具函数测试:</p>
      <p><strong>formatDate:</strong> ${formatDate(new Date())}</p>
      <p><strong>randomId:</strong> ${randomId()}</p>
      <p><strong>capitalize:</strong> ${capitalize('hello world')}</p>
      <p><strong>debounce:</strong> ${typeof debounce}</p>
      <p><strong>throttle:</strong> ${typeof throttle}</p>
      <p><strong>clone:</strong> ${typeof clone}</p>
    `;

    // 计数器功能（测试状态保持）
    let count = 0;
    const counterButton = document.getElementById('counter')!;
    
    const updateCounter = () => {
      counterButton.textContent = `计数: ${count} (测试HMR时状态保持)`;
    };
    
    counterButton.addEventListener('click', () => {
      count++;
      updateCounter();
      console.log(`🔄 计数器: ${count} - 测试HMR时是否保持状态`);
    });
    
    updateCounter();

  } catch (error) {
    console.error('❌ 加载本地包时出错:', error);
    console.log('这可能是因为：');
    console.log('1. DEV_LINK 环境变量未设置为 true');
    console.log('2. 本地包路径配置不正确');
    console.log('3. 或者这些包在 node_modules 中不存在（这是正常的）');
    
    // 显示错误信息
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div>
        <h1>测试环境设置</h1>
        <div class="card">
          <h3>⚠️ 包加载失败</h3>
          <p>这是正常的，因为测试包不在 node_modules 中。</p>
          <p>请使用以下命令启动：</p>
          <pre><code>DEV_LINK=true npm run dev</code></pre>
        </div>
        <div class="instructions">
          <h4>如何测试依赖文件HMR：</h4>
          <ol>
            <li>停止当前服务器 (Ctrl+C)</li>
            <li>运行: <code>DEV_LINK=true npm run dev</code></li>
            <li>观察控制台输出，应该看到插件开始工作</li>
            <li>修改主文件: <code>local-packages/@test/ui-components/index.js</code></li>
            <li><strong>🔥 重点：修改依赖文件: <code>local-packages/@test/ui-components/utils.js</code></strong></li>
            <li><strong>🔥 重点：修改依赖文件: <code>local-packages/@test/icons/helpers.js</code></strong></li>
            <li>观察是否触发HMR，页面是否无刷新更新</li>
          </ol>
        </div>
      </div>
    `;
  }
}

// 添加一些交互和状态显示
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ 页面加载完成，开始测试本地包（含依赖文件）');
  
  // 显示当前状态
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #e8f5e8;
    border: 1px solid #4caf50;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    max-width: 350px;
    z-index: 1000;
    line-height: 1.4;
  `;
  statusDiv.innerHTML = `
    <strong>🔗 Dev Link 状态</strong><br>
    ✅ @test/ui-components + utils.js<br>
    ✅ @test/icons + helpers.js<br>
    <hr style="margin: 8px 0; opacity: 0.3;">
    <strong>🔥 HMR测试目标：</strong><br>
    <small>
      1. 修改 utils.js 的 formatButtonText<br>
      2. 修改 helpers.js 的 wrapIcon<br>
      3. 观察是否无刷新更新<br>
      4. 状态是否保持（计数器）
    </small>
  `;
  document.body.appendChild(statusDiv);
  
  // 定期检查和日志
  let updateCount = 0;
  setInterval(() => {
    updateCount++;
    console.log(`🔄 检查本地包更新 #${updateCount} - 包括依赖文件HMR监控`);
  }, 20000);
});

// 启动测试
testLocalPackages(); 