import { METRIC_LIBRARY } from './metrics-library';
import { ClientReportData, ProcessedMetrics } from './monthly-report-data-service';

export class MonthlyReportMetricsProcessor {
  /**
   * Process raw data into meaningful metrics for monthly report
   */
  static processMetrics(rawData: ClientReportData, selectedMetrics: string[]): ProcessedMetrics {
    const processedMetrics: ProcessedMetrics = {};

    console.log('🔧 Processing metrics for monthly report:', {
      selectedMetrics,
      activityRecords: rawData.activityData.length,
      mealRecords: rawData.mealData.length,
      workoutRecords: rawData.workoutData.length
    });

    selectedMetrics.forEach(metricKey => {
      const metric = METRIC_LIBRARY.find(m => m.key === metricKey);
      if (!metric) {
        console.warn(`Metric not found in library: ${metricKey}`);
        return;
      }

      try {
        switch (metric.dataSource) {
          case 'activity_info':
            processedMetrics[metricKey] = this.processActivityMetric(rawData.activityData, metric);
            break;
          case 'meal_info':
            processedMetrics[metricKey] = this.processMealMetric(rawData.mealData, metric);
            break;
          case 'workout_info':
            processedMetrics[metricKey] = this.processWorkoutMetric(rawData.workoutData, metric);
            break;
          case 'client_engagement_score':
            processedMetrics[metricKey] = this.processEngagementMetric(rawData.engagementData, metric);
            break;
          case 'external_device_connect':
            processedMetrics[metricKey] = this.processExternalDeviceMetric(rawData.activityData, metric);
            break;
          default:
            console.warn(`Unknown data source for metric: ${metricKey}`);
        }
      } catch (error) {
        console.error(`Error processing metric ${metricKey}:`, error);
      }
    });

    console.log('✅ Metrics processing completed:', Object.keys(processedMetrics));
    return processedMetrics;
  }

