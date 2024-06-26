import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, Upload, message, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { cloneDeep } from 'lodash';
import utilsService from '../../../services/utilsService';
import getFullUrl from '../../../utils/urlBuilder'; // 导入urlBuilder

const { Item: FormItem } = Form;

const ItemForm = ({ visible, item, onSave, onCancel }) => {
  const [tempItem, setTempItem] = useState(cloneDeep(item));
  const [editingAttribute, setEditingAttribute] = useState('');
  const [currentAttributeValue, setCurrentAttributeValue] = useState('');
  const [attributeOrder, setAttributeOrder] = useState(Object.keys(item.content));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingAttribute && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAttribute]);

  const handleFieldChange = (field, value) => {
    const newItem = { ...tempItem };
    newItem.content[field] = value;
    setTempItem(newItem);
  };

  const handleAddAttribute = () => {
    const newItem = { ...tempItem };
    const baseName = 'New Metadata Item';
    let newName = baseName;
    let counter = 1;

    while (newItem.content.hasOwnProperty(newName)) {
      newName = `${baseName} ${counter}`;
      counter++;
    }

    newItem.content[newName] = '';
    setTempItem(newItem);
    setAttributeOrder([...attributeOrder, newName]);
  };

  const handleDeleteAttribute = (attribute) => {
    if (['title', 'description', 'image', 'links'].includes(attribute)) {
      message.error(`The ${attribute} attribute cannot be deleted.`);
      return;
    }
    const newItem = { ...tempItem };
    delete newItem.content[attribute];
    setTempItem(newItem);
    setAttributeOrder(attributeOrder.filter(attr => attr !== attribute));
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
        const updatedItem = { ...tempItem };
        updatedItem.content['image'] = response.imageUrl;
        setTempItem(updatedItem);
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

  const handleSave = () => {
    if (!tempItem.content.title || tempItem.content.title.trim() === '') {
      Modal.confirm({
        title: 'Validation Error',
        content: 'The title field cannot be empty. Please provide a valid title.',
        onOk: () => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      });
      return;
    }
    onSave(tempItem);
  };

  const handleAddLink = () => {
    const newLinks = tempItem.content.links ? [...tempItem.content.links, { text: '', url: '' }] : [{ text: '', url: '' }];
    handleFieldChange('links', newLinks);
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...tempItem.content.links];
    newLinks[index][field] = value;
    handleFieldChange('links', newLinks);
  };

  const handleDeleteLink = (index) => {
    const newLinks = [...tempItem.content.links];
    newLinks.splice(index, 1);
    handleFieldChange('links', newLinks);
  };

  const handleEditAttribute = (attribute) => {
    setEditingAttribute(attribute);
    setCurrentAttributeValue(attribute);
  };

  const handleSaveAttribute = (oldName, newName) => {
    const lowerNewName = newName.trim().toLowerCase();
    const lowerOldName = oldName.trim().toLowerCase();
  
    // If the old name and new name are the same (case-insensitive), do nothing
    if (lowerOldName === lowerNewName) {
      setEditingAttribute('');
      return;
    }
  
    const newItem = { ...tempItem };
  
    // Check if the new name already exists (case-insensitive)
    const existingNames = Object.keys(newItem.content).map(name => name.trim().toLowerCase());
    if (existingNames.includes(lowerNewName)) {
      Modal.confirm({
        title: 'Attribute Name Conflict',
        content: `The attribute name "${newName}" already exists. Please choose a different name.`,
        onOk: () => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      });
      setEditingAttribute(oldName);
      setCurrentAttributeValue(oldName);
      return;
    }
  
    // Update the attribute name
    newItem.content[newName] = newItem.content[oldName];
    delete newItem.content[oldName];
    setTempItem(newItem);
    setEditingAttribute('');
  
    // Update the order of attributes
    const newOrder = attributeOrder.map(attr => attr === oldName ? newName : attr);
    setAttributeOrder(newOrder);
  };
  

  const renderAttributes = () => {
    const attributes = ['title', 'description', 'image', ...attributeOrder.filter(attr => !['title', 'description', 'image', 'links', 'display_order'].includes(attr)), 'links'];

    return attributes.map((attribute, index) => (
      <FormItem
        key={index}
        label={
          <Space>
            {editingAttribute === attribute ? (
              <Input
                ref={inputRef}
                value={currentAttributeValue}
                onChange={(e) => setCurrentAttributeValue(e.target.value)}
                onBlur={() => handleSaveAttribute(attribute, currentAttributeValue)}
                autoFocus
                onPressEnter={() => handleSaveAttribute(attribute, currentAttributeValue)}
              />
            ) : (
              <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                {attribute.charAt(0).toUpperCase() + attribute.slice(1)}
              </span>
            )}
            {(attribute === 'description'|| attribute === 'image'|| attribute === 'links' ) && <span style={{ color: '#1890ff' }}>(Optional)</span>}
              
            {attribute !== 'title' && attribute !== 'description' && attribute !== 'image' && attribute !== 'links' && (
              <>
                <Button
                  icon={editingAttribute === attribute ? <SaveOutlined /> : <EditOutlined />}
                  onClick={() => (editingAttribute === attribute ? handleSaveAttribute(attribute, currentAttributeValue) : handleEditAttribute(attribute))}
                  type="ghost"
                />
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteAttribute(attribute)}
                  type="ghost"
                />
              </>
            )}
          </Space>
        }
        required={attribute === 'title'}
      >
        {attribute === 'image' ? (
          <>
            {tempItem.content[attribute] && (
              <div>
                <img src={getFullUrl(tempItem.content[attribute])} alt="Item" style={{ width: '100px', marginBottom: '8px' }} />
                <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleFieldChange('image', '')}>
                  Remove Image
                </Button>
              </div>
            )}
            <Upload
              listType="picture"
              beforeUpload={(file) => {
                handleImageUpload(file);
                return false; // Prevent the default behavior of the Upload component
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </>
        ) : attribute === 'links' ? (
          <>
            {tempItem.content.links && tempItem.content.links.map((link, linkIndex) => (
              <div key={linkIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ marginRight: 8 }}>Text:</span>
                <Input
                  placeholder="Link Text"
                  value={link.text}
                  onChange={(e) => handleLinkChange(linkIndex, 'text', e.target.value)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <span style={{ marginRight: 8 }}>URL:</span>
                <Input
                  placeholder="Link URL"
                  value={link.url}
                  onChange={(e) => handleLinkChange(linkIndex, 'url', e.target.value)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleDeleteLink(linkIndex)} />
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddLink} style={{ marginLeft: 8 }}>
              Add Link
            </Button>
          </>
        ) : (
          <Input
            value={tempItem.content[attribute]}
            onChange={(e) => handleFieldChange(attribute, e.target.value)}
            required={attribute === 'title'}
          />
        )}
      </FormItem>
    ));
  };

  return (
    <Modal
      title="Edit Item"
      visible={visible}
      onOk={handleSave}
      onCancel={onCancel}
      width={800}
    >
      <Form layout="vertical">
        {renderAttributes()}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddAttribute}
          style={{ width: '100%' }}
        >
          Add Metadata Item
        </Button>
      </Form>
    </Modal>
  );
};

export default ItemForm;
