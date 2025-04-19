import React, { useEffect, useState } from 'react';
import '../styles.css';

const SaveConfirmation = ({ show }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);
  
  if (!visible) return null;

  return (
    <div className="save-confirmation">
      <i className="bi bi-check-circle-fill" style={{ marginRight: '10px', color: 'var(--success)' }}></i>
      Program saved successfully!
    </div>
  );
};

export default SaveConfirmation;