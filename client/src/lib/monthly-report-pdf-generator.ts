import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClientReportData } from './monthly-report-data-service';
import { ProcessedMetrics } from './monthly-report-data-service';
import { MonthlyReportAIInsights } from './ai-monthly-report-analysis';
import { METRIC_LIBRARY } from './metrics-library';

export interface PDFReportOptions {
  clientName: string;
  month: string;
  selectedMetrics: string[];
  includeCharts?: boolean;
  includeTargets?: boolean;
  includeAIInsights?: boolean;
}

export class MonthlyReportPDFGenerator {
  private static readonly PAGE_MARGIN = 25;
  private static readonly CONTENT_WIDTH = 210 - (this.PAGE_MARGIN * 2); // A4 width - margins
  private static readonly LINE_HEIGHT = 6;
  private static readonly SECTION_SPACING = 15;
  private static readonly SUBSECTION_SPACING = 8;
  private static readonly FOOTER_HEIGHT = 25; // Space reserved for footer
  private static readonly PAGE_HEIGHT = 297; // A4 height in mm

  /**
   * Generate PDF report and return as blob
   */
  static async generatePDFBlob(
    clientData: ClientReportData,
    processedMetrics: ProcessedMetrics,
    aiInsights: MonthlyReportAIInsights,
    options: PDFReportOptions
  ): Promise<{ blob: Blob; fileName: string }> {
    console.log('📄 Generating PDF report for:', options.clientName, options.month);

    try {
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentY = this.PAGE_MARGIN;

      // Add header
      currentY = this.addHeader(pdf, options, currentY);

      // Add executive summary
      currentY = this.addExecutiveSummary(pdf, aiInsights, currentY);

      // Add performance metrics table
      currentY = this.addPerformanceMetricsTable(pdf, processedMetrics, options.selectedMetrics, currentY);

      // Add AI insights
      if (options.includeAIInsights !== false) {
        currentY = this.addAIInsights(pdf, aiInsights, currentY);
      }

      // Add recommendations
      currentY = this.addRecommendations(pdf, aiInsights, currentY);

      // Add plan forward
      currentY = this.addPlanForward(pdf, aiInsights, currentY);

      // Add footer to the last page
      this.addFooter(pdf, options);

      // Generate blob
      const fileName = `Monthly_Report_${options.clientName.replace(/\s+/g, '_')}_${options.month}.pdf`;
      const blob = pdf.output('blob');

      console.log('✅ PDF generated successfully as blob:', fileName);
      return { blob, fileName };
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Generate and download PDF report (legacy method)
   */
  static async generatePDF(
    clientData: ClientReportData,
    processedMetrics: ProcessedMetrics,
    aiInsights: MonthlyReportAIInsights,
    options: PDFReportOptions
  ): Promise<void> {
    const { blob, fileName } = await this.generatePDFBlob(clientData, processedMetrics, aiInsights, options);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if we need a new page and add one if necessary
   */
  private static checkPageBreak(pdf: jsPDF, currentY: number, requiredHeight: number): number {
    const availableHeight = this.PAGE_HEIGHT - this.PAGE_MARGIN - this.FOOTER_HEIGHT;
    
    if (currentY + requiredHeight > availableHeight) {
      pdf.addPage();
      return this.PAGE_MARGIN;
    }
    
    return currentY;
  }

  /**
   * Add professional header section
   */
  private static addHeader(pdf: jsPDF, options: PDFReportOptions, currentY: number): number {
    // Company logo/header area
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, 210, 40, 'F');
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text('Monthly Fitness Report', 105, 20, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('FitCoach Trainer Platform', 105, 30, { align: 'center' });

    // Reset to normal content area
    pdf.setTextColor(0, 0, 0);
    currentY = 50;

    // Client info section
    pdf.setFillColor(248, 250, 252); // Light gray background
    pdf.rect(this.PAGE_MARGIN, currentY, this.CONTENT_WIDTH, 25, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Client: ${options.clientName}`, this.PAGE_MARGIN + 5, currentY + 8);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Report Period: ${new Date(options.month).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })}`, this.PAGE_MARGIN + 5, currentY + 16);
    
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.PAGE_MARGIN + 5, currentY + 22);

    return currentY + 35;
  }

  /**
   * Add executive summary section with professional formatting
   */
  private static addExecutiveSummary(pdf: jsPDF, aiInsights: MonthlyReportAIInsights, currentY: number): number {
    // Check if we need a new page
    currentY = this.checkPageBreak(pdf, currentY, 120); // Estimate height needed

    // Section header with background
    pdf.setFillColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, this.CONTENT_WIDTH, 10, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Executive Summary', this.PAGE_MARGIN + 5, currentY + 7);
    
    currentY += 15;
    pdf.setTextColor(0, 0, 0);

    // Performance score box
    const scoreBoxWidth = 60;
    const scoreBoxHeight = 30;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(this.PAGE_MARGIN, currentY, scoreBoxWidth, scoreBoxHeight, 'F');
    pdf.setDrawColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, scoreBoxWidth, scoreBoxHeight, 'S');
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${aiInsights?.executiveSummary?.performanceScore || 0}%`, this.PAGE_MARGIN + 30, currentY + 12, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Performance', this.PAGE_MARGIN + 30, currentY + 20, { align: 'center' });
    pdf.text('Score', this.PAGE_MARGIN + 30, currentY + 26, { align: 'center' });

    // Overall performance description
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const performanceLines = this.splitTextToFit(aiInsights?.executiveSummary?.overallPerformance || 'Analysis in progress...', this.CONTENT_WIDTH - scoreBoxWidth - 15);
    let lineY = currentY + 5;
    performanceLines.forEach(line => {
      pdf.text(line, this.PAGE_MARGIN + scoreBoxWidth + 10, lineY);
      lineY += this.LINE_HEIGHT;
    });

    currentY += Math.max(scoreBoxHeight, performanceLines.length * this.LINE_HEIGHT + 5) + 10;

    // Key achievements
    if (aiInsights?.executiveSummary?.keyAchievements?.length > 0) {
      currentY = this.addSubsection(pdf, 'Key Achievements', currentY);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      aiInsights.executiveSummary.keyAchievements.forEach(achievement => {
        const lines = this.splitTextToFit(`• ${achievement}`, this.CONTENT_WIDTH - 10);
        lines.forEach(line => {
          pdf.text(line, this.PAGE_MARGIN + 5, currentY);
          currentY += this.LINE_HEIGHT;
        });
        currentY += 2;
      });
    }

    // Areas of concern
    if (aiInsights?.executiveSummary?.areasOfConcern?.length > 0) {
      currentY = this.addSubsection(pdf, 'Areas of Concern', currentY, true);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(239, 68, 68); // Red color
      aiInsights.executiveSummary.areasOfConcern.forEach(concern => {
        const lines = this.splitTextToFit(`• ${concern}`, this.CONTENT_WIDTH - 10);
        lines.forEach(line => {
          pdf.text(line, this.PAGE_MARGIN + 5, currentY);
          currentY += this.LINE_HEIGHT;
        });
        currentY += 2;
      });
      pdf.setTextColor(0, 0, 0);
    }

    return currentY + this.SECTION_SPACING;
  }

  /**
   * Add performance metrics table with professional formatting
   */
  private static addPerformanceMetricsTable(pdf: jsPDF, processedMetrics: ProcessedMetrics, selectedMetrics: string[], currentY: number): number {
    // Check if we need a new page
    const estimatedTableHeight = selectedMetrics.length * 8 + 30; // 8mm per row + header
    currentY = this.checkPageBreak(pdf, currentY, estimatedTableHeight);

    // Section header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, this.CONTENT_WIDTH, 10, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Performance Metrics', this.PAGE_MARGIN + 5, currentY + 7);
    
    currentY += 15;
    pdf.setTextColor(0, 0, 0);

    // Create table data
    const tableData = selectedMetrics.map(metricKey => {
      const metric = processedMetrics[metricKey];
      const metricInfo = METRIC_LIBRARY.find(m => m.key === metricKey);
      return {
        metric: metricInfo?.label || metricKey,
        value: metric?.monthlyAverage?.toFixed(1) || 'N/A',
        unit: metricInfo?.yLabel || '',
        trend: metric?.trend || 'stable'
      };
    });

    // Table dimensions
    const tableWidth = this.CONTENT_WIDTH;
    const col1Width = tableWidth * 0.4; // Metric name
    const col2Width = tableWidth * 0.3; // Value
    const col3Width = tableWidth * 0.3; // Trend
    const rowHeight = 8;

    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(this.PAGE_MARGIN, currentY, tableWidth, rowHeight, 'F');
    pdf.setDrawColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, tableWidth, rowHeight, 'S');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Metric', this.PAGE_MARGIN + 5, currentY + 5);
    pdf.text('Average Value', this.PAGE_MARGIN + col1Width + 5, currentY + 5);
    pdf.text('Trend', this.PAGE_MARGIN + col1Width + col2Width + 5, currentY + 5);

    currentY += rowHeight;

    // Table content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    tableData.forEach((row, index) => {
      // Check if we need a new page for this row
      if (currentY + rowHeight > this.PAGE_HEIGHT - this.PAGE_MARGIN - this.FOOTER_HEIGHT) {
        pdf.addPage();
        currentY = this.PAGE_MARGIN;
        
        // Re-add table header on new page
        pdf.setFillColor(248, 250, 252);
        pdf.rect(this.PAGE_MARGIN, currentY, tableWidth, rowHeight, 'F');
        pdf.setDrawColor(59, 130, 246);
        pdf.rect(this.PAGE_MARGIN, currentY, tableWidth, rowHeight, 'S');

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Metric', this.PAGE_MARGIN + 5, currentY + 5);
        pdf.text('Average Value', this.PAGE_MARGIN + col1Width + 5, currentY + 5);
        pdf.text('Trend', this.PAGE_MARGIN + col1Width + col2Width + 5, currentY + 5);
        currentY += rowHeight;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252);
      }
      pdf.rect(this.PAGE_MARGIN, currentY, tableWidth, rowHeight, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(this.PAGE_MARGIN, currentY, tableWidth, rowHeight, 'S');

      // Metric name
      pdf.setTextColor(0, 0, 0);
      const metricLines = this.splitTextToFit(row.metric, col1Width - 5);
      pdf.text(metricLines[0], this.PAGE_MARGIN + 5, currentY + 5);
      if (metricLines.length > 1) {
        pdf.text(metricLines[1], this.PAGE_MARGIN + 5, currentY + 5 + this.LINE_HEIGHT);
      }

      // Value
      pdf.text(`${row.value} ${row.unit}`, this.PAGE_MARGIN + col1Width + 5, currentY + 5);
      
      // Trend with color
      const trendText = row.trend === 'up' ? '↗ Improving' : row.trend === 'down' ? '↘ Declining' : '→ Stable';
      const trendColor = row.trend === 'up' ? [34, 197, 94] : row.trend === 'down' ? [239, 68, 68] : [107, 114, 128];
      pdf.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
      pdf.text(trendText, this.PAGE_MARGIN + col1Width + col2Width + 5, currentY + 5);
      
      currentY += rowHeight;
    });

    return currentY + this.SECTION_SPACING;
  }

  /**
   * Add AI insights section
   */
  private static addAIInsights(pdf: jsPDF, aiInsights: MonthlyReportAIInsights, currentY: number): number {
    // Check if we need a new page
    currentY = this.checkPageBreak(pdf, currentY, 80);

    // Section header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, this.CONTENT_WIDTH, 10, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('AI Analysis & Insights', this.PAGE_MARGIN + 5, currentY + 7);
    
    currentY += 15;
    pdf.setTextColor(0, 0, 0);

    // What's working well
    currentY = this.addSubsection(pdf, 'What\'s Working Well', currentY, false, [34, 197, 94]);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
          aiInsights?.positiveTrends?.whatIsWorking?.forEach(item => {
      const lines = this.splitTextToFit(`• ${item}`, this.CONTENT_WIDTH - 10);
      lines.forEach(line => {
        pdf.text(line, this.PAGE_MARGIN + 5, currentY);
        currentY += this.LINE_HEIGHT;
      });
      currentY += 2;
    });

    // Strengths
    if (aiInsights?.positiveTrends?.strengths?.length > 0) {
      currentY = this.addSubsection(pdf, 'Strengths', currentY);
      
      aiInsights.positiveTrends.strengths.forEach(strength => {
        const lines = this.splitTextToFit(`• ${strength}`, this.CONTENT_WIDTH - 10);
        lines.forEach(line => {
          pdf.text(line, this.PAGE_MARGIN + 5, currentY);
          currentY += this.LINE_HEIGHT;
        });
        currentY += 2;
      });
    }

    return currentY + this.SECTION_SPACING;
  }

  /**
   * Add recommendations section
   */
  private static addRecommendations(pdf: jsPDF, aiInsights: MonthlyReportAIInsights, currentY: number): number {
    // Check if we need a new page
    currentY = this.checkPageBreak(pdf, currentY, 100);

    // Section header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, this.CONTENT_WIDTH, 10, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Recommendations', this.PAGE_MARGIN + 5, currentY + 7);
    
    currentY += 15;
    pdf.setTextColor(0, 0, 0);

    // Priority level badge
    const priorityColor = aiInsights?.recommendations?.priorityLevel === 'high' ? [239, 68, 68] : 
                         aiInsights?.recommendations?.priorityLevel === 'medium' ? [245, 158, 11] : 
                         [34, 197, 94];
    pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
    pdf.rect(this.PAGE_MARGIN, currentY, 80, 8, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Priority: ${aiInsights?.recommendations?.priorityLevel?.toUpperCase() || 'MEDIUM'}`, this.PAGE_MARGIN + 40, currentY + 5, { align: 'center' });
    
    currentY += 12;
    pdf.setTextColor(0, 0, 0);

    // Areas for improvement
    currentY = this.addSubsection(pdf, 'Areas for Improvement', currentY);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    aiInsights?.recommendations?.areasForImprovement?.forEach(area => {
      const lines = this.splitTextToFit(`• ${area}`, this.CONTENT_WIDTH - 10);
      lines.forEach(line => {
        pdf.text(line, this.PAGE_MARGIN + 5, currentY);
        currentY += this.LINE_HEIGHT;
      });
      currentY += 2;
    });

    // Specific actions
    currentY = this.addSubsection(pdf, 'Specific Actions', currentY);
    
    aiInsights?.recommendations?.specificActions?.forEach(action => {
      const lines = this.splitTextToFit(`• ${action}`, this.CONTENT_WIDTH - 10);
      lines.forEach(line => {
        pdf.text(line, this.PAGE_MARGIN + 5, currentY);
        currentY += this.LINE_HEIGHT;
      });
      currentY += 2;
    });

    return currentY + this.SECTION_SPACING;
  }

