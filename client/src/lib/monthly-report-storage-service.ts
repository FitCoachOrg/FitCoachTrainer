import { supabase } from './supabase';

export interface MonthlyReportPreferences {
  selected_metrics: string[];
  last_generated_month?: string;
  report_settings: {
    include_ai_insights: boolean;
    include_targets: boolean;
    include_charts: boolean;
  };
  generated_reports?: GeneratedReport[];
}

export interface GeneratedReport {
  month: string;
  generated_at: string;
  file_path: string;
  metrics_count: number;
  file_size?: number;
}

export class MonthlyReportStorageService {
  /**
   * Save monthly report preferences to client table
   */
  static async savePreferences(
    clientId: string,
    preferences: Partial<MonthlyReportPreferences>
  ): Promise<void> {
    try {
      console.log('💾 Saving monthly report preferences for client:', clientId, preferences);

      // Get current preferences
      const currentPreferences = await this.getPreferences(clientId);
      
      // Merge with new preferences
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
        report_settings: {
          ...currentPreferences.report_settings,
          ...preferences.report_settings
        }
      };

      // Update the client table
      const { error } = await supabase
        .from('client')
        .update({
          monthly_reports: updatedPreferences
        })
        .eq('client_id', clientId);

      if (error) {
        console.error('❌ Error saving preferences:', error);
        throw new Error(`Failed to save preferences: ${error.message}`);
      }

      console.log('✅ Monthly report preferences saved successfully');
    } catch (error) {
      console.error('❌ Error in savePreferences:', error);
      throw error;
    }
  }

  /**
   * Load monthly report preferences from client table
   */
  static async getPreferences(clientId: string): Promise<MonthlyReportPreferences> {
    try {
      console.log('📂 Loading monthly report preferences for client:', clientId);

      const { data, error } = await supabase
        .from('client')
        .select('monthly_reports')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error('❌ Error loading preferences:', error);
        throw new Error(`Failed to load preferences: ${error.message}`);
      }

      const preferences = data?.monthly_reports || {};
      
      // Return default preferences if none exist
      const defaultPreferences: MonthlyReportPreferences = {
        selected_metrics: ['weight', 'sleep', 'heartRate'],
        report_settings: {
          include_ai_insights: true,
          include_targets: true,
          include_charts: false
        },
        generated_reports: []
      };

      const mergedPreferences = {
        ...defaultPreferences,
        ...preferences,
        report_settings: {
          ...defaultPreferences.report_settings,
          ...preferences.report_settings
        }
      };

      console.log('✅ Monthly report preferences loaded:', mergedPreferences);
      return mergedPreferences;
    } catch (error) {
      console.error('❌ Error in getPreferences:', error);
      // Return default preferences on error
      return {
        selected_metrics: ['weight', 'sleep', 'heartRate'],
        report_settings: {
          include_ai_insights: true,
          include_targets: true,
          include_charts: false
        },
        generated_reports: []
      };
    }
  }

  /**
   * Upload PDF file to Supabase storage
   * Path structure: {clientId}/reports/{month}_{YY}.pdf
   * Example: 34/reports/July_25.pdf
   */
  static async uploadPDF(
    clientId: string,
    month: string,
    pdfBlob: Blob,
    fileName: string
  ): Promise<string> {
    try {
      console.log('📤 Uploading PDF to Supabase storage:', { clientId, month, fileName });

      // Create file path
      const monthYear = this.formatMonthYear(month);
      const filePath = `${clientId}/reports/${monthYear}.pdf`;

      // Upload file to Supabase storage
      console.log('🔍 Uploading to path:', filePath);
      console.log('🔍 File size:', pdfBlob.size, 'bytes');
      
      const { data, error } = await supabase.storage
        .from('client')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error('❌ Error uploading PDF:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error,
          details: error.details
        });
        
        // If RLS error, provide specific guidance
        if (error.message.includes('row-level security policy')) {
          throw new Error(`Storage access denied. Please check RLS policies for the 'client' bucket. Error: ${error.message}`);
        }
        
        throw new Error(`Failed to upload PDF: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client')
        .getPublicUrl(filePath);

      console.log('✅ PDF uploaded successfully:', filePath);
      return filePath;
    } catch (error) {
      console.error('❌ Error in uploadPDF:', error);
      throw error;
    }
  }

  /**
   * Download PDF file from Supabase storage
   */
  static async downloadPDF(filePath: string): Promise<Blob> {
    try {
      console.log('📥 Downloading PDF from storage:', filePath);

      const { data, error } = await supabase.storage
        .from('client')
        .download(filePath);

      if (error) {
        console.error('❌ Error downloading PDF:', error);
        throw new Error(`Failed to download PDF: ${error.message}`);
      }

      console.log('✅ PDF downloaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Error in downloadPDF:', error);
      throw error;
    }
  }

  /**
   * Get public URL for PDF file
   */
  static getPDFUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('client')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Add generated report to preferences
   */
  static async addGeneratedReport(
    clientId: string,
    month: string,
    filePath: string,
    metricsCount: number,
    fileSize?: number
  ): Promise<void> {
    try {
      console.log('📝 Adding generated report to preferences:', { clientId, month, filePath });

      const preferences = await this.getPreferences(clientId);
      
      const newReport: GeneratedReport = {
        month,
        generated_at: new Date().toISOString(),
        file_path: filePath,
        metrics_count: metricsCount,
        file_size: fileSize
      };

      const updatedReports = [
        ...(preferences.generated_reports || []),
        newReport
      ];

      // Keep only last 12 reports
      const trimmedReports = updatedReports.slice(-12);

      await this.savePreferences(clientId, {
        last_generated_month: month,
        generated_reports: trimmedReports
      });

      console.log('✅ Generated report added to preferences');
    } catch (error) {
      console.error('❌ Error in addGeneratedReport:', error);
      throw error;
    }
  }

  /**
   * Get list of generated reports for a client
   */
  static async getGeneratedReports(clientId: string): Promise<GeneratedReport[]> {
    try {
      const preferences = await this.getPreferences(clientId);
      return preferences.generated_reports || [];
    } catch (error) {
      console.error('❌ Error in getGeneratedReports:', error);
      return [];
    }
  }

  /**
   * Delete PDF file from storage
   */
  static async deletePDF(filePath: string): Promise<void> {
    try {
      console.log('🗑️ Deleting PDF from storage:', filePath);

      const { error } = await supabase.storage
        .from('client')
        .remove([filePath]);

      if (error) {
        console.error('❌ Error deleting PDF:', error);
        throw new Error(`Failed to delete PDF: ${error.message}`);
      }

      console.log('✅ PDF deleted successfully');
    } catch (error) {
      console.error('❌ Error in deletePDF:', error);
      throw error;
    }
  }

  /**
   * Format month for file naming (e.g., "2025-08" -> "July_25")
   */
  private static formatMonthYear(month: string): string {
    try {
      // Handle date range format like "Jul 30 - Aug 29, 2025"
      if (month.includes(' - ')) {
        const parts = month.split(' - ');
        const endDate = parts[1]; // "Aug 29, 2025"
        const monthYear = endDate.split(', ')[0]; // "Aug 29"
        const year = endDate.split(', ')[1]; // "2025"
        
        // Parse the month name
        const monthDate = new Date(`${monthYear} ${year}`);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
        const yearShort = year.slice(-2);
        return `${monthName}_${yearShort}`;
      }
      
      // Handle standard month format like "2025-08"
      const date = new Date(month + '-01');
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${month}`);
      }
      
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear().toString().slice(-2);
      return `${monthName}_${year}`;
    } catch (error) {
      console.error('❌ Error formatting month year:', error);
      // Fallback to current date
      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      const year = now.getFullYear().toString().slice(-2);
      return `${monthName}_${year}`;
    }
  }

  /**
   * Convert PDF blob to base64 for storage (alternative method)
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 to blob
   */
  static async base64ToBlob(base64: string, contentType: string = 'application/pdf'): Promise<Blob> {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }
}
