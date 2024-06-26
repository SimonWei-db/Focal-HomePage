import apiClient from '../utils/apiClient';

const contactUsService = {
  getContactUs: async () => {
    const response = await apiClient.get('/contact-us');
    return response.data;
  },
  updateContactUs: async (contactData) => {
    const response = await apiClient.put('/contact-us', contactData);
    return response.data;
  },
  // 其他 Contact Us 相关的 API 调用
};

export default contactUsService;
