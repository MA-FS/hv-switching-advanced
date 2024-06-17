import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';

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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-x-circle" viewBox="0 0 16 16">
            <path d="M8 1a7 7 0 1 1-4.95 12.03A7 7 0 0 1 8 1zM4.646 4.646a.5.5 0 0 0-.708.708L7.293 8 3.938 11.354a.5.5 0 0 0 .708.708L8 8.707l3.354 3.354a.5.5 0 0 0 .708-.708L8.707 8l3.355-3.354a.5.5 0 0 0-.708-.708L8 7.293 4.646 3.938a.5.5 0 0 0-.708 0z"/>
          </svg>
        </button>
      </td>
    </tr>
  );
};

const ProgramTable = ({ tableData, setTableData }) => {
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

  const exportToCSV = () => {
    const csvData = rows.map(row => row.join(',')).join('\n');
    const csvBlob = new Blob([csvData], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = 'switching_program.csv';
    csvLink.click();
  };

  return (
    <div className="spreadsheet-container p-3">
      <div className="header-section">
        {/* Header content here */}
      </div>
      <div className="table-container">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th className="item-column">Item</th>
              {columns.map((col, index) => <th key={index} className={`col-${index}`}>{col}</th>)}
              <th className="delete-column">Delete</th> {/* Add a column header for delete button */}
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
      <button className="btn btn-primary" onClick={exportToCSV}>Export to CSV</button>
    </div>
  );
};

export default ProgramTable;