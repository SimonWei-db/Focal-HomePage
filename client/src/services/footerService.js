import apiClient from '../utils/apiClient';

const footerService = {
  getFooter: async () => {
    const response = await apiClient.get('/footer');
    return response.data;
  },
  updateFooter: async (footerData) => {
    const response = await apiClient.put('/footer', footerData);
    return response.data;
  },
  // 其他 Footer 相关的 API 调用
};

export default footerService;
