import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Card, List, Row, Col, Space, Spin, Alert } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import ItemForm from './itemForm';
import publicationsService from '../../../services/publicationsService';
import './EditPublications.css';
import { cloneDeep } from 'lodash';
import getFullUrl from '../../../utils/urlBuilder'; // 导入urlBuilder

const EditPublications = () => {
  const [sections, setSections] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentCategoryValue, setCurrentCategoryValue] = useState('');

  const [categoryCreations, setCategoryCreations] = useState([]);
  const [categoryUpdates, setCategoryUpdates] = useState([]);
  const [categoryDeletions, setCategoryDeletions] = useState([]);
  const [itemCreations, setItemCreations] = useState([]);
  const [itemUpdates, setItemUpdates] = useState([]);
  const [itemDeletions, setItemDeletions] = useState([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [initialSections, setInitialSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const batchData = {
    categoryUpdates,
    itemUpdates,
    categoryCreations,
    categoryDeletions,
    itemCreations,
    itemDeletions,
  };

  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categories = await publicationsService.getCategories();
      const categoryPromises = categories.map(category =>
        publicationsService.getItemsByCategory(category.id).then(items => ({
          ...category,
          items: items.map(item => ({
            ...item,
            content: JSON.parse(item.content)
          })).sort((a, b) => b.content.display_order - a.content.display_order),
        }))
      );
      const sections = await Promise.all(categoryPromises);
      const sortedSections = sections.sort((a, b) => a.category_order - b.category_order);
      setSections(sortedSections);
      setInitialSections(cloneDeep(sortedSections));
    } catch (error) {
      console.error('Error fetching publications data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    const newCategory = { id: `temp-${Date.now()}`, name: '', items: [], category_order: sections.length + 1 };
    setSections([...sections, newCategory]);
    setCategoryCreations([...categoryCreations, newCategory]);
    setUnsavedChanges(true); 
  };

  const handleDeleteCategory = (index) => {
    const category = sections[index];
  
    if (category.items.length > 0) {
      Modal.error({
        title: 'Cannot Delete Category',
        content: 'This category cannot be deleted because it contains items. If you want to delete this category, please remove the items first.',
      });
    } else {
      Modal.confirm({
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this category?',
        onOk: () => {
          setSections(sections.filter((_, i) => i !== index));
          if (category.id.toString().startsWith('temp-')) {
            setCategoryCreations(categoryCreations.filter(c => c.id !== category.id));
          } else {
            setCategoryDeletions([...categoryDeletions, category.id]);
            setCategoryUpdates(categoryUpdates.filter(c => c.id !== category.id));
          }
          setUnsavedChanges(true); 
        },
        onCancel() {
          console.log('Deletion cancelled');
        },
      });
    }
  };
  

  const handleAddItem = (sectionIndex) => {
    const newSections = [...sections];
    const newItem = { category_id: newSections[sectionIndex].id, id: `temp-${Date.now()}`, content: { title: 'New Publication', display_order: newSections[sectionIndex].items.length + 1 } };
    newSections[sectionIndex].items.unshift(newItem);
    setSections(newSections);
    setItemCreations([...itemCreations, newItem]);
    setUnsavedChanges(true); 
  };

  const handleDeleteItem = (sectionIndex, itemIndex) => {
    const item = sections[sectionIndex].items[itemIndex];
    const newSections = [...sections];
    newSections[sectionIndex].items.splice(itemIndex, 1);
    setSections(newSections);
    if (item.id.toString().startsWith('temp-')) {
      setItemCreations(itemCreations.filter(i => i.id !== item.id));
    } else {
      setItemDeletions([...itemDeletions, item.id]);
      setItemUpdates(itemUpdates.filter(i => i.id !== item.id));
    }
    setUnsavedChanges(true); 
  };

  const handleMoveItem = (sectionIndex, itemIndex, direction) => {
    const newSections = [...sections];
    setSections(newSections);
    const items = newSections[sectionIndex].items;
    let updatedItems = [];

    if (direction === 'up' && itemIndex > 0) {
      [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]];
      items[itemIndex].content.display_order = items.length - itemIndex;
      items[itemIndex - 1].content.display_order = items.length - (itemIndex - 1);
      updatedItems = [items[itemIndex], items[itemIndex - 1]];
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      [items[itemIndex + 1], items[itemIndex]] = [items[itemIndex], items[itemIndex + 1]];
      items[itemIndex].content.display_order = items.length - itemIndex;
      items[itemIndex + 1].content.display_order = items.length - (itemIndex + 1);
      updatedItems = [items[itemIndex], items[itemIndex + 1]];
    }

    setSections(newSections);
    setUnsavedChanges(true); 

    const nonCreatedUpdatedItems = updatedItems.filter(item => !itemCreations.some(i => i.id === item.id));
    setItemUpdates([...itemUpdates.filter(i => !nonCreatedUpdatedItems.some(u => u.id === i.id)), ...nonCreatedUpdatedItems]);
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
    setUnsavedChanges(true); 

    const updatedCategory = newSections[index];
    if (!updatedCategory.id.toString().startsWith('temp-')) {
      setCategoryUpdates([...categoryUpdates.filter(c => c.id !== updatedCategory.id), updatedCategory]);
    }
  };

  const handleMoveCategory = (index, direction) => {
    const newSections = [...sections];
    let updatedCategories = [];

    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      newSections[index].category_order = index + 1;
      newSections[index - 1].category_order = index;
      updatedCategories = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
      newSections[index].category_order = index + 1;
      newSections[index + 1].category_order = index + 2;
      updatedCategories = [newSections[index], newSections[index + 1]];
    }

    setSections(newSections);
    setUnsavedChanges(true); 

    const nonCreatedUpdatedCategories = updatedCategories.filter(category => !categoryCreations.some(c => c.id === category.id));
    setCategoryUpdates([...categoryUpdates.filter(c => !nonCreatedUpdatedCategories.some(u => u.id === c.id)), ...nonCreatedUpdatedCategories]);
  };

  const openEditModal = (sectionIndex, itemIndex) => {
    setEditingItem({ sectionIndex, itemIndex, item: sections[sectionIndex].items[itemIndex] });
  };

  const handleSaveItem = (sectionIndex, itemIndex, newItem) => {
    const newSections = [...sections];
    newSections[sectionIndex].items[itemIndex] = newItem;
    setSections(newSections);
    setEditingItem(null);
    setUnsavedChanges(true); 

    if (!newItem.id.toString().startsWith('temp-')) {
      setItemUpdates([...itemUpdates.filter(i => i.id !== newItem.id), newItem]);
    } else {
      setItemCreations([...itemCreations.filter(i => i.id !== newItem.id), newItem])
    }
  };

  const onFinish = () => {
    const batchData = {
      categoryUpdates,
      itemUpdates,
      categoryCreations,
      categoryDeletions,
      itemCreations,
      itemDeletions,
    };
    setLoading(true);
    publicationsService.batchUpdate(batchData)
      .then(() => {
        setCategoryCreations([]);
        setCategoryUpdates([]);
        setCategoryDeletions([]);
        setItemCreations([]);
        setItemUpdates([]);
        setItemDeletions([]);
        fetchCategories();
        setUnsavedChanges(false); 
        message.success('Publications updated successfully!');
      })
      .catch((error) => {
        console.error('Error updating publications:', error);
        message.error('Failed to update publications.');
        setLoading(false);
      }
    );
    setLoading(false);
  };

  const resetForm = async () => {
    setSections(cloneDeep(initialSections)); // 使用深拷贝确保状态完全恢复
    setUnsavedChanges(false); 
    // 确保相关状态变量也被重置
    setEditingItem(null);
    setEditingCategory(null);
    setCurrentCategoryValue('');
    setCategoryCreations([]);
    setCategoryUpdates([]);
    setCategoryDeletions([]);
    setItemCreations([]);
    setItemUpdates([]);
    setItemDeletions([]);
  };

  const handleEditCategory = (index) => {
    setEditingCategory(index);
    setCurrentCategoryValue(sections[index].name);
  };

  const handleSaveCategory = (index) => {
    handleSectionChange(index, 'name', currentCategoryValue);
    setEditingCategory(null);
    setUnsavedChanges(true); 
  };

  return (
    <Spin spinning={loading} tip="Loading..." className="spin-center">
      <div className="edit-publications">
        <h2>Edit Publications</h2>
        {unsavedChanges && (
          <Alert
            message="You have unsaved changes"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form name="edit_publications" onFinish={onFinish} className="admin-form">
          {sections.map((section, sectionIndex) => (
            <Card
              key={section.id}
              title={
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space>
                      {editingCategory === sectionIndex ? (
                        <Input
                          value={currentCategoryValue}
                          onChange={(e) => setCurrentCategoryValue(e.target.value)}
                          onBlur={() => handleSaveCategory(sectionIndex)}
                          autoFocus
                          onPressEnter={() => handleSaveCategory(sectionIndex)}
                        />
                      ) : (
                        <span className="category-title">
                          {section.name || 'Category'}
                        </span>
                      )}
                      <Button
                        icon={editingCategory === sectionIndex ? <SaveOutlined /> : <EditOutlined />}
                        onClick={() => (editingCategory === sectionIndex ? handleSaveCategory(sectionIndex) : handleEditCategory(sectionIndex))}
                        type="ghost"
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCategory(sectionIndex)}
                        type="ghost"
                      />
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        icon={<UpOutlined />}
                        onClick={() => handleMoveCategory(sectionIndex, 'up')}
                        disabled={sectionIndex === 0}
                      />
                      <Button
                        icon={<DownOutlined />}
                        onClick={() => handleMoveCategory(sectionIndex, 'down')}
                        disabled={sectionIndex === sections.length - 1}
                      />
                    </Space>
                  </Col>
                </Row>
              }
            >
              <Button type="dashed" className="full-width" icon={<PlusOutlined />} onClick={() => handleAddItem(sectionIndex)}>
                Add Item
              </Button>
              <List
                dataSource={section.items}
                renderItem={(item, itemIndex) => (
                  <List.Item
                    actions={[
                      <Button icon={<UpOutlined />} onClick={() => handleMoveItem(sectionIndex, itemIndex, 'up')} disabled={itemIndex === 0} />,
                      <Button icon={<DownOutlined />} onClick={() => handleMoveItem(sectionIndex, itemIndex, 'down')} disabled={itemIndex === section.items.length - 1} />,
                      <Button icon={<EditOutlined />} onClick={() => openEditModal(sectionIndex, itemIndex)} />,
                      <Button icon={<DeleteOutlined />} onClick={() => handleDeleteItem(sectionIndex, itemIndex)} />,
                    ]}
                  >
                    <div className="item-content">
                      {item.content.image && <img src={getFullUrl(item.content.image)} alt="thumbnail" className="thumbnail" />}
                      <div className="item-text">
                        <strong>{item.content.title}</strong>
                        {item.content.description && `, ${item.content.description}`}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          ))}
          <Button type="dashed" onClick={handleAddCategory} className="full-width bold-button" icon={<PlusOutlined />}>
            Add Publication Category
          </Button>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="save-button">
              Save
            </Button>
            <Button type="default" onClick={resetForm} className="reset-button">
              Reset
            </Button>
          </Form.Item>
          {editingItem && (
            <ItemForm
              visible={!!editingItem}
              item={editingItem.item}
              onSave={(newItem) => handleSaveItem(editingItem.sectionIndex, editingItem.itemIndex, newItem)}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </Form>
      </div>
    </Spin>
  );
};

export default EditPublications;
