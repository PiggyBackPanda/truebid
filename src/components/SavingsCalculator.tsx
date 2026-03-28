"use client"
import { useState } from "react"
import Link from "next/link"

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-AU")
}

export function SavingsCalculator() {
  const [price, setPrice] = useState(800000)
  const [inputValue, setInputValue] = useState("800,000")
  const [discOpen, setDiscOpen] = useState(false)

  const commLow  = price * 0.020
  const commHigh = price * 0.035

  function getMarketingRange(p: number): [number, number] {
    if (p < 500000)  return [2000,  5000]
    if (p < 1000000) return [3000,  8000]
    if (p < 2000000) return [5000, 12000]
    return                  [8000, 18000]
  }
  const [mktLow, mktHigh] = getMarketingRange(price)

  const savLow   = commLow + mktLow
  const savHigh  = commHigh + mktHigh

  function handleInput(val: string) {
    // Strip non-digits and update the display string freely while typing
    const digits = val.replace(/[^0-9]/g, "")
    setInputValue(digits === "" ? "" : Number(digits).toLocaleString("en-AU"))
  }

  function handleBlur(val: string) {
    let raw = parseInt(val.replace(/[^0-9]/g, ""), 10) || 200000
    if (raw < 200000) raw = 200000
    if (raw > 4000000) raw = 4000000
    setPrice(raw)
    setInputValue(raw.toLocaleString("en-AU"))
  }

  function handleSlider(val: number) {
    setPrice(val)
    setInputValue(val.toLocaleString("en-AU"))
  }

  const sliderPercent = ((price - 200000) / (4000000 - 200000)) * 100

  return (
    <div className="w-full max-w-xl mx-auto bg-[#F7F4EE]">

      {/* Price input */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Your estimated property sale price</p>
        <div className="flex items-center">
          <span className="bg-white border border-r-0 border-[#D1C9B8] rounded-l-lg px-3 h-11 flex items-center text-[#8B7355] font-medium">$</span>
          <input
            type="text"
            className="bg-white border border-[#D1C9B8] rounded-r-lg h-11 px-3 text-lg font-medium w-full text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            onBlur={e => handleBlur(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <input
          type="range"
          min={200000}
          max={4000000}
          step={10000}
          value={price}
          onChange={e => handleSlider(Number(e.target.value))}
          className="w-full mt-3 accent-[#D4900A]"
          style={{ background: `linear-gradient(to right, #D4900A ${sliderPercent}%, #D1C9B8 ${sliderPercent}%)` }}
        />
        <div className="flex justify-between text-xs text-[#8B7355] mt-1">
          <span>$200k</span><span>$4m</span>
        </div>
      </div>

      {/* Hero result */}
      <div className="bg-[#0D1B2A] rounded-xl px-6 py-5 text-center mb-4">
        <p className="text-sm text-[#C8B99A] mb-1">Typical agent costs on a sale of this value</p>
        <p className="text-3xl font-medium text-[#D4900A] tracking-tight">
          {fmt(savLow)} – {fmt(savHigh)}
        </p>
        <p className="text-sm text-[#C8B99A] mt-1">What agents typically charge on a {fmt(price)} sale</p>
      </div>

      <p className="text-xs text-[#8B7355] text-center mb-4">This shows what agents typically charge. Your actual outcome depends on the price you achieve.</p>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-[#E8E2D8] rounded-lg p-3">
          <p className="text-xs text-[#8B7355] mb-1">Agent commission</p>
          <p className="text-base font-medium text-[#0D1B2A]">{fmt(commLow)} – {fmt(commHigh)}</p>
          <p className="text-xs text-[#8B7355] mt-1">2.0% – 3.5% of sale price</p>
        </div>
        <div className="bg-white border border-[#E8E2D8] rounded-lg p-3">
          <p className="text-xs text-[#8B7355] mb-1">Marketing fees</p>
          <p className="text-base font-medium text-[#0D1B2A]">{fmt(mktLow)} – {fmt(mktHigh)}</p>
          <p className="text-xs text-[#8B7355] mt-1">Flat fee, varies by campaign</p>
        </div>
        <div className="bg-white border-2 border-[#D4900A] rounded-lg p-5 col-span-2 text-center">
          <p className="text-xs text-[#D4900A] mb-1">TrueBid listing cost</p>
          <p className="text-3xl font-medium text-[#0D1B2A] tracking-tight">$0</p>
          <p className="text-xs text-[#8B7355] mt-1">Free to list during our current launch period, which will end with no less than 30 days written notice to registered users. No commission. No portal listing fees.</p>
          <p className="text-xs text-[#8B7355] mt-2">Professional photography is still recommended and is your own cost, typically $300 to $700.</p>
        </div>
      </div>

      {/* Disclosure */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-5">
        <button
          onClick={() => setDiscOpen(o => !o)}
          className="flex items-center gap-2 text-xs text-gray-400 w-full text-left"
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: discOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          How we calculated this
        </button>
        {discOpen && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 leading-relaxed space-y-1">
            <div className="flex justify-between">
              <span>Agent commission range</span>
              <span className="font-medium text-gray-700">2.0% – 3.5% of sale price</span>
            </div>
            <div className="flex justify-between">
              <span>Marketing fees</span>
              <span className="font-medium text-gray-700">{fmt(mktLow)} – {fmt(mktHigh)} (flat fee)</span>
            </div>
            <div className="flex justify-between">
              <span>TrueBid listing fee</span>
              <span className="font-medium text-gray-700">$0</span>
            </div>
            <div className="pt-2 border-t border-gray-200 mt-2 space-y-2">
              <p>
                Commission range sourced from Real Estate Institute of Australia (REIA) reported
                state averages, typically ranging from 2.0% to 3.5% of the final sale price.
                Marketing fee estimates reflect typical flat-fee campaign costs at each price point
                and do not scale with sale price.
              </p>
              <p>
                <span className="font-medium text-gray-600">Not included in this estimate:</span>{" "}
                professional photography (typically $300 to $700, required on any platform),
                legal and conveyancing fees (required regardless of sale method), and optional
                costs such as home staging or auctioneer fees.
              </p>
              <p>
                This calculator shows agent-related costs avoided. It does not account for any
                difference in sale price that may or may not result from selling with or without
                an agent. Figures are a guide only. Always obtain independent financial advice
                before making decisions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/register"
        className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-lg transition-colors"
      >
        List Your Property
      </Link>

    </div>
  )
}
