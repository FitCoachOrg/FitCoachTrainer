import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Activity,
  Heart,
  Scale,
  Timer,
  TrendingUp,
  Dumbbell,
  Calendar,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ClientTarget {
  id: number;
  client_id: number;
  goal: string;
  target: number;
  created_at: string;
  updated_at: string;
}

interface ClientTargetsTableProps {
  clientId: string;
  client?: any;
}

// Define target categories with metadata
const TARGET_CATEGORIES = {
  nutrition: {
    title: 'Nutrition Targets',
    icon: Flame,
    color: 'from-red-500 to-orange-500',
    targets: [
      { key: 'calories', label: 'Daily Calories', unit: 'kcal', icon: Flame, description: 'Total daily calorie intake target' },
      { key: 'protein', label: 'Protein', unit: 'g', icon: Beef, description: 'Daily protein intake in grams' },
      { key: 'carbs', label: 'Carbohydrates', unit: 'g', icon: Wheat, description: 'Daily carbohydrate intake in grams' },
      { key: 'fats', label: 'Fats', unit: 'g', icon: Droplets, description: 'Daily fat intake in grams' },
    ]
  },
  fitness: {
    title: 'Fitness Targets',
    icon: Activity,
    color: 'from-blue-500 to-indigo-500',
    targets: [
      { key: 'target_weight', label: 'Target Weight', unit: 'kg', icon: Scale, description: 'Goal weight to achieve' },
      { key: 'workout_days', label: 'Workout Days/Week', unit: 'days', icon: Calendar, description: 'Number of workout days per week' },
      { key: 'workout_duration', label: 'Workout Duration', unit: 'min', icon: Timer, description: 'Duration of each workout session' },
      { key: 'steps_daily', label: 'Daily Steps', unit: 'steps', icon: TrendingUp, description: 'Daily step count target' },
    ]
  },
  health: {
    title: 'Health and Wellness',
    icon: Heart,
    color: 'from-green-500 to-emerald-500',
    targets: [
      { key: 'sleep_hours', label: 'Sleep Hours', unit: 'hours', icon: Clock, description: 'Target hours of sleep per night' },
      { key: 'heart_rate_rest', label: 'Resting Heart Rate', unit: 'bpm', icon: Heart, description: 'Target resting heart rate' },
      { key: 'water_intake', label: 'Water Intake', unit: 'L', icon: Droplets, description: 'Daily water intake in liters' },
    ]
  },
  performance: {
    title: 'Performance Targets',
    icon: Dumbbell,
    color: 'from-purple-500 to-pink-500',
    targets: [
      { key: 'bench_press', label: 'Bench Press', unit: 'kg', icon: Dumbbell, description: 'One-rep max bench press target' },
      { key: 'squat', label: 'Squat', unit: 'kg', icon: Dumbbell, description: 'One-rep max squat target' },
      { key: 'deadlift', label: 'Deadlift', unit: 'kg', icon: Dumbbell, description: 'One-rep max deadlift target' },
      { key: 'running_5k', label: '5K Time', unit: 'min', icon: Activity, description: 'Target 5K running time' },
    ]
  }
};

