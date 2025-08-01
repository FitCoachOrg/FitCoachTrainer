import { supabase } from './supabase';
import { askLLM } from './llm-service';

// Define the structure of a meal item
interface Meal {
  name: string;
  amount?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Define the structure of a daily nutrition plan
interface DayPlan {
  day: string;
  total: Meal;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

// Function to generate a grocery list using an LLM
export async function generateGroceryList(nutritionPlan: DayPlan[]): Promise<string> {
  // Create a detailed prompt for the LLM
  const prompt = `
    Based on the following weekly nutrition plan, generate a comprehensive grocery list. 
    The list should be organized by food category and include estimated quantities for each item to last the full week.

    IMPORTANT REQUIREMENTS:
    - Generate ONLY the grocery list items
    - Do NOT include any cooking tips, preparation advice, or general instructions
    - Do NOT include any notes about organic options, cooking methods, or shopping advice
    - Focus purely on the items needed to purchase
    - Return the response in VALID JSON format (not plain text)
    - Include quantities for each item
    - Organize by category

    REQUIRED JSON FORMAT:
    {
      "categories": [
        {
          "name": "PRODUCE",
          "items": [
            {"id": "1", "text": "Apples - 6 pieces", "checked": false},
            {"id": "2", "text": "Spinach - 2 bags", "checked": false}
          ]
        },
        {
          "name": "PROTEIN", 
          "items": [
            {"id": "3", "text": "Chicken breast - 2 lbs", "checked": false},
            {"id": "4", "text": "Salmon fillets - 4 pieces", "checked": false}
          ]
        }
      ],
      "generated_at": "2024-01-15T10:30:00Z"
    }

    Nutrition Plan:
    ${nutritionPlan.map(day => `
      **${day.day}**
      - **Breakfast**: ${day.breakfast.name} (${day.breakfast.amount})
      - **Lunch**: ${day.lunch.name} (${day.lunch.amount})
      - **Dinner**: ${day.dinner.name} (${day.dinner.amount})
      - **Snacks**: ${day.snacks.name} (${day.snacks.amount})
    `).join('')}

    Generate ONLY the grocery list items in the specified JSON format. No other content.
  `;

  // Call the LLM service to generate the grocery list
  const response = await askLLM(prompt);
  return response.response;
}
