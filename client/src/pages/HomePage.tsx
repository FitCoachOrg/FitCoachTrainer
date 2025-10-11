import { Button } from "@/components/ui/button";
import { motion, useAnimation, useInView } from "framer-motion";
import { 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Smartphone, 
  Globe, 
  Zap, 
  Target, 
  Heart,
  Brain,
  Activity,
  RefreshCw,
  ShoppingCart,
  Award,
  Share2,
  Palette,
  Headphones,
  Sparkles,
  Play,
  MessageSquare,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Floating dots component
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
  const ref = useRef(null);
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
          <CardTitle className="text-xl text-white">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-300">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function HomeSection() {
  const featuresRef = useRef<HTMLDivElement>(null);

  // Handle hash routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#features' && featuresRef.current) {
        featuresRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const coreFeatures = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Smart Client Management",
      description: "Replace scattered spreadsheets with integrated dashboard for sessions, payments, and client records.",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Automation",
      description: "Automate recurring tasks like reminders, invoicing, and workout plan updates.",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Drag-and-Drop Plan Builder",
      description: "Create personalized workout and nutrition plans in minutes.",
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Branded Mobile Apps",
      description: "Deliver a premium, white-label experience under your name.",
    }
  ];

  return (
    <div className="w-full bg-black min-h-screen">
      {/* Hero Section */}
      <div className="w-full h-screen flex justify-center items-center flex-col relative text-center px-4">
        {/* Floating dots animation */}
        <FloatingDots />
        
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-r from-green-500/20 to-green-600/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-green-400/10 to-green-300/5 blur-[80px]" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white text-3xl sm:text-4xl md:text-5xl font-bold z-10 relative px-4"
        >
          Build Better Habits,
          <br />
          <span className="text-green-500">Transform Your Life</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white mt-4 max-w-xl z-10 relative text-base sm:text-lg px-4"
        >
          Track, analyze, and improve your daily habits with our intuitive
          platform designed to help you achieve your goals.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-8 z-10 relative justify-center px-4 w-full sm:w-auto max-w-md sm:max-w-none mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link to="/trainer-signup" className="w-full sm:w-auto">
            <Button className="bg-green-700 hover:bg-green-800 text-white cursor-pointer px-6 py-3 w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Button 
            className="bg-white text-green-700 hover:bg-gray-100 cursor-pointer px-6 py-3 flex items-center gap-2 justify-center w-full sm:w-auto"
            onClick={() => {
              if (featuresRef.current) {
                featuresRef.current.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
                // Update URL hash
                window.history.pushState(null, '', '#features');
              }
            }}
          >
            See How it Works
            <TrendingUp className="h-4 w-4 text-green-500" />
          </Button>
        </motion.div>
      </div>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16 px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-green-900/30 rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-4 md:mb-6"
            >
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
              <span className="text-green-400 font-medium text-sm md:text-base">Professional Trainer Platform</span>
            </motion.div>
            
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white">
              Features That <span className="text-green-500">Scale Your Business</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-gray-300 max-w-4xl mx-auto">
              Stop juggling spreadsheets and generic tools. Get a platform built specifically for fitness professionals who want to grow globally.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16 px-4">
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
            className="text-center"
          >
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-6 md:p-8 border border-green-500 mb-8 mx-4">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                Why CoachEZ.ai Wins
              </h3>
              <p className="text-gray-200 text-base md:text-lg mb-4 md:mb-6">
                Built for trainers who want to scale beyond local clients
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { icon: <Activity className="h-8 w-8" />, title: "360° Health Coverage", desc: "Track sleep, stress, hydration" },
                  { icon: <Brain className="h-8 w-8" />, title: "AI-Native Automation", desc: "40% less admin workload" },
                  { icon: <RefreshCw className="h-8 w-8" />, title: "Real-World Flexibility", desc: "Life happens, plans adapt" },
                  { icon: <Globe className="h-8 w-8" />, title: "Global-Ready Platform", desc: "Scale beyond local clients" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <motion.div
                      className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-white text-2xl">
                        {item.icon}
                      </div>
                    </motion.div>
                    <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-300 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link to="/features" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 text-base md:text-lg w-full sm:w-auto"
                >
                  <Star className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  View All Features
                </Button>
              </Link>
              <Link to="/trainer-signup" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-base md:text-lg w-full sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomeSection;