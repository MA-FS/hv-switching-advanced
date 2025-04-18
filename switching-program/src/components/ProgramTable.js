import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Resizable } from 'react-resizable';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'react-resizable/css/styles.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ItemType = 'ROW';

const DraggableRow = React.memo(({ row, index, moveRow, handleInputChange, deleteRow, itemNumber, isReverseSection, columnWidths, onClick, onInsertClick, isScrolling, deleteReverseSection }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => ({ index, originalIndex: index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const { index: originalIndex } = item;
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveRow(item.index, originalIndex);
      }
    },
    canDrag: () => !isReverseSection, // Prevent dragging rows in the reverse section
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      // Prevent dropping into the reverse section
      if (isReverseSection) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const isReverseRow = row[4] === 'REVERSE';

  // Handle row click with scroll detection
  const handleRowClick = (e) => {
    // If scrolling is detected, don't trigger the row click
    if (isScrolling) {
      return;
    }
    onClick(index);
  };

  return (
    <tr 
      ref={ref} 
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isReverseSection ? 'default' : 'move',
        backgroundColor: isReverseSection ? 'transparent' : 'inherit',
      }}
      onClick={handleRowClick} // Use the new handler
      className={isReverseSection ? 'reverse-section' : ''}
      title={isReverseSection ? "Reverse section (not draggable)" : "Click to select, drag to reorder"}
    >
      <td className="item-column">{itemNumber}</td>
      {row.map((col, colIndex) => (
        <td key={colIndex} style={{ width: columnWidths[colIndex] + 'px' }}>
          {col === 'REVERSE' && colIndex === 4 ? (
            <b><u>REVERSE</u></b>
          ) : (
            <input
              type="text"
              className="form-control"
              value={col}
              onChange={(e) => handleInputChange(e, index, colIndex)}
              style={{ width: '100%' }}
              disabled={isReverseSection}
            />
          )}
        </td>
      ))}
      <td className="action-column">
        <div className="d-flex justify-content-center">
          {isReverseSection && isReverseRow ? (
            <button 
              className="btn btn-link text-danger p-0 action-btn" 
              onClick={(e) => {
                e.stopPropagation();
                deleteReverseSection(index);
              }}
              title="Delete the entire reverse section"
            >
              <i className="bi bi-trash-fill"></i>
            </button>
          ) : !isReverseSection ? (
            <>
              <button 
                className="btn btn-link text-primary p-0 mr-2 action-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertClick(index, e);
                }}
                title="Insert a new row at this position"
              >
                <i className="bi bi-plus-circle-fill"></i>
              </button>
              <button 
                className="btn btn-link text-danger p-0 action-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRow(index);
                }}
                title="Delete this row"
              >
                <i className="bi bi-trash-fill"></i>
              </button>
            </>
          ) : null}
        </div>
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

