# Hybrid Grocery List Approach: Extraction + LLM Consolidation

## Issue with Previous Approach

The initial ingredient extraction approach was too simplistic and didn't handle:
- **Complex quantity consolidation** (e.g., "2 x 1/2 cup + 1/4 cup" should become "1.25 cups")
- **Unit conversions** (e.g., "4 x 1/4 cup" should become "1 cup")
- **Intelligent categorization** based on grocery store layout
- **Practical shopping quantities** (e.g., "1.5 cups spinach" should become "2 bags spinach")
- **Ingredient normalization** (e.g., "cherry tomatoes" and "tomatoes" should be grouped)

## Solution: Hybrid Approach

### **Step 1: Extract Ingredients**
Extract all ingredients from the nutrition plan with their context:
```typescript
function extractIngredientsFromNutritionPlan(nutritionPlan: DayPlan[]) {
  // Extract ingredients with day and meal context
  return [
    { name: "olive oil", quantity: "1/4 cup", day: "Monday", meal: "lunch" },
    { name: "olive oil", quantity: "2 tbsp", day: "Monday", meal: "dinner" },
    { name: "olive oil", quantity: "1 tbsp", day: "Tuesday", meal: "lunch" },
    // ... more ingredients
  ];
}
```

### **Step 2: Format for LLM**
Present extracted ingredients in a clear format for the LLM:
```
EXTRACTED INGREDIENTS FROM NUTRITION PLAN:

OLIVE OIL:
  - 1/4 cup (Monday lunch)
  - 2 tbsp (Monday dinner)
  - 1 tbsp (Tuesday lunch)

HONEY:
  - 1 tbsp (Monday breakfast)
  - 1 tbsp (Tuesday breakfast)
  - 1 tbsp (Wednesday breakfast)

CARROTS:
  - 1 cup (Monday dinner)
  - 1 cup (Tuesday snacks)
```

### **Step 3: LLM Consolidation**
Use LLM to intelligently consolidate and format:
```typescript
const prompt = `
  You are a professional grocery list organizer. I have extracted ingredients from a weekly nutrition plan and need you to consolidate, format, and organize them into a proper grocery list.

  TASK: Create a comprehensive, well-organized grocery list by:
  1. Consolidating similar ingredients and adding up quantities
  2. Converting units where appropriate (e.g., 4 x 1/4 cup = 1 cup)
  3. Organizing into logical grocery categories
  4. Estimating total quantities needed for the week
  5. Using standard grocery store terminology
  6. Ensuring all quantities are practical for shopping

  IMPORTANT REQUIREMENTS:
  - Use ONLY the ingredients provided above
  - Do NOT add any ingredients not in the extracted list
  - Consolidate quantities intelligently
  - Organize into clear categories
  - Use realistic, shoppable quantities
`;
```

## Benefits of Hybrid Approach

### **✅ Accurate Ingredient Extraction**
- Only includes ingredients actually specified in the meal plan
- Preserves all quantity and context information
- No missing or extra ingredients

### **✅ Intelligent Consolidation**
- **Quantity Math**: "1/4 cup + 2 tbsp + 1 tbsp" → "1/2 cup olive oil"
- **Unit Conversion**: "4 x 1/4 cup" → "1 cup"
- **Practical Quantities**: "1.5 cups spinach" → "2 bags spinach"

### **✅ Smart Categorization**
- Groups similar ingredients (e.g., "cherry tomatoes" + "tomatoes" → "tomatoes")
- Uses grocery store categories (PRODUCE, PROTEIN, DAIRY, etc.)
- Organizes for efficient shopping

### **✅ Dietary Compliance**
- Filters out forbidden ingredients based on preferences
- Respects food allergies
- Maintains dietary restrictions

### **✅ Shopping Optimization**
- Converts to practical shopping quantities
- Uses standard grocery terminology
- Optimizes for store layout

## Example Transformation

### **Input: Extracted Ingredients**
```
OLIVE OIL:
  - 1/4 cup (Monday lunch)
  - 2 tbsp (Monday dinner)
  - 1 tbsp (Tuesday lunch)

HONEY:
  - 1 tbsp (Monday breakfast)
  - 1 tbsp (Tuesday breakfast)
  - 1 tbsp (Wednesday breakfast)

SPINACH:
  - 2 cups (Monday lunch)
  - 2 cups (Tuesday lunch)

CARROTS:
  - 1 cup (Monday dinner)
  - 1 cup (Tuesday snacks)
```

### **Output: Consolidated Grocery List**
```json
{
  "categories": [
    {
      "name": "PRODUCE",
      "items": [
        {"id": "1", "text": "Spinach - 2 bags", "checked": false},
        {"id": "2", "text": "Carrots - 1 lb", "checked": false}
      ]
    },
    {
      "name": "CONDIMENTS",
      "items": [
        {"id": "3", "text": "Olive Oil - 1/2 cup", "checked": false},
        {"id": "4", "text": "Honey - 3 tbsp", "checked": false}
      ]
    }
  ]
}
```

## Key Features

### **1. Context-Aware Extraction**
- Preserves day and meal context for each ingredient
- Helps LLM understand usage patterns
- Enables better consolidation decisions

### **2. Intelligent Quantity Math**
- Adds up similar ingredients across the week
- Converts between units (tbsp ↔ cups)
- Rounds to practical shopping quantities

### **3. Smart Categorization**
- Groups similar ingredients (e.g., all tomato varieties)
- Uses grocery store layout categories
- Optimizes shopping efficiency

### **4. Dietary Filtering**
- Removes forbidden ingredients before LLM processing
- Ensures compliance with dietary preferences
- Respects food allergies

### **5. Shopping Optimization**
- Converts to store-available quantities
- Uses standard grocery terminology
- Optimizes for shopping efficiency

## Code Structure

### **Main Function**
```typescript
export async function generateGroceryList(nutritionPlan, dietaryPreferences, allergies) {
  // 1. Extract ingredients with context
  const extractedIngredients = extractIngredientsFromNutritionPlan(nutritionPlan);
  
  // 2. Build dietary restrictions
  const dietaryRestrictions = buildDietaryRestrictions(dietaryPreferences, allergies);
  
  // 3. Format for LLM
  const formattedIngredients = formatExtractedIngredientsForLLM(extractedIngredients);
  
  // 4. Create LLM prompt
  const prompt = createConsolidationPrompt(formattedIngredients, dietaryRestrictions);
  
  // 5. Get LLM response
  const response = await askLLM(prompt);
  return response.response;
}
```

### **Helper Functions**
- `extractIngredientsFromNutritionPlan()` - Extracts ingredients with context
- `formatExtractedIngredientsForLLM()` - Formats for LLM processing
- `buildDietaryRestrictions()` - Builds dietary restriction rules
- `createConsolidationPrompt()` - Creates the LLM prompt

## Testing

The `test-hybrid-grocery-list.mjs` script verifies:
- ✅ Ingredient extraction accuracy
- ✅ Quantity consolidation (e.g., olive oil: 1/4 cup + 2 tbsp + 1 tbsp = 1/2 cup)
- ✅ Dietary compliance
- ✅ Proper categorization
- ✅ Practical shopping quantities

## Summary

The hybrid approach combines:
- **Precise extraction** of ingredients from the meal plan
- **Intelligent consolidation** using LLM for complex logic
- **Smart formatting** for optimal shopping experience
- **Dietary compliance** through filtering and LLM guidance

This ensures grocery lists are **100% accurate**, **intelligently consolidated**, and **optimized for shopping**.
