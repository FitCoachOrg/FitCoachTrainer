/**
 * Workout Plan Export Utilities
 * 
 * This module provides comprehensive export functionality for workout plans,
 * including CSV and Excel formats with all workout data fields.
 * Supports both 7-day (weekly) and 30-day (monthly) plan durations.
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
 * Supports both 7-day (weekly) and 30-day (monthly) plans
 */
export function prepareWorkoutPlanForExport(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  viewMode: 'weekly' | 'monthly' = 'weekly'
): ExportableWorkoutPlan {
  const exercises: ExportableExercise[] = [];
  let totalWorkoutDays = 0;

  // Determine the number of days to process based on view mode
  const totalDays = viewMode === 'monthly' ? 28 : 7; // 28 days for monthly (4 weeks), 7 days for weekly

  // Process each day in the plan
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

  // Calculate plan end date based on view mode
  const daysToAdd = viewMode === 'monthly' ? 27 : 6; // 27 for 28-day plan, 6 for 7-day plan
  const planEndDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

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
 * Supports both 7-day (weekly) and 30-day (monthly) plans
 */
export function exportWorkoutPlanAsCSV(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  clientName?: string,
  viewMode: 'weekly' | 'monthly' = 'weekly'
): void {
  const exportData = prepareWorkoutPlanForExport(weekData, clientId, planStartDate, viewMode);
  
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

  // Create and download file with duration indicator
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const durationSuffix = viewMode === 'monthly' ? '_30day' : '_7day';
  const fileName = `workout_plan_${clientName || clientId}_${exportData.plan_start_date}${durationSuffix}.csv`;
  saveAs(blob, fileName);
}

/**
 * Export workout plan as Excel with multiple sheets
 * Supports both 7-day (weekly) and 30-day (monthly) plans
 */
export function exportWorkoutPlanAsExcel(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  clientName?: string,
  viewMode: 'weekly' | 'monthly' = 'weekly'
): void {
  const exportData = prepareWorkoutPlanForExport(weekData, clientId, planStartDate, viewMode);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview
  const planDuration = viewMode === 'monthly' ? '30-Day (4 Weeks)' : '7-Day (1 Week)';
  const overviewData = [
    ['Workout Plan Overview'],
    [''],
    ['Client ID:', exportData.client_id],
    ['Client Name:', clientName || 'N/A'],
    ['Plan Duration:', planDuration],
    ['Plan Start Date:', exportData.plan_start_date],
    ['Plan End Date:', exportData.plan_end_date],
    ['Total Exercises:', exportData.total_exercises],
    ['Total Workout Days:', exportData.total_workout_days],
    [''],
    ['Plan Summary:'],
    [`This ${planDuration.toLowerCase()} plan includes exercises for strength training, cardio, and recovery.`],
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

  // Sheet 3: Weekly Summary (for monthly view) or Daily Summary (for weekly view)
  const summaryTitle = viewMode === 'monthly' ? 'Monthly Summary' : 'Weekly Summary';
  const summaryHeaders = viewMode === 'monthly' 
    ? ['Week', 'Day', 'Date', 'Focus', 'Exercise Count', 'Total Duration (min)']
    : ['Day', 'Date', 'Focus', 'Exercise Count', 'Total Duration (min)'];

  const summaryData = [
    [summaryTitle],
    [''],
    summaryHeaders
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

  // Add week information for monthly view
  Object.entries(exercisesByDay).forEach(([date, dayData]) => {
    const currentDate = new Date(date);
    const weekNumber = viewMode === 'monthly' 
      ? Math.floor((currentDate.getTime() - planStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
      : null;
    
    const row = viewMode === 'monthly'
      ? [
          `Week ${weekNumber}`,
          dayData.day_name,
          date,
          dayData.focus,
          dayData.exercises.length,
          dayData.totalDuration
        ]
      : [
          dayData.day_name,
          date,
          dayData.focus,
          dayData.exercises.length,
          dayData.totalDuration
        ];
    
    summaryData.push(row);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  const summarySheetName = viewMode === 'monthly' ? 'Monthly Summary' : 'Weekly Summary';
  XLSX.utils.book_append_sheet(workbook, summarySheet, summarySheetName);

  // Export file with duration indicator
  const durationSuffix = viewMode === 'monthly' ? '_30day' : '_7day';
  const fileName = `workout_plan_${clientName || clientId}_${exportData.plan_start_date}${durationSuffix}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export workout plan as JSON (for backup/import purposes)
 * Supports both 7-day (weekly) and 30-day (monthly) plans
 */
export function exportWorkoutPlanAsJSON(
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>,
  clientId: number,
  planStartDate: Date,
  clientName?: string,
  viewMode: 'weekly' | 'monthly' = 'weekly'
): void {
  const exportData = prepareWorkoutPlanForExport(weekData, clientId, planStartDate, viewMode);
  
  const planDuration = viewMode === 'monthly' ? '30-Day (4 Weeks)' : '7-Day (1 Week)';
  
  const jsonData = {
    metadata: {
      export_date: new Date().toISOString(),
      client_id: exportData.client_id,
      client_name: clientName,
      plan_duration: planDuration,
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
  const durationSuffix = viewMode === 'monthly' ? '_30day' : '_7day';
  const fileName = `workout_plan_${clientName || clientId}_${exportData.plan_start_date}${durationSuffix}.json`;
  saveAs(blob, fileName);
}

/**
 * Generate export filename with timestamp and duration indicator
 */
export function generateExportFilename(
  clientId: number,
  clientName?: string,
  format: 'csv' | 'xlsx' | 'json' = 'csv',
  viewMode: 'weekly' | 'monthly' = 'weekly'
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const name = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '_') : `client_${clientId}`;
  const durationSuffix = viewMode === 'monthly' ? '_30day' : '_7day';
  return `workout_plan_${name}_${timestamp}${durationSuffix}.${format}`;
} 