import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  google_id?: string;
  created_at: string;
}

export interface Trainer {
  id: number;
  trainer_email: string;
  trainer_name: string;
  avatar_url?: string;
  google_id?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          setUser(null);
          setTrainer(null);
          return;
        }

        // Create user object from session
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          google_id: session.user.user_metadata?.sub,
          created_at: session.user.created_at,
        };

        setUser(userData);

        // Fetch trainer data from database
        if (userData.email) {
          const { data: trainerData, error: trainerError } = await supabase
            .from('trainer')
            .select('*')
            .eq('trainer_email', userData.email)
            .single();

          if (trainerError) {
            if (trainerError.code === 'PGRST116') {
              // Not found: create trainer record on initial load
              const { data: newTrainer, error: insertError } = await supabase
                .from('trainer')
                .insert([
                  {
                    trainer_email: userData.email,
                    trainer_name: userData.full_name || 'New Trainer',
                    avatar_url: userData.avatar_url,
                    google_id: userData.google_id,
                    full_name: userData.full_name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ])
                .select()
                .single();

              if (!insertError && newTrainer) {
                setTrainer(newTrainer);
              } else if (insertError) {
                console.error('Error creating trainer record on init:', insertError);
                setError(insertError.message);
              }
            } else {
              console.error('Error fetching trainer data:', trainerError);
              setError(trainerError.message);
            }
          } else if (trainerData) {
            setTrainer(trainerData);
          }
        }

      } catch (err: any) {
        console.error('Error getting current user:', err);
        setError(err.message);
        setUser(null);
        setTrainer(null);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          google_id: session.user.user_metadata?.sub,
          created_at: session.user.created_at,
        };

        setUser(userData);

        // Fetch or create trainer record
        if (userData.email) {
          try {
            const { data: trainerData, error: trainerError } = await supabase
              .from('trainer')
              .select('*')
              .eq('trainer_email', userData.email)
              .single();

            if (trainerError && trainerError.code === 'PGRST116') {
              // Trainer not found, create new record
              const { data: newTrainer, error: insertError } = await supabase
                .from('trainer')
                .insert([
                  {
                    trainer_email: userData.email,
                    trainer_name: userData.full_name || 'New Trainer',
                    avatar_url: userData.avatar_url,
                    google_id: userData.google_id,
                    full_name: userData.full_name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ])
                .select()
                .single();

              if (insertError) {
                console.error('Error creating trainer record:', insertError);
              } else if (newTrainer) {
                setTrainer(newTrainer);
              }
            } else if (trainerData) {
              setTrainer(trainerData);
            }
          } catch (err) {
            console.error('Error handling trainer data:', err);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTrainer(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setTrainer(null);
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message);
    }
  };

  return { 
    user, 
    trainer, 
    isLoading, 
    error, 
    signOut,
    isAuthenticated: !!user 
  };
} 