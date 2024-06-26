import React, { useState, useEffect } from 'react';
import { Layout, Typography, Form, Input, Button, message, Progress, Modal } from 'antd';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import userService from '../../services/userService'; // 引入用户服务
import zxcvbn from 'zxcvbn';
import { LockOutlined } from '@ant-design/icons'; // 确保导入 LockOutlined 图标
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;

const ResetPassword = () => {
  const [passwordStrength, setPasswordStrength] = useState(null); // 初始状态设置为 null
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null); // 用于管理确认密码的错误信息
  const [passwordError, setPasswordError] = useState(null); // 用于管理密码强度的错误信息
  const [tokenValid, setTokenValid] = useState(null); // 用于管理 token 是否有效
  const navigate = useNavigate();

  function getTokenFromURL() {
    const fullURL = window.location.href;
    
    const hashIndex = fullURL.indexOf('#');
    const hashPart = hashIndex !== -1 ? fullURL.substring(hashIndex + 1) : '';
    
    const queryParamsIndex = hashPart.indexOf('?');
    const queryParamsPart = queryParamsIndex !== -1 ? hashPart.substring(queryParamsIndex) : '';
    
    const urlParams = new URLSearchParams(queryParamsPart);
    
    const token = urlParams.get('token');
    return token;
  }

  useEffect(() => {
    if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
      message.info("For Reset Password feature, please visit https://simonoren.com/projects or use the client version for content management.");
      return
    }
    
    const token = getTokenFromURL();
    if (!token) {
      setTokenValid(false);
      return;
    }

    // 验证 token
    userService.verifyResetToken(token)
      .then(response => {
        if (response.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => {
        setTokenValid(false);
      });
  }, []);

  const onFinish = async (values) => {
    const token = getTokenFromURL();

    if (!token) {
      message.error('Invalid or missing reset token.');
      return;
    }

    try {
      const response = await userService.resetPassword({ token, ...values });
      if (response.success) {
        if (process.env.REACT_APP_ECE_STANDALONE === 'true') {
          Modal.success({
            title: 'Password Reset Successful',
            content: 'Password has been reset successfully. Please continue using the focal client.',
            onOk() {
              window.close();
            }
          });
          return;
        }
        message.success('Password reset successfully!');
        navigate('/login');
      } else {
        message.error(response.data.message || 'Failed to reset password.');
      }
    } catch (error) {
      if (error.response) {
        // 请求已发出，但服务器响应一个状态码不是2xx
        if (error.response.status === 400) {
          console.error('Error resetting password:', error.response.data.message);
          message.error(error.response.data.message || 'An error occurred while resetting the password.');
        } else {
          console.error('Error resetting password:', error.response.data);
          message.error(error.response.data.message || 'An error occurred while resetting the password.');
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('No response received:', error.request);
        message.error('No response received from server.');
      } else {
        // 发生在设置请求时的错误
        console.error('Error setting up request:', error.message);
        message.error('An error occurred while setting up the request.');
      }
    }
  };

  const onFinishFailed = (errorInfo) => {
    message.error('Please complete the form correctly.');
  };

  const handlePasswordChange = (value) => {
    const result = zxcvbn(value);
    setPasswordStrength(result.score);
    if (result.score < 3) {
      setPasswordError('Password is too weak! Please use a stronger password.');
    } else {
      setPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (value, newPassword) => {
    if (!value || value === newPassword) {
      setPasswordMatch(true);
      setConfirmPasswordError(null);
    } else {
      setPasswordMatch(false);
      setConfirmPasswordError('The two passwords do not match!');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return 'red';
      case 1:
        return 'orange';
      case 2:
        return 'orange';
      case 3:
        return 'green';
      case 4:
        return 'green';
      default:
        return 'red';
    }
  };

  return (
    <Layout className="layout">
      <Header className="header">
      {process.env.REACT_APP_ECE_STANDALONE !== 'true' && <Navbar />}
      </Header>
      <Content style={{ padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="reset-password-container">
          <Title level={2} className="reset-password-title">Reset Password</Title>
          <Form
            name="reset-password"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            className="reset-password-form"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.newPassword) {
                handlePasswordChange(changedValues.newPassword);
              }
              if (changedValues.confirmPassword) {
                handleConfirmPasswordChange(changedValues.confirmPassword, allValues.newPassword);
              }
            }}
          >
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: 'Please input your new password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const result = zxcvbn(value);
                    setPasswordStrength(result.score);

                    if (result.score < 3) {
                      setPasswordError('Password is too weak! Please use a stronger password.');
                      return Promise.reject(new Error('Password is too weak! Please use a stronger password.'));
                    }
                    setPasswordError(null);
                    return Promise.resolve();
                  },
                }),
              ]}
              help={
                <>
                  {passwordStrength !== null && (
                    <Progress
                      percent={(passwordStrength + 1) * 20}
                      strokeColor={getPasswordStrengthColor()}
                      showInfo={false}
                      style={{ marginTop: '10px' }}
                    />
                  )}
                  {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
                </>
              }
            >
              <Input.Password 
                placeholder="New Password" 
                prefix={<LockOutlined />} 
                onPaste={(e) => e.preventDefault()} // 禁用粘贴
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['newPassword']}
              help={confirmPasswordError}
              rules={[
                { required: true, message: 'Please confirm your new password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      setConfirmPasswordError(null);
                      return Promise.resolve();
                    }
                    setConfirmPasswordError('The two passwords do not match!');
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password 
                placeholder="Confirm New Password" 
                prefix={<LockOutlined />} 
                onPaste={(e) => e.preventDefault()} // 禁用粘贴
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
      {process.env.REACT_APP_ECE_STANDALONE !== 'true' && <CustomFooter />}
      <Modal
        title="Invalid Token"
        visible={tokenValid === false}
        onCancel={() => navigate('/ForgotPassword')}
        footer={[
          <Button key="back" onClick={() => navigate('/ForgotPassword')}>
            Request New Password Reset
          </Button>,
        ]}
      >
        <p>Invalid or expired reset token. Please request a new password reset.</p>
      </Modal>
    </Layout>
  );
};

export default ResetPassword;
