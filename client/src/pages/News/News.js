import React, { useState, useEffect, useRef } from 'react';
import { Layout, Card, Tabs, Button, Popover, List, Tag, Spin, Table, Pagination } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './News.css';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import newsService from '../../services/newsService';
import { LinkOutlined } from '@ant-design/icons';
import getFullUrl from '../../utils/urlBuilder'; // 导入urlBuilder

const { Header, Content } = Layout;
const { TabPane } = Tabs;

const MAX_BUTTON_TEXT_LENGTH = 20;

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const isNew = (date) => {
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  return new Date(date) >= threeMonthsAgo;
};

const News = () => {
  const [newsData, setNewsData] = useState([]);
  const [resourcesData, setResourcesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPageNews, setCurrentPageNews] = useState(1);
  const [pageSizeNews, setPageSizeNews] = useState(5);
  const [currentPageResources, setCurrentPageResources] = useState(1);
  const [pageSizeResources, setPageSizeResources] = useState(10);
  const [activeKey, setActiveKey] = useState('1');
  const cardRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        let data;
        if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
          const response = await fetch(`${process.env.PUBLIC_URL}/upload_files/News&Resources/news.json?timestamp=${new Date().getTime()}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          data = await response.json();
        } else {
          data = await newsService.getNewsByType('news');
        }
        setNewsData(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (error) {
        console.error('Error fetching news data:', error);
      }
    };

    const fetchResources = async () => {
      try {
        let data;
        if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
          const response = await fetch(`${process.env.PUBLIC_URL}/upload_files/News&Resources/resource.json?timestamp=${new Date().getTime()}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          data = await response.json();
        } else {
          data = await newsService.getNewsByType('resource');
        }
  
        setResourcesData(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (error) {
        console.error('Error fetching resources data:', error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchNews(), fetchResources()]);
      setLoading(false);
    };

    fetchData();

    // Determine active tab from URL parameters
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    switch (tab) {
      case 'news':
        setActiveKey('1');
        break;
      case 'resources':
        setActiveKey('2');
        break;
      default:
        setActiveKey('1');
    }
  }, [location.search]);

  const handleTabChange = (key) => {
    setActiveKey(key);
    let tabName = '';
    switch (key) {
      case '1':
        tabName = 'news';
        break;
      case '2':
        tabName = 'resources';
        break;
      default:
        tabName = 'news';
    }
    navigate(`?tab=${tabName}`);
  };

  const columns = [
    {
      title: '',
      className: 'icon-column',
      dataIndex: 'image',
      key: 'image',
      render: (text, record) => (
        text && <img src={getFullUrl(record.image)} alt={record.title} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '20%',
      render: (text, record, index) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong style={{ marginRight: '8px' }}>
            {text}
          </strong>
          {(index === 0 || isNew(record.date)) && <strong><Tag color="red" className="new-tag">New</Tag></strong>}
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '50%',
    },
    {
      title: 'Update Time',
      dataIndex: 'date',
      key: 'date',
      width: '20%',
    },
    process.env.REACT_APP_ECE_WEBSITE === 'true'|| process.env.REACT_APP_ECE_STANDALONE === 'true'
    ? {
        title: 'Links',
        key: 'action',
        render: (_, record) => (
          <Popover
            content={
              <List
                dataSource={record.links}
                renderItem={(link) => {
                  const fullUrl = getFullUrl(link.url);
                  const isDownloadable = fullUrl.includes('?download=true');

                  // Extract the filename parts manually
                  const fileName = link.url.split('/').pop().split('?')[0];
                  const parts = fileName.split('-');
                  const extension = fileName.split('.').pop();
                  const originalName = parts.slice(1, -2).join('-') + '.' + extension; // Ignore the first part ('upload') and combine the rest to form the original filename

                  return (
                    <List.Item>
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...(isDownloadable && { download: originalName })}
                      >
                        {capitalizeFirstLetter(link.label)}
                      </a>
                    </List.Item>
                  );
                }}
              />
            }
            title="Links"
            trigger="click"
          >
            <Button type="primary" icon={<LinkOutlined />} />
          </Popover>
        ),
      }
    : {
        title: 'Links',
        key: 'action',
        render: (_, record) => (
          <Popover
            content={
              <List
                dataSource={record.links}
                renderItem={(link) => (
                  <List.Item>
                    <a href={getFullUrl(link.url)} target="_blank" rel="noopener noreferrer">
                      {capitalizeFirstLetter(link.label)}
                    </a>
                  </List.Item>
                )}
              />
            }
            title="Links"
            trigger="click"
          >
            <Button type="primary" icon={<LinkOutlined />} />
          </Popover>
        ),
      },
  ];

  const renderCard = (item, index) => {
    const isNewItem = index === 0 || isNew(item.date);
    const isImageRight = index % 2 === 1;
    return (
      <Card key={index} className="card" ref={(el) => (cardRefs.current[index] = el)}>
        <div className={`card-content ${isImageRight && item.image ? 'image-right' : ''}`}>
          {item.image && <img className="card-img" alt={item.title} src={getFullUrl(item.image)} />}
          <div className={`card-body ${!item.image ? 'full-width' : ''}`}>
            <h3 className="card-title">
              {item.title} {isNewItem && <Tag color="red">New</Tag>}
            </h3>
            <p className="card-description">{item.description}</p>
            <div className="card-footer">
              {item.date && <p className="card-date">{item.date}</p>}
              {item.links && item.links.length > 0 && (
                item.links.length === 1 && item.links[0].label.length <= MAX_BUTTON_TEXT_LENGTH ? (
                  <Button type="primary" href={getFullUrl(item.links[0].url)} target="_blank" rel="noopener noreferrer" className="learn-more-button">
                    {capitalizeFirstLetter(item.links[0].label)}
                  </Button>
                ) : (
                  <Popover
                    content={
                      <List
                        dataSource={item.links}
                        renderItem={(link) => {
                          const fullUrl = getFullUrl(link.url);
                          const isDownloadable = fullUrl.includes('?download=true');

                          let linkElement;
                          
                          if (process.env.REACT_APP_ECE_WEBSITE === 'true' || process.env.REACT_APP_ECE_STANDALONE === 'true') {
                            // Extract the filename parts manually
                            const fileName = link.url.split('/').pop().split('?')[0];
                            const parts = fileName.split('-');
                            const extension = fileName.split('.').pop();
                            const originalName = parts.slice(1, -2).join('-') + '.' + extension; // Ignore the first part ('upload') and combine the rest to form the original filename

                            linkElement = (
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                {...(isDownloadable && { download: originalName })}
                              >
                                {capitalizeFirstLetter(link.label)}
                              </a>
                            );
                          } else {
                            linkElement = (
                              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                {capitalizeFirstLetter(link.label)}
                              </a>
                            );
                          }

                          return <List.Item>{linkElement}</List.Item>;
                        }}
                      />
                    }
                    title="Learn More"
                    trigger="click"
                  >
                    <Button type="primary" className="learn-more-button">Learn More</Button>
                  </Popover>

                )
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const handlePageChangeNews = (page, pageSize) => {
    setCurrentPageNews(page);
    setPageSizeNews(pageSize);
  };

  const handlePageChangeResources = (page, pageSize) => {
    setCurrentPageResources(page);
    setPageSizeResources(pageSize);
  };

  const paginatedNewsData = newsData.slice((currentPageNews - 1) * pageSizeNews, currentPageNews * pageSizeNews);
  const paginatedResourcesData = resourcesData.slice((currentPageResources - 1) * pageSizeResources, currentPageResources * pageSizeResources);

  return (
    <Layout className="layout" style={{ width: '100%' }}>
      <Header className="header">
        <Navbar defaultSelectedKey="5" />
      </Header>
      <Content style={{ padding: '0', width: '100%' }}>
        <div className="News-background">
          <div className="News-overlay">
            <h1>News & Resources</h1>
          </div>
        </div>
        <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
          <div className="News-content">
            <Tabs activeKey={activeKey} onChange={handleTabChange} centered className="custom-tabs">
              <TabPane tab={<span className="custom-tab">News</span>} key="1">
                <div className="news-section section">
                  <div className="news-grid">
                    {paginatedNewsData.map((news, index) => renderCard(news, index))}
                  </div>
                  <Pagination
                    current={currentPageNews}
                    pageSize={pageSizeNews}
                    total={newsData.length}
                    onChange={handlePageChangeNews}
                    showSizeChanger
                    pageSizeOptions={['5', '10', '20']}
                    style={{ textAlign: 'center', marginTop: '20px' }}
                  />
                </div>
              </TabPane>
              <TabPane tab={<span className="custom-tab">Resources</span>} key="2">
                <div className="resources-section section">
                  <Table
                    columns={columns}
                    dataSource={paginatedResourcesData}
                    pagination={false}
                    rowKey={(record) => record.id}
                    style={{ width: '100%', margin: '0 auto' }} // Adjust table width
                    scroll={{ x: true }} // Add scroll
                  />
                  <Pagination
                    current={currentPageResources}
                    pageSize={pageSizeResources}
                    total={resourcesData.length}
                    onChange={handlePageChangeResources}
                    showSizeChanger
                    pageSizeOptions={['10', '20', '50']}
                    style={{ textAlign: 'center', marginTop: '20px' }}
                  />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </Spin>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default News;