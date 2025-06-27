export const debounce = (func, wait = 300) => {
  console.log('🔥 使用本地 lodash debounce!');
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit = 300) => {
  console.log('🔥 使用本地 lodash throttle!');
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const clone = (obj) => {
  console.log('🔥 使用本地 lodash clone!');
  return JSON.parse(JSON.stringify(obj));
};

console.log('📦 lodash 已加载 (本地版本)'); 