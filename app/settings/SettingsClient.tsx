"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { 
  User, Bell, Lock, Globe, Moon, 
  Mail, ChevronRight, LogOut, Trash2, Shield,
  MapPin, Smartphone, Languages, HelpCircle, Sun
} from "lucide-react";
import Navbar from "@/components/Navbar";
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

  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">Settings</h1>
            <p className="text-lg text-gray-600">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Account Section */}
            <SettingsSection title="Account">
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
            <SettingsSection title="Preferences">
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
            <SettingsSection title="Travel">
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
            <SettingsSection title="Support">
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
            <SettingsSection title="Account Actions">
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
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>Gladys Travel AI • Version 1.0.0</p>
            <p className="mt-1">© 2025 Gladys. All rights reserved.</p>
          </div>
        </div>
      </div>

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
        setDarkMode={setDarkMode}
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
    </>
  );
}

// Components
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
        {title}
      </h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, description, onClick, danger = false }: any) {
  return (
    <>
      <button
        onClick={onClick}
        className={`w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
          danger ? 'hover:bg-red-50' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            danger ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Icon className={danger ? 'text-red-600' : 'text-gray-700'} size={20} />
          </div>
          <div className="text-left">
            <p className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
              {label}
            </p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <ChevronRight className="text-gray-400" size={20} />
      </button>
      <Separator className="last:hidden" />
    </>
  );
}

// Modal Components
function PersonalInfoModal({ open, onClose, displayName, setDisplayName }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Personal Information</DialogTitle>
          <DialogDescription>Update your name and profile details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Display Name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordModal({ open, onClose }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your password to keep your account secure</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Current Password</label>
            <Input type="password" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">New Password</label>
            <Input type="password" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Confirm Password</label>
            <Input type="password" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Update Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotificationsModal({ open, onClose, notifications, setNotifications }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Manage how you receive notifications</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive trip updates via email</p>
            </div>
            <Switch 
              checked={notifications.email} 
              onCheckedChange={(v) => setNotifications({...notifications, email: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Get notifications on your device</p>
            </div>
            <Switch 
              checked={notifications.push} 
              onCheckedChange={(v) => setNotifications({...notifications, push: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Deals & Promotions</p>
              <p className="text-sm text-gray-500">Special offers and discounts</p>
            </div>
            <Switch 
              checked={notifications.deals} 
              onCheckedChange={(v) => setNotifications({...notifications, deals: v})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocationModal({ open, onClose, location, setLocation }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Default Location</DialogTitle>
          <DialogDescription>Set your home location for trip planning</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter your city" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LanguageModal({ open, onClose, language, setLanguage }: any) {
  const languages = [
    { code: "en-US", name: "English (United States)" },
    { code: "en-GB", name: "English (United Kingdom)" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ja", name: "日本語" },
    { code: "zh", name: "中文" }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Language & Region</DialogTitle>
          <DialogDescription>Choose your preferred language</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                language === lang.code 
                  ? 'bg-blue-50 border-2 border-blue-500' 
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppearanceModal({ open, onClose, darkMode, setDarkMode }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>Choose how Gladys looks to you</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <button
            onClick={() => setDarkMode(false)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
              !darkMode ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent'
            }`}
          >
            <Sun size={24} className="text-yellow-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Light Mode</p>
              <p className="text-sm text-gray-500">Bright and clean interface</p>
            </div>
          </button>
          <button
            onClick={() => setDarkMode(true)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
              darkMode ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent'
            }`}
          >
            <Moon size={24} className="text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-sm text-gray-500">Easy on the eyes</p>
            </div>
          </button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TravelPrefsModal({ open, onClose, prefs, setPrefs }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Travel Preferences</DialogTitle>
          <DialogDescription>Set your default travel preferences</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Default Budget</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              value={prefs.budget}
              onChange={(e) => setPrefs({...prefs, budget: e.target.value})}
            >
              <option>Budget</option>
              <option>Mid-range</option>
              <option>Luxury</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Trip Type</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InsuranceModal({ open, onClose }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Travel Insurance</DialogTitle>
          <DialogDescription>Manage your travel insurance preferences</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600">Insurance options will be available when booking trips.</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}