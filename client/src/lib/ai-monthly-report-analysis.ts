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
          const mealTypes = Array.from(new Set(mealData.map(m => m.meal_type)));
    
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

## MONTHLY REPORT FORMATTING REQUIREMENTS

### Content Structure & Guidelines

#### 1. EXECUTIVE SUMMARY
- **Overall Performance**: 2-3 sentences, professional and encouraging tone, max 200 characters
- **Key Achievements**: 3-5 bullet points, start with action verbs, focus on measurable accomplishments
- **Areas of Concern**: 2-4 bullet points, constructive tone, solution-oriented
- **Performance Score**: 0-100 based on adherence, consistency, and progress

#### 2. WHAT'S WORKING WELL
**Training Performance**
- Training consistency and adherence
- Workout completion rates
- Exercise variety and progression

**Nutrition & Lifestyle**
- Meal tracking consistency
- Dietary adherence
- Hydration and sleep patterns

**Data & Engagement**
- App usage and logging frequency
- Goal setting and monitoring
- Communication and feedback

#### 3. STRENGTHS & POSITIVE TRENDS
**Commitment & Consistency**
- Regular training attendance
- Consistent data logging
- Goal-oriented behavior

**Progress Indicators**
- Measurable improvements
- Positive habit formation
- Recovery and adaptation

**Engagement & Communication**
- Active participation
- Responsive to feedback
- Proactive approach

#### 4. AREAS FOR IMPROVEMENT
**Training Optimization**
- Workout intensity and duration
- Exercise technique and form
- Recovery and rest periods

**Nutrition Enhancement**
- Caloric intake optimization
- Macronutrient balance
- Meal timing and frequency

**Lifestyle Factors**
- Sleep quality and duration
- Stress management
- Activity outside workouts

#### 5. RECOMMENDATIONS
**Immediate Actions (Next 2 Weeks)**
- Specific, actionable steps with exact numbers
- Frequency and duration requirements
- Measurable targets

**Short-term Goals (Next Month)**
- SMART goals with clear metrics
- Realistic timelines
- Success indicators

**Long-term Strategy (Next 3 Months)**
- Progressive improvements
- Habit formation focus
- Sustainable changes

#### 6. PLAN FORWARD
**Next Month Objectives**
- Primary focus areas
- Specific targets and metrics
- Timeline and milestones

**Action Steps**
- Daily/weekly routines
- Tracking and monitoring
- Progress checkpoints

**Expected Outcomes**
- Measurable results
- Timeline expectations
- Success indicators

### FORMATTING REQUIREMENTS
- **Bullet Points**: Use consistent bullet points (•) throughout, NO bold formatting (**) in content
- **Headings**: Clear section and subsection headings
- **Numbers**: Include specific metrics, percentages, and measurable data
- **Tone**: Professional, encouraging, data-driven, actionable
- **Language**: Clear, concise, action-oriented, specific numbers and metrics
- **Data Integration**: Reference specific numbers from client data, explain trends in practical terms
- **Avoid**: Vague statements, negative language, technical jargon, generic advice, bold formatting in content

### CONTENT GUIDELINES
- Each section should have clear subsections with descriptive headings
- Use consistent bullet point formatting (•) for all lists
- Include specific numbers, percentages, and measurable metrics
- Provide actionable insights and recommendations
- Maintain professional and encouraging tone throughout
- Focus on data-driven analysis and practical recommendations

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
${context.metricsAnalysis.map((m: any) => `- ${m.metric}: ${m.currentValue} (Target: ${m.targetValue}, Trend: ${m.trend}, Performance: ${m.performance})`).join('\n')}

ACTIVITY SUMMARY:
- Activity Records: ${context.activitySummary.records} over ${context.activitySummary.days} days
- Nutrition Records: ${context.nutritionSummary.records} over ${context.nutritionSummary.days} days
- Workout Records: ${context.workoutSummary.records} over ${context.workoutSummary.days} days

