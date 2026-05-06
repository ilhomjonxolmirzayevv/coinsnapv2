import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, 
  Coins, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Zap, 
  ExternalLink,
  Github,
  MessageCircle,
  Currency,
  AlertCircle
} from "lucide-react";

interface Status {
  status: string;
  rates: {
    uzs: number;
    rub: number;
    lastUpdated: string;
  };
  bot: string;
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/status");
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError("Could not connect to bot backend. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-7xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl flex flex-col z-10 overflow-hidden">
          
          <nav className="w-full h-20 px-6 md:px-10 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Zap className="text-white fill-current" size={24} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">CoinSnap <span className="text-emerald-400">Bot</span></span>
            </div>
            <div className="hidden md:flex gap-8">
              <span className="text-white font-medium cursor-pointer">Dashboard</span>
              <span className="text-white/50 font-medium cursor-pointer hover:text-white transition-colors">Markets</span>
              <span className="text-white/50 font-medium cursor-pointer hover:text-white transition-colors">Bot Logs</span>
              <span className="text-white/50 font-medium cursor-pointer hover:text-white transition-colors">Settings</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Bot Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${status?.status === "online" ? 'bg-emerald-400 font-bold' : 'bg-red-500'}`} />
                  <span className={`text-sm font-bold ${status?.status === "online" ? 'text-emerald-400' : 'text-red-500'}`}>
                    {status?.status === "online" ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </div>
          </nav>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar-like section for stats on wide screens */}
            <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-6">
              <h2 className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Fiat Bridge</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">🇺🇿</div>
                    <div>
                      <div className="text-white font-bold">UZS</div>
                      <div className="text-white/40 text-[10px] uppercase">Som</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono font-bold">{status?.rates.uzs.toLocaleString() || "12,800"}</div>
                    <div className="text-emerald-400 text-[10px] font-medium">Synced</div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">🇷🇺</div>
                    <div>
                      <div className="text-white font-bold">RUB</div>
                      <div className="text-white/40 text-[10px] uppercase">Ruble</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono font-bold">{status?.rates.rub.toLocaleString() || "95.0"}</div>
                    <div className="text-emerald-400 text-[10px] font-medium">Synced</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-200 text-xs leading-relaxed">
                  <strong className="text-white">Active Feed:</strong> Last rate sync at <span className="font-mono text-white">{status?.rates.lastUpdated || "--:--"}</span>. All systems operational.
                </p>
              </div>

              <a 
                href="https://t.me/CoinSnap_Bot"
                target="_blank"
                rel="noreferrer"
                className="lg:hidden mt-4 w-full h-12 bg-white text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                Open Telegram Bot <ExternalLink size={16} />
              </a>
            </aside>

            {/* Main Content Middle */}
            <main className="flex-1 p-6 md:p-10 flex flex-col gap-8 overflow-y-auto">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Conversion Engine</h1>
                  <p className="text-white/50 text-lg">Interactive bot simulation and real-time calculator.</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-full border border-white/10 text-white/80 text-sm font-medium flex items-center gap-2">
                  <Bot size={14} className="text-emerald-400" /> Session: 8639007484
                </div>
              </header>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Simulation Card */}
                <div className="p-8 rounded-[24px] bg-white/5 border border-white/10 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-white font-semibold flex items-center gap-2"><Zap size={16} className="text-emerald-400" /> Quick Logic</h3>
                     <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Live Status</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2 block">Bot Input</label>
                      <div className="h-14 w-full bg-slate-900/50 rounded-xl border border-white/5 px-4 flex items-center justify-between">
                        <span className="text-white font-mono text-xl">100 TON UZS</span>
                        <CheckCircle2 className="text-emerald-400" size={18} />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                        <RefreshCw className="w-4 h-4 text-white/40 animate-spin-slow" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2 block">Parsed Result</label>
                      <div className="h-14 w-full bg-emerald-500/10 rounded-xl border border-emerald-500/20 px-4 flex items-center">
                        <span className="text-white font-mono text-2xl font-bold">~ 6,912,000 UZS</span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href="https://t.me/CoinSnap_Bot"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-12 bg-white text-slate-950 font-bold rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
                  >
                    Execute in Telegram <MessageCircle size={16} />
                  </a>
                </div>

                {/* Features / Info Card */}
                <div className="p-8 rounded-[24px] bg-white/5 border border-white/10 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-white font-semibold flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" /> Market Coverage</h3>
                     <span className="text-[10px] text-orange-400 font-bold uppercase tracking-tighter">Supported Tokens</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                     <div className="grid grid-cols-2 gap-3">
                        {["BTC", "ETH", "TON", "SOL", "NOT", "UZS", "RUB", "USD"].map(sym => (
                          <div key={sym} className="px-3 py-2 bg-white/5 rounded-lg border border-white/5 text-center text-xs font-bold text-white/60">
                            {sym}
                          </div>
                        ))}
                     </div>
                     <div className="mt-8 space-y-3">
                       <div className="flex justify-between text-sm">
                         <span className="text-white/60">Parser Type</span>
                         <span className="text-white font-mono">Smart Regex</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-white/60">Math Engine</span>
                         <span className="text-white font-mono text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> MathJS</span>
                       </div>
                       <div className="h-[1px] bg-white/10 w-full my-2"></div>
                       <div className="flex justify-between text-base font-bold">
                         <span className="text-white">API Reliability</span>
                         <span className="text-emerald-400 font-mono">99.9%</span>
                       </div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Core Capabilities</h3>
                <div className="bg-white/5 border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden font-mono text-xs">
                  <div className="px-6 py-3 flex justify-between group cursor-default">
                    <span className="text-white/80 group-hover:text-emerald-400 transition-colors">Currency Conversion (Fiat & Crypto)</span>
                    <span className="text-white/40">Enabled</span>
                  </div>
                  <div className="px-6 py-3 flex justify-between group cursor-default">
                    <span className="text-white/80 group-hover:text-emerald-400 transition-colors">Fee Calculation (COM parameter)</span>
                    <span className="text-white/40">Enabled</span>
                  </div>
                  <div className="px-6 py-3 flex justify-between bg-emerald-500/5">
                    <span className="text-emerald-400 font-bold italic">Math Expression Evaluation (× ÷ + -)</span>
                    <span className="text-emerald-400/40">Active</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <footer className="mt-8 text-center text-white/20 text-[10px] uppercase tracking-widest font-bold">
          &copy; 2026 CoinSnap Engine &bull; Enterprise Grade Bot Infrastructure
        </footer>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-100 shadow-2xl"
          >
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
