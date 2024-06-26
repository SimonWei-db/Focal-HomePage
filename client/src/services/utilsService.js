import apiClient from '../utils/apiClient';

const utilsService = {
  uploadImage: async (imageData) => {
    const response = await apiClient.post('/upload-image', imageData);
    return response.data;
  },
   // 获取文件列表及大小
   getFilesWithSizes: async () => {
    const response = await apiClient.get('/files');
    return response.data;
  },

  // 上传文件
  uploadFile: async (fileData, onUploadProgress) => {
    const response = await apiClient.post('/files/upload', fileData, {
      onUploadProgress,
    });
    return response.data;
  },
  deleteFile: async (fileName) => {
    const response = await apiClient.delete(`/files/${fileName}`);
    return response.data;
  },
  exportData: async () => {
    const response = await apiClient.post('/files/web-data-export');
    return response.data;
  }
};

export default utilsService;
