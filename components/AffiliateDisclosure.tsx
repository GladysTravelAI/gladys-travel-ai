"use client";

import { useState } from "react";
import { Info, X, DollarSign, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateDisclosureProps {
  variant?: 'banner' | 'modal' | 'inline' | 'badge';
  className?: string;
}

export default function AffiliateDisclosure({ 
  variant = 'badge',
  className = '' 
}: AffiliateDisclosureProps) {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Banner Variant (Top of page)
  if (variant === 'banner' && !dismissed) {
    return (
      <div className={`bg-blue-50 border-b border-blue-200 py-3 px-6 ${className}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info className="text-blue-600 flex-shrink-0" size={20} />
            <p className="text-sm text-blue-900">
              <strong>Transparency Note:</strong> We may earn commissions from bookings made through our affiliate links at no extra cost to you.
              <button 
                onClick={() => setShowModal(true)}
                className="ml-2 underline font-semibold hover:text-blue-700"
              >
                Learn more
              </button>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <X size={18} />
          </button>
        </div>
        {showModal && <DisclosureModal onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  // Badge Variant (Small icon)
  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-xs font-medium text-blue-700 transition-colors ${className}`}
        >
          <Info size={14} />
          <span>Affiliate Disclosure</span>
        </button>
        {showModal && <DisclosureModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Inline Variant (Text with icon)
  if (variant === 'inline') {
    return (
      <div className={`flex items-start space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Affiliate Disclosure:</strong> GladysTravelAI participates in affiliate marketing programs. When you book through our links, we may earn a commission at no additional cost to you. This helps us keep our service free and improve your travel experience.
            <button 
              onClick={() => setShowModal(true)}
              className="ml-2 text-blue-600 underline font-semibold hover:text-blue-800"
            >
              Read full disclosure
            </button>
          </p>
        </div>
        {showModal && <DisclosureModal onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  // Modal Variant (Show immediately)
  if (variant === 'modal') {
    return <DisclosureModal onClose={() => {}} />;
  }

  return null;
}

// Full Disclosure Modal
function DisclosureModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-[61] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Affiliate Disclosure</h2>
              <p className="text-white/90 text-sm">How we keep our service free</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Introduction */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <Info className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <p className="text-gray-700 leading-relaxed">
                <strong>In short:</strong> When you book travel through links on GladysTravelAI, we may earn a small commission from our partners. This doesn't cost you anything extra – you pay the same price you would if you went directly to their website.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <DollarSign className="text-green-600 mr-2" size={20} />
                How Affiliate Marketing Works
              </h3>
              <p className="leading-relaxed mb-4">
                GladysTravelAI participates in affiliate programs with leading travel companies including Booking.com, Expedia, Skyscanner, Viator, and others. When you click on a link and make a booking, we receive a commission from these partners.
              </p>
              <p className="leading-relaxed">
                <strong>Important:</strong> These commissions do not increase your costs. You pay exactly what you would pay if you visited these sites directly. The travel companies share a portion of their profit with us as a thank-you for referring customers.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="text-blue-600 mr-2" size={20} />
                Our Commitment to You
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={18} />
                  <span><strong>Honest Recommendations:</strong> We only recommend services we genuinely believe will enhance your travel experience, regardless of commission rates.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={18} />
                  <span><strong>No Hidden Costs:</strong> All prices shown include any applicable taxes and fees. What you see is what you'll pay.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={18} />
                  <span><strong>Editorial Independence:</strong> Our AI-powered recommendations are based on quality, ratings, and user preferences – not commission rates.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1 mr-3" size={18} />
                  <span><strong>Transparency:</strong> We clearly mark all affiliate links and partnerships throughout our platform.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Why We Use Affiliate Marketing
              </h3>
              <p className="leading-relaxed mb-4">
                Affiliate commissions allow us to:
              </p>
              <ul className="space-y-2 ml-6 list-disc">
                <li>Keep GladysTravelAI completely free for travelers</li>
                <li>Continuously improve our AI-powered planning tools</li>
                <li>Provide 24/7 customer support</li>
                <li>Maintain and update our destination database</li>
                <li>Develop new features based on user feedback</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Our Affiliate Partners
              </h3>
              <p className="leading-relaxed mb-4">
                We work with trusted industry leaders including:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Booking.com', 'Expedia', 'Skyscanner', 'Viator', 'GetYourGuide', 'Agoda', 'Hotels.com', 'Airbnb', 'Kayak'].map((partner) => (
                  <div key={partner} className="px-4 py-2 bg-gray-100 rounded-lg text-center font-medium text-sm">
                    {partner}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                FTC Compliance
              </h3>
              <p className="leading-relaxed text-sm">
                This disclosure is in accordance with the Federal Trade Commission's 16 CFR, Part 255: "Guides Concerning the Use of Endorsements and Testimonials in Advertising." We are required by law to inform you of our affiliate relationships.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 bg-gradient-to-r from-purple-50 to-pink-50 -m-6 p-6 rounded-b-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Questions or Concerns?
              </h3>
              <p className="leading-relaxed mb-4">
                We're committed to transparency. If you have any questions about our affiliate relationships or how we make money, please don't hesitate to reach out.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/contact'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Contact Us
                </Button>
                <Button
                  onClick={() => window.location.href = '/privacy'}
                  variant="outline"
                >
                  Read Privacy Policy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Export helper component for "Powered by" labels
export function AffiliatePartnerBadge({ partner }: { partner: string }) {
  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      <span>Powered by</span>
      <span className="font-semibold text-gray-700">{partner}</span>
      <Info size={12} className="text-gray-400" />
    </div>
  );
}