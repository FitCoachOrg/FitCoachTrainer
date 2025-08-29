import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ToastAndroid,
  Image, // Added Image import
  findNodeHandle,
  Keyboard,
  AccessibilityInfo,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  getClientOnboardingData, 
  updateClientOnboardingData, 
  completeClientOnboarding,
  testClientTableSchema,
  convertStepProgressToSections,
  getTrainerByClientEmail,
  fetchTrainerById,
  supabase,
} from '../utils/supabaseRest';
import { RNStorage } from '../storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { getProfileImage } from '../utils/imageUtils';
import { uploadToSupabaseS3 } from '../utils/s3Upload';
import { SUPABASE_BASE_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { localTimeToUTC, getTimezoneName, getTimezoneOffset, utcTimeToLocal } from '../utils/timezoneUtils';
import { useTheme } from '../contexts/ThemeContext';
// REMOVE the questions array from here and import it from './onboardingQuestions.js'
import { onboardingQuestions } from './onboardingQuestions';
import { calculateAndStoreBMR, calculateAndStoreHydrationTarget, calculateAndStoreCalorieTarget, calculateAndStoreMacroTargets, calculateAndStoreWorkoutTarget } from '../utils/targetCalculations';
import { calculateAndStoreBMI } from '../utils/calculateAndStoreBMI';
// import OnboardingResultsModal from './OnboardingResultsModal';
import OnboardingAssistantBot from './OnboardingAssistantBot';


import { buildOnboardingContext } from '../utils/onboardingAssistantContext';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

/**
 * Personalized Client Onboarding Screen
 * A coach-guided onboarding experience with grouped questions and modal presentation
 * 
 * Props:
 * - navigation: React Navigation object (can be null)
 * - onComplete: Function called when onboarding is fully completed
 * - onExit: Function called when user wants to save and exit temporarily
 * - isReviewMode: Boolean indicating if this is review mode (optional)
 * - clientId: Client ID for database operations (optional, falls back to RNStorage)
 */
const PersonalizedOnboardingScreen = ({ navigation, onComplete, onExit, isReviewMode = false, clientId: propClientId, route }) => {
  // Add null check for route
  const params = route?.params || {};
  const actualClientId = propClientId || params.clientId || RNStorage.clientId;
  const providedTheme = useTheme();
  
  // Get theme for consistent styling with fallback
  const { defaultTheme } = require('../contexts/theme');
  const actualTheme = providedTheme || defaultTheme;

  // Extract section selector return flag from params
  const returnToSectionSelection = params.returnToSectionSelection || false;
  // Extract reset to start flag
  const resetToStart = params.resetToStart || false;
  
  // Get params from navigation if available
  const navigationClientId = params.clientId;
  const navigationIsReviewMode = params.isReviewMode;
  
  // Use navigation params or props, with fallbacks
  const actualIsReviewMode = navigationIsReviewMode !== undefined ? navigationIsReviewMode : isReviewMode;
  
  // Initialize PersonalizedOnboardingScreen
  if (__DEV__) {
    console.log('PersonalizedOnboardingScreen initialized with clientId:', actualClientId);
  }

  // Current question in onboarding process
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shakeXAnim = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const successPulseAnim = useRef(new Animated.Value(0)).current;
  
  // State for profile picture
  const [profilePictureUri, setProfilePictureUri] = useState(null);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  
  // State for time picker
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerField, setTimePickerField] = useState('');
  
  // Local state for time inputs to prevent re-render loops
  const [localTimeInputs, setLocalTimeInputs] = useState({});

  // Progress state
  const [progress, setProgress] = useState({
    currentQuestion: 0,
    totalQuestions: 41, // Updated to account for new questions (33 original + 8 new)
    completedQuestions: [],
    skippedQuestions: []
  });

  // const [showResultsModal, setShowResultsModal] = useState(false);

  // Toasts disabled globally per requirement
  const showToast = (_message) => {};

  // Get professional themed icon for each question
  const getQuestionIcon = (field, type) => {
    const iconProps = {
      size: 48,
      color: actualTheme.colors.primary,
      style: { marginBottom: 16 }
    };

    // Map question fields to professional icons
    const iconMap = {
      // Personal Information
      'age': 'calendar-days',
      'height': 'ruler-vertical', 
      'weight': 'weight-scale',
      'biological_sex': 'person',
      'profile_picture_url': 'camera',
      'activity_level': 'chart-line',
      'body_measurements': 'ruler-combined',

      // Fitness Goals
      'primary_fitness_goal': 'bullseye',
      'specific_outcome': 'trophy',
      'goal_timeline': 'clock',
      'focus_areas': 'crosshairs',
      'confidence_level': 'chart-simple',
      'motivation_style': 'heart',

      // Training
      'training_experience': 'dumbbell',
      'previous_training': 'graduation-cap',
      'training_days_per_week': 'calendar-week',
      'training_time_per_session': 'hourglass-end', // Updated to more professional icon for session duration
      'training_location': 'location-dot',
      'available_equipment': 'hammer',
      'injuries_limitations': 'shield-heart',
      'obstacles': 'mountain',
      'workout_time': 'clock',
      'workout_days': 'calendar-check',

      // Nutrition & Timing
      'eating_habits': 'utensils',
      'diet_preferences': 'leaf',
      'food_allergies': 'triangle-exclamation',
      'preferred_meals_per_day': 'plate-wheat',
      'gastric_issues': 'stomach',
      'supplements': 'pills',
      'bf_time': 'sun',
      'lunch_time': 'utensils', // Updated to more professional lunch icon
      'dinner_time': 'moon',
      'snack_time': 'cookie',

      // Sleep & Wellness
      'sleep_hours': 'bed',
      'stress': 'brain',
      'wake_time': 'sun', // Updated for wake time question
      'bed_time': 'moon'
    };

    // Special handling for section types
    if (type === 'section_intro') {
      // For section_intro, we need to get the icon from the question object
      // This will be handled in renderContent by passing the question object
      return null; // These are handled separately in renderQuestionInput
    }
    
    if (type === 'section_complete') {
      return null; // These already have emojis
    }

    if (type === 'final_completion') {
      return <Icon name="star" {...iconProps} />;
    }

    const iconName = iconMap[field] || 'circle-question';
    return <Icon name={iconName} {...iconProps} />;
  };

  // Separate function to fetch profile picture
  const fetchProfilePicture = async () => {
    const clientId = actualClientId || RNStorage.clientId;
    if (clientId) {
      // Try both .jpg and .jpeg extensions
      const extensions = ['jpg', 'jpeg'];
      
      for (const ext of extensions) {
        const fileName = `${clientId}.${ext}`;
        const imageUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/client-images/${fileName}`;
        // Check if the image exists by trying to fetch its HEAD
        try {
          const headRes = await fetch(imageUrl, { method: 'HEAD' });
          if (headRes.ok) {
            // Add cache-busting timestamp to ensure fresh image
            const timestamp = Date.now();
            const refreshedUrl = `${imageUrl}?t=${timestamp}`;
            setProfilePictureUri(refreshedUrl);
            // Also update clientData to keep it in sync
            setClientData(prev => ({ ...prev, profile_picture_url: refreshedUrl }));
            console.log('[PersonalizedOnboardingScreen] Found profile image:', refreshedUrl);
            return; // Found image, exit function
          }
        } catch (err) {
          console.log(`[PersonalizedOnboardingScreen] Error checking ${ext} image:`, err);
        }
      }
      
      // If no image found with either extension
      setProfilePictureUri(null);
      console.log('[PersonalizedOnboardingScreen] No profile image found with .jpg or .jpeg extension, using placeholder icon.');
    } else {
      setProfilePictureUri(null);
    }
  };

  // Refresh profile picture when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[PersonalizedOnboardingScreen] Screen focused, refreshing profile picture...');
      fetchProfilePicture();
    }, [actualClientId])
  );

  // Client data collected during onboarding
  const [clientData, setClientData] = useState({
    // Personal Information
    age: '',
    height_ft: '', // New field for feet
    height_in: '', // New field for inches
    weight: '',
    biological_sex: '',
    activity_level: '',
    profile_picture_url: '', // Add profile picture URL
    
    // Body Measurements
    hip: '',
    waist: '',
    thigh: '',
    bicep: '',
    
    // Fitness Goals
    primary_fitness_goal: '',
    specific_outcome: '',
    goal_timeline: '',
    focus_areas: [],
    confidence_level: 5,
    motivation_style: '',
    
    // Training
    training_experience: '',
    previous_training: '',
    training_days_per_week: 3,
    training_time_per_session: '',
    training_location: '',
    available_equipment: [],
    injuries_limitations: '',
    obstacles: '',
    
    // Nutrition
    eating_habits: '',
    diet_preferences: [],
    food_allergies: '',
    preferred_meals_per_day: 3,
    gastric_issues: '',
    supplements: '',
    
    // General
    sleep_hours: 7,
    stress: '',
    wake_time: '06:00',
    bed_time: '21:00',
    bf_time: '08:00',
    lunch_time: '13:00',
    dinner_time: '19:00',
    snack_time: '16:00',
    workout_time: '',
    workout_days: []
    // Removed timezone fields - will use dynamic detection
  });

  // Accessibility: Reduce Motion detector
  const useReduceMotion = () => {
    const [reduce, setReduce] = useState(false);
    useEffect(() => {
      AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
      const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
      return () => sub?.remove?.();
    }, []);
    return reduce;
  };
  const reduceMotion = useReduceMotion();

  const clampDur = (ms, kind) => {
    if (reduceMotion) return Math.max(120, Math.floor((ms || 300) * 0.7));
    if (kind === 'enter') return Math.min(450, Math.max(250, ms || 300));
    if (kind === 'exit') return Math.min(300, Math.max(200, ms || 220));
    return ms || 300;
  };

  // Haptic helper (best-effort; optional)
  const triggerHaptic = (kind) => {
    try {
      const H = require('react-native-haptic-feedback');
      const map = {
        light: 'impactLight',
        success: 'notificationSuccess',
        warning: 'notificationWarning',
        error: 'notificationError',
      };
      H?.trigger?.(map[kind] || 'impactLight', { enableVibrateFallback: true });
      return;
    } catch (_) {}
    try {
      const EH = require('expo-haptics');
      if (kind === 'light') {
        EH?.impactAsync?.(EH.ImpactFeedbackStyle?.Light ?? 1);
      } else if (kind === 'success') {
        EH?.notificationAsync?.(EH.NotificationFeedbackType?.Success);
      } else if (kind === 'warning') {
        EH?.notificationAsync?.(EH.NotificationFeedbackType?.Warning);
      } else if (kind === 'error') {
        EH?.notificationAsync?.(EH.NotificationFeedbackType?.Error);
      }
    } catch (_) {}
  };

  // Tokenized enter animation per question type
  const runEnterAnimation = (q) => {
    // reset base
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    slideXAnim.setValue(0);
    const type = q?.type;
    let token = 'fadeUp';
    if (type === 'picker') token = 'slideL';
    if (type === 'select' || type === 'multi_select') token = 'fadeUp';
    if (type === 'section_intro' || type === 'section_complete' || type === 'final_completion') token = 'fadeUp';
    const dur = clampDur(type === 'section_intro' || type === 'section_complete' || type === 'final_completion' ? 350 : 300, 'enter');
    const anims = [];
    if (reduceMotion) {
      anims.push(Animated.timing(fadeAnim, { toValue: 1, duration: dur, useNativeDriver: true }));
    } else if (token === 'fadeUp') {
      anims.push(Animated.timing(fadeAnim, { toValue: 1, duration: dur, useNativeDriver: true }));
      anims.push(Animated.timing(slideAnim, { toValue: 0, duration: dur, useNativeDriver: true }));
    } else if (token === 'slideL') {
      fadeAnim.setValue(1);
      slideXAnim.setValue(24);
      anims.push(Animated.timing(slideXAnim, { toValue: 0, duration: dur, useNativeDriver: true }));
    }
    Animated.parallel(anims).start();
  };

  // Tokenized exit animation (used on manual back/forward if we want later)
  const runExitAnimation = (q) => new Promise((resolve) => {
    const dur = clampDur(220, 'exit');
    const token = 'fadeOut';
    const anims = [];
    if (reduceMotion || token === 'fadeOut') {
      anims.push(Animated.timing(fadeAnim, { toValue: 0, duration: dur, useNativeDriver: true }));
    }
    Animated.parallel(anims).start(() => resolve());
  });

  // Animation for question transitions using tokens
  useEffect(() => {
    runEnterAnimation(filteredQuestions?.[currentQuestionIndex]);
  }, [currentQuestionIndex]);

  // Section completion and intro animation - ONLY for section_complete, NOT section_intro
  useEffect(() => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.type === 'section_complete') {
      // Reset animation values
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      
      // Start scale and bounce animation with a slight delay
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 150,
            friction: 5,
            useNativeDriver: true,
          })
        ]).start();
      }, 300); // Slight delay for better UX
    }
  }, [currentQuestionIndex, filteredQuestions]);

  // Load any existing onboarding progress when component mounts or section changes
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      try {
        // Get client ID from props, params, or storage
        const clientId = actualClientId || RNStorage.clientId;
        console.log('[PersonalizedOnboardingScreen] Loading progress for client:', clientId);
        
        if (!clientId) {
          console.error('[PersonalizedOnboardingScreen] No client ID available');
          setIsLoading(false);
          return;
        }
        
        // Fetch onboarding data from Supabase
        const data = await getClientOnboardingData(clientId);
        console.log('[PersonalizedOnboardingScreen] Onboarding data:', data);
        
        if (!data) {
          console.error('[PersonalizedOnboardingScreen] No onboarding data found, using defaults');
          // For new users, ensure defaults are set and save to database
          const defaultData = {
            // Personal Information
            age: '',
            height_ft: '',
            height_in: '',
            weight: '',
            biological_sex: '',
            activity_level: '',
            profile_picture_url: '',
            
            // Body Measurements
            hip: '',
            waist: '',
            thigh: '',
            bicep: '',
            
            // Fitness Goals
            primary_fitness_goal: '',
            specific_outcome: '',
            goal_timeline: '',
            focus_areas: [],
            confidence_level: 5,
            motivation_style: '',
            
            // Training
            training_experience: '',
            previous_training: '',
            training_days_per_week: 3,
            training_time_per_session: '',
            training_location: '',
            available_equipment: [],
            injuries_limitations: '',
            obstacles: '',
            
            // Nutrition
            eating_habits: '',
            diet_preferences: [],
            food_allergies: '',
            preferred_meals_per_day: 3,
            gastric_issues: '',
            supplements: '',
            
            // General with default times
            sleep_hours: 7,
            stress: '',
            wake_time: '07:00',
            bed_time: '23:00',
            bf_time: '08:00',
            lunch_time: '13:00',
            dinner_time: '19:00',
            snack_time: '16:00',
            workout_time: '',
            workout_days: []
          };
          
          // Save default data to database immediately
          try {
            console.log('[PersonalizedOnboardingScreen] Saving default data to database:', defaultData);
            await updateClientOnboardingData(clientId, defaultData);
            console.log('[PersonalizedOnboardingScreen] Default data saved to database successfully');
          } catch (error) {
            console.error('[PersonalizedOnboardingScreen] Error saving default data:', error);
          }
          
          setClientData(defaultData);
          setIsLoading(false);
          return;
        }
        
        // Initialize client data from database with defaults for time fields
        const dataWithDefaults = {
          ...data,
          // Preserve defaults for time fields if not set in database
          wake_time: data.wake_time || '07:00',
          bed_time: data.bed_time || '23:00',
          bf_time: data.bf_time || '08:00',
          lunch_time: data.lunch_time || '13:00',
          dinner_time: data.dinner_time || '19:00',
          snack_time: data.snack_time || '16:00',
          workout_time: data.workout_time || '',
        };
        setClientData(dataWithDefaults);
        
        // Get onboarding progress from data
        const progressData = data.onboarding_progress || {};
        
        // If resetToStart flag is true, start from the beginning regardless of saved progress
        if (resetToStart) {
          setCurrentQuestionIndex(0);
          console.log('[PersonalizedOnboardingScreen] Reset to start requested, starting from question 0');
        } else {
          // Otherwise use saved progress
          const currentQuestion = sectionParam ? 0 : (progressData.currentQuestion || 0);
          setCurrentQuestionIndex(currentQuestion);
          console.log('[PersonalizedOnboardingScreen] Starting from question:', currentQuestion);
        }
        
        // Set progress state
        setProgress({
          currentQuestion: progressData.currentQuestion || 0,
          totalQuestions: progressData.totalQuestions || onboardingQuestions.length,
          completedQuestions: progressData.completedQuestions || [],
          skippedQuestions: progressData.skippedQuestions || []
        });
        
        // Test database schema first
        const schemaTest = await testClientTableSchema(clientId);
        console.log('Database schema test result:', schemaTest);
        
        if (!schemaTest.success) {
          console.error('Database schema test failed:', schemaTest.error);
        }
        
        // Populate client data from database with reverse mapping to handle database field names
        const newClientData = { ...clientData };
        // Reverse mapping for database fields to clientData keys
        const reverseFieldMappings = {
          'cl_age': 'age',
          'cl_height': 'height',
          'cl_weight': 'weight',
          'cl_sex': 'biological_sex',
          'cl_activity_level': 'activity_level',
          'cl_primary_goal': 'primary_fitness_goal',
          'specific_outcome': 'specific_outcome',
          'goal_timeline': 'goal_timeline',
          'motivation_style': 'motivation_style',
          'training_experience': 'training_experience',
          'previous_training': 'previous_training',
          'training_time_per_session': 'training_time_per_session',
          'training_location': 'training_location',
          'injuries_limitations': 'injuries_limitations',
          'obstacles': 'obstacles',
          'eating_habits': 'eating_habits',
          'food_allergies': 'food_allergies',
          'cl_gastric_issues': 'gastric_issues',
          'cl_supplements': 'supplements',
          'cl_stress': 'stress',
          'confidence_level': 'confidence_level',
          'training_days_per_week': 'training_days_per_week',
          'preferred_meals_per_day': 'preferred_meals_per_day',
          'sleep_hours': 'sleep_hours',
          'focus_areas': 'focus_areas',
          'available_equipment': 'available_equipment',
          'diet_preferences': 'diet_preferences',
          'wake_time': 'wake_time',
          'bed_time': 'bed_time',
          'bf_time': 'bf_time',
          'lunch_time': 'lunch_time',
          'dinner_time': 'dinner_time',
          'snack_time': 'snack_time',
          'workout_time': 'workout_time',
          'workout_days': 'workout_days',
          'timezone_name': 'timezone_name',
          'timezone_offset': 'timezone_offset',
          // Body measurement fields
          'hip': 'hip',
          'waist': 'waist',
          // Backward compatibility: some DBs may still have old column name
          'waste': 'waist',
          'thigh': 'thigh',
          'bicep': 'bicep'
          // Removed profile_picture_url - not stored in database, uses naming convention
        };
        
        // Helper to convert HH:mm:ss to h:mm AM/PM for display in pickers
        const formatTimeForPicker = (time24hr) => {
          if (!time24hr) return '';
          try {
            console.log('[formatTimeForPicker] Input time:', time24hr);
            const [hoursStr, minutesStr] = time24hr.split(':');
            let hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);

            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours === 0 ? 12 : hours; // the hour '0' should be '12'

            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

            const result = `${hours}:${formattedMinutes} ${ampm}`;
            console.log('[formatTimeForPicker] Output time:', result);
            return result;
          } catch (e) {
            console.error('Error formatting time for picker:', time24hr, e);
            return time24hr; // Return original if error
          }
        };

        Object.keys(data).forEach(dbKey => {
          const clientKey = reverseFieldMappings[dbKey] || dbKey;

          // Special handling for cl_height as it maps to two fields (height_ft, height_in)
          if (dbKey === 'cl_height') {
            const totalCm = parseFloat(data[dbKey]);
            if (!isNaN(totalCm)) {
              const totalInches = totalCm * 0.393701; // 1 cm = 0.393701 inches
              const feet = Math.floor(totalInches / 12);
              const inches = Math.round(totalInches % 12);
              newClientData.height_ft = feet;
              newClientData.height_in = inches;
              console.log(`Converted ${totalCm} cm to ${feet} ft ${inches} in for load.`);
            } else {
              newClientData.height_ft = '';
              newClientData.height_in = '';
              console.log(`cl_height was not a valid number (${data[dbKey]}) during load. Setting height_ft and height_in to empty.`);
            }
          } else if (['workout_time', 'wake_time', 'bed_time', 'bf_time', 'lunch_time', 'dinner_time', 'snack_time'].includes(clientKey)) {
            // Handle time fields by converting UTC to local time and formatting for picker
            if (data[dbKey]) {
              const today = new Date().toISOString().split('T')[0];
              const formattedTime = convertUTCToLocalForDisplay(data[dbKey], today);
              newClientData[clientKey] = formattedTime;
              console.log(`[loadProgress] ✅ Set ${clientKey} (from ${dbKey}): "${data[dbKey]}" (UTC) -> "${formattedTime}" (display)`);
            } else {
              console.log(`[loadProgress] ⚠️ No data found for ${clientKey} (from ${dbKey})`);
            }
          } else if (clientKey in newClientData && data[dbKey] !== null && data[dbKey] !== undefined) {
            // Handle array fields if they come as PostgreSQL array format
            if (['focus_areas', 'available_equipment', 'diet_preferences', 'workout_days'].includes(clientKey) && typeof data[dbKey] === 'string') {
              // Convert {value1,value2} to ['value1', 'value2']
              if (data[dbKey].startsWith('{') && data[dbKey].endsWith('}')) {
                const arrayStr = data[dbKey].slice(1, -1);
                newClientData[clientKey] = arrayStr ? arrayStr.split(',') : [];
                console.log(`Converted PostgreSQL array for ${clientKey}:`, newClientData[clientKey]);
              } else {
                newClientData[clientKey] = data[dbKey].split(',');
                console.log(`Converted string to array for ${clientKey}:`, newClientData[clientKey]);
              }
            } else {
              newClientData[clientKey] = data[dbKey];
            }
            console.log(`Setting ${clientKey} (from ${dbKey}) to:`, data[dbKey]);
          } else if (!(clientKey in newClientData)) {
            console.log(`Ignoring database field ${dbKey} - no matching clientData key`);
          } else {
            console.log(`No data found for ${clientKey} (from ${dbKey})`);
          }
        });
        
        console.log('Setting client data - before update:', newClientData);
        // Force a new object reference to ensure UI updates
        setClientData({ ...newClientData });
        console.log('[loadProgress] Client data after update (state):', newClientData);
        // console.log('[loadProgress] Specifically workout_time in clientData (state):', clientData.workout_time); // Removed to avoid confusion

        // Initialize profilePictureUri from loaded data
        if (newClientData.profile_picture_url) {
          setProfilePictureUri(newClientData.profile_picture_url);
        }

        // Fetch profile picture using separate function (will also be refreshed by useFocusEffect)
        await fetchProfilePicture();
      } catch (error) {
        console.error('[PersonalizedOnboardingScreen] Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgress();
  }, [actualClientId, sectionParam, resetToStart]);

  // Keyboard event listeners for optimal scroll positioning
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Enrich clientData with trainer_name if available via trainer_client_web by email
  useEffect(() => {
    const hydrateTrainer = async () => {
      try {
        const email = clientData?.cl_email;
        if (!email) return;
        const row = await getTrainerByClientEmail(email);
        if (row?.trainer_name && !clientData?.trainer_name) {
          setClientData(prev => ({ ...prev, trainer_name: row.trainer_name }));
        }
        if (row?.trainer_id) {
          try {
            const bucket = 'trainer-bucket';
            const prefix = `h8eltu_1/${row.trainer_id}`;
            const candidates = [`${prefix}.jpeg`, `${prefix}.jpg`, `${prefix}.png`];
            let avatarUrl = null;
            for (const key of candidates) {
              // Public URL first
              const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
              const url = pub?.publicUrl;
              if (url) {
                try { if (await Image.prefetch(url)) { avatarUrl = url; break; } } catch (_) {}
              }
              // Signed URL fallback
              try {
                const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(key, 3600);
                const sUrl = signed?.signedUrl;
                if (sUrl) {
                  try { if (await Image.prefetch(sUrl)) { avatarUrl = sUrl; break; } } catch (_) {}
                }
              } catch (_) {}
            }
            if (avatarUrl) {
              setTrainerAvatarUri(avatarUrl);
            }
          } catch (_) {}
        }
      } catch (e) {
        // silent fail
      }
    };
    hydrateTrainer();
  }, [clientData?.cl_email]);

  // Confetti animations removed per user request

  const computeTitleTips = (section) => {
    if (section === 'Fitness Goals') return ['Locked. I\'ll bias training & nutrition to this.', 'Love it—timeline noted. We\'ll back-plan weeks.'];
    if (section === 'Training') return ['Perfect—this sets volume & rest.', 'Home setup? I\'ll program with your equipment.'];
    if (section === 'Nutrition') return ['Got it. I\'ll tune calories & protein targets.', 'Allergies saved—I\'ll avoid those by default.'];
    if (section === 'Timing') return ['Schedule locked. We\'ll anchor habits to it.', 'Consistent workout slots = faster results.'];
    if (section === 'Wellness') return ['Thanks for being honest—this shapes recovery.', 'Sleep & stress noted—we\'ll build sustainably.'];
    return ['Need Help? Click on your Coach Bot', 'Small steps → big momentum.'];
  };

  const animateTitleTip = () => {
    // Disabled rotation/scale animation per requirement
    titleTipScale.setValue(1);
    titleTipRotate.setValue(0);
  };

  useEffect(() => {
    const q = filteredQuestions?.[currentQuestionIndex];
    const section = q?.section || '';
    const tips = computeTitleTips(section);
    titleTipIndexRef.current = 0;
    setTitleTipText(tips[0] || '');
    animateTitleTip();
    if (titleTipTimerRef.current) clearInterval(titleTipTimerRef.current);
    // Timer disabled to prevent tilt/move updates
    return () => {
      if (titleTipTimerRef.current) clearInterval(titleTipTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  // Assistant bot ref (Phase 2 hooks)
  const botRef = useRef(null);
  const [trainerAvatarUri, setTrainerAvatarUri] = useState(null);

  // Bottom-of-screen toast after Continue
  // Removed bottom-of-screen toast (replaced by coach tip bubble)

  // Milestone banner (huge toast) for 25/50/75%
  const [milestoneVisible, setMilestoneVisible] = useState(false);
  const [milestoneText, setMilestoneText] = useState('');
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const milestoneTimerRef = useRef(null);



  // Animated title tip bubble (rotating)
  const [titleTipText, setTitleTipText] = useState('');
  const titleTipTimerRef = useRef(null);
  const titleTipIndexRef = useRef(0);
  const titleTipScale = useRef(new Animated.Value(1)).current;
  const titleTipRotate = useRef(new Animated.Value(0)).current;


  
  // Save & Exit confirmation modal
  const [showSaveExitConfirmation, setShowSaveExitConfirmation] = useState(false);


  // Clean data for database storage with proper field mapping
  const cleanDataForDatabase = (data) => {
    if (__DEV__) {
      console.log('=== CLEAN DATA FOR DATABASE START ===');
      console.log('Input data keys:', Object.keys(data));
      // Avoid large JSON.stringify that causes formatValueCalls limit
      console.log('Input data fields count:', Object.keys(data).length);
    }
    
    const cleaned = {};
    
    // Handle numeric fields with proper database column mapping
    const numericFields = {
      'age': 'cl_age',
      'weight': 'cl_weight',
      'waist': 'waist',
      'hip': 'hip',
      'thigh': 'thigh',
      'bicep': 'bicep'
    };
    
    Object.keys(numericFields).forEach(field => {
      const dbField = numericFields[field];
      if (data[field] && !isNaN(data[field])) {
        const numValue = field === 'age' || field === 'training_days_per_week' || field === 'preferred_meals_per_day' || field === 'confidence_level' 
          ? parseInt(data[field]) 
          : parseFloat(data[field]);
        if (__DEV__) console.log(`Mapping ${field} -> ${dbField}: ${data[field]} -> ${numValue}`);
        cleaned[dbField] = numValue;
      } else if (data[field]) {
        console.warn(`Invalid numeric value for ${field}:`, data[field]);
      }
    });
    
    // Handle height conversion from ft/in to cm
    if (data.height_ft !== undefined && data.height_in !== undefined) {
      const totalInches = (parseInt(data.height_ft) * 12) + parseInt(data.height_in);
      const totalCm = totalInches * 2.54; // 1 inch = 2.54 cm
      cleaned.cl_height = parseInt(totalCm.toFixed(0)); // Round to nearest whole number and convert to integer
      if (__DEV__) console.log(`Mapped height_ft/in -> cl_height: ${data.height_ft}ft ${data.height_in}in -> ${cleaned.cl_height}cm`);
    }

    // Handle other numeric fields without cl_ prefix
    const otherNumericFields = ['confidence_level', 'training_days_per_week', 'preferred_meals_per_day', 'sleep_hours'];
    otherNumericFields.forEach(field => {
      if (data[field] && !isNaN(data[field])) {
        const numValue = parseInt(data[field]);
        if (__DEV__) console.log(`Mapping ${field}: ${data[field]} -> ${numValue}`);
        cleaned[field] = numValue;
      }
    });
    
    // Handle timezone fields (optional - may not exist in database yet)
    if (data.timezone_name) {
      cleaned.timezone_name = data.timezone_name;
      console.log(`[cleanDataForDatabase] Setting timezone_name: ${data.timezone_name}`);
    }
    if (data.timezone_offset !== undefined) {
      cleaned.timezone_offset = data.timezone_offset;
      console.log(`[cleanDataForDatabase] Setting timezone_offset: ${data.timezone_offset}`);
    }
    
    // Handle time fields with UTC conversion using dynamic timezone detection
    const timeFields = ['wake_time', 'bed_time', 'bf_time', 'lunch_time', 'dinner_time', 'snack_time', 'workout_time'];
    if (__DEV__) console.log('[cleanDataForDatabase] Processing time fields:', timeFields);
    timeFields.forEach(field => {
      if (__DEV__) console.log(`[cleanDataForDatabase] Processing time field ${field}: "${data[field]}" (type: ${typeof data[field]})`);
      if (data[field] && typeof data[field] === 'string' && data[field].trim() !== '') {
        let timeToConvert = data[field];
        
        // Check if it's 12-hour format (e.g., "6:30 PM")
        const time12HourRegex = /^([0-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
        const time24HourRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        
        if (time12HourRegex.test(data[field])) {
          // Convert 12-hour format to 24-hour format
          const match = data[field].match(time12HourRegex);
          let hours = parseInt(match[1], 10);
          const minutes = match[2];
          const ampm = match[3].toUpperCase();
          
          if (ampm === 'PM' && hours !== 12) {
            hours += 12;
          } else if (ampm === 'AM' && hours === 12) {
            hours = 0;
          }
          
          timeToConvert = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
          if (__DEV__) console.log(`[cleanDataForDatabase] Converted ${field} to 24-hour format`);
        } else if (time24HourRegex.test(data[field])) {
          // Already in 24-hour format, ensure it has seconds
          if (!data[field].includes(':')) {
            timeToConvert = `${data[field]}:00`;
          }
          if (__DEV__) console.log(`[cleanDataForDatabase] ${field} already in 24-hour format`);
        } else {
          console.warn(`[cleanDataForDatabase] Invalid time format for ${field}: "${data[field]}", skipping field`);
          return; // Skip this field
        }
        
        try {
          // Convert local time to UTC for database storage using current timezone
          // Use today's date as reference for the conversion
          const today = new Date().toISOString().split('T')[0];
          if (__DEV__) console.log(`[cleanDataForDatabase] Converting ${field} to UTC`);
          const utcTime = localTimeToUTC(timeToConvert, today);
          
          // Only save if conversion was successful
          if (utcTime) {
            cleaned[field] = utcTime;
            if (__DEV__) console.log(`[cleanDataForDatabase] ✅ Successfully converted ${field} to UTC`);
          } else {
            console.warn(`[cleanDataForDatabase] ❌ UTC conversion failed for ${field}: "${data[field]}", skipping field`);
          }
        } catch (error) {
          console.error(`[cleanDataForDatabase] ❌ Error converting time field ${field}:`, error);
          // Skip this field if conversion fails
          if (__DEV__) console.log(`[cleanDataForDatabase] Skipping ${field} due to conversion error`);
        }
      } else if (data[field]) {
        if (__DEV__) console.log(`[cleanDataForDatabase] Skipping ${field} - invalid type or empty`);
      } else {
        if (__DEV__) console.log(`[cleanDataForDatabase] No value for time field: ${field}`);
      }
    });
    
    // Handle string fields with database column mapping (excluding time fields)
    const fieldMappings = {
      'biological_sex': 'cl_sex',
      'activity_level': 'cl_activity_level', 
      'primary_fitness_goal': 'cl_primary_goal',
      'specific_outcome': 'specific_outcome',
      'goal_timeline': 'goal_timeline',
      'motivation_style': 'motivation_style',
      'training_experience': 'training_experience',
      'previous_training': 'previous_training',
      'training_time_per_session': 'training_time_per_session',
      'training_location': 'training_location',
      'injuries_limitations': 'injuries_limitations',
      'obstacles': 'obstacles',
      'eating_habits': 'eating_habits',
      'food_allergies': 'food_allergies',
      'gastric_issues': 'cl_gastric_issues',
      'supplements': 'cl_supplements',
      'stress': 'cl_stress',
      'confidence_level': 'confidence_level',
      'training_days_per_week': 'training_days_per_week',
      'preferred_meals_per_day': 'preferred_meals_per_day',
      'sleep_hours': 'sleep_hours',
      'focus_areas': 'focus_areas',
      'available_equipment': 'available_equipment',
      'diet_preferences': 'diet_preferences',
      'workout_days': 'workout_days',
      // Body measurement fields
      'hip': 'hip',
      'waist': 'waist',
      'thigh': 'thigh',
      'bicep': 'bicep'
      // Time fields are handled separately above
    };
    
    Object.keys(fieldMappings).forEach(field => {
      const dbField = fieldMappings[field];
      if (data[field] && typeof data[field] === 'string') {
        cleaned[dbField] = data[field];
        console.log(`[cleanDataForDatabase] Mapped string field: ${field} -> ${dbField} = "${data[field]}"`);
      } else if (data[field]) {
        console.log(`[cleanDataForDatabase] Skipping non-string field: ${field} (value: ${data[field]}, type: ${typeof data[field]})`);
      }
    });

    // Handle numeric picker fields with database column mapping
    const numericPickerFields = {
      'training_days_per_week': 'training_days_per_week',
      'preferred_meals_per_day': 'preferred_meals_per_day',
      'confidence_level': 'confidence_level',
      'sleep_hours': 'sleep_hours',
      // Body measurement fields (numeric)
      'hip': 'hip',
      'waist': 'waist',
      'thigh': 'thigh',
      'bicep': 'bicep'
    };
    
    Object.keys(numericPickerFields).forEach(field => {
      const dbField = numericPickerFields[field];
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const numValue = Number(data[field]);
        if (!isNaN(numValue)) {
          cleaned[dbField] = numValue;
          console.log(`Mapped numeric picker field: ${field} -> ${dbField} = ${numValue}`);
        }
      }
    });

    // Handle multi-select array fields with database column mapping
    const arrayFields = {
      'focus_areas': 'focus_areas',
      'available_equipment': 'available_equipment',
      'diet_preferences': 'diet_preferences',
      'workout_days': 'workout_days'
    };
    
    Object.keys(arrayFields).forEach(field => {
      const dbField = arrayFields[field];
      if (data[field] && Array.isArray(data[field]) && data[field].length > 0) {
        // Convert JavaScript array to PostgreSQL array format
        // ["lower_body","core"] becomes {lower_body,core}
        const pgArray = `{${data[field].join(',')}}`;
        cleaned[dbField] = pgArray;
        console.log(`Mapped array field: ${field} -> ${dbField} = ${pgArray}`);
      }
    });
    
    // Handle onboarding_progress specially
    if (data.onboarding_progress) {
              if (__DEV__) console.log('Mapping onboarding_progress with', Object.keys(data.onboarding_progress || {}).length, 'fields');
      cleaned.onboarding_progress = data.onboarding_progress;
    }
    
    if (__DEV__) {
      console.log('=== CLEAN DATA FOR DATABASE END ===');
      console.log('Cleaned data keys:', Object.keys(cleaned));
      console.log('Cleaned data fields count:', Object.keys(cleaned).length);
    }
    
    // Validate cleaned data
    if (Object.keys(cleaned).length === 0) {
      console.warn('WARNING: No valid data to save after cleaning!');
    }
    
    return cleaned;
  };

  // Save current progress to database
  const saveProgress = async () => {
    const clientId = actualClientId || RNStorage.clientId;
    if (!clientId) {
      console.error('No client ID found for saving progress');
      return false;
    }

    try {
      setIsLoading(true);

      // Use the most current progress state (updated by nextQuestion) with GLOBAL index
      const currentGlobalIndex = sectionGlobalIndexes[currentQuestionIndex];
      const currentProgress = {
        ...progress,
        currentQuestion: currentGlobalIndex,
        completedQuestions: [...new Set([...(progress.completedQuestions || []), currentGlobalIndex])],
        totalQuestions: onboardingQuestions.length
      };
      
          if (__DEV__) {
      console.log('[saveProgress] Saving progress for question:', currentQuestionIndex);
      console.log('[saveProgress] Completed questions count:', currentProgress.completedQuestions.length);
    }

      const cleanedData = cleanDataForDatabase(clientData);

      // Set onboarding_completed if all questions are completed
      const onboarding_completed = (currentProgress.completedQuestions.length >= onboardingQuestions.length - 1);

      const success = await updateClientOnboardingData(clientId, {
        ...cleanedData,
        onboarding_progress: currentProgress,
        onboarding_completed // explicitly set
      });

      if (!success) throw new Error('Failed to save progress');

      console.log('Progress saved successfully for question', currentQuestionIndex);
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save & Exit with custom messaging
  const saveAndExit = () => {
    // Show confirmation modal first
    setShowSaveExitConfirmation(true);
  };

  // Handle actual save and exit after confirmation
  const handleConfirmedSaveAndExit = async () => {
    try {
      setIsLoading(true);
      console.log('=== SAVE AND EXIT CONFIRMED ===');
      console.log('isReviewMode:', actualIsReviewMode);
      console.log('navigation available:', !!navigation);
      console.log('navigation.goBack available:', !!(navigation && navigation.goBack));
      console.log('onExit available:', !!onExit);
      
      // Save current progress
      await saveProgress();
      
      // Close confirmation modal
      setShowSaveExitConfirmation(false);
      
      // Show custom message
      Alert.alert(
        'Progress Saved',
        'Your progress has been saved. Complete your onboarding in the Profile section to unlock all features.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Alert OK pressed, determining navigation...');
              // Handle navigation based on how we got here
              if (actualIsReviewMode && navigation && navigation.goBack) {
                console.log('Using navigation.goBack() for review mode');
                // Coming from Profile → Review Goals, go back to Profile
                navigation.goBack();
              } else if (onExit) {
                console.log('Using onExit() callback for initial onboarding');
                // Initial onboarding flow, use the onExit callback
                onExit();
              } else if (navigation && navigation.replace) {
                console.log('Using navigation.replace() as fallback');
                // Fallback: navigate to main tabs
                navigation.replace('MainTabs');
              } else {
                console.log('No navigation method available!');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving and exiting:', error);
      Alert.alert('Error', 'Could not save your progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    const clientId = actualClientId || RNStorage.clientId;
    if (!clientId) return;
    
    console.log('[completeOnboarding] Starting onboarding completion for clientId:', clientId);
    console.log('[completeOnboarding] Current clientData:', clientData);
    
    try {
      setIsLoading(true);
      
      // Calculate BMR if we have all required data
      if (clientData.weight && clientData.height_ft && clientData.height_in && clientData.age && clientData.biological_sex) {
        try {
          // Convert height from ft/in to cm
          const totalInches = (parseInt(clientData.height_ft) * 12) + parseInt(clientData.height_in);
          const heightCm = totalInches * 2.54; // 1 inch = 2.54 cm
          
          await calculateAndStoreBMR(
            parseFloat(clientData.weight),
            heightCm,
            parseInt(clientData.age),
            clientData.biological_sex
          );
        } catch (error) {
          console.error('[PersonalizedOnboardingScreen] Error calculating BMR during completion:', error);
        }
      }
      

      
      // Note: BMR, calorie, and macro targets are now calculated after Question 6 (Activity Level)
      // to avoid LLM-based calculations during final onboarding completion
      
      // Calculate workout target if we have training days
      if (clientData.training_days_per_week !== undefined && clientData.training_days_per_week !== null) {
        try {
          await calculateAndStoreWorkoutTarget(clientData.training_days_per_week);
        } catch (error) {
          console.error('[PersonalizedOnboardingScreen] Error calculating workout target during completion:', error);
        }
      }
      
      // Calculate and store BMI if we have all required data
      if (clientData.weight && clientData.height_ft && clientData.height_in) {
        try {
          const totalInches = (parseInt(clientData.height_ft) * 12) + parseInt(clientData.height_in);
          const heightCm = totalInches * 2.54;
          await calculateAndStoreBMI(
            parseFloat(clientData.weight),
            heightCm
          );
        } catch (error) {
          console.error('[PersonalizedOnboardingScreen] Error calculating BMI during completion:', error);
        }
      }
      
      // Clean data for database storage
      const cleanedData = cleanDataForDatabase(clientData);
      
      // Ensure ALL questions are marked as completed, including the current one
      const allCompletedQuestions = Array.from({ length: onboardingQuestions.length }, (_, i) => i);
      
      const finalProgress = {
        currentQuestion: onboardingQuestions.length - 1,
        totalQuestions: onboardingQuestions.length,
        completedQuestions: allCompletedQuestions,
        skippedQuestions: progress.skippedQuestions || []
      };
      
          if (__DEV__) {
      console.log('[completeOnboarding] Saving final progress with', allCompletedQuestions.length, 'completed questions');
    }
      
      // Set onboarding_completed to true
      const success = await completeClientOnboarding(clientId, {
        ...cleanedData,
        onboarding_progress: finalProgress,
        onboarding_completed: true
      });
      
      if (!success) throw new Error('Failed to complete onboarding');
      
      console.log('[completeOnboarding] Onboarding completed successfully');
      
      // Skip results modal and navigate directly to main dashboard
      if (onComplete) {
        onComplete();
      } else if (navigation && navigation.replace) {
        navigation.replace('MainTabs');
      } else if (navigation && navigation.goBack) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Could not complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalComplete = () => {
    setShowResultsModal(false);
    if (onComplete) {
      onComplete();
    } else if (navigation) {
      navigation.replace('MainTabs');
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setClientData(prevData => ({
      ...prevData,
      [field]: value
    }));
    
    // Note: BMR calculation moved to activity level trigger point to consolidate all target calculations
    
    // Note: Hydration calculation moved to activity level trigger point to consolidate all target calculations
    

    
    // Remove immediate saving in review mode - only save when user clicks next button
    // This ensures review mode behaves exactly like initial onboarding
  };

  // Handle array field changes
  const handleArrayFieldToggle = (field, value) => {
    // Special logic for workout_days to limit selection based on training_days_per_week
    if (field === 'workout_days') {
      setClientData(prev => {
        const currentArray = [...(prev[field] || [])];
        const index = currentArray.indexOf(value);
        const maxDays = prev.training_days_per_week || 7; // Use prev to get current state
        
        console.log('Workout days toggle:', {
          field,
          value,
          currentArray,
          maxDays,
          currentLength: currentArray.length,
          isRemoving: index >= 0
        });
        
        if (index >= 0) {
          // Removing a day - always allowed
          currentArray.splice(index, 1);
          return {
            ...prev,
            [field]: currentArray
          };
        } else {
          // Adding a day - check if we're at the limit
          if (currentArray.length >= maxDays) {
            // Show a toast + warning haptic to inform user about the limit
            console.log('Limit reached, showing toast');
            try {
              const H = require('react-native-haptic-feedback');
              H?.trigger?.('notificationWarning', { enableVibrateFallback: true });
            } catch (_) { try { const EH = require('expo-haptics'); EH?.notificationAsync?.(EH.NotificationFeedbackType?.Warning); } catch (_) {} }
            showToast(`You can only select up to ${maxDays} days based on your training schedule.`);
            Alert.alert('Selection Limit', `You can only select up to ${maxDays} days based on your training schedule.`);
            return prev; // Don't update the state
          }
          currentArray.push(value);
          return {
            ...prev,
            [field]: currentArray
          };
        }
      });
    } else {
      // Regular logic for other multi-select fields
      setClientData(prev => {
        const currentArray = [...(prev[field] || [])];
        const index = currentArray.indexOf(value);
        
        if (index >= 0) {
          currentArray.splice(index, 1);
        } else {
          currentArray.push(value);
        }
        
        return {
          ...prev,
          [field]: currentArray
        };
      });
    }
  };

  // Check if a value is selected in an array field
  const isSelected = (field, value) => {
    return clientData[field] && clientData[field].includes(value);
  };

  // Get dynamic context for workout_days question
  const getWorkoutDaysContext = () => {
    const maxDays = clientData.training_days_per_week || 7;
    const selectedDays = clientData.workout_days ? clientData.workout_days.length : 0;
    return `What days of the week do you prefer to workout? You can select up to ${maxDays} days (${selectedDays}/${maxDays} selected).`;
  };

  // Option button component
  const OptionButton = ({ field, value, label, currentValue, emoji }) => (
    <TouchableOpacity
      style={[
        dynamicStyles.optionButton,
        currentValue === value ? dynamicStyles.optionButtonSelected : null
      ]}
      onPress={() => handleInputChange(field, value)}
    >
      {emoji && <Text style={styles.optionEmoji}>{emoji}</Text>}
      <Text 
        style={[
          dynamicStyles.optionButtonText,
          currentValue === value ? dynamicStyles.optionButtonTextSelected : null
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Multi-select button component
  const MultiSelectButton = ({ field, value, label, emoji, icon, currentValues }) => {
    // Use currentValues for selection and disabling logic
    const isSelected = currentValues && currentValues.includes(value);
    const maxDays = clientData.training_days_per_week || 7;
    const isDisabled =
      field === 'workout_days' &&
      !isSelected &&
      currentValues &&
      currentValues.length >= maxDays;

    return (
      <TouchableOpacity
        style={[
          styles.multiSelectOption,
          isSelected ? styles.multiSelectOptionSelected : null,
          isDisabled ? styles.multiSelectButtonDisabled : null
        ]}
        onPress={() => {
          try {
            successPulseAnim.setValue(0);
            Animated.timing(successPulseAnim, { toValue: 1, duration: reduceMotion ? 140 : 200, useNativeDriver: true }).start();
          } catch(_) {}
          handleArrayFieldToggle(field, value);
        }}
        disabled={isDisabled}
      >
        <View style={styles.multiSelectContentContainer}>
          {/* Icon on top */}
          {icon ? (
            <Icon 
              name={icon} 
              size={24} 
              color={isSelected ? '#FFFFFF' : actualTheme.colors.textSecondary}
              style={styles.multiSelectIcon}
            />
          ) : emoji && (
            <Text style={[
              styles.multiSelectEmoji,
              isDisabled ? styles.multiSelectEmojiDisabled : null
            ]}>{emoji}</Text>
          )}
          {/* Text below */}
          <Text style={[
            styles.multiSelectText,
            isSelected ? styles.multiSelectTextSelected : null,
            isDisabled ? styles.multiSelectButtonTextDisabled : null
          ]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Define questions grouped by type with intro/completion screens
  const questions = [
    // PERSONAL SECTION INTRO
    {
      id: 'personal_intro',
      section: 'Personal Information',
      title: "Let's get to know you!",
      neutralTitle: "Let's get to know you!",
      question: "We'll start with some basic information about you",
      context: "This helps me understand your starting point and design a program that fits your body and lifestyle",
      type: 'section_intro',
      sectionName: 'Personal Information',
      icon: 'user'
    },

    // PERSONAL QUESTIONS
    {
      id: 'age',
      section: 'Personal Information',
      title: "How Old Are You?",
      neutralTitle: "Basic Information",
      // question: "How old are you?",
      context: "This helps me design age-appropriate workouts that match your body's needs.",
      type: 'text_input',
      field: 'age',
      category: 'Personal',
      placeholder: "Enter your age",
      keyboardType: "numeric",
      maxLength: 2
    },

    {
      id: 'body_measurements',
      section: 'Personal Information',
      title: "Your Body Measurements",
      neutralTitle: "Your Body Measurements",
      question: "",
      context: "These measurements help us track your progress and set realistic fitness goals.",
      type: 'body_measurements_input', // Custom type for body measurements
      field: 'body_measurements', // Reference for body measurements
      category: 'Personal',
      icon: 'ruler-combined' // Icon for body measurements
    },

    {
      id: 'weight',
      section: 'Personal Information',
      title: "What's Your Current Weight",
      neutralTitle: "Next Question",
      question: "",
      context: "This helps me track your progress and set realistic goals.",
      type: 'picker',
      field: 'weight',
      category: 'Personal',
      options: Array.from({ length: 111 }, (_, i) => {
        const kg = i + 40; // Base kg value (integer)
        const lbs = Math.round(kg * 2.20462); // Convert kg to lbs and round to whole number
        const kgFormatted = kg.toFixed(1); // Format kg to one decimal place
        return {
          value: kg,
          label: `${lbs} lbs (${kgFormatted} kg)` // Display lbs (whole) and kg (one decimal)
        };
      }),
      unit: 'kg' // Keep unit as kg for internal logic, but display handles both
    },

    {
      id: 'biological_sex',
      section: 'Personal Information',
      title: "Choose Your Gender",
      neutralTitle: "Next Question",
      question: "",
      context: "This affects your metabolism and how your trainer designs your training program.",
      type: 'select',
      field: 'biological_sex',
      category: 'Personal',
      options: [
        { value: 'male', label: 'Male', icon: 'person' },
        { value: 'female', label: 'Female', icon: 'person-dress' },
        { value: 'other', label: 'Other', icon: 'people-group' }
      ]
    },

    {
      id: 'profile_picture',
      section: 'Personal Information',
      title: "Your Profile Picture",
      neutralTitle: "Profile Picture",
      question: "Adding a profile picture helps personalize your FitCoach experience.",
      context: "You can take a new photo or choose one from your gallery.",
      type: 'profile_picture_upload',
      field: 'profile_picture_url',
      category: 'Personal',
      optional: true
    },

    {
      id: 'activity_level',
      section: 'Personal Information',
      title: "Your daily activity level",
      neutralTitle: "Next Question",
      question: "",
      context: "This helps me calculate your daily calorie needs accurately.",
      type: 'select',
      field: 'activity_level',
      category: 'Personal',
      options: [
        { value: 'sedentary', label: 'Mostly sitting\n(desk job)', icon: 'chair' },
        { value: 'lightly_active', label: 'Some movement\nthroughout day', icon: 'person-walking' },
        { value: 'active', label: 'On my feet most\nof the day', icon: 'person-running' },
        { value: 'very_active', label: 'Physically demanding\njob', icon: 'dumbbell' }
      ]
    },

    // PERSONAL SECTION COMPLETION
    {
      id: 'personal_complete',
      section: 'Personal Information',
      title: "Personal Information Complete!",
      neutralTitle: "Personal Information Complete!",
      question: "Great! I now have your basic information.",
      context: "Next, let's talk about your fitness goals and what motivates you.",
      type: 'section_complete',
      sectionName: 'Personal Information',
      icon: 'circle-check'
    },

    // GOAL SECTION INTRO
    {
      id: 'goal_intro',
      section: 'Fitness Goals',
      title: "Let's talk about your goals!",
      neutralTitle: "Now let's talk about your goals!",
      question: "Understanding your goals helps us create the perfect plan",
      context: "Your goals will be the foundation of your entire fitness program.",
      type: 'section_intro',
      sectionName: 'Fitness Goals',
      icon: 'bullseye'
    },

    // GOAL QUESTIONS
    {
      id: 'primary_goal',
      section: 'Fitness Goals',
      title: "Your fitness goals",
      neutralTitle: "Your Goals",
      question: "",
      context: "This will be the foundation of your entire program.",
      type: 'select',
      field: 'primary_fitness_goal',
      category: 'Goal',
      options: [
        { value: 'lose_fat', label: 'Lose body fat', icon: 'weight-scale' },
        { value: 'build_muscle', label: 'Build muscle', icon: 'dumbbell' },
        { value: 'get_stronger', label: 'Get stronger', icon: 'hand-fist' },
        { value: 'improve_health', label: 'Overall health', icon: 'heart-pulse' },
        { value: 'sport_performance', label: 'Sport performance', icon: 'medal' },
        { value: 'tone_up', label: 'Tone and sculpt', icon: 'star' },
        { value: 'endurance', label: 'Build endurance', icon: 'person-running' }
      ]
    },

    {
      id: 'specific_outcome',
      section: 'Fitness Goals',
      title: "Specific outcomes to achieve",
      neutralTitle: "Specific Goals",
      question: "",
      context: "Be as detailed as you want - this helps us create measurable milestones.",
      type: 'text',
      field: 'specific_outcome',
      category: 'Goal',
      placeholder: 'e.g., "Lose 10kg and feel confident in my clothes", "Bench press my bodyweight", "Run 5km without stopping"',
      multiline: true,
      optional: true
    },

    {
      id: 'goal_timeline',
      section: 'Fitness Goals',
      title: "Timeline to achieve this goal?",
      neutralTitle: "Timeline Question",
      question: "",
      context: "Realistic timelines lead to sustainable, lasting results.",
      type: 'select',
      field: 'goal_timeline',
      category: 'Goal',
      options: [
        { value: '3_months', label: '3 months\n(Aggressive)', icon: 'bolt' },
        { value: '6_months', label: '6 months\n(Balanced)', icon: 'clock' },
        { value: '1_year', label: '1 year\n(Steady)', icon: 'calendar' },
        { value: 'no_rush', label: 'No rush\n(Gradual progress)', icon: 'leaf' }
      ]
    },

    {
      id: 'focus_areas',
      section: 'Fitness Goals',
      title: "Specific areas to focus on",
      neutralTitle: "Focus Areas",
      question: "",
      context: "Select your priority areas - we can emphasize these in your workouts.",
      type: 'multi_select',
      field: 'focus_areas',
      category: 'Goal',
      options: [
        { value: 'upper_body', label: 'Upper body', icon: 'hand-fist' },
        { value: 'lower_body', label: 'Lower body', icon: 'person-walking' },
        { value: 'core', label: 'Core/abs', icon: 'circle-dot' },
        { value: 'cardio', label: 'Cardio fitness', icon: 'heart-pulse' },
        { value: 'flexibility', label: 'Flexibility', icon: 'user-ninja' },
        { value: 'full_body', label: 'Full body strength', icon: 'dumbbell' },
        { value: 'functional', label: 'Functional movement', icon: 'arrows-spin' }
      ]
    },

    {
      id: 'confidence_level',
      section: 'Fitness Goals',
      title: "Confidence Level",
      neutralTitle: "Confidence Level",
      question: "",
      context: "Your confidence level (on a scale of 1-10) on reaching your goal? Be honest - we'll help boost your confidence along the way!",
      type: 'picker',
      field: 'confidence_level',
      category: 'Goal',
      options: [
        { value: 1, label: '1 - Not confident at all' },
        { value: 2, label: '2 - Very unsure' },
        { value: 3, label: '3 - Doubtful' },
        { value: 4, label: '4 - Somewhat unsure' },
        { value: 5, label: '5 - Neutral' },
        { value: 6, label: '6 - Somewhat confident' },
        { value: 7, label: '7 - Confident' },
        { value: 8, label: '8 - Very confident' },
        { value: 9, label: '9 - Extremely confident' },
        { value: 10, label: '10 - Absolutely certain!' }
      ]
    },

    {
      id: 'motivation_style',
      section: 'Fitness Goals',
      title: "Motivational Factors!",
      neutralTitle: "Motivation Style",
      question: "",
      context: "What motivates you most to exercise? We'll use this to keep you motivated throughout your journey.",
      type: 'select',
      field: 'motivation_style',
      category: 'Goal',
      options: [
        { value: 'results', label: 'Seeing physical results', icon: 'chart-line' },
        { value: 'competition', label: 'Competition and challenges', icon: 'trophy' },
        { value: 'health', label: 'Health and wellness benefits', icon: 'heart-pulse' },
        { value: 'energy', label: 'Feeling energized and strong', icon: 'bolt' },
        { value: 'social', label: 'Social connection and community', icon: 'people-group' },
        { value: 'stress_relief', label: 'Stress relief and mental health', icon: 'brain' },
        { value: 'routine', label: 'Having a structured routine', icon: 'calendar-check' }
      ]
    },

    // GOAL SECTION COMPLETION
    {
      id: 'goal_complete',
      section: 'Fitness Goals',
      title: "Goals Section Complete!",
      neutralTitle: "Goals Section Complete!",
      question: "Perfect! I understand your goals and motivation.",
      context: "Next, let's discuss your training preferences and experience.",
      type: 'section_complete',
      sectionName: 'Fitness Goals',
      icon: 'circle-check'
    },

    // TRAINING SECTION INTRO
    {
      id: 'training_intro',
      section: 'Training Preferences',
      title: "Time to talk training!",
      neutralTitle: "Time to talk training!",
      question: "",
      context: "Let's design your perfect workout plan Understanding your experience and preferences helps me create effective workouts.",
      type: 'section_intro',
      sectionName: 'Training Preferences',
      icon: 'dumbbell'
    },

    // TRAINING QUESTIONS
    {
      id: 'training_experience',
      section: 'Training Preferences',
      title: 'Training Experience',
      neutralTitle: 'Training Experience',
      question: '',
      context: 'How would you describe your training experience? This helps me create workouts that challenge you appropriately.',
      type: 'select',
      field: 'training_experience',
      category: 'Training',
      options: [
        { value: 'complete_beginner', label: 'Complete beginner\n(never trained)', icon: 'user-plus' },
        { value: 'beginner', label: 'Beginner\n(less than 6 months)', icon: 'graduation-cap' },
        { value: 'some_experience', label: 'Some experience\n(6 months - 2 years)', icon: 'chart-line' },
        { value: 'experienced', label: 'Experienced\n(2-5 years)', icon: 'trophy' },
        { value: 'very_experienced', label: 'Very experienced\n(5+ years)', icon: 'crown' }
      ]
    },

    {
      id: 'previous_training',
      section: 'Training Preferences',
      title: 'Previous Training',
      neutralTitle: 'Previous Training',
      question: '',
      context: 'What types of training have you done before? Understanding your background helps me build on what you know.',
      type: 'text',
      field: 'previous_training',
      category: 'Training',
      placeholder: 'e.g., "Gym workouts, running, yoga classes, home workouts, sports teams"',
      multiline: true,
      optional: true
    },

    {
      id: 'training_days',
      section: 'Training Preferences',
      title: 'Training Schedule',
      neutralTitle: 'Training Schedule',
      question: '',
      context: 'How many days per week can you train? Be honest - consistency beats intensity!',
      type: 'picker',
      field: 'training_days_per_week',
      category: 'Training',
      options: [
        { value: 1, label: '1 day' },
        { value: 2, label: '2 days' },
        { value: 3, label: '3 days' },
        { value: 4, label: '4 days' },
        { value: 5, label: '5 days' },
        { value: 6, label: '6 days' },
        { value: 7, label: '7 days' }
      ]
    },

    {
      id: 'session_duration',
      section: 'Training Preferences',
      title: 'Session Duration',
      neutralTitle: 'Session Duration',
      question: '',
      context: 'How much time can you dedicate per workout? I\'ll design efficient workouts that fit your schedule.',
      type: 'select',
      field: 'training_time_per_session',
      category: 'Training',
      options: [
        { value: '15_minutes', label: '15 minutes\n(quick burst)', icon: 'bolt' },
        { value: '30_minutes', label: '30 minutes\n(efficient)', icon: 'clock' },
        { value: '45_minutes', label: '45 minutes\n(balanced)', icon: 'stopwatch' }, // Updated icon
        { value: '60_minutes', label: '60 minutes\n(thorough)', icon: 'hourglass-half' },
        { value: '90_minutes', label: '90+ minutes\n(comprehensive)', icon: 'hourglass' }
      ]
    },

    {
      id: 'training_location',
      section: 'Training Preferences',
      title: 'Training Location Preferences',
      neutralTitle: 'Training Location',
      question: '',
      context: 'Where do you prefer to train? I\'ll adapt your workouts to your preferred environment.',
      type: 'select',
      field: 'training_location',
      category: 'Training',
      options: [
        { value: 'home', label: 'Home', icon: 'house' },
        { value: 'gym', label: 'Gym', icon: 'dumbbell' },
        { value: 'outdoors', label: 'Outdoors', icon: 'tree' },
        { value: 'flexible', label: 'Mix of locations', icon: 'shuffle' }
      ]
    },

    {
      id: 'available_equipment',
      section: 'Training Preferences',
      title: 'Available Equipments',
      neutralTitle: 'Available Equipment',
      question: '',
      context: 'What equipment do you have access to? I\'ll design workouts around what you have.',
      type: 'multi_select',
      field: 'available_equipment',
      category: 'Training',
      options: [
        { value: 'bodyweight', label: 'Just my bodyweight', icon: 'person' },
        { value: 'dumbbells', label: 'Dumbbells', icon: 'dumbbell' },
        { value: 'barbell', label: 'Barbell', icon: 'grip-lines' }, // Updated icon for barbell
        { value: 'resistance_bands', label: 'Resistance bands', icon: 'link' },
        { value: 'kettlebells', label: 'Kettlebells', icon: 'weight-hanging' },
        { value: 'full_gym', label: 'Full gym access', icon: 'building' },
        { value: 'cardio_machines', label: 'Cardio machines', icon: 'heart-pulse' },
        { value: 'yoga_mat', label: 'Yoga mat', icon: 'square' }
      ]
    },

    {
      id: 'injuries',
      section: 'Training Preferences',
      title: 'Any Injuries to Consider?',
      neutralTitle: 'Health & Safety',
      question: '',
      context: 'Any injuries or limitations? We\'ll modify exercises for your safety.',
      type: 'text',
      field: 'injuries_limitations',
      category: 'Training',
      placeholder: 'e.g., "Lower back pain", "Knee surgery 6 months ago", "No limitations"',
      multiline: true,
      optional: true
    },

    {
      id: 'obstacles',
      section: 'Training Preferences',
      title: 'Challenges and Obstacles',
      neutralTitle: 'Challenges & Obstacles',
      question: '',
      context: 'What are your biggest obstacles to staying consistent? This helps me provide targeted solutions.',
      type: 'text',
      field: 'obstacles',
      category: 'Training',
      placeholder: 'e.g., "Lack of time", "Motivation issues", "Travel frequently", "Stress eating"',
      multiline: true,
      optional: true
    },

    {
      id: 'workout_time',
      section: 'Training Preferences',
      title: 'Workout Time',
      neutralTitle: 'Workout Time',
      question: '',
      context: 'What time do you prefer to workout? This increases consistency.',
      type: 'workout_time_input',
      field: 'workout_time',
      category: 'Training'
    },

    {
      id: 'workout_days',
      section: 'Training Preferences',
      title: 'Workout Days',
      neutralTitle: 'Workout Days',
      question: '',
      context: 'What days of the week do you prefer to workout? This helps create a consistent schedule.',
      type: 'multi_select',
      field: 'workout_days',
      category: 'Training',
      options: [
        { value: 'Mon', label: 'Monday', icon: 'sun' },
        { value: 'Tue', label: 'Tuesday', icon: 'mountain' },
        { value: 'Wed', label: 'Wednesday', icon: 'fire' },
        { value: 'Thu', label: 'Thursday', icon: 'bolt' },
        { value: 'Fri', label: 'Friday', icon: 'star' },
        { value: 'Sat', label: 'Saturday', icon: 'crown' },
        { value: 'Sun', label: 'Sunday', icon: 'heart' }
      ]
    },

    // TRAINING SECTION COMPLETION
    {
      id: 'training_complete',
      section: 'Training Preferences',
      title: "Training Section Complete!",
      neutralTitle: "Training Section Complete!",
      question: "Excellent! I have all your training preferences.",
      context: "Now let's discuss your nutrition habits and preferences.",
      type: 'section_complete',
      sectionName: 'Training Preferences',
      icon: 'circle-check'
    },

    // NUTRITIONAL SECTION INTRO
    {
      id: 'nutritional_intro',
      section: 'Nutritional Preferences',
      title: "Let's talk nutrition!",
      neutralTitle: "Let's talk nutrition!",
      question: "Good nutrition is key to reaching your goals",
      context: "Understanding your eating habits helps me provide personalized nutrition guidance.",
      type: 'section_intro',
      sectionName: 'Nutritional Information',
      icon: 'apple-whole'
    },

    // NUTRITIONAL QUESTIONS
    {
      id: 'eating_habits',
      section: 'Nutritional Preferences',
      title: "Eating Habits",
      neutralTitle: "Nutrition Questions",
      question: "",
      context: "How would you describe your current eating habits? Honest assessment helps me give you realistic nutrition guidance.",
      type: 'select',
      field: 'eating_habits',
      category: 'Nutritional',
      options: [
        { value: 'very_healthy', label: 'Very healthy - Eat healthy mostly', icon: 'apple-whole' },
        { value: 'somewhat_healthy', label: 'Somewhat healthy', icon: 'thumbs-up' },
        { value: 'inconsistent', label: 'Inconsistent', icon: 'shuffle' },
        { value: 'needs_work', label: 'Needs work', icon: 'wrench' },
        { value: 'very_poor', label: 'Very poor', icon: 'triangle-exclamation' }
      ]
    },

    {
      id: 'diet_preferences',
      section: 'Nutritional Preferences',
      title: "Diet Preferences",
      neutralTitle: "Diet Preferences",
      question: "",
      context: "Do you follow any specific diet or have preferences? We'll tailor nutrition advice to fit your lifestyle and beliefs.",
      type: 'multi_select',
      field: 'diet_preferences',
      category: 'Nutritional',
      options: [
        { value: 'none', label: 'No specific diet', icon: 'utensils' },
        { value: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
        { value: 'vegan', label: 'Vegan', icon: 'seedling' },
        { value: 'keto', label: 'Ketogenic', icon: 'fire' },
        { value: 'paleo', label: 'Paleo', icon: 'drumstick-bite' },
        { value: 'mediterranean', label: 'Mediterranean', icon: 'lemon' },
        { value: 'intermittent_fasting', label: 'Intermittent fasting', icon: 'clock' },
        { value: 'low_carb', label: 'Low carb', icon: 'bread-slice' }
      ]
    },

    {
      id: 'food_allergies',
      section: 'Nutritional Preferences',
      title: "Food Allergies",
      neutralTitle: "Food Allergies",
      question: "",
      context: "Do you have any food allergies or intolerances? This ensures all my meal suggestions are safe for you.",
      type: 'text',
      field: 'food_allergies',
      category: 'Nutritional',
      placeholder: 'e.g., "Nuts, dairy", "Lactose intolerant", "No allergies"',
      multiline: true
    },

    {
      id: 'meal_frequency',
      section: 'Nutritional Preferences',
      title: "Meal Frequency",
      neutralTitle: "Meal Frequency",
      question: "",
      context: "How many meals per day do you prefer? We'll structure your nutrition plan around your preferred eating pattern.",
      type: 'picker',
      field: 'preferred_meals_per_day',
      category: 'Nutritional',
      options: [
        { value: 2, label: '2 meals (intermittent fasting style)' },
        { value: 3, label: '3 meals (traditional)' },
        { value: 4, label: '4 meals (3 + snack)' },
        { value: 5, label: '5 meals (3 + 2 snacks)' },
        { value: 6, label: '6+ meals (frequent eating)' }
      ]
    },

    {
      id: 'gastric_issues',
      section: 'Nutritional Preferences',
      title: "Digestive Health Issues?",
      neutralTitle: "Digestive Health",
      question: "",
      context: "Have you experienced gut issues? Understanding digestive issues helps me recommend appropriate foods.",
      type: 'text',
      field: 'gastric_issues',
      category: 'Nutritional',
      placeholder: 'e.g., "IBS", "Acid reflux", "Constipation", "No issues"',
      multiline: true
    },

    {
      id: 'supplements',
      section: 'Nutritional Preferences',
      title: "Supplements?",
      neutralTitle: "Supplements",
      question: "",
      context: "Are you currently taking any supplements? This helps us avoid conflicts and optimize your nutrition plan.",
      type: 'text',
      field: 'supplements',
      category: 'Nutritional',
      placeholder: 'e.g., "Protein powder, Vitamin D, Multivitamin", "None"',
      multiline: true
    },

    {
      id: 'bf_time',
      section: 'Nutritional Preferences',
      title: 'Breakfast Time?',
      neutralTitle: 'Breakfast Time',
      question: '',
      context: 'What time do you prefer to eat breakfast? This helps in scheduling your meals for optimal energy.',
      type: 'meal_time_input',
      field: 'bf_time',
      category: 'Nutritional'
    },

    {
      id: 'lunch_time',
      section: 'Nutritional Preferences',
      title: 'Lunch Time?',
      neutralTitle: 'Lunch Time',
      question: '',
      context: 'What time do you prefer to eat lunch? Scheduling lunch helps maintain your energy levels throughout the day.',
      type: 'meal_time_input',
      field: 'lunch_time',
      category: 'Nutritional'
    },

    {
      id: 'dinner_time',
      section: 'Nutritional Preferences',
      title: 'Dinner Time?',
      neutralTitle: 'Dinner Time',
      question: '',
      context: 'What time do you prefer to eat dinner? Dinner timing can impact your sleep and recovery.',
      type: 'meal_time_input',
      field: 'dinner_time',
      category: 'Nutritional'
    },

    {
      id: 'snack_time',
      section: 'Nutritional Preferences',
      title: 'Snack Time',
      neutralTitle: 'Snack Time',
      question: '',
      context: 'What time is your snack time? Snacks can help maintain energy levels between meals.',
      type: 'meal_time_input',
      field: 'snack_time',
      category: 'Nutritional'
    },

    // NUTRITIONAL SECTION COMPLETION
    {
      id: 'nutritional_complete',
      section: 'Nutritional Preferences',
      title: "Nutritional Section Complete!",
      neutralTitle: "Nutritional Section Complete!",
      question: "Great! I have all your nutrition information.",
      context: "Finally, let's cover some general lifestyle factors.",
      type: 'section_complete',
      sectionName: 'Nutritional Information',
      icon: 'circle-check'
    },

    // GENERAL SECTION INTRO
    {
      id: 'general_intro',
      section: 'General Questions',
      title: "General questions",
      neutralTitle: "Almost done! General questions",
      question: "Just a few questions about your lifestyle",
      context: "These factors significantly impact your fitness journey and results.",
      type: 'section_intro',
      sectionName: 'General Information',
      icon: 'clipboard-question'
    },

    // GENERAL QUESTIONS
    {
      id: 'sleep_recovery',
      section: 'General Questions',
      title: "Sleep & Recovery",
      neutralTitle: "Sleep & Recovery",
      question: "",
      context: "How many hours of sleep do you typically get per night? Sleep is crucial for recovery and results - I'll factor this into your plan.",
      type: 'picker',
      field: 'sleep_hours',
      category: 'General',
      options: [
        { value: 4, label: '4 hours or less' },
        { value: 5, label: '5 hours' },
        { value: 6, label: '6 hours' },
        { value: 7, label: '7 hours' },
        { value: 8, label: '8 hours' },
        { value: 9, label: '9+ hours' }
      ]
    },

    {
      id: 'stress',
      section: 'General Questions',
      title: "Stress Level?",
      neutralTitle: "Stress Level",
      question: "",
      context: "How would you rate your current stress level? Stress affects recovery, motivation, and results - I'll help you manage it.",
      type: 'picker',
      field: 'stress',
      category: 'General',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },

    {
      id: 'wake_time',
      section: 'General Questions',
      title: 'What Time Do You Wake Up?',
      neutralTitle: 'Wake Up Time',
      question: '',
      context: 'What time do you wake up? This helps me schedule your daily activities effectively.',
      type: 'meal_time_input',
      field: 'wake_time',
      category: 'General'
    },

    {
      id: 'bed_time',
      section: 'General Questions',
      title: 'What Time Do You Go To Bed?',
      neutralTitle: 'Bed Time',
      question: '',
      context: 'What time do you prefer to go to bed? Knowing your bedtime helps in planning your rest and recovery.',
      type: 'picker',
      field: 'bed_time',
      category: 'General',
      options: Array.from({ length: 24 * 2 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 ? 'AM' : 'PM';
        const timeStr = `${formattedHour}:${minute === 0 ? '00' : minute} ${amPm}`;
        return { value: timeStr, label: timeStr };
      })
    },

    // FINAL COMPLETION
    {
      id: 'completion',
      section: 'General Questions',
      title: "Assessment Complete!",
      neutralTitle: "Assessment Complete!",
      question: "You're all set to start your personalized fitness journey!",
      context: "I'm excited to be your coach and help you achieve your goals!",
      type: 'final_completion'
    }
  ];

  // Get section param from navigation (if any)
  const sectionParam = params.section;

  // Filter questions by section if sectionParam is provided
  const filteredQuestions = sectionParam
    ? questions.filter(q => q?.section === sectionParam)
    : questions;

  // Reset question index when switching sections
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [sectionParam]);

  // Map filtered questions to their global indexes in the full questions array
  const sectionGlobalIndexes = filteredQuestions.map(q => {
    const index = questions.findIndex(qq => qq?.id === q?.id);
    return index >= 0 ? index : 0; // Fallback to 0 if not found
  });

  // Helper: Get indexes of real questions (not section_intro, section_complete, final_completion)
  const realQuestionIndexes = filteredQuestions
    .map((q, idx) => (q?.type !== 'section_intro' && q?.type !== 'section_complete' && q?.type !== 'final_completion' ? idx : null))
    .filter(idx => idx !== null && typeof idx === 'number');
  const realGlobalIndexes = realQuestionIndexes.map(idx => sectionGlobalIndexes[idx]);

  // Skip current question - improved version
  const skipQuestion = () => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (
      currentQuestion?.type === 'section_intro' ||
      currentQuestion?.type === 'section_complete' ||
      currentQuestion?.type === 'final_completion'
    ) {
      return;
    }
    showToast('Question skipped. You can complete it later from your Profile.');
    const globalIndex = sectionGlobalIndexes[currentQuestionIndex];
    // Merge with existing skippedQuestions from progress
    const newSkippedQuestions = Array.from(new Set([...(progress.skippedQuestions || []), globalIndex]))
      .filter(idx => realGlobalIndexes.includes(idx) || (progress.skippedQuestions || []).includes(idx));
    setProgress(prev => ({
      ...prev,
      skippedQuestions: newSkippedQuestions
    }));
    if (currentQuestionIndex < (filteredQuestions?.length || 25) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (sectionParam && navigation && navigation.goBack) {
        saveSectionProgress();
        navigation.goBack();
      } else {
        completeOnboarding();
      }
    }
    setTimeout(() => {
      if (actualClientId || RNStorage.clientId) {
        const updatedProgress = {
          ...progress,
          skippedQuestions: newSkippedQuestions
        };
        updateClientOnboardingData(actualClientId || RNStorage.clientId, {
          onboarding_progress: updatedProgress
        }).catch(err => console.log('Background save error:', err));
      }
    }, 100);
  };

  // Save only section progress and merge with existing onboarding_progress
  const saveSectionProgress = async () => {
    const clientId = actualClientId || RNStorage.clientId;
    if (!clientId) return;
    try {
      setIsLoading(true);
      // Fetch existing onboarding_progress from Supabase
      const data = await getClientOnboardingData(clientId);
      const existingProgress = data?.onboarding_progress || {};
      // Merge completed/skipped for this section
      const sectionCompleted = realGlobalIndexes.filter(idx =>
        progress.completedQuestions?.includes(idx)
      );
      const sectionSkipped = realGlobalIndexes.filter(idx =>
        progress.skippedQuestions?.includes(idx)
      );
      const mergedCompleted = Array.from(new Set([...(existingProgress.completedQuestions || []), ...sectionCompleted]));
      const mergedSkipped = Array.from(new Set([...(existingProgress.skippedQuestions || []), ...sectionSkipped]));
      // Clean only the relevant data for DB columns
      const cleanedData = cleanDataForDatabase(clientData);
      // Save merged progress
      await updateClientOnboardingData(clientId, {
        ...cleanedData,
        onboarding_progress: {
          ...existingProgress,
          completedQuestions: mergedCompleted,
          skippedQuestions: mergedSkipped,
          currentQuestion: sectionGlobalIndexes[filteredQuestions.length - 1],
          totalQuestions: onboardingQuestions.length
        }
      });
    } catch (error) {
      console.error('Error saving section progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Improved completion check: only real questions
  const isOnboardingComplete = () => {
    return realQuestionIndexes.every(idx => progress.completedQuestions?.includes(idx));
  };

  // Check if previous question was skipped (for neutral messaging)
  const wasPreviousQuestionSkipped = () => {
    if (currentQuestionIndex === 0) return false;
    return progress.skippedQuestions?.includes(currentQuestionIndex - 1) || false;
  };

  // Simple delay helper
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to determine if current screen expects user input
  const isCurrentScreenInput = () => {
    const q = filteredQuestions?.[currentQuestionIndex];
    if (!q) return false;
    const inputTypes = [
      'text',
      'text_input',
      'picker',
      'select',
      'multi_select',
      'body_measurements_input',
      'workout_time_input',
      'meal_time_input',
    ];
    return inputTypes.includes(q.type);
  };

  // Move to next question with animation
  const nextQuestion = async () => {

    
    // Small success pulse
    try {
      successPulseAnim.setValue(0);
      Animated.timing(successPulseAnim, { toValue: 1, duration: reduceMotion ? 150 : 220, useNativeDriver: true }).start();
    } catch(_) {}
    
    // Check if current question is activity_level and calculate all targets
    const currentQuestion = filteredQuestions?.[currentQuestionIndex];
    if (currentQuestion?.field === 'activity_level' && (clientData.activity_level || clientData.cl_activity_level)) {
      try {
        // Calculate hydration target with available data or defaults
        const weight = clientData.weight ? parseFloat(clientData.weight) : 70; // Default weight if not provided
        const activityLevel = clientData.activity_level || clientData.cl_activity_level;
        const trainingDays = clientData.training_days_per_week || 0;
        const sleepHours = clientData.sleep_hours || 7;
        
        await calculateAndStoreHydrationTarget(weight, activityLevel, trainingDays, sleepHours);
        
        // Calculate BMR if we have all required data
        if (clientData.weight && clientData.height_ft && clientData.height_in && clientData.age && clientData.biological_sex) {
          // Convert height from ft/in to cm
          const totalInches = (parseInt(clientData.height_ft) * 12) + parseInt(clientData.height_in);
          const heightCm = totalInches * 2.54; // 1 inch = 2.54 cm
          
          await calculateAndStoreBMR(
            parseFloat(clientData.weight),
            heightCm,
            parseInt(clientData.age),
            clientData.biological_sex
          );
          
          // Calculate calorie target if we have BMR and activity level
          const bmr = (10 * parseFloat(clientData.weight)) + (6.25 * heightCm) - (5 * parseInt(clientData.age)) + (clientData.biological_sex.toLowerCase() === 'male' ? 5 : -161);
          await calculateAndStoreCalorieTarget(
            clientData,
            bmr,
            clientData.activity_level || clientData.cl_activity_level,
            clientData.primary_fitness_goal
          );
          
          // Calculate macro targets if we have calorie target
          const { supabase } = await import('../utils/supabaseRest');
          const { data: calorieData } = await supabase
            .from('client_target')
            .select('target')
            .eq('client_id', actualClientId || RNStorage.clientId)
            .eq('goal', 'calories')
            .single();
          
          if (calorieData && calorieData.target) {
            await calculateAndStoreMacroTargets(
              clientData,
              calorieData.target,
              clientData.primary_fitness_goal,
              clientData.activity_level || clientData.cl_activity_level
            );
          }
        }
      } catch (error) {
        console.error('[PersonalizedOnboardingScreen] Error calculating targets after activity level question:', error);
      }
    }
    
    const globalIndex = sectionGlobalIndexes[currentQuestionIndex];
    // Mark as completed in global progress
    const newCompletedQuestions = Array.from(new Set([...(progress.completedQuestions || []), globalIndex]));
    setProgress(prev => ({
      ...prev,
      completedQuestions: newCompletedQuestions
    }));
    await saveProgress();
    // Show bottom toast BEFORE changing screen only on input screens
    // Removed bottom toast; we now show contextual header bubble only
    if (currentQuestionIndex < (filteredQuestions?.length || 25) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (sectionParam && navigation && navigation.goBack) {
        await saveSectionProgress();
        navigation.goBack();
      } else {
        await completeOnboarding();
      }
    }
    
    // Progress calculation removed - no more celebration animations
  };

  // Move to previous question
  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Update client data helper function
  const updateClientData = (field, value) => {
    // Update client data field
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Time picker handlers
  const handleTimePicker = (field) => {
    setTimePickerField(field);
    setShowTimePicker(true);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime && timePickerField) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateClientData(timePickerField, timeString);
    }
  };

  // Render current question content
  const renderContent = () => {
    // Render content logic
    
    if (!filteredQuestions || filteredQuestions.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      );
    }

    // Ensure currentQuestionIndex doesn't exceed array bounds
    if (currentQuestionIndex >= filteredQuestions.length) {
      if (__DEV__) console.log('Resetting currentQuestionIndex to 0 - was out of bounds');
      setCurrentQuestionIndex(0);
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      );
    }

    const question = filteredQuestions[currentQuestionIndex];
    // Current question debugging (dev only)
    if (__DEV__ && question) {
      console.log('Current question:', question.id, '-', question.title);
    }
    
    if (!question) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Question not available</Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.questionContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { translateX: slideXAnim },
            ]
          }
        ]}
      >
        {/* Question Header */}
        <View style={styles.questionHeader}>
          {/* Large Professional Icon - Only show for non-section intro questions */}
          {question.type !== 'section_intro' && (
            <View style={styles.questionIconContainer}>
              {getQuestionIcon(question.field, question.type)}
            </View>
          )}
          
          {/* Only show title for non-section completion screens to avoid duplication */}
          {question.type !== 'section_complete' && question.type !== 'final_completion' && (
            <Text style={dynamicStyles.questionTitle}>
              {wasPreviousQuestionSkipped() ? (question.neutralTitle ? question.neutralTitle : '') : (question.title ? question.title : '')}
            </Text>
          )}

          {/* Animated tip bubble directly under title, before options */}
          {(() => {
            if (['section_intro', 'section_complete', 'final_completion'].includes(question.type)) return null;
            return (
                <View
                  style={{
                    marginTop: 8,
                    paddingHorizontal: 24,
                    alignSelf: 'stretch',
                  }}
                >
                <View style={{ backgroundColor: 'rgba(28,37,65,0.95)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 12 }} numberOfLines={2}>{titleTipText}</Text>
                </View>
                </View>
            );
          })()}
          
          {/* Show context for non-section questions only if different from title */}
          {/* Temporarily hidden context text for cleaner UI */}
          {/* {question.type !== 'section_intro' && 
           question.type !== 'section_complete' && 
           question.type !== 'final_completion' && 
           question.context && 
           question.context !== question.title && (
            <Text style={dynamicStyles.questionContextClose}>
              {question.field === 'workout_days' ? getWorkoutDaysContext() : question.context}
            </Text>
          )} */}
        </View>
        
        {/* Question Input */}
        <View style={styles.questionInputContainer}>
          {renderQuestionInput(question)}
        </View>
        {/* Success pulse overlay for subtle confirmation */}
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', opacity: successPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }), backgroundColor: actualTheme.colors.primary }} />
      </Animated.View>
    );
  };

  // Render input based on question type - improved version
  const renderQuestionInput = (question) => {
    const currentValue = question.field ? clientData[question.field] : null;

    switch (question.type) {
      case 'section_intro':
        // Section intro rendering
        return (
          <View style={styles.sectionIntroContainer}>
            <Animated.View
              style={[
                styles.sectionIntroIcon,
                {
                  transform: [
                    { scale: scaleAnim },
                    {
                      scale: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {question.sectionName === 'Personal Information' ? (
                profilePictureUri ? (
                  <Image source={{ uri: profilePictureUri }} style={styles.sectionIntroAvatar} />
                ) : (
                  <View
                    style={[
                      styles.sectionIntroAvatar,
                      {
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      },
                    ]}
                  >
                    <Icon name="user" size={28} color="#94A3B8" />
                  </View>
                )
              ) : (
                <Icon
                  name={question.icon || 'user'}
                  size={48}
                  color={actualTheme.colors.primary}
                  solid
                />
              )}
            </Animated.View>
            <Text style={styles.sectionIntroTitle}>
              {question.sectionName ? question.sectionName : ''}
            </Text>
            <Text style={styles.sectionIntroText}>
              {question.context ? question.context : ''}
            </Text>
          </View>
        );
        
      case 'section_complete':
        return (
          <View style={styles.sectionCompleteContainer}>
            {/* Trainer avatar replaces tick for celebratory message */}
            <View style={styles.sectionCompleteIcon}>
              {trainerAvatarUri ? (
                <Image source={{ uri: trainerAvatarUri }} style={styles.sectionCompleteAvatar} />
              ) : (
                <Icon name="user" size={48} color={actualTheme.colors.primary} />
              )}
            </View>
            <Text style={styles.sectionCompleteTitle}>
              {question.sectionName ? question.sectionName : ''} Complete!
            </Text>
            <Text style={styles.sectionCompleteText}>
              Great job! Coach {clientData?.trainer_name || 'Assistant'} is cheering you on. 🎉
            </Text>
          </View>
        );
        
      case 'final_completion':
        return (
          <View style={styles.finalCompletionContainer}>
            <Animated.View
              style={[
                styles.finalCompletionIcon,
                {
                  transform: [
                    { scale: scaleAnim },
                    {
                      scale: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {trainerAvatarUri ? (
                <Image source={{ uri: trainerAvatarUri }} style={styles.sectionCompleteAvatar} />
              ) : (
                <Icon name="user" size={56} color={actualTheme.colors.primary} />
              )}
            </Animated.View>
            <Text style={styles.finalCompletionTitle}>Assessment Complete!</Text>
            <Text style={styles.finalCompletionText}>Thank you for submitting all the info!!</Text>
            <Text style={styles.finalCompletionSubtext}>
              "I will now work to build a custom plan for you to achieve your goals. I will get back to you with more details shortly. In the meantime, please feel free to get yourself familiarized with the app!"
            </Text>
          </View>
        );

      case 'text':
        return (
          <View style={styles.textInputContainer}>
            <Animated.View style={[
              styles.textInputWrapper,
              { transform: [{ translateX: shakeXAnim.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] }
            ]}>
              <TextInput
                ref={textInputRef}
                style={[
                  dynamicStyles.textInput,
                  question.multiline && styles.textInputMultiline
                ]}
                placeholder={question.placeholder ? question.placeholder : 'Type your answer...'}
                placeholderTextColor="#9CA3AF"
                value={currentValue ? currentValue : ''}
                onChangeText={(value) => updateClientData(question.field, value)}
                multiline={question.multiline}
                onFocus={() => {
                  handleTextInputFocus();
                  // start caret blink / field pulse
                  try {
                    inputFocusAnim.stopAnimation?.();
                    inputFocusAnim.setValue(0);
                    if (!reduceMotion) {
                      Animated.loop(
                        Animated.sequence([
                          Animated.timing(inputFocusAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
                          Animated.timing(inputFocusAnim, { toValue: 0, duration: 320, useNativeDriver: true })
                        ])
                      ).start();
                    }
                  } catch (_) {}
                }}
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </Animated.View>
          </View>
        );

      case 'text_input':
        return (
          <View style={styles.textInputContainer}>
            <Animated.View style={[
              styles.textInputWrapper,
              { transform: [{ translateX: shakeXAnim.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] }
            ]}>
              <TextInput
                ref={textInputRef}
                style={[
                  dynamicStyles.textInput,
                  question.multiline && styles.textInputMultiline,
                  question.field === 'age' && styles.textInputAge
                ]}
                placeholder={question.placeholder ? question.placeholder : 'Enter your answer...'}
                placeholderTextColor="#9CA3AF"
                value={currentValue ? currentValue : ''}
                onChangeText={(value) => updateClientData(question.field, value)}
                multiline={question.multiline}
                onFocus={() => {
                  handleTextInputFocus();
                  try {
                    inputFocusAnim.stopAnimation?.();
                    inputFocusAnim.setValue(0);
                    if (!reduceMotion) {
                      Animated.loop(
                        Animated.sequence([
                          Animated.timing(inputFocusAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
                          Animated.timing(inputFocusAnim, { toValue: 0, duration: 320, useNativeDriver: true })
                        ])
                      ).start();
                    }
                  } catch (_) {}
                }}
                blurOnSubmit={true}
                returnKeyType="done"
                keyboardType={question.keyboardType || "default"}
                maxLength={question.maxLength}
              />
            </Animated.View>
          </View>
        );

      case 'picker':
        const pickerOptions = question.options || [];
        const displayLabel = pickerOptions.find(opt => opt.value === currentValue)?.label ||
                             (currentValue !== null && currentValue !== '' ? `${currentValue} ${question.unit ? question.unit : ''}` : '');
        // Picker rendering logic

        return (
          <View style={styles.pickerContainer}>
            {/* Re-using pickerContainer structure for chevrons */}
            {/* Left chevron arrow */}
            {/* REMOVED: {currentQuestionIndex > 0 && (
              <TouchableOpacity
                style={styles.leftChevron}
                onPress={previousQuestion}
                disabled={isLoading}
              >
                <Icon name="chevron-left" size={24} color="#00E5E5" />
              </TouchableOpacity>
            )}*/}

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={currentValue}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => updateClientData(question.field, value)}
              >
                <Picker.Item
                  label="Select..."
                  value=""
                  color="#CCCCCC"
                />
                {pickerOptions.map((option, index) => {
                  // Option rendering
                  return (
                    <Picker.Item
                      key={index}
                      label={option.label ? option.label : ''}
                      value={option.value}
                      color={currentValue === option.value ? "#0A84FF" : "#FFFFFF"}
                    />
                  );
                })}
              </Picker>
            </View>

            {/* Right chevron arrow */}
            {/* REMOVED: <TouchableOpacity
              style={styles.rightChevron}
              onPress={nextQuestion}
              disabled={isLoading}
            >
              <Icon name="chevron-right" size={24} color="#00E5E5" />
            </TouchableOpacity>*/}


          </View>
        );

      case 'select':
        return (
          <View style={styles.pickerContainer}>
            {/* Re-using pickerContainer structure for chevrons */}
            {/* Left chevron arrow */}
            {/* REMOVED: {currentQuestionIndex > 0 && (
              <TouchableOpacity
                style={styles.leftChevron}
                onPress={previousQuestion}
                disabled={isLoading}
              >
                <Icon name="chevron-left" size={24} color="#00E5E5" />
              </TouchableOpacity>
            )}*/}

            {/* Existing select options container - will be centered by pickerContainer */}
            <View style={styles.selectContainer}>
              {question.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.selectOption,
                    currentValue === option.value && styles.selectOptionSelected
                  ]}
                  onPress={() => {
                    try {
                      successPulseAnim.setValue(0);
                      Animated.timing(successPulseAnim, { toValue: 1, duration: reduceMotion ? 140 : 200, useNativeDriver: true }).start();
                    } catch(_) {}
                    updateClientData(question.field, option.value)
                  }}
                >
                  {(option.icon) ? (
                    <Icon 
                      name={option.icon} 
                      size={20} 
                      color={currentValue === option.value ? '#FFFFFF' : actualTheme.colors.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                  ) : (option.emoji &&
                    <Text style={[
                      styles.selectOptionEmoji,
                      currentValue === option.value && styles.selectOptionTextSelected // Apply text color for selected
                    ]}>
                      {option.emoji}
                    </Text>
                  )}
                  <Text style={[
                    styles.selectOptionText,
                    currentValue === option.value && styles.selectOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Right chevron arrow */}
            {/* REMOVED: <TouchableOpacity
              style={styles.rightChevron}
              onPress={nextQuestion}
              disabled={isLoading}
            >
              <Icon name="chevron-right" size={24} color="#00E5E5" />
            </TouchableOpacity>*/}


          </View>
        );

      case 'multi_select':
        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <View style={styles.multiSelectContainer}>
            {question.options?.map((option, index) => (
              <MultiSelectButton
                key={index}
                field={question.field}
                value={option.value}
                label={option.label}
                emoji={option.emoji}
                icon={option.icon}
                currentValues={currentValues}
              />
            ))}
          </View>
        );



      case 'body_measurements_input':
        return (
          <View style={styles.bodyMeasurementsContainer}>
            {/* Height Row */}
            <View style={styles.measurementRow}>
              <View style={styles.measurementLabelContainer}>
                <Text style={styles.measurementLabel}>Height</Text>
              </View>
              <View style={styles.measurementInputsContainer}>
                <View style={styles.heightInputGroup}>
                  <Text style={styles.inputLabel}>Feet</Text>
                  <TextInput
                    style={styles.measurementInput}
                    placeholder=""
                    value={clientData.height_ft || ''}
                    onChangeText={(value) => updateClientData('height_ft', value)}
                    keyboardType="numeric"
                    maxLength={1}
                    blurOnSubmit={true}
                    returnKeyType="done"
                  />
                </View>
                <View style={styles.heightInputGroup}>
                  <Text style={styles.inputLabel}>Inches</Text>
                  <TextInput
                    style={styles.measurementInput}
                    placeholder=""
                    value={clientData.height_in || ''}
                    onChangeText={(value) => updateClientData('height_in', value)}
                    keyboardType="numeric"
                    maxLength={2}
                    blurOnSubmit={true}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            {/* Hip Size Row */}
            <View style={styles.measurementRow}>
              <View style={styles.measurementLabelContainer}>
                <Text style={styles.measurementLabel}>Hip Size</Text>
                <Text style={styles.measurementUnit}>(inches)</Text>
              </View>
              <View style={styles.measurementInputsContainer}>
                <TextInput
                  style={styles.measurementInput}
                  placeholder=""
                  value={clientData.hip || ''}
                  onChangeText={(value) => updateClientData('hip', value)}
                  keyboardType="numeric"
                  maxLength={3}
                  blurOnSubmit={true}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Waist Size Row */}
            <View style={styles.measurementRow}>
              <View style={styles.measurementLabelContainer}>
                <Text style={styles.measurementLabel}>Waist Size</Text>
                <Text style={styles.measurementUnit}>(inches)</Text>
              </View>
              <View style={styles.measurementInputsContainer}>
                <TextInput
                  style={styles.measurementInput}
                  placeholder=""
                  value={clientData.waist || ''}
                  onChangeText={(value) => updateClientData('waist', value)}
                  keyboardType="numeric"
                  maxLength={3}
                  blurOnSubmit={true}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Thigh Size Row */}
            <View style={styles.measurementRow}>
              <View style={styles.measurementLabelContainer}>
                <Text style={styles.measurementLabel}>Thigh Size</Text>
                <Text style={styles.measurementUnit}>(inches)</Text>
              </View>
              <View style={styles.measurementInputsContainer}>
                <TextInput
                  style={styles.measurementInput}
                  placeholder=""
                  value={clientData.thigh || ''}
                  onChangeText={(value) => updateClientData('thigh', value)}
                  keyboardType="numeric"
                  maxLength={3}
                  blurOnSubmit={true}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Bicep Size Row */}
            <View style={styles.measurementRow}>
              <View style={styles.measurementLabelContainer}>
                <Text style={styles.measurementLabel}>Bicep Size</Text>
                <Text style={styles.measurementUnit}>(inches)</Text>
              </View>
              <View style={styles.measurementInputsContainer}>
                <TextInput
                  style={styles.measurementInput}
                  placeholder=""
                  value={clientData.bicep || ''}
                  onChangeText={(value) => updateClientData('bicep', value)}
                  keyboardType="numeric"
                  maxLength={3}
                  blurOnSubmit={true}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
        );

      case 'workout_time_input':
        // Parse current time value to get hours, minutes, and AM/PM
        const parseTimeValue = (timeStr) => {
          if (!timeStr) return { hours: '', minutes: '', ampm: 'AM' };
          
          // Handle both 12-hour and 24-hour formats
          // First, try to match the format with AM/PM
          let timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            let ampm = timeMatch[3].toUpperCase();
            
            // Convert 24-hour to 12-hour if needed
            if (hours > 12) {
              hours = hours - 12;
              ampm = 'PM';
            } else if (hours === 0) {
              hours = 12;
              ampm = 'AM';
            }
            
            return { hours: hours.toString(), minutes, ampm };
          }
          
          // If no AM/PM found, try 24-hour format
          timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            let ampm = 'AM';
            
            // Convert 24-hour to 12-hour
            if (hours > 12) {
              hours = hours - 12;
              ampm = 'PM';
            } else if (hours === 0) {
              hours = 12;
              ampm = 'AM';
            }
            
            return { hours: hours.toString(), minutes, ampm };
          }
          
          return { hours: '', minutes: '', ampm: 'AM' };
        };

        // Initialize local state for this field if not exists
        const fieldKey = question.field;
        if (!localTimeInputs[fieldKey]) {
          const parsedTime = parseTimeValue(currentValue);
          setLocalTimeInputs(prev => ({
            ...prev,
            [fieldKey]: parsedTime
          }));
        }

        const currentTime = localTimeInputs[fieldKey] || parseTimeValue(currentValue);
        
        return (
          <View style={styles.workoutTimeContainer}>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>Hours</Text>
                <TextInput
                  ref={mealTimeHoursRef}
                  style={styles.timeInput}
                  placeholder=""
                  value={currentTime.hours}
                  onChangeText={(value) => {
                    // Only allow numeric input and limit to 1-12
                    const numericValue = value.replace(/[^0-9]/g, '');
                    let hours = numericValue;
                    if (hours && parseInt(hours) > 12) {
                      hours = '12';
                    }
                    
                    // Update local state first
                    const newLocalTime = { ...currentTime, hours };
                    setLocalTimeInputs(prev => ({
                      ...prev,
                      [fieldKey]: newLocalTime
                    }));
                    
                    // Update main state with formatted time string
                    const timeStr = `${newLocalTime.hours}:${newLocalTime.minutes} ${newLocalTime.ampm}`;
                    updateClientData(question.field, timeStr);
                  }}
                  onFocus={() => handleMealTimeInputFocus(mealTimeHoursRef)}
                  blurOnSubmit={true}
                  returnKeyType="done"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>Minutes</Text>
                <TextInput
                  ref={mealTimeMinutesRef}
                  style={styles.timeInput}
                  placeholder=""
                  value={currentTime.minutes}
                  onChangeText={(value) => {
                    // Only allow numeric input and limit to 0-59
                    const numericValue = value.replace(/[^0-9]/g, '');
                    let minutes = numericValue;
                    if (minutes && parseInt(minutes) > 59) {
                      minutes = '59';
                    }
                    
                    // Update local state first
                    const newLocalTime = { ...currentTime, minutes };
                    setLocalTimeInputs(prev => ({
                      ...prev,
                      [fieldKey]: newLocalTime
                    }));
                    
                    // Update main state with formatted time string
                    const timeStr = `${newLocalTime.hours}:${newLocalTime.minutes} ${newLocalTime.ampm}`;
                    updateClientData(question.field, timeStr);
                  }}
                  onFocus={() => handleMealTimeInputFocus(mealTimeMinutesRef)}
                  blurOnSubmit={true}
                  returnKeyType="done"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.ampmToggleContainer}>
                <Text style={styles.inputLabel}>AM/PM</Text>
                <View style={styles.ampmToggle}>
                  <TouchableOpacity
                    style={[
                      styles.ampmButton,
                      currentTime.ampm === 'AM' && styles.ampmButtonActive
                    ]}
                    onPress={() => {
                      const newLocalTime = { ...currentTime, ampm: 'AM' };
                      setLocalTimeInputs(prev => ({
                        ...prev,
                        [fieldKey]: newLocalTime
                      }));
                      const timeStr = `${newLocalTime.hours}:${newLocalTime.minutes} ${newLocalTime.ampm}`;
                      updateClientData(question.field, timeStr);
                    }}
                  >
                    <Text style={[
                      styles.ampmButtonText,
                      currentTime.ampm === 'AM' && styles.ampmButtonTextActive
                    ]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.ampmButton,
                      currentTime.ampm === 'PM' && styles.ampmButtonActive
                    ]}
                    onPress={() => {
                      const newLocalTime = { ...currentTime, ampm: 'PM' };
                      setLocalTimeInputs(prev => ({
                        ...prev,
                        [fieldKey]: newLocalTime
                      }));
                      const timeStr = `${newLocalTime.hours}:${newLocalTime.minutes} ${newLocalTime.ampm}`;
                      updateClientData(question.field, timeStr);
                    }}
                  >
                    <Text style={[
                      styles.ampmButtonText,
                      currentTime.ampm === 'PM' && styles.ampmButtonTextActive
                    ]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );

      case 'meal_time_input':
        // Parse current time value to get hours, minutes, and AM/PM
        const parseMealTimeValue = (timeStr) => {
          if (!timeStr) return { hours: '', minutes: '', ampm: 'AM' };
          
          // Handle both 12-hour and 24-hour formats
          // First, try to match the format with AM/PM
          let timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            let ampm = timeMatch[3].toUpperCase();
            
            // Convert 24-hour to 12-hour if needed
            if (hours > 12) {
              hours = hours - 12;
              ampm = 'PM';
            } else if (hours === 0) {
              hours = 12;
              ampm = 'AM';
            }
            
            return { hours: hours.toString(), minutes, ampm };
          }
          
          // If no AM/PM found, try 24-hour format
          timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            let ampm = 'AM';
            
            // Convert 24-hour to 12-hour
            if (hours > 12) {
              hours = hours - 12;
              ampm = 'PM';
            } else if (hours === 0) {
              hours = 12;
              ampm = 'AM';
            }
            
            return { hours: hours.toString(), minutes, ampm };
          }
          
          return { hours: '', minutes: '', ampm: 'AM' };
        };

        // Initialize local state for this field if not exists
        const mealFieldKey = question.field;
        if (!localTimeInputs[mealFieldKey]) {
          const parsedMealTime = parseMealTimeValue(currentValue);
          setLocalTimeInputs(prev => ({
            ...prev,
            [mealFieldKey]: parsedMealTime
          }));
        }

        const currentMealTime = localTimeInputs[mealFieldKey] || parseMealTimeValue(currentValue);
        
        return (
          <View style={styles.workoutTimeContainer}>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>Hours</Text>
                <TextInput
                  ref={mealTimeHoursRef}
                  style={styles.timeInput}
                  placeholder="6"
                  value={currentMealTime.hours}
                  onChangeText={(value) => {
                    // Only allow numeric input and limit to 1-12
                    const numericValue = value.replace(/[^0-9]/g, '');
                    let hours = numericValue;
                    if (hours && parseInt(hours) > 12) {
                      hours = '12';
                    }
                    
                    // Update local state first
                    const newLocalMealTime = { ...currentMealTime, hours };
                    setLocalTimeInputs(prev => ({
                      ...prev,
                      [mealFieldKey]: newLocalMealTime
                    }));
                    
                    // Update main state with formatted time string
                    const timeStr = `${newLocalMealTime.hours}:${newLocalMealTime.minutes} ${newLocalMealTime.ampm}`;
                    updateClientData(question.field, timeStr);
                  }}
                  onFocus={() => handleMealTimeInputFocus(mealTimeHoursRef)}
                  blurOnSubmit={true}
                  returnKeyType="done"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>Minutes</Text>
                <TextInput
                  ref={mealTimeMinutesRef}
                  style={styles.timeInput}
                  placeholder="00"
                  value={currentMealTime.minutes}
                  onChangeText={(value) => {
                    // Only allow numeric input and limit to 0-59
                    const numericValue = value.replace(/[^0-9]/g, '');
                    let minutes = numericValue;
                    if (minutes && parseInt(minutes) > 59) {
                      minutes = '59';
                    }
                    
                    // Update local state first
                    const newLocalMealTime = { ...currentMealTime, minutes };
                    setLocalTimeInputs(prev => ({
                      ...prev,
                      [mealFieldKey]: newLocalMealTime
                    }));
                    
                    // Update main state with formatted time string
                    const timeStr = `${newLocalMealTime.hours}:${newLocalMealTime.minutes} ${newLocalMealTime.ampm}`;
                    updateClientData(question.field, timeStr);
                  }}
                  onFocus={() => handleMealTimeInputFocus(mealTimeMinutesRef)}
                  blurOnSubmit={true}
                  returnKeyType="done"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.ampmToggleContainer}>
                <Text style={styles.inputLabel}>AM/PM</Text>
                <View style={styles.ampmToggle}>
                  <TouchableOpacity
                    style={[
                      styles.ampmButton,
                      currentMealTime.ampm === 'AM' && styles.ampmButtonActive
                    ]}
                    onPress={() => {
                      const newLocalMealTime = { ...currentMealTime, ampm: 'AM' };
                      setLocalTimeInputs(prev => ({
                        ...prev,
                        [mealFieldKey]: newLocalMealTime
                      }));
                      const timeStr = `${newLocalMealTime.hours}:${newLocalMealTime.minutes} ${newLocalMealTime.ampm}`;
                      updateClientData(question.field, timeStr);
                    }}
                  >
                    <Text style={[
                      styles.ampmButtonText,
                      currentMealTime.ampm === 'AM' && styles.ampmButtonTextActive
                    ]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.ampmButton,
                      currentMealTime.ampm === 'PM' && styles.ampmButtonActive
                    ]}
                    onPress={() => {
                      const newLocalMealTime = { ...currentMealTime, ampm: 'PM' };
                      setLocalTimeInputs(prev => ({
                        ...prev,
                        [mealFieldKey]: newLocalMealTime
                      }));
                      const timeStr = `${newLocalMealTime.hours}:${newLocalMealTime.minutes} ${newLocalMealTime.ampm}`;
                      updateClientData(question.field, timeStr);
                    }}
                  >
                    <Text style={[
                      styles.ampmButtonText,
                      currentMealTime.ampm === 'PM' && styles.ampmButtonTextActive
                    ]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );

      case 'time_picker':
        const formatDisplayTime = (timeString) => {
          console.log(`[formatDisplayTime] Input timeString for ${question.field}:`, timeString);
          if (!timeString) {
            console.log(`[formatDisplayTime] No timeString for ${question.field}, returning 'Set Time'`);
            return 'Set Time';
          }
          const [hours, minutes] = timeString.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const result = `${displayHour}:${minutes} ${ampm}`;
          console.log(`[formatDisplayTime] Formatted result for ${question.field}:`, result);
          return result;
        };

        const getTimeFromValue = (timeString) => {
          if (!timeString) return new Date();
          const [hours, minutes] = timeString.split(':');
          const date = new Date();
          date.setHours(parseInt(hours) || 0);
          date.setMinutes(parseInt(minutes) || 0);
          return date;
        };

        return (
          <View style={styles.timePickerContainer}>
            <TouchableOpacity
              style={[
                styles.timePickerButton,
                currentValue ? styles.timePickerButtonSelected : null
              ]}
              onPress={() => {
                // Create a temporary state for the time picker
                const tempTime = getTimeFromValue(currentValue);
                setClientData(prev => ({ ...prev, tempTimePicker: tempTime }));
                // Show time picker modal
                setShowTimePicker(true);
                setTimePickerField(question.field);
              }}
              activeOpacity={0.8}
            >
              {question.icon && (
                <Icon 
                  name={question.icon} 
                  size={24} 
                  color={currentValue ? '#FFFFFF' : '#64748B'} 
                  style={styles.timePickerIcon}
                />
              )}
              <View style={styles.timePickerContent}>
                <Text style={styles.timePickerLabel}>{question.title}</Text>
                <Text 
                  style={[
                    styles.timePickerValue,
                    currentValue ? styles.timePickerValueSelected : null
                  ]}
                >
                  {formatDisplayTime(currentValue)}
                </Text>
              </View>
              <Icon 
                name="clock" 
                size={16} 
                color={currentValue ? '#FFFFFF' : '#64748B'} 
              />
            </TouchableOpacity>
          </View>
        );

      case 'profile_picture_upload':
        // Display current profile picture from clientData or profilePictureUri
        const currentProfilePic = clientData.profile_picture_url || profilePictureUri;
        return (
          <View style={styles.profilePictureContainer}>
            {currentProfilePic ? (
              <Image source={{ uri: currentProfilePic }} style={styles.profilePicturePreview} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Icon name="user-circle" size={80} color="#9CA3AF" />
                <Text style={styles.profilePicturePlaceholderText}>No picture yet</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.profilePictureButton}
              onPress={async () => {
                setIsUploadingProfilePic(true);
                try {
                  const image = await getProfileImage({ source: 'camera' });
                  if (image) {
                    // Use the same filename format as ProfileScreen: clientId.jpg
                    const fileName = `${actualClientId || RNStorage.clientId}.jpg`;
                    console.log('[PersonalizedOnboardingScreen] Uploading with filename:', fileName);
                    const uploadResult = await uploadToSupabaseS3({
                      fileUri: image.uri,
                      fileName: fileName,
                      mimeType: 'image/jpeg',
                    });
                    if (uploadResult.success && uploadResult.url) {
                      // Add cache-busting timestamp to force immediate refresh
                      const timestamp = Date.now();
                      const refreshedUrl = `${uploadResult.url}?t=${timestamp}`;
                      setClientData(prev => ({ ...prev, profile_picture_url: refreshedUrl }));
                      setProfilePictureUri(refreshedUrl);
                      showToast('Profile picture uploaded!');
                    } else {
                      console.error('[PersonalizedOnboardingScreen] S3 upload failed:', uploadResult.error);
                      Alert.alert('Upload Failed', `Could not upload profile picture. Error: ${uploadResult.error?.message || uploadResult.error}`);
                    }
                  }
                } catch (error) {
                  console.error('[PersonalizedOnboardingScreen] Error uploading profile picture:', error);
                  Alert.alert('Upload Error', `An error occurred while uploading your profile picture: ${error.message}`);
                } finally {
                  setIsUploadingProfilePic(false);
                }
              }}
              disabled={isUploadingProfilePic}
            >
              {isUploadingProfilePic ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Icon name="camera" size={20} color="#000000" />
                  <Text style={styles.profilePictureButtonText}>Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profilePictureButton}
              onPress={async () => {
                setIsUploadingProfilePic(true);
                try {
                  const image = await getProfileImage({ source: 'library' });
                  if (image) {
                    // Use the same filename format as ProfileScreen: clientId.jpg
                    const fileName = `${actualClientId || RNStorage.clientId}.jpg`;
                    console.log('[PersonalizedOnboardingScreen] Uploading with filename:', fileName);
                    const uploadResult = await uploadToSupabaseS3({
                      fileUri: image.uri,
                      fileName: fileName,
                      mimeType: 'image/jpeg',
                    });
                    if (uploadResult.success && uploadResult.url) {
                      // Add cache-busting timestamp to force immediate refresh
                      const timestamp = Date.now();
                      const refreshedUrl = `${uploadResult.url}?t=${timestamp}`;
                      setClientData(prev => ({ ...prev, profile_picture_url: refreshedUrl }));
                      setProfilePictureUri(refreshedUrl);
                      showToast('Profile picture uploaded!');
                    } else {
                      console.error('[PersonalizedOnboardingScreen] S3 upload failed:', uploadResult.error);
                      Alert.alert('Upload Failed', `Could not upload profile picture. Error: ${uploadResult.error?.message || uploadResult.error}`);
                    }
                  }
                } catch (error) {
                  console.error('[PersonalizedOnboardingScreen] Error uploading profile picture:', error);
                  Alert.alert('Upload Error', `An error occurred while uploading your profile picture: ${error.message}`);
                } finally {
                  setIsUploadingProfilePic(false);
                }
              }}
              disabled={isUploadingProfilePic}
            >
              {isUploadingProfilePic ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Icon name="images" size={20} color="#000000" />
                  <Text style={styles.profilePictureButtonText}>Choose from Gallery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.unknownTypeContainer}>
            <Text style={styles.unknownTypeText}>Unknown question type: {question.type ? question.type : 'undefined'}</Text>
          </View>
        );
    }
  };

  // Close onboarding after completion
  const closeOnboarding = () => {
    try {
      console.log('=== CLOSING ONBOARDING START ===');
      // Navigate directly since we're using full screen now
      // Priority 1: Navigate to main tabs/homepage using navigate
      if (navigation && navigation.navigate) {
        try {
          navigation.navigate('MainTabs');
          return;
        } catch (navError) {
          try {
            navigation.navigate('Dashboard');
            return;
          } catch (dashError) {}
        }
      }
      if (navigation && navigation.reset) {
        try {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          return;
        } catch (resetError) {
          try {
            navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
            return;
          } catch (dashResetError) {}
        }
      }
      if (navigation && navigation.replace) {
        try {
          navigation.replace('MainTabs');
          return;
        } catch (replaceError) {
          try {
            navigation.replace('Dashboard');
            return;
          } catch (dashReplaceError) {}
        }
      }
      if (onComplete) {
        onComplete();
        return;
      }
      if (actualIsReviewMode && navigation && navigation.goBack) {
        navigation.goBack();
        return;
      }
      Alert.alert(
        'Onboarding Complete!',
        'Your profile has been set up successfully. You can now use all app features!',
        [
          {
            text: 'Go to Homepage',
            onPress: () => {
              if (navigation) {
                const tryNavigationMethods = [
                  () => navigation.navigate('MainTabs'),
                  () => navigation.navigate('Dashboard'),
                  () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }),
                  () => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] }),
                  () => navigation.replace('MainTabs'),
                  () => navigation.replace('Dashboard'),
                  () => navigation.goBack()
                ];
                for (const method of tryNavigationMethods) {
                  try { method(); return; } catch (err) {}
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Navigation Error',
        'There was an issue returning to the homepage. Please restart the app.',
        [
          { text: 'Restart App', onPress: () => {} },
          { text: 'Cancel' }
        ]
      );
    }
  };

  // Check if current question is final completion
  const isFinalCompletion = () => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    const result = currentQuestion?.type === 'final_completion';
    console.log('[isFinalCompletion] Current question index:', currentQuestionIndex);
    console.log('[isFinalCompletion] Current question type:', currentQuestion?.type);
    console.log('[isFinalCompletion] Current question id:', currentQuestion?.id);
    console.log('[isFinalCompletion] Is final completion:', result);
    return result;
  };

  // Check if current question should show skip button
  const shouldShowSkipButton = () => {
    return false; // Always return false to remove skip button
  };

  // Check if current question should show save & exit button
  const shouldShowSaveExitButton = () => {
    return false; // Always return false to remove secondary save & exit button
  };



  // Add logging to track filteredQuestions and currentQuestionIndex
  useEffect(() => {
    if (__DEV__) {
      console.log('Section Param:', sectionParam);
      console.log('Filtered questions count:', filteredQuestions.length);
      console.log('Current Question Index:', currentQuestionIndex);
    }
  }, [sectionParam, filteredQuestions, currentQuestionIndex]);

  // Helper to convert UTC time to local time for display
  // This function handles the conversion from UTC times stored in the database
  // back to the user's local timezone for display in the onboarding interface.
  // 
  // Flow: UTC (database) -> Local Time -> 12-hour format (display)
  // Example: "18:30:00" (UTC) -> "14:30:00" (EST) -> "2:30 PM" (display)
  const convertUTCToLocalForDisplay = (utcTime, date) => {
    if (!utcTime) return '';
    
    try {
      console.log(`[convertUTCToLocalForDisplay] Converting UTC time "${utcTime}" for date "${date}"`);
      
      // Convert UTC to local time
      const localTime = utcTimeToLocal(utcTime, date);
      console.log(`[convertUTCToLocalForDisplay] UTC "${utcTime}" -> Local "${localTime}"`);
      
      // Format for picker display (12-hour format) - inline formatting
      let formattedTime = '';
      if (localTime) {
        try {
          const [hoursStr, minutesStr] = localTime.split(':');
          let hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);

          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours === 0 ? 12 : hours; // the hour '0' should be '12'

          const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
          formattedTime = `${hours}:${formattedMinutes} ${ampm}`;
        } catch (e) {
          console.error('[convertUTCToLocalForDisplay] Error formatting time:', e);
          formattedTime = localTime; // Fallback to original
        }
      }
      console.log(`[convertUTCToLocalForDisplay] Local "${localTime}" -> Display "${formattedTime}"`);
      
      return formattedTime;
    } catch (error) {
      console.error(`[convertUTCToLocalForDisplay] Error converting UTC time "${utcTime}":`, error);
      // Fallback: try to format the UTC time directly
      try {
        const [hoursStr, minutesStr] = utcTime.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours === 0 ? 12 : hours;

        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${hours}:${formattedMinutes} ${ampm}`;
      } catch (e) {
        return utcTime; // Return original if all else fails
      }
    }
  };



  // Calculate completion percentage (excluding section intro/complete pages)
  const getCompletionPercentage = () => {
    if (!filteredQuestions) return 0;
    
    // Filter out section intro/complete pages for progress calculation
    const actualQuestions = filteredQuestions.filter(q => 
      q.type !== 'section_intro' && 
      q.type !== 'section_complete' && 
      q.type !== 'final_completion'
    );
    
    // Find current position among actual questions
    let actualCurrentIndex = 0;
    for (let i = 0; i <= currentQuestionIndex && i < filteredQuestions.length; i++) {
      const question = filteredQuestions[i];
      if (question.type !== 'section_intro' && 
          question.type !== 'section_complete' && 
          question.type !== 'final_completion') {
        if (i <= currentQuestionIndex) actualCurrentIndex++;
      }
    }
    
    return Math.round((actualCurrentIndex / Math.max(1, actualQuestions.length)) * 100);
  };

  // Create dynamic styles using theme
  const dynamicStyles = {
    progressFillModern: {
      height: 8,
      backgroundColor: actualTheme.colors.primary,
      borderRadius: 4,
    },
    progressPercentage: {
      fontSize: 18,
      fontWeight: '700',
      color: actualTheme.colors.textPrimary,
    },
    progressLabel: {
      fontSize: 12,
      color: actualTheme.colors.textSecondary,
      fontWeight: '500',
    },
    stepCounter: {
      fontSize: 14,
      color: actualTheme.colors.textSecondary,
      fontWeight: '500',
    },

    questionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: actualTheme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    questionContextClose: {
      fontSize: 15,
      color: actualTheme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 10,
      marginBottom: 16,
      maxWidth: '90%',
      alignSelf: 'center',
    },

    backButtonText: {
      color: actualTheme.colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    continueButtonText: {
      color: actualTheme.colors.textOnPrimary,
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
    },
    continueButton: {
      backgroundColor: actualTheme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120,
      shadowColor: actualTheme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    saveExitText: {
      color: actualTheme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    textInput: {
      minHeight: 120,
      textAlignVertical: 'top',
      padding: 20,
      borderRadius: 16,
      backgroundColor: `${actualTheme.colors.backgroundSecondary}80`,
      color: actualTheme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
      borderWidth: 1,
      borderColor: actualTheme.colors.border,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: `${actualTheme.colors.backgroundSecondary}80`,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: actualTheme.colors.border,
    },
    optionButtonSelected: {
      backgroundColor: `${actualTheme.colors.primary}20`,
      borderColor: actualTheme.colors.primary,
    },
    optionButtonText: {
      fontSize: 16,
      color: actualTheme.colors.textPrimary,
      fontWeight: '500',
      flex: 1,
    },
    optionButtonTextSelected: {
      color: actualTheme.colors.primary,
      fontWeight: '600',
    },
  };

  // Move UI up when keyboard is open only on text input questions
  const isTextInputQuestion =
    filteredQuestions?.[currentQuestionIndex]?.type === 'text' ||
    filteredQuestions?.[currentQuestionIndex]?.type === 'text_input' ||
    filteredQuestions?.[currentQuestionIndex]?.type === 'meal_time_input' ||
    filteredQuestions?.[currentQuestionIndex]?.type === 'workout_time_input' ||
    filteredQuestions?.[currentQuestionIndex]?.type === 'body_measurements_input';

  // Ref to main ScrollView for programmatic scrolling
  const scrollViewRef = useRef(null);
  // Ref to the current TextInput (only for free-text questions)
  const textInputRef = useRef(null);
  // Refs for meal time inputs
  const mealTimeHoursRef = useRef(null);
  const mealTimeMinutesRef = useRef(null);
  const [textInputY, setTextInputY] = useState(0);

  // Ensure free-text input area stays fully visible when focused
  const handleTextInputFocus = () => {
    setTimeout(() => {
      if (scrollViewRef.current && textInputRef.current) {
        // Calculate optimal scroll position to keep input and continue button visible
        const screenHeight = Dimensions.get('window').height;
        const actualKeyboardHeight = keyboardHeight || screenHeight * 0.4; // Use actual keyboard height or fallback
        const headerHeight = 120; // Approximate header height
        const footerHeight = 100; // Approximate footer height
        
        // Get current question to determine input height
        const currentQuestion = filteredQuestions?.[currentQuestionIndex];
        const isAgeInput = currentQuestion?.field === 'age';
        const inputHeight = isAgeInput ? 30 : 60; // Smaller height for age input
        const buttonHeight = 60; // Approximate continue button height
        
        // Calculate the visible area above the keyboard
        const visibleAreaHeight = screenHeight - actualKeyboardHeight - headerHeight - footerHeight;
        
        // Calculate offset to ensure continue button is at least 100px above keyboard
        // We need to position the input higher so the continue button has enough space
        const buttonSpaceNeeded = 100; // Minimum space needed for continue button above keyboard
        const inputPosition = visibleAreaHeight - buttonSpaceNeeded - buttonHeight - 20; // 20px buffer
        
        // Check if this is the specific_outcome question (Question 8) and reduce movement by 220px total
        // Check if this is the previous_training question (Question 14) and reduce movement by 125px total
        // Check if this is the injuries_limitations question (Question 19) and reduce movement by 80px total
        // Check if this is the food_allergies question (Question 25) and reduce movement by 100px total
        // Check if this is the gastric_issues question (Question 27) and reduce movement by 125px total
        // Check if this is the supplements question (Question 28) and reduce movement by 125px total
        const currentQuestionField = filteredQuestions?.[currentQuestionIndex];
        const isSpecificOutcome = currentQuestionField?.field === 'specific_outcome';
        const isPreviousTraining = currentQuestionField?.field === 'previous_training';
        const isInjuries = currentQuestionField?.field === 'injuries_limitations';
        const isFoodAllergies = currentQuestionField?.field === 'food_allergies';
        const isGastricIssues = currentQuestionField?.field === 'gastric_issues';
        const isSupplements = currentQuestionField?.field === 'supplements';
        const baseOffset = Math.max(350, inputPosition);
        let optimalOffset = baseOffset;
        
        if (isSpecificOutcome) {
          optimalOffset = Math.max(130, baseOffset - 220);
        } else if (isPreviousTraining) {
          optimalOffset = Math.max(150, baseOffset - 125);
        } else if (isInjuries) {
          optimalOffset = Math.max(150, baseOffset - 125);
        } else if (isFoodAllergies) {
          optimalOffset = Math.max(140, baseOffset - 125);
        } else if (isGastricIssues) {
          optimalOffset = Math.max(140, baseOffset - 125);
        } else if (isSupplements) {
          optimalOffset = Math.max(140, baseOffset - 125);
        }
        
        scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
          findNodeHandle(textInputRef.current),
          optimalOffset,
          true
        );
      }
    }, 150); // allow keyboard animation to begin
  };

  // Ensure meal time input area stays fully visible when focused
  const handleMealTimeInputFocus = (inputRef) => {
    setTimeout(() => {
      if (scrollViewRef.current && inputRef?.current) {
        // Calculate optimal scroll position to keep input visible but not too high
        const screenHeight = Dimensions.get('window').height;
        const actualKeyboardHeight = keyboardHeight || screenHeight * 0.4; // Use actual keyboard height or fallback
        const headerHeight = 120; // Approximate header height
        const footerHeight = 100; // Approximate footer height
        const buttonHeight = 60; // Approximate continue button height
        
        // Calculate the visible area above the keyboard
        const visibleAreaHeight = screenHeight - actualKeyboardHeight - headerHeight - footerHeight;
        
        // Calculate offset to ensure continue button is at least 100px above keyboard
        // We need to position the input higher so the continue button has enough space
        const buttonSpaceNeeded = 100; // Minimum space needed for continue button above keyboard
        const inputPosition = visibleAreaHeight - buttonSpaceNeeded - buttonHeight - 20; // 20px buffer
        const optimalOffset = Math.max(230, inputPosition);
        
        scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
          findNodeHandle(inputRef.current),
          optimalOffset,
          true
        );
      }
    }, 150); // allow keyboard animation to begin
  };



  // Arm idle nudge when question changes
  useEffect(() => {
    try { botRef.current?.armIdleNudge(); } catch (e) {}
  }, [currentQuestionIndex]);

  // showBottomToast removed

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={actualTheme.colors.backgroundPrimary} />
      {/* Floating assistant bot overlay */}
      <OnboardingAssistantBot
        ref={botRef}
        trainerImageUri={trainerAvatarUri || profilePictureUri}
        trainerName={(clientData?.trainer_name) || 'Coach Assistant'}
        enabled={true}
        anchor={'right'}
        position={'top'}
        topOffset={90}
        showTipBubble={false}
        buildContext={() => buildOnboardingContext({
          currentQuestion: filteredQuestions?.[currentQuestionIndex],
          allQuestions: onboardingQuestions,
          clientData,
          completionPercent: getCompletionPercentage?.() || 0,
        })}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 10}
        enabled={isTextInputQuestion}
      >
      <LinearGradient 
        colors={[actualTheme.colors.backgroundPrimary, actualTheme.colors.backgroundSecondary, actualTheme.colors.backgroundTertiary]} 
        style={styles.fullScreenGradient}
      >
        <SafeAreaView style={styles.professionalSafeArea}>
          {/* Confetti overlay removed */}
          {/* Milestone banner removed per requirement */}

          {/* Progress celebration animation removed */}
          {/* Bottom toast removed */}
          {/* Progress Header */}
          <View style={[styles.progressHeaderModern, { paddingVertical: 22 }]}> 
            <View style={styles.progressInfo}>
              <Text style={dynamicStyles.progressPercentage}>{getCompletionPercentage()}%</Text>
              <Text style={dynamicStyles.progressLabel}>Complete</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    dynamicStyles.progressFillModern, 
                    { width: `${getCompletionPercentage()}%` }
                  ]} 
                />
              </View>
            </View>
            <Text style={dynamicStyles.stepCounter}>
              Question {(() => {
                if (!filteredQuestions) return '1';
                const actualQuestions = filteredQuestions.filter(q => 
                  q.type !== 'section_intro' && 
                  q.type !== 'section_complete' && 
                  q.type !== 'final_completion'
                );
                let actualCurrentIndex = 0;
                for (let i = 0; i <= currentQuestionIndex && i < filteredQuestions.length; i++) {
                  const question = filteredQuestions[i];
                  if (question.type !== 'section_intro' && 
                      question.type !== 'section_complete' && 
                      question.type !== 'final_completion') {
                    if (i <= currentQuestionIndex) actualCurrentIndex++;
                  }
                }
                return actualCurrentIndex;
              })()} of {filteredQuestions?.filter(q => 
                q.type !== 'section_intro' && 
                q.type !== 'section_complete' && 
                q.type !== 'final_completion'
              ).length || 0}
            </Text>
          </View>
          {/* Coach tip bubble moved under title (not in header) */}

          {/* Main Content */}
          <View style={styles.mainContent}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.contentScrollView}
              contentContainerStyle={styles.contentScrollViewContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderContent()}
            </ScrollView>
          </View>

          {/* Navigation Footer */}
          <View style={styles.navigationFooter}>
            <View style={styles.navigationButtons}>
              {currentQuestionIndex > 0 && (
                <TouchableOpacity 
                  style={styles.backButtonModern}
                  onPress={previousQuestion}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Icon name="chevron-left" size={20} color="#64748B" />
                  <Text style={dynamicStyles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              {isFinalCompletion() ? (
                <TouchableOpacity 
                  style={dynamicStyles.continueButton}
                  onPress={() => {
                    // Close onboarding and go back to app
                    if (navigation && navigation.goBack) {
                      navigation.goBack();
                    } else if (navigation && navigation.replace) {
                      navigation.replace('MainTabs');
                    } else if (onComplete) {
                      onComplete();
                    }
                  }}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={dynamicStyles.continueButtonText}>Complete</Text>
                      <Icon name="check" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={dynamicStyles.continueButton}
                  onPress={() => {
                    // success haptic on next
                    try {
                      const H = require('react-native-haptic-feedback');
                      H?.trigger?.('impactLight', { enableVibrateFallback: true });
                    } catch (_) { try { const EH = require('expo-haptics'); EH?.impactAsync?.(EH.ImpactFeedbackStyle?.Light ?? 1); } catch (_) {} }
                    nextQuestion();
                  }}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={dynamicStyles.continueButtonText}>Continue</Text>
                      <Icon name="chevron-right" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            {/* Save & Exit option for non-final steps */}
            {!isFinalCompletion() && (
              <TouchableOpacity 
                style={styles.saveExitButton}
                onPress={saveAndExit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Icon name="bookmark" size={14} color="#64748B" />
                <Text style={dynamicStyles.saveExitText}>Save & Continue Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {/* Toast notification removed */}
      </LinearGradient>
      </KeyboardAvoidingView>
      
      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={clientData.tempTimePicker || new Date()}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onTimeChange}
        />
      )}
      
      {/* Save & Exit Confirmation Modal */}
      <Modal
        visible={showSaveExitConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveExitConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationHeader}>
              <Icon name="question-circle" size={24} color="#F59E0B" />
              <Text style={styles.confirmationTitle}>Save & Continue Later?</Text>
            </View>
            
            <Text style={styles.confirmationMessage}>
              Your progress will be saved and you can continue from where you left off later. Are you sure you want to exit now?
            </Text>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSaveExitConfirmation(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmedSaveAndExit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Save & Exit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Results Modal - Temporarily removed
      <OnboardingResultsModal
        isVisible={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        clientData={clientData}
        onComplete={() => {
          if (onComplete) {
            onComplete();
          } else if (navigation && navigation.goBack) {
            navigation.goBack();
          } else {
            navigation.replace('MainTabs');
          }
        }}
      /> */}
    </>
  );
};

const styles = StyleSheet.create({
  // Main Layout
  fullScreenGradient: {
    flex: 1,
  },
  professionalSafeArea: {
    flex: 1,
  },
  
  // Progress Header
  progressHeaderModern: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  progressInfo: {
    alignItems: 'flex-start',
  },
  progressPercentage: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFillModern: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  stepCounter: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  headerTipContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerTipChip: {
    maxWidth: '70%',
    backgroundColor: 'rgba(28,37,65,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  headerTipText: { color: '#fff', fontSize: 12 },
  
  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  professionalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  contentScrollView: {
    flex: 1,
  },
  contentScrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    marginTop: -15,
  },
  
  // Navigation Footer
  navigationFooter: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    paddingTop: 10,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 44,
  },
  backButtonModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 100,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 140,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  saveExitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  saveExitText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmationModal: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#374151',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  confirmationMessage: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6B7280',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Content Area Styles
  questionContainer: {
    padding: 24,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  questionHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  questionIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  questionContextClose: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  questionInputContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },

  // Section Styles
  sectionIntroContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sectionIntroAvatarWrapper: {
    marginBottom: 12,
  },
  sectionIntroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sectionIntroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  sectionIntroEmoji: {
    fontSize: 36,
  },
  sectionIntroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionIntroText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },

  sectionCompleteContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sectionCompleteIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  sectionCompleteAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  sectionCompleteEmoji: {
    fontSize: 36,
  },
  sectionCompleteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionCompleteText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },

  finalCompletionContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  finalCompletionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  finalCompletionEmoji: {
    fontSize: 40,
  },
  finalCompletionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCompletionText: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  finalCompletionSubtext: {
    fontSize: 16,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Input Styles
  textInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  textInputWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  textInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textInputMultiline: {
    minHeight: 120,
  },
  textInputAge: {
    minHeight: 50, // 50% of the original 100px height
  },

  // Picker Styles
  pickerContainer: {
    width: '100%',
    marginBottom: 24,
  },
  pickerWrapper: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)', // Neutral background for picker
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  picker: {
    height: 200,
    width: '100%',
    color: '#0A84FF', // Neon blue for selected item text
    backgroundColor: 'transparent', // Transparent background
  },
  pickerItem: {
    height: 200,
    fontSize: 18,
    color: '#0A84FF', // Neon blue for selected item text (iOS)
    textAlign: 'center',
  },

  // Select Styles
  selectContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 60,
  },
  selectOptionSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  selectOptionEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  selectOptionText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  selectOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Multi-select Styles
  multiSelectContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  multiSelectOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 110,
  },
  multiSelectOptionSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  multiSelectContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  multiSelectIcon: {
    marginBottom: 8,
  },
  multiSelectEmoji: {
    fontSize: 16,
    marginBottom: 8,
  },
  multiSelectText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  multiSelectTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  multiSelectButtonDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  multiSelectEmojiDisabled: {
    opacity: 0.4,
  },
  multiSelectTextDisabled: {
    color: '#64748B',
  },

  // Option Button Styles
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionButtonSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  optionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Multi-select Button Styles
  multiSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  multiSelectButtonSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  multiSelectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  multiSelectButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },



  // Body Measurements Styles
  bodyMeasurementsContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  measurementLabelContainer: {
    flex: 0.4,
    paddingRight: 16,
  },
  measurementLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  measurementUnit: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  measurementInputsContainer: {
    flex: 0.6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heightInputGroup: {
    width: '48%',
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  measurementInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    minWidth: 60,
    flex: 1,
  },

  // Workout Time Input Styles
  workoutTimeContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  timeInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    minWidth: 60,
  },
  ampmToggleContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  ampmToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  ampmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmButtonActive: {
    backgroundColor: '#0A84FF',
  },
  ampmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  ampmButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Time Picker Styles
  timePickerContainer: {
    marginBottom: 24,
  },
  timePickerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timePickerButtonSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  timePickerIcon: {
    marginRight: 16,
  },
  timePickerContent: {
    flex: 1,
  },
  timePickerLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 4,
  },
  timePickerValue: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerValueSelected: {
    color: '#FFFFFF',
  },

  // Profile Picture Styles
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePicturePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profilePicturePlaceholder: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#94A3B8',
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profilePicturePlaceholderText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
  profilePictureButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  profilePictureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Utility Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
  },
  unknownTypeContainer: {
    padding: 32,
    alignItems: 'center',
  },
  unknownTypeText: {
    color: '#94A3B8',
    fontSize: 16,
  },


  // Toast styles removed

  // Legacy chevron styles (hidden but preserved for compatibility)
  leftChevron: {
    opacity: 0,
    position: 'absolute',
    left: -1000,
  },
  rightChevron: {
    opacity: 0,
    position: 'absolute',
    right: -1000,
  },
  // Legacy content container (kept for compatibility)
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },





});

export default PersonalizedOnboardingScreen; 