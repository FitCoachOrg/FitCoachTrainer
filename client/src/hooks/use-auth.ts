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
          console.log('User metadata:', session.user.user_metadata); // Debug log
          // Get trainer ID from user metadata
          const trainerId = session.user.user_metadata.trainer_id;
          console.log('Found trainer ID:', trainerId); // Debug log

          if (!trainerId) {
            console.error('No trainer ID found in user metadata');
            setTrainerId(null);
          } else {
            setTrainerId(trainerId);
          }
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
        console.log('User metadata on change:', session.user.user_metadata); // Debug log
        const trainerId = session.user.user_metadata.trainer_id;
        console.log('Found trainer ID on change:', trainerId); // Debug log

        if (!trainerId) {
          console.error('No trainer ID found in user metadata');
          setTrainerId(null);
        } else {
          setTrainerId(trainerId);
        }
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