import React, { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { debounce } from 'lodash';
import InfoForm from './components/InfoForm';
import ProgramTable from './components/ProgramTable';
import Footer from './components/Footer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SaveConfirmation from './components/SaveConfirmation';
import ReadmeSplash from './components/ReadmeSplash';
import ConfirmationModal from './components/ConfirmationModal';
import InputModal from './components/InputModal';
import FloatingButtons from './components/FloatingButtons';
import WelcomeModal from './components/WelcomeModal';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';

const App = () => {
  const [formData, setFormData] = useState({
    name: '',
    programNo: '',
    location: '',
    workDescription: '',
    preparedByName: '',
    preparedBySignature: '',
    preparedByTime: '',
    preparedByDate: '',
    checkedByName: '',
    checkedBySignature: '',
    checkedByTime: '',
    checkedByDate: '',
    authorisedName: '',
    authorisedSignature: '',
    authorisedTime: '',
    authorisedDate: '',
    referenceDrawings: ''
  });
  const [tableData, setTableData] = useState([]);
  const [programs, setPrograms] = useState({});
  const [currentProgramName, setCurrentProgramName] = useState('');
  const [currentProgram, setCurrentProgram] = useState('');
  const [saveConfirmation, setSaveConfirmation] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [inputModal, setInputModal] = useState({
    show: false,
    title: '',
    defaultValue: '',
    placeholder: '',
    onConfirm: null
  });
  const [exportPDFFunction, setExportPDFFunction] = useState(null);

  useEffect(() => {
    localforage.getItem('hasVisited').then(hasVisited => {
      if (!hasVisited) {
        setShowReadme(true);
        localforage.setItem('hasVisited', true);
      }
    });

    localforage.getItem('programs').then(savedPrograms => {
      if (savedPrograms) {
        setPrograms(savedPrograms);
      } else {
        setShowWelcomeModal(true);
      }
    });
  }, []);

  useEffect(() => {
    if (Object.keys(programs).length > 0) {
      console.log('Persisting programs state to storage...');
      // Persist to localforage (async)
      localforage.setItem('programs', programs).catch(error => {
        console.error('Error saving programs to localforage:', error);
        // Handle error appropriately, maybe show a notification
      });
      // Persist to localStorage (sync) as a backup or for other purposes
      try {
        localStorage.setItem('savedPrograms', JSON.stringify(programs));
      } catch (error) {
        console.error('Error saving programs to localStorage:', error);
        // Handle potential storage quota errors
      }
    } else {
       // Optional: Handle the case where programs become empty (e.g., delete the last one)
       // localforage.removeItem('programs');
       // localStorage.removeItem('savedPrograms');
    }
  }, [programs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTableDataChange = useCallback((newTableData) => {
    setTableData(newTableData);
  }, []);

  const handleSaveProgram = () => {
    if (currentProgramName.trim() === '') {
      setInputModal({
        show: true,
        title: 'Save Program',
        defaultValue: '',
        placeholder: 'Enter program name',
        onConfirm: (programName) => {
          if (programName.trim() === '') {
            setConfirmationModal({
              show: true,
              title: 'Error',
              message: 'Program name cannot be empty.',
              onConfirm: () => {
                setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
                handleSaveProgram();
              }
            });
          } else {
            if (programs[programName] && programName !== currentProgram) {
              setConfirmationModal({
                show: true,
                title: 'Overwrite Program',
                message: 'A program with this name already exists. Do you want to overwrite it?',
                onConfirm: () => {
                  setPrograms({ ...programs, [programName]: { formData, tableData } });
                  setCurrentProgram(programName);
                  setCurrentProgramName('');
                  setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
                  setSaveConfirmation(true);
                }
              });
            } else {
              setPrograms({ ...programs, [programName]: { formData, tableData } });
              setCurrentProgram(programName);
              setCurrentProgramName('');
              setSaveConfirmation(true);
            }
          }

          setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null });
        },
        onCancel: () => {
          setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null });
        }
      });
      return;
    }

    if (currentProgramName === currentProgram) {
      setPrograms({ ...programs, [currentProgramName]: { formData, tableData } });
      setCurrentProgramName('');
      setSaveConfirmation(true);
      return;
    }

    if (programs[currentProgramName] && currentProgramName !== currentProgram) {
      setConfirmationModal({
        show: true,
        title: 'Overwrite Program',
        message: 'Are you sure you want to overwrite this program?',
        onConfirm: () => {
          setPrograms({ ...programs, [currentProgramName]: { formData, tableData } });
          setCurrentProgram(currentProgramName);
          setCurrentProgramName('');
          setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
          setSaveConfirmation(true);
        }
      });
      return;
    }

    setPrograms({ ...programs, [currentProgramName]: { formData, tableData } });
    setCurrentProgram(currentProgramName);
    setCurrentProgramName('');
    setSaveConfirmation(true);
  };

  const handleUpdateCurrentProgram = () => {
    if (currentProgram.trim() === '') {
      setConfirmationModal({
        show: true,
        title: 'Error',
        message: 'No program is currently loaded.',
        onConfirm: () => {
          setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
        }
      });
      return;
    }

    const serializedTableData = JSON.parse(JSON.stringify(tableData));

    setPrograms(prevPrograms => ({
      ...prevPrograms,
      [currentProgram]: { formData, tableData: serializedTableData }
    }));

    setSaveConfirmation(true);

    setTimeout(() => {
      setSaveConfirmation(false);
    }, 3000);
  };

  const handleLoadProgram = (programName) => {
    setConfirmationModal({
      show: true,
      title: 'Load Program',
      message: 'Are you sure you want to open this program?',
      onConfirm: () => {
        const program = programs[programName];
        setFormData(program.formData);
        setTableData(program.tableData);
        setCurrentProgram(programName);

        setTimeout(() => {
          debouncedAutoSave(program.formData, program.tableData, programName);
        }, 100);

        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleDeleteProgram = (programName) => {
    setConfirmationModal({
      show: true,
      title: 'Delete Program',
      message: 'Are you sure you want to delete this program?',
      onConfirm: () => {
        const newPrograms = { ...programs };
        delete newPrograms[programName];
        setPrograms(newPrograms);

        // Persist the deletion to both storage methods
        localforage.setItem('programs', newPrograms);
        localStorage.setItem('savedPrograms', JSON.stringify(newPrograms));

        if (programName === currentProgram) {
          setCurrentProgram('');
          setFormData({
            name: '',
            programNo: '',
            location: '',
            workDescription: '',
            preparedByName: '',
            preparedBySignature: '',
            preparedByTime: '',
            preparedByDate: '',
            checkedByName: '',
            checkedBySignature: '',
            checkedByTime: '',
            checkedByDate: '',
            authorisedName: '',
            authorisedSignature: '',
            authorisedTime: '',
            authorisedDate: '',
            referenceDrawings: ''
          });
          setTableData([]);
        }
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleNewProgram = () => {
    const hasContent =
      tableData.length > 0 ||
      Object.values(formData).some(value => value.trim() !== '');

    if (hasContent) {
      setConfirmationModal({
        show: true,
        title: 'New Program',
        message: 'Are you sure you want to create a new program? All unsaved changes will be lost.',
        onConfirm: () => {
          promptForNewProgram();
          setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
        }
      });
    } else {
      promptForNewProgram();
    }
  };

  const promptForNewProgram = () => {
    setInputModal({
      show: true,
      title: 'Create New Program',
      defaultValue: '',
      placeholder: 'Enter program name (optional)',
      onConfirm: (programName) => {
        setCurrentProgram(programName || '');
        setFormData({
          name: '',
          programNo: '',
          location: '',
          workDescription: '',
          preparedByName: '',
          preparedBySignature: '',
          preparedByTime: '',
          preparedByDate: '',
          checkedByName: '',
          checkedBySignature: '',
          checkedByTime: '',
          checkedByDate: '',
          authorisedName: '',
          authorisedSignature: '',
          authorisedTime: '',
          authorisedDate: '',
          referenceDrawings: ''
        });
        setTableData([]);
        setCurrentProgramName('');
        setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null });
      },
      onCancel: () => {
        setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null });
      }
    });
  };

  const handleRenameProgram = (oldName) => {
    setInputModal({
      show: true,
      title: 'Rename Program',
      defaultValue: oldName,
      onConfirm: (newName) => {
        if (newName && newName !== oldName) {
          if (programs[newName]) {
            setConfirmationModal({
              show: true,
              title: 'Error',
              message: 'A program with this name already exists.',
              onConfirm: () => {
                setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
                handleRenameProgram(oldName);
              }
            });
            setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null });
            return;
          }

          // Copy the program data with the new name first
          const newPrograms = { ...programs };
          newPrograms[newName] = { ...newPrograms[oldName] };

          // Update the current program variables first if needed
          const isCurrentProgram = currentProgram === oldName;
          if (isCurrentProgram) {
            setCurrentProgram(newName);
            // Only update currentProgramName if it matches the old name
            if (currentProgramName === oldName) {
              setCurrentProgramName(newName);
            }
          }

          // Remove the old program name entry
          delete newPrograms[oldName];

          // Update state immediately to reflect the rename
          setPrograms(newPrograms);

          // Storage updates are now handled by the useEffect hook watching 'programs' state.
          // Removed localforage.setItem and subsequent logic here.
        }

        setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null });
      }
    });
  };

  const handleToggleReadme = () => {
    setShowReadme(!showReadme);
  };

  const setExportPDF = useCallback((exportFn) => {
    setExportPDFFunction(() => exportFn);
  }, []);

  const debouncedAutoSave = useCallback(
    debounce((formData, tableData, programName) => {
      if (programName && formData && tableData) {
        setAutoSaveStatus('saving');

        // Use functional update to avoid issues with stale state
        setPrograms(prevPrograms => {
          // Create the updated entry
          const updatedEntry = {
            [programName]: {
              formData,
              tableData,
              lastModified: new Date().toISOString()
            }
          };
          // Merge with previous state
          return { ...prevPrograms, ...updatedEntry };
        });

        // Persistence is handled by the useEffect watching 'programs'
        // Removed localStorage.setItem and localforage.setItem calls here.

        // Update autosave status optimistically or after state update confirmation if needed
        // For simplicity, we'll update it here, assuming state update is fast enough.
        // A more robust approach might wait for the useEffect to finish saving.
        setAutoSaveStatus('saved');
      }
    }, 1000),
    []
  );

  useEffect(() => {
    if (currentProgram && formData && tableData) {
      debouncedAutoSave(formData, tableData, currentProgram);
    }
  }, [formData, tableData, currentProgram, debouncedAutoSave]);

  const handlePDFError = (errorMessage) => {
    setConfirmationModal({
      show: true,
      title: 'PDF Generation Error',
      message: errorMessage,
      onConfirm: () => {
        setConfirmationModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container-fluid my-4">
        <div className="header-container">
          <div className="left-content">
            {currentProgram ? (
              <>
                <h4 className="mr-3">Current Program: {currentProgram}</h4>
                <button className="btn btn-primary" onClick={handleUpdateCurrentProgram}>
                  <i className="bi bi-save"></i> Save Current Program
                </button>
              </>
            ) : (
              <div className="unsaved-program-indicator">
                <i className="bi bi-file-earmark"></i>
                Unsaved Program
              </div>
            )}
            <span className={`auto-save-status ${autoSaveStatus}`}>
              {autoSaveStatus === 'saving' ? 'Saving...' : 'All changes saved'}
            </span>
          </div>
          <div className="right-content">
            <button
              className="btn btn-primary mr-2"
              onClick={() => exportPDFFunction && exportPDFFunction()}
              title="Export the current program to a PDF document"
              disabled={!exportPDFFunction}
            >
              <i className="bi bi-file-earmark-pdf"></i> Export PDF
            </button>
            <button className="btn btn-warning mr-2" onClick={handleNewProgram}>
              <i className="bi bi-file-earmark-plus"></i> New Program
            </button>
            <button className="btn btn-info" onClick={handleToggleReadme}>
              <i className="fas fa-question-circle"></i> View Readme
            </button>
          </div>
        </div>
        <div className="container">
          <InfoForm formData={formData} handleChange={handleChange} />
          <hr className="separator" />
          <ProgramTable
            tableData={tableData}
            setTableData={handleTableDataChange}
            formData={formData}
            onExportPDF={setExportPDF}
            onError={handlePDFError}
          />

          <div className="mt-4">
            <h2 className="text-primary mb-4">Saved Programs</h2>
            <div className="saved-programs-grid">
              {Object.keys(programs).length === 0 ? (
                <div className="no-programs">
                  <p>No saved programs yet.</p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={handleNewProgram}
                  >
                    <i className="bi bi-file-earmark-plus"></i> Create Your First Program
                  </button>
                </div>
              ) : (
                Object.keys(programs).map(programName => (
                  <div className="program-card-modern" key={programName}>
                    <div className="program-card-header">
                      <h3 className="program-title">{programName}</h3>
                    </div>
                    <div className="program-card-body">
                      <div className="program-metadata">
                        <span className="program-last-modified">
                          {programs[programName].lastModified ?
                            `Last modified: ${new Date(programs[programName].lastModified).toLocaleDateString()}` :
                            'Recently created'}
                        </span>
                      </div>
                    </div>
                    <div className="program-card-footer">
                      <button
                        className="btn btn-primary card-action-btn"
                        onClick={() => handleLoadProgram(programName)}
                      >
                        <i className="fas fa-folder-open"></i> Open
                      </button>
                      <button
                        className="btn btn-secondary card-action-btn"
                        onClick={() => handleRenameProgram(programName)}
                      >
                        <i className="fas fa-edit"></i> Rename
                      </button>
                      <button
                        className="btn btn-danger card-action-btn"
                        onClick={() => handleDeleteProgram(programName)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <SaveConfirmation show={saveConfirmation} />
      <ReadmeSplash show={showReadme} onClose={() => setShowReadme(false)} />
      <ConfirmationModal
        show={confirmationModal.show}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal({ show: false, title: '', message: '', onConfirm: null })}
      />
      <InputModal
        show={inputModal.show}
        title={inputModal.title}
        defaultValue={inputModal.defaultValue}
        placeholder={inputModal.placeholder}
        onConfirm={inputModal.onConfirm}
        onCancel={() => setInputModal({ show: false, title: '', defaultValue: '', onConfirm: null })}
      />
      <WelcomeModal
        show={showWelcomeModal}
        onNewProgram={() => {
          setShowWelcomeModal(false);
          promptForNewProgram();
        }}
        onClose={() => setShowWelcomeModal(false)}
      />
      <FloatingButtons
        currentProgram={currentProgram}
        handleUpdateCurrentProgram={handleUpdateCurrentProgram}
        autoSaveStatus={autoSaveStatus}
        exportPDFFunction={exportPDFFunction}
        handleNewProgram={handleNewProgram}
      />
    </DndProvider>
  );
};

export default App;