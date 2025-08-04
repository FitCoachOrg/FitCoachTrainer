# Comprehensive RLS Strategy for FitCoachTrainer

## 🎯 **Current Table Structure & Relationships**

### **Core Tables:**
1. **`trainer`** - Trainer profiles and authentication
2. **`client`** - Client profiles and data
3. **`trainer_client_web`** - Many-to-many relationship between trainers and clients
4. **`activity_info`** - Client activity data (linked to client_id)
5. **`meal_info`** - Client meal data (linked to client_id)
6. **`client_engagement_score`** - Client engagement metrics (linked to client_id)

### **Data Flow:**
```
Trainer (auth.uid()) 
  ↓ (via trainer_client_web)
Client 
  ↓ (via client_id)
Activity Info, Meal Info, Engagement Scores
```

## 🔐 **Recommended RLS Strategy**

### **Approach 1: Relationship-Based Access Control (RECOMMENDED)**

This approach uses the `trainer_client_web` table as the central access control mechanism.

#### **Core Principle:**
- **Trainers can only access data for clients they have relationships with**
- **All access is controlled through the `trainer_client_web` table**
- **Uses `auth.uid()` to identify the authenticated trainer**

#### **RLS Policies:**

```sql
-- 1. TRAINER TABLE POLICIES
-- Trainers can view their own profile
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (trainer_email = auth.uid()::text);

-- Trainers can update their own profile
CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (trainer_email = auth.uid()::text);

-- 2. TRAINER_CLIENT_WEB TABLE POLICIES
-- Trainers can view their client relationships
CREATE POLICY "Trainers can view their client relationships" ON trainer_client_web
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can create relationships for themselves
CREATE POLICY "Trainers can create their client relationships" ON trainer_client_web
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update their client relationships
CREATE POLICY "Trainers can update their client relationships" ON trainer_client_web
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete their client relationships
CREATE POLICY "Trainers can delete their client relationships" ON trainer_client_web
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- 3. CLIENT TABLE POLICIES
-- Trainers can view clients they have relationships with
CREATE POLICY "Trainers can view their clients" ON client
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can create clients (for themselves)
CREATE POLICY "Trainers can create clients" ON client
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update clients they have relationships with
CREATE POLICY "Trainers can update their clients" ON client
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete clients they have relationships with
CREATE POLICY "Trainers can delete their clients" ON client
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- 4. ACTIVITY_INFO TABLE POLICIES
-- Trainers can view activity data for their clients
CREATE POLICY "Trainers can view their clients activity" ON activity_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can create activity data for their clients
CREATE POLICY "Trainers can create their clients activity" ON activity_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update activity data for their clients
CREATE POLICY "Trainers can update their clients activity" ON activity_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete activity data for their clients
CREATE POLICY "Trainers can delete their clients activity" ON activity_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- 5. MEAL_INFO TABLE POLICIES
-- Trainers can view meal data for their clients
CREATE POLICY "Trainers can view their clients meals" ON meal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can create meal data for their clients
CREATE POLICY "Trainers can create their clients meals" ON meal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update meal data for their clients
CREATE POLICY "Trainers can update their clients meals" ON meal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete meal data for their clients
CREATE POLICY "Trainers can delete their clients meals" ON meal_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- 6. CLIENT_ENGAGEMENT_SCORE TABLE POLICIES
-- Trainers can view engagement scores for their clients
CREATE POLICY "Trainers can view their clients engagement" ON client_engagement_score
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can create engagement scores for their clients
CREATE POLICY "Trainers can create their clients engagement" ON client_engagement_score
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update engagement scores for their clients
CREATE POLICY "Trainers can update their clients engagement" ON client_engagement_score
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete engagement scores for their clients
CREATE POLICY "Trainers can delete their clients engagement" ON client_engagement_score
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );
```

## 🚀 **Implementation Strategy**

### **Phase 1: Enable RLS on All Tables**
```sql
-- Enable RLS on all tables
ALTER TABLE trainer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
```

### **Phase 2: Create Comprehensive Policies**
```sql
-- Create all policies (use the comprehensive policy set above)
-- This ensures proper access control for all tables
```

### **Phase 3: Create Relationships**
```sql
-- Create trainer-client relationships for existing data
-- Use CREATE_TRAINER_CLIENT_RELATIONSHIPS.sql
```

### **Phase 4: Test and Verify**
```sql
-- Test access patterns
-- Verify trainers can only see their clients' data
-- Ensure no data leakage between trainers
```

## 🔍 **Alternative Approaches**

### **Approach 2: Simple Authentication-Based Access**
```sql
-- Simple but less secure - allows all authenticated users
CREATE POLICY "Allow authenticated access" ON trainer_client_web
    FOR ALL USING (auth.uid() IS NOT NULL);
```

### **Approach 3: Role-Based Access Control**
```sql
-- More complex but scalable for future roles
CREATE POLICY "Role-based access" ON trainer_client_web
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'trainer' OR
        auth.jwt() ->> 'role' = 'admin'
    );
```

## ✅ **Recommendation**

**Use Approach 1 (Relationship-Based Access Control)** because:

1. **✅ Secure**: Trainers can only access their own clients' data
2. **✅ Scalable**: Works with any number of trainers and clients
3. **✅ Flexible**: Easy to add new data types
4. **✅ Maintainable**: Clear access control logic
5. **✅ Future-proof**: Supports complex relationships

## 🛠 **Implementation Steps**

1. **Create the comprehensive RLS policies** (use the SQL above)
2. **Create trainer-client relationships** for existing data
3. **Test the access patterns** thoroughly
4. **Monitor for any access issues** and adjust policies as needed

This approach ensures that each trainer can only access data for clients they have explicit relationships with, providing strong security while maintaining flexibility. 