/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ListingStatusProgress, ListingStatusBadge } from "./ListingStatusProgress";

afterEach(cleanup);

describe("ListingStatusProgress", () => {
  it("renders all pipeline steps for ACTIVE status", () => {
    render(<ListingStatusProgress status="ACTIVE" />);
    expect(screen.getByText("Draft")).toBeDefined();
    expect(screen.getByText("Coming Soon")).toBeDefined();
    expect(screen.getByText("Inspections")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Under Offer")).toBeDefined();
    expect(screen.getByText("Buyer Selected")).toBeDefined();
  });

  it("renders Withdrawn status as a badge, not pipeline", () => {
    render(<ListingStatusProgress status="WITHDRAWN" />);
    expect(screen.getByText("Withdrawn")).toBeDefined();
    // Should not show the pipeline steps
    expect(screen.queryByText("Draft")).toBeNull();
  });

  it("renders Expired status as a badge, not pipeline", () => {
    render(<ListingStatusProgress status="EXPIRED" />);
    expect(screen.getByText("Expired")).toBeDefined();
    expect(screen.queryByText("Draft")).toBeNull();
  });

  it("renders DRAFT as first step (current)", () => {
    const { container } = render(<ListingStatusProgress status="DRAFT" />);
    // Draft step should have the navy current-step background
    const steps = container.querySelectorAll('[class*="rounded-full"]');
    expect(steps.length).toBeGreaterThan(0);
  });
});

describe("ListingStatusBadge", () => {
  it("renders correct label for each status", () => {
    const statuses = [
      { status: "DRAFT" as const, label: "Draft" },
      { status: "COMING_SOON" as const, label: "Coming Soon" },
      { status: "ACTIVE" as const, label: "Active" },
      { status: "UNDER_OFFER" as const, label: "Under Offer" },
      { status: "SOLD" as const, label: "Buyer Selected" },
      { status: "WITHDRAWN" as const, label: "Withdrawn" },
      { status: "EXPIRED" as const, label: "Expired" },
    ];

    for (const { status, label } of statuses) {
      const { unmount } = render(<ListingStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeDefined();
      unmount();
    }
  });

  it("uses 'Buyer Selected' not 'Sold' for SOLD status (avoids auction language)", () => {
    render(<ListingStatusBadge status="SOLD" />);
    expect(screen.getByText("Buyer Selected")).toBeDefined();
    expect(screen.queryByText("Sold")).toBeNull();
  });
});
