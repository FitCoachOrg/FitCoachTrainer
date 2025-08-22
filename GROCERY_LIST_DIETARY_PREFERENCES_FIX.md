# Grocery List Dietary Preferences Fix

## Issue Description

The grocery list generation was including non-vegetarian ingredients (like chicken, fish, meat) even when the client had vegetarian dietary preferences. This happened because the grocery list generation prompt didn't consider the client's dietary restrictions.

## Root Cause Analysis

The issue was in the `generateGroceryList` function in `client/src/lib/ai-grocery-list.ts`:

1. **Missing Dietary Context**: The function only received the nutrition plan data but not the client's dietary preferences
2. **No Dietary Restrictions in Prompt**: The LLM prompt didn't include any dietary restrictions or forbidden ingredients
3. **Incomplete Data Flow**: The grocery list service didn't fetch client dietary preferences before generating the list

## Code Changes Made

### 1. Updated `generateGroceryList` Function Signature

**Before:**
```typescript
export async function generateGroceryList(nutritionPlan: DayPlan[]): Promise<string>
```

**After:**
```typescript
export async function generateGroceryList(
  nutritionPlan: DayPlan[], 
  dietaryPreferences?: string[], 
  allergies?: string
): Promise<string>
```

### 2. Added Dietary Restrictions Processing

Added logic to process dietary preferences and build appropriate restrictions:

```typescript
// Build dietary restrictions section
let dietaryRestrictionsSection = '';
let forbiddenIngredients = '';

if (dietaryPreferences && dietaryPreferences.length > 0) {
  const preferencesString = dietaryPreferences.join(', ').toLowerCase();
  
  if (preferencesString.includes('vegetarian')) {
    dietaryRestrictionsSection += 'STRICT VEGETARIAN: No meat, fish, poultry, or animal products. Use plant-based proteins only.\n';
    forbiddenIngredients += 'meat, fish, poultry, beef, pork, lamb, chicken, turkey, seafood, eggs, gelatin';
  }
  if (preferencesString.includes('vegan')) {
    dietaryRestrictionsSection += 'STRICT VEGAN: No animal products whatsoever. Use plant-based alternatives only.\n';
    forbiddenIngredients += 'meat, fish, poultry, dairy, eggs, honey, gelatin, any animal products';
  }
  if (preferencesString.includes('pescatarian')) {
    dietaryRestrictionsSection += 'PESCATARIAN: Fish and seafood allowed, no other meat.\n';
    forbiddenIngredients += 'beef, pork, lamb, chicken, turkey, other land animals';
  }
  if (preferencesString.includes('gluten-free')) {
    dietaryRestrictionsSection += 'GLUTEN-FREE: No wheat, barley, rye, or gluten-containing ingredients.\n';
    forbiddenIngredients += 'wheat, barley, rye, gluten, bread, pasta, cereal';
  }
  if (preferencesString.includes('dairy-free')) {
    dietaryRestrictionsSection += 'DAIRY-FREE: No milk, cheese, yogurt, or dairy products.\n';
    forbiddenIngredients += 'milk, cheese, yogurt, butter, cream, dairy';
  }
}

if (allergies && allergies.trim()) {
  dietaryRestrictionsSection += `FOOD ALLERGIES: ${allergies}\n`;
  forbiddenIngredients += `, ${allergies.toLowerCase()}`;
}
```

### 3. Enhanced LLM Prompt

Updated the prompt to include dietary restrictions:

