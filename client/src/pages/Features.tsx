import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  Clock, 
  Users, 
  BarChart3, 
  Smartphone, 
  Globe, 
  Zap, 
  Target, 
  Heart,
  TrendingUp,
  Shield,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Award,
  Calendar,
  FileText,
  ShoppingCart,
  MessageSquare,
  Share2,
  DollarSign,
  Palette,
  Headphones,
  Brain,
  Activity,
  Moon,
  Droplets,
  Utensils,
  Dumbbell,
  Timer,
  Download,
  Upload,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Floating dots component for consistent theme
const FloatingDots = () => {
  const [dots] = useState(() => {
    const newDots = [];
    for (let i = 0; i < 100; i++) {
      newDots.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 8,
      });
    }
    return newDots;
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute bg-white rounded-full opacity-10"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated counter component
const AnimatedCounter = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, end, duration]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      onViewportEnter={() => setIsVisible(true)}
      className="text-4xl font-bold text-green-500"
    >
      {count}%
    </motion.span>
  );
};

// Feature highlight component
const FeatureHighlight = ({ 
  icon, 
  title, 
  description, 
  delay = 0,
  isHighlighted = false 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay?: number;
  isHighlighted?: boolean;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6, delay }}
      className={`relative ${isHighlighted ? 'scale-105' : ''}`}
    >
      <Card className={`h-full transition-all duration-300 hover:shadow-xl ${
        isHighlighted 
          ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-500 shadow-green-500/20' 
          : 'bg-gray-900 border-gray-700 hover:border-green-500/50'
      }`}>
        <CardHeader className="text-center">
          <motion.div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isHighlighted ? 'bg-green-600' : 'bg-gray-800'
            }`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-green-400 text-2xl">
              {icon}
            </div>
          </motion.div>
          <CardTitle className={`text-xl ${isHighlighted ? 'text-white' : 'text-white'}`}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-center ${isHighlighted ? 'text-gray-200' : 'text-gray-300'}`}>
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Pain point question component
const PainPointQuestion = ({ 
  question, 
  answer, 
  features, 
  delay = 0 
}: { 
  question: string; 
  answer: string; 
  features: string[]; 
  delay?: number;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 }
      }}
      transition={{ duration: 0.8, delay }}
      className="mb-12"
    >
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
        <motion.h3 
          className="text-2xl font-bold text-white mb-4 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          <span className="text-green-500">❓</span>
          {question}
        </motion.h3>
        <motion.p 
          className="text-gray-300 text-lg mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
        >
          {answer}
        </motion.p>
        <motion.div 
          className="grid md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3 bg-green-900/30 rounded-lg p-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.8 + index * 0.1 }}
            >
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-200">{feature}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

