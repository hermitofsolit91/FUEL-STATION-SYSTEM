import React from 'react';
import './DataTable.css';

function DataTable({ data = [], columns = [], title = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="datatable-container">
        {title && <h3 className="datatable-title">{title}</h3>}
        <div className="no-data">No data available</div>
      </div>
    );
  }

  return (
    <div className="datatable-container">
      {title && <h3 className="datatable-title">{title}</h3>}
      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`col-${col.key}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'even' : 'odd'}>
                {columns.map((col) => (
                  <td key={`${rowIndex}-${col.key}`} className={`col-${col.key}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
