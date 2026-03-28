import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Guides",
    template: "%s | TrueBid Guides",
  },
  description:
    "Practical guides for selling your home privately in Australia, without a real estate agent.",
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
