"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, Bell, Lock, Globe, Moon, 
  Mail, ChevronRight, LogOut, Trash2, Shield,
  MapPin, Smartphone, Languages, HelpCircle, Sun,
  Sparkles, Star, TrendingUp, Award
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsClient() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Modal states
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [travelPrefsOpen, setTravelPrefsOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);

  // Settings state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    deals: true,
    updates: true
  });
  const [defaultLocation, setDefaultLocation] = useState("Johannesburg, South Africa");
  const [language, setLanguage] = useState("en-US");
  const [darkMode, setDarkMode] = useState(false);
  const [travelPrefs, setTravelPrefs] = useState({
    budget: "Mid-range",
    tripType: "Balanced",
    travelers: 1
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Check system dark mode preference
    if (typeof window !== 'undefined') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
    }
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    router.push("/");
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (typeof window !== 'undefined') {
      if (enabled) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-opulent-subtle">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Loading your settings...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/20 dark:to-purple-900/20 border border-amber-200 dark:border-amber-700 rounded-full mb-6">
            <Sparkles className="text-amber-600" size={14} />
            <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
              Premium Settings
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Account Settings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Personalize your luxurious travel experience
          </p>

          {/* User Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 p-4 shadow-apple">
              <TrendingUp className="text-amber-500 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Trips Planned</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 p-4 shadow-apple">
              <Star className="text-rose-500 mx-auto mb-2 fill-rose-500" size={24} />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">4.9</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-purple-100 dark:border-purple-900/30 p-4 shadow-apple">
              <Award className="text-purple-500 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Gold</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Member Tier</div>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Account Section */}
          <SettingsSection title="Account" icon={User}>
            <SettingsItem
              icon={User}
              label="Personal Information"
              description="Update your name, email, and profile"
              onClick={() => setPersonalInfoOpen(true)}
            />
            <SettingsItem
              icon={Mail}
              label="Email Address"
              description={user.email || "Not set"}
              onClick={() => {}}
            />
            <SettingsItem
              icon={Lock}
              label="Password & Security"
              description="Change password and security settings"
              onClick={() => setPasswordOpen(true)}
            />
          </SettingsSection>

          {/* Preferences Section */}
          <SettingsSection title="Preferences" icon={Globe}>
            <SettingsItem
              icon={Bell}
              label="Notifications"
              description="Manage email and push notifications"
              onClick={() => setNotificationsOpen(true)}
            />
            <SettingsItem
              icon={MapPin}
              label="Default Location"
              description={defaultLocation}
              onClick={() => setLocationOpen(true)}
            />
            <SettingsItem
              icon={Languages}
              label="Language & Region"
              description="English (United States)"
              onClick={() => setLanguageOpen(true)}
            />
            <SettingsItem
              icon={darkMode ? Moon : Sun}
              label="Appearance"
              description={darkMode ? "Dark mode" : "Light mode"}
              onClick={() => setAppearanceOpen(true)}
            />
          </SettingsSection>

          {/* Travel Preferences */}
          <SettingsSection title="Travel" icon={Sparkles}>
            <SettingsItem
              icon={Globe}
              label="Travel Preferences"
              description="Set default budget, trip type, and more"
              onClick={() => setTravelPrefsOpen(true)}
            />
            <SettingsItem
              icon={Shield}
              label="Travel Insurance"
              description="Manage insurance preferences"
              onClick={() => setInsuranceOpen(true)}
            />
          </SettingsSection>

          {/* Support Section */}
          <SettingsSection title="Support" icon={HelpCircle}>
            <SettingsItem
              icon={HelpCircle}
              label="Help Center"
              description="Get help and support"
              onClick={() => window.open('mailto:support@gladystravel.ai', '_blank')}
            />
            <SettingsItem
              icon={Smartphone}
              label="Contact Us"
              description="Reach out to our support team"
              onClick={() => window.open('mailto:support@gladystravel.ai', '_blank')}
            />
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection title="Account Actions" icon={Lock}>
            <SettingsItem
              icon={LogOut}
              label="Sign Out"
              description="Sign out of your account"
              onClick={handleSignOut}
              danger
            />
            <SettingsItem
              icon={Trash2}
              label="Delete Account"
              description="Permanently delete your account"
              onClick={() => {}}
              danger
            />
          </SettingsSection>
        </div>

        {/* Version Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Sparkles size={14} className="text-amber-500" />
            <span>Gladys Travel AI • Version 3.0 Opulent</span>
          </div>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            © 2025 Gladys. Crafted with excellence.
          </p>
        </motion.div>
      </div>

      <Footer />

      {/* Modals */}
      <PersonalInfoModal
        open={personalInfoOpen}
        onClose={() => setPersonalInfoOpen(false)}
        displayName={displayName}
        setDisplayName={setDisplayName}
      />
      <PasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
      />
      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        location={defaultLocation}
        setLocation={setDefaultLocation}
      />
      <LanguageModal
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
        language={language}
        setLanguage={setLanguage}
      />
      <AppearanceModal
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        darkMode={darkMode}
        setDarkMode={toggleDarkMode}
      />
      <TravelPrefsModal
        open={travelPrefsOpen}
        onClose={() => setTravelPrefsOpen(false)}
        prefs={travelPrefs}
        setPrefs={setTravelPrefs}
      />
      <InsuranceModal
        open={insuranceOpen}
        onClose={() => setInsuranceOpen(false)}
      />
    </div>
  );
}

