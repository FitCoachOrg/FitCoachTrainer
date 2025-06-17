import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getTrainerId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session); // Debug log

        if (session?.user) {
          console.log('User authenticated:', session.user); // Debug log
          
          // Use the user ID as trainer ID
          const trainerId = session.user.id;
          console.log('Using user ID as trainer ID:', trainerId); // Debug log
          setTrainerId(trainerId);
        } else {
          console.log('No active session found'); // Debug log
          setTrainerId(null);
        }
      } catch (error) {
        console.error('Error getting trainer ID:', error);
        setTrainerId(null);
      } finally {
        setIsLoading(false);
      }
    };

    getTrainerId();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session); // Debug log
      
      if (session?.user) {
        console.log('User authenticated on change:', session.user); // Debug log
        
        // Use the user ID as trainer ID
        const trainerId = session.user.id;
        console.log('Using user ID as trainer ID on change:', trainerId); // Debug log
        setTrainerId(trainerId);
      } else {
        console.log('No active session on change'); // Debug log
        setTrainerId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { trainerId, isLoading };
} 