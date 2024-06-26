import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, List, Modal, Tooltip, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // 导入 Quill 样式
import pageService from '../../services/pageService'; // 导入新的 pageService
import './ManageWebPages.css'; // 新增的 CSS 文件
import getFullUrl from '../../utils/urlBuilder';

const ManageWebPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleModal, setVisibleModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(''); // 富文本内容
  const [contentSize, setContentSize] = useState(0); // 内容大小
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [generatedParam, setGeneratedParam] = useState(null);
  const [form] = Form.useForm(); // 创建表单实例

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await pageService.getAllPagesService();
      if (response.success) {
        const sortedPages = response.pages.sort((a, b) => b.id - a.id); // 按 ID 从大到小排序
        setPages(sortedPages);
      } else {
        message.error('Failed to fetch pages.');
      }
    } catch (error) {
      message.error('Error fetching pages.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (pageId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this page?',
      icon: <DeleteOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await pageService.deleteExistingPage(pageId);
          if (response.success) {
            message.success('Page deleted successfully');
            fetchPages(); // Refresh pages list after deletion
          } else {
            message.error('Failed to delete page.');
          }
        } catch (error) {
          message.error('Error deleting page.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSave = async (values) => {
    const confirmMessage = isEditing 
      ? 'Are you sure you want to update this page? This will publish the changes immediately.'
      : 'Are you sure you want to create this page? This will publish the page immediately.';
    
    // Check content size before confirming save
    if (contentSize > 20 * 1024 * 1024) { // 20MB limit
      message.error('Content size exceeds 20MB. Please reduce the content size before saving.');
      return;
    }

    Modal.confirm({
      title: isEditing ? 'Confirm Update' : 'Confirm Creation',
      content: confirmMessage,
      okText: isEditing ? 'Yes, Update' : 'Yes, Create',
      cancelText: 'No, Cancel',
      onOk: async () => {
        setLoading(true);
        try {
          const pageData = {
            ...values,
            content,
          };
          const response = isEditing 
            ? await pageService.updateExistingPage(currentPage.id, pageData)
            : await pageService.createNewPage(pageData);
          if (response.success) {
            message.success(`Page ${isEditing ? 'updated' : 'created'} successfully`);
            fetchPages(); // Refresh pages list after save
            setVisibleModal(false);
            if (!isEditing) {
              setGeneratedParam(response.param);
            }
          } else {
            message.error(`Failed to ${isEditing ? 'update' : 'create'} page.`);
          }
        } catch (error) {
          message.error(`Error ${isEditing ? 'updating' : 'creating'} page.`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const showEditModal = async (page = null) => {
    if (page) {
      try {
        const fetchedPage = await pageService.getPageById(page.id);
        if (fetchedPage) {
          setIsEditing(true);
          setCurrentPage(fetchedPage);
          form.setFieldsValue({
            title: fetchedPage.title,
          });
          setContent(fetchedPage.content); // 设置内容
        }
      } catch (error) {
        console.error("Failed to fetch page data:", error);
      }
    } else {
      setIsEditing(false);
      setCurrentPage(null);
      form.resetFields();
      setContent(''); // 重置内容为空
    }
    setGeneratedParam(null);
    setVisibleModal(true);
  };
  

  useEffect(() => {
    if (visibleModal && currentPage) {
      setContent(currentPage.content)
    }
  }, [visibleModal, currentPage]);

  // Calculate content size on change
  useEffect(() => {
    const size = new Blob([content]).size;
    setContentSize(size);
  }, [content]);

  const renderForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
    >
      <Form.Item
        label="Page Title"
        name="title"
        rules={[{ required: true, message: 'Please enter the page title' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Page Content">
        <ReactQuill
          value={content}
          onChange={setContent}
          className="quill-container"
          modules={{
            toolbar: [
              [{ 'font': [] }],
              [{ 'size': ['small', false, 'large', 'huge'] }], // 增加字体大小选择
              [{ 'header': '1' }, { 'header': '2' }, { 'header': [3, 4, 5, 6] }], // 增加更多标题选项
              ['bold', 'italic', 'underline', 'strike'], // 加入更多按钮
              [{ 'color': [] }, { 'background': [] }], // 增加颜色和背景色选择
              [{ 'script': 'sub'}, { 'script': 'super' }], // 上标和下标
              [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }], // 列表和缩进
              ['blockquote', 'code-block'], // 引用和代码块
              [{ 'direction': 'rtl' }], // 文字方向
              [{ 'align': [] }], // 文字对齐
              ['link', 'image', 'video'], // 链接、图片、视频
              ['clean'], // 清除格式按钮
            ],
          }}
          formats={[
            'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet', 'indent', 'link', 'image', 'video', 'color', 'background',
            'align', 'direction', 'script', 'code-block'
          ]}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {isEditing ? 'Update Page' : 'Create Page'}
        </Button>
      </Form.Item>
      <p style={{ color: contentSize > 20 * 1024 * 1024 ? 'red' : 'black' }}>
        Current content size: {(contentSize / (1024 * 1024)).toFixed(2)} MB
      </p>
      {contentSize > 20 * 1024 * 1024 && (
        <p style={{ color: 'red' }}>
          Content size exceeds 20MB. Please reduce the content size before saving.
        </p>
      )}
    </Form>
  );

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        message.success('Link copied to clipboard');
      }).catch((err) => {
        console.error('Failed to copy link: ', err);
        message.error('Failed to copy link');
      });
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
        console.error('Fallback: Failed to copy link: ', err);
        message.error('Fallback: Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };
  
  const showLinkModal = (param) => {
    setGeneratedParam(param);
    setLinkModalVisible(true);
  };
  const formatUrl = (relativeUrl) => {
    // 去掉第一个.，如果存在
    const formattedUrl = relativeUrl.startsWith('.') ? relativeUrl.substring(1) : relativeUrl;
    const baseUrl = "https://www.example.com/SteveHranilovic";
    return `${baseUrl}${formattedUrl}`;
  };
  

  const renderLinkModal = () => {
    if (!generatedParam) return null;
    const baseUrl = process.env.REACT_APP_ECE_STANDALONE === 'true' 
      ? 'https://www.example.com/SteveHranilovic' 
      : window.location.origin;

    const fullUrl = `${baseUrl}/#/content-page?param=${generatedParam}`;
    const relativeUrl = `./#/content-page?param=${generatedParam}`;
    const formattedUrl = formatUrl(relativeUrl);
    return (
      <Modal
        title= 'Page URLs'
        visible={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        footer={null}
      >
        { (
        <div>
          <p style={{ fontWeight: 'bold', color: '#1890ff' }}>Full URL:</p>
          <p style={{ marginBottom: '8px' }}>Use this URL to directly share on the internet.</p>
          <Input value={fullUrl} readOnly />
         
          <Button type="link" icon={<CopyOutlined />} onClick={() => copyToClipboard(fullUrl)} style={{ marginTop: '8px' }}>
            Copy Full URL
          </Button>
          <p style={{ marginBottom: '8px' }}>
            {process.env.REACT_APP_ECE_STANDALONE === 'true' && (
              <>
                Please replace{' '}
                <span style={{ color: 'red' }}>https://www.example.com/SteveHranilovic</span>{' '}
                with the actual homepage address.
              </>
            )}
          </p>
        </div>
      )}
        <div style={{ paddingTop: '20px' } }>
          {( 
            <p style={{ fontWeight: 'bold', color: '#1890ff' }}>Relative URL (For the Publications, News, and Resources pages):</p>
          )}
          <p style={{ marginBottom: '8px' }}>Use in the 'Link URL' field to insert into various pages of this website.</p>
          <Input value={relativeUrl} readOnly />
          <Button type="link" icon={<CopyOutlined />} onClick={() => copyToClipboard(relativeUrl)} style={{ marginTop: '8px' }}>
            Copy Relative URL
          </Button>
       
        </div>
      </Modal>
    );
  };

  return (
    <div className="manage-pages-container">
      <div className="tips">
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          <span style={{ display: 'block', marginBottom: '10px' , fontSize: '14px'}}>
            This platform allows you to create and customize web pages with unique URLs, just like a blog. You can insert these URLs into the links section of the <strong>Publications</strong> page, <strong>News</strong> page, and <strong>Resources</strong> page. Users can click these URLs to view the new web pages. Additionally, you can directly share these URLs on the internet for others to access and read your published content. For example, you can share these pages on LinkedIn, Facebook, Twitter, or other social media platforms.
          </span>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}>
              <strong>Unique URLs:</strong> Each page is assigned a unique URL generated using 256-bit cryptographic random bytes, ensuring it is virtually unguessable.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Public Accessibility:</strong> While the pages are publicly accessible, they can only be accessed if the unique URL is known.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Content Security:</strong> It is important to avoid including any confidential or sensitive information on these pages, as the URLs can be shared publicly.
            </li>
          </ul>
       </p>
      </div>

      <div className="create-button">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showEditModal()} >
          Create New Web Page
        </Button>
      </div>

      <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
        <List
          header={
            <div className="webpages-list-header">
              <strong>Web Pages List</strong>
            </div>
          }
          itemLayout="horizontal"
          dataSource={pages}
          renderItem={page => (
            <List.Item
              actions={[
                <Tooltip title="Preview">
                  <Button type="link" icon={<EyeOutlined />} onClick={() => window.open(getFullUrl(`./#/content-page?param=${page.param}`), '_blank')} />
                </Tooltip>,
                <Tooltip title="Edit">
                  <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(page)} disabled={page.id === 1} />
                </Tooltip>,
                <Tooltip title="Delete">
                  <Button type="link" icon={<DeleteOutlined />} onClick={() => handleDelete(page.id)} disabled={page.id === 1} />
                </Tooltip>,
                <Tooltip title="Copy Link">
                  <Button type="link" icon={<CopyOutlined />} onClick={() => showLinkModal(page.param)} />
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                title={<div>{page.title}</div>}
                description={<div><strong>Updated at:</strong> {new Date(page.updated_at).toLocaleString()}</div>}
              />
            </List.Item>
          )}
        />
        <Modal
          title={isEditing ? "Edit Web Page" : "Create New Web Page"}
          visible={visibleModal}
          onCancel={() => setVisibleModal(false)}
          footer={null}
          afterClose={() => setContent('')} // 在关闭 Modal 后重置内容
          width={800} // 设置宽度
        >
          {renderForm()}
        </Modal>
      </Spin>
      {renderLinkModal()}
    </div>
  );
};

export default ManageWebPages;
