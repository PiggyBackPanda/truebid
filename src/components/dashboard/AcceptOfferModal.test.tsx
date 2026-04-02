/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AcceptOfferModal } from "./AcceptOfferModal";

afterEach(cleanup);

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeOffer() {
  return {
    id: "offer_1",
    amountCents: 85_000_000,
    conditionType: "SUBJECT_TO_FINANCE",
    settlementDays: 30,
    status: "ACTIVE" as const,
    createdAt: "2025-01-01T00:00:00Z",
    buyer: {
      id: "buyer_1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "0400000000",
      verificationStatus: "VERIFIED",
    },
    personalNote: null,
    history: [],
  };
}

describe("AcceptOfferModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders offer details correctly", () => {
    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    expect(screen.getByText("Proceed with this buyer?")).toBeDefined();
    expect(screen.getByText(/John Doe/)).toBeDefined();
    expect(screen.getByText(/\$850,000/)).toBeDefined();
    expect(screen.getByText(/Subject to finance/)).toBeDefined();
    expect(screen.getByText(/30-day settlement/)).toBeDefined();
  });

  it("shows checklist warning when checklist is incomplete", () => {
    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={true}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    expect(screen.getByText(/haven't completed all legal checklist items/)).toBeDefined();
  });

  it("does not show checklist warning when checklist is complete", () => {
    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    expect(screen.queryByText(/haven't completed all legal checklist items/)).toBeNull();
  });

  it("displays non-binding contract disclaimer", () => {
    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    expect(screen.getByText(/does not create a binding contract/)).toBeDefined();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={onCancel}
        onAccepted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={onCancel}
        onAccepted={vi.fn()}
      />
    );

    // Click the backdrop (outermost div)
    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls API and onAccepted on successful accept", async () => {
    const onAccepted = vi.fn();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={vi.fn()}
        onAccepted={onAccepted}
      />
    );

    fireEvent.click(screen.getByText("Proceed with this buyer"));

    await waitFor(() => {
      expect(onAccepted).toHaveBeenCalledWith("offer_1");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/offers/offer_1/accept", {
      method: "POST",
    });
  });

  it("shows error message on API failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Offer already accepted" }),
    });

    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Proceed with this buyer"));

    await waitFor(() => {
      expect(screen.getByText("Offer already accepted")).toBeDefined();
    });
  });

  it("shows network error on fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={false}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Proceed with this buyer"));

    await waitFor(() => {
      expect(screen.getByText("Network error. Please try again.")).toBeDefined();
    });
  });

  it("does NOT use auction language in any visible text", () => {
    render(
      <AcceptOfferModal
        offer={makeOffer()}
        checklistIncomplete={true}
        onCancel={vi.fn()}
        onAccepted={vi.fn()}
      />
    );

    const text = document.body.textContent ?? "";
    const banned = /\b(bid|bidding|bidder|auction|auctioneer|winning)\b/i;
    expect(text).not.toMatch(banned);
  });
});
