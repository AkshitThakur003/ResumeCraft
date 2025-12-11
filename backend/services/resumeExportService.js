/**
 * @fileoverview Resume Export Service
 * @module services/resumeExportService
 * @description Export resume builder resumes to PDF and DOCX formats with template rendering
 */

const { jsPDF } = require('jspdf');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');
const logger = require('../utils/logger');

/**
 * Generate HTML for Modern template
 */
const generateModernHTML = (resume) => {
  const { personalInfo, sections } = resume;
  const sortedSections = [...(sections || [])]
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          color: #1e293b;
        }
        .header {
          border-bottom: 4px solid #2563eb;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #0f172a;
        }
        .contact-info {
          font-size: 14px;
          color: #475569;
          margin-bottom: 8px;
        }
        .links {
          font-size: 14px;
          color: #2563eb;
        }
        .links a {
          color: #2563eb;
          text-decoration: none;
          margin-right: 16px;
        }
        .summary {
          margin-bottom: 24px;
        }
        .section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 12px;
          border-bottom: 2px solid #bfdbfe;
          padding-bottom: 4px;
        }
        .item {
          padding-left: 16px;
          border-left: 2px solid #bfdbfe;
          margin-bottom: 16px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .item-title {
          font-weight: 600;
          font-size: 16px;
          color: #0f172a;
        }
        .item-subtitle {
          color: #475569;
          font-size: 14px;
        }
        .item-date {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
        }
        .item-description {
          color: #334155;
          margin-top: 8px;
          font-size: 14px;
        }
        .achievements {
          margin-top: 8px;
          padding-left: 16px;
        }
        .achievements li {
          font-size: 13px;
          color: #334155;
          margin-bottom: 4px;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .skill-tag {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(personalInfo?.fullName || 'Your Name')}</h1>
        <div class="contact-info">
          ${personalInfo?.email || ''} ${personalInfo?.phone ? '• ' + personalInfo.phone : ''} ${personalInfo?.location ? '• ' + personalInfo.location : ''}
        </div>
        <div class="links">
          ${personalInfo?.website ? `<a href="${personalInfo.website}">Website</a>` : ''}
          ${personalInfo?.linkedin ? `<a href="${personalInfo.linkedin}">LinkedIn</a>` : ''}
          ${personalInfo?.github ? `<a href="${personalInfo.github}">GitHub</a>` : ''}
          ${personalInfo?.portfolio ? `<a href="${personalInfo.portfolio}">Portfolio</a>` : ''}
        </div>
      </div>
  `;

  if (personalInfo?.summary) {
    html += `
      <div class="summary">
        <div class="section-title">Summary</div>
        <p style="line-height: 1.6; white-space: pre-wrap;">${escapeHtml(personalInfo.summary)}</p>
      </div>
    `;
  }

  sortedSections.forEach(section => {
    html += `<div class="section"><div class="section-title">${escapeHtml(section.title)}</div>`;
    
    if (section.items && section.items.length > 0) {
      section.items.forEach(item => {
        html += '<div class="item">';
        
        if (section.type === 'experience') {
          html += `
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(item.jobTitle || '')}</div>
                <div class="item-subtitle">${escapeHtml(item.company || '')} ${item.location ? '• ' + escapeHtml(item.location) : ''}</div>
              </div>
              <div class="item-date">
                ${item.startDate ? formatDate(item.startDate) : ''} - ${item.current ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}
              </div>
            </div>
          `;
          if (item.description) {
            html += `<div class="item-description">${escapeHtml(item.description)}</div>`;
          }
          if (item.achievements && item.achievements.length > 0) {
            html += '<ul class="achievements">';
            item.achievements.forEach(ach => {
              html += `<li>${escapeHtml(ach)}</li>`;
            });
            html += '</ul>';
          }
        } else if (section.type === 'education') {
          html += `
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(item.degree || '')} ${item.field ? 'in ' + escapeHtml(item.field) : ''}</div>
                <div class="item-subtitle">${escapeHtml(item.school || '')} ${item.location ? '• ' + escapeHtml(item.location) : ''}</div>
              </div>
              <div class="item-date">
                ${item.startDate ? formatDate(item.startDate) : ''} - ${item.inProgress ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}
              </div>
            </div>
          `;
          if (item.gpa) {
            html += `<div class="item-description">GPA: ${escapeHtml(item.gpa)}</div>`;
          }
          if (item.honors) {
            html += `<div class="item-description">${escapeHtml(item.honors)}</div>`;
          }
        } else if (section.type === 'skills') {
          html += `
            <div class="item-title">${escapeHtml(item.category || 'Skills')}</div>
            <div class="skills">
          `;
          if (item.skills && item.skills.length > 0) {
            item.skills.forEach(skill => {
              html += `<span class="skill-tag">${escapeHtml(skill)}</span>`;
            });
          }
          html += '</div>';
        }
        
        html += '</div>';
      });
    } else {
      html += '<p style="color: #94a3b8; font-style: italic;">No items added yet</p>';
    }
    
    html += '</div>';
  });

  html += `</body></html>`;
  return html;
};

/**
 * Generate HTML for Classic template
 */
const generateClassicHTML = (resume) => {
  const { personalInfo, sections } = resume;
  const sortedSections = [...(sections || [])]
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          color: #1e293b;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 28px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
          color: #0f172a;
        }
        .contact-info {
          font-size: 13px;
          color: #475569;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
        }
        .item {
          margin-bottom: 12px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .item-title {
          font-weight: bold;
          font-size: 14px;
        }
        .item-subtitle {
          color: #475569;
          font-style: italic;
          font-size: 13px;
        }
        .item-date {
          font-size: 12px;
          color: #64748b;
        }
        .item-description {
          color: #334155;
          margin-top: 4px;
          font-size: 12px;
        }
        .achievements {
          margin-top: 4px;
          padding-left: 16px;
        }
        .achievements li {
          font-size: 12px;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(personalInfo?.fullName || 'Your Name')}</h1>
        <div class="contact-info">
          ${personalInfo?.email || ''} ${personalInfo?.phone ? '| ' + personalInfo.phone : ''} ${personalInfo?.location ? '| ' + personalInfo.location : ''}
        </div>
      </div>
  `;

  if (personalInfo?.summary) {
    html += `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <p style="line-height: 1.5; font-size: 12px; white-space: pre-wrap;">${escapeHtml(personalInfo.summary)}</p>
      </div>
    `;
  }

  sortedSections.forEach(section => {
    html += `<div class="section"><div class="section-title">${escapeHtml(section.title)}</div>`;
    
    if (section.items && section.items.length > 0) {
      section.items.forEach(item => {
        html += '<div class="item">';
        
        if (section.type === 'experience') {
          html += `
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(item.jobTitle || '')}</div>
                <div class="item-subtitle">${escapeHtml(item.company || '')} ${item.location ? '- ' + escapeHtml(item.location) : ''}</div>
              </div>
              <div class="item-date">
                ${item.startDate ? formatDate(item.startDate) : ''} - ${item.current ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}
              </div>
            </div>
          `;
          if (item.description) {
            html += `<div class="item-description">${escapeHtml(item.description)}</div>`;
          }
          if (item.achievements && item.achievements.length > 0) {
            html += '<ul class="achievements">';
            item.achievements.forEach(ach => {
              html += `<li>${escapeHtml(ach)}</li>`;
            });
            html += '</ul>';
          }
        } else if (section.type === 'education') {
          html += `
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(item.degree || '')} ${item.field ? 'in ' + escapeHtml(item.field) : ''}</div>
                <div class="item-subtitle">${escapeHtml(item.school || '')} ${item.location ? '- ' + escapeHtml(item.location) : ''}</div>
              </div>
              <div class="item-date">
                ${item.startDate ? formatDate(item.startDate) : ''} - ${item.inProgress ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}
              </div>
            </div>
          `;
          if (item.gpa) {
            html += `<div class="item-description">GPA: ${escapeHtml(item.gpa)}</div>`;
          }
          if (item.honors) {
            html += `<div class="item-description">${escapeHtml(item.honors)}</div>`;
          }
        } else if (section.type === 'skills') {
          html += `
            <div class="item-title">${escapeHtml(item.category || 'Skills')}</div>
            <div class="item-description">${item.skills ? item.skills.map(s => escapeHtml(s)).join(', ') : ''}</div>
          `;
        }
        
        html += '</div>';
      });
    } else {
      html += '<p style="color: #94a3b8; font-style: italic; font-size: 12px;">No items added yet</p>';
    }
    
    html += '</div>';
  });

  html += `</body></html>`;
  return html;
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Format date for DOCX (same format)
 */
