# TrueBid — WA Legal Checklist Content

## Usage

This JSON is read by the legal checklist component on the seller dashboard. Each item has a key, title, description, mandatory flag, help text, and an optional CTA for referral partners.

```json
[
  {
    "key": "wa_settlement_agent",
    "title": "Engage a settlement agent",
    "description": "A licensed settlement agent prepares your Contract of Sale, manages the transfer of title, and handles settlement. This is essential before you can exchange contracts with a buyer.",
    "mandatory": true,
    "helpText": "In WA, settlement agents are licensed under the Settlement Agents Act 1981. Typical cost: $700–$1,500. Your settlement agent should be engaged before you accept an offer.",
    "ctaLabel": "Find a settlement agent",
    "ctaType": "referral_partner",
    "partnerBusinessType": "settlement_agent"
  },
  {
    "key": "wa_title_search",
    "title": "Obtain a current title search",
    "description": "Your settlement agent obtains a copy of your Certificate of Title from Landgate to confirm ownership, lot details, and any encumbrances (mortgages, caveats, easements).",
    "mandatory": true,
    "helpText": "Your settlement agent handles this for you. Cost is approximately $25–$30 from Landgate. It confirms you legally own the property and identifies anything registered against the title.",
    "ctaLabel": null,
    "ctaType": null,
    "partnerBusinessType": null
  },
  {
    "key": "wa_contract_sale",
    "title": "Prepare the Contract of Sale",
    "description": "The standard WA contract is the REIWA/Law Society Joint Form of General Conditions for the Sale of Land. Your settlement agent prepares this with the agreed terms once you accept an offer.",
    "mandatory": true,
    "helpText": "The contract includes the purchase price, settlement date, deposit amount, any special conditions, and the general conditions of sale. Your settlement agent drafts this — you don't need to write it yourself.",
    "ctaLabel": null,
    "ctaType": null,
    "partnerBusinessType": null
  },
  {
    "key": "wa_strata_docs",
    "title": "Obtain strata documents (if applicable)",
    "description": "If your property is strata-titled (unit, townhouse, or some houses), you need to provide Form 28 (annual budget and financial statements) and Form 29 (information from strata company) to the buyer.",
    "mandatory": false,
    "helpText": "Contact your strata manager to request these forms. They're typically provided within 5–10 business days. Cost varies but is usually $50–$150. Not required for freehold/green title properties.",
    "ctaLabel": null,
    "ctaType": null,
    "partnerBusinessType": null
  },
  {
    "key": "wa_building_approvals",
    "title": "Gather building approval documentation",
    "description": "If you've made renovations, extensions, or additions to the property, gather the relevant building permits and certificates of completion. Buyers and their inspectors will ask for these.",
    "mandatory": false,
    "helpText": "Check with your local council for records of approved building permits. If renovations were done without permits, disclose this to potential buyers — it's a material fact that can affect the sale.",
    "ctaLabel": null,
    "ctaType": null,
    "partnerBusinessType": null
  },
  {
    "key": "wa_property_valuation",
    "title": "Get a property valuation or market appraisal",
    "description": "Understanding your property's market value helps you set a realistic guide price. This can be a formal valuation or a comparative market analysis.",
    "mandatory": false,
    "helpText": "Options: 1) Formal sworn valuation by a licensed valuer ($300–$600) — useful if you need certainty. 2) Free online estimates from CoreLogic or similar — useful as a rough guide. 3) Check recent sales of similar properties in your area on realestate.com.au.",
    "ctaLabel": null,
    "ctaType": null,
    "partnerBusinessType": null
  },
  {
    "key": "wa_mortgage_discharge",
    "title": "Arrange mortgage discharge (if applicable)",
    "description": "If you have an existing mortgage on the property, your lender needs to discharge it at settlement. This can take 2–4 weeks, so start early.",
    "mandatory": false,
    "helpText": "Contact your bank or lender and request a discharge of mortgage. Your settlement agent will coordinate the timing so the discharge happens at settlement. Most lenders charge a discharge fee ($150–$350).",
    "ctaLabel": null,
    "ctaType": null,
    "partnerBusinessType": null
  },
  {
    "key": "wa_building_pest",
    "title": "Consider a pre-sale building and pest inspection",
    "description": "Having a recent building and pest inspection report available for buyers can speed up the sale process and reduce conditional offers.",
    "mandatory": false,
    "helpText": "Cost: $300–$600 depending on property size. A clean report gives buyers confidence and may encourage unconditional offers. If issues are found, you can address them before listing or disclose them upfront.",
    "ctaLabel": "Find a building inspector",
    "ctaType": "referral_partner",
    "partnerBusinessType": "building_inspector"
  }
]
```

---

# TrueBid — Terms of Service (Summary for Implementation)

## Usage

Save the full Terms of Service as a static page at `/terms`. The content below provides the key clauses. Have a WA property lawyer review before launch.

