import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';
import { createTrainerAccount, uploadTrainerProfilePicture } from '@/lib/trainer-account-service';
import { Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  User, 
  UserPlus,
  Award, 
  Target, 
  Briefcase, 
  Shield,
  CheckCircle,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface TrainerData {
  // Step 1: Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  businessName: string;
  website: string;
  experienceYears: number;
  profilePicture: File | null;
  
  // Step 2: Certifications
  certifications: string[];
  certificationFiles: File[];
  
  // Step 3: Specialties
  specialties: string[];
  clientPopulations: string[];
  
  // Step 4: Business Info
  serviceOfferings: string[];
  sessionRate: number;
  packageRatesAvailable: boolean;
  onlineTrainingRate: number;
  availabilityDays: number[];
  preferredHours: string;
  
  // Step 5: Account Creation
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

const TrainerRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  
  // Load saved progress from localStorage
  const loadSavedProgress = (): { step: number; data: TrainerData } => {
    try {
      const saved = localStorage.getItem('trainerRegistrationProgress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          step: parsed.step || 1,
          data: {
            ...parsed.data,
            profilePicture: null, // File objects can't be serialized
            certificationFiles: [], // File arrays can't be serialized
            // Ensure passwords are always empty when loading from localStorage
            password: '',
            confirmPassword: ''
          }
        };
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
    return {
      step: 1,
      data: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        businessName: '',
        website: '',
        experienceYears: 0,
        profilePicture: null,
        certifications: [],
        certificationFiles: [],
        specialties: [],
        clientPopulations: [],
        serviceOfferings: [],
        sessionRate: 0,
        packageRatesAvailable: false,
        onlineTrainingRate: 0,
        availabilityDays: [],
        preferredHours: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
        privacyAccepted: false,
      }
    };
  };

  const [currentStep, setCurrentStep] = useState(() => loadSavedProgress().step);
  const [loading, setLoading] = useState(false);
  const [emailValidating, setEmailValidating] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [trainerData, setTrainerData] = useState<TrainerData>(() => loadSavedProgress().data);
  
  // Check if there's saved progress and show notification
  React.useEffect(() => {
    const saved = localStorage.getItem('trainerRegistrationProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step > 1) {
          toast({
            title: "Progress Restored",
            description: `Welcome back! Your registration progress has been restored. You're on step ${parsed.step} of 6.`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error checking saved progress:', error);
      }
    }
  }, []);

  // Function to check for orphaned Auth accounts (Auth exists but no database record)
  const checkForOrphanedAccount = async (email: string) => {
    try {
      // This would require admin access, so we'll use a different approach
      // Check if the email exists in the trainer table
      const { data: trainerRecord, error: trainerError } = await supabase
        .from('trainer')
        .select('trainer_email')
        .eq('trainer_email', email)
        .single();

      if (trainerError && trainerError.code === 'PGRST116') {
        // No database record found, but Auth account might exist
        return {
          hasDatabaseRecord: false,
          message: "Email not found in database"
        };
      } else if (trainerRecord) {
        return {
          hasDatabaseRecord: true,
          message: "Email already registered"
        };
      }
    } catch (error) {
      console.error('Error checking for orphaned account:', error);
    }
    
    return {
      hasDatabaseRecord: false,
      message: "Unknown status"
    };
  };

  // Function to clear stuck registration state
  const clearStuckRegistration = () => {
    localStorage.removeItem('trainerRegistrationProgress');
    setAccountCreated(false);
    setAccountUserId(null);
    setCurrentStep(1);
    setTrainerData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      businessName: '',
      website: '',
      experienceYears: 0,
      profilePicture: null,
      certifications: [],
      certificationFiles: [],
      specialties: [],
      clientPopulations: [],
      serviceOfferings: [],
      sessionRate: 0,
      packageRatesAvailable: false,
      onlineTrainingRate: 0,
      availabilityDays: [],
      preferredHours: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      privacyAccepted: false,
    });
    
    toast({
      title: "Registration Reset",
      description: "Registration has been reset. You can start fresh.",
      variant: "default",
    });
  };

  const steps = [
    { id: 1, title: 'Account Setup', icon: <User className="h-4 w-4" /> },
    { id: 2, title: 'Profile Information', icon: <UserPlus className="h-4 w-4" /> },
    { id: 3, title: 'Certifications', icon: <Award className="h-4 w-4" /> },
    { id: 4, title: 'Specialties', icon: <Target className="h-4 w-4" /> },
    { id: 5, title: 'Business Info', icon: <Briefcase className="h-4 w-4" /> },
    { id: 6, title: 'Terms & Conditions', icon: <Shield className="h-4 w-4" /> },
  ];

  // Track if account has been created
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountUserId, setAccountUserId] = useState<string | null>(null);

  const certificationOptions = [
    'Personal Trainer Certification',
    'Strength & Conditioning',
    'Nutrition Coach',
    'Yoga Instructor',
    'Pilates Instructor',
    'CrossFit Level 1',
    'ACE Certified',
    'NASM Certified',
    'ISSA Certified',
    'Other'
  ];

  const specialtyOptions = [
    'Weight Loss',
    'Muscle Building',
    'Cardiovascular Fitness',
    'Flexibility & Mobility',
    'Sports Performance',
    'Rehabilitation',
    'Senior Fitness',
    'Prenatal/Postnatal',
    'Nutrition Coaching',
    'Mindfulness & Wellness'
  ];

  const clientPopulationOptions = [
    'Beginners',
    'Intermediate',
    'Advanced',
    'Athletes',
    'Seniors',
    'Pregnant Women',
    'Post-Injury',
    'Weight Loss',
    'Muscle Building',
    'General Fitness'
  ];

  const serviceOfferingOptions = [
    'One-on-One Training',
    'Group Classes',
    'Online Coaching',
    'Nutrition Planning',
    'Fitness Assessments',
    'Progress Tracking',
    'Custom Workout Plans',
    'Recovery Sessions'
  ];

  const availabilityOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  // Save progress to localStorage (excluding sensitive data)
  const saveProgress = (step: number, data: TrainerData) => {
    try {
      const progressData = {
        step,
        data: {
          // Only save non-sensitive form data
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          businessName: data.businessName,
          website: data.website,
          experienceYears: data.experienceYears,
          profilePicture: null, // Don't save file objects
          certifications: data.certifications,
          certificationFiles: [], // Don't save file arrays
          specialties: data.specialties,
          clientPopulations: data.clientPopulations,
          serviceOfferings: data.serviceOfferings,
          sessionRate: data.sessionRate,
          packageRatesAvailable: data.packageRatesAvailable,
          onlineTrainingRate: data.onlineTrainingRate,
          availabilityDays: data.availabilityDays,
          preferredHours: data.preferredHours,
          termsAccepted: data.termsAccepted,
          privacyAccepted: data.privacyAccepted,
          // DO NOT save passwords in localStorage
          password: '',
          confirmPassword: ''
        },
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('trainerRegistrationProgress', JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const updateField = (field: keyof TrainerData, value: any) => {
    setTrainerData(prev => {
      const updated = { ...prev, [field]: value };
      saveProgress(currentStep, updated);
      
      // Update database record if account is created
      if (accountCreated && trainerData.email) {
        updateDatabaseRecord(updated);
      }
      
      return updated;
    });
  };

  // Function to update database record progressively
  const updateDatabaseRecord = async (data: TrainerData) => {
    if (!accountCreated || !trainerData.email) return;

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Update based on current step
      if (currentStep >= 2) {
        // Profile Information
        if (data.phone) updateData.phone = data.phone;
        if (data.dateOfBirth) updateData.date_of_birth = data.dateOfBirth;
        if (data.businessName) updateData.business_name = data.businessName;
        if (data.website) updateData.website = data.website;
        if (data.experienceYears) updateData.experience_years = data.experienceYears;
        
        // Handle profile picture upload
        if (data.profilePicture && data.profilePicture instanceof File) {
          console.log('📸 Uploading profile picture during progressive update...');
          const profilePictureUrl = await uploadTrainerProfilePicture(data.profilePicture, trainerData.email);
          if (profilePictureUrl) {
            updateData.profile_picture_url = profilePictureUrl;
            console.log('✅ Profile picture uploaded and URL updated');
          } else {
            console.warn('⚠️  Profile picture upload failed during progressive update');
          }
        }
      }

      if (currentStep >= 3) {
        // Certifications
        if (data.certifications.length > 0) updateData.certifications = data.certifications;
        if (data.certificationFiles.length > 0) {
          updateData.certification_files = data.certificationFiles.map(f => f.name);
        }
      }

      if (currentStep >= 4) {
        // Specialties
        if (data.specialties.length > 0) updateData.specialties = data.specialties;
        if (data.clientPopulations.length > 0) updateData.client_populations = data.clientPopulations;
      }

      if (currentStep >= 5) {
        // Business Info
        if (data.serviceOfferings.length > 0) updateData.service_offerings = data.serviceOfferings;
        if (data.sessionRate) updateData.session_rate = data.sessionRate;
        if (data.packageRatesAvailable !== undefined) updateData.package_rates_available = data.packageRatesAvailable;
        if (data.onlineTrainingRate) updateData.online_training_rate = data.onlineTrainingRate;
        if (data.availabilityDays.length > 0) updateData.availability_days = data.availabilityDays;
        if (data.preferredHours) updateData.preferred_hours = data.preferredHours;
      }

      if (currentStep >= 6) {
        // Terms & Conditions
        if (data.termsAccepted !== undefined) updateData.terms_accepted = data.termsAccepted;
        if (data.privacyAccepted !== undefined) updateData.privacy_accepted = data.privacyAccepted;
      }

      // Update profile completion percentage
      updateData.profile_completion_percentage = calculateProfileCompletion();

      // Update the database record
      const { error } = await supabase
        .from('trainer')
        .update(updateData)
        .eq('trainer_email', trainerData.email);

      if (error) {
        console.error('Error updating database record:', error);
      }
    } catch (error) {
      console.error('Error updating database record:', error);
    }
  };

  const validateEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setEmailValidating(true);
    try {
      // Check if email already exists in trainer table
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainer')
        .select('trainer_email')
        .eq('trainer_email', email)
        .single();

      if (trainerError && trainerError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking trainer table:', trainerError);
        toast({
          title: "Error",
          description: "Failed to validate email. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Email exists in trainer table
      if (trainerData) {
        setEmailExists(true);
        toast({
          title: "Email Already Exists",
          description: "This email is already registered. Please use a different email or try logging in.",
          variant: "destructive",
        });
        return;
      }

      // Email is available (not in trainer table)
      setEmailExists(false);
      toast({
        title: "Email Available",
        description: "This email is available for registration.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error validating email:', error);
      toast({
        title: "Error",
        description: "Failed to validate email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEmailValidating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    updateField('certificationFiles', [...trainerData.certificationFiles, ...files]);
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateField('profilePicture', file);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = trainerData.certificationFiles.filter((_, i) => i !== index);
    updateField('certificationFiles', newFiles);
  };

  const toggleArrayField = (field: keyof TrainerData, value: any) => {
    const currentArray = trainerData[field] as any[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateField(field, newArray);
  };

  const nextStep = async () => {
    // Validate step 1 requirements
    if (currentStep === 1) {
      if (!trainerData.firstName || !trainerData.lastName || !trainerData.email || !trainerData.password || !trainerData.confirmPassword) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields marked with *",
          variant: "destructive",
        });
        return;
      }
      
      if (emailExists) {
        toast({
          title: "Email Already Exists",
          description: "Please use a different email address or validate your current email",
          variant: "destructive",
        });
        return;
      }
      
      if (trainerData.password.length < 8) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }
      
      if (trainerData.password !== trainerData.confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure both passwords match",
          variant: "destructive",
        });
        return;
      }
      
      if (!trainerData.email.includes('@')) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      // Create account after Step 1 validation
      if (!accountCreated) {
        setLoading(true);
        try {
          console.log('🚀 Starting account creation with transaction handling...');
          
          const result = await createTrainerAccount({
            email: trainerData.email,
            password: trainerData.password,
            firstName: trainerData.firstName,
            lastName: trainerData.lastName,
            phone: trainerData.phone,
            dateOfBirth: trainerData.dateOfBirth,
            businessName: trainerData.businessName,
            website: trainerData.website,
            experienceYears: trainerData.experienceYears,
            profilePicture: trainerData.profilePicture
          });

          if (result.success) {
            setAccountCreated(true);
            setAccountUserId(result.authUserId);
            
            toast({
              title: "Account Created Successfully!",
              description: "Your account has been created with proper transaction handling. Continue filling out your profile.",
              variant: "default",
            });
          } else {
            // Handle specific error cases
            if (result.error?.includes('already registered')) {
              toast({
                title: "Account Already Exists",
                description: "This email is already registered. Please try logging in instead.",
                variant: "destructive",
              });
              localStorage.removeItem('trainerRegistrationProgress');
              navigate('/login');
              return;
            } else if (result.rollbackPerformed) {
              toast({
                title: "Account Creation Failed",
                description: "Account creation failed and was properly rolled back. Please try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Error Creating Account",
                description: result.error || "An error occurred while creating your account.",
                variant: "destructive",
              });
            }
            return;
          }
        } catch (error: any) {
          console.error('Error creating account:', error);
          toast({
            title: "Error Creating Account",
            description: error.message || "An error occurred while creating your account.",
            variant: "destructive",
          });
          return;
        } finally {
          setLoading(false);
        }
      }
    }
    
    if (currentStep < 6) {
      const nextStepNumber = currentStep + 1;
      setCurrentStep(nextStepNumber);
      saveProgress(nextStepNumber, trainerData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prevStepNumber = currentStep - 1;
      setCurrentStep(prevStepNumber);
      saveProgress(prevStepNumber, trainerData);
    }
  };

  const handleSubmit = async () => {
    if (!trainerData.termsAccepted || !trainerData.privacyAccepted) {
      toast({
        title: "Terms and Privacy Policy",
        description: "Please accept both the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Final update to database with terms acceptance
      const { error: updateError } = await supabase
        .from('trainer')
        .update({
          terms_accepted: trainerData.termsAccepted,
          privacy_accepted: trainerData.privacyAccepted,
          profile_completion_percentage: 100,
          updated_at: new Date().toISOString()
        })
        .eq('trainer_email', trainerData.email);

      if (updateError) {
        console.error('Error updating final record:', updateError);
        toast({
          title: "Error Completing Registration",
          description: "Failed to complete registration. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Clear saved progress
      localStorage.removeItem('trainerRegistrationProgress');
      
      // Show success message and redirect to welcome page
      toast({
        title: "Registration Complete!",
        description: "Welcome to CoachEZ! You can now log in to your dashboard.",
        variant: "default",
      });

      // Navigate directly to trainer welcome page
      navigate('/trainer-welcome');
    } catch (error: any) {
      console.error('Final registration error:', error);
      toast({
        title: "Error completing registration",
        description: error.message || "An error occurred while completing registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 0;

    // Basic info (required)
    total += 3; // firstName, lastName, email
    if (trainerData.firstName) completed++;
    if (trainerData.lastName) completed++;
    if (trainerData.email) completed++;

    // Optional fields
    if (trainerData.phone) completed++;
    if (trainerData.dateOfBirth) completed++;
    if (trainerData.businessName) completed++;
    if (trainerData.website) completed++;
    if (trainerData.experienceYears) completed++;
    if (trainerData.certifications.length > 0) completed++;
    if (trainerData.specialties.length > 0) completed++;
    if (trainerData.clientPopulations.length > 0) completed++;
    if (trainerData.serviceOfferings.length > 0) completed++;
    if (trainerData.sessionRate) completed++;
    if (trainerData.onlineTrainingRate) completed++;
    if (trainerData.availabilityDays.length > 0) completed++;
    if (trainerData.preferredHours) completed++;

    total += 12; // optional fields

    return Math.round((completed / total) * 100);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg text-white font-semibold mb-2">Account Setup</h3>
              <p className="text-gray-300">Let's start by creating your account credentials</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white font-medium">First Name *</Label>
                <Input
                  id="firstName"
                  value={trainerData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white font-medium">Last Name *</Label>
                <Input
                  id="lastName"
                  value={trainerData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-white font-medium">Email Address *</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={trainerData.email}
                  onChange={(e) => {
                    updateField('email', e.target.value);
                    setEmailExists(false); // Reset validation state
                  }}
                  className={`flex-1 ${emailExists ? 'border-red-500' : ''}`}
                  placeholder="your.email@example.com"
                  required
                />
                <Button
                  type="button"
                  onClick={() => validateEmail(trainerData.email)}
                  disabled={emailValidating || !trainerData.email || !trainerData.email.includes('@')}
                  className="px-4 bg-blue-600 hover:bg-blue-700"
                >
                  {emailValidating ? 'Checking...' : 'Check'}
                </Button>
              </div>
              {emailExists && (
                <p className="text-red-400 text-sm mt-1">
                  This email is already registered. Please use a different email.
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white font-medium">Password *</Label>
              <Input
                id="password"
                type="password"
                value={trainerData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a strong password"
                required
              />
              <p className="text-gray-400 text-sm mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={trainerData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
              />
              {trainerData.password && trainerData.confirmPassword && trainerData.password !== trainerData.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg text-white font-semibold mb-2">Profile Information</h3>
              <p className="text-gray-300">Tell us more about yourself and your business</p>
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-white font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={trainerData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth" className="text-white font-medium">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={trainerData.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessName" className="text-white font-medium">Business Name</Label>
              <Input
                id="businessName"
                value={trainerData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                placeholder="Your Fitness Business"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-white font-medium">Website</Label>
              <Input
                id="website"
                type="url"
                value={trainerData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label htmlFor="experienceYears" className="text-white font-medium">Years of Experience</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                value={trainerData.experienceYears}
                onChange={(e) => updateField('experienceYears', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="profilePicture" className="text-white font-medium">Profile Picture</Label>
              <div className="mt-2">
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a professional photo (JPG, PNG - Max 5MB)
                </p>
                {trainerData.profilePicture && (
                  <div className="mt-3">
                    <img 
                      src={URL.createObjectURL(trainerData.profilePicture)} 
                      alt="Profile preview" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-white font-medium">Certifications (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {certificationOptions.map((cert) => (
                  <div key={cert} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <span className="text-white font-medium">{cert}</span>
                    <button
                      onClick={() => toggleArrayField('certifications', cert)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        trainerData.certifications.includes(cert)
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          trainerData.certifications.includes(cert)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white font-medium">Upload Certification Files (Optional)</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Accepted formats: PDF, JPG, PNG (Max 5MB each)
                </p>
              </div>
              {trainerData.certificationFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {trainerData.certificationFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-white font-medium">Training Specialties (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {specialtyOptions.map((specialty) => (
                  <div key={specialty} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <span className="text-white font-medium">{specialty}</span>
                    <button
                      onClick={() => toggleArrayField('specialties', specialty)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        trainerData.specialties.includes(specialty)
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          trainerData.specialties.includes(specialty)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white font-medium">Client Populations (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {clientPopulationOptions.map((population) => (
                  <div key={population} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <span className="text-white font-medium">{population}</span>
                    <button
                      onClick={() => toggleArrayField('clientPopulations', population)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        trainerData.clientPopulations.includes(population)
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          trainerData.clientPopulations.includes(population)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-white font-medium">Service Offerings (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {serviceOfferingOptions.map((service) => (
                  <div key={service} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <span className="text-white font-medium">{service}</span>
                    <button
                      onClick={() => toggleArrayField('serviceOfferings', service)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        trainerData.serviceOfferings.includes(service)
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          trainerData.serviceOfferings.includes(service)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionRate" className="text-white font-medium">Session Rate ($)</Label>
                <Input
                  id="sessionRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={trainerData.sessionRate}
                  onChange={(e) => updateField('sessionRate', parseFloat(e.target.value) || 0)}
                  placeholder="75.00"
                />
              </div>
              <div>
                <Label htmlFor="onlineTrainingRate" className="text-white font-medium">Online Training Rate ($)</Label>
                <Input
                  id="onlineTrainingRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={trainerData.onlineTrainingRate}
                  onChange={(e) => updateField('onlineTrainingRate', parseFloat(e.target.value) || 0)}
                  placeholder="50.00"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="packageRates"
                checked={trainerData.packageRatesAvailable}
                onCheckedChange={(checked) => updateField('packageRatesAvailable', checked)}
              />
              <Label htmlFor="packageRates" className="text-white font-medium">I offer package rates</Label>
            </div>
            <div>
              <Label className="text-white font-medium">Availability Days (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {availabilityOptions.map((day) => (
                  <div key={day.value} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <span className="text-white font-medium text-sm">{day.label}</span>
                    <button
                      onClick={() => toggleArrayField('availabilityDays', day.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        trainerData.availabilityDays.includes(day.value)
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          trainerData.availabilityDays.includes(day.value)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="preferredHours" className="text-white font-medium">Preferred Hours</Label>
              <Input
                id="preferredHours"
                value={trainerData.preferredHours}
                onChange={(e) => updateField('preferredHours', e.target.value)}
                placeholder="e.g., 6 AM - 8 PM"
              />
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg text-white font-semibold mb-2">Terms & Conditions</h3>
              <p className="text-gray-300">Please review and accept our terms to complete your registration</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex-1">
                  <span className="text-white font-medium">
                    I accept the <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Terms of Service</a> *
                  </span>
                </div>
                <button
                  onClick={() => updateField('termsAccepted', !trainerData.termsAccepted)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    trainerData.termsAccepted
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      trainerData.termsAccepted
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex-1">
                  <span className="text-white font-medium">
                    I accept the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Privacy Policy</a> *
                  </span>
                </div>
                <button
                  onClick={() => updateField('privacyAccepted', !trainerData.privacyAccepted)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    trainerData.privacyAccepted
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      trainerData.privacyAccepted
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 pt-24 pb-8">
      {/* Theme Toggle and Clear Progress */}
      <div className="absolute top-28 right-6 z-50">
        <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme('light')}
            className={`px-3 py-1 text-xs ${theme === 'light' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Light
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 text-xs ${theme === 'dark' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Dark
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme('system')}
            className={`px-3 py-1 text-xs ${theme === 'system' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            System
          </Button>
          <div className="w-px h-6 bg-slate-600"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all progress and start over?')) {
                clearStuckRegistration();
              }
            }}
            className="px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            Clear
          </Button>
          {accountCreated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the entire registration? This will clear the account and all progress.')) {
                  clearStuckRegistration();
                }
              }}
              className="px-3 py-1 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="bg-slate-800/90 border-slate-700 shadow-xl">
          <CardHeader>
                      <CardTitle className="text-2xl text-white text-center">
            Coach<span className="text-green-500">EZ</span> SignUp
          </CardTitle>
          <CardDescription className="text-gray-300 text-center">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </CardDescription>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <Progress value={(currentStep / steps.length) * 100} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step.id 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                                       <div className={`w-16 h-0.5 mx-2 ${
                     currentStep > step.id ? 'bg-green-600' : 'bg-gray-600'
                   }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
                             <Button
                 variant="outline"
                 onClick={prevStep}
                 disabled={currentStep === 1}
                 className="border-gray-600 text-gray-400 hover:bg-gray-700"
               >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && (!trainerData.firstName || !trainerData.lastName || !trainerData.email || !trainerData.password || !trainerData.confirmPassword)) ||
                    (currentStep === 5 && (!trainerData.termsAccepted || !trainerData.privacyAccepted))
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {currentStep === 1 ? (loading ? "Creating Account..." : "Create Account & Continue") : "Next"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Completing Registration..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainerRegistration; 