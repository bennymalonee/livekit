"use client";

import Link from "next/link";
import { useEffect } from "react";

export function NodeInitialization() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="font-body bg-background-light dark:bg-[#0A0B0D] text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
        <div className="max-w-5xl w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-white/5 backdrop-blur-xl border border-white/10">
          <div
            className="absolute inset-x-0 h-px z-10 pointer-events-none"
            style={{
              background: "linear-gradient(to right, transparent, rgba(255,107,0,0.5), transparent)",
              animation: "scan 3s linear infinite",
            }}
          />
          <div className="p-8 md:p-12 flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-display text-4xl font-bold tracking-tight text-white mb-2">
                  NODE INITIALIZATION
                </h1>
                <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                  SYSTEM PROTOCOL 04-X // DEPLOYMENT MODE
                </p>
              </div>
              <Link
                href="/dashboard"
                className="text-slate-500 hover:text-white transition-colors p-2"
              >
                <span className="material-icons-round">close</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <svg className="w-full h-full">
                    <circle
                      className="text-white/5"
                      cx="160"
                      cy="160"
                      fill="transparent"
                      r="140"
                      stroke="currentColor"
                      strokeWidth={8}
                    />
                    <circle
                      className="text-dash-primary shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                      cx="160"
                      cy="160"
                      fill="transparent"
                      r="140"
                      stroke="currentColor"
                      strokeDasharray="880"
                      strokeDashoffset="350"
                      strokeLinecap="round"
                      strokeWidth={12}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="material-icons-round text-dash-primary text-4xl mb-2">
                      sensors
                    </span>
                    <div className="font-display text-6xl font-bold text-white tracking-tighter">
                      64%
                    </div>
                    <div className="text-slate-500 font-mono text-xs mt-2 uppercase">
                      Syncing Packets
                    </div>
                  </div>
                </div>
                <div className="flex gap-8 mt-8">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-mono mb-1">LATENCY</div>
                    <div className="text-lg font-display text-white">
                      24<span className="text-xs opacity-50 ml-1">MS</span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-mono mb-1">THROUGHPUT</div>
                    <div className="text-lg font-display text-white">
                      8.2<span className="text-xs opacity-50 ml-1">GB/S</span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-mono mb-1">STABILITY</div>
                    <div className="text-lg font-display text-dash-primary">99.8%</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                      Target VPS IP Address
                    </label>
                    <input
                      type="text"
                      defaultValue="192.168.12.254"
                      className="w-full bg-transparent border-none text-white font-mono text-xl focus:ring-0 p-0"
                      readOnly
                    />
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                      SSH Authentication Key
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="material-icons-round text-dash-primary/60 text-sm">key</span>
                      <input
                        type="password"
                        defaultValue="************************"
                        className="w-full bg-transparent border-none text-white font-mono text-lg focus:ring-0 p-0"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-white/10">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Region</div>
                      <div className="text-sm text-white font-semibold">EU-Central-1</div>
                    </div>
                    <span className="material-icons-round text-slate-600">language</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-white/10">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Instance</div>
                      <div className="text-sm text-white font-semibold">T4.Large</div>
                    </div>
                    <span className="material-icons-round text-slate-600">memory</span>
                  </div>
                </div>
                <Link
                  href="/deploy"
                  className="w-full bg-dash-primary hover:bg-orange-600 text-white font-display font-bold text-xl py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(255,107,0,0.3)]"
                >
                  INITIALIZE SYSTEM
                  <span className="material-icons-round">bolt</span>
                </Link>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Initialization Log
                </span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="bg-black/80 rounded-xl p-5 border border-white/5 font-mono text-xs leading-relaxed max-h-40 overflow-y-auto">
                <div className="text-slate-500">
                  [ 0.000000 ] Booting infrastructure management daemon...
                </div>
                <div className="text-slate-500">
                  [ 0.102394 ] Authenticating with Phoenix Mainframe...{" "}
                  <span className="text-green-500">SUCCESS</span>
                </div>
                <div className="text-slate-500">
                  [ 0.149202 ] Establishing SSH handshake with 192.168.12.254...
                </div>
                <div className="text-slate-500">[ 1.049281 ] Key verified. UID: 8f2-a22-c31.</div>
                <div className="text-dash-primary">[ 2.459102 ] Installing Phoenix Node-Edge-v2.0...</div>
                <div className="text-slate-300 animate-pulse">
                  [ 3.120019 ] Pulling container images [ 12/48 MB ] ...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
