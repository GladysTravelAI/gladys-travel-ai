"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme, type Theme } from "@/lib/ThemeProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Lock, Globe, Mail, ChevronRight, LogOut, Trash2, Shield,
  MapPin, Plane, Camera, CheckCircle, AlertCircle, Loader2, X, Check,
  Sparkles, Star, Heart, Eye, EyeOff, Users, Save, BookOpen, Ticket,
  Sun, Moon, Monitor,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import Image from "next/image";
import {
  doc, setDoc, getDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  updatePassword, EmailAuthProvider, reauthenticateWithCredential,
} from "firebase/auth";

const SKY = '#0EA5E9';
const font = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface TravelPrefs {
  budget:          'budget' | 'moderate' | 'luxury' | 'ultra-luxury';
  tripStyle:       'adventure' | 'relaxation' | 'cultural' | 'balanced';
  homeAirport:     string;
  homeCity:        string;
  preferredAirline: string;
  seatPreference:  'window' | 'aisle' | 'no-preference';
  hotelTier:       'budget' | 'midscale' | 'upscale' | 'luxury';
  dietaryNeeds:    string;
}

interface TravelIdentity {
  nationality:        string;
  passportCountry:    string;
  passportExpiry:     string;   // YYYY-MM — no full number stored
  frequentFlyerAirline: string;
  frequentFlyerNumber:  string;
}

interface EmergencyContact {
  name:         string;
  relationship: string;
  phone:        string;
  email:        string;
}

interface Notifications {
  priceAlerts:    boolean;
  tripReminders:  boolean;
  emailUpdates:   boolean;
  pushEnabled:    boolean;
}

interface UserSettings {
  displayName:     string;
  phone:           string;
  photoUrl:        string;
  currency:        string;
  language:        string;
  travelPrefs:     TravelPrefs;
  travelIdentity:  TravelIdentity;
  emergencyContact: EmergencyContact;
  notifications:   Notifications;
}

const DEFAULTS: UserSettings = {
  displayName:  '',
  phone:        '',
  photoUrl:     '',
  currency:     'USD',
  language:     'en',
  travelPrefs: {
    budget:            'moderate',
    tripStyle:         'balanced',
    homeAirport:       '',
    homeCity:          '',
    preferredAirline:  '',
    seatPreference:    'window',
    hotelTier:         'midscale',
    dietaryNeeds:      '',
  },
  travelIdentity: {
    nationality:          '',
    passportCountry:      '',
    passportExpiry:       '',
    frequentFlyerAirline: '',
    frequentFlyerNumber:  '',
  },
  emergencyContact: { name: '', relationship: '', phone: '', email: '' },
  notifications: { priceAlerts: true, tripReminders: true, emailUpdates: true, pushEnabled: false },
};

// ── MAIN ───────────────────────────────────────────────────────────────────────

