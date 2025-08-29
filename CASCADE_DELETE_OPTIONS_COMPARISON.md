# Cascade Delete Options: Trainer Table to Supabase Auth

## Overview
When a trainer record is deleted, we need to also delete the corresponding Supabase Auth user to prevent orphaned accounts. Here are three approaches with their pros and cons.

## Option 1: Database Triggers (Recommended)

### **Implementation**
```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION cascade_delete_trainer_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users 
  WHERE email = OLD.trainer_email;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_cascade_delete_trainer_to_auth
  AFTER DELETE ON trainer
  FOR EACH ROW
  EXECUTE FUNCTION cascade_delete_trainer_to_auth();
```

### **Pros**
- ✅ **Automatic** - No application code needed
- ✅ **Atomic** - Single transaction
- ✅ **Reliable** - Database-level enforcement
- ✅ **Fast** - No network calls
- ✅ **Simple** - One-time setup

### **Cons**
- ❌ **Requires admin privileges** - Need service role access
- ❌ **Less flexible** - Always deletes Auth user
- ❌ **Hard to debug** - Database-level operations
- ❌ **No confirmation** - Immediate deletion

### **Best For**
- Production environments
- When you always want to delete both records
- When you have admin database access

---

## Option 2: Application-Level Cascade

### **Implementation**
```typescript
export const cascadeDeleteTrainer = async (trainerEmail: string): Promise<boolean> => {
  // Step 1: Delete trainer record
  const { error: trainerError } = await supabase
    .from('trainer')
    .delete()
    .eq('trainer_email', trainerEmail);

  // Step 2: Delete Auth user (requires service role)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  
  return !trainerError && !authError;
};
```

### **Pros**
- ✅ **Flexible** - Can add confirmation, logging, etc.
- ✅ **Debuggable** - Easy to add error handling
- ✅ **User control** - Can ask for confirmation
- ✅ **Selective** - Can choose when to cascade

### **Cons**
- ❌ **More complex** - Requires application code
- ❌ **Network calls** - Slower than triggers
- ❌ **Error handling** - Need to handle partial failures
- ❌ **Service role required** - Need admin privileges

### **Best For**
- Development environments
- When you need user confirmation
- When you want selective cascade deletion

---

## Option 3: Edge Function (Most Secure)

### **Implementation**
```typescript
// supabase/functions/cascade_delete_trainer/index.ts
serve(async (req) => {
  const { trainerEmail } = await req.json();
  
  // Delete trainer record
  const { error: trainerError } = await supabase
    .from('trainer')
    .delete()
    .eq('trainer_email', trainerEmail);

  // Delete Auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  
  return new Response(JSON.stringify({ success: true }));
});
```

### **Pros**
- ✅ **Secure** - Server-side execution
- ✅ **Isolated** - Separate from client code
- ✅ **Scalable** - Can handle high load
- ✅ **Auditable** - Function logs available
- ✅ **Flexible** - Can add complex logic

### **Cons**
- ❌ **More complex** - Requires function deployment
- ❌ **Cold starts** - Function initialization time
- ❌ **Network calls** - HTTP requests to function
- ❌ **Service role required** - Need admin privileges

### **Best For**
- Production environments
- When you need complex deletion logic
- When you want server-side security

---

## Comparison Matrix

| Feature | Database Trigger | Application Level | Edge Function |
|---------|-----------------|-------------------|---------------|
| **Setup Complexity** | Low | Medium | High |
| **Performance** | Fastest | Medium | Fast |
| **Flexibility** | Low | High | High |
| **Security** | High | Medium | Highest |
| **Debugging** | Hard | Easy | Medium |
| **User Control** | None | High | Medium |
| **Error Handling** | Basic | Full | Full |
| **Atomic Operations** | Yes | No | No |

---

## Recommended Approach

### **For Production: Database Triggers**
```sql
-- Run this in Supabase SQL editor
CREATE OR REPLACE FUNCTION cascade_delete_trainer_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users 
  WHERE email = OLD.trainer_email;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_cascade_delete_trainer_to_auth
  AFTER DELETE ON trainer
  FOR EACH ROW
  EXECUTE FUNCTION cascade_delete_trainer_to_auth();
```

### **For Development: Application Level**
```typescript
// Use the trainer-delete-service.ts for development
import { cascadeDeleteTrainer } from '@/lib/trainer-delete-service';

// Example usage
const handleDeleteTrainer = async (trainerEmail: string) => {
  try {
    const success = await cascadeDeleteTrainer(trainerEmail, true);
    if (success) {
      toast.success('Trainer deleted successfully');
    }
  } catch (error) {
    toast.error('Failed to delete trainer');
  }
};
```

---

## Implementation Steps

### **Step 1: Choose Your Approach**
1. **Production**: Use database triggers
2. **Development**: Use application-level cascade
3. **Complex requirements**: Use edge functions

### **Step 2: Set Up Permissions**
```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, DELETE ON auth.users TO authenticated;
```

### **Step 3: Test the Implementation**
```typescript
// Test cascade delete
const testCascadeDelete = async () => {
  const testEmail = 'test@example.com';
  
  // Create test trainer
  await supabase.from('trainer').insert([{
    trainer_email: testEmail,
    trainer_name: 'Test Trainer'
  }]);
  
  // Delete and verify cascade
  await supabase.from('trainer').delete().eq('trainer_email', testEmail);
  
  // Check if Auth user was also deleted
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const userExists = authUsers.users.some(u => u.email === testEmail);
  console.log('Auth user deleted:', !userExists);
};
```

---

## Error Handling

### **Partial Failure Scenarios**
1. **Trainer deleted, Auth user remains**
   - Log for manual cleanup
   - Provide admin interface for cleanup

2. **Auth user deleted, trainer record remains**
   - Rare (Auth deletion usually fails first)
   - Manual cleanup required

3. **Both operations fail**
   - Retry mechanism
   - Manual intervention required

### **Recovery Procedures**
```typescript
// Cleanup orphaned Auth accounts
const cleanupOrphanedAuthUsers = async () => {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  for (const user of authUsers.users) {
    const { data: trainer } = await supabase
      .from('trainer')
      .select('trainer_email')
      .eq('trainer_email', user.email)
      .single();
      
    if (!trainer) {
      // Orphaned Auth user - delete it
      await supabase.auth.admin.deleteUser(user.id);
    }
  }
};
```

---

## Summary

**For your use case, I recommend:**

1. **Start with database triggers** for production
2. **Use application-level cascade** for development/testing
3. **Implement proper error handling** for partial failures
4. **Set up monitoring** to detect orphaned accounts
5. **Provide admin tools** for manual cleanup

This approach gives you the best balance of reliability, performance, and maintainability. 