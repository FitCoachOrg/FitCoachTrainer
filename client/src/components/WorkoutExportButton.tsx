/**
 * Workout Export Button Component
 * 
 * This component provides export functionality for workout plans with multiple format options:
 * - CSV Export (simple, fast)
 * - Excel Export (detailed with multiple sheets)
 * - JSON Export (for backup/import purposes)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  ChevronDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  exportWorkoutPlanAsCSV, 
  exportWorkoutPlanAsExcel, 
  exportWorkoutPlanAsJSON 
} from '@/lib/workout-export-utils';

interface WorkoutExportButtonProps {
  weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>;
  clientId: number;
  planStartDate: Date;
  clientName?: string;
  disabled?: boolean;
  className?: string;
}

export const WorkoutExportButton: React.FC<WorkoutExportButtonProps> = ({
  weekData,
  clientId,
  planStartDate,
  clientName,
  disabled = false,
  className = ''
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Check if there's any data to export
  const hasData = weekData.some(day => day && day.exercises && day.exercises.length > 0);

  const handleExport = async (
    exportFunction: () => void,
    format: 'CSV' | 'Excel' | 'JSON'
  ) => {
    if (!hasData) {
      toast({
        title: 'No Data to Export',
        description: 'There are no workout exercises to export.',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    
    try {
      exportFunction();
      
      toast({
        title: `${format} Export Successful`,
        description: `Your workout plan has been exported as ${format}.`,
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (error) {
      console.error(`Export error:`, error);
      
      toast({
        title: 'Export Failed',
        description: `Failed to export workout plan as ${format}. Please try again.`,
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = () => {
    handleExport(
      () => exportWorkoutPlanAsCSV(weekData, clientId, planStartDate, clientName),
      'CSV'
    );
  };

  const handleExcelExport = () => {
    handleExport(
      () => exportWorkoutPlanAsExcel(weekData, clientId, planStartDate, clientName),
      'Excel'
    );
  };

  const handleJSONExport = () => {
    handleExport(
      () => exportWorkoutPlanAsJSON(weekData, clientId, planStartDate, clientName),
      'JSON'
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || isExporting}
          className={`gap-2 ${className}`}
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Plan'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handleCSVExport}
          disabled={!hasData}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as CSV
          <span className="text-xs text-muted-foreground ml-auto">Simple</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleExcelExport}
          disabled={!hasData}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export as Excel
          <span className="text-xs text-muted-foreground ml-auto">Detailed</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleJSONExport}
          disabled={!hasData}
          className="gap-2"
        >
          <FileJson className="h-4 w-4" />
          Export as JSON
          <span className="text-xs text-muted-foreground ml-auto">Backup</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkoutExportButton; 