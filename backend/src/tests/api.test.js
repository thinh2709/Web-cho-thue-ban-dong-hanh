// Backend test for Category and Partner API
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- Bắt đầu test Backend API ---');
  try {
    const categories = await axios.get(`${BASE_URL}/categories`);
    console.log('✅ [GET] /categories thành công:', categories.data.length, 'danh mục');

    const applications = await axios.get(`${BASE_URL}/partners/applications`);
    console.log('✅ [GET] /partners/applications thành công:', applications.data.length, 'đơn');
  } catch (err) {
    console.error('❌ Test thất bại:', err.message);
  }
};

// runTests();
