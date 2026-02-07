'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  AlertCircle,
  CheckCircle,
  Scale,
  ChevronRight,
  Printer,
  Download,
  ArrowUp,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ==================== MAIN COMPONENT ====================

const TermsOfService = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showTOC, setShowTOC] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll for active section and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      const scrollPosition = window.scrollY + 200;

      sections.forEach(section => {
        const element = section as HTMLElement;
        const top = element.offsetTop;
        const height = element.offsetHeight;

        if (scrollPosition >= top && scrollPosition < top + height) {
          setActiveSection(element.dataset.section || '');
        }
      });

      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowTOC(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In production, generate PDF
    window.print();
  };

  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'accounts', title: 'User Accounts' },
    { id: 'services', title: 'Services Provided' },
    { id: 'payments', title: 'Payments and Refunds' },
    { id: 'conduct', title: 'User Conduct' },
    { id: 'ip', title: 'Intellectual Property' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'law', title: 'Governing Law' },
    { id: 'contact', title: 'Contact Information' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 py-16 px-6 overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          ></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
              <FileText className="text-white" size={40} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4"
          >
            Terms of Service
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/90 mb-6"
          >
            Last updated: January 15, 2025
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl font-semibold transition-all"
            >
              <Printer size={20} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl font-semibold transition-all"
            >
              <Download size={20} />
              Download PDF
            </button>
            <button
              onClick={() => setShowTOC(true)}
              className="lg:hidden flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl font-semibold transition-all"
            >
              <Menu size={20} />
              Table of Contents
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Sidebar - Table of Contents (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Menu size={20} />
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {sections.map((section, idx) => (
                    <motion.button
                      key={section.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        activeSection === section.id
                          ? 'bg-purple-50 text-purple-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeSection === section.id ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      ></div>
                      <span className="text-sm">{section.title}</span>
                    </motion.button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 mb-12"
            >
              <div className="flex items-start space-x-4">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Important Information</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Please read these Terms of Service carefully before using GladysTravelAI. By
                    accessing or using our service, you agree to be bound by these terms. If you
                    disagree with any part of these terms, you may not access our service.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Terms Sections */}
            <div className="space-y-12">
              {/* Section 1: Acceptance */}
              <TermSection
                id="acceptance"
                number={1}
                title="Acceptance of Terms"
                delay={0.1}
              >
                <p>
                  By creating an account or using any GladysTravelAI services, you acknowledge
                  that you have read, understood, and agree to be bound by these Terms of Service
                  and our Privacy Policy.
                </p>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of
                  any material changes via email or through our platform. Your continued use of
                  the service after such modifications constitutes acceptance of the updated terms.
                </p>
              </TermSection>

              {/* Section 2: User Accounts */}
              <TermSection id="accounts" number={2} title="User Accounts" delay={0.15}>
                <p>
                  To access certain features of GladysTravelAI, you must create an account. You
                  agree to:
                </p>
                <ul className="space-y-3 ml-6">
                  {[
                    'Provide accurate, current, and complete information during registration',
                    'Maintain and update your information to keep it accurate and current',
                    'Keep your password secure and confidential',
                    'Notify us immediately of any unauthorized use of your account',
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start"
                    >
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={20} />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <p>
                  You are responsible for all activities that occur under your account. We reserve
                  the right to suspend or terminate accounts that violate these terms.
                </p>
              </TermSection>

              {/* Section 3: Services */}
              <TermSection id="services" number={3} title="Services Provided" delay={0.2}>
                <p>GladysTravelAI provides AI-powered travel planning services including:</p>
                <ul className="space-y-2 ml-6 list-disc text-gray-700">
                  <li>Personalized itinerary generation</li>
                  <li>Destination recommendations</li>
                  <li>Booking assistance for flights, hotels, and activities</li>
                  <li>Real-time travel updates and notifications</li>
                  <li>Travel tips and local insights</li>
                </ul>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mt-4">
                  <p className="font-semibold text-amber-900">Important:</p>
                  <p className="text-amber-800">
                    GladysTravelAI acts as an intermediary between you and travel service
                    providers. We are not responsible for the quality, safety, or legality of
                    services provided by third parties.
                  </p>
                </div>
              </TermSection>

              {/* Section 4: Payments */}
              <TermSection id="payments" number={4} title="Payments and Refunds" delay={0.25}>
                <p>
                  <strong className="text-gray-900">Pricing:</strong> All prices displayed are in
                  USD unless otherwise stated. Prices are subject to change without notice.
                </p>
                <p>
                  <strong className="text-gray-900">Payment:</strong> We accept major credit
                  cards, debit cards, and other payment methods as displayed during checkout.
                  Payment processing is handled securely by our third-party payment providers.
                </p>
                <p>
                  <strong className="text-gray-900">Refunds:</strong> Refund eligibility depends
                  on the specific service and booking terms. Generally:
                </p>
                <ul className="space-y-2 ml-6 list-disc text-gray-700">
                  <li>Cancellations made 30+ days before travel: Full refund minus processing fees</li>
                  <li>Cancellations made 7-29 days before travel: 50% refund</li>
                  <li>Cancellations made less than 7 days before travel: No refund</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="font-semibold text-yellow-900">Note:</p>
                  <p className="text-yellow-800">
                    Third-party bookings (flights, hotels, etc.) are subject to the cancellation
                    policies of those providers.
                  </p>
                </div>
              </TermSection>

              {/* Section 5: User Conduct */}
              <TermSection id="conduct" number={5} title="User Conduct" delay={0.3}>
                <p>You agree not to:</p>
                <ul className="space-y-2 ml-6 list-disc text-gray-700">
                  <li>Use the service for any illegal purpose</li>
                  <li>Violate any laws in your jurisdiction</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Submit false or misleading information</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use automated systems to access the service without permission</li>
                  <li>Resell or commercially exploit our services without authorization</li>
                </ul>
              </TermSection>

              {/* Section 6: IP */}
              <TermSection id="ip" number={6} title="Intellectual Property" delay={0.35}>
                <p>
                  All content on GladysTravelAI, including but not limited to text, graphics,
                  logos, images, software, and AI-generated itineraries, is the property of
                  GladysTravelAI or its licensors and is protected by copyright, trademark, and
                  other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, or create derivative works from our
                  content without our express written permission.
                </p>
              </TermSection>

              {/* Section 7: Liability */}
              <TermSection id="liability" number={7} title="Limitation of Liability" delay={0.4}>
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded mb-4">
                  <p className="font-semibold text-red-900 mb-2">IMPORTANT:</p>
                  <p className="text-red-800">
                    To the fullest extent permitted by law, GladysTravelAI shall not be liable
                    for any indirect, incidental, special, consequential, or punitive damages, or
                    any loss of profits or revenues, whether incurred directly or indirectly, or
                    any loss of data, use, goodwill, or other intangible losses.
                  </p>
                </div>
                <p>
                  Our total liability to you for any claims arising from your use of the service
                  shall not exceed the amount you paid to us in the 12 months prior to the event
                  giving rise to the claim.
                </p>
              </TermSection>

              {/* Section 8: Governing Law */}
              <TermSection id="law" number={8} title="Governing Law" delay={0.45}>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of
                  the State of California, United States, without regard to its conflict of law
                  provisions.
                </p>
                <p>
                  Any disputes arising from these Terms or your use of our service shall be
                  resolved through binding arbitration in accordance with the rules of the American
                  Arbitration Association.
                </p>
              </TermSection>

              {/* Section 9: Contact */}
              <TermSection id="contact" number={9} title="Contact Information" delay={0.5}>
                <p>If you have any questions about these Terms of Service, please contact us:</p>
                <div className="bg-gray-50 rounded-xl p-6 space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600">📧</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">legal@gladystravelai.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">📞</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">+1 (234) 567-890</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600">📍</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-gray-900">
                        123 Travel Street, San Francisco, CA 94102
                      </p>
                    </div>
                  </div>
                </div>
              </TermSection>
            </div>

            {/* Final Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8"
            >
              <div className="flex items-start space-x-4">
                <Scale className="text-purple-600 flex-shrink-0 mt-1" size={32} />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Agreement Acknowledgment
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    By using GladysTravelAI, you acknowledge that you have read these Terms of
                    Service, understand them, and agree to be bound by them. If you do not agree
                    to these terms, please discontinue use of our service immediately.
                  </p>
                  <p className="text-sm text-gray-600">
                    Thank you for choosing GladysTravelAI. We're committed to providing you with
                    exceptional travel experiences while protecting your rights and ours.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Back to Home */}
            <div className="mt-12 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <ChevronRight size={20} className="rotate-180" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile TOC Modal */}
      <AnimatePresence>
        {showTOC && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTOC(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Table of Contents</h3>
                <button
                  onClick={() => setShowTOC(false)}
                  className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all z-40"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== TERM SECTION COMPONENT ====================

interface TermSectionProps {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function TermSection({ id, number, title, children, delay = 0 }: TermSectionProps) {
  return (
    <motion.div
      data-section={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      viewport={{ once: true, margin: '-100px' }}
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 scroll-mt-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">{number}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </motion.div>
  );
}

export default TermsOfService;