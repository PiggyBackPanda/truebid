import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | TrueBid",
  description:
    "TrueBid Terms of Service. Read our terms governing use of the TrueBid property sales platform.",
};

const TOC_ITEMS = [
  { id: "eligibility", label: "1. Eligibility & Account Registration" },
  { id: "identity", label: "2. Identity Verification" },
  { id: "platform", label: "3. The TrueBid Platform" },
  { id: "open-offers", label: "4. Live Offers" },
  { id: "seller-responsibilities", label: "5. Seller Responsibilities" },
  { id: "buyer-responsibilities", label: "6. Buyer Responsibilities" },
  { id: "fees", label: "7. Fees" },
  { id: "prohibited-conduct", label: "8. Prohibited Conduct" },
  { id: "suspension", label: "9. Account Suspension & Termination" },
  { id: "privacy", label: "10. Privacy & Data" },
  { id: "ip", label: "11. Intellectual Property" },
  { id: "liability", label: "12. Liability & Disclaimers" },
  { id: "disputes", label: "13. Dispute Resolution" },
  { id: "governing-law", label: "14. Governing Law & Jurisdiction" },
  { id: "changes", label: "15. Changes to These Terms" },
  { id: "contact", label: "16. Contact" },
];

/* ── shared text styles ─────────────────────── */
const serif = "Georgia, 'Times New Roman', serif";
const body = "var(--font-sans)";

const headingStyle: React.CSSProperties = {
  fontFamily: serif,
  fontSize: 22,
  fontWeight: 400,
  lineHeight: 1.3,
};

const paraStyle: React.CSSProperties = {
  fontSize: 14,
  fontFamily: body,
};

const subListStyle: React.CSSProperties = {
  fontSize: 14,
  fontFamily: body,
  paddingLeft: 20,
};

/* ── helper components ──────────────────────── */

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-text-muted leading-relaxed" style={paraStyle}>
      {children}
    </p>
  );
}

function SectionHeading({
  id,
  number,
  title,
}: {
  id: string;
  number: string;
  title: string;
}) {
  return (
    <h2 id={id} className="text-navy mb-4 scroll-mt-8" style={headingStyle}>
      {number}. {title}
    </h2>
  );
}

function Divider() {
  return <div className="border-t border-border mt-8" />;
}

/* ── page ────────────────────────────────────── */

