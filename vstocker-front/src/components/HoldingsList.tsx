import React, { useState, useEffect } from "react";
import { HoldingRecord, StockInsight, NewsStory } from "../types";
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Check, 
  ArrowRight,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StockDetailModule from "./StockDetailModule";

interface HoldingsListProps {
  holdings: HoldingRecord[];
  setHoldings: React.Dispatch<React.SetStateAction<HoldingRecord[]>>;
  market: "US" | "TW";
  currencySymbol: string;
  currencyUnit: string;
  getSectorColor: (sector: string) => string;
  availableSectors: string[];
  onNewsClick: (news: NewsStory) => void;
}

export default function HoldingsList({
  holdings,
  setHoldings,
  market,
  currencySymbol,
  currencyUnit,
  getSectorColor,
  availableSectors,
  onNewsClick
}: HoldingsListProps) {
  // Filters
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("");

  // Drawer states
  const [drawerHolding, setDrawerHolding] = useState<HoldingRecord | null>(null);
  const [drawerInsight, setDrawerInsight] = useState<StockInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Edit fields states
  const [editShares, setEditShares] = useState<number | "">("");
  const [editPurchasePrice, setEditPurchasePrice] = useState<number | "">("");
  const [editCurrentPrice, setEditCurrentPrice] = useState<number | "">("");
  const [editSector, setEditSector] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // Add Inline Form trigger
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [addName, setAddName] = useState("");
  const [addShares, setAddShares] = useState<number | "">("");
  const [addPrice, setAddPrice] = useState<number | "">("");
  const [addSector, setAddSector] = useState(availableSectors[0]);
  const [addError, setAddError] = useState("");

  // Trigger loading details when drawer holding changes
  useEffect(() => {
    if (drawerHolding) {
      setEditShares(drawerHolding.shares);
      setEditPurchasePrice(drawerHolding.purchasePrice);
      setEditCurrentPrice(drawerHolding.currentPrice);
      setEditSector(drawerHolding.sector);
      setEditSuccess(false);

      // Fetch dynamic insights
      fetchDrawerStockInsights(drawerHolding.symbol);
    } else {
      setDrawerInsight(null);
    }
  }, [drawerHolding]);

  const fetchDrawerStockInsights = async (symbolStr: string) => {
    setLoadingInsight(true);
    setInsightError(null);
    try {
      const response = await fetch("/api/stock-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbolStr }),
      });
      if (!response.ok) throw new Error("無法取得個股財務與新聞數據");
      const data: StockInsight = await response.json();
      setDrawerInsight(data);
    } catch (err: any) {
      console.error(err);
      setInsightError(err?.message || "伺服器通訊錯誤");
    } finally {
      setLoadingInsight(false);
    }
  };

  // Save changes handler
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerHolding) return;

    if (!editShares || Number(editShares) <= 0) return;
    if (!editPurchasePrice || Number(editPurchasePrice) <= 0) return;
    if (!editCurrentPrice || Number(editCurrentPrice) <= 0) return;

    setHoldings(prev => prev.map(h => {
      if (h.id === drawerHolding.id) {
        return {
          ...h,
          shares: Number(editShares),
          purchasePrice: Number(editPurchasePrice),
          currentPrice: Number(editCurrentPrice),
          sector: editSector
        };
      }
      return h;
    }));

    // Alert edit success state
    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
    }, 2000);
  };

  // Delete holding inside drawer helper
  const handleDeleteFromDrawer = () => {
    if (!drawerHolding) return;
    setHoldings(prev => prev.filter(h => h.id !== drawerHolding.id));
    setDrawerHolding(null);
  };

  // Inline submit form handler
  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");

    if (!addSymbol.trim()) {
      setAddError(market === "US" ? "請輸入美股代號 (e.g. NVDA)" : "請輸入4位台股代號 (e.g. 2330)");
      return;
    }
    if (!addName.trim()) {
      setAddError("請輸入公司名稱");
      return;
    }
    if (!addShares || Number(addShares) <= 0) {
      setAddError("請輸入持股數量");
      return;
    }
    if (!addPrice || Number(addPrice) <= 0) {
      setAddError("請輸入買入單價");
      return;
    }

    const cleanSym = addSymbol.toUpperCase().trim();

    const newRecord: HoldingRecord = {
      id: `h-${Date.now()}`,
      symbol: cleanSym,
      name: addName.trim(),
      shares: Number(addShares),
      purchasePrice: Number(addPrice),
      currentPrice: Number(addPrice), // Default current price to purchase price
      sector: addSector
    };

    setHoldings(prev => [...prev, newRecord]);

    // Reset
    setAddSymbol("");
    setAddName("");
    setAddShares("");
    setAddPrice("");
    setIsAddingOpen(false);

    // Optional: Fetch latest price instantly to overlay currentPrice
    fetch(`/api/stock-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: cleanSym }),
    }).then(res => {
      if (res.ok) {
        res.json().then((data: StockInsight) => {
          setHoldings(prev => prev.map(h => {
            if (h.symbol === cleanSym) {
              return { ...h, currentPrice: data.price };
            }
            return h;
          }));
        });
      }
    }).catch(console.error);
  };

  // Filtered lists
  const filteredHoldings = holdings.filter(h => {
    const matchesSearch = h.symbol.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          h.name.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesSector = !selectedSector || h.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Search Filters & Title line Block */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 shrink-0 text-emerald-400">
            <Briefcase size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">持倉清單 ({holdings.length})</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">點擊各股，將在右側開啟抽屜，進行編輯與觀測 AI 分析</p>
          </div>
        </div>

        {/* Input Fields to filter and Quick Add CTA */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜尋代號或名稱..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 text-slate-200 placeholder-slate-600 rounded-xl outline-none font-mono text-[11px] transition-all"
            />
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-400 text-[11px] rounded-xl focus:outline-none focus:border-emerald-500"
          >
            <option value="">全部板塊</option>
            {availableSectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => setIsAddingOpen(!isAddingOpen)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-sans shadow-md shrink-0"
          >
            <PlusCircle size={14} />
            <span>新增持倉</span>
          </button>
        </div>
      </div>

      {/* Inline Adding form container */}
      <AnimatePresence>
        {isAddingOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddHolding}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden space-y-4 shadow-xl"
          >
            <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase font-mono pb-2 border-b border-slate-850">
              CREATE POSITION • 手動新增一筆交易
            </div>

            {addError && (
              <div className="p-2 bg-rose-500/10 border border-rose-900/35 text-[10.5px] text-rose-400 rounded-xl">
                ⚠️ {addError}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">股票代碼 *</label>
                <input
                  type="text"
                  placeholder={market === "US" ? "e.g. AAPL" : "e.g. 2330"}
                  value={addSymbol}
                  onChange={(e) => setAddSymbol(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl font-mono text-[11px] uppercase outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">公司名稱 *</label>
                <input
                  type="text"
                  placeholder="e.g. 台積電"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl text-[11px] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">買入股數 *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={addShares}
                  onChange={(e) => setAddShares(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl text-[11px] font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">買入單價 ({currencyUnit}) *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl text-[11px] font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">所屬行業板塊 *</label>
                <select
                  value={addSector}
                  onChange={(e) => setAddSector(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-[11px] outline-none focus:border-emerald-500"
                >
                  {availableSectors.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingOpen(false)}
                className="px-3.5 py-1.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow"
              >
                加入資產庫
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Primary Holdings Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredHoldings.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-xs">
            目前持倉中沒有符合搜尋篩選的商品。請點選上方「新增持倉」或重設篩選條件。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-500 text-[9.5px] uppercase tracking-wider font-mono text-left border-b border-slate-850">
                  <th className="py-4 px-5">股票代碼/名稱</th>
                  <th className="py-4 px-4 text-right">持股數</th>
                  <th className="py-4 px-4 text-right">買入均價</th>
                  <th className="py-4 px-4 text-right">現行現價</th>
                  <th className="py-4 px-4 text-right">持倉市值</th>
                  <th className="py-4 px-4 text-right">帳面盈虧</th>
                  <th className="py-4 px-4 text-right">累積 ROI</th>
                  <th className="py-4 px-4">行業板塊</th>
                  <th className="py-4 px-5 text-center">快捷維護</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredHoldings.map((h, idx) => {
                  const hCost = h.shares * h.purchasePrice;
                  const hValue = h.shares * h.currentPrice;
                  const hProfit = hValue - hCost;
                  const hRoi = hCost > 0 ? (hProfit / hCost) * 100 : 0;
                  const isUp = hProfit >= 0;

                  return (
                    <tr 
                      key={h.id}
                      className="hover:bg-slate-950/40 transition-colors group cursor-pointer"
                      onClick={() => setDrawerHolding(h)}
                    >
                      {/* Name & symbol */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-white text-[12px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                            {h.symbol}
                          </span>
                          <span className="text-slate-300 font-sans text-xs truncate max-w-[120px]" title={h.name}>
                            {h.name}
                          </span>
                        </div>
                      </td>

                      {/* Shares */}
                      <td className="py-4 px-4 text-right font-mono text-slate-300">
                        {h.shares.toLocaleString()}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-4 px-4 text-right font-mono text-slate-400">
                        {currencySymbol}{h.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>

                      {/* Current Price */}
                      <td className="py-4 px-4 text-right font-mono text-slate-300">
                        {currencySymbol}{h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>

                      {/* Valuation */}
                      <td className="py-4 px-4 text-right font-mono text-white font-semibold">
                        {currencySymbol}{hValue.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>

                      {/* Profit and loss */}
                      <td className={`py-4 px-4 text-right font-mono font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {isUp ? "+" : ""}{hProfit.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>

                      {/* ROI */}
                      <td className={`py-4 px-4 text-right font-mono font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {isUp ? "+" : ""}{hRoi.toFixed(2)}%
                      </td>

                      {/* Sector */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getSectorColor(h.sector) }}></span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{h.sector}</span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawerHolding(h);
                            }}
                            className="p-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-emerald-600/50 hover:text-emerald-400 rounded-lg text-[9.5px] cursor-pointer text-slate-400 transition-all"
                          >
                            選取觀測
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT SIDE DRAWER FOR STOCK PORTFOLIO MAINTENANCE & AI OBSERVATION */}
      <AnimatePresence>
        {drawerHolding && (
          <>
            {/* Backdrop filter overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerHolding(null)}
              className="fixed inset-0 bg-slate-950 z-40 cursor-pointer"
            ></motion.div>

            {/* Dynamic drawer block */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col h-full"
            >
              
              {/* Drawer header - compact */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded font-mono uppercase">
                      交易檔案庫 • POSITION PORTAL
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">
                    持倉詳情與編輯: {drawerHolding.symbol} ({drawerHolding.name})
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerHolding(null)}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Content Area (Scrollable scrollbar track) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 1. EDIT FORM PANEL */}
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono border-b border-slate-900 pb-2">
                    隨時編輯持倉資訊 (Position Parameters)
                  </div>

                  <form onSubmit={handleSaveChanges} className="space-y-4">
                    {editSuccess && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-900/30 text-emerald-400 rounded-xl flex items-center gap-1.5 text-[10.5px]">
                        <Check size={12} />
                        <span>已成功儲存持倉參數變更</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1.5">持股數量 (Shares) *</label>
                        <input
                          type="number"
                          step="any"
                          value={editShares}
                          onChange={(e) => setEditShares(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1.5">買入均價 ({currencyUnit}) *</label>
                        <input
                          type="number"
                          step="any"
                          value={editPurchasePrice}
                          onChange={(e) => setEditPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1.5">即時精確現值單價 ({currencyUnit}) *</label>
                        <input
                          type="number"
                          step="any"
                          value={editCurrentPrice}
                          onChange={(e) => setEditCurrentPrice(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1.5">所屬行業板塊 *</label>
                        <select
                          value={editSector}
                          onChange={(e) => setEditSector(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-350 rounded-xl text-[11px] focus:outline-none focus:border-emerald-500"
                        >
                          {availableSectors.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={handleDeleteFromDrawer}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-900/30 text-rose-400 rounded-xl cursor-pointer flex items-center gap-1 font-mono transition-all text-[10px]"
                      >
                        <Trash2 size={12} />
                        <span>廢棄此筆持倉</span>
                      </button>

                      <button
                        type="submit"
                        className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5 transition-all text-[10px]"
                      >
                        <Check size={12} />
                        <span>儲存持倉變更</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. DYNAMIC READ-ONLY DETAILED SECTION */}
                <div className="space-y-4">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono border-b border-slate-900 pb-2">
                    個股 AI 深度財務與大腦觀測 (Analysis Suite)
                  </div>

                  <StockDetailModule
                    insight={drawerInsight}
                    loading={loadingInsight}
                    error={insightError}
                    currencySymbol={currencySymbol}
                    currencyUnit={currencyUnit}
                    onNewsClick={onNewsClick}
                  />
                </div>

              </div>

              {/* Drawer footer */}
              <div className="p-4.5 border-t border-slate-800 bg-slate-950 flex justify-end">
                <button
                  onClick={() => setDrawerHolding(null)}
                  className="px-5 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer hover:bg-slate-900/40 font-bold"
                >
                  我知道了，關閉詳情
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
