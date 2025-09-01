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
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #1a202c;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
        }

        .header-left {
            flex: 1;
        }

        .header-center {
            flex: 2;
            text-align: center;
        }

        .header-right {
            flex: 1;
            text-align: right;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            font-size: 36px;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }

        .company-info {
            color: white;
        }

        .company-name {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 2px;
        }

        .tagline {
            font-size: 12px;
            opacity: 0.9;
        }

        .title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }

        .report-meta {
            color: white;
            font-size: 12px;
        }

        .report-date, .report-version {
            opacity: 0.9;
            margin-bottom: 2px;
        }

        .client-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 30px 40px;
            margin: -20px 0 30px 0;
            border-radius: 0 0 20px 20px;
        }

        .client-profile {
            display: flex;
            align-items: center;
            gap: 25px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .client-avatar {
            flex-shrink: 0;
        }

        .profile-image, .default-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .default-avatar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
        }

        .client-details {
            flex: 1;
        }

        .client-name {
            font-size: 28px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
        }

        .client-metrics {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .metric-item {
            background: rgba(255, 255, 255, 0.8);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            color: #4a5568;
            border: 1px solid #e2e8f0;
        }

        /* Enhanced section styling */
        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
        }

        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3b82f6;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 2px;
        }

        .subsection-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin: 20px 0 10px 0;
            padding-left: 15px;
            border-left: 3px solid #10b981;
        }

        /* Enhanced bullet list styling */
        .bullet-list {
            padding-left: 20px;
        }

        .bullet-list li {
            margin-bottom: 8px;
            color: #4b5563;
            line-height: 1.6;
        }

        .bullet-list li::marker {
            color: #3b82f6;
            font-weight: bold;
        }

        /* Professional footer */
        .footer {
            margin-top: 50px;
            padding: 30px 40px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            border-radius: 12px 12px 0 0;
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
        }

        .footer-left {
            flex: 1;
        }

        .footer-center {
            flex: 2;
            text-align: center;
        }

        .footer-right {
            flex: 1;
            text-align: right;
        }

        .footer-logo {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .footer-company {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .footer-tagline {
            font-size: 12px;
            opacity: 0.8;
        }

        .footer-disclaimer {
            font-size: 14px;
            line-height: 1.5;
            opacity: 0.9;
        }

        .footer-contact {
            font-size: 12px;
            opacity: 0.8;
        }

        .footer-version {
            font-size: 11px;
            opacity: 0.6;
            margin-top: 10px;
        }

        /* Page break utility */
        .page-break {
            page-break-before: always;
        }

        /* Force page break for detailed metrics */
        .detailed-metrics-break {
            page-break-before: always;
        }
        .client-info {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 40px;
            border-left: 5px solid #0066CC;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 24px;
            font-weight: bold;
            color: #0066CC;
            border-bottom: 2px solid #ddd;
            padding-bottom: 15px;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .subsection-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 25px 0 15px 0;
            padding-left: 15px;
            border-left: 4px solid #0066CC;
        }
        .performance-score {
            font-size: 28px;
            font-weight: bold;
            color: #0066CC;
            text-align: center;
            background: linear-gradient(135deg, #e6f3ff 0%, #f0f8ff 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 25px 0;
            border: 2px solid #0066CC;
        }
        .bullet-list {
            margin: 15px 0;
            padding-left: 25px;
        }
        .bullet-list li {
            margin-bottom: 12px;
            line-height: 1.7;
            font-size: 14px;
        }
        .priority-high {
            color: #dc3545;
            font-weight: bold;
            background-color: #ffe6e6;
            padding: 5px 10px;
            border-radius: 5px;
        }
        .priority-medium {
            color: #ffc107;
            font-weight: bold;
            background-color: #fff8e6;
            padding: 5px 10px;
            border-radius: 5px;
        }
        .priority-low {
            color: #28a745;
            font-weight: bold;
            background-color: #e6ffe6;
            padding: 5px 10px;
            border-radius: 5px;
        }
        .page-break {
            page-break-before: always;
        }
        .overall-performance {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #0066CC;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #0066CC;
        }
        .metric-title {
            font-weight: bold;
            color: #0066CC;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .metric-description {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
            font-style: italic;
        }
        .metric-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
        }
        .metric-trend {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            background-color: #e9ecef;
            color: #495057;
        }

        /* New table styles for detailed metrics analysis */
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
            background-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        .metrics-table th {
            background: linear-gradient(135deg, #0066CC, #0099FF);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            border-bottom: 2px solid #004C99;
        }

        .metrics-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
        }

        .metrics-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .metrics-table tr:hover {
            background-color: #e3f2fd;
            transition: background-color 0.2s ease;
        }

        .metric-name {
            font-weight: 600;
            color: #0066CC;
            font-size: 14px;
        }

        .metric-description {
            color: #666;
            font-size: 11px;
            margin-top: 4px;
            font-style: italic;
        }

        .metric-value {
            font-weight: 600;
            font-size: 13px;
            color: #333;
            text-align: center;
        }

        .trend-up {
            color: #28a745;
            font-weight: 600;
        }

        .trend-down {
            color: #dc3545;
            font-weight: 600;
        }

        .trend-stable {
            color: #6c757d;
            font-weight: 600;
        }

        .comments-cell {
            max-width: 200px;
            font-size: 11px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <div class="logo-section">
                    <div class="logo">🏋️‍♂️</div>
                    <div class="company-info">
                        <div class="company-name">CoachEZ</div>
                        <div class="tagline">Professional Fitness Coaching Platform</div>
                    </div>
                </div>
            </div>
            <div class="header-center">
                <div class="title">Monthly Fitness Performance Report</div>
                <div class="subtitle">Comprehensive Analysis & Insights</div>
            </div>
            <div class="header-right">
                <div class="report-meta">
                    <div class="report-date">Generated: ${new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</div>
                    <div class="report-version">Version 2.0</div>
                </div>
            </div>
        </div>
    </div>

    <div class="client-section">
        <div class="client-profile">
            <div class="client-avatar">
                ${options.clientData?.clientInfo?.profile_image_url ?
                  `<img src="${options.clientData.clientInfo.profile_image_url}" alt="Client Profile" class="profile-image" />` :
                  '<div class="default-avatar">👤</div>'
                }
            </div>
            <div class="client-details">
                <div class="client-name">${options.clientName}</div>
                <div class="client-metrics">
                    <span class="metric-item">Report Period: ${options.month}</span>
                    <span class="metric-item">Total Activities: ${options.clientData?.activityData?.length || 0}</span>
                    <span class="metric-item">Workouts Completed: ${options.clientData?.workoutData?.length || 0}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        
        <div class="overall-performance">
            <strong>Overall Performance:</strong><br>
            ${options.aiInsights.executiveSummary.overallPerformance}
        </div>

        <div class="performance-score">
            Performance Score: ${options.aiInsights.executiveSummary.performanceScore}/100
        </div>

        <div class="subsection-title">Key Achievements</div>
        <ul class="bullet-list">
            ${options.aiInsights.executiveSummary.keyAchievements.map(item => `<li>• ${item}</li>`).join('')}
        </ul>

        <div class="subsection-title">Areas of Concern</div>
        <ul class="bullet-list">
            ${options.aiInsights.executiveSummary.areasOfConcern.map(item => `<li>• ${item}</li>`).join('')}
        </ul>
    </div>

    <div class="section page-break">
        <div class="section-title">Performance Analysis</div>
        
        <div class="subsection-title">Training Performance</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.whatIsWorking.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Nutrition & Lifestyle</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.strengths.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Data & Engagement</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.improvements.slice(0, 2).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <div class="section-title">Strengths & Positive Trends</div>
        
        <div class="subsection-title">Commitment & Consistency</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.strengths.slice(3, 5).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Progress Indicators</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.whatIsWorking.slice(3, 5).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Engagement & Communication</div>
        <ul class="bullet-list">
            ${options.aiInsights.positiveTrends.improvements.slice(2, 4).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
    </div>

    <div class="section page-break">
        <div class="section-title">Detailed Metrics Analysis</div>
        <div class="page-break"></div>
        <table class="metrics-table">
            <thead>
                <tr>
                    <th>Metric Definition</th>
                    <th>30-Day Average</th>
                    <th>First Half Average</th>
                    <th>Second Half Average</th>
                    <th>Trend</th>
                    <th>Comments</th>
                </tr>
            </thead>
            <tbody>
                ${options.selectedMetrics.map(metricKey => {
                    const metric = METRIC_LIBRARY.find(m => m.key === metricKey);
                    const processedMetric = options.processedMetrics[metricKey];

                    if (!metric || !processedMetric) return '';

                    const description = metric.description || 'No description available';
                    const unit = metric.unit || metric.yLabel || 'N/A';
                    const monthlyAvg = processedMetric.monthlyAverage || 0;
                    const trend = processedMetric.trend || 'stable';

                    // Calculate first and second half averages from trend analysis
                    const firstHalfAvg = processedMetric.trendAnalysis?.firstAvg || 0;
                    const secondHalfAvg = processedMetric.trendAnalysis?.secondAvg || 0;

                    // Determine trend class for styling
                    const trendClass = trend === 'up' ? 'trend-up' :
                                     trend === 'down' ? 'trend-down' : 'trend-stable';

                    // Generate comments based on trend and values
                    let comments = '';
                    if (processedMetric.trendAnalysis?.dataAvailable) {
                        const change = processedMetric.trendAnalysis.change || 0;
                        if (Math.abs(change) > 10) {
                            comments = change > 0 ? 'Significant improvement' : 'Significant decline';
                        } else if (Math.abs(change) > 5) {
                            comments = change > 0 ? 'Moderate improvement' : 'Moderate decline';
                        } else {
                            comments = 'Stable performance';
                        }
                    } else {
                        comments = 'Insufficient data for trend analysis';
                    }

                    return `
                        <tr>
                            <td>
                                <div class="metric-name">${metric.label}</div>
                                <div class="metric-description">${description}</div>
                            </td>
                            <td class="metric-value">${monthlyAvg.toFixed(1)} ${unit}</td>
                            <td class="metric-value">${firstHalfAvg.toFixed(1)} ${unit}</td>
                            <td class="metric-value">${secondHalfAvg.toFixed(1)} ${unit}</td>
                            <td><span class="${trendClass}">${trend.toUpperCase()}</span></td>
                            <td class="comments-cell">${comments}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section page-break">
        <div class="section-title">Areas for Improvement</div>
        
        <div class="subsection-title">Training Optimization</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.areasForImprovement.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Nutrition Enhancement</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.specificActions.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Lifestyle Factors</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.areasForImprovement.slice(3, 5).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <div class="section-title">Recommendations</div>
        
        <div class="subsection-title">Immediate Actions (Next 2 Weeks)</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.specificActions.slice(0, 4).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Short-term Goals (Next Month)</div>
        <ul class="bullet-list">
            ${options.aiInsights.recommendations.areasForImprovement.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Long-term Strategy (Next 3 Months)</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.nextMonthGoals.slice(0, 3).map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Priority Level: <span class="priority-${options.aiInsights.recommendations.priorityLevel}">${options.aiInsights.recommendations.priorityLevel.toUpperCase()}</span></div>
    </div>

    <div class="section page-break">
        <div class="section-title">Plan Forward</div>
        
        <div class="subsection-title">Next Month Objectives</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.nextMonthGoals.map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Action Steps</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.actionSteps.map(item => `<li>• ${item}</li>`).join('')}
        </ul>
        
        <div class="subsection-title">Expected Outcomes</div>
        <ul class="bullet-list">
            ${options.aiInsights.planForward.expectedOutcomes.map(item => `<li>• ${item}</li>`).join('')}
        </ul>
    </div>

    <!-- Professional Footer -->
    <div class="footer">
        <div class="footer-content">
            <div class="footer-left">
                <div class="footer-logo">🏋️‍♂️</div>
                <div class="footer-company">CoachEZ</div>
                <div class="footer-tagline">Empowering Fitness Excellence</div>
            </div>
            <div class="footer-center">
                <div class="footer-disclaimer">
                    This report is generated based on the data provided by the client and represents a comprehensive analysis of their fitness journey.
                    All recommendations are made in good faith and should be discussed with a qualified healthcare professional before implementation.
                </div>
            </div>
            <div class="footer-right">
                <div class="footer-contact">
                    Report Generated: ${new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}<br>
                    Platform Version: 2.0<br>
                    <span class="footer-version">© ${new Date().getFullYear()} CoachEZ. All rights reserved.</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    
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
