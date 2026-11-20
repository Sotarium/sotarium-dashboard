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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`relative transition-all duration-200 ${className ?? ''}`}
    >
      {children ? (
        copied ? <Check className={`${iconClassName} text-emerald-400`} /> : children
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

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy, AnimOverlay: null, showAnim: false };
}
