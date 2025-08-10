/**
 * Workout Plan Export Utilities
 * 
 * This module provides comprehensive export functionality for workout plans,
 * including CSV and Excel formats with all workout data fields.
 */

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// Types for export data
export interface ExportableExercise {
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

export interface ExportableWorkoutPlan {
  client_id: number;
  plan_start_date: string;
  plan_end_date: string;
  total_exercises: number;
  total_workout_days: number;
  exercises: ExportableExercise[];
}

/**
 * Convert workout plan data to exportable format
 */
export function prepareWorkoutPlanForExport(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date
): ExportableWorkoutPlan {
  const exercises: ExportableExercise[] = [];
  let totalWorkoutDays = 0;

  // Process each day in the week
  weekData.forEach((day, dayIndex) => {
    if (day && day.exercises && day.exercises.length > 0) {
      totalWorkoutDays++;
      
      // Calculate the actual date for this day
      const currentDate = new Date(planStartDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().slice(0, 10);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Process each exercise for this day
      day.exercises.forEach((exercise: any) => {
        const exportableExercise: ExportableExercise = {
          date: dateStr,
          day_name: dayName,
          focus: day.focus || 'Workout',
          exercise: exercise.exercise || exercise.workout || '',
          category: exercise.category || '',
          body_part: exercise.body_part || '',
          sets: exercise.sets || '',
          reps: exercise.reps || '',
          duration: exercise.duration || exercise.time || '',
          rest: exercise.rest || '',
          weight: exercise.weight || exercise.weights || '',
          equipment: exercise.equipment || '',
          coach_tip: exercise.coach_tip || '',
          video_link: exercise.video_link || exercise.workout_yt_link || '',
          other_details: exercise.other_details || ''
        };
        
        exercises.push(exportableExercise);
      });
    }
  });

  const planEndDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

  return {
    client_id: clientId,
    plan_start_date: planStartDate.toISOString().slice(0, 10),
    plan_end_date: planEndDate.toISOString().slice(0, 10),
    total_exercises: exercises.length,
    total_workout_days: totalWorkoutDays,
    exercises
  };
}

/**
 * Export workout plan as CSV
 */
export function exportWorkoutPlanAsCSV(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  clientName?: string
): void {
  const exportData = prepareWorkoutPlanForExport(weekData, clientId, planStartDate);
  
  // Create CSV headers
  const headers = [
    'Date',
    'Day',
    'Focus',
    'Exercise',
    'Category',
    'Body Part',
    'Sets',
    'Reps',
    'Duration (min)',
    'Rest (sec)',
    'Weight',
    'Equipment',
    'Coach Tip',
    'Video Link',
    'Other Details'
  ];

  // Create CSV rows
  const csvRows = [headers];
  
  exportData.exercises.forEach(exercise => {
    csvRows.push([
      exercise.date,
      exercise.day_name,
      exercise.focus,
      exercise.exercise,
      exercise.category,
      exercise.body_part,
      exercise.sets.toString(),
      exercise.reps,
      exercise.duration.toString(),
      exercise.rest.toString(),
      exercise.weight,
      exercise.equipment,
      exercise.coach_tip,
      exercise.video_link,
      exercise.other_details
    ]);
  });

  // Convert to CSV string
  const csvContent = csvRows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `workout_plan_${clientName || clientId}_${exportData.plan_start_date}.csv`;
  saveAs(blob, fileName);
}

/**
 * Export workout plan as Excel with multiple sheets
 */
export function exportWorkoutPlanAsExcel(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  clientName?: string
): void {
  const exportData = prepareWorkoutPlanForExport(weekData, clientId, planStartDate);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ['Workout Plan Overview'],
    [''],
    ['Client ID:', exportData.client_id],
    ['Client Name:', clientName || 'N/A'],
    ['Plan Start Date:', exportData.plan_start_date],
    ['Plan End Date:', exportData.plan_end_date],
    ['Total Exercises:', exportData.total_exercises],
    ['Total Workout Days:', exportData.total_workout_days],
    [''],
    ['Plan Summary:'],
    ['This plan includes exercises for strength training, cardio, and recovery.'],
    ['Each exercise includes sets, reps, duration, and coach tips for proper form.']
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Sheet 2: Exercises
  const exerciseHeaders = [
    'Date',
    'Day',
    'Focus',
    'Exercise',
    'Category',
    'Body Part',
    'Sets',
    'Reps',
    'Duration (min)',
    'Rest (sec)',
    'Weight',
    'Equipment',
    'Coach Tip',
    'Video Link',
    'Other Details'
  ];

  const exerciseData = [exerciseHeaders];
  exportData.exercises.forEach(exercise => {
    exerciseData.push([
      exercise.date,
      exercise.day_name,
      exercise.focus,
      exercise.exercise,
      exercise.category,
      exercise.body_part,
      exercise.sets,
      exercise.reps,
      exercise.duration,
      exercise.rest,
      exercise.weight,
      exercise.equipment,
      exercise.coach_tip,
      exercise.video_link,
      exercise.other_details
    ]);
  });

  const exerciseSheet = XLSX.utils.aoa_to_sheet(exerciseData);
  XLSX.utils.book_append_sheet(workbook, exerciseSheet, 'Exercises');

  // Sheet 3: Weekly Summary
  const weeklySummary = [
    ['Weekly Summary'],
    [''],
    ['Day', 'Date', 'Focus', 'Exercise Count', 'Total Duration (min)']
  ];

  // Group exercises by day
  const exercisesByDay = exportData.exercises.reduce((acc, exercise) => {
    if (!acc[exercise.date]) {
      acc[exercise.date] = {
        day_name: exercise.day_name,
        focus: exercise.focus,
        exercises: [],
        totalDuration: 0
      };
    }
    acc[exercise.date].exercises.push(exercise);
    acc[exercise.date].totalDuration += Number(exercise.duration) || 0;
    return acc;
  }, {} as Record<string, any>);

  Object.entries(exercisesByDay).forEach(([date, dayData]) => {
    weeklySummary.push([
      dayData.day_name,
      date,
      dayData.focus,
      dayData.exercises.length,
      dayData.totalDuration
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(weeklySummary);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Weekly Summary');

  // Export file
  const fileName = `workout_plan_${clientName || clientId}_${exportData.plan_start_date}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export workout plan as JSON (for backup/import purposes)
 */
export function exportWorkoutPlanAsJSON(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  clientName?: string
): void {
  const exportData = prepareWorkoutPlanForExport(weekData, clientId, planStartDate);
  
  const jsonData = {
    metadata: {
      export_date: new Date().toISOString(),
      client_id: exportData.client_id,
      client_name: clientName,
      plan_start_date: exportData.plan_start_date,
      plan_end_date: exportData.plan_end_date,
      total_exercises: exportData.total_exercises,
      total_workout_days: exportData.total_workout_days
    },
    exercises: exportData.exercises
  };

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
    type: 'application/json;charset=utf-8;' 
  });
  const fileName = `workout_plan_${clientName || clientId}_${exportData.plan_start_date}.json`;
  saveAs(blob, fileName);
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(
  clientId: number,
  clientName?: string,
  format: 'csv' | 'xlsx' | 'json' = 'csv'
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const name = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '_') : `client_${clientId}`;
  return `workout_plan_${name}_${timestamp}.${format}`;
} 