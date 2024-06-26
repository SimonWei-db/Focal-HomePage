import React, { useState, useEffect } from 'react';
import { Form, Button, Card, message, Space, Upload, Spin, List, Empty, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import ProfileForm from './ProfileForm';
import SectionForm from './SectionForm';
import './EditAboutMe.css';
import { Tooltip } from 'antd';
import aboutMeService from '../../../services/aboutMeService'; 
import utilsService from '../../../services/utilsService'

const { Item: FormItem } = Form;

const buttonPrimaryColor = '#1890ff';

const EditAboutMe = () => {
  const [aboutMeContent, setAboutMeContent] = useState({
    profile: {
      name: '',
      degrees: '',
      bio: '',
      image: null,
    },
    sections: [],
  });
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [editingSubSectionIndex, setEditingSubSectionIndex] = useState(null);
  const [initialAboutMeContent, setInitialAboutMeContent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchAboutMeContent = async () => {
      try {
        setLoading(true);
        const data = await aboutMeService.getAboutMe();
        setAboutMeContent(JSON.parse(data?.content));
        setInitialAboutMeContent(JSON.parse(data?.content));
      } catch (error) {
        console.error('Error fetching about_me content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutMeContent();
  }, []);

  const handleSave = () => {
    form.validateFields().then(async () => {
      if (!aboutMeContent.profile.image) {
        message.error('Profile Image is required');
        return;
      }
      try {
        setLoading(true);
        const response = await aboutMeService.updateAboutMe(aboutMeContent);
        if (response.success) {
          const data = await aboutMeService.getAboutMe();
          setAboutMeContent(JSON.parse(data?.content));
          setInitialAboutMeContent(JSON.parse(data?.content));
          setUnsavedChanges(false); // Reset unsaved changes state
          message.success('Content saved successfully!');
        } else {
          message.error(response.data.message || 'Failed to save content.');
        }
      } catch (error) {
        handleSaveError(error);
      } finally {
        setLoading(false);
      }
    }).catch(errorInfo => {
      console.log('Validation Failed:', errorInfo);
    });
  };

  const handleFieldChange = (field, value, sectionIndex = null, subSectionIndex = null, pointIndex = null) => {
    let updatedContent = { ...aboutMeContent };

    if (sectionIndex !== null && subSectionIndex !== null && pointIndex !== null) {
      updatedContent.sections[sectionIndex].subSection[subSectionIndex].points[pointIndex] = value;
    } else if (sectionIndex !== null && subSectionIndex !== null) {
      updatedContent.sections[sectionIndex].subSection[subSectionIndex][field] = value;
    } else if (sectionIndex !== null) {
      updatedContent.sections[sectionIndex][field] = value;
    } else {
      if (field === 'bio') {
        updatedContent.profile.bio = value; // updated to handle single string
      } else if (field in updatedContent.profile) {
        updatedContent.profile[field] = value;
      } else {
        updatedContent[field] = value;
      }
    }

    setAboutMeContent(updatedContent);
    setUnsavedChanges(true); // Mark as unsaved changes
  };


  const handleAddSection = () => {
    let updatedContent = { ...aboutMeContent };
    updatedContent.sections.push({
      title: 'New Section Title',
      description: 'New Section Description',
      subSection: [],
    });

    setAboutMeContent(updatedContent);
    setUnsavedChanges(true); // Mark as unsaved changes
  };

  const handleRemoveSection = (sectionIndex) => {
    let updatedContent = { ...aboutMeContent };
    updatedContent.sections.splice(sectionIndex, 1);
    setAboutMeContent(updatedContent);
    setUnsavedChanges(true); // Mark as unsaved changes
    if (editingSectionIndex === sectionIndex) {
      setEditingSectionIndex(null);
      setEditingSubSectionIndex(null);
    }
  };

  const handleAddSubSection = (sectionIndex) => {
    let updatedContent = { ...aboutMeContent };
    if (!updatedContent.sections[sectionIndex].subSection) {
      updatedContent.sections[sectionIndex].subSection = [];
    }
    updatedContent.sections[sectionIndex].subSection.push({
      title: 'Sub-Section Title',
      description: 'Sub-Section Description',
      image: null,
      points: [],
    });

    setAboutMeContent(updatedContent);
    setUnsavedChanges(true); // Mark as unsaved changes
  };

  const handleRemoveSubSection = (sectionIndex, subSectionIndex) => {
    let updatedContent = { ...aboutMeContent };
    updatedContent.sections[sectionIndex].subSection.splice(subSectionIndex, 1);

    setAboutMeContent(updatedContent);
    setUnsavedChanges(true); // Mark as unsaved changes
  };

  const handleProfileImageUpload = async (file) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isImage) {
      message.error('You can only upload JPG/PNG/GIF file!');
      return Upload.LIST_IGNORE;
    }

    const formData = new FormData();
    formData.append('Image', file);

    try {
      const response = await utilsService.uploadImage(formData);
      if (response.success) {
        let updatedContent = { ...aboutMeContent };
        updatedContent.profile.image = response.imageUrl;
        setAboutMeContent(updatedContent);
        setUnsavedChanges(true); // Mark as unsaved changes
        message.success('Image uploaded successfully!');
      } else {
        message.error(response.message || 'Failed to upload image.');
      }
    } catch (error) {
      handleUploadError(error);
    }

    return false;
  };

  const handleProfileImageRemove = () => {
    let updatedContent = { ...aboutMeContent };
    updatedContent.profile.image = null;
    setAboutMeContent(updatedContent);
    setUnsavedChanges(true); // Mark as unsaved changes
  };

  const showEditModal = (sectionIndex, subSectionIndex = null) => {
    setEditingSectionIndex(sectionIndex);
    setEditingSubSectionIndex(subSectionIndex);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleUploadError = (error) => {
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
  };

  const handleSaveError = (error) => {
    if (error.response) {
      if (error.response.status === 400) {
        console.error('Error saving content:', error.response.data.message);
        message.error(error.response.data.message || 'An error occurred while saving the content.');
      } else {
        console.error('Error saving content:', error.response.data);
        message.error(error.response.data.message || 'An error occurred while saving the content.');
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      message.error('No response received from server.');
    } else {
      console.error('Error setting up request:', error.message);
      message.error('An error occurred while setting up the request.');
    }
  };

  

  return (
    <Spin spinning={loading} tip="Loading..." style={{ display: 'block', marginBottom: '80%' }}>
      <div className="edit-about-me">
        <h2>Edit About Me</h2>
        {unsavedChanges && (
          <Alert
            message="You have unsaved changes"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <ProfileForm
            profile={aboutMeContent.profile}
            handleFieldChange={handleFieldChange}
            handleProfileImageUpload={handleProfileImageUpload}
            handleProfileImageRemove={handleProfileImageRemove}
          />
          {(aboutMeContent.sections || []).map((section, sectionIndex) => (
            <Card
              key={sectionIndex}
              title={
                <Space>
                  <span style={{ fontWeight: 'bold', color: buttonPrimaryColor }}>{`Section ${sectionIndex + 1}`}</span>: {section.title}
                  <Tooltip title="Click to edit description">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => showEditModal(sectionIndex)}
                    >
                      Edit
                    </Button>
                  </Tooltip>
                  {aboutMeContent.sections.length > 1 && <Button
                    type="danger"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveSection(sectionIndex)}
                  >
                    Delete
                  </Button>}
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              {(section.subSection || []).length === 0 ? (
              <List
                dataSource={[]}
                renderItem={() => null}
                locale={{ emptyText: <Empty description="No Sub-Sections" /> }}
              />
            ) :
              (section.subSection || []).map((subSection, subSectionIndex) => (
                <div key={subSectionIndex} className="sub-section-preview">
                  <Space>
                    <strong>{`Sub-Section ${subSectionIndex + 1}: ${subSection.title}`}</strong>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => showEditModal(sectionIndex, subSectionIndex)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="danger"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveSubSection(sectionIndex, subSectionIndex)}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => handleAddSubSection(sectionIndex)}
                style={{ width: '100%', marginTop: 16 }}
              >
                Add Sub-Section (Optional)
              </Button>
            </Card>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddSection}
            style={{ width: '100%', marginTop: 16, fontWeight: 'bold' }}
          >
            Add Section
          </Button>
          <FormItem>
            <Button type="primary" htmlType="submit" style={{ marginTop: 16 }}>
              Save
            </Button>
            <Button 
              type="default" 
              style={{ marginTop: 16, marginLeft: 8 }} 
              onClick={() => {
                setAboutMeContent(JSON.parse(JSON.stringify(initialAboutMeContent))); // Reset aboutMeContent to initial state
                form.resetFields();
                setUnsavedChanges(false); // Reset unsaved changes state
              }}
            >
              Reset
            </Button>
          </FormItem>
        </Form>
        <SectionForm
          isModalVisible={isModalVisible}
          handleOk={handleOk}
          handleCancel={handleCancel}
          form={form}
          aboutMeContent={aboutMeContent} // Ensure modal does not error out on close
          editingSectionIndex={editingSectionIndex}
          editingSubSectionIndex={editingSubSectionIndex}
          handleFieldChange={handleFieldChange}
        />
      </div>
    </Spin>
  );
};

export default EditAboutMe;
