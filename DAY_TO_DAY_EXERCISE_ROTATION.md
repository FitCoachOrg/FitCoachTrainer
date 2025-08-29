# Day-to-Day Exercise Rotation System

## 🎯 **PROBLEM STATEMENT**

### **Current Issue:**
- Same exercises repeated across multiple days in the same week
- No consideration for muscle recovery between days
- Risk of overuse injuries
- Boring and ineffective training

### **Goal:**
- **Different exercises each day** within the same week
- **Balanced muscle group targeting** across the week
- **Proper recovery consideration** between training days
- **Movement pattern variety** within the week

## 🔧 **DAY-TO-DAY ROTATION STRATEGY**

### **1. Weekly Exercise Pool Management**

#### **A. Create Weekly Exercise Pool:**
```typescript
interface WeeklyExercisePool {
  weekNumber: number;
  clientId: string;
  availableExercises: {
    [muscleGroup: string]: {
      primary: any[];      // Main exercises for this muscle group
      secondary: any[];    // Alternative exercises
      accessory: any[];    // Isolation exercises
    };
  };
  usedExercises: {
    [dayNumber: number]: {
      exercises: string[];
      muscleGroups: string[];
      movementPatterns: string[];
    };
  };
}

private static createWeeklyExercisePool(
  clientId: string,
  weekNumber: number,
  muscleGroups: string[][],
  scoredExercises: any[],
  exerciseHistory: ExerciseHistory[]
): WeeklyExercisePool {
  const pool: WeeklyExercisePool = {
    weekNumber,
    clientId,
    availableExercises: {},
    usedExercises: {}
  };

  // Group exercises by muscle group
  muscleGroups.forEach((muscleGroup, dayIndex) => {
    const groupKey = muscleGroup.join('_');
    
    // Get exercises for this muscle group
    const groupExercises = this.getExercisesForMuscleGroup(scoredExercises, muscleGroup);
    
    // Filter out recently used exercises (from previous weeks)
    const filteredExercises = this.filterRecentlyUsedExercises(groupExercises, exerciseHistory);
    
    // Categorize exercises by type
    pool.availableExercises[groupKey] = {
      primary: this.categorizeExercises(filteredExercises, 'primary'),
      secondary: this.categorizeExercises(filteredExercises, 'secondary'),
      accessory: this.categorizeExercises(filteredExercises, 'accessory')
    };
  });

  return pool;
}
```

#### **B. Exercise Categorization:**
```typescript
private static categorizeExercises(exercises: any[], type: 'primary' | 'secondary' | 'accessory'): any[] {
  return exercises.filter(exercise => {
    const exerciseName = exercise.exercise_name.toLowerCase();
    
    switch (type) {
      case 'primary':
        // Compound, multi-joint movements
        return exerciseName.includes('squat') || 
               exerciseName.includes('deadlift') || 
               exerciseName.includes('press') || 
               exerciseName.includes('row') || 
               exerciseName.includes('pull-up') ||
               exerciseName.includes('push-up');
      
      case 'secondary':
        // Moderate complexity movements
        return exerciseName.includes('lunge') || 
               exerciseName.includes('step-up') || 
               exerciseName.includes('dumbbell') ||
               exerciseName.includes('kettlebell') ||
               exerciseName.includes('dip');
      
      case 'accessory':
        // Isolation, single-joint movements
        return exerciseName.includes('curl') || 
               exerciseName.includes('extension') || 
               exerciseName.includes('raise') ||
               exerciseName.includes('fly') ||
               exerciseName.includes('crunch');
      
      default:
        return false;
    }
  });
}
```

### **2. Day-to-Day Selection Algorithm**

