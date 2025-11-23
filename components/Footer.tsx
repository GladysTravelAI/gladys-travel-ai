import { Sparkles, Mail, MapPin, Phone, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";

const Footer = () => (
  <footer className="relative mt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black border-t border-white/20">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Brand Section */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="text-white" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white">GladysTravelAI</h3>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Your AI-powered luxury travel companion for unforgettable journeys worldwide.
          </p>
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 inline-flex">
            <Sparkles className="text-yellow-400" size={16} />
            <span className="text-sm text-white font-medium">Your Smart Trip Planner</span>
          </div>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6 border-b border-white/20 pb-2">Company</h4>
          <ul className="space-y-3">
            <li>
              <Link 
                href="/about" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                About Us
              </Link>
            </li>
            <li>
              <Link 
                href="/contact" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Contact
              </Link>
            </li>
            <li>
              <Link 
                href="/careers" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Careers
              </Link>
            </li>
            <li>
              <Link 
                href="/blog" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Blog
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6 border-b border-white/20 pb-2">Legal</h4>
          <ul className="space-y-3">
            <li>
              <Link 
                href="/terms" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link 
                href="/privacy" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link 
                href="/cookies" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link 
                href="/refund" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
              >
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-3 group-hover:w-3 transition-all duration-300"></span>
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-bold text-lg mb-6 border-b border-white/20 pb-2">Get in Touch</h4>
          <ul className="space-y-4">
            <li>
              <a 
                href="mailto:support@gladystravelai.com" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-start group"
              >
                <Mail size={18} className="text-purple-400 mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">support@gladystravelai.com</span>
              </a>
            </li>
            <li>
              <a 
                href="tel:+1234567890" 
                className="text-gray-300 hover:text-white transition-all duration-300 flex items-start group"
              >
                <Phone size={18} className="text-purple-400 mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm">+1 (234) 567-890</span>
              </a>
            </li>
            <li className="flex items-start text-gray-300">
              <MapPin size={18} className="text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm">123 Travel Street<br />San Francisco, CA 94102</span>
            </li>
          </ul>
          
          {/* Social Media */}
          <div className="mt-6">
            <h5 className="text-white font-semibold text-sm mb-3">Follow Us</h5>
            <div className="flex space-x-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Twitter size={18} className="text-white" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Facebook size={18} className="text-white" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Instagram size={18} className="text-white" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Linkedin size={18} className="text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-400 text-sm text-center md:text-left">
          © 2025 GladysTravelAI. All rights reserved. Built with ❤️ and AI for travelers worldwide.
        </p>
        <div className="flex items-center space-x-6 text-sm">
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

    {/* Decorative Background Elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
    </div>
  </footer>
);

export default Footer;
