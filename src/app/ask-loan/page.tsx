'use client';
import { getTotalDue } from '@/lib/interest';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Send, Clock, ChevronDown, CheckCircle2, AlertCircle, Wallet, ShieldAlert } from 'lucide-react';
import { validateCryptoAddress, detectCryptoChains } from '@/lib/crypto-validator';
import { getDetailedClientFingerprint } from '@/lib/hwid';
import SecurityOverlay, { SecurityOverlayType } from '@/components/SecurityOverlay';

interface LoanRequest {
  id: string;
  amount: number;
  crypto_currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'repaid' | 'active' | 'scammer';
  created_at: string;
}

const CRYPTO_OPTIONS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana',
    iconUrl: '/assets/sol.svg',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC-20 / EVM',
    iconUrl: '/assets/eth.svg',
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin',
    iconUrl: '/assets/ltc.svg',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin',
    iconUrl: '/assets/btc.svg',
  },
];

export default function AskLoanPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const [amount, setAmount] = useState('1');
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [securityOverlay, setSecurityOverlay] = useState<{
    type: SecurityOverlayType;
    matchedName?: string;
  }>({ type: null });

  const TIERS = [1, 5, 10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250];

  const earnedLimit = (() => {
    const repaidLoans = requests.filter((r) => r.status === 'completed' || r.status === 'repaid');
    const highestRepaid = repaidLoans.reduce((max, loan) => {
      const amt = Number(loan.amount) || 0;
      return amt > max ? amt : max;
    }, 0);

    let nextTier = 1;
    if (highestRepaid >= 1) {
      for (let i = 0; i < TIERS.length; i++) {
        if (highestRepaid >= TIERS[i]) {
          nextTier = TIERS[Math.min(i + 1, TIERS.length - 1)];
        }
      }
    }
    return nextTier;
  })();

  const manualLimit = (() => {
    if (user?.role && user.role.includes(':limit:')) {
      const match = user.role.match(/:limit:(\d+)/);
      if (match) return parseInt(match[1], 10);
    } else if (user?.role?.includes('bypass')) {
      return 250;
    }
    return 1;
  })();

  const userMaxLimit = Math.max(earnedLimit, manualLimit);
  const hasEverRepaid = requests.some((r) => r.status === 'completed' || r.status === 'repaid') || manualLimit > 1;

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/loan-requests?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setRequests(data);
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  // Real-time address check like Exodus
  const addressValidation = useMemo(() => {
    if (!walletAddress.trim()) return null;
    return validateCryptoAddress(walletAddress, selectedCrypto.symbol);
  }, [walletAddress, selectedCrypto]);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !user) return;

    setErrorMsg('');

    // Check Wallet Address
    const cleanAddy = walletAddress.trim();
    if (!cleanAddy) {
      triggerError('Please enter your receiving crypto wallet address.');
      return;
    }

    const validation = validateCryptoAddress(cleanAddy, selectedCrypto.symbol);
    if (!validation.isMatch) {
      triggerError(validation.error || `Invalid wallet address for ${selectedCrypto.name}.`);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount > userMaxLimit) {
      const errorText = userMaxLimit > 1
        ? `Your current unlocked limit is $${userMaxLimit}.00. You gotta pay back your current tier to unlock larger amounts!`
        : 'You gotta make your proofs with a $1 loan first before asking for more!';
      triggerError(errorText);
      return;
    }

    setIsSubmitting(true);
    try {
      const clientSecurity = await getDetailedClientFingerprint();

      const res = await fetch('/api/loan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.username,
          amount: parseFloat(amount),
          cryptoCurrency: selectedCrypto.symbol,
          walletAddress: cleanAddy,
          fingerprint: clientSecurity.fingerprint,
          gpuHwid: clientSecurity.gpuHwid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.securityAlert) {
          const overlayType: SecurityOverlayType = data.violation === 'SCAMMER' ? 'scammer' : data.violation === 'VPN' ? 'vpn' : 'alt';
          setSecurityOverlay({
            type: overlayType,
            matchedName: data.matchedAccountName,
          });
          return;
        }

        triggerError(data.error || 'Failed to submit loan request');
        return;
      }

      setRequests((prev) => [data, ...prev]);
      setAmount('1');
      setWalletAddress('');
      setReason('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (e) {
      console.error(e);
      triggerError('Failed to submit loan request. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Ask Loan</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Submit a cryptocurrency loan request for review and approval.
        </p>
      </div>

      {/* Main Request Form */}
      <div className="soteria-card p-6 md:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Loan Application</h2>
          <p className="text-xs text-neutral-400">Interest rate varies based on loan amount.</p>
        </div>

        {successMsg ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <span>Your loan request has been submitted successfully to the administrators.</span>
          </div>
        ) : errorMsg ? (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <span>{errorMsg}</span>
          </div>
        ) : !hasEverRepaid ? (
          <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <span>First-time borrowers start with a <strong>$1.00</strong> loan to build proof of repayment before unlocking larger amounts.</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount Input with clean styling & no default spinners */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Principal Amount ($ USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setAmount(val);
                  }}
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-[#171717] border border-white/[0.08] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all shadow-inner font-mono"
                />
              </div>
            </div>

            {/* Custom High-End Crypto Payout Selector */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-neutral-300">Payout Cryptocurrency</label>
              
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#171717] border border-white/[0.08] hover:border-white/20 text-sm text-white flex items-center justify-between cursor-pointer transition-all select-none shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCrypto.iconUrl}
                    alt={selectedCrypto.name}
                    className="w-7 h-7 rounded-full shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white leading-tight">
                      {selectedCrypto.name}
                    </div>
                  </div>
                </div>

                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#171717] border border-white/[0.1] rounded-2xl p-1.5 shadow-2xl z-50 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {CRYPTO_OPTIONS.map((crypto) => (
                      <div
                        key={crypto.symbol}
                        onClick={() => {
                          setSelectedCrypto(crypto);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          selectedCrypto.symbol === crypto.symbol
                            ? 'bg-white/10 text-white'
                            : 'hover:bg-white/[0.05] text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={crypto.iconUrl}
                            alt={crypto.name}
                            className="w-7 h-7 rounded-full shrink-0"
                          />
                          <div className="text-left">
                            <div className="text-xs font-semibold text-white">
                              {crypto.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Receiving Crypto Wallet Address with Exodus-style chain detection & check */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-neutral-400" />
              <span>Receiving {selectedCrypto.symbol} Wallet Address</span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="Paste address here!"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value.trim())}
                required
                className={`w-full px-4 py-3 rounded-2xl bg-[#171717] border text-sm text-white placeholder-neutral-500 font-sans focus:outline-none transition-all shadow-inner ${
                  !addressValidation
                    ? 'border-white/[0.08] focus:border-white/30'
                    : addressValidation.isMatch
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-red-500/50 focus:border-red-500'
                }`}
              />
            </div>

            {/* Warning when coin mismatch happens */}
            {addressValidation && !addressValidation.isMatch && (
              <p className="text-[11px] text-red-400/90 flex items-center gap-1 pt-0.5 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{addressValidation.error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-neutral-400">
              {amount && !isNaN(parseFloat(amount)) ? (
                <span>Total repayment: <strong className="text-white">${(getTotalDue(parseFloat(amount))).toFixed(2)}</strong></span>
              ) : (
                <span>Interest applied at checkout</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (addressValidation !== null && !addressValidation.isMatch)}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User's Request History */}
      <div className="soteria-card p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Your Requests</h3>

        {requests.filter(r => r.status === 'pending').length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            No pending loan applications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-400">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Coin</th>
                  <th className="pb-3 px-3">Total Due</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {requests.filter(r => r.status === 'pending').map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3 text-xs text-neutral-400 font-sans">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-white font-sans">
                      ${req.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-semibold text-white font-sans">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`/assets/${req.crypto_currency.toLowerCase()}.svg`} 
                          alt={req.crypto_currency} 
                          className="w-4 h-4 rounded-full shrink-0" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <span>{req.crypto_currency}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold text-white">
                      ${(getTotalDue(req.amount)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        <span className="capitalize">{req.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Overlay for Alts & Scammers */}
      {securityOverlay.type && (
        <SecurityOverlay
          type={securityOverlay.type}
          matchedAccountName={securityOverlay.matchedName}
          onClose={() => setSecurityOverlay({ type: null })}
        />
      )}
    </div>
  );
}
