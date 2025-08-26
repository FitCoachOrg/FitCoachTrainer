import { supabase } from './supabase';
import { ProgressiveOverloadSystem } from './progressive-overload';

// Exercise history interface for variety tracking
interface ExerciseHistory {
  exerciseName: string;
  equipment: string;
  category: string;
  bodyPart: string;
  lastUsed: Date;
  usageCount: number;
  movementPattern?: string;
}

// Weekly exercise pool for day-to-day rotation
interface WeeklyExercisePool {
  weekNumber: number;
  clientId: string;
  availableExercises: {
    [muscleGroup: string]: {
      primary: any[];      // Main exercises for this muscle group
      secondary: any[];    // Alternative exercises
      accessory: any[];    // Isolation exercises
    };
  };
  usedExercises: {
    [dayNumber: number]: {
      exercises: string[];
      muscleGroups: string[];
      movementPatterns: string[];
      equipmentUsed: string[];
    };
  };
}

// Enhanced workout generator with all new features
export class EnhancedWorkoutGenerator {
  
  // Direct mapping from client data to workout parameters
  private static readonly GOAL_MAPPING = {
    "improve_health": "endurance",
    "build_muscle": "hypertrophy", 
    "lose_weight": "fat_loss",
    "get_stronger": "strength",
    "improve_fitness": "endurance",
    // Adding completely missing goals
    "tone_and_sculpt": "hypertrophy", // (lighter volume)
    "build_endurance": "endurance",
    "sport_performance": "power",
    "core_abs_focus": "core_stability",
    "functional_movement": "endurance" // or hybrid approach
  };

  // Client experience mapping (UI → System)
  private static readonly EXPERIENCE_MAPPING = {
    "beginner": "Beginner",
    "intermediate": "Intermediate", 
    "advanced": "Advanced"
  };

  // Database experience level mapping (8 levels → 3 levels)
  private static readonly DB_EXPERIENCE_MAPPING = {
    "Novice": "Beginner",
    "Beginner": "Beginner", 
    "Intermediate": "Intermediate",
    "Advanced": "Advanced",
    "Expert": "Advanced",
    "Master": "Advanced",
    "Grand Master": "Advanced",
    "Legendary": "Advanced"
  };

  // Movement pattern classification for exercise variety
  private static readonly MOVEMENT_PATTERNS = {
    'Horizontal Push': {
      keywords: ['push-up', 'bench press', 'dips', 'chest press', 'incline press'],
      exercises: ['Push-ups', 'Bench Press', 'Dips', 'Chest Press', 'Incline Press']
    },
    'Vertical Push': {
      keywords: ['overhead press', 'shoulder press', 'pike push-up', 'handstand'],
      exercises: ['Overhead Press', 'Shoulder Press', 'Pike Push-ups', 'Handstand Push-ups']
    },
    'Horizontal Pull': {
      keywords: ['row', 'face pull', 'band pull', 'cable row'],
      exercises: ['Barbell Rows', 'Dumbbell Rows', 'Face Pulls', 'Cable Rows']
    },
    'Vertical Pull': {
      keywords: ['pull-up', 'chin-up', 'lat pulldown', 'assisted pull'],
      exercises: ['Pull-ups', 'Chin-ups', 'Lat Pulldowns', 'Assisted Pull-ups']
    },
    'Squat': {
      keywords: ['squat', 'lunge', 'step-up', 'goblet squat'],
      exercises: ['Back Squat', 'Front Squat', 'Goblet Squat', 'Lunges', 'Step-ups']
    },
    'Hinge': {
      keywords: ['deadlift', 'romanian', 'swing', 'good morning'],
      exercises: ['Deadlift', 'Romanian Deadlift', 'Kettlebell Swing', 'Good Mornings']
    },
    'Anti-Rotation': {
      keywords: ['pallof', 'woodchop', 'russian twist', 'anti-rotation'],
      exercises: ['Pallof Press', 'Woodchops', 'Russian Twists', 'Anti-Rotation Press']
    },
    'Anti-Extension': {
      keywords: ['plank', 'dead bug', 'ab wheel', 'rollout'],
      exercises: ['Plank', 'Dead Bug', 'Ab Wheel Rollout', 'Cable Rollout']
    },
    'Anti-Lateral Flexion': {
      keywords: ['side plank', 'farmer carry', 'suitcase carry'],
      exercises: ['Side Plank', 'Farmer Carries', 'Suitcase Carries']
    }
  };

  // Equipment categories for rotation
  private static readonly EQUIPMENT_CATEGORIES = {
    'Barbell': ['barbell', 'bench'],
    'Dumbbell': ['dumbbell', 'dumbbells'],
    'Bodyweight': ['bodyweight', 'none'],
    'Kettlebell': ['kettlebell'],
    'Cable': ['cable', 'machine'],
    'Resistance Bands': ['bands', 'resistance bands'],
    'Cardio': ['cardio_machine', 'bike', 'rower', 'treadmill']
  };

  private static readonly EQUIPMENT_MAPPING = {
    "bodyweight": ["bodyweight"],
    "dumbbells": ["dumbbell"],
    "barbell": ["barbell", "bench"], // Includes bench as accessory for barbell moves
    "resistance_bands": ["bands"],
    "kettlebells": ["kettlebell"],
    "cardio_machines": ["cardio_machine", "machine", "bike", "rower", "treadmill", "elliptical", "stair"],
    "yoga_mat": ["bodyweight", "stability ball"], // Proxy for floor/core work
    "full_gym": ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"]
  };

