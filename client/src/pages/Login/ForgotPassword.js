import React, { useState } from 'react';
import { Layout, Typography, Form, Input, Button, message, Spin } from 'antd';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import userService from '../../services/userService';
import { MailOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
      message.info("For Forgot Password feature, please visit https://simonoren.com/projects or use the client version for content management.");
      return;
    }
    setLoading(true);
    const hide = message.loading('Sending reset link, please wait...', 0);
    try {
      const currentUrl = window.location.href;
      const response = await userService.forgotPassword(values.email, currentUrl);
      if (response.success) {
        message.success('Password reset email sent!');
      } else {
        message.error(response.message);
      }
    } catch (error) {
      const errorMessage = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'An error occurred. Please try again later.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
      hide();
    }
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar />
      </Header>
      <Content style={{ padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="forgot-password-container">
          <Title level={2} className="forgot-password-title">Forgot Password</Title>
          <Form
            name="forgot-password"
            onFinish={onFinish}
            className="forgot-password-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'The input is not valid E-mail!' }
              ]}
            >
              <Input placeholder="Email" prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="forgot-password-form-button" loading={loading}>
                {loading ? <Spin /> : 'Send Reset Link'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default ForgotPassword;
