import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as Icons from "@/lib/icons";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

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

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    trainerName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // First, sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.trainerName,
            trainer_name: formData.trainerName,
            role: 'trainer'
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (authData.user) {
        // Also save to custom trainer table
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainer')
          .insert([
            {
              id: authData.user.id, // Use Supabase user ID as trainer ID
              trainer_name: formData.trainerName,
              trainer_email: formData.email.trim().toLowerCase(),
              trainer_password: formData.password, // Supabase Auth already handles secure password storage
            },
          ])
          .select()
          .single();

        if (trainerError) {
          console.error('Error creating trainer profile:', trainerError);
          // Continue anyway since Supabase Auth user was created successfully
        }

        // Check if user needs email confirmation
        if (!authData.session) {
          setError("Please check your email and click the confirmation link to complete your registration.");
          setIsLoading(false);
          return;
        }

        // Set localStorage authentication if session exists
        localStorage.setItem("isAuthenticated", "true");
        
        console.log('Signup successful:', { authData, trainerData });
        
        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message.includes('already registered') || err.message.includes('already been registered')) {
        setError('This email is already registered. Please try logging in instead.');
      } else if (err.message.includes('duplicate key value violates unique constraint')) {
        setError('This email is already registered. Please try logging in instead.');
      } else if (err.message.includes('email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || "An error occurred during signup");
      }
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
              Create Your FitPro Account
            </CardTitle>
            <p className="text-center text-slate-400">
              Join our fitness community today
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  name="trainerName"
                  placeholder="Full Name"
                  value={formData.trainerName}
                  onChange={handleInputChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Icons.Loader2Icon className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-sm text-center text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-green-400 hover:text-green-300"
                >
                  Sign In
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
