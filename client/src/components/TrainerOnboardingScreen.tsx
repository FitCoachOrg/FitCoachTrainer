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
      
      if (existingData) {
        // Convert UTC times to local display format
        const convertedData = { ...existingData };
        const timeFields = ['wake_time', 'bed_time', 'bf_time', 'lunch_time', 'dinner_time', 'snack_time', 'workout_time'];
        
        timeFields.forEach(field => {
          if (convertedData[field]) {
            convertedData[field] = convertUTCToLocal(convertedData[field]);
          }
        });
        
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
        <h1>Client Onboarding</h1>
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
        {sections.map(section => {
          const sectionQuestions = getQuestionsBySection(section);
          const isExpanded = expandedSections.has(section);
          const sectionProgress = calculateCompletionPercentage(
            Object.fromEntries(
              sectionQuestions.map(q => [q.field, formData[q.field]])
            )
          );
          
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
                </div>
                <div className="section-toggle">
                  {isExpanded ? '−' : '+'}
                </div>
              </div>
              
              {isExpanded && (
                <div className="section-content">
                  {sectionQuestions.map(question => (
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
