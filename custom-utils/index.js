export const formatDate = (date) => {
  console.log('🔥 使用本地 test-utils formatDate!');
  return new Date(date).toLocaleDateString('zh-CN');
};

export const randomId = () => {
  console.log('🔥 使用本地 test-utils randomId!');
  return Math.random().toString(36).substring(2, 9);
};

export const capitalize = (str) => {
  console.log('🔥 使用本地 test-utils capitalize!');
  return str.charAt(0).toUpperCase() + str.slice(1);
};

console.log('📦 test-utils 已加载 (本地版本)'); 