  /**
   * Add plan forward section
   */
  private static addPlanForward(pdf: jsPDF, aiInsights: MonthlyReportAIInsights, currentY: number): number {
    // Check if we need a new page
    currentY = this.checkPageBreak(pdf, currentY, 120);

    // Section header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(this.PAGE_MARGIN, currentY, this.CONTENT_WIDTH, 10, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Plan Forward', this.PAGE_MARGIN + 5, currentY + 7);
    
    currentY += 15;
    pdf.setTextColor(0, 0, 0);

    // Next month goals
    currentY = this.addSubsection(pdf, 'Next Month Goals', currentY);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    aiInsights?.planForward?.nextMonthGoals?.forEach(goal => {
      const lines = this.splitTextToFit(`• ${goal}`, this.CONTENT_WIDTH - 10);
      lines.forEach(line => {
        pdf.text(line, this.PAGE_MARGIN + 5, currentY);
        currentY += this.LINE_HEIGHT;
      });
      currentY += 2;
    });

    // Action steps
    currentY = this.addSubsection(pdf, 'Action Steps', currentY);
    
    aiInsights?.planForward?.actionSteps?.forEach(step => {
      const lines = this.splitTextToFit(`• ${step}`, this.CONTENT_WIDTH - 10);
      lines.forEach(line => {
        pdf.text(line, this.PAGE_MARGIN + 5, currentY);
        currentY += this.LINE_HEIGHT;
      });
      currentY += 2;
    });

    // Expected outcomes
    if (aiInsights?.planForward?.expectedOutcomes?.length > 0) {
      currentY = this.addSubsection(pdf, 'Expected Outcomes', currentY);
      
      aiInsights.planForward.expectedOutcomes.forEach(outcome => {
        const lines = this.splitTextToFit(`• ${outcome}`, this.CONTENT_WIDTH - 10);
        lines.forEach(line => {
          pdf.text(line, this.PAGE_MARGIN + 5, currentY);
          currentY += this.LINE_HEIGHT;
        });
        currentY += 2;
      });
    }

    return currentY + this.SECTION_SPACING;
  }

