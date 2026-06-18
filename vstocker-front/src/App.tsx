import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCcw, 
  Info, 
  X, 
  Globe,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Shared types and static initial configurations
import { StockInsight, HoldingRecord, NewsStory, FinancialMetric } from "./types";
import { 
  INITIAL_HOLDINGS, 
  INITIAL_TW_HOLDINGS,
  AVAILABLE_SECTORS, 
  TW_AVAILABLE_SECTORS,
  cleanSectorName 
} from "./data";

// Extracted Modular Components
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import HoldingsList from "./components/HoldingsList";
import StockAnalysis from "./components/StockAnalysis";

// Color maps for Pie/Treemap rendering
const SECTOR_COLORS: Record<string, string> = {
  // US
  "Technology": "#10b981", // Emerald
  "Consumer Cyclical": "#f59e0b", // Amber
  "Communication Services": "#8b5cf6", // Purple
  "Financials": "#3b82f6", // Blue
  "Healthcare": "#ec4899", // Rose
  "Energy": "#f97316", // Orange
  "Consumer Defensive": "#84cc16", // Lime
  "Industrials": "#64748b", // Slate
  "Real Estate": "#14b8a6", // Teal
  "Utilities": "#06b6d4", // Cyan
  // TW
  "半導體 (Semiconductor)": "#10b981",
  "IC設計 (IC Design)": "#f59e0b",
  "電子大廠 (Electronic Mfg)": "#8b5cf6",
  "金融保險 (Financials & Insurance)": "#3b82f6",
  "航運航太 (Shipping & Aviation)": "#06b6d4",
  "鋼鐵水泥 (Materials & Metals)": "#64748b",
  "生技醫療 (Biotech & Healthcare)": "#ec4899"
};

const DEFAULT_SECTOR_COLOR = "#a8a29e"; // Stone

