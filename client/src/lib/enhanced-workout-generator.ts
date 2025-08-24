import { createClient } from '@supabase/supabase-js';
import { ProgressiveOverloadSystem } from './progressive-overload';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Enhanced workout generator with all new features
export class EnhancedWorkoutGenerator {
  
  // Direct mapping from client data to workout parameters
  private static readonly GOAL_MAPPING = {
    "improve_health": "endurance",
    "build_muscle": "hypertrophy", 
    "lose_weight": "fat_loss",
    "get_stronger": "strength",
    "improve_fitness": "endurance"
  };

  private static readonly EXPERIENCE_MAPPING = {
    "beginner": "Beginner",
    "intermediate": "Intermediate", 
    "advanced": "Advanced"
  };

  private static readonly EQUIPMENT_MAPPING = {
    "bodyweight": ["bodyweight"],
    "dumbbells": ["dumbbell"],
    "full_gym": ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"]
  };

  private static readonly FOCUS_MAPPING = {
    "upper_body": ["Chest", "Back", "Shoulders", "Arms"],
    "lower_body": ["Quads", "Glutes", "Hamstrings", "Calves"],
    "core": ["Core", "Lower Back", "Obliques"],
    "full_body": ["Full Body", "Core"],
    "cardio": ["Full Body", "Core"],
    "flexibility": ["Core", "Lower Back"]
  };

  // Dynamic warmup/cooldown based on session length
  private static readonly TIME_ALLOCATION = {
    warmupCooldown: (sessionMinutes: number) => {
      if (sessionMinutes <= 20) return { warmup: 3, cooldown: 2 };
      if (sessionMinutes <= 30) return { warmup: 5, cooldown: 3 };
      if (sessionMinutes <= 45) return { warmup: 8, cooldown: 5 };
      if (sessionMinutes <= 60) return { warmup: 10, cooldown: 7 };
      return { warmup: 12, cooldown: 8 }; // 60+ minutes
    }
  };

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

  // Workout templates by goal
  private static readonly WORKOUT_TEMPLATES = {
    "endurance": {
      sets: 2,
      reps: "12-15",
      rest: 45,
      exercises_per_day: 4
    },
    "hypertrophy": {
      sets: 3,
      reps: "8-12", 
      rest: 60,
      exercises_per_day: 4
    },
    "strength": {
      sets: 4,
      reps: "4-6",
      rest: 90,
      exercises_per_day: 3
    },
    "fat_loss": {
      sets: 2,
      reps: "15-20",
      rest: 30,
      exercises_per_day: 5
    }
  };

  // Injury to muscle mapping for filtering
  private static readonly INJURY_TO_MUSCLES = {
    'knee': ['quads', 'hamstrings', 'calves', 'glutes'],
    'back': ['lower back', 'core', 'glutes'],
    'shoulder': ['chest', 'back', 'shoulders', 'arms'],
    'wrist': ['chest', 'arms', 'shoulders'],
    'ankle': ['calves', 'quads', 'hamstrings', 'glutes'],
    'hip': ['glutes', 'quads', 'hamstrings', 'core'],
    'elbow': ['arms', 'chest', 'shoulders'],
    'neck': ['shoulders', 'back', 'core']
  };

  // Fallback muscle group alternatives
  private static readonly MUSCLE_ALTERNATIVES = {
    'quads': ['glutes', 'calves', 'core'],
    'back': ['chest', 'shoulders', 'arms'],
    'shoulders': ['chest', 'back', 'arms'],
    'chest': ['back', 'shoulders', 'arms'],
    'arms': ['chest', 'back', 'shoulders'],
    'glutes': ['quads', 'calves', 'core'],
    'hamstrings': ['quads', 'glutes', 'core'],
    'calves': ['quads', 'glutes', 'core']
  };

