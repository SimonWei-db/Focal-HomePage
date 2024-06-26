import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Button, Modal, Input, Tooltip, message } from 'antd';
import {
  FaKey,
  FaUserEdit,
  FaFileAlt,
  FaUsers,
  FaNewspaper,
  FaUpload,
  FaPlus
} from 'react-icons/fa';
import { CopyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import ChangePassword from './ChangePassword';
import EditAboutMe from './EditAboutMe/EditAboutMe';
import EditPublications from './EditPublications/EditPublications';
import EditTeam from './EditTeam/EditTeam';
import EditNews from './EditNews/EditNews';
import UploadAndShare from './UploadAndShare';
import ManageWebPages from './ManageWebPages'; // 导入 ManageWebPages 组件
import './AdminDashboard.css';
import userService from '../../services/userService';
import utilsService from '../../services/utilsService';
import { isMobile, isTablet } from 'react-device-detect'; // 引入 react-device-detect

const { Header, Content } = Layout;
const { TabPane } = Tabs;

const AdminDashboard = () => {
  const [username, setUsername] = useState('');
  const [activeKey, setActiveKey] = useState('1');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await userService.AuthVerify();
          // Add authentication logic here if needed
        } catch (error) {
          console.log(error);
        }
      } 
    };

    checkAuth();
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 769);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check the screen size on component mount

    
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    switch (tab) {
      case 'aboutMe':
        setActiveKey('1');
        break;
      case 'publications':
        setActiveKey('2');
        break;
      case 'team':
        setActiveKey('3');
        break;
      case 'news':
        setActiveKey('4');
        break;
      case 'uploadShare':
        setActiveKey('5');
        break;
      case 'manageWebPages':
        setActiveKey('6');
        break;
      case 'changePassword':
        setActiveKey('7');
        break;
      default:
        setActiveKey('1');
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTabChange = key => {
    setActiveKey(key);
    let tabName = '';
    switch (key) {
      case '1':
        tabName = 'aboutMe';
        break;
      case '2':
        tabName = 'publications';
        break;
      case '3':
        tabName = 'team';
        break;
      case '4':
        tabName = 'news';
        break;
      case '5':
        tabName = 'uploadShare';
        break;
      case '6':
        tabName = 'manageWebPages';
        break;
      case '7':
        tabName = 'changePassword';
        break;
      default:
        tabName = 'aboutMe';
    }
    navigate(`?tab=${tabName}`);
  };

  const handleCopy = async () => {
    const text = directoryPath;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        message.success('Path copied to clipboard');
      } catch (err) {
        console.error('Failed to copy the Path: ', err);
        message.error('Failed to copy the Path');
      }
    } else {
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('Link copied to clipboard');
      } catch (err) {
        console.error('Fallback: Failed to copy the Path: ', err);
        message.error('Fallback: Failed to copy the Path');
      }
      document.body.removeChild(textArea);
    }
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [directoryPath, setDirectoryPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExportData = async () => {
    Modal.confirm({
      title: 'Confirm Export',
      content: 'Please confirm that all changes have been saved before exporting. Do you want to proceed?',
      onOk: async () => {
        setIsLoading(true);
        const hideLoading = message.loading('Data is being generated, please wait...', 0); // 显示加载提示
        try {
          const response = await utilsService.exportData();
          setTimeout(() => {
            hideLoading(); // 关闭加载提示
            setIsLoading(false); 
            if (response.success) {
              setDirectoryPath(response.directoryPath);
              setIsModalVisible(true); // 显示 Modal
            } else {
              message.error('Failed to export data.');
            }
          }, 3000); 
        } catch (error) {
          hideLoading(); // 关闭加载提示
          setIsLoading(false); 
          message.error('Error exporting data: ' + error.message);
        }
      },
      onCancel() {
        // Optional: Handle the case where the user cancels the confirmation
      },
    });
  };
  const handleOk = () => {
    setIsModalVisible(false);
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar defaultSelectedKey="admin" />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="admin-dashboard-content">
          <div className="user-info">
            <h2>Welcome, {username}</h2>
            {process.env.REACT_APP_ECE_STANDALONE === 'true' && (
              <Button type="primary" onClick={handleExportData} loading={isLoading} style={{ marginTop: '10px' }}>
                Export All Data
              </Button>
            )}
            <Modal
              title="Data Export"
              visible={isModalVisible}
              onOk={handleOk}
              onCancel={handleOk}
              okText="OK"
            >
             <p>
                All data has been exported to the directory:
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <Input value={directoryPath} readOnly style={{ marginRight: '10px' }} />
                  <Tooltip title="Copy to clipboard">
                    <Button icon={<CopyOutlined />} onClick={handleCopy} />
                  </Tooltip>
                </div>
              </p>
              <p>Please deploy the <strong>upload_files</strong> folder to the server.</p>
            </Modal>
          </div>
          {(isMobile || isTablet || isSmallScreen) ? (
            <div className="mobile-warning">
              <div className="mobile-warning-content">
                <h2>This page requires a larger screen for the best experience.</h2>
                <p>To access all features, please use a desktop or larger device.</p>
              </div>
            </div>
          ) : (
            <Tabs activeKey={activeKey} onChange={handleTabChange}>
              <TabPane
                tab={
                  <span>
                    <FaUserEdit />
                    Edit About Me
                  </span>
                }
                key="1"
              >
                <EditAboutMe />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <FaFileAlt />
                    Edit Publications
                  </span>
                }
                key="2"
              >
                <EditPublications />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <FaUsers />
                    Edit Team
                  </span>
                }
                key="3"
              >
                <EditTeam />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <FaNewspaper />
                    Edit News & Resources
                  </span>
                }
                key="4"
              >
                <EditNews />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <FaUpload />
                    Upload & Share
                  </span>
                }
                key="5"
              >
                <UploadAndShare />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <FaPlus />
                    Manage Web Pages
                  </span>
                }
                key="6"
              >
                <ManageWebPages />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <FaKey />
                    Change Password
                  </span>
                }
                key="7"
              >
                <ChangePassword />
              </TabPane>
            </Tabs>
          )}
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default AdminDashboard;
