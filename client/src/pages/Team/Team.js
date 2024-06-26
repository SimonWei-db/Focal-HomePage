import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Tooltip, Button, Tag, Spin } from 'antd';
import './Team.css';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import { FaArrowUp } from 'react-icons/fa';
import teamService from '../../services/teamService';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Team = () => {
  const [teamData, setTeamData] = useState({
    introduction: '',
    sections: []}
  );
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        let data;
        if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
          const response = await fetch(`${process.env.PUBLIC_URL}/upload_files/Team/team.json?timestamp=${new Date().getTime()}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          data = await response.json();
        } else {
          data = await teamService.getTeamData();
        }
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

    fetchTeamData();

    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar defaultSelectedKey="4" />
      </Header>
      
      <Content style={{ padding: '0' }}>
        <div className="team-background">
          <div className="team-overlay">
            <h1>Team</h1>
          </div>
        </div>
        <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
        <div className="team-content">
          <div className="team-intro-section">
          {teamData.introduction && (
            teamData.introduction.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          )}
          </div>
          {teamData.sections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <Title level={2}>{section.name}</Title>
              <Row gutter={[16, 16]} className="team-row">
                {section.students.map((person, personIdx) => (
                  <Col span={8} key={personIdx} className="team-col">
                    <Tooltip title={`Search for more information on Google Scholar`} placement="topRight" mouseEnterDelay={0.6}>
                      <Card 
                        hoverable 
                        title={person.name} 
                        className="team-card"
                        onClick={() => window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(person.name)}`, '_blank')}
                      >
                        {Object.keys(person).filter(key => key !== 'name' && key !== 'degree_color' &&  key !== 'student_order').map((key, idx) => (
                          <div key={idx}>
                            {key === 'degree' ? (
                              <div>
                                <Text className="card-text">
                                  <strong>{capitalizeWords(key.replace('_', ' '))}: </strong>
                                </Text>
                                <Tag color={person.degree_color} className="card-tag">
                                  {person[key]}
                                </Tag>
                              </div>
                            ) : (
                              <Text className="card-text"> 
                                {person[key] && person[key].trim() !== '' && (
                                  <div> 
                                    <strong>{capitalizeWords(key.replace('_', ' '))}:</strong> {person[key]}
                                    <br />
                                  </div>
                                )}
                              </Text>
                            )}
                          </div>
                        ))}
                      </Card>
                    </Tooltip>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
        {showScrollButton && (
          <Button
            type="primary"
            icon={<FaArrowUp />}
            onClick={scrollToTop}
            className="scroll-to-top-button"
          >
            Scroll to Top
          </Button>
        )}
        </Spin>
      </Content>
      
      <CustomFooter />
    </Layout>
  );
};

export default Team;
