// AI to Todo Converter Utilities
// Clean and minimalistic functions for converting AI recommendations to todos

import { AIRecommendationToTodo, DEFAULT_AI_CATEGORY_MAPPINGS, AICategoryMapping } from '@/types/todo'

/**
 * Convert AI recommendation to todo format
 * @param recommendation - AI recommendation object
 * @param clientId - Optional client ID
 * @param selectedCategory - Optional custom category
 * @returns Todo object ready for creation
 */
export function convertAIRecommendationToTodo(
  recommendation: any,
  clientId?: number,
  selectedCategory?: string
): AIRecommendationToTodo {
  // Extract title from recommendation
  const title = extractTitleFromRecommendation(recommendation)
  
  // Map AI priority to todo priority
  const priority = mapAIPriorityToTodoPriority(recommendation.priority || 'Medium')
  
  // Map AI category to todo category
  const category = selectedCategory || mapAICategoryToTodoCategory(recommendation.category || 'Other')
  
  // Create AI context string
  const aiContext = createAIContext(recommendation)
  
  return {
    title,
    client_id: clientId,
    priority,
    category,
    source: 'ai_recommendation',
    ai_context: aiContext
  }
}

/**
 * Extract title from AI recommendation
 * @param recommendation - AI recommendation object
 * @returns Clean title string
 */
function extractTitleFromRecommendation(recommendation: any): string {
  // Handle different recommendation formats
  if (typeof recommendation === 'string') {
    return recommendation.replace(/^[•\-\*]\s*/, '').trim()
  }
  
  if (recommendation.action) {
    return recommendation.action.replace(/^[•\-\*]\s*/, '').trim()
  }
  
  if (recommendation.recommendation) {
    return recommendation.recommendation.replace(/^[•\-\*]\s*/, '').trim()
  }
  
  if (recommendation.text) {
    return recommendation.text.replace(/^[•\-\*]\s*/, '').trim()
  }
  
  // Fallback
  return 'AI Recommendation'
}

/**
 * Map AI priority to todo priority
 * @param aiPriority - AI priority string
 * @returns Todo priority
 */
function mapAIPriorityToTodoPriority(aiPriority: string): 'low' | 'medium' | 'high' {
  const priority = aiPriority.toLowerCase()
  
  switch (priority) {
    case 'high':
      return 'high'
    case 'low':
      return 'low'
    default:
      return 'medium'
  }
}

/**
 * Map AI category to todo category
 * @param aiCategory - AI category string
 * @returns Todo category
 */
function mapAICategoryToTodoCategory(aiCategory: string): string {
  const mapping = DEFAULT_AI_CATEGORY_MAPPINGS.find(
    m => m.ai_category.toLowerCase() === aiCategory.toLowerCase()
  )
  
  return mapping?.todo_category || 'personal'
}

/**
 * Create AI context string for preservation
 * @param recommendation - AI recommendation object
 * @returns Context string
 */
function createAIContext(recommendation: any): string {
  const context: any = {
    original_text: extractTitleFromRecommendation(recommendation),
    ai_category: recommendation.category || 'Other',
    ai_priority: recommendation.priority || 'Medium',
    ai_timeframe: recommendation.timeframe || 'This week',
    recommendation_type: recommendation.type || 'action_plan'
  }
  
  return JSON.stringify(context)
}

/**
 * Extract actionable recommendations from AI analysis
 * @param aiAnalysis - Complete AI analysis object
 * @returns Array of actionable recommendations
 */
export function extractActionableRecommendations(aiAnalysis: any): any[] {
  const recommendations: any[] = []
  
  // Extract from action_plan.immediate_actions
  if (aiAnalysis?.action_plan?.immediate_actions) {
    aiAnalysis.action_plan.immediate_actions.forEach((action: any) => {
      recommendations.push({
        ...action,
        type: 'immediate_action'
      })
    })
  }
  
  // Extract from recommendations.training_recommendations
  if (aiAnalysis?.recommendations?.training_recommendations) {
    aiAnalysis.recommendations.training_recommendations.forEach((rec: any) => {
      recommendations.push({
        ...rec,
        type: 'training_recommendation'
      })
    })
  }
  
  // Extract from recommendations.nutrition_recommendations
  if (aiAnalysis?.recommendations?.nutrition_recommendations) {
    aiAnalysis.recommendations.nutrition_recommendations.forEach((rec: any) => {
      recommendations.push({
        ...rec,
        type: 'nutrition_recommendation'
      })
    })
  }
  
  // Extract from recommendations.lifestyle_recommendations
  if (aiAnalysis?.recommendations?.lifestyle_recommendations) {
    aiAnalysis.recommendations.lifestyle_recommendations.forEach((rec: any) => {
      recommendations.push({
        ...rec,
        type: 'lifestyle_recommendation'
      })
    })
  }
  
  return recommendations
}

/**
 * Get available categories for AI recommendations
 * @returns Array of available categories
 */
export function getAvailableCategories(): string[] {
  return [...new Set(DEFAULT_AI_CATEGORY_MAPPINGS.map(m => m.todo_category))]
}

/**
 * Get category mapping for AI category
 * @param aiCategory - AI category
 * @returns Mapped todo category
 */
export function getCategoryMapping(aiCategory: string): string {
  return mapAICategoryToTodoCategory(aiCategory)
}
