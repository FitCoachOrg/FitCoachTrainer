/**
 * Workout Import Button Component
 * 
 * This component provides import functionality for workout plans with:
 * - Start date selection for import
 * - File upload (CSV, Excel, JSON)
 * - Data validation and preview
 * - Exercise mapping to workout days
 * - Import confirmation and execution
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  X,
  Calendar,
  Dumbbell,
  Users,
  Clock,
  Loader2,
  Download,
  CalendarDays
} from 'lucide-react';
import { 
  parseCSVFile, 
  parseExcelFile, 
  parseJSONFile, 
  validateImportedData, 
  createImportPreview,
  convertToWorkoutPlanFormat,
  mapExercisesToWorkoutDays,
  checkForExistingExercises,
  type ImportableExercise,
  type ImportPreviewData
} from '@/lib/workout-import-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface WorkoutImportButtonProps {
  clientId: number;
  clientName?: string;
  planStartDate: Date;
  onImportSuccess: (weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>, dateRange: { start: string; end: string }) => void;
  disabled?: boolean;
  className?: string;
  clientWorkoutDays?: string[]; // NEW: Client's workout days for mapping
}

export const WorkoutImportButton: React.FC<WorkoutImportButtonProps> = ({
  clientId,
  clientName,
  planStartDate,
  onImportSuccess,
  disabled = false,
  className = '',
  clientWorkoutDays
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ensure clientWorkoutDays is always an array
  const safeClientWorkoutDays = Array.isArray(clientWorkoutDays) ? clientWorkoutDays : [];
  
  // State management
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [importedExercises, setImportedExercises] = useState<ImportableExercise[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  // NEW: Start date selection state
  const [importStartDate, setImportStartDate] = useState<Date | null>(null);
  const [mappedExercises, setMappedExercises] = useState<ImportableExercise[]>([]);
  
  // NEW: Conflict detection state
  const [conflictCheck, setConflictCheck] = useState<{
    hasConflicts: boolean;
    conflictingDates: string[];
    dateRange: { start: string; end: string };
  } | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚀 [handleFileUpload] File upload triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ [handleFileUpload] No file selected');
      return;
    }
    console.log('📁 [handleFileUpload] File selected:', file.name, 'Size:', file.size, 'bytes');

    // NEW: Check if start date is selected
    if (!importStartDate) {
      toast({
        title: 'Start Date Required',
        description: 'Please select a start date before uploading a file.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setImportPreview(null);
    setImportedExercises([]);
    setMappedExercises([]);

    try {
      let exercises: ImportableExercise[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        const text = await file.text();
        exercises = parseCSVFile(text);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const buffer = await file.arrayBuffer();
        exercises = parseExcelFile(buffer);
      } else if (fileExtension === 'json') {
        const text = await file.text();
        exercises = parseJSONFile(text);
      } else {
        throw new Error('Unsupported file format. Please use CSV, Excel, or JSON files.');
      }

      // Validate the imported data
      const validation = validateImportedData(exercises);
      
      if (!validation.isValid) {
        toast({
          title: 'Import Validation Failed',
          description: validation.errors.join('\n'),
          variant: 'destructive'
        });
        return;
      }

      // NEW: Map exercises to workout days if client has workout days configured
      let mappedExercisesData: ImportableExercise[] = [];
      console.log('🏋️ [handleFileUpload] Client workout days:', safeClientWorkoutDays);
      console.log('📅 [handleFileUpload] Import start date:', importStartDate);
      if (safeClientWorkoutDays && safeClientWorkoutDays.length > 0) {
        try {
          console.log('🗓️ [handleFileUpload] Starting exercise mapping...');
          mappedExercisesData = mapExercisesToWorkoutDays(exercises, importStartDate, safeClientWorkoutDays);
          setMappedExercises(mappedExercisesData);
          console.log('✅ [handleFileUpload] Exercise mapping completed');
        } catch (error) {
          console.warn('Failed to map exercises to workout days:', error);
          toast({
            title: 'Mapping Warning',
            description: 'Failed to map exercises to workout days. Using original dates.',
            variant: 'default'
          });
        }
      }

      // Create preview data with mapped exercises if available
      const preview = createImportPreview(exercises, mappedExercisesData.length > 0 ? mappedExercisesData : undefined);
      setImportPreview(preview);
      setImportedExercises(exercises);

      // NEW: Check for conflicts with existing exercises
      const exercisesToCheck = mappedExercisesData.length > 0 ? mappedExercisesData : exercises;
      const dates = [...new Set(exercisesToCheck.map(ex => ex.date))].sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      console.log('🔍 [handleFileUpload] DEBUGGING MAPPING RESULTS:');
      console.log('🔍 [handleFileUpload] Original exercises count:', exercises.length);
      console.log('🔍 [handleFileUpload] Mapped exercises count:', mappedExercisesData.length);
      console.log('🔍 [handleFileUpload] Unique dates found:', dates);
      console.log('🔍 [handleFileUpload] Date range:', startDate, 'to', endDate);
      console.log('🔍 [handleFileUpload] Sample mapped exercises:');
      mappedExercisesData.slice(0, 5).forEach((ex, i) => {
        console.log(`  ${i + 1}. ${ex.exercise} → ${ex.date} (${ex.day_name})`);
      });

      if (startDate && endDate) {
        console.log('🔍 [handleFileUpload] Checking for conflicts in date range:', startDate, 'to', endDate);
        const conflictResult = await checkForExistingExercises(clientId, startDate, endDate);
        setConflictCheck(conflictResult);
        
        if (conflictResult.hasConflicts) {
          console.log('⚠️ [handleFileUpload] Conflicts detected, showing conflict dialog');
          setShowConflictDialog(true);
        }
      }

      const exercisesToShow = mappedExercisesData.length > 0 ? mappedExercisesData : exercises;
      const workoutDaysText = safeClientWorkoutDays && safeClientWorkoutDays.length > 0 
        ? `mapped to ${safeClientWorkoutDays.join(', ')} workout days` 
        : 'using original dates';

      toast({
        title: 'File Processed Successfully',
        description: `Found ${exercises.length} exercises ${workoutDaysText}.`,
        icon: <CheckCircle className="h-4 w-4" />
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to process the file.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importedExercises.length) return;

    setIsImporting(true);
    
    try {
      // Use mapped exercises if available, otherwise use original
      const exercisesToImport = mappedExercises.length > 0 ? mappedExercises : importedExercises;
      
      // Convert to workout plan format
      const result = convertToWorkoutPlanFormat(
        exercisesToImport, 
        clientId, 
        importStartDate || planStartDate,
        safeClientWorkoutDays
      );
      
      // Call the success callback with both week data and date range
      onImportSuccess(result.weekData, result.dateRange);
      
      // Close dialogs and reset state
      setIsImportDialogOpen(false);
      setShowConflictDialog(false);
      setImportPreview(null);
      setImportedExercises([]);
      setMappedExercises([]);
      setImportStartDate(null);
      setConflictCheck(null);
      
      const mappingText = mappedExercises.length > 0 
        ? `mapped to ${safeClientWorkoutDays.join(', ')} workout days` 
        : 'using original dates';
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${importedExercises.length} exercises ${mappingText} for ${result.weekData.length} days.`,
        icon: <CheckCircle className="h-4 w-4" />
      });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import the workout plan.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConflictConfirm = () => {
    setShowConflictDialog(false);
    // Proceed with import (conflicts will be overwritten)
    handleImport();
  };

  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setConflictCheck(null);
  };

  const handleCancel = () => {
    setIsImportDialogOpen(false);
    setImportPreview(null);
    setImportedExercises([]);
    setMappedExercises([]);
    setImportStartDate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = `Date,Day,Focus,Exercise,Category,Body Part,Sets,Reps,Duration (min),Rest (sec),Weight,Equipment,Coach Tip,Video Link,Other Details
2024-01-15,Monday,Upper Body Strength,Push-ups,Strength,Chest,3-5,10-12,5,60,Bodyweight,None,Keep your core tight and maintain proper form,https://example.com/pushups,
2024-01-16,Tuesday,Lower Body Strength,Squats,Strength,Legs,4,12-15,8,120,Bodyweight,None,Keep your knees behind your toes and chest up,https://example.com/squats,
2024-01-17,Wednesday,Cardio,Running,Cardio,Full Body,1,30 minutes,30,0,Bodyweight,None,Maintain steady pace throughout the run,,`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'workout_plan_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded. Use this format for your workout plan.',
      icon: <CheckCircle className="h-4 w-4" />
    });
  };

  const renderValidationErrors = () => {
    if (!importPreview?.validationErrors.length) return null;

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold mb-2">Validation Errors:</div>
          <ul className="list-disc list-inside space-y-1">
            {importPreview.validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  const renderValidationWarnings = () => {
    const warnings = importPreview?.validationWarnings || [];
    const conflicts = importPreview?.conflictingDates || [];
    
    if (!warnings.length && !conflicts.length) return null;

    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold mb-2">Warnings:</div>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm">{warning}</li>
            ))}
            {conflicts.length > 0 && (
              <li className="text-sm font-semibold text-orange-600">
                Existing workout plans found for {conflicts.length} date(s). Importing will overwrite these plans.
              </li>
            )}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  const renderStartDateSelection = () => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Select Start Date</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose when you want the workout plan to start. Exercises will be mapped to your client's workout days.
            </p>
            
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[220px] justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {importStartDate ? format(importStartDate, "PPP") : "Pick a start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={importStartDate || undefined}
                    onSelect={(date) => setImportStartDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {safeClientWorkoutDays && safeClientWorkoutDays.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Workout Days:</span> {safeClientWorkoutDays.join(', ')}
                </div>
              )}
            </div>
            
            {!safeClientWorkoutDays || safeClientWorkoutDays.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Client has no workout days configured. Exercises will use original dates from the file.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderImportPreview = () => {
    if (!importPreview) return null;

    const exercisesToShow = mappedExercises.length > 0 ? mappedExercises : importedExercises;
    const exercisesByDay = exercisesToShow.reduce((acc, exercise) => {
      if (!acc[exercise.date]) acc[exercise.date] = [];
      acc[exercise.date].push(exercise);
      return acc;
    }, {} as Record<string, ImportableExercise[]>);

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{importPreview.totalExercises}</div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{Object.keys(exercisesByDay).length}</div>
                  <div className="text-xs text-muted-foreground">Workout Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-sm font-bold">{importPreview.dateRange.start}</div>
                  <div className="text-xs text-muted-foreground">Start Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm font-bold">{importPreview.dateRange.end}</div>
                  <div className="text-xs text-muted-foreground">End Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mapping Information */}
        {mappedExercises.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Exercises mapped to workout days:</strong> {safeClientWorkoutDays.join(', ')} starting from {format(importStartDate!, "PPP")}
            </AlertDescription>
          </Alert>
        )}

        {/* Exercises by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Exercises by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(exercisesByDay).map(([date, exercises]) => (
                <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{date}</div>
                    <Badge variant="secondary">{exercises.length} exercises</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {exercises.slice(0, 3).map(e => e.exercise).join(', ')}
                    {exercises.length > 3 && ` +${exercises.length - 3} more`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsImportDialogOpen(true)}
        disabled={disabled}
        className={`gap-2 ${className}`}
      >
        <Upload className="h-4 w-4" />
        Import Plan
      </Button>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Workout Plan
            </DialogTitle>
            <DialogDescription>
              Select a start date and upload a CSV, Excel, or JSON file containing workout plan data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Start Date Selection */}
            {renderStartDateSelection()}

            {/* Step 2: File Upload Section */}
            {!importPreview && (
              <Card>
                <CardContent className="p-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Upload Workout Plan File</h3>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: CSV, Excel (.xlsx, .xls), JSON
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                        <FileJson className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessing || !importStartDate}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleDownloadTemplate}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            )}

            {/* Validation Messages */}
            {renderValidationErrors()}
            {renderValidationWarnings()}

            {/* Import Preview */}
            {renderImportPreview()}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {importPreview && (
              <Button 
                onClick={handleImport}
                disabled={isImporting || importPreview.validationErrors.length > 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Import Plan
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Detection Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Exercise Conflicts Detected
            </DialogTitle>
            <DialogDescription>
              Found existing exercises in the selected date range.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Date Range Affected:</div>
                <div className="text-sm">
                  {conflictCheck?.dateRange.start} to {conflictCheck?.dateRange.end}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Importing will overwrite all existing exercises in this range.
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              <p>This action will replace all existing exercises on the affected dates with the new imported exercises.</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleConflictCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleConflictConfirm}
              variant="destructive"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Overwrite All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkoutImportButton; 