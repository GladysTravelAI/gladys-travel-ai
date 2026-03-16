// components/settings/SettingsModals-Part2.tsx

import { useState, useEffect } from "react";
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { motion } from "framer-motion";
import {
  Plane, FileText, CreditCard, Shield, Bookmark,
  History, Download, Plus, Trash2, Check, X, Calendar,
  DollarSign, Clock, AlertCircle, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const BTN = "rounded-xl text-white font-bold bg-gradient-to-r from-sky-400 to-sky-600 hover:opacity-90 transition-opacity";

// ── TRAVEL PREFERENCES ────────────────────────────────────────────────────────

export function TravelPrefsModal({ open, onClose, settings, onSave }: any) {
  const [prefs, setPrefs] = useState(settings.travelPrefs);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Travel Preferences</DialogTitle>
          <DialogDescription>Syncs with Gladys AI for personalised recommendations</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {/* Budget */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1">
              <DollarSign size={12} />Budget
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['budget', 'moderate', 'luxury'].map(b => (
                <button key={b} onClick={() => setPrefs({ ...prefs, budget: b })}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    prefs.budget === b
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={prefs.budget === b ? { background: 'linear-gradient(135deg, #38BDF8, #0284C7)' } : {}}>
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Trip style */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1">
              <Plane size={12} />Trip Style
            </label>
            <select value={prefs.tripStyle} onChange={e => setPrefs({ ...prefs, tripStyle: e.target.value })}
              className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-900 font-semibold text-sm outline-none focus:border-sky-400">
              {['adventure', 'relaxation', 'cultural', 'balanced'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {/* Seat */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Seat Preference</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 'window', e: '🪟', l: 'Window' }, { v: 'aisle', e: '🚶', l: 'Aisle' }, { v: 'no-preference', e: '❓', l: 'No Pref' }].map(s => (
                <button key={s.v} onClick={() => setPrefs({ ...prefs, seatPreference: s.v })}
                  className={`py-2 rounded-xl text-xs border-2 transition-all ${
                    prefs.seatPreference === s.v ? 'border-sky-400 bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}>
                  <span className="block text-lg mb-0.5">{s.e}</span>
                  <span className="font-bold text-slate-700">{s.l}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Meal */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Meal Preference</label>
            <Input value={prefs.mealPreference} onChange={e => setPrefs({ ...prefs, mealPreference: e.target.value })}
              placeholder="e.g., Vegetarian, Halal, Gluten-free" className="h-11 rounded-xl border-2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => { onSave({ travelPrefs: prefs }); onClose(); }} className={BTN}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── TRAVEL DOCUMENTS ──────────────────────────────────────────────────────────

export function TravelDocsModal({ open, onClose, settings, onSave }: any) {
  const [docs, setDocs] = useState(settings.travelDocs);

  const addFF  = () => setDocs({ ...docs, frequentFlyer: [...docs.frequentFlyer, { airline: '', number: '' }] });
  const removeFF = (i: number) => setDocs({ ...docs, frequentFlyer: docs.frequentFlyer.filter((_: any, idx: number) => idx !== i) });
  const updateFF = (i: number, f: string, v: string) => {
    const arr = [...docs.frequentFlyer]; arr[i] = { ...arr[i], [f]: v }; setDocs({ ...docs, frequentFlyer: arr });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Travel Documents</DialogTitle>
          <DialogDescription>Securely store your travel information</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {/* Passport */}
          <div className="p-4 rounded-2xl border-2 border-sky-100 bg-sky-50">
            <h3 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2">
              <FileText size={15} className="text-sky-500" />Passport
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Passport Number</label>
                <Input value={docs.passportNumber} onChange={e => setDocs({ ...docs, passportNumber: e.target.value })}
                  placeholder="A12345678" className="h-10 rounded-xl border-2" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Expiry Date</label>
                <Input type="date" value={docs.passportExpiry} onChange={e => setDocs({ ...docs, passportExpiry: e.target.value })}
                  className="h-10 rounded-xl border-2" />
              </div>
            </div>
          </div>

          {/* TSA */}
          <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50">
            <h3 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Shield size={15} className="text-emerald-500" />TSA PreCheck / Global Entry
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">TSA PreCheck</label>
                <Input value={docs.tsaPrecheck} onChange={e => setDocs({ ...docs, tsaPrecheck: e.target.value })}
                  placeholder="1234567890" className="h-10 rounded-xl border-2" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Known Traveler #</label>
                <Input value={docs.knownTravelerNumber} onChange={e => setDocs({ ...docs, knownTravelerNumber: e.target.value })}
                  placeholder="1234567890" className="h-10 rounded-xl border-2" />
              </div>
            </div>
          </div>

          {/* Frequent flyer */}
          <div className="p-4 rounded-2xl border-2 border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Plane size={15} className="text-sky-500" />Frequent Flyer Programs
              </h3>
              <button onClick={addFF}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                <Plus size={12} />Add
              </button>
            </div>
            {docs.frequentFlyer.length === 0
              ? <p className="text-xs text-slate-400 text-center py-3">No programs added</p>
              : docs.frequentFlyer.map((ff: any, i: number) => (
                <div key={i} className="flex gap-2 items-end mb-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">Airline</label>
                    <Input value={ff.airline} onChange={e => updateFF(i, 'airline', e.target.value)} placeholder="Delta" className="h-9 rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">Number</label>
                    <Input value={ff.number} onChange={e => updateFF(i, 'number', e.target.value)} placeholder="1234567890" className="h-9 rounded-lg" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFF(i)} className="h-9 px-2 hover:bg-red-50">
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              ))
            }
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => { onSave({ travelDocs: docs }); onClose(); }} className={BTN}>Save Documents</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── PAYMENT METHODS ───────────────────────────────────────────────────────────

export function PaymentMethodsModal({ open, onClose, settings, onSave }: any) {
  const [methods,   setMethods]   = useState(settings.paymentMethods);
  const [addingNew, setAddingNew] = useState(false);
  const [newCard,   setNewCard]   = useState({ last4: '', brand: 'Visa', expiryMonth: '', expiryYear: '' });

  const addMethod = () => {
    setMethods([...methods, { id: `card-${Date.now()}`, type: 'card', ...newCard, isDefault: methods.length === 0 }]);
    setAddingNew(false); setNewCard({ last4: '', brand: 'Visa', expiryMonth: '', expiryYear: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Payment Methods</DialogTitle>
          <DialogDescription>Manage your saved payment methods</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {methods.map((m: any) => (
            <div key={m.id} className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    {m.brand.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{m.brand} •••• {m.last4}</p>
                    <p className="text-xs text-slate-400">Expires {m.expiryMonth}/{m.expiryYear}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMethods(methods.filter((x: any) => x.id !== m.id))} className="hover:bg-red-50">
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
              {m.isDefault
                ? <span className="text-[10px] font-bold text-sky-600 flex items-center gap-1"><CheckCircle size={10} />Default</span>
                : <button onClick={() => setMethods(methods.map((x: any) => ({ ...x, isDefault: x.id === m.id })))}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-700">Set as default</button>
              }
            </div>
          ))}

          {!addingNew
            ? <button onClick={() => setAddingNew(true)}
                className="w-full h-11 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-all flex items-center justify-center gap-2">
                <Plus size={15} />Add Payment Method
              </button>
            : <div className="p-4 rounded-2xl border-2 border-sky-100 bg-sky-50 space-y-3">
                <p className="font-black text-slate-900 text-sm">New Card</p>
                <select value={newCard.brand} onChange={e => setNewCard({ ...newCard, brand: e.target.value })}
                  className="w-full h-10 px-3 border-2 border-slate-200 rounded-xl bg-white text-sm">
                  {['Visa', 'Mastercard', 'American Express', 'Discover'].map(b => <option key={b}>{b}</option>)}
                </select>
                <Input value={newCard.last4} onChange={e => setNewCard({ ...newCard, last4: e.target.value })}
                  placeholder="Last 4 digits" maxLength={4} className="h-10 rounded-xl" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newCard.expiryMonth} onChange={e => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                    placeholder="MM" maxLength={2} className="h-10 rounded-xl" />
                  <Input value={newCard.expiryYear} onChange={e => setNewCard({ ...newCard, expiryYear: e.target.value })}
                    placeholder="YYYY" maxLength={4} className="h-10 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAddingNew(false)} className="flex-1 rounded-xl">Cancel</Button>
                  <Button size="sm" onClick={addMethod} className={`${BTN} flex-1`}>Add Card</Button>
                </div>
              </div>
          }
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave({ paymentMethods: methods }); onClose(); }} className={`${BTN} w-full`}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── EMERGENCY CONTACT ─────────────────────────────────────────────────────────

export function EmergencyContactModal({ open, onClose, settings, onSave }: any) {
  const [c, setC] = useState(settings.emergencyContact);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Emergency Contact</DialogTitle>
          <DialogDescription>Who should we contact in case of emergency?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Only used in emergency situations during your travels.</p>
          </div>
          {[
            { label: 'Full Name',     key: 'name',         ph: 'Jane Doe'           },
            { label: 'Relationship',  key: 'relationship', ph: 'Spouse, Parent...'  },
            { label: 'Phone Number',  key: 'phone',        ph: '+27 64 000 0000'    },
            { label: 'Email Address', key: 'email',        ph: 'jane@example.com'   },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">{f.label}</label>
              <Input value={c[f.key]} onChange={e => setC({ ...c, [f.key]: e.target.value })}
                placeholder={f.ph} className="h-11 rounded-xl border-2" />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => { onSave({ emergencyContact: c }); onClose(); }} className={BTN}>Save Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── TWO-FACTOR AUTH ───────────────────────────────────────────────────────────

export function TwoFactorModal({ open, onClose, enabled, onToggle }: any) {
  const [showQR, setShowQR] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Two-Factor Authentication</DialogTitle>
          <DialogDescription>Add an extra layer of security to your account</DialogDescription>
        </DialogHeader>
        {!enabled ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <Shield size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Enhanced Security</p>
                <p className="text-xs text-emerald-700 mt-0.5">Use an authenticator app to generate login codes.</p>
              </div>
            </div>
            {!showQR
              ? <Button onClick={() => setShowQR(true)} className={`${BTN} w-full`}>Enable Two-Factor Auth</Button>
              : <div className="space-y-3">
                  <div className="p-4 rounded-2xl border-2 border-slate-100 text-center">
                    <div className="w-44 h-44 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                      <p className="text-xs text-slate-400">QR Code placeholder</p>
                    </div>
                    <p className="text-xs text-slate-400">Or enter manually: <span className="font-mono font-bold text-slate-700">ABCD-EFGH-IJKL</span></p>
                  </div>
                  <Input placeholder="Enter 6-digit code" className="h-11 rounded-xl border-2 text-center font-mono text-lg tracking-widest" />
                  <Button onClick={() => { onToggle(true); toast.success('2FA enabled'); onClose(); }} className={`${BTN} w-full`}>
                    Verify & Enable
                  </Button>
                </div>
            }
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <CheckCircle size={20} className="text-sky-500" />
              <div>
                <p className="font-bold text-sky-900 text-sm">2FA is Active</p>
                <p className="text-xs text-sky-700 mt-0.5">Your account is protected.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => { onToggle(false); toast.success('2FA disabled'); onClose(); }}
              className="w-full rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50">
              Disable Two-Factor Auth
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── SAVED TRIPS ───────────────────────────────────────────────────────────────

export function SavedTripsModal({ open, onClose }: any) {
  const { user } = useAuth();
  const [trips,   setTrips]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore listener — falls back to localStorage
  useEffect(() => {
    if (!open) return;

    if (!user) {
      // Guest: read from localStorage
      try {
        const stored = localStorage.getItem('gladys_saved_trips_guest');
        setTrips(stored ? JSON.parse(stored) : []);
      } catch { setTrips([]); }
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q,
      snap => { setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      _err  => {
        // Firestore error — fall back to localStorage
        try {
          const stored = localStorage.getItem(`gladys_saved_trips_${user.uid}`);
          setTrips(stored ? JSON.parse(stored) : []);
        } catch { setTrips([]); }
        setLoading(false);
      }
    );
    return () => unsub();
  }, [open, user]);

  const handleDelete = async (id: string) => {
    if (user) {
      try { await deleteDoc(doc(db, 'trips', id)); return; } catch {}
    }
    // Guest fallback
    const key = `gladys_saved_trips_${user?.uid ?? 'guest'}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
      localStorage.setItem(key, JSON.stringify(stored.filter((t: any) => t.id !== id)));
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Saved Trips</DialogTitle>
          <DialogDescription>Your saved trip itineraries</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
              Loading trips...
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm font-bold mb-1">No saved trips yet</p>
              <p className="text-slate-400 text-xs">Search for an event to start planning</p>
            </div>
          ) : (
            trips.map(t => (
              <div key={t.id}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-sky-200 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {t.eventName || t.destination}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {t.destination && t.eventName && (
                      <p className="text-xs text-slate-400 truncate">{t.destination}</p>
                    )}
                    <p className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Calendar size={9} />
                      {fmtDate(t.startDate || t.eventDate || t.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}
                  className="hover:bg-red-50 flex-shrink-0 ml-2">
                  <Trash2 size={13} className="text-red-400" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Link href="/trips" onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all">
            View All Trips
          </Link>
          <Button onClick={onClose} className={`${BTN} flex-1`}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────────

export function ActivityLogModal({ open, onClose }: any) {
  const activities = [
    { id: '1', action: 'Updated travel preferences', time: 'Today at 2:30 PM'     },
    { id: '2', action: 'Saved trip to Lakers game',  time: 'Yesterday at 5:15 PM' },
    { id: '3', action: 'Changed password',            time: '2 days ago'           },
  ];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Activity Log</DialogTitle>
          <DialogDescription>Recent account activity</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4 max-h-80 overflow-y-auto">
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                <History size={14} className="text-sky-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{a.action}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={10} />{a.time}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className={`${BTN} w-full`}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── EXPORT DATA ───────────────────────────────────────────────────────────────

export function ExportDataModal({ open, onClose, onExport }: any) {
  const [exporting, setExporting] = useState(false);
  const handle = async () => {
    setExporting(true); await onExport(); setExporting(false); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Export Your Data</DialogTitle>
          <DialogDescription>Download all your data as JSON</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-50 border border-sky-200">
            <Download size={18} className="text-sky-500 flex-shrink-0" />
            <p className="text-xs text-sky-800">Your export includes profile info, settings, travel documents, and saved trips. Payment card numbers are excluded for security.</p>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600">
            {['Profile information', 'Travel preferences & documents', 'Saved trips', 'Notification settings'].map(i => (
              <li key={i} className="flex items-center gap-2"><Check size={13} className="text-emerald-500" />{i}</li>
            ))}
            <li className="flex items-center gap-2"><X size={13} className="text-red-400" />Payment card numbers</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handle} disabled={exporting} className={`${BTN} flex items-center gap-2`}>
            {exporting
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Download size={15} /></motion.div>
              : <Download size={15} />
            }
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}