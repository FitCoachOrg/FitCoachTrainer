# 🏋️ Workout Plan Generation Workflow

## 📋 **High-Level Overview**

The workout plan generation follows a **8-step process** that transforms client input data into a personalized workout plan using the `exercises_raw` database.

---

## 🔄 **Step-by-Step Workflow**

### **Step 1: Client Data Fetch** 📊
**Input**: `client_id`
**Output**: Complete client profile from `client` table

**Data Retrieved**:
- `cl_primary_goal` → Maps to workout goal
- `training_experience` → Maps to experience level  
- `training_time_per_session` → Session duration
- `workout_days` → Days per week
- `available_equipment` → Equipment list
- `focus_areas` → Target muscle groups
- `injuries_limitations` → Safety considerations

---

### **Step 2: Client Data Parsing & Mapping** 🎯
**Purpose**: Convert UI-friendly client inputs to system values

#### **Goal Mapping**:
```typescript
"improve_health" → "endurance"
"build_muscle" → "hypertrophy" 
"lose_weight" → "fat_loss"
"get_stronger" → "strength"
"improve_fitness" → "endurance"
```

#### **Experience Mapping**:
```typescript
"beginner" → "Beginner"
"intermediate" → "Intermediate" 
"advanced" → "Advanced"
```

#### **Equipment Mapping**:
```typescript
"bodyweight" → ["bodyweight"]
"dumbbells" → ["dumbbell"]
"full_gym" → ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"]
```

#### **Focus Areas Mapping**:
```typescript
"upper_body" → ["Chest", "Back", "Shoulders", "Arms"]
"lower_body" → ["Quads", "Glutes", "Hamstrings", "Calves"]
"core" → ["Core", "Lower Back", "Obliques"]
"full_body" → ["Full Body", "Core"]
"cardio" → ["Full Body", "Core"]
"flexibility" → ["Core", "Lower Back"]
```

---

### **Step 3: Exercise Database Fetch** 🗄️
**Input**: None (fetches all exercises)
**Output**: All exercises from `exercises_raw` table

**Data Retrieved**:
- Exercise name, description
- `category` (Core, Full Body, Lower Body, Upper Body)
- `primary_muscle`, `target_muscle`
- `equipment` requirements
- `experience` level
- `video_link` availability
- Exercise specifications

---

### **Step 4: Exercise Filtering & Scoring** ⭐
**Purpose**: Rank exercises based on client criteria

#### **Scoring System** (Higher score = better match):

1. **Video Link Priority** (+100 points)
   - Exercises with video links get highest priority
   - Ensures better user experience

2. **Target Muscle Match** (+50 points)
   - Matches exercise to client's focus areas
   - Uses `primary_muscle` field

3. **Equipment Availability** (+30 points)
   - Matches exercise equipment to client's available equipment
   - Ensures exercises can be performed

4. **Experience Level Match** (+20 points)
   - Matches exercise difficulty to client's experience
   - Ensures appropriate challenge level

5. **Goal Alignment** (+25 points)
   - Endurance: Prioritizes cardio exercises
   - Strength/Hypertrophy: Prioritizes strength exercises

**Final Filter**: Only exercises with score > 0, sorted by highest score

---

### **Step 5: Workout Template Selection** 📋
**Purpose**: Define workout structure based on goal

#### **Templates by Goal**:

```typescript
"endurance": {
  sets: 2,
  reps: "12-15",
  rest: 45,
  exercises_per_day: 4
}

"hypertrophy": {
  sets: 3,
  reps: "8-12", 
  rest: 60,
  exercises_per_day: 4
}

"strength": {
  sets: 4,
  reps: "4-6",
  rest: 90,
  exercises_per_day: 3
}

"fat_loss": {
  sets: 2,
  reps: "15-20",
  rest: 30,
  exercises_per_day: 5
}
```

---

### **Step 6: Session Time Calculation** ⏰
**Purpose**: Determine how many exercises fit in session time

```typescript
sessionMinutes = client.training_time_per_session (e.g., 45)
warmupTime = 8 minutes
cooldownTime = 5 minutes
availableTime = sessionMinutes - warmupTime - cooldownTime
exercisesPerDay = Math.min(template.exercises_per_day, Math.floor(availableTime / 6))
```

