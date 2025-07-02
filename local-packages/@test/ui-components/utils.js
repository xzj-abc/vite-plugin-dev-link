// 工具函数文件，用于测试依赖文件的HMR
export const formatButtonText = (text) => {
  return `${text} (工具函数处理 🔧)`;
};

export const getButtonStyle = (variant = 'primary') => {
  const styles = {
    primary: '#007bff',
    secondary: '#6c757d', 
    success: '#28a745',
    danger: '#dc3545'
  };
  
  return `
    background-color: ${styles[variant] || styles.primary};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
    font-size: 14px;
    transition: opacity 0.2s;
  `;
};

export const validateInput = (value) => {
  if (!value || value.trim() === '') {
    return { valid: false, message: '输入不能为空' };
  }
  
  if (value.length < 2) {
    return { valid: false, message: '输入至少需要2个字符' };
  }
  
  return { valid: true, message: '输入有效 ✅' };
};

console.log('🔧 ui-components/utils.js 已加载 (依赖文件)'); 