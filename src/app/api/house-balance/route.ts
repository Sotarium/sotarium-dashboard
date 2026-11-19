import { NextResponse } from 'next/server';

interface HouseWalletConfig {
  symbol: string;
  name: string;
  network: string;
  address: string;
  iconUrl: string;
  explorerUrl: string;
}

const HOUSE_WALLETS_CONFIG: HouseWalletConfig[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana Mainnet',
    address: 'FtE4jhje3TCzRiTuxCejxu9QVJqXdkDnmW25mcvPCqj8',
    iconUrl: '/assets/sol.svg',
    explorerUrl: 'https://solscan.io/account/FtE4jhje3TCzRiTuxCejxu9QVJqXdkDnmW25mcvPCqj8',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum Mainnet',
    address: '0x5E332519f26987709214F60e50AC69793ef5B72E',
    iconUrl: '/assets/eth.svg',
    explorerUrl: 'https://etherscan.io/address/0x5E332519f26987709214F60e50AC69793ef5B72E',
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin Mainnet',
    address: 'LedANhtpWzfX8Ug35mMQfthfe5ofDW5eMs',
    iconUrl: '/assets/ltc.svg',
    explorerUrl: 'https://blockchair.com/litecoin/address/LedANhtpWzfX8Ug35mMQfthfe5ofDW5eMs',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Mainnet',
    address: 'bc1qrnwnya68s9k5j0qfgeev65tpduxnsf9sctzydl',
    iconUrl: '/assets/btc.svg',
    explorerUrl: 'https://mempool.space/address/bc1qrnwnya68s9k5j0qfgeev65tpduxnsf9sctzydl',
  },
];

async function fetchLivePrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {
    SOL: 175,
    ETH: 3100,
    LTC: 90,
    BTC: 92000,
  };

  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22SOLUSDT%22,%22ETHUSDT%22,%22LTCUSDT%22,%22BTCUSDT%22%5D',
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((item: { symbol: string; price: string }) => {
          const sym = item.symbol.replace('USDT', '');
          if (prices[sym] !== undefined) {
            prices[sym] = parseFloat(item.price);
          }
        });
      }
    }
  } catch {
    // Keep fallback prices
  }

  return prices;
}

async function fetchOnChainBalance(cfg: HouseWalletConfig): Promise<{ balance: number; isLive: boolean }> {
  try {
    if (cfg.symbol === 'SOL') {
      const res = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [cfg.address],
        }),
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = await res.json();
        const lamports = data?.result?.value || 0;
        return { balance: Number((lamports / 1e9).toFixed(4)), isLive: true };
      }
    }

    if (cfg.symbol === 'ETH') {
      const res = await fetch('https://ethereum-rpc.publicnode.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [cfg.address, 'latest'],
        }),
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = await res.json();
        const hex = data?.result || '0x0';
        const wei = parseInt(hex, 16) || 0;
        return { balance: Number((wei / 1e18).toFixed(4)), isLive: true };
      }
    }

    if (cfg.symbol === 'LTC') {
      const res = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${cfg.address}/balance`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = await res.json();
        const litoshis = data?.balance || 0;
        return { balance: Number((litoshis / 1e8).toFixed(4)), isLive: true };
      }
    }

    if (cfg.symbol === 'BTC') {
      const res = await fetch(`https://blockchain.info/rawaddr/${cfg.address}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = await res.json();
        const satoshis = data?.final_balance || 0;
        return { balance: Number((satoshis / 1e8).toFixed(4)), isLive: true };
      }
    }
  } catch (e) {
    console.error(`Error querying on-chain balance for ${cfg.symbol}:`, e);
  }

  return { balance: 0, isLive: false };
}

export async function GET() {
  try {
    const prices = await fetchLivePrices();

    const fetchedWallets = await Promise.all(
      HOUSE_WALLETS_CONFIG.map(async (cfg) => {
        const { balance, isLive } = await fetchOnChainBalance(cfg);
        const price = prices[cfg.symbol] || 0;
        const balanceUsd = Number((balance * price).toFixed(2));

        return {
          symbol: cfg.symbol,
          name: cfg.name,
          network: cfg.network,
          address: cfg.address,
          iconUrl: cfg.iconUrl,
          explorerUrl: cfg.explorerUrl,
          balance,
          balanceUsd,
          priceUsd: Number(price.toFixed(2)),
          status: 'verified',
          isLive,
        };
      })
    );

    const totalUsd = fetchedWallets.reduce((acc, w) => acc + w.balanceUsd, 0);

    return NextResponse.json({
      totalUsd: Number(totalUsd.toFixed(2)),
      wallets: fetchedWallets,
      provider: 'Verified On-Chain RPC & NOWPayments Payout Wallets',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('House balance error:', err);
    return NextResponse.json({ error: 'Failed to fetch house balances' }, { status: 500 });
  }
}
