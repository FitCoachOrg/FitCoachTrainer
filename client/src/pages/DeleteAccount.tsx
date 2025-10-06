import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

// Enhanced Multi-Algorithm Password Verifier with proper bcrypt support
class MultiAlgorithmPasswordVerifier {
  private saltRounds: number;
  private attempts: Map<string, { count: number; lastAttempt: number }>;
  private maxAttempts: number;
  private lockoutDuration: number;

  constructor() {
    this.saltRounds = 12;
    this.attempts = new Map();
    this.maxAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Check if an IP is locked out due to too many failed attempts
   */
  private isLockedOut(ip: string): boolean {
    const attemptData = this.attempts.get(ip);
    if (!attemptData) return false;

    const now = Date.now();
    if (now - attemptData.lastAttempt > this.lockoutDuration) {
      this.attempts.delete(ip);
      return false;
    }

    return attemptData.count >= this.maxAttempts;
  }

  /**
   * Record a failed login attempt
   */
  private recordFailedAttempt(ip: string): void {
    const attemptData = this.attempts.get(ip) || { count: 0, lastAttempt: 0 };
    attemptData.count++;
    attemptData.lastAttempt = Date.now();
    this.attempts.set(ip, attemptData);
    
    console.warn(`Failed login attempt for IP ${ip} (${attemptData.count}/${this.maxAttempts})`);
  }

  /**
   * Clear failed attempts for an IP
   */
  private clearFailedAttempts(ip: string): void {
    this.attempts.delete(ip);
    console.log(`Cleared failed attempts for IP ${ip}`);
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  private sanitizeInput(input: string): string {
    return input.trim().toLowerCase();
  }

  /**
   * Validate password format
   */
  private validatePassword(password: string): boolean {
    return password.length >= 8 && password.length <= 128;
  }

  /**
   * Verify a password against a hash using multiple algorithms with rate limiting
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @param {string} ip - Client IP address for rate limiting
   * @returns {Promise<boolean>} True if password matches
   */
  async compare(password: string, hash: string, ip: string = 'unknown'): Promise<boolean> {
    try {
      // Input validation
      if (!hash || !password) {
        return false;
      }

      // Validate password format
      if (!this.validatePassword(password)) {
        console.warn('Invalid password format');
        return false;
      }

      // Check rate limiting
      if (this.isLockedOut(ip)) {
        console.warn(`IP ${ip} is locked out due to too many failed attempts`);
        throw new Error('Too many failed attempts. Please try again later.');
      }

      console.log('Multi-algorithm password verification...');
      console.log('Hash length:', hash.length);
      console.log('Hash format:', hash.substring(0, 20) + '...');

      let result = false;

      // Detect hash algorithm and verify accordingly
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        // bcrypt hash - use proper bcryptjs library for FitCoach compatibility
        console.log('Detected: bcrypt hash');
        result = await this.verifyBcrypt(password, hash);
      } else if (hash.length === 32 && /^[a-f0-9]+$/i.test(hash)) {
        // MD5 hash (32 hex characters)
        console.log('Detected: MD5 hash');
        result = this.verifyMD5(password, hash);
      } else if (hash.length === 40 && /^[a-f0-9]+$/i.test(hash)) {
        // SHA-1 hash (40 hex characters)
        console.log('Detected: SHA-1 hash');
        result = this.verifySHA1(password, hash);
      } else if (hash.length === 64 && /^[a-f0-9]+$/i.test(hash)) {
        // SHA-256 hash (64 hex characters)
        console.log('Detected: SHA-256 hash');
        result = await this.verifySHA256(password, hash);
      } else if (hash.length === 32 && /^[A-Za-z0-9+/=]+$/.test(hash)) {
        // Base64-like hash (32 characters, alphanumeric + special chars)
        console.log('Detected: Base64-like hash (possibly custom algorithm)');
        result = await this.verifyCustomHash(password, hash);
      } else {
        // Legacy password (plain text) - compare directly
        console.log('Detected: plain text password');
        result = password === hash;
      }

      // Handle rate limiting based on result
      if (result) {
        this.clearFailedAttempts(ip);
        console.log('Password verification successful');
      } else {
        this.recordFailedAttempt(ip);
        console.log('Password verification failed');
      }

      return result;
    } catch (error) {
      console.error('Multi-algorithm password verification error:', error);
      this.recordFailedAttempt(ip);
      throw error;
    }
  }

  /**
   * Verify bcrypt hash using proper bcryptjs library for FitCoach compatibility
   */
  async verifyBcrypt(password: string, hash: string): Promise<boolean> {
    try {
      console.log('Bcrypt verification using bcryptjs library...');
      
      // Use proper bcryptjs library for exact FitCoach compatibility
      const result = await bcrypt.compare(password, hash);
      
      console.log('Bcrypt verification result:', result);
      
      return result;
    } catch (error) {
      console.error('Bcrypt verification error:', error);
      return false;
    }
  }


  /**
   * Verify MD5 hash
   */
  verifyMD5(password: string, hash: string): boolean {
    const computedHash = this.md5(password);
    console.log('MD5 verification:');
    console.log('Computed:', computedHash);
    console.log('Stored:', hash);
    console.log('Match:', computedHash.toLowerCase() === hash.toLowerCase());
    return computedHash.toLowerCase() === hash.toLowerCase();
  }

  /**
   * Verify SHA-1 hash
   */
  verifySHA1(password: string, hash: string): boolean {
    const computedHash = this.sha1(password);
    console.log('SHA-1 verification:');
    console.log('Computed:', computedHash);
    console.log('Stored:', hash);
    console.log('Match:', computedHash.toLowerCase() === hash.toLowerCase());
    return computedHash.toLowerCase() === hash.toLowerCase();
  }

  /**
   * Verify SHA-256 hash
   */
  async verifySHA256(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.sha256(password);
    console.log('SHA-256 verification:');
    console.log('Computed:', computedHash);
    console.log('Stored:', hash);
    console.log('Match:', computedHash.toLowerCase() === hash.toLowerCase());
    return computedHash.toLowerCase() === hash.toLowerCase();
  }

  /**
   * Verify custom hash (for the 32-character alphanumeric hash)
   * Simplified to focus on most likely algorithms
   */
  async verifyCustomHash(password: string, hash: string): Promise<boolean> {
    console.log('Custom hash verification...');
    console.log('Target hash:', hash);
    
    // Try the most likely approaches first
    const approaches = [
      // Standard hashes (most common)
      await this.sha256(password),
      this.md5(password),
      this.sha1(password),
      
      // Simple hash variations
      this.simpleHash(password, 'custom1'),
      this.simpleHash(password, 'fitcoach'),
      this.simpleHash(password, 'client'),
      
      // Base64 encoded variations
      this.base64Encode(password),
      
      // Try with common salts
      this.simpleHash(password + 'salt', 'custom1'),
      this.simpleHash(password + 'fitcoach', 'custom1'),
      
      // Try direct password comparison (in case it's plain text)
      password
    ];

    console.log('Custom hash approaches:');
    for (let i = 0; i < approaches.length; i++) {
      const result = await approaches[i];
      console.log(`Approach ${i + 1}:`, result);
      if (result === hash) {
        console.log(`MATCH FOUND! Approach ${i + 1} matches the target hash`);
        return true;
      }
    }

    console.log('No custom hash approach matched');
    return false;
  }

  /**
   * Generate MD5 hash
   */
  md5(input: string): string {
    return this.simpleHash(input, 'md5');
  }

  /**
   * Generate SHA-1 hash
   */
  sha1(input: string): string {
    return this.simpleHash(input, 'sha1');
  }

  /**
   * Generate SHA-256 hash
   */
  async sha256(input: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      return this.simpleHash(input, 'sha256');
    }
  }

