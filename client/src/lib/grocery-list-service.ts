import { format, addDays } from "date-fns";
import { supabase } from "./supabase";
import { generateGroceryList } from "./ai-grocery-list";

// Types
interface Meal {
  name: string;
  amount?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  coach_tip?: string;
}

interface DayPlan {
  day: string;
  total: Meal;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

interface GroceryItem {
  id: string;
  text: string;
  checked: boolean;
}

interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}

interface GroceryListData {
  categories: GroceryCategory[];
  generated_at: string;
}

interface GroceryListResult {
  success: boolean;
  groceryItems: GroceryItem[];
  groceryCategories?: GroceryCategory[];
  error?: string;
  isFromDatabase?: boolean;
  hasExistingList?: boolean;
}

/**
 * Transforms schedule_preview data into DayPlan[] format for LLM processing
 * @param scheduleData - Raw schedule data from database
 * @returns DayPlan[] - Structured nutrition plan data
 */
export const transformScheduleDataToDayPlan = (scheduleData: any[]): DayPlan[] => {
  const dayPlans: { [key: string]: any } = {};

  scheduleData.forEach(item => {
    const day = format(new Date(item.for_date), 'EEEE');
    if (!dayPlans[day]) {
      dayPlans[day] = {
        day,
        breakfast: {},
        lunch: {},
        dinner: {},
        snacks: {},
      };
    }

    const mealType = item.task.toLowerCase();
    dayPlans[day][mealType] = {
      name: item.summary.replace(/^[^:]*: /, ''),
      amount: item.details_json.amount,
      ...item.details_json,
    };
  });

  return Object.values(dayPlans);
};

/**
 * Parses JSON grocery list from LLM into structured items
 * @param groceryListJson - JSON response from LLM
 * @returns GroceryItem[] - Flattened array of grocery items
 */
export const parseGroceryListJson = (groceryListJson: string): GroceryItem[] => {
  try {
    const data: GroceryListData = JSON.parse(groceryListJson);
    const items: GroceryItem[] = [];
    
    data.categories.forEach(category => {
      category.items.forEach(item => {
        items.push({
          id: item.id,
          text: item.text,
          checked: item.checked || false
        });
      });
    });
    
    return items;
  } catch (error) {
    console.error('Error parsing grocery list JSON:', error);
    return [];
  }
};

/**
 * Parses JSON grocery list from LLM and preserves category structure
 * @param groceryListJson - JSON response from LLM
 * @returns GroceryListData - Structured grocery list with categories
 */
export const parseGroceryListJsonWithCategories = (groceryListJson: string): GroceryListData | null => {
  try {
    const data: GroceryListData = JSON.parse(groceryListJson);
    return data;
  } catch (error) {
    console.error('Error parsing grocery list JSON:', error);
    return null;
  }
};

/**
 * Converts flattened grocery items back to categorized format for display
 * @param groceryItems - Flattened array of grocery items
 * @returns GroceryCategory[] - Categorized grocery items
 */
export const categorizeGroceryItems = (groceryItems: GroceryItem[]): GroceryCategory[] => {
  // Since the LLM now returns JSON with proper categories, we need to reconstruct
  // the categories from the flattened items. We'll use a simple approach based on
  // common grocery categories and item keywords.
  
  const categoryKeywords: { [key: string]: string[] } = {
    'PRODUCE': ['apple', 'banana', 'spinach', 'lettuce', 'tomato', 'onion', 'carrot', 'broccoli', 'cucumber', 'pepper', 'fruit', 'vegetable', 'greens', 'herbs'],
    'DAIRY': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'dairy'],
    'PROTEIN': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'meat', 'protein'],
    'PANTRY': ['rice', 'pasta', 'bread', 'flour', 'sugar', 'oil', 'sauce', 'spices', 'herbs', 'canned', 'beans'],
    'BEVERAGES': ['water', 'juice', 'soda', 'tea', 'coffee', 'beverage'],
    'SNACKS': ['chips', 'nuts', 'crackers', 'snack', 'candy', 'chocolate'],
    'FROZEN': ['frozen', 'ice cream', 'frozen vegetables', 'frozen fruit'],
    'BAKERY': ['bread', 'pastry', 'cake', 'muffin', 'bun', 'roll']
  };

  const categorizedItems: { [key: string]: GroceryItem[] } = {};
  
  groceryItems.forEach(item => {
    const itemText = item.text.toLowerCase();
    let assignedCategory = 'OTHER';
    
    // Find the best matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => itemText.includes(keyword))) {
        assignedCategory = category;
        break;
      }
    }
    
    if (!categorizedItems[assignedCategory]) {
      categorizedItems[assignedCategory] = [];
    }
    categorizedItems[assignedCategory].push(item);
  });
  
  // Convert to array format and sort categories
  const categoryOrder = ['PRODUCE', 'DAIRY', 'PROTEIN', 'PANTRY', 'BAKERY', 'FROZEN', 'BEVERAGES', 'SNACKS', 'OTHER'];
  
  return categoryOrder
    .filter(category => categorizedItems[category] && categorizedItems[category].length > 0)
    .map(category => ({
      name: category,
      items: categorizedItems[category]
    }));
};

