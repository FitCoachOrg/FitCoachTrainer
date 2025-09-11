import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Users, 
  Dumbbell, 
  Utensils, 
  Calendar, 
  BarChart3, 
  CreditCard, 
  Palette, 
  FileText, 
  Settings,
  HelpCircle,
  Star,
  CheckCircle,
  ArrowRight,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Floating dots component for consistent theme
const FloatingDots = () => {
  const [dots] = useState(() => {
    const newDots = [];
    for (let i = 0; i < 60; i++) {
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
          className="absolute bg-white rounded-full opacity-15"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.15, 0.6, 0.15],
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
  tags: string[];
}

const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'getting-started', name: 'Getting Started', icon: <Star className="h-4 w-4" /> },
    { id: 'client-management', name: 'Client Management', icon: <Users className="h-4 w-4" /> },
    { id: 'workout-plans', name: 'Workout Plans', icon: <Dumbbell className="h-4 w-4" /> },
    { id: 'nutrition-plans', name: 'Nutrition Plans', icon: <Utensils className="h-4 w-4" /> },
    { id: 'dashboard', name: 'Dashboard & Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'billing', name: 'Billing & Payments', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'branding', name: 'Branding & Customization', icon: <Palette className="h-4 w-4" /> },
    { id: 'mobile-apps', name: 'Mobile Apps', icon: <Settings className="h-4 w-4" /> },
    { id: 'data-privacy', name: 'Data & Privacy', icon: <Settings className="h-4 w-4" /> },
    { id: 'technical', name: 'Technical Support', icon: <Settings className="h-4 w-4" /> },
  ];

  const faqData: FAQItem[] = [
    // Getting Started
    {
      id: 'what-is-fitcoachtrainer',
      question: 'What is FitCoachTrainer and how does it work?',
      answer: 'FitCoachTrainer is a comprehensive fitness coaching platform designed specifically for personal trainers and fitness professionals. It provides tools for client management, workout plan generation, nutrition planning, progress tracking, and business management. The platform uses AI-powered systems to create personalized fitness and nutrition plans based on client data, goals, and preferences.',
      category: 'getting-started',
      icon: <Star className="h-5 w-5" />,
      tags: ['platform', 'overview', 'features']
    },
    {
      id: 'how-to-sign-up',
      question: 'How do I sign up as a trainer?',
      answer: 'To sign up as a trainer, click "Sign Up" in the navigation bar, then select "Apply as Trainer" on the login page. You\'ll be taken through a comprehensive 5-step registration process that includes basic information, certifications, specialties, business details, and account creation. Once completed, you\'ll have immediate access to your trainer dashboard.',
      category: 'getting-started',
      icon: <Star className="h-5 w-5" />,
      tags: ['registration', 'signup', 'trainer']
    },
    {
      id: 'trainer-requirements',
      question: 'What are the requirements to become a trainer on the platform?',
      answer: 'While we welcome all fitness professionals, having relevant certifications (NASM, ACE, ACSM, etc.) and experience in personal training is recommended. The platform is designed to support trainers at all levels, from beginners to seasoned professionals. You can upload your certifications during the registration process.',
      category: 'getting-started',
      icon: <Star className="h-5 w-5" />,
      tags: ['requirements', 'certifications', 'qualifications']
    },

    // Client Management
    {
      id: 'add-clients',
      question: 'How do I add and manage my clients?',
      answer: 'You can add clients through the "Clients" section in your dashboard. Click "Add New Client" and fill out their information including personal details, fitness goals, experience level, available equipment, and any injuries or limitations. The system will create a comprehensive client profile that you can use to generate personalized workout and nutrition plans.',
      category: 'client-management',
      icon: <Users className="h-5 w-5" />,
      tags: ['clients', 'management', 'profiles']
    },
    {
      id: 'client-onboarding',
      question: 'What information do I need from my clients during onboarding?',
      answer: 'The platform collects comprehensive client information including: Personal details (age, height, weight, activity level), Fitness goals and timeline, Training experience and preferences, Available equipment, Focus areas and target muscle groups, Injuries or limitations, Dietary preferences and restrictions, Meal frequency preferences, and Specific outcomes they want to achieve.',
      category: 'client-management',
      icon: <Users className="h-5 w-5" />,
      tags: ['onboarding', 'client-data', 'information']
    },
    {
      id: 'client-dashboard',
      question: 'What can I see in a client\'s dashboard?',
      answer: 'Each client has a comprehensive dashboard showing: Overview with progress photos and notes, Training plans and workout history, Task assignments and completion status, Metrics and progress tracking, Food journal and macro tracking, Meal plans and nutrition guidance, On-demand content access, Document storage, and Settings and preferences.',
      category: 'client-management',
      icon: <Users className="h-5 w-5" />,
      tags: ['dashboard', 'client-view', 'progress']
    },

    // Workout Plans
    {
      id: 'workout-generation',
      question: 'How does the workout plan generation work?',
      answer: 'The platform uses an Enhanced Workout Generator that creates personalized plans based on: Client goals (strength, hypertrophy, endurance, fat loss), Experience level (beginner, intermediate, advanced), Available equipment, Target muscle groups, Injuries and limitations, Training frequency and session duration. The system ensures exercise variety, progressive overload, and follows ACSM/NSCA guidelines.',
      category: 'workout-plans',
      icon: <Dumbbell className="h-5 w-5" />,
      tags: ['workout', 'generation', 'AI', 'personalization']
    },
    {
      id: 'workout-editing',
      question: 'Can I edit and customize generated workout plans?',
      answer: 'Yes! The platform provides comprehensive editing capabilities: Individual exercise modification (sets, reps, duration, weights), Coach tips customization, Date and time scheduling, Add/remove exercises, Multiple view modes (table, calendar, weekly, daily), Draft saving and loading, and Approval workflow before saving to the database.',
      category: 'workout-plans',
      icon: <Dumbbell className="h-5 w-5" />,
      tags: ['editing', 'customization', 'workflow']
    },
    {
      id: 'exercise-library',
      question: 'What is the Exercise Library and how do I use it?',
      answer: 'The Exercise Library contains a comprehensive database of exercises with detailed information including: Exercise descriptions and instructions, Target muscle groups and categories, Equipment requirements, Video demonstrations (when available), Difficulty levels, and Safety considerations. You can search, filter, and browse exercises to create custom workouts or modify existing plans.',
      category: 'workout-plans',
      icon: <Dumbbell className="h-5 w-5" />,
      tags: ['library', 'exercises', 'database']
    },
    {
      id: 'progressive-overload',
      question: 'How does the progressive overload system work?',
      answer: 'The system automatically tracks and applies progressive overload by: Analyzing 2 weeks of previous workout data, Applying ACSM/NSCA progression guidelines, Increasing sets, reps, or weight based on performance, Providing baseline handling for new clients, and Monitoring performance trends. This ensures clients continue to make progress while avoiding plateaus.',
      category: 'workout-plans',
      icon: <Dumbbell className="h-5 w-5" />,
      tags: ['progression', 'overload', 'tracking']
    },

    // Nutrition Plans
    {
      id: 'nutrition-generation',
      question: 'How does nutrition plan generation work?',
      answer: 'The AI nutrition system creates personalized meal plans based on: Client goals and target weight, Body composition (height, weight, age, sex), Activity level and metabolic needs, Dietary preferences and restrictions, Food allergies and intolerances, Meal frequency preferences, and Specific nutritional targets (calories, macros). Plans include detailed meal suggestions, recipes, and macro breakdowns.',
      category: 'nutrition-plans',
      icon: <Utensils className="h-5 w-5" />,
      tags: ['nutrition', 'meal-plans', 'AI', 'macros']
    },
    {
      id: 'macro-tracking',
      question: 'How does macro tracking work for clients?',
      answer: 'The platform provides comprehensive macro tracking including: Daily calorie and macro targets, Food journal with barcode scanning, Meal logging with portion sizes, Progress tracking and adjustments, Visual charts and analytics, and Integration with meal plans. Clients can log their food intake and see how it aligns with their nutritional goals.',
      category: 'nutrition-plans',
      icon: <Utensils className="h-5 w-5" />,
      tags: ['macros', 'tracking', 'food-journal']
    },
    {
      id: 'meal-plan-customization',
      question: 'Can I customize nutrition plans for specific dietary needs?',
      answer: 'Absolutely! The system supports various dietary preferences including: Vegetarian and vegan options, Keto, paleo, and other specialized diets, Gluten-free and allergen-free options, Cultural and religious dietary restrictions, and Custom macro ratios. You can also manually adjust meal plans and add your own recipes.',
      category: 'nutrition-plans',
      icon: <Utensils className="h-5 w-5" />,
      tags: ['customization', 'dietary-restrictions', 'meal-plans']
    },

    // Dashboard & Analytics
    {
      id: 'dashboard-features',
      question: 'What features are available in the main dashboard?',
      answer: 'The dashboard provides comprehensive insights including: Smart alerts for client follow-ups, Client insights cards (fitness momentum, workout adherence, engagement), Calendar view of scheduled sessions, Todo list with priority tasks, Recent activity and notifications, Quick access to all major features, and Performance metrics across all clients.',
      category: 'dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      tags: ['dashboard', 'analytics', 'insights']
    },
    {
      id: 'client-insights',
      question: 'What are Client Insights Cards and how do they help?',
      answer: 'Client Insights Cards provide flipable cards showing: Fitness Momentum - workout volume trends over 3 weeks, Workout Adherence - 14-day completion rates, Client Engagement - daily engagement scores. Each card shows top performers and clients needing attention, helping you prioritize your time and provide targeted support.',
      category: 'dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      tags: ['insights', 'analytics', 'performance']
    },
    {
      id: 'progress-tracking',
      question: 'How can I track my clients\' progress?',
      answer: 'The platform offers comprehensive progress tracking: Weight and body measurements, Progress photos with timeline, Workout completion rates, Performance metrics (strength, endurance), Nutrition adherence, Goal achievement tracking, and Visual charts and reports. You can set up automated progress reports and alerts.',
      category: 'dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      tags: ['progress', 'tracking', 'metrics']
    },

    // Billing & Payments
    {
      id: 'billing-system',
      question: 'How does the billing and payment system work?',
      answer: 'The platform includes a comprehensive billing system with: Revenue tracking by client, Invoice generation and management, Stripe integration for secure payments, Automated billing cycles, Payment failure alerts, Financial reporting and analytics, and Client payment history. You can set up recurring billing and track your business performance.',
      category: 'billing',
      icon: <CreditCard className="h-5 w-5" />,
      tags: ['billing', 'payments', 'invoicing']
    },
    {
      id: 'pricing-plans',
      question: 'What are the pricing plans for trainers?',
      answer: 'We offer flexible pricing plans to suit different business needs. Contact our support team for detailed pricing information and to discuss which plan works best for your practice. We provide options for individual trainers, small studios, and larger fitness businesses.',
      category: 'billing',
      icon: <CreditCard className="h-5 w-5" />,
      tags: ['pricing', 'plans', 'cost']
    },

    // Branding & Customization
    {
      id: 'branding-features',
      question: 'What branding and customization options are available?',
      answer: 'The platform offers extensive branding options: Logo upload and customization, Color theme selection, Custom message templates, Branded client communications, Custom workout plan templates, Personalized client onboarding, and White-label options for larger businesses. This helps you maintain your professional brand throughout the client experience.',
      category: 'branding',
      icon: <Palette className="h-5 w-5" />,
      tags: ['branding', 'customization', 'white-label']
    },
    {
      id: 'client-communication',
      question: 'How can I communicate with my clients through the platform?',
      answer: 'The platform provides multiple communication channels: In-app messaging system, Email integration with branded templates, Automated follow-up messages, Progress update notifications, Task and reminder messages, and Custom message scheduling. You can maintain professional communication while saving time with automated systems.',
      category: 'branding',
      icon: <Palette className="h-5 w-5" />,
      tags: ['communication', 'messaging', 'automation']
    },

    // Mobile Apps
    {
      id: 'client-mobile-apps',
      question: 'Do you have mobile apps for clients on iOS and Android?',
      answer: 'Yes! We provide dedicated mobile apps for both iOS and Android platforms. The client apps are available for download from the Apple App Store and Google Play Store. These apps provide full access to workout plans, nutrition tracking, progress monitoring, and communication with their trainer.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['mobile', 'iOS', 'Android', 'apps', 'clients']
    },
    {
      id: 'mobile-app-features',
      question: 'What features are available in the client mobile apps?',
      answer: 'The mobile apps include: Workout plan viewing and tracking, Exercise demonstrations with video guides, Nutrition logging and macro tracking, Progress photo uploads, Weight and measurement tracking, Direct messaging with trainers, Push notifications for reminders, Offline workout access, Barcode scanning for food logging, and Integration with fitness trackers (Apple Health, Google Fit).',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['features', 'mobile', 'tracking', 'notifications']
    },
    {
      id: 'app-download-instructions',
      question: 'How do clients download and set up the mobile app?',
      answer: 'Clients can download the app by: 1) Searching "FitCoachTrainer" in the App Store (iOS) or Google Play Store (Android), 2) Downloading and installing the app, 3) Creating an account using the invitation link sent by their trainer, 4) Completing the onboarding process, and 5) Syncing with their trainer\'s account. Trainers can send invitation links directly from their dashboard.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['download', 'setup', 'onboarding', 'invitation']
    },
    {
      id: 'offline-functionality',
      question: 'Can clients use the app without internet connection?',
      answer: 'Yes! The mobile apps support offline functionality for: Viewing downloaded workout plans, Tracking completed exercises, Logging food and nutrition data, Taking progress photos, and Recording measurements. All data syncs automatically when the device reconnects to the internet. This ensures clients can stay on track even when traveling or in areas with poor connectivity.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['offline', 'sync', 'connectivity', 'travel']
    },
    {
      id: 'fitness-tracker-integration',
      question: 'Does the mobile app integrate with fitness trackers and wearables?',
      answer: 'Absolutely! The apps integrate with: Apple Health (iOS) and Google Fit (Android) for automatic data sync, Popular fitness trackers like Fitbit, Garmin, and Samsung Galaxy Watch, Heart rate monitors and smart scales, Step counters and activity trackers, and Sleep tracking devices. This provides a comprehensive view of your clients\' health and fitness data.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['integration', 'wearables', 'fitness-trackers', 'health-data']
    },
    {
      id: 'app-notifications',
      question: 'What types of notifications do clients receive through the mobile app?',
      answer: 'Clients receive helpful notifications for: Workout reminders and scheduled sessions, Meal plan reminders and nutrition tips, Progress check-ins from their trainer, Goal milestone celebrations, App updates and new features, and Motivational messages. Clients can customize notification preferences in the app settings to control what and when they receive notifications.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['notifications', 'reminders', 'motivation', 'customization']
    },
    {
      id: 'app-updates',
      question: 'How often are the mobile apps updated with new features?',
      answer: 'We regularly update both iOS and Android apps with: New features and improvements every 2-4 weeks, Bug fixes and performance optimizations, Enhanced user interface and experience, New exercise demonstrations and content, Improved integration capabilities, and Security updates. Updates are automatically available through the respective app stores, and we notify users of significant new features.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['updates', 'features', 'improvements', 'security']
    },
    {
      id: 'app-troubleshooting',
      question: 'What should clients do if they experience issues with the mobile app?',
      answer: 'If clients encounter app issues, they should: 1) Check for app updates in the App Store or Google Play Store, 2) Restart the app and their device, 3) Check their internet connection, 4) Clear app cache (Android) or reinstall the app if needed, 5) Contact their trainer for support, or 6) Reach out to our technical support team. Most issues can be resolved quickly with these troubleshooting steps.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['troubleshooting', 'support', 'issues', 'fixes']
    },
    {
      id: 'app-compatibility',
      question: 'What are the system requirements for the mobile apps?',
      answer: 'The apps support: iOS 13.0 or later for iPhone and iPad, Android 8.0 (API level 26) or later, Minimum 2GB RAM for optimal performance, At least 100MB of available storage space, and Internet connection for initial setup and data sync. The apps are optimized for both phones and tablets, providing a great experience across all supported devices.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['compatibility', 'requirements', 'iOS', 'Android', 'devices']
    },
    {
      id: 'trainer-mobile-access',
      question: 'Can trainers access their dashboard through mobile devices?',
      answer: 'Yes! Trainers can access the full web dashboard through mobile browsers on any device. While we don\'t have a dedicated trainer mobile app yet, the web interface is fully responsive and optimized for mobile use. Trainers can: View client progress and data, Send messages and updates, Review workout and nutrition plans, Access analytics and reports, and Manage their business on the go.',
      category: 'mobile-apps',
      icon: <Settings className="h-5 w-5" />,
      tags: ['trainer', 'mobile', 'dashboard', 'responsive']
    },

    // Data & Privacy
    {
      id: 'data-security',
      question: 'How is my and my clients\' data protected?',
      answer: 'Data security is our top priority. We use: End-to-end encryption for all data transmission, Secure cloud storage with regular backups, HIPAA-compliant data handling, Regular security audits and updates, Secure authentication systems, and Privacy controls for all user data. Your clients\' personal and health information is always protected.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['security', 'privacy', 'data-protection', 'encryption']
    },
    {
      id: 'data-collection',
      question: 'What data does FitCoachTrainer collect and why?',
      answer: 'We collect only necessary data to provide our services: Personal information (name, email, contact details) for account management, Health and fitness data (goals, measurements, progress) for personalized plans, Usage data to improve our platform, and Communication data for trainer-client interactions. We never sell or share personal data with third parties for marketing purposes. All data collection follows strict privacy principles and is used solely to enhance your coaching experience.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['data-collection', 'privacy', 'personal-information', 'health-data']
    },
    {
      id: 'data-storage',
      question: 'Where is my data stored and how long is it kept?',
      answer: 'Your data is stored in secure, encrypted cloud servers with multiple backup locations. We use industry-leading cloud providers with SOC 2 Type II certification. Data retention follows these principles: Active account data is kept while your account is active, Inactive accounts are retained for 2 years after last activity, Client health data is kept for 7 years (medical record standards), and You can request data deletion at any time. We never store payment information - all payments are processed through secure third-party providers.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['data-storage', 'retention', 'cloud', 'backup', 'deletion']
    },
    {
      id: 'data-sharing',
      question: 'Do you share my data with third parties?',
      answer: 'We are committed to protecting your privacy. We do NOT share personal data with third parties except in these limited circumstances: Service providers who help us operate the platform (under strict confidentiality agreements), Legal requirements (court orders, law enforcement), Business transfers (merger/acquisition with notice), and With your explicit consent. We never sell, rent, or trade your personal information. All third-party integrations (like payment processors) use their own secure systems and don\'t have access to your health data.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['data-sharing', 'third-parties', 'privacy', 'confidentiality']
    },
    {
      id: 'client-privacy',
      question: 'How do you protect my clients\' privacy and health information?',
      answer: 'Client privacy is paramount. We implement: HIPAA-compliant data handling for health information, Separate data encryption for each client, Access controls that limit data visibility to authorized trainers only, Audit logs for all data access and modifications, Client consent management for data sharing, and Right to data portability and deletion. Clients can control their privacy settings, request data exports, or delete their accounts at any time. Trainers can only access data for clients they are authorized to work with.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['client-privacy', 'HIPAA', 'health-information', 'access-controls']
    },
    {
      id: 'data-export',
      question: 'Can I export or download my data?',
      answer: 'Yes! You have full control over your data: Export all your data in standard formats (JSON, CSV), Download client information and progress reports, Export workout and nutrition plans, Access your account data through our API, and Request a complete data package at any time. We provide data export tools in your account settings, and you can also contact support for assistance with large data exports. This ensures you can take your data with you if needed.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['data-export', 'download', 'portability', 'API', 'backup']
    },
    {
      id: 'data-deletion',
      question: 'How do I delete my account and all associated data?',
      answer: 'You can delete your account and data through: Account settings in your dashboard, Direct request to our support team, or Email request to privacy@coachez.ai. When you delete your account: All personal data is permanently removed within 30 days, Client data is anonymized or transferred to another trainer, Backup data is securely deleted within 90 days, and You\'ll receive confirmation of deletion. Note: Some data may be retained for legal compliance (billing records, audit logs) but will be anonymized and not associated with your identity.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['data-deletion', 'account-deletion', 'privacy', 'anonymization']
    },
    {
      id: 'cookies-tracking',
      question: 'Do you use cookies or tracking technologies?',
      answer: 'We use minimal, necessary cookies and tracking: Essential cookies for platform functionality and security, Analytics cookies to improve user experience (anonymized), No third-party advertising cookies or tracking, No cross-site tracking or data sharing, and Clear cookie controls in your browser settings. We respect Do Not Track signals and provide detailed cookie information in our Privacy Policy. You can disable non-essential cookies through your browser settings without affecting platform functionality.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['cookies', 'tracking', 'analytics', 'browser-settings']
    },
    {
      id: 'data-breaches',
      question: 'What happens if there\'s a data breach?',
      answer: 'We have comprehensive breach response procedures: Immediate containment and investigation of any security incident, Notification to affected users within 72 hours of discovery, Coordination with law enforcement and regulatory authorities, Full transparency about what data was affected, and Free credit monitoring and identity protection services if needed. We maintain cyber liability insurance and regularly test our security measures. While we work to prevent breaches, we\'re prepared to respond quickly and transparently if one occurs.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['data-breach', 'security-incident', 'notification', 'response']
    },
    {
      id: 'privacy-settings',
      question: 'What privacy controls do I have over my data?',
      answer: 'You have extensive privacy controls: Profile visibility settings (public/private), Data sharing preferences with trainers, Communication preferences and notification settings, Cookie and tracking controls, Data export and deletion options, and Granular permissions for different data types. You can also: Set up two-factor authentication for extra security, Control who can see your progress and achievements, Manage data retention preferences, and Opt out of non-essential data processing. All settings are easily accessible in your account dashboard.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['privacy-controls', 'settings', 'permissions', 'two-factor-auth']
    },
    {
      id: 'compliance-standards',
      question: 'What privacy and security standards do you comply with?',
      answer: 'We comply with multiple international standards: HIPAA (Health Insurance Portability and Accountability Act) for health data, GDPR (General Data Protection Regulation) for EU users, CCPA (California Consumer Privacy Act) for California residents, SOC 2 Type II for security controls, ISO 27001 for information security management, and Regular third-party security audits. We also follow industry best practices for: Data minimization and purpose limitation, Regular security training for our team, Incident response planning, and Continuous security monitoring.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['compliance', 'HIPAA', 'GDPR', 'CCPA', 'SOC2', 'ISO27001']
    },
    {
      id: 'children-privacy',
      question: 'How do you handle data for clients under 18?',
      answer: 'We take special care with minors\' data: Parental consent required for users under 18, Limited data collection for minors, Enhanced privacy protections, No marketing or advertising to minors, and Special data retention policies. Parents can: Review and delete their child\'s data, Control data sharing permissions, and Request data export at any time. We comply with COPPA (Children\'s Online Privacy Protection Act) and other applicable laws protecting minors\' privacy.',
      category: 'data-privacy',
      icon: <Settings className="h-5 w-5" />,
      tags: ['children', 'minors', 'parental-consent', 'COPPA', 'privacy']
    },

    // Technical Support
    {
      id: 'mobile-access',
      question: 'Can I access the platform on mobile devices?',
      answer: 'Yes! The platform is fully responsive and works on all devices including: Smartphones and tablets, Desktop computers, and various operating systems. The mobile interface is optimized for on-the-go client management, workout plan reviews, and progress tracking.',
      category: 'technical',
      icon: <Settings className="h-5 w-5" />,
      tags: ['mobile', 'responsive', 'access']
    },
    {
      id: 'integration-options',
      question: 'Does the platform integrate with other fitness apps or tools?',
      answer: 'The platform offers various integration options including: Fitness tracking devices (Fitbit, Apple Watch, etc.), Nutrition apps and databases, Calendar applications, Payment processors (Stripe), Email marketing tools, and API access for custom integrations. Contact support for specific integration requests.',
      category: 'technical',
      icon: <Settings className="h-5 w-5" />,
      tags: ['integrations', 'API', 'third-party']
    },
    {
      id: 'backup-recovery',
      question: 'What happens if I lose my data?',
      answer: 'We have comprehensive backup and recovery systems: Daily automated backups, Multiple data center redundancy, Point-in-time recovery options, Data export capabilities, and 24/7 monitoring. Your data is always safe and recoverable. Contact support immediately if you experience any data issues.',
      category: 'technical',
      icon: <Settings className="h-5 w-5" />,
      tags: ['backup', 'recovery', 'data-loss']
    }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

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
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Frequently Asked <span className="text-green-500">Questions</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              Find answers to common questions about FitCoachTrainer features, functionality, and best practices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? "bg-green-700 hover:bg-green-800 text-white"
                      : "border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              Showing {filteredFAQs.length} of {faqData.length} questions
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-gray-900 border-gray-700 hover:border-green-500/50 transition-colors">
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleExpanded(faq.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-green-400">
                          {faq.icon}
                        </div>
                        <CardTitle className="text-white text-lg">
                          {faq.question}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {categories.find(c => c.id === faq.category)?.name}
                        </Badge>
                        {expandedItems.has(faq.id) ? (
                          <ChevronUp className="h-5 w-5 text-green-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedItems.has(faq.id) && (
                    <CardContent className="pt-0">
                      <p className="text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {faq.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-gray-800 text-gray-300 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No questions found
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search terms or category filter.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Still Have <span className="text-green-500">Questions</span>?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Can't find what you're looking for? Our support team is here to help you succeed.
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
                onClick={() => window.location.href = '/support'}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Contact Support
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
