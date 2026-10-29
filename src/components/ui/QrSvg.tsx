'use client';

import { useMemo } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a QR code as inline SVG markup. We deliberately avoid a lazily loaded
 * `import('qrcode')` chunk and a data-URL <img>, both of which some privacy /
 * ad-blocking extensions block, leaving the QR blank.
 */
export function QrSvg({ value, className }: { value: string; className?: string }) {
  const svg = useMemo(() => {
    if (!value) return '';
    let out = '';
    QRCode.toString(value, { type: 'svg', margin: 1 }, (err, s) => {
      if (!err) out = s;
    });
    return out;
  }, [value]);

  if (!svg) return null;
  return (
    <div
      role="img"
      aria-label="Scan to upload photos"
      className={`[&>svg]:w-full [&>svg]:h-full ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Builds a PNG data URL on demand (only used for the download button). */
export function qrPngDataUrl(value: string, width = 1000): Promise<string> {
  return QRCode.toDataURL(value, { width, margin: 1 });
}