Generate the report following this exact structure and formatting requirements. Use consistent bullet points (•) and avoid bold formatting (**) in the content.`;
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
        console.log('⚠️ Not valid JSON, attempting to extract structured content from markdown...');
      }
      
      // If not JSON, try to extract structured content from markdown format
      const insights = this.extractInsightsFromMarkdown(aiResponseText);
      console.log('✅ Extracted insights from markdown');
      return insights;
      
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      return this.generateFallbackInsights(null, null);
    }
  }

  /**
   * Extract insights from markdown format response
   */
  private static extractInsightsFromMarkdown(text: string): MonthlyReportAIInsights {
    console.log('🔍 Extracting insights from markdown format...');
    
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

    // Split text into sections
    const sections = text.split(/(?=^###\s+\d+\.\s+)/m);
    
    for (const section of sections) {
      const trimmedSection = section.trim();
      if (!trimmedSection) continue;
      
      // Extract Executive Summary
      if (trimmedSection.includes('EXECUTIVE SUMMARY') || trimmedSection.includes('1. EXECUTIVE SUMMARY')) {
        const overallMatch = trimmedSection.match(/Overall Performance:\s*(.+?)(?=\n|$)/);
        if (overallMatch) {
          insights.executiveSummary.overallPerformance = overallMatch[1].trim();
        }
        
        const scoreMatch = trimmedSection.match(/Performance Score:\s*(\d+)/);
        if (scoreMatch) {
          insights.executiveSummary.performanceScore = parseInt(scoreMatch[1]);
        }
        
        // Extract Key Achievements
        const achievementsMatch = trimmedSection.match(/Key Achievements[^•]*((?:•[^•]*\n?)*)/);
        if (achievementsMatch) {
          const achievements = achievementsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.executiveSummary.keyAchievements = achievements.slice(0, 5);
        }
        
        // Extract Areas of Concern
        const concernsMatch = trimmedSection.match(/Areas of Concern[^•]*((?:•[^•]*\n?)*)/);
        if (concernsMatch) {
          const concerns = concernsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.executiveSummary.areasOfConcern = concerns.slice(0, 4);
        }
      }
      
      // Extract Performance Analysis
      if (trimmedSection.includes('PERFORMANCE ANALYSIS') || trimmedSection.includes('2. PERFORMANCE ANALYSIS')) {
        // Extract Training Performance
        const trainingMatch = trimmedSection.match(/Training Performance[^•]*((?:•[^•]*\n?)*)/);
        if (trainingMatch) {
          const training = trainingMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.positiveTrends.whatIsWorking = training.slice(0, 3);
        }
        
        // Extract Nutrition & Lifestyle
        const nutritionMatch = trimmedSection.match(/Nutrition & Lifestyle[^•]*((?:•[^•]*\n?)*)/);
        if (nutritionMatch) {
          const nutrition = nutritionMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.positiveTrends.strengths = nutrition.slice(0, 3);
        }
        
        // Extract Data & Engagement
        const engagementMatch = trimmedSection.match(/Data & Engagement[^•]*((?:•[^•]*\n?)*)/);
        if (engagementMatch) {
          const engagement = engagementMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.positiveTrends.improvements = engagement.slice(0, 2);
        }
      }
      
      // Extract Strengths & Positive Trends
      if (trimmedSection.includes('STRENGTHS & POSITIVE TRENDS') || trimmedSection.includes('3. STRENGTHS & POSITIVE TRENDS')) {
        // Extract Commitment & Consistency
        const commitmentMatch = trimmedSection.match(/Commitment & Consistency[^•]*((?:•[^•]*\n?)*)/);
        if (commitmentMatch) {
          const commitment = commitmentMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.positiveTrends.strengths = [...insights.positiveTrends.strengths, ...commitment.slice(0, 2)];
        }
        
        // Extract Progress Indicators
        const progressMatch = trimmedSection.match(/Progress Indicators[^•]*((?:•[^•]*\n?)*)/);
        if (progressMatch) {
          const progress = progressMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.positiveTrends.whatIsWorking = [...insights.positiveTrends.whatIsWorking, ...progress.slice(0, 2)];
        }
        
        // Extract Engagement & Communication
        const communicationMatch = trimmedSection.match(/Engagement & Communication[^•]*((?:•[^•]*\n?)*)/);
        if (communicationMatch) {
          const communication = communicationMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.positiveTrends.improvements = [...insights.positiveTrends.improvements, ...communication.slice(0, 2)];
        }
      }
      
      // Extract Areas for Improvement
      if (trimmedSection.includes('AREAS FOR IMPROVEMENT') || trimmedSection.includes('4. AREAS FOR IMPROVEMENT')) {
        // Extract Training Optimization
        const trainingOptMatch = trimmedSection.match(/Training Optimization[^•]*((?:•[^•]*\n?)*)/);
        if (trainingOptMatch) {
          const trainingOpt = trainingOptMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.recommendations.areasForImprovement = trainingOpt.slice(0, 3);
        }
        
        // Extract Nutrition Enhancement
        const nutritionEnhMatch = trimmedSection.match(/Nutrition Enhancement[^•]*((?:•[^•]*\n?)*)/);
        if (nutritionEnhMatch) {
          const nutritionEnh = nutritionEnhMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.recommendations.specificActions = nutritionEnh.slice(0, 3);
        }
        
        // Extract Lifestyle Factors
        const lifestyleMatch = trimmedSection.match(/Lifestyle Factors[^•]*((?:•[^•]*\n?)*)/);
        if (lifestyleMatch) {
          const lifestyle = lifestyleMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.recommendations.areasForImprovement = [...insights.recommendations.areasForImprovement, ...lifestyle.slice(0, 2)];
        }
      }
      
      // Extract Recommendations
      if (trimmedSection.includes('RECOMMENDATIONS') || trimmedSection.includes('5. RECOMMENDATIONS')) {
        // Extract Immediate Actions
        const immediateMatch = trimmedSection.match(/Immediate Actions[^•]*((?:•[^•]*\n?)*)/);
        if (immediateMatch) {
          const immediate = immediateMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.recommendations.specificActions = [...insights.recommendations.specificActions, ...immediate.slice(0, 4)];
        }
        
        // Extract Short-term Goals
        const shortTermMatch = trimmedSection.match(/Short-term Goals[^•]*((?:•[^•]*\n?)*)/);
        if (shortTermMatch) {
          const shortTerm = shortTermMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.recommendations.areasForImprovement = [...insights.recommendations.areasForImprovement, ...shortTerm.slice(0, 3)];
        }
        
        // Extract Long-term Strategy
        const longTermMatch = trimmedSection.match(/Long-term Strategy[^•]*((?:•[^•]*\n?)*)/);
        if (longTermMatch) {
          const longTerm = longTermMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.planForward.nextMonthGoals = longTerm.slice(0, 3);
        }
        
        // Extract Priority Level
        const priorityMatch = trimmedSection.match(/Priority Level:\s*(HIGH|MEDIUM|LOW)/i);
        if (priorityMatch) {
          insights.recommendations.priorityLevel = priorityMatch[1].toLowerCase() as 'high' | 'medium' | 'low';
        }
      }
      
      // Extract Plan Forward
      if (trimmedSection.includes('PLAN FORWARD') || trimmedSection.includes('6. PLAN FORWARD')) {
        // Extract Next Month Objectives
        const objectivesMatch = trimmedSection.match(/Next Month Objectives[^•]*((?:•[^•]*\n?)*)/);
        if (objectivesMatch) {
          const objectives = objectivesMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.planForward.nextMonthGoals = [...insights.planForward.nextMonthGoals, ...objectives.slice(0, 3)];
        }
        
        // Extract Action Steps
        const actionStepsMatch = trimmedSection.match(/Action Steps[^•]*((?:•[^•]*\n?)*)/);
        if (actionStepsMatch) {
          const actionSteps = actionStepsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.planForward.actionSteps = actionSteps.slice(0, 3);
        }
        
        // Extract Expected Outcomes
        const outcomesMatch = trimmedSection.match(/Expected Outcomes[^•]*((?:•[^•]*\n?)*)/);
        if (outcomesMatch) {
          const outcomes = outcomesMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace('•', '').trim())
            .filter(item => item.length > 0);
          insights.planForward.expectedOutcomes = outcomes.slice(0, 2);
        }
      }
    }
    
    console.log('🔍 Extracted insights:', insights);
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
    clientData: ClientReportData | null,
    processedMetrics: ProcessedMetrics | null
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
