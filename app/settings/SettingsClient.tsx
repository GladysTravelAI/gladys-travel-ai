"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Bell, Lock, Globe, Moon, Mail, ChevronRight, LogOut, Trash2, Shield,
  MapPin, Smartphone, Languages, HelpCircle, Sun, Sparkles, Star, TrendingUp, Award,
  CreditCard, Camera, Download, History, Plane, CheckCircle, XCircle, Loader2,
  AlertCircle, FileText, UserCircle, Key, Clock, Bookmark, Heart, Settings, Upload
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

// Import all Settings Modals from Part 1
import { 
  PhotoUploadModal,
  PasswordModal,
  NotificationsModal,
  LocationModal,
  LanguageModal,
  AppearanceModal
} from "@/components/settings/SettingsModals-Part1";

// Import all Settings Modals from Part 2
import {
  TravelPrefsModal,
  TravelDocsModal,
  PaymentMethodsModal,
  EmergencyContactModal,
  TwoFactorModal,
  SavedTripsModal,
  ActivityLogModal,
  ExportDataModal
} from "@/components/settings/SettingsModals-Part2";

// ==================== TYPES ====================

interface UserSettings {
  // Personal
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  photoUrl: string;
  
  // Location & Language
  defaultLocation: string;
  language: string;
  timezone: string;
  currency: string;
  
  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    deals: boolean;
    priceAlerts: boolean;
    tripReminders: boolean;
  };
  
  // Travel Preferences (Gladys Integration)
  travelPrefs: {
    budget: 'budget' | 'moderate' | 'luxury';
    tripStyle: 'adventure' | 'relaxation' | 'cultural' | 'balanced';
    seatPreference: 'window' | 'aisle' | 'no-preference';
    mealPreference: string;
    accessibility: string[];
  };
  
  // Travel Documents
  travelDocs: {
    passportNumber: string;
    passportExpiry: string;
    tsaPrecheck: string;
    knownTravelerNumber: string;
    frequentFlyer: {
      airline: string;
      number: string;
    }[];
  };
  
  // Payment Methods
  paymentMethods: {
    id: string;
    type: 'card' | 'paypal' | 'apple-pay';
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
  }[];
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Security
  security: {
    twoFactorEnabled: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  
  // Preferences
  appearance: 'light' | 'dark' | 'system';
}

