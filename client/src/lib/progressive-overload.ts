import { supabase } from './supabase';

// Progressive Overload System based on ACSM/NSCA guidelines
export class ProgressiveOverloadSystem {
  
  // Industry best practice progression metrics (ACSM/NSCA guidelines)
  private static readonly PROGRESSION_METRICS = {
    sets: {
      progression: 0.5, // Add 0.5 sets every 2 weeks
      max: 5, // Cap at 5 sets
      reset: 2 // Reset to 2 sets if performance drops
    },
    reps: {
      progression: 2, // Add 2 reps to range every 2 weeks
      max: 20, // Cap at 20 reps
      reset: 8 // Reset to 8 reps if performance drops
    },
    weight: {
      progression: 5, // Add 5% weight every 2 weeks
      max: 85, // Cap at 85% 1RM
      reset: 60 // Reset to 60% if performance drops
    }
  };

  // Progression rates by goal
  private static readonly GOAL_PROGRESSION_RATES = {
    'strength': {
      sets: { progression: 0.5, max: 5, reset: 2 },
      reps: { progression: 1, max: 6, reset: 4 },
      weight: { progression: 5, max: 85, reset: 60 }
    },
    'hypertrophy': {
      sets: { progression: 0.25, max: 4, reset: 2 },
      reps: { progression: 2, max: 12, reset: 8 },
      weight: { progression: 2.5, max: 80, reset: 65 }
    },
    'endurance': {
      sets: { progression: 0.25, max: 3, reset: 2 },
      reps: { progression: 2, max: 20, reset: 12 },
      weight: { progression: 1, max: 70, reset: 50 }
    },
    'fat_loss': {
      sets: { progression: 0.25, max: 3, reset: 2 },
      reps: { progression: 1, max: 20, reset: 15 },
      weight: { progression: 1, max: 70, reset: 50 }
    }
  };

