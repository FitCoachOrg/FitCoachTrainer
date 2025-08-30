import { askCerebras } from './cerebras-service';
import { ClientReportData, ProcessedMetrics } from './monthly-report-data-service';

export interface MonthlyReportAIInsights {
  executiveSummary: {
    overallPerformance: string;
    keyAchievements: string[];
    areasOfConcern: string[];
    performanceScore: number;
  };
  positiveTrends: {
    whatIsWorking: string[];
    strengths: string[];
    improvements: string[];
  };
  recommendations: {
    areasForImprovement: string[];
    specificActions: string[];
    priorityLevel: 'high' | 'medium' | 'low';
  };
  planForward: {
    nextMonthGoals: string[];
    actionSteps: string[];
    expectedOutcomes: string[];
  };
  metricsAnalysis: {
    [metricKey: string]: {
      performance: 'excellent' | 'good' | 'needs_improvement' | 'poor';
      trend: 'improving' | 'declining' | 'stable';
      insights: string;
      recommendations: string;
    };
  };
}

export class MonthlyReportAIAnalysis {
  /**
   * Generate comprehensive AI insights for monthly report
   */
  static async generateMonthlyInsights(
    clientData: ClientReportData,
    processedMetrics: ProcessedMetrics,
    selectedMetrics: string[]
  ): Promise<MonthlyReportAIInsights> {
    console.log('🤖 Generating AI insights for monthly report:', {
      clientId: clientData.clientInfo?.client_id,
      month: clientData.month,
      selectedMetrics,
      dataPoints: {
        activity: clientData.activityData.length,
        meals: clientData.mealData.length,
        workouts: clientData.workoutData.length,
        engagement: clientData.engagementData.length
      }
    });

    // Prepare comprehensive data context for AI analysis
    const analysisContext = this.prepareAnalysisContext(clientData, processedMetrics, selectedMetrics);

    try {
      const aiResponse = await askCerebras({
        prompt: this.buildAnalysisPrompt(analysisContext),
        schema: this.getAnalysisSchema(),
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 2000
      });

      console.log('✅ AI analysis completed successfully');
      return aiResponse as MonthlyReportAIInsights;
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return this.generateFallbackInsights(clientData, processedMetrics);
    }
  }

  /**
   * Prepare comprehensive context for AI analysis
   */
  private static prepareAnalysisContext(
    clientData: ClientReportData,
    processedMetrics: ProcessedMetrics,
    selectedMetrics: string[]
  ) {
    const client = clientData.clientInfo;
    const month = clientData.month;

    // Calculate key performance indicators
    const kpis = this.calculateKPIs(clientData, processedMetrics);

    // Prepare metrics summary
    const metricsSummary = selectedMetrics.map(metricKey => {
      const metric = processedMetrics[metricKey];
      const target = clientData.targetData.find(t => t.metric_key === metricKey);
      
      return {
        metric: metricKey,
        currentValue: metric?.monthlyAverage || 0,
        targetValue: target?.target_value || 0,
        trend: metric?.trend || 'stable',
        performance: this.calculateMetricPerformance(metric, target)
      };
    });

    return {
      clientProfile: {
        name: client?.cl_name || 'Client',
        age: client?.cl_age,
        primaryGoal: client?.cl_primary_goal,
        targetWeight: client?.cl_target_weight,
        currentWeight: client?.cl_weight,
        activityLevel: client?.cl_activity_level,
        trainingDays: client?.training_days_per_week
      },
      month: month,
      kpis: kpis,
      metricsAnalysis: metricsSummary,
      engagementData: clientData.engagementData,
      activitySummary: this.summarizeActivityData(clientData.activityData),
      nutritionSummary: this.summarizeNutritionData(clientData.mealData),
      workoutSummary: this.summarizeWorkoutData(clientData.workoutData)
    };
  }

  /**
   * Calculate key performance indicators
   */
  static calculateKPIs(clientData: ClientReportData, processedMetrics: ProcessedMetrics) {
    const activityData = clientData.activityData;
    const mealData = clientData.mealData;
    const workoutData = clientData.workoutData;
    const engagementData = clientData.engagementData;

    return {
      // Adherence metrics
      workoutAdherence: this.calculateAdherence(workoutData, clientData.scheduleData),
      nutritionAdherence: this.calculateNutritionAdherence(mealData),
      overallAdherence: this.calculateOverallAdherence(activityData, mealData, workoutData),
      
      // Progress metrics
      weightProgress: this.calculateWeightProgress(activityData),
      fitnessProgress: this.calculateFitnessProgress(workoutData),
      
      // Engagement metrics
      engagementScore: engagementData.length > 0 ? engagementData[0]?.engagement_score || 0 : 0,
      momentumScore: engagementData.length > 0 ? engagementData[0]?.momentum_3w || 0 : 0,
      
      // Consistency metrics
      consistencyScore: this.calculateConsistencyScore(activityData, mealData, workoutData)
    };
  }

