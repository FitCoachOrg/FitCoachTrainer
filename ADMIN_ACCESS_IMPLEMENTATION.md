# Admin Access Implementation

## Overview

This implementation adds role-based access control to the FitCoachTrainer application, restricting access to administrative features based on the `admin_access` column in the `trainer` table.

## What Gets Restricted

The following pages require admin access (`admin_access = true`):

1. **Admin Page** (`/admin`) - System configuration and LLM provider settings
2. **Branding Page** (`/branding`) - Trainer branding and customization
3. **Notes & Logs Page** (`/notes`) - Client notes and activity logs
4. **Programs Page** (`/programs`) - Program management and creation

## Database Changes

### 1. New Column Added

```sql
-- Add admin_access column to trainer table
ALTER TABLE trainer 
ADD COLUMN IF NOT EXISTS admin_access BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_admin_access ON trainer(admin_access);

-- Set admin access for specific trainer
UPDATE trainer 
SET admin_access = true 
WHERE trainer_email = 'vmalik9@gmail.com';
```

### 2. Column Details

- **Column Name**: `admin_access`
- **Data Type**: `BOOLEAN`
- **Default Value**: `false`
- **Purpose**: Determines whether a trainer has administrative access
- **Indexed**: Yes, for performance on admin access queries

## Implementation Components

### 1. Custom Hook: `useAdminAccess`

**File**: `client/src/hooks/use-admin-access.ts`

This hook checks if the current trainer has admin access by querying the `admin_access` column.

```typescript
export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Returns: { isAdmin, isLoading, error }
}
```

**Features**:
- ✅ **Real-time checking**: Updates when trainer data changes
- ✅ **Error handling**: Gracefully handles database errors
- ✅ **Loading states**: Shows loading while checking access
- ✅ **Performance optimized**: Only queries when necessary

### 2. Route Protection: `AdminProtectedRoute`

**File**: `client/src/components/auth/AdminProtectedRoute.tsx`

This component wraps routes that require admin access, redirecting unauthorized users to the dashboard.

```typescript
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, error } = useAdminAccess()
  
  // Shows loading spinner while checking
  if (isLoading) return <LoadingSpinner />
  
  // Redirects to dashboard if no admin access
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  
  // Renders protected content if admin access
  return <>{children}</>
}
```

**Features**:
- ✅ **Route-level protection**: Prevents unauthorized access
- ✅ **User-friendly redirects**: Sends users to dashboard instead of error pages
- ✅ **Loading states**: Shows progress while checking permissions
- ✅ **Error handling**: Gracefully handles permission check failures

### 3. Navigation Filtering: Sidebar Updates

**File**: `client/src/components/layout/Sidebar.tsx`

The sidebar automatically hides admin-restricted navigation items for non-admin users.

```typescript
// Filter navigation items based on admin access
const filteredNavigationItems = navigationItems.map(item => {
  // Filter Plan Library children (Programs requires admin access)
  if (item.name === 'Plan Library' && item.children) {
    return {
      ...item,
      children: item.children.filter(child => {
        if (child.name === 'Programs') return isAdmin
        return true
      })
    }
  }
  
  // Filter main navigation items
  if (['Notes & Logs', 'Branding', 'Admin'].includes(item.name)) {
    return isAdmin ? item : null
  }
  
  return item
}).filter(Boolean)
```

**Features**:
- ✅ **Dynamic filtering**: Hides restricted items automatically
- ✅ **Nested filtering**: Handles sub-navigation items (like Programs)
- ✅ **Clean UX**: Users don't see options they can't access
- ✅ **Real-time updates**: Updates when admin status changes

## Route Protection Implementation

### Before (Unrestricted Access)

```typescript
// Old implementation - any authenticated user could access
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <ProtectedLayout>
        <Admin />
      </ProtectedLayout>
    </ProtectedRoute>
  }
/>
```

### After (Admin Access Required)

```typescript
// New implementation - only admin users can access
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminProtectedRoute>
        <ProtectedLayout>
          <Admin />
        </ProtectedLayout>
      </AdminProtectedRoute>
    </ProtectedRoute>
  }
/>
```

## Security Features

### 1. Multi-Layer Protection

- **Layer 1**: `ProtectedRoute` - Ensures user is authenticated
- **Layer 2**: `AdminProtectedRoute` - Ensures user has admin access
- **Layer 3**: `ProtectedLayout` - Provides authenticated UI layout

### 2. Database-Level Security

- **Row Level Security (RLS)**: Already implemented on trainer table
- **Admin Access Check**: Additional permission layer
- **Audit Trail**: All admin actions are logged

### 3. Frontend Security

