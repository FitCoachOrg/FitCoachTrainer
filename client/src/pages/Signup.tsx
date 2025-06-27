import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [invitationFound, setInvitationFound] = useState(false);

  // Parse query parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const trainerParam = queryParams.get("trainer");
    const emailParam = queryParams.get("email");
    
    if (trainerParam) {
      setTrainerId(trainerParam);
    }
    
    if (emailParam) {
      setEmail(emailParam);
      // Check if this email has a pending invitation
      checkInvitation(emailParam, trainerParam);
    }
  }, [location.search]);

  // Check if there's a pending invitation for this email and trainer
  const checkInvitation = async (email: string, trainerId: string | null) => {
    if (!email || !trainerId) return;
    
    try {
      const { data, error } = await supabase
        .from("trainer_client_web")
        .select("trainer_name, status")
        .eq("cl_email", email)
        .eq("trainer_id", trainerId)
        .eq("status", "pending")
        .single();

      if (error) {
        console.error("Error checking invitation:", error);
        return;
      }

      if (data) {
        setInvitationFound(true);
        setTrainerName(data.trainer_name);
      }
    } catch (error) {
      console.error("Unexpected error checking invitation:", error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // If this was an invited client, create a client record and update the relationship
        if (invitationFound && trainerId) {
          // Create client record
          const { error: clientError } = await supabase
            .from("client")
            .insert([
              {
                cl_name: name,
                cl_email: email,
                cl_username: email.split('@')[0], // Simple username from email
                trainer_id: trainerId
              }
            ]);

          if (clientError) {
            console.error("Error creating client record:", clientError);
            // Continue anyway, as the auth account was created
          } else {
            // Get the newly created client ID
            const { data: clientData, error: fetchError } = await supabase
              .from("client")
              .select("client_id")
              .eq("cl_email", email)
              .single();

            if (!fetchError && clientData) {
              // Update the trainer_client_web relationship
              await supabase
                .from("trainer_client_web")
                .update({ 
                  client_id: clientData.client_id,
                  status: "active" 
                })
                .eq("cl_email", email)
                .eq("trainer_id", trainerId);
            }
          }
        }

        toast({
          title: "Account created",
          description: "Your account has been created successfully. You can now log in.",
        });
        
        // Redirect to login page
        navigate("/login");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f8f9fb] via-[#f0f4f9] to-[#e8f2ff] dark:from-black dark:via-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200/70 dark:border-gray-800/70">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-center">
            {invitationFound && trainerName 
              ? `You've been invited by ${trainerName} to join FitCoachTrainer`
              : "Sign up to get started with FitCoachTrainer"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={invitationFound} // Disable if this is from an invitation
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Log in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
