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
      let mimeType = '';
      let filename = '';

      if (format === 'excel') {
        blob = await exportEventsExcel();
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'events.xlsx';
      } else {
        blob = await exportEventsPDF();
        mimeType = 'application/pdf';
        filename = 'events.pdf';
      }

      // Ensure blob is readable by the browser
      const blobFile = new Blob([blob], { type: mimeType });
      const url = window.URL.createObjectURL(blobFile);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export file. Please try again.');
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
          <p>Download all events as an Excel file</p>
          <button onClick={() => handleExport('excel')} disabled={loading}>
            {loading ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>

        <div className="export-option">
          <h3>Export to PDF</h3>
          <p>Download all events as a PDF document</p>
          <button onClick={() => handleExport('pdf')} disabled={loading}>
            {loading ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportExport;
