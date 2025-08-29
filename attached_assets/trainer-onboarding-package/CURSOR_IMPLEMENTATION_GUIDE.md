# Cursor Implementation Guide: Trainer-Side Onboarding

## Overview
This guide provides step-by-step instructions for implementing the trainer-side personalized onboarding system using the provided package. The system includes all 41 questions from the original client onboarding, displayed on a single screen with collapsible sections.

## Prerequisites
- Node.js (v14 or higher)
- React development environment
- Supabase project with database access
- Basic knowledge of React and JavaScript

## Step 1: Database Setup

### 1.1 Run Database Migration
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Run the complete migration script from database-setup/client-table-migration.sql
-- This creates all necessary columns in the client table
```

### 1.2 Verify Database Schema
After running the migration, verify that your `client` table has all required columns:

```sql
-- Check if all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'client' 
  AND column_name IN (
    'cl_age', 'cl_height', 'cl_weight', 'cl_sex', 'cl_activity_level',
    'cl_primary_goal', 'specific_outcome', 'goal_timeline', 'obstacles',
    'confidence_level', 'training_experience', 'previous_training',
    'training_days_per_week', 'training_time_per_session', 'training_location',
    'available_equipment', 'injuries_limitations', 'focus_areas',
    'eating_habits', 'diet_preferences', 'food_allergies',
    'preferred_meals_per_day', 'wake_time', 'bed_time', 'bf_time',
    'lunch_time', 'dinner_time', 'snack_time', 'workout_time', 'workout_days',
    'sleep_hours', 'cl_stress', 'cl_gastric_issues', 'cl_supplements',
    'motivation_style', 'onboarding_completed', 'onboarding_progress'
  )
ORDER BY column_name;
```

## Step 2: Project Setup

### 2.1 Install Dependencies
```bash
npm install @supabase/supabase-js react react-dom react-scripts
```

### 2.2 Environment Configuration
Create a `.env` file in your project root:

```env
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2.3 File Structure
Copy the following files from the package to your project:

```
src/
├── components/
│   ├── TrainerOnboardingScreen.jsx
│   └── QuestionComponents.jsx
├── data/
│   └── onboardingQuestions.js
├── utils/
│   ├── supabaseClient.js
│   ├── onboardingUtils.js
│   └── targetCalculations.js
└── styles/
    └── onboardingStyles.css
```

## Step 3: Component Integration

### 3.1 Basic Usage
```jsx
import React from 'react';
import TrainerOnboardingScreen from './src/components/TrainerOnboardingScreen';

function App() {
  const handleComplete = (data) => {
    console.log('Onboarding completed:', data);
    // Navigate to dashboard or show success message
  };

  const handleSave = (data) => {
    console.log('Progress saved:', data);
  };

  const handleError = (error) => {
    console.error('Onboarding error:', error);
    // Show error message to user
  };

  return (
    <div className="App">
      <TrainerOnboardingScreen 
        clientId="your-client-id"
        onComplete={handleComplete}
        onSave={handleSave}
        onError={handleError}
        showProgress={true}
        autoSave={true}
        saveInterval={2000}
      />
    </div>
  );
}

export default App;
```

### 3.2 Advanced Integration with Routing
```jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useParams } from 'react-router-dom';
import TrainerOnboardingScreen from './src/components/TrainerOnboardingScreen';

function OnboardingPage() {
  const { clientId } = useParams();
  
  const handleComplete = (data) => {
    // Navigate to client dashboard
    window.location.href = `/client/${clientId}/dashboard`;
  };

  return (
    <TrainerOnboardingScreen 
      clientId={clientId}
      onComplete={handleComplete}
    />
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/onboarding/:clientId" element={<OnboardingPage />} />
        <Route path="/client/:clientId/dashboard" element={<ClientDashboard />} />
      </Routes>
    </Router>
  );
}
```

## Step 4: Customization

### 4.1 Styling Customization
Modify `src/styles/onboardingStyles.css` to match your application's design:

```css
/* Custom color scheme */
:root {
  --primary-color: #your-primary-color;
  --secondary-color: #your-secondary-color;
  --success-color: #your-success-color;
  --error-color: #your-error-color;
}

/* Update button colors */
.btn-primary {
  background-color: var(--primary-color);
}

.btn-secondary {
  background-color: var(--secondary-color);
}
```

### 4.2 Question Customization
Modify `src/data/onboardingQuestions.js` to add, remove, or modify questions:

```javascript
// Add a new question
{
  id: 'custom_question',
  section: 'Custom Section',
  title: 'Your custom question?',
  type: 'text',
  field: 'custom_field',
  placeholder: 'Enter your answer...',
  required: true
}

// Modify existing question
{
  id: 'cl_age',
  section: 'Personal Information',
  title: 'What is your age?', // Updated title
  type: 'text',
  field: 'cl_age',
  placeholder: 'Enter your age in years',
  keyboardType: 'numeric',
  maxLength: 3,
  required: true
}
```

### 4.3 Validation Customization
Modify validation rules in `src/utils/onboardingUtils.js`:

