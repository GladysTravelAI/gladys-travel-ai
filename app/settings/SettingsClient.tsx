"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Lock, Globe, Mail, ChevronRight, LogOut, Trash2, Shield,
  MapPin, Smartphone, Languages, HelpCircle, Sun, Sparkles, Star, TrendingUp,
  CreditCard, Camera, Download, History, Plane, CheckCircle, XCircle, Loader2,
  AlertCircle, FileText, UserCircle, Key, Clock, Bookmark, Heart, Moon, Upload,
} from "lucide-react";
import Navbar  from "@/components/Navbar";
import Footer  from "@/components/Footer";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input }     from "@/components/ui/input";
import { Textarea }  from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

import {
  PhotoUploadModal, PasswordModal, NotificationsModal,
  LocationModal, LanguageModal, AppearanceModal,
} from "@/components/settings/SettingsModals-Part1";
import {
  TravelPrefsModal, TravelDocsModal, PaymentMethodsModal,
  EmergencyContactModal, TwoFactorModal, SavedTripsModal,
  ActivityLogModal, ExportDataModal,
} from "@/components/settings/SettingsModals-Part2";

const SKY = '#0EA5E9';

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface UserSettings {
  displayName: string; email: string; phone: string; bio: string; photoUrl: string;
  defaultLocation: string; language: string; timezone: string; currency: string;
  notifications: { email: boolean; push: boolean; sms: boolean; deals: boolean; priceAlerts: boolean; tripReminders: boolean };
  travelPrefs: { budget: 'budget'|'moderate'|'luxury'; tripStyle: 'adventure'|'relaxation'|'cultural'|'balanced'; seatPreference: 'window'|'aisle'|'no-preference'; mealPreference: string; accessibility: string[] };
  travelDocs: { passportNumber: string; passportExpiry: string; tsaPrecheck: string; knownTravelerNumber: string; frequentFlyer: { airline: string; number: string }[] };
  paymentMethods: { id: string; type: 'card'|'paypal'|'apple-pay'; last4: string; brand: string; expiryMonth: string; expiryYear: string; isDefault: boolean }[];
  emergencyContact: { name: string; relationship: string; phone: string; email: string };
  security: { twoFactorEnabled: boolean; emailVerified: boolean; phoneVerified: boolean };
  appearance: 'light'|'dark'|'system';
}

// ── MAIN ───────────────────────────────────────────────────────────────────────

