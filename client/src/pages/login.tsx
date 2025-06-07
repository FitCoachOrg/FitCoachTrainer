import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check for error in URL
    const hash = location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      if (error === 'access_denied') {
        if (errorDescription?.includes('expired')) {
          setError('Login link has expired. Please request a new one.');
        } else {
          setError('Invalid login link. Please request a new one.');
        }
        // Clean up the URL
        navigate('/login', { replace: true });
      }
    }

    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    checkUser();
  }, [navigate, location]);

  // Check if trainer exists in database
  const checkUserInDatabase = async (email: string) => {
    try {
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainer')
        .select('id, trainer_name, trainer_email')
        .eq('trainer_email', email.trim().toLowerCase())
        .single();

      if (trainerError) {
        setError('Trainer account not found');
        return null;
      }
      
      return trainerData;
    } catch (err) {
      console.error('Error checking user in database:', err);
      setError('Error checking database');
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // First check if trainer exists in database
    const trainerData = await checkUserInDatabase(cleanEmail);
    
    if (!trainerData) {
      setError("Trainer account not found");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          shouldCreateUser: false // Prevent creating new users
        }
      });

      if (error) {
        setError(`Failed to send login link: ${error.message}`);
        return;
      }

      setMessage(`Login link sent to ${cleanEmail}! Check your email and click the link to login.`);
      
      // Store trainer info temporarily
      sessionStorage.setItem('pendingTrainerId', trainerData.id);
      sessionStorage.setItem('pendingTrainerName', trainerData.trainer_name);

    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
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
              Enter your email to access your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              {message && (
                <div className="p-3 rounded-md bg-blue-900/20 border border-blue-400/20">
                  <p className="text-sm text-blue-400 text-center">{message}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Icons.Loader2Icon className="h-4 w-4 animate-spin" />
                    Sending Login Link...
                  </div>
                ) : (
                  "Send Login Link"
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                We'll send you a secure login link to your email
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage; 