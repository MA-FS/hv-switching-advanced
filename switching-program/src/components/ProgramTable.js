import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Resizable } from 'react-resizable';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'react-resizable/css/styles.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ItemType = 'ROW';

const DraggableRow = React.memo(({ row, index, moveRow, handleInputChange, deleteRow, itemNumber, isReverseSection, columnWidths, onClick, onInsertClick, isScrolling, deleteReverseSection, rowInReverseBlock }) => {
  const ref = useRef(null);
  const dragHandleRef = useRef(null); // New ref for the drag handle
  const originalIndex = index; // Store original index

  // *** useDrop modifications ***
  const [{ handlerId, isOver, canDrop }, drop] = useDrop({
    accept: ItemType,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(), // Needed for drop target identification
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover: (item, monitor) => {
      if (!ref.current || !canDrop) { // Check canDrop here as well
        return;
      }
      const dragIndex = item.index; // Index of the item being dragged
      const hoverIndex = originalIndex; // Index of the item being hovered over (use originalIndex)

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // *** Defer actual move to drop ***
      // moveRow(dragIndex, hoverIndex); // REMOVED FROM HOVER

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      // Update the item's index to reflect the potential new position.
      // This is useful if we need the intermediate state for previews,
      // but it's essential the final move uses originalIndex.
      item.index = hoverIndex;
    },
    drop: (item, monitor) => {
      // This is called when the item is dropped ON this component
      const dragIndex = item.originalIndex; // Use the original index captured when drag started
      const hoverIndex = originalIndex; // The index of the drop target (use originalIndex)

      if (dragIndex === hoverIndex) {
        return; // No change
      }
      // Perform the actual move
      moveRow(dragIndex, hoverIndex);
      // item.index is likely reset implicitly when drag ends, or could be reset here if needed.
    },
    canDrop: (item, monitor) => {
        // Prevent dropping onto reverse sections
        return !isReverseSection;
    }
  });

  // *** useDrag modifications ***
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => ({ index: originalIndex, originalIndex }), // Pass originalIndex
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // Removed 'end' handler as move is now done only on drop
    canDrag: () => !isReverseSection,
  });

  // Only apply drag to the handle, and drop to the whole row
  drop(ref);
  drag(dragHandleRef);

  const isReverseRow = row[5] === 'REVERSE';
  const showDeleteButton = isReverseSection && isReverseRow && rowInReverseBlock === 1;

  const handleRowClick = (e) => {
    if (isScrolling) return;
    onClick(originalIndex); // Use originalIndex
  };

  // Handle reverse rows (unchanged)
  if (isReverseSection && isReverseRow) {
    return (
      <tr
        ref={ref}
        className="reverse-row"
        onClick={handleRowClick}
        data-handler-id={handlerId} // Add handlerId
      >
        <td colSpan="10" className="reverse-cell">
          <div className="reverse-divider">
            <span className="reverse-text">REVERSE</span>
            {showDeleteButton && (
              <button
                className="btn btn-link p-0 delete-reverse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteReverseSection(originalIndex - 1); // Use originalIndex based logic if needed
                }}
                title="Delete the entire reverse section"
              >
                <i className="bi bi-trash-fill"></i>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  // *** Regular row rendering modifications ***
  const rowClasses = [
    isReverseSection ? 'reverse-section' : '',
    isDragging ? 'dragging-row' : '', // Class for the row being dragged
    isOver && canDrop ? 'drop-target-highlight' : '' // Class for the row being hovered over
  ].filter(Boolean).join(' ');

  return (
    <tr
      ref={ref}
      className={rowClasses}
      onClick={handleRowClick}
      title={isReverseSection ? "Reverse section (not draggable)" : "Click to select"}
      data-handler-id={handlerId} // Add handlerId for react-dnd backend internals
    >
      <td className="item-column">
        {!isReverseSection && (
          <div className="step-container">
            <div 
              ref={dragHandleRef} 
              className="drag-handle"
              title="Drag to reorder"
            >
              <i className="bi bi-grip-vertical"></i>
            </div>
            <span className="step-number">{itemNumber}</span>
          </div>
        )}
        {isReverseSection && ''}
      </td>
      {row.map((col, colIndex) => (
        <td key={colIndex} style={{ width: columnWidths[colIndex] + 'px' }}>
          <input
            type="text"
            className={`form-control ${isReverseSection ? 'reverse-input' : ''}`}
            value={col}
            onChange={(e) => handleInputChange(e, originalIndex, colIndex)} // Use originalIndex
            style={{ width: '100%' }}
            disabled={isReverseSection}
          />
        </td>
      ))}
      <td className="actions-cell">
        {!isReverseSection ? (
          <div className="d-flex justify-content-center align-items-center">
            <button
              className="btn btn-link text-primary p-0 mr-2 action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onInsertClick(originalIndex, e); // Use originalIndex
              }}
              title="Insert a new row at this position"
            >
              <i className="bi bi-plus-circle-fill"></i>
            </button>
            <button
              className="btn btn-link text-danger p-0 action-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteRow(originalIndex); // Use originalIndex
              }}
              title="Delete this row"
            >
              <i className="bi bi-trash-fill"></i>
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
});

const ResizableHeader = ({ children, width, onResize }) => {
  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th style={{ width: width + 'px' }} title="Drag to resize column">{children}</th>
    </Resizable>
  );
};

