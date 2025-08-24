# Exercise Variety Implementation Plan

## 📊 **DATA SOURCE: SCHEDULE TABLE**

### **Current Schedule Table Structure:**
```sql
-- From schedule table
{
  "client_id": 36,
  "type": "workout",
  "task": "workout", 
  "icon": "dumbell",
  "summary": "Upper Body Focus",
  "for_date": "2025-08-24",
  "for_time": "16:00:00",
  "workout_id": "85743254-118b-43fb-8a02-736007eb1c3b",
  "details_json": {
    "focus": "Upper Body",
    "exercises": [
      {
        "exercise_name": "Push-ups",
        "category": "Upper Body",
        "body_part": "Chest",
        "sets": 3,
        "reps": "10-15",
        "duration": 8,
        "weights": "Bodyweight",
        "equipment": "bodyweight",
        "coach_tip": "Focus on form",
        "video_link": "https://...",
        "rest": 60,
        "experience": "Beginner"
      }
    ]
  },
  "is_approved": false
}
```

## 🔧 **IMPLEMENTATION STRATEGY**

### **1. Exercise History Tracking via Schedule Table**

#### **A. Query Recent Exercise History:**
```typescript
private static async getExerciseHistory(
  clientId: string, 
  weeksBack: number = 4
): Promise<ExerciseHistory[]> {
  const { data: scheduleEntries, error } = await supabase
    .from('schedule')
    .select('details_json, for_date')
    .eq('client_id', clientId)
    .eq('type', 'workout')
    .gte('for_date', new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('for_date', { ascending: false });

  if (error) {
    console.error('Error fetching exercise history:', error);
    return [];
  }

  const exerciseHistory: ExerciseHistory[] = [];
  
  scheduleEntries?.forEach(entry => {
    const exercises = entry.details_json?.exercises || [];
    exercises.forEach((exercise: any) => {
      exerciseHistory.push({
        exerciseName: exercise.exercise_name,
        equipment: exercise.equipment,
        category: exercise.category,
        bodyPart: exercise.body_part,
        lastUsed: new Date(entry.for_date),
        usageCount: 1
      });
    });
  });

  // Aggregate usage counts
  const aggregatedHistory = this.aggregateExerciseHistory(exerciseHistory);
  return aggregatedHistory;
}
```

#### **B. Exercise History Interface:**
```typescript
interface ExerciseHistory {
  exerciseName: string;
  equipment: string;
  category: string;
  bodyPart: string;
  lastUsed: Date;
  usageCount: number;
  movementPattern?: string;
}
```

### **2. Movement Pattern Classification System**

#### **A. Movement Pattern Mapping:**
```typescript
private static readonly MOVEMENT_PATTERNS = {
  // Push Patterns
  'Horizontal Push': {
    keywords: ['push-up', 'bench press', 'dips', 'chest press', 'incline press'],
    exercises: ['Push-ups', 'Bench Press', 'Dips', 'Chest Press', 'Incline Press']
  },
  'Vertical Push': {
    keywords: ['overhead press', 'shoulder press', 'pike push-up', 'handstand'],
    exercises: ['Overhead Press', 'Shoulder Press', 'Pike Push-ups', 'Handstand Push-ups']
  },
  
  // Pull Patterns
  'Horizontal Pull': {
    keywords: ['row', 'face pull', 'band pull', 'cable row'],
    exercises: ['Barbell Rows', 'Dumbbell Rows', 'Face Pulls', 'Cable Rows']
  },
  'Vertical Pull': {
    keywords: ['pull-up', 'chin-up', 'lat pulldown', 'assisted pull'],
    exercises: ['Pull-ups', 'Chin-ups', 'Lat Pulldowns', 'Assisted Pull-ups']
  },
  
  // Lower Body Patterns
  'Squat': {
    keywords: ['squat', 'lunge', 'step-up', 'goblet squat'],
    exercises: ['Back Squat', 'Front Squat', 'Goblet Squat', 'Lunges', 'Step-ups']
  },
  'Hinge': {
    keywords: ['deadlift', 'romanian', 'swing', 'good morning'],
    exercises: ['Deadlift', 'Romanian Deadlift', 'Kettlebell Swing', 'Good Mornings']
  },
  
  // Core Patterns
  'Anti-Rotation': {
    keywords: ['pallof', 'woodchop', 'russian twist', 'anti-rotation'],
    exercises: ['Pallof Press', 'Woodchops', 'Russian Twists', 'Anti-Rotation Press']
  },
  'Anti-Extension': {
    keywords: ['plank', 'dead bug', 'ab wheel', 'rollout'],
    exercises: ['Plank', 'Dead Bug', 'Ab Wheel Rollout', 'Cable Rollout']
  },
  'Anti-Lateral Flexion': {
    keywords: ['side plank', 'farmer carry', 'suitcase carry'],
    exercises: ['Side Plank', 'Farmer Carries', 'Suitcase Carries']
  }
};

private static getMovementPattern(exerciseName: string): string {
  const exerciseLower = exerciseName.toLowerCase();
  
  for (const [pattern, data] of Object.entries(this.MOVEMENT_PATTERNS)) {
    if (data.keywords.some(keyword => exerciseLower.includes(keyword))) {
      return pattern;
    }
  }
  
  return 'General'; // Default for unrecognized patterns
}
```

