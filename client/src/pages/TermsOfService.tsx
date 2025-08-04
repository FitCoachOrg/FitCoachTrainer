import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Scale, Shield, Users, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const TermsOfService = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Terms of Service</h1>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`shadow-xl border-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
              <CardDescription className="text-lg">
                Last updated: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 text-left">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Scale className="h-6 w-6 text-blue-600" />
                  Introduction
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  These Terms of Service ("Terms") govern your use of CoachEZ, a fitness training platform that connects trainers with clients. By accessing or using our platform, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access our platform.
                </p>
              </section>

              {/* Definitions */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Definitions</h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <div>
                    <strong>"Platform"</strong> refers to CoachEZ, including all features, services, and content.
                  </div>
                  <div>
                    <strong>"Trainer"</strong> refers to fitness professionals who use our platform to offer training services.
                  </div>
                  <div>
                    <strong>"Client"</strong> refers to individuals who use our platform to find and work with trainers.
                  </div>
                  <div>
                    <strong>"Services"</strong> refers to all features and functionality provided through our platform.
                  </div>
                  <div>
                    <strong>"Content"</strong> refers to any information, data, text, graphics, or other materials uploaded to the platform.
                  </div>
                </div>
              </section>

              {/* Account Registration */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Account Registration and Eligibility
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    To use our platform, you must:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Be at least 18 years old or have parental consent</li>
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>For Trainers:</strong> You must have valid certifications and insurance as required by your jurisdiction.
                  </p>
                </div>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  Acceptable Use
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    You agree to use our platform only for lawful purposes and in accordance with these Terms:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Provide accurate and truthful information</li>
                    <li>Respect the rights and privacy of other users</li>
                    <li>Maintain professional conduct and communication</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Not engage in fraudulent or deceptive practices</li>
                    <li>Not interfere with platform functionality or security</li>
                    <li>Not upload harmful or inappropriate content</li>
                  </ul>
                </div>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Prohibited Activities
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    You may not use our platform to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Share false or misleading information</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated tools to access the platform</li>
                    <li>Distribute malware or harmful code</li>
                    <li>Engage in spam or unsolicited communications</li>
                    <li>Violate intellectual property rights</li>
                  </ul>
                </div>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Payment Terms
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Our platform may include paid services and features:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li><strong>Subscription Fees:</strong> Monthly or annual subscription fees for premium features</li>
                    <li><strong>Transaction Fees:</strong> Processing fees for payments between trainers and clients</li>
                    <li><strong>Service Fees:</strong> Fees for additional services and features</li>
                    <li><strong>Payment Processing:</strong> All payments are processed through secure third-party providers</li>
                    <li><strong>Refunds:</strong> Refund policies vary by service type and circumstances</li>
                    <li><strong>Taxes:</strong> Users are responsible for any applicable taxes</li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Platform Content:</strong> Our platform and its original content, features, and functionality are owned by CoachEZ and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>User Content:</strong> You retain ownership of content you upload to our platform. By uploading content, you grant us a license to use, display, and distribute your content as necessary to provide our services.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>License:</strong> We grant you a limited, non-exclusive, non-transferable license to use our platform for its intended purpose.
                  </p>
                </div>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  Privacy and Data Protection
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    By using our platform, you consent to the collection and use of your information as described in our Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Disclaimers</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Service Availability:</strong> We strive to provide reliable service but cannot guarantee uninterrupted access to our platform.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Third-Party Services:</strong> Our platform may integrate with third-party services. We are not responsible for the availability or content of these services.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>User Content:</strong> We do not endorse or verify the accuracy of user-generated content. Users are responsible for their own content and interactions.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Fitness Services:</strong> We are not responsible for the quality or safety of fitness services provided by trainers. Users should exercise their own judgment and consult healthcare professionals as needed.
                  </p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    To the maximum extent permitted by law, CoachEZ shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Personal injury or property damage</li>
                    <li>Emotional distress or mental anguish</li>
                    <li>Damages arising from third-party services</li>
                    <li>Damages resulting from user interactions</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our total liability shall not exceed the amount paid by you for our services in the 12 months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  You agree to indemnify and hold harmless CoachEZ, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our platform, violation of these Terms, or violation of any rights of another party.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Termination</h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    We may terminate or suspend your account and access to our platform at any time, with or without cause, with or without notice, effective immediately.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Upon termination, your right to use our platform will cease immediately. We may delete your account and data, though we may retain certain information as required by law or for legitimate business purposes.
                  </p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of our platform shall be resolved in the courts of [Your Jurisdiction].
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the new Terms on our platform and updating the "Last updated" date. Your continued use of our platform after such changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p>If you have any questions about these Terms of Service, please contact us:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Email:</strong> legal@coachez.com</li>
                    <li><strong>Address:</strong> [Your Business Address]</li>
                    <li><strong>Phone:</strong> [Your Contact Number]</li>
                  </ul>
                </div>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService; 