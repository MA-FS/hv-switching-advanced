import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import redX from './red_x.png'; // Ensure the path is correct

const ItemType = 'ROW';

const DraggableRow = ({ row, index, moveRow, handleInputChange, deleteRow }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { type: ItemType, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <td className="item-column">{index + 1}</td>
      {row.map((col, colIndex) => (
        <td key={colIndex} className={`col-${colIndex}`}>
          <input
            type="text"
            className="form-control"
            value={col}
            onChange={(e) => handleInputChange(e, index, colIndex)}
          />
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

const ProgramTable = ({ tableData, setTableData, formData }) => {
  const [rows, setRows] = useState(tableData);
  const [columns] = useState([
    'Location', 'Volts', 'Type', 'Identity', 'Instruction', 'Time', 'Witness'
  ]);

  useEffect(() => {
    setTableData(rows);
  }, [rows, setTableData]);

  useEffect(() => {
    setRows(tableData);
  }, [tableData]);

  const addRow = () => {
    setRows([...rows, Array(columns.length).fill('')]);
  };

  const addReverseSection = () => {
    const newRows = [
      Array(columns.length).fill(''),
      ['', '', '', '', <b><u>REVERSE</u></b>, '', ''],
      Array(columns.length).fill(''),
    ];
    setRows([...rows, ...newRows]);
  };

  const handleInputChange = (e, rowIndex, colIndex) => {
    const newRows = rows.map((row, rIdx) => (
      rIdx === rowIndex ? row.map((col, cIdx) => (cIdx === colIndex ? e.target.value : col)) : row
    ));
    setRows(newRows);
  };

  const moveRow = (dragIndex, hoverIndex) => {
    const draggedRow = rows[dragIndex];
    const newRows = [...rows];
    newRows.splice(dragIndex, 1);
    newRows.splice(hoverIndex, 0, draggedRow);
    setRows(newRows);
  };

  const deleteRow = (rowIndex) => {
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');

    // Add form data to the PDF
    const formDataText = `
      Work: ${formData.work} | Site: ${formData.site} | Procedure Permit No: ${formData.permitNo} | Reference Drawing: ${formData.referenceDrawing} | Program No: ${formData.programNo}
      Date: ${formData.date} | Prepared by: ${formData.preparedBy} | Time: ${formData.time} | Switcher: ${formData.switcher} | Checked By: ${formData.checkedBy} | Witness: ${formData.witness}
    `;
    doc.setFontSize(10);
    doc.text(formDataText, 10, 10);

    // Convert rows data for autoTable
    const tableRows = rows.map((row, index) => [index + 1, ...row]);

    doc.autoTable({
      head: [['Item', ...columns]],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      margin: { top: 20 },
      didDrawPage: function (data) {
        // Footer with page count
        let pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      },
    });

    doc.save('switching_program.pdf');
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
              {columns.map((col, index) => <th key={index} className={`col-${index}`}>{col}</th>)}
              <th className="delete-column">Delete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <DraggableRow
                key={index}
                row={row}
                index={index}
                moveRow={moveRow}
                handleInputChange={handleInputChange}
                deleteRow={deleteRow}
              />
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-success" onClick={addRow}>Add Row</button>
      <button className="btn btn-secondary ml-2" onClick={addReverseSection}>Reverse</button>
      <button className="btn btn-primary" onClick={exportToPDF}>Export to PDF</button>
    </div>
  );
};

export default ProgramTable;