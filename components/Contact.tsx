'use client';

import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  MessageSquare,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  honeypot?: string; // Anti-spam
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

// ==================== MAIN COMPONENT ====================

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // ==================== VALIDATION ====================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Subject validation
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== HANDLERS ====================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam check
    if (formData.honeypot) {
      console.log('Spam detected');
      return;
    }

    // Validate
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setStatus('sending');

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Replace with actual API call
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      setStatus('success');
      toast.success('Message sent successfully!', {
        description: "We'll get back to you within 24 hours",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        honeypot: '',
      });

      // Reset status after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      toast.error('Failed to send message', {
        description: 'Please try again or contact us directly',
      });
    }
  };

  const remainingChars = 1000 - formData.message.length;

  // ==================== FAQ DATA ====================

  const faqs = [
    {
      question: 'How quickly will I get a response?',
      answer:
        'We typically respond to all inquiries within 24 hours during business days. Urgent matters are prioritized and may receive faster responses.',
    },
    {
      question: 'Can I schedule a call?',
      answer:
        "Yes! Contact us and we'll arrange a convenient time for a phone or video consultation to discuss your travel plans in detail.",
    },
    {
      question: 'Do you offer travel insurance?',
      answer:
        'We partner with leading travel insurance providers. Contact us for personalized recommendations based on your destination and trip duration.',
    },
    {
      question: 'What about emergency support?',
      answer:
        "Our 24/7 emergency hotline is available for urgent travel assistance when you're on your trip. You'll receive the number upon booking.",
    },
    {
      question: 'Can I modify my booking?',
      answer:
        'Yes, most bookings can be modified. Contact us with your booking reference and desired changes, and we will assist you with the modification process.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for larger bookings.',
    },
  ];

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative py-20 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 overflow-hidden"
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

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
              <MessageCircle className="text-white" size={40} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg"
          >
            Get in Touch
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md"
          >
            Have questions? We're here to help you plan your perfect journey
          </motion.p>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-16 px-6 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email Card */}
              <ContactCard
                icon={Mail}
                title="Email Us"
                description="Our team typically responds within 24 hours"
                link="mailto:support@gladystravelai.com"
                linkText="support@gladystravelai.com"
                color="from-purple-500 to-pink-500"
                delay={0.1}
              />

              {/* Phone Card */}
              <ContactCard
                icon={Phone}
                title="Call Us"
                description="Mon-Fri from 8am to 6pm PST"
                link="tel:+1234567890"
                linkText="+1 (234) 567-890"
                color="from-blue-500 to-purple-500"
                delay={0.2}
              />

              {/* Office Card */}
              <ContactCard
                icon={MapPin}
                title="Visit Us"
                description="Come say hi at our office HQ"
                address={{
                  line1: '123 Travel Street',
                  line2: 'San Francisco, CA 94102',
                  line3: 'United States',
                }}
                color="from-pink-500 to-red-500"
                delay={0.3}
              />

              {/* Business Hours */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="text-purple-600" size={24} />
                  <h3 className="text-lg font-bold text-gray-900">Business Hours</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <BusinessHour day="Monday - Friday" hours="8am - 6pm PST" />
                  <BusinessHour day="Saturday" hours="10am - 4pm PST" />
                  <BusinessHour day="Sunday" hours="Closed" />
                </div>
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 border-2 border-gray-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <SocialButton icon={Twitter} href="https://twitter.com" color="hover:bg-blue-400" />
                  <SocialButton icon={Facebook} href="https://facebook.com" color="hover:bg-blue-600" />
                  <SocialButton icon={Instagram} href="https://instagram.com" color="hover:bg-pink-500" />
                  <SocialButton icon={Linkedin} href="https://linkedin.com" color="hover:bg-blue-700" />
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="text-purple-600" size={28} />
                  <h2 className="text-3xl font-bold text-gray-900">Send Us a Message</h2>
                </div>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible
                </p>

                {/* Success Message */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start space-x-3"
                    >
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">
                          Message Sent Successfully!
                        </h4>
                        <p className="text-sm text-green-700">
                          We've received your message and will respond within 24 hours.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start space-x-3"
                    >
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">
                          Oops! Something went wrong
                        </h4>
                        <p className="text-sm text-red-700">
                          Please try again or contact us directly via email.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field (hidden) */}
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Name & Email Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      label="Full Name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      placeholder="John Doe"
                      required
                    />
                    <FormField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  {/* Phone & Subject Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (234) 567-890"
                    />
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                          errors.subject ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="booking">Booking Support</option>
                        <option value="technical">Technical Issue</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`text-xs ${
                          remainingChars < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        {remainingChars} characters remaining
                      </span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      maxLength={1000}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none ${
                        errors.message ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Tell us how we can help you..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? (
                      <span className="flex items-center justify-center">
                        <Loader2 size={20} className="mr-3 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Send size={20} className="mr-2" />
                        Send Message
                      </span>
                    )}
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    By submitting this form, you agree to our{' '}
                    <a href="/privacy" className="text-purple-600 hover:text-purple-700 font-semibold">
                      Privacy Policy
                    </a>
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Quick answers to common questions</p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isExpanded={expandedFAQ === index}
                onToggle={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="h-96 bg-gradient-to-br from-purple-200 via-pink-200 to-purple-200 flex items-center justify-center relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                ></div>
              </div>

              <div className="text-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
                >
                  <MapPin className="text-white" size={40} />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Visit Our Office</h3>
                <p className="text-gray-600 mb-4">123 Travel Street, San Francisco, CA 94102</p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Globe size={16} className="mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// ==================== CONTACT CARD COMPONENT ====================

interface ContactCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  address?: {
    line1: string;
    line2: string;
    line3: string;
  };
  color: string;
  delay: number;
}

function ContactCard({
  icon: Icon,
  title,
  description,
  link,
  linkText,
  address,
  color,
  delay,
}: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200"
    >
      <div className="flex items-start space-x-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
        >
          <Icon className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-3">{description}</p>
          {link && linkText && (
            <a
              href={link}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
            >
              {linkText}
            </a>
          )}
          {address && (
            <address className="text-gray-700 text-sm not-italic">
              {address.line1}
              <br />
              {address.line2}
              <br />
              {address.line3}
            </address>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== FORM FIELD COMPONENT ====================

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

function FormField({
  label,
  name,
  type,
  value,
  onChange,
  error,
  placeholder,
  required,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={placeholder}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ==================== BUSINESS HOUR COMPONENT ====================

function BusinessHour({ day, hours }: { day: string; hours: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{day}:</span>
      <span className="font-semibold text-gray-900">{hours}</span>
    </div>
  );
}

// ==================== SOCIAL BUTTON COMPONENT ====================

function SocialButton({
  icon: Icon,
  href,
  color,
}: {
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`w-12 h-12 bg-gray-100 ${color} hover:text-white rounded-xl flex items-center justify-center transition-all text-gray-600`}
    >
      <Icon size={20} />
    </motion.a>
  );
}

// ==================== FAQ ITEM COMPONENT ====================

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
  delay: number;
}

function FAQItem({ question, answer, isExpanded, onToggle, delay }: FAQItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <h3 className="text-lg font-bold text-gray-900 text-left">{question}</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="text-purple-600" size={24} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-4 text-gray-700">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Contact;