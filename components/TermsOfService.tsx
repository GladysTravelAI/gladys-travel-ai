"use client";

import { FileText, Shield, AlertCircle, CheckCircle, Scale } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <FileText className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-xl text-white/90">Last updated: January 15, 2025</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Introduction */}
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 mb-12">
            <div className="flex items-start space-x-4">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Important Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  Please read these Terms of Service carefully before using GladysTravelAI. By accessing or using our service, you agree to be bound by these terms. If you disagree with any part of these terms, you may not access our service.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-12">
            
            {/* Section 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Acceptance of Terms</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  By creating an account or using any GladysTravelAI services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                </p>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  To access certain features of GladysTravelAI, you must create an account. You agree to:
                </p>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={20} />
                    <span>Provide accurate, current, and complete information during registration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={20} />
                    <span>Maintain and update your information to keep it accurate and current</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={20} />
                    <span>Keep your password secure and confidential</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={20} />
                    <span>Notify us immediately of any unauthorized use of your account</span>
                  </li>
                </ul>
                <p>
                  You are responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these terms.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Services Provided</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  GladysTravelAI provides AI-powered travel planning services including:
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>Personalized itinerary generation</li>
                  <li>Destination recommendations</li>
                  <li>Booking assistance for flights, hotels, and activities</li>
                  <li>Real-time travel updates and notifications</li>
                  <li>Travel tips and local insights</li>
                </ul>
                <p>
                  <strong>Important:</strong> GladysTravelAI acts as an intermediary between you and travel service providers. We are not responsible for the quality, safety, or legality of services provided by third parties.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">4</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Payments and Refunds</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  <strong>Pricing:</strong> All prices displayed are in USD unless otherwise stated. Prices are subject to change without notice.
                </p>
                <p>
                  <strong>Payment:</strong> We accept major credit cards, debit cards, and other payment methods as displayed during checkout. Payment processing is handled securely by our third-party payment providers.
                </p>
                <p>
                  <strong>Refunds:</strong> Refund eligibility depends on the specific service and booking terms. Generally:
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>Cancellations made 30+ days before travel: Full refund minus processing fees</li>
                  <li>Cancellations made 7-29 days before travel: 50% refund</li>
                  <li>Cancellations made less than 7 days before travel: No refund</li>
                </ul>
                <p className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
                  <strong>Note:</strong> Third-party bookings (flights, hotels, etc.) are subject to the cancellation policies of those providers.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">5</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">User Conduct</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>You agree not to:</p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>Use the service for any illegal purpose</li>
                  <li>Violate any laws in your jurisdiction</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Submit false or misleading information</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use automated systems to access the service without permission</li>
                  <li>Resell or commercially exploit our services without authorization</li>
                </ul>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">6</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Intellectual Property</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  All content on GladysTravelAI, including but not limited to text, graphics, logos, images, software, and AI-generated itineraries, is the property of GladysTravelAI or its licensors and is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, or create derivative works from our content without our express written permission.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">7</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                  <strong>IMPORTANT:</strong> To the fullest extent permitted by law, GladysTravelAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                </p>
                <p>
                  Our total liability to you for any claims arising from your use of the service shall not exceed the amount you paid to us in the 12 months prior to the event giving rise to the claim.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">8</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Governing Law</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                </p>
                <p>
                  Any disputes arising from these Terms or your use of our service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">9</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p><strong>Email:</strong> legal@gladystravelai.com</p>
                  <p><strong>Phone:</strong> +1 (234) 567-890</p>
                  <p><strong>Address:</strong> 123 Travel Street, San Francisco, CA 94102</p>
                </div>
              </div>
            </div>

          </div>

          {/* Final Notice */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <Scale className="text-purple-600 flex-shrink-0 mt-1" size={32} />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Agreement Acknowledgment</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By using GladysTravelAI, you acknowledge that you have read these Terms of Service, understand them, and agree to be bound by them. If you do not agree to these terms, please discontinue use of our service immediately.
                </p>
                <p className="text-sm text-gray-600">
                  Thank you for choosing GladysTravelAI. We're committed to providing you with exceptional travel experiences while protecting your rights and ours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;