import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Database, BarChart3, User, Target, TrendingUp, Calendar, Activity, Utensils, Dumbbell } from 'lucide-react';

interface LLMDataModalProps {
  clientData: any;
  processedMetrics: any;
  selectedMetrics: string[];
  month: string;
  kpis: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LLMDataModal: React.FC<LLMDataModalProps> = ({
  clientData,
  processedMetrics,
  selectedMetrics,
  month,
  kpis,
  isOpen,
  onOpenChange
}) => {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getMetricColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'needs_improvement': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sent to AI (LLM)
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is the complete data context being sent to the AI for generating your monthly report.
          </p>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="kpis" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="raw-data" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Raw Data
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {clientData?.clientInfo?.cl_name || 'N/A'}</div>
                    <div><strong>Age:</strong> {clientData?.clientInfo?.cl_age || 'N/A'}</div>
                    <div><strong>Goal:</strong> {clientData?.clientInfo?.cl_primary_goal || 'N/A'}</div>
                    <div><strong>Weight:</strong> {clientData?.clientInfo?.cl_weight || 'N/A'} kg</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Report Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div><strong>Month:</strong> {month}</div>
                    <div><strong>Selected Metrics:</strong> {selectedMetrics.length}</div>
                    <div><strong>Data Points:</strong> {
                      (clientData?.activityData?.length || 0) +
                      (clientData?.mealData?.length || 0) +
                      (clientData?.workoutData?.length || 0)
                    }</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Key KPIs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div><strong>Workout Adherence:</strong> {kpis?.workoutAdherence || 0}%</div>
                    <div><strong>Nutrition Adherence:</strong> {kpis?.nutritionAdherence || 0}%</div>
                    <div><strong>Overall Adherence:</strong> {kpis?.overallAdherence || 0}%</div>
                    <div><strong>Engagement Score:</strong> {kpis?.engagementScore || 0}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Activity Records: {clientData?.activityData?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-green-500" />
                    <span>Meal Records: {clientData?.mealData?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-purple-500" />
                    <span>Workout Records: {clientData?.workoutData?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span>Targets: {clientData?.targetData?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Client Profile Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {clientData?.clientInfo && Object.entries(clientData.clientInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span className="text-gray-600 dark:text-gray-400">{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calculated Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kpis && Object.entries(kpis).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <Badge variant="secondary">{formatValue(value)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Processed Metrics Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedMetrics.map(metricKey => {
                    const metric = processedMetrics?.[metricKey];
                    if (!metric) return null;

                    return (
                      <div key={metricKey} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{metricKey}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getTrendIcon(metric.trend)}</span>
                            <Badge className={getMetricColor(metric.performance || 'needs_improvement')}>
                              {metric.performance || 'needs_improvement'}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div><strong>Monthly Average:</strong> {formatValue(metric.monthlyAverage)}</div>
                          <div><strong>Trend:</strong> {metric.trend}</div>
                          <div><strong>Weekly Data Points:</strong> {metric.weeklyData?.length || 0}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw-data" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Data ({clientData?.activityData?.length || 0} records)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(clientData?.activityData?.slice(0, 3) || [], null, 2)}
                      {clientData?.activityData?.length > 3 && '\n... (showing first 3 records)'}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Meal Data ({clientData?.mealData?.length || 0} records)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(clientData?.mealData?.slice(0, 3) || [], null, 2)}
                      {clientData?.mealData?.length > 3 && '\n... (showing first 3 records)'}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Workout Data ({clientData?.workoutData?.length || 0} records)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(clientData?.workoutData?.slice(0, 3) || [], null, 2)}
                      {clientData?.workoutData?.length > 3 && '\n... (showing first 3 records)'}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Target Data ({clientData?.targetData?.length || 0} records)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(clientData?.targetData || [], null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Complete AI Context (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    {JSON.stringify({
                      clientProfile: {
                        name: clientData?.clientInfo?.cl_name,
                        age: clientData?.clientInfo?.cl_age,
                        primaryGoal: clientData?.clientInfo?.cl_primary_goal,
                        currentWeight: clientData?.clientInfo?.cl_weight,
                        targetWeight: clientData?.clientInfo?.cl_target_weight,
                        activityLevel: clientData?.clientInfo?.cl_activity_level,
                        trainingDays: clientData?.clientInfo?.training_days_per_week
                      },
                      month: month,
                      kpis: kpis,
                      metricsAnalysis: selectedMetrics.map(metricKey => {
                        const metric = processedMetrics?.[metricKey];
                        return {
                          metric: metricKey,
                          currentValue: metric?.monthlyAverage || 0,
                          targetValue: clientData?.targetData?.find(t => t.metric_key === metricKey)?.target_value || 0,
                          trend: metric?.trend || 'stable',
                          performance: metric?.performance || 'needs_improvement'
                        };
                      }),
                      activitySummary: {
                        records: clientData?.activityData?.length || 0,
                        days: new Set(clientData?.activityData?.map(a => new Date(a.created_at).toDateString())).size || 0,
                        metrics: Object.keys(clientData?.activityData?.[0] || {}).filter(key => 
                          ['weight', 'height', 'heart_rate', 'sleep_hours', 'stress_level'].includes(key)
                        )
                      },
                      nutritionSummary: {
                        records: clientData?.mealData?.length || 0,
                        days: new Set(clientData?.mealData?.map(m => new Date(m.created_at).toDateString())).size || 0,
                        mealTypes: [...new Set(clientData?.mealData?.map(m => m.meal_type) || [])]
                      },
                      workoutSummary: {
                        records: clientData?.workoutData?.length || 0,
                        days: new Set(clientData?.workoutData?.map(w => new Date(w.created_at).toDateString())).size || 0,
                        totalDuration: clientData?.workoutData?.reduce((sum, w) => sum + (w.duration || 0), 0) || 0
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LLMDataModal;
