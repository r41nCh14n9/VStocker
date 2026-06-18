import React, { useState } from "react";
import { StockInsight, HoldingRecord, NewsStory } from "../types";
import { 
  Search, 
  PlusCircle, 
  Sparkles, 
  TrendingUp, 
  Check, 
  HelpCircle,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StockDetailModule from "./StockDetailModule";

interface StockAnalysisProps {
  currentInsight: StockInsight | null;
  loading: boolean;
  error: string | null;
  fetchStockInsights: (symbolStr: string) => Promise<void>;
  market: "US" | "TW";
  currencySymbol: string;
  currencyUnit: string;
  onNewsClick: (news: NewsStory) => void;
  setHoldings: React.Dispatch<React.SetStateAction<HoldingRecord[]>>;
  availableSectors: string[];
}

export default function StockAnalysis({
  currentInsight,
  loading,
  error,
  fetchStockInsights,
  market,
  currencySymbol,
  currencyUnit,
  onNewsClick,
  setHoldings,
  availableSectors
}: StockAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Adding transaction states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addShares, setAddShares] = useState<number | "">("");
  const [addPrice, setAddPrice] = useState<number | "">("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [addValidationError, setAddValidationError] = useState("");

  // Presets adaptively based on Market
  const usPresets = ["AAPL", "NVDA", "TSLA", "MSFT"];
  const twPresets = ["2330", "2317", "2454", "2882"];
  const presets = market === "US" ? usPresets : twPresets;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchStockInsights(searchQuery.trim());
      setIsAddFormOpen(false);
    }
  };

  const handlePresetClick = (sym: string) => {
    setSearchQuery(sym);
    fetchStockInsights(sym);
    setIsAddFormOpen(false);
  };

  // Add searched stock directly to portfolio
  const handleAddToPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    setAddValidationError("");

    if (!currentInsight) return;
    if (!addShares || Number(addShares) <= 0) {
      setAddValidationError("請輸入大於 0 的欲持股數量");
      return;
    }
    if (!addPrice || Number(addPrice) <= 0) {
      setAddValidationError("請輸入合理的每股買入成本金額");
      return;
    }

    const newRecord: HoldingRecord = {
      id: `h-${Date.now()}`,
      symbol: currentInsight.symbol,
      name: currentInsight.name,
      shares: Number(addShares),
      purchasePrice: Number(addPrice),
      currentPrice: currentInsight.price,
      sector: currentInsight.sector
    };

    setHoldings(prev => {
      // If same symbol and cost price already exist, add the shares.
      const exitingIdx = prev.findIndex(item => item.symbol === newRecord.symbol && item.purchasePrice === newRecord.purchasePrice);
      if (exitingIdx !== -1) {
        const updated = [...prev];
        updated[exitingIdx].shares += newRecord.shares;
        return updated;
      }
      return [...prev, newRecord];
    });

    setAddSuccess(true);
    setAddShares("");
    setAddPrice("");
    setTimeout(() => {
      setAddSuccess(false);
      setIsAddFormOpen(false);
    }, 1800);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Search Header panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
        <div>
          <h3 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5 font-sans">
            <Search size={14} className="text-emerald-400" />
            <span>個股核心數據觀測</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            整合實時市場核心財務與營運指標，產出專業個股季度剖析與量化財報線圖
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2.5 max-w-lg">
          <input
            type="text"
            placeholder={market === "US" ? "輸入美股代號 (e.g. AAPL, META, GOOGL)" : "輸入台灣代號或名稱 (e.g. 2330, 2317, 2454)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl outline-none font-mono text-[11px] uppercase transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-850 text-slate-950 font-bold rounded-xl cursor-pointer transition-all shadow"
          >
            觀測動態
          </button>
        </form>

        {/* Hot Presets chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-850/60">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono mr-1.5 select-none">熱門推薦晶片 (Presets):</span>
          {presets.map(sym => (
            <button
              key={sym}
              type="button"
              onClick={() => handlePresetClick(sym)}
              className={`px-3 py-1 font-mono font-bold rounded-lg border text-[10px] cursor-pointer transition-all ${
                currentInsight?.symbol === sym 
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm" 
                  : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              {sym === "2330" ? "2330 台積電" : sym === "2317" ? "2317 鴻海" : sym === "2454" ? "2454 聯發科" : sym === "2882" ? "2882 國泰金" : sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Insights displayer with Add to Portfolio CTA */}
      {currentInsight && !loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* Main Stock detail components spanning 2 columns on desktop */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <StockDetailModule
              insight={currentInsight}
              loading={loading}
              error={error}
              currencySymbol={currencySymbol}
              currencyUnit={currencyUnit}
              onNewsClick={onNewsClick}
            />
          </div>

          {/* Quick CTA panel spanning 1 column */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-850 text-emerald-400 flex items-center justify-center">
                <PlusCircle size={15} />
              </div>
              <div>
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wide">組合快捷配置</h4>
                <p className="text-[9px] text-slate-500 font-sans mt-0.5">將此偵測個股即時併入持股明細</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>股票縮寫:</span>
                  <span className="font-mono font-bold text-white">{currentInsight.symbol}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>行業大板塊:</span>
                  <span className="text-slate-300 font-semibold">{currentInsight.sector}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>本日推薦現價:</span>
                  <span className="font-mono font-bold text-emerald-400">{currencySymbol}{currentInsight.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                </div>
              </div>

              {!isAddFormOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddFormOpen(true);
                    setAddPrice(currentInsight.price);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 font-sans"
                >
                  <PlusCircle size={14} />
                  <span>+ 增加持倉此檔個股</span>
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleAddToPortfolio}
                  className="space-y-4 border border-emerald-500/10 bg-emerald-950/5 p-4 rounded-xl"
                >
                  <div className="text-[9px] font-bold text-emerald-400 font-mono tracking-wider uppercase border-b border-slate-850 pb-1.5">
                    TRANSACTION DETAILED • 配置交易參數
                  </div>

                  {addValidationError && (
                    <div className="p-2 bg-rose-500/10 border border-rose-900/30 text-[9.5px] text-rose-400 rounded-lg">
                      ⚠️ {addValidationError}
                    </div>
                  )}

                  {addSuccess && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-900/30 text-[9.5px] text-emerald-400 rounded-lg flex items-center gap-1">
                      <Check size={11} />
                      <span>成功併入自訂資產庫！</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[8.5px] text-slate-500 font-bold uppercase mb-1">買入股數 (Shares) *</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={addShares}
                        onChange={(e) => setAddShares(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 text-white font-mono rounded-lg outline-none focus:border-emerald-500 text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[8.5px] text-slate-500 font-bold uppercase mb-1">購入均價 ({currencyUnit}) *</label>
                      <input
                        type="number"
                        step="any"
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 text-white font-mono rounded-lg outline-none focus:border-emerald-500 text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="flex-1 py-1 px-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-center"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-center shadow"
                    >
                      確認購入
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Loading & error fallback bounds inside analysis component */}
      {(!currentInsight || loading || error) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <StockDetailModule
            insight={currentInsight}
            loading={loading}
            error={error}
            currencySymbol={currencySymbol}
            currencyUnit={currencyUnit}
            onNewsClick={onNewsClick}
          />
        </div>
      )}

    </div>
  );
}
