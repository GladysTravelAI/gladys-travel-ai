import { Sparkles, Mail, MapPin, Phone, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Events", href: "/events" },
      { name: "How It Works", href: "/how-it-works" },
      { name: "Pricing", href: "/pricing" },
      { name: "AI Agent", href: "/agent" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Careers", href: "/careers" },
      { name: "Press Kit", href: "/press" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Refund Policy", href: "/refund" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Safety", href: "/safety" },
      { name: "Accessibility", href: "/accessibility" },
      { name: "Affiliate Program", href: "/affiliates" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/gladystravelai" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/gladystravelai" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/gladystravelai" },
    { name: "GitHub", icon: Github, href: "https://github.com/gladystravelai" },
  ];

  return (
    <footer className="relative mt-20 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 border-t border-zinc-200/50 dark:border-zinc-800/50">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group mb-6">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 opacity-60 blur-md group-hover:opacity-80 transition-opacity"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                  Gladys
                </h3>
                <p className="text-[10px] font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                  Travel AI
                </p>
              </div>
            </Link>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 max-w-md">
              Your autonomous AI travel agent. We handle everything from finding the best ticket deals 
              to booking complete trips around the world's greatest events.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href="mailto:gladystravelai@gmail.com" 
                className="group flex items-center gap-3 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                  <Mail size={16} className="text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600" />
                </div>
                <span className="text-xs">gladystravelai@gmail.com</span>
              </a>
              
              <a 
                href="tel:+27645452236" 
                className="group flex items-center gap-3 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                  <Phone size={16} className="text-zinc-600 dark:text-zinc-400 group-hover:text-amber-600" />
                </div>
                <span className="text-xs">+27 64 545 2236</span>
              </a>
              
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <MapPin size={16} className="text-zinc-600 dark:text-zinc-400" />
                </div>
                <span className="text-xs">Johannesburg, South Africa</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mb-16 p-8 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 border border-amber-200/50 dark:border-zinc-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                Stay Updated on Events & Deals
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Get exclusive access to ticket drops, price alerts, and travel deals.
              </p>
            </div>
            <div className="flex-1 w-full md:max-w-md">
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-12 px-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-amber-500 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-200/30 dark:focus:ring-amber-900/30 outline-none text-sm text-zinc-900 dark:text-white placeholder-zinc-500 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="h-12 px-6 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>© {currentYear} Gladys Travel AI.</span>
              <span className="hidden md:inline">•</span>
              <span>All rights reserved.</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-lg bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-900/30 flex items-center justify-center transition-colors group"
                  aria-label={social.name}
                >
                  <social.icon size={18} className="text-zinc-600 group-hover:text-amber-600 dark:text-zinc-400 dark:group-hover:text-amber-400 transition-colors" />
                </motion.a>
              ))}
            </div>

            {/* Additional Links */}
            <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-500">
              <Link href="/sitemap" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                Sitemap
              </Link>
              <Link href="/security" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                Security
              </Link>
              <Link href="/status" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                Status
              </Link>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-emerald-600 text-xs">✓</span>
                </div>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 text-xs">✓</span>
                </div>
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-purple-600 text-xs">✓</span>
                </div>
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-600 text-xs">✓</span>
                </div>
                <span>Verified Partners</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
    </footer>
  );
};

export default Footer;