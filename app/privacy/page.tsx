import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

const font = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const EFFECTIVE_DATE = '1 April 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: font }}>
      <Navbar />

      {/* Header */}
      <div className="pt-28 pb-12 px-4 sm:px-6 border-b border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-slate-500">Effective date: {EFFECTIVE_DATE} · GladysTravel.com</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-sky-500">

          <p className="text-lg text-slate-700 leading-relaxed border-l-4 pl-5 mb-10" style={{ borderColor: '#0EA5E9' }}>
            GladysTravel.com (&quot;Gladys&quot;, &quot;we&quot;, &quot;our&quot;) is operated by GladysTravel AI from Johannesburg, South Africa. We respect your privacy and are committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) and, where applicable, the General Data Protection Regulation (GDPR).
          </p>

          <Section title="1. Information We Collect">
            <p>We collect the following information when you use GladysTravel.com:</p>
            <ul>
              <li><strong>Account information</strong> — when you sign up via email/password or Google, we collect your name, email address, and profile photo (if provided by Google).</li>
              <li><strong>Trip preferences</strong> — budget level, travel style, home airport, currency preference and other settings you save in your profile.</li>
              <li><strong>Search queries</strong> — the events and destinations you search for, to improve results and personalise your experience.</li>
              <li><strong>Usage data</strong> — pages visited, features used, session duration — collected via Google Analytics 4.</li>
              <li><strong>Device information</strong> — browser type, operating system, screen size — used to optimise the interface for your device.</li>
            </ul>
            <p>We do <strong>not</strong> collect payment card details. All bookings happen on partner sites (Booking.com, Ticketmaster, etc.) and payment is handled entirely by them.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul>
              <li>To generate personalised travel itineraries and recommendations</li>
              <li>To send transactional emails — welcome emails, trip confirmations (via Resend)</li>
              <li>To improve our AI responses and search quality</li>
              <li>To analyse usage patterns and fix bugs (via Google Analytics 4)</li>
              <li>To remember your preferences across sessions</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal data to third parties. We do not use your data for advertising profiling.</p>
          </Section>

          <Section title="3. Third-Party Services">
            <p>GladysTravel.com integrates with the following third-party services. Each has its own privacy policy:</p>
            <ul>
              <li><strong>Firebase (Google)</strong> — authentication and user data storage. <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Firebase Privacy</a></li>
              <li><strong>OpenAI</strong> — powers itinerary generation and chat responses. <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">OpenAI Privacy</a></li>
              <li><strong>Vapi</strong> — powers the Gladys voice assistant. <a href="https://vapi.ai/privacy" target="_blank" rel="noopener noreferrer">Vapi Privacy</a></li>
              <li><strong>Ticketmaster</strong> — provides event data. <a href="https://www.ticketmaster.com/h/privacy.html" target="_blank" rel="noopener noreferrer">Ticketmaster Privacy</a></li>
              <li><strong>Foursquare</strong> — provides local places data (restaurants, attractions). <a href="https://foursquare.com/legal/privacy" target="_blank" rel="noopener noreferrer">Foursquare Privacy</a></li>
              <li><strong>Resend</strong> — sends transactional emails on our behalf. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Resend Privacy</a></li>
              <li><strong>Google Analytics 4</strong> — website analytics. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy</a></li>
              <li><strong>Travelpayouts</strong> — affiliate network for Yesim, Airalo, Kiwitaxi, GetTransfer, AirHelp and EKTA. <a href="https://travelpayouts.com/en/privacy" target="_blank" rel="noopener noreferrer">Travelpayouts Privacy</a></li>
              <li><strong>Vercel</strong> — hosting infrastructure. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy</a></li>
            </ul>
          </Section>

          <Section title="4. Affiliate Disclosure">
            <p>
              GladysTravel.com participates in affiliate programmes. When you click a link to a partner service (such as Yesim, Airalo, Kiwitaxi, GetTransfer, AirHelp or EKTA) and make a purchase, we may earn a commission at no extra cost to you.
            </p>
            <p>
              These affiliate relationships do not influence the travel recommendations Gladys AI generates. Our itineraries and suggestions are based entirely on what is best for your trip.
            </p>
            <p>Partner links are marked with external link indicators. Affiliate commissions help keep GladysTravel.com free to use.</p>
          </Section>

          <Section title="5. Cookies">
            <p>We use the following cookies:</p>
            <ul>
              <li><strong>Authentication cookies</strong> — set by Firebase to keep you signed in across sessions.</li>
              <li><strong>Analytics cookies</strong> — set by Google Analytics 4 to understand how visitors use the site. These are anonymised where possible.</li>
              <li><strong>Preference cookies</strong> — stored in your browser&apos;s localStorage to remember your theme (dark/light) and settings.</li>
            </ul>
            <p>You can clear cookies at any time via your browser settings. Clearing authentication cookies will sign you out.</p>
          </Section>

          <Section title="6. Data Retention">
            <ul>
              <li><strong>Account data</strong> — retained for as long as your account is active. Deleted within 30 days of account deletion request.</li>
              <li><strong>Trip data</strong> — itineraries stored in your browser localStorage and optionally in Firestore. You can clear these at any time in Settings.</li>
              <li><strong>Analytics data</strong> — retained by Google Analytics for 14 months (Google&apos;s default).</li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p>Under POPIA (South Africa) and GDPR (EU/UK), you have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — ask us to correct inaccurate data</li>
              <li><strong>Deletion</strong> — request that we delete your account and associated data</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong>Objection</strong> — opt out of analytics tracking</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:contact@gladystravel.com">contact@gladystravel.com</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>GladysTravel.com is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we do, we will update the effective date at the top of this page. Continued use of GladysTravel.com after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="10. Contact">
            <p>For privacy-related questions or requests:</p>
            <ul>
              <li>Email: <a href="mailto:contact@gladystravel.com">contact@gladystravel.com</a></li>
              <li>Phone: +27 64 545 2236</li>
              <li>Address: Johannesburg, South Africa</li>
            </ul>
          </Section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-black text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}