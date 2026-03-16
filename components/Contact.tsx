'use client';

import { useState } from 'react';
import {
  Mail, Phone, MapPin, Send, MessageCircle,
  CheckCircle, AlertCircle, Loader2, ChevronDown, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';



// ── TYPES ──────────────────────────────────────────────────────────────────────

interface FormData {
  name: string; email: string; phone: string; subject: string; message: string; honeypot?: string;
}
interface FormErrors {
  name?: string; email?: string; subject?: string; message?: string;
}
type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const SKY = '#0EA5E9';

// ── MAIN ───────────────────────────────────────────────────────────────────────

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', phone: '', subject: '', message: '', honeypot: '',
  });
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [status,      setStatus]      = useState<FormStatus>('idle');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  function validateForm(): boolean {
    const e: FormErrors = {};
    if (!formData.name.trim()  || formData.name.trim().length < 2)
      e.name = 'Please enter your name';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Please enter a valid email';
    if (!formData.subject)
      e.subject = 'Please select a subject';
    if (!formData.message.trim() || formData.message.trim().length < 10)
      e.message = 'Message must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.honeypot) return;
    if (!validateForm()) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', honeypot: '' });
      setTimeout(() => setStatus('idle'), 6000);
    } catch {
      setStatus('error');
    }
  }

  const faqs = [
    { q: 'How quickly will I get a response?',
      a: 'We aim to respond to all messages within 24 hours on business days. For urgent matters email contact@gladystravel.com directly.' },
    { q: 'I found a bug or something broken — who do I contact?',
      a: 'Email contact@gladystravel.com with a description of the issue and a screenshot if possible. We take bugs seriously and fix them fast.' },
    { q: 'Can I partner with Gladys Travel?',
      a: 'Yes — we\'re open to partnerships with event organizers, travel brands, and affiliate networks. Reach out via the form with "Partnership" as the subject.' },
    { q: 'Is Gladys Travel available in my country?',
      a: 'GladysTravel.com works globally. You can plan trips to events anywhere in the world, from anywhere in the world.' },
    { q: 'How do I delete my account?',
      a: 'Email contact@gladystravel.com from your registered email address and we will delete your account within 48 hours.' },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>


      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-4 sm:px-6 text-center bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-slate-200 text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: SKY }} />
            Get in touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            We'd love to hear<br />
            <span style={{ color: SKY }}>from you.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Questions, feedback, partnerships — send us a message and we'll get back to you within 24 hours.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">

          {/* ── CONTACT INFO ── */}
          <div className="space-y-5">
            {[
              { icon: Mail,   label: 'Email',    value: 'contact@gladystravel.com', href: 'mailto:contact@gladystravel.com' },
              { icon: Phone,  label: 'Phone',    value: '+27 64 545 2236',           href: 'tel:+27645452236'                },
              { icon: MapPin, label: 'Location', value: 'Johannesburg, South Africa', href: null                            },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-sky-200 transition-all"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F0F9FF' }}>
                  <c.icon size={18} style={{ color: SKY }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{c.label}</p>
                  {c.href
                    ? <a href={c.href} className="text-sm font-semibold text-slate-800 hover:text-sky-600 transition-colors">{c.value}</a>
                    : <p className="text-sm font-semibold text-slate-800">{c.value}</p>
                  }
                </div>
              </motion.div>
            ))}

            {/* Response time note */}
            <div className="p-5 rounded-2xl border-2 border-sky-100" style={{ background: '#F0F9FF' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">Response time</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                We typically respond within <span className="font-bold text-slate-900">24 hours</span> on business days. For urgent issues email directly.
              </p>
            </div>
          </div>

          {/* ── FORM ── */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border-2 border-slate-100 rounded-3xl p-8"
            >
              <div className="flex items-center gap-2.5 mb-6">
                <Sparkles size={22} style={{ color: SKY }} />
                <h2 className="text-2xl font-black text-slate-900">Send a message</h2>
              </div>

              {/* Success */}
              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{   opacity: 0, height: 0       }}
                    className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-start gap-3"
                  >
                    <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Message sent!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">We'll get back to you at {formData.email || 'your email'} within 24 hours.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{   opacity: 0, height: 0       }}
                    className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-start gap-3"
                  >
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-900 text-sm">Couldn't send your message</p>
                      <p className="text-xs text-red-700 mt-0.5">Please try again or email us directly at contact@gladystravel.com</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot */}
                <input type="text" name="honeypot" value={formData.honeypot} onChange={handleChange}
                  style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Full name" name="name" type="text" value={formData.name}
                    onChange={handleChange} error={errors.name} placeholder="Your name" required />
                  <Field label="Email address" name="email" type="email" value={formData.email}
                    onChange={handleChange} error={errors.email} placeholder="you@example.com" required />
                </div>

                {/* Phone + Subject */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Phone (optional)" name="phone" type="tel" value={formData.phone}
                    onChange={handleChange} placeholder="+27 64 000 0000" />
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="subject" value={formData.subject} onChange={handleChange}
                      className={`w-full h-11 px-4 border-2 rounded-xl text-sm text-slate-800 bg-white outline-none transition-all focus:border-sky-400 ${errors.subject ? 'border-red-400' : 'border-slate-200'}`}
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General question</option>
                      <option value="bug">Bug report</option>
                      <option value="partnership">Partnership</option>
                      <option value="feedback">Feedback</option>
                      <option value="account">Account / data</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <span className="text-xs text-slate-400">{1000 - formData.message.length} left</span>
                  </div>
                  <textarea
                    name="message" value={formData.message} onChange={handleChange}
                    rows={5} maxLength={1000}
                    placeholder="Tell us how we can help..."
                    className={`w-full px-4 py-3 border-2 rounded-xl text-sm text-slate-800 outline-none resize-none transition-all focus:border-sky-400 ${errors.message ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full h-13 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)', height: '52px' }}
                >
                  {status === 'sending'
                    ? <><Loader2 size={16} className="animate-spin" />Sending...</>
                    : <><Send size={16} />Send message</>
                  }
                </motion.button>

                <p className="text-center text-xs text-slate-400">
                  Your data is protected under our{' '}
                  <a href="/privacy" className="underline hover:text-slate-700">Privacy Policy</a>.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 sm:px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Common questions</h2>
            <p className="text-slate-500">Can't find what you need? Email contact@gladystravel.com</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-sky-200 transition-all">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-bold text-slate-900 text-sm pr-4">{faq.q}</span>
                  <motion.div animate={{ rotate: expandedFAQ === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFAQ === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{   height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}

// ── FIELD ──────────────────────────────────────────────────────────────────────

function Field({ label, name, type, value, onChange, error, placeholder, required }: {
  label: string; name: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} id={name} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-11 px-4 border-2 rounded-xl text-sm text-slate-800 outline-none transition-all focus:border-sky-400 ${error ? 'border-red-400' : 'border-slate-200'}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}