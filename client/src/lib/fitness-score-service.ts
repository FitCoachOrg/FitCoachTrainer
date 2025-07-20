/**
 * Fitness Score Service
 * 
 * This service handles comprehensive fitness score calculation with goal-aware scoring.
 * It aggregates data from multiple sources and calculates weighted scores based on
 * client goals and selected factors.
 */

import { supabase } from './supabase';

// Types for fitness score system
export interface FitnessScoreConfig {
  client_id: number;
  goal_category: 'fat_loss' | 'muscle_gain' | 'wellness' | 'performance';
  selected_factors: string[];
  factor_weights: Record<string, number>;
  target_values: Record<string, any>;
  is_active: boolean;
}

export interface FitnessScoreHistory {
  client_id: number;
  week_start_date: string;
  week_end_date: string;
  overall_score: number;
  factor_scores: Record<string, number>;
  raw_data: Record<string, any>;
  goal_category: string;
  calculated_at: string;
}

export interface BodyMetrics {
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  body_fat_percent?: number;
  waist_cm?: number;
  hip_cm?: number;
  waist_to_hip_ratio?: number;
  lean_mass_percent?: number;
  measurement_date: string;
}

export interface SleepRecovery {
  sleep_hours?: number;
  sleep_quality?: number;
  energy_on_wakeup?: number;
  hrv_ms?: number;
  sleep_date: string;
}

export interface HydrationActivity {
  water_intake_ml?: number;
  step_count?: number;
  exercise_adherence_percent?: number;
  mobility_score?: number;
  balance_score?: number;
  activity_date: string;
}

export interface NutritionTracking {
  total_calories?: number;
  target_calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fats_grams?: number;
  target_protein_grams?: number;
  protein_per_kg?: number;
  meals_logged?: number;
  total_meals_planned?: number;
  nutrition_date: string;
}

export interface EmotionalLifestyle {
  mood_score?: number;
  stress_level?: number;
  alcohol_drinks?: number;
  screen_time_bedtime_minutes?: number;
  caffeine_cups?: number;
  caffeine_after_2pm?: boolean;
  lifestyle_date: string;
}

export interface FitnessScoreFactor {
  factor_key: string;
  factor_name: string;
  category: string;
  description: string;
  fat_loss_weight: number;
  muscle_gain_weight: number;
  wellness_weight: number;
  performance_weight: number;
  scoring_notes: string;
  data_source: string;
  is_trackable: boolean;
}

/**
 * Fitness Score Service Class
 */
export class FitnessScoreService {
  
  /**
   * Get or create fitness score configuration for a client
   */
  static async getOrCreateConfig(clientId: number): Promise<FitnessScoreConfig | null> {
    try {
      // Try to get existing config
      const { data: existingConfig, error: fetchError } = await supabase
        .from('fitness_score_config')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching fitness score config:', fetchError);
        return null;
      }

      if (existingConfig) {
        return existingConfig;
      }

      // Get client data to determine default goal
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('cl_primary_goal, cl_sex, cl_weight, cl_height, cl_age')
        .eq('client_id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client data:', clientError);
        return null;
      }

      // Determine default goal category based on client's primary goal
      const goalCategory = this.mapGoalToCategory(clientData.cl_primary_goal);
      
      // Get default factors and weights for this goal category
      const { defaultFactors, defaultWeights, defaultTargets } = await this.getDefaultConfig(goalCategory, clientData);

