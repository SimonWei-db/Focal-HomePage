import apiClient from '../utils/apiClient';

const aboutMeService = {
  getAboutMe: async () => {
    const response = await apiClient.get('/about-me');
    
    return response.data;
  },
  updateAboutMe: async (aboutMeData) => {
    const response = await apiClient.post('/about-me', aboutMeData);
    return response.data;
  },
};

export default aboutMeService;
