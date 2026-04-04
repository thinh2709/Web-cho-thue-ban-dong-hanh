// Frontend test for UI functions
import api from './api.js';

const testUI = async () => {
  console.log('--- Bắt đầu test Frontend UI functions ---');
  try {
    const cats = await api.getCategories();
    if (Array.isArray(cats)) {
      console.log('✅ api.getCategories() trả về mảng:', cats.length, 'mục');
    } else {
      console.error('❌ api.getCategories() không trả về mảng');
    }
  } catch (err) {
    console.error('❌ Test thất bại:', err.message);
  }
};

// testUI();
