import apiClient from '../utils/apiClient';

const pageService = {
  getAllPagesService: async () => {
    try {
      const response = await apiClient.get('/pages');
      return response.data;
    } catch (error) {
      console.error('Error fetching all pages:', error);
      throw error;
    }
  },

  createNewPage: async (pageData) => {
    try {
      const response = await apiClient.post('/pages', pageData);
      return response.data;
    } catch (error) {
      console.error('Error creating new page:', error);
      throw error;
    }
  },

  updateExistingPage: async (pageId, pageData) => {
    try {
      const response = await apiClient.put(`/pages/${pageId}`, pageData);
      return response.data;
    } catch (error) {
      console.error(`Error updating page with ID ${pageId}:`, error);
      throw error;
    }
  },

  deleteExistingPage: async (pageId) => {
    try {
      const response = await apiClient.delete(`/pages/${pageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting page with ID ${pageId}:`, error);
      throw error;
    }
  },
  getPageById: async (pageId) => {
    try {
      const response = await apiClient.get(`/pages/${pageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching page with ID ${pageId}:`, error);
      throw error;
    }
  },

  getPageByParamService: async (param) => {
    try {
      const response = await apiClient.get(`/pages/param/${param}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching page by param ${param}:`, error);
      throw error;
    }
  }
};

export default pageService;
