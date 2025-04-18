import React from 'react';
import '../styles.css';

// Custom styles for ReadmeSplash
const customStyles = {
  readmeContent: {
    backgroundColor: '#333333',
    padding: '2rem',
    borderRadius: '10px',
    maxWidth: '80%',
    maxHeight: '90%',
    overflowY: 'auto',
    color: '#F7F7F7',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    border: '1px solid #222222',
    fontSize: '1.25rem',
  },
  header: {
    backgroundColor: '#222222',
    padding: '1rem',
    borderRadius: '8px 8px 0 0',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '4px solid #B06745'
  },
  logo: {
    height: '50px',
    marginRight: '15px',
    boxShadow: '3px 3px 5px rgba(0, 0, 0, 0.3), inset -2px -2px 5px rgba(0, 0, 0, 0.4)'
  },
  heading: {
    color: '#F7F7F7',
    margin: '0',
    fontSize: '2.2rem',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  section: {
    backgroundColor: '#444444',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
  },
  sectionTitle: {
    color: '#C27E5F',
    borderBottom: '2px solid #222222',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    fontSize: '1.8rem'
  },
  subSectionTitle: {
    color: '#F7F7F7',
    fontSize: '1.5rem',
    marginTop: '1.2rem',
    marginBottom: '0.8rem',
    fontWeight: '600'
  },
  list: {
    marginLeft: '1.5rem',
    marginBottom: '1rem',
    color: '#E0E0E0',
    fontSize: '1.25rem'
  },
  listItem: {
    marginBottom: '0.5rem',
    lineHeight: '1.6'
  },
  copperText: {
    color: '#C27E5F',
    fontWeight: '600',
    marginBottom: '0.8rem',
    fontSize: '1.4rem'
  },
  button: {
    backgroundColor: '#B06745',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: '600',
    marginTop: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  buttonHover: {
    backgroundColor: '#8A4D2E',
    transform: 'translateY(-3px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)'
  }
};

const ReadmeSplash = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="readme-splash">
      <div style={customStyles.readmeContent}>
        <div style={customStyles.header}>
          <h1 style={customStyles.heading}>HV Coach Switching Program</h1>
        </div>
        
        <div style={customStyles.section}>
          <h2 style={customStyles.sectionTitle}>Welcome!</h2>
          <p>This application helps you create and manage High Voltage Switching Programs efficiently.</p>
          
          <h3 style={customStyles.subSectionTitle}>Key Features:</h3>
          <ul style={customStyles.list}>
            <li style={customStyles.listItem}>Create structured switching programs with easy-to-use interface</li>
            <li style={customStyles.listItem}>Drag-and-drop functionality for reordering rows</li>
            <li style={customStyles.listItem}>Add reverse sections with automatic formatting</li>
            <li style={customStyles.listItem}>Export your programs to PDF format</li>
            <li style={customStyles.listItem}>Save and manage multiple programs</li>
          </ul>
        </div>
        
        <div style={customStyles.section}>
          <h2 style={customStyles.sectionTitle}>Getting Started</h2>
          
          <h3 style={customStyles.subSectionTitle}>Step 1: Enter Program Information</h3>
          <p>Fill in the header details for your switching program. This includes name, program number, location, and work description.</p>
          
          <h3 style={customStyles.subSectionTitle}>Step 2: Add Switching Steps</h3>
          <p>Use the Add Row button to create steps in your program. Each step should include operator, location, apparatus details, and instructions.</p>
          
          <h3 style={customStyles.subSectionTitle}>Step 3: Save Your Program</h3>
          <p>Enter a name for your program in the input field at the bottom and click "Save Program" to store it for future use.</p>
          
          <h3 style={customStyles.subSectionTitle}>Step 4: Export as PDF (When Ready)</h3>
          <p>Once your program is complete, click the "Export to PDF" button to generate a professionally formatted document.</p>
        </div>
        
        <div style={customStyles.section}>
          <h2 style={customStyles.sectionTitle}>Additional Tips</h2>
          <p style={customStyles.copperText}>Using Reverse Sections:</p>
          <p>Click the "Reverse" button to add a reverse section to your program. This creates a clearly marked separator in your switching program.</p>
          
          <p style={customStyles.copperText}>Rearranging Steps:</p>
          <p>You can drag and drop rows to reorder your switching steps as needed.</p>
          
          <p style={customStyles.copperText}>Autosave:</p>
          <p>Your work is automatically saved while you edit your current program.</p>
        </div>
        
        <button 
          style={customStyles.button} 
          onClick={onClose}
          onMouseOver={(e) => {
            Object.assign(e.target.style, customStyles.buttonHover);
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = customStyles.button.backgroundColor;
            e.target.style.transform = 'none';
            e.target.style.boxShadow = 'none';
          }}
        >
          Close & Start Using
        </button>
      </div>
    </div>
  );
};

export default ReadmeSplash;