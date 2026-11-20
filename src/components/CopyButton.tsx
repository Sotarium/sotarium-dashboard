'use client';
import { useState, useRef } from 'react';
import { Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

function SuccessAnim() {
  return (
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 animate-in zoom-in-50 fade-in duration-200">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
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
      {copied && <SuccessAnim />}
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

  const AnimOverlay = copied ? <SuccessAnim /> : null;

  return { copied, copy, AnimOverlay, showAnim: copied };
}
