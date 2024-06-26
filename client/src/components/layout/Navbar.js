import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message, Modal, Alert, Drawer, Tooltip } from 'antd';
import { MenuOutlined, ExclamationCircleOutlined ,LoginOutlined   } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import McMasterLogo from '../../assets/images/McMasterLogo.svg'; // 确保路径正确
import './Navbar.css'; // 引用单独的样式文件

const { Header } = Layout;

const Navbar = ({ defaultSelectedKey }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    message.success('Logged out successfully');
    navigate('/login');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  useEffect(() => {
    const showModal = sessionStorage.getItem('showDemoModal');
    if (!showModal && process.env.REACT_APP_AWS_FEATURE === 'true') {
      Modal.info({
        title: 'Demo Site',
        content: 'Demo site by Xingchen Wei showcasing design and functionality for Dr. Steve Hranilovic\'s lab. Content is illustrative and not representative of the actual site.',
        onOk() {
          sessionStorage.setItem('showDemoModal', 'true');
        },
      });
    }
  }, []);

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Header className="header">
      <div className="header-container">
        <div className="logo-container">
          <img src={McMasterLogo} className="logo" alt="McMaster Logo" />
          <span className="logo-text">Dr. Steve Hranilovic Lab</span>
        </div>
        <div className="menu-container">
          <Menu theme="light" mode="horizontal" defaultSelectedKeys={[defaultSelectedKey]} className="menu-right">
            <Menu.Item key="1"><Link to="/">Home</Link></Menu.Item>
            <Menu.Item key="2"><Link to="/AboutMe">About Me</Link></Menu.Item>
            <Menu.Item key="3"><Link to="/Publications">Publications</Link></Menu.Item>
            <Menu.Item key="4"><Link to="/Team">Team</Link></Menu.Item>
            <Menu.Item key="5"><Link to="/News&Resources?tab=news">News & Resources</Link></Menu.Item>
            <Menu.Item key="6"><Link to="/ContactUs">Contact Us</Link></Menu.Item>
            
            {isLoggedIn && <Menu.Item key="admin"><Link to="/AdminDashboard?tab=aboutMe">Admin Dashboard</Link></Menu.Item>}
          </Menu>
          <Button className="menu-icon" type="primary" icon={<MenuOutlined />} onClick={showDrawer} />
          <Drawer
            title="Navigation"
            placement="right"
            closable={true}
            onClose={onClose}
            visible={visible}
          >
            <Menu theme="light" mode="vertical" defaultSelectedKeys={[defaultSelectedKey]} onClick={onClose}>
              <Menu.Item key="1"><Link to="/">Home</Link></Menu.Item>
              <Menu.Item key="2"><Link to="/AboutMe">About Me</Link></Menu.Item>
              <Menu.Item key="3"><Link to="/Publications">Publications</Link></Menu.Item>
              <Menu.Item key="4"><Link to="/Team">Team</Link></Menu.Item>
              <Menu.Item key="5"><Link to="/News&Resources?tab=news">News & Resources</Link></Menu.Item>
              <Menu.Item key="6"><Link to="/ContactUs">Contact Us</Link></Menu.Item>
              {isLoggedIn && <Menu.Item key="admin"><Link to="/AdminDashboard?tab=aboutMe">Admin Dashboard</Link></Menu.Item>}
            </Menu>
            {isLoggedIn && (
              <Button onClick={handleLogout} style={{ marginTop: '10px' }}>Logout</Button>
            )}
          </Drawer>
        </div>
        {isLoggedIn && (
          <Button onClick={handleLogout} className="logout-button">Logout</Button>
        )}
      </div>
      {process.env.REACT_APP_AWS_FEATURE === 'true' && (
        <Tooltip
          title={
            <Alert
            message={
                <span>
                 This is a demo site created by Xingchen Wei for demonstration purposes only. For inquiries or further information, please visit my homepage at <a href="https://simonoren.com/" target="_blank" rel="noopener noreferrer">https://simonoren.com/</a>.
               </span>
             }
            type="warning"
              showIcon
              className="demo-alert-tooltip"
            />
          }
          overlayInnerStyle={{ padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
          color="transparent"
        >
          <Button
            className="floating-alert-button"
            type="primary"
            shape="circle"
            style={{ backgroundColor: 'yellow', borderColor: 'yellow', marginRight: '10px' }}
            icon={<ExclamationCircleOutlined  style={{ color: 'black' }} />}
          />
        </Tooltip>
      )}

      {process.env.REACT_APP_AWS_FEATURE === 'true' && !isLoggedIn && (
        <Tooltip title="Click here to experience the management system after logging in">
          <Button
            className="floating-login-button"
            type="primary"
            shape="circle"
            icon={<LoginOutlined />}
            onClick={handleLoginClick}
          />
        </Tooltip>
      )}
      {process.env.REACT_APP_ECE_STANDALONE === 'true' && !isLoggedIn && (
        <Tooltip title="Click here to log in and access the management system.">
          <Button
            className="floating-login-button"
            type="primary"
            shape="circle"
            icon={<LoginOutlined />}
            onClick={handleLoginClick}
          />
        </Tooltip>
      )}
      
    </Header>
  );
};

export default Navbar;
