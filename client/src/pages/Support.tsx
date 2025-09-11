import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  Users, 
  Shield, 
  Zap, 
  Heart,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Video,
  FileText,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Floating dots component similar to homepage
const FloatingDots = () => {
  const [dots, setDots] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const generateDots = () => {
      const newDots = [];
      for (let i = 0; i < 80; i++) {
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

const Support: React.FC = () => {
  const supportFeatures = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "24/7 Support",
      description: "Round-the-clock assistance whenever you need us"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Team",
      description: "Fitness professionals and tech experts at your service"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Your data and conversations are always protected"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fast Response",
      description: "Quick solutions to get you back on track"
    }
  ];

  const faqItems = [
    {
      question: "How do I get started with CoachEZ?",
      answer: "Getting started is easy! Simply sign up for an account, complete your profile setup, and you'll be guided through our onboarding process to get you up and running quickly."
    },
    {
      question: "What if I need help with my client management?",
      answer: "Our support team specializes in fitness business operations. We can help you with client onboarding, progress tracking, workout planning, and any platform features."
    },
    {
      question: "Can I integrate CoachEZ with other tools?",
      answer: "Yes! CoachEZ offers various integrations with popular fitness and business tools. Contact our support team to learn about available integrations and setup assistance."
    },
    {
      question: "How do I handle technical issues?",
      answer: "For technical issues, our support team is here to help. We provide step-by-step guidance, screen sharing sessions, and quick troubleshooting to resolve any problems."
    }
  ];


  const supportCommitments = [
    {
      icon: <Heart className="h-5 w-5 text-red-500" />,
      title: "We Care About Your Success",
      description: "Your success as a fitness professional is our mission. We're committed to providing the tools and support you need to grow your business and help your clients achieve their goals."
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: "Proven Track Record",
      description: "Thousands of fitness professionals trust CoachEZ to manage their businesses. Our platform has helped trainers increase client retention by 40% on average."
    },
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      title: "Excellence in Service",
      description: "We maintain a 98% customer satisfaction rate and average response time of under 2 hours. Your success is our priority."
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white">
        {/* Floating dots animation */}
        <FloatingDots />
        
        {/* Green gradient light effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-r from-green-500/20 to-green-600/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-green-400/10 to-green-300/5 blur-[80px]" />
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              We're Here to <span className="text-green-500">Help</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              Your success is our mission. Get the support you need to grow your fitness business and help your clients achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = 'mailto:support@coachez.ai'}
              >
                <Mail className="mr-2 h-5 w-5" />
                Contact Support
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/faq'}
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                View FAQ
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Features */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Our <span className="text-green-500">Support</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              We're committed to providing world-class support that helps you succeed
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300 bg-gray-900 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900 rounded-lg mb-4">
                      <div className="text-green-400">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Support Commitment */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Commitment to You
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're not just a platform - we're your partner in success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {supportCommitments.map((commitment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {commitment.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {commitment.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {commitment.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Quick answers to common questions
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      {item.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white relative">
        {/* Additional floating dots for CTA section */}
        <FloatingDots />
        
        {/* Green gradient light effects for CTA */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-r from-green-500/15 to-green-600/8 blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Get <span className="text-green-500">Started</span>?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Our support team is ready to help you succeed. Don't hesitate to reach out!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = 'mailto:support@coachez.ai'}
              >
                <Mail className="mr-2 h-5 w-5" />
                Email Support
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/faq'}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                View FAQ
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Support;
