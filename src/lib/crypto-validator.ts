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

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function detectCryptoChains(address: string): { chains: CryptoChain[]; formatName: string } {
  const addr = (address || '').trim();
  const detected: CryptoChain[] = [];
  let format = '';

  if (!addr) {
    return { chains: [], formatName: '' };
  }

  // 1. Ethereum & EVM Compatible (0x + 40 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    detected.push('ETH');
    format = 'Ethereum / EVM';
    return { chains: detected, formatName: format };
  }

  // 2. Bitcoin Segwit / Taproot
  if (/^bc1[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(addr)) {
    detected.push('BTC');
    format = 'Bitcoin (Bech32)';
    return { chains: detected, formatName: format };
  }

  // 3. Litecoin Native Segwit (ltc1...)
  if (/^ltc1[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(addr)) {
    detected.push('LTC');
    format = 'Litecoin (Bech32)';
    return { chains: detected, formatName: format };
  }

  // 4. Litecoin Legacy & P2SH (Starts with 'L' or 'M', length 26 to 34, base58)
  // MUST CHECK BEFORE SOLANA: A Litecoin address starts with 'L' or 'M' and is 26-34 chars!
  if (/^[LM][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
    detected.push('LTC');
    format = 'Litecoin';
    return { chains: detected, formatName: format };
  }

  // 5. Bitcoin Legacy (Starts with '1', length 26 to 35, base58)
  if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
    detected.push('BTC');
    format = 'Bitcoin (Legacy)';
    return { chains: detected, formatName: format };
  }

  // 6. Bitcoin/Litecoin Multi-sig (Starts with '3', length 26 to 34, base58)
  if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
    detected.push('BTC');
    detected.push('LTC');
    format = 'Bitcoin / Litecoin (P2SH)';
    return { chains: detected, formatName: format };
  }

  // 7. Tron (Starts with 'T', length 34, base58)
  if (/^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(addr)) {
    detected.push('TRX');
    format = 'Tron (TRC-20)';
    return { chains: detected, formatName: format };
  }

  // 8. Solana (Base58, length 32 to 44 characters)
  // Exclude anything starting with 'L' or 'M' if length <= 34 (handled by Litecoin above),
  // and exclude starting with '1' if length <= 35 (Bitcoin).
  if (BASE58_REGEX.test(addr)) {
    if (addr.length >= 32 && addr.length <= 44) {
      if (!((addr.startsWith('L') || addr.startsWith('M')) && addr.length <= 34) &&
          !(addr.startsWith('1') && addr.length <= 35)) {
        detected.push('SOL');
        format = 'Solana';
        return { chains: detected, formatName: format };
      }
    }
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
  let matches = false;

  if (sym === 'SOL') {
    matches = chains.includes('SOL');
  } else if (sym === 'ETH') {
    matches = chains.includes('ETH');
  } else if (sym === 'LTC') {
    matches = chains.includes('LTC');
  } else if (sym === 'BTC') {
    matches = chains.includes('BTC');
  } else {
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
