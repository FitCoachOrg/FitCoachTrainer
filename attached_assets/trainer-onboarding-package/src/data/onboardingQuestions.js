// onboardingQuestions.js
// Complete question definitions for trainer-side onboarding
// All 41 questions from the original client onboarding

export const onboardingQuestions = [
  // Personal Information Section
  {
    id: 'cl_age',
    section: 'Personal Information',
    title: 'How old are you?',
    type: 'text',
    field: 'cl_age',
    placeholder: '25',
    keyboardType: 'numeric',
    maxLength: 3,
    required: true
  },
  {
    id: 'cl_height',
    section: 'Personal Information',
    title: 'Your height (cm)',
    type: 'text',
    field: 'cl_height',
    placeholder: '170',
    keyboardType: 'numeric',
    maxLength: 3,
    required: true
  },
  {
    id: 'cl_weight',
    section: 'Personal Information',
    title: 'Your weight (kg)',
    type: 'text',
    field: 'cl_weight',
    placeholder: '70',
    keyboardType: 'numeric',
    maxLength: 3,
    required: true
  },
  {
    id: 'cl_waist',
    section: 'Personal Information',
    title: 'Your waist size (cm)',
    type: 'text',
    field: 'waist',
    placeholder: '80',
    keyboardType: 'numeric',
    maxLength: 3,
    required: false
  },
  {
    id: 'cl_hip',
    section: 'Personal Information',
    title: 'Your hip size (cm)',
    type: 'text',
    field: 'hip',
    placeholder: '95',
    keyboardType: 'numeric',
    maxLength: 3,
    required: false
  },
  {
    id: 'cl_thigh',
    section: 'Personal Information',
    title: 'Your thigh size (cm)',
    type: 'text',
    field: 'thigh',
    placeholder: '55',
    keyboardType: 'numeric',
    maxLength: 3,
    required: false
  },
  {
    id: 'cl_bicep',
    section: 'Personal Information',
    title: 'Your bicep size (cm)',
    type: 'text',
    field: 'bicep',
    placeholder: '30',
    keyboardType: 'numeric',
    maxLength: 3,
    required: false
  },
  {
    id: 'cl_sex',
    section: 'Personal Information',
    title: 'Biological sex',
    type: 'select',
    field: 'cl_sex',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ],
    required: true
  },
  {
    id: 'cl_activity_level',
    section: 'Personal Information',
    title: 'Daily activity level',
    type: 'select',
    field: 'cl_activity_level',
    options: [
      { value: 'sedentary', label: 'Sedentary' },
      { value: 'lightly_active', label: 'Lightly Active' },
      { value: 'active', label: 'Active' },
      { value: 'very_active', label: 'Very Active' }
    ],
    required: true
  },

  // Fitness Goals Section
  {
    id: 'cl_primary_goal',
    section: 'Fitness Goals',
    title: 'Primary fitness goal',
    type: 'select',
    field: 'cl_primary_goal',
    options: [
      { value: 'lose_fat', label: 'Lose Fat' },
      { value: 'build_muscle', label: 'Build Muscle' },
      { value: 'increase_strength', label: 'Get Stronger' },
      { value: 'improve_endurance', label: 'Improve Endurance' },
      { value: 'improve_flexibility', label: 'Flexibility' },
      { value: 'boost_energy', label: 'Boost Energy' },
      { value: 'improve_health', label: 'General Health' }
    ],
    required: true
  },
  {
    id: 'specific_outcome',
    section: 'Fitness Goals',
    title: 'Your specific goal',
    type: 'text',
    field: 'specific_outcome',
    placeholder: 'e.g., lose 20 lbs, run a 5K, gain muscle...',
    multiline: true,
    required: false
  },
  {
    id: 'goal_timeline',
    section: 'Fitness Goals',
    title: 'Target timeline',
    type: 'select',
    field: 'goal_timeline',
    options: [
      { value: '30_days', label: '1 Month' },
      { value: '3_months', label: '3 Months' },
      { value: '6_months', label: '6 Months' },
      { value: '12_months', label: '1+ Years' },
      { value: 'no_deadline', label: 'No Rush' }
    ],
    required: true
  },
  {
    id: 'obstacles',
    section: 'Fitness Goals',
    title: 'Obstacles or challenges',
    type: 'text',
    field: 'obstacles',
    placeholder: 'Describe potential obstacles',
    multiline: true,
    required: false
  },
  {
    id: 'confidence_level',
    section: 'Fitness Goals',
    title: 'Confidence level (1-10)',
    type: 'text',
    field: 'confidence_level',
    placeholder: '5',
    keyboardType: 'numeric',
    maxLength: 2,
    required: true
  },

  // Training Section
  {
    id: 'training_experience',
    section: 'Training',
    title: 'Current training experience',
    type: 'select',
    field: 'training_experience',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' }
    ],
    required: true
  },
  {
    id: 'previous_training',
    section: 'Training',
    title: 'Previous training',
    type: 'select',
    field: 'previous_training',
    options: [
      { value: 'consistent', label: 'Yes, consistently' },
      { value: 'off_and_on', label: 'Off and on' },
      { value: 'new', label: 'Not really / new to training' }
    ],
    required: true
  },
  {
    id: 'training_days_per_week',
    section: 'Training',
    title: 'Days per week you can train',
    type: 'text',
    field: 'training_days_per_week',
    placeholder: '3',
    keyboardType: 'numeric',
    maxLength: 1,
    required: true
  },
  {
    id: 'training_time_per_session',
    section: 'Training',
    title: 'Time per session',
    type: 'select',
    field: 'training_time_per_session',
    options: [
      { value: '15_30', label: '15–30 min' },
      { value: '30_45', label: '30–45 min' },
      { value: '45_60', label: '45–60 min' },
      { value: '60_plus', label: '60+ min' }
    ],
    required: true
  },
  {
    id: 'training_location',
    section: 'Training',
    title: 'Training location',
    type: 'select',
    field: 'training_location',
    options: [
      { value: 'home', label: 'Home' },
      { value: 'gym', label: 'Gym' },
      { value: 'both', label: 'Both' }
    ],
    required: true
  },
  {
    id: 'available_equipment',
    section: 'Training',
    title: 'Available equipment',
    type: 'multi_select',
    field: 'available_equipment',
    options: [
      { value: 'bodyweight', label: 'Bodyweight only' },
      { value: 'dumbbells', label: 'Dumbbells' },
      { value: 'barbells', label: 'Barbells & plates' },
      { value: 'resistance_bands', label: 'Resistance bands' },
      { value: 'kettlebells', label: 'Kettlebells' },
      { value: 'trx', label: 'TRX/suspension trainer' },
      { value: 'bench', label: 'Bench' },
      { value: 'pull_up_bar', label: 'Pull-up bar' },
      { value: 'cardio', label: 'Cardio equipment' }
    ],
    required: true
  },
  {
    id: 'injuries_limitations',
    section: 'Training',
    title: 'Injuries or movement limitations',
    type: 'text',
    field: 'injuries_limitations',
    placeholder: 'Describe any injuries or limitations (optional)',
    multiline: true,
    required: false
  },
  {
    id: 'focus_areas',
    section: 'Training',
    title: 'Focus areas',
    type: 'multi_select',
    field: 'focus_areas',
    options: [
      { value: 'abs', label: 'Abs', icon: 'dumbbell' },
      { value: 'arms', label: 'Arms', icon: 'dumbbell' },
      { value: 'back', label: 'Back', icon: 'dumbbell' },
      { value: 'chest', label: 'Chest', icon: 'dumbbell' },
      { value: 'glutes', label: 'Glutes', icon: 'dumbbell' },
      { value: 'legs', label: 'Legs', icon: 'dumbbell' },
      { value: 'shoulders', label: 'Shoulders', icon: 'dumbbell' },
      { value: 'functional_movement', label: 'Functional Movement', icon: 'running' },
      { value: 'cardio', label: 'Cardio', icon: 'heart' },
      { value: 'flexibility', label: 'Flexibility', icon: 'child' },
      { value: 'strength', label: 'Strength', icon: 'weight-hanging' },
      { value: 'no_preference', label: 'No Preference', icon: 'check' }
    ],
    required: true
  },

  // Nutrition Section
  {
    id: 'eating_habits',
    section: 'Nutrition',
    title: 'Current eating habits',
    type: 'select',
    field: 'eating_habits',
    options: [
      { value: 'structured', label: 'Structured (track or meal prep)' },
      { value: 'intuitive', label: 'Intuitive (eat when hungry)' },
      { value: 'chaotic', label: 'Chaotic (no routine or consistency)' }
    ],
    required: true
  },
  {
    id: 'diet_preferences',
    section: 'Nutrition',
    title: 'Diet preferences',
    type: 'multi_select',
    field: 'diet_preferences',
    options: [
      { value: 'vegan', label: 'Vegan' },
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'pescatarian', label: 'Pescatarian' },
      { value: 'paleo', label: 'Paleo' },
      { value: 'mediterranean', label: 'Mediterranean' },
      { value: 'low_carb', label: 'Low-carb / Keto' },
      { value: 'dairy_free', label: 'Dairy-free' },
      { value: 'gluten_free', label: 'Gluten-free' },
      { value: 'no_preference', label: 'No preference' }
    ],
    required: true
  },
  {
    id: 'food_allergies',
    section: 'Nutrition',
    title: 'Food allergies or sensitivities',
    type: 'text',
    field: 'food_allergies',
    placeholder: 'List any food allergies or sensitivities (optional)',
    multiline: true,
    required: false
  },
  {
    id: 'preferred_meals_per_day',
    section: 'Nutrition',
    title: 'Preferred meals per day',
    type: 'select',
    field: 'preferred_meals_per_day',
    options: [
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4+' },
      { value: 0, label: 'No preference' }
    ],
    required: true
  },

  // Timing Section
  {
    id: 'wake_time',
    section: 'Timing',
    title: 'Wake up time',
    type: 'time_input',
    field: 'wake_time',
    icon: 'sun',
    required: true
  },
  {
    id: 'bed_time',
    section: 'Timing',
    title: 'Bed time',
    type: 'time_input',
    field: 'bed_time',
    icon: 'moon',
    required: true
  },
  {
    id: 'workout_time',
    section: 'Timing',
    title: 'Workout time',
    type: 'time_input',
    field: 'workout_time',
    icon: 'dumbbell',
    required: true
  },
  {
    id: 'workout_days',
    section: 'Timing',
    title: 'Workout days',
    type: 'multi_select',
    field: 'workout_days',
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' }
    ],
    required: true
  },
  {
    id: 'bf_time',
    section: 'Timing',
    title: 'Breakfast time',
    type: 'time_input',
    field: 'bf_time',
    icon: 'utensils',
    required: true
  },
  {
    id: 'lunch_time',
    section: 'Timing',
    title: 'Lunch time',
    type: 'time_input',
    field: 'lunch_time',
    icon: 'utensils',
    required: true
  },
  {
    id: 'dinner_time',
    section: 'Timing',
    title: 'Dinner time',
    type: 'time_input',
    field: 'dinner_time',
    icon: 'utensils',
    required: true
  },
  {
    id: 'snack_time',
    section: 'Timing',
    title: 'Snack time',
    type: 'time_input',
    field: 'snack_time',
    icon: 'apple-alt',
    required: true
  },

  // Wellness Section
  {
    id: 'sleep_hours',
    section: 'Wellness',
    title: 'Sleep hours per night',
    type: 'text',
    field: 'sleep_hours',
    placeholder: '8',
    keyboardType: 'numeric',
    maxLength: 2,
    required: true
  },
  {
    id: 'cl_stress',
    section: 'Wellness',
    title: 'Current stress level',
    type: 'select',
    field: 'cl_stress',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }
    ],
    required: true
  },
  {
    id: 'cl_alcohol',
    section: 'Wellness',
    title: 'Alcohol (drinks/week)',
    type: 'text',
    field: 'cl_alcohol',
    placeholder: 'Describe your alcohol consumption (optional)',
    multiline: true,
    required: false
  },
  {
    id: 'cl_supplements',
    section: 'Wellness',
    title: 'Supplements',
    type: 'text',
    field: 'cl_supplements',
    placeholder: 'List any supplements (optional)',
    multiline: true,
    required: false
  },
  {
    id: 'cl_gastric_issues',
    section: 'Wellness',
    title: 'Digestive/gastric issues',
    type: 'text',
    field: 'cl_gastric_issues',
    placeholder: 'Describe any gastric issues (optional)',
    multiline: true,
    required: false
  },
  {
    id: 'motivation_style',
    section: 'Wellness',
    title: 'Motivation style',
    type: 'text',
    field: 'motivation_style',
    placeholder: 'Describe what motivates you (optional)',
    multiline: true,
    required: false
  }
];

// Helper function to get questions by section
export const getQuestionsBySection = (section) => {
  return onboardingQuestions.filter(q => q.section === section);
};

// Helper function to get all sections
export const getSections = () => {
  return [...new Set(onboardingQuestions.map(q => q.section))];
};

// Helper function to get total question count
export const getTotalQuestionCount = () => {
  return onboardingQuestions.length;
};

// Helper function to get required question count
export const getRequiredQuestionCount = () => {
  return onboardingQuestions.filter(q => q.required).length;
};
