import { supabase } from './supabase';

// Better workout generator that uses actual exercise database
export class SimpleWorkoutGenerator {
  
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

  /**
   * Generate a workout plan using actual exercise database
   */
  static async generateWorkoutPlan(clientId: number, planStartDate: Date): Promise<{
    success: boolean;
    workoutPlan?: any;
    message?: string;
  }> {
    try {
      console.log('🚀 === BETTER WORKOUT GENERATOR START ===');
      console.log(`👤 Client ID: ${clientId}`);

      // 1. Fetch client data
      const { data: client, error } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error || !client) {
        throw new Error(`Failed to fetch client data: ${error?.message || 'Client not found'}`);
      }

      console.log('✅ Client data fetched successfully');

      // 2. Parse client preferences
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

      console.log('📊 Parsed client data:', {
        goal,
        experience,
        sessionMinutes,
        workoutDays,
        daysPerWeek,
        availableEquipment,
        targetMuscles
      });

      // 3. Fetch exercises from database
      const { data: exercises, error: exerciseError } = await supabase
        .from('exercises_raw')
        .select('*');

      if (exerciseError) {
        throw new Error(`Failed to fetch exercises: ${exerciseError.message}`);
      }

      console.log(`✅ Fetched ${exercises.length} exercises from database`);

      // 4. Filter and score exercises
      const scoredExercises = this.filterAndScoreExercises(
        exercises,
        goal,
        experience,
        targetMuscles,
        availableEquipment
      );

      console.log(`✅ Found ${scoredExercises.length} suitable exercises`);

      // 5. Get workout template
      const template = this.WORKOUT_TEMPLATES[goal as keyof typeof this.WORKOUT_TEMPLATES];
      if (!template) {
        throw new Error(`No template found for goal: ${goal}`);
      }

      // 6. Calculate exercises per day based on session time
      const warmupTime = 8; // minutes
      const cooldownTime = 5; // minutes
      const availableTime = sessionMinutes - warmupTime - cooldownTime;
      const exercisesPerDay = Math.min(
        template.exercises_per_day,
        Math.floor(availableTime / 6) // Assume ~6 minutes per exercise
      );

      console.log('⏰ Time calculation:', {
        sessionMinutes,
        warmupTime,
        cooldownTime,
        availableTime,
        exercisesPerDay
      });

      // 7. Generate muscle groups for each day
      const muscleGroups = this.generateMuscleGroups(goal, daysPerWeek, targetMuscles);

      // 8. Create workout plan
      const workoutPlan = this.createWorkoutPlan(
        muscleGroups,
        scoredExercises,
        template,
        workoutDays,
        planStartDate,
        sessionMinutes,
        warmupTime,
        cooldownTime,
        exercisesPerDay
      );

      console.log('✅ Workout plan generated successfully');
      console.log(`📋 Generated ${daysPerWeek} workout days with ${exercisesPerDay} exercises per day`);

      return {
        success: true,
        workoutPlan
      };

    } catch (error) {
      console.error('❌ Error in better workout generator:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Filter and score exercises based on criteria
   */
  private static filterAndScoreExercises(
    exercises: any[],
    goal: string,
    experience: string,
    targetMuscles: string[],
    availableEquipment: string[]
  ): any[] {
    return exercises
      .map(exercise => {
        let score = 0;
        
        // Prioritize exercises with video links
        if (exercise.video_link && exercise.video_link.trim() !== '') {
          score += 100;
        }
        
        // Score based on primary muscle match
        if (targetMuscles.length > 0) {
          const primaryMuscle = exercise.primary_muscle?.toLowerCase();
          if (targetMuscles.some(muscle => 
            primaryMuscle?.includes(muscle.toLowerCase()) || 
            muscle.toLowerCase().includes(primaryMuscle)
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
        // Use the category at this index
        categoryGroups.push([targetCategories[i]]);
      } else {
        // Repeat categories if we run out
        const categoryIndex = i % targetCategories.length;
        categoryGroups.push([targetCategories[categoryIndex]]);
      }
    }

    return categoryGroups;
  }

  /**
   * Create the actual workout plan
   */
  private static createWorkoutPlan(
    muscleGroups: string[][],
    scoredExercises: any[],
    template: any,
    workoutDays: string[],
    planStartDate: Date,
    sessionMinutes: number,
    warmupTime: number,
    cooldownTime: number,
    exercisesPerDay: number
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
          exercisesPerDay
        );
        
        days.push({
          day: workoutIndex + 1,
          date: dateStr,
          focus: muscleGroup.join(', '),
          exercises: exercises,
          totalDuration: sessionMinutes
        });
      } else {
        // Rest day
        days.push({
          day: i + 1,
          date: dateStr,
          focus: 'Rest Day',
          exercises: [],
          totalDuration: 0
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
        warmupTime,
        cooldownTime
      }
    };
  }

  /**
   * Generate exercises for a specific muscle group
   */
  private static generateExercisesForMuscleGroup(
    muscleGroup: string[], 
    scoredExercises: any[], 
    template: any, 
    exercisesPerDay: number
  ): any[] {
    const exercises: any[] = [];
    
    // Filter exercises for this muscle group using category column
    const muscleExercises = scoredExercises.filter(exercise => {
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

    // Take the top exercises for this muscle group
    const selectedExercises = muscleExercises.slice(0, exercisesPerDay);
    
    selectedExercises.forEach((exercise, index) => {
      // Calculate individual exercise duration (simplified)
      const exerciseDuration = 8; // 8 minutes per exercise for endurance
      
      const exerciseObj = {
        exercise_name: exercise.exercise_name || exercise.Exercise || "Exercise",
        category: exercise.category || exercise.Category || "Strength",
        body_part: exercise.primary_muscle || exercise["Primary muscle"] || muscleGroup[0],
        sets: template.sets,
        reps: template.reps,
        duration: exerciseDuration.toString(),
        weights: "Moderate weight",
        equipment: exercise.equipment || exercise.Equipment || "Dumbbell",
        coach_tip: `RPE 7-8 (2-3 RIR)`,
        video_link: exercise.video_link || exercise.Video || "",
        rest: template.rest,
        experience: exercise.experience || exercise.Experience || "Beginner",
        rpe_target: "RPE 7-8",
        phase: 1,
        session_id: `W1D${index + 1}`
      };
      
      exercises.push(exerciseObj);
    });

    return exercises;
  }
}
