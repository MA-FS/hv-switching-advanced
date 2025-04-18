import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Resizable } from 'react-resizable';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'react-resizable/css/styles.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ItemType = 'ROW';

const DraggableRow = React.memo(({ row, index, moveRow, handleInputChange, deleteRow, itemNumber, isReverseSection, columnWidths, onClick, onInsertClick, isScrolling }) => {
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
        cursor: 'move',
      }}
      onClick={handleRowClick} // Use the new handler
      className={isReverseSection ? 'reverse-section' : ''}
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
            />
          )}
        </td>
      ))}
      <td className="action-column">
        <div className="d-flex justify-content-center">
          <button 
            className="btn btn-link text-primary p-0 mr-2 action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onInsertClick(index, e);
            }}
            title="Insert row"
          >
            <i className="bi bi-plus-circle-fill"></i>
          </button>
          <button 
            className="btn btn-link text-danger p-0 action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              deleteRow(index);
            }}
            title="Delete row"
          >
            <i className="bi bi-trash-fill"></i>
          </button>
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
      <th style={{ width: width + 'px' }}>{children}</th>
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
    addToHistory(newRows);
  };

  const addReverseSection = () => {
    if (!hasReverseSection) {
      const newRows = [
        Array(columns.length).fill(''),
        ['', '', '', '', 'REVERSE', '', ''],
        Array(columns.length).fill(''),
      ];
      const updatedRows = [...rows, ...newRows];
      setRows(updatedRows);
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
    const newRow = Array(columns.length).fill('');
    const newRows = [...rows.slice(0, index), newRow, ...rows.slice(index)];
    setRows(newRows);
    setClickedRowIndex(null);
    setShowInsertPopup(false);
    addToHistory(newRows);
  };

  const insertRowBelow = (index) => {
    const newRow = Array(columns.length).fill('');
    const newRows = [...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)];
    setRows(newRows);
    setClickedRowIndex(null);
    setShowInsertPopup(false);
    addToHistory(newRows);
  };

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    setRows((prevRows) => {
      const newRows = [...prevRows];
      const [removed] = newRows.splice(dragIndex, 1);
      newRows.splice(hoverIndex, 0, removed);
      return newRows;
    });
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []); // Keep this empty

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setTableData(rows);
  }, [rows, setTableData]); // Keep the dependencies

  const deleteRow = (rowIndex) => {
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
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

      // Add title with dynamic program number
      doc.setFontSize(18);
      doc.setTextColor(168, 75, 42); // #A84B2A Copper tone
      doc.text(`Switching Program ${formData.programNo || ''}`, pageWidth / 2, margin + (logoSize/2), { align: 'center' }); // Center title vertically with logo

      // Add form data
      doc.setFontSize(10);
      doc.setTextColor(46, 46, 46); // #2E2E2E Dark charcoal
      const formDataFields = [
        { label: 'Work', value: formData.work || '', width: 2 },
        { label: 'Site', value: formData.site || '' },
        { label: 'Permit Number', value: formData.permitNo || '' },
        { label: 'Reference Drawing', value: formData.referenceDrawing || '' },
        { label: 'Program No', value: formData.programNo || '' },
        { label: 'Date', value: formData.date || '' },
        { label: 'Prepared by', value: formData.preparedBy || '' },
        { label: 'Time', value: formData.time || '' },
        { label: 'Switcher', value: formData.switcher || '' },
        { label: 'Checked By', value: formData.checkedBy || '' },
        { label: 'Witness', value: formData.witness || '' }
      ];

      let yPos = margin + logoSize + 5; // Start form data below logo with some padding
      const colWidth = (pageWidth - 2 * margin) / 3;
      let colsUsed = 0;

      formDataFields.forEach((field) => {
        const fieldWidth = field.width || 1;
        if (colsUsed + fieldWidth > 3) {
          yPos += 10;
          colsUsed = 0;
        }
        const xPos = margin + colsUsed * colWidth;
        
        doc.setFont(undefined, 'bold');
        doc.text(`${field.label}:`, xPos, yPos);
        doc.setFont(undefined, 'normal');
        
        const maxWidth = colWidth * fieldWidth - 40;
        const lines = doc.splitTextToSize(field.value || '', maxWidth);
        doc.text(lines, xPos + 35, yPos);
        
        if (lines.length > 1) {
          yPos += (lines.length - 1) * 5;
        }
        
        colsUsed += fieldWidth;
      });

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
        startY: yPos + 15,
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
          doc.setFontSize(18);
          doc.setTextColor(168, 75, 42); // #A84B2A Copper tone
          doc.text(`Switching Program ${formData.programNo || ''}`, pageWidth / 2, margin + (logoSize/2), { align: 'center' });
          data.settings.margin.top = margin + logoSize + 5;
          doc.setFontSize(8);
          doc.setTextColor(46, 46, 46); // #2E2E2E Dark charcoal
          doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
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
              >
                <i className="bi bi-arrow-up-circle mr-1"></i> Above
              </button>
              <button
                className="btn btn-outline-primary btn-sm w-100 mb-2"
                onClick={() => insertRowBelow(clickedRowIndex)}
              >
                <i className="bi bi-arrow-down-circle mr-1"></i> Below
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm w-100" 
                onClick={() => {
                  setClickedRowIndex(null);
                  setShowInsertPopup(false);
                }}
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
          <button className="btn btn-success" onClick={addRow}>
            <i className="bi bi-plus-lg mr-1"></i> Add Row
          </button>
          <button className="btn btn-info" onClick={copyFromAbove}>
            <i className="bi bi-files mr-1"></i> Copy From Above
          </button>
          <button 
            className="btn btn-secondary"
            onClick={addReverseSection}
            disabled={hasReverseSection}
          >
            <i className="bi bi-arrow-left-right mr-1"></i> Reverse
          </button>
          <button className="btn btn-primary" onClick={exportToPDF}>
            <i className="bi bi-file-earmark-pdf mr-1"></i> Export to PDF
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default ProgramTable;