// Components
function SettingsSection({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2 mb-4 px-2">
        {Icon && <Icon className="text-amber-600" size={18} />}
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-apple-lg">
        {children}
      </div>
    </motion.div>
  );
}

function SettingsItem({ icon: Icon, label, description, onClick, danger = false }: any) {
  return (
    <>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r transition-all ${
          danger 
            ? 'hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/10 dark:hover:to-rose-900/10' 
            : 'hover:from-amber-50 hover:to-purple-50 dark:hover:from-amber-900/10 dark:hover:to-purple-900/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            danger 
              ? 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30' 
              : 'bg-gradient-to-br from-amber-100 to-purple-100 dark:from-amber-900/30 dark:to-purple-900/30'
          }`}>
            <Icon className={danger ? 'text-red-600' : 'text-amber-600'} size={20} />
          </div>
          <div className="text-left">
            <p className={`font-semibold ${danger ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {label}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <ChevronRight className="text-gray-400 dark:text-gray-600" size={20} />
      </motion.button>
      <Separator className="last:hidden" />
    </>
  );
}

// Modal Components
function PersonalInfoModal({ open, onClose, displayName, setDisplayName }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Personal Information</DialogTitle>
          <DialogDescription>Update your name and profile details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Display Name</label>
            <Input 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 rounded-xl border-2 border-amber-200 dark:border-amber-800 focus:border-amber-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={onClose} className="btn-premium">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordModal({ open, onClose }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Change Password</DialogTitle>
          <DialogDescription>Update your password to keep your account secure</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Current Password</label>
            <Input type="password" className="h-12 rounded-xl border-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">New Password</label>
            <Input type="password" className="h-12 rounded-xl border-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Confirm Password</label>
            <Input type="password" className="h-12 rounded-xl border-2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={onClose} className="btn-premium">Update Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotificationsModal({ open, onClose, notifications, setNotifications }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Notifications</DialogTitle>
          <DialogDescription>Manage how you receive notifications</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive trip updates via email</p>
            </div>
            <Switch 
              checked={notifications.email} 
              onCheckedChange={(v) => setNotifications({...notifications, email: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notifications on your device</p>
            </div>
            <Switch 
              checked={notifications.push} 
              onCheckedChange={(v) => setNotifications({...notifications, push: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Deals & Promotions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Special offers and discounts</p>
            </div>
            <Switch 
              checked={notifications.deals} 
              onCheckedChange={(v) => setNotifications({...notifications, deals: v})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="btn-premium w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocationModal({ open, onClose, location, setLocation }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Default Location</DialogTitle>
          <DialogDescription>Set your home location for trip planning</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            placeholder="Enter your city" 
            className="h-12 rounded-xl border-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={onClose} className="btn-premium">Save Location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LanguageModal({ open, onClose, language, setLanguage }: any) {
  const languages = [
    { code: "en-US", name: "English (United States)", flag: "🇺🇸" },
    { code: "en-GB", name: "English (United Kingdom)", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "zh", name: "中文", flag: "🇨🇳" }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Language & Region</DialogTitle>
          <DialogDescription>Choose your preferred language</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
          {languages.map((lang) => (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLanguage(lang.code)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                language === lang.code 
                  ? 'bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/20 dark:to-purple-900/20 border-2 border-amber-500' 
                  : 'bg-gray-50 dark:bg-zinc-800 border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </motion.button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="btn-premium w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppearanceModal({ open, onClose, darkMode, setDarkMode }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Appearance</DialogTitle>
          <DialogDescription>Choose how Gladys looks to you</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDarkMode(false)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              !darkMode 
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-500' 
                : 'bg-gray-50 dark:bg-zinc-800 border-2 border-transparent hover:border-amber-200'
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
              <Sun size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">Light Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bright and clean interface</p>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDarkMode(true)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              darkMode 
                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-500' 
                : 'bg-gray-50 dark:bg-zinc-800 border-2 border-transparent hover:border-purple-200'
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Moon size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Easy on the eyes</p>
            </div>
          </motion.button>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="btn-premium w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TravelPrefsModal({ open, onClose, prefs, setPrefs }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Travel Preferences</DialogTitle>
          <DialogDescription>Set your default travel preferences</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Default Budget</label>
            <select 
              className="w-full h-12 px-4 py-2 border-2 border-amber-200 dark:border-amber-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-medium"
              value={prefs.budget}
              onChange={(e) => setPrefs({...prefs, budget: e.target.value})}
            >
              <option>Budget</option>
              <option>Mid-range</option>
              <option>Luxury</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Trip Type</label>
            <select 
              className="w-full h-12 px-4 py-2 border-2 border-amber-200 dark:border-amber-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-medium"
              value={prefs.tripType}
              onChange={(e) => setPrefs({...prefs, tripType: e.target.value})}
            >
              <option>Adventure</option>
              <option>Relaxation</option>
              <option>Cultural</option>
              <option>Balanced</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={onClose} className="btn-premium">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InsuranceModal({ open, onClose }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Travel Insurance</DialogTitle>
          <DialogDescription>Manage your travel insurance preferences</DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center">
          <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Insurance options will be available when booking trips.</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="btn-premium w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}