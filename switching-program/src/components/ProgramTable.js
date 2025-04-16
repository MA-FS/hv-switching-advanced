import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Resizable } from 'react-resizable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import 'react-resizable/css/styles.css';
import redX from './red_x.png'; // Ensure the path is correct

const ItemType = 'ROW';

const DraggableRow = React.memo(({ row, index, moveRow, handleInputChange, deleteRow, itemNumber, isReverseSection, columnWidths, onRowClick, isScrolling, isCurrentlyDragging }) => {
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

  return (
    <tr 
      ref={ref} 
      style={{ // Apply isCurrentlyDragging here
        opacity: isDragging ? 0.5 : 1,
        cursor: isScrolling ? 'default' : 'move', // Change cursor style based on isScrolling
      }}
      className={isReverseSection ? 'reverse-section' : ''}
      onClick={() => !isScrolling && onRowClick(index)} // Call onRowClick when not scrolling
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
      <td className="delete-column">
        <button className="btn btn-link text-danger p-0" onClick={() => deleteRow(index)}>
          <img src={redX} alt="Delete" width="16" height="16" />
        </button>
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
  const [insertionIndex, setInsertionIndex] = useState(null); // State to track insertion row
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
  const touchThreshold = 5;

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
    setRows([...rows, newRow]);
  };

  const copyFromAbove = () => {
    if (rows.length === 0) {
      addRow();
      return;
    }

    const lastRow = rows[rows.length - 1];
    const newRow = [...lastRow];
    
    // Copy only specific columns
    const columnsToCopy = [0, 1, 2, 3]; // Indices for Location, Volts, Type, Identity
    for (let i = 0; i < newRow.length; i++) {
      if (!columnsToCopy.includes(i)) {
        newRow[i] = '';
      }
    }

    setRows([...rows, newRow]);
  };

  const addReverseSection = () => {
    if (!hasReverseSection) {
      const newRows = [
        Array(columns.length).fill(''),
        ['', '', '', '', 'REVERSE', '', ''],
        Array(columns.length).fill(''),
      ];
      setRows([...rows, ...newRows]);
      setHasReverseSection(true);
    }
  };

  const handleInputChange = (e, rowIndex, colIndex) => {
    const newValue = e.target.value;
    const newRows = rows.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        const updatedRow = [...row];
        if (colIndex === 2) { // Index 2 corresponds to the "Type" column
          updatedRow[colIndex] = newValue.toUpperCase();
        } else {
          updatedRow[colIndex] = newValue;
        }
        return updatedRow;
      }
      return row;
    });
    setRows(newRows);
  };

  // Function to handle row click and set insertion index
  const handleRowClick = (index) => {
    setInsertionIndex(index);
  };

  const insertRowAbove = () => {
    const newRow = Array(columns.length).fill('');
    setRows([...rows.slice(0, insertionIndex), newRow, ...rows.slice(insertionIndex)]);
    setInsertionIndex(null);
  };

  const insertRowBelow = () => {
    const newRow = Array(columns.length).fill('');
    setRows([...rows.slice(0, insertionIndex + 1), newRow, ...rows.slice(insertionIndex + 1)]);
    setInsertionIndex(null);
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
  };

  const onResize = (index) => (event, { size }) => {
    const newColumnWidths = [...columnWidths];
    newColumnWidths[index] = size.width;
    setColumnWidths(newColumnWidths);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;

    // Load logo
    const logoUrl = process.env.PUBLIC_URL + '/logo.png';
    const logoWidth = 30;
    const logoHeight = 15;

    // We need to load the image asynchronously
    const img = new Image();
    img.onload = function() {
      doc.addImage(img, 'PNG', margin, margin, logoWidth, logoHeight);

      // Add title with dynamic program number
      doc.setFontSize(18);
      doc.setTextColor(186, 148, 46); // Gold color
      doc.text(`Switching Program ${formData.programNo}`, pageWidth / 2, margin + 5, { align: 'center' });

      // Add form data
      doc.setFontSize(10);
      doc.setTextColor(0);
      const formDataFields = [
        { label: 'Work', value: formData.work, width: 2 }, // Give 'Work' 2 columns width
        { label: 'Site', value: formData.site },
        { label: 'Permit Number', value: formData.permitNo }, // Updated label here
        { label: 'Reference Drawing', value: formData.referenceDrawing },
        { label: 'Program No', value: formData.programNo },
        { label: 'Date', value: formData.date },
        { label: 'Prepared by', value: formData.preparedBy },
        { label: 'Time', value: formData.time },
        { label: 'Switcher', value: formData.switcher },
        { label: 'Checked By', value: formData.checkedBy },
        { label: 'Witness', value: formData.witness }
      ];

      let yPos = margin + logoHeight + 10;
      const colWidth = (pageWidth - 2 * margin) / 3;
      let colsUsed = 0;

      formDataFields.forEach((field) => {
        const fieldWidth = field.width || 1; // Default to 1 column if width not specified
        if (colsUsed + fieldWidth > 3) {
          yPos += 10;
          colsUsed = 0;
        }
        const xPos = margin + colsUsed * colWidth;
        
        doc.setFont(undefined, 'bold');
        doc.text(`${field.label}:`, xPos, yPos);
        doc.setFont(undefined, 'normal');
        
        // Split long text into multiple lines if necessary
        const maxWidth = colWidth * fieldWidth - 40; // Adjust 40 as needed for padding
        const lines = doc.splitTextToSize(field.value, maxWidth);
        doc.text(lines, xPos + 35, yPos);
        
        // Increase yPos if multiple lines
        if (lines.length > 1) {
          yPos += (lines.length - 1) * 5; // Adjust 5 as needed for line spacing
        }
        
        colsUsed += fieldWidth;
      });

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

        // Check if this is the REVERSE row and format it
        if (formattedRow[5] === 'REVERSE') {
          formattedRow[5] = { content: 'REVERSE', styles: { fontStyle: 'bold', textColor: [0, 0, 0], decoration: 'underline' } };
        }

        tableRows.push(formattedRow);
      });

      // Add table
      doc.autoTable({
        head: [['Item', ...columns]],
        body: tableRows,
        startY: yPos + 15,
        theme: 'grid',
        headStyles: {
          fillColor: [77, 15, 74], // American Purple
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        styles: {
          cellPadding: 2,
          fontSize: 8,
          valign: 'middle',
          overflow: 'linebreak',
          cellWidth: 'wrap',
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
          // Add logo and title to each page
          doc.addImage(img, 'PNG', margin, margin, logoWidth, logoHeight);
          doc.setFontSize(18);
          doc.setTextColor(186, 148, 46); // Gold color
          doc.text(`Switching Program ${formData.programNo}`, pageWidth / 2, margin + 5, { align: 'center' });
  
          // Ensure enough space between title and table
          data.settings.margin.top = margin + logoHeight + 20;
  
          // Footer
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        },
      });

      // Create a custom filename with date
      const preparedBy = formData.preparedBy || 'Unknown';
      const programNo = formData.programNo || 'NoNumber';
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const sanitizedPreparedBy = preparedBy.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const sanitizedProgramNo = programNo.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedPreparedBy}_program_${sanitizedProgramNo}_${currentDate}.pdf`;

      // Save the PDF with the custom filename
      doc.save(filename);
    };
    img.src = logoUrl;
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
          }
        }}
        onTouchEnd={() => {
          setIsScrolling(false);
          touchStart.current = { x: 0, y: 0 };
        }}
      >
        <div className="header-section">
          {/* Header content here */}
        </div>
        <div 
          // Make sure to update the ID here as well.
          // It should match the ID used in the touch event listeners above.
          // If the ID is not found during runtime, consider adjusting 
          // how this element is identified (e.g., using a ref).
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
                <th className="delete-column">Delete</th>
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
                    onRowClick={handleRowClick} // Pass the click handler
                    isScrolling={isScrolling}
                    isCurrentlyDragging={isDragging} // Changed isDragging to isCurrentlyDragging
                  />
                );
              })}
            </tbody>
            {insertionIndex !== null && (
              <div className="insertion-buttons">
                <button className="btn btn-secondary" onClick={insertRowAbove}>Insert Above</button>
                <button className="btn btn-secondary" onClick={insertRowBelow}>Insert Below</button>
              </div>
            )}
          </table>
        </div>
        <div className="button-container">
          <button className="btn btn-success" onClick={addRow}>Add Row</button>
          <button className="btn btn-info" onClick={copyFromAbove}>Copy From Above</button>
          <button 
            className="btn btn-secondary"
            onClick={addReverseSection}
            disabled={hasReverseSection}
          >
            Reverse
          </button>
          <button className="btn btn-primary" onClick={exportToPDF}>Export to PDF</button>
        </div>
      </div>
    </DndProvider>
  );
};

export default ProgramTable;