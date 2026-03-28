export type ChecklistItem = {
  key: string;
  title: string;
  description: string;
  mandatory: boolean;
  helpText: string;
  ctaLabel: string | null;
  ctaType: string | null;
  partnerBusinessType: string | null;
};

export const WA_CHECKLIST: ChecklistItem[] = [
  {
    key: "wa_settlement_agent",
    title: "Engage a settlement agent",
    description:
      "A licensed settlement agent prepares your Contract of Sale, manages the transfer of title, and handles settlement. This is essential before you can exchange contracts with a buyer.",
    mandatory: true,
    helpText:
      "In WA, settlement agents are licensed under the Settlement Agents Act 1981. Typical cost: $700–$1,500. Your settlement agent should be engaged before you accept an offer.",
    ctaLabel: "Find a settlement agent",
    ctaType: "referral_partner",
    partnerBusinessType: "settlement_agent",
  },
  {
    key: "wa_title_search",
    title: "Obtain a current title search",
    description:
      "Your settlement agent obtains a copy of your Certificate of Title from Landgate to confirm ownership, lot details, and any encumbrances (mortgages, caveats, easements).",
    mandatory: true,
    helpText:
      "Your settlement agent handles this for you. Cost is approximately $25–$30 from Landgate. It confirms you legally own the property and identifies anything registered against the title.",
    ctaLabel: null,
    ctaType: null,
    partnerBusinessType: null,
  },
  {
    key: "wa_contract_sale",
    title: "Prepare the Contract of Sale",
    description:
      "The standard WA contract is the REIWA/Law Society Joint Form of General Conditions for the Sale of Land. Your settlement agent prepares this with the agreed terms once you accept an offer.",
    mandatory: true,
    helpText:
      "The contract includes the purchase price, settlement date, deposit amount, any special conditions, and the general conditions of sale. Your settlement agent drafts this, so you don't need to write it yourself.",
    ctaLabel: null,
    ctaType: null,
    partnerBusinessType: null,
  },
  {
    key: "wa_strata_docs",
    title: "Obtain strata documents (if applicable)",
    description:
      "If your property is strata-titled (unit, townhouse, or some houses), you need to provide Form 28 (annual budget and financial statements) and Form 29 (information from strata company) to the buyer.",
    mandatory: false,
    helpText:
      "Contact your strata manager to request these forms. They're typically provided within 5–10 business days. Cost varies but is usually $50–$150. Not required for freehold/green title properties.",
    ctaLabel: null,
    ctaType: null,
    partnerBusinessType: null,
  },
  {
    key: "wa_building_approvals",
    title: "Gather building approval documentation",
    description:
      "If you've made renovations, extensions, or additions to the property, gather the relevant building permits and certificates of completion. Buyers and their inspectors will ask for these.",
    mandatory: false,
    helpText:
      "Check with your local council for records of approved building permits. If renovations were done without permits, disclose this to potential buyers, as it's a material fact that can affect the sale.",
    ctaLabel: null,
    ctaType: null,
    partnerBusinessType: null,
  },
  {
    key: "wa_property_valuation",
    title: "Get a property valuation or market appraisal",
    description:
      "Understanding your property's market value helps you set a realistic guide price. This can be a formal valuation or a comparative market analysis.",
    mandatory: false,
    helpText:
      "Options: 1) Formal sworn valuation by a licensed valuer ($300–$600), useful if you need certainty. 2) Free online estimates from CoreLogic or similar, useful as a rough guide. 3) Check recent sales of similar properties in your area on realestate.com.au.",
    ctaLabel: null,
    ctaType: null,
    partnerBusinessType: null,
  },
  {
    key: "wa_mortgage_discharge",
    title: "Arrange mortgage discharge (if applicable)",
    description:
      "If you have an existing mortgage on the property, your lender needs to discharge it at settlement. This can take 2–4 weeks, so start early.",
    mandatory: false,
    helpText:
      "Contact your bank or lender and request a discharge of mortgage. Your settlement agent will coordinate the timing so the discharge happens at settlement. Most lenders charge a discharge fee ($150–$350).",
    ctaLabel: null,
    ctaType: null,
    partnerBusinessType: null,
  },
  {
    key: "wa_building_pest",
    title: "Consider a pre-sale building and pest inspection",
    description:
      "Having a recent building and pest inspection report available for buyers can speed up the sale process and reduce conditional offers.",
    mandatory: false,
    helpText:
      "Cost: $300–$600 depending on property size. A clean report gives buyers confidence and may encourage unconditional offers. If issues are found, you can address them before listing or disclose them upfront.",
    ctaLabel: "Find a building inspector",
    ctaType: "referral_partner",
    partnerBusinessType: "building_inspector",
  },
];
