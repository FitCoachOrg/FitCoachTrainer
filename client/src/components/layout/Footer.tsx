import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className={`border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CE</span>
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Coach<span className="text-green-500">EZ</span>
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Empowering fitness professionals to grow their business and deliver exceptional training experiences to clients worldwide.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/coachez" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm hover:text-blue-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Twitter
              </a>
              <a 
                href="https://linkedin.com/company/coachez" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm hover:text-blue-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                LinkedIn
              </a>
              <a 
                href="https://instagram.com/coachez" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm hover:text-blue-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/" 
                  className={`hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/trainer-signup" 
                  className={`hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Become a Trainer
                </Link>
              </li>
              <li>
                <Link 
                  to="/login" 
                  className={`hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className={`hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  className={`hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/support" 
                  className={`hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`border-t mt-8 pt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              © {new Date().getFullYear()} CoachEZ. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy-policy" 
                className={`text-sm hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Privacy
              </Link>
              <Link 
                to="/terms-of-service" 
                className={`text-sm hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Terms
              </Link>
              <a 
                href="mailto:legal@coachez.com" 
                className={`text-sm hover:text-green-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Legal
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 