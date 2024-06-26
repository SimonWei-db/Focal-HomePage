import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Card, List, Row, Col, Space, Spin, message, Tag, Alert } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import teamService from '../../../services/teamService';
import StudentForm from './studentForm';
import './EditTeam.css';

const EditTeam = () => {
  const [teamData, setTeamData] = useState({
    introduction: '',
    sections: []
  });
  const [editingItem, setEditingItem] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [currentSectionValue, setCurrentSectionValue] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      let data = await teamService.getTeamData();
      data = JSON.parse(data?.content);
      data.sections.sort((a, b) => a.display_order - b.display_order).forEach(section => {
        section.students.sort((a, b) => a.student_order - b.student_order);
      });
      setTeamData(data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const updateDisplayOrder = (sections) => {
    return sections.map((section, index) => ({
      ...section,
      display_order: index + 1
    }));
  };

  const updateStudentOrder = (students) => {
    return students.map((student, index) => ({
      ...student,
      student_order: index + 1
    }));
  };

  const handleAddSection = () => {
    const newSection = { name: 'New Section', students: [], display_order: teamData.sections.length + 1 };
    const newSections = updateDisplayOrder([...teamData.sections, newSection]);
    setTeamData({
      ...teamData,
      sections: newSections
    });
    setUnsavedChanges(true);
  };

  const handleDeleteSection = (index) => {
    const sections = [...teamData.sections];
    const section = sections[index];

    if (section.students.length > 0) {
      Modal.error({
        title: 'Unable to Delete Section',
        content: 'This section cannot be deleted because it contains students. Please delete the students first.',
      });
    } else {
      Modal.confirm({
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this section?',
        onOk: () => {
          sections.splice(index, 1);
          const updatedSections = updateDisplayOrder(sections);
          setTeamData({
            ...teamData,
            sections: updatedSections
          });
          setUnsavedChanges(true);
        },
        onCancel() {
          console.log('Deletion cancelled');
        },
      });
    }
  };

  const handleAddStudent = (sectionIndex) => {
    const newSections = [...teamData.sections];
    const newStudent = {
      name: 'New People',
      student_order: newSections[sectionIndex].students.length + 1
    };
    newSections[sectionIndex].students.unshift(newStudent);
    newSections[sectionIndex].students = updateStudentOrder(newSections[sectionIndex].students);
    setTeamData({
      ...teamData,
      sections: newSections
    });
    setUnsavedChanges(true);
  };

  const handleDeleteStudent = (sectionIndex, studentIndex) => {
    const newSections = [...teamData.sections];
    newSections[sectionIndex].students.splice(studentIndex, 1);
    newSections[sectionIndex].students = updateStudentOrder(newSections[sectionIndex].students);
    setTeamData({
      ...teamData,
      sections: newSections
    });
    setUnsavedChanges(true);
  };

  const handleMoveStudent = (sectionIndex, studentIndex, direction) => {
    const newSections = [...teamData.sections];
    const students = newSections[sectionIndex].students;

    if (direction === 'up' && studentIndex > 0) {
      [students[studentIndex - 1], students[studentIndex]] = [students[studentIndex], students[studentIndex - 1]];
    } else if (direction === 'down' && studentIndex < students.length - 1) {
      [students[studentIndex + 1], students[studentIndex]] = [students[studentIndex], students[studentIndex + 1]];
    }

    newSections[sectionIndex].students = updateStudentOrder(students);
    setTeamData({
      ...teamData,
      sections: newSections
    });
    setUnsavedChanges(true);
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...teamData.sections];
    newSections[index][field] = value;
    setTeamData({
      ...teamData,
      sections: newSections
    });
    setUnsavedChanges(true);
  };

  const handleMoveSection = (index, direction) => {
    const newSections = [...teamData.sections];

    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    }

    const updatedSections = updateDisplayOrder(newSections);
    setTeamData({
      ...teamData,
      sections: updatedSections
    });
    setUnsavedChanges(true);
  };

  const openEditModal = (sectionIndex, studentIndex) => {
    setEditingItem({ sectionIndex, studentIndex, student: teamData.sections[sectionIndex].students[studentIndex] });
  };

  const handleSaveStudent = (sectionIndex, studentIndex, newStudent) => {
    const newSections = [...teamData.sections];
    newSections[sectionIndex].students[studentIndex] = newStudent;
    newSections[sectionIndex].students = updateStudentOrder(newSections[sectionIndex].students);
    setTeamData({
      ...teamData,
      sections: newSections
    });
    setEditingItem(null);
    setUnsavedChanges(true);
  };

  const onFinish = async () => {
    setLoading(true);
    await teamService.updateTeamData(teamData)
      .then(() => {
        fetchTeamData();
        message.success('Team information updated successfully!');
        setUnsavedChanges(false);
      })
      .catch((error) => {
        console.error('Error updating team data:', error);
        message.error('Failed to update team information.');
        setLoading(false);
      });
    setLoading(false);
  };

  const resetForm = () => {
    fetchTeamData();
    setEditingItem(null);
    setEditingSection(null);
    setCurrentSectionValue('');
    setUnsavedChanges(false);
  };

  const handleEditSection = (index) => {
    setEditingSection(index);
    setCurrentSectionValue(teamData.sections[index].name);
  };

  const handleSaveSection = (index) => {
    handleSectionChange(index, 'name', currentSectionValue);
    setEditingSection(null);
    setUnsavedChanges(true);
  };

  return (
    <Spin spinning={loading} tip="Loading..." className="spin-center">
      <div className="edit-team">
        <h2>Edit Team</h2>
        {unsavedChanges && (
          <Alert
            message="You have unsaved changes"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form name="edit_team" onFinish={onFinish} className="admin-form">
          <Form.Item label={<strong>Introduction</strong>} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
            <Input.TextArea
              value={teamData.introduction}
              onChange={(e) => {setTeamData({ ...teamData, introduction: e.target.value }); setUnsavedChanges(true);}}
              autoSize={{ minRows: 3, maxRows: 10 }}
            />
          </Form.Item>
          
          {teamData.sections.map((section, sectionIndex) => (
            <Card
              key={section.display_order}
              title={
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space>
                      {editingSection === sectionIndex ? (
                        <Input
                          value={currentSectionValue}
                          onChange={(e) => setCurrentSectionValue(e.target.value)}
                          onBlur={() => handleSaveSection(sectionIndex)}
                          autoFocus
                          onPressEnter={() => handleSaveSection(sectionIndex)}
                        />
                      ) : (
                        <span className="section-title">
                          {section.name || 'Section'}
                        </span>
                      )}
                      <Button
                        icon={editingSection === sectionIndex ? <SaveOutlined /> : <EditOutlined />}
                        onClick={() => (editingSection === sectionIndex ? handleSaveSection(sectionIndex) : handleEditSection(sectionIndex))}
                        type="ghost"
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteSection(sectionIndex)}
                        type="ghost"
                      />
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        icon={<UpOutlined />}
                        onClick={() => handleMoveSection(sectionIndex, 'up')}
                        disabled={sectionIndex === 0}
                      />
                      <Button
                        icon={<DownOutlined />}
                        onClick={() => handleMoveSection(sectionIndex, 'down')}
                        disabled={sectionIndex === teamData.sections.length - 1}
                      />
                    </Space>
                  </Col>
                </Row>
              }
            >
              <Button type="dashed" className="full-width" icon={<PlusOutlined />} onClick={() => handleAddStudent(sectionIndex)}>
                Add People
              </Button>
              <List
                dataSource={section.students}
                renderItem={(student, studentIndex) => (
                  <List.Item
                    actions={[
                      <Button icon={<UpOutlined />} onClick={() => handleMoveStudent(sectionIndex, studentIndex, 'up')} disabled={studentIndex === 0} />,
                      <Button icon={<DownOutlined />} onClick={() => handleMoveStudent(sectionIndex, studentIndex, 'down')} disabled={studentIndex === section.students.length - 1} />,
                      <Button icon={<EditOutlined />} onClick={() => openEditModal(sectionIndex, studentIndex)} />,
                      <Button icon={<DeleteOutlined />} onClick={() => handleDeleteStudent(sectionIndex, studentIndex)} />,
                    ]}
                  >
                    <div className="student-content">
                    
                    {student.degree && (
                      <Tag color={student.degree_color} style={{ marginLeft: 8 }}>
                        {student.degree}
                      </Tag>
                    )}
                    <strong>{student.name}</strong>
                    {student.year && `, ${student.year}`}
                    {student.years && `, ${student.years}`}
                  </div>
                  </List.Item>
                )}
              />
            </Card>
          ))}
          <Button type="dashed" onClick={handleAddSection} className="full-width bold-button" icon={<PlusOutlined />}>
            Add Section
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
            <StudentForm
              visible={!!editingItem}
              student={editingItem.student}
              onSave={(newStudent) => handleSaveStudent(editingItem.sectionIndex, editingItem.studentIndex, newStudent)}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </Form>
      </div>
    </Spin>
  );
};

export default EditTeam;
