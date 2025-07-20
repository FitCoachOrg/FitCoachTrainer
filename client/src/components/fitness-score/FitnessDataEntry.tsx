/**
 * Fitness Data Entry Component
 * 
 * This component provides forms for clients to enter their daily fitness data
 * including body metrics, sleep, nutrition, and lifestyle factors.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Activity, 
  Moon, 
  Droplet, 
  Utensils, 
  Smile,
  Save,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FitnessDataEntryProps {
  clientId: number;
  onDataSaved?: () => void;
}

export const FitnessDataEntry: React.FC<FitnessDataEntryProps> = ({ 
  clientId, 
  onDataSaved 
}) => {
  const [activeTab, setActiveTab] = useState('body');
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Body Metrics
  const [bodyMetrics, setBodyMetrics] = useState({
    weight_kg: '',
    height_cm: '',
    body_fat_percent: '',
    waist_cm: '',
    hip_cm: '',
    lean_mass_percent: '',
    measurement_method: 'scale'
  });

  // Sleep & Recovery
  const [sleepRecovery, setSleepRecovery] = useState({
    sleep_hours: '',
    sleep_quality: 7,
    energy_on_wakeup: 7,
    hrv_ms: '',
    bed_time: '',
    wake_time: ''
  });

  // Hydration & Activity
  const [hydrationActivity, setHydrationActivity] = useState({
    water_intake_ml: '',
    water_intake_glasses: '',
    step_count: '',
    exercise_adherence_percent: '',
    mobility_score: 7,
    balance_score: 7
  });

  // Nutrition Tracking
  const [nutritionTracking, setNutritionTracking] = useState({
    total_calories: '',
    target_calories: '',
    protein_grams: '',
    carbs_grams: '',
    fats_grams: '',
    meals_logged: 3,
    total_meals_planned: 3
  });

  // Emotional & Lifestyle
  const [emotionalLifestyle, setEmotionalLifestyle] = useState({
    mood_score: 7,
    stress_level: 5,
    alcohol_drinks: 0,
    screen_time_bedtime_minutes: 30,
    caffeine_cups: 2,
    caffeine_after_2pm: false
  });

  const handleBodyMetricsChange = (field: string, value: string) => {
    setBodyMetrics(prev => ({ ...prev, [field]: value }));
  };

  const handleSleepRecoveryChange = (field: string, value: any) => {
    setSleepRecovery(prev => ({ ...prev, [field]: value }));
  };

  const handleHydrationActivityChange = (field: string, value: string | number) => {
    setHydrationActivity(prev => ({ ...prev, [field]: value }));
  };

  const handleNutritionTrackingChange = (field: string, value: string) => {
    setNutritionTracking(prev => ({ ...prev, [field]: value }));
  };

  const handleEmotionalLifestyleChange = (field: string, value: string | number | boolean) => {
    setEmotionalLifestyle(prev => ({ ...prev, [field]: value }));
  };

  const saveBodyMetrics = async () => {
    if (!bodyMetrics.weight_kg && !bodyMetrics.height_cm) return;

    try {
      setSaving(true);
      
      const data = {
        client_id: clientId,
        measurement_date: date,
        ...bodyMetrics,
        // Calculate BMI if both weight and height are provided
        bmi: bodyMetrics.weight_kg && bodyMetrics.height_cm 
          ? (parseFloat(bodyMetrics.weight_kg) / Math.pow(parseFloat(bodyMetrics.height_cm) / 100, 2)).toFixed(2)
          : null,
        // Calculate waist-to-hip ratio if both measurements are provided
        waist_to_hip_ratio: bodyMetrics.waist_cm && bodyMetrics.hip_cm
          ? (parseFloat(bodyMetrics.waist_cm) / parseFloat(bodyMetrics.hip_cm)).toFixed(2)
          : null
      };

      const { error } = await supabase
        .from('body_metrics')
        .upsert(data, { onConflict: 'client_id,measurement_date' });

      if (error) throw error;
      
      onDataSaved?.();
    } catch (error) {
      console.error('Error saving body metrics:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveSleepRecovery = async () => {
    if (!sleepRecovery.sleep_hours) return;

    try {
      setSaving(true);
      
      const data = {
        client_id: clientId,
        sleep_date: date,
        ...sleepRecovery
      };

      const { error } = await supabase
        .from('sleep_recovery')
        .upsert(data, { onConflict: 'client_id,sleep_date' });

      if (error) throw error;
      
      onDataSaved?.();
    } catch (error) {
      console.error('Error saving sleep recovery:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveHydrationActivity = async () => {
    try {
      setSaving(true);
      
      const data = {
        client_id: clientId,
        activity_date: date,
        ...hydrationActivity
      };

      const { error } = await supabase
        .from('hydration_activity')
        .upsert(data, { onConflict: 'client_id,activity_date' });

      if (error) throw error;
      
      onDataSaved?.();
    } catch (error) {
      console.error('Error saving hydration activity:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveNutritionTracking = async () => {
    if (!nutritionTracking.total_calories) return;

    try {
      setSaving(true);
      
      const data = {
        client_id: clientId,
        nutrition_date: date,
        ...nutritionTracking
      };

      const { error } = await supabase
        .from('nutrition_tracking')
        .upsert(data, { onConflict: 'client_id,nutrition_date' });

      if (error) throw error;
      
      onDataSaved?.();
    } catch (error) {
      console.error('Error saving nutrition tracking:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveEmotionalLifestyle = async () => {
    try {
      setSaving(true);
      
      const data = {
        client_id: clientId,
        lifestyle_date: date,
        ...emotionalLifestyle
      };

      const { error } = await supabase
        .from('emotional_lifestyle')
        .upsert(data, { onConflict: 'client_id,lifestyle_date' });

      if (error) throw error;
      
      onDataSaved?.();
    } catch (error) {
      console.error('Error saving emotional lifestyle:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveAllData = async () => {
    try {
      setSaving(true);
      
      // Save all data types
      await Promise.all([
        saveBodyMetrics(),
        saveSleepRecovery(),
        saveHydrationActivity(),
        saveNutritionTracking(),
        saveEmotionalLifestyle()
      ]);
      
      onDataSaved?.();
    } catch (error) {
      console.error('Error saving all data:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Body Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={bodyMetrics.weight_kg}
                    onChange={(e) => handleBodyMetricsChange('weight_kg', e.target.value)}
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={bodyMetrics.height_cm}
                    onChange={(e) => handleBodyMetricsChange('height_cm', e.target.value)}
                    placeholder="175"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="body_fat">Body Fat %</Label>
                  <Input
                    id="body_fat"
                    type="number"
                    step="0.1"
                    value={bodyMetrics.body_fat_percent}
                    onChange={(e) => handleBodyMetricsChange('body_fat_percent', e.target.value)}
                    placeholder="15.5"
                  />
                </div>
                <div>
                  <Label htmlFor="lean_mass">Lean Mass %</Label>
                  <Input
                    id="lean_mass"
                    type="number"
                    step="0.1"
                    value={bodyMetrics.lean_mass_percent}
                    onChange={(e) => handleBodyMetricsChange('lean_mass_percent', e.target.value)}
                    placeholder="84.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waist">Waist (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    value={bodyMetrics.waist_cm}
                    onChange={(e) => handleBodyMetricsChange('waist_cm', e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label htmlFor="hip">Hip (cm)</Label>
                  <Input
                    id="hip"
                    type="number"
                    step="0.1"
                    value={bodyMetrics.hip_cm}
                    onChange={(e) => handleBodyMetricsChange('hip_cm', e.target.value)}
                    placeholder="95"
                  />
                </div>
              </div>

              <Button onClick={saveBodyMetrics} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Body Metrics'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Sleep & Recovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sleep_hours">Sleep Hours</Label>
                  <Input
                    id="sleep_hours"
                    type="number"
                    step="0.5"
                    value={sleepRecovery.sleep_hours}
                    onChange={(e) => handleSleepRecoveryChange('sleep_hours', e.target.value)}
                    placeholder="7.5"
                  />
                </div>
                <div>
                  <Label htmlFor="hrv">HRV (ms)</Label>
                  <Input
                    id="hrv"
                    type="number"
                    value={sleepRecovery.hrv_ms}
                    onChange={(e) => handleSleepRecoveryChange('hrv_ms', e.target.value)}
                    placeholder="45"
                  />
                </div>
              </div>

              <div>
                <Label>Sleep Quality (1-10)</Label>
                <Slider
                  value={[sleepRecovery.sleep_quality]}
                  onValueChange={(value) => handleSleepRecoveryChange('sleep_quality', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {sleepRecovery.sleep_quality}/10
                </div>
              </div>

              <div>
                <Label>Energy on Wakeup (1-10)</Label>
                <Slider
                  value={[sleepRecovery.energy_on_wakeup]}
                  onValueChange={(value) => handleSleepRecoveryChange('energy_on_wakeup', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {sleepRecovery.energy_on_wakeup}/10
                </div>
              </div>

              <Button onClick={saveSleepRecovery} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Sleep Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5" />
                Hydration & Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="water_ml">Water Intake (ml)</Label>
                  <Input
                    id="water_ml"
                    type="number"
                    value={hydrationActivity.water_intake_ml}
                    onChange={(e) => handleHydrationActivityChange('water_intake_ml', e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="steps">Step Count</Label>
                  <Input
                    id="steps"
                    type="number"
                    value={hydrationActivity.step_count}
                    onChange={(e) => handleHydrationActivityChange('step_count', e.target.value)}
                    placeholder="8000"
                  />
                </div>
              </div>

              <div>
                <Label>Mobility Score (1-10)</Label>
                <Slider
                  value={[hydrationActivity.mobility_score]}
                  onValueChange={(value) => handleHydrationActivityChange('mobility_score', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {hydrationActivity.mobility_score}/10
                </div>
              </div>

              <div>
                <Label>Balance Score (1-10)</Label>
                <Slider
                  value={[hydrationActivity.balance_score]}
                  onValueChange={(value) => handleHydrationActivityChange('balance_score', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {hydrationActivity.balance_score}/10
                </div>
              </div>

              <Button onClick={saveHydrationActivity} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Activity Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Nutrition Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Total Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={nutritionTracking.total_calories}
                    onChange={(e) => handleNutritionTrackingChange('total_calories', e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="target_calories">Target Calories</Label>
                  <Input
                    id="target_calories"
                    type="number"
                    value={nutritionTracking.target_calories}
                    onChange={(e) => handleNutritionTrackingChange('target_calories', e.target.value)}
                    placeholder="2000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={nutritionTracking.protein_grams}
                    onChange={(e) => handleNutritionTrackingChange('protein_grams', e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={nutritionTracking.carbs_grams}
                    onChange={(e) => handleNutritionTrackingChange('carbs_grams', e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label htmlFor="fats">Fats (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    step="0.1"
                    value={nutritionTracking.fats_grams}
                    onChange={(e) => handleNutritionTrackingChange('fats_grams', e.target.value)}
                    placeholder="67"
                  />
                </div>
              </div>

              <Button onClick={saveNutritionTracking} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Nutrition Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Emotional & Lifestyle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mood Score (1-10)</Label>
                  <Slider
                    value={[emotionalLifestyle.mood_score]}
                    onValueChange={(value) => handleEmotionalLifestyleChange('mood_score', value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                                   <div className="text-sm text-gray-500 mt-1">
                   {emotionalLifestyle.mood_score}/10
                 </div>
               </div>
               <div>
                 <Label>Stress Level (1-10)</Label>
                 <Slider
                   value={[emotionalLifestyle.stress_level]}
                   onValueChange={(value) => handleEmotionalLifestyleChange('stress_level', value[0] || 5)}
                   max={10}
                   min={1}
                   step={1}
                   className="mt-2"
                 />
                 <div className="text-sm text-gray-500 mt-1">
                   {emotionalLifestyle.stress_level}/10
                 </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alcohol">Alcohol Drinks</Label>
                  <Input
                    id="alcohol"
                    type="number"
                    value={emotionalLifestyle.alcohol_drinks}
                    onChange={(e) => handleEmotionalLifestyleChange('alcohol_drinks', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="screen_time">Screen Time Before Bed (min)</Label>
                  <Input
                    id="screen_time"
                    type="number"
                    value={emotionalLifestyle.screen_time_bedtime_minutes}
                    onChange={(e) => handleEmotionalLifestyleChange('screen_time_bedtime_minutes', parseInt(e.target.value) || 0)}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="caffeine">Caffeine Cups</Label>
                  <Input
                    id="caffeine"
                    type="number"
                    value={emotionalLifestyle.caffeine_cups}
                    onChange={(e) => handleEmotionalLifestyleChange('caffeine_cups', parseInt(e.target.value) || 0)}
                    placeholder="2"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="caffeine_after_2pm"
                    checked={emotionalLifestyle.caffeine_after_2pm}
                    onCheckedChange={(checked) => handleEmotionalLifestyleChange('caffeine_after_2pm', checked)}
                  />
                  <Label htmlFor="caffeine_after_2pm">Caffeine after 2 PM</Label>
                </div>
              </div>

              <Button onClick={saveEmotionalLifestyle} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Lifestyle Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save All Button */}
      <div className="flex justify-center">
        <Button onClick={saveAllData} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving All Data...' : 'Save All Data'}
        </Button>
      </div>
    </div>
  );
};

export default FitnessDataEntry; 