**Example**: 45-minute session → 32 minutes available → 5 exercises max

---

### **Step 7: Muscle Group Distribution** 🎯
**Purpose**: Assign exercise categories to each workout day

#### **Category Mapping**:
```typescript
'Chest' → 'Upper Body'
'Back' → 'Upper Body' 
'Shoulders' → 'Upper Body'
'Arms' → 'Upper Body'
'Core' → 'Core'
'Lower Back' → 'Core'
'Full Body' → 'Full Body'
'Quads' → 'Lower Body'
'Glutes' → 'Lower Body'
'Hamstrings' → 'Lower Body'
```

#### **Distribution Logic**:
- Maps client focus areas to exercise categories
- Ensures all workout days get assigned categories
- Repeats categories if needed to fill all days

**Example for 6-day plan**:
- Day 1: Upper Body
- Day 2: Core  
- Day 3: Full Body
- Day 4: Upper Body
- Day 5: Core
- Day 6: Full Body

---

### **Step 8: Workout Plan Creation** 🏆
**Purpose**: Generate final workout plan with exercises

#### **For Each Workout Day**:
1. **Filter exercises** by category (using `category` column)
2. **Select top exercises** based on scoring
3. **Apply workout template** (sets, reps, rest)
4. **Calculate exercise duration** (8 minutes per exercise)
5. **Generate exercise details**:
   - Name, description, video link
   - Sets, reps, rest periods
   - Weight recommendations
   - Coach tips

#### **For Each Rest Day**:
- Mark as "Rest Day"
- No exercises assigned

---

## 🎯 **How Client Goals Influence Each Step**

### **Goal: "build_muscle" (Hypertrophy)**

1. **Step 2**: Maps to `"hypertrophy"` goal
2. **Step 5**: Uses hypertrophy template (3 sets, 8-12 reps, 60s rest)
3. **Step 7**: Focuses on Upper Body, Lower Body, Core categories
4. **Step 8**: Selects strength-focused exercises with video links

### **Goal: "lose_weight" (Fat Loss)**

1. **Step 2**: Maps to `"fat_loss"` goal  
2. **Step 5**: Uses fat loss template (2 sets, 15-20 reps, 30s rest)
3. **Step 7**: Focuses on Full Body, Core categories
4. **Step 8**: Selects cardio/endurance exercises with higher rep ranges

### **Goal: "get_stronger" (Strength)**

1. **Step 2**: Maps to `"strength"` goal
2. **Step 5**: Uses strength template (4 sets, 4-6 reps, 90s rest)
3. **Step 7**: Focuses on Upper Body, Lower Body categories
4. **Step 8**: Selects compound exercises with heavier weight focus

---

## 🔍 **Key Filtering Criteria Summary**

| Criterion | Weight | Purpose |
|-----------|--------|---------|
| **Video Link** | +100 | User experience |
| **Target Muscles** | +50 | Personalization |
| **Equipment Match** | +30 | Feasibility |
| **Experience Level** | +20 | Safety & progression |
| **Goal Alignment** | +25 | Effectiveness |

---

## 📊 **Example: Client 36 Workflow**

**Client Data**:
- Goal: "build_muscle" → **Hypertrophy**
- Experience: "beginner" → **Beginner**
- Session: "45_minutes" → **45 minutes**
- Days: 6 days per week
- Equipment: "full_gym" → **All equipment available**
- Focus: "upper_body" → **Chest, Back, Shoulders, Arms**

**Generated Plan**:
- **6 workout days** with **4 exercises per day**
- **45-minute sessions** (8 min warmup + 4 exercises × 8 min + 5 min cooldown)
- **Hypertrophy template**: 3 sets, 8-12 reps, 60s rest
- **Category distribution**: Upper Body, Core, Full Body (repeated)
- **All exercises have video links** and match equipment/experience

---

## 🎉 **Benefits of This Approach**

1. **✅ Personalized**: Every client gets unique plan based on their data
2. **✅ Goal-Oriented**: Workout structure matches fitness goals
3. **✅ Feasible**: Only includes exercises client can perform
4. **✅ Progressive**: Matches experience level for safe progression
5. **✅ Engaging**: Prioritizes exercises with video demonstrations
6. **✅ Efficient**: Optimizes session time and exercise selection
