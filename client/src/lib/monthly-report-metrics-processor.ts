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
        // Handle special calculated metrics first
        if (metricKey === 'hipsWaistRatio') {
          processedMetrics[metricKey] = this.calculateHipsWaistRatio(rawData.activityData);
        } else if (metricKey === 'mealLogins') {
          processedMetrics[metricKey] = this.calculateMealLogins(rawData.mealData);
        } else if (metricKey === 'numExercises') {
          processedMetrics[metricKey] = this.calculateNumExercises(rawData.workoutData);
        } else if (metricKey === 'workoutAdherence') {
          processedMetrics[metricKey] = this.calculateWorkoutAdherence(rawData.workoutData, rawData.scheduleData);
        } else if (metricKey === 'waterIntake') {
          processedMetrics[metricKey] = this.processWaterIntake(rawData.activityData, metric);
        } else if (metricKey === 'wakeupLogins') {
          processedMetrics[metricKey] = this.calculateWakeupLogins(rawData.activityData);
        } else if (metricKey === 'workoutLogins') {
          processedMetrics[metricKey] = this.calculateWorkoutLogins(rawData.workoutData);
        } else {
          // Handle regular metrics
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
    const trendAnalysis = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend: trendAnalysis.trend,
      trendAnalysis
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
    const trendAnalysis = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend: trendAnalysis.trend,
      trendAnalysis
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
    const trendAnalysis = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend: trendAnalysis.trend,
      trendAnalysis
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
    const trendAnalysis = this.calculateTrend(relevantData.map(d => ({ ...d, qty: d.eng_score })));

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend: trendAnalysis.trend,
      trendAnalysis
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
    const trendAnalysis = this.calculateTrend(relevantData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend: trendAnalysis.trend,
      trendAnalysis
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
   * Calculate trend based on data progression with detailed analysis
   */
  private static calculateTrend(data: any[]): { trend: 'up' | 'down' | 'stable', firstHalfData: any[], secondHalfData: any[], firstAvg: number, secondAvg: number, change: number, dataAvailable: boolean } {
    if (data.length < 2) {
      return {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: 0,
        secondAvg: 0,
        change: 0,
        dataAvailable: false
      };
    }

    const sortedData = data.sort((a, b) => new Date(a.created_at || a.for_date).getTime() - new Date(b.created_at || b.for_date).getTime());
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));

    const firstAvg = this.calculateAverage(firstHalf.map(d => d.qty));
    const secondAvg = this.calculateAverage(secondHalf.map(d => d.qty));

    if (firstAvg === 0) {
      return {
        trend: 'stable' as const,
        firstHalfData: firstHalf,
        secondHalfData: secondHalf,
        firstAvg: 0,
        secondAvg: secondAvg,
        change: 0,
        dataAvailable: true
      };
    }

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trend: 'up' | 'down' | 'stable';
    if (change > 5) trend = 'up';
    else if (change < -5) trend = 'down';
    else trend = 'stable';

    return {
      trend: trend as 'up' | 'down' | 'stable',
      firstHalfData: firstHalf,
      secondHalfData: secondHalf,
      firstAvg,
      secondAvg,
      change,
      dataAvailable: true
    };
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
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: 0,
        secondAvg: 0,
        change: 0,
        dataAvailable: false
      }
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

  /**
   * Calculate Hip/Waist Ratio from hip and waist measurements
   */
  private static calculateHipsWaistRatio(activityData: any[]) {
    const hipData = activityData.filter(item => 
      item.activity && item.activity.toLowerCase().includes('hip')
    );
    const waistData = activityData.filter(item => 
      item.activity && item.activity.toLowerCase().includes('waist')
    );

    if (hipData.length === 0 || waistData.length === 0) {
      return this.createEmptyMetric({ key: 'hipsWaistRatio', label: 'Hips/Waist Ratio' });
    }

    const hipAvg = this.calculateAverage(hipData.map(d => d.qty));
    const waistAvg = this.calculateAverage(waistData.map(d => d.qty));

    if (waistAvg === 0) {
      return this.createEmptyMetric({ key: 'hipsWaistRatio', label: 'Hips/Waist Ratio' });
    }

    const ratio = hipAvg / waistAvg;
    const weeklyData = this.groupByWeek([{ qty: ratio, created_at: new Date().toISOString() }], 'created_at');

    return {
      metric: { key: 'hipsWaistRatio', label: 'Hips/Waist Ratio' },
      weeklyData,
      monthlyAverage: ratio,
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: ratio,
        secondAvg: ratio,
        change: 0,
        dataAvailable: true
      }
    };
  }

  /**
   * Calculate Meal Logins (count of meal records)
   */
  private static calculateMealLogins(mealData: any[]) {
    const uniqueDays = new Set(mealData.map(item => 
      new Date(item.created_at).toDateString()
    )).size;

    const weeklyData = this.groupByWeek([{ qty: uniqueDays, created_at: new Date().toISOString() }], 'created_at');

    return {
      metric: { key: 'mealLogins', label: 'Meal Logins' },
      weeklyData,
      monthlyAverage: uniqueDays,
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: uniqueDays,
        secondAvg: uniqueDays,
        change: 0,
        dataAvailable: true
      }
    };
  }

  /**
   * Calculate Number of Exercises (count of workout records)
   */
  private static calculateNumExercises(workoutData: any[]) {
    const exerciseCount = workoutData.length;

    const weeklyData = this.groupByWeek([{ qty: exerciseCount, created_at: new Date().toISOString() }], 'created_at');

    return {
      metric: { key: 'numExercises', label: 'Number of Exercises' },
      weeklyData,
      monthlyAverage: exerciseCount,
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: exerciseCount,
        secondAvg: exerciseCount,
        change: 0,
        dataAvailable: true
      }
    };
  }

  /**
   * Calculate Workout Adherence (workout days vs expected days)
   */
  private static calculateWorkoutAdherence(workoutData: any[], scheduleData: any[]) {
    const uniqueWorkoutDays = new Set(workoutData.map(item => 
      new Date(item.created_at).toDateString()
    )).size;

    // Calculate expected workout days (assuming 4 workouts per week = ~17-18 days per month)
    const expectedWorkouts = 17; // Conservative estimate for a month
    
    const adherence = expectedWorkouts > 0 ? (uniqueWorkoutDays / expectedWorkouts) * 100 : 0;

    const weeklyData = this.groupByWeek([{ qty: adherence, created_at: new Date().toISOString() }], 'created_at');

    return {
      metric: { key: 'workoutAdherence', label: 'Workout Adherence' },
      weeklyData,
      monthlyAverage: adherence,
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: adherence,
        secondAvg: adherence,
        change: 0,
        dataAvailable: true
      }
    };
  }

  /**
   * Generate detailed trend analysis for display
   */
  static generateTrendAnalysisDisplay(processedMetrics: ProcessedMetrics): Array<{
    metricKey: string;
    metricLabel: string;
    trend: string;
    firstHalfData: any[];
    secondHalfData: any[];
    firstAvg: number;
    secondAvg: number;
    change: number;
    dataAvailable: boolean;
    displayText: string;
  }> {
    return Object.entries(processedMetrics).map(([metricKey, metric]) => {
      const trendAnalysis = metric.trendAnalysis || {
        trend: 'stable',
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: 0,
        secondAvg: 0,
        change: 0,
        dataAvailable: false
      };

      let displayText = '';
      
      if (!trendAnalysis.dataAvailable) {
        displayText = 'No data available';
      } else if (trendAnalysis.firstHalfData.length === 0 || trendAnalysis.secondHalfData.length === 0) {
        displayText = 'Insufficient data for trend analysis';
      } else {
        const firstHalfValues = trendAnalysis.firstHalfData.map(d => d.qty).join(', ');
        const secondHalfValues = trendAnalysis.secondHalfData.map(d => d.qty).join(', ');
        
        displayText = `First Half: [${firstHalfValues}] (Avg: ${trendAnalysis.firstAvg.toFixed(2)}) | ` +
                     `Second Half: [${secondHalfValues}] (Avg: ${trendAnalysis.secondAvg.toFixed(2)}) | ` +
                     `Change: ${trendAnalysis.change.toFixed(1)}% | ` +
                     `Trend: ${trendAnalysis.trend.toUpperCase()}`;
      }

      return {
        metricKey,
        metricLabel: metric.metric.label,
        trend: trendAnalysis.trend,
        firstHalfData: trendAnalysis.firstHalfData,
        secondHalfData: trendAnalysis.secondHalfData,
        firstAvg: trendAnalysis.firstAvg,
        secondAvg: trendAnalysis.secondAvg,
        change: trendAnalysis.change,
        dataAvailable: trendAnalysis.dataAvailable,
        displayText
      };
    });
  }

  /**
   * Process Water Intake with conversion from cups to liters
   */
  private static processWaterIntake(activityData: any[], metric: any) {
    const relevantData = activityData.filter(item => 
      item.activity && item.activity.toLowerCase().includes('hydration')
    );

    if (relevantData.length === 0) {
      return this.createEmptyMetric(metric);
    }

    // Convert from cups to liters (1 cup = 240mL = 0.24L)
    const convertedData = relevantData.map(item => ({
      ...item,
      qty: item.qty * 0.24 // Convert cups to liters
    }));

    const weeklyData = this.groupByWeek(convertedData, 'created_at');
    const monthlyAverage = this.calculateAverage(convertedData.map(d => d.qty));
    const trendAnalysis = this.calculateTrend(convertedData);

    return {
      metric,
      weeklyData,
      monthlyAverage,
      trend: trendAnalysis.trend,
      trendAnalysis
    };
  }

  /**
   * Calculate Wakeup Logins (count of wakeup records)
   */
  private static calculateWakeupLogins(activityData: any[]) {
    const uniqueDays = new Set(activityData.map(item => 
      new Date(item.created_at).toDateString()
    )).size;

    const weeklyData = this.groupByWeek([{ qty: uniqueDays, created_at: new Date().toISOString() }], 'created_at');

    return {
      metric: { key: 'wakeupLogins', label: 'Wakeup Logins' },
      weeklyData,
      monthlyAverage: uniqueDays,
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: uniqueDays,
        secondAvg: uniqueDays,
        change: 0,
        dataAvailable: true
      }
    };
  }

  /**
   * Calculate Workout Logins (count of unique days with workout activities)
   */
  private static calculateWorkoutLogins(workoutData: any[]) {
    if (workoutData.length === 0) {
      return this.createEmptyMetric({ key: 'workoutLogins', label: 'Workout Logins' });
    }

    // Count unique days with workout activities
    const uniqueDays = new Set(workoutData.map(item =>
      new Date(item.created_at).toDateString()
    )).size;

    const weeklyData = this.groupByWeek([{ qty: uniqueDays, created_at: new Date().toISOString() }], 'created_at');

    return {
      metric: { key: 'workoutLogins', label: 'Workout Logins' },
      weeklyData,
      monthlyAverage: uniqueDays,
      trend: 'stable' as const,
      trendAnalysis: {
        trend: 'stable' as const,
        firstHalfData: [],
        secondHalfData: [],
        firstAvg: uniqueDays,
        secondAvg: uniqueDays,
        change: 0,
        dataAvailable: true
      }
    };
  }
}
