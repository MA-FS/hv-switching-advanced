import React, { useRef, useEffect } from 'react';
import '../styles.css';

const ConfirmationModal = ({ show, title, message, onConfirm, onCancel }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        onCancel();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onCancel]);

  if (!show) return null;

  // Add inline styles to ensure proper contrast
  const modalContentStyle = {
    backgroundColor: 'var(--bg-dark)',
    color: 'var(--off-white)',
    border: '1px solid var(--copper-primary)'
  };

  const modalTitleStyle = {
    color: 'var(--copper-light)',
    borderBottom: '2px solid var(--copper-primary)',
    paddingBottom: '0.5rem'
  };

  const modalMessageStyle = {
    color: 'var(--off-white)',
    fontSize: '1.1rem'
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={modalContentStyle} ref={contentRef}>
        <h3 className="modal-title" style={modalTitleStyle}>{title}</h3>
        <p className="modal-message" style={modalMessageStyle}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 