```javascript
// Add custom validation
export const validateFormData = (formData) => {
  const errors = {};

  // Custom validation for age
  if (formData.cl_age) {
    const age = parseInt(formData.cl_age);
    if (age < 13 || age > 100) {
      errors.cl_age = 'Age must be between 13 and 100';
    }
  }

  // Custom validation for weight
  if (formData.cl_weight) {
    const weight = parseFloat(formData.cl_weight);
    if (weight < 30 || weight > 300) {
      errors.cl_weight = 'Weight must be between 30 and 300 kg';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## Step 5: Target Calculations

### 5.1 Automatic Calculations
The system automatically calculates the following when onboarding is completed:

- **BMR** (Basal Metabolic Rate)
- **Calorie Targets** (based on activity level and goals)
- **Macro Targets** (protein, carbs, fats)
- **Hydration Targets** (based on weight and activity)
- **Workout Targets** (based on training days)
- **BMI** (Body Mass Index)

### 5.2 Custom Calculation Logic
Modify `src/utils/targetCalculations.js` to customize calculation formulas:

```javascript
// Custom BMR calculation
export const calculateBMR = (weight, height, age, sex) => {
  // Use Katch-McArdle formula for more accuracy
  const bodyFatPercentage = 15; // Default, could be a question
  const leanMass = weight * (1 - bodyFatPercentage / 100);
  const bmr = 370 + (21.6 * leanMass);
  return Math.round(bmr);
};
```

## Step 6: Error Handling

### 6.1 Database Error Handling
```javascript
const handleError = (error) => {
  if (error.code === 'PGRST116') {
    // No rows returned - client doesn't exist
    alert('Client not found. Please check the client ID.');
  } else if (error.code === '23505') {
    // Unique constraint violation
    alert('This client already exists.');
  } else {
    // Generic error
    alert('An error occurred. Please try again.');
  }
};
```

### 6.2 Network Error Handling
```javascript
const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    alert('No internet connection. Please check your connection and try again.');
  } else {
    alert('Network error. Please try again.');
  }
};
```

## Step 7: Testing

### 7.1 Unit Tests
Create test files for components:

```javascript
// src/components/__tests__/TrainerOnboardingScreen.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainerOnboardingScreen from '../TrainerOnboardingScreen';

test('renders onboarding form', () => {
  render(<TrainerOnboardingScreen clientId="test-client" />);
  expect(screen.getByText('Client Onboarding')).toBeInTheDocument();
});

test('shows progress bar', () => {
  render(<TrainerOnboardingScreen clientId="test-client" showProgress={true} />);
  expect(screen.getByText('0% Complete')).toBeInTheDocument();
});
```

### 7.2 Integration Tests
```javascript
// src/utils/__tests__/targetCalculations.test.js
import { calculateBMR, calculateTDEE } from '../targetCalculations';

test('calculates BMR correctly', () => {
  const bmr = calculateBMR(70, 170, 30, 'male');
  expect(bmr).toBeGreaterThan(0);
  expect(bmr).toBeLessThan(3000);
});

test('calculates TDEE correctly', () => {
  const tdee = calculateTDEE(1500, 'active');
  expect(tdee).toBe(2325); // 1500 * 1.55
});
```

## Step 8: Deployment

### 8.1 Build for Production
```bash
npm run build
```

### 8.2 Environment Variables for Production
Set production environment variables:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
NODE_ENV=production
```

### 8.3 Deployment Checklist
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] Supabase RLS policies set up
- [ ] Build completed successfully
- [ ] Tests passing
- [ ] Error handling implemented
- [ ] Loading states working
- [ ] Responsive design tested

## Step 9: Monitoring and Analytics

### 9.1 Track Onboarding Completion
```javascript
// Add analytics tracking
const handleComplete = (data) => {
  // Track completion
  analytics.track('onboarding_completed', {
    clientId: data.client_id,
    completionTime: Date.now(),
    sectionsCompleted: Object.keys(data).length
  });
  
  // Navigate to dashboard
  window.location.href = `/client/${data.client_id}/dashboard`;
};
```

### 9.2 Error Tracking
```javascript
const handleError = (error) => {
  // Track errors
  analytics.track('onboarding_error', {
    error: error.message,
    clientId: clientId,
    timestamp: Date.now()
  });
  
  // Show user-friendly message
  alert('An error occurred. Please try again.');
};
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase URL and API key
   - Check RLS policies
   - Ensure client table exists

2. **Form Validation Errors**
   - Check required field validation
   - Verify data types match database schema
   - Test with sample data

3. **Target Calculation Errors**
   - Ensure all required fields are present
   - Check calculation formulas
   - Verify database permissions

4. **Styling Issues**
   - Check CSS file import
   - Verify class names match
   - Test responsive design

### Debug Mode
Enable debug logging:

```javascript
// Add to supabaseClient.js
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Supabase client initialized');
  console.log('Database operations:', { clientId, data });
}
```

## Support

For additional support:
1. Check the README.md file
2. Review the database schema
3. Test with sample data
4. Check browser console for errors
5. Verify Supabase dashboard logs

## Summary

This implementation provides a complete trainer-side onboarding system with:
- All 41 questions from the original client onboarding
- Single-screen interface with collapsible sections
- Real-time progress tracking
- Automatic data saving
- Target calculations (BMR, calories, macros, etc.)
- Responsive design
- Error handling
- Validation
- Accessibility features

The system is designed to be easily customizable and maintainable while providing the same functionality as the original client-side onboarding.
