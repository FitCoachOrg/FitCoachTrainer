import { supabase } from './supabase';

// Performance optimization: Exercise caching with localStorage fallback
let cachedExercises: any[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'fitcoach_exercises_cache';
const CACHE_TIMESTAMP_KEY = 'fitcoach_exercises_cache_timestamp';

// Clean exercise data (equivalent to Python's _clean_library method)
function cleanExerciseData(exercises: any[]): any[] {
  return exercises.map(exercise => ({
    ...exercise,
    exercise_name: exercise.exercise_name?.trim() || '',
    primary_muscle: exercise.primary_muscle?.trim() || '',
    secondary_muscle: exercise.secondary_muscle?.trim() || '',
    category: exercise.category?.trim() || '',
    experience: exercise.experience?.trim() || 'beginner',
    equipment: exercise.equipment?.trim() || 'bodyweight',
    video_link: exercise.video_link?.trim() || ''
  }));
}

// Validate exercise data
function validateExerciseData(exercise: any): boolean {
  return exercise.exercise_name && 
         exercise.primary_muscle && 
         exercise.category;
}

// Get cached data from localStorage
function getCachedDataFromStorage(): { exercises: any[], timestamp: number } | null {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      const exercises = JSON.parse(cachedData);
      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      if (exercises && Array.isArray(exercises) && exercises.length > 0 && (now - timestamp) < CACHE_DURATION) {
        console.log('📦 Using localStorage cached exercises data');
        return { exercises, timestamp };
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to read from localStorage cache:', error);
  }
  return null;
}

// Save data to localStorage
function saveDataToStorage(exercises: any[], timestamp: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(exercises));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
    console.log('💾 Saved exercises to localStorage cache');
  } catch (error) {
    console.warn('⚠️ Failed to save to localStorage cache:', error);
  }
}

