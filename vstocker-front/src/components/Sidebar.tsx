import React from "react";
import { 
  Activity, 
  Briefcase, 
  Sparkles, 
  LogOut, 
  Layers, 
  TrendingUp,
  User
} from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "holdings" | "analysis";
  setActiveTab: (tab: "dashboard" | "holdings" | "analysis") => void;
  userEmail: string;
  onLogout: () => void;
  market: "US" | "TW";
}

export default function Sidebar({ activeTab, setActiveTab, userEmail, onLogout, market }: SidebarProps) {
  const menuItems = [
    { id: "dashboard" as const, label: "儀表板總覽", desc: "統整分析與樹圖板塊", icon: Layers },
    { id: "holdings" as const, label: "自訂持倉明細", desc: "盈虧記錄與編輯抽屜", icon: Briefcase },
    { id: "analysis" as const, label: "個股 AI 觀測區", desc: "實時簡評與財報揭露", icon: Sparkles },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-auto md:h-screen sticky top-0 z-30 font-sans">
      <div className="p-5 space-y-6">
        
        {/* Logo and Brand Title Accent */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-850">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-slate-950 text-xl shadow-[0_4px_16px_rgba(16,185,129,0.2)]">
            A
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1 font-sans">
              AlphaTrack <span className="text-emerald-400 italic font-light text-xs">Insight</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase">
              {market === "US" ? "美股智慧終端" : "台股智慧終端"}
            </p>
          </div>
        </div>

        {/* Function Selection Menu items */}
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono px-2 mb-1">
            主要探測工作區
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden group ${
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium" 
                      : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-950/40"
                  }`}
                >
                  <IconComponent size={16} className={isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold block">{item.label}</span>
                    <span className="text-[9px] text-slate-500 truncate block mt-0.5 group-hover:text-slate-400">
                      {item.desc}
                    </span>
                  </div>
                  {isActive && (
                    <span className="w-1 h-6 bg-emerald-500 rounded-full absolute right-0 top-1/2 -translate-y-1/2"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Session Profile Box */}
      <div className="p-4 border-t border-slate-850 bg-slate-950/60 font-sans space-y-3 shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <User size={14} className="text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-500 font-mono font-bold leading-none uppercase">已連線用戶</div>
            <div className="text-[11px] font-bold text-slate-300 truncate mt-1 tracking-tight" title={userEmail}>
              {userEmail}
            </div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition-all font-mono font-semibold text-[10px] rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
        >
          <LogOut size={11} />
          安全登出終端
        </button>
      </div>
    </aside>
  );
}