#### **A. Main Selection Function:**
```typescript
private static selectExercisesForDay(
  dayNumber: number,
  muscleGroup: string[],
  weeklyPool: WeeklyExercisePool,
  exercisesPerDay: number,
  previousDaysExercises: any[]
): any[] {
  console.log(`🎯 Selecting exercises for Day ${dayNumber}: ${muscleGroup.join(', ')}`);
  
  const groupKey = muscleGroup.join('_');
  const availableExercises = weeklyPool.availableExercises[groupKey];
  
  // Step 1: Avoid exercises used in previous days this week
  const usedThisWeek = this.getExercisesUsedThisWeek(weeklyPool, dayNumber);
  const unusedExercises = this.filterUsedExercises(availableExercises, usedThisWeek);
  
  // Step 2: Ensure movement pattern variety within the week
  const patternBalancedExercises = this.balanceMovementPatternsWithinWeek(
    unusedExercises,
    weeklyPool,
    dayNumber
  );
  
  // Step 3: Balance exercise types (primary/secondary/accessory)
  const typeBalancedExercises = this.balanceExerciseTypes(
    patternBalancedExercises,
    dayNumber,
    exercisesPerDay
  );
  
  // Step 4: Add randomization factor
  const randomizedExercises = this.addRandomizationFactor(typeBalancedExercises);
  
  // Step 5: Select final exercises
  const selectedExercises = randomizedExercises.slice(0, exercisesPerDay);
  
  // Step 6: Update weekly pool
  this.updateWeeklyPool(weeklyPool, dayNumber, selectedExercises, muscleGroup);
  
  console.log(`✅ Day ${dayNumber} exercises: ${selectedExercises.map(ex => ex.exercise_name).join(', ')}`);
  
  return selectedExercises;
}
```

#### **B. Filter Used Exercises:**
```typescript
private static filterUsedExercises(
  availableExercises: { primary: any[]; secondary: any[]; accessory: any[] },
  usedExercises: string[]
): { primary: any[]; secondary: any[]; accessory: any[] } {
  const filter = (exercises: any[]) => 
    exercises.filter(ex => !usedExercises.includes(ex.exercise_name.toLowerCase()));
  
  return {
    primary: filter(availableExercises.primary),
    secondary: filter(availableExercises.secondary),
    accessory: filter(availableExercises.accessory)
  };
}
```

#### **C. Movement Pattern Balance Within Week:**
```typescript
private static balanceMovementPatternsWithinWeek(
  exercises: { primary: any[]; secondary: any[]; accessory: any[] },
  weeklyPool: WeeklyExercisePool,
  dayNumber: number
): { primary: any[]; secondary: any[]; accessory: any[] } {
  // Get movement patterns used in previous days this week
  const usedPatterns = this.getMovementPatternsUsedThisWeek(weeklyPool, dayNumber);
  
  const boostUnderusedPatterns = (exerciseList: any[]) => 
    exerciseList.map(exercise => {
      const pattern = this.getMovementPattern(exercise.exercise_name);
      const patternCount = usedPatterns[pattern] || 0;
      
      let score = exercise.score || 0;
      if (patternCount === 0) {
        score += 40; // Significant boost for unused patterns
      } else if (patternCount === 1) {
        score += 20; // Moderate boost for lightly used patterns
      }
      
      return { ...exercise, score };
    }).sort((a, b) => b.score - a.score);
  
  return {
    primary: boostUnderusedPatterns(exercises.primary),
    secondary: boostUnderusedPatterns(exercises.secondary),
    accessory: boostUnderusedPatterns(exercises.accessory)
  };
}
```

