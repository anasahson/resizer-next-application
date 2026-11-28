import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Resizer AI product image workspace';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.25) 0%, transparent 50%)',
          color: 'white',
          padding: '40px 60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: '40px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(90deg, #ffffff, #93c5fd)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Resizer AI
          </span>
        </div>

        <h1
          style={{
            fontSize: '64px',
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 20px 0',
            maxWidth: '1000px',
          }}
        >
          Product Images, Ready to Publish
        </h1>

        <p
          style={{
            fontSize: '24px',
            color: '#a1a1aa',
            textAlign: 'center',
            margin: '0 0 40px 0',
            maxWidth: '850px',
            lineHeight: 1.4,
          }}
        >
          Resize, crop, compress, and convert product photos for stores and the web.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ⚡ Exact image dimensions
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ✨ WebP & AVIF Codecs
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '999px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            📦 Batch Processing
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
