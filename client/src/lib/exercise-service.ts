import { supabase } from './supabase';

export interface Exercise {
  id: number;
  exercise_name: string;
  video_link: string | null;
  video_explanation: string | null;
  expereince_level: string | null;
  target_muscle: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  category: string | null;
  source?: 'default' | 'custom';
}

export interface CustomExercise {
  exercise_name: string;
  expereince_level: string;
  target_muscle?: string;
  primary_muscle?: string;
  category: string;
  video_link?: string;
  equipment?: string;
  video_explanation?: string;
}

class ExerciseService {


  async getAllExercises(): Promise<Exercise[]> {
    try {
      // Get current user session (same as Professional Calendar)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Look up trainer UUID from trainer table by email (same as ScheduleService)
      const { data: trainerRow, error: trainerLookupError } = await supabase
        .from('trainer')
        .select('id')
        .eq('trainer_email', user.email!)
        .single();

      if (trainerLookupError || !trainerRow?.id) {
        console.error('Unable to resolve trainer.id from trainer_email; check trainer RLS/policy:', trainerLookupError);
        throw new Error('Trainer profile not accessible. Ensure trainer RLS allows self-select.');
      }

      // Fetch exercises from both sources
      const [defaultExercisesResult, customExercisesResult] = await Promise.all([
        supabase
          .from("exercises_raw")
          .select("id, exercise_name, video_link, video_explanation, expereince_level, target_muscle, primary_muscle, equipment, category")
          .order("exercise_name", { ascending: true }),
        
        supabase
          .from("trainer_exercises")
          .select("id, exercise_name, video_link, video_explanation, expereince_level, target_muscle, primary_muscle, equipment, category")
          .eq("trainer_id", trainerRow.id)
          .order("exercise_name", { ascending: true })
      ]);

      if (defaultExercisesResult.error) throw defaultExercisesResult.error;
      if (customExercisesResult.error) throw customExercisesResult.error;

      // Combine and mark the source
      const defaultExercises = (defaultExercisesResult.data || []).map(ex => ({ ...ex, source: 'default' as const }));
      const customExercises = (customExercisesResult.data || []).map(ex => ({ ...ex, source: 'custom' as const }));

      return [...defaultExercises, ...customExercises];
    } catch (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }
  }

  async addCustomExercise(exercise: CustomExercise): Promise<void> {
    try {
      // Get current user session (same as Professional Calendar)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Look up trainer UUID from trainer table by email (same as ScheduleService)
      const { data: trainerRow, error: trainerLookupError } = await supabase
        .from('trainer')
        .select('id')
        .eq('trainer_email', user.email!)
        .single();

      if (trainerLookupError || !trainerRow?.id) {
        console.error('Unable to resolve trainer.id from trainer_email; check trainer RLS/policy:', trainerLookupError);
        throw new Error('Trainer profile not accessible. Ensure trainer RLS allows self-select.');
      }

      // Prepare exercise data with trainer information
      // Note: trainer_exercises table doesn't have trainer_email column
      const exerciseData = {
        trainer_id: trainerRow.id,
        ...exercise
      };

      console.log('📊 Adding custom exercise with data:', exerciseData);

      // Try direct insert first
      const { error: directError } = await supabase
        .from("trainer_exercises")
        .insert([exerciseData]);

      if (directError) {
        console.warn("Direct insert failed, trying function approach:", directError);
        
        // Fallback: Use the database function (simplified parameters)
        const { error: functionError } = await supabase.rpc('insert_trainer_exercise', {
          p_exercise_name: exercise.exercise_name,
          p_expereince_level: exercise.expereince_level,
          p_category: exercise.category
        });

        if (functionError) {
          console.error("Function insert also failed:", functionError);
          throw functionError;
        }
      }

      console.log('✅ Custom exercise added successfully');
    } catch (error) {
      console.error("Error adding custom exercise:", error);
      throw error;
    }
  }

