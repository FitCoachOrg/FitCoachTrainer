/**
 * Workout Plan Import Utilities
 * 
 * This module provides comprehensive import functionality for workout plans,
 * including CSV, Excel, and JSON formats with validation and data processing.
 * 
 * NEW FEATURES:
 * - No date validation required
 * - Enhanced numeric conversion with range support
 * - Start date mapping functionality
 */

import * as XLSX from 'xlsx';
import { normalizeDateForStorage } from './date-utils';

// Types for import data
export interface ImportableExercise {
  date: string;
  day_name: string;
  focus: string;
  exercise: string;
  category: string;
  body_part: string;
  sets: number | string;
  reps: string;
  duration: number | string;
  rest: number | string;
  weight: string;
  equipment: string;
  coach_tip: string;
  video_link: string;
  other_details: string;
}

export interface ImportableWorkoutPlan {
  client_id: number;
  plan_start_date: string;
  plan_end_date: string;
  total_exercises: number;
  total_workout_days: number;
  exercises: ImportableExercise[];
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: ImportableWorkoutPlan;
  preview?: ImportableExercise[];
}

export interface ImportPreviewData {
  totalExercises: number;
  totalDays: number;
  dateRange: { start: string; end: string };
  exercisesByDay: Record<string, ImportableExercise[]>;
  validationErrors: string[];
  validationWarnings: string[];
  conflictingDates: string[];
  mappedDateRange?: { start: string; end: string }; // NEW: For mapped dates
}

/**
 * Enhanced numeric field conversion with range support
 * Handles formats like "3-8", "3 to 8", "3 sets", etc.
 */
export function convertNumericField(
  value: any, 
  fieldName: string, 
  rowIndex: number
): { value: number | string, error?: string } {
  if (value === null || value === undefined || value === '') {
    return { value: '' };
  }

  const strValue = String(value).trim();
  
  // Handle range format (e.g., "3-8", "3 to 8", "3-5 sets")
  const rangeMatch = strValue.match(/(\d+)\s*[-–—to]\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    if (min <= max) {
      return { value: `${min}-${max}` }; // Keep as range string
    } else {
      return { 
        value: value, 
        error: `Row ${rowIndex}, Column '${fieldName}' has invalid range: '${value}' (min > max)` 
      };
    }
  }
  
  // Handle single number (e.g., "3", "3 sets", "5 minutes")
  const numberMatch = strValue.match(/(\d+)/);
  if (numberMatch) {
    return { value: parseInt(numberMatch[1]) };
  }
  
  // Conversion failed - return specific error
  return { 
    value: value, 
    error: `Row ${rowIndex}, Column '${fieldName}' contains non-numeric value: '${value}'` 
  };
}

/**
 * Parse CSV file content
 */
