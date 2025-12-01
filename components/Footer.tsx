import { Sparkles, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

const Footer = () => (
  <footer className="relative mt-12 bg-gray-900 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Brand Section */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <h3 className="text-xl font-semibold text-white">GladysTravelAI</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            Your AI-powered travel companion for unforgettable journeys.
          </p>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
            <Sparkles className="text-blue-400" size={14} />
            <span className="text-xs text-gray-300 font-medium">Smart Trip Planner</span>
          </div>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/careers" className="text-gray-400 hover:text-white text-sm transition-colors">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-gray-400 hover:text-white text-sm transition-colors">
                Blog
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="/refund" className="text-gray-400 hover:text-white text-sm transition-colors">
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Get in Touch</h4>
          <ul className="space-y-3">
            <li>
              <a href="mailto:gladystravelai@gmail.com" className="text-gray-400 hover:text-white text-sm flex items-start gap-2 transition-colors">
                <Mail size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs break-all">gladystravelai@gmail.com</span>
              </a>
            </li>
            <li>
              <a href="tel:+27645452236" className="text-gray-400 hover:text-white text-sm flex items-start gap-2 transition-colors">
                <Phone size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs">+27 64 545 2236</span>
              </a>
            </li>
            <li className="flex items-start gap-2 text-gray-400 text-sm">
              <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs">Johannesburg, South Africa</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-gray-400 text-xs text-center sm:text-left">
          © 2025 GladysTravelAI. All rights reserved.
        </p>
        <div className="flex items-center space-x-4 text-xs">
          <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors">
            Sitemap
          </Link>
          <Link href="/accessibility" className="text-gray-400 hover:text-white transition-colors">
            Accessibility
          </Link>
          <Link href="/security" className="text-gray-400 hover:text-white transition-colors">
            Security
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;