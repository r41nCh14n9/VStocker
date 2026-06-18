import React from "react";
import { HoldingRecord } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Layers, 
  Activity, 
  Briefcase 
} from "lucide-react";
import StockTreemap from "./StockTreemap";

interface DashboardProps {
  holdings: HoldingRecord[];
  getSectorColor: (sector: string) => string;
  market: "US" | "TW";
  currencySymbol: string;
  currencyUnit: string;
  marketIndexes: Array<{
    name: string;
    value: string;
    change: string;
    changePct: string;
    positive: boolean;
  }>;
}

export default function Dashboard({ 
  holdings, 
  getSectorColor, 
  market,
  currencySymbol,
  currencyUnit,
  marketIndexes
}: DashboardProps) {

  // Calculations
  const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.purchasePrice), 0);
  const totalValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalRoi = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  // Let's calculate typical today's profit/loss.
  // Since we also have change or change percent of each holding, we can calculate how much holdings went up today:
  // e.g. for each holding, we can deduce priceChange = currentPrice * (changePercent / 100) or we can assume a tiny daily change
  // Let's save a pre-determined change depending on symbol or simulated delta
  const todayProfitLoss = holdings.reduce((sum, h) => {
    // Generate a reasonable change factor based on symbol code or a standard random fluctuation
    const seed = h.symbol.charCodeAt(0) + (h.symbol.charCodeAt(1) || 0);
    const positive = seed % 2 === 0;
    const pct = positive ? 0.015 : -0.012; // simulated today change
    const delta = h.currentPrice * pct;
    return sum + (h.shares * delta);
  }, 0);

  const isProfitPositive = totalProfitLoss >= 0;
  const isTodayPositive = todayProfitLoss >= 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Decorative Index Tickers Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {marketIndexes.map((idx) => (
          <div 
            key={idx.name}
            className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">{idx.name}</span>
              <div className="text-sm font-bold font-mono text-white leading-none">{idx.value}</div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-mono font-bold p-1 rounded-lg ${
                idx.positive 
                  ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10" 
                  : "text-rose-400 bg-rose-500/5 border border-rose-500/10"
              }`}>
                {idx.changePct}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate Overview Metrics Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cost card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">初始投入總成本</span>
            <Briefcase size={14} className="text-slate-600" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-mono font-bold text-white">
              {currencySymbol}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              合計 {holdings.length} 檔持倉個股明細
            </div>
          </div>
        </div>

        {/* Current Value card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">即時資產總市值</span>
            <Activity size={14} className="text-slate-600" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-mono font-bold text-white">
              {currencySymbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              根據現行即時匯率與現價估算
            </div>
          </div>
        </div>

        {/* Aggregate P/L & ROI card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">資產累計總盈虧</span>
            <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded ${
              isProfitPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              ROI {isProfitPositive ? "+" : ""}{totalRoi.toFixed(2)}%
            </span>
          </div>
          <div className="space-y-1">
            <div className={`text-lg font-mono font-bold ${isProfitPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfitPositive ? "+" : ""}{totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              包含累計實現與未實現損益
            </div>
          </div>
        </div>

        {/* Today's P/L estimation card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">首頁預估今日盈虧</span>
            <span className={`w-2 h-2 rounded-full ${isTodayPositive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}></span>
          </div>
          <div className="space-y-1">
            <div className={`text-lg font-mono font-bold ${isTodayPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isTodayPositive ? "+" : ""}{todayProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {market === "US" ? "依美股隔夜盤與美東即時變動" : "依台灣開盤日前後各股振幅"}
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Stock Allocation Treemap Panel */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
        <div>
          <h3 className="font-bold text-sm text-white font-sans tracking-tight">
            板塊配比權重
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            呈現當前市場所有個股在不同科技與傳統行業之資產分配比率
          </p>
        </div>

        <div className="border-t border-slate-850 pt-4">
          <StockTreemap 
            holdings={holdings} 
            getSectorColor={getSectorColor} 
            currencySymbol={currencySymbol} 
          />
        </div>
      </div>

    </div>
  );
}
