'use client';

/**
 * Enterprise-grade Cross-Browser Hardware Fingerprint (Pure Physical Machine Identity)
 * 
 * Why Opera/Brave/Chrome generated different hashes previously:
 * - `navigator.userAgent` contains "OPR/..." on Opera vs "Chrome/..." on Chrome.
 * - `Intl.DateTimeFormat().resolvedOptions().timeZone` can change if Opera VPN proxies timezone headers.
 * - `localStorage` / `IndexedDB` are isolated per browser profile.
 * 
 * The Solution:
 * Extract PURE PHYSICAL HARDWARE traits that are identical across ALL browsers on the same machine:
 * 1. Physical GPU Unmasked Renderer & Vendor (e.g. "NVIDIA GeForce RTX 4070/PCIe/SSE2")
 * 2. WebGL Hardware Capabilities & Constants (Texture size, viewport max, precision)
 * 3. 2D Canvas Geometry & Mathematical Rendering (Arc, curve, and raster calculations)
 * 4. Screen Color Depth, Pixel Dimensions, & System Device Pixel Ratio
 * 5. Hardware CPU Logical Concurrency (navigator.hardwareConcurrency)
 */

export interface ClientFingerprintData {
  fingerprint: string;          // Master Hardware Fingerprint
  hardwareHwid: string;         // Pure cross-browser hardware hash
  glRenderer: string;
  glVendor: string;
}

// 1. Pure Geometry & Transform Canvas Hash (No text/font engine to avoid browser font quirks)
function getPureHardwareCanvas(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas_unsupported';

    // Pure 2D mathematical rendering (subpixel arc curves, gradients, and compositing)
    ctx.rect(0, 0, 150, 40);
    const grad = ctx.createLinearGradient(0, 0, 150, 40);
    grad.addColorStop(0, '#ff0055');
    grad.addColorStop(1, '#00ffff');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(75, 25, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fill();

    return canvas.toDataURL();
  } catch {
    return 'canvas_error';
  }
}

// 2. Pure GPU Hardware & Shader Spec
function getPureWebGLHardware(): { hardwareString: string; glVendor: string; glRenderer: string } {
  let glVendor = 'unknown_vendor';
  let glRenderer = 'unknown_renderer';
  let hardwareDetails = '';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown_vendor';
        glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown_renderer';
      }

      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      const subpixelBits = gl.getParameter(gl.SUBPIXEL_BITS);

      hardwareDetails = [
        glVendor,
        glRenderer,
        maxTextureSize,
        JSON.stringify(maxViewportDims),
        maxRenderbufferSize,
        subpixelBits,
      ].join(':::');
    }
  } catch {
    hardwareDetails = 'webgl_error';
  }

  return { hardwareString: hardwareDetails, glVendor, glRenderer };
}

// Master Cross-Browser Hardware Fingerprint
export async function getClientHWID(): Promise<string> {
  const data = await getDetailedClientFingerprint();
  return data.fingerprint;
}

export async function getDetailedClientFingerprint(): Promise<ClientFingerprintData> {
  if (typeof window === 'undefined') {
    return {
      fingerprint: 'server_env',
      hardwareHwid: 'server_env',
      glRenderer: '',
      glVendor: '',
    };
  }

  try {
    const canvasData = getPureHardwareCanvas();
    const { hardwareString, glVendor, glRenderer } = getPureWebGLHardware();

    // STRICT CROSS-BROWSER HARDWARE COMPONENT LIST:
    // Does NOT include userAgent, browser language, or timezone (which change on Opera / VPNs)
    const physicalHardwareComponents = [
      hardwareString,
      glRenderer,
      glVendor,
      canvasData,
      screen.colorDepth,
      screen.width,
      screen.height,
      window.devicePixelRatio || 1,
      navigator.hardwareConcurrency || 1,
    ].join('###');

    // Generate SHA-256 Hash
    const msgUint8 = new TextEncoder().encode(physicalHardwareComponents);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hardwareHwid = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return {
      fingerprint: hardwareHwid,
      hardwareHwid,
      glRenderer,
      glVendor,
    };
  } catch (err) {
    console.error('Failed to compute physical hardware fingerprint:', err);
    return {
      fingerprint: 'hw_fallback_' + Math.random().toString(36).substring(2),
      hardwareHwid: '',
      glRenderer: '',
      glVendor: '',
    };
  }
}
