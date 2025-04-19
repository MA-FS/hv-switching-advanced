import React, { useState, useEffect } from 'react';
import '../styles.css';

const FloatingButtons = ({ 
  currentProgram, 
  handleUpdateCurrentProgram,
  autoSaveStatus,
  exportPDFFunction,
  handleNewProgram
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Show buttons when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 200); // Show after scrolling 200px
      
      // Detect if user is actively scrolling
      setIsScrolling(true);
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(window.scrollTimeout);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`floating-buttons ${isScrolling ? 'scrolling' : ''}`}>
      <div className="floating-content">
        <h4 className="mr-3">Current Program: {currentProgram}</h4>
        <button className="btn btn-primary" onClick={handleUpdateCurrentProgram}>
          <i className="bi bi-save"></i> Save Current Program
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => exportPDFFunction && exportPDFFunction()} 
          disabled={!exportPDFFunction}
        >
          <i className="bi bi-file-earmark-pdf"></i> Export PDF
        </button>
        <button className="btn btn-warning" onClick={handleNewProgram}>
          <i className="bi bi-file-earmark-plus"></i> New Program
        </button>
        {autoSaveStatus && (
          <span className="auto-save-status">{autoSaveStatus}</span>
        )}
      </div>
    </div>
  );
};

export default FloatingButtons; 