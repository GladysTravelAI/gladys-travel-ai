import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

const font = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const EFFECTIVE_DATE = '1 April 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: font }}>
      <Navbar />

      {/* Header */}
      <div className="pt-28 pb-12 px-4 sm:px-6 border-b border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">Terms of Service</h1>
          <p className="text-slate-500">Effective date: {EFFECTIVE_DATE} · GladysTravel.com</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-10">

          <p className="text-lg text-slate-700 leading-relaxed border-l-4 pl-5" style={{ borderColor: '#0EA5E9' }}>
            By accessing or using GladysTravel.com (&quot;Gladys&quot;, &quot;the Service&quot;), you agree to these Terms of Service. If you do not agree, please do not use the Service. These terms are governed by the laws of South Africa.
          </p>

          <Section title="1. What GladysTravel Is">
            <p className="text-slate-600 leading-relaxed">
              GladysTravel.com is an <strong>AI-powered travel planning tool</strong>. We generate travel itineraries, surface event information, and provide links to third-party services for booking flights, hotels, tickets and other travel products.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
              <p className="text-amber-800 font-bold text-sm mb-2">⚠️ Important — Please read this</p>
              <ul className="text-amber-700 text-sm space-y-2">
                <li>GladysTravel.com is <strong>not a licensed travel agent</strong> and does not make bookings on your behalf.</li>
                <li>We are <strong>not responsible for</strong> the accuracy of pricing, availability or event details shown — these come from third-party APIs (Ticketmaster, etc.) and may change without notice.</li>
                <li>All bookings are made directly with partner platforms. GladysTravel.com is not a party to any booking transaction.</li>
              </ul>
            </div>
          </Section>

          <Section title="2. Acceptance of Terms">
            <p className="text-slate-600 leading-relaxed">
              By creating an account or using GladysTravel.com, you confirm that you are at least 13 years old and have read, understood and agreed to these Terms. If you are using the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.
            </p>
          </Section>

          <Section title="3. Your Account">
            <ul className="text-slate-600 space-y-2 leading-relaxed">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must notify us immediately at <a href="mailto:contact@gladystravel.com" className="text-sky-500 hover:underline">contact@gladystravel.com</a> if you suspect unauthorised access.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </Section>

          <Section title="4. Affiliate Links & Commercial Relationships">
            <p className="text-slate-600 leading-relaxed">
              GladysTravel.com earns revenue through affiliate partnerships. When you click a link to a partner service and complete a purchase, we may receive a commission. Partners currently include:
            </p>
            <ul className="text-slate-600 space-y-1 mt-3">
              <li><strong>Yesim &amp; Airalo</strong> — eSIM data plans</li>
              <li><strong>Kiwitaxi &amp; GetTransfer.com</strong> — airport and city transfers</li>
              <li><strong>AirHelp</strong> — flight delay compensation</li>
              <li><strong>EKTA</strong> — travel insurance</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Affiliate commissions do <strong>not</strong> influence the AI recommendations generated for your trip. All itinerary content is generated based on your specific trip requirements.
            </p>
          </Section>

          <Section title="5. Event Data & Accuracy">
            <p className="text-slate-600 leading-relaxed">
              Event information displayed on GladysTravel.com — including dates, venues, ticket prices and availability — is sourced from third-party APIs including Ticketmaster, API-Football and others. This data:
            </p>
            <ul className="text-slate-600 space-y-2 mt-3">
              <li>May not be real-time and could be out of date</li>
              <li>May contain errors, omissions or inaccuracies</li>
              <li>Is subject to change by the event organiser without notice</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Always verify event details (dates, times, venue, cancellation policy) directly with the official event organiser or ticketing platform before making travel bookings.
            </p>
          </Section>

          <Section title="6. AI-Generated Content">
            <p className="text-slate-600 leading-relaxed">
              Itineraries, travel tips, packing lists and other content generated by Gladys AI are produced by artificial intelligence. While we strive for accuracy and quality:
            </p>
            <ul className="text-slate-600 space-y-2 mt-3">
              <li>AI-generated content may contain factual errors</li>
              <li>Restaurant recommendations may be outdated (businesses close or change)</li>
              <li>Transport and logistics suggestions should be independently verified</li>
              <li>Use AI suggestions as a starting point, not as guaranteed facts</li>
            </ul>
          </Section>

          <Section title="7. Acceptable Use">
            <p className="text-slate-600 leading-relaxed">You agree not to:</p>
            <ul className="text-slate-600 space-y-2 mt-3">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to scrape, copy or reproduce our AI outputs at scale</li>
              <li>Reverse-engineer or attempt to access our backend systems</li>
              <li>Use the Service in a way that damages, disables or impairs it</li>
              <li>Misrepresent your identity or affiliation when using the Service</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p className="text-slate-600 leading-relaxed">
              The GladysTravel.com brand, logo, interface design, and underlying software are the intellectual property of GladysTravel AI. You may not reproduce, distribute or create derivative works without prior written permission.
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              Event names, trademarks and logos referenced on the platform (e.g. FIFA World Cup™, Champions League™) belong to their respective owners. GladysTravel.com is not affiliated with or endorsed by these organisations.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p className="text-slate-600 leading-relaxed">
              To the maximum extent permitted by law, GladysTravel.com and its operators shall not be liable for:
            </p>
            <ul className="text-slate-600 space-y-2 mt-3">
              <li>Any loss or damage arising from event cancellations, postponements or changes</li>
              <li>Any booking-related disputes between you and a third-party partner</li>
              <li>Any loss arising from reliance on AI-generated itinerary content</li>
              <li>Any indirect, incidental, special or consequential damages</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Our total liability to you for any claim arising from use of the Service shall not exceed the amount you paid us directly in the 12 months preceding the claim (which in most cases is zero, as the Service is free to use).
            </p>
          </Section>

          <Section title="10. Privacy">
            <p className="text-slate-600 leading-relaxed">
              Your use of GladysTravel.com is also governed by our{' '}
              <Link href="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>,
              which is incorporated into these Terms by reference.
            </p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p className="text-slate-600 leading-relaxed">
              We may update these Terms from time to time. The effective date at the top of this page will reflect the latest update. Continued use of the Service after changes are posted constitutes your acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="12. Contact">
            <p className="text-slate-600 leading-relaxed">For questions about these Terms:</p>
            <ul className="text-slate-600 space-y-1 mt-3">
              <li>Email: <a href="mailto:contact@gladystravel.com" className="text-sky-500 hover:underline">contact@gladystravel.com</a></li>
              <li>Phone: +27 64 545 2236</li>
              <li>Location: Johannesburg, South Africa</li>
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
    <div>
      <h2 className="text-xl font-black text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}