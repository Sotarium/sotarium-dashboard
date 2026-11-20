'use client';
import { useState, useRef } from 'react';
import { Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export function CopyButton({ text, className, iconClassName = 'w-4 h-4', children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className={`relative ${className ?? ''}`}>
      {copied && (
        <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 z-50">
          <video
            src="https://cdnl.iconscout.com/lottie/free/preview/free-success-animation-gif-download-4503215.mp4"
            autoPlay muted playsInline
            className="w-16 h-16 object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
        </span>
      )}
      {children ? children : <Copy className={iconClassName} />}
    </button>
  );
}

/** Simple hook version for custom copy buttons */
export function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AnimOverlay = copied ? (
    <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 z-50">
      <video
        src="https://cdnl.iconscout.com/lottie/free/preview/free-success-animation-gif-download-4503215.mp4"
        autoPlay muted playsInline
        className="w-16 h-16 object-contain"
        style={{ mixBlendMode: 'screen' }}
      />
    </span>
  ) : null;

  return { copied, copy, AnimOverlay, showAnim: copied };
}
