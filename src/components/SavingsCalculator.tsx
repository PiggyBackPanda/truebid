"use client"
import { useState } from "react"
import Link from "next/link"

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-AU")
}

export default function SavingsCalculator() {
  const [price, setPrice] = useState(800000)
  const [inputValue, setInputValue] = useState("800,000")
  const [discOpen, setDiscOpen] = useState(false)

  const commLow  = price * 0.020
  const commHigh = price * 0.035
  const mktLow   = price * 0.005
  const mktHigh  = price * 0.007
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

  return (
    <div className="w-full max-w-xl mx-auto">

      {/* Price input */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Your estimated property sale price</p>
        <div className="flex items-center">
          <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 h-11 flex items-center text-gray-500 font-medium">$</span>
          <input
            type="text"
            className="border border-gray-300 rounded-r-lg h-11 px-3 text-lg font-medium w-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
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
          className="w-full mt-3 accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$200k</span><span>$4m</span>
        </div>
      </div>

      {/* Hero result */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-5 text-center mb-4">
        <p className="text-sm text-amber-700 mb-1">Estimated savings with TrueBid</p>
        <p className="text-3xl font-medium text-amber-900 tracking-tight">
          {fmt(savLow)} – {fmt(savHigh)}
        </p>
        <p className="text-sm text-amber-700 mt-1">Based on a {fmt(price)} sale</p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Agent commission</p>
          <p className="text-base font-medium text-gray-800">{fmt(commLow)} – {fmt(commHigh)}</p>
          <p className="text-xs text-gray-400 mt-1">2.0% – 3.5% of sale price</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Marketing fees</p>
          <p className="text-base font-medium text-gray-800">{fmt(mktLow)} – {fmt(mktHigh)}</p>
          <p className="text-xs text-gray-400 mt-1">0.5% – 0.7% of sale price</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 col-span-2 text-center">
          <p className="text-xs text-green-700 mb-1">TrueBid listing cost</p>
          <p className="text-3xl font-medium text-green-900 tracking-tight">$0</p>
          <p className="text-xs text-green-700 mt-1">Free to list. No commission. No marketing fees.</p>
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
              <span className="font-medium text-gray-700">2.0% – 3.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Marketing fees range</span>
              <span className="font-medium text-gray-700">0.5% – 0.7%</span>
            </div>
            <div className="flex justify-between">
              <span>TrueBid listing fee</span>
              <span className="font-medium text-gray-700">$0</span>
            </div>
            <p className="pt-2 border-t border-gray-200 mt-2">
              Agent commission rates are based on Real Estate Institute of Australia (REIA)
              reported averages across Australian states, typically ranging from 2.0% to 3.5%
              of the final sale price. Marketing costs — including photography, copywriting,
              online portal listings, and print — typically add 0.5% to 0.7% of the sale
              price. Figures are indicative only and will vary by state, agent, property
              type, and campaign. TrueBid charges no commission and no marketing fees. This
              calculator is a guide only — always obtain independent financial advice before
              making decisions.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/register"
        className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-lg transition-colors"
      >
        List your home — free →
      </Link>

    </div>
  )
}
