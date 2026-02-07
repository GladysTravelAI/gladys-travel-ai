"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Check, X, Eye, EyeOff, AlertCircle, CheckCircle2, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

export default function SignUpClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  // Password strength checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  // Calculate password strength
  const passwordStrength = Object.values(passwordChecks).filter(v => v !== passwordChecks.match).filter(Boolean).length;
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-orange-500';
    if (passwordStrength === 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Fair';
    if (passwordStrength === 4) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password || !confirmPassword) {
      const msg = "Please fill in all fields";
      setError(msg);
      toast.error(msg, { icon: <AlertCircle size={18} /> });
      return;
    }

    if (!agreedToTerms) {
      const msg = "Please agree to the Terms and Privacy Policy";
      setError(msg);
      toast.error(msg, { icon: <AlertCircle size={18} /> });
      return;
    }

    if (!isPasswordStrong) {
      const msg = "Please meet all password requirements";
      setError(msg);
      toast.error(msg, { icon: <AlertCircle size={18} /> });
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      setSuccess(true);
      
      toast.success("Account created successfully!", {
        icon: <CheckCircle2 size={18} />,
        description: "Redirecting to your dashboard..."
      });
      
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Try signing in instead.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled. Contact support.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
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

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    
    try {
      await loginWithGoogle();
      toast.success("Account created with Google!", { icon: <CheckCircle2 size={18} /> });
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error(err);
      const errorMessage = "Google sign up failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, { icon: <AlertCircle size={18} /> });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4 py-12">
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
            Create your account
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Start planning your next adventure
          </p>
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-2 border-amber-100 dark:border-amber-900/30 rounded-3xl p-8 shadow-2xl"
        >
          {/* Error/Success Alerts */}
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

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-green-700 dark:text-green-400 font-semibold">Account created!</p>
                    <p className="text-green-600 dark:text-green-500 text-sm">Redirecting to your dashboard...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  disabled={loading}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
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
              
              {/* Password Strength Meter */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Password Strength
                    </span>
                    <span className={`text-xs font-bold ${
                      passwordStrength <= 2 ? 'text-red-600' :
                      passwordStrength === 3 ? 'text-orange-600' :
                      passwordStrength === 4 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 transition-all duration-300 ${
                          i < passwordStrength ? getPasswordStrengthColor() : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Password Requirements */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-2"
                >
                  <PasswordCheck met={passwordChecks.length} text="At least 8 characters" />
                  <PasswordCheck met={passwordChecks.uppercase} text="One uppercase letter" />
                  <PasswordCheck met={passwordChecks.lowercase} text="One lowercase letter" />
                  <PasswordCheck met={passwordChecks.number} text="One number" />
                  <PasswordCheck met={passwordChecks.special} text="One special character (!@#$%^&*)" />
                </motion.div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3"
                >
                  <PasswordCheck met={passwordChecks.match} text="Passwords match" />
                </motion.div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 rounded focus:ring-amber-500 focus:ring-2"
                disabled={loading}
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <Link href="/terms" className="font-semibold text-amber-600 hover:text-amber-700 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold text-amber-600 hover:text-amber-700 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !isPasswordStrong || !agreedToTerms}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:via-orange-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Create Account</span>
                </>
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

          {/* Google Sign Up */}
          <motion.button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
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
            <span>Sign up with Google</span>
          </motion.button>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Already have an account?{" "}
              <Link 
                href="/signin" 
                className="font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent hover:from-amber-700 hover:to-purple-700 transition-all"
              >
                Sign In
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
          <span>Your data is encrypted and secure</span>
        </motion.p>
      </motion.div>
    </div>
  );
}

// Password Check Component
function PasswordCheck({ met, text }: { met: boolean; text: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 text-xs transition-colors ${
        met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
      }`}
    >
      <div className={`flex-shrink-0 rounded-full ${met ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-zinc-800'} p-0.5`}>
        {met ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-gray-400" />}
      </div>
      <span className="font-medium">{text}</span>
    </motion.div>
  );
}