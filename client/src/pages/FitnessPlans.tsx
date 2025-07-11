import React, { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import PlanCard from "@/components/plans/PlanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plan } from "@shared/schema";
import PlanForm from "@/components/plans/PlanForm";
import * as Icons from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FitnessPlanOverview from "@/components/FitnessPlanOverview";
import { generateAIWorkoutPlanForReview } from "@/lib/ai-fitness-plan";

// Mock exercise data for the library
const EXERCISES = [
  { id: 1, name: "Push-Up", image: "https://wger.de/media/exercise-images/1/Push-up-1.png" },
  { id: 2, name: "Dumbbell Rear Delt Row", image: "https://wger.de/media/exercise-images/2/Dumbbell-rear-delt-row-1.png" },
  { id: 3, name: "Jumping Jacks", image: "https://wger.de/media/exercise-images/3/Jumping-jack-1.png" },
  { id: 4, name: "Dumbbell Bicep Curl", image: "https://wger.de/media/exercise-images/4/Dumbbell-biceps-curl-1.png" },
  { id: 5, name: "Standing Biceps Stretch", image: "https://wger.de/media/exercise-images/5/Standing-biceps-stretch-1.png" },
  { id: 6, name: "Hanging Oblique Knee Raise", image: "https://wger.de/media/exercise-images/6/Hanging-oblique-knee-raise-1.png" },
  { id: 7, name: "Walking High Knees", image: "https://wger.de/media/exercise-images/7/Walking-high-knees-1.png" },
];

function FitnessPlanBuilder() {
  const [search, setSearch] = useState("");
  const [workout, setWorkout] = useState<any[]>([]);

  // Add exercise to workout
  const addExercise = (exercise: any) => {
    setWorkout([...workout, { ...exercise, sets: 1, reps: "10-12", rest: "00:00", note: "" }]);
  };

  // Edit exercise in workout
  const updateExercise = (idx: number, field: string, value: any) => {
    setWorkout(workout.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };

  // Remove exercise
  const removeExercise = (idx: number) => {
    setWorkout(workout.filter((_, i) => i !== idx));
  };

  // Move exercise (drag-and-drop, simplified)
  const moveExercise = (from: number, to: number) => {
    if (from === to) return;
    const updated = [...workout];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setWorkout(updated);
  };

  // Filtered exercise library
  const filteredExercises = EXERCISES.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex w-full min-h-[600px] bg-white rounded-xl shadow overflow-hidden">
      {/* Left: Exercise Library */}
      <div className="w-72 border-r bg-gray-50 p-4 flex flex-col">
        <div className="flex gap-2 mb-4">
          <button className="flex-1 py-2 rounded bg-blue-600 text-white font-semibold">Exercises</button>
          <button className="flex-1 py-2 rounded bg-white text-gray-500 border">Sections</button>
        </div>
        <input
          className="mb-4 px-3 py-2 rounded bg-gray-100 border text-sm"
          placeholder="Search for your Exercises"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="text-xs text-gray-400 mb-2">MOST RECENT ({filteredExercises.length})</div>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-2">
          {filteredExercises.map(ex => (
            <button key={ex.id} className="flex items-center gap-3 p-2 rounded bg-white shadow hover:bg-blue-50 transition border" onClick={() => addExercise(ex)}>
              <img src={ex.image} alt={ex.name} className="w-12 h-12 rounded object-cover" />
              <span className="font-medium text-sm text-left">{ex.name}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Center: Workout Builder */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Upper Body Supersets - Demo</h2>
        <input className="w-full mb-4 px-3 py-2 rounded border text-sm" placeholder="Add a description" />
        <div className="flex flex-col gap-4">
          {workout.map((ex, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 shadow flex flex-col gap-2 relative">
              <div className="flex items-center gap-3 mb-2">
                <img src={ex.image} alt={ex.name} className="w-10 h-10 rounded object-cover" />
                <span className="font-semibold text-base">{ex.name}</span>
                <button className="ml-auto text-gray-400 hover:text-red-500" onClick={() => removeExercise(idx)} title="Remove">✕</button>
              </div>
              <div className="flex gap-2 items-center mb-2">
                <label className="text-xs text-gray-500">Set</label>
                <input type="number" min={1} value={ex.sets} onChange={e => updateExercise(idx, 'sets', Number(e.target.value))} className="w-12 px-2 py-1 rounded border text-sm" title="Sets" placeholder="Sets" />
                <label className="text-xs text-gray-500">Reps</label>
                <input type="text" value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} className="w-16 px-2 py-1 rounded border text-sm" title="Reps" placeholder="Reps" />
                <label className="text-xs text-gray-500">Rest</label>
                <input type="text" value={ex.rest} onChange={e => updateExercise(idx, 'rest', e.target.value)} className="w-16 px-2 py-1 rounded border text-sm" title="Rest" placeholder="Rest" />
                <button className="ml-2 text-gray-400 hover:text-blue-500" title="Move up" disabled={idx === 0} onClick={() => moveExercise(idx, idx - 1)}>↑</button>
                <button className="text-gray-400 hover:text-blue-500" title="Move down" disabled={idx === workout.length - 1} onClick={() => moveExercise(idx, idx + 1)}>↓</button>
              </div>
              <textarea
                className="w-full px-2 py-1 rounded border text-sm"
                placeholder="Add note for this exercise"
                value={ex.note}
                onChange={e => updateExercise(idx, 'note', e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline">Save</Button>
          <Button>Save & Close</Button>
        </div>
      </div>
      {/* Right: Workout Arrangement */}
      <div className="w-80 border-l bg-gray-50 p-4 flex flex-col">
        <h3 className="font-semibold mb-4">Workout Arrangement</h3>
        <div className="flex-1 flex flex-col gap-2">
          {workout.map((ex, idx) => (
            <div key={idx} className="bg-white rounded p-2 flex items-center gap-2 border shadow-sm">
              <span className="text-sm">{ex.name}</span>
              <span className="ml-auto text-gray-300">≡</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FitnessPlans: React.FC = () => {
  const { plans, isLoading } = usePlans();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const { toast } = useToast();

  // AI Generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPlan, setAIPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientName: "",
    fitnessLevel: "beginner",
    workoutDays: "",
    focusAreas: "",
    limitations: "",
  });

  // New state for FitnessPlanOverview integration
  const [showFitnessPlanOverview, setShowFitnessPlanOverview] = useState(false);
  const [planOverviewData, setPlanOverviewData] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      // For demo purposes, using a hardcoded client ID (in a real app, this would come from selection)
      const clientId = 34; // This should be selected from a client dropdown in a real implementation
      
      const result = await generateAIWorkoutPlanForReview(clientId);
      
      if (result.success && result.workoutPlan) {
        const planData = {
          overview: result.workoutPlan.overview,
          split: result.workoutPlan.split,
          progression_model: result.workoutPlan.progression_model,
          weekly_breakdown: result.workoutPlan.weekly_breakdown,
          workout_plan: result.workoutPlan.workout_plan,
          clientInfo: result.clientInfo,
          generatedAt: result.generatedAt
        };
        
        setPlanOverviewData(planData);
        setShowFitnessPlanOverview(true);
        setShowAIGenerator(false); // Close the generator modal
        
        toast({
          title: "AI Fitness Plan Generated",
          description: "Your customized fitness plan is ready for review and editing.",
        });
      } else {
        setAIPlan(`# Error generating plan\n\nMessage: ${result.message}`);
        toast({
          title: "Generation Failed",
          description: result.message || "Failed to generate fitness plan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setAIPlan(`# Error\n\nFailed to generate fitness plan. Please try again.`);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fitnessPlans = plans?.filter((plan) => plan.type === "fitness" && (plan.name.toLowerCase().includes(searchQuery.toLowerCase()) || (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()))));

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsFormModalOpen(true);
  };

  const handleView = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsViewModalOpen(true);
  };

  const handleAssign = (plan: Plan) => {
    setSelectedPlan(plan);
    // TODO: Implement assign functionality
    toast({
      title: "Assign Plan",
      description: `Assigning "${plan.name}" to client functionality coming soon.`,
    });
  };

  const handleAddNew = () => {
    setSelectedPlan(null);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    toast({
      title: selectedPlan ? "Plan updated" : "Plan created",
      description: selectedPlan ? "The plan has been successfully updated." : "The plan has been successfully created.",
    });
  };

  // Helper to render exercises in a plan (if available)
  const renderExercises = (plan: Plan) => {
    let content = plan.content;
    if (typeof content === "string") {
      try { content = JSON.parse(content); } catch {}
    }
    if (!content || typeof content !== 'object' || !('weeks' in content)) return null;
    const typedContent = content as { weeks: any[] };
    return typedContent.weeks.map((week: any, wIdx: number) => (
      <div key={wIdx} className="mb-6">
        <h4 className="font-semibold text-lg mb-2">{week.name}</h4>
        {week.days.map((day: any, dIdx: number) => (
          <div key={dIdx} className="mb-4">
            <div className="font-medium text-base mb-1">{day.name}</div>
            {day.exercises && day.exercises.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-lg">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Image</th>
                      <th className="p-2 text-left">Exercise</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Reps</th>
                      <th className="p-2 text-left">Rest</th>
                      <th className="p-2 text-left">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.exercises.map((ex: any, eIdx: number) => (
                      <tr key={eIdx} className="border-b">
                        <td className="p-2">
                          {ex.imageUrl ? (
                            <img src={ex.imageUrl} alt={ex.name} className="w-14 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center rounded">
                              <Icons.DumbbellIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="p-2 font-medium">{ex.name}</td>
                        <td className="p-2">{ex.description || "-"}</td>
                        <td className="p-2">{ex.reps || "-"}</td>
                        <td className="p-2">{ex.rest || "-"}</td>
                        <td className="p-2">{ex.frequency || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground italic">No exercises for this day.</div>
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="offcanvas">{/* Sidebar menu items here */}</Sidebar>
        <SidebarContent>
          <Tabs defaultValue="library" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="library">Plan Library</TabsTrigger>
              <TabsTrigger value="builder">Builder</TabsTrigger>
            </TabsList>
            <TabsContent value="library">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h1 className="text-2xl font-bold">Fitness Plan Library</h1>
                  <div className="flex w-full sm:w-auto gap-2">
                    <Button onClick={handleAddNew}>
                      <Icons.PlusIcon className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                    <Button variant="outline" onClick={() => setShowAIGenerator(true)}>
                      <Icons.SparklesIcon className="h-4 w-4 mr-2" />
                      AI Generate Plan
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-grow">
                    <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search fitness plans"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "cards" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="flex items-center gap-2"
                    >
                      <Icons.Grid3X3Icon className="h-4 w-4" />
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="flex items-center gap-2"
                    >
                      <Icons.TableIcon className="h-4 w-4" />
                      Table
                    </Button>
                  </div>
                </div>
                {isLoading ? (
                  viewMode === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-md border border-gray-200 dark:border-gray-700 h-48 animate-pulse bg-gray-100 dark:bg-gray-800" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          className="h-16 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-100 dark:bg-gray-800"
                        />
                      ))}
                    </div>
                  )
                ) : fitnessPlans && fitnessPlans.length > 0 ? (
                  viewMode === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {fitnessPlans.map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          onEdit={handleEdit}
                          onView={handleView}
                          onAssign={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fitnessPlans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">{plan.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {plan.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {plan.description || "No description"}
                              </TableCell>
                              <TableCell>
                                {new Date(plan.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(plan)}
                                    className="h-8 px-2"
                                  >
                                    <Icons.EyeIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(plan)}
                                    className="h-8 px-2"
                                  >
                                    <Icons.PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAssign(plan)}
                                    className="h-8 px-2"
                                  >
                                    <Icons.UserPlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Icons.ClipboardIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-semibold">No fitness plans yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Generate or create your first fitness plan.
                    </p>
                    <Button variant="outline" onClick={() => setShowAIGenerator(true)}>
                      <Icons.SparklesIcon className="h-4 w-4 mr-2" />
                      AI Generate Plan
                    </Button>
                  </div>
                )}
                {/* Plan Form Modal */}
                <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedPlan ? "Edit Plan" : "Create New Plan"}
                      </DialogTitle>
                    </DialogHeader>
                    <PlanForm
                      plan={selectedPlan ?? undefined}
                      onSuccess={handleFormSuccess}
                      trainerId={1}
                    />
                  </DialogContent>
                </Dialog>
                {/* Plan View Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedPlan?.name || "Plan Details"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</h4>
                        <p>{selectedPlan?.type.charAt(0).toUpperCase() + (selectedPlan?.type.slice(1) || "")}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h4>
                        <p>{selectedPlan?.description || "No description provided."}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Exercises</h4>
                        {selectedPlan && renderExercises(selectedPlan)}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {/* AI Generator Modal */}
                <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>AI Generate Fitness Plan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGeneratePlan} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="clientName" className="font-medium">Client Name</label>
                          <Input
                            id="clientName"
                            name="clientName"
                            placeholder="Enter client name"
                            value={formData.clientName}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="workoutDays" className="font-medium">Workout Days per Week</label>
                          <Input
                            id="workoutDays"
                            name="workoutDays"
                            placeholder="e.g. 3-5"
                            type="number"
                            min="1"
                            max="7"
                            value={formData.workoutDays}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="fitnessLevel" className="font-medium">Fitness Level</label>
                          <select
                            id="fitnessLevel"
                            name="fitnessLevel"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.fitnessLevel}
                            onChange={(e) => setFormData(prev => ({ ...prev, fitnessLevel: e.target.value }))}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="athletic">Athletic</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="focusAreas" className="font-medium">Focus Areas</label>
                          <Input
                            id="focusAreas"
                            name="focusAreas"
                            placeholder="e.g. Upper body, core strength"
                            value={formData.focusAreas}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="limitations" className="font-medium">Physical Limitations/Injuries</label>
                        <textarea
                          id="limitations"
                          name="limitations"
                          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="List any injuries, mobility issues or areas to avoid"
                          value={formData.limitations}
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
                            <Icons.SparklesIcon className="mr-2 h-4 w-4" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                      {aiPlan && (
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Generated Fitness Plan</CardTitle>
                            <CardDescription>Review and customize this plan before assigning to your client</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                              <pre className="text-sm p-4 bg-slate-100 dark:bg-slate-800 rounded-md whitespace-pre-wrap">{aiPlan}</pre>
                            </div>
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
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Fitness Plan Overview - Enhanced AI Review Component */}
                <FitnessPlanOverview
                  isOpen={showFitnessPlanOverview}
                  onClose={() => {
                    setShowFitnessPlanOverview(false);
                    setPlanOverviewData(null);
                  }}
                  clientId={34} // In a real app, this would be selected from a client list
                  initialPlanData={planOverviewData}
                  onPlanSaved={(success, message) => {
                    if (success) {
                      toast({
                        title: "Plan Saved Successfully",
                        description: message,
                      });
                    } else {
                      toast({
                        title: "Failed to Save Plan", 
                        description: message,
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="builder">
              <FitnessPlanBuilder />
            </TabsContent>
          </Tabs>
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
};

export default FitnessPlans;