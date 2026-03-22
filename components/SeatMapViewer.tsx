'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, ChevronRight, ExternalLink, ZoomIn,
  ZoomOut, Maximize2, X, Info,
} from 'lucide-react';

const SKY = '#0EA5E9';

interface SeatMapViewerProps {
  eventName?:   string;
  venue?:       string;
  ticketUrl?:   string;
  seatmapUrl?:  string; // Ticketmaster provides this on some events
  accentColor?: string;
  // User's own ticket details (optional — can enter manually)
  section?:     string;
  row?:         string;
  seat?:        string;
}

export default function SeatMapViewer({
  eventName, venue, ticketUrl, seatmapUrl,
  accentColor, section, row, seat,
}: SeatMapViewerProps) {
  const accent = accentColor || SKY;

  const [expanded,   setExpanded]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mySection,  setMySection]  = useState(section || '');
  const [myRow,      setMyRow]      = useState(row || '');
  const [mySeat,     setMySeat]     = useState(seat || '');
  const [editMode,   setEditMode]   = useState(!section);

  const hasTicketDetails = mySection || myRow || mySeat;

  // Tips per section type
  const getSectionTips = (sec: string) => {
    const s = sec.toLowerCase();
    if (s.includes('floor') || s.includes('pit'))
      return ['Standing area — wear comfortable shoes', 'Arrive early for best position', 'Earplugs recommended near the stage'];
    if (s.includes('vip') || s.includes('box') || s.includes('suite'))
      return ['Premium area — check lounge access', 'Dedicated entrance may be available', 'Complimentary drinks may be included'];
    if (s.includes('upper') || s.includes('balcony') || s.includes('tier'))
      return ['Great overview of the stage/pitch', 'Bring binoculars for best view', 'Usually easier to access and exit'];
    return ['Check the venue map for your exact location', 'Arrive 30–45 mins early to find your seat', 'Screenshot your ticket QR code in case of no signal'];
  };

  return (
    <>
      <div className="rounded-3xl overflow-hidden border-2 border-slate-100 bg-white">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: accent + '15' }}>
            <Ticket size={20} style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-sm">Seat Map & Tickets</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {hasTicketDetails
                ? `Section ${mySection}${myRow ? ` · Row ${myRow}` : ''}${mySeat ? ` · Seat ${mySeat}` : ''}`
                : venue || 'View seat map and ticket details'
              }
            </p>
          </div>
          <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-5 space-y-4">

                {/* Seat Map — Ticketmaster embed or generic */}
                {seatmapUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900">
                    <img
                      src={seatmapUrl}
                      alt={`Seat map for ${eventName ?? venue}`}
                      className="w-full object-contain max-h-64"
                    />
                    <button
                      onClick={() => setFullscreen(true)}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                ) : (
                  // Generic seat map placeholder with venue iframe
                  <div className="rounded-2xl overflow-hidden bg-slate-100 relative">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(venue ? `${venue} seating map` : 'stadium seating')}&zoom=16`}
                      className="w-full h-48 border-0"
                      allowFullScreen
                      loading="lazy"
                      title="Venue map"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl">
                      <div className="text-center text-white p-4">
                        <Ticket size={28} className="mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-bold mb-1">Seat map not available</p>
                        <p className="text-xs opacity-60 mb-3">Check your ticket app for the seating chart</p>
                        {ticketUrl && (
                          <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white"
                            style={{ background: `linear-gradient(135deg, #38BDF8, #0284C7)` }}>
                            <ExternalLink size={11} />
                            View Tickets
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* My Ticket Details */}
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background: accent + '08', border: `1.5px solid ${accent}20` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
                      🎫 My Ticket
                    </p>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="text-xs font-bold transition-colors"
                      style={{ color: accent }}
                    >
                      {editMode ? 'Done' : 'Edit'}
                    </button>
                  </div>

                  {editMode ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Section', val: mySection, set: setMySection, ph: 'e.g. A1' },
                        { label: 'Row',     val: myRow,     set: setMyRow,     ph: 'e.g. 12' },
                        { label: 'Seat',    val: mySeat,    set: setMySeat,    ph: 'e.g. 5'  },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                            {f.label}
                          </label>
                          <input
                            type="text"
                            value={f.val}
                            onChange={e => f.set(e.target.value.toUpperCase())}
                            placeholder={f.ph}
                            className="w-full h-9 px-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-center text-slate-900 outline-none focus:border-sky-400 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  ) : hasTicketDetails ? (
                    <div className="flex items-center gap-4">
                      {mySection && (
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Section</p>
                          <p className="text-2xl font-black text-slate-900">{mySection}</p>
                        </div>
                      )}
                      {myRow && (
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Row</p>
                          <p className="text-2xl font-black text-slate-900">{myRow}</p>
                        </div>
                      )}
                      {mySeat && (
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Seat</p>
                          <p className="text-2xl font-black text-slate-900">{mySeat}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Add your seat details above to get personalised tips for your section.
                    </p>
                  )}
                </div>

                {/* Section tips */}
                {mySection && !editMode && (
                  <div className="rounded-2xl p-4 bg-amber-50 border-2 border-amber-100 space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                      <Info size={11} />Tips for Section {mySection}
                    </p>
                    {getSectionTips(mySection).map((tip, i) => (
                      <p key={i} className="text-xs text-amber-800 flex gap-2">
                        <span className="text-amber-400 flex-shrink-0">—</span>{tip}
                      </p>
                    ))}
                  </div>
                )}

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  {ticketUrl && (
                    <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white transition-opacity hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, #38BDF8, #0284C7)` }}>
                      <ExternalLink size={12} />Buy / View Tickets
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${venue ?? ''} seating chart`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 transition-all"
                  >
                    🔍 Find Seat Chart
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen seat map modal */}
      <AnimatePresence>
        {fullscreen && seatmapUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-3xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={seatmapUrl} alt="Seat map" className="w-full rounded-2xl" />
              <button
                onClick={() => setFullscreen(false)}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} className="text-slate-700" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}