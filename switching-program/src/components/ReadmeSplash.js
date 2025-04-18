import React from 'react';
import '../styles.css';

// Custom styles for ReadmeSplash
const customStyles = {
  readmeContent: {
    backgroundColor: '#FFFFFF',
    padding: '2rem',
    borderRadius: '10px',
    maxWidth: '80%',
    maxHeight: '90%',
    overflowY: 'auto',
    color: '#2E2E2E',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: '1px solid #D4D4D4',
  },
  header: {
    backgroundColor: '#2B2B2B',
    padding: '1rem',
    borderRadius: '8px 8px 0 0',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '4px solid #FFB347'
  },
  logo: {
    height: '50px',
    marginRight: '15px',
    boxShadow: '3px 3px 5px rgba(0, 0, 0, 0.2), inset -2px -2px 5px rgba(0, 0, 0, 0.3)'
  },
  heading: {
    color: '#F7F7F7',
    margin: '0',
    fontSize: '1.8rem',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  section: {
    backgroundColor: '#F7F7F7',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  sectionTitle: {
    color: '#A84B2A',
    borderBottom: '2px solid #E0E0E0',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    fontSize: '1.4rem'
  },
  subSectionTitle: {
    color: '#2E2E2E',
    fontSize: '1.1rem',
    marginTop: '1.2rem',
    marginBottom: '0.8rem',
    fontWeight: '600'
  },
  list: {
    marginLeft: '1.5rem',
    marginBottom: '1rem'
  },
  listItem: {
    marginBottom: '0.5rem',
    lineHeight: '1.5'
  },
  copperText: {
    color: '#A84B2A',
    fontWeight: '600',
    marginBottom: '0.8rem'
  },
  button: {
    backgroundColor: '#A84B2A',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '3px',
    fontWeight: '600',
    marginTop: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.3s',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  }
};

const ReadmeSplash = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="readme-splash">
      <div style={customStyles.readmeContent}>
        {/* Header with logo */}
        <div style={customStyles.header}>
          <img src={`${process.env.PUBLIC_URL}/logo.jpg`} alt="HV Switching Logo" style={customStyles.logo} />
          <h1 style={customStyles.heading}>High Voltage Switching Program Creator</h1>
        </div>
        
        {/* Overview section */}
        <div style={customStyles.section}>
          <h2 style={customStyles.sectionTitle}>Overview</h2>
          <p>The HV Switching Program Creator is a specialized web application designed for electrical engineers, technicians, and operators to create, edit, and manage high voltage switching programs. It provides an intuitive spreadsheet-like interface that simplifies the complex task of creating detailed switching sequences for high voltage electrical equipment.</p>
        </div>
        
        {/* Key Features section */}
        <div style={customStyles.section}>
          <h2 style={customStyles.sectionTitle}>Key Features</h2>
          <ul style={customStyles.list}>
            <li style={customStyles.listItem}><strong>Dynamic Row Management</strong>: Add, delete, and reorder rows with drag-and-drop functionality</li>
            <li style={customStyles.listItem}><strong>Real-time Collaboration</strong>: Auto-save functionality ensures work is never lost</li>
            <li style={customStyles.listItem}><strong>Reverse Section Support</strong>: Automatically create and manage reverse sequences</li>
            <li style={customStyles.listItem}><strong>PDF Export</strong>: Generate professional PDF documents with custom formatting</li>
            <li style={customStyles.listItem}><strong>Program Management</strong>: Save, load, and manage multiple switching programs</li>
            <li style={customStyles.listItem}><strong>Responsive Design</strong>: Works on desktop and tablet devices</li>
            <li style={customStyles.listItem}><strong>Column Resizing</strong>: Customize your view with resizable columns</li>
            <li style={customStyles.listItem}><strong>Intuitive Controls</strong>: Insert rows above or below, copy from above, and more</li>
          </ul>
        </div>

        {/* Tips section */}
        <div style={customStyles.section}>
          <h2 style={customStyles.sectionTitle}>Tips for Developing HV Switching Programs</h2>
          
          <h3 style={customStyles.subSectionTitle}>1. Program Planning</h3>
          <ul style={customStyles.list}>
            <li style={customStyles.listItem}><strong>Start with a Clear Objective</strong>: Define the purpose of the switching operation before creating steps</li>
            <li style={customStyles.listItem}><strong>Reference Equipment Diagrams</strong>: Always have up-to-date single-line diagrams available</li>
            <li style={customStyles.listItem}><strong>Follow Standard Sequences</strong>: Use industry-standard sequences for common operations</li>
            <li style={customStyles.listItem}><strong>Consider Safety First</strong>: Plan verification steps at critical points in the program</li>
          </ul>
          
          <h3 style={customStyles.subSectionTitle}>2. Using the Application Effectively</h3>
          <ul style={customStyles.list}>
            <li style={customStyles.listItem}><strong>Form Information</strong>: Fill out all form fields at the top for proper documentation</li>
            <li style={customStyles.listItem}><strong>Use Consistent Terminology</strong>: Maintain consistent naming conventions for equipment</li>
            <li style={customStyles.listItem}><strong>Item Numbering</strong>: The application automatically handles item numbering, even through reverse sections</li>
            <li style={customStyles.listItem}><strong>Column Organization</strong>: Follow standard formats for Operator, Location, kV, Type, Label, Instruction, Time, and Initial</li>
          </ul>
          
          <h3 style={customStyles.subSectionTitle}>3. Advanced Features</h3>
          <ul style={customStyles.list}>
            <li style={customStyles.listItem}><strong>Reverse Sections</strong>: Use the "Reverse" button to automatically create the reverse sequence of operations</li>
            <li style={customStyles.listItem}><strong>Creating Complex Programs</strong>: Use clear demarcations for parallel operations, insert verification steps at key points</li>
            <li style={customStyles.listItem}><strong>Managing Multiple Programs</strong>: Save programs with descriptive names for easy retrieval</li>
          </ul>
          
          <h3 style={customStyles.subSectionTitle}>4. Program Structure</h3>
          <h2 style={customStyles.sectionTitle}>A Typical HV Switching Program Follows This Structure:</h2>
          <ol style={customStyles.list}>
            <li style={customStyles.listItem}><strong>Header Information</strong>: Program details, preparation/authorization information</li>
            <li style={customStyles.listItem}><strong>Pre-switching Checks</strong>: Safety preparations and equipment checks</li>
            <li style={customStyles.listItem}><strong>Isolation Sequence</strong>: Steps to isolate the equipment</li>
            <li style={customStyles.listItem}><strong>Earthing Sequence</strong>: Steps to apply safety earths</li>
            <li style={customStyles.listItem}><strong>Work Permit</strong>: Issuance of work permit</li>
            <li style={customStyles.listItem}><strong>Reverse Section</strong>: Steps to return equipment to service (remove earths, remove isolation, restore normal configuration)</li>
          </ol>
        </div>

        <button 
          style={customStyles.button} 
          onClick={onClose}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#8A3D22';
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#A84B2A';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default ReadmeSplash;