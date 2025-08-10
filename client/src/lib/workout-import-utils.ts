/**
 * Workout Plan Import Utilities
 * 
 * This module provides comprehensive import functionality for workout plans,
 * including CSV, Excel, and JSON formats with validation and data processing.
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
}

/**
 * Parse CSV file content
 */
export function parseCSVFile(fileContent: string): ImportableExercise[] {
  const lines = fileContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const exercises: ImportableExercise[] = [];

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
      
      exercises.push(normalizeExerciseData(exercise));
    }
  }

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

    exercises.push(normalizeExerciseData(exercise));
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
      return data.exercises.map(normalizeExerciseData);
    } else if (Array.isArray(data)) {
      return data.map(normalizeExerciseData);
    } else {
      throw new Error('Invalid JSON structure');
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

/**
 * Normalize exercise data to standard format
 */
function normalizeExerciseData(data: any): ImportableExercise {
  return {
    date: normalizeDateForStorage(String(data.date || data.for_date || '')),
    day_name: String(data.day_name || data.day || ''),
    focus: String(data.focus || data.workout_focus || 'Workout'),
    exercise: String(data.exercise || data.workout || data.name || ''),
    category: String(data.category || data.exercise_category || ''),
    body_part: String(data.body_part || data.bodypart || ''),
    sets: data.sets || '',
    reps: String(data.reps || ''),
    duration: data.duration || data.time || '',
    rest: data.rest || '',
    weight: String(data.weight || data.weights || ''),
    equipment: String(data.equipment || ''),
    coach_tip: String(data.coach_tip || data.tips || ''),
    video_link: String(data.video_link || data.workout_yt_link || ''),
    other_details: String(data.other_details || data.notes || '')
  };
}

/**
 * Validate imported exercise data
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

    // Required fields validation
    if (!exercise.exercise || String(exercise.exercise).trim() === '') {
      exerciseErrors.push(`Exercise ${index + 1}: Missing exercise name`);
    }

    if (!exercise.date || String(exercise.date).trim() === '') {
      exerciseErrors.push(`Exercise ${index + 1}: Missing date`);
    }

    // Date format validation
    if (exercise.date && !isValidDate(String(exercise.date))) {
      exerciseErrors.push(`Exercise ${index + 1}: Invalid date format (${exercise.date})`);
    }

    // Numeric field validation
    if (exercise.sets && isNaN(Number(exercise.sets))) {
      exerciseWarnings.push(`Exercise ${index + 1}: Invalid sets value (${exercise.sets})`);
    }

    if (exercise.duration && isNaN(Number(exercise.duration))) {
      exerciseWarnings.push(`Exercise ${index + 1}: Invalid duration value (${exercise.duration})`);
    }

    if (exercise.rest && isNaN(Number(exercise.rest))) {
      exerciseWarnings.push(`Exercise ${index + 1}: Invalid rest value (${exercise.rest})`);
    }

    // Add exercise-specific errors to main errors
    errors.push(...exerciseErrors);
    warnings.push(...exerciseWarnings);

    // Only add valid exercises
    if (exerciseErrors.length === 0) {
      validExercises.push(exercise);
    }
  });

  // Check for duplicate exercises on same date
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
 * Create import preview data
 */
export function createImportPreview(exercises: ImportableExercise[]): ImportPreviewData {
  const exercisesByDay = exercises.reduce((acc, exercise) => {
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
    conflictingDates: [] // Will be populated by the import component
  };
}

/**
 * Validate date format
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convert imported data to workout plan format using CSV dates
 */
export function convertToWorkoutPlanFormat(
  exercises: ImportableExercise[],
  clientId: number,
  planStartDate: Date
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
  // Group exercises by date
  const exercisesByDate = exercises.reduce((acc, exercise) => {
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

  // Get all unique dates from CSV and sort them
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