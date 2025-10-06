# FitCoach Client Authentication - Trainer Platform Integration

## Overview

This document provides a complete guide for integrating client authentication functionality into the trainer platform. The solution includes a self-contained authentication module that can be dropped into any web application to verify client credentials and enable account deletion functionality.

## Files Included

1. **`client-auth-verifier.js`** - Self-contained authentication module
2. **`trainer-platform-auth-demo.html`** - Interactive demo and testing interface
3. **`TRAINER_PLATFORM_AUTH_INTEGRATION.md`** - This documentation file

## Features

### ✅ Client Authentication
- Verify client credentials using email/username and password
- Support for both hashed and legacy (plain text) passwords
- Rate limiting and IP-based lockout protection
- Comprehensive error handling and logging

### ✅ Account Deletion Verification
- Special verification process for account deletion
- Additional security checks and client data retrieval
- Password confirmation required

### ✅ Account Deletion
- Complete account deletion with data cleanup
- Removes all client data from multiple database tables
- Secure password verification before deletion
- Comprehensive logging and error handling

### ✅ Security Features
- IP-based rate limiting (configurable)
- Password strength validation
- Secure password hashing and verification
- Lockout protection against brute force attacks

## Quick Start

### 1. Configuration

Update the configuration in `client-auth-verifier.js`:

```javascript
const CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://your-project.supabase.co/rest/v1',
  SUPABASE_API_KEY: 'your-actual-supabase-api-key-here',
  
  // Security Settings
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Logging
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'info' // 'debug', 'info', 'warn', 'error'
};
```

### 2. Basic Usage

```javascript
// Initialize the authenticator
const authVerifier = new ClientAuthVerifier({
  SUPABASE_URL: 'https://your-project.supabase.co/rest/v1',
  SUPABASE_API_KEY: 'your-api-key-here'
});

// Authenticate a client
const result = await authVerifier.authenticateClient(
  'client@example.com', 
  'password123',
  '192.168.1.1' // IP address for rate limiting
);

if (result.success) {
  console.log('Client authenticated:', result.client);
} else {
  console.log('Authentication failed:', result.error);
}
```

### 3. Account Deletion

```javascript
// Delete a client account
const result = await authVerifier.deleteClientAccount(
  'client@example.com',
  'password123',
  '192.168.1.1'
);

if (result.success) {
  console.log('Account deleted successfully');
} else {
  console.log('Deletion failed:', result.error);
}
```

## API Reference

### ClientAuthVerifier Class

#### Constructor
```javascript
new ClientAuthVerifier(config)
```

**Parameters:**
- `config` (Object, optional): Configuration overrides

**Configuration Options:**
- `SUPABASE_URL` (string): Your Supabase REST API URL
- `SUPABASE_API_KEY` (string): Your Supabase API key
- `PASSWORD_MIN_LENGTH` (number): Minimum password length (default: 8)
- `MAX_LOGIN_ATTEMPTS` (number): Max failed attempts before lockout (default: 5)
- `LOCKOUT_DURATION` (number): Lockout duration in milliseconds (default: 15 minutes)
- `ENABLE_LOGGING` (boolean): Enable/disable logging (default: true)
- `LOG_LEVEL` (string): Log level - 'debug', 'info', 'warn', 'error' (default: 'info')

#### Methods

##### authenticateClient(emailOrUsername, password, ip)
Authenticate a client using email/username and password.

**Parameters:**
- `emailOrUsername` (string): Client's email or username
- `password` (string): Client's password
- `ip` (string, optional): Client's IP address for rate limiting

**Returns:** Promise<Object>
```javascript
{
  success: boolean,
  client?: {
    client_id: string,
    username: string,
    email: string,
    name: string
  },
  error?: string,
  lockedOut?: boolean
}
```

##### verifyForAccountDeletion(emailOrUsername, password, ip)
Verify client credentials specifically for account deletion.

**Parameters:**
- `emailOrUsername` (string): Client's email or username
- `password` (string): Client's password
- `ip` (string, optional): Client's IP address for rate limiting

**Returns:** Promise<Object>
```javascript
{
  success: boolean,
  client?: {
    client_id: string,
    username: string,
    email: string,
    name: string,
    created_at: string
  },
  verified?: boolean,
  error?: string,
  lockedOut?: boolean
}
```

