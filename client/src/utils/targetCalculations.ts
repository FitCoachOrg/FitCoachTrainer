// targetCalculations.ts
// Target calculation utilities for trainer-side onboarding

import { saveClientTarget } from './supabaseClient';

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} sex - 'male' or 'female'
 * @returns {number} BMR in calories
 */
export const calculateBMR = (weight: number, height: number, age: number, sex: string) => {
  const isMale = sex.toLowerCase() === 'male';
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (isMale ? 5 : -161);
  return Math.round(bmr);
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level
 * @returns {number} TDEE in calories
 */
export const calculateTDEE = (bmr: number, activityLevel: string) => {
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'active': 1.55,
    'very_active': 1.725
  };

  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate calorie target based on fitness goal
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - Primary fitness goal
 * @returns {number} Calorie target
 */
export const calculateCalorieTarget = (tdee: number, goal: string) => {
  const goalAdjustments: Record<string, number> = {
    'lose_fat': -500, // 500 calorie deficit
    'build_muscle': 300, // 300 calorie surplus
    'increase_strength': 200, // 200 calorie surplus
    'improve_endurance': 0, // Maintenance
    'improve_flexibility': 0, // Maintenance
    'boost_energy': 0, // Maintenance
    'improve_health': 0 // Maintenance
  };

  const adjustment = goalAdjustments[goal] || 0;
  return Math.round(tdee + adjustment);
};

/**
 * Calculate macro targets based on calorie target and goal
 * @param {number} calorieTarget - Daily calorie target
 * @param {string} goal - Primary fitness goal
 * @param {string} activityLevel - Activity level
 * @returns {Object} Macro targets in grams
 */
export const calculateMacroTargets = (calorieTarget: number, goal: string, activityLevel: string) => {
  let proteinRatio: number, fatRatio: number, carbRatio: number;

  switch (goal) {
    case 'lose_fat':
      proteinRatio = 0.35; // 35% protein
      fatRatio = 0.30; // 30% fat
      carbRatio = 0.35; // 35% carbs
      break;
    case 'build_muscle':
      proteinRatio = 0.30; // 30% protein
      fatRatio = 0.25; // 25% fat
      carbRatio = 0.45; // 45% carbs
      break;
    case 'increase_strength':
      proteinRatio = 0.30; // 30% protein
      fatRatio = 0.25; // 25% fat
      carbRatio = 0.45; // 45% carbs
      break;
    default:
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.30; // 30% fat
      carbRatio = 0.45; // 45% carbs
  }

  const protein = Math.round((calorieTarget * proteinRatio) / 4); // 4 cal/g
  const fat = Math.round((calorieTarget * fatRatio) / 9); // 9 cal/g
  const carbs = Math.round((calorieTarget * carbRatio) / 4); // 4 cal/g

  return { protein, fat, carbs };
};

/**
 * Calculate hydration target
 * @param {number} weight - Weight in kg
 * @param {string} activityLevel - Activity level
 * @param {number} trainingDays - Number of training days per week
 * @param {number} sleepHours - Hours of sleep per night
 * @returns {number} Hydration target in liters
 */
export const calculateHydrationTarget = (weight: number, activityLevel: string, trainingDays: number, sleepHours: number) => {
  // Base hydration: 30ml per kg of body weight
  let baseHydration = weight * 0.03;

  // Activity level adjustments
  const activityAdjustments: Record<string, number> = {
    'sedentary': 0,
    'lightly_active': 0.5,
    'active': 1.0,
    'very_active': 1.5
  };

  const activityAdjustment = activityAdjustments[activityLevel] || 0;

  // Training days adjustment
  const trainingAdjustment = trainingDays * 0.3;

  // Sleep adjustment (less sleep = more hydration needed)
  const sleepAdjustment = Math.max(0, (8 - sleepHours) * 0.2);

  const totalHydration = baseHydration + activityAdjustment + trainingAdjustment + sleepAdjustment;
  return Math.round(totalHydration * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate BMI
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} BMI value
 */
export const calculateBMI = (weight: number, height: number) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate workout target based on training days
 * @param {number} trainingDays - Number of training days per week
 * @returns {Object} Workout targets
 */
export const calculateWorkoutTarget = (trainingDays: number) => {
  const weeklyWorkouts = trainingDays;
  const monthlyWorkouts = trainingDays * 4;
  const yearlyWorkouts = trainingDays * 52;

  return {
    weekly: weeklyWorkouts,
    monthly: monthlyWorkouts,
    yearly: yearlyWorkouts
  };
};

/**
 * Save BMR to database
 * @param {string} clientId - Client ID
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} sex - Biological sex
 * @returns {Promise<number>} BMR value
 */
export const calculateAndStoreBMR = async (clientId: string, weight: number, height: number, age: number, sex: string) => {
  try {
    const bmr = calculateBMR(weight, height, age, sex);
    const saveSuccess = await saveClientTarget(clientId, 'bmr', bmr);
    
    if (saveSuccess) {
      console.log(`BMR calculated and stored: ${bmr} calories`);
    } else {
      console.log(`BMR calculated: ${bmr} calories (not stored - table may not exist)`);
    }
    
    return bmr;
  } catch (error) {
    console.error('Error calculating BMR:', error);
    // Still return the calculated value even if saving fails
    const bmr = calculateBMR(weight, height, age, sex);
    console.log(`BMR calculated: ${bmr} calories (saving failed)`);
    return bmr;
  }
};

/**
 * Save calorie target to database
 * @param {string} clientId - Client ID
 * @param {Object} clientData - Client data
 * @param {number} bmr - BMR value
 * @param {string} activityLevel - Activity level
 * @param {string} goal - Primary fitness goal
 * @returns {Promise<number>} Calorie target
 */
export const calculateAndStoreCalorieTarget = async (clientId: string, clientData: any, bmr: number, activityLevel: string, goal: string) => {
  try {
    const tdee = calculateTDEE(bmr, activityLevel);
    const calorieTarget = calculateCalorieTarget(tdee, goal);
    const saveSuccess = await saveClientTarget(clientId, 'calories', calorieTarget);
    
    if (saveSuccess) {
      console.log(`Calorie target calculated and stored: ${calorieTarget} calories`);
    } else {
      console.log(`Calorie target calculated: ${calorieTarget} calories (not stored - table may not exist)`);
    }
    
    return calorieTarget;
  } catch (error) {
    console.error('Error calculating calorie target:', error);
    // Still return the calculated value even if saving fails
    const tdee = calculateTDEE(bmr, activityLevel);
    const calorieTarget = calculateCalorieTarget(tdee, goal);
    console.log(`Calorie target calculated: ${calorieTarget} calories (saving failed)`);
    return calorieTarget;
  }
};

/**
 * Save macro targets to database
 * @param {string} clientId - Client ID
 * @param {Object} clientData - Client data
 * @param {number} calorieTarget - Calorie target
 * @param {string} goal - Primary fitness goal
 * @param {string} activityLevel - Activity level
 * @returns {Promise<Object>} Macro targets
 */
export const calculateAndStoreMacroTargets = async (clientId: string, clientData: any, calorieTarget: number, goal: string, activityLevel: string) => {
  try {
    const macros = calculateMacroTargets(calorieTarget, goal, activityLevel);
    
    const proteinSuccess = await saveClientTarget(clientId, 'protein', macros.protein);
    const fatSuccess = await saveClientTarget(clientId, 'fat', macros.fat);
    const carbsSuccess = await saveClientTarget(clientId, 'carbs', macros.carbs);
    
    if (proteinSuccess && fatSuccess && carbsSuccess) {
      console.log(`Macro targets calculated and stored:`, macros);
    } else {
      console.log(`Macro targets calculated:`, macros, `(not all stored - table may not exist)`);
    }
    
    return macros;
  } catch (error) {
    console.error('Error calculating macro targets:', error);
    // Still return the calculated values even if saving fails
    const macros = calculateMacroTargets(calorieTarget, goal, activityLevel);
    console.log(`Macro targets calculated:`, macros, `(saving failed)`);
    return macros;
  }
};

/**
 * Save hydration target to database
 * @param {string} clientId - Client ID
 * @param {number} weight - Weight in kg
 * @param {string} activityLevel - Activity level
 * @param {number} trainingDays - Training days per week
 * @param {number} sleepHours - Sleep hours per night
 * @returns {Promise<number>} Hydration target
 */
export const calculateAndStoreHydrationTarget = async (clientId: string, weight: number, activityLevel: string, trainingDays: number, sleepHours: number) => {
  try {
    const hydrationTarget = calculateHydrationTarget(weight, activityLevel, trainingDays, sleepHours);
    const saveSuccess = await saveClientTarget(clientId, 'hydration', hydrationTarget);
    
    if (saveSuccess) {
      console.log(`Hydration target calculated and stored: ${hydrationTarget}L`);
    } else {
      console.log(`Hydration target calculated: ${hydrationTarget}L (not stored - table may not exist)`);
    }
    
    return hydrationTarget;
  } catch (error) {
    console.error('Error calculating hydration target:', error);
    // Still return the calculated value even if saving fails
    const hydrationTarget = calculateHydrationTarget(weight, activityLevel, trainingDays, sleepHours);
    console.log(`Hydration target calculated: ${hydrationTarget}L (saving failed)`);
    return hydrationTarget;
  }
};

/**
 * Save BMI to database
 * @param {string} clientId - Client ID
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {Promise<number>} BMI value
 */
export const calculateAndStoreBMI = async (clientId: string, weight: number, height: number) => {
  try {
    const bmi = calculateBMI(weight, height);
    const saveSuccess = await saveClientTarget(clientId, 'bmi', bmi);
    
    if (saveSuccess) {
      console.log(`BMI calculated and stored: ${bmi}`);
    } else {
      console.log(`BMI calculated: ${bmi} (not stored - table may not exist)`);
    }
    
    return bmi;
  } catch (error) {
    console.error('Error calculating BMI:', error);
    // Still return the calculated value even if saving fails
    const bmi = calculateBMI(weight, height);
    console.log(`BMI calculated: ${bmi} (saving failed)`);
    return bmi;
  }
};

/**
 * Save workout target to database
 * @param {string} clientId - Client ID
 * @param {number} trainingDays - Training days per week
 * @returns {Promise<Object>} Workout targets
 */
export const calculateAndStoreWorkoutTarget = async (clientId: string, trainingDays: number) => {
  try {
    const workoutTargets = calculateWorkoutTarget(trainingDays);
    
    const weeklySuccess = await saveClientTarget(clientId, 'workouts_weekly', workoutTargets.weekly);
    const monthlySuccess = await saveClientTarget(clientId, 'workouts_monthly', workoutTargets.monthly);
    const yearlySuccess = await saveClientTarget(clientId, 'workouts_yearly', workoutTargets.yearly);
    
    if (weeklySuccess && monthlySuccess && yearlySuccess) {
      console.log(`Workout targets calculated and stored:`, workoutTargets);
    } else {
      console.log(`Workout targets calculated:`, workoutTargets, `(not all stored - table may not exist)`);
    }
    
    return workoutTargets;
  } catch (error) {
    console.error('Error calculating workout targets:', error);
    // Still return the calculated values even if saving fails
    const workoutTargets = calculateWorkoutTarget(trainingDays);
    console.log(`Workout targets calculated:`, workoutTargets, `(saving failed)`);
    return workoutTargets;
  }
};

/**
 * Calculate all targets for a client
 * @param {string} clientId - Client ID
 * @param {Object} clientData - Complete client data
 * @returns {Promise<Object>} All calculated targets
 */
export const calculateAllTargets = async (clientId: string, clientData: any) => {
  try {
    const {
      cl_weight: weight,
      cl_height: height,
      cl_age: age,
      cl_sex: sex,
      cl_activity_level: activityLevel,
      cl_primary_goal: goal,
      training_days_per_week: trainingDays,
      sleep_hours: sleepHours
    } = clientData;

    const results: any = {};

    // Calculate BMR
    if (weight && height && age && sex) {
      results.bmr = await calculateAndStoreBMR(clientId, weight, height, age, sex);
    }

    // Calculate calorie target
    if (results.bmr && activityLevel && goal) {
      results.calories = await calculateAndStoreCalorieTarget(clientId, clientData, results.bmr, activityLevel, goal);
    }

    // Calculate macro targets
    if (results.calories && goal && activityLevel) {
      results.macros = await calculateAndStoreMacroTargets(clientId, clientData, results.calories, goal, activityLevel);
    }

    // Calculate hydration target
    if (weight && activityLevel && trainingDays && sleepHours) {
      results.hydration = await calculateAndStoreHydrationTarget(clientId, weight, activityLevel, trainingDays, sleepHours);
    }

    // Calculate BMI
    if (weight && height) {
      results.bmi = await calculateAndStoreBMI(clientId, weight, height);
    }

    // Calculate workout targets
    if (trainingDays) {
      results.workouts = await calculateAndStoreWorkoutTarget(clientId, trainingDays);
    }

    console.log('All targets calculated successfully:', results);
    return results;
  } catch (error) {
    console.error('Error calculating all targets:', error);
    // Don't throw error to prevent onboarding failure
    console.warn('Some target calculations failed, but continuing with onboarding...');
    return {};
  }
};
