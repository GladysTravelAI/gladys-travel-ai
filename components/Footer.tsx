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
    <footer
      className="relative mt-20 border-t border-slate-200"
      style={{ background: '#FAFBFC', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Sky blue top accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">

        {/* ── TOP SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group mb-6">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full opacity-40 blur-md group-hover:opacity-60 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }} />
                <div className="relative w-full h-full rounded-full flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">Gladys</h3>
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#0EA5E9' }}>
                  Travel AI
                </p>
              </div>
            </Link>

            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-sm">
              Your intelligent AI travel agent. One search finds tickets, flights, hotels and a complete itinerary for any event worldwide.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              {[
                { icon: Mail, label: 'hello@gladystravel.com', href: 'mailto:hello@gladystravel.com' },
                { icon: Phone, label: '+27 64 545 2236', href: 'tel:+27645452236' },
                { icon: MapPin, label: 'Johannesburg, South Africa', href: null },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F0F9FF' }}>
                    <c.icon size={15} style={{ color: '#0EA5E9' }} />
                  </div>
                  {c.href
                    ? <a href={c.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">{c.label}</a>
                    : <span className="text-sm text-slate-500">{c.label}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries({ Product: footerLinks.product, Company: footerLinks.company, Legal: footerLinks.legal, Support: footerLinks.support }).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-sm font-black text-slate-900 mb-4">{heading}</h4>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link.name}>
                      <Link href={link.href}
                        className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── NEWSLETTER ── */}
        <div className="mb-16 p-8 rounded-2xl border border-slate-200" style={{ background: '#F0F9FF' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h4 className="text-lg font-black text-slate-900 mb-1">Stay Updated on Events & Deals</h4>
              <p className="text-sm text-slate-500">Exclusive access to ticket drops, price alerts, and travel deals.</p>
            </div>
            <div className="flex-1 w-full md:max-w-md">
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-12 px-4 bg-white border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-sky-400"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="h-12 px-6 text-white font-bold rounded-xl shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-500">© {currentYear} Gladys Travel AI. All rights reserved.</p>

            {/* Social */}
            <div className="flex items-center gap-2">
              {socialLinks.map(s => (
                <motion.a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-sky-100 flex items-center justify-center transition-colors group"
                  aria-label={s.name}>
                  <s.icon size={17} className="text-slate-500 group-hover:text-sky-600 transition-colors" />
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-5 text-xs text-slate-400">
              {[['Sitemap', '/sitemap'], ['Security', '/security'], ['Status', '/status']].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-slate-700 transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            {[
              { label: 'SSL Secured', color: '#10B981', bg: '#D1FAE5' },
              { label: 'PCI Compliant', color: '#0EA5E9', bg: '#E0F2FE' },
              { label: 'GDPR Compliant', color: '#8B5CF6', bg: '#EDE9FE' },
              { label: 'Verified Partners', color: '#F97316', bg: '#FEF3C7' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: b.bg, color: b.color }}>✓</div>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom sky blue line */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)' }} />
    </footer>
  );
};

export default Footer;