export const ClientTargetsTable: React.FC<ClientTargetsTableProps> = ({ 
  clientId, 
  client 
}) => {
  const [targets, setTargets] = useState<ClientTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [addingCategoryTarget, setAddingCategoryTarget] = useState<string | null>(null);
  const [newCategoryTargetName, setNewCategoryTargetName] = useState<string>('');
  const [newCategoryTargetValue, setNewCategoryTargetValue] = useState<string>('');

  const { toast } = useToast();

  // Fetch client targets from Supabase
  const fetchTargets = async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        throw new Error('Invalid client ID');
      }

      const { data, error: fetchError } = await supabase
        .from('client_target')
        .select('*')
        .eq('client_id', clientIdNum)
        .order('goal');

      if (fetchError) {
        throw fetchError;
      }

      setTargets(data || []);
    } catch (err: any) {
      console.error('Error fetching client targets:', err);
      setError(err.message || 'Failed to fetch targets');
      toast({
        title: 'Error',
        description: 'Failed to load client targets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Save target to Supabase
  const saveTarget = async (goal: string, target: number) => {
    if (!clientId) return;
    
    setSaving(true);
    
    try {
      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        throw new Error('Invalid client ID');
      }

      // Check if target already exists
      const existingTarget = targets.find(t => t.goal === goal);
      
      if (existingTarget) {
        // Update existing target
        const { error: updateError } = await supabase
          .from('client_target')
          .update({ target: target })
          .eq('id', existingTarget.id);

        if (updateError) throw updateError;
      } else {
        // Insert new target
        const { error: insertError } = await supabase
          .from('client_target')
          .insert({
            client_id: clientIdNum,
            goal: goal,
            target: target
          });

        if (insertError) throw insertError;
      }

      // Refresh targets
      await fetchTargets();
      
      toast({
        title: 'Success',
        description: `Target "${goal}" updated successfully`,
      });
      
      setEditingTarget(null);
      setEditValue('');
    } catch (err: any) {
      console.error('Error saving target:', err);
      toast({
        title: 'Error',
        description: `Failed to save target: ${err.message}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete target
  const deleteTarget = async (targetId: number, goal: string) => {
    try {
      const { error } = await supabase
        .from('client_target')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      await fetchTargets();
      
      toast({
        title: 'Success',
        description: `Target "${goal}" deleted successfully`,
      });
    } catch (err: any) {
      console.error('Error deleting target:', err);
      toast({
        title: 'Error',
        description: `Failed to delete target: ${err.message}`,
        variant: 'destructive'
      });
    }
  };



  // Add new category target
  const addNewCategoryTarget = async (categoryKey: string) => {
    if (!newCategoryTargetName.trim() || !newCategoryTargetValue.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both target name and value',
        variant: 'destructive'
      });
      return;
    }

    const targetValue = parseFloat(newCategoryTargetValue);
    if (isNaN(targetValue)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number for target value',
        variant: 'destructive'
      });
      return;
    }

    // Create a unique key for the category target
    const targetKey = `${categoryKey}_${newCategoryTargetName.trim().toLowerCase().replace(/\s+/g, '_')}`;
    
    await saveTarget(targetKey, targetValue);
    setAddingCategoryTarget(null);
    setNewCategoryTargetName('');
    setNewCategoryTargetValue('');
  };

  // Get target value by goal
  const getTargetValue = (goal: string): number | null => {
    const target = targets.find(t => t.goal === goal);
    return target ? target.target : null;
  };

  // Get target by goal
  const getTarget = (goal: string): ClientTarget | null => {
    return targets.find(t => t.goal === goal) || null;
  };

  // Get custom targets for a category
  const getCustomTargetsForCategory = (categoryKey: string): ClientTarget[] => {
    return targets.filter(t => t.goal.startsWith(`${categoryKey}_`));
  };

  // Start editing a target
  const startEditing = (goal: string) => {
    const target = getTarget(goal);
    setEditingTarget(goal);
    setEditValue(target ? target.target.toString() : '');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTarget(null);
    setEditValue('');
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingTarget) return;
    
    const targetValue = parseFloat(editValue);
    if (isNaN(targetValue)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number',
        variant: 'destructive'
      });
      return;
    }

    await saveTarget(editingTarget, targetValue);
  };

  // Fetch targets on component mount
  useEffect(() => {
    fetchTargets();
  }, [clientId]);

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading client targets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
            <Button onClick={fetchTargets} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Client Targets
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Set and manage various targets for {client?.cl_name || 'this client'}
        </p>
      </div>



      {/* Target Categories */}
      {Object.entries(TARGET_CATEGORIES).map(([categoryKey, category]) => {
        const categoryTargets = category.targets;
        const hasTargets = categoryTargets.some(target => getTarget(target.key));
        const customTargets = getCustomTargetsForCategory(categoryKey);
        const isAddingCategoryTarget = addingCategoryTarget === categoryKey;
        
        return (
          <Card key={categoryKey} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color}`}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  {category.title}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingCategoryTarget(categoryKey)}
                  className="w-10 h-10 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  title="Add Custom Target"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                      <TableHead className="w-1/3">Target</TableHead>
                      <TableHead className="w-1/4">Current Value</TableHead>
                      <TableHead className="w-1/4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Standard category targets */}
                    {categoryTargets.map((target) => {
                      const currentTarget = getTarget(target.key);
                      const isEditing = editingTarget === target.key;
                      
                      return (
                        <TableRow key={target.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <target.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {target.label}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {target.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-24"
                                  autoFocus
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {target.unit}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {currentTarget ? currentTarget.target : 'Not set'}
                                </span>
                                {currentTarget && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {target.unit}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={handleEditSave}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    {saving ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(target.key)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  {currentTarget && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteTarget(currentTarget.id, target.key)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Add Custom Target Row */}
                    {isAddingCategoryTarget && (
                      <TableRow className="bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-700">
                              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                              <Input
                                value={newCategoryTargetName}
                                onChange={(e) => setNewCategoryTargetName(e.target.value)}
                                placeholder="Enter target name"
                                className="w-48"
                                autoFocus
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={newCategoryTargetValue}
                              onChange={(e) => setNewCategoryTargetValue(e.target.value)}
                              placeholder="Value"
                              className="w-24"
                            />
                            <Input
                              placeholder="Unit (e.g., kg, min)"
                              className="w-20"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => addNewCategoryTarget(categoryKey)}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              {saving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAddingCategoryTarget(null);
                                setNewCategoryTargetName('');
                                setNewCategoryTargetValue('');
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Custom targets for this category */}
                    {customTargets.map((customTarget) => {
                      const isEditing = editingTarget === customTarget.goal;
                      const targetName = customTarget.goal.replace(`${categoryKey}_`, '').replace(/_/g, ' ');
                      
                      return (
                        <TableRow key={customTarget.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 bg-gray-50/30 dark:bg-gray-800/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-700">
                                <Target className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {targetName.charAt(0).toUpperCase() + targetName.slice(1)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Custom {category.title.toLowerCase()} target
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-24"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {customTarget.target}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={handleEditSave}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    {saving ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(customTarget.goal)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteTarget(customTarget.id, customTarget.goal)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* All Targets Summary Table */}
      {targets.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              All Targets Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                    <TableHead>Target Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((target) => (
                    <TableRow key={target.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {target.goal}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {target.target}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {new Date(target.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(target.goal)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTarget(target.id, target.goal)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {targets.length === 0 && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Targets Set
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by adding targets for nutrition, fitness, health, and performance goals using the + buttons in each category.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientTargetsTable;
