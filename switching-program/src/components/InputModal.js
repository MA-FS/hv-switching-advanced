import React, { useState, useRef, useEffect } from 'react';
import '../styles.css';

const InputModal = ({ show, title, defaultValue, onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState(defaultValue || '');
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

  useEffect(() => {
    setInputValue(defaultValue || '');
  }, [defaultValue]);

  if (!show) return null;

  const handleConfirm = () => {
    onConfirm(inputValue);
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

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

  return (
    <div className="modal-overlay">
      <div className="input-modal-content" style={modalContentStyle} ref={contentRef}>
        <h3 className="modal-title" style={modalTitleStyle}>{title}</h3>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal; 