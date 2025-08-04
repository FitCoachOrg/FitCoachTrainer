# Supabase Auth Integration

## Overview
This document explains our authentication architecture using Supabase Auth for secure password management while storing trainer profile data in a separate trainer table.

## Architecture

### **Authentication Layer (Supabase Auth)**
- **Purpose**: Secure password management and user authentication
- **Features**: Password hashing, session management, password reset, OAuth
- **Data**: User credentials, authentication metadata

### **Profile Layer (Trainer Table)**
- **Purpose**: Trainer-specific profile and business data
- **Features**: Business information, certifications, specialties, rates
- **Data**: All trainer profile data (NO passwords)

## Database Schema

### **Supabase Auth (Managed by Supabase)**
```sql
-- This is managed automatically by Supabase Auth
auth.users {
  id: UUID PRIMARY KEY,
  email: TEXT UNIQUE,
  encrypted_password: TEXT, -- Hashed by Supabase
  email_confirmed_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### **Trainer Table (Our Custom Table)**
```sql
-- Our trainer profile data (NO passwords)
trainer {
  id: UUID PRIMARY KEY,
  trainer_email: TEXT UNIQUE, -- Links to auth.users.email
  trainer_name: TEXT,
  phone: VARCHAR(20),
  date_of_birth: DATE,
  business_name: VARCHAR(255),
  website: VARCHAR(255),
  experience_years: INTEGER,
  profile_picture_url: TEXT,
  certifications: JSONB,
  certification_files: TEXT[],
  specialties: TEXT[],
  client_populations: TEXT[],
  service_offerings: TEXT[],
  session_rate: DECIMAL(10,2),
  package_rates_available: BOOLEAN,
  online_training_rate: DECIMAL(10,2),
  availability_days: INTEGER[],
  preferred_hours: VARCHAR(50),
  profile_completion_percentage: INTEGER,
  is_active: BOOLEAN,
  terms_accepted: BOOLEAN,
  privacy_accepted: BOOLEAN,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

## Account Creation Flow

### **Step 1: Create Supabase Auth Account**
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: trainerData.email,
  password: trainerData.password, // Supabase handles hashing
  options: {
    data: {
      full_name: `${trainerData.firstName} ${trainerData.lastName}`,
      user_type: 'trainer'
    }
  }
});
```

### **Step 2: Create Trainer Profile Record**
```typescript
const { error: trainerError } = await supabase
  .from('trainer')
  .insert([{
    trainer_email: trainerData.email, // Links to auth.users.email
    trainer_name: `${trainerData.firstName} ${trainerData.lastName}`,
    // ... other trainer fields
    // NO password field - handled by Supabase Auth
  }]);
```

## Login Flow

### **Step 1: Authenticate with Supabase Auth**
```typescript
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});
```

### **Step 2: Fetch Trainer Profile**
```typescript
const { data: trainerData, error: trainerError } = await supabase
  .from('trainer')
  .select('*')
  .eq('trainer_email', authData.user.email)
  .single();
```

## Security Benefits

### **1. Password Security**
- ✅ **Supabase handles hashing** - Industry-standard bcrypt
- ✅ **No plain text passwords** - Never stored in our database
- ✅ **Automatic security updates** - Supabase maintains security
- ✅ **Rate limiting** - Built-in protection against brute force

### **2. Data Separation**
- ✅ **Authentication data** → Supabase Auth (secure)
- ✅ **Profile data** → Trainer table (our control)
- ✅ **Clear separation** - Different security requirements

### **3. Compliance**
- ✅ **GDPR compliant** - Clear data separation
- ✅ **Industry standards** - Follows authentication best practices
- ✅ **Audit trails** - Supabase provides authentication logs

## Error Handling

### **Orphaned Account Detection**
```typescript
if (authError.message.includes('already registered')) {
  // Check if trainer record exists
  const { data: existingTrainer } = await supabase
    .from('trainer')
    .select('trainer_email')
    .eq('trainer_email', email)
    .single();

  if (existingTrainer) {
    // Complete account - redirect to login
    navigate('/login');
  } else {
    // Orphaned Auth account - show specific message
    toast({
      title: "Account Issue Detected",
      description: "An account exists but is incomplete. Please contact support.",
      variant: "destructive",
    });
  }
}
```

## Migration from Dual Password Storage

### **Before (Insecure)**
```typescript
// Storing password in both systems
const trainerRecord = {
  trainer_email: email,
  trainer_password: password, // ❌ Plain text in our database
  // ... other fields
};
```

### **After (Secure)**
```typescript
// Only Supabase Auth handles passwords
const trainerRecord = {
  trainer_email: email,
  // NO password field - ✅ Handled by Supabase Auth
  // ... other fields
};
```

## Row Level Security (RLS)

### **Trainer Table Policies**
```sql
-- Trainers can only access their own data
CREATE POLICY "Trainers can view own profile" ON trainer
  FOR SELECT USING (trainer_email = auth.jwt() ->> 'email');

CREATE POLICY "Trainers can update own profile" ON trainer
  FOR UPDATE USING (trainer_email = auth.jwt() ->> 'email');
```

## Benefits of This Approach

### **1. Security**
- Industry-standard password hashing
- No plain text passwords in our database
- Built-in security features from Supabase

### **2. Features**
- Password reset functionality
- Email verification
- OAuth integration (Google, GitHub, etc.)
- Session management

### **3. Maintenance**
- Less custom code to maintain
- Automatic security updates
- Proven authentication patterns

### **4. User Experience**
- Standard authentication flows
- Familiar login/logout behavior
- Built-in error handling

## Summary

By using Supabase Auth for authentication and our trainer table for profile data:

1. **Security**: Passwords are securely hashed and managed by Supabase
2. **Simplicity**: Less custom authentication code to maintain
3. **Features**: Get password reset, OAuth, etc. for free
4. **Standards**: Follow industry best practices
5. **Separation**: Clear separation of concerns between auth and profile data

This approach provides enterprise-level security while maintaining simplicity and user experience. 