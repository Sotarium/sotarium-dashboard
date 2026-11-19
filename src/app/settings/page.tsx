'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, Laptop, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const apiKey = "a8022901-443b-4f9e-879e-4731a590924e";

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Your profile, security and signed in devices.
        </p>
      </div>

      {/* Account Card */}
      <div className="soteria-card p-6 space-y-6">
        <h3 className="text-sm font-semibold text-white">Account</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-300 font-semibold text-sm flex items-center justify-center">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">locokwstasloco</span>
                <span className="text-[11px] font-mono text-neutral-500">6a5a6b141d723e347647b478</span>
              </div>
              <div className="text-xs text-neutral-400">locolocokwstas@gmail.com</div>
            </div>
          </div>

          <button className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors">
            Change
          </button>
        </div>

        {/* API Key */}
        <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 mb-1">API key</div>
            <div className="flex items-center gap-2 font-mono text-sm text-white">
              <span>{showKey ? apiKey : "a8022901-••••-••••-••••-••••••••••••"}</span>
              <button onClick={() => setShowKey(!showKey)} className="text-neutral-500 hover:text-white transition-colors">
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={copyKey} className="text-neutral-500 hover:text-white transition-colors">
                {copiedKey ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors">
            Generate new
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="soteria-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Active sessions</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Devices currently signed in to your account.</p>
          </div>
          <button className="px-3.5 py-1.5 rounded-full bg-red-950/40 text-red-400 hover:bg-red-900/60 font-semibold text-xs transition-colors">
            Log out all others
          </button>
        </div>

        <div className="space-y-2">
          {/* Device 1 */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-neutral-400" />
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <span>Chrome on Windows</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-normal">This device</span>
                </div>
                <div className="text-xs text-neutral-500">CA, QC • active right now</div>
              </div>
            </div>
          </div>

          {/* Device 2 */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-4 h-4 text-neutral-400" />
              <div>
                <div className="text-sm font-medium text-white">Soteria Studio on DESKTOP-IZJDNU</div>
                <div className="text-xs text-neutral-500">Windows • v1.1.1 • active 10 minutes ago</div>
              </div>
            </div>
            <button className="px-3.5 py-1.5 rounded-full bg-[#222222] hover:bg-[#282828] text-xs font-medium text-neutral-300 transition-colors">
              Revoke
            </button>
          </div>
        </div>
      </div>

      {/* Redeem Code */}
      <div className="soteria-card p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white">Redeem code</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Enter code..."
            className="flex-1 px-4 py-2 rounded-xl bg-[#171717] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
          />
          <button className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors">
            Redeem
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="soteria-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Danger zone</h3>

        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
          <div>
            <div className="text-sm font-medium text-white">Change password</div>
            <div className="text-xs text-neutral-400">Update your account password.</div>
          </div>
          <button className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors">
            Change
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-white">Sign out</div>
            <div className="text-xs text-neutral-400">Log out of your account.</div>
          </div>
          <button className="px-5 py-2 rounded-full bg-red-950/40 text-red-400 hover:bg-red-900/60 font-semibold text-xs transition-colors">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