const formatDateForDOCX = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Export resume to PDF
 * @param {Object} resume - Resume data
 * @param {string} template - Template name
 * @returns {Promise<Buffer>} PDF buffer
 */
const exportToPDF = async (resume, template = 'modern') => {
  try {
    let html;
    
    switch (template) {
      case 'modern':
        html = generateModernHTML(resume);
        break;
      case 'classic':
        html = generateClassicHTML(resume);
        break;
      case 'creative':
        html = generateModernHTML(resume); // Use modern as base for now
        break;
      case 'technical':
        html = generateModernHTML(resume); // Use modern as base for now
        break;
      case 'executive':
        html = generateClassicHTML(resume); // Use classic as base for now
        break;
      default:
        html = generateModernHTML(resume);
    }

    // For now, we'll use a simpler approach with jsPDF
    // In production, you might want to use puppeteer or similar for better HTML rendering
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    const { personalInfo, sections } = resume;
    const sortedSections = [...(sections || [])]
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order);

    // Helper to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(personalInfo?.fullName || 'Your Name', margin, yPos);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(70, 70, 70);
    const contactInfo = [
      personalInfo?.email,
      personalInfo?.phone,
      personalInfo?.location,
    ].filter(Boolean).join(' • ');
    if (contactInfo) {
      doc.text(contactInfo, margin, yPos);
      yPos += 8;
    }

    // Summary
    if (personalInfo?.summary) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(37, 99, 235); // brand-600
      doc.text('Summary', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const summaryLines = doc.splitTextToSize(personalInfo.summary, pageWidth - (margin * 2));
      summaryLines.forEach(line => {
        checkPageBreak(10);
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Sections
    sortedSections.forEach(section => {
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(section.title, margin, yPos);
      yPos += 10;

      if (section.items && section.items.length > 0) {
        section.items.forEach(item => {
          checkPageBreak(30);
          
          if (section.type === 'experience') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(item.jobTitle || '', margin + 5, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(70, 70, 70);
            const companyInfo = [item.company, item.location].filter(Boolean).join(' • ');
            if (companyInfo) {
              doc.text(companyInfo, margin + 5, yPos);
              yPos += 5;
            }
            
            const dateRange = `${item.startDate ? formatDate(item.startDate) : ''} - ${item.current ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}`;
            doc.setFontSize(9);
            doc.text(dateRange, pageWidth - margin - 40, yPos - 6, { align: 'right' });
            
            if (item.description) {
              yPos += 3;
              const descLines = doc.splitTextToSize(item.description, pageWidth - (margin * 2) - 10);
              descLines.forEach(line => {
                checkPageBreak(8);
                doc.text(line, margin + 5, yPos);
                yPos += 5;
              });
            }
            
            if (item.achievements && item.achievements.length > 0) {
              yPos += 2;
              item.achievements.forEach(ach => {
                checkPageBreak(8);
                doc.text(`• ${ach}`, margin + 10, yPos);
                yPos += 5;
              });
            }
          } else if (section.type === 'education') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            const degreeText = `${item.degree || ''} ${item.field ? 'in ' + item.field : ''}`;
            doc.text(degreeText, margin + 5, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(70, 70, 70);
            const schoolInfo = [item.school, item.location].filter(Boolean).join(' • ');
            if (schoolInfo) {
              doc.text(schoolInfo, margin + 5, yPos);
              yPos += 5;
            }
            
            const dateRange = `${item.startDate ? formatDate(item.startDate) : ''} - ${item.inProgress ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}`;
            doc.setFontSize(9);
            doc.text(dateRange, pageWidth - margin - 40, yPos - 6, { align: 'right' });
            
            if (item.gpa) {
              yPos += 3;
              doc.text(`GPA: ${item.gpa}`, margin + 5, yPos);
              yPos += 5;
            }
          } else if (section.type === 'skills') {
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(item.category || 'Skills', margin + 5, yPos);
            yPos += 6;
            
            if (item.skills && item.skills.length > 0) {
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.text(item.skills.join(', '), margin + 5, yPos);
              yPos += 5;
            }
          } else if (section.type === 'projects') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(item.projectName || '', margin + 5, yPos);
            yPos += 6;
            
            if (item.url) {
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.setTextColor(37, 99, 235);
              doc.text(item.url, margin + 5, yPos);
              yPos += 5;
            }
            
            const dateRange = `${item.startDate ? formatDate(item.startDate) : ''} - ${item.current ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}`;
            if (dateRange && dateRange !== ' - ') {
              doc.setFontSize(9);
              doc.setTextColor(70, 70, 70);
              doc.text(dateRange, pageWidth - margin - 40, yPos - 6, { align: 'right' });
            }
            
            if (item.description) {
              yPos += 3;
              const descLines = doc.splitTextToSize(item.description, pageWidth - (margin * 2) - 10);
              descLines.forEach(line => {
                checkPageBreak(8);
                doc.text(line, margin + 5, yPos);
                yPos += 5;
              });
            }
            
            if (item.technologies && item.technologies.length > 0) {
              yPos += 2;
              doc.setFontSize(9);
              doc.text(`Technologies: ${item.technologies.join(', ')}`, margin + 5, yPos);
              yPos += 5;
            }
          } else if (section.type === 'certifications') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            const certText = `${item.name || ''}${item.issuer ? ' - ' + item.issuer : ''}`;
            doc.text(certText, margin + 5, yPos);
            yPos += 6;
            
            if (item.date) {
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.setTextColor(70, 70, 70);
              doc.text(`Date: ${formatDate(item.date)}`, margin + 5, yPos);
              yPos += 5;
            }
            
            if (item.credentialId) {
              doc.setFontSize(9);
              doc.text(`Credential ID: ${item.credentialId}`, margin + 5, yPos);
              yPos += 5;
            }
          } else if (section.type === 'languages') {
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            const langText = `${item.language || ''}${item.proficiency ? ' - ' + item.proficiency : ''}`;
            doc.text(langText, margin + 5, yPos);
            yPos += 6;
          } else if (section.type === 'awards') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            const awardText = `${item.awardName || ''}${item.issuer ? ' - ' + item.issuer : ''}`;
            doc.text(awardText, margin + 5, yPos);
            yPos += 6;
            
            if (item.date) {
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.setTextColor(70, 70, 70);
              doc.text(`Date: ${formatDate(item.date)}`, margin + 5, yPos);
              yPos += 5;
            }
            
            if (item.description) {
              yPos += 3;
              const descLines = doc.splitTextToSize(item.description, pageWidth - (margin * 2) - 10);
              descLines.forEach(line => {
                checkPageBreak(8);
                doc.text(line, margin + 5, yPos);
                yPos += 5;
              });
            }
          } else if (section.type === 'publications') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(item.title || '', margin + 5, yPos);
            yPos += 6;
            
            if (item.authors && item.authors.length > 0) {
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.setTextColor(70, 70, 70);
              doc.text(`Authors: ${item.authors.join(', ')}`, margin + 5, yPos);
              yPos += 5;
            }
            
            if (item.publisher) {
              doc.setFontSize(9);
              doc.text(`Publisher: ${item.publisher}`, margin + 5, yPos);
              yPos += 5;
            }
            
            if (item.date) {
              doc.setFontSize(9);
              doc.text(`Date: ${formatDate(item.date)}`, margin + 5, yPos);
              yPos += 5;
            }
          } else if (section.type === 'volunteer') {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            const volunteerText = `${item.role || ''}${item.organization ? ' at ' + item.organization : ''}`;
            doc.text(volunteerText, margin + 5, yPos);
            yPos += 6;
            
            if (item.location) {
              doc.setFontSize(10);
              doc.setFont(undefined, 'normal');
              doc.setTextColor(70, 70, 70);
              doc.text(item.location, margin + 5, yPos);
              yPos += 5;
            }
            
            const dateRange = `${item.startDate ? formatDate(item.startDate) : ''} - ${item.current ? 'Present' : item.endDate ? formatDate(item.endDate) : ''}`;
            if (dateRange && dateRange !== ' - ') {
              doc.setFontSize(9);
              doc.text(dateRange, pageWidth - margin - 40, yPos - 6, { align: 'right' });
            }
            
            if (item.description) {
              yPos += 3;
              const descLines = doc.splitTextToSize(item.description, pageWidth - (margin * 2) - 10);
              descLines.forEach(line => {
                checkPageBreak(8);
                doc.text(line, margin + 5, yPos);
                yPos += 5;
              });
            }
          }
          
          yPos += 5;
        });
      }
      
      yPos += 5;
    });

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    logger.error('Error exporting resume to PDF:', {
      error: error.message,
      stack: error.stack,
      template,
    });
    throw new Error(`Failed to export resume to PDF: ${error.message}`);
  }
};

