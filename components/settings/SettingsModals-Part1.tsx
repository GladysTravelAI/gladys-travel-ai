// components/settings/SettingsModals.tsx
// All modal components for the world-class settings page

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Camera, Lock, Bell, MapPin, Languages, Sun, Moon, Globe, 
  FileText, CreditCard, User, Shield, Key, Bookmark, History, 
  Download, Plus, Trash2, Check, X, Upload, CheckCircle, Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ==================== PHOTO UPLOAD MODAL ====================

export function PhotoUploadModal({ open, onClose, onUpload, uploading }: any) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload Profile Photo</DialogTitle>
          <DialogDescription>Choose a photo that represents you</DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full border-4 border-amber-200 dark:border-amber-800 overflow-hidden bg-gradient-to-br from-amber-100 to-purple-100 dark:from-amber-900/30 dark:to-purple-900/30">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="text-amber-600" size={48} />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="btn-premium flex items-center gap-2">
                <Upload size={18} />
                Choose Photo
              </div>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="btn-premium"
          >
            {uploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== PASSWORD MODAL ====================

export function PasswordModal({ open, onClose }: any) {
  const [formData, setFormData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleSave = async () => {
    if (formData.new !== formData.confirm) {
      toast.error("Passwords don't match!");
      return;
    }
    
    // In production: Call API to change password
    toast.success("Password updated successfully!");
    onClose();
  };

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
            <Input 
              type="password" 
              value={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.value })}
              className="h-12 rounded-xl border-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">New Password</label>
            <Input 
              type="password" 
              value={formData.new}
              onChange={(e) => setFormData({ ...formData, new: e.target.value })}
              className="h-12 rounded-xl border-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Confirm Password</label>
            <Input 
              type="password" 
              value={formData.confirm}
              onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
              className="h-12 rounded-xl border-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="btn-premium">Update Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== NOTIFICATIONS MODAL ====================

export function NotificationsModal({ open, onClose, settings, onSave }: any) {
  const [notifications, setNotifications] = useState(settings.notifications);

  const handleSave = () => {
    onSave({ notifications });
    onClose();
  };

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
              <p className="text-sm text-gray-500 dark:text-gray-400">Trip updates via email</p>
            </div>
            <Switch 
              checked={notifications.email} 
              onCheckedChange={(v) => setNotifications({...notifications, email: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Device notifications</p>
            </div>
            <Switch 
              checked={notifications.push} 
              onCheckedChange={(v) => setNotifications({...notifications, push: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">SMS Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Text message alerts</p>
            </div>
            <Switch 
              checked={notifications.sms} 
              onCheckedChange={(v) => setNotifications({...notifications, sms: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Deals & Promotions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Special offers</p>
            </div>
            <Switch 
              checked={notifications.deals} 
              onCheckedChange={(v) => setNotifications({...notifications, deals: v})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Price Alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Price drop notifications</p>
            </div>
            <Switch 
              checked={notifications.priceAlerts} 
              onCheckedChange={(v) => setNotifications({...notifications, priceAlerts: v})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="btn-premium w-full">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== LOCATION MODAL ====================

export function LocationModal({ open, onClose, settings, onSave }: any) {
  const [location, setLocation] = useState(settings.defaultLocation);

  const handleSave = () => {
    onSave({ defaultLocation: location });
    onClose();
  };

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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will be used as your default departure location for flights and trip planning.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="btn-premium">Save Location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== LANGUAGE MODAL ====================

export function LanguageModal({ open, onClose, settings, onSave }: any) {
  const [language, setLanguage] = useState(settings.language);
  const [currency, setCurrency] = useState(settings.currency);

  const languages = [
    { code: "en-US", name: "English (United States)", flag: "🇺🇸" },
    { code: "en-GB", name: "English (United Kingdom)", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
  ];

  const currencies = ["USD", "EUR", "GBP", "ZAR", "JPY", "AUD"];

  const handleSave = () => {
    onSave({ language, currency });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Language & Region</DialogTitle>
          <DialogDescription>Choose your preferred language and currency</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Language</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                    language === lang.code 
                      ? 'bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/20 dark:to-purple-900/20 border-2 border-amber-500' 
                      : 'bg-gray-50 dark:bg-zinc-800 border-2 border-transparent hover:border-amber-200'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Currency</label>
            <select 
              className="w-full h-12 px-4 py-2 border-2 border-amber-200 dark:border-amber-800 rounded-xl bg-white dark:bg-zinc-900 font-medium"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="btn-premium w-full">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== APPEARANCE MODAL ====================

export function AppearanceModal({ open, onClose, appearance, onSave }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Appearance</DialogTitle>
          <DialogDescription>Choose how Gladys looks to you</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <button
            onClick={() => { onSave('light'); onClose(); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              appearance === 'light'
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
          </button>
          <button
            onClick={() => { onSave('dark'); onClose(); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              appearance === 'dark'
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
          </button>
          <button
            onClick={() => { onSave('system'); onClose(); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              appearance === 'system'
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-500' 
                : 'bg-gray-50 dark:bg-zinc-800 border-2 border-transparent hover:border-blue-200'
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Globe size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">System Default</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Match your device</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Continue in next file with Travel Prefs, Docs, Payment, Emergency Contact, 2FA, Saved Trips, Activity Log, Export Data...