// 导入工具函数
import { formatButtonText, getButtonStyle, validateInput } from './utils.js';

export const Button = ({ children, onClick, variant = 'primary' }) => {
  console.log('🔥 使用本地 UI Components 包!');
  
  const button = document.createElement('button');
  // 使用工具函数处理文本
  button.textContent = formatButtonText(`${children} (本地版本 🔥)`);
  // 使用工具函数获取样式
  button.style.cssText = getButtonStyle(variant);
  
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  
  return button;
};

export const Input = ({ placeholder = '', value = '', onChange }) => {
  console.log('🔥 使用本地 Input 组件!');
  
  const container = document.createElement('div');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.value = value;
  input.style.cssText = `
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 5px;
    font-size: 14px;
    width: 200px;
  `;
  
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    font-size: 12px;
    margin: 5px;
    min-height: 16px;
  `;
  
  const updateFeedback = (value) => {
    const validation = validateInput(value);
    feedback.textContent = validation.message;
    feedback.style.color = validation.valid ? 'green' : 'red';
    
    if (onChange) {
      onChange(value, validation);
    }
  };
  
  // 初始验证
  updateFeedback(value);
  
  input.addEventListener('input', (e) => {
    updateFeedback(e.target.value);
  });
  
  container.appendChild(input);
  container.appendChild(feedback);
  
  return container;
};

console.log('📦 @test/ui-components 已加载 (本地版本 - 带依赖)'); 