import axios from 'axios';
import { Modal } from 'antd';

// 创建一个自定义的 Axios 实例
const apiClient = axios.create({
  baseURL:  process.env.REACT_APP_BACKEND_API_URL, // 设置基础路径
  timeout: 20000, // 设置请求超时时间
});

// 请求拦截器，自动附带 JWT 令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    Promise.reject(error)
  }
);

// 响应拦截器，自动更新 JWT 令牌
apiClient.interceptors.response.use(
  (response) => {
    const newToken = response.headers['authorization'];
    if (newToken) {
      localStorage.setItem('token', newToken.split(' ')[1]); // 移除 'Bearer ' 前缀
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      Modal.confirm({
        title: 'Session Expired',
        content: 'Your session has expired. Please log in again.',
        cancelButtonProps: { style: { display: 'none' } }, // 隐藏取消按钮
        onOk() {
          window.location.href = '#/login';
        }
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
