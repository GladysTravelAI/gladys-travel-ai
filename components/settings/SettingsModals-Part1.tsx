// components/settings/SettingsModals-Part1.tsx

import { useState } from "react";
import { Camera, Lock, Bell, MapPin, Languages, Sun, Moon, Globe, Upload, CheckCircle } from "lucide-react";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Switch }  from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const BTN = "rounded-xl text-white font-bold bg-gradient-to-r from-sky-400 to-sky-600 hover:opacity-90 transition-opacity";

// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────

export function PhotoUploadModal({ open, onClose, onUpload, uploading }: any) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file,    setFile]    = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Upload Profile Photo</DialogTitle>
          <DialogDescription>Choose a photo that represents you</DialogDescription>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center gap-4">
          <div className="w-36 h-36 rounded-full border-4 border-sky-200 overflow-hidden bg-sky-50 flex items-center justify-center">
            {preview
              ? <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              : <Camera className="text-sky-400" size={44} />
            }
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <div className={`${BTN} flex items-center gap-2 px-5 py-2.5 text-sm`}>
              <Upload size={16} />Choose Photo
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => file && onUpload(file)} disabled={!file || uploading} className={BTN}>
            {uploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── PASSWORD ──────────────────────────────────────────────────────────────────

export function PasswordModal({ open, onClose }: any) {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });

  const handleSave = () => {
    if (form.new !== form.confirm) { toast.error("Passwords don't match"); return; }
    if (form.new.length < 8)       { toast.error("Password must be at least 8 characters"); return; }
    toast.success('Password updated');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Change Password</DialogTitle>
          <DialogDescription>Update your password to keep your account secure</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password',     key: 'new'     },
            { label: 'Confirm Password', key: 'confirm' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">{f.label}</label>
              <Input type="password" value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="h-11 rounded-xl border-2" />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className={BTN}>Update Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export function NotificationsModal({ open, onClose, settings, onSave }: any) {
  const [n, setN] = useState(settings.notifications);

  const rows = [
    { key: 'email',        label: 'Email Notifications',  sub: 'Trip updates via email'    },
    { key: 'push',         label: 'Push Notifications',   sub: 'Device notifications'      },
    { key: 'sms',          label: 'SMS Notifications',    sub: 'Text message alerts'        },
    { key: 'deals',        label: 'Deals & Promotions',   sub: 'Special offers'            },
    { key: 'priceAlerts',  label: 'Price Alerts',         sub: 'Price drop notifications'  },
    { key: 'tripReminders',label: 'Trip Reminders',       sub: 'Pre-trip reminders'        },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Notifications</DialogTitle>
          <DialogDescription>Manage how you receive notifications</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {rows.map(r => (
            <div key={r.key} className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">{r.label}</p>
                <p className="text-xs text-slate-400">{r.sub}</p>
              </div>
              <Switch checked={n[r.key]} onCheckedChange={v => setN({ ...n, [r.key]: v })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave({ notifications: n }); onClose(); }} className={`${BTN} w-full`}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── LOCATION ──────────────────────────────────────────────────────────────────

export function LocationModal({ open, onClose, settings, onSave }: any) {
  const [location, setLocation] = useState(settings.defaultLocation);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Default Location</DialogTitle>
          <DialogDescription>Set your home city for flights and trip planning</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Enter your city" className="h-11 rounded-xl border-2" />
          <p className="text-xs text-slate-400">Used as your default departure city for all trip searches.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => { onSave({ defaultLocation: location }); onClose(); }} className={BTN}>
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── LANGUAGE ──────────────────────────────────────────────────────────────────

export function LanguageModal({ open, onClose, settings, onSave }: any) {
  const [language, setLanguage] = useState(settings.language);
  const [currency, setCurrency] = useState(settings.currency);

  const LANGS = [
    { code: 'en-US', name: 'English (United States)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (United Kingdom)', flag: '🇬🇧' },
    { code: 'es',    name: 'Español',  flag: '🇪🇸' },
    { code: 'fr',    name: 'Français', flag: '🇫🇷' },
    { code: 'de',    name: 'Deutsch',  flag: '🇩🇪' },
  ];
  const CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'AUD'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Language & Region</DialogTitle>
          <DialogDescription>Choose your preferred language and currency</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Language</label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLanguage(l.code)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 border-2 transition-all ${
                    language === l.code ? 'border-sky-400 bg-sky-50' : 'border-transparent bg-slate-50 hover:border-slate-200'
                  }`}>
                  <span className="text-xl">{l.flag}</span>
                  <span className="text-sm font-semibold text-slate-900">{l.name}</span>
                  {language === l.code && <CheckCircle size={14} className="ml-auto text-sky-500" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-900 font-semibold text-sm outline-none focus:border-sky-400">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave({ language, currency }); onClose(); }} className={`${BTN} w-full`}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── APPEARANCE ────────────────────────────────────────────────────────────────

export function AppearanceModal({ open, onClose, appearance, onSave }: any) {
  const OPTIONS = [
    { value: 'light',  label: 'Light Mode',      sub: 'Bright and clean',     icon: Sun,  bg: 'from-sky-400 to-sky-500'   },
    { value: 'dark',   label: 'Dark Mode',        sub: 'Easy on the eyes',     icon: Moon, bg: 'from-slate-700 to-slate-900' },
    { value: 'system', label: 'System Default',   sub: 'Match your device',    icon: Globe,bg: 'from-slate-500 to-slate-600' },
  ];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Appearance</DialogTitle>
          <DialogDescription>Choose how Gladys looks to you</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {OPTIONS.map(o => {
            const Icon = o.icon;
            return (
              <button key={o.value} onClick={() => { onSave(o.value); onClose(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  appearance === o.value ? 'border-sky-400 bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}>
                <div className={`w-11 h-11 bg-gradient-to-br ${o.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">{o.label}</p>
                  <p className="text-xs text-slate-400">{o.sub}</p>
                </div>
                {appearance === o.value && <CheckCircle size={16} className="ml-auto text-sky-500" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}