// targetCalculations.js
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
export const calculateBMR = (weight, height, age, sex) => {
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
export const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
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
export const calculateCalorieTarget = (tdee, goal) => {
  const goalAdjustments = {
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
export const calculateMacroTargets = (calorieTarget, goal, activityLevel) => {
  let proteinRatio, fatRatio, carbRatio;

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
export const calculateHydrationTarget = (weight, activityLevel, trainingDays, sleepHours) => {
  // Base hydration: 30ml per kg of body weight
  let baseHydration = weight * 0.03;

  // Activity level adjustments
  const activityAdjustments = {
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
export const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate workout target based on training days
 * @param {number} trainingDays - Number of training days per week
 * @returns {Object} Workout targets
 */
export const calculateWorkoutTarget = (trainingDays) => {
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
 * @returns {Promise<boolean>} Success status
 */
export const calculateAndStoreBMR = async (clientId, weight, height, age, sex) => {
  try {
    const bmr = calculateBMR(weight, height, age, sex);
    await saveClientTarget(clientId, 'bmr', bmr);
    console.log(`BMR calculated and stored: ${bmr} calories`);
    return bmr;
  } catch (error) {
    console.error('Error calculating and storing BMR:', error);
    throw error;
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
export const calculateAndStoreCalorieTarget = async (clientId, clientData, bmr, activityLevel, goal) => {
  try {
    const tdee = calculateTDEE(bmr, activityLevel);
    const calorieTarget = calculateCalorieTarget(tdee, goal);
    await saveClientTarget(clientId, 'calories', calorieTarget);
    console.log(`Calorie target calculated and stored: ${calorieTarget} calories`);
    return calorieTarget;
  } catch (error) {
    console.error('Error calculating and storing calorie target:', error);
    throw error;
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
export const calculateAndStoreMacroTargets = async (clientId, clientData, calorieTarget, goal, activityLevel) => {
  try {
    const macros = calculateMacroTargets(calorieTarget, goal, activityLevel);
    
    await saveClientTarget(clientId, 'protein', macros.protein);
    await saveClientTarget(clientId, 'fat', macros.fat);
    await saveClientTarget(clientId, 'carbs', macros.carbs);
    
    console.log(`Macro targets calculated and stored:`, macros);
    return macros;
  } catch (error) {
    console.error('Error calculating and storing macro targets:', error);
    throw error;
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
export const calculateAndStoreHydrationTarget = async (clientId, weight, activityLevel, trainingDays, sleepHours) => {
  try {
    const hydrationTarget = calculateHydrationTarget(weight, activityLevel, trainingDays, sleepHours);
    await saveClientTarget(clientId, 'hydration', hydrationTarget);
    console.log(`Hydration target calculated and stored: ${hydrationTarget}L`);
    return hydrationTarget;
  } catch (error) {
    console.error('Error calculating and storing hydration target:', error);
    throw error;
  }
};

/**
 * Save BMI to database
 * @param {string} clientId - Client ID
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {Promise<number>} BMI value
 */
export const calculateAndStoreBMI = async (clientId, weight, height) => {
  try {
    const bmi = calculateBMI(weight, height);
    await saveClientTarget(clientId, 'bmi', bmi);
    console.log(`BMI calculated and stored: ${bmi}`);
    return bmi;
  } catch (error) {
    console.error('Error calculating and storing BMI:', error);
    throw error;
  }
};

/**
 * Save workout target to database
 * @param {string} clientId - Client ID
 * @param {number} trainingDays - Training days per week
 * @returns {Promise<Object>} Workout targets
 */
export const calculateAndStoreWorkoutTarget = async (clientId, trainingDays) => {
  try {
    const workoutTargets = calculateWorkoutTarget(trainingDays);
    await saveClientTarget(clientId, 'workouts_weekly', workoutTargets.weekly);
    await saveClientTarget(clientId, 'workouts_monthly', workoutTargets.monthly);
    await saveClientTarget(clientId, 'workouts_yearly', workoutTargets.yearly);
    
    console.log(`Workout targets calculated and stored:`, workoutTargets);
    return workoutTargets;
  } catch (error) {
    console.error('Error calculating and storing workout targets:', error);
    throw error;
  }
};

/**
 * Calculate all targets for a client
 * @param {string} clientId - Client ID
 * @param {Object} clientData - Complete client data
 * @returns {Promise<Object>} All calculated targets
 */
export const calculateAllTargets = async (clientId, clientData) => {
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

    const results = {};

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
    throw error;
  }
};
