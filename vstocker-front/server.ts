import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return aiClient;
}

// Highly detailed fallback mock data in Chinese for seamless user experience (US & TW)
const DEFAULT_STOCK_DATA: Record<string, any> = {
  // --- US Stocks Mock Cases ---
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc. (蘋果公司)",
    sector: "Technology",
    price: 185.34,
    change: 2.45,
    changePercent: 1.34,
    brief: "蘋果公司（Apple）正面臨新的 AI 硬體升級浪潮。今日有分析指出，其新版 AI 功能（Apple Intelligence）將顯著拉動 iPhone 換機潮。雖然硬體產品線在亞太市場增速放緩，但服務性收入（如 App Store、iCloud）仍創下歷史新高，利潤率超出預期。",
    news: [
      {
        title: "Apple Intelligence 帶動換機熱潮，分析師全面調高目標價",
        source: "彭博社 (Bloomberg)",
        summary: "投行分析師指出，隨著 AI 功能在美股及全球市場陸續上線，原本持觀望態度的 iPhone 舊用戶將於本季度加速開啟硬體換機週期。",
        sentiment: "Bullish",
        publishedTime: "今日 08:30"
      },
      {
        title: "蘋果與供應鏈達成深度合作，確保新一代晶片產能充足",
        source: "華爾街日報",
        summary: "為應對可能的硬體需求高峰，蘋果已向台積電追加 3 奈米晶片訂單，反映對下半年出貨量的強烈信心。",
        sentiment: "Bullish",
        publishedTime: "今日 11:20"
      },
      {
        title: "歐洲反壟斷機構對 App Store 開發者條款展開新一輪審查",
        source: "路透社 (Reuters)",
        summary: "歐盟執委會發言人表示，他們將深入調查蘋果近期修改的歐洲開發費架構是否仍然存在排他性嫌疑，這可能對服務營收造成短期波動風險。",
        sentiment: "Bearish",
        publishedTime: "今日 14:05"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 119.58, netIncome: 33.92, eps: 2.18, margin: 28.3 },
      { quarter: "2025 Q1", revenue: 119.58, netIncome: 33.92, eps: 2.18, margin: 28.3 },
      { quarter: "2025 Q2", revenue: 90.75, netIncome: 23.64, eps: 1.53, margin: 26.0 },
      { quarter: "2025 Q3", revenue: 85.78, netIncome: 21.45, eps: 1.40, margin: 25.0 },
      { quarter: "2025 Q4", revenue: 94.93, netIncome: 22.96, eps: 1.64, margin: 24.2 }
    ]
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla Inc. (特斯拉)",
    sector: "Consumer Cyclical",
    price: 178.20,
    change: -3.42,
    changePercent: -1.88,
    brief: "特斯拉（Tesla）近期面臨電動車市場競爭加劇及全球交付量增速放緩的雙重挑戰。儘管大眾車型的利潤率稍受壓抑，但其全自動駕駛（FSD）訂閱方案及儲能電池（Megapack）出貨量迎來爆發，成為支撐估值的第二增長點。",
    news: [
      {
        title: "特斯拉宣佈在北美推出新一輪限時零利率金融貸款方案",
        source: "TechCrunch",
        summary: "為刺激季度末的車輛交付量，特斯拉在美國與加拿大同步祭出超低利率購車優惠，預估將顯著提振大眾車款產量。",
        sentiment: "Bullish",
        publishedTime: "今日 07:15"
      },
      {
        title: "歐盟對中國進口電動車加徵關稅，特斯拉上海工廠出口成本承壓",
        source: "路透社",
        summary: "由於關稅細則調整，特斯拉從海外工廠進口車型的成本面臨重新分配，分析師預期下季度的毛利率可能會有些許波動。",
        sentiment: "Bearish",
        publishedTime: "今日 09:45"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 21.30, netIncome: 1.13, eps: 0.45, margin: 5.3 },
      { quarter: "2025 Q2", revenue: 25.50, netIncome: 1.48, eps: 0.52, margin: 5.8 },
      { quarter: "2025 Q3", revenue: 25.18, netIncome: 2.17, eps: 0.72, margin: 8.6 },
      { quarter: "2025 Q4", revenue: 24.32, netIncome: 1.95, eps: 0.65, margin: 8.0 }
    ]
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corp. (輝達)",
    sector: "Technology",
    price: 915.22,
    change: 18.75,
    changePercent: 2.09,
    brief: "輝達（NVIDIA）主導的 AI 伺服器晶片生態在主導市場中依舊維持霸主地位。其下一代 Blackwell 晶片已進入全面量產並交付各大雲端巨頭（CSP）。毛利率維持在驚人的 75% 以上，資料中心部門營收年增率超過 200%，估值乘數依舊被成長動能所消化。",
    news: [
      {
        title: "Blackwell 超級晶片供不應求，訂單已排隊至 2027 年上半年",
        source: "台灣經濟日報",
        summary: "供應鏈消息指出，台積電 CoWoS 封裝產能利用率持續爆滿，微軟、Meta、Google 及 AWS 開啟大宗採購以擴充 AI 算力中心。",
        sentiment: "Bullish",
        publishedTime: "今日 06:40"
      },
      {
        title: "輝達宣布與多個主權國家合作，推動本地語系『主權 AI』建設",
        source: "紐約時報",
        summary: "該戰略有效拓展了非商業 CSP 市場。歐盟及中東多個財政機構均承諾採用輝達硬體，建構受主權保護的本土大語言模型。",
        sentiment: "Bullish",
        publishedTime: "今日 10:15"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 26.04, netIncome: 14.88, eps: 5.98, margin: 57.1 },
      { quarter: "2025 Q2", revenue: 30.04, netIncome: 16.60, eps: 6.70, margin: 55.2 },
      { quarter: "2025 Q3", revenue: 35.08, netIncome: 19.30, eps: 7.75, margin: 55.0 },
      { quarter: "2025 Q4", revenue: 38.25, netIncome: 21.05, eps: 8.42, margin: 55.0 }
    ]
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corp. (微軟)",
    sector: "Technology",
    price: 421.90,
    change: 4.12,
    changePercent: 0.98,
    brief: "微軟（Microsoft）憑藉 Azure 雲端平台與 Copilot 辦公套件在 AI 變現速度上全面領跑。旗下 Azure 的 AI 相關營收比重已超過 30%，企業客群對於訂閱制 AI 授權的反響在最新季度財報中展現，資產負債表維持極高的防禦天分。",
    news: [
      {
        title: "微軟 Copilot 推出升級版深度代辦流程，企業續約率突破 85%",
        source: "WIRED",
        summary: "用戶數據顯示，Copilot 將繁複文書和程式碼編寫效率提高 35%，強大生產力溢價促使美股 500 強企業訂約需求攀升。",
        sentiment: "Bullish",
        publishedTime: "今日 09:00"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 61.86, netIncome: 21.94, eps: 2.94, margin: 35.5 },
      { quarter: "2025 Q2", revenue: 64.73, netIncome: 22.01, eps: 2.95, margin: 34.0 },
      { quarter: "2025 Q3", revenue: 65.59, netIncome: 24.67, eps: 3.30, margin: 37.6 },
      { quarter: "2025 Q4", revenue: 67.20, netIncome: 25.10, eps: 3.42, margin: 37.3 }
    ]
  },

  // --- TW Stocks Mock Cases ---
  "2330": {
    symbol: "2330",
    name: "台灣積體電路製造 (台積電)",
    sector: "半導體 (Semiconductor)",
    price: 924.00,
    change: 11.00,
    changePercent: 1.20,
    brief: "台積電（2330）作為全球半導體代工龍頭，受惠於 NVIDIA Blackwell 與 Apple 新一代 AI 晶片的 3 奈米與 5 奈米先進製程爆發需求。近期先進封裝（CoWoS）持續處於供不應求狀態，多方外資調升評等，帶領台灣加權指數創下波段歷史新高。",
    news: [
      {
        title: "台積電 3 奈米與 5 奈米先進製程全面吃緊，蘋果與輝達擴大追加訂單",
        source: "台灣經濟日報",
        summary: "供應鏈透露，台積電先進製程在 2026 年底前的產能已被各大科技巨頭包辦，毛利率預計將重回 53% 以上的高位水平。",
        sentiment: "Bullish",
        publishedTime: "今日 09:30"
      },
      {
        title: "先進封裝 CoWoS 全年產能預計再倍增，高資本支出展現強大信心",
        source: "工商時報",
        summary: "為因應 AI 晶片供不應求，台積電已在南部積極擴建多個先進封裝廠，以維持其無可動搖的一站式晶片代工霸權。",
        sentiment: "Bullish",
        publishedTime: "今日 11:45"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 592.6, netIncome: 225.4, eps: 8.70, margin: 38.0 },
      { quarter: "2025 Q2", revenue: 673.5, netIncome: 247.1, eps: 9.53, margin: 36.7 },
      { quarter: "2025 Q3", revenue: 759.8, netIncome: 295.2, eps: 11.40, margin: 38.8 },
      { quarter: "2025 Q4", revenue: 812.3, netIncome: 312.4, eps: 12.04, margin: 38.5 }
    ]
  },
  "2317": {
    symbol: "2317",
    name: "鴻海精密工業 (鴻海)",
    sector: "電子大廠 (Electronic Mfg)",
    price: 185.00,
    change: -2.00,
    changePercent: -1.07,
    brief: "鴻海（2317）近年積極轉型，除了主導全球 iPhone 組裝業務外，也在伺服器機櫃代工市場中取得高度份額。隨著車載系統與低軌道衛星版圖陸續開花結果，產業毛利率正朝著 7% 目標邁進。",
    news: [
      {
        title: "鴻海大口吞下新一代伺服器機櫃訂單，外資看好獲利加速",
        source: "工商時報",
        summary: "投行報告表示，機櫃組裝技術壁壘極高，鴻海憑藉大規模軟硬體整合能力與全球產能，成為最大的受益贏家。",
        sentiment: "Bullish",
        publishedTime: "今日 08:30"
      },
      {
        title: "鴻海股價在法說會前夕呈現技術性回檔，市場靜待最新展望",
        source: "鉅亨網",
        summary: "分析師指出，短線上沖下洗主要為法人獲利了結，鴻海在雲端與車載系統研發上的領先地位並未受到實質性撼動。",
        sentiment: "Neutral",
        publishedTime: "今日 14:15"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 1322.4, netIncome: 22.0, eps: 1.59, margin: 1.66 },
      { quarter: "2025 Q2", revenue: 1530.5, netIncome: 35.1, eps: 2.53, margin: 2.29 },
      { quarter: "2025 Q3", revenue: 1621.0, netIncome: 43.1, eps: 3.11, margin: 2.66 },
      { quarter: "2025 Q4", revenue: 1851.3, netIncome: 55.4, eps: 4.00, margin: 2.99 }
    ]
  },
  "2454": {
    symbol: "2454",
    name: "聯發科技 (聯發科)",
    sector: "IC設計 (IC Design)",
    price: 1380.00,
    change: 35.00,
    changePercent: 2.60,
    brief: "聯發科（2454）作為全球 IC 設計龍頭之一，其晶片在旗艦級智慧型手機中取得巨大的市場成功。此外，聯發科也與大廠展開車載晶片等合作，積極拓展邊緣算力疆界。",
    news: [
      {
        title: "聯發科宣布攜手微軟等多家大廠，進軍全新邊緣處理器晶片市場",
        source: "台灣經濟日報",
        summary: "高層宣布在最新的邊緣運算平台中融入硬體加速，提供超低耗能的卓越運算，該股早盤大漲 2.8%。",
        sentiment: "Bullish",
        publishedTime: "今日 09:10"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 119.5, netIncome: 20.4, eps: 12.80, margin: 17.0 },
      { quarter: "2025 Q2", revenue: 127.3, netIncome: 22.5, eps: 14.10, margin: 17.6 },
      { quarter: "2025 Q3", revenue: 139.1, netIncome: 25.4, eps: 15.90, margin: 18.2 },
      { quarter: "2025 Q4", revenue: 142.8, netIncome: 26.8, eps: 16.80, margin: 18.7 }
    ]
  },
  "2882": {
    symbol: "2882",
    name: "國泰金融控股 (國泰金)",
    sector: "金融保險 (Financials & Insurance)",
    price: 58.50,
    change: 0.30,
    changePercent: 0.51,
    brief: "國泰金（2882）旗下保險與銀行核心部位獲利穩健。受惠於台美股市回升、債券實現部分資本利得，全體淨值大幅修復，具備長期配息優勢與資產防禦實力。",
    news: [
      {
        title: "金控獲利大躍進，國泰金累積盈餘創歷史同期新高",
        source: "鉅亨網",
        summary: "人壽利差與投資部位回溫，銀行放款動能強勁。分析師樂觀預估，在股市多頭帶動下，今年除權息配息有機會超出市場預期。",
        sentiment: "Bullish",
        publishedTime: "今日 10:10"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: 45.3, netIncome: 14.2, eps: 0.98, margin: 31.3 },
      { quarter: "2025 Q2", revenue: 52.1, netIncome: 16.5, eps: 1.13, margin: 31.6 },
      { quarter: "2025 Q3", revenue: 49.3, netIncome: 15.1, eps: 1.04, margin: 30.6 },
      { quarter: "2025 Q4", revenue: 55.4, netIncome: 19.3, eps: 1.33, margin: 34.8 }
    ]
  }
};

