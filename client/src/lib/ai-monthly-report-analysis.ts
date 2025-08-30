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
      const prompt = this.buildAnalysisPrompt(analysisContext);
      console.log('🔍 AI Prompt debugging:', {
        promptType: typeof prompt,
        promptLength: prompt?.length,
        promptPreview: prompt?.substring(0, 200) + '...'
      });

      const aiResponse = await askCerebras(
        prompt,
        undefined, // model (use default)
        {
          temperature: 0.3, // Lower temperature for more consistent analysis
          max_tokens: 2000
        }
      );

      console.log('✅ AI analysis completed successfully');
      
      // Parse the AI response text into structured insights
      const parsedInsights = this.parseAIResponse(aiResponse.response);
      console.log('🔍 Parsed AI insights:', parsedInsights);
      
      return parsedInsights;
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
      engagementScore: this.calculateEngagementScore(engagementData, activityData, mealData, workoutData),
      momentumScore: engagementData.length > 0 ? engagementData[0]?.momentum_3w || 0 : 0,
      
      // Consistency metrics
      consistencyScore: this.calculateConsistencyScore(activityData, mealData, workoutData)
    };
  }

  /**
   * Calculate adherence percentage
   */
  private static calculateAdherence(actualData: any[], scheduledData: any[]): number {
    // If no schedule data, calculate based on expected frequency
    if (scheduledData.length === 0) {
      if (actualData.length === 0) return 0;
      
      // Calculate based on 30 days and expected workout frequency
      const uniqueDays = new Set(actualData.map(w => new Date(w.created_at).toDateString())).size;
      const expectedWorkouts = 30 * 0.4; // Assume 40% of days should have workouts (3-4 times per week)
      const adherence = Math.round((uniqueDays / expectedWorkouts) * 100);
      
      console.log('🔍 Workout Adherence Calculation:', {
        actualWorkouts: actualData.length,
        uniqueWorkoutDays: uniqueDays,
        expectedWorkouts,
        calculatedAdherence: adherence
      });
      
      return adherence;
    }
    
    const completed = actualData.length;
    const scheduled = scheduledData.length;
    const adherence = Math.round((completed / scheduled) * 100);
    
    console.log('🔍 Workout Adherence Calculation (with schedule):', {
      completed,
      scheduled,
      calculatedAdherence: adherence
    });
    
    return adherence;
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
   * Calculate engagement score based on data activity
   */
  private static calculateEngagementScore(engagementData: any[], activityData: any[], mealData: any[], workoutData: any[]): number {
    // If we have engagement data, use it
    if (engagementData.length > 0 && engagementData[0]?.engagement_score) {
      return engagementData[0].engagement_score;
    }
    
    // Calculate engagement based on data activity
    const activityDays = new Set(activityData.map(a => new Date(a.created_at).toDateString())).size;
    const mealDays = new Set(mealData.map(m => new Date(m.created_at).toDateString())).size;
    const workoutDays = new Set(workoutData.map(w => new Date(w.created_at).toDateString())).size;
    
    const totalDays = 30;
    const totalRecords = activityData.length + mealData.length + workoutData.length;
    
    // Calculate engagement based on consistency and volume
    const consistencyScore = (activityDays + mealDays + workoutDays) / (totalDays * 3);
    const volumeScore = Math.min(totalRecords / 100, 1); // Normalize to 0-1, assuming 100+ records is excellent
    
    const engagementScore = (consistencyScore * 0.6 + volumeScore * 0.4) * 100;
    
    console.log('🔍 Engagement Score Calculation:', {
      activityDays,
      mealDays,
      workoutDays,
      totalRecords,
      consistencyScore: consistencyScore * 100,
      volumeScore: volumeScore * 100,
      finalScore: Math.round(engagementScore)
    });
    
    return Math.round(engagementScore);
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
    return `You are an expert fitness coach analyzing a client's monthly performance report. Generate a comprehensive, professional fitness report following this EXACT formatting schema:

## PDF FORMATTING REQUIREMENTS

### Typography & Colors
- **Fonts**: Helvetica for all text
- **Sizes**: Title (24pt), Headings (16pt), Subheadings (12pt), Body (10pt), Captions (8pt)
- **Colors**: Primary blue (#3B82F6), Green for positive (#22C55E), Red for concerns (#EF4444)

### Content Structure & Guidelines

#### 1. EXECUTIVE SUMMARY
- **Overall Performance**: 2-3 sentences, professional and encouraging tone, max 200 characters
- **Key Achievements**: 3-5 bullet points, start with action verbs, focus on measurable accomplishments
- **Areas of Concern**: 2-4 bullet points, constructive tone, solution-oriented
- **Performance Score**: 0-100 based on adherence, consistency, and progress

#### 2. POSITIVE TRENDS
- **What's Working Well**: 3-5 items, focus on positive trends with data support
- **Strengths**: 4-6 items, detailed explanations of client capabilities and positive behaviors

#### 3. RECOMMENDATIONS
- **Areas for Improvement**: 3-5 items, specific actionable areas with clear objectives
- **Specific Actions**: 4-6 items, immediate actionable steps with exact numbers and frequencies
- **Priority Level**: high/medium/low based on impact and feasibility

#### 4. PLAN FORWARD
- **Next Month Goals**: 3-5 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
- **Action Steps**: 4-6 concrete actions with timelines
- **Expected Outcomes**: 3-4 measurable results with specific metrics

### Content Guidelines
- **Tone**: Professional, encouraging, data-driven, actionable
- **Language**: Clear, concise, action-oriented, specific numbers and metrics
- **Data Integration**: Reference specific numbers from client data, explain trends in practical terms
- **Avoid**: Vague statements, negative language, technical jargon, generic advice

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

Generate the report following this exact structure and formatting requirements.`;
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
   * Parse AI response text into structured insights
   */
  private static parseAIResponse(aiResponseText: string): MonthlyReportAIInsights {
    try {
      console.log('🔍 Parsing AI response text...');
      console.log('📝 Response preview:', aiResponseText.substring(0, 500) + '...');
      
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(aiResponseText);
        console.log('✅ Successfully parsed as JSON');
        return this.validateAndFixInsights(parsed);
      } catch (jsonError) {
        console.log('⚠️ Not valid JSON, attempting to extract structured content...');
      }
      
      // If not JSON, try to extract structured content from text
      const insights = this.extractInsightsFromText(aiResponseText);
      console.log('✅ Extracted insights from text');
      return insights;
      
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      return this.generateFallbackInsights(null, null);
    }
  }

  /**
   * Extract insights from unstructured text response
   */
  private static extractInsightsFromText(text: string): MonthlyReportAIInsights {
    // Default structure
    const insights: MonthlyReportAIInsights = {
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

    // Try to extract meaningful content from the text
    const lines = text.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Detect sections
      if (trimmedLine.toLowerCase().includes('executive summary') || trimmedLine.toLowerCase().includes('overall performance')) {
        currentSection = 'executive';
      } else if (trimmedLine.toLowerCase().includes('positive') || trimmedLine.toLowerCase().includes('strengths') || trimmedLine.toLowerCase().includes('working well')) {
        currentSection = 'positive';
      } else if (trimmedLine.toLowerCase().includes('recommendation') || trimmedLine.toLowerCase().includes('improvement')) {
        currentSection = 'recommendations';
      } else if (trimmedLine.toLowerCase().includes('plan') || trimmedLine.toLowerCase().includes('goal')) {
        currentSection = 'plan';
      }
      
      // Extract content based on section
      if (currentSection === 'executive' && trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map(s => s.trim());
        if (key.toLowerCase().includes('performance')) {
          insights.executiveSummary.overallPerformance = value || insights.executiveSummary.overallPerformance;
        }
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        const content = trimmedLine.substring(1).trim();
        if (currentSection === 'positive') {
          insights.positiveTrends.strengths.push(content);
        } else if (currentSection === 'recommendations') {
          insights.recommendations.areasForImprovement.push(content);
        } else if (currentSection === 'plan') {
          insights.planForward.nextMonthGoals.push(content);
        }
      }
    }
    
    return insights;
  }

  /**
   * Validate and fix parsed insights structure
   */
  private static validateAndFixInsights(parsed: any): MonthlyReportAIInsights {
    const defaultInsights = this.generateFallbackInsights(null, null);
    
    return {
      executiveSummary: {
        overallPerformance: parsed?.executiveSummary?.overallPerformance || defaultInsights.executiveSummary.overallPerformance,
        keyAchievements: parsed?.executiveSummary?.keyAchievements || defaultInsights.executiveSummary.keyAchievements,
        areasOfConcern: parsed?.executiveSummary?.areasOfConcern || defaultInsights.executiveSummary.areasOfConcern,
        performanceScore: parsed?.executiveSummary?.performanceScore || defaultInsights.executiveSummary.performanceScore
      },
      positiveTrends: {
        whatIsWorking: parsed?.positiveTrends?.whatIsWorking || defaultInsights.positiveTrends.whatIsWorking,
        strengths: parsed?.positiveTrends?.strengths || defaultInsights.positiveTrends.strengths,
        improvements: parsed?.positiveTrends?.improvements || defaultInsights.positiveTrends.improvements
      },
      recommendations: {
        areasForImprovement: parsed?.recommendations?.areasForImprovement || defaultInsights.recommendations.areasForImprovement,
        specificActions: parsed?.recommendations?.specificActions || defaultInsights.recommendations.specificActions,
        priorityLevel: parsed?.recommendations?.priorityLevel || defaultInsights.recommendations.priorityLevel
      },
      planForward: {
        nextMonthGoals: parsed?.planForward?.nextMonthGoals || defaultInsights.planForward.nextMonthGoals,
        actionSteps: parsed?.planForward?.actionSteps || defaultInsights.planForward.actionSteps,
        expectedOutcomes: parsed?.planForward?.expectedOutcomes || defaultInsights.planForward.expectedOutcomes
      },
      metricsAnalysis: parsed?.metricsAnalysis || defaultInsights.metricsAnalysis
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