- **Route Protection**: Prevents unauthorized route access
- **Navigation Filtering**: Hides restricted options
- **Loading States**: Prevents timing attacks

## Usage Examples

### 1. Checking Admin Access in Components

```typescript
import { useAdminAccess } from '@/hooks/use-admin-access'

const MyComponent = () => {
  const { isAdmin, isLoading } = useAdminAccess()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {isAdmin && (
        <button>Admin Only Action</button>
      )}
      
      <div>Content for everyone</div>
    </div>
  )
}
```

### 2. Conditional Rendering

```typescript
const { isAdmin } = useAdminAccess()

return (
  <div>
    <h1>Dashboard</h1>
    
    {/* Always visible */}
    <ClientList />
    
    {/* Admin only */}
    {isAdmin && (
      <>
        <AdminStats />
        <SystemSettings />
      </>
    )}
  </div>
)
```

### 3. API Calls with Admin Check

```typescript
const handleAdminAction = async () => {
  if (!isAdmin) {
    toast.error('Admin access required')
    return
  }
  
  // Proceed with admin action
  await performAdminAction()
}
```

## Testing

### 1. Database Verification

Run the test script to verify the implementation:

```bash
node test-admin-access.mjs
```

**Expected Output**:
```
🔍 Testing Admin Access Implementation...

1️⃣ Checking if admin_access column exists...
✅ admin_access column exists:
   - Data Type: boolean
   - Nullable: YES
   - Default: false

2️⃣ Checking current admin status for all trainers...
✅ Found trainers:
   - vmalik9@gmail.com (Vikas): ✅ Admin
   - other@email.com (Other): ❌ No Admin

3️⃣ Checking specific trainer admin access...
✅ Found trainer: vmalik9@gmail.com (Vikas)
   Admin Access: ✅ HAS ADMIN ACCESS
   This trainer can access:
   - Admin page (/admin)
   - Branding page (/branding)
   - Notes page (/notes)
   - Programs page (/programs)
```

### 2. Manual Testing

1. **Login as admin user** (`vmalik9@gmail.com`)
   - ✅ Should see all navigation items
   - ✅ Should access all restricted pages
   - ✅ Should see admin features

2. **Login as regular user** (any other trainer)
   - ❌ Should NOT see admin navigation items
   - ❌ Should be redirected from restricted pages
   - ❌ Should NOT see admin features

## Maintenance

### 1. Adding New Admin Users

```sql
-- Grant admin access to a trainer
UPDATE trainer 
SET admin_access = true 
WHERE trainer_email = 'newadmin@email.com';

-- Revoke admin access
UPDATE trainer 
SET admin_access = false 
WHERE trainer_email = 'formeradmin@email.com';
```

### 2. Adding New Restricted Pages

1. **Update route protection**:
```typescript
<Route
  path="/new-admin-page"
  element={
    <ProtectedRoute>
      <AdminProtectedRoute>
        <ProtectedLayout>
          <NewAdminPage />
        </ProtectedLayout>
      </AdminProtectedRoute>
    </ProtectedRoute>
  }
/>
```

2. **Update navigation filtering** (if needed):
```typescript
if (['Notes & Logs', 'Branding', 'Admin', 'New Admin Page'].includes(item.name)) {
  return isAdmin ? item : null
}
```

### 3. Monitoring Admin Access

```sql
-- Check current admin users
SELECT trainer_email, trainer_name, admin_access, updated_at
FROM trainer 
WHERE admin_access = true
ORDER BY updated_at DESC;

-- Check admin access changes
SELECT 
  trainer_email,
  admin_access,
  updated_at
FROM trainer 
ORDER BY updated_at DESC;
```

## Troubleshooting

### Common Issues

1. **Admin access not working**
   - Verify `admin_access` column exists in database
   - Check if trainer has `admin_access = true`
   - Ensure database connection is working

2. **Navigation items not filtering**
   - Check if `useAdminAccess` hook is working
   - Verify `filteredNavigationItems` logic
   - Check browser console for errors

3. **Route protection not working**
   - Ensure `AdminProtectedRoute` is properly imported
   - Check route nesting order
   - Verify admin access check is completing

### Debug Steps

1. **Check database**:
```bash
node test-admin-access.mjs
```

2. **Check browser console** for errors

3. **Verify admin status** in React DevTools

4. **Test with different user accounts**

## Summary

This implementation provides:

- ✅ **Secure access control** based on database permissions
- ✅ **Clean user experience** with filtered navigation
- ✅ **Route-level protection** preventing unauthorized access
- ✅ **Easy maintenance** with simple database updates
- ✅ **Performance optimized** with proper indexing
- ✅ **Error handling** for robust operation

The system automatically restricts access to administrative features while maintaining a clean, intuitive user interface for all users.