const ProgramTable = ({ tableData, setTableData, formData }) => {
  const [rows, setRows] = useState(tableData);  
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastNumberedIndex, setLastNumberedIndex] = useState(-1);
  const [hasReverseSection, setHasReverseSection] = useState(false);
  const [columns] = useState([
    'Location', 'Volts', 'Type', 'Identity', 'Instruction', 'Time', 'Witness'
  ]);
  const [columnWidths, setColumnWidths] = useState([
    100, 80, 80, 100, 200, 80, 100
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

  // Function to add a new state to history
  const addToHistory = (newRows) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newRows));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

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
      if (isReverseRow(currentRows[i])) {
        break;
      }
      if (!isEmptyRow(currentRows[i])) {
        lastIndex = i;
      }
    }
    setLastNumberedIndex(lastIndex);
  };

  const isReverseRow = (row) => row[4] === 'REVERSE';
  const isEmptyRow = (row) => row.every(cell => cell === '');

  const checkReverseSection = (currentRows) => {
    const reverseIndex = currentRows.findIndex(isReverseRow);
    setHasReverseSection(reverseIndex !== -1);
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
    const newRow = [...lastRow];
    
    const columnsToCopy = [0, 1, 2, 3];
    for (let i = 0; i < newRow.length; i++) {
      if (!columnsToCopy.includes(i)) {
        newRow[i] = '';
      }
    }

    const newRows = [...rows, newRow];
    setRows(newRows);
    setTableData(newRows);
    addToHistory(newRows);
  };

  const addReverseSection = () => {
    if (!hasReverseSection) {
      // Create a special reverse section block with three rows
      const newRows = [
        Array(columns.length).fill(''),
        ['', '', '', '', 'REVERSE', '', ''],
        Array(columns.length).fill(''),
      ];
      const updatedRows = [...rows, ...newRows];
      setRows(updatedRows);
      setTableData(updatedRows);
      setHasReverseSection(true);
      addToHistory(updatedRows);
    }
  };

  const handleInputChange = (e, rowIndex, colIndex) => {
    const newValue = e.target.value;
    const newRows = rows.map((row, rIdx) => {
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
    
    // Calculate popup dimensions (approximate)
    const popupWidth = 150; // min-width of popup
    const popupHeight = 150; // approximate height
    
    // Adjust position to ensure popup is fully visible
    let adjustedX = x;
    let adjustedY = y;
    
    // Check if popup would go off the right edge
    if (x + popupWidth / 2 > windowWidth) {
      adjustedX = windowWidth - popupWidth / 2 - 10;
    }
    
    // Check if popup would go off the left edge
    if (x - popupWidth / 2 < 0) {
      adjustedX = popupWidth / 2 + 10;
    }
    
    // Check if popup would go off the top edge
    if (y - popupHeight < 0) {
      adjustedY = popupHeight + 10;
    }
    
    setInsertPopupPosition({
      x: adjustedX,
      y: adjustedY
    });
    
    setClickedRowIndex(index);
    setShowInsertPopup(true);
  };

  // Function to insert row above
  const insertRowAbove = (index) => {
    // Check if the row is part of the reverse section
    const reverseIndex = rows.findIndex(isReverseRow);
    if (reverseIndex !== -1 && (index === reverseIndex || index === reverseIndex - 1 || index === reverseIndex + 1)) {
      // Don't allow inserting rows into the reverse section
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
    // Check if the row is part of the reverse section
    const reverseIndex = rows.findIndex(isReverseRow);
    if (reverseIndex !== -1 && (index === reverseIndex || index === reverseIndex - 1 || index === reverseIndex + 1)) {
      // Don't allow inserting rows into the reverse section
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

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    // Check if either the drag or hover index is part of the reverse section
    const reverseIndex = rows.findIndex(isReverseRow);
    if (reverseIndex !== -1) {
      if (dragIndex === reverseIndex || dragIndex === reverseIndex - 1 || dragIndex === reverseIndex + 1 ||
          hoverIndex === reverseIndex || hoverIndex === reverseIndex - 1 || hoverIndex === reverseIndex + 1) {
        // Don't allow moving rows into or out of the reverse section
        return;
      }
    }
    
    setRows((prevRows) => {
      const newRows = [...prevRows];
      const [removed] = newRows.splice(dragIndex, 1);
      newRows.splice(hoverIndex, 0, removed);
      setTableData(newRows);
      return newRows;
    });
  }, [rows, setTableData]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []); // Keep this empty

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setTableData(rows);
  }, [rows, setTableData]);

  const deleteRow = (rowIndex) => {
    // Check if the row is part of the reverse section
    const reverseIndex = rows.findIndex(isReverseRow);
    if (reverseIndex !== -1 && (rowIndex === reverseIndex || rowIndex === reverseIndex - 1 || rowIndex === reverseIndex + 1)) {
      // Don't allow deleting individual rows in the reverse section
      return;
    }
    
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
    setTableData(newRows);
    addToHistory(newRows);
  };

  // Function to delete the entire reverse section
  const deleteReverseSection = (reverseRowIndex) => {
    // Remove all three rows of the reverse section
    const newRows = rows.filter((_, index) => index < reverseRowIndex - 1 || index > reverseRowIndex + 1);
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

  const exportToPDF = async () => {
    try {
      console.log('Starting PDF generation...');
      
      // Create PDF document
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;

      console.log('Loading logo...');
      // Load logo
      const logoUrl = process.env.PUBLIC_URL + '/logo.jpg';
      const logoSize = 20; // Square dimensions for logo
      const logoMargin = margin;

      // Load image asynchronously
      let img;
      try {
        img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "Anonymous";
          
          image.onload = () => {
            console.log('Logo loaded successfully');
            resolve(image);
          };
          
          image.onerror = (e) => {
            console.error('Logo load error:', e);
            resolve(null);
          };
          
          image.src = logoUrl;
        });
      } catch (logoError) {
        console.error('Logo loading error:', logoError);
        img = null;
      }

      console.log('Adding content to PDF...');
      
      // Add logo if available
      if (img) {
        try {
          doc.addImage(img, 'JPEG', logoMargin, logoMargin, logoSize, logoSize);
        } catch (addImageError) {
          console.error('Error adding logo to PDF:', addImageError);
        }
      }

      // Add title with dynamic program number - centered
      doc.setFontSize(18);
      doc.setTextColor(168, 75, 42); // Copper tone color (#A84B2A)
      const titleY = margin + 10;
      doc.text("HV Coach SWITCHING PROGRAM", pageWidth / 2, titleY, { 
        align: 'center'
      });

      // Add horizontal line below the header
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(margin, titleY + 5, pageWidth - margin, titleY + 5);

      // Start content below the line
      let yPos = titleY + 15;

      // Add the name and program number section
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Calculate positions for right-aligned fields
      const nameX = pageWidth - margin - 160; // Further right
      const programNoX = pageWidth - margin - 60; // Even further right

      // Location section first
      doc.setFont(undefined, 'bold');
      doc.text("Location:", margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(formData.location || '', margin + 30, yPos);

      // NAME field
      doc.setFont(undefined, 'bold');
      doc.text("NAME:", nameX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(formData.name || '', nameX + 25, yPos);

      // Program No field
      doc.setFont(undefined, 'bold');
      doc.text("Program No:", programNoX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(formData.programNo || '', programNoX + 35, yPos);

      // Work Description section
      yPos += 10;
      doc.setFont(undefined, 'bold');
      doc.text("Work Description:", margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(formData.workDescription || '', margin + 50, yPos);

      // Signature sections
      yPos += 20;
      const signatureStartY = yPos;
      const colWidth = 90; // Increased width between sections
      const labelWidth = 25; // Width for labels (Name, Signature, etc.)
      const valueOffset = 80; // Space between label and value
      
      // Prepared by section
      doc.setFont(undefined, 'bold');
      doc.text("Prepared by:", margin, signatureStartY);
      
      // Prepared by fields
      const preparedByX = margin;
      doc.setFont(undefined, 'normal');
      
      // Name field
      doc.text("Name(print):", preparedByX, signatureStartY + 10);
      doc.text(formData.preparedByName || '', preparedByX + valueOffset, signatureStartY + 10);
      
      // Signature field
      doc.text("Signature:", preparedByX, signatureStartY + 20);
      doc.text(formData.preparedBySignature || '', preparedByX + valueOffset, signatureStartY + 20);
      
      // Time field
      doc.text("Time:", preparedByX, signatureStartY + 30);
      doc.text(formData.preparedByTime || '', preparedByX + valueOffset, signatureStartY + 30);
      
      // Date field
      doc.text("Date:", preparedByX, signatureStartY + 40);
      doc.text(formData.preparedByDate || '', preparedByX + valueOffset, signatureStartY + 40);

      // Checked by section
      const checkedByX = margin + colWidth + 20;
      doc.setFont(undefined, 'bold');
      doc.text("Checked by:", checkedByX, signatureStartY);
      
      // Checked by fields
      doc.setFont(undefined, 'normal');
      
      // Name field
      doc.text("Name(print):", checkedByX, signatureStartY + 10);
      doc.text(formData.checkedByName || '', checkedByX + valueOffset, signatureStartY + 10);
      
      // Signature field
      doc.text("Signature:", checkedByX, signatureStartY + 20);
      doc.text(formData.checkedBySignature || '', checkedByX + valueOffset, signatureStartY + 20);
      
      // Time field
      doc.text("Time:", checkedByX, signatureStartY + 30);
      doc.text(formData.checkedByTime || '', checkedByX + valueOffset, signatureStartY + 30);
      
      // Date field
      doc.text("Date:", checkedByX, signatureStartY + 40);
      doc.text(formData.checkedByDate || '', checkedByX + valueOffset, signatureStartY + 40);

      // Authorised section
      const authorisedX = checkedByX + colWidth + 20;
      doc.setFont(undefined, 'bold');
      doc.text("Authorised:", authorisedX, signatureStartY);
      
      // Authorised fields
      doc.setFont(undefined, 'normal');
      
      // Name field
      doc.text("Name(print):", authorisedX, signatureStartY + 10);
      doc.text(formData.authorisedName || '', authorisedX + valueOffset, signatureStartY + 10);
      
      // Signature field
      doc.text("Signature:", authorisedX, signatureStartY + 20);
      doc.text(formData.authorisedSignature || '', authorisedX + valueOffset, signatureStartY + 20);
      
      // Time field
      doc.text("Time:", authorisedX, signatureStartY + 30);
      doc.text(formData.authorisedTime || '', authorisedX + valueOffset, signatureStartY + 30);
      
      // Date field
      doc.text("Date:", authorisedX, signatureStartY + 40);
      doc.text(formData.authorisedDate || '', authorisedX + valueOffset, signatureStartY + 40);

      // Reference Drawing/s section - moved further right
      const refDrawingX = pageWidth - margin - 150;
      doc.setFont(undefined, 'bold');
      doc.text("Reference Drawing/s", refDrawingX, signatureStartY);
      doc.setFont(undefined, 'normal');
      doc.text(formData.referenceDrawings || '', refDrawingX, signatureStartY + 10);

      // Add table starting position
      const tableStartY = signatureStartY + 50;

      console.log('Processing table data...');
      // Convert rows data for autoTable
      const tableRows = [];
      let itemNumber = 1;
      const reverseIndex = rows.findIndex(row => row[4] === 'REVERSE');

      rows.forEach((row, index) => {
        let formattedRow;
        if (reverseIndex !== -1) {
          if (index === reverseIndex - 1 || index === reverseIndex || index === reverseIndex + 1) {
            formattedRow = ['', ...row];
          } else if (index < reverseIndex) {
            formattedRow = [itemNumber++, ...row];
          } else if (index > reverseIndex + 1) {
            formattedRow = [itemNumber++, ...row];
          }
        } else {
          formattedRow = [itemNumber++, ...row];
        }

        if (formattedRow && formattedRow[5] === 'REVERSE') {
          formattedRow[5] = { content: 'REVERSE', styles: { fontStyle: 'bold', textColor: [0, 0, 0], decoration: 'underline' } };
        }

        if (formattedRow) {
          tableRows.push(formattedRow);
        }
      });

      console.log('Generating table in PDF...');
      // Add table with autoTable plugin
      autoTable(doc, {
        head: [['Item', ...columns]],
        body: tableRows,
        startY: tableStartY,
        theme: 'grid',
        headStyles: {
          fillColor: [46, 46, 46], // #2E2E2E Dark charcoal
          textColor: [247, 247, 247], // #F7F7F7 Off-white
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [247, 247, 247] // #F7F7F7 Light background
        },
        styles: {
          cellPadding: 2,
          fontSize: 8,
          valign: 'middle',
          overflow: 'linebreak',
          cellWidth: 'wrap',
          textColor: [46, 46, 46], // #2E2E2E Dark charcoal
          lineColor: [212, 212, 212], // #D4D4D4 Border color
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 'auto' },
          6: { cellWidth: 20 },
          7: { cellWidth: 30 },
        },
        didDrawPage: function(data) {
          if (img) {
            try {
              doc.addImage(img, 'JPEG', logoMargin, logoMargin, logoSize, logoSize);
            } catch (error) {
              console.error('Error adding logo to new page:', error);
            }
          }
          data.settings.margin.top = margin + logoSize + 5;
          doc.setFontSize(8);
          doc.setTextColor(46, 46, 46); // #2E2E2E Dark charcoal
          doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        },
      });

      console.log('Preparing to save PDF...');
      // Create filename
      const preparedBy = (formData.preparedBy || 'Unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const programNo = (formData.programNo || 'NoNumber').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `${preparedBy}_program_${programNo}_${currentDate}.pdf`;

      // Save PDF
      console.log('Saving PDF as:', filename);
      doc.save(filename);
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('Detailed error in PDF generation:', error);
      alert('There was an error generating the PDF. Please check the browser console for details and try again.');
    }
  };

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
            .action-column {
              width: 80px;
              text-align: center;
            }
            .item-column {
              width: 50px;
              text-align: center;
            }
            .action-column .btn-link {
              padding: 0;
              margin: 0 5px;
            }
            .action-column .btn-link:hover {
              opacity: 0.8;
            }
            .action-btn {
              transition: transform 0.2s;
            }
            .action-btn:hover {
              transform: scale(1.2);
            }
            .insert-options {
              display: flex;
              flex-direction: column;
              gap: 5px;
              min-width: 150px;
            }
            .insert-options button {
              white-space: nowrap;
            }
            .bi {
              font-size: 1.1rem;
              vertical-align: -0.125em;
            }
            .action-column .bi {
              font-size: 1.2rem;
            }
            .button-container .bi {
              margin-right: 0.5rem;
            }
            .undo-button {
              background-color: #6c757d;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .undo-button:hover {
              background-color: #5a6268;
            }
            .undo-button:disabled {
              background-color: #ccc;
              cursor: not-allowed;
            }
            .reverse-section {
              background-color: #f8f9fa;
              position: relative;
              background-image: linear-gradient(45deg, #f8f9fa 25%, #e9ecef 25%, #e9ecef 50%, #f8f9fa 50%, #f8f9fa 75%, #e9ecef 75%, #e9ecef 100%);
              background-size: 20px 20px;
              background-position: 0 0;
            }
            .reverse-section:first-of-type {
              border-top: 2px solid #6c757d;
            }
            .reverse-section:last-of-type {
              border-bottom: 2px solid #6c757d;
            }
            .reverse-section td:first-child {
              border-left: 2px solid #6c757d;
            }
            .reverse-section td:last-child {
              border-right: 2px solid #6c757d;
            }
            .reverse-section input {
              background-color: transparent;
              cursor: not-allowed;
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
            userSelect: isDragging ? 'none' : 'auto',
            WebkitUserSelect: isDragging ? 'none' : 'auto',
            MozUserSelect: isDragging ? 'none' : 'auto',
          }}
        >
          <table className="table table-bordered">
            <thead>
              <tr>
                <th className="item-column">Item</th>
                {columns.map((col, index) => (
                  <ResizableHeader
                    key={index}
                    width={columnWidths[index]}
                    onResize={onResize(index)}
                  >
                    {col}
                  </ResizableHeader>
                ))}
                <th className="action-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                let itemNumber = '';
                const reverseIndex = rows.findIndex(isReverseRow);
                if (index <= lastNumberedIndex) {
                  itemNumber = index + 1;
                } else if (reverseIndex !== -1 && index > reverseIndex + 1) {
                  const numberedRowsAfterReverse = index - reverseIndex - 2;
                  itemNumber = lastNumberedIndex + 2 + numberedRowsAfterReverse;
                }
              
                // Determine if this row is part of the reverse section
                const isReverseSection = reverseIndex !== -1 && index >= reverseIndex - 1 && index < reverseIndex + 2;
                
                return (
                  <DraggableRow
                    key={`row-${index}`}
                    row={row}
                    index={index}
                    moveRow={moveRow}
                    handleInputChange={handleInputChange}
                    deleteRow={deleteRow}
                    itemNumber={itemNumber}
                    isReverseSection={isReverseSection}
                    columnWidths={columnWidths}
                    onClick={handleRowClick}
                    onInsertClick={handleInsertClick}
                    isScrolling={isScrolling}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    deleteReverseSection={deleteReverseSection}
                  />
                );
              })}
            </tbody>
          </table>
          
          {/* Insert popup */}
          {showInsertPopup && clickedRowIndex !== null && (
            <div 
              ref={popupRef}
              className="insert-options" 
              style={{ 
                position: 'fixed', 
                top: `${insertPopupPosition.y}px`, 
                left: `${insertPopupPosition.x}px`, 
                transform: 'translate(-50%, -100%)', 
                backgroundColor: 'white', 
                border: '1px solid #ccc', 
                padding: '10px', 
                zIndex: 1000,
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                borderRadius: '6px',
                marginTop: '-10px',
                animation: 'fadeIn 0.2s ease-in-out'
              }}
            >
              <style>
                {`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -90%); }
                    to { opacity: 1; transform: translate(-50%, -100%); }
                  }
                `}
              </style>
              <div className="text-center mb-2">
                <small className="text-muted">Insert Row</small>
              </div>
              <button
                className="btn btn-outline-primary btn-sm w-100 mb-2"
                onClick={() => insertRowAbove(clickedRowIndex)}
                title="Insert a new row above the selected row"
              >
                <i className="bi bi-arrow-up-circle mr-1"></i> Above
              </button>
              <button
                className="btn btn-outline-primary btn-sm w-100 mb-2"
                onClick={() => insertRowBelow(clickedRowIndex)}
                title="Insert a new row below the selected row"
              >
                <i className="bi bi-arrow-down-circle mr-1"></i> Below
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm w-100" 
                onClick={() => {
                  setClickedRowIndex(null);
                  setShowInsertPopup(false);
                }}
                title="Cancel row insertion"
              >
                <i className="bi bi-x-circle mr-1"></i> Cancel
              </button>
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
          <button className="btn btn-info" onClick={copyFromAbove} title="Add a new row with data copied from the row above">
            <i className="bi bi-files mr-1"></i> Copy From Above
          </button>
          <button 
            className="btn btn-secondary"
            onClick={addReverseSection}
            disabled={hasReverseSection}
            title="Add a reverse section to the program (can only be added once)"
          >
            <i className="bi bi-arrow-left-right mr-1"></i> Reverse
          </button>
          <button className="btn btn-primary" onClick={exportToPDF} title="Export the current program to a PDF document">
            <i className="bi bi-file-earmark-pdf mr-1"></i> Export to PDF
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default ProgramTable;