## Key Clauses to Include

**1. Platform Role**
TrueBid Pty Ltd ("TrueBid", "we", "us") operates an online platform that enables property owners to list their properties for sale and potential buyers to place offers on those properties. TrueBid acts solely as a technology platform and marketing service. TrueBid is NOT a party to any property sale transaction. TrueBid does NOT provide real estate agency services, legal advice, financial advice, or property valuations. TrueBid does NOT negotiate on behalf of any party. Users are responsible for obtaining independent professional advice before buying or selling property.

**2. User Obligations**
Users must provide accurate and truthful information. Users must verify their identity before publishing listings or placing offers. Sellers must comply with all applicable state and territory laws regarding property sales, including disclosure obligations. Buyers must ensure they have the financial capacity to complete any offer they place. Users must not engage in shill bidding, phantom offers, or any form of market manipulation.

**3. Open Offers System**
Offers placed through the Open Offers system are visible to the public. Offers can be increased or withdrawn but not decreased. The seller is not obligated to accept any offer, including the highest offer. The anti-snipe mechanism may extend closing dates automatically. TrueBid does not guarantee the identity, financial capacity, or intentions of any buyer or seller beyond the identity verification process.

**4. No Deposit Handling**
TrueBid does not hold, manage, or process any deposits or funds related to property transactions. All deposits must be held in a trust account managed by a licensed settlement agent, solicitor, or conveyancer.

**5. Limitation of Liability**
TrueBid is not liable for: any loss arising from a property transaction facilitated through the platform, the accuracy of information provided by users, technical failures including WebSocket connectivity or timer accuracy, the outcome of any identity verification process, any advice or recommendations made by referral partners.

**6. Intellectual Property**
Users retain ownership of content they upload (photos, descriptions). Users grant TrueBid a non-exclusive licence to display this content on the platform and in marketing materials. TrueBid owns all platform technology, design, and branding.

**7. Termination**
TrueBid may suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are the subject of repeated complaints. Users may delete their account at any time. Active listings will be withdrawn upon account deletion.

**8. Privacy**
See our Privacy Policy for how we collect, use, and protect your personal information.

**9. Dispute Resolution**
Disputes between buyers and sellers are between those parties — TrueBid is not a mediator. Disputes with TrueBid are governed by the laws of Western Australia and subject to the jurisdiction of WA courts.

---

# TrueBid — Privacy Policy (Summary for Implementation)

## Usage

Save as a static page at `/privacy`. Must comply with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs). Have reviewed by a privacy lawyer before launch.

## Key Sections to Include

**1. Information We Collect**
- Account information: name, email, phone number, role preference
- Identity verification data: we pass your ID to our verification partner (GreenID) for processing. We store only the verification result and reference number — NOT the ID document itself.
- Property listing data: address, description, photos, price, property details
- Offer data: offer amounts, conditions, settlement preferences, personal notes to sellers
- Communication data: messages between buyers and sellers
- Usage data: pages visited, listings viewed, search queries, device information, IP address (hashed for analytics)
- Location data: approximate location inferred from IP address (for search relevance)

**2. How We Use Your Information**
- To provide the TrueBid platform and its features
- To verify your identity and prevent fraud
- To facilitate communication between buyers and sellers
- To send notifications about offers, messages, and listing updates
- To improve the platform based on usage patterns (anonymised and aggregated)
- To connect you with referral partners when you request it (with your explicit consent)

**3. Who We Share Your Information With**
- Other TrueBid users: sellers see buyer names, email, and phone when an offer is placed. Buyers see seller first names. The public sees only pseudonymous aliases on the offer board.
- Identity verification provider: GreenID receives your ID document for verification purposes, subject to their own privacy policy.
- Service providers: hosting (AWS), email (Resend), analytics — all bound by data processing agreements.
- Referral partners: only when you explicitly click a referral link and consent to sharing your contact details.
- Law enforcement: if required by law or court order.

**4. Data Storage and Security**
- Data is stored in Australia (AWS Sydney region).
- We use encryption in transit (TLS) and at rest.
- Access to personal data is restricted to authorised personnel.
- We retain account data for 7 years after account deletion (for legal and audit purposes), except identity verification references which are retained indefinitely for fraud prevention.

**5. Your Rights**
Under the Privacy Act, you have the right to: access your personal information, request correction of inaccurate information, request deletion of your account and associated data (subject to legal retention requirements), opt out of marketing communications, and lodge a complaint with the Office of the Australian Information Commissioner (OAIC).

**6. Cookies**
We use essential cookies for authentication and session management. We use analytics cookies (anonymised) to understand how people use the platform. We do not use advertising cookies or sell data to advertisers.

**7. Contact**
Privacy enquiries: privacy@truebid.com.au
Data Protection Contact: [name and contact details to be added]
OAIC: www.oaic.gov.au