  /**
   * Process activity_info metrics
   */
  private static processActivityMetric(activityData: any[], metric: any) {
    const relevantData = activityData.filter(item => 
      item.activity && item.activity.toLowerCase() === metric.activityName.toLowerCase()
    );

    if (relevantData.length === 0) {
      return this.createEmptyMetric(metric);
    }

    const weeklyData = this.groupByWeek(relevantData, 'created_at');
    const monthlyAverage = this.calculateAverage(relevantData.map(d => d.qty));
    const trend = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend
    };
  }

  /**
   * Process meal_info metrics
   */
  private static processMealMetric(mealData: any[], metric: any) {
    const columnName = metric.columnName as keyof typeof mealData[0];
    
    if (!columnName) {
      console.warn(`No column name specified for meal metric: ${metric.key}`);
      return this.createEmptyMetric(metric);
    }

    const relevantData = mealData.map(item => ({
      ...item,
      qty: item[columnName] || 0,
      created_at: item.created_at
    })).filter(item => item.qty > 0);

    if (relevantData.length === 0) {
      return this.createEmptyMetric(metric);
    }

    const weeklyData = this.groupByWeek(relevantData, 'created_at');
    const monthlyAverage = this.calculateAverage(relevantData.map(d => d.qty));
    const trend = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend
    };
  }

  /**
   * Process workout_info metrics
   */
  private static processWorkoutMetric(workoutData: any[], metric: any) {
    const columnName = metric.columnName as keyof typeof workoutData[0];
    
    if (!columnName) {
      console.warn(`No column name specified for workout metric: ${metric.key}`);
      return this.createEmptyMetric(metric);
    }

    const relevantData = workoutData.map(item => ({
      ...item,
      qty: item[columnName] || 0,
      created_at: item.created_at
    })).filter(item => item.qty > 0);

    if (relevantData.length === 0) {
      return this.createEmptyMetric(metric);
    }

    const weeklyData = this.groupByWeek(relevantData, 'created_at');
    const monthlyAverage = this.calculateAverage(relevantData.map(d => d.qty));
    const trend = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend
    };
  }

  /**
   * Process engagement metrics
   */
  private static processEngagementMetric(engagementData: any[], metric: any) {
    const relevantData = engagementData.filter(item => item.eng_score !== null);

    if (relevantData.length === 0) {
      return this.createEmptyMetric(metric);
    }

    const weeklyData = this.groupByWeek(relevantData, 'for_date');
    const monthlyAverage = this.calculateAverage(relevantData.map(d => d.eng_score));
    const trend = this.calculateTrend(relevantData.map(d => ({ ...d, qty: d.eng_score })));

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend
    };
  }

  /**
   * Process external device metrics (using activity_info as proxy)
   */
  private static processExternalDeviceMetric(activityData: any[], metric: any) {
    // For external device metrics, we'll use activity_info as a proxy
    // This is a simplified approach - in a real implementation, you'd query external_device_connect
    const relevantData = activityData.filter(item => 
      item.activity && item.activity.toLowerCase().includes(metric.activityName.toLowerCase())
    );

    if (relevantData.length === 0) {
      return this.createEmptyMetric(metric);
    }

    const weeklyData = this.groupByWeek(relevantData, 'created_at');
    const monthlyAverage = this.calculateAverage(relevantData.map(d => d.qty));
    const trend = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend
    };
  }

  /**
   * Group data by week for monthly view
   */
  private static groupByWeek(data: any[], dateField: string) {
    const weeks: { [key: string]: any[] } = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(item);
    });

    return Object.entries(weeks).map(([week, items]) => ({
      week,
      data: items,
      average: this.calculateAverage(items.map(i => i.qty)),
      count: items.length
    }));
  }

  /**
   * Calculate average of numeric values
   */
  private static calculateAverage(values: number[]): number {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    return validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  }

  /**
   * Calculate trend based on data progression
   */
  private static calculateTrend(data: any[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const sortedData = data.sort((a, b) => new Date(a.created_at || a.for_date).getTime() - new Date(b.created_at || b.for_date).getTime());
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf.map(d => d.qty));
    const secondAvg = this.calculateAverage(secondHalf.map(d => d.qty));
    
    if (firstAvg === 0) return 'stable';
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * Get week start date (Monday)
   */
  private static getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  /**
   * Create empty metric when no data is available
   */
  private static createEmptyMetric(metric: any) {
    return {
      metric,
      weeklyData: [],
      monthlyAverage: 0,
      trend: 'stable' as const
    };
  }

  /**
   * Analyze target achievement
   */
  static analyzeTargetAchievement(targetData: any[], processedMetrics: ProcessedMetrics) {
    return targetData.map(target => {
      const metric = Object.values(processedMetrics).find(m => 
        m.metric.key === target.goal || m.metric.activityName === target.goal
      );
      
      if (!metric) return null;
      
      const achievement = target.target > 0 ? ((metric.monthlyAverage / target.target) * 100) : 0;
      const status = achievement >= 90 ? 'excellent' : 
                    achievement >= 75 ? 'good' : 
                    achievement >= 50 ? 'fair' : 'needs_improvement';
      
      return {
        goal: target.goal,
        target: target.target,
        current: metric.monthlyAverage,
        achievement: achievement.toFixed(1),
        status: status,
        gap: target.target - metric.monthlyAverage
      };
    }).filter(Boolean);
  }

  /**
   * Calculate overall performance score
   */
  static calculateOverallPerformanceScore(processedMetrics: ProcessedMetrics, targetAnalysis: any[]): number {
    if (Object.keys(processedMetrics).length === 0) return 0;

    // Calculate score based on trends and target achievement
    let score = 0;
    let totalWeight = 0;

    // Weight for trends (40%)
    Object.values(processedMetrics).forEach(metric => {
      const trendScore = metric.trend === 'up' ? 100 : metric.trend === 'stable' ? 70 : 40;
      score += trendScore * 0.4;
      totalWeight += 0.4;
    });

    // Weight for target achievement (60%)
    targetAnalysis.forEach(target => {
      const achievementScore = Math.min(parseFloat(target.achievement), 100);
      score += achievementScore * 0.6;
      totalWeight += 0.6;
    });

    return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
  }
}