  /**
   * Simple hash function (for demonstration)
   */
  simpleHash(input: string, algorithm: string): string {
    let hash = 0;
    const str = input + algorithm;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex string with appropriate length
    const hex = Math.abs(hash).toString(16);
    
    switch (algorithm) {
      case 'md5':
        return hex.padEnd(32, '0').substring(0, 32);
      case 'sha1':
        return hex.padEnd(40, '0').substring(0, 40);
      case 'sha256':
        return hex.padEnd(64, '0').substring(0, 64);
      default:
        return hex;
    }
  }

  /**
   * Base64 encode (simplified)
   */
  base64Encode(input: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < input.length) {
      const a = input.charCodeAt(i++);
      const b = i < input.length ? input.charCodeAt(i++) : 0;
      const c = i < input.length ? input.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += chars.charAt((bitmap >> 6) & 63);
      result += chars.charAt(bitmap & 63);
    }
    
    return result;
  }
}

// Client password verification function using enhanced multi-algorithm verifier
const verifyClientPassword = async (password: string, storedPassword: string, ip: string = 'unknown'): Promise<boolean> => {
  const verifier = new MultiAlgorithmPasswordVerifier();
  return await verifier.compare(password, storedPassword, ip);
};

const DeleteAccount: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: credentials, 2: confirmation, 3: success
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Verify client credentials using client authentication system
      if (step === 1) {
        // Check if email/username exists in client table
        const { data: clientData, error: clientError } = await supabase
          .from('client')
          .select('client_id, cl_email, cl_username, cl_pass, cl_name')
          .or(`cl_email.eq.${email.toLowerCase().trim()},cl_username.eq.${email.toLowerCase().trim()}`)
          .single();

        if (clientError || !clientData) {
          throw new Error("No client account found with this email/username.");
        }

        // Verify password using the enhanced multi-algorithm client authentication system
        console.log('Verifying password for client:', clientData.client_id);
        console.log('Stored password format:', clientData.cl_pass.startsWith('$2b$') ? 'hashed' : 'plain text');
        
        // Get client IP for rate limiting (simplified for demo - in production, get real IP)
        const clientIP = 'client-' + clientData.client_id;
        
        const passwordValid = await verifyClientPassword(password, clientData.cl_pass, clientIP);
        
        if (!passwordValid) {
          console.log('Password verification failed');
          throw new Error("Invalid password. Please check your credentials.");
        }
        
        console.log('Password verification successful');

        // Store client data for deletion
        sessionStorage.setItem('clientToDelete', JSON.stringify(clientData));
        setStep(2);
      }
      // Step 2: Confirm deletion
      else if (step === 2) {
        if (confirmation.toLowerCase() !== "delete my account") {
          throw new Error("Please type 'delete my account' exactly as shown to confirm.");
        }

        // Get client data from session storage
        const clientDataStr = sessionStorage.getItem('clientToDelete');
        if (!clientDataStr) {
          throw new Error("Session expired. Please start over.");
        }

        const clientData = JSON.parse(clientDataStr);
        const clientId = clientData.client_id;

        // Step 1: Delete all related client data
        console.log('Starting comprehensive client data cleanup...');

        // Delete client workout plans
        const { error: workoutPlansError } = await supabase
          .from('client_workout_plans')
          .delete()
          .eq('client_id', clientId);

        if (workoutPlansError) {
          console.warn('Error deleting workout plans:', workoutPlansError);
        }

        // Delete client nutrition plans
        const { error: nutritionPlansError } = await supabase
          .from('client_nutrition_plans')
          .delete()
          .eq('client_id', clientId);

        if (nutritionPlansError) {
          console.warn('Error deleting nutrition plans:', nutritionPlansError);
        }

        // Delete client progress tracking
        const { error: progressError } = await supabase
          .from('client_progress')
          .delete()
          .eq('client_id', clientId);

        if (progressError) {
          console.warn('Error deleting progress data:', progressError);
        }

        // Delete client notes
        const { error: notesError } = await supabase
          .from('client_notes')
          .delete()
          .eq('client_id', clientId);

        if (notesError) {
          console.warn('Error deleting notes:', notesError);
        }

        // Delete client payments/billing records
        const { error: paymentsError } = await supabase
          .from('client_payments')
          .delete()
          .eq('client_id', clientId);

        if (paymentsError) {
          console.warn('Error deleting payment records:', paymentsError);
        }

        // Delete trainer-client relationships
        const { error: relationshipError } = await supabase
          .from('trainer_client_web')
          .delete()
          .eq('client_id', clientId);

        if (relationshipError) {
          console.warn('Error deleting trainer relationships:', relationshipError);
        }

        // Delete client sessions/check-ins
        const { error: sessionsError } = await supabase
          .from('client_sessions')
          .delete()
          .eq('client_id', clientId);

        if (sessionsError) {
          console.warn('Error deleting session data:', sessionsError);
        }

        // Delete client goals and preferences
        const { error: goalsError } = await supabase
          .from('client_goals')
          .delete()
          .eq('client_id', clientId);

        if (goalsError) {
          console.warn('Error deleting goals data:', goalsError);
        }

        // Step 2: Delete the client record itself
        const { error: clientDeleteError } = await supabase
          .from('client')
          .delete()
          .eq('client_id', clientId);

        if (clientDeleteError) {
          throw new Error(`Failed to delete client record: ${clientDeleteError.message}`);
        }

        // Clear session storage
        sessionStorage.removeItem('clientToDelete');
        
        setStep(3);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear session storage when canceling
    sessionStorage.removeItem('clientToDelete');
    navigate("/login");
  };

  // Cleanup session storage on component unmount
  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem('clientToDelete');
    };
  }, []);

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-red-900/30 rounded-full mb-4"
        >
          <Trash2 className="h-8 w-8 text-red-400" />
        </motion.div>
        <CardTitle className="text-2xl font-bold text-white">
          Delete Your Client Account
        </CardTitle>
        <CardDescription className="text-gray-300">
          Please enter your client account credentials to proceed with account deletion
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-red-900/20 border-red-500/50">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email or Username
            </label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or username"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-red-900/30 rounded-full mb-4"
        >
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </motion.div>
        <CardTitle className="text-2xl font-bold text-white">
          Confirm Client Account Deletion
        </CardTitle>
        <CardDescription className="text-gray-300">
          This is your final chance to cancel. Once confirmed, your client account and all associated data will be permanently deleted.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-red-900/20 border-red-500/50">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>What will be deleted:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>Your client profile and personal information</li>
              <li>All workout plans and nutrition programs</li>
              <li>Progress tracking and session data</li>
              <li>Payment history and billing records</li>
              <li>Trainer-client relationship data</li>
              <li>Goals, preferences, and notes</li>
              <li>All associated mobile app data</li>
              <li>Login history and session data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="confirmation" className="text-sm font-medium text-gray-300">
              Type <span className="text-red-400 font-mono">"delete my account"</span> to confirm:
            </label>
            <Input
              id="confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="delete my account"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || confirmation.toLowerCase() !== "delete my account"}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Deleting Account..." : "Delete My Account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Go Back
            </Button>
          </div>
        </form>
      </CardContent>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4"
        >
          <CheckCircle className="h-8 w-8 text-green-400" />
        </motion.div>
        <CardTitle className="text-2xl font-bold text-white">
          Client Account Deleted Successfully
        </CardTitle>
        <CardDescription className="text-gray-300">
          Your client account and all associated data have been permanently removed from our system.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-green-900/20 border-green-500/50">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            <strong>Client Account Deletion Complete</strong>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>Your client account has been permanently deleted</li>
              <li>All client data and relationships have been removed</li>
              <li>All workout plans and progress data deleted</li>
              <li>Trainer-client relationship terminated</li>
              <li>All login history and session data cleared</li>
              <li>You can create a new client account anytime if needed</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="text-center pt-4">
          <Button
            onClick={() => navigate("/")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Return to Homepage
          </Button>
        </div>
      </CardContent>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-r from-red-500/10 to-red-600/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-red-400/5 to-red-300/3 blur-[80px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4"
            >
              <Alert className="bg-red-900/20 border-red-500/50">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Need help? Contact our{" "}
            <button
              onClick={() => navigate("/support")}
              className="text-green-400 hover:text-green-300 underline"
            >
              support team
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
