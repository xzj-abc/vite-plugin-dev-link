// 导入辅助函数
import { wrapIcon, getIconSize, addIconAnimation } from './helpers.js';

export const HomeIcon = ({ size = 'medium', animated = true } = {}) => {
  console.log('🔥 使用本地 Icons 包!');
  
  const iconSpan = document.createElement('span');
  iconSpan.innerHTML = wrapIcon('🏠', '首页');
  iconSpan.style.fontSize = getIconSize(size);
  iconSpan.style.cursor = 'pointer';
  iconSpan.style.display = 'inline-block';
  
  if (animated) {
    addIconAnimation(iconSpan);
  }
  
  return iconSpan;
};

export const UserIcon = ({ size = 'medium', animated = true } = {}) => {
  console.log('🔥 使用本地 UserIcon!');
  
  const iconSpan = document.createElement('span');
  iconSpan.innerHTML = wrapIcon('👤', '用户');
  iconSpan.style.fontSize = getIconSize(size);
  iconSpan.style.cursor = 'pointer';
  iconSpan.style.display = 'inline-block';
  
  if (animated) {
    addIconAnimation(iconSpan);
  }
  
  return iconSpan;
};

export const SearchIcon = ({ size = 'medium', animated = true } = {}) => {
  console.log('🔥 使用本地 SearchIcon!');
  
  const iconSpan = document.createElement('span');
  iconSpan.innerHTML = wrapIcon('🔍', '搜索');
  iconSpan.style.fontSize = getIconSize(size);
  iconSpan.style.cursor = 'pointer';
  iconSpan.style.display = 'inline-block';
  
  if (animated) {
    addIconAnimation(iconSpan);
  }
  
  return iconSpan;
};

console.log('📦 @test/icons 已加载 (本地版本 - 带依赖)'); 