      // Create new config
      const { data: newConfig, error: createError } = await supabase
        .from('fitness_score_config')
        .insert({
          client_id: clientId,
          goal_category: goalCategory,
          selected_factors: defaultFactors,
          factor_weights: defaultWeights,
          target_values: defaultTargets,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating fitness score config:', createError);
        return null;
      }

      return newConfig;
    } catch (error) {
      console.error('Error in getOrCreateConfig:', error);
      return null;
    }
  }

  /**
   * Update fitness score configuration
   */
  static async updateConfig(clientId: number, updates: Partial<FitnessScoreConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fitness_score_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (error) {
        console.error('Error updating fitness score config:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConfig:', error);
      return false;
    }
  }

  /**
   * Calculate fitness score for a specific week
   */
  static async calculateWeeklyScore(clientId: number, weekStartDate: string): Promise<FitnessScoreHistory | null> {
    try {
      // Get client configuration
      const config = await this.getOrCreateConfig(clientId);
      if (!config) {
        console.error('No fitness score configuration found for client:', clientId);
        return null;
      }

      // Calculate week end date
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekEndDate = weekEnd.toISOString().split('T')[0];

      // Aggregate data for the week
      const weekData = await this.aggregateWeekData(clientId, weekStartDate, weekEndDate);
      
      // Calculate individual factor scores
      const factorScores: Record<string, number> = {};
      const rawData: Record<string, any> = {};

      for (const factorKey of config.selected_factors) {
        const score = await this.calculateFactorScore(factorKey, weekData, config);
        factorScores[factorKey] = score.score;
        rawData[factorKey] = score.rawData;
      }

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(factorScores, config.factor_weights);

      // Check if score already exists for this week
      const { data: existingScore, error: checkError } = await supabase
        .from('fitness_score_history')
        .select('id')
        .eq('client_id', clientId)
        .eq('week_start_date', weekStartDate)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing score:', checkError);
        return null;
      }

      const scoreData = {
        client_id: clientId,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        overall_score: overallScore,
        factor_scores: factorScores,
        raw_data: rawData,
        goal_category: config.goal_category,
        calculated_at: new Date().toISOString()
      };

      if (existingScore) {
        // Update existing score
        const { data: updatedScore, error: updateError } = await supabase
          .from('fitness_score_history')
          .update(scoreData)
          .eq('id', existingScore.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating fitness score:', updateError);
          return null;
        }

        return updatedScore;
      } else {
        // Insert new score
        const { data: newScore, error: insertError } = await supabase
          .from('fitness_score_history')
          .insert(scoreData)
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting fitness score:', insertError);
          return null;
        }

        return newScore;
      }
    } catch (error) {
      console.error('Error in calculateWeeklyScore:', error);
      return null;
    }
  }

  /**
   * Get fitness score history for a client
   */
  static async getScoreHistory(clientId: number, weeks: number = 12): Promise<FitnessScoreHistory[]> {
    try {
      const { data, error } = await supabase
        .from('fitness_score_history')
        .select('*')
        .eq('client_id', clientId)
        .order('week_start_date', { ascending: false })
        .limit(weeks);

      if (error) {
        console.error('Error fetching fitness score history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getScoreHistory:', error);
      return [];
    }
  }

  /**
   * Get all available fitness score factors
   */
  static async getFactors(): Promise<FitnessScoreFactor[]> {
    try {
      const { data, error } = await supabase
        .from('fitness_score_factors')
        .select('*')
        .eq('is_trackable', true)
        .order('category', { ascending: true })
        .order('factor_name', { ascending: true });

      if (error) {
        console.error('Error fetching fitness score factors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFactors:', error);
      return [];
    }
  }

  /**
   * Map client goal to fitness score category
   */
  private static mapGoalToCategory(primaryGoal: string): 'fat_loss' | 'muscle_gain' | 'wellness' | 'performance' {
    if (!primaryGoal) return 'wellness';
    
    const goal = primaryGoal.toLowerCase();
    
    if (goal.includes('loss') || goal.includes('weight') || goal.includes('fat')) {
      return 'fat_loss';
    } else if (goal.includes('muscle') || goal.includes('gain') || goal.includes('build')) {
      return 'muscle_gain';
    } else if (goal.includes('performance') || goal.includes('strength') || goal.includes('endurance')) {
      return 'performance';
    } else {
      return 'wellness';
    }
  }

  /**
   * Get default configuration for a goal category
   */
  private static async getDefaultConfig(goalCategory: string, clientData: any) {
    const factors = await this.getFactors();
    
    // Filter factors by goal category weight
    const relevantFactors = factors.filter(factor => {
      const weight = factor[`${goalCategory}_weight` as keyof FitnessScoreFactor] as number;
      return weight > 0;
    });

    const defaultFactors = relevantFactors.map(f => f.factor_key);
    const defaultWeights: Record<string, number> = {};
    const defaultTargets: Record<string, any> = {};

    // Set weights based on goal category
    relevantFactors.forEach(factor => {
      const weight = factor[`${goalCategory}_weight` as keyof FitnessScoreFactor] as number;
      defaultWeights[factor.factor_key] = weight;
      
      // Set default targets based on client data
      defaultTargets[factor.factor_key] = this.getDefaultTarget(factor.factor_key, clientData);
    });

    return { defaultFactors, defaultWeights, defaultTargets };
  }

  /**
   * Get default target for a factor based on client data
   */
  private static getDefaultTarget(factorKey: string, clientData: any): any {
    const { cl_sex, cl_weight, cl_height, cl_age } = clientData;
    
    switch (factorKey) {
      case 'bmi':
        return { min: 18.5, max: 24.9 };
      
      case 'body_fat_percent':
        return cl_sex === 'female' ? { min: 18, max: 24 } : { min: 10, max: 18 };
      
      case 'waist_to_hip_ratio':
        return cl_sex === 'female' ? { max: 0.80 } : { max: 0.90 };
      
      case 'sleep_hours':
        return { min: 7, max: 9 };
      
      case 'step_count':
        return { min: 7000, max: 10000 };
      
      case 'water_intake':
        return { ml_per_kg: 35 }; // 35ml per kg body weight
      
      case 'protein_intake':
        return { grams_per_kg: 1.6 }; // 1.6g per kg body weight
      
      default:
        return null;
    }
  }

  /**
   * Aggregate data for a specific week
   */
  private static async aggregateWeekData(clientId: number, weekStart: string, weekEnd: string) {
    const weekData: any = {};

    // Get body metrics for the week
    const { data: bodyMetrics } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('measurement_date', weekStart)
      .lte('measurement_date', weekEnd)
      .order('measurement_date', { ascending: true });

    weekData.bodyMetrics = bodyMetrics || [];

    // Get sleep recovery data for the week
    const { data: sleepRecovery } = await supabase
      .from('sleep_recovery')
      .select('*')
      .eq('client_id', clientId)
      .gte('sleep_date', weekStart)
      .lte('sleep_date', weekEnd)
      .order('sleep_date', { ascending: true });

    weekData.sleepRecovery = sleepRecovery || [];

    // Get hydration activity data for the week
    const { data: hydrationActivity } = await supabase
      .from('hydration_activity')
      .select('*')
      .eq('client_id', clientId)
      .gte('activity_date', weekStart)
      .lte('activity_date', weekEnd)
      .order('activity_date', { ascending: true });

    weekData.hydrationActivity = hydrationActivity || [];

    // Get nutrition tracking data for the week
    const { data: nutritionTracking } = await supabase
      .from('nutrition_tracking')
      .select('*')
      .eq('client_id', clientId)
      .gte('nutrition_date', weekStart)
      .lte('nutrition_date', weekEnd)
      .order('nutrition_date', { ascending: true });

    weekData.nutritionTracking = nutritionTracking || [];

    // Get emotional lifestyle data for the week
    const { data: emotionalLifestyle } = await supabase
      .from('emotional_lifestyle')
      .select('*')
      .eq('client_id', clientId)
      .gte('lifestyle_date', weekStart)
      .lte('lifestyle_date', weekEnd)
      .order('lifestyle_date', { ascending: true });

    weekData.emotionalLifestyle = emotionalLifestyle || [];

    // Get external device data for the week
    const { data: externalDevice } = await supabase
      .from('external_device_connect')
      .select('*')
      .eq('client_id', clientId)
      .gte('for_date', weekStart)
      .lte('for_date', weekEnd)
      .order('for_date', { ascending: true });

    weekData.externalDevice = externalDevice || [];

    // Get schedule data for exercise adherence
    const { data: schedule } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', clientId)
      .gte('for_date', weekStart)
      .lte('for_date', weekEnd)
      .eq('type', 'workout')
      .order('for_date', { ascending: true });

    weekData.schedule = schedule || [];

    return weekData;
  }

  /**
   * Calculate score for a specific factor
   */
  private static async calculateFactorScore(factorKey: string, weekData: any, config: FitnessScoreConfig) {
    const rawData = this.extractFactorData(factorKey, weekData);
    
    switch (factorKey) {
      case 'bmi':
        return this.calculateBMIScore(rawData, config);
      
      case 'weight_trend':
        return this.calculateWeightTrendScore(rawData, config);
      
      case 'body_fat_percent':
        return this.calculateBodyFatScore(rawData, config);
      
      case 'sleep_hours':
        return this.calculateSleepHoursScore(rawData, config);
      
      case 'sleep_quality':
        return this.calculateSleepQualityScore(rawData, config);
      
      case 'step_count':
        return this.calculateStepCountScore(rawData, config);
      
      case 'exercise_adherence':
        return this.calculateExerciseAdherenceScore(rawData, config);
      
      case 'water_intake':
        return this.calculateWaterIntakeScore(rawData, config);
      
      case 'protein_intake':
        return this.calculateProteinIntakeScore(rawData, config);
      
      case 'mood_stress':
        return this.calculateMoodStressScore(rawData, config);
      
      default:
        return { score: 0, rawData };
    }
  }

  /**
   * Extract relevant data for a specific factor
   */
  private static extractFactorData(factorKey: string, weekData: any) {
    switch (factorKey) {
      case 'bmi':
      case 'body_fat_percent':
      case 'weight_trend':
        return weekData.bodyMetrics;
      
      case 'sleep_hours':
      case 'sleep_quality':
      case 'energy_on_wakeup':
      case 'hrv':
        return weekData.sleepRecovery;
      
      case 'step_count':
        return weekData.externalDevice;
      
      case 'exercise_adherence':
        return weekData.schedule;
      
      case 'water_intake':
      case 'mobility':
      case 'balance':
        return weekData.hydrationActivity;
      
      case 'protein_intake':
      case 'calorie_intake':
      case 'logging_consistency':
        return weekData.nutritionTracking;
      
      case 'mood_stress':
      case 'alcohol_intake':
      case 'screen_time':
      case 'caffeine_usage':
        return weekData.emotionalLifestyle;
      
      default:
        return [];
    }
  }

  /**
   * Calculate weighted overall score
   */
  private static calculateWeightedScore(factorScores: Record<string, number>, weights: Record<string, number>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [factor, score] of Object.entries(factorScores)) {
      const weight = weights[factor] || 0;
      totalWeight += weight;
      weightedSum += score * weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  // Individual factor scoring methods
  private static calculateBMIScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const latestBMI = data[data.length - 1]?.bmi;
    if (!latestBMI) return { score: 0, rawData: data };
    
    const target = config.target_values.bmi || { min: 18.5, max: 24.9 };
    
    let score = 100;
    if (latestBMI < target.min || latestBMI > target.max) {
      const deviation = Math.min(
        Math.abs(latestBMI - target.min),
        Math.abs(latestBMI - target.max)
      );
      score = Math.max(0, 100 - (deviation * 10));
    }
    
    return { score, rawData: { bmi: latestBMI, target } };
  }

  private static calculateWeightTrendScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length < 2) return { score: 0, rawData: data };
    
    const sortedData = data.sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime());
    const firstWeight = sortedData[0]?.weight_kg;
    const lastWeight = sortedData[sortedData.length - 1]?.weight_kg;
    
    if (!firstWeight || !lastWeight) return { score: 0, rawData: data };
    
    const weightChange = lastWeight - firstWeight;
    const weightChangePercent = (weightChange / firstWeight) * 100;
    
    let score = 0;
    const goalCategory = config.goal_category;
    
    if (goalCategory === 'fat_loss') {
      // Target: -0.5% to -1% per week
      if (weightChangePercent >= -1 && weightChangePercent <= -0.5) {
        score = 100;
      } else {
        score = Math.max(0, 100 - Math.abs(weightChangePercent + 0.75) * 50);
      }
    } else if (goalCategory === 'muscle_gain') {
      // Target: +0.25% to +0.5% per week
      if (weightChangePercent >= 0.25 && weightChangePercent <= 0.5) {
        score = 100;
      } else {
        score = Math.max(0, 100 - Math.abs(weightChangePercent - 0.375) * 50);
      }
    } else {
      // Wellness/Performance: minimal change
      score = Math.max(0, 100 - Math.abs(weightChangePercent) * 20);
    }
    
    return { score, rawData: { weightChange, weightChangePercent, goalCategory } };
  }

  private static async calculateBodyFatScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const latestBodyFat = data[data.length - 1]?.body_fat_percent;
    if (!latestBodyFat) return { score: 0, rawData: data };
    
    // Get client sex for target range
    const { data: clientData } = await supabase
      .from('client')
      .select('cl_sex')
      .eq('client_id', config.client_id)
      .single();
    
    const target = clientData?.cl_sex === 'female' 
      ? { min: 18, max: 24 }
      : { min: 10, max: 18 };
    
    let score = 100;
    if (latestBodyFat < target.min || latestBodyFat > target.max) {
      const deviation = Math.min(
        Math.abs(latestBodyFat - target.min),
        Math.abs(latestBodyFat - target.max)
      );
      score = Math.max(0, 100 - (deviation * 5));
    }
    
    return { score, rawData: { bodyFat: latestBodyFat, target } };
  }

  private static calculateSleepHoursScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const sleepHours = data.map(d => d.sleep_hours).filter(h => h != null);
    if (sleepHours.length === 0) return { score: 0, rawData: data };
    
    const avgSleepHours = sleepHours.reduce((sum, h) => sum + h, 0) / sleepHours.length;
    const target = config.target_values.sleep_hours || { min: 7, max: 9 };
    
    let score = 100;
    if (avgSleepHours < target.min || avgSleepHours > target.max) {
      const deviation = Math.min(
        Math.abs(avgSleepHours - target.min),
        Math.abs(avgSleepHours - target.max)
      );
      score = Math.max(0, 100 - (deviation * 10));
    }
    
    return { score, rawData: { avgSleepHours, target, daysTracked: sleepHours.length } };
  }

  private static calculateSleepQualityScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const qualityScores = data.map(d => d.sleep_quality).filter(q => q != null);
    if (qualityScores.length === 0) return { score: 0, rawData: data };
    
    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    const score = Math.max(0, avgQuality * 10); // Scale 1-10 to 0-100
    
    return { score, rawData: { avgQuality, daysTracked: qualityScores.length } };
  }

  private static calculateStepCountScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const stepCounts = data.map(d => d.steps).filter(s => s != null);
    if (stepCounts.length === 0) return { score: 0, rawData: data };
    
    const avgSteps = stepCounts.reduce((sum, s) => sum + s, 0) / stepCounts.length;
    const target = config.target_values.step_count || { min: 7000, max: 10000 };
    
    const score = Math.min(100, (avgSteps / target.max) * 100);
    
    return { score, rawData: { avgSteps, target, daysTracked: stepCounts.length } };
  }

  private static calculateExerciseAdherenceScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const totalWorkouts = data.length;
    const completedWorkouts = data.filter(w => w.status === 'completed').length;
    const adherencePercent = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
    
    let score = 0;
    if (adherencePercent >= 90) {
      score = 100;
    } else if (adherencePercent >= 50) {
      score = adherencePercent;
    } else {
      score = Math.max(0, adherencePercent * 0.6);
    }
    
    return { score, rawData: { adherencePercent, totalWorkouts, completedWorkouts } };
  }

  private static async calculateWaterIntakeScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const waterIntakes = data.map(d => d.water_intake_ml).filter(w => w != null);
    if (waterIntakes.length === 0) return { score: 0, rawData: data };
    
    // Get client weight for target calculation
    const { data: clientData } = await supabase
      .from('client')
      .select('cl_weight')
      .eq('client_id', config.client_id)
      .single();
    
    const clientWeight = clientData?.cl_weight || 70;
    const targetML = clientWeight * 35; // 35ml per kg
    const avgIntake = waterIntakes.reduce((sum, w) => sum + w, 0) / waterIntakes.length;
    
    const score = Math.min(100, (avgIntake / targetML) * 100);
    
    return { score, rawData: { avgIntake, targetML, daysTracked: waterIntakes.length } };
  }

  private static async calculateProteinIntakeScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const proteinIntakes = data.map(d => d.protein_grams).filter(p => p != null);
    if (proteinIntakes.length === 0) return { score: 0, rawData: data };
    
    // Get client weight for target calculation
    const { data: clientData } = await supabase
      .from('client')
      .select('cl_weight')
      .eq('client_id', config.client_id)
      .single();
    
    const clientWeight = clientData?.cl_weight || 70;
    const targetProtein = clientWeight * 1.6; // 1.6g per kg
    const avgProtein = proteinIntakes.reduce((sum, p) => sum + p, 0) / proteinIntakes.length;
    
    let score = 0;
    if (avgProtein >= targetProtein * 0.8) {
      score = Math.min(100, (avgProtein / targetProtein) * 100);
    }
    
    return { score, rawData: { avgProtein, targetProtein, daysTracked: proteinIntakes.length } };
  }

  private static calculateMoodStressScore(data: any[], config: FitnessScoreConfig) {
    if (!data || data.length === 0) return { score: 0, rawData: data };
    
    const moodScores = data.map(d => d.mood_score).filter(m => m != null);
    const stressScores = data.map(d => d.stress_level).filter(s => s != null);
    
    if (moodScores.length === 0 && stressScores.length === 0) return { score: 0, rawData: data };
    
    let avgScore = 0;
    let totalDays = 0;
    
    if (moodScores.length > 0) {
      avgScore += moodScores.reduce((sum, m) => sum + m, 0);
      totalDays += moodScores.length;
    }
    
    if (stressScores.length > 0) {
      // Invert stress score (lower stress = higher score)
      const invertedStress = stressScores.map(s => 11 - s);
      avgScore += invertedStress.reduce((sum, s) => sum + s, 0);
      totalDays += stressScores.length;
    }
    
    const finalAvgScore = totalDays > 0 ? avgScore / totalDays : 0;
    const score = finalAvgScore * 10; // Scale 1-10 to 0-100
    
    return { score, rawData: { finalAvgScore, moodDays: moodScores.length, stressDays: stressScores.length } };
  }
}

export default FitnessScoreService; 