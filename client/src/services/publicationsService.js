import apiClient from '../utils/apiClient';

const publicationsService = {
  getCategories: async () => {
    const response = await apiClient.get('/publications/categories');
    return response.data;
  },
  getItems: async () => {
    const response = await apiClient.get('/publications/items');
    return response.data;
  },
  getItemsByCategory: async (categoryId) => {
    const response = await apiClient.get(`/publications/items/category/${categoryId}`);
    return response.data;
  },
  batchUpdate: async (batchData) => {
    const response = await apiClient.post('/publications/batchUpdate', batchData);
    return response.data;
  },
};

export default publicationsService;