### **3. Equipment Rotation System**

#### **A. Equipment Categories:**
```typescript
private static readonly EQUIPMENT_CATEGORIES = {
  'Barbell': ['barbell', 'bench'],
  'Dumbbell': ['dumbbell', 'dumbbells'],
  'Bodyweight': ['bodyweight', 'none'],
  'Kettlebell': ['kettlebell'],
  'Cable': ['cable', 'machine'],
  'Resistance Bands': ['bands', 'resistance bands'],
  'Cardio': ['cardio_machine', 'bike', 'rower', 'treadmill']
};

private static getEquipmentCategory(equipment: string): string {
  const equipmentLower = equipment.toLowerCase();
  
  for (const [category, keywords] of Object.entries(this.EQUIPMENT_CATEGORIES)) {
    if (keywords.some(keyword => equipmentLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}
```

### **4. Enhanced Exercise Selection with Variety**

#### **A. Main Selection Function:**
```typescript
private static selectExercisesWithVariety(
  availableExercises: any[],
  muscleGroup: string[],
  exercisesPerDay: number,
  clientId: string,
  weekNumber: number,
  exerciseHistory: ExerciseHistory[]
): any[] {
  console.log(`🎯 Selecting ${exercisesPerDay} exercises with variety for week ${weekNumber}`);
  
  // Step 1: Filter out recently used exercises (last 2 weeks)
  const recentlyUsedExercises = exerciseHistory
    .filter(hist => {
      const daysSinceUsed = Math.floor((Date.now() - hist.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUsed <= 14; // Last 2 weeks
    })
    .map(hist => hist.exerciseName.toLowerCase());
  
  const filteredExercises = availableExercises.filter(exercise => 
    !recentlyUsedExercises.includes(exercise.exercise_name.toLowerCase())
  );
  
  console.log(`📊 Filtered out ${availableExercises.length - filteredExercises.length} recently used exercises`);
  
  // Step 2: Apply movement pattern variety
  const patternBalancedExercises = this.balanceMovementPatterns(
    filteredExercises, 
    muscleGroup, 
    exerciseHistory
  );
  
  // Step 3: Apply equipment rotation
  const equipmentRotatedExercises = this.applyEquipmentRotation(
    patternBalancedExercises,
    weekNumber,
    exerciseHistory
  );
  
  // Step 4: Add randomization factor
  const randomizedExercises = this.addRandomizationFactor(equipmentRotatedExercises);
  
  // Step 5: Select final exercises
  const selectedExercises = randomizedExercises.slice(0, exercisesPerDay);
  
  console.log(`✅ Selected exercises: ${selectedExercises.map(ex => ex.exercise_name).join(', ')}`);
  
  return selectedExercises;
}
```

#### **B. Movement Pattern Balancing:**
```typescript
private static balanceMovementPatterns(
  exercises: any[],
  muscleGroup: string[],
  exerciseHistory: ExerciseHistory[]
): any[] {
  // Get movement pattern usage in last 4 weeks
  const patternUsage = this.getMovementPatternUsage(exerciseHistory);
  
  // Score exercises based on pattern balance
  return exercises.map(exercise => {
    let score = exercise.score || 0;
    const pattern = this.getMovementPattern(exercise.exercise_name);
    
    // Boost score for underused patterns
    const patternCount = patternUsage[pattern] || 0;
    if (patternCount < 2) {
      score += 30; // Significant boost for underused patterns
    } else if (patternCount < 4) {
      score += 15; // Moderate boost
    }
    
    return { ...exercise, score, movementPattern: pattern };
  }).sort((a, b) => b.score - a.score);
}
```

