
import React, { useState } from 'react';
import { exportEventsExcel, exportEventsPDF } from '../../services/api';
import './ReportExport.css';

const ReportExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    setLoading(true);
    setError(null);
    
    try {
      let blob;
      if (format === 'excel') {
        blob = await exportEventsExcel();
      } else {
        blob = await exportEventsPDF();
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-export">
      <h2>Export Reports</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="export-options">
        <div className="export-option">
          <h3>Export to Excel</h3>
          <p>Export all events data to an Excel spreadsheet</p>
          <button 
            onClick={() => handleExport('excel')}
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
        
        <div className="export-option">
          <h3>Export to PDF</h3>
          <p>Export all events data to a PDF document</p>
          <button 
            onClick={() => handleExport('pdf')}
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportExport;