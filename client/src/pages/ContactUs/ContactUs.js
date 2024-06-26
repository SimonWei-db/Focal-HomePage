import React, { useState, useEffect } from 'react';
import { Layout, Card, Tooltip, message, Button, Modal } from 'antd';
import { FaUniversity, FaMapMarkerAlt, FaPhone, FaFax, FaEnvelope, FaCopy, FaMap } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ContactUs.css';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';

const { Header, Content } = Layout;

const ContactUs = () => {
  const [contactData, setContactData] = useState({});
  const [position, setPosition] = useState([43.25887681166174, -79.92118341553328]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/contact_content.json?timestamp=${new Date().getTime()}`)
      .then(response => response.json())
      .then(data => {
        setContactData(data);
        setPosition([data.latitude, data.longitude]);
      })
      .catch(error => console.error('Error fetching contact_content.json:', error));
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar defaultSelectedKey="6" />
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="contactus-background">
          <div className="contactus-overlay">
            <h1>Contact Us</h1>
          </div>
        </div>
        <div className="contactus-content">
          <Card className="contact-card">
            <h2>Contact Information</h2>
            <p>
              <FaUniversity className="icon" />
              <span>{contactData.university}</span>
            </p>
            <p>
              <FaMapMarkerAlt className="icon" />
              <span><strong>Office:</strong> {contactData.office}</span>
            </p>
            <p>
              <FaMapMarkerAlt className="icon" />
              <span><strong>Address:</strong> {contactData.address}</span>
              <Tooltip title="Copy to clipboard">
                <FaCopy className="copy-icon" onClick={() => copyToClipboard(contactData.address)} />
              </Tooltip>
            </p>
            <p>
              <FaPhone className="icon" />
              <span><strong>Tel:</strong> {contactData.phone}</span>
              <Tooltip title="Copy to clipboard">
                <FaCopy className="copy-icon" onClick={() => copyToClipboard(contactData.phone)} />
              </Tooltip>
            </p>
            <p>
              <FaFax className="icon" />
              <span><strong>Fax:</strong> {contactData.fax}</span>
              <Tooltip title="Copy to clipboard">
                <FaCopy className="copy-icon" onClick={() => copyToClipboard(contactData.fax)} />
              </Tooltip>
            </p>
            <p>
              <FaEnvelope className="icon" />
              <span><strong>Email:</strong> {contactData.email}</span>
              <Tooltip title="Copy to clipboard">
                <FaCopy className="copy-icon" onClick={() => copyToClipboard(contactData.email)} />
              </Tooltip>
            </p>
          </Card>
          <Card className="contact-card">
            <h2>Location Map</h2>
            <MapContainer center={position} zoom={17} style={{ height: "400px", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={position}>
                <Popup>{contactData.university}</Popup>
              </Marker>
            </MapContainer>
            <Tooltip title="Click to see detailed map">
              <Button type="primary" icon={<FaMap />} onClick={showModal} style={{ marginTop: '10px', backgroundColor: '#1890ff', borderColor: '#1890ff' }}>
                View Detailed Map
              </Button>
            </Tooltip>
            <Modal
              title="Detailed Map"
              visible={isModalVisible}
              onOk={handleOk}
              onCancel={handleCancel}
              footer={null}
              width={1224} // 设置为图片的实际宽度
            >
              <img src={process.env.PUBLIC_URL + "/images/campusmapBIG.jpg"} alt="Detailed Map" style={{ width: '100%', height: 'auto' }} />
            </Modal>
          </Card>
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default ContactUs;
