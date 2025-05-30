import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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

function HomeSection() {
  return (
    <div className="w-full bg-black min-h-screen">
      {/* Light Effect */}
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
          className="text-white text-5xl font-bold z-10 relative"
        >
          Build Better Habits,
          <br />
          <span className="text-green-500">Transform Your Life</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white mt-4 max-w-xl z-10 relative text-lg"
        >
          Track, analyze, and improve your daily habits with our intuitive
          platform designed to help you achieve your goals.
        </motion.p>

        <motion.div
          className="flex gap-4 mt-8 z-10 relative flex-wrap justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link to="/signup">
            <Button className="bg-green-700 hover:bg-green-800 text-white cursor-pointer px-6 py-3">
              Get Started
            </Button>
          </Link>
          <Button className="bg-white text-green-700 hover:bg-gray-100 cursor-pointer px-6 py-3 flex items-center gap-2">
            See How it Works
            <TrendingUp className="h-4 w-4 text-green-500" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default HomeSection;