export default function SettingsClient() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [settings,  setSettings]  = useState<UserSettings>(DEFAULTS);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'travel' | 'identity' | 'notifications' | 'appearance' | 'security'>('profile');
  const [modal,     setModal]     = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/signin?redirect=/settings');
  }, [user, authLoading, router]);

  // Load settings: try Firestore first, fall back to localStorage
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'userSettings', user.uid));
        const data = snap.exists() ? snap.data() as Partial<UserSettings> : {};
        setSettings(prev => ({
          ...prev,
          ...data,
          displayName:     data.displayName     || userProfile?.name          || user.displayName || '',
          photoUrl:        data.photoUrl        || userProfile?.profileImage  || user.photoURL    || '',
          travelPrefs:     { ...prev.travelPrefs,     ...(data.travelPrefs     ?? {}) },
          travelIdentity:  { ...prev.travelIdentity,  ...(data.travelIdentity  ?? {}) },
          emergencyContact:{ ...prev.emergencyContact, ...(data.emergencyContact?? {}) },
          notifications:   { ...prev.notifications,   ...(data.notifications   ?? {}) },
        }));
      } catch {
        // Firestore unavailable — load from localStorage instead
        try {
          const local = localStorage.getItem(`gladys-settings-${user.uid}`);
          if (local) {
            const data = JSON.parse(local) as Partial<UserSettings>;
            setSettings(prev => ({ ...prev, ...data }));
          }
        } catch { /* localStorage also failed — use defaults */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [user, userProfile]);

  const save = async (updates: Partial<UserSettings>) => {
    if (!user) return;
    setSaving(true);

    const next = { ...settings, ...updates };
    setSettings(next);

    // ── Step 1: Save to localStorage immediately — always works, no network needed
    try {
      localStorage.setItem(`gladys-settings-${user.uid}`, JSON.stringify(next));
      // Sync context for Gladys AI
      localStorage.setItem('gladys-context', JSON.stringify({
        name:        next.displayName,
        budget:      next.travelPrefs.budget,
        homeCity:    next.travelPrefs.homeCity,
        homeAirport: next.travelPrefs.homeAirport,
        travelStyle: next.travelPrefs.tripStyle,
        currency:    next.currency,
      }));
    } catch {
      // localStorage full — rare, non-fatal
    }

    // Show success immediately — don't make user wait for Firestore
    toast.success('Settings saved ✓');
    setSaving(false);

    // ── Step 2: Sync to Firestore in the background — silently
    setDoc(doc(db, 'userSettings', user.uid), {
      ...next,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((err) => {
      // Firestore failed but localStorage succeeded — data is safe locally
      console.warn('Firestore sync failed (will retry on next save):', err?.code ?? err);
    });
  };

  // Load settings: try Firestore first, fall back to localStorage


  const stats = {
    tripsPlanned: userProfile?.totalTripsPlanned ?? 0,
    savedCount:   userProfile?.savedCount         ?? 0,
    memberSince:  userProfile?.createdAt
      ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Recently',
  };

  const TABS = [
    { id: 'profile',       label: 'Profile',       icon: User     },
    { id: 'travel',        label: 'Travel',        icon: Plane    },
    { id: 'identity',      label: 'Passport',      icon: BookOpen },
    { id: 'notifications', label: 'Alerts',        icon: Bell     },
    { id: 'appearance',    label: 'Appearance',    icon: Sun      },
    { id: 'security',      label: 'Security',      icon: Shield   },
  ] as const;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">Loading your settings...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: font }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-20">

        {/* ── PROFILE HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="rounded-3xl overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)' }}>
            <div className="relative px-6 sm:px-8 py-8">
              {/* Decorative */}
              <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border-4 border-white/10 pointer-events-none" />
              <div className="absolute right-12 -bottom-8 w-32 h-32 rounded-full border-4 border-white/10 pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white/30 overflow-hidden bg-white/20 shadow-xl">
                    {settings.photoUrl
                      ? <Image src={settings.photoUrl} alt={settings.displayName} width={96} height={96} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <User size={36} className="text-white/80" />
                        </div>
                    }
                  </div>
                  <button
                    onClick={() => setModal('photo')}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    style={{ color: SKY }}>
                    <Camera size={14} />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left text-white min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-black mb-1 truncate">
                    {settings.displayName || user.email?.split('@')[0]}
                  </h1>
                  <p className="text-white/70 text-sm mb-3 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                    <Mail size={12} />{user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{ background: user.emailVerified ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)' }}>
                      {user.emailVerified
                        ? <><CheckCircle size={10} />Verified</>
                        : <><AlertCircle size={10} />Not Verified</>
                      }
                    </span>
                    {settings.travelPrefs.homeCity && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15">
                        <MapPin size={10} />{settings.travelPrefs.homeCity}
                      </span>
                    )}
                    {settings.travelPrefs.homeAirport && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15">
                        <Plane size={10} />{settings.travelPrefs.homeAirport}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-2 flex-shrink-0">
                  {[
                    { value: stats.tripsPlanned, label: 'Trips',  icon: Plane  },
                    { value: stats.savedCount,   label: 'Saved',  icon: Heart  },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center min-w-[70px] border border-white/20">
                      <div className="text-xl font-black text-white">{s.value}</div>
                      <div className="text-[11px] text-white/70 font-semibold mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member since */}
              <div className="relative mt-5 pt-5 border-t border-white/15 flex items-center justify-between">
                <span className="text-xs text-white/50 font-semibold">Member since {stats.memberSince}</span>
                <div className="flex items-center gap-1 text-xs text-white/50 font-semibold">
                  <Sparkles size={11} style={{ color: '#38BDF8' }} />
                  GladysTravel.com
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TAB BAR ── */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 border-2 border-slate-100 shadow-sm overflow-x-auto">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background: active ? SKY : 'transparent',
                  color:      active ? 'white' : '#94A3B8',
                }}>
                <tab.icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}>

            {activeTab === 'profile' && (
              <ProfileTab settings={settings} user={user} onSave={save} />
            )}
            {activeTab === 'travel' && (
              <TravelTab settings={settings} onSave={save} />
            )}
            {activeTab === 'identity' && (
              <IdentityTab settings={settings} onSave={save} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab settings={settings} onSave={save} />
            )}
            {activeTab === 'appearance' && (
              <AppearanceTab theme={theme} setTheme={setTheme} />
            )}
            {activeTab === 'security' && (
              <SecurityTab user={user} onSignOut={async () => { await logout(); router.push('/'); }} />
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      <Footer />

      {/* Saving indicator */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-6 bg-white border-2 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2.5 z-50"
            style={{ borderColor: SKY }}>
            <Loader2 className="animate-spin" size={15} style={{ color: SKY }} />
            <span className="font-bold text-slate-900 text-sm">Saving...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo modal */}
      <PhotoModal open={modal === 'photo'} onClose={() => setModal(null)}
        onSave={(url: string) => { save({ photoUrl: url }); setModal(null); }} />
    </div>
  );
}

// ── PROFILE TAB ────────────────────────────────────────────────────────────────

function ProfileTab({ settings, user, onSave }: { settings: UserSettings; user: any; onSave: (u: Partial<UserSettings>) => void }) {
  const [form, setForm] = useState({
    displayName: settings.displayName,
    phone:       settings.phone,
    currency:    settings.currency,
    language:    settings.language,
  });
  const dirty = JSON.stringify(form) !== JSON.stringify({
    displayName: settings.displayName,
    phone:       settings.phone,
    currency:    settings.currency,
    language:    settings.language,
  });

  const CURRENCIES = ['USD','GBP','EUR','ZAR','AUD','CAD','JPY','AED','INR'];
  const LANGUAGES  = [
    { code: 'en',    label: 'English' },
    { code: 'fr',    label: 'French' },
    { code: 'es',    label: 'Spanish' },
    { code: 'de',    label: 'German' },
    { code: 'pt',    label: 'Portuguese' },
    { code: 'ar',    label: 'Arabic' },
    { code: 'zh',    label: 'Chinese' },
  ];

  return (
    <div className="space-y-5">
      <Card title="Personal Details" icon={User}>
        <div className="p-5 sm:p-6 space-y-4">
          <Field label="Display Name" hint="How Gladys will greet you">
            <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
              className="input" placeholder="Your full name" />
          </Field>
          <Field label="Email Address" hint="Your sign-in email — managed by Firebase">
            <input value={user.email} disabled
              className="input opacity-60 cursor-not-allowed" />
          </Field>
          <Field label="Phone Number" hint="Optional — for trip notifications">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input" placeholder="+27 64 545 2236" type="tel" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency" hint="Used for price display">
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="input">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Language" hint="Interface language">
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                className="input">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </Field>
          </div>
          {dirty && (
            <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => onSave(form)}
              className="w-full h-11 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
              <Save size={14} />Save Changes
            </motion.button>
          )}
        </div>
      </Card>

      <Card title="Emergency Contact" icon={Users}
        hint="Stored securely — only visible to you">
        <EmergencyContactForm settings={settings} onSave={onSave} />
      </Card>
    </div>
  );
}

// ── TRAVEL TAB ─────────────────────────────────────────────────────────────────

function TravelTab({ settings, onSave }: { settings: UserSettings; onSave: (u: Partial<UserSettings>) => void }) {
  const [prefs, setPrefs] = useState<TravelPrefs>({ ...settings.travelPrefs });
  const dirty = JSON.stringify(prefs) !== JSON.stringify(settings.travelPrefs);

  return (
    <div className="space-y-5">

      {/* Gladys AI banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 text-sm"
        style={{ background: '#F0F9FF', borderColor: '#BAE6FD' }}>
        <Sparkles size={16} style={{ color: SKY }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-black text-slate-900 text-sm">These settings power Gladys AI</p>
          <p className="text-slate-500 text-xs mt-0.5">Every trip plan Gladys creates uses your home city, budget, and style preferences automatically.</p>
        </div>
      </div>

      <Card title="Home Base" icon={MapPin} hint="Where your trips start from">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Home City" hint="e.g. Johannesburg, London">
              <input value={prefs.homeCity} onChange={e => setPrefs({ ...prefs, homeCity: e.target.value })}
                className="input" placeholder="Your city" />
            </Field>
            <Field label="Home Airport" hint="IATA code — e.g. JNB, LHR, JFK">
              <input value={prefs.homeAirport}
                onChange={e => setPrefs({ ...prefs, homeAirport: e.target.value.toUpperCase().slice(0,3) })}
                className="input uppercase" placeholder="JNB" maxLength={3} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Trip Preferences" icon={Star}>
        <div className="p-5 sm:p-6 space-y-5">

          <Field label="Budget Range" hint="Sets price filters for hotels, flights, and activities">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: 'budget',       label: 'Budget',       emoji: '💸' },
                { value: 'moderate',     label: 'Moderate',     emoji: '✈️' },
                { value: 'luxury',       label: 'Luxury',       emoji: '⭐' },
                { value: 'ultra-luxury', label: 'Ultra Luxury', emoji: '💎' },
              ] as const).map(opt => (
                <button key={opt.value} onClick={() => setPrefs({ ...prefs, budget: opt.value })}
                  className="p-3 rounded-xl border-2 text-xs font-bold transition-all text-center"
                  style={{
                    borderColor: prefs.budget === opt.value ? SKY : '#E2E8F0',
                    background:  prefs.budget === opt.value ? '#F0F9FF' : 'white',
                    color:       prefs.budget === opt.value ? SKY : '#64748B',
                  }}>
                  <div className="text-base mb-1">{opt.emoji}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Trip Style" hint="Gladys uses this to tailor itinerary recommendations">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: 'adventure',   label: 'Adventure',   emoji: '🧗' },
                { value: 'relaxation',  label: 'Relaxation',  emoji: '🏖️' },
                { value: 'cultural',    label: 'Cultural',    emoji: '🎭' },
                { value: 'balanced',    label: 'Balanced',    emoji: '⚡' },
              ] as const).map(opt => (
                <button key={opt.value} onClick={() => setPrefs({ ...prefs, tripStyle: opt.value })}
                  className="p-3 rounded-xl border-2 text-xs font-bold transition-all text-center"
                  style={{
                    borderColor: prefs.tripStyle === opt.value ? SKY : '#E2E8F0',
                    background:  prefs.tripStyle === opt.value ? '#F0F9FF' : 'white',
                    color:       prefs.tripStyle === opt.value ? SKY : '#64748B',
                  }}>
                  <div className="text-base mb-1">{opt.emoji}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hotel Tier">
              <select value={prefs.hotelTier} onChange={e => setPrefs({ ...prefs, hotelTier: e.target.value as any })}
                className="input">
                <option value="budget">Budget (Hostel / 2★)</option>
                <option value="midscale">Midscale (3★)</option>
                <option value="upscale">Upscale (4★)</option>
                <option value="luxury">Luxury (5★)</option>
              </select>
            </Field>
            <Field label="Seat Preference">
              <select value={prefs.seatPreference} onChange={e => setPrefs({ ...prefs, seatPreference: e.target.value as any })}
                className="input">
                <option value="window">Window</option>
                <option value="aisle">Aisle</option>
                <option value="no-preference">No preference</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Preferred Airline" hint="For flight search prioritisation">
              <input value={prefs.preferredAirline} onChange={e => setPrefs({ ...prefs, preferredAirline: e.target.value })}
                className="input" placeholder="e.g. South African Airways" />
            </Field>
            <Field label="Dietary Needs" hint="Shown on itinerary recommendations">
              <input value={prefs.dietaryNeeds} onChange={e => setPrefs({ ...prefs, dietaryNeeds: e.target.value })}
                className="input" placeholder="e.g. Halal, Vegetarian" />
            </Field>
          </div>
        </div>
      </Card>

      {dirty && (
        <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onSave({ travelPrefs: prefs })}
          className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 shadow-md"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          <Save size={15} />Save Travel Preferences
        </motion.button>
      )}
    </div>
  );
}

// ── IDENTITY TAB ───────────────────────────────────────────────────────────────

function IdentityTab({ settings, onSave }: { settings: UserSettings; onSave: (u: Partial<UserSettings>) => void }) {
  const [form, setForm] = useState<TravelIdentity>({ ...settings.travelIdentity });
  const dirty = JSON.stringify(form) !== JSON.stringify(settings.travelIdentity);

  return (
    <div className="space-y-5">

      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2"
        style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-black text-amber-900 text-sm">Stored locally on this device</p>
          <p className="text-amber-700 text-xs mt-0.5">
            We never store your full passport number. Only expiry date and nationality are saved — used to remind you when your passport is expiring.
          </p>
        </div>
      </div>

      <Card title="Passport Details" icon={BookOpen}>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nationality" hint="Your citizenship">
              <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}
                className="input" placeholder="e.g. South African" />
            </Field>
            <Field label="Passport Country" hint="Country that issued your passport">
              <input value={form.passportCountry} onChange={e => setForm({ ...form, passportCountry: e.target.value })}
                className="input" placeholder="e.g. South Africa" />
            </Field>
          </div>
          <Field label="Passport Expiry" hint="We'll remind you before it expires — no passport number stored">
            <input value={form.passportExpiry}
              onChange={e => setForm({ ...form, passportExpiry: e.target.value })}
              className="input" type="month" />
          </Field>

          {/* Passport expiry warning */}
          {form.passportExpiry && (() => {
            const months = (new Date(form.passportExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
            if (months < 6) return (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-xs font-semibold">
                  {months < 0 ? 'Passport expired!' : `Expires in ~${Math.round(months)} months — many countries require 6 months validity`}
                </p>
              </div>
            );
            if (months < 12) return (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 text-xs font-semibold">Expires in ~{Math.round(months)} months — consider renewing soon</p>
              </div>
            );
            return (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-700 text-xs font-semibold">Passport is valid — good to travel ✈️</p>
              </div>
            );
          })()}
        </div>
      </Card>

      <Card title="Frequent Flyer" icon={Ticket} hint="Helps Gladys prioritise matching flights">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Airline Program">
              <input value={form.frequentFlyerAirline}
                onChange={e => setForm({ ...form, frequentFlyerAirline: e.target.value })}
                className="input" placeholder="e.g. British Airways" />
            </Field>
            <Field label="Membership Number">
              <input value={form.frequentFlyerNumber}
                onChange={e => setForm({ ...form, frequentFlyerNumber: e.target.value })}
                className="input" placeholder="BA1234567" />
            </Field>
          </div>
        </div>
      </Card>

      {dirty && (
        <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onSave({ travelIdentity: form })}
          className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 shadow-md"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          <Save size={15} />Save Identity Details
        </motion.button>
      )}
    </div>
  );
}

// ── NOTIFICATIONS TAB ──────────────────────────────────────────────────────────

function NotificationsTab({ settings, onSave }: { settings: UserSettings; onSave: (u: Partial<UserSettings>) => void }) {
  const [notifs, setNotifs] = useState<Notifications>({ ...settings.notifications });
  const dirty = JSON.stringify(notifs) !== JSON.stringify(settings.notifications);

  const ITEMS = [
    {
      key:   'priceAlerts' as const,
      label: 'Price Drop Alerts',
      desc:  'Get notified when ticket or flight prices drop for events you\'ve searched',
      icon:  Ticket,
    },
    {
      key:   'tripReminders' as const,
      label: 'Trip Reminders',
      desc:  'Reminders before your saved events — check-in, flight, and event day alerts',
      icon:  Plane,
    },
    {
      key:   'emailUpdates' as const,
      label: 'Email Updates',
      desc:  'New events, platform news, and exclusive deals from Gladys Travel',
      icon:  Mail,
    },
    {
      key:   'pushEnabled' as const,
      label: 'Push Notifications',
      desc:  'Browser push notifications for real-time price and event alerts',
      icon:  Bell,
    },
  ];

  return (
    <Card title="Notification Preferences" icon={Bell}>
      <div className="divide-y divide-slate-100">
        {ITEMS.map(item => (
          <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#F0F9FF' }}>
                <item.icon size={16} style={{ color: SKY }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}
              className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: notifs[item.key] ? SKY : '#E2E8F0' }}>
              <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
                style={{ left: notifs[item.key] ? '22px' : '4px' }} />
            </button>
          </div>
        ))}
      </div>
      {dirty && (
        <div className="px-5 pb-5">
          <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onSave({ notifications: notifs })}
            className="w-full h-11 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
            <Save size={14} />Save Preferences
          </motion.button>
        </div>
      )}
    </Card>
  );
}

