import React, { useRef, useEffect } from 'react';
import '../styles.css';

const WelcomeModal = ({ show, onNewProgram, onClose }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay welcome-overlay">
      <div className="welcome-modal-content" ref={contentRef}>
        <div className="welcome-header">
          <h2>Welcome to HV Switching Program Creator</h2>
        </div>
        <div className="welcome-body">
          <p>
            This application helps you create and manage high voltage switching programs.
            Get started by creating your first program.
          </p>

          <div className="welcome-actions">
            <button className="btn btn-primary btn-lg" onClick={onNewProgram}>
              <i className="bi bi-file-earmark-plus"></i> Create New Program
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="bi bi-x-circle"></i> Explore First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal; 