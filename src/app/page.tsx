'use client';

import { useState, useEffect } from 'react';
import { Loan } from '@/lib/data';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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
          Your activity across Soteria at a glance.
        </p>
      </div>

      {/* 4 Summary Stat Box (Exact Soteria Style) */}
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

      {/* Main Grid: Chart & Get Started List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Activity Chart Area */}
        <div className="lg:col-span-2 soteria-card p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Loan activity</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Last 7 days</p>
              </div>
              <div className="text-2xl font-medium text-white">{activeLoans}</div>
            </div>
          </div>

          {/* Minimal Line Chart Representation */}
          <div className="h-44 w-full flex flex-col justify-end pt-6">
            <div className="w-full border-b border-neutral-800 relative h-32 flex items-end">
              {/* Subtle line graph baseline */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-neutral-700/60" />
              <div className="w-full flex justify-between items-end px-2">
                {['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map((day, idx) => (
                  <div key={day} className="flex flex-col items-center gap-2">
                    {idx === 6 && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-sm ring-4 ring-neutral-800" />
                    )}
                    <span className="text-[11px] text-neutral-500 font-medium">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Get Started / Quick Actions */}
        <div className="soteria-card p-6 flex flex-col">
          <h3 className="text-base font-semibold text-white">Get started</h3>
          <p className="text-xs text-neutral-400 mt-0.5 mb-5">Pick up where most people begin</p>

          <div className="space-y-3 flex-1">
            <Link
              href="/loans"
              className="p-4 rounded-2xl bg-[#171717] hover:bg-[#1f1f1f] border border-white/[0.04] transition-all flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-neutral-100">Loans Directory</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Manage active borrowers & due amounts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/roadmap"
              className="p-4 rounded-2xl bg-[#171717] hover:bg-[#1f1f1f] border border-white/[0.04] transition-all flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-neutral-100">Milestone Roadmap</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Check off paid loans & track milestones</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/billing"
              className="p-4 rounded-2xl bg-[#171717] hover:bg-[#1f1f1f] border border-white/[0.04] transition-all flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-neutral-100">Balance & Payback</h4>
                <p className="text-xs text-neutral-400 mt-0.5">NOWPayments crypto deposit balances</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
