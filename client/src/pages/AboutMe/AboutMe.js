import React, { useState, useEffect } from 'react';
import { Layout, Spin } from 'antd';
import './AboutMe.css';

import Navbar from '../../components/layout/Navbar';
import getFullUrl from '../../utils/urlBuilder'; // 导入urlBuilder
import CustomFooter from '../../components/layout/CustomFooter'; // Import custom Footer component
import aboutMeService from '../../services/aboutMeService';
const { Header, Content } = Layout;

const initialAboutMeContent = {
  profile: {
    image: '',
    name: '',
    degrees: '',
    bio: '' // Bio is a string
  },
  sections: [
    {
      title: '',
      description: '', // Description is now a string
      subSection: [
        {
          image: '',
          title: '',
          description: '',
          points: ['']
        }
      ]
    }
  ]
};

const AboutMe = () => {
  const [aboutMeContent, setAboutMeContent] = useState(initialAboutMeContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutMeContent = async () => {
      try {
        let data;
        if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
          const response = await fetch(`${process.env.PUBLIC_URL}/upload_files/AboutMe/aboutMe.json?timestamp=${new Date().getTime()}`);
          data = await response.json();
          
        } else {
          data = await aboutMeService.getAboutMe();
          data = JSON.parse(data?.content);
        }
        setAboutMeContent(data);
      } catch (error) {
        console.error('Error fetching about_me content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutMeContent();
  }, []);

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar defaultSelectedKey="2" />
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="about-me-background">
          <div className="about-me-overlay">
            <h1>About Me</h1>
          </div>
        </div>
        <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
          <div className="about-me-content">
            <div className="profile-section">
              <img src={getFullUrl(aboutMeContent.profile.image)} alt="Profile" className="profile-image" />
              <div className="profile-text">
                <h2>{aboutMeContent.profile.name}</h2>
                <p><b><i>{aboutMeContent.profile.degrees}</i></b></p>
                {aboutMeContent.profile.bio.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            {aboutMeContent.sections.map((section, index) => (
              <div className="research-section" key={index}>
                <h2>{section.title}</h2>
                <hr className="section-divider" />
                {section.description.split('\n').map((desc, idx) => (
                  <p key={idx} className="indented">{desc}</p>
                ))}
                {section.subSection && section.subSection.map((subSection, ind) => (
                  <div className="research-details" key={ind}>
                    {subSection.image &&
                      <div className="research-image-container">
                        <img src={getFullUrl(subSection.image)} alt="Research" className="research-image" />
                      </div>
                    }
                    <div className="text-content">
                      <h3>{subSection.title}</h3>
                      <p className="indented">{subSection.description}</p>
                      {subSection.points && <ul className="indented">
                        {subSection.points.map(point => <li key={point}>{point}</li>)}
                      </ul>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Spin>
      </Content>
      <CustomFooter /> {/* Use custom Footer component */}
    </Layout>
  );
};

export default AboutMe;
