import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | TrueBid",
  description:
    "Frequently asked questions about TrueBid's free, transparent property sales platform. Selling, buying, Live Offers, commissions, and more.",
};

const FAQ_CATEGORIES = [
  {
    category: "How TrueBid Works",
    items: [
      {
        q: "What is TrueBid?",
        a: "TrueBid is a property sales platform built for Australia, currently free to use. Every offer on a property is visible to all registered buyers in real time: no hidden negotiations, no hidden offer processes. You can see where you stand at any point during the offer period. The How It Works page walks through the full process step by step.",
        inlineLink: { text: "How It Works page", href: "/how-it-works" },
      },
      {
        q: "How is TrueBid different from a traditional sale?",
        a: "In a traditional private sale, buyers have no visibility into what others are offering. The process happens privately between each buyer and the agent, with no way to know where you stand. TrueBid puts every offer on the table, publicly and in real time, so the process is transparent and the outcome reflects what buyers genuinely want to pay.",
      },
      {
        q: "Who is TrueBid for?",
        a: "TrueBid is built for anyone buying or selling residential property in Australia, whether you\u2019re a first home buyer, an investor, a downsizer, or a seller who wants a fairer process. You don\u2019t need to be tech-savvy; the platform is simple and straightforward.",
      },
      {
        q: "Does TrueBid work for all property types?",
        a: "TrueBid currently supports residential property sales, including houses, townhouses, and apartments. Rural and commercial listings are not supported at this stage.",
      },
      {
        q: "Is TrueBid legal in Australia?",
        a: "Yes. Live Offers is legal across Australia. TrueBid operates within existing property law and works alongside the standard contract process. It doesn\u2019t replace it.",
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
    category: "Live Offers",
    items: [
      {
        q: "What is a Live Offer?",
        a: "A Live Offer is TrueBid\u2019s core feature. When a property is listed with Live Offers enabled, all registered buyers can see every offer\u2019s amount and submission time in real time. Buyer identities and offer conditions are kept private. There are no secret offers.",
      },
      {
        q: "How long does a Live Offers period last?",
        a: "The seller sets the Live Offers window when they create their listing. This can range from 24 hours to several weeks depending on the campaign. The duration is clearly shown on every listing.",
      },
      {
        q: "Can buyers see other offers?",
        a: "Buyers can see offer amounts and submission times only. Personal details and offer conditions are kept private \u2014 only prices and timing are visible to other buyers.",
      },
      {
        q: "What is anti-snipe protection?",
        a: "Anti-snipe protection automatically extends the offer period if a new offer comes in within 10 minutes of the closing time. The closing time extends by 10 minutes, giving all buyers a fair chance to respond. This stops anyone from swooping in at the last second.",
      },
      {
        q: "Can I change or withdraw my offer?",
        a: "You can update your offer upward during the Live Offers period. Withdrawing an offer is possible but may be noted on your account record. We encourage buyers to only submit offers they are serious about.",
      },
      {
        q: "What happens if two offers come in at the same price?",
        a: "If two offers are identical, the earlier submission takes priority. This is another reason anti-snipe protection matters \u2014 it gives all buyers a genuine opportunity to put their best offer forward.",
      },
      {
        q: "Can a seller proceed with a buyer before the deadline?",
        a: "Yes. Sellers can choose to proceed with a buyer at any time during the offer period without waiting for it to close.",
      },
      {
        q: "What happens after a seller proceeds with a buyer?",
        a: "Once a seller indicates they want to proceed with a buyer, both parties are guided through the next steps, primarily engaging a licensed settlement agent or solicitor to prepare the formal contract of sale. No binding agreement exists until that contract is signed by both parties.",
      },
    ],
  },
  {
    category: "For Buyers",
    items: [
      {
        q: "How do I make an offer on a property?",
        a: "Create a free TrueBid account, verify your identity, and browse listed properties. When you find a property you want, submit your offer directly through the platform during the Live Offers window.",
      },
      {
        q: "Do I need to be pre-approved for finance?",
        a: "We strongly recommend having finance pre-approval before making an offer. Sellers are more likely to take your offer seriously, and it protects you from committing to a purchase you can\u2019t complete.",
      },
      {
        q: "Can I make offers on multiple properties at once?",
        a: "Yes, but be aware that if a seller chooses to proceed with you on multiple properties simultaneously, you may be legally obligated on more than one contract depending on your state\u2019s property laws. We recommend speaking with a conveyancer or solicitor before placing offers on multiple properties.",
      },
      {
        q: "What is a cooling-off period and does it apply to TrueBid sales?",
        a: "Cooling-off periods vary by state and apply to the contract stage, not the offer stage. Once the seller proceeds with your offer and contracts are exchanged, the standard rules for your state apply. Your conveyancer can advise you on your specific situation.",
      },
      {
        q: "I\u2019m a first home buyer. Does TrueBid support first home buyer grants or schemes?",
        a: "TrueBid is a sales platform and doesn\u2019t administer government grants or schemes. However, buying through TrueBid doesn\u2019t affect your eligibility for any first home buyer grants, stamp duty concessions, or schemes you qualify for.",
      },
      {
        q: "What if I want to make an offer before the Live Offers period opens?",
        a: "Some sellers may choose to proceed with an early offer. Check the individual listing for details. If a Live Offers period is active, all offers must go through the platform.",
      },
      {
        q: "Is there a cost to buyers?",
        a: "No. There is no charge to buyers for using TrueBid.",
      },
    ],
  },
  {
    category: "For Sellers",
    items: [
      {
        q: "How do I list my property on TrueBid?",
        a: "Create a seller account, complete your property details, upload photos and documents, and set your Live Offers preferences, including the offer window duration and minimum offer threshold. Once you publish, your listing goes live immediately as Coming Soon, or straight to Active if you choose.",
      },
      {
        q: "How long does it take to get my property listed?",
        a: "Publishing is instant. Once you complete your listing details, upload photos, and choose your sale method, you can publish and your listing goes live right away.",
      },
      {
        q: "What does it cost to list on TrueBid?",
        a: "Listing on TrueBid is free during our current launch period. Fees will be introduced in the future with advance notice to registered users. Any listings active at the time of the fee change will complete their current listing period at no charge. We do not charge commission.",
      },
      {
        q: "Can I set a minimum offer threshold?",
        a: "You can set a minimum offer threshold in your listing settings. Offers below this amount will not appear on the public board, though you will still see them in your seller dashboard. This acts as a non-binding floor, not a legal obligation. You are never required to sell simply because an offer meets the threshold.",
      },
      {
        q: "What information do I need to provide to list my property?",
        a: "You\u2019ll need a property description, photos, title details, and any relevant documents such as a Section 32 (Vendor\u2019s Statement) or building reports. The more information you provide upfront, the more confident buyers will be.",
      },
      {
        q: "Can I pause or remove my listing?",
        a: "Yes. You can pause or withdraw your listing at any time before a contract is exchanged. If a Live Offers period is active, you\u2019ll be prompted to notify registered buyers before closing it.",
      },
      {
        q: "What if I don\u2019t get the price I want?",
        a: "You are never obligated to proceed with any offer. If the Live Offers period closes without a suitable offer, you can relist, negotiate privately, or choose not to sell.",
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
        a: "TrueBid strongly recommends engaging a licensed conveyancer or solicitor before you make or respond to any offer. They will review the contract of sale, advise you on your rights and obligations, and handle the settlement process. This applies to both buyers and sellers.",
      },
      {
        q: "What is a Section 32 and do I need one?",
        a: "A Section 32 (also called a Vendor\u2019s Statement) is a legal document required in Victoria that discloses key information about a property to the buyer before sale. Other states have equivalent disclosure requirements under different names. Sellers should prepare this document with their conveyancer before listing. TrueBid allows sellers to attach disclosure documents directly to their listing so buyers can review them before making an offer.",
      },
      {
        q: "What is a cooling-off period and when does it apply?",
        a: "A cooling-off period gives a buyer the right to withdraw from a signed contract within a set number of days without forfeiting their full deposit. The rules vary by state \u2014 Victoria allows 3 business days, Queensland allows 5, and New South Wales allows 5. Cooling-off periods do not apply to purchases made through a private sale in most states. Your conveyancer can confirm the rules that apply to your transaction.",
      },
      {
        q: "What deposit is required and when is it paid?",
        a: "The deposit is typically 10% of the purchase price, though this can be negotiated. It is paid at the time of signing the contract of sale, not when the offer is submitted on TrueBid. Your conveyancer will advise on the exact amount and timing for your transaction.",
      },
      {
        q: "What happens at settlement?",
        a: "Settlement is the final stage of a property sale, where ownership is legally transferred to the buyer and the remaining purchase funds are paid to the seller. TrueBid\u2019s role ends when the seller indicates they want to proceed: your conveyancer manages everything from contract signing through to settlement.",
      },
      {
        q: "What if the property doesn\u2019t settle on time?",
        a: "Delayed settlements are handled under the terms of the contract of sale. Most contracts include penalty provisions for late settlement. This is a matter between the parties and their legal representatives \u2014 not something TrueBid administers.",
      },
      {
        q: "Can a seller change their mind after indicating they want to proceed with a buyer?",
        a: "Before contracts are signed, a seller may choose not to proceed. No binding obligation exists at the offer stage on TrueBid. Once contracts are exchanged, withdrawing is a serious legal matter and the seller should seek immediate legal advice.",
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
        a: "Yes. TrueBid uses industry-standard encryption and does not sell your data to third parties. Your personal details are never visible to other buyers.",
      },
      {
        q: "What happens if a buyer withdraws after the seller has chosen to proceed with them?",
        a: "This depends on the stage of the transaction. If contracts have been exchanged, the buyer may forfeit their deposit and face legal consequences under standard Australian property law. If contracts have not yet been signed, no binding obligation exists and TrueBid records the event. The buyer\u2019s access to the platform may be reviewed.",
      },
      {
        q: "What if someone submits a fake or malicious offer?",
        a: "Verified identity requirements significantly reduce this risk. If a buyer fails to proceed after the seller has indicated they want to move forward, this is recorded on their account and may affect future platform access.",
      },
      {
        q: "How do I report a problem with a buyer or seller?",
        a: "You can report any conduct concerns by contacting us directly at hello@truebid.com.au. Our team aims to follow up within two business days. For urgent legal matters, contact your solicitor or the relevant state consumer protection authority.",
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
            fontFamily: "Georgia, 'Times New Roman', serif",
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
            fontFamily: "var(--font-sans)",
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
                    fontFamily: "Georgia, 'Times New Roman', serif",
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
                            fontFamily: "var(--font-sans)",
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
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {item.inlineLink ? (() => {
                            const parts = item.a.split(item.inlineLink.text);
                            return (
                              <>
                                {parts[0]}
                                <Link href={item.inlineLink.href} style={{ color: "#b45309", textDecoration: "underline" }}>{item.inlineLink.text}</Link>
                                {parts[1]}
                              </>
                            );
                          })() : item.a}
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
            style={{ fontSize: 14, fontFamily: "var(--font-sans)" }}
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
              href="/contact"
              className="inline-block border border-border text-text font-medium text-sm px-6 py-3 rounded-[10px] hover:bg-white transition-colors text-center"
            >
              Contact us
            </Link>
            <Link
              href="/register"
              className="inline-block bg-amber text-navy font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-amber-light transition-colors text-center"
            >
              Create a Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
