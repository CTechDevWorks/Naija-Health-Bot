import { z } from "zod";

import type { Coordinates } from "@/services/locationService";

const openMeteoSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    precipitation: z.number(),
    rain: z.number().optional(),
    wind_speed_10m: z.number(),
    weather_code: z.number(),
  }),
  daily: z
    .object({
      precipitation_sum: z.array(z.number()).optional(),
    })
    .optional(),
  current_units: z
    .object({
      temperature_2m: z.string().optional(),
      relative_humidity_2m: z.string().optional(),
      precipitation: z.string().optional(),
      wind_speed_10m: z.string().optional(),
    })
    .optional(),
});

export type WeatherSnapshot = {
  temperatureC: number;
  humidityPct: number;
  /** Rainfall shown in the strip — prefers today's daily sum, else current precip. */
  rainfallMm: number;
  windSpeedKmh: number;
  summary: string;
  source: string;
  updatedAt: string;
};

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherServiceError";
  }
}

/** WMO weather interpretation codes → plain-language summary. */
function summariseWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed conditions";
}

/**
 * Current conditions from Open-Meteo Forecast API (no API key).
 * @see https://open-meteo.com/en/docs
 */
export async function fetchCurrentWeather(
  coords: Coordinates,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "rain",
      "wind_speed_10m",
      "weather_code",
    ].join(","),
    daily: "precipitation_sum",
    forecast_days: "1",
    timezone: "Africa/Lagos",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  );
  if (!response.ok) {
    throw new WeatherServiceError(
      "Unable to retrieve current weather from Open-Meteo.",
    );
  }

  const json: unknown = await response.json();
  const parsed = openMeteoSchema.safeParse(json);
  if (!parsed.success) {
    throw new WeatherServiceError("Weather response was incomplete or invalid.");
  }

  const { current, daily } = parsed.data;
  const dailyRain = daily?.precipitation_sum?.[0];
  const rainfallMm =
    typeof dailyRain === "number" ? dailyRain : current.precipitation;

  return {
    temperatureC: Math.round(current.temperature_2m),
    humidityPct: Math.round(current.relative_humidity_2m),
    rainfallMm: Math.round(rainfallMm * 10) / 10,
    windSpeedKmh: Math.round(current.wind_speed_10m),
    summary: summariseWeatherCode(current.weather_code),
    source: "Open-Meteo",
    updatedAt: current.time,
  };
}
