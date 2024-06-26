import React from 'react';
import { Card, Form, Input, Button, Upload } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import getFullUrl from '../../../utils/urlBuilder'; // 导入urlBuilder

const { Item: FormItem } = Form;
const buttonPrimaryColor = '#1890ff';
const ProfileForm = ({ profile, handleFieldChange, handleProfileImageUpload, handleProfileImageRemove }) => (
  <Card title={<span style={{ fontWeight: 'bold', color: buttonPrimaryColor }}>Profile Information</span>}>
    <FormItem label={<span>Name: </span>} required>
      <Input
        value={profile.name || ''}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        required
        disabled
      />
    </FormItem>
    <FormItem label={<span>Degrees</span>} required>
      <Input
        value={profile.degrees || ''}
        onChange={(e) => handleFieldChange('degrees', e.target.value)}
        required
      />
    </FormItem>
    <FormItem label={<span>Profile Image</span>} required>
      {profile.image && (
        <div>
          <img src={getFullUrl(profile.image)} alt="Profile" style={{ width: '100px', marginBottom: '8px' }} />
          <Button type="danger" icon={<DeleteOutlined />} onClick={handleProfileImageRemove}>
            Remove Image
          </Button>
        </div>
      )}
      <Upload
        listType="picture"
        beforeUpload={(file) => handleProfileImageUpload(file)}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />}>Upload Image</Button>
      </Upload>
    </FormItem>
    <FormItem label={<span>Introduction</span>} required>
      <Input.TextArea
        value={profile.bio || ''}
        onChange={(e) => handleFieldChange('bio', e.target.value)}
        required
        autoSize={{ minRows: 3, maxRows: 20 }}
      />
    </FormItem>
  </Card>
);

export default ProfileForm;
