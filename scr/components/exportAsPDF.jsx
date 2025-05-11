import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const exportAsPDF = async (summary, chartRef) => {
  if (!summary || !chartRef.current) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Accountability Report', 14, 20);

  doc.setFontSize(12);
  doc.text(`Actual Video Duration: ${summary.actualVideoDuration.toFixed(1)} sec`, 14, 35);
  doc.text(`Watched Time: ${summary.totalWatchTime.toFixed(1)} sec`, 14, 42);
  doc.text(`Look-away Time: ${summary.lookAwayTime.toFixed(1)} sec`, 14, 49);
  doc.text(`Tab Switches: ${summary.tabSwitches}`, 14, 56);
  const watchedPercentage = summary.actualVideoDuration > 0
    ? ((summary.totalWatchTime / summary.actualVideoDuration) * 100).toFixed(1)
    : 'N/A';
  doc.text(`Watched Percentage: ${watchedPercentage}%`, 14, 63);

  // Chart screenshot
  doc.text('Emotion Breakdown Chart:', 14, 75);
  const canvas = await html2canvas(chartRef.current);
  const imgData = canvas.toDataURL('image/png');
  const imgProps = doc.getImageProperties(imgData);
  const pdfWidth = doc.internal.pageSize.getWidth() - 30;
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  doc.addImage(imgData, 'PNG', 15, 80, pdfWidth, pdfHeight);

  const nextY = 80 + pdfHeight + 10;
  doc.text('Emotion Breakdown Table:', 14, nextY);

  autoTable(doc, {
    startY: nextY + 5,
    head: [['Emotion', 'Count']],
    body: summary.emotionData.map(item => [item.emotion, item.count]),
  });

  doc.save('accountability-report.pdf');
};

export default exportAsPDF;
