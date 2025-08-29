/**
 * Fitness Score Visualization Component
 * 
 * This component displays comprehensive fitness score visualizations including:
 * - Current score with trend
 * - Factor breakdown charts
 * - Historical progress
 * - Goal achievement probability
 * - Weekly comparison
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Heart, 
  Droplet, 
  Moon, 
  Utensils, 
  Smile,
  BarChart3,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface FitnessScoreVisualizationProps {
  clientId: number;
}

interface FactorScore {
  factor_key: string;
  factor_name: string;
  score: number;
  weight: number;
  target: any;
  current_value: any;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

interface WeeklyScore {
  week_start_date: string;
  overall_score: number;
  goal_category: string;
  factor_scores: Record<string, number>;
  trend: 'up' | 'down' | 'stable';
}

// Dummy data for client_id = 34
const DUMMY_DATA = {
  currentScore: {
    overall_score: 78.5,
    goal_category: 'fat_loss',
    week_start_date: '2025-01-13',
    factor_scores: {
      bmi: 85,
      weight_trend: 92,
      body_fat_percent: 75,
      sleep_hours: 88,
      sleep_quality: 82,
      step_count: 91,
      exercise_adherence: 95,
      water_intake: 79,
      protein_intake: 87,
      calorie_intake: 89,
      mood_stress: 76,
      alcohol_intake: 90,
      screen_time: 85,
      caffeine_usage: 88
    }
  },
  weeklyHistory: [
    { week_start_date: '2025-01-06', overall_score: 72.3, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-12-30', overall_score: 68.7, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-12-23', overall_score: 65.2, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-12-16', overall_score: 62.1, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-12-09', overall_score: 58.9, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-12-02', overall_score: 55.4, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-11-25', overall_score: 52.1, goal_category: 'fat_loss', trend: 'up' as const },
    { week_start_date: '2024-11-18', overall_score: 48.7, goal_category: 'fat_loss', trend: 'up' as const }
  ],
  factorDetails: [
    {
      factor_key: 'bmi',
      factor_name: 'BMI',
      score: 85,
      weight: 7,
      target: { min: 18.5, max: 24.9 },
      current_value: 23.2,
      trend: 'up' as const,
      category: 'Body Metrics'
    },
    {
      factor_key: 'weight_trend',
      factor_name: 'Weight Trend',
      score: 92,
      weight: 8,
      target: { min: -1, max: -0.5 },
      current_value: -0.7,
      trend: 'up' as const,
      category: 'Body Metrics'
    },
    {
      factor_key: 'body_fat_percent',
      factor_name: 'Body Fat %',
      score: 75,
      weight: 7,
      target: { min: 18, max: 24 },
      current_value: 22.5,
      trend: 'down' as const,
      category: 'Body Metrics'
    },
    {
      factor_key: 'sleep_hours',
      factor_name: 'Sleep Hours',
      score: 88,
      weight: 5,
      target: { min: 7, max: 9 },
      current_value: 7.8,
      trend: 'stable' as const,
      category: 'Sleep & Recovery'
    },
    {
      factor_key: 'sleep_quality',
      factor_name: 'Sleep Quality',
      score: 82,
      weight: 4,
      target: { min: 8, max: 10 },
      current_value: 8.2,
      trend: 'up' as const,
      category: 'Sleep & Recovery'
    },
    {
      factor_key: 'step_count',
      factor_name: 'Step Count',
      score: 91,
      weight: 6,
      target: { min: 7000, max: 10000 },
      current_value: 8900,
      trend: 'up' as const,
      category: 'Hydration & Activity'
    },
    {
      factor_key: 'exercise_adherence',
      factor_name: 'Exercise Adherence',
      score: 95,
      weight: 10,
      target: { min: 90, max: 100 },
      current_value: 95,
      trend: 'up' as const,
      category: 'Hydration & Activity'
    },
    {
      factor_key: 'water_intake',
      factor_name: 'Water Intake',
      score: 79,
      weight: 4,
      target: { ml_per_kg: 35 },
      current_value: 2100,
      trend: 'stable' as const,
      category: 'Hydration & Activity'
    },
    {
      factor_key: 'protein_intake',
      factor_name: 'Protein Intake',
      score: 87,
      weight: 8,
      target: { grams_per_kg: 1.6 },
      current_value: 112,
      trend: 'up' as const,
      category: 'Nutrition'
    },
    {
      factor_key: 'calorie_intake',
      factor_name: 'Calorie Intake',
      score: 89,
      weight: 10,
      target: { min: 1800, max: 2200 },
      current_value: 1950,
      trend: 'stable' as const,
      category: 'Nutrition'
    },
    {
      factor_key: 'mood_stress',
      factor_name: 'Mood/Stress',
      score: 76,
      weight: 2,
      target: { min: 7, max: 10 },
      current_value: 7.6,
      trend: 'up' as const,
      category: 'Emotional & Lifestyle'
    },
    {
      factor_key: 'alcohol_intake',
      factor_name: 'Alcohol Intake',
      score: 90,
      weight: 2,
      target: { max: 1 },
      current_value: 0,
      trend: 'stable' as const,
      category: 'Emotional & Lifestyle'
    },
    {
      factor_key: 'screen_time',
      factor_name: 'Screen Time',
      score: 85,
      weight: 2,
      target: { max: 30 },
      current_value: 25,
      trend: 'up' as const,
      category: 'Emotional & Lifestyle'
    },
    {
      factor_key: 'caffeine_usage',
      factor_name: 'Caffeine Usage',
      score: 88,
      weight: 2,
      target: { max: 3, no_after_2pm: true },
      current_value: 2,
      trend: 'stable' as const,
      category: 'Emotional & Lifestyle'
    }
  ],
  goalProgress: {
    target_score: 85,
    current_score: 78.5,
    weeks_to_goal: 3,
    probability: 0.82,
    weekly_improvement_rate: 2.1
  }
};

export const FitnessScoreVisualization: React.FC<FitnessScoreVisualizationProps> = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(DUMMY_DATA);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Body Metrics':
        return <Activity className="h-4 w-4" />;
      case 'Sleep & Recovery':
        return <Moon className="h-4 w-4" />;
      case 'Hydration & Activity':
        return <Droplet className="h-4 w-4" />;
      case 'Nutrition':
        return <Utensils className="h-4 w-4" />;
      case 'Emotional & Lifestyle':
        return <Smile className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getGoalCategoryLabel = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Fitness Score Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Score */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(data.currentScore.overall_score)}`}>
                {data.currentScore.overall_score.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getScoreLabel(data.currentScore.overall_score)}
              </div>
              <Progress 
                value={data.currentScore.overall_score} 
                className="mt-3"
              />
              <div className="text-xs text-gray-500 mt-2">
                Week of {new Date(data.currentScore.week_start_date).toLocaleDateString()}
              </div>
            </div>

            {/* Goal Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Goal Progress</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {data.goalProgress.probability * 100}%
              </div>
              <div className="text-sm text-gray-600">
                Probability to reach goal
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.goalProgress.weeks_to_goal} weeks to target
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Weekly Trend</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                +{data.goalProgress.weekly_improvement_rate}
              </div>
              <div className="text-sm text-gray-600">
                Average weekly improvement
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last 8 weeks
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="factors">Factor Breakdown</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Body Metrics', 'Sleep & Recovery', 'Hydration & Activity', 'Nutrition', 'Emotional & Lifestyle'].map(category => {
                  const categoryFactors = data.factorDetails.filter(f => f.category === category);
                  const avgScore = categoryFactors.length > 0 
                    ? categoryFactors.reduce((sum, f) => sum + f.score, 0) / categoryFactors.length 
                    : 0;
                  
                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(category)}
                        <span className="font-medium">{category}</span>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                        {avgScore.toFixed(1)}
                      </div>
                      <Progress value={avgScore} className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.factorDetails
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map(factor => (
                      <div key={factor.factor_key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(factor.trend)}
                          <span className="text-sm">{factor.factor_name}</span>
                        </div>
                        <Badge variant="secondary">{factor.score}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.factorDetails
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map(factor => (
                      <div key={factor.factor_key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(factor.trend)}
                          <span className="text-sm">{factor.factor_name}</span>
                        </div>
                        <Badge variant="destructive">{factor.score}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          {/* Factor Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Factor Breakdown</CardTitle>
              <div className="text-sm text-gray-600">
                Detailed view of all factors contributing to your fitness score
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.factorDetails.map(factor => (
                  <div key={factor.factor_key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(factor.category)}
                        <span className="font-medium">{factor.factor_name}</span>
                        <Badge variant="outline" className="text-xs">
                          Weight: {factor.weight}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(factor.trend)}
                        <span className={`font-bold ${getScoreColor(factor.score)}`}>
                          {factor.score}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Value:</span>
                        <div className="font-medium">{factor.current_value}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <div className="font-medium">
                          {typeof factor.target === 'object' 
                            ? `${factor.target.min || 'Min'} - ${factor.target.max || 'Max'}`
                            : factor.target
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <div className="font-medium">{factor.category}</div>
                      </div>
                    </div>
                    
                    <Progress value={factor.score} className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Score History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Score History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.weeklyHistory.map((week, index) => (
                  <div key={week.week_start_date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          Week of {new Date(week.week_start_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getGoalCategoryLabel(week.goal_category)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTrendIcon(week.trend)}
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getScoreColor(week.overall_score)}`}>
                          {week.overall_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getScoreLabel(week.overall_score)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {/* Goal Achievement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Goal Achievement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Goal */}
                <div className="text-center p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {getGoalCategoryLabel(data.currentScore.goal_category)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Target Score: {data.goalProgress.target_score}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {data.currentScore.overall_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                    <div className="text-2xl text-gray-400">→</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {data.goalProgress.target_score}
                      </div>
                      <div className="text-xs text-gray-500">Target</div>
                    </div>
                  </div>
                </div>

                {/* Progress Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {data.goalProgress.probability * 100}%
                    </div>
                    <div className="text-sm text-gray-600">Success Probability</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.goalProgress.weeks_to_goal}
                    </div>
                    <div className="text-sm text-gray-600">Weeks to Goal</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      +{data.goalProgress.weekly_improvement_rate}
                    </div>
                    <div className="text-sm text-gray-600">Weekly Improvement</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Recommendations</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• Focus on improving sleep quality (currently 82/100)</li>
                    <li>• Increase water intake to reach daily target</li>
                    <li>• Maintain current exercise adherence (95/100)</li>
                    <li>• Continue protein intake optimization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FitnessScoreVisualization; 