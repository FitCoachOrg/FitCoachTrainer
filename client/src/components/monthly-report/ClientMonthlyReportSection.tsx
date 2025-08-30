import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Calendar, BarChart3, Download, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle, Target, History, Cloud, Eye, Database } from 'lucide-react';
import { METRIC_LIBRARY } from '@/lib/metrics-library';
import { useToast } from '@/hooks/use-toast';
import { MonthlyReportDataService, ClientReportData } from '@/lib/monthly-report-data-service';
import { ProcessedMetrics } from '@/lib/monthly-report-data-service';
import { MonthlyReportMetricsProcessor } from '@/lib/monthly-report-metrics-processor';
import { MonthlyReportAIAnalysis, MonthlyReportAIInsights } from '@/lib/ai-monthly-report-analysis';
import { MonthlyReportPDFGenerator } from '@/lib/monthly-report-pdf-generator';
import { MonthlyReportStorageService, MonthlyReportPreferences, GeneratedReport } from '@/lib/monthly-report-storage-service';
import { LLMDataModal } from './LLMDataModal';

interface ClientMonthlyReportSectionProps {
  clientId: string;
  client?: any;
}

export const ClientMonthlyReportSection: React.FC<ClientMonthlyReportSectionProps> = ({
  clientId,
  client
}) => {
  const { toast } = useToast();
  
  // State management
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateRangeMode, setDateRangeMode] = useState<'month' | 'custom'>('month');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'sleep', 'heartRate']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLLMDataModalOpen, setIsLLMDataModalOpen] = useState(false);
  const [availableDateRanges, setAvailableDateRanges] = useState<{ month: string; label: string; recordCount: number }[]>([]);
  const [reportData, setReportData] = useState<{
    clientData: ClientReportData | null;
    processedMetrics: ProcessedMetrics | null;
    aiInsights: MonthlyReportAIInsights | null;
    kpis: any;
  }>({
    clientData: null,
    processedMetrics: null,
    aiInsights: null,
    kpis: null
  });
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [preferences, setPreferences] = useState<MonthlyReportPreferences | null>(null);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  // Load saved preferences on component mount
  useEffect(() => {
    loadSavedPreferences();
    loadAvailableDateRanges();
    
    // Debug: Check data for client 34
    if (clientId === '34') {
      console.log('🔍 DEBUG: Triggering debug for client 34');
      MonthlyReportDataService.debugClientData(clientId);
    }
  }, [clientId]);

  // Load saved preferences from database
  const loadSavedPreferences = async () => {
    try {
      setIsLoading(true);
      const savedPreferences = await MonthlyReportStorageService.getPreferences(clientId);
      setPreferences(savedPreferences);
      setSelectedMetrics(savedPreferences.selected_metrics);
      setSelectedMonth(savedPreferences.last_generated_month || new Date().toISOString().slice(0, 7));
      
      // Load generated reports history
      const reports = await MonthlyReportStorageService.getGeneratedReports(clientId);
      setGeneratedReports(reports);
      
      console.log('✅ Loaded saved preferences:', savedPreferences);
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      toast({
        title: "Error loading preferences",
        description: "Using default settings. Your preferences will be saved when you generate a report.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load available date ranges
  const loadAvailableDateRanges = async () => {
    try {
      const ranges = await MonthlyReportDataService.getAvailableDateRanges(clientId);
      setAvailableDateRanges(ranges);
      console.log('✅ Loaded available date ranges:', ranges);
    } catch (error) {
      console.error('❌ Error loading date ranges:', error);
    }
  };

  // Save preferences to database
  const savePreferences = async (newPreferences: Partial<MonthlyReportPreferences>) => {
    try {
      await MonthlyReportStorageService.savePreferences(clientId, newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      console.log('✅ Preferences saved successfully');
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "Your preferences will be saved when you generate a report.",
        variant: "destructive"
      });
    }
  };

  // Handle metric selection
  const handleMetricToggle = async (metricKey: string) => {
    const newSelectedMetrics = selectedMetrics.includes(metricKey) 
      ? selectedMetrics.filter(m => m !== metricKey)
      : [...selectedMetrics, metricKey];
    
    setSelectedMetrics(newSelectedMetrics);
    
    // Save to database
    await savePreferences({ selected_metrics: newSelectedMetrics });
  };

  // Handle month selection
  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    await savePreferences({ last_generated_month: month });
  };

  // Handle date selection
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
  };

  // Handle date range mode change
  const handleDateRangeModeChange = (mode: 'month' | 'custom') => {
    setDateRangeMode(mode);
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (selectedMetrics.length === 0) {
      toast({
        title: "No metrics selected",
        description: "Please select at least one metric for the report.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('📊 Generating monthly report for:', {
        clientId,
        dateRangeMode,
        selectedMonth,
        selectedDate,
        selectedMetrics
      });

      let clientData: ClientReportData;

      // Step 1: Fetch data based on date range mode
      if (dateRangeMode === 'month') {
        clientData = await MonthlyReportDataService.getClientData(clientId, selectedMonth);
      } else {
        clientData = await MonthlyReportDataService.getClientDataForPast30Days(clientId, selectedDate);
      }
      
      // Step 2: Process metrics
      const processedMetrics = MonthlyReportMetricsProcessor.processMetrics(clientData, selectedMetrics);
      
      // Step 3: Calculate KPIs for LLM data modal
      const kpis = MonthlyReportAIAnalysis.calculateKPIs(clientData, processedMetrics);
      
      // Step 4: Generate AI insights
      const aiInsights = await MonthlyReportAIAnalysis.generateMonthlyInsights(
        clientData,
        processedMetrics,
        selectedMetrics
      );

      setReportData({
        clientData,
        processedMetrics,
        aiInsights,
        kpis
      });

      // Save preferences
      await savePreferences({
        selected_metrics: selectedMetrics,
        last_generated_month: dateRangeMode === 'month' ? selectedMonth : clientData.month
      });

      toast({
        title: "Report generated successfully!",
        description: `Monthly report for ${clientData.month} is ready.`,
      });

    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: "Error generating report",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Download report as PDF and upload to storage
  const handleDownloadPDF = async () => {
    if (!reportData.clientData || !reportData.processedMetrics || !reportData.aiInsights) {
      toast({
        title: "No report data available",
        description: "Please generate a report first before downloading.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const clientName = client?.cl_name || 'Client';

      // Generate PDF blob
      const { blob, fileName } = await MonthlyReportPDFGenerator.generatePDFBlob(
        reportData.clientData,
        reportData.processedMetrics,
        reportData.aiInsights,
        {
          clientName,
          month: reportData.clientData.month,
          selectedMetrics,
          includeAIInsights: true,
          includeTargets: true
        }
      );

      // Upload to Supabase storage
      const filePath = await MonthlyReportStorageService.uploadPDF(
        clientId,
        reportData.clientData.month,
        blob,
        fileName
      );

      // Add to generated reports history
      await MonthlyReportStorageService.addGeneratedReport(
        clientId,
        reportData.clientData.month,
        filePath,
        selectedMetrics.length,
        blob.size
      );

      // Refresh generated reports list
      const reports = await MonthlyReportStorageService.getGeneratedReports(clientId);
      setGeneratedReports(reports);

      // Download the file locally
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF generated and saved!",
        description: `Report saved to cloud storage and downloaded locally.`,
      });

    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      toast({
        title: "Error downloading PDF",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Download existing report from storage
  const handleDownloadExistingReport = async (report: GeneratedReport) => {
    try {
      const blob = await MonthlyReportStorageService.downloadPDF(report.file_path);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Monthly_Report_${client?.cl_name || 'Client'}_${report.month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded!",
        description: `Previous report for ${report.month} downloaded successfully.`,
      });
    } catch (error) {
      console.error('❌ Error downloading existing report:', error);
      toast({
        title: "Error downloading report",
        description: "The report may no longer be available in storage.",
        variant: "destructive"
      });
    }
  };

  // Get performance color
  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'good': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'poor': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Report Period
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={dateRangeMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateRangeModeChange('month')}
                >
                  Monthly
                </Button>
                <Button
                  variant={dateRangeMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateRangeModeChange('custom')}
                >
                  Past 30 Days
                </Button>
              </div>
            </div>

            {dateRangeMode === 'month' ? (
              <div className="space-y-2">
                <Label>Select Month</Label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                >
                  {availableDateRanges.length > 0 ? (
                    availableDateRanges.map(range => (
                      <option key={range.month} value={range.month}>
                        {range.label} ({range.recordCount} records)
                      </option>
                    ))
                  ) : (
                    monthOptions.map(month => (
                      <option key={month} value={month}>
                        {new Date(month).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>From Date (Past 30 days will be analyzed)</Label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500">
                  Report will analyze data from {new Date(new Date(selectedDate).getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} to {selectedDate}
                </p>
              </div>
            )}
          </div>

          {/* Metrics Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Select Metrics for Report
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-md dark:border-gray-600">
              {METRIC_LIBRARY.map((metric) => (
                <div key={metric.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.key}
                    checked={selectedMetrics.includes(metric.key)}
                    onCheckedChange={() => handleMetricToggle(metric.key)}
                  />
                  <Label htmlFor={metric.key} className="text-sm cursor-pointer">
                    {metric.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Selected: {selectedMetrics.length} metrics
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || selectedMetrics.length === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Monthly Report
                </>
              )}
            </Button>

            {reportData.clientData && (
              <Button
                variant="outline"
                onClick={() => setIsLLMDataModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                View LLM Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports History */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Previous Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedReports.slice(-5).reverse().map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div>
                    <p className="font-medium">
                      {new Date(report.month).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.metrics_count} metrics • {new Date(report.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadExistingReport(report)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {reportData.aiInsights && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Performance</p>
                  <p className="text-lg font-semibold">
                    {reportData.aiInsights?.executiveSummary?.overallPerformance || "Analysis in progress..."}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Performance Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.aiInsights?.executiveSummary?.performanceScore || 0}%
                  </p>
                </div>
              </div>

              {/* Key Achievements */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Key Achievements
                </h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.executiveSummary?.keyAchievements?.map((achievement, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {achievement}</li>
                  )) || <li className="text-sm text-gray-500">Loading achievements...</li>}
                </ul>
              </div>

              {/* Areas of Concern */}
              {reportData.aiInsights?.executiveSummary?.areasOfConcern?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Areas of Concern
                  </h4>
                  <ul className="space-y-1">
                    {reportData.aiInsights?.executiveSummary?.areasOfConcern?.map((concern, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Positive Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                What's Working Well
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.positiveTrends?.strengths?.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {strength}</li>
                  )) || <li className="text-sm text-gray-500">Loading strengths...</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Improvements</h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.positiveTrends?.improvements?.map((improvement, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {improvement}</li>
                  )) || <li className="text-sm text-gray-500">Loading improvements...</li>}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.recommendations?.areasForImprovement?.map((area, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {area}</li>
                  )) || <li className="text-sm text-gray-500">Loading recommendations...</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Specific Actions</h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.recommendations?.specificActions?.map((action, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {action}</li>
                  )) || <li className="text-sm text-gray-500">Loading actions...</li>}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Priority Level:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  reportData.aiInsights?.recommendations?.priorityLevel === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  reportData.aiInsights?.recommendations?.priorityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {reportData.aiInsights?.recommendations?.priorityLevel?.toUpperCase() || 'MEDIUM'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Plan Forward */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Plan Forward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Next Month Goals</h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.planForward?.nextMonthGoals?.map((goal, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {goal}</li>
                  )) || <li className="text-sm text-gray-500">Loading goals...</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Action Steps</h4>
                <ul className="space-y-1">
                  {reportData.aiInsights?.planForward?.actionSteps?.map((step, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {step}</li>
                  )) || <li className="text-sm text-gray-500">Loading action steps...</li>}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Analysis */}
          {reportData.processedMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Metrics Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMetrics.map(metricKey => {
                    const metric = reportData.processedMetrics?.[metricKey];
                    const aiAnalysis = reportData.aiInsights?.metricsAnalysis?.[metricKey];
                    
                    if (!metric) return null;

                    return (
                      <div key={metricKey} className="p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{METRIC_LIBRARY.find(m => m.key === metricKey)?.label || metricKey}</h4>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Average:</span>
                            <span className="font-medium">{metric.monthlyAverage.toFixed(1)}</span>
                          </div>
                          {aiAnalysis && (
                            <div className="space-y-1">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(aiAnalysis.performance)}`}>
                                {aiAnalysis.performance.replace('_', ' ').toUpperCase()}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{aiAnalysis.insights}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4" />
                  Generate & Save PDF Report
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* LLM Data Modal */}
      {reportData.clientData && (
        <LLMDataModal
          clientData={reportData.clientData}
          processedMetrics={reportData.processedMetrics}
          selectedMetrics={selectedMetrics}
          month={reportData.clientData.month}
          kpis={reportData.kpis}
          isOpen={isLLMDataModalOpen}
          onOpenChange={setIsLLMDataModalOpen}
        />
      )}
    </div>
  );
};

export default ClientMonthlyReportSection;
