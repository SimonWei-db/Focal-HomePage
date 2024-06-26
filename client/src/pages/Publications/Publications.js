import React, { useState, useEffect } from 'react';
import { Layout, Collapse, message, Button, Spin } from 'antd';
import './Publications.css';
import { FaGoogle, FaEnvelope, FaArrowUp } from 'react-icons/fa';
import getFullUrl from '../../utils/urlBuilder'; // 导入urlBuilder

import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import publicationsService from '../../services/publicationsService';

const { Header, Content } = Layout;
const { Panel } = Collapse;

const Publications = () => {
  const [publicationsContent, setPublicationsContent] = useState([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [activeKey, setActiveKey] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let categories;
        if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
          const response = await fetch(`${process.env.PUBLIC_URL}/upload_files/Publications/categories.json?timestamp=${new Date().getTime()}`);
          categories = await response.json();
        } else {
          categories = await publicationsService.getCategories();
        }
        let  categoryPromises
        if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
          categoryPromises = categories.map(category =>
            fetch(`${process.env.PUBLIC_URL}/upload_files/Publications/category_${category.id}.json?timestamp=${new Date().getTime()}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.json();
              })
              .then(items => ({
                ...category,
                items: items.map(item => ({
                  ...item,
                  content: JSON.parse(item.content)
                })).sort((a, b) => b.content.display_order - a.content.display_order),
              }))
          );
        } else {
          categoryPromises = categories.map(category =>
            publicationsService.getItemsByCategory(category.id).then(items => ({
              ...category,
              items: items.map(item => ({
                ...item,
                content: JSON.parse(item.content)
              })).sort((a, b) => b.content.display_order - a.content.display_order),
            }))
          );
        }
        const sections = await Promise.all(categoryPromises);
        const sortedSections = sections.sort((a, b) => a.category_order - b.category_order);
        setPublicationsContent(sortedSections);
      } catch (error) {
        console.error('Error fetching publications data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

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

  const copyToClipboard = () => {
    const email = 'hranilo@mcmaster.ca';
  
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        message.success('Email address copied to clipboard.');
      }).catch(err => {
        console.error('Failed to copy email: ', err);
        message.error('Failed to copy email address.');
      });
    } else {
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('Email address copied to clipboard.');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        message.error('Fallback: Failed to copy email address.');
      }
      document.body.removeChild(textArea);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCollapseChange = (key) => {
    setActiveKey(key);
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar defaultSelectedKey="3" />
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="publications-background">
          <div className="publications-overlay">
            <h1>Publications</h1>
          </div>
        </div>
        <div className="publications-content">
          <div className="intro-section">
            <p>
              Click for the {' '}
              <a href="http://scholar.google.ca/citations?user=0SF-hrcAAAAJ&hl=en&oi=ao" target="_blank" rel="noopener noreferrer">
                Google Scholar citation profile
              </a>
              {' '}
              <FaGoogle 
                className="icon" 
                style={{ color: '#4285F4', cursor: 'pointer' }} 
                onClick={() => window.open('http://scholar.google.ca/citations?user=0SF-hrcAAAAJ&hl=en&oi=ao', '_blank')}
              /> 
              of our work.
            </p>
            <p>
              Please download the publications you are interested in or email me for unpublished manuscripts: {' '}
              <a
                onClick={copyToClipboard} 
              >
               hranilo@mcmaster.ca
              </a> 
              {' '}
              <FaEnvelope 
                className="icon" 
                style={{ color: '#D44638', cursor: 'pointer' }} 
                onClick={copyToClipboard}
              />
            </p>
          </div>
          <Spin spinning={loading} tip="Loading..." style={{ display: 'block' }}>
            <Collapse accordion activeKey={activeKey} onChange={handleCollapseChange}>
              {publicationsContent.map((section, index) => (
                <Panel header={`${section.name} (${section.items.length})`} key={index} id={`panel-${index}`}>
                  {section.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="publication-item">
                        {item.content.image && (
                          <img src={getFullUrl(item.content.image)} alt="Publication" className="publication-image" />
                        )}
                        <div className="publication-text">
                          <h3>
                            <strong>{item.content.title}</strong>
                            {item.content.description && `, ${item.content.description}`}
                          </h3>
                          {Object.entries(item.content).map(([key, value]) => {
                            if (key !== 'title' && key !== 'description' && key !== 'image' && key !== 'links' && key !== 'display_order') {
                              return (
                                <p key={key}>
                                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                </p>
                              );
                            }
                            return null;
                          })}
                          {item.content.links && (
                            <p>
                              <strong>{item.content.links.length > 1 ? 'Links: ' : 'Link: '}</strong>
                              {item.content.links.map((link, linkIdx) => {
                                const fullUrl = getFullUrl(link.url);
                                const isDownloadable = fullUrl.includes('?download=true');

                                let linkElement;

                                if (process.env.REACT_APP_ECE_WEBSITE === 'true' || process.env.REACT_APP_ECE_STANDALONE === 'true') {
                                  // Extract the filename parts manually
                                  const fileName = link.url.split('/').pop().split('?')[0];
                                  const parts = fileName.split('-');
                                  const extension = fileName.split('.').pop();
                                  const originalName = parts.slice(1, -2).join('-') + '.' + extension; // Ignore the first part ('upload') and combine the rest to form the original filename

                                  linkElement = (
                                    <a
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      {...(isDownloadable && { download: originalName })}
                                    >
                                      {link.text}
                                    </a>
                                  );
                                } else {
                                  linkElement = (
                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                      {link.text}
                                    </a>
                                  );
                                }

                                return (
                                  <React.Fragment key={linkIdx}>
                                    {linkElement}
                                    {linkIdx < item.content.links.length - 1 && ", "}
                                  </React.Fragment>
                                );
                              })}

                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        {idx < section.items.length - 1 && <hr className="section-divider" />}
                      </div>
                    </div>
                  ))}
                </Panel>
              ))}
            </Collapse>
            <p>
            IEEE Copyright Statement: IEEE owns the copyright to all material included above that is published by the IEEE. Personal use of this material is permitted. However, permission to use this material for any other purposes must be obtained from the IEEE by sending an email to pubs-permissions@ieee.org.
            </p>        
          </Spin>
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
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default Publications;
