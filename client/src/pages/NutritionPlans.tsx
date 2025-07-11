import { useState } from "react";
import * as Icons from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const NutritionPlans = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"text" | "table">("table");
  const [structuredPlan, setStructuredPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    clientName: "",
    dietaryPreference: "balanced",
    calorieTarget: "",
    healthGoal: "",
    restrictions: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate plan generation
    setTimeout(() => {
      setIsGenerating(false);
      
      // Create structured plan data
      const structuredData = {
        clientName: formData.clientName,
        calorieTarget: formData.calorieTarget || "2000",
        goal: formData.healthGoal || "Balanced nutrition and weight maintenance",
        dietaryPreference: formData.dietaryPreference,
        restrictions: formData.restrictions,
        meals: [
          {
            meal: "Breakfast",
            time: "7:00 AM",
            calories: 500,
            foods: [
              "Overnight oats with berries and nuts",
              "Greek yogurt with honey",
              "Green tea or black coffee"
            ],
            macros: { protein: "15g", carbs: "45g", fats: "12g" }
          },
          {
            meal: "Mid-morning Snack",
            time: "10:00 AM",
            calories: 200,
            foods: [
              "Apple with 1 tbsp almond butter",
              "Herbal tea"
            ],
            macros: { protein: "4g", carbs: "25g", fats: "8g" }
          },
          {
            meal: "Lunch",
            time: "1:00 PM",
            calories: 600,
            foods: [
              "Grilled chicken salad with mixed greens",
              "1/2 cup quinoa",
              "Olive oil and lemon dressing",
              "Water with lemon"
            ],
            macros: { protein: "35g", carbs: "40g", fats: "20g" }
          },
          {
            meal: "Afternoon Snack",
            time: "4:00 PM",
            calories: 200,
            foods: [
              "Carrot sticks with hummus",
              "10 almonds"
            ],
            macros: { protein: "6g", carbs: "20g", fats: "10g" }
          },
          {
            meal: "Dinner",
            time: "7:00 PM",
            calories: 500,
            foods: [
              "Baked salmon with herbs",
              "Steamed broccoli and asparagus",
              "1/2 cup brown rice",
              "Water"
            ],
            macros: { protein: "30g", carbs: "35g", fats: "15g" }
          }
        ],
        hydration: "Aim for 2-3 liters of water daily",
        supplements: [
          { name: "Vitamin D3", dosage: "1000 IU daily" },
          { name: "Omega-3", dosage: "1000mg daily" }
        ],
        mealPrepTips: [
          "Prepare overnight oats in batches for 3-4 days",
          "Grill extra chicken for quick lunch additions",
          "Wash and chop vegetables in advance",
          "Cook grains in batches for quicker meal assembly"
        ]
      };
      
      setStructuredPlan(structuredData);
      setNutritionPlan(`# Personalized Nutrition Plan for ${formData.clientName}

## Daily Calorie Target: ${formData.calorieTarget || "2000"} calories

### Goal: ${formData.healthGoal || "Balanced nutrition and weight maintenance"}

#### Dietary Preference: ${formData.dietaryPreference}
${formData.restrictions ? `#### Dietary Restrictions: ${formData.restrictions}` : ""}

## Daily Meal Plan

### Breakfast (500 calories)
- Overnight oats with berries and nuts
- Greek yogurt with honey
- Green tea or black coffee

### Mid-morning Snack (200 calories)
- Apple with 1 tbsp almond butter
- Herbal tea

### Lunch (600 calories)
- Grilled chicken salad with mixed greens
- 1/2 cup quinoa
- Olive oil and lemon dressing
- Water with lemon

### Afternoon Snack (200 calories)
- Carrot sticks with hummus
- 10 almonds

### Dinner (500 calories)
- Baked salmon with herbs
- Steamed broccoli and asparagus
- 1/2 cup brown rice
- Water

## Hydration
Aim for 2-3 liters of water daily

## Supplementation
- Vitamin D3: 1000 IU daily
- Omega-3: 1000mg daily

## Weekly Meal Prep Tips
1. Prepare overnight oats in batches for 3-4 days
2. Grill extra chicken for quick lunch additions
3. Wash and chop vegetables in advance
4. Cook grains in batches for quicker meal assembly
      `);
      
      toast({
        title: "Nutrition Plan Generated",
        description: "Your customized nutrition plan is ready to review.",
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Nutrition Plan Generator</h1>
      
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="saved">Saved Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Personalized Nutrition Plan</CardTitle>
              <CardDescription>
                Create a customized nutrition plan based on client preferences and goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeneratePlan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input 
                      id="clientName" 
                      name="clientName" 
                      placeholder="Enter client name" 
                      value={formData.clientName}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="calorieTarget">Calorie Target</Label>
                    <Input 
                      id="calorieTarget" 
                      name="calorieTarget" 
                      placeholder="e.g. 2000" 
                      type="number"
                      value={formData.calorieTarget}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dietaryPreference">Dietary Preference</Label>
                    <select 
                      id="dietaryPreference"
                      name="dietaryPreference"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.dietaryPreference}
                      onChange={(e) => setFormData(prev => ({ ...prev, dietaryPreference: e.target.value }))}
                    >
                      <option value="balanced">Balanced</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Keto</option>
                      <option value="paleo">Paleo</option>
                      <option value="mediterranean">Mediterranean</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="healthGoal">Health Goal</Label>
                    <Input 
                      id="healthGoal" 
                      name="healthGoal" 
                      placeholder="e.g. Weight loss, muscle gain" 
                      value={formData.healthGoal}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restrictions">Dietary Restrictions/Allergies</Label>
                  <textarea 
                    id="restrictions"
                    name="restrictions"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="List any food allergies or dietary restrictions"
                    value={formData.restrictions}
                    onChange={handleChange}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Icons.Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Icons.WaveIcon className="mr-2 h-4 w-4" />
                      Generate Nutrition Plan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {nutritionPlan && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Generated Nutrition Plan</CardTitle>
                    <CardDescription>
                      Review and customize this plan before assigning to your client
                    </CardDescription>
                  </div>
                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="flex items-center gap-2"
                    >
                      <Icons.TableIcon className="h-4 w-4" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("text")}
                      className="flex items-center gap-2"
                    >
                      <Icons.ScrollIcon className="h-4 w-4" />
                      Text
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "table" && structuredPlan ? (
                  <div className="space-y-6">
                    {/* Plan Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Client</Label>
                        <p className="font-semibold">{structuredPlan.clientName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Calorie Target</Label>
                        <p className="font-semibold">{structuredPlan.calorieTarget} cal</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Diet</Label>
                        <Badge variant="outline" className="capitalize">{structuredPlan.dietaryPreference}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Goal</Label>
                        <p className="font-semibold text-sm">{structuredPlan.goal}</p>
                      </div>
                    </div>

                    {/* Meals Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Meal</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Calories</TableHead>
                            <TableHead>Foods</TableHead>
                            <TableHead>Macros</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {structuredPlan.meals.map((meal: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{meal.meal}</TableCell>
                              <TableCell>{meal.time}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{meal.calories} cal</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {meal.foods.map((food: string, foodIndex: number) => (
                                    <div key={foodIndex} className="text-sm">• {food}</div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div>Protein: {meal.macros.protein}</div>
                                  <div>Carbs: {meal.macros.carbs}</div>
                                  <div>Fats: {meal.macros.fats}</div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Hydration */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Hydration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{structuredPlan.hydration}</p>
                        </CardContent>
                      </Card>

                      {/* Supplements */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Supplements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {structuredPlan.supplements.map((supplement: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="font-medium">{supplement.name}</span>
                                <Badge variant="outline">{supplement.dosage}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Meal Prep Tips */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Weekly Meal Prep Tips</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {structuredPlan.mealPrepTips.map((tip: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold">{index + 1}.</span>
                              <span className="text-sm">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="text-sm p-4 bg-slate-100 dark:bg-slate-800 rounded-md whitespace-pre-wrap">
                      {nutritionPlan}
                    </pre>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline">
                    <Icons.PencilIcon className="mr-2 h-4 w-4" />
                    Edit Plan
                  </Button>
                  <Button>
                    <Icons.UserPlusIcon className="mr-2 h-4 w-4" />
                    Assign to Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Nutrition Plans</CardTitle>
              <CardDescription>
                Access and manage all your saved nutrition plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Icons.ClipboardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold">No saved plans yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Generate your first nutrition plan to see it here
                </p>
                <Button variant="outline" onClick={() => document.querySelector('[value="generator"]')?.dispatchEvent(new Event('click'))}>
                  <Icons.PlusIcon className="mr-2 h-4 w-4" />
                  Create New Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NutritionPlans;