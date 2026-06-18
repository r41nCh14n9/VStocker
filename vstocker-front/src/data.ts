import { HoldingRecord } from "./types";

export const INITIAL_HOLDINGS: HoldingRecord[] = [
  {
    id: "h-1",
    symbol: "AAPL",
    name: "Apple Inc.",
    shares: 25,
    purchasePrice: 172.8,
    currentPrice: 185.34,
    sector: "Technology"
  },
  {
    id: "h-2",
    symbol: "TSLA",
    name: "Tesla Inc.",
    shares: 15,
    purchasePrice: 195.2,
    currentPrice: 178.20,
    sector: "Consumer Cyclical"
  },
  {
    id: "h-3",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    shares: 12,
    purchasePrice: 790.0,
    currentPrice: 915.22,
    sector: "Technology"
  },
  {
    id: "h-4",
    symbol: "MSFT",
    name: "Microsoft Corp.",
    shares: 8,
    purchasePrice: 405.5,
    currentPrice: 421.90,
    sector: "Technology"
  }
];

export const INITIAL_TW_HOLDINGS: HoldingRecord[] = [
  {
    id: "tw-1",
    symbol: "2330",
    name: "台灣積體電路製造 (台積電)",
    shares: 800,
    purchasePrice: 820.0,
    currentPrice: 924.0,
    sector: "半導體 (Semiconductor)"
  },
  {
    id: "tw-2",
    symbol: "2317",
    name: "鴻海精密工業 (鴻海)",
    shares: 2000,
    purchasePrice: 155.0,
    currentPrice: 185.0,
    sector: "電子大廠 (Electronic Mfg)"
  },
  {
    id: "tw-3",
    symbol: "2454",
    name: "聯發科技 (聯發科)",
    shares: 300,
    purchasePrice: 1120.0,
    currentPrice: 1380.0,
    sector: "IC設計 (IC Design)"
  },
  {
    id: "tw-4",
    symbol: "2882",
    name: "國泰金融控股 (國泰金)",
    shares: 4000,
    purchasePrice: 48.6,
    currentPrice: 58.5,
    sector: "金融保險 (Financials & Insurance)"
  }
];

export const AVAILABLE_SECTORS = [
  "Technology",
  "Consumer Cyclical",
  "Communication Services",
  "Financials",
  "Healthcare",
  "Energy",
  "Consumer Defensive",
  "Industrials",
  "Real Estate",
  "Utilities"
];

export const TW_AVAILABLE_SECTORS = [
  "半導體 (Semiconductor)",
  "IC設計 (IC Design)",
  "電子大廠 (Electronic Mfg)",
  "金融保險 (Financials & Insurance)",
  "航運航太 (Shipping & Aviation)",
  "鋼鐵水泥 (Materials & Metals)",
  "生技醫療 (Biotech & Healthcare)"
];

// Helper to simplify displayed sector names
export function cleanSectorName(sector: string): string {
  if (sector.includes(" (")) {
    return sector.split(" (")[0];
  }
  return sector;
}
