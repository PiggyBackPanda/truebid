"use client";

import { useState } from "react";
import Link from "next/link";

const SELLER_STEPS = [
  {
    title: "Create your listing (15 minutes)",
    body: "Sign up and verify your identity, then enter your property details: address, bedrooms, bathrooms, land size, and a description of your home. Upload your best photos (your phone camera is fine; good lighting makes a big difference). Choose your sale method: Live Offers for transparent, competitive offers, Private Offers if you prefer discretion, or Fixed Price if you know exactly what you want.",
  },
  {
    title: "Go live and attract buyers",
    body: "Hit publish and your listing goes live instantly. Buyers can find your property through our search, browse the details, and for Live Offers listings, see the live offer board. You manage everything from your seller dashboard: track views, respond to questions, and watch offers come in.",
  },
  {
    title: "Review offers and proceed",
    body: "When your Live Offers closing date arrives, review all offers in your dashboard. You'll see each buyer's offer amount, their conditions, and their preferred settlement timeline. You choose the offer that suits you best. It doesn't have to be the highest. An unconditional offer with a quick settlement might be worth more to you than a higher offer subject to finance.",
  },
  {
    title: "Settle with your conveyancer",
    body: "Once you decide to proceed with a buyer, engage a licensed settlement agent to prepare the formal Contract of Sale. The buyer arranges their deposit, inspections, and finance. Both parties sign, and your settlement agent handles the transfer of title. We provide a checklist to guide you through every step.",
  },
];

const BUYER_STEPS = [
  {
    title: "Browse and search",
    body: "Find properties by suburb, postcode, or address. Filter by price, bedrooms, property type, and sale method. No sign-up needed to browse listings and photos. Create a free account to view the live offer board and place offers. It takes less than a minute.",
  },
  {
    title: "Verify and place an offer",
    body: "When you find a property you love, verify your identity (takes 2 minutes with your driver's licence) and place your offer. For Live Offers listings, you'll see exactly where your offer ranks against other buyers: no guesswork, no phantom offers, no games.",
  },
  {
    title: "Compete transparently",
    body: "You can see every other offer's amount and submission time. Personal details and offer conditions are kept private. If another buyer places a higher offer, you'll be notified instantly so you can decide whether to raise your offer. Sellers consider both price and terms when choosing: an unconditional offer might win over a higher offer with conditions attached.",
  },
  {
    title: "Proceed and settle",
    body: "If the seller chooses to proceed with your offer, you'll be notified and guided through the next steps, including engaging a settlement agent to prepare the formal contract of sale. From there, arrange your building and pest inspection (if conditional), finalise your finance, and proceed to exchange and settlement.",
  },
];

function StepCard({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full bg-navy text-white font-bold text-sm"
        style={{ width: 32, height: 32, marginTop: 2 }}
      >
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-navy text-base mb-1.5">{title}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

type Tab = "seller" | "buyer";

export function HowItWorksToggle() {
  const [tab, setTab] = useState<Tab>("seller");

  const steps = tab === "seller" ? SELLER_STEPS : BUYER_STEPS;

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div
            className="inline-flex rounded-lg border border-border bg-bg p-1 gap-1"
            role="tablist"
            aria-label="View steps for seller or buyer"
          >
            <button
              role="tab"
              aria-selected={tab === "seller"}
              onClick={() => setTab("seller")}
              className="px-6 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer"
              style={{
                fontFamily: "var(--font-sans)",
                background: tab === "seller" ? "#0f1623" : "transparent",
                color: tab === "seller" ? "#ffffff" : "#334766",
              }}
            >
              I&apos;m a seller
            </button>
            <button
              role="tab"
              aria-selected={tab === "buyer"}
              onClick={() => setTab("buyer")}
              className="px-6 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer"
              style={{
                fontFamily: "var(--font-sans)",
                background: tab === "buyer" ? "#0f1623" : "transparent",
                color: tab === "buyer" ? "#ffffff" : "#334766",
              }}
            >
              I&apos;m a buyer
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <StepCard key={i} number={i + 1} title={step.title} body={step.body} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          {tab === "seller" ? (
            <Link
              href="/register"
              className="inline-block bg-amber text-navy font-semibold text-sm px-8 py-4 rounded-[10px] hover:bg-amber-light transition-colors shadow-amber"
            >
              List Your Home Free During Launch
            </Link>
          ) : (
            <Link
              href="/listings"
              className="inline-block bg-navy text-white font-semibold text-sm px-8 py-4 rounded-[10px] hover:bg-navy-light transition-colors"
            >
              Browse Properties
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
