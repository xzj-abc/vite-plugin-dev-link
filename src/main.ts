import './style.css'
import { setupCounter } from './counter.ts'

console.log('🚀 测试项目启动');
console.log('💡 使用 DEV_LINK=true npm run dev 启用本地包链接功能');
console.log('💡 或者使用 npm run dev 使用默认的模拟包（如果有的话）');

// 动态导入本地包进行测试
async function testLocalPackages() {
  try {
    console.log('\n=== 测试 @test/ui-components ===');
    const { Button, Input } = await import('@test/ui-components');
    
    console.log('\n=== 测试 @test/icons ===');
    const { HomeIcon, UserIcon, SearchIcon } = await import('@test/icons');
    
    console.log('\n=== 测试 lodash ===');
    const { debounce, throttle, clone } = await import('lodash');
    
    console.log('\n=== 测试 test-utils ===');
    const { formatDate, randomId, capitalize } = await import('test-utils');
    
    // 创建 UI 测试
    const app = document.querySelector<HTMLDivElement>('#app')!;
    
    app.innerHTML = `
      <div>
        <h1>Vite Plugin Dev Link 测试</h1>
        <div class="card">
          <h3>组件测试区域</h3>
          <div id="components-area"></div>
        </div>
        
        <div class="card">
          <h3>工具函数测试</h3>
          <div id="utils-area"></div>
        </div>
        
        <div class="card">
          <h3>图标测试</h3>
          <div id="icons-area"></div>
        </div>
        
        <div class="card">
          <button id="counter" type="button"></button>
        </div>
        
        <div class="instructions">
          <h4>测试说明：</h4>
          <ol>
            <li><strong>正常模式：</strong> <code>npm run dev</code> - 插件不会激活</li>
            <li><strong>开发链接模式：</strong> <code>DEV_LINK=true npm run dev</code> - 使用本地包</li>
            <li>修改 <code>local-packages/</code> 或 <code>custom-utils/</code> 中的文件观察热更新</li>
            <li>查看控制台日志了解哪些包被链接了</li>
          </ol>
        </div>
      </div>
    `;

    // 测试组件
    const componentsArea = document.getElementById('components-area')!;
    
    const button1 = Button({ 
      children: '主要按钮', 
      onClick: () => alert('点击了主要按钮!'),
      variant: 'primary'
    });
    
    const button2 = Button({ 
      children: '次要按钮', 
      onClick: () => alert('点击了次要按钮!'),
      variant: 'secondary'
    });
    
    const input = Input({ 
      placeholder: '输入一些文字...', 
      onChange: (value: string) => console.log('输入值:', value)
    });
    
    componentsArea.appendChild(button1);
    componentsArea.appendChild(button2);
    componentsArea.appendChild(input);
    
    // 测试工具函数
    const utilsArea = document.getElementById('utils-area')!;
    const currentDate = formatDate(new Date());
    const id = randomId();
    const capitalizedText = capitalize('hello world');
    
    utilsArea.innerHTML = `
      <p><strong>当前日期:</strong> ${currentDate}</p>
      <p><strong>随机ID:</strong> ${id}</p>
      <p><strong>首字母大写:</strong> ${capitalizedText}</p>
    `;
    
    // 测试 lodash 函数
    const debouncedLog = debounce((msg: string) => {
      console.log('防抖输出:', msg);
    }, 500);
    
    const clonedObj = clone({ test: 'data', number: 42 });
    console.log('克隆对象:', clonedObj);
    
    // 测试图标
    const iconsArea = document.getElementById('icons-area')!;
    iconsArea.innerHTML = `
      <p><strong>图标:</strong> ${HomeIcon()} ${UserIcon()} ${SearchIcon()}</p>
    `;
    
    // 设置防抖测试
    input.addEventListener('input', () => {
      debouncedLog('输入内容已更改');
    });
    
    setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
    
    console.log('✅ 所有测试包加载完成');
    
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
          <h4>如何测试：</h4>
          <ol>
            <li>停止当前服务器 (Ctrl+C)</li>
            <li>运行: <code>DEV_LINK=true npm run dev</code></li>
            <li>观察控制台输出，应该看到插件开始工作</li>
            <li>修改 local-packages 中的文件测试热更新</li>
          </ol>
        </div>
      </div>
    `;
  }
}

// 启动测试
testLocalPackages(); 