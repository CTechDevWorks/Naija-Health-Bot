import outlook from "@/data/outlook.json";

export type IncidencePoint = { year: number; value: number };
export type ClimatePoint = {
  year: number;
  temperature: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
};

export type OutlookBundle = {
  meta: typeof outlook.meta;
  incidence: IncidencePoint[];
  climate: ClimatePoint[];
  national: IncidencePoint[];
};

export function getOutlookForState(state: string | null): OutlookBundle | null {
  if (!state) return null;
  const row = outlook.states[state as keyof typeof outlook.states];
  if (!row?.incidence?.length) return null;
  return {
    meta: outlook.meta,
    incidence: row.incidence,
    climate: row.climate ?? [],
    national: outlook.nationalAverageIncidence,
  };
}

export type OutlookInsights = {
  latest: IncidencePoint;
  fiveYearsAgo: IncidencePoint;
  peak: IncidencePoint;
  change5yPct: number;
  nationalLatest: number | null;
  vsNational: number | null;
};

export function computeInsights(
  incidence: IncidencePoint[],
  national: IncidencePoint[],
): OutlookInsights | null {
  if (incidence.length < 2) return null;
  const latest = incidence[incidence.length - 1];
  const fiveYearsAgo =
    incidence.find((p) => p.year === latest.year - 5) ?? incidence[0];
  const peak = incidence.reduce((best, p) =>
    p.value > best.value ? p : best,
  );
  const change5yPct =
    fiveYearsAgo.value === 0
      ? 0
      : ((latest.value - fiveYearsAgo.value) / fiveYearsAgo.value) * 100;
  const nationalLatest =
    national.find((p) => p.year === latest.year)?.value ?? null;
  const vsNational =
    nationalLatest === null ? null : latest.value - nationalLatest;
  return {
    latest,
    fiveYearsAgo,
    peak,
    change5yPct,
    nationalLatest,
    vsNational,
  };
}

/** Climate rows aligned to incidence years (for rainfall trend). */
export function climateForIncidenceYears(
  climate: ClimatePoint[],
  incidence: IncidencePoint[],
): ClimatePoint[] {
  const years = new Set(incidence.map((p) => p.year));
  return climate.filter((c) => years.has(c.year)).sort((a, b) => a.year - b.year);
}