import React from 'react';
import '../styles.css';

const SaveConfirmation = ({ show }) => {
  if (!show) return null;

  return (
    <div className="save-confirmation">
      Program saved successfully!
    </div>
  );
};

export default SaveConfirmation;