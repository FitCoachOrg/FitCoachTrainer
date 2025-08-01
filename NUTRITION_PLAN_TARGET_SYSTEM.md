# Nutrition Plan Target System

## Overview
The nutrition plan generation system has been updated to use targets from the `client_target` table instead of calculating them on-the-fly. This provides more flexibility and accuracy for personalized nutrition plans.

## Key Changes

### 1. Target Source
- **Before**: Calculated using BMR/TDEE formulas with fixed macro ratios (30% protein, 40% carbs, 30% fat)
- **After**: Fetched directly from `client_target` table

### 2. Target Fields
The system looks for these specific goals in the `client_target` table:
- `calories` - Daily calorie target
- `protein` - Daily protein target (grams)
- `carbs` - Daily carbohydrate target (grams)  
- `fats` - Daily fat target (grams)

### 3. Default Values
If targets are not found in the database, the system uses these defaults:
- Calories: 2000 kcal
- Protein: 150 g
- Carbs: 200 g
- Fats: 67 g

## Database Schema

### client_target Table
```sql
CREATE TABLE client_target (
  id SERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES client(client_id),
  goal VARCHAR(50) NOT NULL,  -- 'calories', 'protein', 'carbs', 'fats'
  target DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, goal)
);
```

## Code Changes

### File: `client/src/lib/ai-nutrition-plan.ts`

#### Target Fetching Logic
```typescript
// Fetch targets from client_target table
const { data: targetData, error: targetError } = await supabase
  .from('client_target')
  .select('goal, target')
  .eq('client_id', clientId)
  .in('goal', ['calories', 'protein', 'carbs', 'fats']);

// Extract targets from the fetched data
const targetMap = new Map();
if (targetData && targetData.length > 0) {
  targetData.forEach((row: any) => {
    if (row.goal && row.target !== null) {
      targetMap.set(row.goal, row.target);
    }
  });
}

// Set default values if targets are not found
const targetCalories = targetMap.get('calories') || 2000;
const targetProtein = targetMap.get('protein') || 150;
const targetCarbs = targetMap.get('carbs') || 200;
const targetFats = targetMap.get('fats') || 67;
```

#### Enhanced Prompt Instructions
```typescript
Daily Nutritional Targets (CRITICAL - MUST MATCH EXACTLY):
- Calories: ${targetCalories} kcal
- Protein: ${targetProtein} g
- Carbohydrates: ${targetCarbs} g
- Fats: ${targetFats} g

Instructions:
4. CRITICAL ACCURACY REQUIREMENT: The total nutritional values for each day MUST EXACTLY match the daily targets provided above. The sum of all meals for a day MUST equal the day's total. If the initial meal plan doesn't meet the targets, ADJUST the quantities/amounts of ingredients to ensure the total calories and macros match the targets exactly.
5. Select nutritional plan to achieve goals while respecting dietary restrictions.
```

## Benefits

### 1. Flexibility
- Each client can have custom macro ratios
- No more fixed 30/40/30 split
- Trainers can set specific targets based on individual needs

### 2. Accuracy
- Targets come from actual client data, not calculations
- Stronger emphasis on exact matching in the prompt
- Better adherence to dietary restrictions

### 3. Goal-Oriented
- Explicit instruction to achieve goals while respecting restrictions
- Better integration with client's specific objectives

### 4. Maintainability
- Centralized target management in database
- Easy to update targets without code changes
- Clear audit trail of target changes

## Usage

### Setting Targets
Targets can be set through the NutritionPlanSection component or directly in the database:

```sql
-- Example: Set targets for client ID 48
INSERT INTO client_target (client_id, goal, target) VALUES
  (48, 'calories', 1800),
  (48, 'protein', 140),
  (48, 'carbs', 150),
  (48, 'fats', 60)
ON CONFLICT (client_id, goal) 
DO UPDATE SET target = EXCLUDED.target, updated_at = NOW();
```

### Testing
Use the test script to verify the system:
```bash
node test-nutrition-targets.mjs
```

## Migration Notes

### For Existing Clients
- Clients without targets will use default values
- No breaking changes to existing functionality
- Gradual migration to custom targets as needed

### For Trainers
- Can now set custom targets for each client
- More precise control over nutrition plans
- Better alignment with client goals

## Future Enhancements

1. **Target History**: Track target changes over time
2. **Goal-Based Defaults**: Set defaults based on client goals
3. **Validation**: Ensure targets are realistic and safe
4. **Bulk Operations**: Set targets for multiple clients at once 