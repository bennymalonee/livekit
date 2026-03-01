"use client";

import Link from "next/link";
import { useAuthToken, useAuthActions } from "@convex-dev/auth/react";
import { APP_NAV_STRUCTURE } from "@/lib/app-nav";

type NavLink = { label: string; path: string; requireAuth?: boolean; signOut?: boolean };

function getAuthNavLinks(): NavLink[] {
  const links: NavLink[] = [];
  for (const group of APP_NAV_STRUCTURE) {
    for (const link of group.links) {
      if ("requireAuth" in link && link.requireAuth && !("signOut" in link && link.signOut)) {
        links.push({ label: link.label, path: link.path, requireAuth: true });
      }
    }
  }
  return links;
}

function getSignOutLink(): NavLink | undefined {
  for (const group of APP_NAV_STRUCTURE) {
    const found = group.links.find((l) => "signOut" in l && l.signOut);
    if (found) return { label: found.label, path: found.path, signOut: true };
  }
  return undefined;
}

export function EnterpriseLanding() {
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const isAuthenticated = token != null;

  const authNavLinks = getAuthNavLinks();
  const signOutLink = getSignOutLink();

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <span className="material-icons text-primary text-3xl group-hover:animate-pulse shadow-primary drop-shadow-[0_0_8px_rgba(255,77,0,0.8)]">
              bolt
            </span>
            <span className="font-display font-bold text-xl tracking-widest text-white">
              LIVKIT
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a
              className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
              href="#infrastructure"
            >
              INFRASTRUCTURE
            </a>
            <a
              className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
              href="#solutions"
            >
              SOLUTIONS
            </a>
            <a
              className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
              href="#network"
            >
              NETWORK
            </a>
            <a
              className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
              href="#pricing"
            >
              PRICING
            </a>
            {isAuthenticated ? (
              <>
                {authNavLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium tracking-wide hover:text-primary transition-colors text-gray-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]"
                >
                  SIGN UP
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <span className="material-icons text-gray-400 text-sm">search</span>
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 bg-surface-dark border border-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)] px-4 py-2 rounded-lg transition-all duration-300 group"
                >
                  <span className="text-xs font-bold tracking-widest text-white">
                    CONSOLE
                  </span>
                  <span className="material-icons text-primary text-xs group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
                {signOutLink && (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary transition-colors"
                  >
                    SIGN OUT
                  </button>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 bg-surface-dark border border-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)] px-4 py-2 rounded-lg transition-all duration-300 group"
              >
                <span className="text-xs font-bold tracking-widest text-white">
                  CONSOLE
                </span>
                <span className="material-icons text-primary text-xs group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>
      {/* Hero */}
      <section className="relative min-h-screen pt-32 pb-20 overflow-hidden flex flex-col items-center justify-center bg-background-dark">
        <div className="absolute inset-0 z-0 bg-grid-pattern tech-grid opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none opacity-20 z-0" style={{ background: "radial-gradient(circle at 50% 0%, #FF5C00 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[96px] pointer-events-none mix-blend-screen" />
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm shadow-[0_0_10px_rgba(255,77,0,0.1)]">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#ff4d00]" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">System Operational</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Real-time network active
              </div>
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl leading-tight tracking-tight text-white uppercase drop-shadow-lg">
              Global <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-200 glow-text">Real-Time</span> <br />
              Infrastructure
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Deploy instantly on the world&apos;s most advanced edge network. Ultra-low latency streaming hubs across 40+ global regions. Built for the next generation of data flow and enterprise applications.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start flex-wrap">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/deploy"
                    className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-orange-600 text-white font-bold tracking-widest rounded-lg shadow-[0_0_20px_rgba(255,77,0,0.4)] hover:shadow-[0_0_30px_rgba(255,77,0,0.6)] transition-all hover:scale-105 flex items-center justify-center gap-2 group border border-primary/50"
                  >
                    <span>DEPLOY NODE</span>
                    <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">bolt</span>
                  </Link>
                  <Link
                    href="/nodes"
                    className="w-full sm:w-auto px-8 py-4 bg-primary/20 hover:bg-primary/30 text-white font-bold rounded-lg border border-primary/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    Initialize Node <span className="material-icons text-sm">arrow_forward</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-gray-700 hover:border-primary text-white font-medium tracking-widest rounded-lg transition-all hover:shadow-[0_0_15px_rgba(255,77,0,0.2)] flex items-center justify-center gap-2"
                  >
                    <span>DASHBOARD</span>
                    <span className="font-mono text-xs opacity-50">-&gt;</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-orange-600 text-white font-bold tracking-widest rounded-lg shadow-[0_0_20px_rgba(255,77,0,0.4)] hover:shadow-[0_0_30px_rgba(255,77,0,0.6)] transition-all hover:scale-105 flex items-center justify-center gap-2 group border border-primary/50"
                  >
                    <span>GET STARTED</span>
                    <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">bolt</span>
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-8 py-4 bg-primary/20 hover:bg-primary/30 text-white font-bold rounded-lg border border-primary/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    Sign in <span className="material-icons text-sm">arrow_forward</span>
                  </Link>
                  <Link
                    href="#pricing"
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-gray-700 hover:border-primary text-white font-medium tracking-widest rounded-lg transition-all hover:shadow-[0_0_15px_rgba(255,77,0,0.2)] flex items-center justify-center gap-2"
                  >
                    <span>PRICING</span>
                    <span className="font-mono text-xs opacity-50">-&gt;</span>
                  </Link>
                </>
              )}
            </div>
            <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 border-t border-white/10">
              <div>
                <div className="font-display text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">99.99%</div>
                <div className="text-xs font-mono text-gray-500 uppercase tracking-wide">Uptime</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="font-display text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">15ms</div>
                <div className="text-xs font-mono text-gray-500 uppercase tracking-wide">Global Latency</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="font-display text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">400+</div>
                <div className="text-xs font-mono text-gray-500 uppercase tracking-wide">Edge Nodes</div>
              </div>
            </div>
          </div>
          <div className="relative lg:h-[600px] w-full flex items-center justify-center">
            <div className="absolute inset-0 border border-white/5 rounded-full scale-100 animate-spin-slow" />
            <div className="absolute inset-10 border border-dashed border-white/10 rounded-full scale-90 animate-spin-slow-reverse" />
            <div className="relative z-10 w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-1 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_#ff4d00]" />
              <div className="bg-surface-darker rounded-xl p-6 relative overflow-hidden h-[450px] flex flex-col justify-between border border-white/5">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="flex justify-between items-start z-10">
                  <div>
                    <h3 className="font-display font-bold text-white text-xl tracking-wide">ZEUS-X HUB</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]" />
                      <span className="text-xs text-gray-400 font-mono">Active Region: EU-WEST</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono border border-white/10 text-gray-300">HW-V4.2</span>
                </div>
                <div className="flex-1 flex items-center justify-center relative py-8">
                  <div className="absolute w-32 h-32 bg-primary/20 blur-[40px] rounded-full" />
                  <img
                    alt="Abstract 3D Hardware Render"
                    className="relative z-10 w-48 h-48 object-cover rounded-lg mix-blend-screen opacity-100 group-hover:scale-105 transition-transform duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3wfqPEOOaDlI8QmjhuLFd_qyD6kegYyek1m-SBnz72NivcL3NA41dU6pHsDqvk1-w6lp_a7BIrHGgJI4Mhl-IPNy62zkChVaUkYYRvT3Dv-fr_G0vWzEBTUjnbnweC__Y6KQP6LgrelQxTdVrbaxLLyEcGbclmL-1T8yg3u8hhcuxufl1MkjyvUUwohU54DNi41dajrqlVLhycZZOa4M7CzDXIBTW9_q7HQF2bepxT1zYlg9W4Ipw0eSdzDejG431G57j0xHHy45j"
                  />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M50 50 L 10 80" fill="none" stroke="#FF4D00" strokeWidth="0.5" />
                    <path d="M50 50 L 90 80" fill="none" stroke="#FF4D00" strokeWidth="0.5" />
                    <path d="M50 50 L 50 10" fill="none" stroke="#FF4D00" strokeWidth="0.5" />
                    <circle cx="50" cy="50" fill="#FF4D00" r="2" style={{ filter: "drop-shadow(0 0 4px #FF4D00)" }} />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-3 z-10">
                  <div className="bg-white/5 p-3 rounded border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Throughput</div>
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-display font-bold text-white">42.8</span>
                      <span className="text-xs text-primary mb-1">TB/s</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[70%] shadow-[0_0_5px_#ff4d00]" />
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Power Load</div>
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-display font-bold text-white">88</span>
                      <span className="text-xs text-green-500 mb-1">%</span>
                    </div>
                    <div className="flex gap-0.5 mt-2">
                      <div className="h-1 w-1/5 bg-primary rounded-full shadow-[0_0_2px_#ff4d00]" />
                      <div className="h-1 w-1/5 bg-primary rounded-full shadow-[0_0_2px_#ff4d00]" />
                      <div className="h-1 w-1/5 bg-primary rounded-full shadow-[0_0_2px_#ff4d00]" />
                      <div className="h-1 w-1/5 bg-primary rounded-full shadow-[0_0_2px_#ff4d00]" />
                      <div className="h-1 w-1/5 bg-gray-800 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture — #infrastructure */}
      <section id="infrastructure" className="py-24 bg-surface-darker relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">SYSTEM ARCHITECTURE</h2>
              <p className="text-gray-400 font-light">Visualizing data propagation through edge nodes.</p>
            </div>
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-primary hover:text-white flex items-center gap-2 font-mono text-sm transition-colors hover:drop-shadow-[0_0_5px_#ff4d00]">
                FULL TOPOLOGY <span className="material-icons text-sm">open_in_new</span>
              </Link>
            ) : (
              <Link href="/login" className="text-primary hover:text-white flex items-center gap-2 font-mono text-sm transition-colors hover:drop-shadow-[0_0_5px_#ff4d00]">
                SIGN IN TO VIEW <span className="material-icons text-sm">open_in_new</span>
              </Link>
            )}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-surface-dark/90 border border-white/10 hover:border-primary/50 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-primary/30 transition-colors">
                  <span className="material-icons text-gray-300 group-hover:text-primary transition-colors">input</span>
                </div>
                <span className="font-mono text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg shadow-[0_0_5px_rgba(34,197,94,0.2)]">ONLINE</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors">Ingest Node</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">High-bandwidth entry points accepting raw data streams from IoT devices and servers.</p>
              <div className="h-24 w-full bg-black/40 rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-around px-4">
                  <div className="w-1 h-8 bg-primary/20 rounded-full group-hover:bg-primary group-hover:h-12 group-hover:shadow-[0_0_10px_#ff4d00] transition-all duration-300" />
                  <div className="w-1 h-12 bg-primary/40 rounded-full group-hover:bg-primary group-hover:h-16 group-hover:shadow-[0_0_10px_#ff4d00] transition-all duration-300 delay-75" />
                  <div className="w-1 h-6 bg-primary/30 rounded-full group-hover:bg-primary group-hover:h-10 group-hover:shadow-[0_0_10px_#ff4d00] transition-all duration-300 delay-100" />
                  <div className="w-1 h-10 bg-primary/50 rounded-full group-hover:bg-primary group-hover:h-14 group-hover:shadow-[0_0_10px_#ff4d00] transition-all duration-300 delay-150" />
                  <div className="w-1 h-14 bg-primary/20 rounded-full group-hover:bg-primary group-hover:h-8 group-hover:shadow-[0_0_10px_#ff4d00] transition-all duration-300 delay-200" />
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-surface-dark/90 border border-white/10 hover:border-primary/50 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="hidden lg:block absolute top-1/2 -left-3 w-6 h-[2px] bg-gradient-to-r from-transparent to-primary shadow-[0_0_5px_#ff4d00]" />
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-primary/30 transition-colors">
                  <span className="material-icons text-gray-300 group-hover:text-primary transition-colors">memory</span>
                </div>
                <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg shadow-[0_0_5px_rgba(255,77,0,0.2)]">PROCESSING</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors">Edge Compute</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">Real-time processing and transcoding performed at the network edge to minimize latency.</p>
              <div className="h-24 w-full bg-black/40 rounded-lg relative overflow-hidden border border-white/5 p-4 flex flex-col justify-center gap-2 shadow-inner">
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>CPU</span>
                  <span>88%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[88%] shadow-[0_0_8px_#ff4d00]" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                  <span>MEM</span>
                  <span>42%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-500 h-full w-[42%]" />
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-surface-dark/90 border border-white/10 hover:border-primary/50 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-primary/30 transition-colors">
                  <span className="material-icons text-gray-300 group-hover:text-primary transition-colors">hub</span>
                </div>
                <span className="font-mono text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg shadow-[0_0_5px_rgba(96,165,250,0.2)]">DISTRIBUTING</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors">Global Mesh</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">Intelligent routing delivering processed data to end-users via the optimal path.</p>
              <div className="h-24 w-full bg-black/40 rounded-lg relative overflow-hidden border border-white/5 shadow-inner">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                  <path className="opacity-80" d="M0 50 Q 25 10 50 25 T 100 0" fill="none" stroke="#FF4D00" strokeWidth={2} style={{ filter: "drop-shadow(0 0 2px #FF4D00)" }} />
                  <path className="opacity-30" d="M0 50 Q 25 30 50 40 T 100 20" fill="none" stroke="#555" strokeWidth={1} />
                  <circle className="fill-white animate-ping" cx="50" cy="25" r="3" />
                  <circle className="fill-primary" cx="50" cy="25" r="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Control — #solutions */}
      <section id="solutions" className="py-24 bg-background-dark overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-30" />
              <div className="relative bg-surface-darker border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <h4 className="font-display text-white">ENERGY FLOW MONITOR</h4>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.2)]" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 shadow-[0_0_5px_rgba(234,179,8,0.2)]" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 shadow-[0_0_5px_rgba(34,197,94,0.2)]" />
                  </div>
                </div>
                <div className="relative h-64 flex items-center">
                  <div className="w-1/3 space-y-4">
                    <div className="p-3 bg-white/5 rounded border-l-2 border-primary shadow-[0_0_10px_rgba(0,0,0,0.2)]">
                      <div className="text-xs text-gray-400">OUTPUT</div>
                      <div className="text-lg font-mono text-white">38 KWH</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded border-l-2 border-transparent opacity-50">
                      <div className="text-xs text-gray-400">INPUT</div>
                      <div className="text-lg font-mono text-white">12 KWH</div>
                    </div>
                  </div>
                  <div className="flex-1 h-full relative mx-4">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 100">
                      <path className="opacity-80" d="M0 25 C 100 25, 100 10, 200 10" fill="none" stroke="#FF4D00" strokeWidth={4} style={{ filter: "drop-shadow(0 0 4px #FF4D00)" }} />
                      <path className="opacity-60" d="M0 25 C 100 25, 100 35, 200 35" fill="none" stroke="#FF4D00" strokeWidth={2} />
                      <path className="opacity-40" d="M0 25 C 100 25, 100 60, 200 60" fill="none" stroke="#FF4D00" strokeWidth={1} />
                      <path className="opacity-20" d="M0 25 C 100 25, 100 90, 200 90" fill="none" stroke="#FF4D00" strokeWidth={1} />
                      <circle fill="white" r="3">
                        <animateMotion dur="2s" path="M0 25 C 100 25, 100 10, 200 10" repeatCount="indefinite" />
                      </circle>
                    </svg>
                    <div className="absolute left-0 top-[25%] -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_#ff4d00] z-10 border border-white/20">
                      <span className="material-icons text-white text-sm">bolt</span>
                    </div>
                  </div>
                  <div className="w-1/4 space-y-2">
                    <div className="h-8 bg-white/5 rounded flex items-center px-2 justify-between border border-white/5">
                      <span className="text-[10px] text-gray-400">Main AC</span>
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#ff4d00]" />
                    </div>
                    <div className="h-8 bg-white/5 rounded flex items-center px-2 justify-between opacity-50 border border-white/5">
                      <span className="text-[10px] text-gray-400">Sec AC</span>
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                    </div>
                    <div className="h-8 bg-white/5 rounded flex items-center px-2 justify-between opacity-50 border border-white/5">
                      <span className="text-[10px] text-gray-400">USB-C</span>
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                    </div>
                    <div className="h-8 bg-white/5 rounded flex items-center px-2 justify-between border border-white/5">
                      <span className="text-[10px] text-gray-400">USB-C</span>
                      <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_5px_orange]" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-3 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500">BATTERY LIFE</div>
                    <div className="text-xl font-display text-white">12<span className="text-sm text-gray-500 ml-1">HR</span></div>
                  </div>
                  <div className="bg-black/40 p-3 rounded flex items-center justify-between border border-white/5">
                    <div>
                      <div className="text-[10px] text-gray-500">LOAD</div>
                      <div className="text-sm text-white">MEDIUM</div>
                    </div>
                    <div className="h-8 w-16">
                      <svg className="w-full h-full" viewBox="0 0 50 20">
                        <path d="M0 10 Q 12.5 0 25 10 T 50 10" fill="none" stroke="#FF4D00" strokeWidth={2} style={{ filter: "drop-shadow(0 0 2px #FF4D00)" }} />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-12 h-1 bg-primary mb-6 shadow-[0_0_10px_#ff4d00]" />
              <h2 className="font-display font-bold text-3xl md:text-5xl text-white mb-6">
                Complete Control<br />
                <span className="text-gray-500">Over Your Stack</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 font-light leading-relaxed">
                Our dashboard provides granular visibility into your infrastructure&apos;s performance. Monitor energy consumption, bandwidth flow, and hardware status in real-time.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="material-icons text-primary drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]">check_circle</span>
                  <span className="text-gray-300">Predictive maintenance alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-icons text-primary drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]">check_circle</span>
                  <span className="text-gray-300">Real-time throughput analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-icons text-primary drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]">check_circle</span>
                  <span className="text-gray-300">Automated load balancing</span>
                </li>
              </ul>
              {isAuthenticated ? (
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary font-bold tracking-wider hover:gap-4 transition-all hover:text-orange-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]">
                  EXPLORE DASHBOARD <span className="material-icons text-sm">arrow_forward</span>
                </Link>
              ) : (
                <Link href="/login" className="inline-flex items-center gap-2 text-primary font-bold tracking-wider hover:gap-4 transition-all hover:text-orange-400 hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]">
                  SIGN IN TO EXPLORE <span className="material-icons text-sm">arrow_forward</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Hub Control — from alt */}
      <section id="live-hub" className="py-24 px-6 relative bg-surface-darker border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl font-display font-bold mb-4 text-white">Live Hub Control</h2>
              <p className="text-slate-400">Monitor flow and energy consumption in real-time.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl">
              <button type="button" className="px-6 py-2 bg-white/10 text-white rounded-lg text-sm font-semibold">
                Energy Flow
              </button>
              <button type="button" className="px-6 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-semibold transition-colors">
                Global Maps
              </button>
              <button type="button" className="px-6 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-semibold transition-colors">
                Alerts
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden h-[500px]">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-4xl font-display font-bold tracking-tight mb-2 text-white">
                    ENERGY
                    <br />
                    FLOW
                  </h3>
                  <div className="flex items-center gap-4 mt-8">
                    <div className="bg-primary/20 p-4 rounded-xl border border-primary/30 flex items-center gap-4">
                      <div className="text-white">
                        <p className="text-[10px] font-mono opacity-60">OUTPUT</p>
                        <p className="font-bold text-lg">
                          38 KWH <span className="material-icons-round text-xs">bolt</span>
                        </p>
                      </div>
                      <div className="bg-primary p-2 rounded-lg">
                        <span className="material-icons-round text-white text-xl">bolt</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400">
                  Add Port <span className="material-icons-round text-sm">add</span>
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-[0.2em] mb-6">
                  Device Details
                </h4>
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Mode</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-white">
                      X-BOOST <span className="material-icons-round text-primary text-xs">bolt</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Time</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-gray-300">
                      3H 15M <span className="material-icons-round text-slate-500 text-xs">schedule</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Frequency</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-gray-300">
                      50 HZ <span className="material-icons-round text-slate-500 text-xs">waves</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Temp</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-gray-300">
                      30°C <span className="material-icons-round text-slate-500 text-xs">thermostat</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — #pricing */}
      <section id="pricing" className="py-24 relative overflow-hidden bg-background-dark">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,77,0,0.08),transparent)] z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 opacity-50" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono tracking-widest uppercase mb-6">
              Pricing
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4 tracking-tight">
              Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-300">pricing</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
              Scale from a single edge node to a global mesh. No hidden fees. Pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Starter */}
            <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-surface-dark/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(255,77,0,0.08)]">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-primary/30 transition-colors">
                    <span className="material-icons text-gray-400 group-hover:text-primary transition-colors">rocket_launch</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white tracking-wide">Starter</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-black text-white">$0</span>
                  <span className="text-gray-500 font-medium ml-1">/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-1">
                  Perfect for trying the network. One region, full dashboard access.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-gray-300">
                  {["1 edge region", "Up to 10K sessions/mo", "Real-time dashboard", "Email support"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-icons text-primary text-base">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="mt-auto w-full py-3.5 rounded-xl border border-white/20 hover:border-primary/50 hover:bg-primary/10 text-white font-semibold tracking-wide text-center transition-all duration-300"
                >
                  {isAuthenticated ? "Open dashboard" : "Get started free"}
                </Link>
              </div>
            </div>

            {/* Pro — featured */}
            <div className="group relative flex flex-col rounded-2xl border-2 border-primary/60 bg-gradient-to-b from-primary/10 to-surface-dark/90 backdrop-blur-sm overflow-hidden transition-all duration-300 shadow-[0_0_60px_rgba(255,77,0,0.15)] hover:shadow-[0_0_80px_rgba(255,77,0,0.2)] hover:border-primary scale-[1.02] z-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#ff4d00]" />
              <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold tracking-widest uppercase">
                Most popular
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/40">
                    <span className="material-icons text-primary">bolt</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white tracking-wide">Pro</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-black text-white">$99</span>
                  <span className="text-gray-500 font-medium ml-1">/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-1">
                  For teams scaling real-time apps. Multiple regions, priority support.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-gray-300">
                  {["5 edge regions", "Up to 100K sessions/mo", "LiveKit + Redis stack", "Priority support", "Custom domains"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-icons text-primary text-base">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={isAuthenticated ? "/deploy" : "/signup"}
                  className="mt-auto w-full py-3.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold tracking-widest text-center shadow-[0_0_20px_rgba(255,77,0,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,77,0,0.5)] border border-primary/50"
                >
                  {isAuthenticated ? "Deploy now" : "Start free trial"}
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-surface-dark/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(255,77,0,0.08)]">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-primary/30 transition-colors">
                    <span className="material-icons text-gray-400 group-hover:text-primary transition-colors">hub</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white tracking-wide">Enterprise</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-black text-white">Custom</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-1">
                  Global mesh, SLA, dedicated support. Built for the largest workloads.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-gray-300">
                  {["Unlimited regions", "Unlimited sessions", "Dedicated infrastructure", "24/7 support", "Custom contracts"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-icons text-primary text-base">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className="mt-auto w-full py-3.5 rounded-xl border border-white/20 hover:border-primary/50 hover:bg-primary/10 text-white font-semibold tracking-wide text-center transition-all duration-300"
                >
                  Contact sales
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-10 font-mono">
            All plans include 99.99% uptime SLA · No credit card required for Starter
          </p>
        </div>
      </section>

      {/* Ready to Scale — CTA strip */}
      <section className="py-16 relative overflow-hidden bg-surface-darker border-t border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-4">Ready to scale?</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8 text-sm">
            Join the network that powers the next generation of real-time applications.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-primary hover:bg-orange-600 text-white font-bold tracking-widest rounded-lg text-sm transition-all hover:shadow-[0_0_25px_rgba(255,77,0,0.4)] border border-primary"
                >
                  GO TO DASHBOARD
                </Link>
                <Link
                  href="/deploy"
                  className="px-6 py-3 bg-transparent border border-white/20 hover:border-white hover:bg-white/5 text-white font-medium tracking-widest rounded-lg text-sm transition-all"
                >
                  DEPLOY NODE
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-primary hover:bg-orange-600 text-white font-bold tracking-widest rounded-lg text-sm transition-all hover:shadow-[0_0_25px_rgba(255,77,0,0.4)] border border-primary"
                >
                  START FREE TRIAL
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-transparent border border-white/20 hover:border-white hover:bg-white/5 text-white font-medium tracking-widest rounded-lg text-sm transition-all"
                >
                  SIGN IN
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="network" className="bg-surface-darker border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-icons text-primary shadow-primary drop-shadow-[0_0_5px_rgba(255,77,0,0.8)]">bolt</span>
                <span className="font-display font-bold text-xl text-white tracking-widest">LIVKIT</span>
              </div>
              <p className="text-gray-500 text-sm mb-6 max-w-xs font-mono">
                // FUTURE INFRASTRUCTURE<br />
                EST. 2042<br />
                SECTOR 7G
              </p>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-4">
                The infrastructure layer for real-time streaming, edge computing, and high-availability data services.
              </p>
              <div className="flex gap-4">
                <a className="text-gray-500 hover:text-primary transition-colors hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]" href="#"><span className="material-icons">facebook</span></a>
                <a className="text-gray-500 hover:text-primary transition-colors hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]" href="#"><span className="material-icons">alternate_email</span></a>
                <a className="text-gray-500 hover:text-primary transition-colors hover:drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]" href="#"><span className="material-icons">code</span></a>
              </div>
            </div>
            <div className="col-span-1">
              <h4 className="font-mono text-white mb-6 text-sm tracking-wider">PLATFORM</h4>
              <ul className="space-y-4 text-sm font-mono text-gray-500">
                <li><Link href="/modules" className="hover:text-primary transition-colors">Core Nodes</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Edge Services</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">API Docs</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Status</Link></li>
                <li><Link href="#network" className="hover:text-primary transition-colors">Network</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div className="col-span-1">
              <h4 className="font-mono text-white mb-6 text-sm tracking-wider">RESOURCES</h4>
              <ul className="space-y-4 text-sm font-mono text-gray-500">
                <li><Link href="#" className="hover:text-primary transition-colors">Case Studies</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/sessions" className="hover:text-primary transition-colors">Support</Link></li>
                <li><Link href="/vault" className="hover:text-primary transition-colors">Security</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><a href="https://github.com" className="hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
            <div className="col-span-1">
              <h4 className="font-mono text-white mb-6 text-sm tracking-wider">SOCIAL</h4>
              <ul className="space-y-2 text-sm font-mono text-gray-500">
                <li><a href="#" className="hover:text-primary transition-colors">X / Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
                <li><a href="https://github.com" className="hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h4 className="font-mono text-white mb-6 text-sm tracking-wider">SUBSCRIBE</h4>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="bg-black/20 border border-white/10 text-white px-4 py-2 rounded w-full focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(255,77,0,0.2)] font-mono text-sm placeholder-gray-600"
                  placeholder="email@address.com"
                  type="email"
                  aria-label="Email for updates"
                />
                <button type="submit" className="bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-white p-2 rounded transition-colors hover:shadow-[0_0_10px_rgba(255,77,0,0.3)] shrink-0">
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-mono gap-4">
            <div>© 2024 LIVKIT INFRASTRUCTURE. ALL SYSTEMS NOMINAL.</div>
            <div className="flex gap-6 flex-wrap justify-center">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
