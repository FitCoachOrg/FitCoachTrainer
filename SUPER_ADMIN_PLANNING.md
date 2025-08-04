# Super Admin Page Planning

## Overview
A Super Admin interface to manage trainer accounts, control access, and maintain system integrity.

## Core Features

### **1. Trainer Management**
- **View All Trainers**: List with search, filter, and pagination
- **Add New Trainers**: Manual account creation
- **Delete Trainers**: Cascade delete (trainer + auth)
- **Edit Trainer Profiles**: Update trainer information
- **Bulk Operations**: Select multiple trainers for batch actions

### **2. Access Control**
- **Activate/Deactivate**: Toggle trainer account status
- **Role Management**: Assign different permission levels
- **Access Logs**: Track login attempts and system usage
- **IP Restrictions**: Limit access by IP address

### **3. System Monitoring**
- **Orphaned Account Detection**: Find and clean up incomplete accounts
- **System Health**: Monitor database integrity
- **Audit Trail**: Track all admin actions
- **Error Logs**: View system errors and warnings

## Database Schema Extensions

### **Admin Users Table**
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin', 'moderator'
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Audit Logs Table**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL, -- 'create_trainer', 'delete_trainer', 'update_trainer'
  target_type TEXT NOT NULL, -- 'trainer', 'admin', 'system'
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Trainer Status Tracking**
```sql
-- Add to existing trainer table
ALTER TABLE trainer 
ADD COLUMN admin_notes TEXT,
ADD COLUMN last_admin_review TIMESTAMP,
ADD COLUMN review_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
ADD COLUMN admin_reviewer_id UUID REFERENCES admin_users(id);
```

## Super Admin Page Structure

### **1. Dashboard**
```typescript
// client/src/pages/SuperAdmin.tsx
interface SuperAdminDashboard {
  stats: {
    totalTrainers: number;
    activeTrainers: number;
    pendingReviews: number;
    orphanedAccounts: number;
  };
  recentActivity: AuditLog[];
  systemHealth: SystemHealthStatus;
}
```

### **2. Trainer Management**
```typescript
// client/src/components/admin/TrainerManagement.tsx
interface TrainerManagement {
  trainers: Trainer[];
  filters: {
    status: 'all' | 'active' | 'inactive' | 'pending';
    search: string;
    dateRange: DateRange;
  };
  actions: {
    createTrainer: (data: CreateTrainerData) => Promise<void>;
    deleteTrainer: (email: string) => Promise<void>;
    updateTrainer: (email: string, data: Partial<Trainer>) => Promise<void>;
    bulkAction: (action: string, emails: string[]) => Promise<void>;
  };
}
```

### **3. System Tools**
```typescript
// client/src/components/admin/SystemTools.tsx
interface SystemTools {
  orphanedAccountCleanup: () => Promise<CleanupResult>;
  databaseIntegrityCheck: () => Promise<IntegrityReport>;
  auditLogExport: (dateRange: DateRange) => Promise<string>;
  systemHealthCheck: () => Promise<HealthReport>;
}
```

## Implementation Phases

### **Phase 1: Basic Admin Interface**
- [ ] Create Super Admin page layout
- [ ] Implement trainer listing with search/filter
- [ ] Add basic CRUD operations for trainers
- [ ] Set up admin authentication

### **Phase 2: Advanced Management**
- [ ] Implement bulk operations
- [ ] Add audit logging
- [ ] Create orphaned account detection
- [ ] Add system health monitoring

### **Phase 3: Access Control**
- [ ] Implement role-based permissions
- [ ] Add IP restrictions
- [ ] Create admin user management
- [ ] Add access logs

### **Phase 4: Advanced Features**
- [ ] Real-time system monitoring
- [ ] Automated cleanup jobs
- [ ] Advanced reporting
- [ ] API rate limiting

## Security Considerations

### **1. Admin Authentication**
```typescript
// Separate admin auth from trainer auth
const adminAuth = createClient(supabaseUrl, adminServiceKey);

// Admin-specific login
const adminLogin = async (email: string, password: string) => {
  const { data, error } = await adminAuth.auth.signInWithPassword({
    email,
    password
  });
  
  // Verify admin role
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();
    
  return { authData: data, adminUser };
};
```

### **2. Permission System**
```typescript
interface AdminPermissions {
  canCreateTrainers: boolean;
  canDeleteTrainers: boolean;
  canEditTrainers: boolean;
  canViewAuditLogs: boolean;
  canManageAdmins: boolean;
  canAccessSystemTools: boolean;
}

const checkPermission = (permission: keyof AdminPermissions): boolean => {
  return currentAdminUser?.permissions?.[permission] || false;
};
```

### **3. Audit Logging**
```typescript
const logAdminAction = async (
  action: string,
  targetType: string,
  targetId: string,
  details: any
) => {
  await supabase.from('audit_logs').insert([{
    admin_user_id: currentAdminUser.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent
  }]);
};
```

## UI Components

### **1. Trainer List**
```typescript
// client/src/components/admin/TrainerList.tsx
const TrainerList = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SearchInput />
        <FilterDropdown />
        <BulkActionDropdown />
      </div>
      
      <DataTable>
        {trainers.map(trainer => (
          <TrainerRow 
            key={trainer.id}
            trainer={trainer}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </DataTable>
    </div>
  );
};
```

### **2. System Health Dashboard**
```typescript
// client/src/components/admin/SystemHealth.tsx
const SystemHealth = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HealthCard 
        title="Database"
        status={systemHealth.database}
        details={systemHealth.dbDetails}
      />
      <HealthCard 
        title="Auth System"
        status={systemHealth.auth}
        details={systemHealth.authDetails}
      />
      <HealthCard 
        title="Orphaned Accounts"
        status={systemHealth.orphaned}
        details={systemHealth.orphanedDetails}
      />
    </div>
  );
};
```

## API Endpoints

### **1. Trainer Management**
```typescript
// GET /api/admin/trainers
// POST /api/admin/trainers
// PUT /api/admin/trainers/:email
// DELETE /api/admin/trainers/:email
// POST /api/admin/trainers/bulk-action
```

### **2. System Tools**
```typescript
// GET /api/admin/system/health
// POST /api/admin/system/cleanup-orphaned
// GET /api/admin/system/audit-logs
// POST /api/admin/system/export-data
```

### **3. Admin Management**
```typescript
// GET /api/admin/admins
// POST /api/admin/admins
// PUT /api/admin/admins/:id
// DELETE /api/admin/admins/:id
```

## Deployment Strategy

### **1. Development Phase**
- Build admin interface locally
- Test with mock data
- Implement basic CRUD operations

### **2. Staging Phase**
- Deploy to staging environment
- Test with real data
- Security testing
- Performance optimization

### **3. Production Phase**
- Gradual rollout
- Monitor system impact
- User training
- Documentation

## Monitoring and Alerts

### **1. System Monitoring**
- Database performance
- Auth system health
- Orphaned account detection
- Error rate monitoring

### **2. Admin Activity Monitoring**
- Login attempts
- Failed operations
- Unusual activity patterns
- Permission violations

### **3. Automated Alerts**
- High error rates
- Orphaned account detection
- Failed cascade deletes
- Unauthorized access attempts

## Summary

The Super Admin page will provide:

1. **Complete trainer management** - Add, edit, delete, bulk operations
2. **System monitoring** - Health checks, orphaned account detection
3. **Audit trail** - Track all admin actions
4. **Access control** - Role-based permissions
5. **Security** - Admin authentication, IP restrictions

This will give you full control over the trainer ecosystem while maintaining security and auditability. 