/**
 * Export resume to DOCX
 * @param {Object} resume - Resume data
 * @param {string} template - Template name
 * @returns {Promise<Buffer>} DOCX buffer
 */
const exportToDOCX = async (resume, template = 'modern') => {
  try {
    const { personalInfo, sections } = resume;
    const sortedSections = [...(sections || [])]
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order);

    const children = [];

    // Header
    children.push(
      new Paragraph({
        text: personalInfo?.fullName || 'Your Name',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    // Contact info
    const contactParts = [];
    if (personalInfo?.email) contactParts.push(new TextRun(personalInfo.email));
    if (personalInfo?.phone) contactParts.push(new TextRun({ text: ' • ', break: 0 }), new TextRun(personalInfo.phone));
    if (personalInfo?.location) contactParts.push(new TextRun({ text: ' • ', break: 0 }), new TextRun(personalInfo.location));
    
    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          children: contactParts,
          spacing: { after: 400 },
        })
      );
    }

    // Summary
    if (personalInfo?.summary) {
      children.push(
        new Paragraph({
          text: 'Summary',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          text: personalInfo.summary,
          spacing: { after: 400 },
        })
      );
    }

    // Sections
    sortedSections.forEach(section => {
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        })
      );

      if (section.items && section.items.length > 0) {
        section.items.forEach(item => {
          if (section.type === 'experience') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.jobTitle || '', bold: true }),
                  new TextRun({ text: ' • ', break: 0 }),
                  new TextRun(item.company || ''),
                ],
                spacing: { after: 100 },
              })
            );
            
            if (item.description) {
              children.push(
                new Paragraph({
                  text: item.description,
                  spacing: { after: 100 },
                })
              );
            }
            
            if (item.achievements && item.achievements.length > 0) {
              item.achievements.forEach(ach => {
                children.push(
                  new Paragraph({
                    text: `• ${ach}`,
                    indent: { left: 400 },
                    spacing: { after: 50 },
                  })
                );
              });
            }
          } else if (section.type === 'education') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${item.degree || ''} ${item.field ? 'in ' + item.field : ''}`, bold: true }),
                  new TextRun({ text: ' • ', break: 0 }),
                  new TextRun(item.school || ''),
                ],
                spacing: { after: 100 },
              })
            );
            
            if (item.gpa) {
              children.push(
                new Paragraph({
                  text: `GPA: ${item.gpa}`,
                  spacing: { after: 100 },
                })
              );
            }
          } else if (section.type === 'skills') {
            if (item.skills && item.skills.length > 0) {
              children.push(
                new Paragraph({
                  text: `${item.category || 'Skills'}: ${item.skills.join(', ')}`,
                  spacing: { after: 100 },
                })
              );
            }
          } else if (section.type === 'projects') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.projectName || '', bold: true }),
                  item.url ? new TextRun({ text: ` • ${item.url}`, break: 0, color: '2563eb' }) : null,
                ].filter(Boolean),
                spacing: { after: 100 },
              })
            );
            
            if (item.description) {
              children.push(
                new Paragraph({
                  text: item.description,
                  spacing: { after: 100 },
                })
              );
            }
            
            if (item.technologies && item.technologies.length > 0) {
              children.push(
                new Paragraph({
                  text: `Technologies: ${item.technologies.join(', ')}`,
                  spacing: { after: 100 },
                })
              );
            }
          } else if (section.type === 'certifications') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.name || '', bold: true }),
                  item.issuer ? new TextRun({ text: ` - ${item.issuer}`, break: 0 }) : null,
                ].filter(Boolean),
                spacing: { after: 100 },
              })
            );
            
            if (item.date) {
              children.push(
                new Paragraph({
                  text: `Date: ${formatDate(item.date)}`,
                  spacing: { after: 100 },
                })
              );
            }
          } else if (section.type === 'languages') {
            children.push(
              new Paragraph({
                text: `${item.language || ''}${item.proficiency ? ' - ' + item.proficiency : ''}`,
                spacing: { after: 100 },
              })
            );
          } else if (section.type === 'awards') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.awardName || '', bold: true }),
                  item.issuer ? new TextRun({ text: ` - ${item.issuer}`, break: 0 }) : null,
                ].filter(Boolean),
                spacing: { after: 100 },
              })
            );
            
            if (item.description) {
              children.push(
                new Paragraph({
                  text: item.description,
                  spacing: { after: 100 },
                })
              );
            }
          } else if (section.type === 'publications') {
            children.push(
              new Paragraph({
                text: item.title || '',
                bold: true,
                spacing: { after: 100 },
              })
            );
            
            if (item.authors && item.authors.length > 0) {
              children.push(
                new Paragraph({
                  text: `Authors: ${item.authors.join(', ')}`,
                  spacing: { after: 100 },
                })
              );
            }
          } else if (section.type === 'volunteer') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.role || '', bold: true }),
                  item.organization ? new TextRun({ text: ` at ${item.organization}`, break: 0 }) : null,
                ].filter(Boolean),
                spacing: { after: 100 },
              })
            );
            
            if (item.description) {
              children.push(
                new Paragraph({
                  text: item.description,
                  spacing: { after: 100 },
                })
              );
            }
          }
        });
      }
    });

    const doc = new Document({
      sections: [{
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    logger.error('Error exporting resume to DOCX:', {
      error: error.message,
      stack: error.stack,
      template,
    });
    throw new Error(`Failed to export resume to DOCX: ${error.message}`);
  }
};

module.exports = {
  exportToPDF,
  exportToDOCX,
};

                  spacing: { after: 100 },
                })
              );
            }
          }
        });
      }
    });

    const doc = new Document({
      sections: [{
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    logger.error('Error exporting resume to DOCX:', {
      error: error.message,
      stack: error.stack,
      template,
    });
    throw new Error(`Failed to export resume to DOCX: ${error.message}`);
  }
};

module.exports = {
  exportToPDF,
  exportToDOCX,
  generateModernHTML,
  generateClassicHTML,
};

