import apiClient from '../utils/apiClient';

const teamService = {
  getTeamData: async () => {
    const response = await apiClient.get('/team');
    return response.data;
  },
  updateTeamData: async (teamData) => {
    const response = await apiClient.post('/team', teamData);
    return response.data;
  },
  
};

export default teamService;
