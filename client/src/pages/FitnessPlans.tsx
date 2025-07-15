import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { generateAIWorkoutPlanForReview } from "@/lib/ai-fitness-plan"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useClients } from "@/hooks/use-clients"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase" // Assuming supabase client is here
import { WorkoutPlanTable } from "@/components/WorkoutPlanTable"
import DatePickerTest from "@/components/DatePickerTest"

// NOTE FOR THE DEVELOPER:
// This component is being significantly refactored to align its functionality
// with the Nutrition Plan screen. It will now fetch existing workout plans
// for a selected client and date, display them in an editable table, and allow
// for AI generation as a secondary action.

// The placeholder component is now removed, as we are importing the real one.

// TODO: Move this to a library file (e.g., lib/workout-plans.ts)
async function fetchWorkoutPlan(clientId: number, date: Date) {
  console.log(`Fetching workout plan for client ${clientId} on ${format(date, "yyyy-MM-dd")}`)
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real implementation, you would query your Supabase 'schedule' table
  // For now, we return a mock plan for demonstration purposes.
  // Replace this with a real Supabase query.
  const { data, error } = await supabase
    .from('schedule')
    .select('*')
    .eq('client_id', clientId)
    .eq('type', 'workout')
    .gte('for_date', format(date, 'yyyy-MM-dd'))
    .lte('for_date', format(new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')) // for the next 7 days
    .order('for_date', { ascending: true });

  if (error) {
    console.error("Error fetching workout plan:", error);
    return null;
  }

  // Return some mock data if nothing is found for demonstration
  if (!data || data.length === 0) {
    return null;
  }

  return data;
}

const FitnessPlansPage = () => {
  const { toast } = useToast()
  const { clients, loading: clientsLoading } = useClients()

  // State for client and date selection
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined)
  const [planStartDate, setPlanStartDate] = useState<Date>(new Date())

  // State for data loading and plan storage
  const [isFetchingPlan, setIsFetchingPlan] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null)
  
  // State for AI generation
  const [isGenerating, setIsGenerating] = useState(false)

  // Effect to fetch the workout plan when client or date changes
  useEffect(() => {
    if (selectedClientId) {
      const loadPlan = async () => {
        setIsFetchingPlan(true)
        setWorkoutPlan(null) // Clear previous plan
        const plan = await fetchWorkoutPlan(selectedClientId, planStartDate)
        setWorkoutPlan(plan)
        setIsFetchingPlan(false)
      }
      loadPlan()
    }
  }, [selectedClientId, planStartDate])

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      toast({
        title: "No Client Selected",
        description: "Please select a client before generating a plan.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // The result of this function should now be handled differently.
      // It should either replace the current view with an editable AI-generated plan,
      // or be merged into the existing plan.
      const result = await generateAIWorkoutPlanForReview(selectedClientId)
      console.log("AI Plan Generated:", result)
      // For now, we will just toast a success message.
      // The new table component will handle the result.
      if(result.success) {
        toast({
          title: "AI Plan Generated",
          description: "The new plan is ready for review.",
        })
        // We can temporarily set it as the current workout plan
        // to see it in the placeholder
        setWorkoutPlan(result.workoutPlan)
      } else {
        throw new Error(result.message || "Unknown error")
      }
    } catch (error: any) {
      toast({
        title: "AI Generation Failed",
        description: error.message || "Could not generate workout plan.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workout Plans</h1>
            <p className="text-muted-foreground">
              View, edit, and create workout plans for your clients.
            </p>
          </div>
        </header>

        {/* TEST: Date Picker Test Component */}
        <Card>
          <CardHeader>
            <CardTitle>Date Picker Test</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePickerTest />
          </CardContent>
        </Card>

        {/* Control Bar: Client and Date Selection */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="grid gap-2 w-full sm:w-auto">
              <Label htmlFor="client-select">Select Client</Label>
              {clientsLoading ? (
                <p>Loading clients...</p>
              ) : (
                <Select
                  value={selectedClientId?.toString() ?? ""}
                  onValueChange={(value) => setSelectedClientId(Number(value))}
                >
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2 w-full sm:w-auto">
              <Label htmlFor="date-select">Plan Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full sm:w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(planStartDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={planStartDate}
                    onSelect={(date) => date && setPlanStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="ml-auto pt-4 sm:pt-0">
              <Button onClick={handleGeneratePlan} disabled={isGenerating || !selectedClientId}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate with AI"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plan Display Area */}
        <div className="mt-6">
          {!selectedClientId ? (
            <Card className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Please select a client to view their workout plan.</p>
            </Card>
          ) : isFetchingPlan ? (
            <Card className="flex items-center justify-center h-64">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <p>Loading workout plan...</p>
            </Card>
          ) : workoutPlan ? (
            // Replace the placeholder with the real component
            <WorkoutPlanTable initialPlanData={workoutPlan} clientId={selectedClientId} />
          ) : (
            <Card className="flex flex-col items-center justify-center h-64 text-center">
               <h3 className="text-lg font-semibold">No Workout Plan Found</h3>
              <p className="text-muted-foreground mt-2">
                No plan found for the selected week.
              </p>
              <Button onClick={handleGeneratePlan} disabled={isGenerating} className="mt-4">
                 {isGenerating ? 'Generating...' : 'Generate a new plan with AI'}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default FitnessPlansPage;