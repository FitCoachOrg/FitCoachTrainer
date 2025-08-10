/**
 * Workout Import Button Component
 * 
 * This component provides import functionality for workout plans with:
 * - File upload (CSV, Excel, JSON)
 * - Data validation and preview
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
  Download
} from 'lucide-react';
import { 
  parseCSVFile, 
  parseExcelFile, 
  parseJSONFile, 
  validateImportedData, 
  createImportPreview,
  convertToWorkoutPlanFormat,
  type ImportableExercise,
  type ImportPreviewData
} from '@/lib/workout-import-utils';

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
}

export const WorkoutImportButton: React.FC<WorkoutImportButtonProps> = ({
  clientId,
  clientName,
  planStartDate,
  onImportSuccess,
  disabled = false,
  className = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [importedExercises, setImportedExercises] = useState<ImportableExercise[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportPreview(null);
    setImportedExercises([]);

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

      // Create preview data
      const preview = createImportPreview(exercises);
      setImportPreview(preview);
      setImportedExercises(exercises);

      toast({
        title: 'File Processed Successfully',
        description: `Found ${exercises.length} exercises across ${preview.totalDays} days.`,
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
      // Convert to workout plan format
      const result = convertToWorkoutPlanFormat(importedExercises, clientId, planStartDate);
      
      // Call the success callback with both week data and date range
      onImportSuccess(result.weekData, result.dateRange);
      
      // Close dialog and reset state
      setIsImportDialogOpen(false);
      setImportPreview(null);
      setImportedExercises([]);
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${importedExercises.length} exercises for ${result.weekData.length} days.`,
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

  const handleCancel = () => {
    setIsImportDialogOpen(false);
    setImportPreview(null);
    setImportedExercises([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = `Date,Day,Focus,Exercise,Category,Body Part,Sets,Reps,Duration (min),Rest (sec),Weight,Equipment,Coach Tip,Video Link,Other Details
2024-01-15,Monday,Upper Body Strength,Push-ups,Strength,Chest,3,10-12,5,60,Bodyweight,None,Keep your core tight and maintain proper form,https://example.com/pushups,
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

  const renderImportPreview = () => {
    if (!importPreview) return null;

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
                  <div className="text-2xl font-bold">{importPreview.totalDays}</div>
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
              {Object.entries(importPreview.exercisesByDay).map(([date, exercises]) => (
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
              Upload a CSV, Excel, or JSON file containing workout plan data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload Section */}
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
                           disabled={isProcessing}
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
    </>
  );
};

export default WorkoutImportButton; 