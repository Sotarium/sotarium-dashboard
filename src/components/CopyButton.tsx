'use client';
import { useState, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export function CopyButton({ text, className, iconClassName = 'w-4 h-4', children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setShowAnim(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      setShowAnim(false);
    }, 2000);
  };

  return (
    <button onClick={handleCopy} className={`relative ${className ?? ''}`}>
      {/* Success animation overlay */}
      {showAnim && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center z-50">
          <span className="absolute -top-10 left-1/2 -translate-x-1/2">
            <video
              src="https://cdnl.iconscout.com/lottie/free/preview/free-success-animation-gif-download-4503215.mp4"
              autoPlay
              muted
              playsInline
              className="w-16 h-16 object-contain"
            />
          </span>
        </span>
      )}
      {children ? (
        children
      ) : copied ? (
        <Check className={`${iconClassName} text-emerald-400`} />
      ) : (
        <Copy className={iconClassName} />
      )}
    </button>
  );
}

/** Simple hook version for custom copy buttons */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const [showAnim, setShowAnim] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setShowAnim(true);
    setTimeout(() => { setCopied(false); setShowAnim(false); }, 2000);
  };

  const AnimOverlay = showAnim ? (
    <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 z-50">
      <video
        src="https://cdnl.iconscout.com/lottie/free/preview/free-success-animation-gif-download-4503215.mp4"
        autoPlay muted playsInline
        className="w-16 h-16 object-contain"
      />
    </span>
  ) : null;

  return { copied, showAnim, copy, AnimOverlay };
}
