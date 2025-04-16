import React from 'react';
import '../styles.css';  // Ensure styles are imported to apply the custom styles

const Header = () => (
  <header className="header">
    <div className="header-content">
      <img src={`${process.env.PUBLIC_URL}/logo.jpg`} alt="Logo" className="logo" style={{ width: '150px', height: '150px' }} /> {/* Adjust the width and height values as needed */}
      <h1 className="title">High Voltage Switching Program Creator</h1>
    </div>
  </header>
);

export default Header;