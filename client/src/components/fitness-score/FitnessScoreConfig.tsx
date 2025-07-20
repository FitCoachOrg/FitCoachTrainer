/**
 * Fitness Score Configuration Component
 * 
 * This component allows clients to configure their fitness score by:
 * 1. Selecting their goal category (Fat Loss, Muscle Gain, Wellness, Performance)
 * 2. Choosing which factors to include in their score calculation
 * 3. Viewing their current fitness score and history
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  Activity, 
  Heart, 
  Droplet, 
  Moon, 
  Utensils, 
  Smile,
  Calendar,
  BarChart3
} from 'lucide-react';
import FitnessScoreService, { 
  FitnessScoreConfig, 
  FitnessScoreHistory, 
  FitnessScoreFactor 
} from '@/lib/fitness-score-service';

interface FitnessScoreConfigProps {
  clientId: number;
}

interface GoalCategory {
  value: 'fat_loss' | 'muscle_gain' | 'wellness' | 'performance';
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const GOAL_CATEGORIES: GoalCategory[] = [
  {
    value: 'fat_loss',
    label: 'Fat Loss',
    description: 'Focus on reducing body fat and weight',
    icon: TrendingUp,
    color: 'bg-red-500'
  },
  {
    value: 'muscle_gain',
    label: 'Muscle Gain',
    description: 'Focus on building muscle mass and strength',
    icon: Activity,
    color: 'bg-blue-500'
  },
  {
    value: 'wellness',
    label: 'Wellness',
    description: 'Focus on overall health and well-being',
    icon: Heart,
    color: 'bg-green-500'
  },
  {
    value: 'performance',
    label: 'Performance',
    description: 'Focus on athletic performance and endurance',
    icon: Target,
    color: 'bg-purple-500'
  }
];

export const FitnessScoreConfigComponent: React.FC<FitnessScoreConfigProps> = ({ clientId }) => {
  const [config, setConfig] = useState<FitnessScoreConfig | null>(null);
  const [factors, setFactors] = useState<FitnessScoreFactor[]>([]);
  const [scoreHistory, setScoreHistory] = useState<FitnessScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [currentScore, setCurrentScore] = useState<FitnessScoreHistory | null>(null);

  useEffect(() => {
    loadFitnessScoreData();
  }, [clientId]);

  const loadFitnessScoreData = async () => {
    try {
      setLoading(true);
      
      // Load configuration
      const configData = await FitnessScoreService.getOrCreateConfig(clientId);
      setConfig(configData);
      
      if (configData) {
        setSelectedGoal(configData.goal_category);
        setSelectedFactors(configData.selected_factors);
      }
      
      // Load factors
      const factorsData = await FitnessScoreService.getFactors();
      setFactors(factorsData);
      
      // Load score history
      const historyData = await FitnessScoreService.getScoreHistory(clientId, 12);
      setScoreHistory(historyData);
      
      // Get current week's score
      if (historyData.length > 0) {
        setCurrentScore(historyData[0]);
      }
      
    } catch (error) {
      console.error('Error loading fitness score data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalChange = (goal: string) => {
    setSelectedGoal(goal);
    
    // Update selected factors based on goal
    const goalCategory = GOAL_CATEGORIES.find(g => g.value === goal);
    if (goalCategory) {
      const relevantFactors = factors.filter(factor => {
        const weight = factor[`${goal}_weight` as keyof FitnessScoreFactor] as number;
        return weight > 0;
      });
      setSelectedFactors(relevantFactors.map(f => f.factor_key));
    }
  };

  const handleFactorToggle = (factorKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFactors(prev => [...prev, factorKey]);
    } else {
      setSelectedFactors(prev => prev.filter(f => f !== factorKey));
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      
      const updatedConfig: Partial<FitnessScoreConfig> = {
        goal_category: selectedGoal as any,
        selected_factors: selectedFactors,
        factor_weights: generateFactorWeights(selectedFactors, selectedGoal),
        target_values: generateTargetValues(selectedFactors, selectedGoal)
      };
      
      const success = await FitnessScoreService.updateConfig(clientId, updatedConfig);
      
      if (success) {
        // Reload data
        await loadFitnessScoreData();
      }
      
    } catch (error) {
      console.error('Error saving fitness score config:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateFactorWeights = (selectedFactors: string[], goal: string) => {
    const weights: Record<string, number> = {};
    selectedFactors.forEach(factorKey => {
      const factor = factors.find(f => f.factor_key === factorKey);
      if (factor) {
        const weight = factor[`${goal}_weight` as keyof FitnessScoreFactor] as number;
        weights[factorKey] = weight;
      }
    });
    return weights;
  };

  const generateTargetValues = (selectedFactors: string[], goal: string) => {
    // This would be populated with client-specific targets
    // For now, return empty object
    return {};
  };

  const getFactorIcon = (category: string) => {
    switch (category) {
      case 'Body Metrics':
        return Activity;
      case 'Sleep & Recovery':
        return Moon;
      case 'Hydration & Activity':
        return Droplet;
      case 'Nutrition':
        return Utensils;
      case 'Emotional & Lifestyle':
        return Smile;
      default:
        return Activity;
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Score Display */}
      {currentScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Current Fitness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(currentScore.overall_score)}`}>
                {currentScore.overall_score.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getScoreLabel(currentScore.overall_score)}
              </div>
              <Progress 
                value={currentScore.overall_score} 
                className="mt-4"
              />
              <div className="text-xs text-gray-500 mt-2">
                Week of {new Date(currentScore.week_start_date).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="history">Score History</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Goal Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Goal Category</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedGoal} onValueChange={handleGoalChange}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {GOAL_CATEGORIES.map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <div key={goal.value} className="relative">
                        <RadioGroupItem
                          value={goal.value}
                          id={goal.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={goal.value}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Icon className={`h-6 w-6 ${goal.color.replace('bg-', 'text-')}`} />
                          <div className="text-center mt-2">
                            <div className="font-semibold">{goal.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {goal.description}
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Factor Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Factors to Track</CardTitle>
              <div className="text-sm text-muted-foreground">
                Choose which factors should be included in your fitness score calculation
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {factors
                  .filter(factor => {
                    const weight = factor[`${selectedGoal}_weight` as keyof FitnessScoreFactor] as number;
                    return weight > 0;
                  })
                  .map((factor) => {
                    const Icon = getFactorIcon(factor.category);
                    const weight = factor[`${selectedGoal}_weight` as keyof FitnessScoreFactor] as number;
                    
                    return (
                      <div key={factor.factor_key} className="flex items-center space-x-3">
                        <Checkbox
                          id={factor.factor_key}
                          checked={selectedFactors.includes(factor.factor_key)}
                          onCheckedChange={(checked) => 
                            handleFactorToggle(factor.factor_key, checked as boolean)
                          }
                        />
                        <Label htmlFor={factor.factor_key} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{factor.factor_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              Weight: {weight}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {factor.description}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveConfig} 
              disabled={saving || !selectedGoal || selectedFactors.length === 0}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Score History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Score History</CardTitle>
            </CardHeader>
            <CardContent>
              {scoreHistory.length > 0 ? (
                <div className="space-y-4">
                  {scoreHistory.map((score, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">
                            Week of {new Date(score.week_start_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {score.goal_category.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getScoreColor(score.overall_score)}`}>
                          {score.overall_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getScoreLabel(score.overall_score)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No score history available yet. Complete your first week of tracking to see your fitness score.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FitnessScoreConfigComponent; 