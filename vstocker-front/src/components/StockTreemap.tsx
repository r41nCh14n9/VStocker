import React from "react";
import { HoldingRecord } from "../types";
import { motion } from "motion/react";

interface StockTreemapProps {
  holdings: HoldingRecord[];
  getSectorColor: (sector: string) => string;
  currencySymbol: string;
}

export default function StockTreemap({ holdings, getSectorColor, currencySymbol }: StockTreemapProps) {
  if (holdings.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-xs">
        目前無任何持倉，無法繪製資產配置矩形樹圖。
      </div>
    );
  }

  // Group holdings by sector
  const sectorMap: Record<string, { sector: string; value: number; stocks: { symbol: string; value: number }[] }> = {};
  let totalPortfolioValue = 0;

  holdings.forEach((h) => {
    const val = h.shares * h.currentPrice;
    totalPortfolioValue += val;
    if (sectorMap[h.sector]) {
      sectorMap[h.sector].value += val;
      sectorMap[h.sector].stocks.push({ symbol: h.symbol, value: val });
    } else {
      sectorMap[h.sector] = {
        sector: h.sector,
        value: val,
        stocks: [{ symbol: h.symbol, value: val }],
      };
    }
  });

  // Sort sectors by descending value
  const sectors = Object.values(sectorMap)
    .sort((a, b) => b.value - a.value)
    .map((sec) => {
      // Sort individual stocks in the sector descending
      sec.stocks.sort((x, y) => y.value - x.value);
      return {
        ...sec,
        percentage: totalPortfolioValue > 0 ? (sec.value / totalPortfolioValue) * 100 : 0,
      };
    });

  // Layout algorithm: split into tree map grid blocks
  // Since screen size varies, we use a flex-proportionate mapping that mimics squarified layout
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">
          持倉板塊矩形樹圖 (Treemap allocation)
        </span>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          區塊面積依市值佔比計算
        </span>
      </div>

      <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-wrap gap-1 p-1">
        {sectors.map((sec, i) => {
          const color = getSectorColor(sec.sector);
          // Set proportional flex characteristics
          const flexGrow = Math.round(sec.percentage * 10);
          const percentText = sec.percentage.toFixed(1);

          return (
            <motion.div
              key={sec.sector}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileHover={{ scale: 0.995, filter: "brightness(1.1)" }}
              style={{
                flexGrow: flexGrow,
                flexBasis: `${Math.max(18, sec.percentage * 0.95)}%`,
              }}
              className="relative p-3 rounded-xl border border-slate-900 overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-200 shadow-md min-w-[120px]"
            >
              {/* Colored left strip bar */}
              <div 
                className="absolute top-0 left-0 w-1.5 h-full opacity-80" 
                style={{ backgroundColor: color }}
              ></div>

              {/* Underlying tinted background filter */}
              <div 
                className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity pointer-events-none" 
                style={{ backgroundColor: color }}
              ></div>

              {/* Top part info */}
              <div className="z-10 relative">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-sans font-bold text-[11px] leading-tight text-white group-hover:text-emerald-300 transition-colors truncate">
                    {sec.sector}
                  </span>
                  <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.2 select-none shrink-0 rounded">
                    {percentText}%
                  </span>
                </div>

                {/* Miniature tags for individual stocks inside this sector */}
                <div className="flex flex-wrap gap-1 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {sec.stocks.slice(0, 3).map((stk) => (
                    <span 
                      key={stk.symbol} 
                      className="text-[8px] font-mono font-bold bg-slate-950/80 text-slate-300 px-1 py-0.2 rounded border border-slate-850"
                    >
                      {stk.symbol}
                    </span>
                  ))}
                  {sec.stocks.length > 3 && (
                    <span className="text-[7.5px] font-mono text-slate-500 font-bold self-center">
                      +{sec.stocks.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom values part */}
              <div className="z-10 relative mt-4">
                <div className="text-[10px] text-slate-500 font-mono">板塊估估市值</div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  {currencySymbol}{sec.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Highlight background flash on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </motion.div>
          );
        })}
      </div>

      {/* Subtle Legend footer bar with precise lists */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
        {sectors.map((sec) => (
          <div 
            key={sec.sector} 
            className="flex items-center gap-1.5 bg-slate-900/30 border border-slate-850 px-2.5 py-1.5 rounded-xl text-[10px]"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSectorColor(sec.sector) }}></span>
            <span className="font-sans text-slate-400 truncate flex-1">{sec.sector}</span>
            <span className="font-mono text-slate-200 font-semibold shrink-0">
              {sec.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