  /**
   * Calculate adherence percentage
   */
  private static calculateAdherence(actualData: any[], scheduledData: any[]): number {
    if (scheduledData.length === 0) return 0;
    
    const completed = actualData.length;
    const scheduled = scheduledData.length;
    return Math.round((completed / scheduled) * 100);
  }

  /**
   * Calculate nutrition adherence
   */
  private static calculateNutritionAdherence(mealData: any[]): number {
    if (mealData.length === 0) return 0;
    
    const daysWithMeals = new Set(mealData.map(m => new Date(m.created_at).toDateString())).size;
    const totalDays = 30; // Assuming monthly report
    return Math.round((daysWithMeals / totalDays) * 100);
  }

  /**
   * Calculate overall adherence
   */
  private static calculateOverallAdherence(activityData: any[], mealData: any[], workoutData: any[]): number {
    const activityScore = activityData.length > 0 ? 100 : 0;
    const mealScore = this.calculateNutritionAdherence(mealData);
    const workoutScore = workoutData.length > 0 ? 100 : 0;
    
    return Math.round((activityScore + mealScore + workoutScore) / 3);
  }

  /**
   * Calculate weight progress
   */
  private static calculateWeightProgress(activityData: any[]): number {
    const weightData = activityData.filter(a => a.weight).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    if (weightData.length < 2) return 0;
    
    const firstWeight = weightData[0].weight;
    const lastWeight = weightData[weightData.length - 1].weight;
    return Math.round((firstWeight - lastWeight) * 100) / 100; // Weight loss in kg
  }

  /**
   * Calculate fitness progress
   */
  private static calculateFitnessProgress(workoutData: any[]): number {
    if (workoutData.length === 0) return 0;
    
    // Calculate average workout intensity or duration
    const totalDuration = workoutData.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = totalDuration / workoutData.length;
    
    return Math.round(avgDuration);
  }

  /**
   * Calculate consistency score
   */
  private static calculateConsistencyScore(activityData: any[], mealData: any[], workoutData: any[]): number {
    const activityDays = new Set(activityData.map(a => new Date(a.created_at).toDateString())).size;
    const mealDays = new Set(mealData.map(m => new Date(m.created_at).toDateString())).size;
    const workoutDays = new Set(workoutData.map(w => new Date(w.created_at).toDateString())).size;
    
    const totalDays = 30;
    const consistency = (activityDays + mealDays + workoutDays) / (totalDays * 3);
    
    return Math.round(consistency * 100);
  }

  /**
   * Calculate metric performance
   */
  private static calculateMetricPerformance(metric: any, target: any): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
    if (!metric || !target) return 'needs_improvement';
    
    const currentValue = metric.monthlyAverage;
    const targetValue = target.target_value;
    const percentage = (currentValue / targetValue) * 100;
    
