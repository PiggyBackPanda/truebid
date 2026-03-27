import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — TrueBid",
  description:
    "Frequently asked questions about TrueBid's free, transparent property sales platform. Selling, buying, Open Offers, commissions, and more.",
};

const FAQ_CATEGORIES = [
  {
    category: "How TrueBid Works",
    items: [
      {
        q: "What is TrueBid?",
        a: "TrueBid is a free, transparent property sales platform built for Australia. Every offer on a property is visible to all registered buyers in real time \u2014 no hidden negotiations, no blind auctions. You always know exactly where you stand.",
      },
      {
        q: "How is TrueBid different from a traditional sale?",
        a: "In a traditional private sale, buyers have no idea what others are offering. Agents can play buyers off each other behind closed doors. TrueBid puts every offer on the table \u2014 publicly and in real time \u2014 so the best price is reached fairly and openly.",
      },
      {
        q: "Who is TrueBid for?",
        a: "TrueBid is built for anyone buying or selling residential property in Australia \u2014 whether you\u2019re a first home buyer, an investor, a downsizer, or a seller who wants a fairer process. You don\u2019t need to be tech-savvy; the platform is designed to be simple and straightforward.",
      },
      {
        q: "Does TrueBid work for all property types?",
        a: "TrueBid currently supports residential property sales, including houses, townhouses, and apartments. Rural and commercial listings are not supported at this stage.",
      },
      {
        q: "Is TrueBid legal in Australia?",
        a: "Yes. Open offer selling is legal across Australia. TrueBid operates within existing property law and is designed to complement, not replace, the standard contract process.",
      },
      {
        q: "Do I need an agent to use TrueBid?",
        a: "Sellers can choose to work with a licensed real estate agent or sell privately. TrueBid is the platform \u2014 it works either way.",
      },
      {
        q: "Do I need to create an account to browse listings?",
        a: "No. Anyone can browse listed properties without an account. You only need to register when you want to make an offer or list a property for sale.",
      },
    ],
  },
  {
    category: "Open Offers",
    items: [
      {
        q: "What is an Open Offer?",
        a: "An Open Offer is TrueBid\u2019s core feature. When a property is listed with Open Offers enabled, all registered buyers can see every offer submitted \u2014 including the amount and timing \u2014 in real time. There are no secret bids.",
      },
      {
        q: "How long does an Open Offer period last?",
        a: "The seller sets the Open Offer window when they create their listing. This can range from 24 hours to several weeks depending on the campaign. The duration is clearly shown on every listing.",
      },
      {
        q: "Can buyers see who else is bidding?",
        a: "Buyers can see offer amounts and timing but not the personal details of other buyers. Identity privacy is protected while price transparency is maintained.",
      },
      {
        q: "What is anti-snipe protection?",
        a: "Anti-snipe protection automatically extends the offer period if a new offer comes in close to the deadline. This prevents buyers from waiting until the last second to swoop in, giving all parties a fair chance to respond.",
      },
      {
        q: "Can I change or withdraw my offer?",
        a: "You can update your offer upward during the Open Offer period. Withdrawing an offer is possible but may be noted on your account record. We encourage buyers to only submit offers they are serious about.",
      },
      {
        q: "What happens if two offers come in at the same price?",
        a: "If two offers are identical, the earlier submission takes priority. This is another reason anti-snipe protection matters \u2014 it gives all buyers a genuine opportunity to put their best offer forward.",
      },
      {
        q: "Can a seller still accept an offer before the deadline?",
        a: "Yes. Sellers can accept an offer at any time if it meets their expectations. The Open Offer period is a minimum window, not a fixed end point.",
      },
      {
        q: "What happens after an offer is accepted?",
        a: "Once a seller accepts an offer, the standard contract process begins \u2014 the same as any property sale in Australia. TrueBid facilitates the offer stage; your conveyancer or solicitor handles the legal contract.",
      },
    ],
  },
  {
    category: "For Buyers",
    items: [
      {
        q: "How do I make an offer on a property?",
        a: "Create a free TrueBid account, verify your identity, and browse listed properties. When you find a property you want, submit your offer directly through the platform during the Open Offer window.",
      },
      {
        q: "Do I need to be pre-approved for finance?",
        a: "We strongly recommend having finance pre-approval before making an offer. Sellers are more likely to take your offer seriously, and it protects you from committing to a purchase you can\u2019t complete.",
      },
      {
        q: "Can I make offers on multiple properties at once?",
        a: "Yes, but be aware that if multiple offers are accepted simultaneously, you may be legally obligated on more than one contract depending on your state\u2019s property laws. We recommend speaking with a conveyancer or solicitor before bidding on multiple properties.",
      },
      {
        q: "What is a cooling-off period and does it apply to TrueBid sales?",
        a: "Cooling-off periods vary by state and apply to the contract stage, not the offer stage. Once your offer is accepted and contracts are exchanged, the standard rules for your state apply. Your conveyancer can advise you on your specific situation.",
      },
      {
        q: "I\u2019m a first home buyer. Does TrueBid support first home buyer grants or schemes?",
        a: "TrueBid is a sales platform and doesn\u2019t administer government grants or schemes. However, buying through TrueBid doesn\u2019t affect your eligibility for any first home buyer grants, stamp duty concessions, or schemes you qualify for.",
      },
      {
        q: "What if I want to make an offer before the Open Offer period opens?",
        a: "Some sellers may accept early offers. Check the individual listing for details. If an Open Offer period is active, all offers must go through the platform.",
      },
      {
        q: "Is there a cost to buyers?",
        a: "No. TrueBid is completely free for buyers.",
      },
    ],
  },
  {
    category: "For Sellers",
    items: [
      {
        q: "How do I list my property on TrueBid?",
        a: "Create a seller account, complete your property details, upload photos and documents, and set your Open Offer preferences \u2014 including the offer window duration and reserve expectations. Our team reviews every listing before it goes live.",
      },
      {
        q: "How long does it take to get my property listed?",
        a: "Once you submit your listing, our team reviews it for completeness and accuracy. Most listings are approved and live within one business day.",
      },
      {
        q: "What does it cost to list on TrueBid?",
        a: "Listing on TrueBid is free. [Update this answer with your actual fee/commission model before launch.]",
      },
      {
        q: "Can I set a reserve price?",
        a: "You can set a confidential reserve. Buyers will not see the exact reserve, but you will only be obligated to sell if an offer meets it.",
      },
      {
        q: "Can I set a \u2018buy it now\u2019 price to accept an offer immediately?",
        a: "Yes. You can set an instant acceptance price in your listing settings. If any buyer meets that price, the offer is automatically accepted and the Open Offer period closes.",
      },
      {
        q: "What information do I need to provide to list my property?",
        a: "You\u2019ll need a property description, photos, title details, and any relevant documents such as a Section 32 (Vendor\u2019s Statement) or building reports. The more information you provide upfront, the more confident buyers will be.",
      },
      {
        q: "Can I pause or remove my listing?",
        a: "Yes. You can pause or withdraw your listing at any time before a contract is exchanged. If an Open Offer period is active, you\u2019ll be prompted to notify registered buyers before closing it.",
      },
      {
        q: "What if I don\u2019t get the price I want?",
        a: "You are never obligated to accept an offer you are not happy with. If the Open Offer period closes without an acceptable offer, you can relist, negotiate privately, or choose not to sell.",
      },
      {
        q: "Can I use TrueBid alongside a real estate agent?",
        a: "Yes. TrueBid is a platform, not an agency. Your agent can manage the campaign and communications while offers flow through TrueBid transparently.",
      },
    ],
  },
  {
    category: "Contracts, Legal & Conveyancing",
    items: [
      {
        q: "When does a TrueBid offer become legally binding?",
        a: "A submitted offer on TrueBid is an expression of intent, not a legally binding contract. A sale only becomes legally binding once both parties have signed a formal contract of sale and, where applicable, the cooling-off period has passed. Your conveyancer or solicitor will manage this stage.",
      },
      {
        q: "Do I need a conveyancer or solicitor to buy or sell through TrueBid?",
        a: "TrueBid strongly recommends engaging a licensed conveyancer or solicitor before you make or accept any offer. They will review the contract of sale, advise you on your rights and obligations, and handle the settlement process. This applies to both buyers and sellers.",
      },
      {
        q: "What is a Section 32 and do I need one?",
        a: "A Section 32 (also called a Vendor\u2019s Statement) is a legal document required in Victoria that discloses key information about a property to the buyer before sale. Other states have equivalent disclosure requirements under different names. Sellers should prepare this document with their conveyancer before listing. TrueBid allows sellers to attach disclosure documents directly to their listing so buyers can review them before making an offer.",
      },
      {
        q: "What is a cooling-off period and when does it apply?",
        a: "A cooling-off period gives a buyer the right to withdraw from a signed contract within a set number of days without forfeiting their full deposit. The rules vary by state \u2014 Victoria allows 3 business days, Queensland allows 5, and New South Wales allows 5. Cooling-off periods do not apply to purchases made at auction in most states. Your conveyancer can confirm the rules that apply to your transaction.",
      },
      {
        q: "What deposit is required and when is it paid?",
        a: "The deposit is typically 10% of the purchase price, though this can be negotiated. It is paid at the time of signing the contract of sale, not when the offer is submitted on TrueBid. Your conveyancer will advise on the exact amount and timing for your transaction.",
      },
      {
        q: "What happens at settlement?",
        a: "Settlement is the final stage of a property sale, where ownership is legally transferred to the buyer and the remaining purchase funds are paid to the seller. TrueBid\u2019s role ends at the accepted offer stage \u2014 your conveyancer manages everything from contract signing through to settlement.",
      },
      {
        q: "What if the property doesn\u2019t settle on time?",
        a: "Delayed settlements are handled under the terms of the contract of sale. Most contracts include penalty provisions for late settlement. This is a matter between the parties and their legal representatives \u2014 not something TrueBid administers.",
      },
      {
        q: "Can a seller back out after accepting an offer on TrueBid?",
        a: "Before contracts are signed, a seller may choose not to proceed, though this could affect their reputation on the platform and may have implications depending on the circumstances. Once contracts are exchanged, withdrawing is a serious legal matter and the seller should seek immediate legal advice.",
      },
    ],
  },
  {
    category: "Trust & Safety",
    items: [
      {
        q: "How does TrueBid verify buyers?",
        a: "All buyers must verify their identity before submitting an offer. This prevents fake or frivolous offers and ensures sellers are dealing with genuine parties.",
      },
      {
        q: "Is my personal information secure?",
        a: "Yes. TrueBid uses bank-grade encryption and does not sell your data to third parties. Personal details are never shared with other buyers.",
      },
      {
        q: "What happens if a buyer pulls out after their offer is accepted?",
        a: "This depends on the stage of the transaction. If contracts have been exchanged, the buyer may forfeit their deposit and face legal consequences under standard Australian property law. If contracts have not yet been signed, TrueBid records the event and the buyer\u2019s access to the platform may be reviewed.",
      },
      {
        q: "What if someone submits a fake or malicious offer?",
        a: "Verified identity requirements significantly reduce this risk. If a buyer fails to proceed after an accepted offer, this is recorded on their account and may affect future platform access.",
      },
      {
        q: "How do I report a problem with a buyer or seller?",
        a: 'You can report any conduct concerns directly through the platform using the "Report an issue" option on the relevant listing or offer. Our team reviews all reports and will contact you within two business days. For urgent legal matters, contact your solicitor or the relevant state consumer protection authority.',
      },
      {
        q: "How does TrueBid handle disputes between buyers and sellers?",
        a: "TrueBid is a platform, not a legal authority. We facilitate the offer process but disputes that arise at the contract stage are handled through standard legal channels \u2014 your conveyancer, solicitor, or the relevant state consumer protection body. We do take platform conduct seriously and will investigate any reported misuse.",
      },
      {
        q: "Is TrueBid regulated?",
        a: "TrueBid operates in compliance with Australian Consumer Law and relevant state property legislation. We are not a licensed real estate agency, and where an agent is involved in a sale, that agent holds the relevant licence and professional obligations.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="bg-navy py-16 px-6 text-center">
        <h1
          className="text-white mb-3"
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Frequently Asked Questions
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontFamily: "Outfit, sans-serif",
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          Everything you need to know about TrueBid.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-6">
          {FAQ_CATEGORIES.map((cat, ci) => (
            <details
              key={ci}
              className="bg-white border border-border rounded-xl group/cat"
              open={ci === 0}
            >
              <summary
                className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer select-none"
                style={{ listStyle: "none" }}
              >
                <h2
                  className="text-navy m-0"
                  style={{
                    fontFamily: "DM Serif Display, Georgia, serif",
                    fontSize: "clamp(18px, 3vw, 22px)",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {cat.category}
                </h2>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="flex-shrink-0 text-text-muted transition-transform duration-200 group-open/cat:rotate-180"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7.5l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>

              <div className="px-6 pb-5">
                <div className="border-t border-border pt-3 space-y-1">
                  {cat.items.map((item, qi) => (
                    <details
                      key={qi}
                      className="group/q rounded-lg"
                      style={{ listStyle: "none" }}
                    >
                      <summary
                        className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer select-none rounded-lg hover:bg-slate-50 transition-colors"
                        style={{ listStyle: "none" }}
                      >
                        <span
                          className="font-semibold text-navy"
                          style={{
                            fontSize: 14,
                            fontFamily: "Outfit, sans-serif",
                          }}
                        >
                          {item.q}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="flex-shrink-0 text-text-muted transition-transform duration-200 group-open/q:rotate-180"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </summary>
                      <div className="px-4 pb-3">
                        <p
                          className="text-text-muted leading-relaxed"
                          style={{
                            fontSize: 14,
                            fontFamily: "Outfit, sans-serif",
                          }}
                        >
                          {item.a}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center border-t border-border pt-10">
          <p
            className="text-text-muted mb-6"
            style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
          >
            Still have questions?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/how-it-works"
              className="inline-block border border-border text-text font-medium text-sm px-6 py-3 rounded-[10px] hover:bg-white transition-colors text-center"
            >
              How it works
            </Link>
            <Link
              href="/register"
              className="inline-block bg-amber text-navy font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-amber-light transition-colors text-center"
            >
              Get started for free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