  /**
   * Add subsection with consistent formatting
   */
  private static addSubsection(pdf: jsPDF, title: string, currentY: number, isWarning: boolean = false, color: number[] = [59, 130, 246]): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(title + ':', this.PAGE_MARGIN, currentY);
    currentY += this.SUBSECTION_SPACING;
    pdf.setTextColor(0, 0, 0);
    return currentY;
  }

  /**
   * Add professional footer
   */
  private static addFooter(pdf: jsPDF, options: PDFReportOptions): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const footerY = pageHeight - this.FOOTER_HEIGHT;
    
    // Footer line
    pdf.setDrawColor(226, 232, 240);
    pdf.line(this.PAGE_MARGIN, footerY, this.PAGE_MARGIN + this.CONTENT_WIDTH, footerY);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // Gray color
    pdf.text(`Generated by FitCoach Trainer Platform`, this.PAGE_MARGIN, footerY + 5);
    pdf.text(`Report for ${options.clientName} - ${options.month}`, this.PAGE_MARGIN, footerY + 10);
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, this.PAGE_MARGIN + this.CONTENT_WIDTH - 20, footerY + 5, { align: 'right' });
  }

  /**
   * Split text to fit within page width with improved algorithm
   */
  private static splitTextToFit(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.getTextWidth(testLine);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Get more accurate text width calculation
   */
  private static getTextWidth(text: string): number {
    // More accurate width calculation based on character types
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        width += 3;
      } else if (char === 'i' || char === 'l' || char === 'I') {
        width += 2;
      } else if (char === 'w' || char === 'W' || char === 'm' || char === 'M') {
        width += 4;
      } else {
        width += 3;
      }
    }
    return width;
  }

  /**
   * Generate PDF from HTML element (alternative method)
   */
  static async generatePDFFromHTML(element: HTMLElement, fileName: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
      console.log('✅ PDF generated from HTML successfully:', fileName);
    } catch (error) {
      console.error('❌ Error generating PDF from HTML:', error);
      throw new Error('Failed to generate PDF from HTML');
    }
  }
}
