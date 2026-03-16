"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

const SKY = '#0EA5E9';

function SignInForm() {
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [rememberMe,    setRememberMe]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";
  const { login, loginWithGoogle } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('remembered-email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  const isRateLimited = loginAttempts >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    if (isRateLimited) { setError("Too many login attempts. Please wait 5 minutes."); return; }

    setLoading(true);
    try {
      await login(email, password);
      if (rememberMe) localStorage.setItem('remembered-email', email);
      else            localStorage.removeItem('remembered-email');
      toast.success("Welcome back!");
      setTimeout(() => { router.push(callbackUrl); router.refresh(); }, 600);
    } catch (err: any) {
      setLoginAttempts(p => p + 1);
      const msg =
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password" ? "Invalid email or password" :
        err.code === "auth/too-many-requests"    ? "Too many attempts. Try again later."       :
        err.code === "auth/network-request-failed" ? "Network error. Check your connection."  :
        err.code === "auth/user-disabled"        ? "Account disabled. Contact support."        :
        "Something went wrong. Please try again.";
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    if (isRateLimited) return;
    setLoading(true); setError("");
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google!");
      setTimeout(() => { router.push(callbackUrl); router.refresh(); }, 600);
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size={44} showText={true} variant="dark" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to continue your journey</p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-xl">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rate limit warning */}
          {loginAttempts >= 3 && loginAttempts < 5 && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
              <Shield size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm font-semibold">
                {5 - loginAttempts} attempt{5 - loginAttempts === 1 ? '' : 's'} remaining before temporary lockout.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || isRateLimited}
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 h-12 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-400 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Password</label>
                <Link href="/forgot-password"
                  className="text-xs font-bold transition-colors"
                  style={{ color: SKY }}>
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading || isRateLimited}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 h-12 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-400 transition-all disabled:opacity-50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-slate-300 accent-sky-500"
              />
              <label htmlFor="remember-me" className="text-xs font-semibold text-slate-500 cursor-pointer">
                Remember me on this device
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || isRateLimited}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full h-12 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Signing in...</>
                : 'Sign In'
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
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || isRateLimited}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full h-12 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Sign up link */}
          <p className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/signup" className="font-black transition-colors" style={{ color: SKY }}>
              Sign Up Free
            </Link>
          </p>
        </div>

        {/* Security note */}
        <p className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Shield size={12} />Protected by 256-bit encryption
        </p>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}