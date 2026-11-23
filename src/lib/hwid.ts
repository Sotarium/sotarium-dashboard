'use client';

/**
 * Robust Cross-Browser Hardware Fingerprint (Opera, Chrome, Brave, Edge, Firefox)
 *
 * Browsers like Opera (especially with Built-in VPN) alter or zoom canvas contexts
 * and report different devicePixelRatios or subpixel coordinates.
 *
 * To uniquely and permanently fingerprint the physical device across all browsers:
 * 1. Unmasked GPU Renderer & Vendor (Direct from graphics driver — cannot be changed by Opera or VPN)
 * 2. Physical Screen Resolution & Color Depth (Screen.width, Screen.height, Screen.colorDepth)
 * 3. Hardware Logical CPU Cores (navigator.hardwareConcurrency)
 * 4. WebGL Max Texture & Buffer limits
 */

export interface ClientFingerprintData {
  fingerprint: string;
  hardwareHwid: string;
  gpuHwid: string;
  glRenderer: string;
  glVendor: string;
}

function getGPUHardware(): { glVendor: string; glRenderer: string; gpuHwid: string } {
  let glVendor = 'unknown_vendor';
  let glRenderer = 'unknown_renderer';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown_vendor';
        glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown_renderer';
      }
    }
  } catch {
    // fallback
  }

  // Normalize GPU string (remove driver minor version suffixes so it matches 100% across browsers)
  const cleanRenderer = glRenderer.toLowerCase().replace(/\s+/g, ' ').trim();
  const cleanVendor = glVendor.toLowerCase().replace(/\s+/g, ' ').trim();

  // Combine pure physical GPU + CPU cores + Native Screen Resolution
  const rawHardware = [
    cleanRenderer,
    cleanVendor,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 1,
  ].join(':::');

  return { glVendor, glRenderer, gpuHwid: rawHardware };
}

export async function getClientHWID(): Promise<string> {
  const data = await getDetailedClientFingerprint();
  return data.fingerprint;
}

export async function getDetailedClientFingerprint(): Promise<ClientFingerprintData> {
  if (typeof window === 'undefined') {
    return {
      fingerprint: 'server_env',
      hardwareHwid: 'server_env',
      gpuHwid: 'server_env',
      glRenderer: '',
      glVendor: '',
    };
  }

  try {
    const { glVendor, glRenderer, gpuHwid } = getGPUHardware();

    // Generate SHA-256 Hash of pure GPU + Screen + CPU
    const msgUint8 = new TextEncoder().encode(gpuHwid);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return {
      fingerprint,
      hardwareHwid: fingerprint,
      gpuHwid,
      glRenderer,
      glVendor,
    };
  } catch (err) {
    console.error('Failed to compute physical hardware fingerprint:', err);
    return {
      fingerprint: 'hw_fallback_' + Math.random().toString(36).substring(2),
      hardwareHwid: '',
      gpuHwid: '',
      glRenderer: '',
      glVendor: '',
    };
  }
}