export default function TermsPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="bg-navy py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontFamily: body,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Legal
          </p>
          <h1
            className="text-white"
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Terms of Service
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              fontFamily: body,
              marginTop: 10,
            }}
          >
            Last updated: March 2026
          </p>
        </div>
      </div>

      {/* Body: sidebar TOC + content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:flex lg:gap-12">
        {/* Sticky TOC: desktop only */}
        <nav
          className="hidden lg:block lg:w-60 flex-shrink-0"
          aria-label="Table of contents"
        >
          <div className="sticky top-8">
            <p
              className="text-navy font-semibold mb-3"
              style={{ fontSize: 12, fontFamily: body, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
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

        {/* Main content column */}
        <div className="max-w-3xl flex-1 min-w-0">
          {/* Legal review notice */}
          <div
            className="rounded-lg p-5 mb-10"
            style={{
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            <p
              className="text-text-muted leading-relaxed"
              style={{ fontSize: 14, fontFamily: body }}
            >
              <strong className="text-navy">Important:</strong> These Terms are
              provided for informational purposes and will be updated prior to
              the platform&rsquo;s public launch.
            </p>
          </div>

          {/* Introduction */}
          <div className="space-y-3 mb-10">
            <P>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
              and use of the TrueBid platform, including our website, web
              application, and any related services (collectively, the
              &ldquo;Platform&rdquo;). By creating an account or using the
              Platform in any way, you agree to be bound by these Terms. If you
              do not agree, do not use the Platform.
            </P>
            <P>
              TrueBid is operated by TrueBid Pty Ltd (ABN: [ABN TO BE CONFIRMED])
              (&ldquo;TrueBid&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;), registered in Australia.
            </P>
          </div>

          {/* ── SECTIONS ──────────────────────── */}
          <div className="space-y-8">
            {/* 1. Eligibility */}
            <section>
              <SectionHeading id="eligibility" number="1" title="Eligibility & Account Registration" />
              <div className="space-y-3">
                <P>1.1 You must be at least 18 years of age to create an account or use the Platform.</P>
                <P>1.2 You must be a natural person or a legally registered Australian business entity to register as a seller.</P>
                <P>1.3 When you register, you agree to provide accurate, current, and complete information. You must keep your account details up to date at all times.</P>
                <P>1.4 You are responsible for maintaining the confidentiality of your account credentials. You must not share your login details with any other person. Any activity carried out under your account is your responsibility.</P>
                <P>1.5 TrueBid reserves the right to refuse registration, suspend, or terminate any account at its sole discretion, including where we reasonably believe the information provided is false, misleading, or incomplete.</P>
                <P>1.6 You may only hold one active account on the Platform. Creating multiple accounts to circumvent a suspension or for any other purpose is prohibited.</P>
              </div>
              <Divider />
            </section>

            {/* 2. Identity Verification */}
            <section>
              <SectionHeading id="identity" number="2" title="Identity Verification" />
              <div className="space-y-3">
                <P>2.1 All users who wish to submit an offer or list a property must complete identity verification before doing so. This process may involve providing government-issued identification and other supporting documents.</P>
                <P>2.2 TrueBid uses third-party identity verification services. By completing verification, you consent to your information being passed to those services in accordance with our Privacy Policy.</P>
                <P>2.3 Providing false or fraudulent identification is a serious breach of these Terms and may be referred to relevant authorities.</P>
                <P>2.4 Verified status does not constitute an endorsement by TrueBid of any user&rsquo;s financial capacity, creditworthiness, or intentions.</P>
              </div>
              <Divider />
            </section>

            {/* 3. The TrueBid Platform */}
            <section>
              <SectionHeading id="platform" number="3" title="The TrueBid Platform" />
              <div className="space-y-3">
                <P>3.1 TrueBid is a property offer management platform. We facilitate the transparent submission and display of offers between buyers and sellers. We are not a licensed real estate agency and do not provide real estate agent services.</P>
                <P>3.2 Where a licensed real estate agent is involved in a transaction, that agent is responsible for their own legal obligations under applicable state legislation, including the Property and Stock Agents Act 2002 (NSW), Estate Agents Act 1980 (VIC), and equivalent legislation in other states and territories.</P>
                <P>3.3 TrueBid does not provide legal, financial, taxation, or conveyancing advice. Nothing on the Platform constitutes such advice. You should seek independent professional advice before making or accepting any offer.</P>
                <P>3.4 TrueBid does not guarantee the accuracy of any listing content, including property descriptions, photographs, pricing, or documentation provided by sellers.</P>
              </div>
              <Divider />
            </section>

            {/* 4. Live Offers */}
            <section>
              <SectionHeading id="open-offers" number="4" title="Live Offers" />
              <div className="space-y-3">
                <P>4.1 The Live Offers feature allows sellers to receive and display offers from verified buyers in real time during a defined offer window. All registered buyers viewing a listing can see offer amounts and submission times during this period.</P>
                <P>4.2 Buyer identity, personal details, and offer conditions are not disclosed to other buyers. Only offer amounts and submission times are visible to other participants.</P>
                <P>4.3 An offer submitted through the Platform is a formal expression of intent to purchase the property at the stated price and on the stated conditions. It is not a legally binding contract until a formal contract of sale has been signed by both parties.</P>
                <P>4.4 Sellers are not obligated to accept any offer, including the highest offer received.</P>
                <P>4.5 Buyers may increase their offer during an active Live Offers period. Offer reductions are not permitted once an offer has been submitted.</P>
                <P>4.6 Withdrawing a submitted offer is permitted but will be recorded on the buyer&rsquo;s account. Repeated offer withdrawals may result in restricted access to the Platform.</P>
                <P>4.7 Anti-snipe protection automatically extends the Live Offers window if a new offer is submitted within 10 minutes of the scheduled close time. The closing time automatically extends by 10 minutes.</P>
                <P>4.8 TrueBid reserves the right to cancel or void any offer it reasonably believes has been submitted in bad faith, through error, or in breach of these Terms.</P>
              </div>
              <Divider />
            </section>

            {/* 5. Seller Responsibilities */}
            <section>
              <SectionHeading id="seller-responsibilities" number="5" title="Seller Responsibilities" />
              <div className="space-y-3">
                <P>5.1 By listing a property on TrueBid, you represent and warrant that:</P>
                <ul className="text-text-muted leading-relaxed list-none space-y-2" style={subListStyle}>
                  <li>(a) you are the registered owner of the property, or have written authority from the registered owner to list it for sale;</li>
                  <li>(b) all information provided in the listing is accurate, complete, and not misleading;</li>
                  <li>(c) you have obtained or will obtain all required vendor disclosure documents (including a Section 32 Vendor&rsquo;s Statement in Victoria or equivalent in your state) before contracts are exchanged;</li>
                  <li>(d) you are not subject to any legal restriction that prevents you from selling the property.</li>
                </ul>
                <P>5.2 Sellers must not list a property that is already under a binding contract of sale with another party.</P>
                <P>5.3 Sellers are responsible for ensuring their listing complies with all applicable laws, including consumer protection legislation and anti-discrimination laws.</P>
                <P>5.4 If a seller accepts an offer and then refuses to proceed without reasonable cause, TrueBid may suspend the seller&rsquo;s account and record the event on their profile.</P>
                <P>5.5 Sellers must not engage in misleading or deceptive conduct, including artificially inflating interest in a property or submitting false enquiries.</P>
                <P>5.6 Sellers using a licensed real estate agent to manage their campaign remain responsible for the accuracy of all listing content submitted to the Platform, regardless of who physically submits it.</P>
              </div>
              <Divider />
            </section>

            {/* 6. Buyer Responsibilities */}
            <section>
              <SectionHeading id="buyer-responsibilities" number="6" title="Buyer Responsibilities" />
              <div className="space-y-3">
                <P>6.1 By submitting an offer through the Platform, you represent and warrant that:</P>
                <ul className="text-text-muted leading-relaxed list-none space-y-2" style={subListStyle}>
                  <li>(a) you have the legal capacity to enter into a contract for the purchase of real property in Australia;</li>
                  <li>(b) you have conducted your own due diligence on the property, including reviewing all available disclosure documents;</li>
                  <li>(c) you have the financial capacity to complete the purchase at the offer price, or have a reasonable basis to believe you will obtain the necessary finance.</li>
                </ul>
                <P>6.2 Buyers must not submit offers they do not intend to honour if accepted. Submitting frivolous, speculative, or bad-faith offers is a breach of these Terms.</P>
                <P>6.3 If a buyer&rsquo;s offer is accepted and they fail to proceed to contract within the timeframe agreed with the seller, TrueBid may suspend the buyer&rsquo;s account and record the event on their profile.</P>
                <P>6.4 Buyers are solely responsible for arranging their own legal representation, building and pest inspections, finance approval, and any other due diligence they consider necessary.</P>
                <P>6.5 TrueBid strongly recommends that buyers do not submit offers contingent on finance unless they have obtained formal pre-approval from a lender.</P>
              </div>
              <Divider />
            </section>

            {/* 7. Fees */}
            <section>
              <SectionHeading id="fees" number="7" title="Fees" />
              <div className="space-y-3">
                <P>7.1 Browsing listings and creating a buyer account on TrueBid is free of charge.</P>
                <P>7.2 Listing a property on TrueBid is free during our current launch period, which will end with no less than 30 days written notice to registered users. TrueBid reserves the right to introduce listing fees following that notice period.</P>
                <P>7.3 TrueBid reserves the right to introduce, change, or remove fees at any time. Where fees change for existing users, we will provide at least 30 days&rsquo; written notice before the change takes effect.</P>
                <P>7.4 All fees are quoted in Australian dollars and are inclusive of GST unless otherwise stated.</P>
                <P>7.5 Fees paid are non-refundable except where required by Australian Consumer Law.</P>
              </div>
              <Divider />
            </section>

            {/* 8. Prohibited Conduct */}
            <section>
              <SectionHeading id="prohibited-conduct" number="8" title="Prohibited Conduct" />
              <div className="space-y-3">
                <P>8.1 You must not use the Platform to:</P>
                <ul className="text-text-muted leading-relaxed list-none space-y-2" style={subListStyle}>
                  <li>(a) submit false, misleading, or fraudulent information;</li>
                  <li>(b) impersonate any person or entity;</li>
                  <li>(c) list a property you do not own or have authority to sell;</li>
                  <li>(d) engage in price manipulation, collusion, or offer manipulation;</li>
                  <li>(e) use automated tools, bots, or scripts to interact with the Platform;</li>
                  <li>(f) scrape, copy, or republish Platform content without written permission;</li>
                  <li>(g) harass, threaten, or engage in discriminatory conduct toward other users;</li>
                  <li>(h) attempt to access another user&rsquo;s account or any part of the Platform you are not authorised to access;</li>
                  <li>(i) circumvent any security, verification, or access control measures;</li>
                  <li>(j) use the Platform for any purpose that is unlawful under Australian law.</li>
                </ul>
                <P>8.2 The following conduct is expressly prohibited and constitutes a serious breach of these Terms:</P>
                <ul className="text-text-muted leading-relaxed list-none space-y-2" style={subListStyle}>
                  <li>(a) <strong className="text-navy">Shill offers:</strong> placing, arranging, or encouraging fictitious offers for the purpose of artificially inflating the offer board or creating a false impression of demand;</li>
                  <li>(b) <strong className="text-navy">Fictitious offers:</strong> submitting an offer with no genuine intention to proceed to purchase if accepted;</li>
                  <li>(c) <strong className="text-navy">Collusion:</strong> coordinating with any other party, whether a buyer, seller, or third party, to manipulate offer outcomes or undermine the integrity of the offer process;</li>
                  <li>(d) <strong className="text-navy">Impersonation:</strong> representing yourself as another person or entity, whether real or fictitious, in any part of the Platform;</li>
                  <li>(e) <strong className="text-navy">Circumventing verification:</strong> attempting to bypass, defeat, or work around TrueBid&rsquo;s identity verification process by any means, including the use of false documents, third-party identities, or multiple accounts.</li>
                </ul>
                <P>8.3 Where TrueBid reasonably believes a breach of clause 8.2 has occurred, TrueBid may take any or all of the following actions: remove affected offers from the Platform; suspend or permanently terminate the accounts of all involved parties; refer the conduct to relevant authorities, including state consumer protection bodies, where appropriate. These consequences are in addition to any other rights TrueBid may have under these Terms or at law.</P>
                <P>8.4 TrueBid may investigate any suspected breach of this section and take any action it considers appropriate, including immediate account suspension, permanent bans, removal of listings or offers, and referral to law enforcement authorities.</P>
              </div>
              <Divider />
            </section>

            {/* 9. Account Suspension & Termination */}
            <section>
              <SectionHeading id="suspension" number="9" title="Account Suspension & Termination" />
              <div className="space-y-3">
                <P>9.1 TrueBid may suspend or terminate your account at any time if:</P>
                <ul className="text-text-muted leading-relaxed list-none space-y-2" style={subListStyle}>
                  <li>(a) you breach any provision of these Terms;</li>
                  <li>(b) we reasonably suspect fraudulent, deceptive, or harmful conduct;</li>
                  <li>(c) you fail to complete identity verification when required;</li>
                  <li>(d) your use of the Platform creates legal or reputational risk for TrueBid or other users.</li>
                </ul>
                <P>9.2 If your account is suspended, you must not attempt to create a new account without prior written approval from TrueBid.</P>
                <P>9.3 You may close your account at any time by contacting us at <a href="mailto:hello@truebid.com.au" className="underline hover:text-navy">hello@truebid.com.au</a>. Closing your account does not affect any obligations you have already incurred through submitted or accepted offers.</P>
                <P>9.4 TrueBid will retain certain account and transaction records after closure as required by law and our Privacy Policy.</P>
              </div>
              <Divider />
            </section>

            {/* 10. Privacy & Data */}
            <section>
              <SectionHeading id="privacy" number="10" title="Privacy & Data" />
              <div className="space-y-3">
                <P>10.1 TrueBid collects, stores, and uses personal information in accordance with our Privacy Policy, which forms part of these Terms and is available at <a href="/privacy" className="underline hover:text-navy">truebid.com.au/privacy</a>.</P>
                <P>10.2 By using the Platform, you consent to the collection and use of your personal information as described in the Privacy Policy.</P>
                <P>10.3 TrueBid complies with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).</P>
                <P>10.4 TrueBid will not sell your personal information to third parties. We may share information with third-party service providers (including identity verification providers, cloud hosting services, and payment processors) solely for the purpose of operating the Platform.</P>
                <P>10.5 Offer amounts and submission times are visible to other registered buyers during an active Live Offers period. By submitting an offer, you consent to this disclosure.</P>
                <P>10.6 TrueBid may use anonymised and aggregated data for research, product development, and market reporting purposes.</P>
              </div>
              <Divider />
            </section>

            {/* 11. Intellectual Property */}
            <section>
              <SectionHeading id="ip" number="11" title="Intellectual Property" />
              <div className="space-y-3">
                <P>11.1 All content on the Platform created by TrueBid, including the TrueBid name, logo, design, software, and written content, is owned by or licensed to TrueBid and is protected by Australian and international intellectual property laws.</P>
                <P>11.2 By submitting listing content, photos, or other material to the Platform, you grant TrueBid a non-exclusive, royalty-free, worldwide licence to use, display, and reproduce that content for the purposes of operating and promoting the Platform.</P>
                <P>11.3 You represent and warrant that any content you submit does not infringe the intellectual property rights of any third party.</P>
                <P>11.4 You must not reproduce, copy, modify, or distribute any part of the Platform without prior written consent from TrueBid.</P>
              </div>
              <Divider />
            </section>

            {/* 12. Liability & Disclaimers */}
            <section>
              <SectionHeading id="liability" number="12" title="Liability & Disclaimers" />
              <div className="space-y-3">
                <P>12.1 To the maximum extent permitted by law, TrueBid provides the Platform on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, express or implied.</P>
                <P>12.2 TrueBid does not warrant that:</P>
                <ul className="text-text-muted leading-relaxed list-none space-y-2" style={subListStyle}>
                  <li>(a) the Platform will be uninterrupted, error-free, or secure at all times;</li>
                  <li>(b) any property listing is accurate, complete, or fit for any purpose;</li>
                  <li>(c) any offer made through the Platform will result in a completed transaction.</li>
                </ul>
                <P>12.3 TrueBid is not a party to any contract of sale between a buyer and a seller. We are not responsible for the conduct of any user, the accuracy of any listing, or the outcome of any transaction.</P>
                <P>12.4 To the maximum extent permitted by Australian Consumer Law, TrueBid&rsquo;s total liability to you for any claim arising out of or in connection with your use of the Platform is limited to the fees you paid to TrueBid in the 12 months preceding the claim, or $500 AUD, whichever is greater.</P>
                <P>12.5 TrueBid is not liable for any indirect, incidental, special, or consequential loss or damage, including loss of profit, loss of data, or loss of opportunity, even if we have been advised of the possibility of such loss.</P>
                <P>12.6 Nothing in these Terms excludes, restricts, or modifies any right or remedy you may have under the Australian Consumer Law that cannot be excluded, restricted, or modified by agreement.</P>
              </div>
              <Divider />
            </section>

            {/* 13. Dispute Resolution */}
            <section>
              <SectionHeading id="disputes" number="13" title="Dispute Resolution" />
              <div className="space-y-3">
                <P>13.1 If you have a complaint about the Platform or another user, you should contact TrueBid first at <a href="mailto:hello@truebid.com.au" className="underline hover:text-navy">hello@truebid.com.au</a>. We will acknowledge your complaint within 2 business days and aim to resolve it within 10 business days.</P>
                <P>13.2 If your complaint is not resolved to your satisfaction, either party may refer the matter to mediation before a mutually agreed mediator. The costs of mediation will be shared equally unless the mediator determines otherwise.</P>
                <P>13.3 TrueBid does not act as arbitrator or adjudicator in disputes between buyers and sellers regarding the terms of any transaction. Such disputes are a matter for the parties and their legal representatives.</P>
                <P>13.4 Nothing in this section prevents either party from seeking urgent injunctive or other equitable relief from a court of competent jurisdiction.</P>
              </div>
              <Divider />
            </section>

            {/* 14. Governing Law & Jurisdiction */}
            <section>
              <SectionHeading id="governing-law" number="14" title="Governing Law & Jurisdiction" />
              <div className="space-y-3">
                <P>14.1 These Terms are governed by the laws of Western Australia, Australia.</P>
                <P>14.2 Each party submits to the exclusive jurisdiction of the courts of Western Australia and the Federal Court of Australia for the resolution of any dispute arising out of or in connection with these Terms.</P>
                <P>14.3 If any provision of these Terms is found to be invalid, unenforceable, or illegal, that provision will be severed and the remaining provisions will continue in full force and effect.</P>
              </div>
              <Divider />
            </section>

            {/* 15. Changes to These Terms */}
            <section>
              <SectionHeading id="changes" number="15" title="Changes to These Terms" />
              <div className="space-y-3">
                <P>15.1 TrueBid may update these Terms at any time. Where changes are material, we will notify registered users by email and display a notice on the Platform at least 14 days before the changes take effect.</P>
                <P>15.2 Your continued use of the Platform after the effective date of any updated Terms constitutes your acceptance of those changes.</P>
                <P>15.3 If you do not agree to updated Terms, you must stop using the Platform and may close your account.</P>
              </div>
              <Divider />
            </section>

            {/* 16. Contact */}
            <section>
              <SectionHeading id="contact" number="16" title="Contact" />
              <div className="space-y-3">
                <P>For questions about these Terms, contact us at:</P>
                <div className="text-text-muted leading-relaxed" style={paraStyle}>
                  <p className="font-semibold text-navy">TrueBid</p>
                  <p>TrueBid Pty Ltd</p>
                  <p>Perth, Western Australia</p>
                  <p><a href="mailto:hello@truebid.com.au" className="underline hover:text-navy">hello@truebid.com.au</a></p>
                </div>
              </div>
            </section>
          </div>

          {/* Nav links */}
          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="text-sm text-text-muted hover:text-navy underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-text-muted hover:text-navy underline"
            >
              How It Works
            </Link>
            <Link
              href="/faq"
              className="text-sm text-text-muted hover:text-navy underline"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
