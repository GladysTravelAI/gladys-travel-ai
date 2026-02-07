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

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { login, loginWithGoogle } = useAuth();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Rate limiting check
  const isRateLimited = loginAttempts >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!email || !password) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields", { icon: <AlertCircle size={18} /> });
      return;
    }

    // Rate limiting
    if (isRateLimited) {
      const errorMsg = "Too many login attempts. Please wait 5 minutes.";
      setError(errorMsg);
      toast.error(errorMsg, { icon: <Shield size={18} /> });
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('remembered-email', email);
      } else {
        localStorage.removeItem('remembered-email');
      }

      toast.success("Welcome back!", { 
        icon: <CheckCircle2 size={18} />,
        description: "Redirecting to your dashboard..."
      });
      
      // Smooth redirect
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 800);
      
    } catch (err: any) {
      console.error(err);
      setLoginAttempts(prev => prev + 1);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Contact support.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { 
        icon: <AlertCircle size={18} />,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isRateLimited) {
      toast.error("Too many attempts. Please wait.", { icon: <Shield size={18} /> });
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google!", { icon: <CheckCircle2 size={18} /> });
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error(err);
      const errorMessage = "Google sign-in failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, { icon: <AlertCircle size={18} /> });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo size={60} showText={true} />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sign in to continue your journey
          </p>
        </div>

        {/* Form Card with Glass Effect */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-2 border-amber-100 dark:border-amber-900/30 rounded-3xl p-8 shadow-2xl"
        >
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rate Limit Warning */}
          {loginAttempts >= 3 && loginAttempts < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Shield className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  <strong>Security Notice:</strong> {5 - loginAttempts} attempts remaining before temporary lockout.
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isRateLimited}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || isRateLimited}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-amber-600 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 rounded focus:ring-amber-500 focus:ring-2"
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || isRateLimited}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:via-orange-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200 dark:border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 dark:bg-zinc-900/80 text-gray-500 dark:text-gray-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || isRateLimited}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border-2 border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-200 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </motion.button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link 
                href="/signup" 
                className="font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent hover:from-amber-700 hover:to-purple-700 transition-all"
              >
                Sign Up Free
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"
        >
          <Shield size={14} />
          <span>Protected by 256-bit encryption</span>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="animate-spin text-amber-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading sign in...</p>
        </motion.div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}