// Simple sector allocation library for quick lookup
const STOCK_SECTORS: Record<string, string> = {
  AAPL: "Technology",
  MSFT: "Technology",
  GOOGL: "Communication Services",
  META: "Communication Services",
  AMZN: "Consumer Cyclical",
  TSLA: "Consumer Cyclical",
  NVDA: "Technology",
  NFLX: "Communication Services",
  AMD: "Technology",
  INTC: "Technology",
  BRK: "Financials",
  JPM: "Financials",
  XOM: "Energy",
  JNJ: "Healthcare",
  PG: "Consumer Defensive",
  LLY: "Healthcare",
  V: "Financials",
  // TW mapping default sectors
  "2330": "半導體 (Semiconductor)",
  "2317": "電子大廠 (Electronic Mfg)",
  "2454": "IC設計 (IC Design)",
  "2881": "金融保險 (Financials & Insurance)",
  "2882": "金融保險 (Financials & Insurance)",
  "2303": "半導體 (Semiconductor)",
  "2603": "航運航太 (Shipping & Aviation)"
};

// API Route for Stock Insights with dynamic preset and calculated mock data (AI bypassed per user requirement)
app.post("/api/stock-insights", async (req, res) => {
  const { symbol = "AAPL" } = req.body;
  const uppercaseSymbol = String(symbol).toUpperCase().trim();

  // Detect if requested symbol is a Taiwan Stock (usually numeric like 2330 or 2317)
  const isTaiwanStock = /^\d{4}$/.test(uppercaseSymbol);

  console.log(`Fetching stock insights of ${uppercaseSymbol} from local mock database`);

  // Direct mock fallback if exists in predefined dictionary
  if (DEFAULT_STOCK_DATA[uppercaseSymbol]) {
    return res.json(DEFAULT_STOCK_DATA[uppercaseSymbol]);
  }

  // Dynamically generate semi-random, robust mock data for unknown stock keys
  const sector = STOCK_SECTORS[uppercaseSymbol] || (isTaiwanStock ? "半導體 (Semiconductor)" : "Technology");
  
  // Calculate a reasonable price
  const basePrice = isTaiwanStock 
    ? (uppercaseSymbol.charCodeAt(0) * 1.5 + (uppercaseSymbol.charCodeAt(1) || 50) * 4.2)
    : (uppercaseSymbol.charCodeAt(0) * 1.8 + (uppercaseSymbol.charCodeAt(1) || 65) * 0.7);
    
  const isUp = Math.round(basePrice) % 2 === 0;
  const priceChange = ((basePrice * 0.015) * (isUp ? 1 : -1)).toFixed(2);
  const changePercent = (Number(priceChange) / basePrice * 100).toFixed(2);

  const briefText = isTaiwanStock
    ? `針對台股 [${uppercaseSymbol}] 的即時財務觀測：今日台北股市交投清淡，但該板塊（${sector}）在主要指數的權重帶動下呈現量縮橫盤。本股在本日交易週期內呈現技術面支撐，近五日成交均額維持常態，預其在中長期均線走揚、以及關鍵技術開發訂單挹注下有望突破壓力區。`
    : `針對 ${uppercaseSymbol} 的實時財務觀測：今日市場交易情緒平穩。該板塊（${sector}）整體受惠於美股主要基準指數的回溫，本股在本日交易週期內呈現技術性整合，近期成交量保持常態水平，機構評估未來雙重技術整合與大宗資本支出優化有望迎來發展亮點。`;

  const newsTitle1 = isTaiwanStock
    ? `[${uppercaseSymbol}] 盤中爆量震盪，市場法人靜待新一季營收數據公佈`
    : `${uppercaseSymbol} 宣布最新一季全球擴張及降本增效核心指標`;
  const newsTitle2 = isTaiwanStock
    ? `資金持續流入 ${sector} 概念板塊，機構投資人積極佈局 ${uppercaseSymbol}`
    : `${uppercaseSymbol} 將受邀參加即將召開的美股季度科技金融研討會`;

  const dynamicData = {
    symbol: uppercaseSymbol,
    name: isTaiwanStock ? `${uppercaseSymbol} 股份有限公司` : `${uppercaseSymbol} Corp.`,
    sector: sector,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(priceChange),
    changePercent: parseFloat(changePercent),
    brief: briefText,
    news: [
      {
        title: newsTitle1,
        source: isTaiwanStock ? "鉅亨網" : "路透社",
        summary: isTaiwanStock 
          ? `隨著台北股市震盪幅度加劇，法人對於 [${uppercaseSymbol}] 的毛利率表現產生分歧，盤中爆出常態三周均量成交量。`
          : `為強化市場優勢，${uppercaseSymbol} 宣布調整營運架構並精簡行政支出，預期將提升後續季度 1.5% 的營業利潤率。`,
        sentiment: isUp ? "Bullish" : "Bearish",
        publishedTime: "今日 09:10"
      },
      {
        title: newsTitle2,
        source: isTaiwanStock ? "工商時報" : "富途社",
        summary: isTaiwanStock
          ? `投信連續買超，主因看好 ${uppercaseSymbol} 在核心製程、智慧製造以及全球專利權上的長期資本護城河。`
          : "高層將於大會分享產業升級及未來一年的戰略資產配置方向，引發多方機構與自營商的積極建倉跟進行動。",
        sentiment: "Bullish",
        publishedTime: "今日 13:40"
      }
    ],
    financials: [
      { quarter: "2025 Q1", revenue: Math.round(basePrice * 0.15), netIncome: Math.round(basePrice * 0.04), eps: (basePrice * 0.002).toFixed(2), margin: 26.6 },
      { quarter: "2025 Q2", revenue: Math.round(basePrice * 0.16), netIncome: Math.round(basePrice * 0.042), eps: (basePrice * 0.0021).toFixed(2), margin: 26.2 },
      { quarter: "2025 Q3", revenue: Math.round(basePrice * 0.17), netIncome: Math.round(basePrice * 0.048), eps: (basePrice * 0.0024).toFixed(2), margin: 28.2 },
      { quarter: "2025 Q4", revenue: Math.round(basePrice * 0.18), netIncome: Math.round(basePrice * 0.052), eps: (basePrice * 0.0026).toFixed(2), margin: 28.8 }
    ]
  };

  return res.json(dynamicData);
});

// Serve frontend SPA correctly in production and mounting Vite dev server in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
