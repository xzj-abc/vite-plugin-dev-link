// 图标辅助函数
export const wrapIcon = (icon, label) => {
  return `${icon} ${label} (辅助函数处理 🎨)`;
};

export const getIconSize = (size = 'medium') => {
  const sizes = {
    small: '16px',
    medium: '20px', 
    large: '24px',
    xlarge: '32px'
  };
  
  return sizes[size] || sizes.medium;
};

export const addIconAnimation = (element) => {
  element.style.transition = 'transform 0.2s ease';
  element.addEventListener('mouseenter', () => {
    element.style.transform = 'scale(1.1)';
  });
  element.addEventListener('mouseleave', () => {
    element.style.transform = 'scale(1)';
  });
};

console.log('🎨 icons/helpers.js 已加载 (依赖文件)'); 