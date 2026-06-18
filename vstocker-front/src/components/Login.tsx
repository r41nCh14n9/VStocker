import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Briefcase, TrendingUp } from "lucide-react";

interface LoginProps {
  onLogin: (email: string) => void;
  defaultEmail: string;
}

export default function Login({ onLogin, defaultEmail }: LoginProps) {
  const [email, setEmail] = useState(defaultEmail || "ann1234555@gmail.com");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("請輸入帳號電子郵件");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    // Simulate clean, reactive login transition
    setTimeout(() => {
      setLoading(false);
      onLogin(email);
    }, 1200);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Dynamic ambient graphic lights in backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none select-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none select-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900 border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Decorative corner tag */}
        <div className="absolute top-0 right-0 transform translate-x-1.5 -translate-y-1.5 overflow-hidden">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest leading-none">
            Dual Market Terminal
          </span>
        </div>

        {/* Brand Header Section */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-center mx-auto w-14 h-14 bg-emerald-500 rounded-2xl shadow-[0_4px_24px_rgba(16,185,129,0.25)]">
            <Briefcase size={26} className="text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              AlphaTrack <span className="text-emerald-400 font-light italic">Insight</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
              雙向美台股智慧投資大腦與實時盈虧追蹤
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-900/30 text-[11px] text-rose-400 rounded-xl font-medium font-sans">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              使用者電子郵箱 (User Email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. investor@alphatrack.com"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              安全密鑰 (Security Token)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs transition-colors"
            />
          </div>

          {/* Quick Demo Assist Label */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex items-start gap-2.5 text-slate-500 text-[10.5px] leading-relaxed">
            <Sparkles size={11} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              已依您的系統憑證自動預填。請直接點選下方進入，即可體驗具有「股票矩形樹圖」配置的雙重市場交易系統。
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-850 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <span className="aspect-square w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>終端連線校對中...</span>
              </>
            ) : (
              <>
                <TrendingUp size={14} />
                <span>登入平台 探索大腦</span>
              </>
            )}
          </button>
        </form>

        {/* Info label */}
        <div className="text-center text-[10px] text-slate-600 font-sans mt-6 select-none">
          系統提供雙市場熱門個股，支援即時持倉編輯、多維分析與事件預期抽屜。
        </div>
      </motion.div>
    </div>
  );
}
