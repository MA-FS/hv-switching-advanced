import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 'react-resizable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import 'react-resizable/css/styles.css';
import redX from './red_x.png'; // Ensure the path is correct

const ItemType = 'ROW';

const DraggableRow = ({ row, index, moveRow, handleInputChange, deleteRow, itemNumber, isReverseSection, columnWidths }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => ({ type: ItemType, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const isReverseRow = row[4] === 'REVERSE';

  return (
    <tr 
      ref={ref} 
      style={{ opacity: isDragging ? 0.5 : 1 }}
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
      <td className="delete-column">
        <button className="btn btn-link text-danger p-0" onClick={() => deleteRow(index)}>
          <img src={redX} alt="Delete" width="16" height="16" />
        </button>
      </td>
    </tr>
  );
};

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
  const [lastNumberedIndex, setLastNumberedIndex] = useState(-1);
  const [hasReverseSection, setHasReverseSection] = useState(false);
  const [columns] = useState([
    'Location', 'Volts', 'Type', 'Identity', 'Instruction', 'Time', 'Witness'
  ]);
  const [columnWidths, setColumnWidths] = useState([
    100, 80, 80, 100, 200, 80, 100
  ]);

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

  const moveRow = (fromIndex, toIndex) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      const [movedRow] = updatedRows.splice(fromIndex, 1);
      updatedRows.splice(toIndex, 0, movedRow);
      return updatedRows;
    });
  };

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
        if (reverseIndex !== -1) {
          if (index === reverseIndex - 1 || index === reverseIndex || index === reverseIndex + 1) {
            tableRows.push(['', ...row]);
          } else if (index < reverseIndex) {
            tableRows.push([itemNumber++, ...row]);
          } else if (index > reverseIndex + 1) {
            tableRows.push([itemNumber++, ...row]);
          }
        } else {
          tableRows.push([itemNumber++, ...row]);
        }
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
          // Footer
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        },
      });

      doc.save('switching_program.pdf');
    };
    img.src = logoUrl;
  };

  return (
    <div className="spreadsheet-container p-3">
      <div className="header-section">
        {/* Header content here */}
      </div>
      <div id="table-container" className="table-container">
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
                  {index === 2 && <span title="Uppercase only" className="ml-1">🔠</span>}
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
                  key={index}
                  row={row}
                  index={index}
                  moveRow={moveRow}
                  handleInputChange={handleInputChange}
                  deleteRow={deleteRow}
                  itemNumber={itemNumber}
                  isReverseSection={isReverseSection}
                  columnWidths={columnWidths}
                />
              );
            })}
          </tbody>
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
  );
};

export default ProgramTable;