// Get exercises with robust caching to avoid repeated database queries
async function getExercises(): Promise<any[]> {
  const now = Date.now();
  
  // First, try memory cache
  if (cachedExercises.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Using memory cached exercises data');
    return cachedExercises;
  }
  
  // Then, try localStorage cache
  const storageCache = getCachedDataFromStorage();
  if (storageCache) {
    console.log('📦 Restoring from localStorage cache');
    cachedExercises = storageCache.exercises;
    cacheTimestamp = storageCache.timestamp;
    return cachedExercises;
  }
  
  // Finally, fetch from database
  console.log('🔄 Fetching exercises from database...');
  const startTime = Date.now();
  
  const { data: exercises, error } = await supabase
    .from('exercises_raw')
    .select('*');
  
  const fetchTime = Date.now() - startTime;
  console.log(`⏱️ Database fetch took ${fetchTime}ms`);
  
  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message}`);
  }
  
  if (!exercises || exercises.length === 0) {
    throw new Error('No exercises found in database');
  }
  
  console.log(`📊 Raw exercises from database: ${exercises.length}`);
  
  // Clean and validate the data (equivalent to Python's _clean_library)
  const cleaningStartTime = Date.now();
  const cleanedExercises = cleanExerciseData(exercises);
  const validExercises = cleanedExercises.filter(validateExerciseData);
  const cleaningTime = Date.now() - cleaningStartTime;
  
  console.log(`⏱️ Data cleaning took ${cleaningTime}ms`);
  console.log(`✅ Cleaned ${validExercises.length} exercises from ${exercises.length} total`);
  
  if (validExercises.length === 0) {
    throw new Error('No valid exercises found after cleaning');
  }
  
  // Cache the cleaned data in both memory and localStorage
  cachedExercises = validExercises;
  cacheTimestamp = now;
  
  // Save to localStorage for persistence across page reloads
  saveDataToStorage(validExercises, now);
  
  console.log(`✅ Cached ${validExercises.length} exercises (memory + localStorage)`);
  return validExercises;
}

// Cache warming function - call this when the app loads to pre-load exercises
export async function warmupExerciseCache(): Promise<void> {
  console.log('🔥 Warming up exercise cache...');
  try {
    // Check if cache is already warm
    const now = Date.now();
    if (cachedExercises.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('✅ Exercise cache already warm');
      return;
    }
    
    // Check localStorage first
    const storageCache = getCachedDataFromStorage();
    if (storageCache) {
      console.log('📦 Restoring from localStorage cache during warmup');
      cachedExercises = storageCache.exercises;
      cacheTimestamp = storageCache.timestamp;
      console.log('✅ Exercise cache warmed up from localStorage');
      return;
    }
    
    // Fetch from database if no cache available
    console.log('🔄 Fetching exercises from database during warmup...');
    const startTime = Date.now();
    
    const { data: exercises, error } = await supabase
      .from('exercises_raw')
      .select('*');
    
    const fetchTime = Date.now() - startTime;
    console.log(`⏱️ Database fetch during warmup took ${fetchTime}ms`);
    
    if (error) {
      throw new Error(`Failed to fetch exercises during warmup: ${error.message}`);
    }
    
    if (!exercises || exercises.length === 0) {
      throw new Error('No exercises found in database during warmup');
    }
    
    console.log(`📊 Raw exercises from database during warmup: ${exercises.length}`);
    
    // Clean and validate the data
    const cleaningStartTime = Date.now();
    const cleanedExercises = cleanExerciseData(exercises);
    const validExercises = cleanedExercises.filter(validateExerciseData);
    const cleaningTime = Date.now() - cleaningStartTime;
    
    console.log(`⏱️ Data cleaning during warmup took ${cleaningTime}ms`);
    console.log(`✅ Cleaned ${validExercises.length} exercises from ${exercises.length} total during warmup`);
    
    if (validExercises.length === 0) {
      throw new Error('No valid exercises found after cleaning during warmup');
    }
    
    // Cache the cleaned data
    cachedExercises = validExercises;
    cacheTimestamp = now;
    
    // Save to localStorage for persistence
    saveDataToStorage(validExercises, now);
    
    console.log(`✅ Exercise cache warmed up successfully with ${validExercises.length} exercises`);
  } catch (error) {
    console.error('❌ Failed to warm up exercise cache:', error);
    // Don't throw the error - let the app continue without cache
    // The getExercises function will handle fetching when needed
  }
}

// Clear cache function for debugging
export function clearExerciseCache(): void {
  console.log('🗑️ Clearing exercise cache...');
  cachedExercises = [];
  cacheTimestamp = 0;
  
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('✅ Exercise cache cleared (memory + localStorage)');
  } catch (error) {
    console.warn('⚠️ Failed to clear localStorage cache:', error);
  }
}

// Goal presets based on the Python script
const GOAL_PRESETS: Record<string, any> = {
  "fat_loss": { rep_low: 10, rep_high: 15, rest_s: 45, sets_min: 2, sets_max: 4, tempo_s_per_rep: 2.5 },
  "hypertrophy": { rep_low: 8, rep_high: 12, rest_s: 75, sets_min: 3, sets_max: 4, tempo_s_per_rep: 3.0 },
  "strength": { rep_low: 3, rep_high: 6, rest_s: 150, sets_min: 3, sets_max: 5, tempo_s_per_rep: 3.5 },
  "endurance": { rep_low: 15, rep_high: 25, rest_s: 40, sets_min: 2, sets_max: 4, tempo_s_per_rep: 2.0 },
  "power": { rep_low: 1, rep_high: 3, rest_s: 210, sets_min: 3, sets_max: 5, tempo_s_per_rep: 2.5 },
  "core_stability": { rep_low: 8, rep_high: 15, rest_s: 60, sets_min: 2, sets_max: 4, tempo_s_per_rep: 2.5 },
};

// Experience level mapping
const EXPERIENCE_ORDER: Record<string, number> = {
  "Beginner": 0,
  "Intermediate": 1,
  "Advanced": 2
};

// Default values
const DEFAULTS = {
  warmup_s: 8 * 60,
  cooldown_s: 5 * 60,
  transition_s_per_ex: 40
};

// Goal to muscle group mapping
const GOAL_TO_MUSCLE_BUCKETS: Record<string, string[]> = {
  "fat_loss": ["Full Body", "Quads", "Hamstrings", "Glutes", "Back", "Chest", "Shoulders", "Core"],
  "hypertrophy": ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes", "Arms", "Core", "Calves"],
  "strength": ["Quads", "Hamstrings", "Glutes", "Back", "Chest", "Shoulders", "Core"],
  "endurance": ["Full Body", "Core", "Back", "Quads", "Glutes"],
  "power": ["Quads", "Hamstrings", "Glutes", "Back", "Shoulders", "Core"],
  "core_stability": ["Core", "Obliques", "Lower Back"]
};

// Injury rules to avoid certain exercises
const INJURY_RULES: Record<string, string[]> = {
  "shoulder": ["overhead press", "shoulder press", "push press", "snatch", "jerk", "handstand", "upright row", "behind-the-neck"],
  "elbow": ["skullcrusher", "lying triceps extension", "close-grip bench", "ez bar curl", "preacher curl", "dip"],
  "wrist": ["wrist curl", "reverse curl", "handstand", "clean", "snatch", "front rack"],
  "neck": ["shrug", "behind-the-neck", "neck curl", "neck extension"],
  "upper_back": ["barbell row", "pendlay row", "seal row", "t-bar row", "bent-over row"],
  "lower_back": ["deadlift", "romanian deadlift", "rdl", "good morning", "back extension", "superman", "hyperextension", "heavy squat"],
  "hip": ["sumo deadlift", "good morning", "hip thrust heavy", "deep squat", "wide-stance"],
  "groin": ["sumo", "copenhagen", "side lunge", "cossack", "adductor"],
  "hamstring": ["nordic", "good morning", "romanian deadlift", "hamstring curl"],
  "quad": ["sissy squat", "leg extension", "pistol squat", "deep squat"],
  "knee": ["deep squat", "sissy squat", "lunge", "step-up", "box jump", "leg extension"],
  "ankle": ["jump rope", "calf raise heavy", "box jump", "plyometric"],
  "achilles": ["box jump", "jump rope", "sprint", "plyometric"],
  "foot": ["sprint", "box jump", "jump rope", "plyometric", "lateral hop"]
};

// UI goal mapping
const UI_GOAL_MAP: Record<string, string> = {
  "Lose body fat": "fat_loss",
  "Build muscle": "hypertrophy",
  "Get stronger": "strength",
  "Build endurance": "endurance",
  "Overall health": "endurance",
  "improve_health": "endurance",
  "Sport performance": "power",
  "Tone and sculpt": "hypertrophy"
};

// UI experience mapping
const UI_EXPERIENCE_MAP: Record<string, string> = {
  "Complete beginner (never trained)": "Beginner",
  "Beginner\n(less than 6 months)": "Beginner",
  "Beginner (less than 6 months)": "Beginner",
  "Some experience\n(6 months - 2 years)": "Intermediate",
  "Some experience (6 months - 2 years)": "Intermediate",
  "Experienced (2-5 years)": "Intermediate",
  "Very experienced\n(5+ years)": "Advanced",
  "Very experienced (5+ years)": "Advanced",
  "Beginner": "Beginner"
};

// UI equipment tokens
const UI_EQUIPMENT_TOKENS: Record<string, string[]> = {
  "Just my bodyweight": ["bodyweight"],
  "Dumbbells": ["dumbbell"],
  "Barbell": ["barbell", "bench"],
  "Resistance bands": ["bands"],
  "Kettlebells": ["kettlebell"],
  "Full gym access": ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"],
  "full_gym": ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"],
  "Cardio machines": ["cardio_machine", "machine", "bike", "rower", "treadmill", "elliptical", "stair"],
  "Yoga mat": ["bodyweight", "stability ball"]
};

// Location equipment defaults
const UI_LOCATION_EQUIPMENT_DEFAULTS: Record<string, string[]> = {
  "Home": ["bodyweight", "bands", "dumbbell", "yoga_mat"],
  "Gym": UI_EQUIPMENT_TOKENS["Full gym access"],
  "Outdoors": ["bodyweight", "bands", "kettlebell"],
  "Mix of locations": []
};

// Focus to muscles mapping
const UI_FOCUS_TO_MUSCLES: Record<string, string[]> = {
  "Upper body": ["Chest", "Back", "Shoulders", "Arms", "Core"],
  "upper_body": ["Chest", "Back", "Shoulders", "Arms", "Core"],
  "Lower body": ["Quads", "Hamstrings", "Glutes", "Calves", "Core"],
  "lower_body": ["Quads", "Hamstrings", "Glutes", "Calves", "Core"],
  "Core/abs": ["Core", "Obliques", "Lower Back"],
  "core_abs": ["Core", "Obliques", "Lower Back"],
  "Cardio fitness": ["Full Body", "Core"],
  "cardio": ["Full Body", "Core"],
  "Flexibility": ["Core", "Lower Back", "Obliques"],
  "flexibility": ["Core", "Lower Back", "Obliques"],
  "Full body strength": ["Full Body", "Core", "Back", "Quads", "Glutes"],
  "full_body_strength": ["Full Body", "Core", "Back", "Quads", "Glutes"],
  "Functional movement": ["Full Body", "Core", "Back", "Glutes"],
  "functional_movement": ["Full Body", "Core", "Back", "Glutes"]
};

// Utility functions
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hasEquipment(rowEquipment: string, availableEq: string[]): boolean {
  if (!rowEquipment || rowEquipment.trim() === "" || rowEquipment.toLowerCase() === "bodyweight") {
    return true;
  }
  if (!availableEq || availableEq.length === 0) {
    return true;
  }
  
  const tokens = rowEquipment.split(",").map(t => t.trim().toLowerCase());
  const have = new Set(availableEq.map(e => e.trim().toLowerCase()));
  
  return tokens.some(t => have.has(t));
}

function injuryExcluded(name: string, injuries: string[]): boolean {
  if (!injuries || injuries.length === 0) {
    return false;
  }
  
  const low = name.toLowerCase();
  for (const [inj, keys] of Object.entries(INJURY_RULES)) {
    if (injuries.includes(inj) && keys.some(k => low.includes(k))) {
      return true;
    }
  }
  return false;
}

function estimateSetTimeSeconds(reps: number, tempo: number, rest: number): number {
  return reps * tempo + rest;
}

function scoreExercise(
  exercise: any,
  goal: string,
  experience: string,
  targetMuscles: string[],
  availableEq: string[],
  injuries: string[]
): number {
  let score = 0.0;
  
  // Score based on goal alignment
  if (GOAL_TO_MUSCLE_BUCKETS[goal]?.includes(exercise.primary_muscle)) {
    score += 2.0;
  }
  
  // Score based on target muscles
  if (targetMuscles && targetMuscles.includes(exercise.primary_muscle)) {
    score += 2.5;
  }
  
  // Score based on experience level
  const userLvl = EXPERIENCE_ORDER[experience] || 0;
  const exLvl = EXPERIENCE_ORDER[exercise.experience] || 0;
  score += exLvl <= userLvl ? 1.0 : -2.0;
  
  // Score based on equipment availability
  score += hasEquipment(exercise.equipment, availableEq) ? 1.0 : -3.0;
  
  // Penalty for injury-excluded exercises
  if (injuryExcluded(exercise.exercise_name, injuries)) {
    score -= 100.0;
  }
  
  return score;
}

function weekOverrides(goal: string, week: number): any {
  const base = GOAL_PRESETS[goal];
  const phase = ((week - 1) % 4) + 1;
  
  let rest = base.rest_s;
  let setsBonus = 0;
  let repLow = base.rep_low;
  let repHigh = base.rep_high;
  let rpe = "RPE 7–8";
  
  if (goal === "fat_loss") {
    if (phase === 1) {
      rest = clamp(base.rest_s, 25, 120);
      rpe = "RPE 7–8";
    } else if (phase === 2) {
      rest = clamp(base.rest_s - 5, 25, 120);
      rpe = "RPE 7.5–8";
    } else if (phase === 3) {
      rest = clamp(base.rest_s - 10, 25, 120);
      setsBonus = 1;
      rpe = "RPE 8";
    } else {
      rest = clamp(base.rest_s + 10, 25, 120);
      setsBonus = -1;
      rpe = "RPE 6–7";
    }
  } else if (goal === "hypertrophy") {
    if (phase === 1) {
      rpe = "RPE 7–8";
    } else if (phase === 2) {
      setsBonus = 1;
      rpe = "RPE 7.5–8";
    } else if (phase === 3) {
      setsBonus = 1;
      repLow = base.rep_low + 1;
      repHigh = base.rep_high + 1;
      rpe = "RPE 8";
    } else {
      setsBonus = -1;
      rpe = "RPE 6–7";
    }
  } else if (goal === "strength") {
    rpe = phase === 1 ? "RPE 7" : phase === 2 ? "RPE 8" : phase === 3 ? "RPE 8.5" : "RPE 6–7";
    if (phase === 4) setsBonus = -1;
  } else {
    if (phase === 1) {
      rpe = "RPE 7";
    } else if (phase === 2) {
      rest = clamp(base.rest_s - 5, 20, 120);
      rpe = "RPE 7.5";
    } else if (phase === 3) {
      rest = clamp(base.rest_s - 10, 20, 120);
      setsBonus = 1;
      rpe = "RPE 8";
    } else {
      rest = clamp(base.rest_s + 5, 20, 120);
      setsBonus = -1;
      rpe = "RPE 6–7";
    }
  }
  
  const newMin = Math.max(1, base.sets_min + setsBonus);
  const newMax = Math.max(newMin, base.sets_max + setsBonus);
  
  return {
    rest_s: rest,
    sets_min: newMin,
    sets_max: newMax,
    rep_low: repLow,
    rep_high: repHigh,
    rpe_text: rpe,
    phase: phase
  };
}

function chooseCardioExercise(exercises: any[]): string {
  // Find cardio/conditioning exercises
  const cardioExercises = exercises.filter(ex => 
    ex.category?.toLowerCase().includes('cardio') || 
    ex.category?.toLowerCase().includes('conditioning')
  );
  
  if (cardioExercises.length > 0) {
    return cardioExercises[0].exercise_name;
  }
  
  // Find exercises with cardio-related keywords
  const cardioKeywords = ["treadmill", "row", "rowing", "erg", "bike", "cycling", "spin", "airdyne", "elliptical", "stair", "ski"];
  const cardioByName = exercises.filter(ex => 
    cardioKeywords.some(keyword => ex.exercise_name?.toLowerCase().includes(keyword))
  );
  
  if (cardioByName.length > 0) {
    return cardioByName[0].exercise_name;
  }
  
  return "Cardio Machine (steady state)";
}

function mergeLocationEquipment(equip: string[], location: string): string[] {
  const base = new Set(equip.filter(e => e));
  
  if (base.size === 0 && UI_LOCATION_EQUIPMENT_DEFAULTS[location]) {
    UI_LOCATION_EQUIPMENT_DEFAULTS[location].forEach(e => base.add(e));
  }
  
  if (base.has("yoga_mat")) {
    base.delete("yoga_mat");
    base.add("bodyweight");
    base.add("stability ball");
  }
  
  return Array.from(base).sort();
}

function cleanUIPayload(clientData: any): any {
  const goal = UI_GOAL_MAP[clientData.cl_primary_goal?.trim()] || "hypertrophy";
  const exp = UI_EXPERIENCE_MAP[clientData.training_experience?.trim()] || "Beginner";
  const loc = clientData.training_location?.trim() || "Gym";
  
  // Process equipment
  const eqUI = Array.isArray(clientData.available_equipment) ? clientData.available_equipment : [clientData.available_equipment];
  const tokens: string[] = [];
  eqUI.forEach((item: any) => {
    const equipmentTokens = UI_EQUIPMENT_TOKENS[item?.trim()] || [];
    tokens.push(...equipmentTokens);
  });
  const available = mergeLocationEquipment(tokens, loc);
  
  // Process focus areas
  const focus = Array.isArray(clientData.focus_areas) ? clientData.focus_areas : [clientData.focus_areas];
  const targets: string[] = [];
  focus.forEach((f: any) => {
    const focusMuscles = UI_FOCUS_TO_MUSCLES[f?.trim()] || [];
    targets.push(...focusMuscles);
  });
  const targetMuscles = Array.from(new Set(targets)).sort();
  
  // Process session minutes
  const minutes = Math.max(20, Math.min(120, parseInt(clientData.training_time_per_session) || 45));
  
  // Process injuries
  const injuries = Array.isArray(clientData.injuries_limitations) ? clientData.injuries_limitations : [clientData.injuries_limitations];
  const processedInjuries = injuries
    .filter((i: any) => i)
    .map((i: any) => i.trim().toLowerCase().replace(/\s+/g, '_'));
  
  const requireCardio = available.includes("cardio_machine") || focus.some((f: any) => f === "Cardio fitness");
  
  return {
    goal,
    experience: exp,
    total_session_minutes: minutes,
    available_equipment: available,
    target_muscles: targetMuscles,
    injuries: processedInjuries,
    require_cardio: requireCardio
  };
}

function splitTargets(goal: string, baseTargets: string[], daysPerWeek: number): string[][] {
  if (baseTargets && baseTargets.length > 0) {
    // Distribute base targets across days instead of duplicating
    const chunks: string[][] = [];
    const n = Math.max(1, Math.floor(baseTargets.length / Math.max(1, daysPerWeek)));
    
    for (let i = 0; i < daysPerWeek; i++) {
      const chunk = baseTargets.slice(i * n, (i + 1) * n);
      chunks.push(chunk.length > 0 ? chunk : baseTargets.slice(-n));
    }
    
    return chunks;
  }
  
  const allMuscles = GOAL_TO_MUSCLE_BUCKETS[goal] || [];
  const chunks: string[][] = [];
  const n = Math.max(1, Math.floor(allMuscles.length / Math.max(1, daysPerWeek)));
  
  for (let i = 0; i < daysPerWeek; i++) {
    const chunk = allMuscles.slice(i * n, (i + 1) * n);
    chunks.push(chunk.length > 0 ? chunk : allMuscles.slice(-n));
  }
  
  return chunks;
}

// Main function to build a single session
async function buildSession(
  goal: string,
  experience: string,
  totalSessionMinutes: number,
  availableEquipment: string[] = [],
  targetMuscles: string[] = [],
  injuries: string[] = [],
  requireCardio: boolean = false,
  goalParamOverrides?: any
): Promise<{ plan: any[], summary: any }> {
  // Get exercises from cache (much faster than database query)
  const exercises = await getExercises();
  
  // Score exercises
  const scoredExercises = exercises.map(exercise => ({
    ...exercise,
    score: scoreExercise(exercise, goal, experience, targetMuscles, availableEquipment, injuries)
  }));
  
  // Filter exercises with positive scores
  const validExercises = scoredExercises.filter(ex => ex.score > 0);
  
  if (validExercises.length === 0) {
    throw new Error('No suitable exercises found for the given criteria');
  }
  
  // Get top exercises per muscle group
  const topExercises = validExercises
    .sort((a, b) => {
      if (a.primary_muscle === b.primary_muscle) {
        return b.score - a.score;
      }
      return a.primary_muscle.localeCompare(b.primary_muscle);
    })
    .reduce((acc, exercise) => {
      const muscle = exercise.primary_muscle;
      if (!acc[muscle] || acc[muscle].length < 3) {
        if (!acc[muscle]) acc[muscle] = [];
        acc[muscle].push(exercise);
      }
      return acc;
    }, {} as Record<string, any[]>);
  
  // Select exercises for target muscles
  const muscles = targetMuscles.length > 0 ? targetMuscles : GOAL_TO_MUSCLE_BUCKETS[goal] || [];
  const selected: any[] = [];
  
  for (const muscle of muscles) {
    const muscleExercises = topExercises[muscle];
    if (muscleExercises && muscleExercises.length > 0) {
      selected.push(muscleExercises[0]);
    }
  }
  
  // Get goal parameters
  const params = { ...GOAL_PRESETS[goal], ...goalParamOverrides };
  const reps = Math.round((params.rep_low + params.rep_high) / 2);
  const rest = params.rest_s;
  const tempo = params.tempo_s_per_rep;
  const setsMin = params.sets_min;
  const setsMax = params.sets_max;
  
  // Calculate time allocation
  const warm = DEFAULTS.warmup_s;
  const cool = DEFAULTS.cooldown_s;
  const trans = DEFAULTS.transition_s_per_ex;
  let timeLeft = totalSessionMinutes * 60 - warm - cool;
  
  // Fallback to top scored exercises if no specific muscle exercises found
  if (selected.length === 0) {
    // Limit exercises based on available time and muscle groups
    const maxExercises = Math.min(6, Math.max(1, Math.floor(timeLeft / (reps * tempo + rest + trans))));
    selected.push(...validExercises.sort((a, b) => b.score - a.score).slice(0, maxExercises));
  }
  
  if (timeLeft <= 0) {
    throw new Error('Session duration too short for warm-up and cool-down.');
  }
  
  const plan: any[] = [];
  const perSet = reps * tempo + rest;
  
  // Add cardio if required
  if (requireCardio) {
    const cardioTime = Math.max(6 * 60, Math.min(10 * 60, Math.floor(0.25 * timeLeft)));
    const cardioExercise = chooseCardioExercise(exercises);
    const block = cardioTime + trans;
    
    plan.push({
      Exercise: cardioExercise,
      "Primary muscle": "Full Body",
      Category: "Conditioning",
      Experience: experience,
      Sets: 1,
      Reps: "Time",
      "Load prescription": "Steady Z2 (RPE 6–7)",
      "Rest (s)": 0,
      "Est. time (s)": block,
      Video: "",
      Equipment: "Cardio Machine"
    });
    
    timeLeft -= block;
  }
  
  // Add strength exercises
  for (const exercise of selected) {
    if (timeLeft <= (perSet + trans)) break;
    
    const sets = setsMin;
    const block = sets * perSet + trans;
    
    if (block > timeLeft) break;
    
    plan.push({
      Exercise: exercise.exercise_name,
      "Primary muscle": exercise.primary_muscle,
      Category: exercise.category,
      Experience: exercise.experience,
      Sets: sets,
      Reps: reps,
      "Load prescription": goal === "strength" ? "Start ~80–87% 1RM (RPE 8–9)" : "RPE 7–8 (2–3 RIR)",
      "Rest (s)": rest,
      "Est. time (s)": block,
      Video: exercise.video_link || "",
      Equipment: exercise.equipment || "None"
    });
    
    timeLeft -= block;
  }
  
  // Optimize sets based on remaining time
  let i = 0;
  while (timeLeft > perSet && plan.some(row => row.Category !== "Conditioning" && row.Sets < setsMax)) {
    if (plan[i].Category !== "Conditioning" && plan[i].Sets < setsMax) {
      plan[i].Sets += 1;
      plan[i]["Est. time (s)"] += perSet;
      timeLeft -= perSet;
    }
    i = (i + 1) % plan.length;
  }
  
  // Add finisher if time allows
  if (timeLeft > 180 && ["fat_loss", "endurance", "hypertrophy"].includes(goal) && !requireCardio) {
    plan.push({
      Exercise: "Finisher: EMOM — Burpees or KB Swings",
      "Primary muscle": "Full Body",
      Category: "Conditioning",
      Experience: experience,
      Sets: Math.floor(timeLeft / 60),
      Reps: "EMOM 10–15 reps",
      "Load prescription": "Bodyweight/Light KB",
      "Rest (s)": "Balance of minute",
      "Est. time (s)": timeLeft,
      Video: "",
      Equipment: "Bodyweight/Kettlebell"
    });
    timeLeft = 0;
  }
  
  // Fallback to walking if no exercises added
  if (plan.length === 0) {
    plan.push({
      Exercise: "Walk (brisk)",
      "Primary muscle": "Full Body",
      Category: "Conditioning",
      Experience: experience,
      Sets: 1,
      Reps: "Time",
      "Load prescription": "RPE 6",
      "Rest (s)": 0,
      "Est. time (s)": totalSessionMinutes * 60 - warm - cool,
      Video: "",
      Equipment: "None"
    });
  }
  
  // Add estimated time in minutes
  plan.forEach(exercise => {
    exercise["Est. time (min)"] = Math.round((exercise["Est. time (s)"] / 60) * 10) / 10;
  });
  
  const totalUsed = plan.reduce((sum, ex) => sum + ex["Est. time (s)"], 0) + warm + cool;
  
  const summary = {
    "Total session (min)": Math.round((totalUsed / 60) * 10) / 10,
    "Warm-up (min)": Math.round((warm / 60) * 10) / 10,
    "Cool-down (min)": Math.round((cool / 60) * 10) / 10,
    "Exercises": plan.length
  };
  
  return { plan, summary };
}

// Convenience function to build session from UI data (equivalent to Python's build_session_from_ui)
async function buildSessionFromUI(clientData: any): Promise<{ plan: any[], summary: any }> {
  const cleanedData = cleanUIPayload(clientData);
  return buildSession(
    cleanedData.goal,
    cleanedData.experience,
    cleanedData.total_session_minutes,
    cleanedData.available_equipment,
    cleanedData.target_muscles,
    cleanedData.injuries,
    cleanedData.require_cardio
  );
}

// Convenience function to build program from UI data (equivalent to Python's build_program_from_ui)
async function buildProgramFromUI(
  clientData: any,
  weeks: number = 8,
  daysPerWeek: number = 3
): Promise<{ plan: any[], schedule: any[] }> {
  const cleanedData = cleanUIPayload(clientData);
  return buildProgram(
    cleanedData.goal,
    cleanedData.experience,
    cleanedData.total_session_minutes,
    cleanedData.available_equipment,
    cleanedData.target_muscles,
    cleanedData.injuries,
    weeks,
    daysPerWeek,
    cleanedData.require_cardio
  );
}

// Main function to build a complete program
async function buildProgram(
  goal: string,
  experience: string,
  totalSessionMinutes: number,
  availableEquipment: string[] = [],
  targetMuscles: string[] = [],
  injuries: string[] = [],
  weeks: number = 8,
  daysPerWeek: number = 3,
  requireCardio: boolean = false
): Promise<{ plan: any[], schedule: any[] }> {
  const dayTargets = splitTargets(goal, targetMuscles, daysPerWeek);
  const allRows: any[] = [];
  const schedule: any[] = [];
  
  for (let week = 1; week <= weeks; week++) {
    const weekOverridesData = weekOverrides(goal, week);
    const overrides = {
      rest_s: weekOverridesData.rest_s,
      sets_min: weekOverridesData.sets_min,
      sets_max: weekOverridesData.sets_max,
      rep_low: weekOverridesData.rep_low,
      rep_high: weekOverridesData.rep_high
    };
    
    for (let day = 1; day <= daysPerWeek; day++) {
      const targetMuscles = dayTargets[(day - 1) % dayTargets.length];
      
      const { plan, summary } = await buildSession(
        goal,
        experience,
        totalSessionMinutes,
        availableEquipment,
        targetMuscles,
        injuries,
        requireCardio,
        overrides
      );
      
      // Add week and day information
      plan.forEach(exercise => {
        exercise.Week = week;
        exercise.Day = day;
        exercise["Session ID"] = `W${week}D${day.toString().padStart(2, '0')}`;
        exercise["RPE target (week)"] = weekOverridesData.rpe_text;
        exercise["Phase (1-3=build,4=deload)"] = weekOverridesData.phase;
      });
      
      allRows.push(...plan);
      
      // Add to schedule
      const scheduleEntry = {
        ...summary,
        Week: week,
        Day: day,
        "Session ID": `W${week}D${day.toString().padStart(2, '0')}`,
        Targets: targetMuscles.join(", "),
        "RPE target (week)": weekOverridesData.rpe_text,
        "Phase (1-3=build,4=deload)": weekOverridesData.phase
      };
      
      schedule.push(scheduleEntry);
    }
  }
  
  return { plan: allRows, schedule };
}

// Main export function to generate workout plan from client data
export async function generateSearchBasedWorkoutPlan(clientId: number, weeks: number = 8, daysPerWeek?: number): Promise<{
  success: boolean;
  workoutPlan?: any[];
  schedule?: any[];
  message?: string;
}> {
  try {
    console.log('🔍 Starting search-based workout plan generation for client:', clientId);
    
    // Fetch client data
    const { data: clientData, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch client data: ${error.message}`);
    }
    
    if (!clientData) {
      throw new Error(`No client found with ID: ${clientId}`);
    }
    
    console.log('✅ Client data fetched successfully');
    
    // Clean and process client data
    const cleanedData = cleanUIPayload(clientData);
    
    // Parse workout days to determine actual number of training days
    const parsedWorkoutDays = parseClientWorkoutDays(clientData.workout_days);
    const actualDaysPerWeek = daysPerWeek || parsedWorkoutDays.length || clientData.training_days_per_week || 3;
    
    console.log('📊 Processed client data:', cleanedData);
    
    // Build the program
    const { plan, schedule } = await buildProgram(
      cleanedData.goal,
      cleanedData.experience,
      cleanedData.total_session_minutes,
      cleanedData.available_equipment,
      cleanedData.target_muscles,
      cleanedData.injuries,
      weeks,
      actualDaysPerWeek,
      cleanedData.require_cardio
    );
    
    console.log('✅ Workout plan generated successfully');
    console.log(`📋 Generated ${plan.length} exercises across ${weeks} weeks, ${actualDaysPerWeek} days per week`);
    
    return {
      success: true,
      workoutPlan: plan,
      schedule: schedule
    };
    
  } catch (error) {
    console.error(`❌ Error generating search-based workout plan:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to generate a single session (for testing or single-day plans)
export async function generateSearchBasedWorkoutSession(clientId: number): Promise<{
  success: boolean;
  workoutPlan?: any[];
  summary?: any;
  message?: string;
}> {
  try {
    console.log('🔍 Starting search-based workout session generation for client:', clientId);
    
    // Fetch client data
    const { data: clientData, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch client data: ${error.message}`);
    }
    
    if (!clientData) {
      throw new Error(`No client found with ID: ${clientId}`);
    }
    
    // Clean and process client data
    const cleanedData = cleanUIPayload(clientData);
    
    // Build a single session
    const { plan, summary } = await buildSession(
      cleanedData.goal,
      cleanedData.experience,
      cleanedData.total_session_minutes,
      cleanedData.available_equipment,
      cleanedData.target_muscles,
      cleanedData.injuries,
      cleanedData.require_cardio
    );
    
    return {
      success: true,
      workoutPlan: plan,
      summary: summary
    };
    
  } catch (error) {
    console.error('❌ Error generating search-based workout session:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to normalize duration to reasonable values
function normalizeDuration(duration: number): number {
  if (duration <= 0) return 5;
  if (duration < 3) return 5; // Minimum 5 minutes for any exercise
  if (duration < 10) return Math.round(duration); // Round to nearest minute for short exercises
  return Math.round(duration / 5) * 5; // Round to nearest 5 minutes for longer exercises
}

// Helper function to calculate weight based on exercise type and RPE
function calculateWeight(exercise: any, rpeText: string): string {
  const category = exercise.Category?.toLowerCase() || '';
  const exerciseName = exercise.Exercise?.toLowerCase() || '';
  
  // Bodyweight exercises
  if (category.includes('bodyweight') || category.includes('calisthenics') || 
      exerciseName.includes('push-up') || exerciseName.includes('pull-up') || 
      exerciseName.includes('squat') && !exerciseName.includes('dumbbell') && !exerciseName.includes('barbell')) {
    return 'Bodyweight';
  }
  
  // Cardio exercises
  if (category.includes('cardio') || category.includes('aerobic')) {
    return 'N/A';
  }
  
  // Strength exercises - provide weight ranges based on RPE
  const rpe = rpeText.match(/RPE (\d+(?:\.\d+)?)/)?.[1];
  if (rpe) {
    const rpeNum = parseFloat(rpe);
    if (rpeNum >= 8) {
      return 'Heavy (80-90% 1RM)';
    } else if (rpeNum >= 7) {
      return 'Moderate (70-80% 1RM)';
    } else {
      return 'Light (60-70% 1RM)';
    }
  }
  
  return 'Moderate weight';
}

// Helper function to parse client workout days
function parseClientWorkoutDays(workoutDays: any): string[] {
  if (!workoutDays) return ['monday', 'wednesday', 'friday']; // Default
  
  if (Array.isArray(workoutDays)) {
    return workoutDays.map((day: any) => day.toLowerCase());
  }
  
  if (typeof workoutDays === 'string') {
    // Handle both comma-separated and object format
    if (workoutDays.includes('{') && workoutDays.includes('}')) {
      // Extract from object format like {Mon,Fri,Sat}
      const match = workoutDays.match(/\{([^}]+)\}/);
      if (match) {
        const days = match[1].split(',').map(day => day.trim().toLowerCase());
        // Map abbreviated day names to full names
        const dayMapping: Record<string, string> = {
          'mon': 'monday',
          'tue': 'tuesday', 
          'wed': 'wednesday',
          'thu': 'thursday',
          'fri': 'friday',
          'sat': 'saturday',
          'sun': 'sunday'
        };
        return days.map(day => dayMapping[day] || day);
      }
    } else {
      // Handle comma-separated format like "Monday, Wednesday, Friday"
      return workoutDays.toLowerCase().split(',').map(day => day.trim());
    }
  }
  
  return ['monday', 'wednesday', 'friday']; // Default fallback
}

// Function to convert search-based workout plan to AI-compatible format with workout day mapping
function convertToAIFormatWithWorkoutDays(searchPlan: any[], clientId: number, planStartDate?: Date, clientWorkoutDays?: any): any {
  console.log('🔄 Converting search-based plan to AI format with workout day mapping...');
  
  // Group exercises by week and day
  const groupedByWeek: Record<string, Record<string, any[]>> = {};
  
  searchPlan.forEach(exercise => {
    const week = exercise.Week || 1;
    const day = exercise.Day || 1;
    const weekKey = `week_${week}`;
    const dayKey = `day_${day}`;
    
    if (!groupedByWeek[weekKey]) {
      groupedByWeek[weekKey] = {};
    }
    if (!groupedByWeek[weekKey][dayKey]) {
      groupedByWeek[weekKey][dayKey] = [];
    }
    
    // Normalize duration to nearest 10 minutes
    const rawDuration = parseFloat(exercise["Est. time (min)"]) || parseFloat(exercise["Est. time (s)"]) / 60 || 10;
    const duration = normalizeDuration(rawDuration);
    
    // Calculate weight based on exercise type and RPE
    const weight = calculateWeight(exercise, exercise["RPE target (week)"]);
    
    // Convert exercise format to match AI format with improvements
    const convertedExercise = {
      exercise_name: exercise.Exercise,
      category: exercise.Category,
      body_part: exercise["Primary muscle"],
      sets: exercise.Sets,
      reps: exercise.Reps,
      duration: duration.toString(),
      weights: weight,
      equipment: exercise.Equipment || "None", // Ensure equipment is mapped
      coach_tip: `${exercise["RPE target (week)"]} (${exercise["RPE target (week)"].replace('RPE', '').trim()} RIR)`,
      video_link: exercise.Video || "",
      rest: exercise["Rest (s)"],
      experience: exercise.Experience,
      rpe_target: exercise["RPE target (week)"],
      phase: exercise["Phase (1-3=build,4=deload)"],
      session_id: exercise["Session ID"]
    };
    
    groupedByWeek[weekKey][dayKey].push(convertedExercise);
  });
  
  // Parse client workout days
  const clientDays = parseClientWorkoutDays(clientWorkoutDays);
  console.log('📅 Client workout days:', clientDays);
  
  // Create a 7-day array starting from planStartDate
  const weekDays: Array<{
    date: string;
    dayName: string;
    isWorkoutDay: boolean;
    workout: any | null;
  }> = [];
  
  const startDate = planStartDate || new Date();
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    weekDays.push({
      date: currentDate.toISOString().split('T')[0],
      dayName: dayName,
      isWorkoutDay: false,
      workout: null
    });
  }
  
  // Find which days of the week match client's workout days
  const workoutDayIndices: number[] = [];
  weekDays.forEach((day, index) => {
    if (clientDays.includes(day.dayName)) {
      workoutDayIndices.push(index);
      day.isWorkoutDay = true;
      console.log(`✅ Found workout day: ${day.dayName} at index ${index}`);
    }
  });
  
  // Convert grouped exercises to days format
  const days: any[] = [];
  let workoutIndex = 0;
  
  Object.keys(groupedByWeek).sort().forEach(weekKey => {
    const week = parseInt(weekKey.replace('week_', ''));
    Object.keys(groupedByWeek[weekKey]).sort().forEach(dayKey => {
      const day = parseInt(dayKey.replace('day_', ''));
      const exercises = groupedByWeek[weekKey][dayKey];
      
      // Calculate focus based on primary muscle groups
      const muscleGroups = exercises.map((ex: any) => ex.body_part).filter(Boolean);
      const focus = muscleGroups.length > 0 ? 
        `${muscleGroups.slice(0, 2).join(', ')}${muscleGroups.length > 2 ? ' & more' : ''}` : 
        'Workout';
      
      // Assign to the next available workout day
      if (workoutIndex < workoutDayIndices.length) {
        const dayIndex = workoutDayIndices[workoutIndex];
        const targetDate = weekDays[dayIndex].date;
        
        days.push({
          day: workoutIndex + 1,
          date: targetDate,
          focus: focus,
          exercises: exercises.map((ex: any) => ({
            ...ex,
            dayIndex: workoutIndex
          }))
        });
        
        workoutIndex++;
      }
    });
  });
  
  // Fill remaining days with rest days
  for (let i = 0; i < 7; i++) {
    const existingDay = days.find(d => d.date === weekDays[i].date);
    if (!existingDay) {
      days.push({
        day: i + 1,
        date: weekDays[i].date,
        focus: 'Rest Day',
        exercises: []
      });
    }
  }
  
  // Sort days by date
  days.sort((a, b) => a.date.localeCompare(b.date));
  
  console.log(`✅ Converted ${searchPlan.length} exercises to ${days.length} days with workout day mapping`);
  
  return {
    days: days,
    workout_plan: days.flatMap((day: any) => day.exercises)
  };
}