    if (percentage >= 100) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'needs_improvement';
    return 'poor';
  }

  /**
   * Summarize activity data
   */
  private static summarizeActivityData(activityData: any[]) {
    if (activityData.length === 0) return { records: 0, days: 0, metrics: [] };
    
    const days = new Set(activityData.map(a => new Date(a.created_at).toDateString())).size;
    const metrics = Object.keys(activityData[0]).filter(key => 
      ['weight', 'height', 'heart_rate', 'sleep_hours', 'stress_level'].includes(key)
    );
    
    return {
      records: activityData.length,
      days: days,
      metrics: metrics
    };
  }

  /**
   * Summarize nutrition data
   */
  private static summarizeNutritionData(mealData: any[]) {
    if (mealData.length === 0) return { records: 0, days: 0, mealTypes: [] };
    
    const days = new Set(mealData.map(m => new Date(m.created_at).toDateString())).size;
    const mealTypes = [...new Set(mealData.map(m => m.meal_type))];
    
    return {
      records: mealData.length,
      days: days,
      mealTypes: mealTypes
    };
  }

  /**
   * Summarize workout data
   */
  private static summarizeWorkoutData(workoutData: any[]) {
    if (workoutData.length === 0) return { records: 0, days: 0, totalDuration: 0 };
    
    const days = new Set(workoutData.map(w => new Date(w.created_at).toDateString())).size;
    const totalDuration = workoutData.reduce((sum, w) => sum + (w.duration || 0), 0);
    
    return {
      records: workoutData.length,
      days: days,
      totalDuration: totalDuration
    };
  }

  /**
   * Build comprehensive analysis prompt
   */
  private static buildAnalysisPrompt(context: any): string {
    return `You are an expert fitness coach analyzing a client's monthly performance report. 

CLIENT PROFILE:
- Name: ${context.clientProfile.name}
- Age: ${context.clientProfile.age}
- Primary Goal: ${context.clientProfile.primaryGoal}
- Current Weight: ${context.clientProfile.currentWeight}kg
- Target Weight: ${context.clientProfile.targetWeight}kg
- Activity Level: ${context.clientProfile.activityLevel}
- Training Days per Week: ${context.clientProfile.trainingDays}

MONTH: ${context.month}

PERFORMANCE DATA:
- Workout Adherence: ${context.kpis.workoutAdherence}%
- Nutrition Adherence: ${context.kpis.nutritionAdherence}%
- Overall Adherence: ${context.kpis.overallAdherence}%
- Weight Progress: ${context.kpis.weightProgress}kg
- Engagement Score: ${context.kpis.engagementScore}
- Consistency Score: ${context.kpis.consistencyScore}%

METRICS ANALYSIS:
${context.metricsAnalysis.map(m => `- ${m.metric}: ${m.currentValue} (Target: ${m.targetValue}, Trend: ${m.trend}, Performance: ${m.performance})`).join('\n')}

ACTIVITY SUMMARY:
- Activity Records: ${context.activitySummary.records} over ${context.activitySummary.days} days
- Nutrition Records: ${context.nutritionSummary.records} over ${context.nutritionSummary.days} days
- Workout Records: ${context.workoutSummary.records} over ${context.workoutSummary.days} days

Based on this comprehensive data, provide detailed insights in the following areas:

1. EXECUTIVE SUMMARY: Overall performance assessment with key achievements and concerns
2. POSITIVE TRENDS: What's working well and strengths to build upon
3. RECOMMENDATIONS: Specific areas for improvement with actionable steps
4. PLAN FORWARD: Next month's goals and expected outcomes
5. METRICS ANALYSIS: Individual metric performance insights

Be specific, actionable, and encouraging while maintaining professional coaching standards.`;
  }

  /**
   * Get analysis schema for structured output
   */
  private static getAnalysisSchema() {
    return {
      type: "object",
      properties: {
        executiveSummary: {
          type: "object",
          properties: {
            overallPerformance: { type: "string" },
            keyAchievements: { type: "array", items: { type: "string" } },
            areasOfConcern: { type: "array", items: { type: "string" } },
            performanceScore: { type: "number" }
          }
        },
        positiveTrends: {
          type: "object",
          properties: {
            whatIsWorking: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } }
          }
        },
        recommendations: {
          type: "object",
          properties: {
            areasForImprovement: { type: "array", items: { type: "string" } },
            specificActions: { type: "array", items: { type: "string" } },
            priorityLevel: { type: "string", enum: ["high", "medium", "low"] }
          }
        },
        planForward: {
          type: "object",
          properties: {
            nextMonthGoals: { type: "array", items: { type: "string" } },
            actionSteps: { type: "array", items: { type: "string" } },
            expectedOutcomes: { type: "array", items: { type: "string" } }
          }
        },
        metricsAnalysis: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              performance: { type: "string", enum: ["excellent", "good", "needs_improvement", "poor"] },
              trend: { type: "string", enum: ["improving", "declining", "stable"] },
              insights: { type: "string" },
              recommendations: { type: "string" }
            }
          }
        }
      }
    };
  }

  /**
   * Generate fallback insights if AI fails
   */
  private static generateFallbackInsights(
    clientData: ClientReportData,
    processedMetrics: ProcessedMetrics
  ): MonthlyReportAIInsights {
    console.log('⚠️ Using fallback insights due to AI failure');
    
    return {
      executiveSummary: {
        overallPerformance: "Analysis based on available data shows consistent engagement with room for improvement.",
        keyAchievements: ["Maintained regular activity tracking", "Consistent data collection"],
        areasOfConcern: ["Limited data available for comprehensive analysis"],
        performanceScore: 70
      },
      positiveTrends: {
        whatIsWorking: ["Regular data collection", "Consistent engagement"],
        strengths: ["Commitment to tracking", "Willingness to share data"],
        improvements: ["Data consistency", "Tracking frequency"]
      },
      recommendations: {
        areasForImprovement: ["Increase data collection frequency", "Improve tracking consistency"],
        specificActions: ["Log activities daily", "Track meals consistently", "Record workouts regularly"],
        priorityLevel: "medium"
      },
      planForward: {
        nextMonthGoals: ["Improve data collection", "Increase activity frequency"],
        actionSteps: ["Set daily reminders", "Use mobile app consistently"],
        expectedOutcomes: ["Better insights", "Improved progress tracking"]
      },
      metricsAnalysis: {}
    };
  }
}
