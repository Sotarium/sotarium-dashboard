export interface IpCheckResult {
  isVpnOrProxy: boolean;
  provider?: string;
  type?: string;
  country?: string;
  risk?: number;
}

/**
 * Enterprise VPN / Proxy & Datacenter Detection Engine
 * Detects:
 * - Commercial VPNs (Nord, Express, Surfshark, Mullvad)
 * - Built-in browser proxies (Opera VPN, Opera Software Netherlands BV)
 * - Cloud / Datacenter hostings (AWS, DigitalOcean, OVH, Hetzner, etc.)
 * - Tor exit nodes & public proxies
 */
export async function checkIpReputation(clientIp: string): Promise<IpCheckResult> {
  if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
    return { isVpnOrProxy: false };
  }

  try {
    const res = await fetch(`https://proxycheck.io/v3/${encodeURIComponent(clientIp)}?vpn=1&asn=1&risk=1`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return { isVpnOrProxy: false };
    }

    const data = await res.json();
    const details = data[clientIp];
    if (!details) {
      return { isVpnOrProxy: false };
    }

    const network = details.network || {};
    const detections = details.detections || {};
    const org = (network.organisation || '').toLowerCase();
    const provider = (network.provider || '').toLowerCase();
    const type = (network.type || '').toLowerCase();

    // Check 1: Explicit proxy / vpn / tor flag
    const isExplicit = detections.proxy === true || detections.vpn === true || detections.tor === true || detections.anonymous === true;

    // Check 2: Opera VPN specific infrastructure (Opera Software Netherlands BV / HERN Labs AB)
    const isOperaVpn = org.includes('opera') || provider.includes('opera') || org.includes('hern labs');

    // Check 3: Datacenter / Hosting infrastructure (VPN exit nodes)
    const isHosting = detections.hosting === true || type === 'hosting' || type === 'datacenter';

    // Check 4: High risk threshold
    const isHighRisk = (detections.risk || 0) >= 50;

    const isBlocked = isExplicit || isOperaVpn || isHosting || isHighRisk;

    return {
      isVpnOrProxy: isBlocked,
      provider: network.provider || network.organisation,
      type: network.type,
      country: details.location?.country_name,
      risk: detections.risk || 0,
    };
  } catch (err) {
    console.error('Failed to query IP intelligence:', err);
    return { isVpnOrProxy: false };
  }
}
