export interface NewsStory {
  title: string;
  source: string;
  summary: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  publishedTime: string;
}

export interface FinancialMetric {
  quarter: string;
  revenue: number; // in Billions USD
  netIncome: number; // in Billions USD
  eps: number | string; // USD per share
  margin: number; // profit margin %
}

export interface StockInsight {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  brief: string;
  news: NewsStory[];
  financials: FinancialMetric[];
}

export interface HoldingRecord {
  id: string; // Unique ID for key list
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  sector: string;
}

export type FinancialTab = "revenueNet" | "epsMargin";