  private static readonly FOCUS_MAPPING = {
    "upper_body": ["Chest", "Back", "Shoulders", "Arms"],
    "lower_body": ["Quads", "Glutes", "Hamstrings", "Calves"],
    "core": ["Core", "Lower Back", "Obliques"],
    "full_body": ["Full Body", "Core"],
    "cardio": ["Cardio", "Full Body"], // Updated to include Cardio as primary focus
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
      sets: 3, // Updated: 2-4 range from your table, using 3 as middle value
      reps: "15-25", // Updated: from 12-15 to 15-25 per your table
      rest: 40, // Updated: from 45s to 40s per your table
      exercises_per_day: 4
    },
    "hypertrophy": {
      sets: 4, // Updated: 3-4 range from your table, using 4 as higher value
      reps: "8-12", // Already matches your table
      rest: 75, // Updated: from 60s to 75s per your table
      exercises_per_day: 4
    },
    "strength": {
      sets: 4, // Updated: 3-5 range from your table, using 4 as middle value
      reps: "3-6", // Updated: from 4-6 to 3-6 per your table
      rest: 150, // Updated: from 90s to 150s per your table
      exercises_per_day: 3
    },
    "fat_loss": {
      sets: 3, // Updated: 2-4 range from your table, using 3 as middle value
      reps: "10-15", // Updated: from 15-20 to 10-15 per your table
      rest: 45, // Updated: from 30s to 45s per your table
      exercises_per_day: 5
    },
    // Adding missing templates based on industry standards
    "power": {
      sets: 4, // 3-5 range from your table
      reps: "1-3",
      rest: 210, // 210s from your table
      exercises_per_day: 3
    },
    "core_stability": {
      sets: 3, // 2-4 range from your table
      reps: "8-15",
      rest: 60,
      exercises_per_day: 4
    }
  };

  // Injury to muscle mapping for filtering
  private static readonly INJURY_TO_MUSCLES: Record<string, string[]> = {
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
  private static readonly MUSCLE_ALTERNATIVES: Record<string, string[]> = {
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
    const startTime = Date.now();
    
    // Add timeout protection to prevent infinite hanging
    // Increased to 60 seconds to match WorkoutPlanSection component timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Enhanced workout generation timed out after 60 seconds'));
      }, 60000); // Increased to 60 seconds to match component timeout
    });

    try {
      console.log('🚀 === ENHANCED WORKOUT GENERATOR START ===');
      console.log(`👤 Client ID: ${clientId}`);
      console.log(`⏰ Timeout set to 60 seconds`);
      console.log(`⏱️ Start time: ${new Date().toISOString()}`);
      
      // Race the main generation against the timeout
      const result = await Promise.race([
        this.generateWorkoutPlanInternal(clientId, planStartDate),
        timeoutPromise
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ Enhanced workout generation completed in ${duration}ms (${(duration/1000).toFixed(1)}s)`);
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error('❌ Enhanced workout generator error:', error);
      console.error(`⏱️ Generation failed after ${duration}ms (${(duration/1000).toFixed(1)}s)`);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          errorMessage = 'Generation took too long. The AI service may be experiencing high load. Please try again in a few moments.';
        } else if (error.message.includes('Failed to fetch client data')) {
          errorMessage = 'Unable to retrieve client information. Please check your connection and try again.';
        } else if (error.message.includes('No exercises found')) {
          errorMessage = 'Unable to find suitable exercises for your profile. Please try again or contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Internal workout plan generation method
   */
  private static async generateWorkoutPlanInternal(clientId: number, planStartDate: Date): Promise<{
    success: boolean;
    workoutPlan?: any;
    message?: string;
    progressionConfirmation?: boolean;
  }> {
    try {
      const internalStartTime = Date.now();
      console.log('🚀 === ENHANCED WORKOUT GENERATOR INTERNAL START ===');
      console.log(`👤 Client ID: ${clientId}`);

      // 1. Fetch fresh client data (no caching)
      console.log('📊 Step 1: Fetching client data...');
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
      console.log('📊 Step 2: Checking progression status...');
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
      
      // Special handling for tone_and_sculpt (lighter volume hypertrophy)
      const isToneAndSculpt = client.cl_primary_goal?.trim() === "tone_and_sculpt";
      
      // Parse session time
      let sessionMinutes = 45; // Default fallback
      
      if (client.training_time_per_session) {
        // Handle various time formats
        const timeStr = client.training_time_per_session;
        
        // Format: "45_minutes"
        const minutesMatch = timeStr.match(/(\d+)_minutes/);
        if (minutesMatch) {
          sessionMinutes = parseInt(minutesMatch[1]);
        }
        // Format: "30_45" (range format)
        else if (timeStr.includes('_')) {
          const rangeMatch = timeStr.match(/(\d+)_(\d+)/);
          if (rangeMatch) {
            const min = parseInt(rangeMatch[1]);
            const max = parseInt(rangeMatch[2]);
            sessionMinutes = Math.round((min + max) / 2); // Use average
            console.log(`⏰ TIME RANGE DETECTED: ${min}-${max} minutes, using average: ${sessionMinutes} minutes`);
          }
        }
        // Format: just a number
        else if (!isNaN(parseInt(timeStr))) {
          sessionMinutes = parseInt(timeStr);
        }
      }
      
      console.log(`⏰ SESSION TIME PARSED: ${sessionMinutes} minutes (from: "${client.training_time_per_session}")`);
      
      // Parse workout days
      const workoutDays = this.parseWorkoutDays(client.workout_days);
      const daysPerWeek = workoutDays.length;
      
      // 🎯 DATA CONSISTENCY CHECK - Prioritize workout_days over training_days_per_week
      const dbDaysPerWeek = client.training_days_per_week;
      if (daysPerWeek !== dbDaysPerWeek) {
        console.log(`⚠️  DATA INCONSISTENCY DETECTED:`);
        console.log(`   📅 workout_days count: ${daysPerWeek} (${workoutDays.join(', ')})`);
        console.log(`   🏋️‍♀️ training_days_per_week: ${dbDaysPerWeek} (from database)`);
        console.log(`   ✅ USING workout_days count (${daysPerWeek}) as source of truth`);
        console.log('');
      }

      // Parse equipment
      const eqUI = Array.isArray(client.available_equipment) ? client.available_equipment : [client.available_equipment];
      const availableEquipment: string[] = [];
      eqUI.forEach((item: any) => {
        const equipmentTokens = this.EQUIPMENT_MAPPING[item?.trim() as keyof typeof this.EQUIPMENT_MAPPING] || [];
        availableEquipment.push(...equipmentTokens);
      });

      // Special handling for cardio machines - inject Conditioning/Cardio focus
      const hasCardioMachines = eqUI.some((item: any) => 
        item?.trim() === "cardio_machines" || 
        availableEquipment.some(eq => 
          ["cardio_machine", "bike", "rower", "treadmill", "elliptical", "stair"].includes(eq)
        )
      );

      // Parse focus areas
      const focus = Array.isArray(client.focus_areas) ? client.focus_areas : [client.focus_areas];
      const targetMuscles: string[] = [];
      focus.forEach((f: any) => {
        const focusMuscles = this.FOCUS_MAPPING[f?.trim() as keyof typeof this.FOCUS_MAPPING] || [];
        targetMuscles.push(...focusMuscles);
      });

      // Inject Conditioning/Cardio focus if cardio machines are available
      if (hasCardioMachines && !targetMuscles.includes("Cardio")) {
        targetMuscles.push("Cardio");
        console.log('🏃‍♂️ Injected Conditioning/Cardio focus due to cardio machines availability');
      }

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

      // 🎯 TARGET TRACKING - Log initial targets
      console.log('🎯 === TARGET TRACKING START ===');
      console.log(`🎯 TARGET DAYS: ${daysPerWeek} days per week`);
      console.log(`🎯 TARGET SESSION TIME: ${sessionMinutes} minutes per session`);
      console.log(`🎯 TARGET WORKOUT DAYS: ${workoutDays.join(', ')}`);
      console.log(`🎯 TARGET MUSCLE GROUPS: ${targetMuscles.join(', ')}`);
      console.log('🎯 === TARGET TRACKING END ===\n');

      // 4. Fetch fresh exercises from database (no caching)
      const { data: exercises, error: exerciseError } = await supabase
        .from('exercises_raw')
        .select('*');

      if (exerciseError) {
        throw new Error(`Failed to fetch exercises: ${exerciseError.message}`);
      }

      console.log(`✅ Fetched ${exercises.length} exercises from database`);

      // 5. Get exercise history for variety
      const exerciseHistory = await this.getExerciseHistory(clientId.toString(), 4);
      console.log(`📊 Found ${exerciseHistory.length} exercises in client history`);

      // 6. Filter and score exercises with variety
      const scoredExercises = this.filterAndScoreExercises(
        exercises,
        goal,
        experience,
        targetMuscles,
        availableEquipment,
        injuries,
        exerciseHistory
      );

      console.log(`✅ Found ${scoredExercises.length} suitable exercises`);
      
      // Enhanced debugging for exercise data
      console.log(`📊 === EXERCISE DATA ANALYSIS ===`);
      console.log(`📊 Total scored exercises: ${scoredExercises.length}`);
      
      // Check for null/undefined categories
      const nullCategories = scoredExercises.filter(ex => !ex.category);
      console.log(`⚠️ Exercises with null categories: ${nullCategories.length}`);
      
      // Log exercise categories for debugging
      const categories = new Set(scoredExercises.map(ex => ex.category).filter(Boolean));
      console.log(`📊 Available exercise categories: ${Array.from(categories).join(', ')}`);
      
      // Log some example exercises by category
      categories.forEach(category => {
        const categoryExercises = scoredExercises.filter(ex => ex.category === category);
        console.log(`  ${category}: ${categoryExercises.length} exercises`);
        if (categoryExercises.length > 0) {
          console.log(`    Examples: ${categoryExercises.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
        }
      });
      
      // Check primary_muscle and target_muscle fields
      const hasPrimaryMuscle = scoredExercises.filter(ex => ex.primary_muscle).length;
      const hasTargetMuscle = scoredExercises.filter(ex => ex.target_muscle).length;
      console.log(`📊 Exercises with primary_muscle: ${hasPrimaryMuscle}/${scoredExercises.length}`);
      console.log(`📊 Exercises with target_muscle: ${hasTargetMuscle}/${scoredExercises.length}`);
      
      // Show sample exercise structure
      if (scoredExercises.length > 0) {
        const sampleExercise = scoredExercises[0];
        console.log(`📝 Sample exercise structure:`);
        console.log(`  Name: ${sampleExercise.exercise_name}`);
        console.log(`  Category: ${sampleExercise.category || 'null'}`);
        console.log(`  Primary Muscle: ${sampleExercise.primary_muscle || 'null'}`);
        console.log(`  Target Muscle: ${sampleExercise.target_muscle || 'null'}`);
        console.log(`  Equipment: ${sampleExercise.equipment || 'null'}`);
      }
      console.log(`📊 === EXERCISE DATA ANALYSIS END ===`);

      // 7. Analyze previous workouts for progressive overload
      const currentWeek = Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
      const progressionAnalysis = await ProgressiveOverloadSystem.analyzePreviousWorkouts(clientId, currentWeek);
      
      // Handle cases where no previous workout data exists
      if (!progressionAnalysis.success) {
        console.warn('⚠️ Progressive overload analysis failed:', progressionAnalysis.error);
        // Continue with baseline template - this is normal for new clients
      }

      console.log('📈 Progressive overload analysis:', progressionAnalysis);

      // 8. Get workout template and apply progression
      const baseTemplate = this.WORKOUT_TEMPLATES[goal as keyof typeof this.WORKOUT_TEMPLATES];
      if (!baseTemplate) {
        throw new Error(`No template found for goal: ${goal}`);
      }

      // Special handling for tone_and_sculpt (lighter volume hypertrophy)
      let finalTemplate = { ...baseTemplate };
      if (isToneAndSculpt) {
        finalTemplate = {
          ...baseTemplate,
          sets: 2, // Lighter volume: 2-3 sets from your table
          reps: "10-15", // Lighter volume: 10-15 reps from your table
          rest: 60, // 60s rest from your table
          exercises_per_day: 4
        };
        console.log('🎨 Applied tone_and_sculpt lighter volume template:', finalTemplate);
      }

      // Apply progressive overload to template only if we have valid progression data
      const template = progressionAnalysis.success && progressionAnalysis.progressionRecommendation
        ? ProgressiveOverloadSystem.applyProgressionToTemplate(
            finalTemplate,
            progressionAnalysis.progressionRecommendation,
            goal
          )
        : {
            ...finalTemplate,
            // Add baseline progression info for new clients
            progression_applied: {
              sets: finalTemplate.sets,
              reps: finalTemplate.reps,
              weight: "Moderate weight",
              reason: "Baseline template for new client - no previous workout data available",
              confidence: "low",
              goal,
              applied_at: new Date().toISOString()
            }
          };

      console.log('📋 Workout template with progression:', template);

      // 9. Calculate dynamic time allocation
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

      // 🎯 TIME TARGET TRACKING
      console.log('🎯 === TIME TARGET BREAKDOWN ===');
      console.log(`🎯 TARGET TOTAL SESSION: ${sessionMinutes} minutes`);
      console.log(`🎯 TARGET WARMUP: ${warmup} minutes`);
      console.log(`🎯 TARGET COOLDOWN: ${cooldown} minutes`);
      console.log(`🎯 TARGET EXERCISE TIME: ${availableTime} minutes`);
      console.log(`🎯 TARGET EXERCISES PER DAY: ${exercisesPerDay}`);
      console.log(`🎯 TARGET TIME PER EXERCISE: ${Math.round(availableTime / exercisesPerDay)} minutes`);
      console.log('🎯 === TIME TARGET BREAKDOWN END ===\n');

      // 10. Generate muscle groups for each day
      const muscleGroups = this.generateMuscleGroups(goal, daysPerWeek, targetMuscles);

      // 10.5. Validate that we have enough exercises for each muscle group
      console.log(`🔍 === VALIDATING EXERCISE AVAILABILITY ===`);
      let hasEnoughExercises = true;
      muscleGroups.forEach((muscleGroup, index) => {
        const availableExercises = this.getExercisesForMuscleGroup(scoredExercises, muscleGroup);
        console.log(`  Day ${index + 1} (${muscleGroup.join(', ')}): ${availableExercises.length} exercises available`);
        if (availableExercises.length < exercisesPerDay) {
          console.log(`  ⚠️ Warning: Only ${availableExercises.length} exercises for ${muscleGroup.join(', ')}, need ${exercisesPerDay}`);
          hasEnoughExercises = false;
        }
      });
      console.log(`🔍 === VALIDATION COMPLETE ===`);

      // 11. Create weekly exercise pool for day-to-day rotation
      const weekNumber = Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weeklyPool = this.createWeeklyExercisePool(
        clientId.toString(),
        weekNumber,
        muscleGroups,
        scoredExercises,
        exerciseHistory
      );

      // 12. Create workout plan with day-to-day variety
      console.log(`\n🎯 === CREATING WORKOUT PLAN WITH DAY-TO-DAY VARIETY ===`);
      console.log(`📊 Muscle groups: ${muscleGroups.map(group => group.join(', ')).join(' | ')}`);
      console.log(`📅 Workout days: ${workoutDays.join(', ')}`);
      console.log(`⏰ Session minutes: ${sessionMinutes}`);
      console.log(`🏋️‍♀️ Exercises per day: ${exercisesPerDay}`);
      
      // 🎯 PLAN GENERATION TARGETS
      console.log('🎯 === PLAN GENERATION TARGETS ===');
      console.log(`🎯 TARGET WORKOUT DAYS: ${workoutDays.length} days`);
      console.log(`🎯 TARGET SESSION DURATION: ${sessionMinutes} minutes`);
      console.log(`🎯 TARGET EXERCISES PER DAY: ${exercisesPerDay} exercises`);
      console.log(`🎯 TARGET TOTAL EXERCISES: ${workoutDays.length * exercisesPerDay} exercises`);
      console.log('🎯 === PLAN GENERATION TARGETS END ===\n');
      
      const workoutPlan = this.createWorkoutPlanWithDayToDayVariety(
        muscleGroups,
        weeklyPool,
        template,
        workoutDays,
        planStartDate,
        sessionMinutes,
        warmup,
        cooldown,
        exercisesPerDay,
        injuries,
        progressionAnalysis,
        scoredExercises
      );

      console.log('✅ Enhanced workout plan generated successfully');
      console.log(`📋 Generated ${daysPerWeek} workout days with ${exercisesPerDay} exercises per day`);

      // 🎯 FINAL RESULTS TRACKING
      console.log('🎯 === FINAL RESULTS TRACKING ===');
      const actualWorkoutDays = workoutPlan.days.filter((day: any) => day.isWorkoutDay).length;
      const actualTotalExercises = workoutPlan.days.flatMap((day: any) => day.exercises).length;
      const actualSessionDuration = workoutPlan.days.find((day: any) => day.isWorkoutDay)?.totalDuration || 0;
      
      console.log(`🎯 TARGET vs ACTUAL COMPARISON:`);
      console.log(`   📅 Days: ${daysPerWeek} target vs ${actualWorkoutDays} actual`);
      console.log(`   ⏰ Session Time: ${sessionMinutes} min target vs ${actualSessionDuration} min actual`);
      console.log(`   🏋️‍♀️ Total Exercises: ${daysPerWeek * exercisesPerDay} target vs ${actualTotalExercises} actual`);
      
      // Check for discrepancies
      if (actualWorkoutDays !== daysPerWeek) {
        console.log(`⚠️  DISCREPANCY: Expected ${daysPerWeek} workout days, got ${actualWorkoutDays}`);
      }
      if (actualSessionDuration !== sessionMinutes) {
        console.log(`⚠️  DISCREPANCY: Expected ${sessionMinutes} min session, got ${actualSessionDuration} min`);
      }
      if (actualTotalExercises !== daysPerWeek * exercisesPerDay) {
        console.log(`⚠️  DISCREPANCY: Expected ${daysPerWeek * exercisesPerDay} exercises, got ${actualTotalExercises}`);
      }
      
      console.log('🎯 === FINAL RESULTS TRACKING END ===\n');

      const internalEndTime = Date.now();
      const internalDuration = internalEndTime - internalStartTime;
      console.log(`✅ Internal generation completed in ${internalDuration}ms (${(internalDuration/1000).toFixed(1)}s)`);

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
   * Get exercise history from schedule and schedule_preview tables for variety
   */
  private static async getExerciseHistory(
    clientId: string, 
    weeksBack: number = 4
  ): Promise<ExerciseHistory[]> {
    try {
      console.log(`📊 Fetching exercise history for client ${clientId} (last ${weeksBack} weeks)`);
      
      // Fetch from both schedule and schedule_preview tables
      const [scheduleResult, previewResult] = await Promise.all([
        supabase
          .from('schedule')
          .select('details_json, for_date')
          .eq('client_id', clientId)
          .eq('type', 'workout')
          .gte('for_date', new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('for_date', { ascending: false }),
        
        supabase
          .from('schedule_preview')
          .select('details_json, for_date')
          .eq('client_id', clientId)
          .eq('type', 'workout')
          .gte('for_date', new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('for_date', { ascending: false })
      ]);

      if (scheduleResult.error) {
        console.error('Error fetching schedule history:', scheduleResult.error);
      }
      
      if (previewResult.error) {
        console.error('Error fetching schedule_preview history:', previewResult.error);
      }

      const exerciseHistory: ExerciseHistory[] = [];
      
      // Process schedule entries
      scheduleResult.data?.forEach(entry => {
        // Check both possible data structures: main_workout (old) and exercises (new)
        const exercises = entry.details_json?.exercises || entry.details_json?.main_workout || [];
        exercises.forEach((exercise: any) => {
          // Only add exercises with valid exercise names
          if (exercise && exercise.exercise_name) {
            exerciseHistory.push({
              exerciseName: exercise.exercise_name,
              equipment: exercise.equipment_type || exercise.equipment || 'unknown',
              category: entry.details_json?.category || exercise.category || 'unknown',
              bodyPart: entry.details_json?.body_part || exercise.body_part || 'unknown',
              lastUsed: new Date(entry.for_date),
              usageCount: 1
            });
          }
        });
      });
      
      // Process schedule_preview entries
      previewResult.data?.forEach(entry => {
        // Check both possible data structures: main_workout (old) and exercises (new)
        const exercises = entry.details_json?.exercises || entry.details_json?.main_workout || [];
        exercises.forEach((exercise: any) => {
          // Only add exercises with valid exercise names
          if (exercise && exercise.exercise_name) {
            exerciseHistory.push({
              exerciseName: exercise.exercise_name,
              equipment: exercise.equipment_type || exercise.equipment || 'unknown',
              category: entry.details_json?.category || exercise.category || 'unknown',
              bodyPart: entry.details_json?.body_part || exercise.body_part || 'unknown',
              lastUsed: new Date(entry.for_date),
              usageCount: 1
            });
          }
        });
      });

      console.log(`📈 Found ${exerciseHistory.length} exercise history entries`);
      
      // Debug: Check for invalid exercise names
      const invalidEntries = exerciseHistory.filter(hist => !hist.exerciseName);
      if (invalidEntries.length > 0) {
        console.warn(`⚠️ Found ${invalidEntries.length} entries with invalid exercise names:`, invalidEntries);
      }

      // Aggregate usage counts
      const aggregatedHistory = this.aggregateExerciseHistory(exerciseHistory);
      console.log(`📊 Aggregated to ${aggregatedHistory.length} unique exercises`);
      
      // Log some recent exercises
      const recentExercises = aggregatedHistory
        .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
        .slice(0, 5);
      
      if (recentExercises.length > 0) {
        console.log(`🕒 Recently used exercises: ${recentExercises.map(ex => ex.exerciseName).join(', ')}`);
      }
      
      return aggregatedHistory;
    } catch (error) {
      console.error('Error in getExerciseHistory:', error);
      return [];
    }
  }

  /**
   * Aggregate exercise history to count usage
   */
  private static aggregateExerciseHistory(exerciseHistory: ExerciseHistory[]): ExerciseHistory[] {
    const aggregated: { [key: string]: ExerciseHistory } = {};
    
    exerciseHistory.forEach(hist => {
      // Skip entries with invalid exercise names
      if (!hist || !hist.exerciseName) {
        console.warn('Skipping exercise history entry with invalid exercise name:', hist);
        return;
      }
      
      const key = hist.exerciseName.toLowerCase();
      if (aggregated[key]) {
        aggregated[key].usageCount += hist.usageCount;
        if (hist.lastUsed > aggregated[key].lastUsed) {
          aggregated[key].lastUsed = hist.lastUsed;
        }
      } else {
        aggregated[key] = { ...hist };
      }
    });
    
    return Object.values(aggregated);
  }

  /**
   * Get movement pattern for an exercise
   */
  private static getMovementPattern(exerciseName: string): string {
    const exerciseLower = exerciseName.toLowerCase();
    
    for (const [pattern, data] of Object.entries(this.MOVEMENT_PATTERNS)) {
      if (data.keywords.some(keyword => exerciseLower.includes(keyword))) {
        return pattern;
      }
    }
    
    return 'General'; // Default for unrecognized patterns
  }

  /**
   * Get equipment category for an exercise
   */
  private static getEquipmentCategory(equipment: string): string {
    const equipmentLower = equipment.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.EQUIPMENT_CATEGORIES)) {
      if (keywords.some(keyword => equipmentLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  }

  /**
   * Categorize exercises by complexity and type
   */
  private static categorizeExercises(exercises: any[], type: 'primary' | 'secondary' | 'accessory'): any[] {
    const categorized = exercises.filter(exercise => {
      const exerciseName = exercise.exercise_name.toLowerCase();
      
      switch (type) {
        case 'primary':
          // Compound, multi-joint movements
          return exerciseName.includes('squat') || 
                 exerciseName.includes('deadlift') || 
                 exerciseName.includes('press') && !exerciseName.includes('leg press') ||
                 exerciseName.includes('row') || 
                 exerciseName.includes('pull-up') ||
                 exerciseName.includes('push-up') ||
                 exerciseName.includes('clean') ||
                 exerciseName.includes('snatch') ||
                 exerciseName.includes('thruster');
        
        case 'secondary':
          // Moderate complexity movements
          return exerciseName.includes('lunge') || 
                 exerciseName.includes('step-up') || 
                 exerciseName.includes('dumbbell') && !this.categorizeExercises([exercise], 'primary').length ||
                 exerciseName.includes('kettlebell') && !this.categorizeExercises([exercise], 'primary').length ||
                 exerciseName.includes('dip') ||
                 exerciseName.includes('chin-up') ||
                 exerciseName.includes('lat pulldown') ||
                 exerciseName.includes('leg press') ||
                 exerciseName.includes('calf raise') ||
                 exerciseName.includes('hip thrust');
        
        case 'accessory':
          // Isolation, single-joint movements
          return exerciseName.includes('curl') || 
                 exerciseName.includes('extension') || 
                 exerciseName.includes('raise') && !exerciseName.includes('calf raise') ||
                 exerciseName.includes('fly') ||
                 exerciseName.includes('crunch') ||
                 exerciseName.includes('twist') ||
                 exerciseName.includes('plank') ||
                 exerciseName.includes('side bend') ||
                 exerciseName.includes('tricep') ||
                 exerciseName.includes('bicep');
        
        default:
          return false;
      }
    });
    
    // Add exercise type metadata
    categorized.forEach(exercise => {
      exercise.exerciseType = type;
    });
    
    return categorized;
  }

  /**
   * Create weekly exercise pool for day-to-day rotation
   */
  private static createWeeklyExercisePool(
    clientId: string,
    weekNumber: number,
    muscleGroups: string[][],
    scoredExercises: any[],
    exerciseHistory: ExerciseHistory[]
  ): WeeklyExercisePool {
    console.log(`\n🏊‍♂️ === CREATING WEEKLY EXERCISE POOL ===`);
    console.log(`📅 Week Number: ${weekNumber}`);
    console.log(`👤 Client ID: ${clientId}`);
    console.log(`📊 Total scored exercises: ${scoredExercises.length}`);
    console.log(`📈 Exercise history entries: ${exerciseHistory.length}`);
    
    const pool: WeeklyExercisePool = {
      weekNumber,
      clientId,
      availableExercises: {},
      usedExercises: {}
    };

    // Group exercises by muscle group
    muscleGroups.forEach((muscleGroup, dayIndex) => {
      const groupKey = muscleGroup.join('_');
      console.log(`\n🎯 Processing muscle group ${dayIndex + 1}: ${groupKey}`);
      
      // Get exercises for this muscle group
      const groupExercises = this.getExercisesForMuscleGroup(scoredExercises, muscleGroup);
      console.log(`📦 Found ${groupExercises.length} exercises for ${groupKey}`);
      
      // Filter out recently used exercises (from previous weeks)
      const filteredExercises = this.filterRecentlyUsedExercises(groupExercises, exerciseHistory);
      console.log(`🚫 After filtering recently used: ${filteredExercises.length} exercises remaining`);
      
      // Categorize exercises by type
      const primary = this.categorizeExercises(filteredExercises, 'primary');
      const secondary = this.categorizeExercises(filteredExercises, 'secondary');
      const accessory = this.categorizeExercises(filteredExercises, 'accessory');
      
      pool.availableExercises[groupKey] = {
        primary,
        secondary,
        accessory
      };
      
      console.log(`📊 Categorized exercises for ${groupKey}:`);
      console.log(`  Primary: ${primary.length} exercises`);
      console.log(`  Secondary: ${secondary.length} exercises`);
      console.log(`  Accessory: ${accessory.length} exercises`);
      
      // Log some example exercises
      if (primary.length > 0) {
        console.log(`  Primary examples: ${primary.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
      }
      if (secondary.length > 0) {
        console.log(`  Secondary examples: ${secondary.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
      }
      if (accessory.length > 0) {
        console.log(`  Accessory examples: ${accessory.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
      }
    });

    console.log(`✅ Weekly exercise pool created successfully`);
    return pool;
  }

  /**
   * Get exercises for a specific muscle group using multiple filtering strategies
   */
  private static getExercisesForMuscleGroup(scoredExercises: any[], muscleGroup: string[]): any[] {
    console.log(`🔍 Getting exercises for muscle group: ${muscleGroup.join(', ')}`);
    console.log(`📊 Total scored exercises available: ${scoredExercises.length}`);
    
    // Strategy 1: Filter by primary_muscle and target_muscle fields (most accurate)
    const muscleFilteredExercises = scoredExercises.filter(exercise => {
      const primaryMuscle = exercise.primary_muscle?.toLowerCase() || '';
      const targetMuscle = exercise.target_muscle?.toLowerCase() || '';
      
      return muscleGroup.some(muscle => {
        const muscleLower = muscle.toLowerCase();
        const matches = primaryMuscle.includes(muscleLower) || targetMuscle.includes(muscleLower);
        
        if (matches) {
          console.log(`  ✅ ${exercise.exercise_name} (primary: ${exercise.primary_muscle}, target: ${exercise.target_muscle}) matches ${muscle}`);
        }
        
        return matches;
      });
    });
    
    if (muscleFilteredExercises.length > 0) {
      console.log(`📦 Found ${muscleFilteredExercises.length} exercises via muscle field matching`);
      console.log(`  Examples: ${muscleFilteredExercises.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
      return muscleFilteredExercises;
    }
    
    // Strategy 2: Filter by category field
    console.log(`⚠️ No exercises found via muscle fields, trying category matching...`);
    
    const categoryMapping: Record<string, string[]> = {
      'Chest': ['Upper Body', 'upper body', 'Upper', 'upper', 'Chest', 'chest'],
      'Back': ['Upper Body', 'upper body', 'Upper', 'upper', 'Back', 'back'],
      'Shoulders': ['Upper Body', 'upper body', 'Upper', 'upper', 'Shoulders', 'shoulders'],
      'Arms': ['Upper Body', 'upper body', 'Upper', 'upper', 'Arms', 'arms'],
      'Core': ['Core', 'core', 'Abdominal', 'abdominal', 'Abs', 'abs'],
      'Lower Back': ['Core', 'core', 'Lower Back', 'lower back', 'Back', 'back'],
      'Full Body': ['Full Body', 'full body', 'Full', 'full', 'Compound', 'compound'],
      'Quads': ['Lower Body', 'lower body', 'Lower', 'lower', 'Legs', 'legs', 'Quads', 'quads'],
      'Glutes': ['Lower Body', 'lower body', 'Lower', 'lower', 'Legs', 'legs', 'Glutes', 'glutes'],
      'Hamstrings': ['Lower Body', 'lower body', 'Lower', 'lower', 'Legs', 'legs', 'Hamstrings', 'hamstrings'],
      'Calves': ['Lower Body', 'lower body', 'Lower', 'lower', 'Legs', 'legs', 'Calves', 'calves']
    };
    
    const categoryFilteredExercises = scoredExercises.filter(exercise => {
      const exerciseCategory = exercise.category?.toLowerCase() || '';
      
      return muscleGroup.some(muscle => {
        const possibleCategories = categoryMapping[muscle] || [];
        const matches = possibleCategories.some(category => 
          exerciseCategory === category.toLowerCase()
        );
        
        if (matches) {
          console.log(`  ✅ ${exercise.exercise_name} (${exercise.category}) matches ${muscle} → [${possibleCategories.join(', ')}]`);
        }
        
        return matches;
      });
    });
    
    if (categoryFilteredExercises.length > 0) {
      console.log(`📦 Found ${categoryFilteredExercises.length} exercises via category matching`);
      console.log(`  Examples: ${categoryFilteredExercises.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
      return categoryFilteredExercises;
    }
    
    // Strategy 3: Fallback based on exercise name keywords
    console.log(`⚠️ No exercises found via category matching, trying exercise name keywords...`);
    
    const keywordMapping: Record<string, string[]> = {
      'Chest': ['chest', 'bench', 'press', 'push-up', 'dip', 'fly'],
      'Back': ['back', 'row', 'pull-up', 'chin-up', 'lat', 'pull'],
      'Shoulders': ['shoulder', 'press', 'raise', 'delt', 'overhead'],
      'Arms': ['curl', 'extension', 'tricep', 'bicep', 'arm'],
      'Core': ['core', 'ab', 'crunch', 'plank', 'sit-up', 'twist', 'dead bug'],
      'Lower Back': ['back', 'deadlift', 'good morning', 'back extension'],
      'Full Body': ['squat', 'deadlift', 'clean', 'snatch', 'thruster', 'burpee', 'turkish'],
      'Quads': ['squat', 'lunge', 'leg press', 'quad', 'step-up'],
      'Glutes': ['glute', 'bridge', 'hip thrust', 'deadlift', 'clamshell'],
      'Hamstrings': ['hamstring', 'curl', 'deadlift', 'good morning', 'nordic'],
      'Calves': ['calf', 'raise', 'calves', 'heel']
    };
    
    const keywordFilteredExercises = scoredExercises.filter(exercise => {
      const exerciseName = exercise.exercise_name?.toLowerCase() || '';
      
      return muscleGroup.some(muscle => {
        const keywords = keywordMapping[muscle] || [];
        const matches = keywords.some(keyword => exerciseName.includes(keyword));
        
        if (matches) {
          console.log(`  🔄 KEYWORD: ${exercise.exercise_name} matches ${muscle} via keywords [${keywords.join(', ')}]`);
        }
        
        return matches;
      });
    });
    
    if (keywordFilteredExercises.length > 0) {
      console.log(`📦 Found ${keywordFilteredExercises.length} exercises via keyword matching`);
      console.log(`  Examples: ${keywordFilteredExercises.slice(0, 3).map(ex => ex.exercise_name).join(', ')}`);
      return keywordFilteredExercises;
    }
    
    // Strategy 4: Last resort - return any exercises if nothing else works
    console.log(`⚠️ No exercises found via any matching strategy, returning first ${Math.min(5, scoredExercises.length)} exercises as fallback`);
    const fallbackExercises = scoredExercises.slice(0, 5);
    console.log(`  Fallback exercises: ${fallbackExercises.map(ex => ex.exercise_name).join(', ')}`);
    return fallbackExercises;
  }

  /**
   * Filter out recently used exercises from previous weeks
   */
  private static filterRecentlyUsedExercises(exercises: any[], exerciseHistory: ExerciseHistory[]): any[] {
    console.log(`🚫 Filtering recently used exercises from ${exercises.length} total exercises`);
    console.log(`📊 Exercise history contains ${exerciseHistory.length} entries`);
    
    const recentlyUsedExercises = exerciseHistory
      .filter(hist => {
        const daysSinceUsed = Math.floor((Date.now() - hist.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
        const isRecent = daysSinceUsed <= 14; // Last 2 weeks
        
        if (isRecent) {
          console.log(`  🕒 ${hist.exerciseName} used ${daysSinceUsed} days ago`);
        }
        
        return isRecent;
      })
      .map(hist => hist.exerciseName.toLowerCase());
    
    console.log(`🚫 Found ${recentlyUsedExercises.length} recently used exercises to filter out`);
    
    const filteredExercises = exercises.filter(exercise => {
      const isRecentlyUsed = recentlyUsedExercises.includes(exercise.exercise_name.toLowerCase());
      if (isRecentlyUsed) {
        console.log(`  ❌ Filtering out: ${exercise.exercise_name} (recently used)`);
      }
      return !isRecentlyUsed;
    });
    
    console.log(`✅ After filtering: ${filteredExercises.length} exercises remaining`);
    
    return filteredExercises;
  }

  /**
   * Select exercises for a specific day with day-to-day variety
   */
  private static selectExercisesForDay(
    dayNumber: number,
    muscleGroup: string[],
    weeklyPool: WeeklyExercisePool,
    exercisesPerDay: number,
    template: any
  ): any[] {
    console.log(`\n🎯 === DAY ${dayNumber} EXERCISE SELECTION ===`);
    console.log(`🎯 Muscle Group: ${muscleGroup.join(', ')}`);
    console.log(`🎯 Exercises needed: ${exercisesPerDay}`);
    
    const groupKey = muscleGroup.join('_');
    const availableExercises = weeklyPool.availableExercises[groupKey];
    
    if (!availableExercises) {
      console.warn(`⚠️ No available exercises for muscle group: ${groupKey}`);
      return [];
    }
    
    console.log(`📦 Available exercises for ${groupKey}:`);
    console.log(`  Primary: ${availableExercises.primary.length} exercises`);
    console.log(`  Secondary: ${availableExercises.secondary.length} exercises`);
    console.log(`  Accessory: ${availableExercises.accessory.length} exercises`);
    
    // Step 1: Avoid exercises used in previous days this week
    const usedThisWeek = this.getExercisesUsedThisWeek(weeklyPool, dayNumber);
    console.log(`🚫 Exercises used this week (before day ${dayNumber}): ${usedThisWeek.join(', ') || 'None'}`);
    
    const unusedExercises = this.filterUsedExercises(availableExercises, usedThisWeek);
    console.log(`✅ After filtering used exercises:`);
    console.log(`  Primary: ${unusedExercises.primary.length} exercises`);
    console.log(`  Secondary: ${unusedExercises.secondary.length} exercises`);
    console.log(`  Accessory: ${unusedExercises.accessory.length} exercises`);
    
    // Step 2: Ensure movement pattern variety within the week
    const patternBalancedExercises = this.balanceMovementPatternsWithinWeek(
      unusedExercises,
      weeklyPool,
      dayNumber
    );
    console.log(`🔄 After movement pattern balancing:`);
    console.log(`  Primary: ${patternBalancedExercises.primary.length} exercises`);
    console.log(`  Secondary: ${patternBalancedExercises.secondary.length} exercises`);
    console.log(`  Accessory: ${patternBalancedExercises.accessory.length} exercises`);
    
    // Step 3: Balance exercise types (primary/secondary/accessory)
    const typeBalancedExercises = this.balanceExerciseTypes(
      patternBalancedExercises,
      dayNumber,
      exercisesPerDay
    );
    console.log(`⚖️ After exercise type balancing: ${typeBalancedExercises.length} total exercises`);
    
    // Step 4: Add randomization factor
    const randomizedExercises = this.addRandomizationFactor(typeBalancedExercises);
    console.log(`🎲 After randomization: ${randomizedExercises.length} exercises`);
    
    // Step 5: Select final exercises
    const selectedExercises = randomizedExercises.slice(0, exercisesPerDay);
    console.log(`✅ Final selected exercises for Day ${dayNumber}:`);
    selectedExercises.forEach((ex, index) => {
      console.log(`  ${index + 1}. ${ex.exercise_name} (${ex.exerciseType || 'unknown type'})`);
    });
    
    // Step 6: Update weekly pool
    this.updateWeeklyPool(weeklyPool, dayNumber, selectedExercises, muscleGroup);
    
    console.log(`✅ Day ${dayNumber} selection complete: ${selectedExercises.map(ex => ex.exercise_name).join(', ')}`);
    
    return selectedExercises;
  }

  /**
   * Get exercises used in previous days this week
   */
  private static getExercisesUsedThisWeek(weeklyPool: WeeklyExercisePool, dayNumber: number): string[] {
    const usedExercises: string[] = [];
    
    for (let day = 1; day < dayNumber; day++) {
      if (weeklyPool.usedExercises[day]) {
        usedExercises.push(...weeklyPool.usedExercises[day].exercises);
      }
    }
    
    return usedExercises.map(ex => ex.toLowerCase());
  }

  /**
   * Filter used exercises from available exercises
   */
  private static filterUsedExercises(
    availableExercises: { primary: any[]; secondary: any[]; accessory: any[] },
    usedExercises: string[]
  ): { primary: any[]; secondary: any[]; accessory: any[] } {
    const filter = (exercises: any[]) => 
      exercises.filter(ex => !usedExercises.includes(ex.exercise_name.toLowerCase()));
    
    return {
      primary: filter(availableExercises.primary),
      secondary: filter(availableExercises.secondary),
      accessory: filter(availableExercises.accessory)
    };
  }

  /**
   * Balance movement patterns within the week
   */
  private static balanceMovementPatternsWithinWeek(
    exercises: { primary: any[]; secondary: any[]; accessory: any[] },
    weeklyPool: WeeklyExercisePool,
    dayNumber: number
  ): { primary: any[]; secondary: any[]; accessory: any[] } {
    // Get movement patterns used in previous days this week
    const usedPatterns = this.getMovementPatternsUsedThisWeek(weeklyPool, dayNumber);
    
    const boostUnderusedPatterns = (exerciseList: any[]) => 
      exerciseList.map(exercise => {
        const pattern = this.getMovementPattern(exercise.exercise_name);
        const patternCount = usedPatterns[pattern] || 0;
        
        let score = exercise.score || 0;
        if (patternCount === 0) {
          score += 40; // Significant boost for unused patterns
        } else if (patternCount === 1) {
          score += 20; // Moderate boost for lightly used patterns
        }
        
        return { ...exercise, score };
      }).sort((a, b) => b.score - a.score);
    
    return {
      primary: boostUnderusedPatterns(exercises.primary),
      secondary: boostUnderusedPatterns(exercises.secondary),
      accessory: boostUnderusedPatterns(exercises.accessory)
    };
  }

  /**
   * Get movement patterns used in previous days this week
   */
  private static getMovementPatternsUsedThisWeek(weeklyPool: WeeklyExercisePool, dayNumber: number): Record<string, number> {
    const patternUsage: Record<string, number> = {};
    
    for (let day = 1; day < dayNumber; day++) {
      if (weeklyPool.usedExercises[day]) {
        weeklyPool.usedExercises[day].movementPatterns.forEach(pattern => {
          patternUsage[pattern] = (patternUsage[pattern] || 0) + 1;
        });
      }
    }
    
    return patternUsage;
  }

  /**
   * Balance exercise types based on day of week
   */
  private static balanceExerciseTypes(
    exercises: { primary: any[]; secondary: any[]; accessory: any[] },
    dayNumber: number,
    exercisesPerDay: number
  ): any[] {
    console.log(`⚖️ Balancing exercise types for Day ${dayNumber} (${exercisesPerDay} exercises needed)`);
    
    const allExercises: any[] = [];
    
    // Determine exercise type distribution based on day
    const typeDistribution = this.getExerciseTypeDistribution(dayNumber, exercisesPerDay);
    console.log(`📊 Target distribution: ${typeDistribution.primary}P, ${typeDistribution.secondary}S, ${typeDistribution.accessory}A`);
    
    // Add primary exercises
    if (typeDistribution.primary > 0) {
      const primaryToAdd = exercises.primary.slice(0, typeDistribution.primary);
      allExercises.push(...primaryToAdd);
      console.log(`⚡ Added ${primaryToAdd.length} primary exercises: ${primaryToAdd.map(ex => ex.exercise_name).join(', ')}`);
    }
    
    // Add secondary exercises
    if (typeDistribution.secondary > 0) {
      const secondaryToAdd = exercises.secondary.slice(0, typeDistribution.secondary);
      allExercises.push(...secondaryToAdd);
      console.log(`🔧 Added ${secondaryToAdd.length} secondary exercises: ${secondaryToAdd.map(ex => ex.exercise_name).join(', ')}`);
    }
    
    // Add accessory exercises
    if (typeDistribution.accessory > 0) {
      const accessoryToAdd = exercises.accessory.slice(0, typeDistribution.accessory);
      allExercises.push(...accessoryToAdd);
      console.log(`🎯 Added ${accessoryToAdd.length} accessory exercises: ${accessoryToAdd.map(ex => ex.exercise_name).join(', ')}`);
    }
    
    console.log(`✅ Total exercises after balancing: ${allExercises.length}`);
    return allExercises;
  }

  /**
   * Get exercise type distribution based on day of week
   */
  private static getExerciseTypeDistribution(dayNumber: number, exercisesPerDay: number) {
    // Different distribution based on day of week
    switch (dayNumber) {
      case 1: // Monday - Start strong with compound movements
        return {
          primary: Math.ceil(exercisesPerDay * 0.6),    // 60% primary
          secondary: Math.ceil(exercisesPerDay * 0.3),  // 30% secondary
          accessory: Math.ceil(exercisesPerDay * 0.1)   // 10% accessory
        };
      
      case 2: // Tuesday - Moderate intensity
        return {
          primary: Math.ceil(exercisesPerDay * 0.4),    // 40% primary
          secondary: Math.ceil(exercisesPerDay * 0.4),  // 40% secondary
          accessory: Math.ceil(exercisesPerDay * 0.2)   // 20% accessory
        };
      
      case 3: // Wednesday - Mid-week variety
        return {
          primary: Math.ceil(exercisesPerDay * 0.3),    // 30% primary
          secondary: Math.ceil(exercisesPerDay * 0.5),  // 50% secondary
          accessory: Math.ceil(exercisesPerDay * 0.2)   // 20% accessory
        };
      
      case 4: // Thursday - Build up intensity
        return {
          primary: Math.ceil(exercisesPerDay * 0.5),    // 50% primary
          secondary: Math.ceil(exercisesPerDay * 0.3),  // 30% secondary
          accessory: Math.ceil(exercisesPerDay * 0.2)   // 20% accessory
        };
      
      case 5: // Friday - End strong
        return {
          primary: Math.ceil(exercisesPerDay * 0.6),    // 60% primary
          secondary: Math.ceil(exercisesPerDay * 0.3),  // 30% secondary
          accessory: Math.ceil(exercisesPerDay * 0.1)   // 10% accessory
        };
      
      default: // Weekend - Lighter intensity
        return {
          primary: Math.ceil(exercisesPerDay * 0.2),    // 20% primary
          secondary: Math.ceil(exercisesPerDay * 0.5),  // 50% secondary
          accessory: Math.ceil(exercisesPerDay * 0.3)   // 30% accessory
        };
    }
  }

  /**
   * Add randomization factor to prevent exact same ordering
   */
  private static addRandomizationFactor(exercises: any[]): any[] {
    return exercises.map(exercise => {
      // Add random factor (±10 points) to prevent exact same ordering
      const randomFactor = Math.floor(Math.random() * 21) - 10; // -10 to +10
      return { ...exercise, score: (exercise.score || 0) + randomFactor };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Update weekly pool with used exercises
   */
  private static updateWeeklyPool(
    weeklyPool: WeeklyExercisePool,
    dayNumber: number,
    selectedExercises: any[],
    muscleGroup: string[]
  ): void {
    weeklyPool.usedExercises[dayNumber] = {
      exercises: selectedExercises.map(ex => ex.exercise_name),
      muscleGroups: muscleGroup,
      movementPatterns: selectedExercises.map(ex => this.getMovementPattern(ex.exercise_name)),
      equipmentUsed: selectedExercises.map(ex => this.getEquipmentCategory(ex.equipment || ''))
    };
  }

  /**
   * Filter and score exercises with injury consideration and variety
   */
  private static filterAndScoreExercises(
    exercises: any[],
    goal: string,
    experience: string,
    targetMuscles: string[],
    availableEquipment: string[],
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
    exerciseHistory: ExerciseHistory[] = []
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
        const exerciseExperience = exercise.expereince_level || '';
        const mappedExerciseLevel = this.DB_EXPERIENCE_MAPPING[exerciseExperience as keyof typeof this.DB_EXPERIENCE_MAPPING] || "Beginner";
        if (mappedExerciseLevel === experience) {
          score += 20;
        }

        // Score based on exercise variety (avoid recently used exercises)
        if (exerciseHistory.length > 0) {
          const recentlyUsedExercises = exerciseHistory
            .filter(hist => {
              const daysSinceUsed = Math.floor((Date.now() - hist.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
              return daysSinceUsed <= 14; // Last 2 weeks
            })
            .map(hist => hist.exerciseName.toLowerCase());
          
          if (!recentlyUsedExercises.includes(exercise.exercise_name.toLowerCase())) {
            score += 30; // Significant boost for unused exercises
          }
        }

        // Score based on movement pattern variety
        const movementPattern = this.getMovementPattern(exercise.exercise_name);
        const patternUsage = exerciseHistory
          .filter(hist => hist.movementPattern === movementPattern)
          .length;
        
        if (patternUsage < 2) {
          score += 25; // Boost for underused movement patterns
        } else if (patternUsage < 4) {
          score += 15; // Moderate boost
        }
        
        // Score based on goal alignment
        const exerciseCategory = exercise.category?.toLowerCase() || '';
        if (goal === 'endurance' && exerciseCategory.includes('cardio')) score += 25;
        if (goal === 'strength' && exerciseCategory.includes('strength')) score += 25;
        if (goal === 'hypertrophy' && exerciseCategory.includes('strength')) score += 25;
        
        return { ...exercise, score, movementPattern };
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
    // Map target muscles to exercise categories (using the same mapping as getExercisesForMuscleGroup)
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

    console.log(`🎯 Target categories for goal "${goal}": ${targetCategories.join(', ')}`);

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

    console.log(`📅 Generated ${categoryGroups.length} muscle groups: ${categoryGroups.map(group => group.join(', ')).join(' | ')}`);
    return categoryGroups;
  }

  /**
   * Create workout plan with day-to-day variety using weekly exercise pool
   */
  private static createWorkoutPlanWithDayToDayVariety(
    muscleGroups: string[][],
    weeklyPool: WeeklyExercisePool,
    template: any,
    workoutDays: string[],
    planStartDate: Date,
    sessionMinutes: number,
    warmup: number,
    cooldown: number,
    exercisesPerDay: number,
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
    progressionAnalysis?: any,
    scoredExercises?: any[]
  ): any {
    console.log('🎯 Creating workout plan with day-to-day variety');
    
    const days: any[] = [];
    const startDate = new Date(planStartDate);
    let workoutDayCounter = 0;

    // Create a 7-day array with day-to-day variety
    console.log('🎯 === DAY CREATION PROCESS ===');
    console.log(`🎯 TARGET WORKOUT DAYS: ${workoutDays.join(', ')}`);
    console.log(`🎯 TARGET SESSION MINUTES: ${sessionMinutes}`);
    console.log(`🎯 TARGET EXERCISES PER DAY: ${exercisesPerDay}`);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if this is a workout day
      const isWorkoutDay = workoutDays.includes(dayName);
      
      console.log(`📅 Day ${i + 1} (${dayName}): ${isWorkoutDay ? 'WORKOUT DAY' : 'REST DAY'}`);
      
      if (isWorkoutDay) {
        workoutDayCounter++;
        const workoutIndex = workoutDays.indexOf(dayName);
        const muscleGroup = muscleGroups[workoutIndex] || ["Full Body"];
        
        // Select exercises for this specific day with variety
        let selectedExercises = this.selectExercisesForDay(
          workoutDayCounter,
          muscleGroup,
          weeklyPool,
          exercisesPerDay,
          template
        );
        
        // Fallback: If no exercises selected, use any available exercises
        if (selectedExercises.length === 0 && scoredExercises && scoredExercises.length > 0) {
          console.log(`⚠️ No exercises selected for Day ${workoutDayCounter}, using fallback exercises`);
          const fallbackExercises = scoredExercises.slice(0, exercisesPerDay);
          selectedExercises = fallbackExercises.map((exercise: any, index: number) => ({
            ...exercise,
            exerciseType: index === 0 ? 'primary' : 'secondary'
          }));
          console.log(`  Fallback exercises: ${selectedExercises.map((ex: any) => ex.exercise_name).join(', ')}`);
        }
        
        // Convert exercises to full exercise objects
        const exercises = this.buildExerciseObjects(
          selectedExercises,
          muscleGroup,
          template,
          workoutDayCounter,
          injuries,
          progressionAnalysis
        );
        
        // Calculate total time for this day
        const totalTime = this.calculateDayTotalTime(exercises, warmup, cooldown);
        
        days.push({
          day: workoutDayCounter,
          date: dateStr,
          focus: muscleGroup.join(', '),
          exercises: exercises,
          totalDuration: sessionMinutes,
          timeBreakdown: totalTime,
          isWorkoutDay: true
        });
        
        console.log(`✅ Day ${workoutDayCounter} (${dayName}): ${exercises.length} exercises for ${muscleGroup.join(', ')}`);
        console.log(`   ⏰ Session Time: ${sessionMinutes} min target, ${totalTime.total} min actual`);
        console.log(`   🏋️‍♀️ Exercises: ${exercises.length} exercises (target: ${exercisesPerDay})`);
        console.log(`   📊 Time Breakdown: Warmup ${warmup}m, Exercises ${totalTime.exercises}m, Rest ${totalTime.rest}m, Cooldown ${cooldown}m`);
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
          },
          isWorkoutDay: false
        });
      }
    }

    // Log variety metrics
    this.logVarietyMetrics(weeklyPool);

    // 🎯 FINAL PLAN SUMMARY
    console.log('🎯 === FINAL PLAN SUMMARY ===');
    const actualWorkoutDays = days.filter((day: any) => day.isWorkoutDay).length;
    const actualTotalExercises = days.flatMap((day: any) => day.exercises).length;
    const actualTotalTime = days.filter((day: any) => day.isWorkoutDay).reduce((sum: number, day: any) => sum + (day.timeBreakdown?.total || 0), 0);
    
    console.log(`📊 PLAN SUMMARY:`);
    console.log(`   📅 Workout Days: ${workoutDays.length} target vs ${actualWorkoutDays} actual`);
    console.log(`   🏋️‍♀️ Total Exercises: ${workoutDays.length * exercisesPerDay} target vs ${actualTotalExercises} actual`);
    console.log(`   ⏰ Total Time: ${workoutDays.length * sessionMinutes} min target vs ${actualTotalTime} min actual`);
    console.log(`   📈 Average Session: ${sessionMinutes} min target vs ${Math.round(actualTotalTime / actualWorkoutDays)} min actual`);
    console.log('🎯 === FINAL PLAN SUMMARY END ===\n');

    return {
      days: days,
      workout_plan: days.flatMap((day: any) => day.exercises),
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
   * Build exercise objects from selected exercises
   */
  private static buildExerciseObjects(
    selectedExercises: any[],
    muscleGroup: string[],
    template: any,
    dayNumber: number,
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
    progressionAnalysis?: any
  ): any[] {
    return selectedExercises.map((exercise, index) => {
      // Calculate dynamic exercise duration
      const exerciseDuration = this.calculateExerciseDuration(exercise, template);
      
      return {
        exercise_name: exercise.exercise_name || exercise.Exercise || "Exercise",
        category: exercise.category || exercise.Category || "Strength",
        body_part: exercise.primary_muscle || exercise["Primary muscle"] || muscleGroup[0],
        sets: template.sets,
        reps: template.reps,
        duration: exerciseDuration,
        weights: this.generateDynamicWeight(exercise, template),
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
        experience: this.DB_EXPERIENCE_MAPPING[exercise.expereince_level as keyof typeof this.DB_EXPERIENCE_MAPPING] || "Beginner",
        rpe_target: "RPE 7-8",
        phase: 1,
        session_id: `W1D${dayNumber}E${index + 1}`,
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
        }),
        // Add variety metadata
        movementPattern: this.getMovementPattern(exercise.exercise_name),
        exerciseType: this.getExerciseType(exercise),
        equipmentCategory: this.getEquipmentCategory(exercise.equipment || '')
      };
    });
  }

  /**
   * Generate dynamic weight recommendations
   */
  private static generateDynamicWeight(exercise: any, template: any): string {
    const exerciseName = exercise.exercise_name.toLowerCase();
    
    // Base weight recommendations
    if (exerciseName.includes('deadlift') || exerciseName.includes('squat')) {
      return "Progressive weight (start with bodyweight)";
    } else if (exerciseName.includes('press') || exerciseName.includes('row')) {
      return "Moderate weight";
    } else if (exerciseName.includes('curl') || exerciseName.includes('extension')) {
      return "Light to moderate weight";
    } else if (exerciseName.includes('bodyweight') || exercise.equipment?.toLowerCase().includes('bodyweight')) {
      return "Bodyweight";
    }
    
    return template.weight || "Moderate weight";
  }

  /**
   * Get exercise type (primary/secondary/accessory)
   */
  private static getExerciseType(exercise: any): string {
    if (this.categorizeExercises([exercise], 'primary').length > 0) return 'primary';
    if (this.categorizeExercises([exercise], 'secondary').length > 0) return 'secondary';
    if (this.categorizeExercises([exercise], 'accessory').length > 0) return 'accessory';
    return 'general';
  }

  /**
   * Log variety metrics for the weekly pool
   */
  private static logVarietyMetrics(weeklyPool: WeeklyExercisePool): void {
    console.log('📊 === WEEKLY VARIETY METRICS ===');
    
    const allUsedExercises = Object.values(weeklyPool.usedExercises).flatMap(day => day.exercises);
    const uniqueExercises = new Set(allUsedExercises);
    
    const allUsedPatterns = Object.values(weeklyPool.usedExercises).flatMap(day => day.movementPatterns);
    const uniquePatterns = new Set(allUsedPatterns);
    
    const allUsedEquipment = Object.values(weeklyPool.usedExercises).flatMap(day => day.equipmentUsed);
    const uniqueEquipment = new Set(allUsedEquipment);
    
    console.log(`🏋️‍♀️ Total exercises used: ${allUsedExercises.length}`);
    console.log(`✨ Unique exercises: ${uniqueExercises.size}`);
    console.log(`🔄 Movement patterns: ${Array.from(uniquePatterns).join(', ')}`);
    console.log(`🛠️ Equipment used: ${Array.from(uniqueEquipment).join(', ')}`);
    console.log(`📈 Exercise variety rate: ${Math.round((uniqueExercises.size / allUsedExercises.length) * 100)}%`);
  }

  /**
   * Create the actual workout plan with enhanced features (Legacy method - kept for compatibility)
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

    const total = warmup + exerciseTime + Math.round(restTime) + cooldown;

    // 🎯 TIME CALCULATION LOGGING
    console.log(`⏰ TIME CALCULATION for ${exercises.length} exercises:`);
    console.log(`   🏃‍♂️ Warmup: ${warmup} minutes`);
    console.log(`   🏋️‍♀️ Exercise Time: ${exerciseTime} minutes (${exercises.map(ex => `${ex.exercise_name}: ${ex.duration}m`).join(', ')})`);
    console.log(`   😴 Rest Time: ${Math.round(restTime)} minutes`);
    console.log(`   🧘‍♀️ Cooldown: ${cooldown} minutes`);
    console.log(`   📊 TOTAL: ${total} minutes`);

    return {
      warmup,
      exercises: exerciseTime,
      rest: Math.round(restTime),
      cooldown,
      total
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
        experience: this.DB_EXPERIENCE_MAPPING[exercise.expereince_level as keyof typeof this.DB_EXPERIENCE_MAPPING] || "Beginner",
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
    
    // Complexity factors with proper type annotations
    const complexityFactors = {
      category: {
        'Full Body': 2,    // More complex, needs more time
        'Upper Body': 1,   // Moderate complexity
        'Lower Body': 1,   // Moderate complexity
        'Core': 0.5        // Simpler, less time needed
      } as Record<string, number>,
      equipment: {
        'barbell': 1,      // More setup time
        'machine': 0.5,    // Moderate setup
        'bodyweight': -0.5 // Minimal setup
      } as Record<string, number>
    };
    
    // Apply factors with proper type checking
    const category = exercise.category as string;
    const equipment = exercise.equipment as string;
    
    baseTime += complexityFactors.category[category] || 0;
    baseTime += complexityFactors.equipment[equipment] || 0;
    
    // Template adjustments
    if (template.sets > 3) baseTime += 1;
    if (template.rest > 60) baseTime += 0.5;
    
    // Include rest time in total duration
    const restMinutes = (template.sets - 1) * template.rest / 60;
    baseTime += restMinutes;
    
    const finalDuration = Math.max(4, Math.round(baseTime));
    
    // 🎯 EXERCISE DURATION LOGGING
    console.log(`⏱️ DURATION CALCULATION for ${exercise.exercise_name}:`);
    console.log(`   📊 Base Time: 6 minutes`);
    console.log(`   🏷️ Category Factor: ${complexityFactors.category[category] || 0} (${category})`);
    console.log(`   🛠️ Equipment Factor: ${complexityFactors.equipment[equipment] || 0} (${equipment})`);
    console.log(`   🔢 Template Adjustments: Sets ${template.sets} (+${template.sets > 3 ? 1 : 0}), Rest ${template.rest}s (+${template.rest > 60 ? 0.5 : 0})`);
    console.log(`   😴 Rest Time: ${restMinutes} minutes (${template.sets - 1} sets × ${template.rest}s ÷ 60)`);
    console.log(`   📈 FINAL DURATION: ${finalDuration} minutes`);
    
    return finalDuration;
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
    const mappedLevel = this.DB_EXPERIENCE_MAPPING[exercise.expereince_level as keyof typeof this.DB_EXPERIENCE_MAPPING] || "Beginner";
    if (mappedLevel === 'Beginner') {
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
