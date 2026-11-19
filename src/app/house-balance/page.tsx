'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

interface HouseWallet {
  symbol: string;
  name: string;
  network: string;
  address: string;
  iconUrl: string;
  explorerUrl: string;
  balance: number;
  balanceUsd: number;
  priceUsd: number;
  status: string;
  isLive: boolean;
}

export default function HouseBalancePage() {
  const [wallets, setWallets] = useState<HouseWallet[]>([]);
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchBalances = () => {
    setIsLoading(true);
    fetch('/api/house-balance')
      .then((res) => res.json())
      .then((data) => {
        if (data.wallets) {
          setWallets(data.wallets);
          setTotalUsd(data.totalUsd || 0);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const copyAddress = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopiedKey(symbol);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">House Bal</h1>
        </div>

        <button
          onClick={fetchBalances}
          disabled={isLoading}
          className="px-4 py-2 rounded-full bg-[#181818] hover:bg-[#222222] border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-white' : 'text-neutral-400'}`} />
          <span>{isLoading ? 'Syncing...' : 'Sync Reserves'}</span>
        </button>
      </div>

      {/* Main Liquidity Overview Card */}
      <div className="soteria-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            TOTAL HOUSE LIQUIDITY
          </div>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans mt-2">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          {wallets.map((w) => (
            <div key={w.symbol} className="p-3.5 rounded-2xl bg-[#171717] border border-white/[0.06] text-center min-w-[110px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.iconUrl} alt={w.symbol} className="w-6 h-6 mx-auto mb-1.5 rounded-full" />
              <div className="text-xs font-bold text-white">
                {w.balance} {w.symbol}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                ${w.balanceUsd.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified House Wallets List */}
      <div className="soteria-card p-6 space-y-4">
        <div className="pb-2 border-b border-white/[0.04]">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase">Deposit & Liquidity Addresses</h2>
        </div>

        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.symbol}
              className="p-4 rounded-2xl bg-[#171717] border border-white/[0.06] hover:border-white/15 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wallet.iconUrl}
                  alt={wallet.name}
                  className="w-9 h-9 rounded-full shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{wallet.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300">
                      {wallet.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-neutral-400 font-mono break-all max-w-xs md:max-w-lg select-all">
                      {wallet.address}
                    </span>
                    <button
                      onClick={() => copyAddress(wallet.address, wallet.symbol)}
                      className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors shrink-0"
                      title="Copy Address"
                    >
                      {copiedKey === wallet.symbol ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={wallet.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors shrink-0"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right shrink-0">
                <div className="text-sm font-bold text-white">
                  {wallet.balance} {wallet.symbol}
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  ${wallet.balanceUsd.toFixed(2)} USD
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
