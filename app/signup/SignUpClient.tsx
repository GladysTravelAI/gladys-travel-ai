"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, Loader2, Check, X, Eye, EyeOff,
  AlertCircle, CheckCircle2, Shield, Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

const SKY = '#0EA5E9';

export default function SignUpClient() {
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);
  const [agreedToTerms,   setAgreedToTerms]   = useState(false);

  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  // ── Password strength ──
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*(),.?":{}|<>]/.test(password),
    match:     password === confirmPassword && password.length > 0,
  };
  const strength    = [checks.length, checks.uppercase, checks.lowercase, checks.number, checks.special].filter(Boolean).length;
  const isStrong    = Object.values(checks).every(Boolean);

  const strengthColor =
    strength <= 2 ? '#EF4444' :
    strength === 3 ? '#F97316' :
    strength === 4 ? '#F59E0B' :
    '#10B981';

  const strengthLabel =
    strength <= 2 ? 'Weak' :
    strength === 3 ? 'Fair' :
    strength === 4 ? 'Good' :
    'Strong';

  // ── Handlers ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) { setError("Please fill in all fields"); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms and Privacy Policy"); return; }
    if (!isStrong)      { setError("Please meet all password requirements"); return; }

    setLoading(true);
    try {
      await signup(email, password);
      setSuccess(true);
      toast.success("Account created!", { description: "Redirecting to your dashboard..." });

      // Send welcome email via Resend (fire-and-forget)
      fetch('/api/emails', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'welcome', to: email }),
      }).catch(() => {/* silent — email is non-critical */});

      setTimeout(() => router.push("/"), 1200);
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"    ? "This email is already registered. Try signing in."  :
        err.code === "auth/invalid-email"            ? "Invalid email address format."                       :
        err.code === "auth/weak-password"            ? "Password is too weak. Please use a stronger one."   :
        err.code === "auth/network-request-failed"   ? "Network error. Check your connection."               :
        err.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true); setError("");
    try {
      await loginWithGoogle();
      toast.success("Account created with Google!");

      // Send welcome email via Resend
      fetch('/api/emails', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'welcome', to: email }),
      }).catch(() => {});

      setTimeout(() => { router.push("/"); router.refresh(); }, 600);
    } catch {
      setError("Google sign-up failed. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Render ──

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 py-12"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size={44} showText={true} variant="dark" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Create your account</h1>
          <p className="text-slate-500 text-sm">Start planning your next adventure</p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-xl">

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden">
                <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-5 overflow-hidden">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                  <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-800 font-black text-sm">Account created!</p>
                    <p className="text-emerald-700 text-xs mt-0.5">Redirecting to your dashboard...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" placeholder="your@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} disabled={loading} required autoComplete="email"
                  className="w-full pl-11 pr-4 h-12 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-400 transition-all disabled:opacity-50" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? "text" : "password"} placeholder="Create a strong password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={loading} required autoComplete="new-password"
                  className="w-full pl-11 pr-12 h-12 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-400 transition-all disabled:opacity-50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-500">Password strength</span>
                    <span className="text-xs font-black" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < strength ? strengthColor : 'transparent' }} />
                    ))}
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {[
                      { met: checks.length,    text: 'At least 8 characters'          },
                      { met: checks.uppercase, text: 'One uppercase letter'            },
                      { met: checks.lowercase, text: 'One lowercase letter'            },
                      { met: checks.number,    text: 'One number'                      },
                      { met: checks.special,   text: 'One special character (!@#$%^&*)'},
                    ].map(c => <PasswordCheck key={c.text} met={c.met} text={c.text} />)}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showConfirm ? "text" : "password"} placeholder="Re-enter your password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading} required autoComplete="new-password"
                  className="w-full pl-11 pr-12 h-12 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-400 transition-all disabled:opacity-50" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPassword && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                  <PasswordCheck met={checks.match} text="Passwords match" />
                </motion.div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50">
              <input type="checkbox" id="terms" checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                disabled={loading} required
                className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-sky-500 flex-shrink-0" />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="/terms"   className="font-bold underline" style={{ color: SKY }}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="font-bold underline" style={{ color: SKY }}>Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <motion.button type="submit"
              disabled={loading || !isStrong || !agreedToTerms}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full h-12 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" />Creating Account...</>
                : <><Zap size={15} />Create Account</>
              }
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs font-bold text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google */}
          <motion.button type="button" onClick={handleGoogleSignUp} disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full h-12 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </motion.button>

          {/* Sign in link */}
          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/signin" className="font-black transition-colors" style={{ color: SKY }}>
              Sign In
            </Link>
          </p>
        </div>

        {/* Security note */}
        <p className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Shield size={12} />Your data is encrypted and secure
        </p>
      </motion.div>
    </div>
  );
}

// ── PASSWORD CHECK ─────────────────────────────────────────────────────────────

function PasswordCheck({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${met ? 'bg-emerald-100' : 'bg-slate-100'}`}>
        {met ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-slate-400" />}
      </div>
      <span className="font-semibold">{text}</span>
    </div>
  );
}