import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, List, Upload, Progress, Table, Modal, Tooltip, Spin } from 'antd';
import { DeleteOutlined, UploadOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons';
import utilsService from '../../services/utilsService';
import './UploadAndShare.css';
import getFullUrl from '../../utils/urlBuilder'; // 导入urlBuilder

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const UploadAndShare = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0.01); // Initial value set to 0.01 GB
  const [loading, setLoading] = useState(false);
  const [visibleModal, setVisibleModal] = useState(false);
  const [currentUrls, setCurrentUrls] = useState({ fullUrl: '', relativeUrl: '', fullDownloadUrl: '', relativeDownloadUrl: '' });

  useEffect(() => {
    fetchFileList();
  }, []);

  const fetchFileList = async () => {
    setLoading(true);
    try {
      const response = await utilsService.getFilesWithSizes();
      if (response.success) {
        const sortedFiles = response.files.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
        setFileList(sortedFiles);
        const totalSize = sortedFiles.reduce((acc, file) => acc + file.size, 0);
        setTotalUsage(totalSize);
        setTotalCapacity(response.freeSpace + totalSize); // 设置总容量为空余空间加上已使用空间
      } else {
        message.error('Failed to fetch file list.');
      }
    } catch (error) {
      message.error('Error fetching file list.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (fileName) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this file?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await utilsService.deleteFile(fileName);
          if (response.success) {
            message.success('File deleted successfully');
            fetchFileList(); // Refresh file list after deletion
          } else {
            message.error('Failed to delete file.');
          }
        } catch (error) {
          message.error('Error deleting file.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleUpload = async (options) => {
    const { onSuccess, onError, file, onProgress } = options;

    if (file.size > MAX_FILE_SIZE) {
      message.error('File size exceeds the maximum limit of 2GB.');
      return onError('File size exceeds the maximum limit of 2GB.');
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await utilsService.uploadFile(formData, (event) => {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      });
      if (response.success) {
        message.success('File uploaded successfully.');
        fetchFileList(); // Refresh file list after upload
        onSuccess(response.data);
      } else {
        message.error('Failed to upload file.');
        onError('Upload failed.');
      }
    } catch (error) {
      message.error('Error uploading file.');
      onError('Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleCopy = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        message.success('Link copied to clipboard');
      } catch (err) {
        console.error('Failed to copy the link: ', err);
        message.error('Failed to copy the link');
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
        console.error('Fallback: Failed to copy the link: ', err);
        message.error('Fallback: Failed to copy the link');
      }
      document.body.removeChild(textArea);
    }
  };

  const generateDownloadURL = (fileName, relative = false, download = false) => {
    const baseUrl = process.env.REACT_APP_ECE_STANDALONE !== 'true'
    ? (relative ? './uploads/files/' : getFullUrl('./uploads/files/'))
    : (relative ? './upload_files/UserCloud/' : getFullUrl('https://www.example.com/SteveHranilovic/upload_files/UserCloud/'));
    const downloadParam = download ? '?download=true' : '';
    return `${baseUrl}${fileName}${downloadParam}`;
  };

  const showUrlsModal = (record) => {
    setCurrentUrls({
      fullUrl: generateDownloadURL(record.fileName),
      relativeUrl: generateDownloadURL(record.fileName, true),
      fullDownloadUrl: generateDownloadURL(record.fileName, false, true),
      relativeDownloadUrl: generateDownloadURL(record.fileName, true, true),
    });
    setVisibleModal(true);
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'originalName',
      key: 'originalName',
      width: '30%', // 设置宽度
      render: (text) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{text}</div>, // 确保长文本自动换行
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: '10%', // 设置宽度
      render: (text) => formatSize(text),
    },
    {
      title: 'Upload Time',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      width: '20%', // 设置宽度
      render: (text) => {
        const date = new Date(text);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
    },
    {
      title: 'Actions',
      key: 'action',
      width: '20%', // 设置宽度
      render: (text, record) => (
        <div className="action-buttons">
          <Tooltip title="Show URLs">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => showUrlsModal(record)}
              aria-label={`Show URLs for ${record.originalName}`}
            />
          </Tooltip>
          <Tooltip title="Delete File">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.fileName)}
              aria-label={`Delete ${record.originalName}`}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const capacityPercent = ((totalUsage / totalCapacity) * 100).toFixed(2);

  return (
    <div className="upload-share-container">
      <div className="tips">
        <p className="largest-text">
          This platform allows you to upload any file and generate a URL for downloading or viewing it online. After uploading, you can insert these URLs into the links section of the <strong>Publications</strong> page, <strong>News</strong> page, and <strong>Resources</strong> page. Users can click these URLs to download or view the files online. Additionally, you can directly share these URLs on the internet for others to access.
        </p>
        <br/>
        <p className="large-text">
          <strong>Please note the following:</strong>
          <ul>
            <li>
              <strong style={{ color: 'red' }}>Public Access:</strong> Uploaded files will be publicly accessible. Avoid uploading or storing confidential or sensitive files to prevent unauthorized access and data breaches.
            </li>
            <li>
              <strong style={{ color: 'red' }}>File Security:</strong> Verify the security and integrity of files before uploading. Ensure they are safe and appropriate for public distribution.
            </li>
           
            {process.env.REACT_APP_ECE_STANDALONE !== 'true' && (
              <li>
                <strong>Storage Capacity:</strong> Displayed storage capacity is an estimate based on current server hard disk capacity. Actual storage may vary due to other server operations and constraints.
              </li>
            )}
            <li>
              <strong>Additional Storage:</strong> For more storage capacity, consider using external cloud services like Google Drive, Dropbox, or OneDrive.
            </li>
          </ul>
        </p>
      </div>
      <Tooltip title="Server storage limit reached. Upload is disabled." visible={totalUsage >= totalCapacity}>
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          disabled={totalUsage >= totalCapacity}
        >
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            disabled={uploading || totalUsage >= totalCapacity}
            aria-label="Upload File"
          >
            {uploading ? 'Uploading' : 'Upload File'}
          </Button>
        </Upload>
      </Tooltip>

      {uploading && (
        <div className="upload-progress">
          <Progress
            percent={uploadProgress}
            status="active"
            format={() => `${uploadProgress}% Uploading`}
          />
        </div>
      )}

      <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
        
        {process.env.REACT_APP_ECE_STANDALONE !== 'true' && (
             <div className="storage-info">
             <Progress
               percent={parseFloat(capacityPercent)}
               status={parseFloat(capacityPercent) >= 100 ? 'exception' : parseFloat(capacityPercent) >= 75 ? 'active' : 'normal'}
             />
             <span>{`${formatSize(totalUsage)} / ${formatSize(totalCapacity)} used (${capacityPercent}%)`}</span>
           </div>
          )}
        <Table
          columns={columns}
          dataSource={fileList}
          rowKey="fileName"
          style={{ marginTop: 20 }}
          pagination={{ pageSize: 5 }} // 设置分页，每页显示5条
        />
      </Spin>

      <Modal
        title="File URLs"
        visible={visibleModal}
        onCancel={() => setVisibleModal(false)}
        footer={[
          <Button key="close" onClick={() => setVisibleModal(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        { ( 
              <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', color: '#1890ff' }}><strong>Full URLs:</strong></p>
              {process.env.REACT_APP_ECE_STANDALONE !== 'true' && (
               <>
               <p><strong>Full Download URL:</strong> Use this URL to directly share the file for download on the internet.</p>
               <Input value={currentUrls.fullDownloadUrl} readOnly />
                <Button type="link" onClick={() => handleCopy(currentUrls.fullDownloadUrl)}>
                  Copy
                </Button>
                </>
              )}
              <p><strong>Full URL:</strong> Use this URL to directly share the file for online viewing on the internet.</p>
              <Input value={currentUrls.fullUrl} readOnly />
              <Button type="link" onClick={() => handleCopy(currentUrls.fullUrl)}>
                Copy
              </Button>
              {process.env.REACT_APP_ECE_STANDALONE === 'true' && (
              <>
                Please replace{' '}
                <span style={{ color: 'red' }}>https://www.example.com/SteveHranilovic</span>{' '}
                with the actual homepage address.
              </>
            )}
            </div>
            )}
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '20px' } }>
          <p style={{ fontWeight: 'bold', color: '#1890ff' }}><strong>Relative URLs (For the Publications, News, and Resources pages):</strong></p>
          <p><strong>Relative Download URL:</strong> "Use in the 'Link URL' field to insert into various pages of this website for download.</p>
          <Input value={currentUrls.relativeDownloadUrl} readOnly />
          <Button type="link" onClick={() => handleCopy(currentUrls.relativeDownloadUrl)}>
            Copy
          </Button>
          <p><strong>Relative URL:</strong> Use in the 'Link URL' field to insert into various pages of this website for online viewing.</p>
          <Input value={currentUrls.relativeUrl} readOnly />
          <Button type="link" onClick={() => handleCopy(currentUrls.relativeUrl)}>
            Copy
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default UploadAndShare;