##### deleteClientAccount(emailOrUsername, password, ip)
Delete a client account and all associated data.

**Parameters:**
- `emailOrUsername` (string): Client's email or username
- `password` (string): Client's password
- `ip` (string, optional): Client's IP address for rate limiting

**Returns:** Promise<Object>
```javascript
{
  success: boolean,
  message?: string,
  client_id?: string,
  error?: string
}
```

##### getClientInfo(clientId)
Retrieve client information by client ID.

**Parameters:**
- `clientId` (string): Client's unique ID

**Returns:** Promise<Object>
```javascript
{
  success: boolean,
  client?: {
    client_id: string,
    cl_username: string,
    cl_email: string,
    cl_name: string,
    created_at: string
  },
  error?: string
}
```

## Database Schema

The authentication module works with the following Supabase tables:

### Client Table (`client`)
```sql
CREATE TABLE client (
  client_id TEXT PRIMARY KEY,
  cl_username TEXT UNIQUE NOT NULL,
  cl_email TEXT UNIQUE NOT NULL,
  cl_name TEXT,
  cl_pass TEXT NOT NULL, -- Hashed password
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Related Tables (for account deletion)
- `workout_info` - Workout logs and exercise data
- `meal_info` - Meal logs and nutrition data
- `activity_info` - Hydration, weight, body measurements
- `client_target` - Goals and fitness targets
- `client_notification_preferences` - Notification settings
- `trainer_client_web` - Chat history and trainer relationship
- `grocery_list` - Grocery lists and meal planning
- `schedule` - Workout schedule and appointments
- `external_device_connect` - Fitness device data
- `login_history` - Login activity and session data

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Support for both hashed and legacy plain text passwords
- Password strength validation (minimum length)

### Rate Limiting
- IP-based rate limiting to prevent brute force attacks
- Configurable maximum login attempts and lockout duration
- Automatic lockout clearing after timeout

### Data Protection
- All database queries use parameterized queries to prevent SQL injection
- Sensitive data is not logged
- Comprehensive error handling without exposing internal details

### Account Deletion Security
- Password verification required before deletion
- Two-step confirmation process
- Complete data cleanup across all related tables
- Audit logging of deletion attempts

## Integration Examples

### React Component Example

```jsx
import React, { useState } from 'react';
import { ClientAuthVerifier } from './client-auth-verifier.js';

function ClientAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const authVerifier = new ClientAuthVerifier({
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_API_KEY: process.env.REACT_APP_SUPABASE_API_KEY
  });

  const handleAuthenticate = async () => {
    setLoading(true);
    try {
      const result = await authVerifier.authenticateClient(email, password);
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email or Username"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleAuthenticate} disabled={loading}>
        {loading ? 'Authenticating...' : 'Authenticate'}
      </button>
      {result && (
        <div className={result.success ? 'success' : 'error'}>
          {result.success ? 'Authentication successful!' : result.error}
        </div>
      )}
    </div>
  );
}
```

### Node.js/Express Example

```javascript
const express = require('express');
const { ClientAuthVerifier } = require('./client-auth-verifier.js');

const app = express();
app.use(express.json());

const authVerifier = new ClientAuthVerifier({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_API_KEY: process.env.SUPABASE_API_KEY
});

