import React, { useState } from "react";
import { StockInsight, FinancialMetric, NewsStory } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  Activity, 
  BarChart2, 
  Info, 
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line 
} from "recharts";

interface StockDetailModuleProps {
  insight: StockInsight | null;
  loading: boolean;
  error: string | null;
  currencySymbol: string;
  currencyUnit: string;
  onNewsClick: (news: NewsStory) => void;
}

export default function StockDetailModule({ 
  insight, 
  loading, 
  error, 
  currencySymbol,
  currencyUnit,
  onNewsClick 
}: StockDetailModuleProps) {
  const [financialTab, setFinancialTab] = useState<"revenueNet" | "epsMargin">("revenueNet");

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="aspect-square w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="space-y-1">
          <p className="text-xs text-slate-350 font-bold tracking-widest font-mono">RETRIEVING INTEL • 正在讀取核心數據</p>
          <p className="text-[10px] text-slate-500">正在調用數據庫中的核心研報與最新指標，請稍等片刻...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-8 text-center text-slate-400 space-y-4">
        <div className="text-rose-400 text-sm font-semibold">⚠️ 讀取股票數據失敗</div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {error}
        </p>
        <p className="text-[10px] text-slate-600 font-mono">請確認代號正確性（台股請輸入4位代碼如 2330 / 美股請輸入縮寫如 NVDA）。</p>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-slate-900/40 border border-slate-850 border-dashed rounded-3xl p-10 text-center text-slate-500 text-xs">
        請在下方或搜尋欄輸入您欲追蹤觀測的股票代碼。
      </div>
    );
  }

  const isUp = insight.change >= 0;

  // Custom tooltips for graphs
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-[11px] font-mono">
          <p className="font-bold text-slate-400 pb-1 border-b border-slate-900 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4 font-semibold">
              <span>{p.name}:</span>
              <span>
                {p.value} {p.name.includes("Margin") ? "%" : currencyUnit}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 font-sans text-xs">
      
      {/* Individual Basic Price Information Hero Box */}
      <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">{insight.symbol}</span>
            <span className="text-[10px] text-slate-400 font-medium">{insight.name}</span>
            <span className="text-[9px] bg-slate-900 text-slate-400 px-2.5 py-0.2 rounded border border-slate-800 font-mono">
              {insight.sector}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-mono font-bold text-white">
              {currencySymbol}{insight.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </span>
            <span className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
              {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isUp ? "+" : ""}{insight.change.toFixed(1)} ({isUp ? "+" : ""}{insight.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Dynamic mini label indicator */}
        <div className="text-right">
          <div className="text-[9px] text-slate-500 font-mono leading-none">評估時效</div>
          <div className="text-[10px] text-slate-350 font-bold mt-1 font-mono">REALTIME • 今日最新</div>
        </div>
      </div>

      {/* AI AI Summary Brief Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/80 p-5 space-y-2.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px] font-mono">
          <Sparkles size={12} className="animate-pulse" />
          <span>今日熱門精選研報簡評 (Insights)</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs antialiased">
          {insight.brief}
        </p>
      </div>

      {/* Financials Charts Area */}
      <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-purple-400" />
            <h4 className="text-[11px] font-bold text-white tracking-widest uppercase font-mono">季度核心財報指標 (Quarterly Financials)</h4>
          </div>

          <div className="bg-slate-950 p-1 border border-slate-850 rounded-xl flex items-center gap-1 font-mono">
            <button
              onClick={() => setFinancialTab("revenueNet")}
              className={`px-3 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-all ${
                financialTab === "revenueNet" 
                  ? "bg-emerald-500 text-slate-950 shadow-md" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              營收/淨利
            </button>
            <button
              onClick={() => setFinancialTab("epsMargin")}
              className={`px-3 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-all ${
                financialTab === "epsMargin" 
                  ? "bg-emerald-500 text-slate-950 " 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EPS/淨利率
            </button>
          </div>
        </div>

        {/* Chart Window wrapper */}
        <div className="h-44 w-full">
          {financialTab === "revenueNet" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insight.financials} margin={{ top: 10, left: -25, right: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} formatter={(val) => <span className="text-[9px] text-slate-400 font-semibold">{val === "revenue" ? `單季營收 (${currencyUnit})` : `單季淨利 (${currencyUnit})`}</span>} />
                <Bar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="netIncome" name="netIncome" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insight.financials} margin={{ top: 10, left: -25, right: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} formatter={(val) => <span className="text-[9px] text-slate-400 font-semibold">{val === "eps" ? "每股盈餘 (EPS)" : "淨利率 (Margin %)"}</span>} />
                <Line type="monotone" dataKey="eps" name="eps" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="margin" name="margin" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Related News Story list */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">
          <Newspaper size={12} />
          <span>今日事件與焦點頭條 (Market Impact Events)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insight.news && insight.news.length > 0 ? (
            insight.news.map((item, idx) => {
              const isBullish = item.sentiment === "Bullish";
              const isBearish = item.sentiment === "Bearish";
              return (
                <div 
                  key={idx}
                  onClick={() => onNewsClick(item)}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 transition-all p-3.5 rounded-2xl cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-relaxed">
                    {item.title}
                  </p>
                  <div className="flex justify-between items-center text-[10px] select-none pt-1 border-t border-slate-900/60">
                    <span className="text-slate-500 font-mono">{item.source}</span>
                    <span className={`text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold font-mono ${
                      isBullish 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : isBearish 
                          ? "bg-rose-500/10 text-rose-400" 
                          : "bg-slate-800 text-slate-400"
                    }`}>
                      {isBullish ? "偏多" : isBearish ? "偏空" : "中立"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-4 text-slate-600 font-mono">
              本日尚無重大新聞事件通報
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