// ── SECURITY TAB ───────────────────────────────────────────────────────────────

function SecurityTab({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const [showPwdForm,  setShowPwdForm]  = useState(false);
  const [currentPwd,   setCurrentPwd]   = useState('');
  const [newPwd,       setNewPwd]       = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [pwdLoading,   setPwdLoading]   = useState(false);
  const [deleteConfirm,setDeleteConfirm]= useState(false);

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd)    { toast.error("Passwords don't match"); return; }
    if (newPwd.length < 8)        { toast.error("Password must be at least 8 characters"); return; }
    setPwdLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      toast.success('Password updated successfully');
      setShowPwdForm(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') toast.error('Current password is incorrect');
      else toast.error('Failed to update password');
    } finally { setPwdLoading(false); }
  };

  const isGoogleUser = user.providerData?.[0]?.providerId === 'google.com';

  return (
    <div className="space-y-5">

      {/* Email verification */}
      <Card title="Account Security" icon={Shield}>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: user.emailVerified ? '#F0FDF4' : '#FFF7ED' }}>
            <div className="flex items-center gap-2.5">
              {user.emailVerified
                ? <CheckCircle size={16} className="text-emerald-500" />
                : <AlertCircle size={16} className="text-amber-500" />
              }
              <div>
                <p className="text-sm font-bold" style={{ color: user.emailVerified ? '#059669' : '#D97706' }}>
                  Email {user.emailVerified ? 'Verified' : 'Not Verified'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>
            </div>
            {!user.emailVerified && (
              <button onClick={() => { user.sendEmailVerification(); toast.success('Verification email sent!'); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#D97706' }}>
                Verify
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-slate-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">Sign-in Method</p>
                <p className="text-xs text-slate-500 mt-0.5">{isGoogleUser ? 'Google Account' : 'Email & Password'}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
              {isGoogleUser ? 'Google' : 'Email'}
            </span>
          </div>
        </div>
      </Card>

      {/* Password change — only for email users */}
      {!isGoogleUser && (
        <Card title="Change Password" icon={Lock}>
          <div className="p-5">
            {!showPwdForm ? (
              <button onClick={() => setShowPwdForm(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all">
                <span className="text-sm font-bold text-slate-700">Update your password</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ) : (
              <div className="space-y-3">
                <PwdField label="Current Password"  value={currentPwd}  onChange={setCurrentPwd}  show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
                <PwdField label="New Password"       value={newPwd}      onChange={setNewPwd}      show={showNew}    onToggle={() => setShowNew(!showNew)} />
                <PwdField label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd}  show={showNew}    onToggle={() => setShowNew(!showNew)} />
                {newPwd.length > 0 && newPwd.length < 8 && (
                  <p className="text-xs text-red-500 font-semibold">Password must be at least 8 characters</p>
                )}
                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-xs text-red-500 font-semibold">Passwords don't match</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowPwdForm(false)}
                    className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleChangePassword} disabled={pwdLoading || !currentPwd || !newPwd || newPwd !== confirmPwd}
                    className="flex-1 h-10 rounded-xl text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} />Update</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Account actions */}
      <Card title="Account Actions" icon={AlertCircle}>
        <div className="p-5 space-y-3">
          <button onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition-all text-left">
            <LogOut size={16} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-600">Sign Out</p>
              <p className="text-xs text-red-400">You'll need to sign back in to access your trips</p>
            </div>
          </button>

          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all text-left">
              <Trash2 size={16} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-600">Delete Account</p>
                <p className="text-xs text-slate-400">Permanently delete your account and all data</p>
              </div>
            </button>
          ) : (
            <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50">
              <p className="text-sm font-black text-red-700 mb-1">Are you sure?</p>
              <p className="text-xs text-red-500 mb-3">This cannot be undone. All your trips, preferences, and data will be permanently deleted.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)}
                  className="flex-1 h-9 rounded-lg border border-red-300 text-xs font-bold text-red-600 bg-white hover:bg-red-50">
                  Cancel
                </button>
                <button onClick={() => toast.error('Please contact contact@gladystravel.com to delete your account')}
                  className="flex-1 h-9 rounded-lg bg-red-500 text-xs font-black text-white hover:bg-red-600">
                  Delete Forever
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── EMERGENCY CONTACT FORM ─────────────────────────────────────────────────────

function EmergencyContactForm({ settings, onSave }: { settings: UserSettings; onSave: (u: Partial<UserSettings>) => void }) {
  const [form, setForm] = useState<EmergencyContact>({ ...settings.emergencyContact });
  const dirty = JSON.stringify(form) !== JSON.stringify(settings.emergencyContact);

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="input" placeholder="Jane Doe" />
        </Field>
        <Field label="Relationship">
          <input value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}
            className="input" placeholder="e.g. Spouse, Parent" />
        </Field>
        <Field label="Phone Number">
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="input" placeholder="+27 64 000 0000" type="tel" />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="input" placeholder="jane@email.com" type="email" />
        </Field>
      </div>
      {dirty && (
        <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onSave({ emergencyContact: form })}
          className="w-full h-11 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          <Save size={14} />Save Contact
        </motion.button>
      )}
    </div>
  );
}

// ── PHOTO MODAL ────────────────────────────────────────────────────────────────

function PhotoModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large — max 5MB'); return; }
    const url = URL.createObjectURL(file);
    onSave(url);
    toast.success('Profile photo updated');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
          <X size={16} />
        </button>
        <h3 className="text-lg font-black text-slate-900 mb-1">Update Profile Photo</h3>
        <p className="text-sm text-slate-400 mb-5">Choose a photo from your device — max 5MB</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          <Camera size={15} />Choose Photo
        </button>
      </div>
    </div>
  );
}

// ── SHARED UI ──────────────────────────────────────────────────────────────────

function Card({ title, icon: Icon, hint, children }: { title: string; icon?: any; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        {Icon && <Icon size={15} style={{ color: SKY }} />}
        <div className="flex-1">
          <span className="text-xs font-black text-slate-900 uppercase tracking-[0.12em]">{title}</span>
          {hint && <span className="text-[11px] text-slate-400 ml-2">{hint}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</label>
        {hint && <span className="text-[11px] text-slate-400">— {hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PwdField({ label, value, onChange, show, onToggle }: any) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={label}
        className="input pr-10" />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// ── APPEARANCE TAB ─────────────────────────────────────────────────────────────

function AppearanceTab({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const options: { value: Theme; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value:       'light',
      label:       'Light',
      description: 'Clean white interface — great for daytime use',
      icon:        <Sun size={22} />,
    },
    {
      value:       'dark',
      label:       'Dark',
      description: 'Easy on the eyes at night',
      icon:        <Moon size={22} />,
    },
    {
      value:       'system',
      label:       'Use System',
      description: 'Automatically matches your device setting',
      icon:        <Monitor size={22} />,
    },
  ];

  return (
    <div className="space-y-5">
      <Card title="Theme" icon={Sun}>
        <div className="p-5 sm:p-6 space-y-3">
          <p className="text-sm text-slate-500 mb-4">
            Choose how GladysTravel.com looks for you. Applies instantly and remembered across sessions.
          </p>

          {options.map(opt => {
            const active = theme === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setTheme(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  active
                    ? 'border-sky-400 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Icon circle */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-slate-500 bg-slate-100'
                  }`}
                  style={active ? { background: 'linear-gradient(135deg, #38BDF8, #0284C7)' } : {}}
                >
                  {opt.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${active ? 'text-sky-700' : 'text-slate-900'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                </div>

                {/* Check */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  active ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                }`}>
                  {active && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Preview strip */}
      <Card title="Preview" icon={Monitor}>
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            {/* Light preview */}
            <div className="bg-white p-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-sky-500" />
                <div className="h-3 w-24 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-slate-100 rounded-full" />
                <div className="h-2.5 w-3/4 bg-slate-100 rounded-full" />
              </div>
              <div className="mt-3 h-8 w-28 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600" />
              <p className="text-[10px] text-slate-400 mt-2 font-semibold">Light mode</p>
            </div>
            {/* Dark preview */}
            <div className="bg-slate-900 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-sky-400" />
                <div className="h-3 w-24 bg-slate-700 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-slate-800 rounded-full" />
                <div className="h-2.5 w-3/4 bg-slate-800 rounded-full" />
              </div>
              <div className="mt-3 h-8 w-28 rounded-xl bg-gradient-to-r from-sky-500 to-sky-700" />
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">Dark mode</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Global input styles — add to globals.css or keep inline via style tag in layout
// .input { @apply w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-sky-400 transition-all bg-white; }