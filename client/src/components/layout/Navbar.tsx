import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, LogIn } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-lg border-b border-white/10' 
          : 'bg-transparent border border-white rounded-xl mt-4 mx-2 backdrop-blur-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex-shrink-0"
          >
            <Link to="/" className="text-white text-2xl font-bold">
              Coach<span className="text-green-500">EZ</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="hidden md:block"
          >
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                >
                  <Link
                    to={item.href}
                    className="text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors duration-200 relative group"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </motion.div>
              ))}
              {/* Trainer Profile Link */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + navItems.length * 0.1, duration: 0.6 }}
              >
                <NavLink
                  to="/trainer-profile"
                  className={({ isActive }) => 
                    `text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors duration-200 relative group ${isActive ? 'text-blue-600 font-bold' : ''}`
                  }
                >
                  Profile
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
                </NavLink>
              </motion.div>
            </div>
          </motion.div>

          {/* Desktop Auth Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="hidden md:flex items-center space-x-4"
          >
            <Link
              to="/login"
              className="text-white hover:text-green-400 px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            {!location.pathname.includes('/trainer-signup') && (
              <Link
                to="/trainer-signup"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Sign Up
              </Link>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-green-400 p-2 transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={isOpen ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden bg-black/90 backdrop-blur-lg rounded-lg mt-2"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-white hover:text-green-400 hover:bg-white/10 block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {/* Trainer Profile Link for Mobile */}
            <Link
              to="/trainer-profile"
              className="text-white hover:text-green-400 hover:bg-white/10 block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <div className="border-t border-white/20 pt-4 space-y-2">
              <Link
                to="/login"
                className="text-white hover:text-green-400 hover:bg-white/10  px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              {!location.pathname.includes('/trainer-signup') && (
                <Link
                  to="/trainer-signup"
                  className="bg-green-600 hover:bg-green-700 text-white  px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}

export default Navbar;