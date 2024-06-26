import React from 'react';
import { Layout, Typography, Form, Input, Button, message, Modal } from 'antd';
import './Login.css';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService'; // 引入用户服务
import { MailOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
        message.info("For login and management features, please visit https://simonoren.com/projects or use the client version for content management.");
        return
      }
      const response = await userService.login(values);
      if (response.success) {
        message.success('Login successful!');
        localStorage.setItem('token', response.token); // 保存 token
        localStorage.setItem('username', values.username); // 保存用户名
        
        if (response.passwordNotChanged) {
          navigate('/AdminDashboard?tab=changePassword');
          Modal.warning({
            title: 'Password Change Recommended',
            content: 'You are currently using the initial password. It is strongly recommended that you change your password for security reasons.',
          });
        } else {
          navigate('/AdminDashboard');
        }
      } else {
        message.error('Login failed. Please check your username or password.');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
        message.error(`Login failed. An error occurred`);
      } else if (error.request) {
        console.error('Request error:', error.request);
        message.error('No response received from server. Please try again later.');
      } else {
        console.error('Error setting up request:', error.message);
        message.error(`An error occurred: ${error.message}`);
      }
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const initialValues = process.env.REACT_APP_AWS_FEATURE === 'true' ? 
    { username: 'weixingchensimon@gmail.com', password: 'This_is_a_Demo_Account!' } : 
    {};

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar />
      </Header>
      <Content style={{ padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="login-container">
          <Title level={2} className="login-title">Login</Title>
          <Form
            name="login"
            initialValues={initialValues}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            className="login-form"
          >
           <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Please input your username!' },
              { type: 'email', message: 'The input is not valid E-mail!' }
            ]}
          >
            <Input placeholder="Email" prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button">
                Log in
              </Button>
            </Form.Item>
            <Form.Item>
              <a onClick={() => navigate('/ForgotPassword')} className="forgot-password-link">
              Forgot password?
              </a>
            </Form.Item>
          </Form>
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default Login;
