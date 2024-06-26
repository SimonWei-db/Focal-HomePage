import React from 'react';
import './CustomFooter.css';

const CustomFooter = () => (
  <footer className="custom-footer">
    <div className="footer-content">
      <div className="footer-left">
        <h2>Contact Us</h2>
        <p>hranilo@mcmaster.ca</p>
        <p>1280 Main St. W.</p>
        <p>Hamilton, Ontario</p>
        <p>CANADA. L8S 4K1</p>
        
      </div>
      <div className="footer-right">  
        <h2>McMaster University</h2>
        <p><a href="/">Homepage</a></p>
        <p><a href="https://www.eng.mcmaster.ca/ece/">Department of Electrical & Computer Engineering</a></p>
        <p><a href="https://www.mcmaster.ca/">McMaster University</a></p>
        <p><a href="https://library.mcmaster.ca/">Library</a></p>
      </div>
    </div>
    <div className="footer-bottom">
    Copyright © 2024 by Steve Hranilovic. All rights reserved.
    
    {process.env.REACT_APP_AWS_FEATURE === 'true' && (
      <p>This is a demo site created by Xingchen Wei for demonstration purposes only.</p>
    )}
    </div>
  </footer>
);

export default CustomFooter;
