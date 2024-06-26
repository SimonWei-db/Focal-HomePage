import React, { useState } from 'react';
import { Form, Input, Button, message, Progress } from 'antd';
import userService from '../../services/userService'; // 引入用户服务
import zxcvbn from 'zxcvbn';
import './ChangePassword.css'; // 新增的 CSS 文件

const ChangePassword = () => {
  const [passwordStrength, setPasswordStrength] = useState(null); // 初始状态设置为 null
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null); // 用于管理确认密码的错误信息
  const [passwordError, setPasswordError] = useState(null); // 用于管理密码强度的错误信息

  const onFinish = async (values) => {
    try {
      const response = await userService.changePassword(values);
      if (response.success) {
        message.success('Password changed successfully!');
      } else {
        message.error(response.data.message || 'Failed to change password.');
      }
    } catch (error) {
      if (error.response) {
        // 请求已发出，但服务器响应一个状态码不是2xx
        if (error.response.status === 400) {
          console.error('Error changing password:', error.response.data.message);
          message.error(error.response.data.message || 'An error occurred while changing the password.');
        } else {
          console.error('Error changing password:', error.response.data);
          message.error(error.response.data.message || 'An error occurred while changing the password.');
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
    <Form
      name="change_password"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      className="change-password-form"
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
        name="currentPassword"
        rules={[{ required: true, message: 'Please input your current password!' }]}
      >
        <Input.Password placeholder="Current Password" className="password-input"/>
      </Form.Item>
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
                className="password-progress"
              />
            )}
            {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
          </>
        }
      >
        <Input.Password 
          placeholder="New Password" 
          onPaste={(e) => e.preventDefault()} // 禁用粘贴
          className="password-input"
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
          onPaste={(e) => e.preventDefault()} // 禁用粘贴
          className="password-input"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="submit-button">
          Change Password
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChangePassword;
