'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';

export default function OverviewPage() {
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => setLoans(data))
      .catch((err) => console.error(err));
  }, []);

  const totalPrincipal = loans.reduce((acc, l) => acc + l.principal, 0);
  const totalRepaid = loans.reduce((acc, l) => acc + l.repaidAmount, 0);
  const activeLoans = loans.filter((l) => l.status === 'active').length;
  const totalLoansCount = loans.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Overview</h1>
        <p className="text-sm text-neutral-400 mt-1 font-normal">
          Your activity at a glance.
        </p>
      </div>

      {/* 4 Summary Stat Box */}
      <div className="soteria-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-2">Loans this week</div>
          <div className="text-3xl font-medium tracking-tight text-white">{activeLoans}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-2">Active borrowers</div>
          <div className="text-3xl font-medium tracking-tight text-white">{activeLoans}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-2">Total principal ($)</div>
          <div className="text-3xl font-medium tracking-tight text-white">${totalPrincipal.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-2">Total loans issued</div>
          <div className="text-3xl font-medium tracking-tight text-white">{totalLoansCount}</div>
        </div>
      </div>

      {/* Full Width Payback Activity Graph Container */}
      <div className="soteria-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Payback activity</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Recorded crypto payback volume over the last 7 days</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">${totalRepaid.toFixed(2)}</div>
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Total Repaid</span>
          </div>
        </div>

        {/* Minimalist Line Chart Area */}
        <div className="h-64 w-full flex flex-col justify-end pt-8">
          <div className="w-full border-b border-neutral-800 relative h-48 flex items-end">
            <div className="absolute inset-x-0 bottom-0 h-px bg-neutral-800" />
            <div className="absolute inset-x-0 bottom-24 h-px border-b border-dashed border-neutral-900" />
            
            <svg className="w-full h-full overflow-visible absolute inset-0" preserveAspectRatio="none" viewBox="0 0 700 160">
              <defs>
                <linearGradient id="paybackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20 150 Q 150 148, 250 135 T 450 110 T 680 90"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 20 150 Q 150 148, 250 135 T 450 110 T 680 90 L 680 160 L 20 160 Z"
                fill="url(#paybackGradient)"
              />
            </svg>

            <div className="w-full flex justify-between items-end px-4 z-10 relative">
              {['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  {idx === 6 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md ring-4 ring-neutral-800" />
                  )}
                  <span className="text-xs text-neutral-500 font-medium">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
