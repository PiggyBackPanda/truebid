import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TrueBid",
  description:
    "TrueBid Privacy Policy. How we collect, use, store, and protect your personal information under the Privacy Act 1988 (Cth) and the Australian Privacy Principles.",
};

const TOC_ITEMS = [
  { id: "overview",      label: "1. Overview" },
  { id: "collection",   label: "2. Information We Collect" },
  { id: "use",          label: "3. How We Use Your Information" },
  { id: "security",     label: "4. Storage & Security" },
  { id: "identity",     label: "5. Identity Verification" },
  { id: "third-parties",label: "6. Third-Party Service Providers" },
  { id: "sharing",      label: "7. Sharing Your Information" },
  { id: "rights",       label: "8. Your Privacy Rights" },
  { id: "retention",    label: "9. Data Retention" },
  { id: "cookies",      label: "10. Cookies & Analytics" },
  { id: "ndb",          label: "11. Notifiable Data Breaches" },
  { id: "contact",      label: "12. Contact" },
];

const serif = "Georgia, 'Times New Roman', serif";
const body  = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const headingStyle: React.CSSProperties = {
  fontFamily: serif,
  fontSize: 22,
  fontWeight: 400,
  lineHeight: 1.3,
};

const paraStyle: React.CSSProperties = {
  fontSize: 14,
  fontFamily: body,
  lineHeight: 1.75,
};

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p className="text-text-muted leading-relaxed" style={{ ...paraStyle, ...style }}>
      {children}
    </p>
  );
}

function SectionHeading({ id, number, title }: { id: string; number: string; title: string }) {
  return (
    <h2 id={id} className="text-navy mb-4 scroll-mt-8" style={headingStyle}>
      {number}. {title}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-navy mb-2 mt-6"
      style={{ fontFamily: body, fontSize: 14, fontWeight: 700 }}
    >
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="border-t border-border mt-8" />;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex-shrink-0 text-amber mt-1" aria-hidden="true">·</span>
      <span className="text-text-muted leading-relaxed" style={paraStyle}>
        {children}
      </span>
    </li>
  );
}

function DefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex-shrink-0 font-semibold text-navy"
        style={{ fontSize: 13, fontFamily: body, minWidth: 180, paddingTop: 2 }}
      >
        {label}
      </div>
      <p className="text-text-muted leading-relaxed" style={paraStyle}>
        {children}
      </p>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="bg-bg min-h-screen">

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="bg-navy py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: body, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Legal
          </p>
          <h1 className="text-white" style={{ fontFamily: serif, fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Privacy Policy
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: body, marginTop: 10 }}>
            Last updated: 28 March 2026
          </p>
        </div>
      </div>

      {/* ── Body: sidebar TOC + content ──────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:flex lg:gap-12">

        {/* Sticky sidebar TOC — desktop only */}
        <nav className="hidden lg:block lg:w-60 flex-shrink-0" aria-label="Table of contents">
          <div className="sticky top-8">
            <p className="text-navy font-semibold mb-3" style={{ fontSize: 12, fontFamily: body, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Contents
            </p>
            <ul className="space-y-1">
              {TOC_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block text-text-muted hover:text-navy transition-colors py-1"
                    style={{ fontSize: 13, fontFamily: body, lineHeight: 1.4 }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-3xl flex-1 min-w-0">

          {/* Pre-launch notice */}
          <div className="rounded-lg p-5 mb-10" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <p className="text-text-muted leading-relaxed" style={{ fontSize: 14, fontFamily: body }}>
              <strong className="text-navy">Notice:</strong> This Privacy Policy is
              provided for informational purposes and will be updated prior to the
              platform&rsquo;s public launch. If you have questions in the meantime,
              contact{" "}
              <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                privacy@truebid.com.au
              </a>.
            </p>
          </div>

          <div className="space-y-8">

            {/* 1. Overview */}
            <section>
              <SectionHeading id="overview" number="1" title="Overview" />
              <div className="space-y-3">
                <P>
                  TrueBid Pty Ltd (ABN: pending registration) (<strong className="text-navy">&ldquo;TrueBid&rdquo;</strong>,{" "}
                  <strong className="text-navy">&ldquo;we&rdquo;</strong>,{" "}
                  <strong className="text-navy">&ldquo;us&rdquo;</strong>, or{" "}
                  <strong className="text-navy">&ldquo;our&rdquo;</strong>) operates a free,
                  transparent property sales platform at truebid.com.au (the
                  &ldquo;Platform&rdquo;). We are an Australian company and our services are
                  directed at Australian residents.
                </P>
                <P>
                  This Privacy Policy explains how we collect, use, disclose, and protect
                  your personal information in accordance with the{" "}
                  <em>Privacy Act 1988</em> (Cth) (the &ldquo;Privacy Act&rdquo;) and the
                  13 Australian Privacy Principles (APPs) contained in Schedule 1 of that Act.
                </P>
                <P>
                  By using the Platform, you acknowledge that you have read and understood
                  this Privacy Policy. If you do not agree, you must not use the Platform.
                </P>
              </div>
              <Divider />
            </section>

            {/* 2. Information We Collect */}
            <section>
              <SectionHeading id="collection" number="2" title="Information We Collect" />

              <SubHeading>2.1 Information you provide directly</SubHeading>
              <div className="space-y-3 mb-4">
                <DefRow label="Account details">
                  First name, last name, email address, phone number, and your role on
                  the platform (buyer, seller, or both). Collected when you register.
                </DefRow>
                <DefRow label="Property listing data">
                  Property address, description, photos, floor plans, pricing guidance,
                  method of sale, and property features. Collected when you create a listing.
                </DefRow>
                <DefRow label="Offer data">
                  Offer amounts (stored as integers in cents), conditions, settlement
                  preferences, and any personal note to the seller. Collected when you
                  submit or modify an offer.
                </DefRow>
                <DefRow label="Conversation messages">
                  Messages exchanged between buyers and sellers after an offer is accepted.
                  Content is stored in our database and transmitted over TLS.
                </DefRow>
                <DefRow label="Account settings">
                  Password (stored as a bcrypt hash; we cannot recover your password),
                  notification preferences, and any avatar image you upload.
                </DefRow>
              </div>

              <SubHeading>2.2 Information collected automatically</SubHeading>
              <ul className="space-y-2 mb-4">
                <Bullet>
                  <strong className="text-navy">Usage data:</strong> Pages visited, listings
                  viewed, search queries, features used, timestamps, and session duration.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Device and browser data:</strong> IP address,
                  browser type and version, operating system, and screen resolution.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Cookies and similar technologies:</strong> See
                  Section 10 for full details.
                </Bullet>
              </ul>

              <SubHeading>2.3 Information from third parties</SubHeading>
              <ul className="space-y-2">
                <Bullet>
                  <strong className="text-navy">Identity verification outcome:</strong> When
                  you complete identity verification via Stripe Identity, we receive a
                  verification status (PENDING, VERIFIED, REQUIRES_REVIEW) and your
                  verified full name. We do not receive your document number, date of birth,
                  or a copy of your identity document. See Section 5 for full details.
                </Bullet>
              </ul>
              <Divider />
            </section>

            {/* 3. How We Use Your Information */}
            <section>
              <SectionHeading id="use" number="3" title="How We Use Your Information" />
              <P>
                We collect and use personal information only for purposes that are directly
                related to, or reasonably expected in connection with, providing the Platform
                (APP 3). Specifically, we use your information to:
              </P>
              <ul className="space-y-2 mt-3">
                <Bullet>Create and manage your account and authenticate your sessions</Bullet>
                <Bullet>
                  Verify your identity before you place an offer or publish a listing, as
                  required by our fraud prevention obligations
                </Bullet>
                <Bullet>Facilitate communication between buyers and sellers</Bullet>
                <Bullet>
                  Send transactional notifications: new offers, offer acceptance or
                  rejection, unread message reminders, and listing status updates
                </Bullet>
                <Bullet>
                  Display offer board data: verified buyer pseudonymous aliases are shown
                  to other users; full buyer details are shown only to the seller
                </Bullet>
                <Bullet>
                  Connect you with referral partners (conveyancers, building inspectors)
                  when you explicitly initiate a referral request
                </Bullet>
                <Bullet>
                  Detect and prevent fraudulent, deceptive, or harmful activity on the
                  Platform
                </Bullet>
                <Bullet>
                  Improve the Platform using aggregated, anonymised analytics. No
                  individual user is identifiable in this analysis.
                </Bullet>
                <Bullet>
                  Comply with our legal obligations under Australian law
                </Bullet>
              </ul>
              <P style={{ marginTop: 12 }}>
                We do not use your personal information for targeted advertising and we do
                not sell your data to any third party under any circumstances.
              </P>
              <Divider />
            </section>

            {/* 4. Storage & Security */}
            <section>
              <SectionHeading id="security" number="4" title="Storage & Security" />

              <SubHeading>4.1 Where your data is stored</SubHeading>
              <P>
                All personal data is stored in Australia. Our primary database is hosted
                in the AWS Sydney region (<code style={{ fontFamily: "monospace", fontSize: 13 }}>ap-southeast-2</code>).
                We do not transfer personal data to servers outside Australia without your
                explicit consent, except as described in Section 6 (third-party providers
                whose infrastructure may span multiple regions).
              </P>

              <SubHeading>4.2 Encryption in transit</SubHeading>
              <P>
                All data transmitted between your browser and our Platform is encrypted
                using TLS 1.2 or higher. HTTP requests are automatically redirected to
                HTTPS. WebSocket connections (used for real-time offer board updates) are
                secured with WSS (WebSocket Secure).
              </P>

              <SubHeading>4.3 Encryption at rest</SubHeading>
              <P>
                Our database is encrypted at rest at the infrastructure level. In addition,
                certain sensitive fields receive application-level encryption before being
                written to the database:
              </P>
              <ul className="space-y-2 mt-3 mb-4">
                <Bullet>
                  <strong className="text-navy">Verified name</strong> (received from Stripe
                  Identity): encrypted using AES-256-GCM with a 256-bit key and a unique
                  96-bit initialisation vector per value. The authentication tag is stored
                  alongside the ciphertext to detect tampering. The encryption key is stored
                  separately from the database and is never logged.
                </Bullet>
              </ul>

              <SubHeading>4.4 Password storage</SubHeading>
              <P>
                Passwords are hashed using bcrypt with a work factor of 12 before being
                stored. We do not store your password in plaintext at any point, and we
                cannot recover your password — only reset it.
              </P>

              <SubHeading>4.5 Access controls</SubHeading>
              <P>
                Access to personal data is restricted on a need-to-know basis. Production
                database credentials are not accessible to individual team members in
                plaintext and are managed via environment-level secrets. All access is
                logged for audit purposes.
              </P>

              <SubHeading>4.6 Security limitations</SubHeading>
              <P>
                No system can guarantee absolute security. While we apply industry-standard
                controls, we cannot warrant that your information will never be accessed,
                disclosed, or altered by an unauthorised party. If you suspect unauthorised
                access to your account, contact us immediately at{" "}
                <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                  privacy@truebid.com.au
                </a>.
              </P>
              <Divider />
            </section>

            {/* 5. Identity Verification */}
            <section>
              <SectionHeading id="identity" number="5" title="Identity Verification" />
              <P>
                TrueBid requires identity verification before a user can publish a listing
                or place an offer. This is a core fraud prevention measure and is not
                optional for these actions.
              </P>

              <SubHeading>5.1 How verification works</SubHeading>
              <P>
                We use <strong className="text-navy">Stripe Identity</strong>, a product of
                Stripe Payments Australia Pty Ltd. When you initiate verification, you are
                directed into a Stripe-hosted verification flow where you photograph your
                government-issued identity document and a selfie. This process happens
                entirely within Stripe&rsquo;s infrastructure.
              </P>

              <SubHeading>5.2 What TrueBid receives</SubHeading>
              <P>
                TrueBid receives only two pieces of information from Stripe after
                verification completes:
              </P>
              <ul className="space-y-2 mt-3 mb-4">
                <Bullet>
                  <strong className="text-navy">Verification status</strong>: one of
                  VERIFIED, REQUIRES_REVIEW, or a failure state. Stored in our database.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Verified full name</strong>: the name
                  extracted from your identity document by Stripe. Encrypted with
                  AES-256-GCM before being written to our database (see Section 4.3).
                  Used only for internal dispute resolution and fraud detection.
                </Bullet>
              </ul>

              <SubHeading>5.3 What TrueBid does NOT receive or store</SubHeading>
              <ul className="space-y-2 mt-2 mb-4">
                <Bullet>Copies of your identity document or photographs</Bullet>
                <Bullet>Your document number (licence, passport, or ID card number)</Bullet>
                <Bullet>Your date of birth</Bullet>
                <Bullet>Your selfie or biometric data</Bullet>
              </ul>

              <SubHeading>5.4 Stripe&rsquo;s handling of your data</SubHeading>
              <P>
                Stripe processes and stores your document and biometric data under their
                own privacy policy, available at{" "}
                <a
                  href="https://stripe.com/en-au/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy underline"
                >
                  stripe.com/en-au/privacy
                </a>. Stripe is subject to its own obligations under applicable privacy
                laws. TrueBid has entered into a data processing agreement with Stripe.
              </P>

              <SubHeading>5.5 Requesting deletion of verification data</SubHeading>
              <P>
                You may request deletion of your encrypted verified name and verification
                status by contacting{" "}
                <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                  privacy@truebid.com.au
                </a>. Note that deletion may prevent you from using features that require
                verification. Requests to delete data held by Stripe must be directed to
                Stripe directly.
              </P>
              <Divider />
            </section>

            {/* 6. Third-Party Service Providers */}
            <section>
              <SectionHeading id="third-parties" number="6" title="Third-Party Service Providers" />
              <P>
                We share personal data with the following third-party providers solely
                for the purpose of delivering the Platform. Each provider is engaged on
                a purpose-limited basis and may not use your data for their own marketing
                or analytics purposes.
              </P>

              <div className="space-y-5 mt-5">
                <DefRow label="Stripe Identity">
                  Identity verification. Stripe processes your identity documents and
                  returns only a verification outcome and verified name to TrueBid.
                  Stripe operates globally under its own privacy policy and is bound by
                  a data processing agreement with TrueBid.
                </DefRow>

                <DefRow label="Resend">
                  Transactional email delivery. When TrueBid sends you an email
                  notification (new offer, offer accepted, unread message), the message
                  is delivered via Resend&rsquo;s infrastructure. Resend receives your
                  email address, email subject, and email body. No other personal data
                  is shared. Resend does not use this data for its own marketing.
                </DefRow>

                <DefRow label="Cloudflare">
                  Network security, DDoS protection, and DNS. All web traffic to the
                  Platform passes through Cloudflare&rsquo;s network. Cloudflare processes
                  IP addresses and request metadata in the course of providing these
                  services. TrueBid has a data processing addendum in place with
                  Cloudflare. Cloudflare&rsquo;s privacy policy is at
                  cloudflare.com/privacypolicy.
                </DefRow>

                <DefRow label="Upstash">
                  Rate limiting and message queue services. Upstash Redis stores
                  time-windowed rate limit counters keyed on hashed identifiers (email
                  address or IP address). No offer data, message content, or full personal
                  profiles are written to Upstash. Counters expire automatically (maximum
                  24-hour window). Upstash QStash schedules delayed email notifications
                  by storing the recipient email, message preview, and conversation ID
                  for up to 15 minutes. This data is deleted after the delivery job runs.
                </DefRow>

                <DefRow label="AWS (Amazon Web Services)">
                  Object storage (S3) for property listing images and floor plans, served
                  via CloudFront CDN. Images uploaded to the Platform are stored in AWS
                  Sydney (ap-southeast-2). AWS is bound by a data processing addendum
                  with TrueBid and operates under strict access controls.
                </DefRow>
              </div>

              <P style={{ marginTop: 16 }}>
                TrueBid does not share personal data with any provider not listed above
                without your prior consent, except where required by law (see Section 7).
              </P>
              <Divider />
            </section>

            {/* 7. Sharing Your Information */}
            <section>
              <SectionHeading id="sharing" number="7" title="Sharing Your Information" />

              <SubHeading>7.1 With other TrueBid users</SubHeading>
              <ul className="space-y-2 mb-4">
                <Bullet>
                  <strong className="text-navy">Public offer board:</strong> When you place
                  an offer, your pseudonymous alias (e.g. &ldquo;Buyer 4&rdquo;) and your
                  offer amount are visible to all registered buyers on that listing.
                  Your real name, email, and phone number are never shown publicly.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Seller visibility:</strong> When you place
                  an offer, the seller can see your verified full name, email address, and
                  phone number. This is necessary to facilitate a legitimate transaction
                  and is disclosed to you at the time of placing an offer.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Post-acceptance messaging:</strong> After a
                  seller accepts an offer, both parties can exchange messages. Message
                  content is visible only to the buyer and seller in that conversation.
                </Bullet>
              </ul>

              <SubHeading>7.2 Referral partners</SubHeading>
              <P>
                TrueBid may surface referral opportunities (e.g. conveyancers, building
                inspectors) to users. Your contact details are shared with a referral
                partner only when you explicitly initiate a referral request. Passive
                display of referral partner information does not constitute sharing of
                your data.
              </P>

              <SubHeading>7.3 Legal disclosure</SubHeading>
              <P>
                We may disclose personal information to law enforcement, courts, or
                regulatory bodies if we are required to do so by applicable Australian
                law, a valid court order, or to protect the rights, property, or safety
                of TrueBid, our users, or the public. Where permitted, we will notify
                you of any such disclosure.
              </P>

              <SubHeading>7.4 Business transfers</SubHeading>
              <P>
                If TrueBid undergoes a merger, acquisition, restructure, or sale of
                assets, your personal information may be transferred to the acquiring
                entity. We will notify you before any such transfer takes effect and
                will ensure the receiving party is bound by obligations at least as
                protective as this Privacy Policy.
              </P>
              <Divider />
            </section>

            {/* 8. Your Privacy Rights */}
            <section>
              <SectionHeading id="rights" number="8" title="Your Privacy Rights" />
              <P>
                Under the Privacy Act 1988 (Cth) and the APPs, you have the following
                rights in relation to personal information TrueBid holds about you:
              </P>

              <div className="space-y-4 mt-4">
                <DefRow label="Right of access (APP 12)">
                  You may request a copy of the personal information we hold about you.
                  We will respond within 30 days. We may charge a reasonable fee to cover
                  the cost of providing access in complex cases, but we will notify you
                  of any fee before proceeding.
                </DefRow>
                <DefRow label="Right of correction (APP 13)">
                  If you believe any information we hold about you is inaccurate,
                  out-of-date, incomplete, or misleading, you may request correction.
                  We will take reasonable steps to correct the information within 30 days.
                  Account profile details (name, phone) can be updated directly in your
                  account settings.
                </DefRow>
                <DefRow label="Right to request deletion">
                  You may request deletion of your account and personal data by contacting{" "}
                  <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                    privacy@truebid.com.au
                  </a>.
                  Deletion is subject to our legal retention obligations (see Section 9).
                  Data that must be retained for legal or financial compliance will be
                  archived and not used for any other purpose.
                </DefRow>
                <DefRow label="Right to opt out of marketing">
                  All marketing communications contain an unsubscribe link. You may also
                  update your notification preferences in account settings at any time.
                  Transactional emails (e.g. offer notifications) cannot be disabled
                  while your account is active as they are integral to platform operation.
                </DefRow>
                <DefRow label="Right to complain (APP 1)">
                  If you are not satisfied with how we handle your privacy concern, you
                  may lodge a complaint with the Office of the Australian Information
                  Commissioner (OAIC) at{" "}
                  <a
                    href="https://www.oaic.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy underline"
                  >
                    www.oaic.gov.au
                  </a>{" "}
                  or by calling 1300 363 992.
                </DefRow>
              </div>

              <P style={{ marginTop: 16 }}>
                To exercise any of these rights, contact{" "}
                <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                  privacy@truebid.com.au
                </a>{" "}
                with your name and registered email address. We may need to verify your
                identity before processing the request.
              </P>
              <Divider />
            </section>

            {/* 9. Data Retention */}
            <section>
              <SectionHeading id="retention" number="9" title="Data Retention" />
              <P>
                We retain personal information only for as long as is necessary for the
                purpose for which it was collected, or as required by law (APP 11.2).
              </P>

              <div className="space-y-4 mt-4">
                <DefRow label="Active account data">
                  Retained for the life of your account plus 7 years after deletion.
                  The 7-year period reflects our obligations under the{" "}
                  <em>Corporations Act 2001</em> (Cth) and the{" "}
                  <em>Australian Consumer Law</em>. During this period, archived data
                  is accessible only to authorised TrueBid personnel for legal and
                  audit purposes and is not used for any other purpose.
                </DefRow>
                <DefRow label="Offer records">
                  Accepted offer records (including amount, parties, and dates) are
                  retained for 7 years from acceptance. Withdrawn and rejected offers
                  are retained for 2 years for fraud detection and dispute resolution.
                </DefRow>
                <DefRow label="Messages">
                  Conversation messages are retained for 7 years after the conversation
                  closes (following offer acceptance) to support any property transaction
                  disputes. Pre-acceptance direct messages are retained for 2 years.
                </DefRow>
                <DefRow label="Identity verification data">
                  Verification status and encrypted verified name are retained for
                  7 years from the date of verification to support anti-fraud measures.
                  You may request earlier deletion (see Section 8), subject to our
                  assessment of ongoing fraud risk.
                </DefRow>
                <DefRow label="Server and access logs">
                  Server logs (IP addresses, request metadata) are retained for 90 days
                  for security monitoring and then permanently deleted.
                </DefRow>
                <DefRow label="Rate limit counters">
                  Rate limit data in Upstash Redis uses a sliding window algorithm.
                  Counters expire automatically between 60 seconds and 24 hours depending
                  on the endpoint, and are not persisted beyond that window.
                </DefRow>
                <DefRow label="Unread email queue">
                  Message data queued for unread email notifications (via Upstash QStash)
                  is retained for a maximum of 15 minutes (the delivery delay period),
                  then deleted by the queue system automatically.
                </DefRow>
              </div>
              <Divider />
            </section>

            {/* 10. Cookies & Analytics */}
            <section>
              <SectionHeading id="cookies" number="10" title="Cookies & Analytics" />

              <SubHeading>10.1 Essential cookies</SubHeading>
              <P>
                TrueBid uses session cookies to maintain your authenticated state. These
                cookies are necessary for the Platform to function and cannot be disabled
                without preventing login. Session cookies expire when you close your
                browser or after a configured inactivity period. We also set a CSRF
                (cross-site request forgery) token cookie required for security on form
                submissions.
              </P>

              <SubHeading>10.2 Functional cookies</SubHeading>
              <P>
                We may store your session preferences (such as remembered login email)
                in a persistent cookie if you select &ldquo;Remember me&rdquo; on the
                login screen. This cookie expires after 30 days. No preference data is
                shared with third parties.
              </P>

              <SubHeading>10.3 Analytics</SubHeading>
              <P>
                TrueBid collects anonymised usage data (page views, feature interactions,
                session duration) to understand how the Platform is used and to inform
                product decisions. This data is aggregated and no individual user is
                identifiable. We do not use third-party analytics platforms such as
                Google Analytics. IP addresses used for analytics are hashed before
                storage and cannot be reversed.
              </P>

              <SubHeading>10.4 Advertising cookies</SubHeading>
              <P>
                TrueBid does not use advertising cookies, tracking pixels, or
                retargeting technologies of any kind. We do not share data with
                advertising networks.
              </P>

              <SubHeading>10.5 Cookie management</SubHeading>
              <P>
                You can manage cookies through your browser settings. Disabling essential
                cookies will prevent login and Platform access. Disabling functional
                cookies will mean your session preferences are not saved between visits.
              </P>
              <Divider />
            </section>

            {/* 11. Notifiable Data Breaches */}
            <section>
              <SectionHeading id="ndb" number="11" title="Notifiable Data Breaches" />
              <P>
                TrueBid is subject to the Notifiable Data Breaches (NDB) scheme under
                Part IIIC of the Privacy Act 1988 (Cth). Under the NDB scheme, we are
                required to notify affected individuals and the OAIC when a data breach
                is likely to result in serious harm.
              </P>

              <SubHeading>11.1 Our breach response process</SubHeading>
              <ul className="space-y-2 mt-2 mb-4">
                <Bullet>
                  <strong className="text-navy">Detection:</strong> We maintain security
                  monitoring on our infrastructure. Any suspected or confirmed breach is
                  escalated immediately to our technical and management teams.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Assessment (30-day window):</strong> We
                  will assess whether the breach meets the threshold for notification,
                  namely, whether it is likely to result in serious harm to one or more
                  individuals whose personal information is involved. This assessment will
                  be completed within 30 days of becoming aware of the suspected breach,
                  as required by law.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Notification to OAIC:</strong> If the breach
                  meets the notification threshold, we will lodge a statement with the OAIC
                  as soon as practicable and no later than 30 days after becoming aware of
                  the breach.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Notification to affected individuals:</strong>{" "}
                  We will notify each affected individual whose personal information was
                  involved in the breach and who is at risk of serious harm, providing
                  details of the breach and the steps they should take to protect
                  themselves. Notification will be sent via email and/or a notice on the
                  Platform.
                </Bullet>
                <Bullet>
                  <strong className="text-navy">Remediation:</strong> We will take
                  immediate steps to contain the breach and prevent further unauthorised
                  access, and will conduct a post-incident review to prevent recurrence.
                </Bullet>
              </ul>

              <SubHeading>11.2 Reporting a suspected breach</SubHeading>
              <P>
                If you become aware of, or suspect, a data security incident involving
                your TrueBid account or personal information, please contact us
                immediately at{" "}
                <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                  privacy@truebid.com.au
                </a>{" "}
                with the subject line <em>&ldquo;Security Incident&rdquo;</em>.
              </P>
              <Divider />
            </section>

            {/* 12. Contact */}
            <section>
              <SectionHeading id="contact" number="12" title="Contact" />
              <P>
                If you have any questions about this Privacy Policy, wish to exercise
                your privacy rights, or have a privacy concern, please contact our
                Privacy Officer:
              </P>
              <div className="mt-4 space-y-2" style={{ fontFamily: body, fontSize: 14 }}>
                <p className="font-semibold text-navy">TrueBid Privacy Officer</p>
                {/* TODO: Replace with company address before going live */}
                {process.env.NODE_ENV === "development" && (
                  <p style={{ backgroundColor: "#fef08a", padding: "4px 6px", display: "inline-block" }}>
                    ⚠ Add company address before launch
                  </p>
                )}
                <p className="text-text-muted">
                  Email:{" "}
                  <a href="mailto:privacy@truebid.com.au" className="text-navy underline">
                    privacy@truebid.com.au
                  </a>
                </p>
              </div>
              <P style={{ marginTop: 16 }}>
                We will acknowledge your enquiry within 5 business days and aim to
                resolve privacy complaints within 30 days. If you are not satisfied
                with our response, you may escalate your complaint to the Office of
                the Australian Information Commissioner:
              </P>
              <div className="mt-3 space-y-1" style={{ fontFamily: body, fontSize: 14 }}>
                <p className="font-semibold text-navy">Office of the Australian Information Commissioner (OAIC)</p>
                <p className="text-text-muted">
                  Web:{" "}
                  <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-navy underline">
                    www.oaic.gov.au
                  </a>
                </p>
                <p className="text-text-muted">Phone: 1300 363 992</p>
                <p className="text-text-muted">Post: GPO Box 5218, Sydney NSW 2001</p>
              </div>
            </section>

          </div>{/* /space-y-8 */}

          {/* Bottom nav links */}
          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
            <Link href="/terms" className="text-sm text-text-muted hover:text-navy underline">
              Terms of Service
            </Link>
            <Link href="/how-it-works" className="text-sm text-text-muted hover:text-navy underline">
              How It Works
            </Link>
            <Link href="/faq" className="text-sm text-text-muted hover:text-navy underline">
              FAQ
            </Link>
          </div>

        </div>{/* /main content */}
      </div>{/* /body */}
    </div>
  );
}