#### **C. Equipment Rotation:**
```typescript
private static applyEquipmentRotation(
  exercises: any[],
  weekNumber: number,
  exerciseHistory: ExerciseHistory[]
): any[] {
  // Get equipment usage in last 4 weeks
  const equipmentUsage = this.getEquipmentUsage(exerciseHistory);
  
  // Determine preferred equipment for this week
  const weekEquipment = this.getWeekEquipment(weekNumber, equipmentUsage);
  
  return exercises.map(exercise => {
    let score = exercise.score || 0;
    const equipmentCategory = this.getEquipmentCategory(exercise.equipment);
    
    // Boost score for preferred equipment
    if (weekEquipment.includes(equipmentCategory)) {
      score += 25;
    }
    
    return { ...exercise, score, equipmentCategory };
  }).sort((a, b) => b.score - a.score);
}
```

#### **D. Weekly Equipment Rotation:**
```typescript
private static getWeekEquipment(weekNumber: number, equipmentUsage: Record<string, number>): string[] {
  const equipmentOrder = ['Barbell', 'Dumbbell', 'Bodyweight', 'Kettlebell', 'Cable', 'Resistance Bands'];
  const weekIndex = (weekNumber - 1) % equipmentOrder.length;
  
  // Primary equipment for this week
  const primaryEquipment = equipmentOrder[weekIndex];
  
  // Secondary equipment (less used in recent weeks)
  const secondaryEquipment = equipmentOrder
    .filter(eq => eq !== primaryEquipment)
    .sort((a, b) => (equipmentUsage[a] || 0) - (equipmentUsage[b] || 0))
    .slice(0, 2);
  
  return [primaryEquipment, ...secondaryEquipment];
}
```

#### **E. Randomization Factor:**
```typescript
private static addRandomizationFactor(exercises: any[]): any[] {
  return exercises.map(exercise => {
    // Add random factor (±10 points) to prevent exact same ordering
    const randomFactor = Math.floor(Math.random() * 21) - 10; // -10 to +10
    return { ...exercise, score: (exercise.score || 0) + randomFactor };
  }).sort((a, b) => b.score - a.score);
}
```

### **5. Integration with Enhanced Workout Generator**

#### **A. Modified generateExercisesForMuscleGroup:**
```typescript
private static async generateExercisesForMuscleGroup(
  muscleGroup: string[],
  scoredExercises: any[],
  template: any,
  exercisesPerDay: number,
  injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>,
  clientId: string,
  weekNumber: number,
  progressionAnalysis?: any
): Promise<any[]> {
  // Get exercise history from schedule table
  const exerciseHistory = await this.getExerciseHistory(clientId, 4);
  
  // Select exercises with variety
  const selectedExercises = this.selectExercisesWithVariety(
    scoredExercises,
    muscleGroup,
    exercisesPerDay,
    clientId,
    weekNumber,
    exerciseHistory
  );
  
  // Convert to exercise objects (existing logic)
  const exercises: any[] = [];
  
  selectedExercises.forEach((exercise, index) => {
    // ... existing exercise object creation logic
  });
  
  return exercises;
}
```

## 📊 **IMPLEMENTATION PHASES**

### **Phase 1: Basic Exercise Rotation (Week 1)**
- ✅ Exercise history tracking via schedule table
- ✅ Filter out recently used exercises (2 weeks)
- ✅ Basic randomization factor

### **Phase 2: Movement Pattern Variety (Week 2)**
- ✅ Movement pattern classification
- ✅ Pattern usage tracking
- ✅ Pattern balancing logic

### **Phase 3: Equipment Rotation (Week 3)**
- ✅ Equipment categorization
- ✅ Weekly equipment rotation
- ✅ Equipment usage tracking

### **Phase 4: Advanced Features (Week 4)**
- ✅ Progressive complexity
- ✅ Seasonal variations
- ✅ Client preference learning

## 🎯 **EXPECTED OUTCOMES**

### **Exercise Variety:**
- **Week 1**: Barbell-focused exercises
- **Week 2**: Dumbbell-focused exercises  
- **Week 3**: Bodyweight-focused exercises
- **Week 4**: Kettlebell-focused exercises

### **Movement Pattern Balance:**
- **Day 1**: Horizontal Push + Squat
- **Day 2**: Horizontal Pull + Hinge
- **Day 3**: Vertical Push + Core
- **Day 4**: Vertical Pull + Cardio

### **Progressive Complexity:**
- **Week 1**: Foundation movements
- **Week 2**: Slight variations
- **Week 3**: Advanced variations
- **Week 4**: Return to foundation with progression

## 🚀 **NEXT STEPS**

1. **Implement Phase 1** (Basic Exercise Rotation)
2. **Test with real client data**
3. **Monitor exercise variety metrics**
4. **Iterate and improve**

**This implementation will create truly varied, engaging, and effective workout plans that match world-class training standards!**
