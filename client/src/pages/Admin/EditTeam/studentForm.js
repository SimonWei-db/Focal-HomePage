import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, Tag, message, ColorPicker, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { DownOutlined } from '@ant-design/icons';
import { cloneDeep } from 'lodash';

const { Item: FormItem } = Form;

const recommendedColors = [
    { name: 'Pastel Blue', color: '#AEC6CF' },
    { name: 'Lavender', color: '#B39EB5' },
    { name: 'Light Grey', color: '#CFCFC4' },
    { name: 'Pink', color: '#F49AC2' },
    { name: 'Light Coral', color: '#FFB7B2' },
    { name: 'Sky Blue', color: '#84B6F4' },
    { name: 'Beige', color: '#C2B280' },
    { name: 'Cool Blue', color: '#779ECB' }
  ];
  

const StudentForm = ({ visible, student, onSave, onCancel }) => {
  const [tempStudent, setTempStudent] = useState(cloneDeep(student));
  const [editingAttribute, setEditingAttribute] = useState('');
  const [currentAttributeValue, setCurrentAttributeValue] = useState('');
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (editingAttribute && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAttribute]);

  const handleFieldChange = (field, value) => {
    const newStudent = { ...tempStudent };
    newStudent[field] = value;
    setTempStudent(newStudent);
  };

  const handleSave = () => {
    if (!tempStudent.name || tempStudent.name.trim() === '') {
      message.error('The name field cannot be empty. Please provide a valid name.');
      return;
    }
    onSave(tempStudent);
  };

  const handleAddAttribute = () => {
    const newStudent = { ...tempStudent };
    const baseName = 'New Metadata Item';
    let newName = baseName;
    let counter = 1;

    while (newStudent.hasOwnProperty(newName)) {
      newName = `${baseName} ${counter}`;
      counter++;
    }

    newStudent[newName] = '';
    setTempStudent(newStudent);
  };

  const handleDeleteAttribute = (attribute) => {
    if (['name', 'degree'].includes(attribute)) {
      message.error(`The ${attribute} attribute cannot be deleted.`);
      return;
    }
    const newStudent = { ...tempStudent };
    delete newStudent[attribute];
    setTempStudent(newStudent);
  };

  const handleEditAttribute = (attribute) => {
    setEditingAttribute(attribute);
    setCurrentAttributeValue(attribute);
  };

  const handleSaveAttribute = (oldName, newName) => {
    const lowerNewName = newName.trim().toLowerCase();
    const lowerOldName = oldName.trim().toLowerCase();

    if (lowerOldName === lowerNewName) {
      setEditingAttribute('');
      return;
    }

    const newStudent = { ...tempStudent };

    const existingNames = Object.keys(newStudent).map(name => name.trim().toLowerCase());
    if (existingNames.includes(lowerNewName)) {
      message.error(`The attribute name "${newName}" already exists. Please choose a different name.`);
      setEditingAttribute(oldName);
      setCurrentAttributeValue(oldName);
      return;
    }

    newStudent[newName] = newStudent[oldName];
    delete newStudent[oldName];
    setTempStudent(newStudent);
    setEditingAttribute('');
  };

  const renderAttributes = () => {
    const attributes = ['name', 'degree', 'degree_color', ...Object.keys(tempStudent).filter(attr => !['name', 'degree', 'degree_color', 'student_order'].includes(attr))];

    return attributes.map((attribute, index) => (
      <FormItem
        key={index}
        label={
          <span>
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
                {attribute === 'degree_color'
                  ? 'Degree Tag Color (Optional)'
                  : attribute === 'degree'
                  ? `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} (Optional)`
                  : attribute.charAt(0).toUpperCase() + attribute.slice(1)}
              </span>
            )}
            {attribute !== 'name' && attribute !== 'degree' && attribute !== 'degree_color' && (
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
          </span>
        }
        required={attribute === 'name'}
      >
        {attribute === 'degree_color' ? (
          <div>
            <div style={{ marginBottom: 5 }}>Select a Color:</div>
            <Tooltip title="Click to choose a color">
              <ColorPicker
                value={tempStudent[attribute]}
                onChange={(color) => handleFieldChange(attribute, color.toHexString())}
                allowClear
                open={open}
        onOpenChange={setOpen}
        showText={() => (
          <DownOutlined
            rotate={open ? 180 : 0}
            style={{
              color: 'rgba(0, 0, 0, 0.25)',
            }}
          />
        )}
                
              />
            </Tooltip>
            <div style={{ marginTop: 10 }}>
              <div style={{ marginBottom: 5 }}>Recommended Colors:</div>
              {recommendedColors.map((color) => (
                <Tag
                key={color.color}
                color={color.color}
                onClick={() => handleFieldChange(attribute, color.color)}
                style={{ 
                  cursor: 'pointer', 
                  minWidth: '80px', 
                  maxWidth: '150px', 
                  textAlign: 'center', 
                  display: 'inline-block' 
                }}
              >
                {color.name}
              </Tag>
              ))}
            </div>
          </div>
        ) : (
          <Input
            value={tempStudent[attribute]}
            onChange={(e) => handleFieldChange(attribute, e.target.value)}
            required={attribute === 'name'}
          />
        )}
      </FormItem>
    ));
  };

  return (
    <Modal
      title="Edit People"
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

export default StudentForm;