export default function App() {
  // --- LOGIN & USER ID ENTITY STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("is_logged_in") === "true";
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("user_email") || "ann1234555@gmail.com";
  });

  // --- FUNCTION ACTIVE TAB ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "holdings" | "analysis">("dashboard");

  // --- MARKET MODE STATE ("US" | "TW") ---
  const [market, setMarket] = useState<"US" | "TW">((() => {
    const saved = localStorage.getItem("active_market");
    return (saved === "US" || saved === "TW") ? saved : "US";
  }));

  // --- DOUBLE MARKETS HOLDINGS STORAGE ---
  const [usHoldings, setUsHoldings] = useState<HoldingRecord[]>(() => {
    const saved = localStorage.getItem("us_portfolio_holdings");
    return saved ? JSON.parse(saved) : INITIAL_HOLDINGS;
  });

  const [twHoldings, setTwHoldings] = useState<HoldingRecord[]>(() => {
    const saved = localStorage.getItem("tw_portfolio_holdings");
    return saved ? JSON.parse(saved) : INITIAL_TW_HOLDINGS;
  });

  // Derived current holdings context
  const holdings = market === "US" ? usHoldings : twHoldings;
  const setHoldings = market === "US" ? setUsHoldings : setTwHoldings;

  // --- STOCK SEARCH INSIGHTS STATES ---
  const [currentInsight, setCurrentInsight] = useState<StockInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- OTHER GLOBAL/MODAL STATES ---
  const [activeNews, setActiveNews] = useState<NewsStory | null>(null);

  // --- DECORATIVE LIVE MARKET INDEXES ---
  const [usIndexes, setUsIndexes] = useState([
    { name: "S&P 500 指數", value: "5,442.20", change: "+24.50", changePct: "+0.45%", positive: true },
    { name: "Nasdaq 科技指數", value: "17,820.65", change: "+145.40", changePct: "+0.82%", positive: true },
    { name: "Dow Jones 工業指數", value: "39,120.40", change: "-46.10", changePct: "-0.12%", positive: false }
  ]);

  const [twIndexes, setTwIndexes] = useState([
    { name: "TAIEX 台灣加權指數", value: "22,543.20", change: "+256.40", changePct: "+1.15%", positive: true },
    { name: "OTC 櫃買指數", value: "268.40", change: "+1.75", changePct: "+0.65%", positive: true },
    { name: "台指期主力合約 (TXF)", value: "22,568.00", change: "+272.00", changePct: "+1.22%", positive: true }
  ]);

  const activeIndexes = market === "US" ? usIndexes : twIndexes;

  // Sync double portfolio storages
  useEffect(() => {
    localStorage.setItem("us_portfolio_holdings", JSON.stringify(usHoldings));
  }, [usHoldings]);

  useEffect(() => {
    localStorage.setItem("tw_portfolio_holdings", JSON.stringify(twHoldings));
  }, [twHoldings]);

  useEffect(() => {
    localStorage.setItem("active_market", market);
  }, [market]);

  // Initial load or dynamic switch auto-lookup
  useEffect(() => {
    if (isLoggedIn) {
      const initialSymbol = market === "US" ? "AAPL" : "2330";
      fetchStockInsights(initialSymbol);
    }
  }, [market, isLoggedIn]);

  // Index ticker data random drift engine
  useEffect(() => {
    const interval = setInterval(() => {
      const driftIndex = (idxList: typeof usIndexes) => {
        return idxList.map(idx => {
          const valueNum = parseFloat(idx.value.replace(/,/g, ""));
          const pct = (Math.random() * 0.08 - 0.035); // small organic fluctuations
          const delta = valueNum * pct / 100;
          const newValue = (valueNum + delta).toFixed(2);
          const signedChange = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
          const signedPct = delta >= 0 ? `+${(pct * 100).toFixed(2)}%` : `${(pct * 100).toFixed(2)}%`;
          return {
            ...idx,
            value: parseFloat(newValue).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            change: signedChange,
            changePct: signedPct,
            positive: delta >= 0
          };
        });
      };

      setUsIndexes(prev => driftIndex(prev));
      setTwIndexes(prev => driftIndex(prev));
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  // --- FETCH STOCK INSIGHTS API CALL ---
  const fetchStockInsights = async (symbolStr: string) => {
    const cleanSym = symbolStr.toUpperCase().trim();
    if (!cleanSym) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stock-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: cleanSym }),
      });

      if (!response.ok) {
        throw new Error("無法取得個股財務與新聞數據");
      }

      const data: StockInsight = await response.json();
      setCurrentInsight(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "網路連線錯誤，請稍候重試。");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN TRANSITION HANDLER ---
  const handleLogin = (email: string) => {
    localStorage.setItem("is_logged_in", "true");
    localStorage.setItem("user_email", email);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  // --- LOGOUT TRANSITION HANDLER ---
  const handleLogout = () => {
    localStorage.removeItem("is_logged_in");
    setIsLoggedIn(false);
  };

  // --- THEME ATTRIBUTE HELPERS ---
  const currencySymbol = market === "US" ? "$" : "NT$";
  const currencyUnit = market === "US" ? "十億USD" : "十億TWD";
  const availableSectors = market === "US" ? AVAILABLE_SECTORS : TW_AVAILABLE_SECTORS;

  const getSectorColor = (sectorKey: string) => {
    return SECTOR_COLORS[sectorKey] || DEFAULT_SECTOR_COLOR;
  };

  // Fallback styling for sentiments
  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "Bullish": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Bearish": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  // --- RENDER UNAUTH SCREEN ---
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} defaultEmail={userEmail} />;
  }

  // --- RENDER WORKSPACE ---
  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col md:flex-row star-container select-none">
      
      {/* 1. LEFT WORKSPACE NAVIGATION SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userEmail={userEmail} 
        onLogout={handleLogout}
        market={market}
      />

      {/* 2. MAIN VIEWPORT WRAPPER */}
      <main id="main-content" className="flex-1 p-5 md:p-8 space-y-6 overflow-y-auto max-h-screen relative">
        
        {/* TOP STATUS HEADER & DOUBLE-MARKET SYSTEM SWITCH */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-900">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe size={18} className="text-emerald-400" />
              <span>智慧理財追蹤核心</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
              {market === "US" ? "美股追蹤大廳 (United States Stocks)" : "台股追蹤大廳 (Taiwan Standard Stocks)"}
            </p>
          </div>

          {/* RIGHT SWITCH TAG - STYLED BENTO SWITCH */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto shadow-inner select-none font-sans text-[11px] font-bold">
            <button
              onClick={() => setMarket("US")}
              className={`px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all ${
                market === "US" 
                  ? "bg-slate-950 text-emerald-400 border border-slate-800 shadow" 
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              <span>🇺🇸 美股市場</span>
            </button>
            <button
              onClick={() => setMarket("TW")}
              className={`px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all ${
                market === "TW" 
                  ? "bg-slate-950 text-emerald-400 border border-slate-800 shadow" 
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              <span>🇹🇼 台股市場</span>
            </button>
          </div>
        </header>

        {/* 3. DYNAMIC WORKSPACE PAGES (TABS SWITCH) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + "-" + market}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeTab === "dashboard" && (
              <Dashboard
                holdings={holdings}
                getSectorColor={getSectorColor}
                market={market}
                currencySymbol={currencySymbol}
                currencyUnit={currencyUnit}
                marketIndexes={activeIndexes}
              />
            )}

            {activeTab === "holdings" && (
              <HoldingsList
                holdings={holdings}
                setHoldings={setHoldings}
                market={market}
                currencySymbol={currencySymbol}
                currencyUnit={currencyUnit}
                getSectorColor={getSectorColor}
                availableSectors={availableSectors}
                onNewsClick={(news) => setActiveNews(news)}
              />
            )}

            {activeTab === "analysis" && (
              <StockAnalysis
                currentInsight={currentInsight}
                loading={loading}
                error={error}
                fetchStockInsights={fetchStockInsights}
                market={market}
                currencySymbol={currencySymbol}
                currencyUnit={currencyUnit}
                onNewsClick={(news) => setActiveNews(news)}
                setHoldings={setHoldings}
                availableSectors={availableSectors}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* PERSISTENT SUBTLE FOOTER BADGE */}
        <footer className="mt-16 text-center text-slate-600 text-xs py-8 border-t border-slate-900 font-sans">
          <p>© 2026 智慧雙軌投資配置終端 AlphaTrack Insight. All rights reserved.</p>
          <p className="text-[9.5px] text-slate-700 mt-1">
            本系統所提供的所有模擬數據、AI簡評和圖表配置僅為量化展示與學習交流使用，並非具體交易要約或投資指導。
          </p>
        </footer>

      </main>

      {/* 4. PERSISTENT MODAL FOR NEWS STORY IN-DEPTH BRIEF DISCLOSURES */}
      <AnimatePresence>
        {activeNews && (
          <>
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveNews(null)}
              className="fixed inset-0 bg-slate-950 z-50 cursor-pointer"
            />

            {/* Centered Modal dialog container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none font-sans text-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-widest bg-slate-950 px-2 py-0.5 border border-slate-850 rounded font-mono text-slate-400 uppercase">
                        財經專欄特析 • NEWS IMPACT
                      </span>
                      <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${getSentimentStyle(activeNews.sentiment)}`}>
                        {activeNews.sentiment === "Bullish" ? "偏多 (Bullish)" : activeNews.sentiment === "Bearish" ? "偏空 (Bearish)" : "中立 (Neutral)"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-white leading-relaxed">
                      {activeNews.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveNews(null)}
                    className="text-slate-500 hover:text-slate-300 transition-all cursor-pointer p-1.5 rounded-xl hover:bg-slate-800 shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* News details */}
                <div className="p-6 space-y-4 overflow-y-auto font-sans text-xs leading-relaxed text-slate-300">
                  <div className="space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">新聞細節與時效指標</div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>發佈來源: {activeNews.source}</span>
                      <span>發布時間: {activeNews.publishedTime}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">核心精準摘要：</div>
                    <p className="leading-relaxed text-slate-200 bg-slate-950/20 p-4 rounded-2xl border border-slate-850">
                      {activeNews.summary}
                    </p>
                  </div>

                  <div className="bg-emerald-950/10 rounded-2xl p-4.5 border border-emerald-900/20 space-y-2">
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="aspect-square w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      <span>分析師投資指引與對策安全區：</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      此政策或消息對個股可能引發短期市場溢價波動。
                      若您已持有該股股份，請密切關聯今日損益統計和比重配比；
                      如為偏多(Bullish)情緒，可研究是否有加倉空間；若為偏空(Bearish)，請自控您的下檔損失容忍區。
                    </p>
                  </div>
                </div>

                {/* Confirm Control Button */}
                <div className="p-4.5 border-t border-slate-800/85 bg-slate-950 flex justify-end">
                  <button
                    onClick={() => setActiveNews(null)}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-all font-sans"
                  >
                    確認並關閉
                  </button>
                </div>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
