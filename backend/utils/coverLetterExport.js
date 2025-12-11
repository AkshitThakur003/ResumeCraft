/**
 * @fileoverview Cover Letter Export Utilities
 * @module utils/coverLetterExport
 * @description Export cover letters to PDF and DOCX formats
 */

const { jsPDF } = require('jspdf');
// Alternative: const jsPDF = require('jspdf').jsPDF;
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

/**
 * Export cover letter to PDF
 * @param {string} content - Cover letter content
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} filename - Output filename (without extension)
 * @returns {Promise<Buffer>} PDF buffer
 */
const exportToPDF = async (content, jobTitle, companyName, filename = 'cover-letter') => {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header (optional - can be removed for cleaner look)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${jobTitle} at ${companyName}`, margin, yPos);
  yPos += 10;

  // Cover letter content
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');

  // Split content into paragraphs
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  paragraphs.forEach((paragraph, index) => {
    checkPageBreak(30);
    
    // Split long lines
    const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
    
    lines.forEach((line) => {
      checkPageBreak(10);
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    
    // Add spacing between paragraphs
    if (index < paragraphs.length - 1) {
      yPos += 5;
    }
  });

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
};

/**
 * Export cover letter to DOCX
 * @param {string} content - Cover letter content
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} filename - Output filename (without extension)
 * @returns {Promise<Buffer>} DOCX buffer
 */
const exportToDOCX = async (content, jobTitle, companyName, filename = 'cover-letter') => {
  // Split content into paragraphs
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const docxParagraphs = paragraphs.map((para, index) => {
    // First paragraph might be greeting - keep it simple
    if (index === 0) {
      return new Paragraph({
        children: [new TextRun(para.trim())],
        spacing: { after: 200 },
      });
    }
    
    // Last paragraph might be closing - keep it simple
    if (index === paragraphs.length - 1) {
      return new Paragraph({
        children: [new TextRun(para.trim())],
        spacing: { after: 200 },
      });
    }
    
    // Body paragraphs
    return new Paragraph({
      children: [new TextRun(para.trim())],
      spacing: { after: 200 },
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Optional header
        new Paragraph({
          text: `${jobTitle} at ${companyName}`,
          heading: HeadingLevel.HEADING_6,
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
        }),
        ...docxParagraphs,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
};

module.exports = {
  exportToPDF,
  exportToDOCX,
};

