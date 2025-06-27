export const Button = ({ children, onClick, variant = 'primary' }) => {
  console.log('🔥 使用本地 UI Components 包!');
  
  const button = document.createElement('button');
  button.textContent = `${children} (本地版本 🔥)`;
  button.style.cssText = `
    background-color: ${variant === 'primary' ? '#007bff' : '#6c757d'};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
    font-size: 14px;
  `;
  
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  
  return button;
};

export const Input = ({ placeholder = '', value = '', onChange }) => {
  console.log('🔥 使用本地 Input 组件!');
  
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
  `;
  
  if (onChange) {
    input.addEventListener('input', (e) => onChange(e.target.value));
  }
  
  return input;
};

console.log('📦 @test/ui-components 已加载 (本地版本)'); 