// Authenticate client endpoint
app.post('/api/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = await authVerifier.authenticateClient(email, password, ip);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete account endpoint
app.post('/api/delete-account', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = await authVerifier.deleteClientAccount(email, password, ip);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Testing

### Using the Demo HTML File

1. Open `trainer-platform-auth-demo.html` in a web browser
2. Update the Supabase configuration in the JavaScript section
3. Test the authentication functionality with real client credentials
4. Verify account deletion works correctly

### Manual Testing

```javascript
// Test authentication
const authVerifier = new ClientAuthVerifier({
  SUPABASE_URL: 'your-url',
  SUPABASE_API_KEY: 'your-key'
});

// Test with valid credentials
const result = await authVerifier.authenticateClient('test@example.com', 'password123');
console.log('Authentication result:', result);

// Test with invalid credentials
const invalidResult = await authVerifier.authenticateClient('test@example.com', 'wrongpassword');
console.log('Invalid auth result:', invalidResult);
```

## Error Handling

The module provides comprehensive error handling:

### Common Error Types
- **Authentication Errors**: Invalid credentials, user not found
- **Rate Limiting Errors**: Too many failed attempts, IP locked out
- **Network Errors**: Database connection issues, API failures
- **Validation Errors**: Missing required fields, invalid input format
- **Security Errors**: Password strength requirements not met

### Error Response Format
```javascript
{
  success: false,
  error: "Human-readable error message",
  lockedOut: true, // Only present for rate limiting errors
  code: "ERROR_CODE" // Optional error code for programmatic handling
}
```

## Logging

The module includes comprehensive logging capabilities:

### Log Levels
- **debug**: Detailed debugging information
- **info**: General information about operations
- **warn**: Warning messages for non-critical issues
- **error**: Error messages for failures

### Log Format
```
[2024-01-15T10:30:45.123Z] [INFO] Authentication attempt for: client@example.com
[2024-01-15T10:30:45.456Z] [SUCCESS] Authentication successful for user: 123
```

## Performance Considerations

### Database Queries
- Optimized queries with proper indexing
- Minimal data retrieval (only necessary fields)
- Efficient error handling to prevent unnecessary queries

### Rate Limiting
- In-memory rate limiting (consider Redis for production)
- Configurable limits to balance security and usability
- Automatic cleanup of expired rate limit data

### Caching
- No built-in caching (implement as needed)
- Consider caching client information for frequently accessed data
- Cache invalidation on account deletion

## Deployment Considerations

### Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co/rest/v1
SUPABASE_API_KEY=your-supabase-api-key
```

### Production Settings
```javascript
const authVerifier = new ClientAuthVerifier({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  MAX_LOGIN_ATTEMPTS: 3, // Stricter for production
  LOCKOUT_DURATION: 30 * 60 * 1000 // 30 minutes for production
});
```

### Security Checklist
- [ ] Update Supabase API key with production credentials
- [ ] Enable HTTPS for all communications
- [ ] Implement proper CORS policies
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting for production traffic
- [ ] Test account deletion with real data
- [ ] Verify all error messages are user-friendly
- [ ] Set up logging aggregation and monitoring

## Troubleshooting

### Common Issues

#### 1. "Failed to initialize authentication module"
- **Cause**: Invalid Supabase configuration
- **Solution**: Verify SUPABASE_URL and SUPABASE_API_KEY are correct

#### 2. "User not found" errors
- **Cause**: Client doesn't exist in database
- **Solution**: Verify client exists in the `client` table

#### 3. "Invalid password" for correct credentials
- **Cause**: Password hashing mismatch
- **Solution**: Check if password is hashed correctly in database

#### 4. "Too many failed attempts" immediately
- **Cause**: Rate limiting is too aggressive
- **Solution**: Adjust MAX_LOGIN_ATTEMPTS and LOCKOUT_DURATION

#### 5. Account deletion fails
- **Cause**: Database permissions or table structure issues
- **Solution**: Verify API key has delete permissions on all tables

### Debug Mode
Enable debug logging to troubleshoot issues:

```javascript
const authVerifier = new ClientAuthVerifier({
  SUPABASE_URL: 'your-url',
  SUPABASE_API_KEY: 'your-key',
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'debug'
});
```

## Support and Maintenance

### Regular Maintenance Tasks
1. **Monitor logs** for authentication failures and errors
2. **Review rate limiting** effectiveness and adjust as needed
3. **Update security settings** based on threat landscape
4. **Test account deletion** periodically with test accounts
5. **Verify database backups** include all client data

### Security Updates
- Monitor for security vulnerabilities in dependencies
- Update password hashing algorithms as needed
- Review and update rate limiting strategies
- Implement additional security measures as required

### Performance Monitoring
- Monitor authentication response times
- Track rate limiting effectiveness
- Monitor database query performance
- Set up alerts for unusual authentication patterns

## Conclusion

The FitCoach Client Authentication module provides a robust, secure, and easy-to-integrate solution for trainer platform authentication needs. With comprehensive features for authentication, verification, and account deletion, it ensures both security and user experience are maintained at the highest level.

For additional support or customization needs, refer to the source code comments and examples provided in the module files.