#### **D. Exercise Type Balance:**
```typescript
private static balanceExerciseTypes(
  exercises: { primary: any[]; secondary: any[]; accessory: any[] },
  dayNumber: number,
  exercisesPerDay: number
): any[] {
  const allExercises: any[] = [];
  
  // Determine exercise type distribution based on day
  const typeDistribution = this.getExerciseTypeDistribution(dayNumber, exercisesPerDay);
  
  // Add primary exercises
  if (typeDistribution.primary > 0) {
    allExercises.push(...exercises.primary.slice(0, typeDistribution.primary));
  }
  
  // Add secondary exercises
  if (typeDistribution.secondary > 0) {
    allExercises.push(...exercises.secondary.slice(0, typeDistribution.secondary));
  }
  
  // Add accessory exercises
  if (typeDistribution.accessory > 0) {
    allExercises.push(...exercises.accessory.slice(0, typeDistribution.accessory));
  }
  
  return allExercises;
}

private static getExerciseTypeDistribution(dayNumber: number, exercisesPerDay: number) {
  // Different distribution based on day of week
  switch (dayNumber) {
    case 1: // Monday - Start strong with compound movements
      return {
        primary: Math.ceil(exercisesPerDay * 0.6),    // 60% primary
        secondary: Math.ceil(exercisesPerDay * 0.3),  // 30% secondary
        accessory: Math.ceil(exercisesPerDay * 0.1)   // 10% accessory
      };
    
    case 2: // Tuesday - Moderate intensity
      return {
        primary: Math.ceil(exercisesPerDay * 0.4),    // 40% primary
        secondary: Math.ceil(exercisesPerDay * 0.4),  // 40% secondary
        accessory: Math.ceil(exercisesPerDay * 0.2)   // 20% accessory
      };
    
    case 3: // Wednesday - Mid-week variety
      return {
        primary: Math.ceil(exercisesPerDay * 0.3),    // 30% primary
        secondary: Math.ceil(exercisesPerDay * 0.5),  // 50% secondary
        accessory: Math.ceil(exercisesPerDay * 0.2)   // 20% accessory
      };
    
    case 4: // Thursday - Build up intensity
      return {
        primary: Math.ceil(exercisesPerDay * 0.5),    // 50% primary
        secondary: Math.ceil(exercisesPerDay * 0.3),  // 30% secondary
        accessory: Math.ceil(exercisesPerDay * 0.2)   // 20% accessory
      };
    
    case 5: // Friday - End strong
      return {
        primary: Math.ceil(exercisesPerDay * 0.6),    // 60% primary
        secondary: Math.ceil(exercisesPerDay * 0.3),  // 30% secondary
        accessory: Math.ceil(exercisesPerDay * 0.1)   // 10% accessory
      };
    
    default: // Weekend - Lighter intensity
      return {
        primary: Math.ceil(exercisesPerDay * 0.2),    // 20% primary
        secondary: Math.ceil(exercisesPerDay * 0.5),  // 50% secondary
        accessory: Math.ceil(exercisesPerDay * 0.3)   // 30% accessory
      };
  }
}
```

### **3. Weekly Exercise Generation**

#### **A. Modified createWorkoutPlan:**
```typescript
private static async createWorkoutPlan(
  muscleGroups: string[][],
  scoredExercises: any[],
  template: any,
  workoutDays: string[],
  planStartDate: Date,
  sessionMinutes: number,
  warmup: number,
  cooldown: number,
  exercisesPerDay: number,
  injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
  clientId: string,
  weekNumber: number,
  progressionAnalysis?: any
): Promise<any> {
  // Get exercise history for variety
  const exerciseHistory = await this.getExerciseHistory(clientId, 4);
  
  // Create weekly exercise pool
  const weeklyPool = this.createWeeklyExercisePool(
    clientId,
    weekNumber,
    muscleGroups,
    scoredExercises,
    exerciseHistory
  );
  
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
      const dayNumber = workoutIndex + 1;
      
      // Select exercises for this day with variety
      const selectedExercises = this.selectExercisesForDay(
        dayNumber,
        muscleGroup,
        weeklyPool,
        exercisesPerDay,
        injuries,
        progressionAnalysis
      );
      
      // Convert to exercise objects
      const exercises = this.convertToExerciseObjects(
        selectedExercises,
        template,
        injuries,
        progressionAnalysis
      );
      
      // Calculate day total time
      const timeBreakdown = this.calculateDayTotalTime(exercises, warmup, cooldown);
      
      days.push({
        day: i + 1,
        date: dateStr,
        focus: muscleGroup.join(', '),
        exercises,
        timeBreakdown,
        isWorkoutDay: true
      });
    } else {
      days.push({
        day: i + 1,
        date: dateStr,
        focus: 'Rest Day',
        exercises: [],
        timeBreakdown: { warmup: 0, exercises: 0, rest: 0, cooldown: 0, total: 0 },
        isWorkoutDay: false
      });
    }
  }

  return {
    days,
    workout_plan: days.flatMap(day => day.exercises),
    summary: {
      totalDays: 7,
      workoutDays: workoutDays.length,
      restDays: 7 - workoutDays.length,
      sessionDuration: sessionMinutes,
      warmup,
      cooldown,
      weekNumber,
      exerciseVariety: this.calculateExerciseVariety(days)
    }
  };
}
```

