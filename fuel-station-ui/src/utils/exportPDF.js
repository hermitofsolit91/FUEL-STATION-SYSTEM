import jsPDF from 'jspdf';

export const exportToPDF = (title, data, filename) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234); // Primary blue
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, {
    align: 'center'
  });
  yPosition += 15;

  // Line separator
  doc.setDrawColor(102, 126, 234);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Data table
  if (data && Array.isArray(data) && data.length > 0) {
    const columns = Object.keys(data[0]);
    const rows = data.map((item) => Object.values(item));

    doc.autoTable({
      columns: columns.map((col) => ({
        header: col.replace(/_/g, ' ').toUpperCase(),
        dataKey: col
      })),
      body: rows.map((row) =>
        columns.reduce((acc, col, idx) => {
          acc[col] = row[idx];
          return acc;
        }, {})
      ),
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 242, 255]
      },
      margin: 20
    });
  }

  // Footer
  const finalY = doc.lastAutoTable.finalY || yPosition;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Page 1 of 1 | Fuel Station Manager`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  doc.save(filename);
};

export const downloadPDF = (title, data, reportType, date) => {
  const timestamp = date || new Date().toISOString().split('T')[0];
  const filename = `${reportType}-report-${timestamp}.pdf`;
  exportToPDF(title, data, filename);
};
