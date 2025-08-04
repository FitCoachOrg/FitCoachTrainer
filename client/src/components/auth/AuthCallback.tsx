import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (!session?.user) {
          throw new Error('No user session found')
        }

        // Check if user exists in trainer table
        const { data: existingTrainer, error: trainerError } = await supabase
          .from('trainer')
          .select('*')
          .eq('trainer_email', session.user.email)
          .single()

        if (trainerError && trainerError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          throw trainerError
        }

        if (!existingTrainer) {
          // Create basic trainer record for OAuth users
          const { error: insertError } = await supabase
            .from('trainer')
            .insert([
              {
                trainer_email: session.user.email,
                trainer_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'New Trainer',
                avatar_url: session.user.user_metadata?.avatar_url,
                google_id: session.user.user_metadata?.sub,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])

          if (insertError) {
            console.error('Error creating trainer record:', insertError)
            // Don't throw here - user can still access the app
          }
        } else {
          // Update existing trainer with Google info if needed
          const updateData: any = {
            updated_at: new Date().toISOString()
          }

          if (session.user.user_metadata?.avatar_url && !existingTrainer.avatar_url) {
            updateData.avatar_url = session.user.user_metadata.avatar_url
          }

          if (session.user.user_metadata?.sub && !existingTrainer.google_id) {
            updateData.google_id = session.user.user_metadata.sub
          }

          if (Object.keys(updateData).length > 1) { // More than just updated_at
            const { error: updateError } = await supabase
              .from('trainer')
              .update(updateData)
              .eq('trainer_email', session.user.email)

            if (updateError) {
              console.error('Error updating trainer record:', updateError)
            }
          }
        }

        setStatus('success')
        setMessage('Authentication successful! Redirecting to dashboard...')

        toast({
          title: 'Welcome!',
          description: `Successfully signed in as ${session.user.email}`,
        })

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)

      } catch (error: any) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')

        toast({
          title: 'Authentication Failed',
          description: error.message || 'An error occurred during sign-in',
          variant: 'destructive',
        })

        // Redirect to login after error
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            {status === 'loading' && 'Processing Sign-In'}
            {status === 'success' && 'Sign-In Successful'}
            {status === 'error' && 'Sign-In Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {message}
          </p>
          {status === 'loading' && (
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallback 