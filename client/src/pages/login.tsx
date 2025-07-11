import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import * as Icons from "@/lib/icons";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import GoogleSignIn from "@/components/auth/GoogleSignIn";

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
  const [formData, setFormData] = useState({
    email: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
          emailRedirectTo: window.location.origin + '/dashboard',
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

  return (
    <div className="fixed inset-0 bg-black">
      <FloatingDots />
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-green-400 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Welcome to FitPro
            </CardTitle>
            <p className="text-center text-slate-400">
              Sign in to your trainer dashboard
            </p>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="p-3 rounded-md bg-green-900/20 border border-green-400/20">
                <p className="text-sm text-green-400 text-center">
                  A magic login link has been sent to your email. Please check your inbox.
                </p>
              </div>
            ) : (
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
                
                {/* Magic Link Form */}
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
                  {error && (
                    <div className="p-3 rounded-md bg-red-900/20 border border-red-400/20">
                      <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage; 