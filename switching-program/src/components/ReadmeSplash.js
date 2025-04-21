import React, { useRef, useEffect } from 'react';
import '../styles.css';

// Custom styles for ReadmeSplash consistent with the app theme
const customStyles = {
  readmeContent: {
    backgroundColor: 'var(--bg-dark)',
    padding: '2rem',
    borderRadius: '10px',
    maxWidth: '80%',
    maxHeight: '90%',
    overflowY: 'auto',
    color: 'var(--off-white)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--copper-primary)',
    fontSize: '1.25rem',
  },
  header: {
    backgroundColor: 'var(--charcoal-dark)',
    padding: '1rem',
    borderRadius: '8px 8px 0 0',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '4px solid var(--copper-primary)'
  },
  logo: {
    height: '50px',
    marginRight: '15px',
    boxShadow: '3px 3px 5px rgba(0, 0, 0, 0.3), inset -2px -2px 5px rgba(0, 0, 0, 0.4)'
  },
  heading: {
    color: 'var(--off-white)',
    margin: '0',
    fontSize: '2.2rem',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  section: {
    backgroundColor: 'var(--bg-medium)',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    boxShadow: 'var(--shadow-sm)'
  },
  sectionTitle: {
    color: 'var(--copper-light)',
    borderBottom: '2px solid var(--charcoal-dark)',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    fontSize: '1.8rem'
  },
  subSectionTitle: {
    color: 'var(--off-white)',
    fontSize: '1.5rem',
    marginTop: '1.2rem',
    marginBottom: '0.8rem',
    fontWeight: '600'
  },
  list: {
    marginLeft: '1.5rem',
    marginBottom: '1rem',
    color: 'var(--off-white)',
    fontSize: '1.25rem'
  },
  listItem: {
    marginBottom: '0.5rem',
    lineHeight: '1.6'
  },
  copperText: {
    color: 'var(--copper-light)',
    fontWeight: '600',
    marginBottom: '0.8rem',
    fontSize: '1.4rem'
  },
  button: {
    backgroundColor: 'var(--copper-primary)',
    color: 'var(--off-white)',
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
    backgroundColor: 'var(--copper-dark)',
    transform: 'translateY(-3px)',
    boxShadow: 'var(--shadow-md)'
  }
};

const ReadmeSplash = ({ show, onClose }) => {
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
    <div className="readme-splash">
      <div ref={contentRef} style={customStyles.readmeContent}>
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
            <li style={customStyles.listItem}>Advanced row actions: Insert Above/Below, Duplicate via '+' icon</li>
            <li style={customStyles.listItem}>Copy the row above for quick duplication</li>
            <li style={customStyles.listItem}>Undo/Redo your changes</li>
            <li style={customStyles.listItem}>Resizable table columns</li>
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
          <p>Click and hold the grip handle (<i className="bi bi-grip-vertical"></i>) on the left of a row to drag it to a new position.</p>
          
          <p style={customStyles.copperText}>Inserting & Duplicating Rows:</p>
          <p>Click the plus icon (<i className="bi bi-plus-circle-fill"></i>) on any non-reverse row to open a menu with options to Insert Above, Insert Below, or Duplicate the row.</p>
          
          <p style={customStyles.copperText}>Undo/Redo:</p>
          <p>Made a mistake? Use the Undo (<i className="bi bi-arrow-counterclockwise"></i>) and Redo (<i className="bi bi-arrow-clockwise"></i>) buttons to step through your recent actions.</p>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={onClose}
          style={{ display: 'block', margin: '0 auto', marginTop: '1.5rem' }}
        >
          Close & Start Using
        </button>
      </div>
    </div>
  );
};

export default ReadmeSplash;