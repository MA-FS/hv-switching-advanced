import React from 'react';
import '../styles.css';

const ReadmeSplash = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="readme-splash">
      <div className="readme-content">
        <h1>Welcome to High Voltage Switching Program Creator</h1>
        <p>This tool allows you to create, edit, and export high voltage switching programs in an intuitive spreadsheet-like interface.</p>
        
        <h2>Features</h2>
        <ul>
          <li>Dynamic row management: Add, delete, and reorder rows</li>
          <li>Drag and drop functionality for easy row reordering</li>
          <li>Resizable columns for customized view</li>
          <li>Automatic item numbering</li>
          <li>Reverse section support</li>
          <li>Export to PDF with custom formatting</li>
          <li>User-friendly and elegant design</li>
        </ul>

        <h2>How to Use</h2>
        <ol>
          <li>Fill out the information form at the top of the page with relevant details.</li>
          <li>Use the table below to create your switching program:
            <ul>
              <li>Click "Add Row" to add a new row to the table.</li>
              <li>Use "Copy From Above" to duplicate the last row (excluding certain fields).</li>
              <li>Click "Reverse" to add a reverse section (can only be done once per program).</li>
            </ul>
          </li>
          <li>Click and drag rows to reorder them.</li>
          <li>Use the delete button (red X) at the end of each row to remove it.</li>
          <li>Click "Export to PDF" to generate a formatted PDF of your program.</li>
        </ol>

        <button className="btn btn-primary" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
};

export default ReadmeSplash;