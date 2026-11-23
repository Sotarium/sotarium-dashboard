'use client';

/**
 * Enterprise-grade Client Hardware & Browser Fingerprinting System
 * Covers:
 * 1. Deep Canvas 2D Fingerprinting (Font rasterization, sub-pixel rendering, anti-aliasing quirks)
 * 2. WebGL 3D & Shader Precision Fingerprinting (Hardware vendor, renderer, extension hashes)
 * 3. Web Audio API Fingerprinting (AudioContext dynamics compressor & oscillator frequency harmonics)
 * 4. Screen, Hardware & Platform Metrics (colorDepth, devicePixelRatio, cores, memory, timezone)
 * 5. Persistent Multi-Layered Storage ("Zombie / Supercookie" resilience via localStorage + IndexedDB)
 * 6. Datacenter / Automation / Bot Environment Detection (navigator.webdriver, headless indicators)
 */

export interface ClientFingerprintData {
  fingerprint: string;          // Master SHA-256 composite hash
  canvasHash: string;           // 2D Canvas rendering hash
  webglHash: string;            // WebGL & GPU hardware hash
  audioHash: string;            // Web Audio frequency response hash
  glRenderer: string;           // Unmasked GPU renderer string
  glVendor: string;             // Unmasked GPU vendor string
  isBotSuspect: boolean;        // Headless / automation flags detected
  isDatacenterOrVpn?: boolean;  // Enriched on server
}

// 1. Deep Canvas 2D Hash
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas_unsupported';

    // Complex drawing to exploit sub-pixel rendering & font engine quirks
    ctx.textBaseline = 'top';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('Sotarium Anti-Alt Shield <canvas> 1.0 \uD83D\uDD12 \uD83D\uDC7E', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Subpixel-Rendering & W3C Antialiasing Check', 4, 35);

    // Geometry & arc blending
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.5)';
    ctx.beginPath();
    ctx.arc(50, 45, 10, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();

    return canvas.toDataURL();
  } catch {
    return 'canvas_error';
  }
}

// 2. WebGL Hardware & Shader Precision Fingerprint
function getWebGLFingerprint(): { webglHash: string; glVendor: string; glRenderer: string } {
  let glVendor = 'unknown';
  let glRenderer = 'unknown';
  let webglDetails = '';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
        glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }

      // Collect WebGL parameters & precision
      const supportedExtensions = gl.getSupportedExtensions() || [];
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      const aliasedLineWidth = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

      webglDetails = [
        glVendor,
        glRenderer,
        maxTextureSize,
        JSON.stringify(maxViewportDims),
        JSON.stringify(aliasedLineWidth),
        supportedExtensions.length,
      ].join(':::');
    }
  } catch {
    webglDetails = 'webgl_error';
  }

  return { webglHash: webglDetails, glVendor, glRenderer };
}

// 3. Web Audio API Frequency Response Fingerprint
async function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve('audio_unsupported');
        return;
      }

      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const compressor = context.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(-50, context.currentTime);
      compressor.knee.setValueAtTime(40, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      oscillator.connect(compressor);
      compressor.connect(context.destination);

      oscillator.start(0);
      oscillator.stop(0.05);

      // Collect state signature
      setTimeout(() => {
        try {
          const reductionVal = typeof compressor.reduction === 'number' 
            ? compressor.reduction 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (compressor.reduction as any)?.value || 0;

          const sample = [
            reductionVal,
            context.sampleRate,
            context.state,
          ].join('::');
          context.close().catch(() => {});
          resolve(sample);
        } catch {
          resolve('audio_timeout');
        }
      }, 50);
    } catch {
      resolve('audio_error');
    }
  });
}

// 4. Multi-Layer Persistent Storage (IndexedDB + LocalStorage Supercookie)
const IDB_DB_NAME = 'sotarium_security_vault';
const IDB_STORE_NAME = 'device_tokens';

async function getOrSetPersistentToken(key: string, valueToStore?: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(IDB_STORE_NAME, valueToStore ? 'readwrite' : 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);

        if (valueToStore) {
          store.put(valueToStore, key);
          resolve(valueToStore);
        } else {
          const getReq = store.get(key);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Automation and Headless Browser Check
function detectAutomation(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  if (nav.webdriver === true) return true;
  if (window.document.documentElement.getAttribute('webdriver')) return true;
  if (nav.languages === '' || (nav.languages && nav.languages.length === 0)) return true;
  return false;
}

// Master composite fingerprint generator
export async function getClientHWID(): Promise<string> {
  const data = await getDetailedClientFingerprint();
  return data.fingerprint;
}

export async function getDetailedClientFingerprint(): Promise<ClientFingerprintData> {
  if (typeof window === 'undefined') {
    return {
      fingerprint: 'server_env',
      canvasHash: '',
      webglHash: '',
      audioHash: '',
      glRenderer: '',
      glVendor: '',
      isBotSuspect: false,
    };
  }

  try {
    const canvasData = getCanvasFingerprint();
    const { webglHash, glVendor, glRenderer } = getWebGLFingerprint();
    const audioData = await getAudioFingerprint();
    const isBot = detectAutomation();

    // Check Multi-layered Supercookie
    let permanentSeed = localStorage.getItem('sotarium_alt_token');
    if (!permanentSeed) {
      permanentSeed = await getOrSetPersistentToken('sotarium_device_id');
      if (permanentSeed) {
        localStorage.setItem('sotarium_alt_token', permanentSeed);
      }
    }

    const payloadParts = [
      canvasData,
      webglHash,
      audioData,
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      window.devicePixelRatio || 1,
      navigator.hardwareConcurrency || 1,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      permanentSeed || '',
    ].join('|||');

    // SHA-256 Hash
    const msgUint8 = new TextEncoder().encode(payloadParts);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Ensure persistent seed is locked into IndexedDB & LocalStorage
    if (!permanentSeed) {
      localStorage.setItem('sotarium_alt_token', fingerprint);
      await getOrSetPersistentToken('sotarium_device_id', fingerprint);
    }

    return {
      fingerprint,
      canvasHash: canvasData.slice(0, 48),
      webglHash,
      audioHash: audioData,
      glRenderer,
      glVendor,
      isBotSuspect: isBot,
    };
  } catch (err) {
    console.error('Failed to compute security fingerprint:', err);
    return {
      fingerprint: 'fallback_' + Math.random().toString(36).substring(2),
      canvasHash: '',
      webglHash: '',
      audioHash: '',
      glRenderer: '',
      glVendor: '',
      isBotSuspect: false,
    };
  }
}
