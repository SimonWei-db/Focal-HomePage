import apiClient from '../utils/apiClient';

const newsService = {
  // 获取单个新闻或资源
  getNewsById: async (id) => {
    const response = await apiClient.get(`/news/${id}`);
    return response.data;
  },
  
  // 获取所有新闻和资源
  getAllNews: async () => {
    const response = await apiClient.get('/news');
    return response.data;
  },

  // 获取特定类型的新闻或资源
  getNewsByType: async (type) => {
    const response = await apiClient.get(`/news/type/${type}`);
    return response.data;
  },

  // 批量创建、更新或删除新闻和资源
  batchProcessNews: async (batchData) => {
    const response = await apiClient.post('/news/batchProcess', batchData);
    return response.data;
  },

  // 删除单个新闻或资源
  deleteNewsById: async (id) => {
    const response = await apiClient.delete(`/news/${id}`);
    return response.data;
  }
};

export default newsService;
