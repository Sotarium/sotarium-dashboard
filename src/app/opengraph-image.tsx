import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const alt = 'Sotarium — Cryptocurrency Loans Management';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Read logo.png as base64 for embedding in the og image
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  let logoBase64 = '';
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (e) {
    console.error('Failed to read logo.png for OG image:', e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050507',
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.08) 0%, rgba(20, 20, 25, 0.4) 40%, rgba(5, 5, 7, 1) 85%)',
          color: '#ffffff',
          position: 'relative',
          padding: '40px',
        }}
      >
        {/* Subtle background ambient ring */}
        <div
          style={{
            position: 'absolute',
            width: '650px',
            height: '650px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Central Card Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 64px',
            borderRadius: '36px',
            backgroundColor: 'rgba(18, 18, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Logo Badge */}
          {logoBase64 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                width: '128px',
                height: '128px',
                borderRadius: '28px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoBase64}
                alt="Sotarium Logo"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '60px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              marginBottom: '12px',
              fontFamily: 'sans-serif',
            }}
          >
            Sotarium
          </div>

          {/* Subtitle / Value Proposition */}
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: '#a1a1aa',
              marginBottom: '28px',
              fontFamily: 'sans-serif',
            }}
          >
            Cryptocurrency Loans Management
          </div>

          {/* Badges Bar (Supported Assets & Speed) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {['SOL', 'BTC', 'ETH', 'LTC'].map((coin) => (
              <div
                key={coin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: '#e4e4e7',
                }}
              >
                {coin}
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '14px',
                fontWeight: 600,
                color: '#10b981',
              }}
            >
              Instant Approvals
            </div>
          </div>
        </div>

        {/* Footer URL watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            color: '#71717a',
            fontFamily: 'sans-serif',
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          <span>sotarium.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