  /**
   * Analyze previous workout data for progression calculation
   */
  static async analyzePreviousWorkouts(clientId: number, currentWeek: number): Promise<{
    success: boolean;
    previousLoading?: {
      weeks: Array<{
        weekNumber: number;
        exercises: Array<{
          exercise_name: string;
          sets: number;
          reps: string;
          weight: string;
          performance: 'improved' | 'maintained' | 'declined';
        }>;
        averagePerformance: 'improved' | 'maintained' | 'declined';
      }>;
      overallTrend: 'improving' | 'stable' | 'declining';
    };
    progressionRecommendation?: {
      sets: number;
      reps: string;
      weight: string;
      reason: string;
      confidence: 'high' | 'medium' | 'low';
    };
    error?: string;
  }> {
    try {
      console.log('📈 === PROGRESSIVE OVERLOAD ANALYSIS START ===');
      console.log(`👤 Client ID: ${clientId}, Current Week: ${currentWeek}`);

      // Calculate date range for 2-week lookback
      const currentDate = new Date();
      const twoWeeksAgo = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      console.log('📅 Date range:', {
        from: twoWeeksAgo.toISOString().split('T')[0],
        to: currentDate.toISOString().split('T')[0]
      });

      // Fetch previous workout data from schedule_preview
      const { data: previousWorkouts, error } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('created_at', twoWeeksAgo.toISOString())
        .lte('created_at', currentDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch previous workouts: ${error.message}`);
      }

      console.log(`✅ Fetched ${previousWorkouts?.length || 0} previous workouts`);

      if (!previousWorkouts || previousWorkouts.length === 0) {
        console.log('ℹ️ No previous workout data found - this is normal for new clients');
        return {
          success: true,
          previousLoading: {
            weeks: [],
            overallTrend: 'stable'
          },
          progressionRecommendation: {
            sets: 3,
            reps: '8-12',
            weight: 'Moderate weight',
            reason: 'No previous workout data available - starting with baseline template',
            confidence: 'low'
          }
        };
      }

      // Group workouts by week
      const weeklyData = this.groupWorkoutsByWeek(previousWorkouts);
      console.log('📊 Weekly data:', weeklyData);

      // Analyze performance trends
      const performanceAnalysis = this.analyzePerformanceTrends(weeklyData);
      console.log('📈 Performance analysis:', performanceAnalysis);

      // Calculate progression recommendation
      const progressionRecommendation = this.calculateProgressionRecommendation(
        performanceAnalysis,
        currentWeek
      );

      console.log('🎯 Progression recommendation:', progressionRecommendation);

      return {
        success: true,
        previousLoading: performanceAnalysis,
        progressionRecommendation
      };

    } catch (error) {
      console.error('❌ Error in progressive overload analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Group workouts by week for analysis
   */
  private static groupWorkoutsByWeek(workouts: any[]): Array<{
    weekNumber: number;
    date: string;
    exercises: Array<{
      exercise_name: string;
      sets: number;
      reps: string;
      weight: string;
      date: string;
    }>;
  }> {
    const weeklyGroups: { [key: string]: any[] } = {};

    workouts.forEach(workout => {
      if (workout.details_json?.exercises) {
        const workoutDate = new Date(workout.created_at);
        const weekStart = this.getWeekStart(workoutDate);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyGroups[weekKey]) {
          weeklyGroups[weekKey] = [];
        }

        workout.details_json.exercises.forEach((exercise: any) => {
          weeklyGroups[weekKey].push({
            exercise_name: exercise.exercise || exercise.exercise_name || 'Unknown',
            sets: this.parseSets(exercise.sets),
            reps: exercise.reps || '10',
            weight: exercise.weight || exercise.weights || 'Moderate weight',
            date: workoutDate.toISOString().split('T')[0]
          });
        });
      }
    });

    // Convert to array and sort by date
    return Object.entries(weeklyGroups)
      .map(([weekKey, exercises]) => ({
        weekNumber: this.getWeekNumber(new Date(weekKey)),
        date: weekKey,
        exercises
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Analyze performance trends across weeks
   */
  private static analyzePerformanceTrends(weeklyData: any[]): {
    weeks: Array<{
      weekNumber: number;
      exercises: Array<{
        exercise_name: string;
        sets: number;
        reps: string;
        weight: string;
        performance: 'improved' | 'maintained' | 'declined';
      }>;
      averagePerformance: 'improved' | 'maintained' | 'declined';
    }>;
    overallTrend: 'improving' | 'stable' | 'declining';
  } {
    if (weeklyData.length < 2) {
      return {
        weeks: weeklyData.map(week => ({
          weekNumber: week.weekNumber,
          exercises: week.exercises.map((ex: any) => ({
            ...ex,
            performance: 'maintained' as const
          })),
          averagePerformance: 'maintained' as const
        })),
        overallTrend: 'stable' as const
      };
    }

    const analyzedWeeks = weeklyData.map((week, index) => {
      const exercises = week.exercises.map((exercise: any) => {
        if (index === 0) {
          return { ...exercise, performance: 'maintained' as const };
        }

        const previousWeek = weeklyData[index - 1];
        const previousExercise = previousWeek.exercises.find(
          (ex: any) => ex.exercise_name === exercise.exercise_name
        );

        if (!previousExercise) {
          return { ...exercise, performance: 'maintained' as const };
        }

        // Analyze performance based on sets, reps, and weight
        const performance = this.analyzeExercisePerformance(exercise, previousExercise);
        return { ...exercise, performance };
      });

      const averagePerformance = this.calculateAveragePerformance(exercises);

      return {
        weekNumber: week.weekNumber,
        exercises,
        averagePerformance
      };
    });

    const overallTrend = this.calculateOverallTrend(analyzedWeeks);

    return {
      weeks: analyzedWeeks,
      overallTrend
    };
  }

  /**
   * Analyze individual exercise performance
   */
  private static analyzeExercisePerformance(
    current: any,
    previous: any
  ): 'improved' | 'maintained' | 'declined' {
    let improvementScore = 0;

    // Analyze sets progression
    const setsDiff = current.sets - previous.sets;
    if (setsDiff > 0) improvementScore += 1;
    else if (setsDiff < 0) improvementScore -= 1;

    // Analyze reps progression
    const currentReps = this.parseReps(current.reps);
    const previousReps = this.parseReps(previous.reps);
    const repsDiff = currentReps - previousReps;
    if (repsDiff > 0) improvementScore += 1;
    else if (repsDiff < 0) improvementScore -= 1;

    // Analyze weight progression (simplified)
    const weightImproved = this.analyzeWeightProgression(current.weight, previous.weight);
    if (weightImproved === 'improved') improvementScore += 1;
    else if (weightImproved === 'declined') improvementScore -= 1;

    // Determine overall performance
    if (improvementScore > 0) return 'improved';
    if (improvementScore < 0) return 'declined';
    return 'maintained';
  }

  /**
   * Analyze weight progression
   */
  private static analyzeWeightProgression(
    currentWeight: string,
    previousWeight: string
  ): 'improved' | 'maintained' | 'declined' {
    // Simple weight analysis - in a real system, you'd have actual weight values
    const weightKeywords = {
      improved: ['heavy', 'increased', 'progressive', 'advanced'],
      declined: ['light', 'decreased', 'reduced', 'easy']
    };

    const currentLower = currentWeight.toLowerCase();
    const previousLower = previousWeight.toLowerCase();

    // Check for improvement keywords
    if (weightKeywords.improved.some(keyword => currentLower.includes(keyword)) &&
        !weightKeywords.improved.some(keyword => previousLower.includes(keyword))) {
      return 'improved';
    }

    // Check for decline keywords
    if (weightKeywords.declined.some(keyword => currentLower.includes(keyword)) &&
        !weightKeywords.declined.some(keyword => previousLower.includes(keyword))) {
      return 'declined';
    }

    return 'maintained';
  }

  /**
   * Calculate average performance for a week
   */
  private static calculateAveragePerformance(
    exercises: Array<{ performance: 'improved' | 'maintained' | 'declined' }>
  ): 'improved' | 'maintained' | 'declined' {
    const performanceCounts = {
      improved: 0,
      maintained: 0,
      declined: 0
    };

    exercises.forEach(ex => {
      performanceCounts[ex.performance]++;
    });

    const total = exercises.length;
    const improvedRatio = performanceCounts.improved / total;
    const declinedRatio = performanceCounts.declined / total;

    if (improvedRatio > 0.5) return 'improved';
    if (declinedRatio > 0.5) return 'declined';
    return 'maintained';
  }

  /**
   * Calculate overall trend
   */
  private static calculateOverallTrend(
    weeks: Array<{ averagePerformance: 'improved' | 'maintained' | 'declined' }>
  ): 'improving' | 'stable' | 'declining' {
    const performanceCounts = {
      improved: 0,
      maintained: 0,
      declined: 0
    };

    weeks.forEach(week => {
      performanceCounts[week.averagePerformance]++;
    });

    const total = weeks.length;
    const improvingRatio = performanceCounts.improved / total;
    const decliningRatio = performanceCounts.declined / total;

    if (improvingRatio > 0.5) return 'improving';
    if (decliningRatio > 0.5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate progression recommendation based on performance analysis
   */
  private static calculateProgressionRecommendation(
    performanceAnalysis: any,
    currentWeek: number
  ): {
    sets: number;
    reps: string;
    weight: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  } {
    const { overallTrend, weeks } = performanceAnalysis;
    const lastWeek = weeks[weeks.length - 1];
    const baselineSets = 3;
    const baselineReps = '8-10';

    let sets = baselineSets;
    let reps = baselineReps;
    let weight = 'Moderate weight';
    let reason = '';
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    // Determine progression based on overall trend
    if (overallTrend === 'improving') {
      // Apply progressive overload
      sets = Math.min(baselineSets + 0.5, 5);
      reps = this.increaseReps(baselineReps, 2);
      weight = 'Progressive weight';
      reason = 'Performance is improving - applying progressive overload';
      confidence = 'high';
    } else if (overallTrend === 'stable') {
      // Maintain current level with slight progression
      sets = baselineSets;
      reps = this.increaseReps(baselineReps, 1);
      weight = 'Moderate weight';
      reason = 'Performance is stable - maintaining with slight progression';
      confidence = 'medium';
    } else if (overallTrend === 'declining') {
      // Reduce intensity to prevent overtraining
      sets = Math.max(baselineSets - 0.5, 2);
      reps = baselineReps;
      weight = 'Light weight';
      reason = 'Performance is declining - reducing intensity to prevent overtraining';
      confidence = 'high';
    }

    // Adjust based on last week's performance
    if (lastWeek && lastWeek.averagePerformance === 'declined') {
      sets = Math.max(sets - 0.5, 2);
      reason += ' - Further reduction due to recent performance decline';
    }

    return {
      sets: Math.round(sets * 10) / 10, // Round to 1 decimal place
      reps,
      weight,
      reason,
      confidence
    };
  }

  /**
   * Increase reps range
   */
  private static increaseReps(reps: string, increment: number): string {
    const match = reps.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]) + increment;
      const max = parseInt(match[2]) + increment;
      return `${min}-${max}`;
    }
    return reps;
  }

  /**
   * Parse sets value
   */
  private static parseSets(sets: any): number {
    if (typeof sets === 'number') return sets;
    if (typeof sets === 'string') {
      const parsed = parseFloat(sets);
      return isNaN(parsed) ? 3 : parsed;
    }
    return 3;
  }

  /**
   * Parse reps value to get average
   */
  private static parseReps(reps: string): number {
    const match = reps.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }
    const parsed = parseInt(reps);
    return isNaN(parsed) ? 10 : parsed;
  }

  /**
   * Get week start date
   */
  private static getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  /**
   * Get week number
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Apply progression to workout template
   */
  static applyProgressionToTemplate(
    template: any,
    progressionRecommendation: any,
    goal: string
  ): any {
    const goalRates = this.GOAL_PROGRESSION_RATES[goal as keyof typeof this.GOAL_PROGRESSION_RATES] || 
                     this.GOAL_PROGRESSION_RATES.hypertrophy;

    return {
      ...template,
      sets: progressionRecommendation.sets,
      reps: progressionRecommendation.reps,
      weight: progressionRecommendation.weight,
      progression_applied: {
        sets: progressionRecommendation.sets,
        reps: progressionRecommendation.reps,
        weight: progressionRecommendation.weight,
        reason: progressionRecommendation.reason,
        confidence: progressionRecommendation.confidence,
        goal,
        applied_at: new Date().toISOString()
      }
    };
  }

  /**
   * Store progression data in enhanced details_json
   */
  static createEnhancedDetailsJson(
    exercises: any[],
    progressionData: any,
    timeBreakdown: any
  ): any {
    return {
      exercises: exercises.map(ex => ({
        ...ex,
        progression_applied: progressionData.progression_applied
      })),
      progression: {
        analysis_date: new Date().toISOString(),
        previous_loading: progressionData.previousLoading,
        recommendation: progressionData.progressionRecommendation,
        applied: progressionData.progression_applied
      },
      timeBreakdown,
      metadata: {
        generated_by: 'EnhancedWorkoutGenerator',
        version: '2.0',
        features: ['progressive_overload', 'injury_filtering', 'dynamic_timing']
      }
    };
  }
}