/**
 * Fetches nutrition plan data from database for the specified week
 * @param clientId - Client ID
 * @param startDate - Start date of the week
 * @returns Promise<any[]> - Schedule data for the week
 */
export const fetchNutritionPlanData = async (clientId: number, startDate: Date): Promise<any[]> => {
  const startDateString = format(startDate, 'yyyy-MM-dd');
  const endDateString = format(addDays(startDate, 6), 'yyyy-MM-dd');

  const { data: scheduleData, error } = await supabase
    .from('schedule_preview')
    .select('*')
    .eq('client_id', clientId)
    .eq('type', 'meal')
    .gte('for_date', startDateString)
    .lte('for_date', endDateString);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return scheduleData || [];
};

/**
 * Checks if a grocery list exists for the given client and week
 * @param clientId - Client ID
 * @param weekStart - Start of the week (Monday)
 * @returns Promise<boolean> - Whether a grocery list exists
 */
export const checkGroceryListExists = async (clientId: number, weekStart: Date): Promise<boolean> => {
  const weekStartString = format(weekStart, 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('grocery_list')
    .select('client_id')
    .eq('client_id', clientId)
    .eq('week_start', weekStartString)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return false;
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return !!data;
};

/**
 * Fetches existing grocery list from database
 * @param clientId - Client ID
 * @param weekStart - Start of the week (Monday)
 * @returns Promise<GroceryListData | null> - Existing grocery list data
 */
export const fetchExistingGroceryList = async (clientId: number, weekStart: Date): Promise<GroceryListData | null> => {
  const weekStartString = format(weekStart, 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('grocery_list')
    .select('grocery_list')
    .eq('client_id', clientId)
    .eq('week_start', weekStartString)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data?.grocery_list || null;
};

/**
 * Stores grocery list in database
 * @param clientId - Client ID
 * @param weekStart - Start of the week (Monday)
 * @param groceryListData - Grocery list data to store
 * @returns Promise<void>
 */
export const storeGroceryList = async (clientId: number, weekStart: Date, groceryListData: GroceryListData): Promise<void> => {
  const weekStartString = format(weekStart, 'yyyy-MM-dd');
  
  // First, try to delete any existing record
  const { error: deleteError } = await supabase
    .from('grocery_list')
    .delete()
    .eq('client_id', clientId)
    .eq('week_start', weekStartString);

  if (deleteError) {
    throw new Error(`Database error during delete: ${deleteError.message}`);
  }

  // Then insert the new record
  const { error: insertError } = await supabase
    .from('grocery_list')
    .insert({
      client_id: clientId,
      week_start: weekStartString,
      grocery_list: groceryListData
    });

  if (insertError) {
    throw new Error(`Database error during insert: ${insertError.message}`);
  }
};

/**
 * Updates checkbox state for a grocery item
 * @param clientId - Client ID
 * @param weekStart - Start of the week (Monday)
 * @param itemId - ID of the item to update
 * @param checked - New checked state
 * @returns Promise<void>
 */
export const updateGroceryItemState = async (clientId: number, weekStart: Date, itemId: string, checked: boolean): Promise<void> => {
  const weekStartString = format(weekStart, 'yyyy-MM-dd');
  
  // Fetch current grocery list
  const { data, error: fetchError } = await supabase
    .from('grocery_list')
    .select('grocery_list')
    .eq('client_id', clientId)
    .eq('week_start', weekStartString)
    .single();

  if (fetchError) {
    throw new Error(`Database error: ${fetchError.message}`);
  }

  if (!data?.grocery_list) {
    throw new Error('Grocery list not found');
  }

  // Update the specific item's checked state
  const groceryListData: GroceryListData = data.grocery_list;
  groceryListData.categories.forEach(category => {
    category.items.forEach(item => {
      if (item.id === itemId) {
        item.checked = checked;
      }
    });
  });

  // Save updated data
  const { error: updateError } = await supabase
    .from('grocery_list')
    .update({ grocery_list: groceryListData })
    .eq('client_id', clientId)
    .eq('week_start', weekStartString);

  if (updateError) {
    throw new Error(`Database error: ${updateError.message}`);
  }
};

/**
 * Main function to generate a grocery list from nutrition plan data
 * @param clientId - Client ID
 * @param startDate - Start date of the week
 * @returns Promise<GroceryListResult> - Structured grocery list result
 */
export const generateGroceryListFromPlan = async (
  clientId: number, 
  startDate: Date,
  forceRegenerate: boolean = false
): Promise<GroceryListResult> => {
  try {
    // Use the selected start date directly as week start
    const weekStart = startDate;
    
    // Check if grocery list already exists (unless forcing regeneration)
    if (!forceRegenerate) {
      const existingGroceryList = await fetchExistingGroceryList(clientId, weekStart);
      
      if (existingGroceryList) {
        console.log('📋 Found existing grocery list in database');
        // Return existing data from database
        const items: GroceryItem[] = [];
        existingGroceryList.categories.forEach(category => {
          category.items.forEach(item => {
            items.push({
              id: item.id,
              text: item.text,
              checked: item.checked || false
            });
          });
        });
        
        return {
          success: true,
          groceryItems: items,
          groceryCategories: existingGroceryList.categories,
          isFromDatabase: true,
          hasExistingList: true
        };
      }
    } else {
      console.log('🔄 Force regeneration requested - ignoring existing grocery list');
    }

    // Fetch nutrition plan data from database
    const scheduleData = await fetchNutritionPlanData(clientId, startDate);
    
    if (!scheduleData || scheduleData.length === 0) {
      return {
        success: false,
        groceryItems: [],
        error: "No nutrition plan data found for the selected week. Please generate a plan first."
      };
    }

    // Transform data into DayPlan format
    const nutritionPlan = transformScheduleDataToDayPlan(scheduleData);
    
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
    
    console.log('🥬 === GROCERY LIST GENERATION START ===');
    console.log('📅 Week:', weekStart.toISOString().split('T')[0]);
    console.log('👤 Client ID:', clientId);
    console.log('🥗 Dietary Preferences:', dietaryPreferences);
    console.log('🚫 Allergies:', allergies);
    
    // Generate grocery list using LLM with dietary preferences
    const groceryListJson = await generateGroceryList(nutritionPlan, dietaryPreferences, allergies);
    
    console.log('✅ === PLAN GENERATED ===');
    console.log('📊 Nutrition plan processed successfully');
    console.log('🔢 Total meal days:', nutritionPlan.length);
    
    // Parse the LLM JSON response with preserved categories
    const groceryListData = parseGroceryListJsonWithCategories(groceryListJson);
    
    if (!groceryListData || groceryListData.categories.length === 0) {
      console.log('❌ === PARSING FAILED ===');
      console.log('Failed to parse grocery list from LLM response');
      return {
        success: false,
        groceryItems: [],
        error: "Failed to parse grocery list from LLM response."
      };
    }
    
    console.log('✅ === GROCERY LIST PARSED ===');
    console.log('📋 Categories:', groceryListData.categories.map(c => c.name));
    console.log('🔢 Total items:', groceryListData.categories.reduce((sum, cat) => sum + cat.items.length, 0));

    // Flatten items for the component
    const groceryItems: GroceryItem[] = [];
    groceryListData.categories.forEach(category => {
      category.items.forEach(item => {
        groceryItems.push({
          id: item.id,
          text: item.text,
          checked: item.checked || false
        });
      });
    });

    // Store in database with preserved category structure
    await storeGroceryList(clientId, weekStart, groceryListData);
    
    console.log('💾 === GROCERY LIST SAVED ===');
    console.log('✅ Grocery list saved to database successfully');
    console.log('📊 Final grocery list summary:');
    console.log('📋 Categories:', groceryListData.categories.map(c => c.name));
    groceryListData.categories.forEach(category => {
      console.log(`  ${category.name}: ${category.items.length} items`);
      category.items.forEach(item => {
        console.log(`    - ${item.text}`);
      });
    });
    
    // Simple text format for easy copying
    console.log('\n📋 === FINAL GROCERY LIST (COPY-PASTE FORMAT) ===');
    console.log('FINAL_GROCERY_LIST:');
    groceryListData.categories.forEach(category => {
      console.log(`${category.name}:`);
      category.items.forEach(item => {
        console.log(`  - ${item.text}`);
      });
    });
    console.log('END_FINAL_GROCERY_LIST');
    
    console.log('🏁 === GROCERY LIST GENERATION COMPLETE ===');
    
    return {
      success: true,
      groceryItems,
      groceryCategories: groceryListData.categories
    };
    
  } catch (error: any) {
    return {
      success: false,
      groceryItems: [],
      error: error.message || "An unexpected error occurred while generating the grocery list."
    };
  }
}; 