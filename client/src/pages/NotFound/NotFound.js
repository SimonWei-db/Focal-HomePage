import React, { useEffect } from 'react';
import { Layout, Typography } from 'antd';
import './NotFound.css';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Text } = Typography;

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar />
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="notfound-background">
          <div className="notfound-overlay">
            <Text className="notfound-text">404<br/></Text>
            <Text className="redirect-text">Page Not Found<br/>Redirecting to homepage in 10 seconds...</Text>
          </div>
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default NotFound;
