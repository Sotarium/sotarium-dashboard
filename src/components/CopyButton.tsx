'use client';
import { useState, useRef } from 'react';
import { Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

const CM_STYLES = `
  @keyframes cm-stroke { 100% { stroke-dashoffset: 0; } }
  @keyframes cm-scale { 0%,100% { transform:none; } 50% { transform:scale3d(1.1,1.1,1); } }
  @keyframes cm-fill { 100% { box-shadow:inset 0px 0px 0px 30px #27F53F; } }
  .cm-root {
    border-radius:50%; display:block;
    stroke-width:2; stroke:#fff; stroke-miterlimit:10;
    box-shadow:inset 0px 0px 0px #27F53F;
    animation: cm-fill .4s ease-in-out .4s forwards, cm-scale .3s ease-in-out .9s both;
  }
  .cm-circle {
    stroke-dasharray:166; stroke-dashoffset:166;
    stroke-width:2; stroke-miterlimit:10; stroke:#27F53F; fill:none;
    animation: cm-stroke .6s cubic-bezier(0.65,0,0.45,1) forwards;
  }
  .cm-check {
    transform-origin:50% 50%;
    stroke-dasharray:48; stroke-dashoffset:48;
    animation: cm-stroke .3s cubic-bezier(0.65,0,0.45,1) .8s forwards;
  }
`;

export function CheckmarkAnim({ size = 'w-4 h-4' }: { size?: string }) {
  return (
    <>
      <style>{CM_STYLES}</style>
      <svg className={`cm-root ${size}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="cm-circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="cm-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </>
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
      {copied
        ? <CheckmarkAnim size={iconClassName} />
        : children ? children : <Copy className={iconClassName} />
      }
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

  return { copied, copy, showAnim: copied };
}
