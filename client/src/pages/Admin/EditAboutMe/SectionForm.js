import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Divider, Upload, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import utilsService from '../../../services/utilsService'
import { cloneDeep } from 'lodash';
import getFullUrl from '../../../utils/urlBuilder'; // 导入urlBuilder

const { Item: FormItem } = Form;

const buttonPrimaryColor = '#1890ff';
const SectionForm = ({
  isModalVisible,
  handleOk,
  handleCancel,
  form,
  aboutMeContent,
  editingSectionIndex,
  editingSubSectionIndex,
  handleFieldChange,
}) => {
  const [tempSection, setTempSection] = useState(null);
  const [tempSubSection, setTempSubSection] = useState(null);

  useEffect(() => {
    setTempSection(null);
    setTempSubSection(null);
    if (editingSectionIndex !== null && editingSubSectionIndex === null) {
        setTempSection(cloneDeep(aboutMeContent.sections[editingSectionIndex]));
    } else if (editingSectionIndex !== null && editingSubSectionIndex !== null) {
        setTempSubSection(cloneDeep(aboutMeContent.sections[editingSectionIndex]?.subSection?.[editingSubSectionIndex]));
    }
  }, [aboutMeContent.sections, editingSectionIndex, editingSubSectionIndex, isModalVisible]);

  const validateFields = () => {
    if (tempSubSection) {
      const isSubSectionValid = tempSubSection.title?.trim() !== '' && tempSubSection.description?.trim() !== '' && tempSubSection.points.every(point => point.trim() !== '');
      return isSubSectionValid;
    } else if (tempSection) {
      const isSectionValid = tempSection.title?.trim() !== '' && tempSection.description?.trim() !== '';
      return isSectionValid;
    }
    return false;
  };

  const handleOkWithValidation = () => {
    if (validateFields()) {
      const updatedContent = { ...aboutMeContent };

      if (tempSubSection) {
        if (!updatedContent.sections[editingSectionIndex].subSection) {
          updatedContent.sections[editingSectionIndex].subSection = [];
        }
        updatedContent.sections[editingSectionIndex].subSection[editingSubSectionIndex] = tempSubSection;
        handleFieldChange('subSection', updatedContent.sections[editingSectionIndex].subSection, editingSectionIndex);
      } else if (tempSection) {
        updatedContent.sections[editingSectionIndex] = tempSection;
        handleFieldChange('sections', updatedContent.sections);
      }

      handleOk();
      
    } else {
      message.warning('Please do not leave any fields empty. If a field is not needed, please remove it.');
    }
  };

  const handleFieldChangeWithValidation = (field, value, sectionIndex = null, subSectionIndex = null, pointIndex = null) => {
    if (subSectionIndex !== null) {
      const updatedSubSection = { ...tempSubSection };
      if (pointIndex !== null) {
        updatedSubSection.points[pointIndex] = value;
      } else {
        updatedSubSection[field] = value;
      }
      setTempSubSection(updatedSubSection);
    } else {
      const updatedSection = { ...tempSection };
      updatedSection[field] = value;
      setTempSection(updatedSection);
    }
  };

  const handleAddPoint = () => {
    const updatedSubSection = { ...tempSubSection };
    updatedSubSection.points.push('');
    setTempSubSection(updatedSubSection);
  };

  const handleRemovePoint = (pointIndex) => {
    const updatedSubSection = { ...tempSubSection };
    updatedSubSection.points.splice(pointIndex, 1);
    setTempSubSection(updatedSubSection);
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
        const updatedSubSection = { ...tempSubSection };
        updatedSubSection['image'] = response.imageUrl;
        setTempSubSection(updatedSubSection);
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
    const updatedSubSection = { ...tempSubSection };
    updatedSubSection['image'] = null;
    setTempSubSection(updatedSubSection);
  };

  return (
    <Modal
      title={tempSubSection ? 'Edit Sub-Section' : 'Edit Section'}
      open={isModalVisible}
      onOk={handleOkWithValidation}
      onCancel={handleCancel}
      width={800}
    >
      <Form form={form} layout="vertical">
        {tempSubSection ? (
          <>
            <FormItem label={<strong style={{ color: buttonPrimaryColor }}>Sub-Section Title</strong>} required>
              <Input
                value={tempSubSection.title}
                onChange={(e) => handleFieldChangeWithValidation('title', e.target.value, editingSectionIndex, editingSubSectionIndex)}
                required
              />
            </FormItem>
            <Divider />
            <FormItem label={<strong style={{ color: buttonPrimaryColor }}>Sub-Section Image (Optional)</strong>}>
              {tempSubSection.image && (
                <div>
                  <img src={getFullUrl(tempSubSection.image)} alt="Sub-Section" style={{ width: '100px', marginBottom: '8px' }} />
                  <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleImageRemove()}>
                    Remove Image
                  </Button>
                </div>
              )}
              <Upload
                listType="picture"
                beforeUpload={(file) => handleImageUpload(file)}
                showUploadList={false} // 不显示上传列表
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </FormItem>
            <Divider />
            <FormItem label={<strong style={{ color: buttonPrimaryColor }}>Sub-Section Description</strong>} required>
              <Input.TextArea
                value={tempSubSection.description}
                onChange={(e) => handleFieldChangeWithValidation('description', e.target.value, editingSectionIndex, editingSubSectionIndex)}
                required
                autoSize={{ minRows: 1, maxRows: 10 }}
              />
            </FormItem>
            <Divider />
            <strong style={{ color: buttonPrimaryColor }}>Points (Optional)</strong>
            {(tempSubSection.points || []).map((point, pointIndex) => (
              <FormItem key={pointIndex} label={`Point ${pointIndex + 1}`} required>
                <Input
                  value={point}
                  onChange={(e) => handleFieldChangeWithValidation('points', e.target.value, editingSectionIndex, editingSubSectionIndex, pointIndex)}
                  required
                />
                <Button
                  type="danger"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemovePoint(pointIndex)}
                  style={{ marginTop: 8 }}
                >
                  Remove Point
                </Button>
              </FormItem>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddPoint}
              style={{ width: '100%' }}
            >
              Add Point
            </Button>
          </>
        ) : (
          tempSection && (
            <>
              <FormItem label={<strong style={{ color: buttonPrimaryColor }}>Section Title</strong>} required>
                <Input
                  value={tempSection.title}
                  onChange={(e) => handleFieldChangeWithValidation('title', e.target.value)}
                  required
                />
              </FormItem>
              <Divider />
              <FormItem label={<strong style={{ color: buttonPrimaryColor }}>Description</strong>} required>
                <Input.TextArea
                  value={tempSection.description}
                  onChange={(e) => handleFieldChangeWithValidation('description', e.target.value)}
                  required
                  autoSize={{ minRows: 1, maxRows: 15 }}
                />
              </FormItem>
            </>
          )
        )}
      </Form>
    </Modal>
  );
};

export default SectionForm;