### **4. Exercise Variety Metrics**

#### **A. Variety Calculation:**
```typescript
private static calculateExerciseVariety(days: any[]): {
  uniqueExercises: number;
  totalExercises: number;
  varietyScore: number;
  movementPatterns: string[];
  equipmentUsed: string[];
} {
  const allExercises = days.flatMap(day => day.exercises);
  const uniqueExercises = [...new Set(allExercises.map(ex => ex.exercise_name))];
  const movementPatterns = [...new Set(allExercises.map(ex => ex.movementPattern))];
  const equipmentUsed = [...new Set(allExercises.map(ex => ex.equipment))];
  
  const varietyScore = (uniqueExercises.length / allExercises.length) * 100;
  
  return {
    uniqueExercises: uniqueExercises.length,
    totalExercises: allExercises.length,
    varietyScore: Math.round(varietyScore),
    movementPatterns,
    equipmentUsed
  };
}
```

## 📊 **EXAMPLE WEEKLY ROTATION**

### **Week 1 (Barbell Focus):**

#### **Monday (Day 1):**
- **Primary**: Barbell Bench Press, Barbell Squats
- **Secondary**: Barbell Rows
- **Accessory**: Barbell Curls

#### **Tuesday (Day 2):**
- **Primary**: Dumbbell Overhead Press, Dumbbell Deadlifts
- **Secondary**: Dumbbell Lunges, Dumbbell Rows
- **Accessory**: Dumbbell Lateral Raises

#### **Wednesday (Day 3):**
- **Primary**: Kettlebell Swings
- **Secondary**: Kettlebell Goblet Squats, Kettlebell Rows
- **Accessory**: Kettlebell Turkish Get-ups

#### **Thursday (Day 4):**
- **Primary**: Barbell Deadlifts, Barbell Overhead Press
- **Secondary**: Barbell Incline Press
- **Accessory**: Barbell Shrugs

#### **Friday (Day 5):**
- **Primary**: Bodyweight Pull-ups, Bodyweight Dips
- **Secondary**: Bodyweight Push-ups, Bodyweight Squats
- **Accessory**: Bodyweight Planks

### **Key Features:**
1. **No exercise repeats** within the week
2. **Different equipment focus** each day
3. **Balanced movement patterns** across the week
4. **Progressive intensity** (strong start, moderate middle, strong finish)
5. **Varied exercise types** (primary/secondary/accessory)

## 🎯 **IMPLEMENTATION BENEFITS**

### **1. Exercise Variety:**
- ✅ **No repeats** within the same week
- ✅ **Different equipment** each day
- ✅ **Movement pattern balance** across the week

### **2. Training Quality:**
- ✅ **Proper recovery** between similar movements
- ✅ **Balanced muscle targeting** throughout the week
- ✅ **Progressive intensity** management

### **3. Client Engagement:**
- ✅ **Fresh workouts** every day
- ✅ **Varied challenges** throughout the week
- ✅ **Reduced boredom** and plateau risk

## 🚀 **NEXT STEPS**

1. **Implement weekly exercise pool** management
2. **Add day-to-day selection algorithm**
3. **Integrate with existing workout generator**
4. **Test with real client data**
5. **Monitor variety metrics**

**This day-to-day rotation system will ensure every workout day is unique, engaging, and effective!**