export function parseCSVFile(fileContent: string): ImportableExercise[] {
  console.log('📄 [parseCSVFile] Starting CSV parsing...');
  console.log('📄 [parseCSVFile] File content length:', fileContent.length);
  
  const exercises: ImportableExercise[] = [];
  
  // Parse CSV with proper handling of quoted fields containing newlines
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  // First, properly split the content handling quoted fields
  for (let i = 0; i < fileContent.length; i++) {
    const char = fileContent[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  console.log('📄 [parseCSVFile] Total lines after proper splitting:', lines.length);
  
  if (lines.length === 0) {
    console.log('❌ [parseCSVFile] No lines found in file');
    return exercises;
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('📄 [parseCSVFile] Headers:', headers);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= headers.length) {
      const exercise: any = {};
      headers.forEach((header, index) => {
        exercise[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
      });
      
      exercises.push(normalizeExerciseData(exercise, i + 1)); // Pass row number for error reporting
    } else {
      console.log(`⚠️ [parseCSVFile] Line ${i + 1} has ${values.length} values but expected ${headers.length}:`, values);
    }
  }

  console.log('📄 [parseCSVFile] Parsed exercises:', exercises.length);
  return exercises;
}

/**
 * Parse Excel file content
 */
export function parseExcelFile(fileContent: ArrayBuffer): ImportableExercise[] {
  const workbook = XLSX.read(fileContent, { type: 'buffer' });
  const exercises: ImportableExercise[] = [];

  // Try to find the exercises sheet
  let sheetName = 'Exercises';
  if (!workbook.SheetNames.includes(sheetName)) {
    // Try alternative sheet names
    const alternatives = ['Sheet1', 'Workout Plan', 'Exercises', 'Data'];
    sheetName = alternatives.find(name => workbook.SheetNames.includes(name)) || workbook.SheetNames[0];
  }

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length < 2) return exercises;

  const headers = (data[0] as string[]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;

    const exercise: any = {};
    headers.forEach((header, index) => {
      exercise[header] = row[index] || '';
    });

    exercises.push(normalizeExerciseData(exercise, i + 1)); // Pass row number for error reporting
  }

  return exercises;
}

/**
 * Parse JSON file content
 */
export function parseJSONFile(fileContent: string): ImportableExercise[] {
  try {
    const data = JSON.parse(fileContent);
    
    // Handle different JSON structures
    if (data.exercises && Array.isArray(data.exercises)) {
      return data.exercises.map((exercise: any, index: number) => 
        normalizeExerciseData(exercise, index + 1)
      );
    } else if (Array.isArray(data)) {
      return data.map((exercise: any, index: number) => 
        normalizeExerciseData(exercise, index + 1)
      );
    } else {
      throw new Error('Invalid JSON structure');
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

/**
 * Normalize exercise data to standard format with enhanced numeric conversion
 */
function normalizeExerciseData(data: any, rowIndex: number): ImportableExercise {
  // Convert numeric fields with enhanced error reporting
  const setsConversion = convertNumericField(data.sets || data.sets_count, 'Sets', rowIndex);
  const durationConversion = convertNumericField(data.duration || data.time || data.duration_min, 'Duration', rowIndex);
  const restConversion = convertNumericField(data.rest || data.rest_sec, 'Rest', rowIndex);

  return {
    date: String(data.date || data.for_date || ''), // No date validation required
    day_name: String(data.day_name || data.day || ''),
    focus: String(data.focus || data.workout_focus || 'Workout'),
    exercise: String(data.exercise || data.workout || data.name || ''),
    category: String(data.category || data.exercise_category || ''),
    body_part: String(data.body_part || data.bodypart || ''),
    sets: setsConversion.value,
    reps: String(data.reps || ''),
    duration: durationConversion.value,
    rest: restConversion.value,
    weight: String(data.weight || data.weights || ''),
    equipment: String(data.equipment || ''),
    coach_tip: String(data.coach_tip || data.tips || ''),
    video_link: String(data.video_link || data.workout_yt_link || ''),
    other_details: String(data.other_details || data.notes || '')
  };
}

/**
 * Validate imported exercise data (UPDATED - No date validation)
 */
export function validateImportedData(exercises: ImportableExercise[]): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validExercises: ImportableExercise[] = [];

  if (exercises.length === 0) {
    errors.push('No exercises found in the imported file');
    return { isValid: false, errors, warnings };
  }

  // Validate each exercise
  exercises.forEach((exercise, index) => {
    const exerciseErrors: string[] = [];
    const exerciseWarnings: string[] = [];

    // Required fields validation (exercise name only)
    if (!exercise.exercise || String(exercise.exercise).trim() === '') {
      exerciseErrors.push(`Exercise ${index + 1}: Missing exercise name`);
    }

    // Enhanced numeric field validation with specific error reporting
    if (exercise.sets !== '' && exercise.sets !== null && exercise.sets !== undefined) {
      const setsConversion = convertNumericField(exercise.sets, 'Sets', index + 1);
      if (setsConversion.error) {
        exerciseErrors.push(setsConversion.error);
      }
    }

    if (exercise.duration !== '' && exercise.duration !== null && exercise.duration !== undefined) {
      const durationConversion = convertNumericField(exercise.duration, 'Duration', index + 1);
      if (durationConversion.error) {
        exerciseErrors.push(durationConversion.error);
      }
    }

    if (exercise.rest !== '' && exercise.rest !== null && exercise.rest !== undefined) {
      const restConversion = convertNumericField(exercise.rest, 'Rest', index + 1);
      if (restConversion.error) {
        exerciseErrors.push(restConversion.error);
      }
    }

    // Add exercise-specific errors to main errors
    errors.push(...exerciseErrors);
    warnings.push(...exerciseWarnings);

    // Only add valid exercises
    if (exerciseErrors.length === 0) {
      validExercises.push(exercise);
    }
  });

  // Check for duplicate exercises on same date (warning only)
  const dateGroups = validExercises.reduce((acc, exercise) => {
    if (!acc[exercise.date]) acc[exercise.date] = [];
    acc[exercise.date].push(exercise);
    return acc;
  }, {} as Record<string, ImportableExercise[]>);

  Object.entries(dateGroups).forEach(([date, exercises]) => {
    const exerciseNames = exercises.map(e => e.exercise.toLowerCase());
    const duplicates = exerciseNames.filter((name, index) => exerciseNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate exercises found on ${date}: ${[...new Set(duplicates)].join(', ')}`);
    }
  });

  const isValid = errors.length === 0;
  
  if (isValid && validExercises.length > 0) {
    const planData = prepareImportData(validExercises);
    return {
      isValid: true,
      errors,
      warnings,
      data: planData,
      preview: validExercises.slice(0, 10) // First 10 exercises for preview
    };
  }

  return { isValid, errors, warnings };
}

/**
 * Map exercises to client's workout days starting from a specific date
 * ENHANCED: Maps ALL exercises to consecutive workout days (not limited to one week)
 */
export function mapExercisesToWorkoutDays(
  exercises: ImportableExercise[],
  startDate: Date,
  workoutDays: string[]
): ImportableExercise[] {
  if (!workoutDays || workoutDays.length === 0) {
    throw new Error('No workout days configured for client');
  }

  console.log('🗓️ [mapExercisesToWorkoutDays] Starting mapping...');
  console.log('🗓️ [mapExercisesToWorkoutDays] Start date:', startDate);
  console.log('🗓️ [mapExercisesToWorkoutDays] Workout days:', workoutDays);
  console.log('🗓️ [mapExercisesToWorkoutDays] Total exercises:', exercises.length);
  console.log('🗓️ [mapExercisesToWorkoutDays] Sample exercise dates:', exercises.slice(0, 5).map(ex => ex.date));

  // Group exercises by their original date (each unique date becomes a workout day)
  const exercisesByDay: Record<string, ImportableExercise[]> = {};
  exercises.forEach((exercise) => {
    const dayKey = exercise.date || 'unknown_date';
    if (!exercisesByDay[dayKey]) {
      exercisesByDay[dayKey] = [];
    }
    exercisesByDay[dayKey].push(exercise);
  });

  const mappedExercises: ImportableExercise[] = [];
  const dayKeys = Object.keys(exercisesByDay).sort(); // Sort dates chronologically
  let currentDate = new Date(startDate); // Use a mutable date object

  console.log('🗓️ [mapExercisesToWorkoutDays] Unique dates found:', dayKeys);
  console.log('🗓️ [mapExercisesToWorkoutDays] Total unique workout days to map:', dayKeys.length);

  dayKeys.forEach((dayKey, dayIndex) => {
    // Find the next workout day
    while (!workoutDays.includes(currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const targetDateStr = currentDate.toISOString().slice(0, 10);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    console.log(`🗓️ [mapExercisesToWorkoutDays] Mapping original date ${dayKey} (day ${dayIndex + 1}) to ${dayName} (${targetDateStr})`);

    // Map exercises for this day
    exercisesByDay[dayKey].forEach(exercise => {
      mappedExercises.push({
        ...exercise,
        date: targetDateStr,
        day_name: dayName
      });
    });

    // Move to the next day for the next iteration, to find the next workout day
    currentDate.setDate(currentDate.getDate() + 1);
  });

  console.log('🗓️ [mapExercisesToWorkoutDays] Mapping complete. Total mapped exercises:', mappedExercises.length);
  console.log('🗓️ [mapExercisesToWorkoutDays] Final date range:', {
    start: mappedExercises[0]?.date,
    end: mappedExercises[mappedExercises.length - 1]?.date
  });

  return mappedExercises;
}

/**
 * Check for existing exercises in the date range before import
 * NEW FUNCTION: Detects conflicts with existing exercises
 */
export async function checkForExistingExercises(
  clientId: number,
  startDate: string,
  endDate: string
): Promise<{
  hasConflicts: boolean;
  conflictingDates: string[];
  dateRange: { start: string; end: string };
}> {
  try {
    console.log('🔍 [checkForExistingExercises] Checking for conflicts...');
    console.log('🔍 [checkForExistingExercises] Client ID:', clientId);
    console.log('🔍 [checkForExistingExercises] Date range:', startDate, 'to', endDate);

    // Import supabase here to avoid circular dependencies
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Query for existing exercises in the date range
    const { data: existingExercises, error } = await supabase
      .from('schedule_preview')
      .select('for_date')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDate)
      .lte('for_date', endDate);

    if (error) {
      console.error('🔍 [checkForExistingExercises] Database error:', error);
      throw error;
    }

    // Extract unique dates that have conflicts
    const conflictingDates = [...new Set(existingExercises?.map(ex => ex.for_date) || [])];
    const hasConflicts = conflictingDates.length > 0;

    console.log('🔍 [checkForExistingExercises] Conflicts found:', hasConflicts);
    console.log('🔍 [checkForExistingExercises] Conflicting dates:', conflictingDates);

    return {
      hasConflicts,
      conflictingDates,
      dateRange: { start: startDate, end: endDate }
    };
  } catch (error) {
    console.error('🔍 [checkForExistingExercises] Error checking conflicts:', error);
    // Return no conflicts on error to allow import to proceed
    return {
      hasConflicts: false,
      conflictingDates: [],
      dateRange: { start: startDate, end: endDate }
    };
  }
}

/**
 * Prepare import data for database insertion
 */
function prepareImportData(exercises: ImportableExercise[]): ImportableWorkoutPlan {
  // Group exercises by date
  const exercisesByDate = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.date]) acc[exercise.date] = [];
    acc[exercise.date].push(exercise);
    return acc;
  }, {} as Record<string, ImportableExercise[]>);

  const dates = Object.keys(exercisesByDate).sort();
  const planStartDate = dates[0] || new Date().toISOString().slice(0, 10);
  const planEndDate = dates[dates.length - 1] || planStartDate;

  return {
    client_id: 0, // Will be set during import
    plan_start_date: planStartDate,
    plan_end_date: planEndDate,
    total_exercises: exercises.length,
    total_workout_days: dates.length,
    exercises
  };
}

/**
 * Create import preview data (UPDATED for new mapping functionality)
 */
export function createImportPreview(
  exercises: ImportableExercise[],
  mappedExercises?: ImportableExercise[]
): ImportPreviewData {
  const exercisesToShow = mappedExercises || exercises;
  const exercisesByDay = exercisesToShow.reduce((acc, exercise) => {
    if (!acc[exercise.date]) acc[exercise.date] = [];
    acc[exercise.date].push(exercise);
    return acc;
  }, {} as Record<string, ImportableExercise[]>);

  const dates = Object.keys(exercisesByDay).sort();
  const validation = validateImportedData(exercises);

  // Calculate the complete date range including rest days
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  let totalDays = 0;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  return {
    totalExercises: exercises.length,
    totalDays: totalDays,
    dateRange: {
      start: startDate || '',
      end: endDate || ''
    },
    exercisesByDay,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    conflictingDates: [], // Will be populated by the import component
    mappedDateRange: mappedExercises ? {
      start: startDate || '',
      end: endDate || ''
    } : undefined
  };
}

/**
 * Convert imported data to workout plan format with start date mapping
 * UPDATED: Now supports start date mapping to workout days
 */
export function convertToWorkoutPlanFormat(
  exercises: ImportableExercise[],
  clientId: number,
  planStartDate: Date,
  workoutDays?: string[]
): {
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>;
  dateRange: {
    start: string;
    end: string;
  };
} {
  let processedExercises = exercises;

  // If workout days are provided, map exercises to workout days
  if (workoutDays && workoutDays.length > 0) {
    try {
      processedExercises = mapExercisesToWorkoutDays(exercises, planStartDate, workoutDays);
    } catch (error) {
      console.warn('Failed to map exercises to workout days:', error);
      // Fall back to original exercises
    }
  }

  // Group exercises by date
  const exercisesByDate = processedExercises.reduce((acc, exercise) => {
    if (!acc[exercise.date]) {
      acc[exercise.date] = {
        date: exercise.date,
        focus: exercise.focus || 'Workout',
        exercises: []
      };
    }
    acc[exercise.date].exercises.push({
      exercise: exercise.exercise,
      category: exercise.category,
      body_part: exercise.body_part,
      sets: exercise.sets,
      reps: exercise.reps,
      duration: exercise.duration,
      rest: exercise.rest,
      weight: exercise.weight,
      equipment: exercise.equipment,
      coach_tip: exercise.coach_tip,
      video_link: exercise.video_link,
      other_details: exercise.other_details
    });
    return acc;
  }, {} as Record<string, any>);

  // Get all unique dates and sort them
  const csvDates = Object.keys(exercisesByDate).sort();
  const startDate = csvDates[0];
  const endDate = csvDates[csvDates.length - 1];

  // Create a complete date range from start to end date
  const weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }> = [];

  if (startDate && endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    // Generate all dates from start to end
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = normalizeDateForStorage(d.toISOString().slice(0, 10));
      
      if (exercisesByDate[dateStr]) {
        weekData.push(exercisesByDate[dateStr]);
      } else {
        weekData.push({
          date: dateStr,
          focus: 'Rest Day',
          exercises: []
        });
      }
    }
  }

  return {
    weekData,
    dateRange: {
      start: startDate || '',
      end: endDate || ''
    }
  };
} 