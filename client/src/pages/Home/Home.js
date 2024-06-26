import React from 'react';
import { Layout } from 'antd';
import './Home.css';
import Navbar from '../../components/layout/Navbar'; // 引用Navbar组件
import icon1 from '../../assets/images/icon1.png';
import icon2 from '../../assets/images/icon2.png';
import icon3 from '../../assets/images/icon3.png';
import CustomFooter from '../../components/layout/CustomFooter'; // 引用自定义Footer组件
import textContent from '../../config/textContent'; // 引用文字内容配置

const { Header, Content } = Layout;

const Home = () => {
  const renderTextWithNewLines = (text) => {
    return text.split('\n').map((str, index) => (
      <p key={index}>{str}</p>
    ));
  };

  const renderTitleWithNewLines = (text) => {
    return text.split('\n').map((str, index) => (
      <h1 key={index}>{str}</h1>
    ));
  };


  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar defaultSelectedKey="1" />
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="site-layout-content">
          <div className="main-content">
            <div className="background-animation">
              <div className="animation-overlay">
              {renderTitleWithNewLines(textContent.home.title)}
              {renderTextWithNewLines(textContent.home.description)}
              </div>
            </div>
          </div>
        </div>
        <div className="new-content-section">
          <div className="content-container">
            {textContent.home.sections.map((section, index) => (
              <div className="content-item" key={index}>
                <img src={index === 0 ? icon1 : index === 1 ? icon2 : icon3} alt={section.iconAlt} />
                <h2>{section.heading}</h2>
                <p>{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Content>
      
      <CustomFooter />
    </Layout>
  );
};

export default Home;
