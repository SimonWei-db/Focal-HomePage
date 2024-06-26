import React, { useState, useEffect, useRef } from 'react';
import { Layout, Card, Tabs, Button, Modal, Form, Input, Spin, Tag, Space, DatePicker, Upload, message, Tooltip, Alert, Popover, List, Table } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined, UploadOutlined, CloseOutlined, RetweetOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import newsService from '../../../services/newsService';
import utilsService from '../../../services/utilsService';
import './EditNews.css';
import { cloneDeep } from 'lodash';
import getFullUrl from '../../../utils/urlBuilder'; // 导入urlBuilder

const { Content } = Layout;
const { TabPane } = Tabs;
const { confirm } = Modal;

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

const EditNews = () => {
  const [newsData, setNewsData] = useState([]);
  const [resourcesData, setResourcesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [links, setLinks] = useState([]);
  const [image, setImage] = useState(null);
  const [form] = Form.useForm();
  const [newsToCreate, setNewsToCreate] = useState([]);
  const [newsToUpdate, setNewsToUpdate] = useState([]);
  const [newsToDelete, setNewsToDelete] = useState([]);
  const [resourcesToCreate, setResourcesToCreate] = useState([]);
  const [resourcesToUpdate, setResourcesToUpdate] = useState([]);
  const [resourcesToDelete, setResourcesToDelete] = useState([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [initialLinks, setInitialLinks] = useState([]);
  const [initialImage, setInitialImage] = useState(null);

  const fetchNews = async () => {
    try {
      const data = await newsService.getNewsByType('news');
      setNewsData(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error fetching news data:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const data = await newsService.getNewsByType('resource');
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

  useEffect(() => {
    fetchData();
  }, []);

  const showModal = (item) => {
    setCurrentItem(item);
    form.setFieldsValue({
      ...item,
      date: item.date ? dayjs(item.date) : null,
    });
    setLinks(cloneDeep(item.links || []));
    setImage(item.image || null);
    setInitialLinks(cloneDeep(item.links || [])); // 保存初始 links 状态
    setInitialImage(item.image || null); // 保存初始 image 状态
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedDate = values.date.format('YYYY-MM-DD HH:mm:ss');
      const updatedItem = { ...currentItem, ...values, date: formattedDate, links, image };

      if (currentItem.id.toString().startsWith('temp-')) {
        if (currentItem.type === 'news') {
          setNewsToCreate([...newsToCreate.filter(i => i.id !== currentItem.id), updatedItem]);
        } else {
          setResourcesToCreate([...resourcesToCreate.filter(i => i.id !== currentItem.id), updatedItem]);
        }
      } else {
        if (currentItem.type === 'news') {
          setNewsToUpdate([...newsToUpdate.filter(i => i.id !== currentItem.id), updatedItem]);
        } else {
          setResourcesToUpdate([...resourcesToUpdate.filter(i => i.id !== currentItem.id), updatedItem]);
        }
      }

      if (currentItem.type === 'news') {
        setNewsData((prevData) =>
          [...prevData.map((item) => (item.id === currentItem.id ? updatedItem : item))].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      } else {
        setResourcesData((prevData) =>
          [...prevData.map((item) => (item.id === currentItem.id ? updatedItem : item))].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      }

      setIsModalVisible(false);
      setUnsavedChanges(true);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleCancel = () => {
    setLinks(cloneDeep(initialLinks)); // 恢复初始 links 状态
    setImage(initialImage); // 恢复初始 image 状态
    setIsModalVisible(false);
  };

  const addLink = () => {
    setLinks([...links, { text: '', label: '' }]);
  };

  const removeLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  
    // Reset the form's links field to the newLinks
    form.setFieldsValue({ links: newLinks });
  };

  const updateLink = (index, key, value) => {
    const newLinks = [...links];
    newLinks[index][key] = value;
    setLinks(newLinks);
    form.setFieldsValue({ links: newLinks });

    // Validate link fields
    form.validateFields(['links']);
  };

  const renderLinks = () => {
    return links.map((link, index) => (
      <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
        <Form.Item
          name={['links', index, 'label']}
          rules={[{ required: true, message: 'Link text is required' }]}
          initialValue={link.label}
          noStyle
        >
          <Input
            placeholder="Link Text"
            value={link.label}
            onChange={(e) => updateLink(index, 'label', e.target.value)}
            style={{ flex: 1 }}
          />
        </Form.Item>
        <Form.Item
          name={['links', index, 'url']}
          rules={[{ required: true, message: 'Link URL is required' }]}
          initialValue={link.url}
          noStyle
        >
          <Input
            placeholder="Link URL"
            value={link.url}
            onChange={(e) => updateLink(index, 'url', e.target.value)}
            style={{ flex: 2 }}
          />
        </Form.Item>
        <DeleteOutlined onClick={() => removeLink(index)} />
      </Space>
    ));
  };

  const showDeleteConfirm = (item) => {
    confirm({
      title: 'Confirm Deletion',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this item?',
      onOk() {
        handleDelete(item);
      },
      onCancel() {
        console.log('Deletion cancelled');
      },
    });
  };

  const handleDelete = (item) => {
    if (item.type === 'news') {
      setNewsData((prevData) => prevData.filter((news) => news.id !== item.id));
      if (item.id.toString().startsWith('temp-')) {
        setNewsToCreate(newsToCreate.filter(n => n.id !== item.id));
      } else {
        setNewsToDelete([...newsToDelete, item.id]);
        setNewsToUpdate(newsToUpdate.filter(n => n.id !== item.id));
      }
    } else {
      setResourcesData((prevData) => prevData.filter((resource) => resource.id !== item.id));
      if (item.id.toString().startsWith('temp-')) {
        setResourcesToCreate(resourcesToCreate.filter(r => r.id !== item.id));
      } else {
        setResourcesToDelete([...resourcesToDelete, item.id]);
        setResourcesToUpdate(resourcesToUpdate.filter(r => r.id !== item.id));
      }
    }
    setUnsavedChanges(true);
  };

  const addNewItem = (type) => {
    const randomNum = Math.floor(Math.random() * 9) + 1;
    const imageUrl = type === 'news'
      ? `./uploads/images/news&resources/origin-news-${randomNum}.jpg`
      : `./uploads/images/news&resources/origin-resources-${randomNum}.jpg`;

    const newItem = {
      id: `temp-${Date.now()}`,
      title: type === 'news' ? 'New News' : 'New Resource',
      description: type === 'news' ? 'Please provide a brief summary of the news story, including key details and highlights.' : 'Please enter a brief overview of the academic resource, including its main purpose and key features.',
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      type,
      links: [],
      image: imageUrl,
    };

    if (type === 'news') {
      setNewsData([newItem, ...newsData]);
      setNewsToCreate([...newsToCreate, newItem]);
    } else {
      setResourcesData([newItem, ...resourcesData]);
      setResourcesToCreate([...resourcesToCreate, newItem]);
    }
    setUnsavedChanges(true);
  };

  const renderCard = (item, index) => {
    const isNewItem = index === 0 || isNew(item.date);
    const isImageRight = index % 2 === 1;
    return (
      <Card key={index} className="card-edited-custom">
        <div className={`card-content-edited-custom ${isImageRight && item.image ? 'image-right-edited-custom' : ''}`}>
          {item.image && <img className="card-img-edited-custom" alt={item.title} src={getFullUrl(item.image)} />}
          <div className={`card-body-edited-custom ${!item.image ? 'full-width-edited-custom' : ''}`}>
            <h3 className="card-title-edited-custom">
              {item.title} {isNewItem && <Tag color="red">New</Tag>}
            </h3>
            <p className="card-description-edited-custom">{item.description}</p>
            <div className="card-footer-edited-custom">
              {item.date && <p className="card-date-edited-custom">{item.date}</p>}
              <Button
                icon={<EditOutlined />}
                onClick={() => showModal(item)}
                type="default"
                className="edit-button-edited-custom"
              >
                Edit
              </Button>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => showDeleteConfirm(item)}
                type="default"
                className="delete-button-edited-custom"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const handleImageUpload = async (file) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isImage) {
      message.error('You can only upload JPG/PNG/GIF file!');
      return;
    }

    const formData = new FormData();
    formData.append('Image', file);

    try {
      const response = await utilsService.uploadImage(formData);
      if (response.success) {
        setImage(response.imageUrl);
        message.success('Image uploaded successfully!');
      } else {
        message.error(response.message || 'Failed to upload image.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          console.error('Error uploading image:', error.response.data.message);
          message.error(error.response.data.message || 'An error occurred while uploading the image.');
        } else {
          console.error('Error uploading image:', error.response.data);
          message.error(error.response.data.message || 'An error occurred while uploading the image.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        message.error('No response received from server.');
      } else {
        console.error('Error setting up request:', error.message);
        message.error('An error occurred while setting up the request.');
      }
    }
  };

  const handleImageRemove = () => {
    setImage(null);
  };

  const handleRandomImage = () => {
    const generateRandomImageUrl = () => {
      const randomNum = Math.floor(Math.random() * 9) + 1;
      const imageUrl = currentItem.type === 'news'
        ? `./uploads/images/news&resources/origin-news-${randomNum}.jpg`
        : `./uploads/images/news&resources/origin-resources-${randomNum}.jpg`;
      return imageUrl;
    };
  
    let newImageUrl;
    do {
      newImageUrl = generateRandomImageUrl();
    } while (newImageUrl === image);
  
    setImage(newImageUrl);
  };

  const onFinish = async () => {
    const batchData = {
      newsToCreate,
      newsToUpdate,
      newsToDelete,
      resourcesToCreate,
      resourcesToUpdate,
      resourcesToDelete,
    };

    setLoading(true);
    try {
      await newsService.batchProcessNews(batchData);
      setNewsToCreate([]);
      setNewsToUpdate([]);
      setNewsToDelete([]);
      setResourcesToCreate([]);
      setResourcesToUpdate([]);
      setResourcesToDelete([]);
      setUnsavedChanges(false);
      message.success('News and resources updated successfully!');
      await fetchData();  // Fetch the latest data after saving
    } catch (error) {
      console.error('Error updating news and resources:', error);
      message.error('Failed to update news and resources.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = async () => {
    await fetchData();  // Fetch the latest data on reset
    setUnsavedChanges(false);
    setNewsToCreate([]);
    setNewsToUpdate([]);
    setNewsToDelete([]);
    setResourcesToCreate([]);
    setResourcesToUpdate([]);
    setResourcesToDelete([]);
  };

  return (
    <Layout className="layout-edited-custom" style={{ width: '100%' }}>
      <Content style={{ padding: '0 20px', width: '100%' }}>
        {unsavedChanges && (
          <Alert
            message="You have unsaved changes"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
          <div className="News-content-edited-custom" >
            
            <Tabs defaultActiveKey="1" onChange={(key) => setActiveTab(key)} className="edit-news-simple-tabs-edited-custom"  >
    
              <TabPane tab="News" key="1">
                <div className="edit-news-section-edited-custom">
                  <Button
                    type="dashed"
                    onClick={() => addNewItem('news')}
                    icon={<PlusOutlined />}
                    className="add-new-button-edited-custom"
                  >
                    Publish News
                  </Button>
                  <div className="news-grid-edited-custom">
                    {newsData.map((news, index) => renderCard(news, index))}
                  </div>
                </div>
              </TabPane>
              <TabPane tab="Resources" key="2">
                <div className="edit-news-section-edited-custom">
                  <div>
                    <Button
                      type="dashed"
                      onClick={() => addNewItem('resource')}
                      icon={<PlusOutlined />}
                      className="add-new-button-edited-custom"
                      style={{maxWidth:1600}}
                    >
                      Publish Resource
                    </Button>
                  </div>
                  <Table
                    columns={[
                      {
                        title: '',
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
                            {(index === 0 || isNew(record.date)) && <strong><Tag color="red">New</Tag></strong>}
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
                      {
                        title: 'Action',
                        key: 'action',
                        render: (_, record) => (
                          <Space size="middle">
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => showModal(record)}
                              type="default"
                              className="edit-button-edited-custom"
                            >
                              
                            </Button>
                            <Button
                              icon={<DeleteOutlined />}
                              onClick={() => showDeleteConfirm(record)}
                              type="default"
                              className="delete-button-edited-custom"
                            >
                             
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                    dataSource={resourcesData}
                    pagination={false}
                    rowKey={(record) => record.id}
                    style={{ width: '100%', margin: '0 auto' }}
                    scroll={{ x: true }}
                  />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </Spin>
      </Content>
      <Modal
        title="Edit Item"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please input the title!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please input the description!' }]}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} />
          </Form.Item>
          <Tooltip
            title={
              activeTab === '1'
                ? 'Changing the date will reorder the news items based on the latest date.'
                : 'Changing the date will reorder the resources items based on the latest date.'
            }
          >
            <Form.Item
              name="date"
              label={<span>Date <InfoCircleOutlined /></span>}
              rules={[
                { required: true, message: 'Please input the date!' },
                {
                  validator: (_, value) =>
                    value && value.isAfter(dayjs())
                      ? Promise.reject(new Error('The date cannot be in the future!'))
                      : Promise.resolve(),
                },
              ]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" disabledDate={(current) => current && current > dayjs()} />
            </Form.Item>
          </Tooltip>
          <Form.Item label="Image">
            {image && (
              <div className="edit-news-image-container-edited-custom">
                <img src={getFullUrl(image)} alt="Uploaded" className="edit-news-image-edited-custom" />
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleImageRemove}
                  className="delete-button-edited-custom"
                >
                </Button>
              </div>
            )}
            <div style={{ display: 'flex', marginTop: 10 }}>
              <Upload
                name="image"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageUpload(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
              <Button icon={<RetweetOutlined />} onClick={handleRandomImage} style={{ marginLeft: 10 }}>
                Use Random Image
              </Button>
            </div>
          </Form.Item>

          <Form.Item label="Links (Optional)">
            {renderLinks()}
            <Button type="dashed" onClick={addLink} icon={<PlusOutlined />}>
              Add Link
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Form.Item>
        <Button type="primary" htmlType="submit" onClick={onFinish} className="save-button-edited-custom">
          Save
        </Button>
        <Button type="default" onClick={resetForm} className="reset-button-edited-custom">
          Reset
        </Button>
      </Form.Item>
    </Layout>
  );
};

export default EditNews;
