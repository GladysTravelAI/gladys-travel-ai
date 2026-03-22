// lib/email.ts
// Resend-based email utility for GladysTravel.com
// Install: npm install resend
// Env var needed: RESEND_API_KEY (from resend.com — free, 3000 emails/month)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = 'Gladys Travel <contact@gladystravel.com>';
const SKY            = '#0EA5E9';

// ─── Send helper ──────────────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return { success: false, error: 'API key not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[email] Resend error:', data);
      return { success: false, error: data.message };
    }

    console.log('[email] Sent:', data.id, '→', to);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[email] Network error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function emailWrapper(content: string, previewText: string = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Gladys Travel</title>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;</div>` : ''}
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;min-height:100vh;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="https://gladystravel.com" style="text-decoration:none;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#38BDF8,#0284C7);width:36px;height:36px;border-radius:10px;text-align:center;vertical-align:middle;">
                            <span style="color:white;font-weight:900;font-size:18px;line-height:36px;">G</span>
                          </td>
                          <td style="padding-left:10px;">
                            <span style="color:#0F172A;font-weight:800;font-size:16px;letter-spacing:-0.3px;">Gladys Travel</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td align="right">
                    <span style="color:#94A3B8;font-size:12px;font-weight:600;">gladystravel.com</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#FFFFFF;border-radius:24px;border:1.5px solid #E2E8F0;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              <p style="margin:0 0 8px 0;color:#94A3B8;font-size:12px;">
                © 2026 Gladys Travel · Johannesburg, South Africa
              </p>
              <p style="margin:0;color:#CBD5E1;font-size:11px;">
                You're receiving this because you have an account at
                <a href="https://gladystravel.com" style="color:#0EA5E9;text-decoration:none;">gladystravel.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── TEMPLATE 1: Welcome Email ────────────────────────────────────────────────

export function buildWelcomeEmail(name?: string) {
  const displayName = name ? name.split(' ')[0] : 'there';

  const html = emailWrapper(`
    <!-- HERO GRADIENT -->
    <tr>
      <td style="background:linear-gradient(135deg,#0EA5E9 0%,#0284C7 60%,#0369A1 100%);padding:48px 40px 40px;text-align:center;">
        <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:20px;margin:0 auto 20px;display:table-cell;vertical-align:middle;text-align:center;border:1.5px solid rgba(255,255,255,0.25);">
          <span style="font-size:36px;line-height:72px;display:inline-block;">✈️</span>
        </div>
        <h1 style="margin:0 0 8px;color:white;font-size:28px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">
          Welcome to Gladys Travel
        </h1>
        <p style="margin:0;color:rgba(255,255,255,0.80);font-size:16px;font-weight:500;">
          Your AI travel companion is ready
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:40px;">

        <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.6;">
          Hey ${displayName} 👋
        </p>
        <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">
          You're now part of Gladys Travel — the smartest way to plan trips around the events you love. Whether it's the World Cup, Coachella, or a Champions League final, Gladys turns your event into a complete trip plan in seconds.
        </p>

        <!-- FEATURE PILLS -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
          <tr>
            <td style="padding:0 0 12px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:36px;height:36px;background:#F0F9FF;border-radius:10px;text-align:center;line-height:36px;font-size:16px;">⚡</div>
                  </td>
                  <td style="vertical-align:top;padding-left:12px;">
                    <p style="margin:0 0 2px;color:#0F172A;font-size:14px;font-weight:700;">Instant trip plans</p>
                    <p style="margin:0;color:#64748B;font-size:13px;line-height:1.5;">Search any event and get a full itinerary with hotels, flights, and tickets in one place.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 12px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:36px;height:36px;background:#F0F9FF;border-radius:10px;text-align:center;line-height:36px;font-size:16px;">🎯</div>
                  </td>
                  <td style="vertical-align:top;padding-left:12px;">
                    <p style="margin:0 0 2px;color:#0F172A;font-size:14px;font-weight:700;">Events first, travel second</p>
                    <p style="margin:0;color:#64748B;font-size:13px;line-height:1.5;">Browse thousands of upcoming events — sports, music, festivals — and plan around what matters to you.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:36px;height:36px;background:#F0F9FF;border-radius:10px;text-align:center;line-height:36px;font-size:16px;">🤖</div>
                  </td>
                  <td style="vertical-align:top;padding-left:12px;">
                    <p style="margin:0 0 2px;color:#0F172A;font-size:14px;font-weight:700;">Talk to Gladys AI</p>
                    <p style="margin:0;color:#64748B;font-size:13px;line-height:1.5;">Ask anything — visa info, packing lists, weather, flights. Gladys has 13 live tools ready for you.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA BUTTON -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;">
          <tr>
            <td>
              <a href="https://gladystravel.com/events"
                 style="display:inline-block;background:linear-gradient(135deg,#38BDF8,#0284C7);color:white;text-decoration:none;font-size:15px;font-weight:800;padding:14px 32px;border-radius:14px;letter-spacing:-0.2px;">
                Explore Upcoming Events →
              </a>
            </td>
          </tr>
        </table>

        <!-- DIVIDER -->
        <hr style="border:none;border-top:1.5px solid #F1F5F9;margin:0 0 24px;" />

        <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
          Questions? Reply to this email or contact us at
          <a href="mailto:contact@gladystravel.com" style="color:${SKY};text-decoration:none;font-weight:600;">contact@gladystravel.com</a>
          · +27 64 545 2236
        </p>

      </td>
    </tr>
  `, `Welcome to Gladys Travel — your AI travel companion is ready`);

  return html;
}

// ─── TEMPLATE 2: Trip Confirmation Email ─────────────────────────────────────

export interface TripEmailData {
  userName?:      string;
  eventName:      string;
  eventType?:     'sports' | 'music' | 'festivals' | 'other';
  eventDate?:     string;
  venue?:         string;
  destination:    string;
  country:        string;
  startDate:      string;
  endDate:        string;
  travelers?:     number;
  budget?:        string;
  estimatedTotal: number;
  currency?:      string;
  items?: {
    hotels?:     number;
    flights?:    number;
    activities?: number;
  };
}

export function buildTripEmail(trip: TripEmailData) {
  const displayName = trip.userName ? trip.userName.split(' ')[0] : 'there';
  const currency    = trip.currency || 'USD';
  const nights      = trip.startDate && trip.endDate
    ? Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000))
    : 1;

  const eventEmoji = {
    sports:   '⚽',
    music:    '🎵',
    festivals:'🎉',
    other:    '🎫',
  }[trip.eventType ?? 'other'] ?? '🎫';

  const gradients = {
    sports:   'linear-gradient(135deg,#0EA5E9 0%,#0369A1 100%)',
    music:    'linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%)',
    festivals:'linear-gradient(135deg,#F97316 0%,#DC2626 100%)',
    other:    'linear-gradient(135deg,#475569 0%,#1E293B 100%)',
  }[trip.eventType ?? 'other'] ?? 'linear-gradient(135deg,#0EA5E9,#0284C7)';

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };

  const html = emailWrapper(`
    <!-- HERO -->
    <tr>
      <td style="background:${gradients};padding:48px 40px 40px;text-align:center;">
        <div style="font-size:44px;margin-bottom:16px;">${eventEmoji}</div>
        <h1 style="margin:0 0 8px;color:white;font-size:24px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">
          Your Trip is Saved!
        </h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;font-weight:500;">
          ${trip.eventName}
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:40px;">

        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">
          Hey ${displayName} 🙌 — here's a summary of your saved trip. Gladys has it locked in for you.
        </p>

        <!-- TRIP CARD -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#F8FAFC;border-radius:16px;border:1.5px solid #E2E8F0;margin:0 0 28px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1.5px solid #E2E8F0;">
              <p style="margin:0 0 4px;color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Destination</p>
              <p style="margin:0;color:#0F172A;font-size:18px;font-weight:800;">${trip.destination}, ${trip.country}</p>
              ${trip.venue ? `<p style="margin:4px 0 0;color:#64748B;font-size:13px;">📍 ${trip.venue}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="padding:16px 24px;border-right:1.5px solid #E2E8F0;">
                    <p style="margin:0 0 4px;color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Check In</p>
                    <p style="margin:0;color:#0F172A;font-size:14px;font-weight:700;">${formatDate(trip.startDate)}</p>
                  </td>
                  <td width="50%" style="padding:16px 24px;">
                    <p style="margin:0 0 4px;color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Check Out</p>
                    <p style="margin:0;color:#0F172A;font-size:14px;font-weight:700;">${formatDate(trip.endDate)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0;border-top:1.5px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${trip.travelers ? `
                  <td width="33%" style="padding:16px 24px;text-align:center;border-right:1.5px solid #E2E8F0;">
                    <p style="margin:0 0 2px;color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Travelers</p>
                    <p style="margin:0;color:#0F172A;font-size:18px;font-weight:900;">${trip.travelers}</p>
                  </td>` : ''}
                  <td style="padding:16px 24px;text-align:center;${trip.travelers ? 'border-right:1.5px solid #E2E8F0;' : ''}">
                    <p style="margin:0 0 2px;color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Nights</p>
                    <p style="margin:0;color:#0F172A;font-size:18px;font-weight:900;">${nights}</p>
                  </td>
                  <td style="padding:16px 24px;text-align:center;">
                    <p style="margin:0 0 2px;color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Est. Total</p>
                    <p style="margin:0;color:#0F172A;font-size:18px;font-weight:900;">${currency} ${trip.estimatedTotal.toLocaleString()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- WHAT'S INCLUDED -->
        ${(trip.items?.hotels || trip.items?.flights || trip.items?.activities) ? `
        <p style="margin:0 0 12px;color:#0F172A;font-size:14px;font-weight:700;">What's in your trip plan:</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
          ${trip.items?.hotels ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:28px;font-size:16px;">🏨</td>
                  <td style="padding-left:10px;color:#334155;font-size:14px;">${trip.items.hotels} hotel${trip.items.hotels > 1 ? 's' : ''} saved</td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
          ${trip.items?.flights ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:28px;font-size:16px;">✈️</td>
                  <td style="padding-left:10px;color:#334155;font-size:14px;">${trip.items.flights} flight${trip.items.flights > 1 ? 's' : ''} saved</td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
          ${trip.items?.activities ? `
          <tr>
            <td style="padding:8px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:28px;font-size:16px;">🎫</td>
                  <td style="padding-left:10px;color:#334155;font-size:14px;">${trip.items.activities} activit${trip.items.activities > 1 ? 'ies' : 'y'} saved</td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
        </table>` : ''}

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;">
          <tr>
            <td>
              <a href="https://gladystravel.com"
                 style="display:inline-block;background:linear-gradient(135deg,#38BDF8,#0284C7);color:white;text-decoration:none;font-size:15px;font-weight:800;padding:14px 32px;border-radius:14px;letter-spacing:-0.2px;">
                View Your Trip Plan →
              </a>
            </td>
          </tr>
        </table>

        <!-- NEXT STEPS -->
        <div style="background:#F0F9FF;border-radius:14px;border:1.5px solid #BAE6FD;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 10px;color:#0369A1;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">💡 Next steps</p>
          <p style="margin:0 0 6px;color:#0C4A6E;font-size:13px;line-height:1.6;">
            • Book your flights early — prices rise as the event gets closer
          </p>
          <p style="margin:0 0 6px;color:#0C4A6E;font-size:13px;line-height:1.6;">
            • Compare hotel prices on Booking.com and Agoda for the best rates
          </p>
          <p style="margin:0;color:#0C4A6E;font-size:13px;line-height:1.6;">
            • Grab your tickets before they sell out — check Ticketmaster and StubHub
          </p>
        </div>

        <hr style="border:none;border-top:1.5px solid #F1F5F9;margin:0 0 24px;" />

        <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
          Questions? Reply to this email or reach us at
          <a href="mailto:contact@gladystravel.com" style="color:${SKY};text-decoration:none;font-weight:600;">contact@gladystravel.com</a>
        </p>

      </td>
    </tr>
  `, `Trip saved: ${trip.eventName} in ${trip.destination}`);

  return html;
}