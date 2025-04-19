import React from 'react';
import '../styles.css';  // Ensure styles are imported to apply the custom styles

const Header = () => {
  // Use the same approach as in ProgramTable for consistent logo handling
  const logoUrl = process.env.NODE_ENV === 'production' 
    ? 'https://ma-fs.github.io/hv-switching-advanced/logo.png' 
    : `${process.env.PUBLIC_URL}/logo.png`;

  return (
    <header className="header">
      <div className="header-content">
        <img 
          src={logoUrl} 
          alt="Logo" 
          className="logo" 
          style={{ width: '250px', height: '250px' }} 
          onError={(e) => {
            console.error('Failed to load header logo:', e.target.src);
            e.target.src = `${process.env.PUBLIC_URL}/logo.png`;
          }}
        />
        <h1 className="title">High Voltage Switching Program Creator</h1>
      </div>
    </header>
  );
};

export default Header;