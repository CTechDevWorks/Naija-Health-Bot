/** Shared health API / UI types — expand as the backend contract freezes. */

export type RiskCategory = 'Low' | 'Moderate' | 'Elevated' | 'High';

export type LocationStatus = 'gps' | 'manual' | 'stale' | 'unknown';

export type NigerianLocation = {
  state: string;
  status: LocationStatus;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
};

export type MalariaOutlook = {
  category: RiskCategory;
  headline: string;
  period: string;
  source: string;
  updatedAt: string;
  areaLevelDisclaimer: string;
};

export type WeatherSnapshot = {
  temperatureC: number;
  humidityPct: number;
  rainfallMm: number;
  windSpeedMs: number;
  summary: string;
  source: string;
  updatedAt: string;
};

export type PreventionItem = {
  id: string;
  group: 'Around the home' | 'When sleeping' | 'Out and about' | 'If someone feels unwell';
  title: string;
  why: string;
  source?: string;
  completed?: boolean;
};

export type HealthReport = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  originalUrl?: string;
  topic?: string;
  location?: string;
  urgency?: string;
  isAiGenerated: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { label: string; url?: string }[];
  createdAt: string;
};
