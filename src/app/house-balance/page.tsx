'use client';

import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';

interface HouseWallet {
  currency: string;
  symbol: string;
  network: string;
  address: string;
  balance: number;
  balance_usd: number;
}

export default function HouseBalancePage() {
  const [wallets, setWallets] = useState<HouseWallet[]>([]);
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchHouseBalance = () => {
    setIsLoading(true);
    fetch('/api/house-balance')
      .then((res) => res.json())
      .then((data) => {
        if (data.wallets) {
          setWallets(data.wallets);
          setTotalUsd(data.totalUsd || 0);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHouseBalance();
  }, []);

  const copyAddress = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopiedKey(symbol);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCryptoIcon = (symbol: string) => {
    switch (symbol) {
      case 'SOL':
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00FFA3]/20 to-[#DC1FFF]/20 border border-[#00FFA3]/30 flex items-center justify-center font-bold text-sm text-[#00FFA3]">
            SOL
          </div>
        );
      case 'ETH':
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#627EEA]/20 border border-[#627EEA]/30 flex items-center justify-center font-bold text-sm text-[#627EEA]">
            ETH
          </div>
        );
      case 'LTC':
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#345D9D]/20 border border-[#345D9D]/30 flex items-center justify-center font-bold text-sm text-[#345D9D]">
            LTC
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center font-bold text-sm text-white">
            {symbol}
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Live Proof of Reserves
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">House Balance</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time public liquidity and NOWPayments house reserves available for loans.
          </p>
        </div>

        <button
          onClick={fetchHouseBalance}
          disabled={isLoading}
          className="px-4 py-2 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/[0.08] text-xs font-medium text-neutral-300 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          <span>Refresh Reserves</span>
        </button>
      </div>

      {/* Main Total Liquidity Card */}
      <div className="soteria-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-br from-[#141414] via-[#141414] to-[#1a1a1a]">
        <div>
          <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Total House Liquidity</span>
          </div>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-mono">
            {lastUpdated ? `Last verified: ${lastUpdated}` : 'Verified via NOWPayments & blockchain reserves'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          {wallets.map((w) => (
            <div key={w.symbol} className="px-4 py-3 rounded-2xl bg-[#171717] border border-white/[0.06] text-center min-w-[100px]">
              <div className="text-[11px] font-semibold text-neutral-400">{w.symbol}</div>
              <div className="text-sm font-bold text-white mt-0.5">{w.balance}</div>
              <div className="text-[10px] text-neutral-500">${w.balance_usd.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed House Wallets List */}
      <div className="soteria-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">House Wallets & Deposit Channels</h2>

        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.symbol}
              className="p-4 rounded-2xl bg-[#171717] border border-white/[0.06] hover:border-white/10 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                {getCryptoIcon(wallet.symbol)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{wallet.network}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400">
                      {wallet.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-400 font-mono break-all max-w-xs md:max-w-md">
                      {wallet.address}
                    </span>
                    <button
                      onClick={() => copyAddress(wallet.address, wallet.symbol)}
                      className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
                      title="Copy Address"
                    >
                      {copiedKey === wallet.symbol ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right shrink-0">
                <div className="text-base font-bold text-white">
                  {wallet.balance} {wallet.symbol}
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  ≈ ${wallet.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
