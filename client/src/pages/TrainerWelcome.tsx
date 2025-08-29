import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Users, 
  Calendar, 
  Settings, 
  CreditCard,
  BookOpen,
  Trophy,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  link: string;
  icon: React.ReactNode;
}

const TrainerWelcome = () => {
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();
  const [trainerName, setTrainerName] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    // Get trainer info from session
    const getTrainerInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get trainer data from database
          const { data: trainerData } = await supabase
            .from('trainer')
            .select('trainer_name, profile_completion_percentage')
            .eq('trainer_email', session.user.email)
            .single();

          if (trainerData) {
            setTrainerName(trainerData.trainer_name);
            setProfileCompletion(trainerData.profile_completion_percentage || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching trainer info:', error);
      }
    };

    getTrainerInfo();
  }, []);

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Add your photo, bio, and contact information',
      status: profileCompletion > 50 ? 'completed' : 'pending',
      link: '/trainer-profile',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'availability',
      title: 'Set Availability',
      description: 'Configure your working hours and availability',
      status: 'pending',
      link: '/availability',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'programs',
      title: 'Create Programs',
      description: 'Build your first training programs',
      status: 'pending',
      link: '/fitness-plans',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 'payments',
      title: 'Set Up Payments',
      description: 'Configure your payment methods',
      status: 'pending',
      link: '/payments',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'branding',
      title: 'Customize Branding',
      description: 'Personalize your brand colors and logo',
      status: 'pending',
      link: '/branding',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const quickStartGuides = [
    {
      title: 'Create Your First Program',
      description: 'Learn how to build effective training programs',
      icon: <BookOpen className="h-6 w-6" />,
      link: '/fitness-plans'
    },
    {
      title: 'Set Up Client Management',
      description: 'Organize and track your clients effectively',
      icon: <Users className="h-6 w-6" />,
      link: '/clients'
    },
    {
      title: 'Using AI Insights',
      description: 'Leverage AI-powered analytics for better results',
      icon: <Sparkles className="h-6 w-6" />,
      link: '/dashboard'
    },
    {
      title: 'Payment Setup',
      description: 'Configure secure payment processing',
      icon: <CreditCard className="h-6 w-6" />,
      link: '/payments'
    }
  ];

  const completedItems = checklistItems.filter(item => item.status === 'completed').length;
  const totalItems = checklistItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-black dark:via-slate-900 dark:to-slate-800 pt-24 pb-8">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-green-500 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Welcome to Coach<span className="text-green-500">EZ</span>!
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Congratulations, {trainerName}! Your account has been created successfully. 
            Let's get you set up and ready to transform lives.
          </p>
          <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
            Profile Completion: {profileCompletion}%
          </Badge>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Setup Checklist */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="bg-white/90 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
                  Setup Checklist
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Complete these steps to get your business running
                </CardDescription>
                <div className="mt-4">
                  <Progress value={(completedItems / totalItems) * 100} className="h-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {completedItems} of {totalItems} tasks completed
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklistItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-green-500/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-green-500">
                          {item.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="text-green-500">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(item.link)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Start Guide */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/90 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-green-500" />
                  Quick Start Guide
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Essential guides to help you get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickStartGuides.map((guide, index) => (
                  <motion.div
                    key={guide.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  >
                                         <div 
                       className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-green-500/50 transition-colors cursor-pointer"
                       onClick={() => navigate(guide.link)}
                     >
                       <div className="text-green-500">
                         {guide.icon}
                       </div>
                       <div className="flex-1">
                         <h3 className="font-medium text-gray-900 dark:text-white">{guide.title}</h3>
                         <p className="text-sm text-gray-600 dark:text-gray-400">{guide.description}</p>
                       </div>
                       <ArrowRight className="h-4 w-4 text-green-400" />
                     </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Card className="bg-gradient-to-r from-green-600/10 to-blue-600/10 dark:from-green-600/20 dark:to-blue-600/20 border-green-500/30">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Begin by completing your profile and creating your first training program.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  onClick={() => navigate('/trainer-profile')}
                >
                  Complete Profile
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-3"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainerWelcome; 