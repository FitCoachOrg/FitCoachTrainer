import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import * as Icons from "@/lib/icons";
import { motion } from "framer-motion";
import { supabase, getOAuthRedirectUrl } from "@/lib/supabase";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { UserPlus, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FloatingDots = () => {
  const [dots, setDots] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const generateDots = () => {
      const newDots = [];
      for (let i = 0; i < 120; i++) {
        newDots.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          delay: Math.random() * 10,
        });
      }
      setDots(newDots);
    };
    generateDots();
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute bg-white rounded-full opacity-20"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.2, 0.9, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [emailSent, setEmailSent] = useState(false); // Commented out for magic link

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Checking session on mount:', session);
        
        if (session) {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    checkUser();

    // Listen for auth state changes (e.g., after magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // setEmailSent(false); // Commented out for magic link
    
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with:', formData.email);
      
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        throw error;
      }

      console.log('Login successful, user:', data.user);
      console.log('User email confirmed:', data.user?.email_confirmed_at);
      console.log('User created at:', data.user?.created_at);
      // Success - user will be redirected by useEffect
    } catch (err: any) {
      console.error('Login error:', err);
      
                          // Provide simple error messages
                    if (err.message?.includes('Invalid login credentials')) {
                      setError('Invalid email or password. Please check your credentials and try again.');
                    } else if (err.message?.includes('User not found')) {
                      setError('No account found with this email address. Please sign up first.');
                    } else {
                      setError('Invalid email or password. Please check your credentials and try again.');
                    }
    } finally {
      setIsLoading(false);
    }
  };

  // Commented out magic link function for future use
  /*
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailSent(false);
    
    if (!formData.email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Supabase OTP (magic link)
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: getOAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };
  */

  return (
    <div className="fixed inset-0 bg-black">
      <FloatingDots />
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-[95%] sm:max-w-md bg-slate-800/50 backdrop-blur-sm border-green-400 shadow-2xl">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-white">
              Welcome to Coach<span className="text-green-500">EZ</span>
            </CardTitle>
            <p className="text-center text-slate-400 text-sm sm:text-base">
              Sign in to your trainer dashboard
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Commented out magic link success message for future use
            {emailSent ? (
              <div className="p-3 rounded-md bg-green-900/20 border border-green-400/20">
                <p className="text-sm text-green-400 text-center">
                  A magic login link has been sent to your email. Please check your inbox.
                </p>
              </div>
            ) : (
            */}
            <div className="space-y-4">
                {/* Google Sign-In */}
                <GoogleSignIn 
                  onSuccess={() => {
                    // Google sign-in will redirect automatically
                  }}
                  onError={(error) => {
                    setError(error);
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400"
                />
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>
                
                {/* Email/Password Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-md bg-red-900/20 border border-red-400/20">
                      <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                  
                  {/* For existing trainers who need to reset password */}
                  <Button
                    type="button"
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                    onClick={async () => {
                      if (!formData.email) {
                        setError('Please enter your email address first');
                        return;
                      }

                      const email = formData.email.trim().toLowerCase();
                      
                      try {
                        // First, check if the email exists in the trainer table
                        const { data: trainerData, error: trainerError } = await supabase
                          .from('trainer')
                          .select('trainer_email')
                          .eq('trainer_email', email)
                          .single();

                        if (trainerError) {
                          if (trainerError.code === 'PGRST116') {
                            // No trainer found with this email
                            setError('No account found with this email address. Please check your email or sign up for a new account.');
                            return;
                          } else {
                            setError('Error checking email: ' + trainerError.message);
                            return;
                          }
                        }

                        if (!trainerData) {
                          setError('No account found with this email address. Please check your email or sign up for a new account.');
                          return;
                        }

                        // Email exists in trainer table, now send reset password email
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/login`
                        });

                        if (error) {
                          setError('Error sending password reset: ' + error.message);
                        } else {
                          setError(''); // Clear any existing errors
                          toast({
                            title: "Password Reset Email Sent",
                            description: "Please check your email and click the reset link to set a new password.",
                            variant: "default",
                          });
                        }
                      } catch (err: any) {
                        setError('Error sending password reset: ' + err.message);
                      }
                    }}
                  >
                    Reset Password
                  </Button>
                  

                  

                </form>
                
                {/* Features Link */}
                <div className="mt-6">
                  <div className="text-center">
                    <Button 
                      onClick={() => navigate('/features')}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white min-h-[44px]"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      View Features
                    </Button>
                  </div>
                </div>

                {/* Delete Account Link */}
                <div className="mt-4">
                  <div className="text-center">
                    <button
                      onClick={() => navigate('/delete-account')}
                      className="text-sm text-red-400 hover:text-red-300 underline"
                    >
                      Delete My Client Account
                    </button>
                  </div>
                </div>

                {/* Trainer Signup Option */}
                <div className="mt-6">
                  <Separator className="bg-slate-600" />
                  <div className="text-center mt-4">
                    <p className="text-sm text-slate-400 mb-3">
                      New trainer? Join our platform
                    </p>
                    <Button 
                      onClick={() => navigate('/trainer-signup')}
                      className="w-full bg-green-600 hover:bg-green-700 min-h-[44px]"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      SignUp
                    </Button>
                  </div>
                </div>
              </div>
            {/* )} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage; 