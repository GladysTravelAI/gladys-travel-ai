import { Mail, MapPin, Phone, Twitter, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Explore Events",  href: "/events"       },
      { name: "Features",        href: "/features"     },
      { name: "How It Works",    href: "/how-it-works" },
      { name: "My Trips",        href: "/trips"        },
    ],
    company: [
      { name: "About Us",  href: "/about"   },
      { name: "Contact",   href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy",   href: "/privacy" },
      { name: "Terms of Service", href: "/terms"   },
    ],
  };

  const socialLinks = [
    { name: "Twitter",   icon: Twitter,   href: "https://twitter.com/gladystravel"   },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/gladystravel" },
    { name: "LinkedIn",  icon: Linkedin,  href: "https://linkedin.com/company/gladystravel" },
  ];

  return (
    <footer
      className="relative mt-20 border-t border-slate-200"
      style={{ background: '#FAFBFC', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-18">

        {/* ── TOP SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex mb-6">
              <Logo size={36} showText={true} variant="dark" />
            </Link>

            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-sm">
              Your AI travel companion for event-based travel. One search finds tickets, flights, hotels and a complete itinerary for any event worldwide.
            </p>

            {/* Contact details */}
            <div className="space-y-3">
              {[
                { icon: Mail,  label: 'contact@gladystravel.com', href: 'mailto:contact@gladystravel.com' },
                { icon: Phone, label: '+27 64 545 2236',           href: 'tel:+27645452236'                },
                { icon: MapPin,label: 'Johannesburg, South Africa', href: null                             },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F0F9FF' }}>
                    <c.icon size={14} style={{ color: '#0EA5E9' }} />
                  </div>
                  {c.href
                    ? <a href={c.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">{c.label}</a>
                    : <span className="text-sm text-slate-500">{c.label}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Links cols */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { heading: 'Product', links: footerLinks.product },
              { heading: 'Company', links: footerLinks.company },
              { heading: 'Legal',   links: footerLinks.legal   },
            ].map(({ heading, links }) => (
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
        <div className="mb-14 p-6 sm:p-8 rounded-2xl border border-slate-200" style={{ background: '#F0F9FF' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h4 className="text-lg font-black text-slate-900 mb-1">Stay Updated on Events & Deals</h4>
              <p className="text-sm text-slate-500">Ticket drop alerts, price changes and travel deals — straight to your inbox.</p>
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
                  className="h-12 px-6 text-white font-bold rounded-xl shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap text-sm"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            <p className="text-sm text-slate-400">
              © {currentYear} GladysTravel.com — All rights reserved.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map(s => (
                <motion.a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-sky-100 flex items-center justify-center transition-colors group"
                  aria-label={s.name}>
                  <s.icon size={16} className="text-slate-500 group-hover:text-sky-600 transition-colors" />
                </motion.a>
              ))}
            </div>

            {/* Legal mini links */}
            <div className="flex items-center gap-5 text-xs text-slate-400">
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-slate-700 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom sky blue line */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)' }} />
    </footer>
  );
};

export default Footer;