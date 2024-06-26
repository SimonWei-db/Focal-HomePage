import apiClient from '../utils/apiClient';

const userService = {
  login: async (credentials) => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await apiClient.post('/users/change-password', passwordData);
    return response.data;
  },
  getUser: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  AuthVerify: async () => {
    const response = await apiClient.get(`/users/verify-token`);
    return response.data;
  },
  forgotPassword: async (email, currentUrl) => {
    const response = await apiClient.post('/users/forgot-password', { email, currentUrl });
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await apiClient.post('/users/reset-password', data);
    return response.data;
  },
  verifyResetToken:  async (token) => {
    const response = await apiClient.get(`/users/verify-reset-token?token=${token}`);
    return response.data;
  }
};

export default userService;
