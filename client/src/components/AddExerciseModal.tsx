import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { exerciseService, CustomExercise } from "@/lib/exercise-service";

export interface AddExerciseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Predefined options based on common exercise categories
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Expert"];
const CATEGORIES = [
  "Core",
  "Full Body", 
  "Upper Body",
  "Lower Body",
  "Cardio",
  "Strength",
  "Flexibility",
  "Balance",
  "Yoga",
  "Pilates",
  "HIIT",
  "Stretching"
];
const EQUIPMENT_OPTIONS = [
  "Bodyweight",
  "Dumbbells",
  "Barbell",
  "Kettlebell",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Treadmill",
  "Bicycle",
  "Rowing Machine",
  "Medicine Ball",
  "Foam Roller",
  "Yoga Mat",
  "None"
];

export default function AddExerciseModal({ open, onClose, onSuccess }: AddExerciseModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    exercise_name: "",
    expereince_level: "",
    target_muscle: "",
    primary_muscle: "",
    category: "",
    video_link: "",
    equipment: "",
    video_explanation: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.exercise_name.trim()) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.expereince_level) {
      toast({
        title: "Error", 
        description: "Experience level is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Error",
        description: "Category is required", 
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Use the exercise service to add custom exercise
      const customExercise: CustomExercise = {
        exercise_name: formData.exercise_name.trim(),
        expereince_level: formData.expereince_level,
        target_muscle: formData.target_muscle.trim() || undefined,
        primary_muscle: formData.primary_muscle.trim() || undefined,
        category: formData.category,
        video_link: formData.video_link.trim() || undefined,
        equipment: formData.equipment || "Bodyweight",
        video_explanation: formData.video_explanation.trim() || undefined
      };

      await exerciseService.addCustomExercise(customExercise);

      toast({
        title: "Success",
        description: "Custom exercise added successfully!",
      });

      // Reset form
      setFormData({
        exercise_name: "",
        expereince_level: "",
        target_muscle: "",
        primary_muscle: "",
        category: "",
        video_link: "",
        equipment: "",
        video_explanation: ""
      });

      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error("Error adding custom exercise:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add custom exercise",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Exercise
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exercise Name */}
          <div className="space-y-2">
            <Label htmlFor="exercise_name">Exercise Name *</Label>
            <Input
              id="exercise_name"
              placeholder="e.g., Custom Push-up Variation"
              value={formData.exercise_name}
              onChange={(e) => handleInputChange("exercise_name", e.target.value)}
              required
            />
          </div>

          {/* Experience Level and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select
                value={formData.expereince_level}
                onValueChange={(value) => handleInputChange("expereince_level", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Muscle and Primary Muscle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_muscle">Target Muscle</Label>
              <Input
                id="target_muscle"
                placeholder="e.g., Chest, Triceps"
                value={formData.target_muscle}
                onChange={(e) => handleInputChange("target_muscle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_muscle">Primary Muscle</Label>
              <Input
                id="primary_muscle"
                placeholder="e.g., Chest"
                value={formData.primary_muscle}
                onChange={(e) => handleInputChange("primary_muscle", e.target.value)}
              />
            </div>
          </div>

          {/* Equipment and Video Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Select
                value={formData.equipment}
                onValueChange={(value) => handleInputChange("equipment", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_OPTIONS.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_link">Video Link</Label>
              <Input
                id="video_link"
                type="url"
                placeholder="https://youtube.com/..."
                value={formData.video_link}
                onChange={(e) => handleInputChange("video_link", e.target.value)}
              />
            </div>
          </div>

          {/* Video Explanation */}
          <div className="space-y-2">
            <Label htmlFor="video_explanation">Exercise Instructions</Label>
            <Textarea
              id="video_explanation"
              placeholder="Describe how to perform this exercise correctly..."
              value={formData.video_explanation}
              onChange={(e) => handleInputChange("video_explanation", e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exercise
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
