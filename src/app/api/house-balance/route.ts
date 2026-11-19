import { NextResponse } from 'next/server';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || 'SD6RJSG-8SXMB1V-HBJFHE9-CJJVRFJ';

interface HouseWalletConfig {
  symbol: string;
  name: string;
  network: string;
  address: string;
  paymentId: string;
  iconUrl: string;
}

const HOUSE_WALLETS_CONFIG: HouseWalletConfig[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana Mainnet',
    address: 'DMKA3rLfwVJagiV7jLiP4X4BCuoYDZ23h2JD3LDMU2MG',
    paymentId: '6295438782',
    iconUrl: '/assets/sol.svg',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum Mainnet',
    address: '0xF1b93f0Cc886be3d1D6983116b286A07117F4f0D',
    paymentId: '6045684707',
    iconUrl: '/assets/eth.svg',
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin Mainnet',
    address: 'MAVKtFcudkZ7LDavCLTS6PAacHhTmqVWo6',
    paymentId: '6100346630',
    iconUrl: '/assets/ltc.svg',
  },
];

export async function GET() {
  try {
    const fetchedWallets = await Promise.all(
      HOUSE_WALLETS_CONFIG.map(async (cfg) => {
        let balance = 0;
        let balanceUsd = 0;
        let status = 'active';
        let isLive = false;

        try {
          const res = await fetch(`https://api.nowpayments.io/v1/payment/${cfg.paymentId}`, {
            headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
            next: { revalidate: 30 },
          });

          if (res.ok) {
            const data = await res.json();
            isLive = true;
            status = data.payment_status || 'active';
            // Real recorded payment amount on NOWPayments
            balance = Number(data.actually_paid) || 0;
            balanceUsd = (Number(data.actually_paid) / (Number(data.pay_amount) || 1)) * (Number(data.price_amount) || 0);
          }
        } catch (err) {
          console.error(`Error querying NOWPayments for ${cfg.symbol}:`, err);
        }

        return {
          symbol: cfg.symbol,
          name: cfg.name,
          network: cfg.network,
          address: cfg.address,
          paymentId: cfg.paymentId,
          iconUrl: cfg.iconUrl,
          balance: Number(balance.toFixed(4)),
          balanceUsd: Number(balanceUsd.toFixed(2)),
          status,
          isLive,
        };
      })
    );

    const totalUsd = fetchedWallets.reduce((acc, w) => acc + w.balanceUsd, 0);

    return NextResponse.json({
      totalUsd: Number(totalUsd.toFixed(2)),
      wallets: fetchedWallets,
      provider: 'NOWPayments API v1',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('House balance error:', err);
    return NextResponse.json({ error: 'Failed to fetch house balances' }, { status: 500 });
  }
}
