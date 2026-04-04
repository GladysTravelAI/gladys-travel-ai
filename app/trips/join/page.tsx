'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/AuthContext';
import { getTripByInviteCode, joinTrip } from '@/lib/tripService';
import type { Trip } from '@/types/trip';

const SKY = '#0EA5E9';

export default function JoinTripPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { user, loading: authLoading } = useAuth();

  const codeFromUrl = searchParams?.get('code')?.toUpperCase() ?? '';
  const [code,    setCode]    = useState(codeFromUrl);
  const [trip,    setTrip]    = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState<'enter' | 'preview' | 'joining' | 'done'>('enter');

  // Auto-lookup if code provided in URL
  useEffect(() => {
    if (codeFromUrl.length === 6) lookupCode(codeFromUrl);
  }, [codeFromUrl]);

  const lookupCode = async (c: string) => {
    setLoading(true); setError('');
    try {
      const found = await getTripByInviteCode(c);
      if (!found) { setError('Trip not found. Double-check the code.'); setStep('enter'); return; }
      setTrip(found);
      setStep('preview');
    } catch {
      setError('Could not look up trip. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !trip) return;
    setStep('joining');
    try {
      await joinTrip(trip.id, user.uid, user.displayName ?? 'Traveller', user.email ?? '');
      setStep('done');
      setTimeout(() => router.push(`/trips/${trip.id}`), 1200);
    } catch {
      setError('Failed to join. Try again.');
      setStep('preview');
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-sm">

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: '#F0F9FF' }}>
            <Users size={28} style={{ color: SKY }} />
          </div>

          {step === 'enter' && (
            <>
              <h1 className="text-2xl font-black text-slate-900 text-center mb-2">Join a Group Trip</h1>
              <p className="text-slate-400 text-sm text-center mb-8">Enter the 6-character invite code from your trip organiser</p>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="ABC123"
                maxLength={6}
                className="w-full h-14 text-center text-2xl font-black tracking-widest border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-400 transition-all mb-3 uppercase"
              />
              {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
              <button
                onClick={() => lookupCode(code)}
                disabled={code.length < 6 || loading}
                className="w-full h-12 rounded-2xl text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                {loading ? 'Looking up...' : 'Find Trip →'}
              </button>
            </>
          )}

          {step === 'preview' && trip && (
            <>
              <h1 className="text-xl font-black text-slate-900 text-center mb-2">You&apos;re invited!</h1>
              <p className="text-slate-400 text-sm text-center mb-6">Here&apos;s the trip you&apos;re joining</p>

              <div className="rounded-3xl border-2 border-slate-100 overflow-hidden mb-6">
                <div className="p-5 bg-slate-900">
                  <p className="text-white font-black text-lg">{trip.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{trip.destinationCity || trip.destination}</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Dates</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Crew size</span>
                    <span className="font-semibold text-slate-900">{trip.memberCount} {trip.memberCount === 1 ? 'person' : 'people'} so far</span>
                  </div>
                  {trip.eventName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Event</span>
                      <span className="font-semibold text-slate-900">{trip.eventName}</span>
                    </div>
                  )}
                </div>
              </div>

              {!user ? (
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-4">Sign in to join this trip</p>
                  <button onClick={() => router.push(`/signin?redirect=/trips/join?code=${trip.inviteCode}`)}
                    className="w-full h-12 rounded-2xl text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    Sign in to Join
                  </button>
                </div>
              ) : (
                <>
                  {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
                  <button onClick={handleJoin}
                    className="w-full h-12 rounded-2xl text-white font-bold text-sm active:scale-[0.97] transition-all"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    Join Trip →
                  </button>
                </>
              )}
            </>
          )}

          {step === 'joining' && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">Joining trip...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-xl font-black text-slate-900 mb-2">You&apos;re in!</p>
              <p className="text-slate-400 text-sm">Taking you to the trip...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}