export default function SettingsClient() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Modal states
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [travelPrefsOpen, setTravelPrefsOpen] = useState(false);
  const [travelDocsOpen, setTravelDocsOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [emergencyContactOpen, setEmergencyContactOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [savedTripsOpen, setSavedTripsOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [exportDataOpen, setExportDataOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    // Personal
    displayName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    photoUrl: user?.photoURL || "",
    
    // Location
    defaultLocation: "Johannesburg, South Africa",
    language: "en-US",
    timezone: "Africa/Johannesburg",
    currency: "ZAR",
    
    // Notifications
    notifications: {
      email: true,
      push: false,
      sms: false,
      deals: true,
      priceAlerts: true,
      tripReminders: true
    },
    
    // Travel Preferences
    travelPrefs: {
      budget: 'moderate',
      tripStyle: 'balanced',
      seatPreference: 'window',
      mealPreference: 'No preference',
      accessibility: []
    },
    
    // Travel Documents
    travelDocs: {
      passportNumber: '',
      passportExpiry: '',
      tsaPrecheck: '',
      knownTravelerNumber: '',
      frequentFlyer: []
    },
    
    // Payment Methods
    paymentMethods: [],
    
    // Emergency Contact
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    
    // Security
    security: {
      twoFactorEnabled: false,
      emailVerified: false,
      phoneVerified: false
    },
    
    // Appearance
    appearance: 'system'
  });

  // Stats (mock - should come from API)
  const [stats, setStats] = useState({
    tripsPlanned: 12,
    tripsSaved: 5,
    favoritesCount: 8,
    averageRating: 4.9,
    memberSince: '2024'
  });

  // Load settings from localStorage/API
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
      return;
    }

    if (user) {
      loadSettings();
    }
  }, [user, authLoading, router]);

  const loadSettings = async () => {
    try {
      // Try to load from localStorage first
      const saved = localStorage.getItem('gladys-user-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      // Also sync with Gladys context
      const gladysContext = localStorage.getItem('gladys-context');
      if (gladysContext) {
        const context = JSON.parse(gladysContext);
        setSettings(prev => ({
          ...prev,
          travelPrefs: {
            ...prev.travelPrefs,
            budget: context.budget || prev.travelPrefs.budget
          }
        }));
      }

      // In production, fetch from API:
      // const response = await fetch('/api/settings');
      // const data = await response.json();
      // setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true);
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      
      // Save to localStorage
      localStorage.setItem('gladys-user-settings', JSON.stringify(newSettings));
      
      // Sync with Gladys context
      const gladysContext = {
        name: newSettings.displayName,
        budget: newSettings.travelPrefs.budget,
        preferredCities: [newSettings.defaultLocation],
        travelStyle: newSettings.travelPrefs.tripStyle,
        conversationCount: 0,
        recentQueries: []
      };
      localStorage.setItem('gladys-context', JSON.stringify(gladysContext));

      // In production, save to API:
      // await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSettings)
      // });

      toast.success("Settings saved successfully!", {
        icon: <CheckCircle className="text-green-500" size={20} />
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error("Failed to save settings. Please try again.", {
        icon: <XCircle className="text-red-500" size={20} />
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      // In production, upload to storage service
      // For now, create local URL
      const photoUrl = URL.createObjectURL(file);
      await saveSettings({ photoUrl });
      
      toast.success("Profile photo updated!", {
        icon: <CheckCircle className="text-green-500" size={20} />
      });
    } catch (error) {
      toast.error("Failed to upload photo", {
        icon: <XCircle className="text-red-500" size={20} />
      });
    } finally {
      setUploadingPhoto(false);
      setPhotoUploadOpen(false);
    }
  };

  const handleExportData = async () => {
    try {
      const dataToExport = {
        profile: settings,
        stats,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gladys-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      toast.success("Data exported successfully!", {
        icon: <Download className="text-green-500" size={20} />
      });
    } catch (error) {
      toast.error("Failed to export data", {
        icon: <XCircle className="text-red-500" size={20} />
      });
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    router.push("/");
  };

  const toggleDarkMode = (mode: 'light' | 'dark' | 'system') => {
    saveSettings({ appearance: mode });
    
    if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', mode === 'dark');
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
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header with Profile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-white dark:bg-zinc-800 shadow-xl">
                  {settings.photoUrl ? (
                    <Image 
                      src={settings.photoUrl} 
                      alt={settings.displayName}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-purple-100 dark:from-amber-900 dark:to-purple-900">
                      <User size={48} className="text-amber-600" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setPhotoUploadOpen(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border-2 border-amber-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera size={18} className="text-amber-600" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left text-white">
                <h1 className="text-4xl font-bold mb-2">{settings.displayName || user.email}</h1>
                <p className="text-white/90 mb-4">{settings.email}</p>
                
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    {settings.security.emailVerified ? (
                      <>
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Email Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">Email Not Verified</span>
                      </>
                    )}
                  </div>
                  
                  {settings.security.twoFactorEnabled && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                      <Shield size={16} />
                      <span className="text-sm font-medium">2FA Enabled</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Clock size={16} />
                    <span className="text-sm font-medium">Member since {stats.memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <TrendingUp size={24} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.tripsPlanned}</div>
                  <div className="text-xs opacity-90">Trips</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <Heart size={24} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.favoritesCount}</div>
                  <div className="text-xs opacity-90">Saved</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <Star size={24} className="mx-auto mb-2 fill-white" />
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <div className="text-xs opacity-90">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <SettingsSection title="Personal Information" icon={User}>
              <SettingsItem
                icon={UserCircle}
                label="Profile Details"
                description="Name, bio, and contact information"
                onClick={() => setPersonalInfoOpen(true)}
              />
              <SettingsItem
                icon={Camera}
                label="Profile Photo"
                description="Upload or change your profile picture"
                onClick={() => setPhotoUploadOpen(true)}
              />
            </SettingsSection>

            {/* Travel Preferences (Gladys Integration) */}
            <SettingsSection title="Travel Preferences" icon={Plane}>
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/10 dark:to-purple-900/10 border-b">
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <Sparkles size={16} />
                  <span className="font-semibold">Syncs with Gladys AI</span>
                </div>
              </div>
              <SettingsItem
                icon={Globe}
                label="Trip Preferences"
                description={`${settings.travelPrefs.budget} · ${settings.travelPrefs.tripStyle}`}
                onClick={() => setTravelPrefsOpen(true)}
              />
              <SettingsItem
                icon={FileText}
                label="Travel Documents"
                description="Passport, TSA PreCheck, frequent flyer"
                onClick={() => setTravelDocsOpen(true)}
              />
              <SettingsItem
                icon={User}
                label="Emergency Contact"
                description={settings.emergencyContact.name || "Not set"}
                onClick={() => setEmergencyContactOpen(true)}
              />
            </SettingsSection>

            {/* Payment & Billing */}
            <SettingsSection title="Payment & Billing" icon={CreditCard}>
              <SettingsItem
                icon={CreditCard}
                label="Payment Methods"
                description={`${settings.paymentMethods.length} saved cards`}
                onClick={() => setPaymentMethodsOpen(true)}
                badge={settings.paymentMethods.length > 0 ? `${settings.paymentMethods.length}` : undefined}
              />
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection title="Notifications" icon={Bell}>
              <SettingsItem
                icon={Bell}
                label="Notification Preferences"
                description="Email, push, SMS, and price alerts"
                onClick={() => setNotificationsOpen(true)}
              />
            </SettingsSection>

            {/* Location & Language */}
            <SettingsSection title="Location & Language" icon={Globe}>
              <SettingsItem
                icon={MapPin}
                label="Default Location"
                description={settings.defaultLocation}
                onClick={() => setLocationOpen(true)}
              />
              <SettingsItem
                icon={Languages}
                label="Language & Region"
                description={`${settings.language} · ${settings.currency}`}
                onClick={() => setLanguageOpen(true)}
              />
              <SettingsItem
                icon={settings.appearance === 'dark' ? Moon : Sun}
                label="Appearance"
                description={settings.appearance === 'system' ? 'System default' : settings.appearance}
                onClick={() => setAppearanceOpen(true)}
              />
            </SettingsSection>
          </div>

          {/* Right Column - Quick Actions & Security */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <SettingsSection title="Quick Actions" icon={Sparkles}>
              <SettingsItem
                icon={Bookmark}
                label="Saved Trips"
                description={`${stats.tripsSaved} saved itineraries`}
                onClick={() => setSavedTripsOpen(true)}
                compact
              />
              <SettingsItem
                icon={History}
                label="Activity Log"
                description="View your account activity"
                onClick={() => setActivityLogOpen(true)}
                compact
              />
              <SettingsItem
                icon={Download}
                label="Export Data"
                description="Download your data"
                onClick={() => setExportDataOpen(true)}
                compact
              />
            </SettingsSection>

            {/* Security */}
            <SettingsSection title="Security & Privacy" icon={Shield}>
              <SettingsItem
                icon={Lock}
                label="Change Password"
                description="Update your password"
                onClick={() => setPasswordOpen(true)}
                compact
              />
              <SettingsItem
                icon={Key}
                label="Two-Factor Auth"
                description={settings.security.twoFactorEnabled ? "Enabled" : "Disabled"}
                onClick={() => setTwoFactorOpen(true)}
                compact
                badge={settings.security.twoFactorEnabled ? undefined : "!"}
              />
            </SettingsSection>

            {/* Support */}
            <SettingsSection title="Support" icon={HelpCircle}>
              <SettingsItem
                icon={HelpCircle}
                label="Help Center"
                description="Get help and support"
                onClick={() => window.open('mailto:support@gladystravel.ai', '_blank')}
                compact
              />
              <SettingsItem
                icon={Smartphone}
                label="Contact Us"
                description="support@gladystravel.ai"
                onClick={() => window.open('mailto:support@gladystravel.ai', '_blank')}
                compact
              />
            </SettingsSection>

            {/* Danger Zone */}
            <SettingsSection title="Account Actions" icon={AlertCircle}>
              <SettingsItem
                icon={LogOut}
                label="Sign Out"
                description="Sign out of your account"
                onClick={handleSignOut}
                danger
                compact
              />
              <SettingsItem
                icon={Trash2}
                label="Delete Account"
                description="Permanently delete"
                onClick={() => {}}
                danger
                compact
              />
            </SettingsSection>
          </div>
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

      {/* Global Saving Indicator */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-white dark:bg-zinc-900 border-2 border-amber-500 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 z-50"
          >
            <Loader2 className="animate-spin text-amber-600" size={20} />
            <span className="font-semibold text-gray-900 dark:text-white">Saving changes...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ALL MODALS FROM PART 1 & PART 2 ==================== */}
      
      {/* Personal Info Modal (inline - not in Part1/Part2) */}
      <PersonalInfoModal
        open={personalInfoOpen}
        onClose={() => setPersonalInfoOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Photo Upload Modal - From Part 1 */}
      <PhotoUploadModal
        open={photoUploadOpen}
        onClose={() => setPhotoUploadOpen(false)}
        onUpload={handlePhotoUpload}
        uploading={uploadingPhoto}
      />

      {/* Password Modal - From Part 1 */}
      <PasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />

      {/* Notifications Modal - From Part 1 */}
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Location Modal - From Part 1 */}
      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Language Modal - From Part 1 */}
      <LanguageModal
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Appearance Modal - From Part 1 */}
      <AppearanceModal
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        appearance={settings.appearance}
        onSave={toggleDarkMode}
      />

      {/* Travel Prefs Modal - From Part 2 */}
      <TravelPrefsModal
        open={travelPrefsOpen}
        onClose={() => setTravelPrefsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Travel Docs Modal - From Part 2 */}
      <TravelDocsModal
        open={travelDocsOpen}
        onClose={() => setTravelDocsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Payment Methods Modal - From Part 2 */}
      <PaymentMethodsModal
        open={paymentMethodsOpen}
        onClose={() => setPaymentMethodsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Emergency Contact Modal - From Part 2 */}
      <EmergencyContactModal
        open={emergencyContactOpen}
        onClose={() => setEmergencyContactOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Two Factor Modal - From Part 2 */}
      <TwoFactorModal
        open={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        enabled={settings.security.twoFactorEnabled}
        onToggle={(enabled: any) => saveSettings({ 
          security: { ...settings.security, twoFactorEnabled: enabled }
        })}
      />

      {/* Saved Trips Modal - From Part 2 */}
      <SavedTripsModal
        open={savedTripsOpen}
        onClose={() => setSavedTripsOpen(false)}
      />

      {/* Activity Log Modal - From Part 2 */}
      <ActivityLogModal
        open={activityLogOpen}
        onClose={() => setActivityLogOpen(false)}
      />

      {/* Export Data Modal - From Part 2 */}
      <ExportDataModal
        open={exportDataOpen}
        onClose={() => setExportDataOpen(false)}
        onExport={handleExportData}
      />
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function SettingsSection({ title, icon: Icon, children }: { 
  title: string; 
  icon?: any; 
  children: React.ReactNode 
}) {
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

function SettingsItem({ 
  icon: Icon, 
  label, 
  description, 
  onClick, 
  danger = false,
  compact = false,
  badge
}: any) {
  return (
    <>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`w-full ${compact ? 'px-4 py-3' : 'px-6 py-5'} flex items-center justify-between hover:bg-gradient-to-r transition-all ${
          danger 
            ? 'hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/10 dark:hover:to-rose-900/10' 
            : 'hover:from-amber-50 hover:to-purple-50 dark:hover:from-amber-900/10 dark:hover:to-purple-900/10'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl flex items-center justify-center ${
            danger 
              ? 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30' 
              : 'bg-gradient-to-br from-amber-100 to-purple-100 dark:from-amber-900/30 dark:to-purple-900/30'
          }`}>
            <Icon className={danger ? 'text-red-600' : 'text-amber-600'} size={compact ? 18 : 20} />
          </div>
          <div className="text-left flex-1">
            <p className={`${compact ? 'text-sm' : 'text-base'} font-semibold ${danger ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {label}
            </p>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
              {badge}
            </span>
          )}
          <ChevronRight className="text-gray-400 dark:text-gray-600" size={20} />
        </div>
      </motion.button>
      <Separator className="last:hidden" />
    </>
  );
}

// Personal Info Modal (inline - kept as is since it's not in Part1/Part2)
function PersonalInfoModal({ open, onClose, settings, onSave }: any) {
  const [formData, setFormData] = useState({
    displayName: settings.displayName,
    phone: settings.phone,
    bio: settings.bio
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

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
              value={formData.displayName} 
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="h-12 rounded-xl border-2"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Phone Number</label>
            <Input 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-12 rounded-xl border-2"
              placeholder="+27 123 456 789"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Bio</label>
            <Textarea 
              value={formData.bio} 
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="rounded-xl border-2"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="btn-premium">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}