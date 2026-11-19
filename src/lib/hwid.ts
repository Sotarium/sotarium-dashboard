'use client';

// Client-side Hardware / Device Fingerprint (HWID)
export async function getClientHWID(): Promise<string> {
  if (typeof window === 'undefined') return 'server';

  try {
    let glRenderer = '';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          glRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        }
      }
    } catch {
      // fallback
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      navigator.hardwareConcurrency || 1,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      glRenderer,
    ].join('|||');

    // SHA-256 hash using Web Crypto API
    const msgUint8 = new TextEncoder().encode(components);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hwid = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hwid;
  } catch (err) {
    console.error('Failed to compute HWID:', err);
    return 'hwid_fallback_' + Math.random().toString(36).substring(2);
  }
}