  /**
   * Generate a workout plan using enhanced features
   */
  static async generateWorkoutPlan(clientId: number, planStartDate: Date): Promise<{
    success: boolean;
    workoutPlan?: any;
    message?: string;
    progressionConfirmation?: boolean;
  }> {
    try {
      console.log('🚀 === ENHANCED WORKOUT GENERATOR START ===');
      console.log(`👤 Client ID: ${clientId}`);

      // 1. Fetch fresh client data (no caching)
      const { data: client, error } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error || !client) {
        throw new Error(`Failed to fetch client data: ${error?.message || 'Client not found'}`);
      }

      console.log('✅ Client data fetched successfully');

      // 2. Check progression status (only for existing clients)
      const progressionStatus = await this.checkProgressionStatus(clientId);
      if (progressionStatus.shouldReset && progressionStatus.reason !== "No previous workouts found") {
        return {
          success: false,
          message: `Progression reset recommended: ${progressionStatus.reason}`,
          progressionConfirmation: false
        };
      }

      // 3. Parse client preferences
      const goal = this.GOAL_MAPPING[client.cl_primary_goal?.trim() as keyof typeof this.GOAL_MAPPING] || "endurance";
      const experience = this.EXPERIENCE_MAPPING[client.training_experience?.trim() as keyof typeof this.EXPERIENCE_MAPPING] || "Beginner";
      
      // Parse session time
      const timeMatch = client.training_time_per_session?.match(/(\d+)_minutes/);
      const sessionMinutes = timeMatch ? parseInt(timeMatch[1]) : 45;
      
      // Parse workout days
      const workoutDays = this.parseWorkoutDays(client.workout_days);
      const daysPerWeek = workoutDays.length;

      // Parse equipment
      const eqUI = Array.isArray(client.available_equipment) ? client.available_equipment : [client.available_equipment];
      const availableEquipment: string[] = [];
      eqUI.forEach((item: any) => {
        const equipmentTokens = this.EQUIPMENT_MAPPING[item?.trim() as keyof typeof this.EQUIPMENT_MAPPING] || [];
        availableEquipment.push(...equipmentTokens);
      });

      // Parse focus areas
      const focus = Array.isArray(client.focus_areas) ? client.focus_areas : [client.focus_areas];
      const targetMuscles: string[] = [];
      focus.forEach((f: any) => {
        const focusMuscles = this.FOCUS_MAPPING[f?.trim() as keyof typeof this.FOCUS_MAPPING] || [];
        targetMuscles.push(...focusMuscles);
      });

      // Parse injuries and limitations
      const injuries = this.parseInjuries(client.injuries_limitations);

      console.log('📊 Parsed client data:', {
        goal,
        experience,
        sessionMinutes,
        workoutDays,
        daysPerWeek,
        availableEquipment,
        targetMuscles,
        injuries
      });

      // 4. Fetch fresh exercises from database (no caching)
      const { data: exercises, error: exerciseError } = await supabase
        .from('exercises_raw')
        .select('*');

      if (exerciseError) {
        throw new Error(`Failed to fetch exercises: ${exerciseError.message}`);
      }

      console.log(`✅ Fetched ${exercises.length} exercises from database`);

      // 5. Filter and score exercises
      const scoredExercises = this.filterAndScoreExercises(
        exercises,
        goal,
        experience,
        targetMuscles,
        availableEquipment,
        injuries
      );

      console.log(`✅ Found ${scoredExercises.length} suitable exercises`);

      // 6. Analyze previous workouts for progressive overload
      const currentWeek = Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
      const progressionAnalysis = await ProgressiveOverloadSystem.analyzePreviousWorkouts(clientId, currentWeek);
      
      // Handle cases where no previous workout data exists
      if (!progressionAnalysis.success) {
        console.warn('⚠️ Progressive overload analysis failed:', progressionAnalysis.error);
        // Continue with baseline template - this is normal for new clients
      }

      console.log('📈 Progressive overload analysis:', progressionAnalysis);

      // 7. Get workout template and apply progression
      const baseTemplate = this.WORKOUT_TEMPLATES[goal as keyof typeof this.WORKOUT_TEMPLATES];
      if (!baseTemplate) {
        throw new Error(`No template found for goal: ${goal}`);
      }

      // Apply progressive overload to template only if we have valid progression data
      const template = progressionAnalysis.success && progressionAnalysis.progressionRecommendation
        ? ProgressiveOverloadSystem.applyProgressionToTemplate(
            baseTemplate,
            progressionAnalysis.progressionRecommendation,
            goal
          )
        : {
            ...baseTemplate,
            // Add baseline progression info for new clients
            progression_applied: {
              sets: baseTemplate.sets,
              reps: baseTemplate.reps,
              weight: "Moderate weight",
              reason: "Baseline template for new client - no previous workout data available",
              confidence: "low",
              goal,
              applied_at: new Date().toISOString()
            }
          };

      console.log('📋 Workout template with progression:', template);

      // 8. Calculate dynamic time allocation
      const { warmup, cooldown } = this.TIME_ALLOCATION.warmupCooldown(sessionMinutes);
      const availableTime = sessionMinutes - warmup - cooldown;
      const exercisesPerDay = Math.min(
        template.exercises_per_day,
        Math.floor(availableTime / 6) // Assume ~6 minutes per exercise
      );

      console.log('⏰ Dynamic time calculation:', {
        sessionMinutes,
        warmup,
        cooldown,
        availableTime,
        exercisesPerDay
      });

      // 9. Generate muscle groups for each day
      const muscleGroups = this.generateMuscleGroups(goal, daysPerWeek, targetMuscles);

      // 10. Create workout plan with progression data
      const workoutPlan = this.createWorkoutPlan(
        muscleGroups,
        scoredExercises,
        template,
        workoutDays,
        planStartDate,
        sessionMinutes,
        warmup,
        cooldown,
        exercisesPerDay,
        injuries,
        progressionAnalysis
      );

      console.log('✅ Enhanced workout plan generated successfully');
      console.log(`📋 Generated ${daysPerWeek} workout days with ${exercisesPerDay} exercises per day`);

      return {
        success: true,
        workoutPlan,
        progressionConfirmation: false // Only true when we need user confirmation for reset
      };

    } catch (error) {
      console.error('❌ Error in enhanced workout generator:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check progression status and recommend reset if needed
   */
  private static async checkProgressionStatus(clientId: number): Promise<{
    shouldReset: boolean;
    reason?: string;
    recommendation?: string;
  }> {
    try {
      // Get last workout date
      const { data: lastWorkout } = await supabase
        .from('schedule_preview')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastWorkout || !lastWorkout.created_at) {
        return {
          shouldReset: false,
          reason: "No previous workouts found",
          recommendation: "Start with baseline template"
        };
      }

      const daysSinceLastWorkout = Math.floor(
        (Date.now() - new Date(lastWorkout.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastWorkout > 14) {
        return {
          shouldReset: true,
          reason: `No workouts for ${daysSinceLastWorkout} days`,
          recommendation: "Start with 80% of previous loading"
        };
      }

      return {
        shouldReset: false,
        reason: `Last workout was ${daysSinceLastWorkout} days ago`
      };

    } catch (error) {
      console.error('Error checking progression status:', error);
      return {
        shouldReset: false,
        reason: "Unable to check progression status"
      };
    }
  }

  /**
   * Parse injuries and limitations from client data
   */
  private static parseInjuries(injuriesData: any): Array<{
    injury: string;
    severity: string;
    affectedMuscles: string[];
  }> {
    if (!injuriesData) return [];

    try {
      // Handle different data formats
      if (typeof injuriesData === 'string') {
        // Simple comma-separated string
        return injuriesData.split(',').map(injury => ({
          injury: injury.trim().toLowerCase(),
          severity: 'moderate', // Default severity
          affectedMuscles: this.INJURY_TO_MUSCLES[injury.trim().toLowerCase()] || []
        }));
      }

      if (Array.isArray(injuriesData)) {
        // Array format
        return injuriesData.map(injury => ({
          injury: injury.toLowerCase(),
          severity: 'moderate',
          affectedMuscles: this.INJURY_TO_MUSCLES[injury.toLowerCase()] || []
        }));
      }

      if (typeof injuriesData === 'object' && injuriesData.active) {
        // Structured JSON format
        return injuriesData.active.map((injury: any) => ({
          injury: injury.injury.toLowerCase(),
          severity: injury.severity || 'moderate',
          affectedMuscles: injury.affectedMuscles || this.INJURY_TO_MUSCLES[injury.injury.toLowerCase()] || []
        }));
      }

      return [];
    } catch (error) {
      console.error('Error parsing injuries:', error);
      return [];
    }
  }

  /**
   * Filter and score exercises with injury consideration
   */
  private static filterAndScoreExercises(
    exercises: any[],
    goal: string,
    experience: string,
    targetMuscles: string[],
    availableEquipment: string[],
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>
  ): any[] {
    // First, filter out exercises that conflict with injuries
    const injuryFilteredExercises = this.filterForInjuries(exercises, injuries);
    
    return injuryFilteredExercises
      .map(exercise => {
        let score = 0;
        
        // Prioritize exercises with video links
        if (exercise.video_link && exercise.video_link.trim() !== '') {
          score += 100;
        }
        
        // Score based on target muscle match
        if (targetMuscles.length > 0) {
          const primaryMuscle = exercise.primary_muscle?.toLowerCase();
          const targetMuscle = exercise.target_muscle?.toLowerCase();
          
          if (targetMuscles.some(muscle => 
            primaryMuscle?.includes(muscle.toLowerCase()) || 
            targetMuscle?.includes(muscle.toLowerCase())
          )) {
            score += 50;
          }
        }
        
        // Score based on equipment availability
        const exerciseEquipment = exercise.equipment?.toLowerCase() || '';
        if (availableEquipment.some(eq => exerciseEquipment.includes(eq.toLowerCase()))) {
          score += 30;
        }
        
        // Score based on experience level
        const exerciseExperience = exercise.experience?.toLowerCase() || '';
        if (exerciseExperience.includes(experience.toLowerCase())) {
          score += 20;
        }
        
        // Score based on goal alignment
        const exerciseCategory = exercise.category?.toLowerCase() || '';
        if (goal === 'endurance' && exerciseCategory.includes('cardio')) score += 25;
        if (goal === 'strength' && exerciseCategory.includes('strength')) score += 25;
        if (goal === 'hypertrophy' && exerciseCategory.includes('strength')) score += 25;
        
        return { ...exercise, score };
      })
      .filter(exercise => exercise.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Filter exercises based on injuries
   */
  private static filterForInjuries(
    exercises: any[], 
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>
  ): any[] {
    if (injuries.length === 0) return exercises;

    const musclesToAvoid = injuries.flatMap(injury => injury.affectedMuscles);

    return exercises.filter(exercise => {
      const primaryMuscle = exercise.primary_muscle?.toLowerCase() || '';
      const targetMuscle = exercise.target_muscle?.toLowerCase() || '';
      
      // Check if exercise targets any injured muscles
      return !musclesToAvoid.some(muscle => 
        primaryMuscle.includes(muscle.toLowerCase()) || 
        targetMuscle.includes(muscle.toLowerCase())
      );
    });
  }

  /**
   * Parse workout days from client data
   */
  private static parseWorkoutDays(workoutDays: any): string[] {
    if (!workoutDays) return ['monday', 'wednesday', 'friday'];
    
    if (Array.isArray(workoutDays)) {
      return workoutDays.map(day => day.toLowerCase());
    }
    
    if (typeof workoutDays === 'string') {
      if (workoutDays.includes('{') && workoutDays.includes('}')) {
        const match = workoutDays.match(/\{([^}]+)\}/);
        if (match) {
          const days = match[1].split(',').map(day => day.trim().toLowerCase());
          const dayMapping: Record<string, string> = {
            'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday',
            'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday', 'sun': 'sunday'
          };
          return days.map(day => dayMapping[day] || day);
        }
      } else {
        return workoutDays.toLowerCase().split(',').map(day => day.trim());
      }
    }
    
    return ['monday', 'wednesday', 'friday'];
  }

  /**
   * Generate muscle groups for each day using category-based approach
   */
  private static generateMuscleGroups(goal: string, daysPerWeek: number, targetMuscles: string[]): string[][] {
    // Map target muscles to exercise categories
    const muscleToCategoryMapping: Record<string, string> = {
      'Chest': 'Upper Body',
      'Back': 'Upper Body', 
      'Shoulders': 'Upper Body',
      'Arms': 'Upper Body',
      'Core': 'Core',
      'Lower Back': 'Core',
      'Full Body': 'Full Body',
      'Quads': 'Lower Body',
      'Glutes': 'Lower Body',
      'Hamstrings': 'Lower Body',
      'Calves': 'Lower Body'
    };

    // Convert target muscles to categories
    const targetCategories = targetMuscles.length > 0 
      ? Array.from(new Set(targetMuscles.map(muscle => muscleToCategoryMapping[muscle]).filter(Boolean)))
      : {
          "endurance": ["Full Body", "Core", "Upper Body", "Lower Body"],
          "hypertrophy": ["Upper Body", "Lower Body", "Core"],
          "strength": ["Upper Body", "Lower Body", "Core"],
          "fat_loss": ["Full Body", "Core", "Upper Body", "Lower Body"]
        }[goal] || ["Full Body", "Core", "Upper Body"];

    // Always ensure we have exactly daysPerWeek category groups
    const categoryGroups: string[][] = [];
    for (let i = 0; i < daysPerWeek; i++) {
      if (i < targetCategories.length) {
        categoryGroups.push([targetCategories[i]]);
      } else {
        const categoryIndex = i % targetCategories.length;
        categoryGroups.push([targetCategories[categoryIndex]]);
      }
    }

    return categoryGroups;
  }

  /**
   * Create the actual workout plan with enhanced features
   */
  private static createWorkoutPlan(
    muscleGroups: string[][],
    scoredExercises: any[],
    template: any,
    workoutDays: string[],
    planStartDate: Date,
    sessionMinutes: number,
    warmup: number,
    cooldown: number,
    exercisesPerDay: number,
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
    progressionAnalysis?: any
  ): any {
    const days: any[] = [];
    const startDate = new Date(planStartDate);

    // Create a 7-day array
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if this is a workout day
      const isWorkoutDay = workoutDays.includes(dayName);
      
      if (isWorkoutDay) {
        // Find which workout day this is
        const workoutIndex = workoutDays.indexOf(dayName);
        const muscleGroup = muscleGroups[workoutIndex] || ["Full Body"];
        
        // Generate exercises for this day
        const exercises = this.generateExercisesForMuscleGroup(
          muscleGroup, 
          scoredExercises, 
          template, 
          exercisesPerDay,
          injuries,
          progressionAnalysis
        );
        
        // Calculate total time for this day
        const totalTime = this.calculateDayTotalTime(exercises, warmup, cooldown);
        
        days.push({
          day: workoutIndex + 1,
          date: dateStr,
          focus: muscleGroup.join(', '),
          exercises: exercises,
          totalDuration: sessionMinutes,
          timeBreakdown: totalTime
        });
      } else {
        // Rest day
        days.push({
          day: i + 1,
          date: dateStr,
          focus: 'Rest Day',
          exercises: [],
          totalDuration: 0,
          timeBreakdown: {
            warmup: 0,
            exercises: 0,
            rest: 0,
            cooldown: 0,
            total: 0
          }
        });
      }
    }

    return {
      days: days,
      workout_plan: days.flatMap(day => day.exercises),
      summary: {
        totalDays: 7,
        workoutDays: workoutDays.length,
        restDays: 7 - workoutDays.length,
        sessionDuration: sessionMinutes,
        warmup,
        cooldown
      }
    };
  }

  /**
   * Calculate total time breakdown for a workout day
   */
  private static calculateDayTotalTime(exercises: any[], warmup: number, cooldown: number): {
    warmup: number;
    exercises: number;
    rest: number;
    cooldown: number;
    total: number;
  } {
    const exerciseTime = exercises.reduce((total, ex) => total + ex.duration, 0);
    const restTime = exercises.reduce((total, ex) => {
      const restMinutes = (ex.sets - 1) * ex.rest / 60;
      return total + restMinutes;
    }, 0);

    return {
      warmup,
      exercises: exerciseTime,
      rest: Math.round(restTime),
      cooldown,
      total: warmup + exerciseTime + Math.round(restTime) + cooldown
    };
  }

    /**
   * Generate exercises for a specific muscle group with fallback strategy
   */
  private static generateExercisesForMuscleGroup(
    muscleGroup: string[],
    scoredExercises: any[],
    template: any,
    exercisesPerDay: number,
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
    progressionAnalysis?: any
  ): any[] {
    const exercises: any[] = [];
    
    // Filter exercises for this muscle group using category column
    let muscleExercises = scoredExercises.filter(exercise => {
      const exerciseCategory = exercise.category;
      
      return muscleGroup.some(muscle => {
        // Map muscle to category
        const muscleToCategoryMapping: Record<string, string> = {
          'Chest': 'Upper Body',
          'Back': 'Upper Body', 
          'Shoulders': 'Upper Body',
          'Arms': 'Upper Body',
          'Core': 'Core',
          'Lower Back': 'Core',
          'Full Body': 'Full Body',
          'Quads': 'Lower Body',
          'Glutes': 'Lower Body',
          'Hamstrings': 'Lower Body',
          'Calves': 'Lower Body'
        };
        
        const expectedCategory = muscleToCategoryMapping[muscle];
        return exerciseCategory === expectedCategory;
      });
    });

    // Fallback strategy if not enough exercises
    if (muscleExercises.length < exercisesPerDay) {
      console.log(`⚠️ Only ${muscleExercises.length} exercises found for ${muscleGroup.join(', ')}, using fallback strategy`);
      
      // Try alternative muscle groups
      const alternativeMuscles = muscleGroup.flatMap(muscle => 
        this.MUSCLE_ALTERNATIVES[muscle] || ['Core', 'Full Body']
      );
      
      const alternativeExercises = scoredExercises.filter(exercise => {
        const exerciseCategory = exercise.category;
        return alternativeMuscles.some(muscle => {
          const muscleToCategoryMapping: Record<string, string> = {
            'Chest': 'Upper Body',
            'Back': 'Upper Body', 
            'Shoulders': 'Upper Body',
            'Arms': 'Upper Body',
            'Core': 'Core',
            'Lower Back': 'Core',
            'Full Body': 'Full Body',
            'Quads': 'Lower Body',
            'Glutes': 'Lower Body',
            'Hamstrings': 'Lower Body',
            'Calves': 'Lower Body'
          };
          
          const expectedCategory = muscleToCategoryMapping[muscle];
          return exerciseCategory === expectedCategory;
        });
      });
      
      muscleExercises = [...muscleExercises, ...alternativeExercises];
    }

    // If still not enough, use bodyweight exercises
    if (muscleExercises.length < exercisesPerDay) {
      console.log(`⚠️ Still only ${muscleExercises.length} exercises, adding bodyweight exercises`);
      
      const bodyweightExercises = scoredExercises.filter(exercise => 
        exercise.equipment?.toLowerCase().includes('bodyweight') ||
        exercise.equipment?.toLowerCase().includes('none')
      );
      
      muscleExercises = [...muscleExercises, ...bodyweightExercises];
    }

    // Take the top exercises for this muscle group
    const selectedExercises = muscleExercises.slice(0, exercisesPerDay);
    
    selectedExercises.forEach((exercise, index) => {
      // Calculate dynamic exercise duration
      const exerciseDuration = this.calculateExerciseDuration(exercise, template);
      
      const exerciseObj = {
        exercise_name: exercise.exercise_name || exercise.Exercise || "Exercise",
        category: exercise.category || exercise.Category || "Strength",
        body_part: exercise.primary_muscle || exercise["Primary muscle"] || muscleGroup[0],
        sets: template.sets,
        reps: template.reps,
        duration: exerciseDuration,
        weights: template.weight || "Moderate weight",
        equipment: exercise.equipment || exercise.Equipment || "Dumbbell",
        coach_tip: this.generateTrainerNotes(exercise, { 
          injuries,
          progression: progressionAnalysis?.success ? {
            progression_applied: template.progression_applied,
            previousLoading: progressionAnalysis.previousLoading,
            recommendation: progressionAnalysis.progressionRecommendation
          } : undefined
        }),
        video_link: exercise.video_link || exercise.Video || "",
        rest: template.rest,
        experience: exercise.experience || exercise.Experience || "Beginner",
        rpe_target: "RPE 7-8",
        phase: 1,
        session_id: `W1D${index + 1}`,
        timeBreakdown: {
          exerciseTime: exerciseDuration - (template.rest * (template.sets - 1) / 60),
          restTime: template.rest * (template.sets - 1) / 60,
          totalTime: exerciseDuration
        },
        // Add progression data if available
        ...(progressionAnalysis?.success && {
          progression_applied: template.progression_applied,
          performance_trend: progressionAnalysis.previousLoading?.overallTrend || 'stable',
          progression_confidence: progressionAnalysis.progressionRecommendation?.confidence || 'medium'
        })
      };
      
      exercises.push(exerciseObj);
    });

    return exercises;
  }

  /**
   * Calculate dynamic exercise duration based on complexity
   */
  private static calculateExerciseDuration(exercise: any, template: any): number {
    let baseTime = 6; // Base 6 minutes
    
    // Complexity factors
    const complexityFactors = {
      category: {
        'Full Body': 2,    // More complex, needs more time
        'Upper Body': 1,   // Moderate complexity
        'Lower Body': 1,   // Moderate complexity
        'Core': 0.5        // Simpler, less time needed
      },
      equipment: {
        'barbell': 1,      // More setup time
        'machine': 0.5,    // Moderate setup
        'bodyweight': -0.5 // Minimal setup
      }
    };
    
    // Apply factors
    baseTime += complexityFactors.category[exercise.category] || 0;
    baseTime += complexityFactors.equipment[exercise.equipment] || 0;
    
    // Template adjustments
    if (template.sets > 3) baseTime += 1;
    if (template.rest > 60) baseTime += 0.5;
    
    // Include rest time in total duration
    const restMinutes = (template.sets - 1) * template.rest / 60;
    baseTime += restMinutes;
    
    // Round to nearest minute and ensure minimum
    return Math.max(4, Math.round(baseTime));
  }

  /**
   * Generate trainer notes for each exercise
   */
  private static generateTrainerNotes(
    exercise: any, 
    context: { 
      injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>;
      progression?: any;
    }
  ): string {
    const notes = [];
    
    // Injury avoidance notes
    if (context.injuries.length > 0) {
      const avoidedInjuries = context.injuries.map(injury => injury.injury).join(', ');
      notes.push(`🚨 Selected to avoid: ${avoidedInjuries}`);
    }
    
    // Form cues for beginners
    if (exercise.experience === 'Beginner') {
      notes.push(`💡 Focus on proper form and controlled movement`);
    }
    
    // Equipment notes
    if (exercise.equipment?.toLowerCase().includes('bodyweight')) {
      notes.push(`🏃‍♂️ Bodyweight exercise - no equipment needed`);
    }
    
    // Progression notes
    if (context.progression?.progression_applied) {
      const progression = context.progression.progression_applied;
      notes.push(`📈 Progression applied: ${progression.sets} sets, ${progression.reps} reps`);
      if (progression.reason) {
        notes.push(`🎯 ${progression.reason}`);
      }
    } else {
      notes.push(`📈 Progressive loading will be applied based on performance`);
    }
    
    return notes.join(' | ');
  }
}
