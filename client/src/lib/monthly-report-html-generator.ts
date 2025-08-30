import { MonthlyReportAIInsights, ProcessedMetrics } from './monthly-report-data-service';
import { METRIC_LIBRARY } from './metrics-library';

export interface HTMLReportOptions {
  clientName: string;
  month: string;
  selectedMetrics: string[];
  processedMetrics: ProcessedMetrics;
  aiInsights: MonthlyReportAIInsights;
  clientData: any;
}

export class MonthlyReportHTMLGenerator {
  /**
   * Generate HTML report that can be converted to DOCX
   */
  static generateHTML(options: HTMLReportOptions): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Monthly Fitness Report - ${options.clientName}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #0066CC;
            padding-bottom: 20px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #0066CC;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        .client-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #0066CC;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .subsection-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .performance-score {
            font-size: 24px;
            font-weight: bold;
            color: #0066CC;
            text-align: center;
            background-color: #e6f3ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .metrics-table th,
        .metrics-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .metrics-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .metrics-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .trend-improving {
            color: #28a745;
        }
        .trend-declining {
            color: #dc3545;
        }
        .trend-stable {
            color: #6c757d;
        }
        .bullet-list {
            margin: 10px 0;
            padding-left: 20px;
        }
        .bullet-list li {
            margin-bottom: 5px;
        }
        .priority-high {
            color: #dc3545;
            font-weight: bold;
        }
        .priority-medium {
            color: #ffc107;
            font-weight: bold;
        }
        .priority-low {
            color: #28a745;
            font-weight: bold;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Monthly Fitness Report</div>
        <div class="subtitle">CoachEZ Trainer Platform</div>
    </div>

    <div class="client-info">
        <strong>Client:</strong> ${options.clientName}<br>
        <strong>Report Period:</strong> ${options.month}<br>
        <strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        
        <div class="performance-score">
            Overall Performance Score: ${options.aiInsights?.executiveSummary?.performanceScore || 0}%
        </div>
        
        <p>${this.cleanText(options.aiInsights?.executiveSummary?.overallPerformance || 'Analysis in progress...')}</p>
        
        ${options.aiInsights?.executiveSummary?.keyAchievements?.length > 0 ? `
        <div class="subsection-title">Key Achievements:</div>
        <ul class="bullet-list">
            ${options.aiInsights.executiveSummary.keyAchievements.map(achievement => 
              `<li>${this.cleanText(achievement)}</li>`
            ).join('')}
        </ul>
        ` : ''}
        
        ${options.aiInsights?.executiveSummary?.areasOfConcern?.length > 0 ? `
        <div class="subsection-title">Areas of Concern:</div>
        <ul class="bullet-list">
            ${options.aiInsights.executiveSummary.areasOfConcern.map(concern => 
              `<li>${this.cleanText(concern)}</li>`
            ).join('')}
        </ul>
        ` : ''}
    </div>

    <div class="section page-break">
        <div class="section-title">Performance Metrics</div>
        
        <table class="metrics-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Average Value</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                ${options.selectedMetrics.map(metricKey => {
                  const metric = options.processedMetrics[metricKey];
                  const metricInfo = METRIC_LIBRARY.find(m => m.key === metricKey);
                  
                  if (!metric) return '';
                  
                  const value = metric.monthlyAverage?.toFixed(1) || 'N/A';
                  const unit = metricInfo?.yLabel || '';
                  const trend = this.getTrendText(metric.trend);
                  const trendClass = this.getTrendClass(metric.trend);
                  
                  return `
                    <tr>
                        <td>${metricInfo?.label || metricKey}</td>
                        <td>${value} ${unit}</td>
                        <td class="${trendClass}">${trend}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section page-break">
        <div class="section-title">AI Analysis & Insights</div>
        
        ${options.aiInsights?.positiveTrends?.whatIsWorking?.length > 0 ? `
        <div class="subsection-title">What's Working Well:</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.whatIsWorking.map(item => 
              `<li>${this.cleanText(item)}</li>`
            ).join('')}
        </ul>
        ` : ''}
        
        ${options.aiInsights?.positiveTrends?.strengths?.length > 0 ? `
        <div class="subsection-title">Strengths:</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.strengths.map(strength => 
              `<li>${this.cleanText(strength)}</li>`
            ).join('')}
        </ul>
        ` : ''}
    </div>

    <div class="section page-break">
        <div class="section-title">Recommendations</div>
        
        ${options.aiInsights?.recommendations?.areasForImprovement?.length > 0 ? `
        <div class="subsection-title">Areas for Improvement:</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.areasForImprovement.map(area => 
              `<li>${this.cleanText(area)}</li>`
            ).join('')}
        </ul>
        ` : ''}
        
        ${options.aiInsights?.recommendations?.specificActions?.length > 0 ? `
        <div class="subsection-title">Specific Actions:</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.specificActions.map(action => 
              `<li>${this.cleanText(action)}</li>`
            ).join('')}
        </ul>
        ` : ''}
        
        ${options.aiInsights?.recommendations?.priorityLevel ? `
        <div class="subsection-title">Priority Level:</div>
        <p class="priority-${options.aiInsights.recommendations.priorityLevel.toLowerCase()}">
            ${options.aiInsights.recommendations.priorityLevel}
        </p>
        ` : ''}
    </div>

    <div class="section page-break">
        <div class="section-title">Plan Forward</div>
        
        ${options.aiInsights?.planForward?.nextMonthGoals?.length > 0 ? `
        <div class="subsection-title">Next Month Goals:</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.nextMonthGoals.map(goal => 
              `<li>${this.cleanText(goal)}</li>`
            ).join('')}
        </ul>
        ` : ''}
        
        ${options.aiInsights?.planForward?.actionSteps?.length > 0 ? `
        <div class="subsection-title">Action Steps:</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.actionSteps.map(step => 
              `<li>${this.cleanText(step)}</li>`
            ).join('')}
        </ul>
        ` : ''}
        
        ${options.aiInsights?.planForward?.expectedOutcomes?.length > 0 ? `
        <div class="subsection-title">Expected Outcomes:</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.expectedOutcomes.map(outcome => 
              `<li>${this.cleanText(outcome)}</li>`
            ).join('')}
        </ul>
        ` : ''}
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Clean text by removing markdown syntax
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/^[\s]*[•\-\*][\s]*/gm, '• ') // Fix bullet points
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();
  }

  /**
   * Get trend text with proper formatting
   */
  private static getTrendText(trend: string): string {
    switch (trend?.toLowerCase()) {
      case 'improving':
      case 'up':
        return '↗ Improving';
      case 'declining':
      case 'down':
        return '↘ Declining';
      case 'stable':
      default:
        return '→ Stable';
    }
  }

  /**
   * Get trend CSS class
   */
  private static getTrendClass(trend: string): string {
    switch (trend?.toLowerCase()) {
      case 'improving':
      case 'up':
        return 'trend-improving';
      case 'declining':
      case 'down':
        return 'trend-declining';
      case 'stable':
      default:
        return 'trend-stable';
    }
  }
}
