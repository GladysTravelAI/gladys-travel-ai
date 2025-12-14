"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { 
  User, Bell, Lock, Globe, Moon, CreditCard, 
  Mail, ChevronRight, LogOut, Trash2, Shield,
  MapPin, Smartphone, Languages, HelpCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    router.push("/");
  };

  if (!user) {
    router.push("/signin");
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
                onClick={() => router.push("/profile")}
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
                onClick={() => {}}
              />
            </SettingsSection>

            {/* Preferences Section */}
            <SettingsSection title="Preferences">
              <SettingsItem
                icon={Bell}
                label="Notifications"
                description="Manage email and push notifications"
                onClick={() => {}}
              />
              <SettingsItem
                icon={MapPin}
                label="Default Location"
                description="Set your home location"
                onClick={() => {}}
              />
              <SettingsItem
                icon={Languages}
                label="Language & Region"
                description="English (United States)"
                onClick={() => {}}
              />
              <SettingsItem
                icon={Moon}
                label="Appearance"
                description="Choose light or dark mode"
                onClick={() => {}}
              />
            </SettingsSection>

            {/* Travel Preferences */}
            <SettingsSection title="Travel">
              <SettingsItem
                icon={Globe}
                label="Travel Preferences"
                description="Set default budget, trip type, and more"
                onClick={() => {}}
              />
              <SettingsItem
                icon={CreditCard}
                label="Payment Methods"
                description="Manage saved payment information"
                onClick={() => {}}
              />
              <SettingsItem
                icon={Shield}
                label="Travel Insurance"
                description="Manage insurance preferences"
                onClick={() => {}}
              />
            </SettingsSection>

            {/* Support Section */}
            <SettingsSection title="Support">
              <SettingsItem
                icon={HelpCircle}
                label="Help Center"
                description="Get help and support"
                onClick={() => {}}
              />
              <SettingsItem
                icon={Smartphone}
                label="Contact Us"
                description="Reach out to our support team"
                onClick={() => {}}
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
    </>
  );
}

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

function SettingsItem({
  icon: Icon,
  label,
  description,
  onClick,
  danger = false
}: {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
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