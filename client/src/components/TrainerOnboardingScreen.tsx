// TrainerOnboardingScreen.tsx
// Adapted from the trainer onboarding package for web environment

import React, { useState, useEffect, useCallback } from 'react';
import { onboardingQuestions, getQuestionsBySection, getSections } from '../data/onboardingQuestions';
import { 
  getClientOnboardingData, 
  updateClientOnboardingData, 
  completeClientOnboarding,
  checkClientExists,
  createClientRecord
} from '../utils/supabaseClient';
import { supabase } from '../lib/supabase';
import { calculateAllTargets } from '../utils/targetCalculations';
import { 
  cleanDataForDatabase, 
  calculateCompletionPercentage, 
  validateFormData,
  debounce,
  convertUTCToLocal,
  generateDefaultFormData
} from '../utils/onboardingUtils';
import QuestionComponents from './QuestionComponents';
import '../styles/onboardingStyles.css';

interface TrainerOnboardingScreenProps {
  clientId: string;
  onComplete?: (data: any) => void;
  onSave?: (data: any) => void;
  onError?: (error: any) => void;
  showProgress?: boolean;
  autoSave?: boolean;
  saveInterval?: number;
}

const TrainerOnboardingScreen: React.FC<TrainerOnboardingScreenProps> = ({ 
  clientId, 
  onComplete, 
  onSave,
  onError,
  showProgress = true,
  autoSave = true,
  saveInterval = 2000
}) => {
  // State management
  const [formData, setFormData] = useState(generateDefaultFormData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeOnboarding();
  }, [clientId]);

  // Calculate completion percentage when form data changes
  useEffect(() => {
    const percentage = calculateCompletionPercentage(formData);
    setCompletionPercentage(percentage);
  }, [formData]);

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce(async (data: any) => {
      if (autoSave && clientId) {
        await saveProgress(data);
      }
    }, saveInterval),
    [clientId, autoSave, saveInterval]
  );

  useEffect(() => {
    if (autoSave && Object.keys(formData).length > 0) {
      debouncedSave(formData);
    }
  }, [formData, debouncedSave, autoSave]);

  // Initialize onboarding process
  const initializeOnboarding = async () => {
    try {
      setLoading(true);
      
      // Check if client exists
      const clientExists = await checkClientExists(clientId);
      
      if (!clientExists) {
        // Create new client record
        await createClientRecord(clientId);
      }
      
      // Load existing data
      const existingData = await getClientOnboardingData(clientId);
      
      // Load client table data for timezone and plan_start_day
      const { data: clientData } = await supabase
        .from('client')
        .select('timezone, plan_start_day')
        .eq('client_id', clientId)
        .single();
      
      if (existingData || clientData) {
        // Convert UTC times to local display format
        const convertedData = { ...existingData };
        const timeFields = ['wake_time', 'bed_time', 'bf_time', 'lunch_time', 'dinner_time', 'snack_time', 'workout_time'];
        
        timeFields.forEach(field => {
          if (convertedData[field]) {
            convertedData[field] = convertUTCToLocal(convertedData[field]);
          }
        });
        
        // Add client table data
        if (clientData) {
          convertedData.timezone = clientData.timezone;
          convertedData.plan_start_day = clientData.plan_start_day;
        }
        
        setFormData(convertedData);
      }
      
      // Initialize sections
      const allSections = getSections();
      setSections(allSections);
      
      // Expand first section by default
      if (allSections.length > 0) {
        setExpandedSections(new Set([allSections[0]]));
      }
      
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Save progress to database
  const saveProgress = async (data = formData) => {
    try {
      setSaving(true);
      
      const cleanedData = cleanDataForDatabase(data);
      await updateClientOnboardingData(clientId, cleanedData);
      
      // Save timezone and plan_start_day to client table
      if (data.timezone || data.plan_start_day) {
        const clientUpdateData: any = {};
        if (data.timezone) clientUpdateData.timezone = data.timezone;
        if (data.plan_start_day) clientUpdateData.plan_start_day = data.plan_start_day;
        
        const { error: clientError } = await supabase
          .from('client')
          .update(clientUpdateData)
          .eq('client_id', clientId);
        
        if (clientError) {
          console.error('Error updating client table:', clientError);
        }
      }
      
      if (onSave) {
        onSave(cleanedData);
      }
      
    } catch (error) {
      console.error('Error saving progress:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setSaving(false);
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // Validate form data
      const validation = validateFormData(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        alert('Please complete all required fields before submitting.');
        return;
      }
      
      // Clean data for database
      const cleanedData = cleanDataForDatabase(formData);
      
      // Calculate all targets
      await calculateAllTargets(clientId, cleanedData);
      
      // Complete onboarding
      await completeClientOnboarding(clientId, cleanedData);
      
      if (onComplete) {
        onComplete(cleanedData);
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // Expand all sections
  const expandAllSections = () => {
    setExpandedSections(new Set(sections));
  };

  // Collapse all sections
  const collapseAllSections = () => {
    setExpandedSections(new Set());
  };

  // Handle manual save
  const handleManualSave = async () => {
    await saveProgress();
  };

  // Check if a question is incomplete
  const isQuestionIncomplete = (question: any) => {
    if (!question.required) return false;
    
    const value = formData[question.field];
    if (value === undefined || value === null || value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  };

  // Check if a section has incomplete questions
  const hasIncompleteQuestions = (sectionName: string) => {
    const sectionQuestions = getQuestionsBySection(sectionName);
    return sectionQuestions.some(isQuestionIncomplete);
  };

  // Get filtered sections based on filter state
  const getFilteredSections = () => {
    if (!showOnlyIncomplete) return sections;
    return sections.filter(hasIncompleteQuestions);
  };

  // Auto-expand sections with incomplete questions when filter is active
  useEffect(() => {
    if (showOnlyIncomplete) {
      const sectionsWithIncomplete = sections.filter(hasIncompleteQuestions);
      setExpandedSections(new Set(sectionsWithIncomplete));
    }
  }, [showOnlyIncomplete, sections, formData]);

  if (loading) {
    return (
      <div className="onboarding-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      {/* Header */}
      <div className="onboarding-header">
        <div className="header-top">
          <h1>Client Onboarding</h1>
          {showOnlyIncomplete && (
            <div className="filter-indicator">
              <span className="filter-badge">Filtered: Incomplete Questions Only</span>
            </div>
          )}
        </div>
        {showProgress && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="progress-text">{completionPercentage}% Complete</span>
          </div>
        )}
        
        <div className="header-actions">
          <button 
            className={`btn ${showOnlyIncomplete ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
          >
            {showOnlyIncomplete ? 'Show All Questions' : 'Show Only Incomplete'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={expandAllSections}
          >
            Expand All
          </button>
          <button 
            className="btn btn-secondary"
            onClick={collapseAllSections}
          >
            Collapse All
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleManualSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="onboarding-content">
        {getFilteredSections().map(section => {
          const sectionQuestions = getQuestionsBySection(section);
          const isExpanded = expandedSections.has(section);
          const sectionProgress = calculateCompletionPercentage(
            Object.fromEntries(
              sectionQuestions.map(q => [q.field, formData[q.field]])
            )
          );
          
          // Filter questions within section if showing only incomplete
          const filteredQuestions = showOnlyIncomplete 
            ? sectionQuestions.filter(isQuestionIncomplete)
            : sectionQuestions;
          
          return (
            <div key={section} className="question-section">
              <div 
                className="section-header"
                onClick={() => toggleSection(section)}
              >
                <div className="section-title">
                  <span className="section-name">{section}</span>
                  <span className="section-progress">
                    {sectionProgress}% Complete
                  </span>
                  {showOnlyIncomplete && filteredQuestions.length > 0 && (
                    <span className="section-incomplete-count">
                      ({filteredQuestions.length} incomplete)
                    </span>
                  )}
                </div>
                <div className="section-toggle">
                  {isExpanded ? '−' : '+'}
                </div>
              </div>
              
              {isExpanded && (
                <div className="section-content">
                  {filteredQuestions.map(question => (
                    <div 
                      key={question.id} 
                      className="question-item"
                      id={`question-${question.id}`}
                    >
                      <QuestionComponents
                        question={question}
                        value={formData[question.field]}
                        error={errors[question.field]}
                        onChange={(value) => handleFieldChange(question.field, value)}
                        formData={formData}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="onboarding-footer">
        <div className="footer-info">
          <p>
            {completionPercentage === 100 
              ? 'All required fields completed! You can now submit the onboarding.'
              : `${100 - completionPercentage} required fields remaining.`
            }
          </p>
        </div>
        
        <div className="footer-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={handleComplete}
            disabled={completionPercentage < 100 || loading}
          >
            {loading ? 'Completing...' : 'Complete Onboarding'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="error-summary">
          <h3>Please fix the following errors:</h3>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <a 
                  href={`#question-${field}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`question-${field}`)?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                  }}
                >
                  {error}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrainerOnboardingScreen;
