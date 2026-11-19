'use client';

import { useState } from 'react';
import { CreditCard, Check, ArrowRight } from 'lucide-react';

export default function BillingPage() {
  const [tab, setTab] = useState<'plan' | 'balance' | 'history'>('balance');
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('crypto');

  const amounts = [1, 10, 25, 50];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header with Send a Gift */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Billing</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Your plan, balance and payment history.
          </p>
        </div>

        <button className="px-5 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-sm">
          Send a gift
        </button>
      </div>

      {/* 3 Pills: Plan, Balance, History */}
      <div className="flex items-center gap-2">
        {(['plan', 'balance', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              tab === t
                ? 'bg-white text-black'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Top 3 Stat Cards in Container */}
      <div className="soteria-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1">Plan</div>
          <div className="text-2xl font-bold text-white tracking-tight">Pay as you go</div>
          <p className="text-xs text-neutral-500 mt-1">Obfuscations come out of balance</p>
        </div>
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1">Balance</div>
          <div className="text-2xl font-bold text-white tracking-tight">$0.00</div>
          <p className="text-xs text-neutral-500 mt-1">Never expires</p>
        </div>
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1">Free obfuscations</div>
          <div className="text-2xl font-bold text-white tracking-tight">0</div>
          <p className="text-xs text-neutral-500 mt-1">Add a card to get 12 a month</p>
        </div>
      </div>

      {/* Balance Tab Content */}
      {tab === 'balance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Select Amount & Payment Method */}
          <div className="lg:col-span-2 soteria-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Select amount</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-3 rounded-2xl text-base font-bold transition-all border ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-[#1e1e1e] border-white/20 text-white'
                        : 'bg-[#151515] border-white/[0.04] text-neutral-300 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    ${amt}.00
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Custom amount</h3>
              <div className="relative">
                <span className="text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) setSelectedAmount(Number(e.target.value));
                  }}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Payment method</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-white text-black border-transparent'
                      : 'bg-[#151515] text-neutral-300 border-white/[0.04] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="font-bold text-sm">Card</div>
                  <div className={`text-xs mt-0.5 ${paymentMethod === 'card' ? 'text-neutral-600' : 'text-neutral-500'}`}>
                    Added instantly
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    paymentMethod === 'crypto'
                      ? 'bg-white text-black border-transparent'
                      : 'bg-[#151515] text-neutral-300 border-white/[0.04] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="font-bold text-sm">Crypto</div>
                  <div className={`text-xs mt-0.5 ${paymentMethod === 'crypto' ? 'text-neutral-600' : 'text-neutral-500'}`}>
                    Converted to USD automatically
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Order Summary & Payment Method Card */}
          <div className="space-y-6">
            <div className="soteria-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Order summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Balance added</span>
                  <span className="text-white font-medium">${selectedAmount}.00</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Paying with</span>
                  <span className="text-white font-medium capitalize">{paymentMethod}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">${selectedAmount}.00</span>
              </div>

              <button className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors">
                Continue to payment
              </button>
              <p className="text-[11px] text-neutral-500 text-center">Balance never expires.</p>
            </div>

            <div className="soteria-card p-6 space-y-3">
              <h3 className="text-sm font-semibold text-white">Payment method</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Add a card and get 12 free obfuscations every month. Nothing is charged.
              </p>
              <button className="w-full py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors">
                Add card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="soteria-card p-8 text-center space-y-2">
          <h3 className="text-base font-semibold text-white">No payments yet</h3>
          <p className="text-xs text-neutral-400">Charges will show up here once you make a purchase.</p>
        </div>
      )}
    </div>
  );
}