  async updateCustomExercise(exerciseId: number, updates: Partial<CustomExercise>): Promise<void> {
    try {
      const { error } = await supabase
        .from("trainer_exercises")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", exerciseId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating custom exercise:", error);
      throw error;
    }
  }

  async deleteCustomExercise(exerciseId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("trainer_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting custom exercise:", error);
      throw error;
    }
  }

  async getExerciseOptions(): Promise<{
    experienceOptions: string[];
    targetOptions: string[];
    primaryOptions: string[];
    equipmentOptions: string[];
    categoryOptions: string[];
  }> {
    try {
      // Get current user session (same as Professional Calendar)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Look up trainer UUID from trainer table by email (same as ScheduleService)
      const { data: trainerRow, error: trainerLookupError } = await supabase
        .from('trainer')
        .select('id')
        .eq('trainer_email', user.email!)
        .single();

      if (trainerLookupError || !trainerRow?.id) {
        console.error('Unable to resolve trainer.id from trainer_email; check trainer RLS/policy:', trainerLookupError);
        throw new Error('Trainer profile not accessible. Ensure trainer RLS allows self-select.');
      }

      // Fetch options from both sources
      const [defaultOptionsResult, customOptionsResult] = await Promise.all([
        supabase
          .from("exercises_raw")
          .select("expereince_level, target_muscle, primary_muscle, equipment, category")
          .limit(10000),
        
        supabase
          .from("trainer_exercises")
          .select("expereince_level, target_muscle, primary_muscle, equipment, category")
          .eq("trainer_id", trainerRow.id)
          .limit(10000)
      ]);

      if (defaultOptionsResult.error) throw defaultOptionsResult.error;
      if (customOptionsResult.error) throw customOptionsResult.error;

      // Combine data from both sources
      const defaultList = (defaultOptionsResult.data || []) as any[];
      const customList = (customOptionsResult.data || []) as any[];
      const combinedList = [...defaultList, ...customList];

      const uniq = (arr: (string | null | undefined)[]) =>
        Array.from(new Set(arr.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));

      return {
        experienceOptions: uniq(combinedList.map(r => r.expereince_level)),
        targetOptions: uniq(combinedList.map(r => r.target_muscle)),
        primaryOptions: uniq(combinedList.map(r => r.primary_muscle)),
        equipmentOptions: uniq(combinedList.map(r => r.equipment)),
        categoryOptions: uniq(combinedList.map(r => r.category))
      };
    } catch (error) {
      console.error("Error fetching exercise options:", error);
      throw error;
    }
  }

  filterExercises(exercises: Exercise[], filters: {
    nameFilter: string;
    experienceFilter: string[];
    targetFilter: string[];
    primaryFilter: string[];
    equipmentFilter: string[];
    categoryFilter: string[];
    sourceFilter?: 'all' | 'default' | 'custom';
  }): Exercise[] {
    return exercises.filter(exercise => {
      if (filters.nameFilter && !exercise.exercise_name.toLowerCase().includes(filters.nameFilter.toLowerCase())) return false;
      if (filters.experienceFilter.length && !filters.experienceFilter.includes(exercise.expereince_level || '')) return false;
      if (filters.targetFilter.length && !filters.targetFilter.includes(exercise.target_muscle || '')) return false;
      if (filters.primaryFilter.length && !filters.primaryFilter.includes(exercise.primary_muscle || '')) return false;
      if (filters.equipmentFilter.length && !filters.equipmentFilter.includes(exercise.equipment || '')) return false;
      if (filters.categoryFilter.length && !filters.categoryFilter.includes(exercise.category || '')) return false;
      
      // Apply source filter
      if (filters.sourceFilter && filters.sourceFilter !== 'all') {
        if (filters.sourceFilter === 'default' && exercise.source !== 'default') return false;
        if (filters.sourceFilter === 'custom' && exercise.source !== 'custom') return false;
      }
      
      return true;
    });
  }

  paginateExercises(exercises: Exercise[], page: number, pageSize: number): Exercise[] {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return exercises.slice(startIndex, endIndex);
  }
}

export const exerciseService = new ExerciseService();