// Enhanced function to generate workout plan in AI-compatible format
export async function generateSearchBasedWorkoutPlanForReview(
  clientId: number, 
  weeks: number = 1, // Changed to 1 week (7 days) to match LLM format
  daysPerWeek?: number,
  planStartDate?: Date
): Promise<{
  success: boolean;
  workoutPlan?: any;
  clientInfo?: any;
  message?: string;
  generatedAt?: string;
}> {
  const startTime = Date.now();
  console.log('🚀 === SEARCH-BASED WORKOUT PLAN GENERATION START ===');
  console.log(`👤 Client ID: ${clientId}`);
  console.log(`📅 Start time: ${new Date().toISOString()}`);
  
  try {
    console.log('🔍 Starting search-based workout plan generation for review for client:', clientId);
    
    // Step 1: Fetch client data
    const clientFetchStart = Date.now();
    const { data: clientData, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    const clientFetchTime = Date.now() - clientFetchStart;
    console.log(`⏱️ Client data fetch: ${clientFetchTime}ms`);
    
    if (error) {
      throw new Error(`Failed to fetch client data: ${error.message}`);
    }
    
    if (!clientData) {
      throw new Error(`No client found with ID: ${clientId}`);
    }
    
    console.log('✅ Client data fetched successfully');
    
    // Step 2: Clean and process client data
    const processingStart = Date.now();
    const cleanedData = cleanUIPayload(clientData);
    
    // Parse workout days to determine actual number of training days
    const parsedWorkoutDays = parseClientWorkoutDays(clientData.workout_days);
    const actualDaysPerWeek = daysPerWeek || parsedWorkoutDays.length || clientData.training_days_per_week || 3;
    
    const processingTime = Date.now() - processingStart;
    console.log(`⏱️ Data processing: ${processingTime}ms`);
    
    console.log('📊 Processed client data:', cleanedData);
    console.log(`📅 Parsed workout days: ${parsedWorkoutDays}`);
    console.log(`🎯 Actual days per week: ${actualDaysPerWeek}`);
    
    // Step 3: Build the program for 1 week only
    const buildStart = Date.now();
    const { plan, schedule } = await buildProgram(
      cleanedData.goal,
      cleanedData.experience,
      cleanedData.total_session_minutes,
      cleanedData.available_equipment,
      cleanedData.target_muscles,
      cleanedData.injuries,
      1, // Force 1 week
      actualDaysPerWeek,
      cleanedData.require_cardio
    );
    const buildTime = Date.now() - buildStart;
    console.log(`⏱️ Program building: ${buildTime}ms`);
    
    // Step 4: Convert to AI-compatible format with client workout days mapping
    const conversionStart = Date.now();
    const convertedPlan = convertToAIFormatWithWorkoutDays(plan, clientId, planStartDate, clientData.workout_days);
    const conversionTime = Date.now() - conversionStart;
    console.log(`⏱️ Format conversion: ${conversionTime}ms`);
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log('✅ Workout plan generated and converted successfully');
    console.log('📊 === PERFORMANCE BREAKDOWN ===');
    console.log(`   Client fetch: ${clientFetchTime}ms`);
    console.log(`   Data processing: ${processingTime}ms`);
    console.log(`   Program building: ${buildTime}ms`);
    console.log(`   Format conversion: ${conversionTime}ms`);
    console.log(`   Total generation time: ${totalDuration}ms`);
    console.log(`📋 Generated ${plan.length} exercises for 1 week, ${actualDaysPerWeek} days per week`);
    console.log('🚀 === SEARCH-BASED WORKOUT PLAN GENERATION END ===');
    
    // Create client info object similar to AI format
    const clientInfo = {
      id: clientData.client_id,
      name: clientData.cl_name,
      preferredName: clientData.cl_prefer_name,
      email: clientData.cl_email,
      primaryGoal: clientData.cl_primary_goal,
      trainingExperience: clientData.training_experience,
      trainingDaysPerWeek: clientData.training_days_per_week,
      trainingTimePerSession: clientData.training_time_per_session,
      trainingLocation: clientData.training_location,
      availableEquipment: clientData.available_equipment,
      focusAreas: clientData.focus_areas,
      injuriesLimitations: clientData.injuries_limitations
    };
    
    return {
      success: true,
      workoutPlan: convertedPlan,
      clientInfo: clientInfo,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error generating search-based workout plan:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