```typescript
const prompt = `
  Based on the following weekly nutrition plan, generate a comprehensive grocery list. 
  The list should be organized by food category and include estimated quantities for each item to last the full week.

  ${dietaryRestrictionsSection ? `DIETARY RESTRICTIONS (MANDATORY TO FOLLOW):
${dietaryRestrictionsSection}
FORBIDDEN INGREDIENTS: ${forbiddenIngredients}

CRITICAL: Do NOT include any of the forbidden ingredients in the grocery list.` : ''}

  IMPORTANT REQUIREMENTS:
  - Generate ONLY the grocery list items
  - Do NOT include any cooking tips, preparation advice, or general instructions
  - Do NOT include any notes about organic options, cooking methods, or shopping advice
  - Focus purely on the items needed to purchase
  - Return the response in VALID JSON format (not plain text)
  - Include quantities for each item
  - Organize by category
  ${dietaryRestrictionsSection ? '- STRICTLY follow dietary restrictions and avoid forbidden ingredients' : ''}

  // ... rest of prompt
`;
```

### 4. Updated Grocery List Service

Modified `generateGroceryListFromPlan` in `client/src/lib/grocery-list-service.ts` to fetch and pass dietary preferences:

```typescript
// Fetch client dietary preferences
const { data: clientData, error: clientError } = await supabase
  .from('client')
  .select('diet_preferences, food_allergies')
  .eq('client_id', clientId)
  .single();

if (clientError) {
  console.error('Error fetching client dietary preferences:', clientError);
  // Continue without dietary preferences if there's an error
}

const dietaryPreferences = clientData?.diet_preferences || [];
const allergies = clientData?.food_allergies || '';

console.log('🥬 Client dietary preferences for grocery list:', {
  preferences: dietaryPreferences,
  allergies: allergies
});

// Generate grocery list using LLM with dietary preferences
const groceryListJson = await generateGroceryList(nutritionPlan, dietaryPreferences, allergies);
```

## Supported Dietary Preferences

The fix supports the following dietary preferences:

1. **Vegetarian**: No meat, fish, poultry, or animal products
2. **Vegan**: No animal products whatsoever
3. **Pescatarian**: Fish and seafood allowed, no other meat
4. **Gluten-Free**: No wheat, barley, rye, or gluten-containing ingredients
5. **Dairy-Free**: No milk, cheese, yogurt, or dairy products

## Food Allergies Support

The system also respects food allergies specified in the client's profile and adds them to the forbidden ingredients list.

## Testing

A comprehensive test script (`test-grocery-list-dietary-preferences.mjs`) has been created to verify:

- Dietary preferences are correctly fetched from the database
- The LLM prompt includes appropriate dietary restrictions
- Generated grocery lists respect dietary preferences
- No forbidden ingredients appear in the final list
- Allergy violations are prevented

## Example Output

**For a vegetarian client, the prompt now includes:**
```
DIETARY RESTRICTIONS (MANDATORY TO FOLLOW):
STRICT VEGETARIAN: No meat, fish, poultry, or animal products. Use plant-based proteins only.

FORBIDDEN INGREDIENTS: meat, fish, poultry, beef, pork, lamb, chicken, turkey, seafood, eggs, gelatin

CRITICAL: Do NOT include any of the forbidden ingredients in the grocery list.
```

**Instead of non-vegetarian items like:**
- Chicken breast - 2 lbs
- Salmon fillets - 4 pieces

**The system now generates vegetarian alternatives like:**
- Tofu - 2 blocks
- Lentils - 1 lb
- Chickpeas - 2 cans
- Quinoa - 1 lb

## Summary

The fix ensures that:
- ✅ Grocery lists respect client dietary preferences
- ✅ No forbidden ingredients appear in generated lists
- ✅ Food allergies are properly considered
- ✅ The system supports multiple dietary restrictions
- ✅ Comprehensive testing validates the fix
- ✅ Better user experience with appropriate grocery items

## Files Modified

- `client/src/lib/ai-grocery-list.ts` - Enhanced grocery list generation with dietary preferences
- `client/src/lib/grocery-list-service.ts` - Updated to fetch and pass dietary preferences
- `test-grocery-list-dietary-preferences.mjs` - Test script for verification
- `GROCERY_LIST_DIETARY_PREFERENCES_FIX.md` - This documentation