const ProgramTable = ({ tableData, setTableData, formData, onExportPDF, onError }) => {
  const [rows, setRows] = useState(tableData);  
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastNumberedIndex, setLastNumberedIndex] = useState(-1);
  const [hasReverseSection, setHasReverseSection] = useState(false);
  const [columns] = useState([
    'Operator', 'Location', 'kV', 'Type', 'Label', 'Instruction (Action)', 'Time', 'Initial'
  ]);
  const [columnWidths, setColumnWidths] = useState([
    80,  // Operator
    100, // Location
    60,  // kV
    60,  // Type
    80,  // Label
    200, // Instruction
    60,  // Time
    60   // Initial
  ]);
  const touchStart = useRef({ x: 0, y: 0 });
  const [clickedRowIndex, setClickedRowIndex] = useState(null);
  const [showInsertPopup, setShowInsertPopup] = useState(false);
  const [insertPopupPosition, setInsertPopupPosition] = useState({ x: 0, y: 0 });
  const touchThreshold = 5;
  const popupRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Add this useEffect hook
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowInsertPopup(false);
        setClickedRowIndex(null);
      }
    };

    if (showInsertPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInsertPopup]);

  // Function to add a new state to history
  const addToHistory = useCallback((newRows) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newRows));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]); // Dependencies for useCallback

  // Function to handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = JSON.parse(history[newIndex]);
      setRows(previousState);
      setHistoryIndex(newIndex);
    }
  };

  // Update history when rows change
  useEffect(() => {
    if (rows.length > 0) {
      addToHistory(rows);
    }
  }, []);

  useEffect(() => {
    setTableData(rows);
    updateLastNumberedIndex(rows);
    checkReverseSection(rows);
  }, [rows, setTableData]);

  useEffect(() => {
    setRows(tableData);
    updateLastNumberedIndex(tableData);
    checkReverseSection(tableData);
  }, [tableData]);

  const updateLastNumberedIndex = (currentRows) => {
    let lastIndex = -1;
    for (let i = 0; i < currentRows.length; i++) {
      const row = currentRows[i];
      if (row.isReverseBlock) {
        break;
      }
      if (!isEmptyRow(row)) {
        lastIndex = i;
      }
    }
    setLastNumberedIndex(lastIndex);
  };

  const isReverseRow = (row) => {
    if (!row || row.isReverseBlock) return false;
    return row[5] === 'REVERSE';
  };

  const isEmptyRow = (row) => {
    if (!row || row.isReverseBlock) return false;
    return Array.isArray(row) && row.every(cell => cell === '');
  };

  const checkReverseSection = (currentRows) => {
    const hasReverse = currentRows.some(row => row.isReverseBlock);
    setHasReverseSection(hasReverse);
  };

  const addRow = () => {
    const newRow = Array(columns.length).fill('');
    const newRows = [...rows, newRow];
    setRows(newRows);
    setTableData(newRows);
    addToHistory(newRows);
  };

  const copyFromAbove = () => {
    if (rows.length === 0) {
      addRow();
      return;
    }

    const lastRow = rows[rows.length - 1];
    
    // Check if the last row is a reverse block and handle accordingly
    if (lastRow.isReverseBlock) {
      // If it's a reverse block, create a new empty row
      const newRow = Array(columns.length).fill('');
      const newRows = [...rows, newRow];
      setRows(newRows);
      setTableData(newRows);
      addToHistory(newRows);
      return;
    }
    
    // Copy all columns from the row above
    const newRow = [...lastRow];
    
    // Option 1: Copy all columns (remove the selective clearing)
    // const columnsToCopy = [0, 1, 2, 3];
    // for (let i = 0; i < newRow.length; i++) {
    //   if (!columnsToCopy.includes(i)) {
    //     newRow[i] = '';
    //   }
    // }

    const newRows = [...rows, newRow];
    setRows(newRows);
    setTableData(newRows);
    addToHistory(newRows);
  };

  const addReverseSection = () => {
    if (!hasReverseSection) {
      // Create a special reverse section block with three rows as a single unit
      const reverseBlock = {
        isReverseBlock: true,
        rows: [
          Array(columns.length).fill(''),
          ['', '', '', '', '', 'REVERSE', '', ''],
          Array(columns.length).fill('')
        ]
      };
      const updatedRows = [...rows, reverseBlock];
      setRows(updatedRows);
      setTableData(updatedRows);
      setHasReverseSection(true);
      addToHistory(updatedRows);
    }
  };

  const handleInputChange = (e, rowIndex, colIndex) => {
    const newValue = e.target.value;
    const newRows = rows.map((row, rIdx) => {
      if (row.isReverseBlock) return row;
      if (rIdx === rowIndex) {
        const updatedRow = [...row];
        if (colIndex === 2) {
          updatedRow[colIndex] = newValue.toUpperCase();
        } else {
          updatedRow[colIndex] = newValue;
        }
        return updatedRow;
      }
      return row;
    });
    setRows(newRows);
    setTableData(newRows);
    addToHistory(newRows);
  };

  // Function to handle row click
  const handleRowClick = (index) => {
    // If scrolling is detected, don't trigger the row click
    if (isScrolling) {
      return;
    }
    setClickedRowIndex(index); // Set the clicked row index
  };

  // Function to handle insert button click
  const handleInsertClick = (index, event) => {
    // Check if the row is part of the reverse section
    const reverseIndex = rows.findIndex(isReverseRow);
    if (reverseIndex !== -1 && (index === reverseIndex || index === reverseIndex - 1 || index === reverseIndex + 1)) {
      // Don't allow inserting rows into the reverse section
      return;
    }
    
    // Get the position of the mouse cursor
    const x = event.clientX;
    const y = event.clientY;
    
    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Determine if we should use horizontal or vertical layout
    // If window is too narrow, use vertical layout
    const useVerticalLayout = windowWidth < 550;
    
    // Calculate popup dimensions (approximate)
    const popupWidth = useVerticalLayout ? 180 : 380; // wider for horizontal layout
    const popupHeight = useVerticalLayout ? 220 : 120; // shorter for horizontal layout
    
    // Determine the best position strategy
    let positionStrategy = 'top'; // default: show above click point
    
    // Check if popup would go off the top edge
    if (y - popupHeight < 0) {
      positionStrategy = 'bottom'; // show below click point
    }
    
    // Set initial position values
    let adjustedX = x;
    let adjustedY = y;
    let transform = 'translate(-50%, -100%)'; // default transform for top position
    
    // Check if popup would go off the right edge
    if (x + popupWidth / 2 > windowWidth) {
      adjustedX = windowWidth - popupWidth / 2 - 10;
    }
    
    // Check if popup would go off the left edge
    if (x - popupWidth / 2 < 0) {
      adjustedX = popupWidth / 2 + 10;
    }
    
    // Apply position strategy
    if (positionStrategy === 'bottom') {
      transform = 'translate(-50%, 10px)';
    }
    
    setInsertPopupPosition({
      x: adjustedX,
      y: adjustedY,
      transform: transform,
      strategy: positionStrategy,
      useVerticalLayout: useVerticalLayout
    });
    
    setClickedRowIndex(index);
    setShowInsertPopup(true);
  };

  // Function to insert row above
  const insertRowAbove = (index) => {
    // Don't allow inserting if the target row is part of a reverse block
    if (rows[index]?.isReverseBlock) {
      return;
    }
    
    const newRow = Array(columns.length).fill('');
    const newRows = [...rows.slice(0, index), newRow, ...rows.slice(index)];
    setRows(newRows);
    setTableData(newRows);
    setClickedRowIndex(null);
    setShowInsertPopup(false);
    addToHistory(newRows);
  };

  const insertRowBelow = (index) => {
    // Don't allow inserting if the target row is part of a reverse block
    if (rows[index]?.isReverseBlock) {
      return;
    }
    
    const newRow = Array(columns.length).fill('');
    const newRows = [...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)];
    setRows(newRows);
    setTableData(newRows);
    setClickedRowIndex(null);
    setShowInsertPopup(false);
    addToHistory(newRows);
  };

  // New function to copy current row
  const copyCurrentRow = (index) => {
    // Don't allow copying if the target row is part of a reverse block
    if (rows[index]?.isReverseBlock) {
      return;
    }
    
    // Copy the current row's data
    const currentRow = [...rows[index]];
    const newRows = [...rows.slice(0, index + 1), currentRow, ...rows.slice(index + 1)];
    setRows(newRows);
    setTableData(newRows);
    setClickedRowIndex(null);
    setShowInsertPopup(false);
    addToHistory(newRows);
  };

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    // Ensure indices are valid and different
    if (dragIndex === hoverIndex || dragIndex < 0 || hoverIndex < 0) {
      console.warn("Attempted invalid move: indices out of bounds or same", dragIndex, hoverIndex);
      return;
    }

    setRows((prevRows) => {
      // Additional validation within the updater function
      if (dragIndex >= prevRows.length || hoverIndex >= prevRows.length) {
          console.warn("Attempted invalid move inside setRows: indices out of bounds", dragIndex, hoverIndex, prevRows.length);
          return prevRows; // Return current state if indices became invalid
      }
       // Check if moving involves a reverse block (double check)
      if (prevRows[dragIndex]?.isReverseBlock || prevRows[hoverIndex]?.isReverseBlock) {
        console.warn("Attempted move involving reverse block inside setRows:", dragIndex, hoverIndex);
        return prevRows; // Return current state
      }

      const newRows = [...prevRows];
      const [draggedItem] = newRows.splice(dragIndex, 1);

      // Ensure draggedItem is valid before splicing
      if (!draggedItem) {
          console.error("Drag item not found at index:", dragIndex);
          return prevRows; // Return previous state if item not found
      }

      newRows.splice(hoverIndex, 0, draggedItem);
      // No need to call setTableData here, useEffect handles it
      // Add to history *after* successful state update
      addToHistory(newRows); // Call history update here
      return newRows;
    });
  }, [addToHistory]); // Removed rows, setTableData dependencies, added addToHistory

  const handleDragStart = useCallback(() => {
    setIsDraggingGlobal(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingGlobal(false);
    // No need to call setTableData(rows) here - useEffect handles it
    // And moveRow now handles the final state update + history
  }, []); // Keep dependencies minimal

  const deleteRow = (rowIndex) => {
    // Don't allow deleting if it's part of a reverse block
    if (rows[rowIndex]?.isReverseBlock) {
      return;
    }
    
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
    setTableData(newRows);
    addToHistory(newRows);
  };

  // Function to delete the entire reverse section
  const deleteReverseSection = (index) => {
    const newRows = rows.filter((row, i) => !row.isReverseBlock);
    setRows(newRows);
    setTableData(newRows);
    setHasReverseSection(false);
    addToHistory(newRows);
  };

  const onResize = (index) => (event, { size }) => {
    const newColumnWidths = [...columnWidths];
    newColumnWidths[index] = size.width;
    setColumnWidths(newColumnWidths);
  };

  // Call the passed exportToPDF prop function if it exists
  useEffect(() => {
    if (onExportPDF) {
      const exportToPDFFunction = async () => {
        try {
          console.log('Starting PDF export process...');
          
          const doc = new jsPDF('landscape', 'mm', 'a4');
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const margin = 8;
          const copperColor = [168, 75, 42]; // Copper tone color (#A84B2A)
          const logoSize = 15;
          
          // Verify table data is available
          if (!rows || rows.length === 0) {
            console.warn('No rows data available for PDF export');
          } else {
            console.log(`Found ${rows.length} rows to process`);
          }

          // Load logo
          const logoUrl = process.env.PUBLIC_URL + '/logo.PNG';
          
          // Load image asynchronously
          let img;
          try {
            img = await new Promise((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = "Anonymous";
              image.onload = () => resolve(image);
              image.onerror = (e) => resolve(null);
              image.src = logoUrl;
            });
          } catch (logoError) {
            console.error('Logo loading error:', logoError);
            img = null;
          }

          // Also preload the dalewest logo (for footer)
          let dalewestImg;
          try {
            const dalewestLogoUrl = process.env.PUBLIC_URL + '/dalewest.jpg';
            console.log('Loading dalewest logo from:', dalewestLogoUrl);
            
            dalewestImg = await new Promise((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = "Anonymous";
              image.onload = () => {
                console.log('Dalewest logo loaded successfully, dimensions:', image.width, 'x', image.height);
                resolve(image);
              };
              image.onerror = (e) => {
                console.error('Failed to load dalewest logo:', e);
                resolve(null);
              };
              image.src = dalewestLogoUrl;
            });
          } catch (logoError) {
            console.error('Dalewest logo loading error:', logoError);
            dalewestImg = null;
          }

          // Function to add header
          const addHeader = () => {
            // Add logo if available
            if (img) {
              try {
                doc.addImage(img, 'JPEG', margin, margin, logoSize, logoSize);
              } catch (error) {
                console.error('Error adding logo:', error);
              }
            }

            // Add title
            doc.setFontSize(14);
            doc.setTextColor(copperColor[0], copperColor[1], copperColor[2]);
            doc.text("HV Coach", margin + logoSize + 3, margin + 6);
            doc.text("SWITCHING PROGRAM", margin + logoSize + 40, margin + 6);

            // Add name and program number
            doc.setFontSize(9);
            doc.setTextColor(0);
            const nameY = margin + 4;
            doc.text("NAME", pageWidth - 120, nameY);
            doc.text(formData.name || '', pageWidth - 80, nameY);
            doc.text("Program No:", pageWidth - 120, nameY + 5);
            doc.text(formData.programNo || '', pageWidth - 80, nameY + 5);
          };

          // Function to add page number
          const addPageNumber = (pageNum, totalPages) => {
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(
              `Page ${pageNum} of ${totalPages}`,
              pageWidth - margin,
              pageHeight - margin,
              { align: 'right' }
            );
          };

          // Function to add footer with branding
          const addFooter = (pageNumber) => {
            // Add website URL
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100); // Gray color for footer text
            doc.text(
              "https://www.hv.coach",
              pageWidth / 2,
              pageHeight - margin,
              { align: 'center' }
            );
            
            // Add dalewest logo if it was loaded
            if (dalewestImg) {
              try {
                // Calculate a small size for the logo (about same height as text)
                const footerLogoSize = 8;
                const aspectRatio = dalewestImg.width / dalewestImg.height;
                const footerLogoWidth = footerLogoSize * aspectRatio;
                
                // Add the image to the PDF
                doc.addImage(
                  dalewestImg, 
                  'JPEG', 
                  margin, 
                  pageHeight - margin - footerLogoSize, 
                  footerLogoWidth, 
                  footerLogoSize
                );
                console.log(`Added dalewest logo to footer on page ${pageNumber}`);
              } catch (imgError) {
                console.error('Error adding dalewest logo to footer:', imgError);
              }
            } else {
              console.warn('Dalewest logo not available for footer');
            }
          };

          // Add first page header
          addHeader();

          // Location and Work Description table
          autoTable(doc, {
            startY: margin + logoSize + 2,
            body: [
              [
                { content: 'Location:', styles: { fontStyle: 'bold' } },
                { content: formData.location || '' },
                { content: 'Work Description:', styles: { fontStyle: 'bold' } },
                { content: formData.workDescription || '' }
              ]
            ],
            theme: 'grid',
            styles: {
              fontSize: 9,
              cellPadding: 2,
              lineColor: [128, 128, 128],
              lineWidth: 0.1
            },
            columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 60 },
              2: { cellWidth: 35 },
              3: { cellWidth: 'auto' }
            },
            margin: { left: margin, right: margin }
          });

          // More compact signature section table with copper tone header
          autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 2,
            head: [
              [
                { content: '', styles: { fillColor: copperColor } },
                { content: 'Name', styles: { fillColor: copperColor, textColor: [255, 255, 255] } },
                { content: 'Signature', styles: { fillColor: copperColor, textColor: [255, 255, 255] } },
                { content: 'Time', styles: { fillColor: copperColor, textColor: [255, 255, 255] } },
                { content: 'Date', styles: { fillColor: copperColor, textColor: [255, 255, 255] } },
                { content: 'Reference Drawing/s', styles: { fillColor: copperColor, textColor: [255, 255, 255] } }
              ]
            ],
            body: [
              [
                { content: 'Prepared by:', styles: { fontStyle: 'bold' } },
                formData.preparedByName || '',
                formData.preparedBySignature || '',
                formData.preparedByTime || '',
                formData.preparedByDate || '',
                { content: formData.referenceDrawings || '', rowSpan: 3 }
              ],
              [
                { content: 'Checked by:', styles: { fontStyle: 'bold' } },
                formData.checkedByName || '',
                formData.checkedBySignature || '',
                formData.checkedByTime || '',
                formData.checkedByDate || ''
              ],
              [
                { content: 'Authorised:', styles: { fontStyle: 'bold' } },
                formData.authorisedName || '',
                formData.authorisedSignature || '',
                formData.authorisedTime || '',
                formData.authorisedDate || ''
              ]
            ],
            theme: 'grid',
            styles: {
              fontSize: 8,
              cellPadding: 1,
              lineColor: [128, 128, 128],
              lineWidth: 0.1
            },
            columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 40 },
              2: { cellWidth: 40 },
              3: { cellWidth: 15 },
              4: { cellWidth: 15 },
              5: { cellWidth: 'auto' }
            },
            margin: { left: margin, right: margin }
          });

          // Main switching program table
          const tableStartY = doc.lastAutoTable.finalY + 3;
          
          // Process table data
          const tableRows = [];
          let itemNumber = 1;
          
          console.log('Raw rows data for current PDF export:', JSON.stringify(rows, null, 2));
          
          // Add this validation function
          const validateTableRow = (row) => {
            if (!Array.isArray(row)) {
              console.error('Invalid row format (not an array):', row);
              return false;
            }
            
            // Check if the row has the right number of columns
            // Step column + all data columns
            const expectedLength = 1 + columns.length;
            
            if (row.length !== expectedLength) {
              console.error(`Row has wrong number of columns: expected ${expectedLength}, got ${row.length}`, row);
              return false;
            }
            
            return true;
          };
          
          // Process row data for PDF
          const processRowForPDF = (row) => {
            // Ensure we have data to work with
            if (!row) return null;
            
            // Regular rows are arrays with values
            if (Array.isArray(row)) {
              return [...row]; // Return a copy of the array
            }
            
            // If it's an object with specific properties we need to extract
            if (typeof row === 'object') {
              try {
                // Check if it has direct numeric property access (like an array-like object)
                if (row[0] !== undefined) {
                  const extractedArray = [];
                  for (let i = 0; i < columns.length; i++) {
                    extractedArray.push(row[i] || '');
                  }
                  return extractedArray;
                }
                
                // Otherwise extract by column names
                const extracted = columns.map(col => row[col] || '');
                return extracted;
              } catch (error) {
                console.error('Error extracting row data:', error, row);
                return Array(columns.length).fill('');
              }
            }
            
            // Fallback
            console.error('Unhandled row format:', row);
            return Array(columns.length).fill('');
          };
          
          // Process the rows for PDF export
          rows.forEach((rowData, index) => {
            // Handle each row type appropriately
            try {
              if (rowData && rowData.isReverseBlock) {
                // Handle reverse blocks
                if (Array.isArray(rowData.rows)) {
                  rowData.rows.forEach((row, rowIndex) => {
                    const processedRow = processRowForPDF(row);
                    if (processedRow) {
                      const formattedRow = ['', ...processedRow];
                      if (rowIndex === 1) { // Middle row with REVERSE text
                        formattedRow[6] = { 
                          content: 'REVERSE', 
                          styles: { 
                            fontStyle: 'bold', 
                            textColor: [220, 53, 69],
                            decoration: 'underline',
                            cellPadding: 4,
                            halign: 'center'
                          } 
                        };
                      }
                      tableRows.push(formattedRow);
                    }
                  });
                } else {
                  console.error('Reverse block without rows array:', rowData);
                }
              } else {
                // Process regular rows - ensure they're correctly formatted
                const processedRow = processRowForPDF(rowData);
                if (processedRow) {
                  const formattedRow = [itemNumber++, ...processedRow];
                  tableRows.push(formattedRow);
                }
              }
            } catch (error) {
              console.error('Error processing row for PDF:', error, rowData);
            }
          });

          // Debug the processed tableRows
          console.log('Processed tableRows for PDF:', tableRows);
          
          // Additional validation before adding to PDF
          const validRows = tableRows.filter(validateTableRow);
          if (validRows.length < tableRows.length) {
            console.warn(`Filtered out ${tableRows.length - validRows.length} invalid rows`);
          }
          
          if (validRows.length === 0) {
            console.error('No valid rows for PDF export, using sample data');
            // Create a sample row for debugging
            validRows.push(['1', 'Operator', 'Location', 'kV', 'Type', 'Label', 'Instruction', 'Time', 'Initial']);
          }
          
          console.log(`Final ${validRows.length} rows ready for PDF`);

          // Calculate available height for table content
          const firstPageContentHeight = pageHeight - tableStartY - margin;
          const subsequentPagesContentHeight = pageHeight - (margin + 15) - margin; // Account for header and margins
          
          // Calculate approximate rows per page based on row height
          const rowHeight = 10; // Reduced from 12 - approximate height of each row in mm
          const firstPageRows = Math.floor(firstPageContentHeight / rowHeight);
          const subsequentPagesRows = Math.floor(subsequentPagesContentHeight / rowHeight);
          
          // Calculate total pages more accurately
          let remainingRows = validRows.length;
          let calculatedTotalPages = 1;
          remainingRows -= firstPageRows;
          
          while (remainingRows > 0) {
            calculatedTotalPages++;
            remainingRows -= subsequentPagesRows;
          }

          // Store total pages in a variable that will be accessible in didDrawPage
          const totalPages = calculatedTotalPages;

          // Update the main switching program table headers
          try {
            // Add the table to the PDF
            console.log('Adding main program table to PDF...');
            
            // Ensure all cell values are strings to prevent jsPDF autoTable issues
            const sanitizedRows = validRows.map(row => {
              return row.map(cell => {
                // If it's already a formatted cell with content property, leave it as is
                if (cell && typeof cell === 'object' && cell.content) {
                  return cell;
                }
                // Otherwise convert to string to prevent any potential issues
                return String(cell || '');
              });
            });
            
            autoTable(doc, {
              head: [
                [
                  { content: 'Step', rowSpan: 2 },
                  { content: 'Operator', rowSpan: 2 },
                  { content: 'Location', rowSpan: 2 },
                  { content: 'Apparatus', colSpan: 3 },
                  { content: 'Instruction (Action)', rowSpan: 2 },
                  { content: 'Time', rowSpan: 2 },
                  { content: 'Initial', rowSpan: 2 }
                ],
                ['kV', 'Type', 'Label']
              ],
              body: sanitizedRows.length > 0 ? sanitizedRows : [['', '', '', '', '', '', '', '', '']], // Use the validated rows
              startY: tableStartY,
              theme: 'grid',
              headStyles: {
                fillColor: [46, 46, 46],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 2,
                halign: 'center'
              },
              styles: {
                fontSize: 9,
                cellPadding: 2,
                lineColor: [128, 128, 128],
                lineWidth: 0.1
              },
              columnStyles: {
                0: { cellWidth: 15 },  // Step
                1: { cellWidth: 25 },  // Operator
                2: { cellWidth: 30 },  // Location
                3: { cellWidth: 20 },  // kV
                4: { cellWidth: 20 },  // Type
                5: { cellWidth: 25 },  // Label
                6: { cellWidth: 'auto' }, // Instruction
                7: { cellWidth: 20 },  // Time
                8: { cellWidth: 20 }   // Initial
              },
              margin: { left: margin, right: margin },
              didDrawPage: function(data) {
                // For pages after the first page
                if (data.pageNumber > 1) {
                  // Clear the header area
                  doc.setFillColor(255, 255, 255);
                  doc.rect(0, 0, pageWidth, margin + 20, 'F');
                  
                  // Add header with exact same spacing as first page
                  if (img) {
                    try {
                      doc.addImage(img, 'JPEG', margin, margin, logoSize, logoSize);
                    } catch (error) {
                      console.error('Error adding logo:', error);
                    }
                  }

                  // Add title with exact same spacing as first page
                  doc.setFontSize(14);
                  doc.setTextColor(copperColor[0], copperColor[1], copperColor[2]);
                  doc.text("HV Coach", margin + logoSize + 3, margin + 6);
                  doc.text("SWITCHING PROGRAM", margin + logoSize + 40, margin + 6);

                  // Add name and program number with exact same spacing as first page
                  doc.setFontSize(9);
                  doc.setTextColor(0);
                  const nameY = margin + 4;
                  doc.text("NAME", pageWidth - 120, nameY);
                  doc.text(formData.name || '', pageWidth - 80, nameY);
                  doc.text("Program No:", pageWidth - 120, nameY + 5);
                  doc.text(formData.programNo || '', pageWidth - 80, nameY + 5);
                }
                
                // Add page number (for all pages)
                doc.setFontSize(10);
                doc.setTextColor(0);
                const pageNumberText = `Page ${data.pageNumber} of ${totalPages}`;
                doc.text(
                  pageNumberText,
                  pageWidth - margin,
                  pageHeight - margin,
                  { align: 'right' }
                );
                
                // Add branding footer to each page (using synchronous function)
                addFooter(data.pageNumber);
              },
              willDrawPage: function(data) {
                // Set consistent top margin for all pages
                data.settings.margin.top = margin + 20;
                data.settings.margin.left = margin;
                data.settings.margin.right = margin;
                data.settings.margin.bottom = margin + 10;
              },
              bodyStyles: {
                minCellHeight: 8 // Set minimum cell height to ensure consistent spacing
              },
              didParseCell: function(data) {
                // If this is a REVERSE section row, ensure consistent height and styling
                if (data.row.cells[5] && data.row.cells[5].content === 'REVERSE') {
                  data.cell.styles.minCellHeight = 8;
                  data.cell.styles.fillColor = [248, 249, 250]; // Light gray background
                }
              }
            });
            console.log('Main program table added successfully');
          } catch (tableError) {
            console.error('Error adding program table to PDF:', tableError);
            // Continue with saving PDF despite table error
          }

          // Save PDF
          console.log('Saving PDF...');
          const preparedBy = (formData.preparedByName || 'Unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const programNo = (formData.programNo || 'NoNumber').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const currentDate = new Date().toISOString().split('T')[0];
          const filename = `${preparedBy}_program_${programNo}_${currentDate}.pdf`;

          doc.save(filename);
          console.log('PDF saved successfully as:', filename);
        } catch (error) {
          console.error('Detailed error in PDF generation:', error);
          // Show error stack trace for more debugging information
          if (error.stack) {
            console.error('Error stack:', error.stack);
          }
          if (onError) {
            onError('There was an error generating the PDF. Please check the browser console for details and try again.');
          }
        }
      };
      
      onExportPDF(exportToPDFFunction);
    }
  }, [onExportPDF, rows, formData, columns, onError]); // Include all dependencies

  // Add useEffect to update popup position on window resize
  useEffect(() => {
    const handleResize = () => {
      // If popup is shown, hide it on resize to prevent positioning issues
      if (showInsertPopup) {
        setShowInsertPopup(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showInsertPopup]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="spreadsheet-container p-3"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTouchStart={(e) => {
          touchStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const deltaX = touch.clientX - touchStart.current.x;
          const deltaY = touch.clientY - touchStart.current.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance > touchThreshold) {
            setIsScrolling(true);
            
            // Clear any existing timeout
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            
            // Set a timeout to reset the scrolling state after a delay
            scrollTimeoutRef.current = setTimeout(() => {
              setIsScrolling(false);
            }, 500); // 500ms delay
          }
        }}
        onTouchEnd={() => {
          // Clear any existing timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          
          // Set a timeout to reset the scrolling state after a delay
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
            touchStart.current = { x: 0, y: 0 };
          }, 300); // 300ms delay
        }}
        onWheel={(e) => {
          // Detect wheel scrolling
          setIsScrolling(true);
          
          // Clear any existing timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          
          // Set a timeout to reset the scrolling state after a delay
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, 300); // 300ms delay
        }}
      >
        <style>
          {`
            .item-column {
              width: 60px;
              text-align: center;
              padding: 0 !important;
            }
            .step-container {
              display: flex;
              align-items: center;
              height: 100%;
              width: 100%;
            }
            .step-number {
              flex: 1;
              font-weight: 500;
              padding-right: 8px;
            }
            .actions-cell {
              width: 60px !important;
              padding: 4px !important;
              vertical-align: middle !important;
              text-align: center;
              white-space: nowrap;
            }
            .apparatus-header {
              text-align: center !important;
              border-bottom: none !important;
            }
            .apparatus-subheader {
              border-top: none !important;
            }
            .apparatus-subheader th {
              border-top: none !important;
              text-align: center;
            }
            .action-btn {
              transition: transform 0.2s;
              padding: 0;
              margin: 0 3px;
            }
            .delete-reverse-btn i.bi {
              font-size: 1.6rem;
            }
            .action-btn:hover {
              transform: scale(1.2);
            }
            .bi {
              font-size: 1.6rem;
              vertical-align: -0.125em;
            }
            thead th {
              text-align: center;
              vertical-align: middle !important;
            }
            .reverse-section {
              background-color: #333333 !important;
              transition: all 0.3s ease;
            }
            .reverse-section td {
              border-color: #222222 !important;
            }
            .reverse-section input {
              background-color: #333333 !important;
              cursor: not-allowed;
              opacity: 0.9;
              border-color: transparent;
              color: #E0E0E0;
            }
            .reverse-section input:disabled {
              color: #E0E0E0;
            }
            
            /* New styles for the redesigned reverse row */
            .reverse-row {
              background-color: transparent !important;
              border: none !important;
              border-left: none !important;
              border-right: none !important;
            }
            .reverse-row td {
              border-left: none !important;
              border-right: none !important;
              border-collapse: collapse !important;
            }
            .reverse-cell {
              padding: 0 !important;
              position: relative;
              border: none !important;
              border-left: none !important;
              border-right: none !important;
            }
            .reverse-divider {
              height: 40px;
              width: 100%;
              border-top: 2px solid #B06745;
              border-bottom: 2px solid #B06745;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              background-color: #333333;
            }
            .reverse-text {
              text-align: center;
              font-size: 1.2em;
              color: #C27E5F;
              font-weight: bold;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .delete-reverse-btn {
              position: absolute;
              right: 15px;
              color: #D84747;
              background-color: transparent;
              border: none;
            }
            .delete-reverse-btn:hover {
              color: #C53030;
              transform: scale(1.2);
            }
            .reverse-input {
              background-color: #333333 !important;
              border: 1px solid transparent !important;
              color: #E0E0E0;
            }
            .reverse-block {
              position: relative;
              margin: 15px 0;
            }
            .form-control {
              background-color: #2A2A2A;
              color: #F7F7F7;
              border: 1px solid #222222;
            }
            .form-control:focus {
              background-color: #2A2A2A;
              color: #F7F7F7;
              border-color: #B06745;
              box-shadow: 0 0 0 0.2rem rgba(176, 103, 69, 0.25);
            }
            .table {
              color: #F7F7F7;
            }
            .table-bordered {
              border: 1px solid #222222;
            }
            .table-bordered td, .table-bordered th {
              border: 1px solid #222222;
            }
            td {
              background-color: #444444;
            }
            .action-btn.text-primary {
              color: #C27E5F !important;
            }
            .action-btn.text-danger {
              color: #D84747 !important;
            }
            .insert-options {
              background-color: #333333 !important;
              border: 1px solid #222222 !important;
            }
            .text-muted {
              color: #E0E0E0 !important;
            }

            /* --- NEW Drag and Drop Styles --- */

            /* Style for the row being dragged */
            .dragging-row {
              opacity: 0.4 !important; /* Make it more transparent */
              background-color: #555 !important; /* Darker background */
              /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); */ /* Optional shadow */
            }
            .dragging-row td {
               /* Optional: hide borders for a cleaner look */
               /* border-color: transparent !important; */
            }

            /* Style for the row being hovered over as a drop target */
            .drop-target-highlight {
              /* Using borders for the highlight */
              border-top: 3px solid #C27E5F !important; /* Copper tone top border */
              border-bottom: 3px solid #C27E5F !important; /* Copper tone bottom border */
              transition: border-top 0.1s ease-in-out, border-bottom 0.1s ease-in-out; /* Smooth transition for borders */
            }
            /* Adjust cell borders when row is highlighted to avoid double borders */
            .drop-target-highlight td {
                border-top-color: transparent !important;
                border-bottom-color: transparent !important;
            }
            /* Ensure the outer left/right borders of the row remain visible */
            .drop-target-highlight td:first-child {
                 border-left: 1px solid #222222; /* Maintain original border */
            }
            .drop-target-highlight td:last-child {
                 border-right: 1px solid #222222; /* Maintain original border */
            }

            /* Prevent highlighting styles on reverse sections */
            .reverse-section.drop-target-highlight,
            .reverse-row.drop-target-highlight {
                border-top: none !important;
                border-bottom: none !important;
            }
            .reverse-section.drop-target-highlight td,
            .reverse-row.drop-target-highlight td {
                 border-top-color: #222222 !important; /* Restore default border */
                 border-bottom-color: #222222 !important;
            }
             /* --- End Drag and Drop Styles --- */
             
            /* Drag handle styles */
            .drag-handle {
              cursor: move;
              color: #C27E5F;
              opacity: 0.8;
              transition: all 0.2s;
              border-radius: 3px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              width: 24px;
            }
            .drag-handle:hover {
              opacity: 1;
              background-color: rgba(194, 126, 95, 0.2);
            }
            .drag-handle .bi {
              font-size: 1.4rem;
              display: block;
            }
          `}
        </style>
        <div className="header-section">
          {/* Header content here */}
        </div>
        <div 
          id="table-container" 
          className="table-container"
          style={{ 
            userSelect: isDraggingGlobal ? 'none' : 'auto',
            WebkitUserSelect: isDraggingGlobal ? 'none' : 'auto',
            MozUserSelect: isDraggingGlobal ? 'none' : 'auto',
          }}
        >
          <table className="table table-bordered">
            <thead>
              <tr>
                <th rowSpan="2" className="item-column">Step</th>
                <th rowSpan="2">Operator</th>
                <th rowSpan="2">Location</th>
                <th colSpan="3" className="apparatus-header">Apparatus</th>
                <th rowSpan="2">Instruction (Action)</th>
                <th rowSpan="2">Time</th>
                <th rowSpan="2">Initial</th>
                <th rowSpan="2" className="actions-cell"></th>
              </tr>
              <tr className="apparatus-subheader">
                <th>kV</th>
                <th>Type</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((rowData, index) => {
                // Use the current index from the map function as the key and original index identifier
                const originalIndex = index;

                if (rowData.isReverseBlock) {
                  // Render reverse block rows
                  return rowData.rows.map((row, rowIndex) => (
                    <DraggableRow
                      key={`reverse-${originalIndex}-${rowIndex}`} // Key stability
                      row={row}
                      index={originalIndex} // Pass the block's index
                      moveRow={moveRow}
                      handleInputChange={handleInputChange}
                      deleteRow={deleteRow}
                      itemNumber={''} // No item number for reverse block internal rows
                      isReverseSection={true}
                      columnWidths={columnWidths}
                      onClick={handleRowClick} // Clicks on reverse rows might need specific handling
                      onInsertClick={handleInsertClick} // Inserting near reverse blocks is likely disabled
                      isScrolling={isScrolling}
                      deleteReverseSection={deleteReverseSection} // Pass the specific delete function
                      rowInReverseBlock={rowIndex} // Pass the index within the block
                    />
                  ));
                }

                // Calculate item number for non-reverse rows
                let itemNumber = '';
                const precedingNonReverseCount = rows
                  .slice(0, originalIndex)
                  .filter(r => !r.isReverseBlock)
                  .length;
                itemNumber = precedingNonReverseCount + 1;

                // Render regular draggable row
                return (
                  <DraggableRow
                    key={`row-${originalIndex}`} // Key stability using index
                    row={rowData}
                    index={originalIndex} // Pass the current index
                    moveRow={moveRow}
                    handleInputChange={handleInputChange}
                    deleteRow={deleteRow}
                    itemNumber={itemNumber}
                    isReverseSection={false}
                    columnWidths={columnWidths}
                    onClick={handleRowClick}
                    onInsertClick={handleInsertClick}
                    isScrolling={isScrolling}
                    deleteReverseSection={deleteReverseSection} // Pass delete function (though not used directly here)
                    rowInReverseBlock={-1} // Not in a reverse block
                  />
                );
              })}
            </tbody>
          </table>
          
          {/* Insert popup */}
          {showInsertPopup && clickedRowIndex !== null && (
            <div
              ref={popupRef}
              className={`insert-options ${insertPopupPosition.useVerticalLayout ? 'd-flex flex-column' : 'd-flex flex-row'} align-items-center`}
              style={{
                position: 'fixed',
                top: `${insertPopupPosition.y}px`,
                left: `${insertPopupPosition.x}px`,
                transform: insertPopupPosition.transform || 'translate(-50%, -100%)',
                padding: '15px',
                zIndex: 1000,
                marginTop: insertPopupPosition.strategy === 'bottom' ? '0' : '-10px',
                animation: insertPopupPosition.strategy === 'bottom' ? 'fadeInBottom 0.2s ease-in-out' : 'fadeIn 0.2s ease-in-out',
                minWidth: insertPopupPosition.useVerticalLayout ? '140px' : '360px',
              }}
            >
              <style>
                {`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -90%); }
                    to { opacity: 1; transform: translate(-50%, -100%); }
                  }
                  @keyframes fadeInBottom {
                    from { opacity: 0; transform: translate(-50%, 0); }
                    to { opacity: 1; transform: translate(-50%, 10px); }
                  }
                `}
              </style>
              {insertPopupPosition.useVerticalLayout ? (
                <>
                  <span className="popup-title">Insert</span>
                  <button 
                    onClick={() => insertRowAbove(clickedRowIndex)} 
                    className="btn btn-outline-primary btn-sm my-1"
                  >
                    <i className="bi bi-arrow-up"></i> Above
                  </button>
                  <button 
                    onClick={() => insertRowBelow(clickedRowIndex)} 
                    className="btn btn-outline-primary btn-sm my-1"
                  >
                    <i className="bi bi-arrow-down"></i> Below
                  </button>
                  <button 
                    onClick={() => {
                      setClickedRowIndex(null);
                      setShowInsertPopup(false);
                    }}
                    className="btn btn-outline-secondary btn-sm mt-2"
                  >
                    <i className="bi bi-x"></i> Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="popup-title mr-2">Insert Row:</span>
                  <button 
                    onClick={() => insertRowAbove(clickedRowIndex)} 
                    className="btn btn-outline-primary btn-sm mx-1"
                  >
                    <i className="bi bi-arrow-up"></i> Above
                  </button>
                  <button 
                    onClick={() => insertRowBelow(clickedRowIndex)} 
                    className="btn btn-outline-primary btn-sm mx-1"
                  >
                    <i className="bi bi-arrow-down"></i> Below
                  </button>
                  <button 
                    onClick={() => {
                      setClickedRowIndex(null);
                      setShowInsertPopup(false);
                    }}
                    className="btn btn-outline-secondary btn-sm ml-2"
                  >
                    <i className="bi bi-x"></i> Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="button-container">
          <button 
            className="btn btn-secondary"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo last action"
          >
            <i className="bi bi-arrow-counterclockwise"></i> Undo
          </button>
          <button className="btn btn-success" onClick={addRow} title="Add a new empty row to the table">
            <i className="bi bi-plus-lg mr-1"></i> Add Row
          </button>
          <button 
            className="btn btn-secondary"
            onClick={addReverseSection}
            disabled={hasReverseSection}
            title="Add a reverse section to the program (can only be added once)"
          >
            <i className="bi bi-arrow-left-right mr-1"></i> Reverse
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default ProgramTable;
