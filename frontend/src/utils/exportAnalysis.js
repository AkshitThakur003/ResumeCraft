/**
 * Export Analysis to PDF
 * @module utils/exportAnalysis
 */

import jsPDF from 'jspdf';

/**
 * Export analysis results as PDF
 * @param {Object} analysis - Analysis data
 * @param {Object} resume - Resume data
 * @param {string} filename - Output filename
 */
export const exportAnalysisToPDF = (analysis, resume, filename = 'resume-analysis') => {
  const doc = new jsPDF();
  let yPos = 20;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPos + requiredSpace > 280) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Resume Analysis Report', 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Resume: ${resume.title || resume.originalFilename}`, 20, yPos);
  yPos += 5;
  doc.text(`Analysis Date: ${new Date(analysis.analysisDate).toLocaleDateString()}`, 20, yPos);
  yPos += 10;

  // Overall Score
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Overall Score', 20, yPos);
  yPos += 10;

  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(`${analysis.overallScore}/100`, 20, yPos);
  yPos += 15;

  // Section Scores
  if (analysis.sectionScores) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Section Scores', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    Object.entries(analysis.sectionScores).forEach(([section, score]) => {
      checkPageBreak(10);
      const sectionName = section.replace(/([A-Z])/g, ' $1').trim();
      doc.text(`${sectionName}: ${score}%`, 25, yPos);
      yPos += 7;
    });
    yPos += 5;
  }

  // Strengths
  if (analysis.strengths && analysis.strengths.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Strengths', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    analysis.strengths.forEach((strength) => {
      checkPageBreak(15);
      doc.setFont(undefined, 'bold');
      doc.text(`• ${strength.category}`, 25, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(strength.description, 170);
      doc.text(lines, 30, yPos);
      yPos += lines.length * 7 + 3;
    });
    yPos += 5;
  }

  // Weaknesses
  if (analysis.weaknesses && analysis.weaknesses.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Areas for Improvement', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    analysis.weaknesses.forEach((weakness) => {
      checkPageBreak(15);
      doc.setFont(undefined, 'bold');
      doc.text(`• ${weakness.category}`, 25, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(weakness.description, 170);
      doc.text(lines, 30, yPos);
      yPos += lines.length * 7 + 3;
    });
    yPos += 5;
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Recommendations', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    analysis.recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .forEach((rec) => {
        checkPageBreak(20);
        doc.setFont(undefined, 'bold');
        doc.text(`[${rec.priority.toUpperCase()}] ${rec.title}`, 25, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(rec.description, 170);
        doc.text(lines, 30, yPos);
        yPos += lines.length * 7 + 5;
      });
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`${filename}-analysis.pdf`);
};