export default function SettingsClient() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Modals
  const [personalInfoOpen,    setPersonalInfoOpen]    = useState(false);
  const [photoUploadOpen,     setPhotoUploadOpen]     = useState(false);
  const [passwordOpen,        setPasswordOpen]        = useState(false);
  const [notificationsOpen,   setNotificationsOpen]   = useState(false);
  const [locationOpen,        setLocationOpen]        = useState(false);
  const [languageOpen,        setLanguageOpen]        = useState(false);
  const [appearanceOpen,      setAppearanceOpen]      = useState(false);
  const [travelPrefsOpen,     setTravelPrefsOpen]     = useState(false);
  const [travelDocsOpen,      setTravelDocsOpen]      = useState(false);
  const [paymentMethodsOpen,  setPaymentMethodsOpen]  = useState(false);
  const [emergencyOpen,       setEmergencyOpen]       = useState(false);
  const [twoFactorOpen,       setTwoFactorOpen]       = useState(false);
  const [savedTripsOpen,      setSavedTripsOpen]      = useState(false);
  const [activityLogOpen,     setActivityLogOpen]     = useState(false);
  const [exportDataOpen,      setExportDataOpen]      = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    displayName:   '',
    email:         '',
    phone:         '',
    bio:           '',
    photoUrl:      '',
    defaultLocation: 'Johannesburg, South Africa',
    language:      'en-US',
    timezone:      'Africa/Johannesburg',
    currency:      'ZAR',
    notifications: { email: true, push: false, sms: false, deals: true, priceAlerts: true, tripReminders: true },
    travelPrefs:   { budget: 'moderate', tripStyle: 'balanced', seatPreference: 'window', mealPreference: 'No preference', accessibility: [] },
    travelDocs:    { passportNumber: '', passportExpiry: '', tsaPrecheck: '', knownTravelerNumber: '', frequentFlyer: [] },
    paymentMethods: [],
    emergencyContact: { name: '', relationship: '', phone: '', email: '' },
    security:      { twoFactorEnabled: false, emailVerified: false, phoneVerified: false },
    appearance:    'system',
  });

  // ── Redirect if not logged in ──
  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [user, authLoading, router]);

  // ── Load settings + merge real Firebase data ──
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem('gladys-user-settings');
      const parsed = saved ? JSON.parse(saved) : {};
      setSettings(prev => ({
        ...prev,
        ...parsed,
        // Always prefer live Firebase values over stale localStorage
        displayName: userProfile?.name  || user.displayName || parsed.displayName || '',
        email:       user.email         || parsed.email      || '',
        photoUrl:    userProfile?.profileImage || user.photoURL || parsed.photoUrl || '',
        security: {
          ...prev.security,
          emailVerified: user.emailVerified || false,
        },
      }));
    } catch {}
  }, [user, userProfile]);

  // ── Real stats from userProfile ──
  const stats = {
    tripsPlanned: userProfile?.totalTripsPlanned ?? 0,
    savedCount:   0,
    memberSince:  userProfile?.createdAt
      ? new Date(userProfile.createdAt).getFullYear().toString()
      : new Date().getFullYear().toString(),
  };

  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true);
    try {
      const next = { ...settings, ...updates };
      setSettings(next);
      localStorage.setItem('gladys-user-settings', JSON.stringify(next));
      // Sync travel prefs into gladys-context
      localStorage.setItem('gladys-context', JSON.stringify({
        name: next.displayName,
        budget: next.travelPrefs.budget,
        preferredCities: [next.defaultLocation],
        travelStyle: next.travelPrefs.tripStyle,
      }));
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const photoUrl = URL.createObjectURL(file);
      await saveSettings({ photoUrl });
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      setPhotoUploadOpen(false);
    }
  };

  const handleExportData = async () => {
    const blob = new Blob([JSON.stringify({ profile: settings, stats, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `gladys-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Data exported');
  };

  const handleSignOut = async () => {
    setLoading(true);
    await logout();
    router.push('/');
  };

  const toggleDarkMode = (mode: 'light' | 'dark' | 'system') => {
    saveSettings({ appearance: mode });
    if (mode === 'system') {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">

        {/* ── PROFILE HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="rounded-3xl p-7 sm:p-8 shadow-xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7, #1E40AF)' }}>

            {/* Decorative circles */}
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-4 border-white/10" />
            <div className="absolute -right-4 -bottom-8  w-40 h-40 rounded-full border-4 border-white/10" />

            <div className="relative flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 shadow-xl">
                  {settings.photoUrl
                    ? <Image src={settings.photoUrl} alt={settings.displayName} width={112} height={112} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <User size={44} className="text-white/80" />
                      </div>
                  }
                </div>
                <button onClick={() => setPhotoUploadOpen(true)}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  style={{ color: SKY }}>
                  <Camera size={16} />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left text-white min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black mb-1 truncate">
                  {settings.displayName || user.email}
                </h1>
                <p className="text-white/70 text-sm mb-3 truncate">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold">
                    {user.emailVerified
                      ? <><CheckCircle size={12} />Email Verified</>
                      : <><AlertCircle size={12} />Email Not Verified</>
                    }
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold">
                    <Clock size={12} />Member since {stats.memberSince}
                  </span>
                  {settings.security.twoFactorEnabled && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold">
                      <Shield size={12} />2FA Active
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 flex-shrink-0">
                {[
                  { icon: TrendingUp, value: stats.tripsPlanned, label: 'Trips'  },
                  { icon: Bookmark,   value: stats.savedCount,   label: 'Saved'  },
                ].map((s, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[72px]">
                    <s.icon size={20} className="mx-auto mb-1 text-white" />
                    <div className="text-xl font-black text-white">{s.value}</div>
                    <div className="text-[11px] text-white/70 font-semibold">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SETTINGS GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Main ── */}
          <div className="lg:col-span-2 space-y-6">

            <Section title="Personal Information" icon={User}>
              <Item icon={UserCircle} label="Profile Details"    desc="Name, bio, and contact information"   onClick={() => setPersonalInfoOpen(true)} />
              <Item icon={Camera}     label="Profile Photo"      desc="Upload or change your profile picture" onClick={() => setPhotoUploadOpen(true)}  />
            </Section>

            <Section title="Travel Preferences" icon={Plane}>
              <div className="px-5 py-3 border-b border-slate-100" style={{ background: '#F0F9FF' }}>
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: SKY }}>
                  <Sparkles size={13} />Syncs with Gladys AI
                </div>
              </div>
              <Item icon={Globe}    label="Trip Preferences"   desc={`${settings.travelPrefs.budget} · ${settings.travelPrefs.tripStyle}`} onClick={() => setTravelPrefsOpen(true)} />
              <Item icon={FileText} label="Travel Documents"   desc="Passport, TSA PreCheck, frequent flyer"                                onClick={() => setTravelDocsOpen(true)}  />
              <Item icon={User}     label="Emergency Contact"  desc={settings.emergencyContact.name || 'Not set'}                          onClick={() => setEmergencyOpen(true)}   />
            </Section>

            <Section title="Payment & Billing" icon={CreditCard}>
              <Item icon={CreditCard} label="Payment Methods" desc={`${settings.paymentMethods.length} saved cards`} onClick={() => setPaymentMethodsOpen(true)}
                badge={settings.paymentMethods.length > 0 ? String(settings.paymentMethods.length) : undefined} />
            </Section>

            <Section title="Notifications" icon={Bell}>
              <Item icon={Bell} label="Notification Preferences" desc="Email, push, SMS, and price alerts" onClick={() => setNotificationsOpen(true)} />
            </Section>

            <Section title="Location & Language" icon={Globe}>
              <Item icon={MapPin}    label="Default Location"  desc={settings.defaultLocation}                                                    onClick={() => setLocationOpen(true)}  />
              <Item icon={Languages} label="Language & Region" desc={`${settings.language} · ${settings.currency}`}                               onClick={() => setLanguageOpen(true)}  />
              <Item icon={settings.appearance === 'dark' ? Moon : Sun}
                                     label="Appearance"        desc={settings.appearance === 'system' ? 'System default' : settings.appearance}    onClick={() => setAppearanceOpen(true)} />
            </Section>
          </div>

          {/* ── RIGHT: Quick actions + Security + Support + Account ── */}
          <div className="space-y-6">

            <Section title="Quick Actions" icon={Sparkles}>
              <Item icon={Bookmark} label="Saved Trips"   desc={`${stats.savedCount} saved itineraries`}  onClick={() => setSavedTripsOpen(true)}   compact />
              <Item icon={History}  label="Activity Log"  desc="View your account activity"                onClick={() => setActivityLogOpen(true)}  compact />
              <Item icon={Download} label="Export Data"   desc="Download your data"                        onClick={() => setExportDataOpen(true)}   compact />
            </Section>

            <Section title="Security & Privacy" icon={Shield}>
              <Item icon={Lock} label="Change Password"   desc="Update your password"                                             onClick={() => setPasswordOpen(true)}   compact />
              <Item icon={Key}  label="Two-Factor Auth"   desc={settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}     onClick={() => setTwoFactorOpen(true)}  compact
                badge={settings.security.twoFactorEnabled ? undefined : '!'} />
            </Section>

            <Section title="Support" icon={HelpCircle}>
              <Item icon={HelpCircle} label="Help Center" desc="Get help and support"       onClick={() => window.open('mailto:contact@gladystravel.com', '_blank')} compact />
              <Item icon={Smartphone} label="Contact Us"  desc="contact@gladystravel.com"  onClick={() => window.open('mailto:contact@gladystravel.com', '_blank')} compact />
            </Section>

            <Section title="Account Actions" icon={AlertCircle}>
              <Item icon={LogOut} label="Sign Out"       desc="Sign out of your account" onClick={handleSignOut}   danger compact />
              <Item icon={Trash2} label="Delete Account" desc="Permanently delete"       onClick={() => {}}        danger compact />
            </Section>
          </div>
        </div>

        {/* ── VERSION ── */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={12} style={{ color: SKY }} />
            GladysTravel.com · © 2026
          </div>
        </div>
      </div>

      <Footer />

      {/* Saving indicator */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-white border-2 rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 z-50"
            style={{ borderColor: SKY }}>
            <Loader2 className="animate-spin" size={18} style={{ color: SKY }} />
            <span className="font-bold text-slate-900 text-sm">Saving...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALS ── */}
      <PersonalInfoModal open={personalInfoOpen} onClose={() => setPersonalInfoOpen(false)} settings={settings} onSave={saveSettings} />
      <PhotoUploadModal  open={photoUploadOpen}  onClose={() => setPhotoUploadOpen(false)}  onUpload={handlePhotoUpload} uploading={uploadingPhoto} />
      <PasswordModal     open={passwordOpen}     onClose={() => setPasswordOpen(false)} />
      <NotificationsModal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} settings={settings} onSave={saveSettings} />
      <LocationModal     open={locationOpen}     onClose={() => setLocationOpen(false)}     settings={settings} onSave={saveSettings} />
      <LanguageModal     open={languageOpen}     onClose={() => setLanguageOpen(false)}     settings={settings} onSave={saveSettings} />
      <AppearanceModal   open={appearanceOpen}   onClose={() => setAppearanceOpen(false)}   appearance={settings.appearance} onSave={toggleDarkMode} />
      <TravelPrefsModal  open={travelPrefsOpen}  onClose={() => setTravelPrefsOpen(false)}  settings={settings} onSave={saveSettings} />
      <TravelDocsModal   open={travelDocsOpen}   onClose={() => setTravelDocsOpen(false)}   settings={settings} onSave={saveSettings} />
      <PaymentMethodsModal open={paymentMethodsOpen} onClose={() => setPaymentMethodsOpen(false)} settings={settings} onSave={saveSettings} />
      <EmergencyContactModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)}  settings={settings} onSave={saveSettings} />
      <TwoFactorModal    open={twoFactorOpen}    onClose={() => setTwoFactorOpen(false)}    enabled={settings.security.twoFactorEnabled}
        onToggle={(v: boolean) => saveSettings({ security: { ...settings.security, twoFactorEnabled: v } })} />
      <SavedTripsModal   open={savedTripsOpen}   onClose={() => setSavedTripsOpen(false)} />
      <ActivityLogModal  open={activityLogOpen}  onClose={() => setActivityLogOpen(false)} />
      <ExportDataModal   open={exportDataOpen}   onClose={() => setExportDataOpen(false)} onExport={handleExportData} />
    </div>
  );
}

// ── SECTION ────────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="flex items-center gap-2 mb-3 px-1">
        {Icon && <Icon size={15} style={{ color: '#0EA5E9' }} />}
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">{title}</h2>
      </div>
      <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

// ── ITEM ───────────────────────────────────────────────────────────────────────

function Item({ icon: Icon, label, desc, onClick, danger = false, compact = false, badge }: any) {
  return (
    <>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
        className={`w-full ${compact ? 'px-4 py-3' : 'px-5 py-4'} flex items-center justify-between hover:bg-slate-50 transition-colors text-left`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl flex items-center justify-center flex-shrink-0`}
            style={{ background: danger ? '#FEF2F2' : '#F0F9FF' }}>
            <Icon size={compact ? 16 : 18} style={{ color: danger ? '#EF4444' : '#0EA5E9' }} />
          </div>
          <div className="min-w-0">
            <p className={`${compact ? 'text-sm' : 'text-sm'} font-bold truncate`}
              style={{ color: danger ? '#EF4444' : '#0F172A' }}>
              {label}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {badge && (
            <span className="px-2 py-0.5 text-white text-xs font-black rounded-full"
              style={{ background: '#0EA5E9' }}>
              {badge}
            </span>
          )}
          <ChevronRight size={16} className="text-slate-300" />
        </div>
      </motion.button>
      <Separator className="last:hidden" />
    </>
  );
}

// ── PERSONAL INFO MODAL (inline) ───────────────────────────────────────────────

function PersonalInfoModal({ open, onClose, settings, onSave }: any) {
  const [form, setForm] = useState({ displayName: settings.displayName, phone: settings.phone, bio: settings.bio });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Personal Information</DialogTitle>
          <DialogDescription>Update your name and profile details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {[
            { label: 'Display Name',  key: 'displayName', type: 'text',  ph: 'Your name'         },
            { label: 'Phone Number',  key: 'phone',       type: 'tel',   ph: '+27 64 000 0000'   },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">{f.label}</label>
              <Input type={f.type} value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="h-11 rounded-xl border-2" placeholder={f.ph} />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Bio</label>
            <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              className="rounded-xl border-2" placeholder="Tell us about yourself..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => { onSave(form); onClose(); }}
            className="rounded-xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}