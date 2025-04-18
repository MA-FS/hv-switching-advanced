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
    canDrag: () => !isReverseSection,
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

  const isReverseRow = row[5] === 'REVERSE';
  const showDeleteButton = isReverseSection && isReverseRow && rowInReverseBlock === 1;

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
      }}
      onClick={handleRowClick}
      className={isReverseSection ? 'reverse-section' : ''}
      title={isReverseSection ? "Reverse section (not draggable)" : "Click to select, drag to reorder"}
    >
      <td className="item-column">{isReverseSection ? '' : itemNumber}</td>
      {row.map((col, colIndex) => (
        <td key={colIndex} style={{ width: columnWidths[colIndex] + 'px' }}>
          {col === 'REVERSE' && colIndex === 5 ? (
            <div className="reverse-text">
              REVERSE
            </div>
          ) : (
            <input
              type="text"
              className={`form-control ${isReverseSection ? 'reverse-input' : ''}`}
              value={col}
              onChange={(e) => handleInputChange(e, index, colIndex)}
              style={{ width: '100%' }}
              disabled={isReverseSection}
            />
          )}
        </td>
      ))}
      <td className="actions-cell">
        {showDeleteButton ? (
          <button 
            className="btn btn-link p-0 action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              deleteReverseSection(index - 1);
            }}
            title="Delete the entire reverse section"
          >
            <i className="bi bi-trash-fill"></i>
          </button>
        ) : !isReverseSection ? (
          <div className="d-flex justify-content-center align-items-center">
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

const ProgramTable = ({ tableData, setTableData, formData }) => {
  const [rows, setRows] = useState(tableData);  
  const [isDragging, setIsDragging] = useState(false);
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

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    // Don't allow moving if either index involves a reverse block
    if (rows[dragIndex]?.isReverseBlock || rows[hoverIndex]?.isReverseBlock) {
      return;
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

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      const copperColor = [168, 75, 42]; // Copper tone color (#A84B2A)
      const logoSize = 20;

      // Load logo
      const logoUrl = process.env.PUBLIC_URL + '/logo.jpg';
      
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
        doc.setFontSize(16);
        doc.setTextColor(copperColor[0], copperColor[1], copperColor[2]);
        doc.text("HV Coach", margin + logoSize + 5, margin + 8);
        doc.text("SWITCHING PROGRAM", margin + logoSize + 45, margin + 8);

        // Add name and program number
        doc.setFontSize(10);
        doc.setTextColor(0);
        const nameY = margin + 5;
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

      // Add first page header
      addHeader();

      // Location and Work Description table
      autoTable(doc, {
        startY: margin + logoSize + 5,
        body: [
          [
            { content: 'Location:', styles: { fontStyle: 'bold' } },
            { content: formData.location || '' }
          ],
          [
            { content: 'Work Description:', styles: { fontStyle: 'bold' } },
            { content: formData.workDescription || '' }
          ]
        ],
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [128, 128, 128],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      // Signature section table with copper tone header
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        head: [
          [
            { content: '', styles: { fillColor: copperColor } },
            { content: 'Name(print)', styles: { fillColor: copperColor, textColor: [255, 255, 255] } },
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
          fontSize: 10,
          cellPadding: 2,
          lineColor: [128, 128, 128],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      // Main switching program table
      const tableStartY = doc.lastAutoTable.finalY + 5;
      
      // Process table data
      const tableRows = [];
      let itemNumber = 1;
      rows.forEach((rowData, index) => {
        if (rowData.isReverseBlock) {
          rowData.rows.forEach((row, rowIndex) => {
            const formattedRow = ['', ...row];
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
          });
        } else {
          const formattedRow = [itemNumber++, ...rowData];
          tableRows.push(formattedRow);
        }
      });

      // Calculate available height for table content
      const firstPageContentHeight = pageHeight - tableStartY - margin;
      const subsequentPagesContentHeight = pageHeight - (margin + 15) - margin; // Account for header and margins
      
      // Calculate approximate rows per page based on row height
      const rowHeight = 12; // Approximate height of each row in mm
      const firstPageRows = Math.floor(firstPageContentHeight / rowHeight);
      const subsequentPagesRows = Math.floor(subsequentPagesContentHeight / rowHeight);
      
      // Calculate total pages more accurately
      let remainingRows = tableRows.length;
      let calculatedTotalPages = 1;
      remainingRows -= firstPageRows;
      
      while (remainingRows > 0) {
        calculatedTotalPages++;
        remainingRows -= subsequentPagesRows;
      }

      // Store total pages in a variable that will be accessible in didDrawPage
      const totalPages = calculatedTotalPages;

      // Update the main switching program table headers
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
        body: tableRows,
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
            doc.rect(0, 0, pageWidth, margin + 25, 'F');
            
            // Add header with exact same spacing as first page
            if (img) {
              try {
                doc.addImage(img, 'JPEG', margin, margin, logoSize, logoSize);
              } catch (error) {
                console.error('Error adding logo:', error);
              }
            }

            // Add title with exact same spacing as first page
            doc.setFontSize(16);
            doc.setTextColor(copperColor[0], copperColor[1], copperColor[2]);
            doc.text("HV Coach", margin + logoSize + 5, margin + 8);
            doc.text("SWITCHING PROGRAM", margin + logoSize + 45, margin + 8);

            // Add name and program number with exact same spacing as first page
            doc.setFontSize(10);
            doc.setTextColor(0);
            const nameY = margin + 5;
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
        },
        willDrawPage: function(data) {
          // Set consistent top margin for all pages
          data.settings.margin.top = margin + 25; // 25mm space for header
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

      // Save PDF
      const preparedBy = (formData.preparedByName || 'Unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const programNo = (formData.programNo || 'NoNumber').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `${preparedBy}_program_${programNo}_${currentDate}.pdf`;

      doc.save(filename);
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
            .item-column {
              width: 50px;
              text-align: center;
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
              margin: 0 2px;
            }
            .action-btn:hover {
              transform: scale(1.2);
            }
            .bi {
              font-size: 1.1rem;
              vertical-align: -0.125em;
            }
            thead th {
              text-align: center;
              vertical-align: middle !important;
            }
            .reverse-section {
              position: relative;
              background: repeating-linear-gradient(
                45deg,
                #f8f9fa,
                #f8f9fa 10px,
                #e9ecef 10px,
                #e9ecef 20px
              );
              transition: all 0.3s ease;
            }
            .reverse-section td {
              border-color: #adb5bd !important;
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
              opacity: 0.7;
              border-color: transparent;
            }
            .reverse-section input:disabled {
              color: #495057;
            }
            .reverse-text {
              text-align: center;
              font-size: 1.2em;
              color: #A84B2A;
              padding: 8px 0;
              font-weight: bold;
              letter-spacing: 1px;
              text-transform: uppercase;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .reverse-section .actions-cell {
              background-color: transparent;
            }
            .reverse-section .action-btn {
              position: absolute;
              right: 10px;
              top: 50%;
              transform: translateY(-50%);
              background-color: rgba(255, 255, 255, 0.9);
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border: 1px solid #dc3545;
            }
            .reverse-section .action-btn:hover {
              transform: translateY(-50%) scale(1.1);
              box-shadow: 0 3px 6px rgba(0,0,0,0.15);
            }
            .reverse-section .action-btn i {
              color: #dc3545;
              font-size: 1.2em;
            }
            .reverse-input {
              background-color: transparent !important;
              border: 1px solid transparent !important;
            }
            .reverse-block {
              position: relative;
              margin: 15px 0;
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
                if (rowData.isReverseBlock) {
                  return rowData.rows.map((row, rowIndex) => (
                    <DraggableRow
                      key={`reverse-${index}-${rowIndex}`}
                      row={row}
                      index={index}
                      moveRow={moveRow}
                      handleInputChange={handleInputChange}
                      deleteRow={deleteRow}
                      itemNumber={''}
                      isReverseSection={true}
                      columnWidths={columnWidths}
                      onClick={handleRowClick}
                      onInsertClick={handleInsertClick}
                      isScrolling={isScrolling}
                      deleteReverseSection={deleteReverseSection}
                      rowInReverseBlock={rowIndex}
                    />
                  ));
                }

                let itemNumber = '';
                if (!rowData.isReverseBlock) {
                  const precedingNonReverseCount = rows
                    .slice(0, index)
                    .filter(r => !r.isReverseBlock)
                    .length;
                  itemNumber = precedingNonReverseCount + 1;
                }

                return (
                  <DraggableRow
                    key={`row-${index}`}
                    row={rowData}
                    index={index}
                    moveRow={moveRow}
                    handleInputChange={handleInputChange}
                    deleteRow={deleteRow}
                    itemNumber={itemNumber}
                    isReverseSection={false}
                    columnWidths={columnWidths}
                    onClick={handleRowClick}
                    onInsertClick={handleInsertClick}
                    isScrolling={isScrolling}
                    deleteReverseSection={deleteReverseSection}
                    rowInReverseBlock={-1}
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