const Features: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const coreFeatures = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Smart Client Management",
      description: "Replace scattered spreadsheets with integrated dashboard for sessions, payments, and client records.",
      highlight: "40% less admin time"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Automation",
      description: "Automate recurring tasks like reminders, invoicing, and workout plan updates.",
      highlight: "5-10 hours saved weekly"
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: "Seamless Plan Migration",
      description: "Import existing workout or nutrition plans via CSV/Excel to preserve your hard work.",
      highlight: "Zero data loss"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Monthly AI Reports",
      description: "Get in-depth performance analytics and recommendations without manual number crunching.",
      highlight: "Data-driven insights"
    }
  ];

  const trainingFeatures = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Drag-and-Drop Plan Builder",
      description: "Create personalized workout and nutrition plans in minutes.",
      highlight: "Minutes not hours"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "AI-Generated Content",
      description: "Leverage world-class fitness and nutrition science to auto-generate programs.",
      highlight: "Science-backed plans"
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: "360° Wellness Tracking",
      description: "Monitor sleep, hydration, stress, macros, and calorie intake—beyond fitness alone.",
      highlight: "Holistic health view"
    },
    {
      icon: <RefreshCw className="h-8 w-8" />,
      title: "Flexible Plan Swaps",
      description: "Life happens: clients can swap meals or workouts without falling off track.",
      highlight: "Real-world flexibility"
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Grocery List Generator",
      description: "Provide clients with instant shopping lists to increase compliance.",
      highlight: "Higher compliance"
    }
  ];

  const engagementFeatures = [
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Branded Mobile Apps",
      description: "Deliver a premium, white-label experience under your name.",
      highlight: "Your brand, your app"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Real-Time Progress Monitoring",
      description: "Watch clients' adherence and performance live to deliver data-driven feedback.",
      highlight: "Live insights"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Gamification",
      description: "Build healthy habits through achievements, challenges, and rewards.",
      highlight: "Coming Soon"
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "Social Media Integration",
      description: "Clients can share milestones directly to Instagram, TikTok, or Facebook.",
      highlight: "Viral growth"
    }
  ];

  const globalFeatures = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multi-Currency Payments",
      description: "Built-in tools for coaches ready to expand internationally.",
      highlight: "Global scaling"
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "White-Label Branding",
      description: "Your colors, your logo, your brand—no generic look-alike apps.",
      highlight: "100% branded"
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "Dedicated Support",
      description: "One-on-one setup calls and continued partnership to ensure your success.",
      highlight: "Real partnership"
    }
  ];

  const painPoints = [
    {
      question: "Spending too much time on admin tasks instead of training clients?",
      answer: "CoachEZ.ai automates your business workflows end-to-end, freeing you to focus on what you do best.",
      features: [
        "Smart scheduling and client management",
        "Automated invoicing and reminders",
        "AI-powered workout plan updates",
        "Monthly performance analytics"
      ]
    },
    {
      question: "Struggling to keep clients engaged and retain them long-term?",
      answer: "Our sticky mobile apps and social features create viral growth and higher retention.",
      features: [
        "Branded iOS & Android apps",
        "Real-time progress monitoring",
        "Social media milestone sharing",
        "Gamification and rewards system"
      ]
    },
    {
      question: "Want to scale beyond local clients but don't know how?",
      answer: "Built-in global tools and white-label branding help you expand worldwide.",
      features: [
        "Multi-currency payment processing",
        "White-label branding options",
        "Dedicated onboarding support",
        "Global scaling capabilities"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white">
        <FloatingDots />
        
        {/* Green gradient light effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-r from-green-500/20 to-green-600/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-green-400/10 to-green-300/5 blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-green-900/30 rounded-full px-4 py-2 mb-6"
            >
              <Sparkles className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">Professional Trainer Platform</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 text-white">
              Features That <span className="text-green-500">Scale Your Business</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto">
              Stop juggling spreadsheets and generic tools. Get a platform built specifically for fitness professionals who want to grow globally.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/trainer-signup'}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/support'}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Book Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Key Differentiators - Quick Animation */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Why <span className="text-green-500">CoachEZ.ai</span> Wins
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for trainers who want to scale beyond local clients
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Activity className="h-8 w-8" />, title: "360° Health Coverage", desc: "Track sleep, stress, hydration" },
              { icon: <Brain className="h-8 w-8" />, title: "AI-Native Automation", desc: "40% less admin workload" },
              { icon: <RefreshCw className="h-8 w-8" />, title: "Real-World Flexibility", desc: "Life happens, plans adapt" },
              { icon: <Globe className="h-8 w-8" />, title: "Global-Ready Platform", desc: "Scale beyond local clients" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 bg-green-900 rounded-full mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-green-400 text-3xl">
                    {item.icon}
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Solve Your <span className="text-green-500">Biggest Challenges</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We asked trainers what keeps them up at night. Here's how we solve it.
            </p>
          </motion.div>

          {painPoints.map((painPoint, index) => (
            <PainPointQuestion
              key={index}
              question={painPoint.question}
              answer={painPoint.answer}
              features={painPoint.features}
              delay={index * 0.2}
            />
          ))}
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Business Management & <span className="text-green-500">Automation</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Replace scattered tools with integrated automation that saves you 5-10 hours per week
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreFeatures.map((feature, index) => (
              <FeatureHighlight
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
                isHighlighted={index === 1}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-8 border border-green-500">
              <h3 className="text-2xl font-bold text-white mb-4">
                Competitive Differentiator
              </h3>
              <p className="text-gray-200 text-lg">
                Most platforms stop at scheduling; CoachEZ.ai automates business workflows end-to-end, 
                freeing coaches to scale globally.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Training & Nutrition Features */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Training & Nutrition <span className="text-green-500">Delivery</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Create science-backed plans in minutes, not hours
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainingFeatures.map((feature, index) => (
              <FeatureHighlight
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
                isHighlighted={index === 2}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-8 border border-green-500">
              <h3 className="text-2xl font-bold text-white mb-4">
                Competitive Differentiator
              </h3>
              <p className="text-gray-200 text-lg">
                Unlike Trainerize or MyPTHub, CoachEZ.ai offers built-in lifestyle tracking (sleep, stress) 
                and AI-driven flexibility tools to keep clients engaged.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Client Engagement Features */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Client Engagement & <span className="text-green-500">Retention</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Sticky mobile apps + social sharing = viral growth and higher retention
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {engagementFeatures.map((feature, index) => (
              <FeatureHighlight
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
                isHighlighted={index === 0}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-8 border border-green-500">
              <h3 className="text-2xl font-bold text-white mb-4">
                Competitive Differentiator
              </h3>
              <p className="text-gray-200 text-lg">
                Sticky mobile apps + social sharing = viral growth and higher retention 
                versus basic portals offered by competitors.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global Growth Features */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Global Growth <span className="text-green-500">Tools</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Scale beyond local clients with built-in global capabilities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {globalFeatures.map((feature, index) => (
              <FeatureHighlight
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
                isHighlighted={index === 1}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-8 border border-green-500">
              <h3 className="text-2xl font-bold text-white mb-4">
                Competitive Differentiator
              </h3>
              <p className="text-gray-200 text-lg">
                Most platforms offer generic help docs; CoachEZ.ai pairs you with a real partner 
                to grow your business worldwide.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              The <span className="text-green-500">CoachEZ Difference</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built specifically for trainers who want to scale globally
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Trainer Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gray-900 rounded-2xl p-8 border border-gray-700"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-400" />
                Benefits for Trainers
              </h3>
              <div className="space-y-4">
                {[
                  "Save 5–10 hours per week on admin tasks",
                  "Deliver science-backed, data-driven plans that impress clients",
                  "Build stronger relationships and boost retention with real-time engagement tools",
                  "Grow revenue streams with global scaling capabilities"
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Client Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gray-900 rounded-2xl p-8 border border-gray-700"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Heart className="h-8 w-8 text-green-400" />
                Benefits for Clients
              </h3>
              <div className="space-y-4">
                {[
                  "Personalized, adaptive fitness and nutrition plans that evolve with their needs",
                  "Seamless mobile experience with progress tracking and gamification",
                  "Motivation through social sharing, rewards, and habit-building tools",
                  "Holistic health tracking to improve overall wellness, not just fitness"
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white relative">
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
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Ready to <span className="text-green-500">Scale Your Business</span>?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Join thousands of trainers who've transformed their business with CoachEZ.ai
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/trainer-signup'}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/support'}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Book Demo Call
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features;


