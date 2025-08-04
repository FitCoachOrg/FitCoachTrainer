import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
import { Settings } from 'lucide-react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Zap, 
  Star,
  CheckCircle,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

const TrainerSignup = () => {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();

  const benefits = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Client Management",
      description: "Easily manage all your clients in one place with comprehensive profiles and progress tracking."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Smart Scheduling",
      description: "Automated scheduling system that works around your availability and client preferences."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Progress Analytics",
      description: "Track client progress with detailed analytics and AI-powered insights."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Payments",
      description: "Integrated payment processing with automatic invoicing and payment tracking."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations and insights to improve client outcomes."
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Professional Branding",
      description: "Customize your brand with personalized logos, colors, and messaging."
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 pt-24">
      {/* Theme Toggle */}
      <div className="absolute top-28 right-6 z-50">
        <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme('light')}
            className={`px-3 py-1 text-xs ${theme === 'light' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Light
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 text-xs ${theme === 'dark' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Dark
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme('system')}
            className={`px-3 py-1 text-xs ${theme === 'system' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            System
          </Button>
        </div>
      </div>
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Join Coach<span className="text-green-500">EZ</span>
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            The ultimate platform for fitness professionals. Manage clients, track progress, 
            and grow your business with AI-powered insights.
          </p>

          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            onClick={() => navigate('/trainer-signup/register')}
          >
            Signup
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                <CardHeader>
                  <div className="text-green-500 mb-2">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-white text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Card className="bg-slate-800/90 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white mb-2 font-bold">
                Ready to Transform Your Training Business?
              </CardTitle>
              <CardDescription className="text-gray-200 text-lg">
                Join thousands of trainers who have already streamlined their business with Coach<span className="text-green-500">EZ</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 font-semibold"
                  onClick={() => navigate('/trainer-signup/register')}
                >
                  Signup
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className={`px-8 py-3 ${
                    theme === 'light' 
                      ? 'border-gray-700 text-gray-700 hover:bg-gray-100' 
                      : 'border-white text-white hover:bg-white/10'
                  }`}
                  onClick={() => navigate('/login')}
                >
                  Already Have an Account?
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainerSignup; 