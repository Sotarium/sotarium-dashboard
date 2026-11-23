// Utility to detect and validate cryptocurrency addresses like Exodus wallet
export type CryptoChain = 'SOL' | 'ETH' | 'BTC' | 'LTC' | 'TRX';

export interface AddressValidationResult {
  isValid: boolean;
  detectedChains: CryptoChain[];
  primaryChain?: CryptoChain;
  formatName?: string;
  isMatch: boolean;
  error?: string;
}

// Base58 regex
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function detectCryptoChains(address: string): { chains: CryptoChain[]; formatName: string } {
  const addr = (address || '').trim();
  const detected: CryptoChain[] = [];
  let format = '';

  if (!addr) {
    return { chains: [], formatName: '' };
  }

  // 1. Ethereum & EVM Compatible (0x + 40 hex chars)
  // Also covers ERC-20 (USDC on Ethereum, Arbitrum, Optimism, Base, Polygon)
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    detected.push('ETH');
    format = 'EVM / Ethereum';
  }

  // 2. Solana (Base58, length 32 to 44 characters)
  // Exclude starting with 1 if length is 26-35 (which is BTC legacy) unless verified
  if (BASE58_REGEX.test(addr)) {
    if (addr.length >= 32 && addr.length <= 44) {
      // If it looks like base58 and is in Solana range
      // Note: Bitcoin legacy is 26-35 starting with 1. Solana addresses rarely start with 1, but can.
      // If it starts with 1 and length <= 35, it's primarily BTC.
      if (!(addr.startsWith('1') && addr.length <= 35)) {
        detected.push('SOL');
        if (!format) format = 'Solana';
      }
    }
  }

  // 3. Bitcoin
  // Segwit / Bech32 (bc1...)
  if (/^bc1[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(addr)) {
    detected.push('BTC');
    if (!format) format = 'Bitcoin (Bech32)';
  }
  // Native Segwit / Taproot (bc1p...)
  else if (/^bc1p[a-zA-HJ-NP-Z0-9]{58}$/i.test(addr)) {
    detected.push('BTC');
    if (!format) format = 'Bitcoin (Taproot)';
  }
  // Legacy / P2SH (Starts with 1 or 3, length 26-35, base58)
  else if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
    detected.push('BTC');
    // Note: LTC also uses '3' for multisig / P2SH (M-addresses are preferred now)
    if (addr.startsWith('3')) {
      detected.push('LTC');
      if (!format) format = 'Bitcoin / Litecoin (P2SH)';
    } else {
      if (!format) format = 'Bitcoin (Legacy)';
    }
  }

  // 4. Litecoin
  // Native Segwit (ltc1...)
  if (/^ltc1[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(addr)) {
    detected.push('LTC');
    if (!format) format = 'Litecoin (Bech32)';
  }
  // Litecoin legacy (L or M)
  else if (/^[LM][a-km-zA-HJ-NP-Z1-9]{26,34}$/.test(addr)) {
    detected.push('LTC');
    if (!format) format = 'Litecoin';
  }

  // 5. Tron (USDT-TRC20: starts with T, 34 chars, base58)
  if (/^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(addr)) {
    detected.push('TRX');
    if (!format) format = 'Tron (TRC20)';
  }

  return { chains: detected, formatName: format };
}

export function validateCryptoAddress(address: string, selectedSymbol: string): AddressValidationResult {
  const addr = (address || '').trim();
  if (!addr) {
    return {
      isValid: false,
      detectedChains: [],
      isMatch: false,
      error: 'Please enter your receiving wallet address.',
    };
  }

  const { chains, formatName } = detectCryptoChains(addr);

  if (chains.length === 0) {
    return {
      isValid: false,
      detectedChains: [],
      isMatch: false,
      error: 'Invalid wallet address format. Please check for missing characters.',
    };
  }

  const sym = selectedSymbol.toUpperCase();

  // Match check logic:
  // SOL -> requires SOL chain
  // ETH -> requires ETH chain
  // LTC -> requires LTC chain
  // BTC -> requires BTC chain
  // USDC -> Can be ERC20/EVM (0x...) or SPL (Solana) depending on user, but if user picked a specific network or coin:
  let matches = false;

  if (sym === 'SOL') {
    matches = chains.includes('SOL');
  } else if (sym === 'ETH') {
    matches = chains.includes('ETH');
  } else if (sym === 'LTC') {
    matches = chains.includes('LTC');
  } else if (sym === 'BTC') {
    matches = chains.includes('BTC');
  } else if (sym === 'USDC' || sym === 'USDC (SOL)') {
    matches = chains.includes('SOL') || chains.includes('ETH');
  } else {
    // Generic fallback
    matches = chains.some(c => c === sym);
  }

  if (!matches) {
    const detectedName = formatName || chains.join(' / ');
    return {
      isValid: true,
      detectedChains: chains,
      primaryChain: chains[0],
      formatName,
      isMatch: false,
      error: `Address appears to be for ${detectedName}, but you selected ${sym}!`,
    };
  }

  return {
    isValid: true,
    detectedChains: chains,
    primaryChain: chains[0],
    formatName,
    isMatch: true,
  };
}
