# Engagement Score Calculation Analysis

## 📊 **How Engagement Score is Calculated**

### **Formula:**
```
Engagement Score = (Completed Tasks / Total Tasks Due) × 100
```

### **Example from Your Data:**
- **Client 48 (Chris)** on 2025-08-02:
  - Total Tasks Due: 2
  - Completed Tasks: 0
  - **Engagement Score: (0/2) × 100 = 0%**

- **Client 34 (Vikas Malik)** on 2025-06-26:
  - Total Tasks Due: 2
  - Completed Tasks: 1
  - **Engagement Score: (1/2) × 100 = 50%**

## 🎯 **Types of Tasks Included in Engagement Score**

Based on your schedule data, the following task types are included:

### **1. Workout Tasks** 💪
- **Type**: `workout`
- **Examples**: 
  - "Lower Body, 30min"
  - "Full Body, 30min"
- **Status Values**: `completed`, `overdue`, `null`
- **Impact**: High engagement value

### **2. Wake Up Tasks** 🌅
- **Type**: `wakeup`
- **Examples**:
  - "Record your sleep data"
- **Status Values**: `completed`, `null`
- **Impact**: Daily routine tracking

### **3. Bed Time Tasks** 😴
- **Type**: `bedtime`
- **Examples**:
  - "Time to wind down! No screen time!"
  - "Good Night Vikas! Time to wind down!"
- **Status Values**: `completed`, `overdue`, `null`
- **Impact**: Sleep hygiene tracking

### **4. Custom Tasks** 💧
- **Type**: `custom`
- **Examples**:
  - "Water Intake" (type: hydration)
- **Status Values**: `completed`, `null`
- **Impact**: Personalized health goals

## 📋 **Task Status Analysis**

### **Status Values Found:**
1. **`completed`** ✅ - Counted as completed task
2. **`overdue`** ⏰ - Counted as due but not completed
3. **`null`** ❓ - Counted as due but not completed

### **Status Distribution in Your Data:**
- **`overdue`**: 3 tasks (all for client 34)
- **`null`**: 7 tasks (various clients)
- **`completed`**: 0 tasks in current sample

## 🔍 **Detailed Task Breakdown**

### **Client 34 (Vikas Malik) - Most Active:**
```
📅 2025-07-27: Bed Time (overdue)
📅 2025-06-13: workout - Lower Body, 30min (overdue)
📅 2025-06-14: workout - Full Body, 30min (overdue)
📅 2025-06-20: Bed Time (overdue)
```

### **Client 48 (Chris) - Recent Activity:**
```
📅 2025-08-02: Wake Up (null) + Bed Time (null)
📅 2025-07-08: Wake Up (null)
📅 2025-07-09: Wake Up (null)
```

### **Client 36 (Manav Malik) - Custom Tasks:**
```
📅 2025-10-19: Water Intake (null)
📅 2025-10-20: Water Intake (null)
📅 2025-07-08: Wake Up (null)
```

## 🎯 **Engagement Score Examples**

### **High Engagement (100%):**
- Client 34 on 2025-06-03: 2/2 tasks completed = 100%

### **Medium Engagement (67%):**
- Client 34 on 2025-06-04: 2/3 tasks completed = 67%

### **Low Engagement (50%):**
- Client 34 on 2025-06-26: 1/2 tasks completed = 50%

### **No Engagement (0%):**
- Client 48 on 2025-08-02: 0/2 tasks completed = 0%

## 📊 **Task Categories by Engagement Value**

### **High Value Tasks:**
1. **Workouts** 💪 - Primary fitness activities
2. **Custom Health Tasks** 💧 - Personalized goals

### **Medium Value Tasks:**
1. **Wake Up** 🌅 - Daily routine tracking
2. **Bed Time** 😴 - Sleep hygiene

### **All Tasks Count Equally:**
Currently, all task types count equally in the engagement score calculation.

## 🔧 **Calculation Logic**

### **Step-by-Step Process:**
1. **Get all schedules** for a client on a specific date
2. **Count total tasks** (all schedules for that date)
3. **Count completed tasks** (schedules with status = "completed")
4. **Calculate percentage** = (completed / total) × 100
5. **Store result** in `client_engagement_score` table

### **Code Logic:**
```typescript
const totalDue = schedules.length;
const completed = schedules.filter(s => s.status === "completed").length;
const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
```

## 📈 **Engagement Score Trends**

### **Your Current Data Shows:**
- **Most clients**: 0% engagement (no completed tasks)
- **Client 34**: Varying engagement (0%, 50%, 67%, 100%)
- **Task completion rate**: Very low across all clients
- **Most common status**: `null` (not attempted)

## 🎯 **Recommendations for Better Engagement**

### **1. Task Status Management:**
- Implement task completion tracking
- Add "in progress" status
- Consider partial completion

### **2. Task Weighting:**
- Weight workouts higher than routine tasks
- Consider task difficulty in scoring
- Add bonus points for streaks

### **3. Engagement Categories:**
- **Fitness Engagement**: Workout completion
- **Lifestyle Engagement**: Sleep/wake tracking
- **Health Engagement**: Custom health tasks

## 📊 **Summary**

**Engagement Score includes ALL scheduled tasks for a given date:**
- ✅ **Workouts** (primary fitness activities)
- ✅ **Wake Up** (daily routine)
- ✅ **Bed Time** (sleep hygiene)
- ✅ **Custom Tasks** (personalized health goals)

**Only tasks with `status = "completed"` count as completed.**
**All other statuses (`null`, `overdue`) count as due but not completed.**

**The system is working correctly - the low engagement scores reflect actual task completion rates in your data.** 