// components/settings/SettingsModals-Part2.tsx
// Remaining modals for world-class settings page

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plane, FileText, CreditCard, User, Shield, Key, Bookmark, 
  History, Download, Plus, Trash2, Check, X, Calendar,
  MapPin, DollarSign, Clock, AlertCircle, CheckCircle, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

// ==================== TRAVEL PREFERENCES MODAL ====================

export function TravelPrefsModal({ open, onClose, settings, onSave }: any) {
  const [prefs, setPrefs] = useState(settings.travelPrefs);

  const handleSave = () => {
    onSave({ travelPrefs: prefs });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Travel Preferences</DialogTitle>
          <DialogDescription>
            These preferences sync with Gladys AI for personalized recommendations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Budget Preference */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
              <DollarSign size={16} />
              Default Budget
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['budget', 'moderate', 'luxury'].map((budget) => (
                <button
                  key={budget}
                  onClick={() => setPrefs({ ...prefs, budget })}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    prefs.budget === budget
                      ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {budget.charAt(0).toUpperCase() + budget.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Trip Style */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
              <Plane size={16} />
              Trip Style
            </label>
            <select 
              className="w-full h-12 px-4 py-2 border-2 border-amber-200 dark:border-amber-800 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-medium"
              value={prefs.tripStyle}
              onChange={(e) => setPrefs({ ...prefs, tripStyle: e.target.value })}
            >
              <option value="adventure">Adventure</option>
              <option value="relaxation">Relaxation</option>
              <option value="cultural">Cultural</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>

          {/* Seat Preference */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">
              Seat Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'window', label: 'Window', icon: '🪟' },
                { value: 'aisle', label: 'Aisle', icon: '🚶' },
                { value: 'no-preference', label: 'No Pref', icon: '❓' }
              ].map((seat) => (
                <button
                  key={seat.value}
                  onClick={() => setPrefs({ ...prefs, seatPreference: seat.value })}
                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                    prefs.seatPreference === seat.value
                      ? 'bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/20 dark:to-purple-900/20 border-2 border-amber-500'
                      : 'bg-gray-100 dark:bg-zinc-800 border-2 border-transparent hover:border-amber-200'
                  }`}
                >
                  <span className="block text-lg mb-1">{seat.icon}</span>
                  <span className="font-medium">{seat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meal Preference */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
              Meal Preference
            </label>
            <Input 
              value={prefs.mealPreference}
              onChange={(e) => setPrefs({ ...prefs, mealPreference: e.target.value })}
              placeholder="e.g., Vegetarian, Halal, Gluten-free"
              className="h-12 rounded-xl border-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="btn-premium">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TRAVEL DOCUMENTS MODAL ====================

export function TravelDocsModal({ open, onClose, settings, onSave }: any) {
  const [docs, setDocs] = useState(settings.travelDocs);

  const addFrequentFlyer = () => {
    setDocs({
      ...docs,
      frequentFlyer: [...docs.frequentFlyer, { airline: '', number: '' }]
    });
  };

  const removeFrequentFlyer = (index: number) => {
    const updated = docs.frequentFlyer.filter((_: any, i: number) => i !== index);
    setDocs({ ...docs, frequentFlyer: updated });
  };

  const updateFrequentFlyer = (index: number, field: string, value: string) => {
    const updated = [...docs.frequentFlyer];
    updated[index] = { ...updated[index], [field]: value };
    setDocs({ ...docs, frequentFlyer: updated });
  };

  const handleSave = () => {
    onSave({ travelDocs: docs });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Travel Documents</DialogTitle>
          <DialogDescription>Securely store your travel information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Passport */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Passport Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                  Passport Number
                </label>
                <Input 
                  value={docs.passportNumber}
                  onChange={(e) => setDocs({ ...docs, passportNumber: e.target.value })}
                  placeholder="A12345678"
                  className="h-12 rounded-xl border-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                  Expiry Date
                </label>
                <Input 
                  type="date"
                  value={docs.passportExpiry}
                  onChange={(e) => setDocs({ ...docs, passportExpiry: e.target.value })}
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>
          </div>

          {/* TSA PreCheck */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-green-600" />
              TSA PreCheck / Global Entry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                  TSA PreCheck Number
                </label>
                <Input 
                  value={docs.tsaPrecheck}
                  onChange={(e) => setDocs({ ...docs, tsaPrecheck: e.target.value })}
                  placeholder="1234567890"
                  className="h-12 rounded-xl border-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                  Known Traveler Number
                </label>
                <Input 
                  value={docs.knownTravelerNumber}
                  onChange={(e) => setDocs({ ...docs, knownTravelerNumber: e.target.value })}
                  placeholder="1234567890"
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>
          </div>

          {/* Frequent Flyer Programs */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plane size={18} className="text-purple-600" />
                Frequent Flyer Programs
              </h3>
              <Button onClick={addFrequentFlyer} size="sm" className="btn-premium flex items-center gap-1">
                <Plus size={16} />
                Add
              </Button>
            </div>
            
            {docs.frequentFlyer.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No frequent flyer programs added yet
              </p>
            ) : (
              <div className="space-y-3">
                {docs.frequentFlyer.map((ff: any, index: number) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                        Airline
                      </label>
                      <Input 
                        value={ff.airline}
                        onChange={(e) => updateFrequentFlyer(index, 'airline', e.target.value)}
                        placeholder="e.g., Delta, United"
                        className="h-10 rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                        Number
                      </label>
                      <Input 
                        value={ff.number}
                        onChange={(e) => updateFrequentFlyer(index, 'number', e.target.value)}
                        placeholder="1234567890"
                        className="h-10 rounded-lg"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFrequentFlyer(index)}
                      className="h-10 px-3 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="btn-premium">Save Documents</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== PAYMENT METHODS MODAL ====================

export function PaymentMethodsModal({ open, onClose, settings, onSave }: any) {
  const [methods, setMethods] = useState(settings.paymentMethods);
  const [addingNew, setAddingNew] = useState(false);
  const [newCard, setNewCard] = useState({
    last4: '',
    brand: 'Visa',
    expiryMonth: '',
    expiryYear: ''
  });

  const addPaymentMethod = () => {
    const newMethod = {
      id: `card-${Date.now()}`,
      type: 'card',
      ...newCard,
      isDefault: methods.length === 0
    };
    setMethods([...methods, newMethod]);
    setAddingNew(false);
    setNewCard({ last4: '', brand: 'Visa', expiryMonth: '', expiryYear: '' });
  };

  const removeMethod = (id: string) => {
    setMethods(methods.filter((m: any) => m.id !== id));
  };

  const setDefault = (id: string) => {
    setMethods(methods.map((m: any) => ({ ...m, isDefault: m.id === id })));
  };

  const handleSave = () => {
    onSave({ paymentMethods: methods });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Payment Methods</DialogTitle>
          <DialogDescription>Manage your saved payment methods</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Cards */}
          {methods.map((method: any) => (
            <div key={method.id} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-700 p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeMethod(method.id)}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
              {method.isDefault ? (
                <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <CheckCircle size={12} />
                  Default
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDefault(method.id)}
                  className="text-xs h-7"
                >
                  Set as Default
                </Button>
              )}
            </div>
          ))}

          {/* Add New Card */}
          {!addingNew ? (
            <Button 
              onClick={() => setAddingNew(true)}
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/10"
            >
              <Plus size={18} className="mr-2" />
              Add Payment Method
            </Button>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/10 dark:to-purple-900/10 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">New Card</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Card Brand
                  </label>
                  <select 
                    className="w-full h-10 px-3 border-2 border-amber-200 dark:border-amber-800 rounded-lg bg-white dark:bg-zinc-900"
                    value={newCard.brand}
                    onChange={(e) => setNewCard({ ...newCard, brand: e.target.value })}
                  >
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>American Express</option>
                    <option>Discover</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Last 4 Digits
                  </label>
                  <Input 
                    value={newCard.last4}
                    onChange={(e) => setNewCard({ ...newCard, last4: e.target.value })}
                    placeholder="1234"
                    maxLength={4}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                      Exp Month
                    </label>
                    <Input 
                      value={newCard.expiryMonth}
                      onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                      placeholder="12"
                      maxLength={2}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                      Exp Year
                    </label>
                    <Input 
                      value={newCard.expiryYear}
                      onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                      placeholder="2026"
                      maxLength={4}
                      className="h-10 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddingNew(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={addPaymentMethod}
                    className="flex-1 btn-premium"
                  >
                    Add Card
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="btn-premium w-full">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== EMERGENCY CONTACT MODAL ====================

export function EmergencyContactModal({ open, onClose, settings, onSave }: any) {
  const [contact, setContact] = useState(settings.emergencyContact);

  const handleSave = () => {
    onSave({ emergencyContact: contact });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Emergency Contact</DialogTitle>
          <DialogDescription>Who should we contact in case of emergency?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-400">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>This information will only be used in case of emergency during your travels.</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
              Full Name
            </label>
            <Input 
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
              placeholder="Jane Doe"
              className="h-12 rounded-xl border-2"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
              Relationship
            </label>
            <Input 
              value={contact.relationship}
              onChange={(e) => setContact({ ...contact, relationship: e.target.value })}
              placeholder="Spouse, Parent, Sibling, Friend"
              className="h-12 rounded-xl border-2"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
              Phone Number
            </label>
            <Input 
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+27 123 456 789"
              className="h-12 rounded-xl border-2"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
              Email Address
            </label>
            <Input 
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="jane@example.com"
              className="h-12 rounded-xl border-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="btn-premium">Save Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TWO-FACTOR AUTH MODAL ====================

export function TwoFactorModal({ open, onClose, enabled, onToggle }: any) {
  const [showQR, setShowQR] = useState(false);

  const handleEnable = () => {
    setShowQR(true);
  };

  const handleConfirm = () => {
    onToggle(true);
    toast.success("Two-factor authentication enabled!");
    onClose();
  };

  const handleDisable = () => {
    onToggle(false);
    toast.success("Two-factor authentication disabled");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Two-Factor Authentication</DialogTitle>
          <DialogDescription>Add an extra layer of security to your account</DialogDescription>
        </DialogHeader>

        {!enabled ? (
          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Shield className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-green-900 dark:text-green-100 mb-1">Enhanced Security</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Protect your account with two-factor authentication using an authenticator app.
                  </p>
                </div>
              </div>
            </div>

            {!showQR ? (
              <Button onClick={handleEnable} className="btn-premium w-full">
                Enable Two-Factor Auth
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-700 dark:to-zinc-600 rounded-xl flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">QR Code</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Or enter code manually: ABCD-EFGH-IJKL
                  </p>
                </div>
                <Input 
                  placeholder="Enter verification code"
                  className="h-12 rounded-xl border-2 text-center font-mono text-lg"
                />
                <Button onClick={handleConfirm} className="btn-premium w-full">
                  Verify & Enable
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-blue-600" size={24} />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100">2FA is Active</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your account is protected with two-factor authentication.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleDisable}
              variant="outline"
              className="w-full rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
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

// ==================== SAVED TRIPS MODAL ====================

export function SavedTripsModal({ open, onClose }: any) {
  // Mock saved trips - in production, fetch from API
  const savedTrips = [
    {
      id: '1',
      destination: 'Lakers vs Celtics - Los Angeles',
      date: 'March 15, 2026',
      status: 'Saved',
      image: null
    },
    {
      id: '2',
      destination: 'Taylor Swift - Paris',
      date: 'May 20, 2026',
      status: 'Saved',
      image: null
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Saved Trips</DialogTitle>
          <DialogDescription>Your saved trip itineraries</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
          {savedTrips.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No saved trips yet</p>
            </div>
          ) : (
            savedTrips.map((trip) => (
              <div key={trip.id} className="bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/10 dark:to-purple-900/10 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{trip.destination}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <Calendar size={14} />
                      {trip.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                      {trip.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="btn-premium w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== ACTIVITY LOG MODAL ====================

export function ActivityLogModal({ open, onClose }: any) {
  // Mock activity log - in production, fetch from API
  const activities = [
    {
      id: '1',
      action: 'Updated travel preferences',
      timestamp: 'Today at 2:30 PM',
      ip: '41.xxx.xxx.xxx'
    },
    {
      id: '2',
      action: 'Saved trip to Lakers game',
      timestamp: 'Yesterday at 5:15 PM',
      ip: '41.xxx.xxx.xxx'
    },
    {
      id: '3',
      action: 'Added payment method',
      timestamp: '2 days ago',
      ip: '41.xxx.xxx.xxx'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Activity Log</DialogTitle>
          <DialogDescription>Recent account activity</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <History size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <Clock size={12} />
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {activity.ip}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="btn-premium w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== EXPORT DATA MODAL ====================

export function ExportDataModal({ open, onClose, onExport }: any) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await onExport();
    setExporting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Export Your Data</DialogTitle>
          <DialogDescription>Download all your data in JSON format</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Download className="text-blue-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">GDPR Compliance</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your export will include all personal data, settings, travel documents, and activity history.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Export includes:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" />
                Profile information
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" />
                Travel preferences & documents
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" />
                Saved trips & favorites
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" />
                Activity history
              </li>
              <li className="flex items-center gap-2">
                <X size={14} className="text-red-600" />
                Payment card numbers (for security)
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={handleExport}
            disabled={exporting}
            className="btn-premium flex items-center gap-2"
          >
            {exporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Download size={18} />
                </motion.div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}